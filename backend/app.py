import json
import os
import socket
import logging
from datetime import datetime
from pathlib import Path
from flask import Flask, request, jsonify, Response
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from dotenv import load_dotenv

load_dotenv()

from routes.power        import power_bp
from routes.stats        import stats_bp
from routes.apps         import apps_bp
from routes.media        import media_bp
from routes.wol          import wol_bp
from routes.notifications import notifications_bp
from routes.history      import history_bp
from routes.scheduler    import scheduler_bp
from routes.screenshot   import screenshot_bp
from routes.terminal     import terminal_bp
from routes.automations  import automations_bp
from routes.presentation import presentation_bp

try:
    import requests as req_lib
    REQUESTS_OK = True
except ImportError:
    req_lib = None
    REQUESTS_OK = False

DATA_DIR = Path(__file__).parent / 'data'
DATA_DIR.mkdir(exist_ok=True)

ACTION_LOG = DATA_DIR / 'action_log.json'

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

# ─── Modo de operacao ─────────────────────────────────────────────────────────
NEXUS_LOCAL_URL = os.getenv('NEXUS_LOCAL_URL', '').rstrip('/')
if NEXUS_LOCAL_URL:
    logger.info('Modo PROXY ativo → %s', NEXUS_LOCAL_URL)
else:
    logger.info('Modo LOCAL ativo — executando comandos diretamente')

# ─── CORS ─────────────────────────────────────────────────────────────────────
@app.after_request
def adicionar_cors(response):
    response.headers['Access-Control-Allow-Origin']  = '*'
    response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type, X-API-Key, Authorization'
    response.headers['Access-Control-Max-Age']       = '86400'
    return response


@app.route('/', defaults={'path': ''}, methods=['OPTIONS'])
@app.route('/<path:path>', methods=['OPTIONS'])
def preflight(path):
    res = app.make_response('')
    res.headers['Access-Control-Allow-Origin']  = '*'
    res.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS'
    res.headers['Access-Control-Allow-Headers'] = 'Content-Type, X-API-Key, Authorization'
    res.headers['Access-Control-Max-Age']       = '86400'
    return res, 204

# ─── Log de acoes ─────────────────────────────────────────────────────────────
_ROTAS_IGNORADAS = {'/health', '/logs', '/stats', '/history'}
_METODOS_LOG     = {'POST', 'DELETE', 'PUT'}


@app.after_request
def registrar_acao(response):
    if NEXUS_LOCAL_URL:
        return response  # log fica no PC local, nao no Railway
    if request.method not in _METODOS_LOG:
        return response
    if any(request.path.startswith(r) for r in _ROTAS_IGNORADAS):
        return response
    try:
        entrada = {
            'timestamp': datetime.now().isoformat(),
            'action':    request.path.split('/')[-1],
            'route':     request.path,
            'method':    request.method,
            'status':    response.status_code,
        }
        logs = []
        try:
            with open(ACTION_LOG, encoding='utf-8') as f:
                logs = json.load(f)
        except Exception:
            pass
        logs.append(entrada)
        if len(logs) > 500:
            logs = logs[-500:]
        with open(ACTION_LOG, 'w', encoding='utf-8') as f:
            json.dump(logs, f, ensure_ascii=False)
    except Exception:
        pass
    return response

# ─── Rate limiting ─────────────────────────────────────────────────────────────
limiter = Limiter(
    get_remote_address,
    app=app,
    default_limits=['30 per minute'],
    storage_uri='memory://',
)

# ─── API Key ──────────────────────────────────────────────────────────────────
API_KEY = os.getenv('API_KEY', '')
if not API_KEY:
    logger.warning('AVISO: API_KEY nao definida — servidor sem autenticacao!')


def _repassar_para_local():
    if not REQUESTS_OK:
        return jsonify({'erro': 'Pacote "requests" nao instalado no servidor.'}), 500
    url = f"{NEXUS_LOCAL_URL}{request.path}"
    cabecalhos = {
        'Content-Type': request.content_type or 'application/json',
        'X-API-Key':    API_KEY,
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


@app.before_request
def autenticar():
    if request.method == 'OPTIONS':
        return None
    if request.path == '/health' and request.method == 'GET':
        return None
    chave = request.headers.get('X-API-Key', '')
    if not chave or chave != API_KEY:
        logger.warning('Acesso negado: %s → %s', request.remote_addr, request.path)
        return jsonify({'erro': 'Nao autorizado'}), 401


@app.before_request
def proxy_se_remoto():
    if request.path == '/health':
        return None
    if not NEXUS_LOCAL_URL:
        return None
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


# ─── Rotas proprias ───────────────────────────────────────────────────────────
@app.route('/health')
@limiter.exempt
def health():
    dados = {
        'status':   'online',
        'hostname': socket.gethostname(),
        'modo':     'proxy' if NEXUS_LOCAL_URL else 'local',
    }
    if NEXUS_LOCAL_URL and REQUESTS_OK:
        try:
            r     = req_lib.get(f"{NEXUS_LOCAL_URL}/health", timeout=2)
            local = r.json()
            dados['pc_local'] = {
                'status':   local.get('status', 'desconhecido'),
                'hostname': local.get('hostname', ''),
            }
        except Exception:
            dados['pc_local'] = {'status': 'offline'}
    return jsonify(dados)


@app.route('/logs')
def get_logs():
    limit = int(request.args.get('limit', 50))
    try:
        with open(ACTION_LOG, encoding='utf-8') as f:
            logs = json.load(f)
        return jsonify(logs[-limit:])
    except Exception:
        return jsonify([])


# ─── Blueprints ───────────────────────────────────────────────────────────────
app.register_blueprint(power_bp)
app.register_blueprint(stats_bp)
app.register_blueprint(apps_bp)
app.register_blueprint(media_bp)
app.register_blueprint(wol_bp)
app.register_blueprint(notifications_bp)
app.register_blueprint(history_bp)
app.register_blueprint(scheduler_bp)
app.register_blueprint(screenshot_bp)
app.register_blueprint(terminal_bp)
app.register_blueprint(automations_bp)
app.register_blueprint(presentation_bp)

if __name__ == '__main__':
    host = os.getenv('HOST', '0.0.0.0')
    port = int(os.getenv('PORT', 5000))
    logger.info('NEXUS backend iniciando em http://%s:%d', host, port)
    app.run(host=host, port=port, debug=False)
