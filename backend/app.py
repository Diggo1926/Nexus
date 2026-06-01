import os
import socket
import logging
from flask import Flask, request, jsonify, Response
from flask_cors import CORS
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from dotenv import load_dotenv

load_dotenv()

from routes.power import power_bp
from routes.stats import stats_bp
from routes.apps import apps_bp
from routes.media import media_bp
from routes.wol import wol_bp

# Importacao condicional: requests so necessario no modo proxy (Railway)
try:
    import requests as req_lib
    REQUESTS_OK = True
except ImportError:
    req_lib = None
    REQUESTS_OK = False

os.makedirs('logs', exist_ok=True)
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s',
    handlers=[
        logging.FileHandler('logs/nexus.log', encoding='utf-8'),
        logging.StreamHandler(),
    ],
)
logger = logging.getLogger(__name__)

app = Flask(__name__)
app.config['MAX_CONTENT_LENGTH'] = 1 * 1024 * 1024  # 1 MB

# ─── Configuracao de modo de operacao ───────────────────────────────────────
# NEXUS_LOCAL_URL = URL do Cloudflare Tunnel do PC local
# Vazio: modo local (Windows) — executa comandos diretamente
# Definido: modo proxy (Railway) — repassa requisicoes ao PC via Cloudflare
NEXUS_LOCAL_URL = os.getenv('NEXUS_LOCAL_URL', '').rstrip('/')

if NEXUS_LOCAL_URL:
    logger.info('Modo PROXY ativo → %s', NEXUS_LOCAL_URL)
else:
    logger.info('Modo LOCAL ativo — executando comandos diretamente')

# ─── CORS ─────────────────────────────────────────────────────────────────────
# Origens permitidas definidas via CORS_ORIGIN no .env (separadas por virgula)
cors_origin = os.getenv('CORS_ORIGIN', 'http://localhost:5173')
origens = [o.strip() for o in cors_origin.split(',') if o.strip()]

CORS(
    app,
    origins=origens,
    allow_headers=['Content-Type', 'X-API-Key'],
    methods=['GET', 'POST', 'OPTIONS'],
    supports_credentials=False,
)

# ─── Rate limiting ────────────────────────────────────────────────────────────
limiter = Limiter(
    get_remote_address,
    app=app,
    default_limits=['30 per minute'],
    storage_uri='memory://',
)

# ─── API Key ─────────────────────────────────────────────────────────────────
API_KEY = os.getenv('API_KEY', '')
if not API_KEY:
    logger.warning('AVISO: API_KEY nao definida — servidor sem autenticacao!')


# ─── Proxy: repassa a requisicao para o PC local via Cloudflare Tunnel ───────
def _repassar_para_local():
    if not REQUESTS_OK:
        return jsonify({'erro': 'Pacote "requests" nao instalado no servidor.'}), 500

    url = f"{NEXUS_LOCAL_URL}{request.path}"
    cabecalhos = {
        'Content-Type': request.content_type or 'application/json',
        'X-API-Key': API_KEY,
    }

    try:
        resp = req_lib.request(
            method=request.method,
            url=url,
            headers=cabecalhos,
            data=request.get_data(),
            params=request.args,
            timeout=20,
        )
        return Response(
            response=resp.content,
            status=resp.status_code,
            content_type=resp.headers.get('Content-Type', 'application/json'),
        )
    except req_lib.exceptions.ConnectionError:
        logger.error('PC local inacessivel: %s', NEXUS_LOCAL_URL)
        return jsonify({'erro': 'PC local inacessivel. Verifique o Cloudflare Tunnel.'}), 503
    except req_lib.exceptions.Timeout:
        logger.error('Timeout ao conectar ao PC local')
        return jsonify({'erro': 'Tempo limite de conexao ao PC local.'}), 504
    except Exception:
        logger.exception('Erro inesperado no proxy')
        return jsonify({'erro': 'Erro interno no proxy.'}), 500


# ─── Middlewares (ordem importa: auth → proxy → rota) ────────────────────────

@app.before_request
def autenticar():
    """Valida a API Key em todas as rotas, exceto /health."""
    if request.path == '/health' and request.method == 'GET':
        return None
    chave = request.headers.get('X-API-Key', '')
    if not chave or chave != API_KEY:
        logger.warning('Acesso negado: %s → %s', request.remote_addr, request.path)
        return jsonify({'erro': 'Nao autorizado'}), 401


@app.before_request
def proxy_se_remoto():
    """Em modo proxy, repassa a requisicao autenticada para o PC local."""
    if request.path == '/health':
        return None          # health responde direto do Railway
    if not NEXUS_LOCAL_URL:
        return None          # modo local: a rota handler executa o comando
    return _repassar_para_local()


# ─── Error handlers ───────────────────────────────────────────────────────────

@app.errorhandler(429)
def limite_excedido(e):
    return jsonify({'erro': 'Muitas requisicoes. Aguarde um minuto.'}), 429


@app.errorhandler(413)
def corpo_grande(e):
    return jsonify({'erro': 'Payload muito grande'}), 413


@app.errorhandler(404)
def nao_encontrado(e):
    return jsonify({'erro': 'Rota nao encontrada'}), 404


@app.errorhandler(500)
def erro_servidor(e):
    logger.error('Erro interno nao tratado')
    return jsonify({'erro': 'Erro interno do servidor'}), 500


# ─── Rotas ───────────────────────────────────────────────────────────────────

@app.route('/health')
@limiter.exempt
def health():
    """Rota publica. Em modo proxy, inclui status do PC local."""
    dados = {
        'status':   'online',
        'hostname': socket.gethostname(),
        'modo':     'proxy' if NEXUS_LOCAL_URL else 'local',
    }

    if NEXUS_LOCAL_URL and REQUESTS_OK:
        try:
            r = req_lib.get(f"{NEXUS_LOCAL_URL}/health", timeout=2)
            local = r.json()
            dados['pc_local'] = {
                'status':   local.get('status', 'desconhecido'),
                'hostname': local.get('hostname', ''),
            }
        except Exception:
            dados['pc_local'] = {'status': 'offline'}

    return jsonify(dados)


app.register_blueprint(power_bp)
app.register_blueprint(stats_bp)
app.register_blueprint(apps_bp)
app.register_blueprint(media_bp)
app.register_blueprint(wol_bp)

if __name__ == '__main__':
    host = os.getenv('HOST', '0.0.0.0')
    port = int(os.getenv('PORT', 5000))
    logger.info('NEXUS backend iniciando em http://%s:%d', host, port)
    app.run(host=host, port=port, debug=False)
