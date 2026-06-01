import os
import logging
import subprocess
import psutil
from flask import Blueprint, jsonify, request

apps_bp = Blueprint('apps', __name__)
logger = logging.getLogger(__name__)

# Mapa de nomes amigaveis para executaveis do sistema
EXECUTAVEIS = {
    'chrome':    'chrome',
    'spotify':   'spotify',
    'notepad':   'notepad',
    'vscode':    'code',
    'explorer':  'explorer',
    'discord':   'discord',
    'steam':     'steam',
    'firefox':   'firefox',
    'edge':      'msedge',
    'calc':      'calc',
    'paint':     'mspaint',
    'vlc':       'vlc',
    'obs':       'obs64',
    'terminal':  'wt',
}


def _whitelist() -> list[str]:
    raw = os.getenv('ALLOWED_APPS', '')
    return [a.strip().lower() for a in raw.split(',') if a.strip()]


@apps_bp.route('/app/list')
def listar():
    return jsonify({'apps': _whitelist()})


@apps_bp.route('/app/open', methods=['POST'])
def abrir():
    dados = request.get_json(silent=True)
    if not dados or 'app' not in dados:
        return jsonify({'erro': 'Campo "app" obrigatorio'}), 400

    nome = str(dados['app']).strip().lower()

    if nome not in _whitelist():
        logger.warning('Tentativa de abrir app fora da whitelist')
        return jsonify({'erro': 'Aplicativo nao permitido'}), 403

    exe = EXECUTAVEIS.get(nome, nome)
    try:
        subprocess.Popen(exe, shell=True)
        logger.info('App aberto via whitelist')
        return jsonify({'mensagem': f'Abrindo {nome}...'})
    except Exception:
        logger.error('Falha ao abrir app')
        return jsonify({'erro': 'Falha ao abrir o aplicativo'}), 500


@apps_bp.route('/app/running')
def processos():
    try:
        lista = []
        for proc in psutil.process_iter(['pid', 'name', 'cpu_percent', 'memory_info']):
            try:
                info = proc.info
                ram = round(info['memory_info'].rss / 1048576, 1) if info['memory_info'] else 0
                lista.append({
                    'pid':    info['pid'],
                    'nome':   info['name'],
                    'cpu':    round(info['cpu_percent'] or 0, 1),
                    'ram_mb': ram,
                })
            except (psutil.NoSuchProcess, psutil.AccessDenied):
                pass

        lista.sort(key=lambda x: x['ram_mb'], reverse=True)
        return jsonify({'processos': lista[:60]})
    except Exception:
        logger.error('Falha ao listar processos')
        return jsonify({'erro': 'Falha ao listar processos'}), 500


@apps_bp.route('/app/kill', methods=['POST'])
def encerrar():
    dados = request.get_json(silent=True)
    if not dados or 'pid' not in dados:
        return jsonify({'erro': 'Campo "pid" obrigatorio'}), 400

    try:
        pid = int(dados['pid'])
        if pid <= 0:
            raise ValueError
    except (ValueError, TypeError):
        return jsonify({'erro': 'PID invalido'}), 400

    try:
        proc = psutil.Process(pid)
        nome = proc.name()
        proc.terminate()
        logger.info('Processo encerrado PID=%d', pid)
        return jsonify({'mensagem': f'"{nome}" encerrado'})
    except psutil.NoSuchProcess:
        return jsonify({'erro': 'Processo nao encontrado'}), 404
    except psutil.AccessDenied:
        return jsonify({'erro': 'Permissao negada'}), 403
    except Exception:
        logger.error('Falha ao encerrar processo')
        return jsonify({'erro': 'Falha ao encerrar processo'}), 500
