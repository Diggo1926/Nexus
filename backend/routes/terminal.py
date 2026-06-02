import os
import logging
import subprocess
from flask import Blueprint, jsonify, request

terminal_bp = Blueprint('terminal', __name__)
logger = logging.getLogger(__name__)

_DEFAULT_WHITELIST = (
    'dir,ipconfig,tasklist,systeminfo,ping,netstat,whoami,'
    'hostname,ver,type,echo,date,time,set,wmic,chkdsk,sfc'
)
_raw_whitelist = os.getenv('ALLOWED_COMMANDS', _DEFAULT_WHITELIST)
WHITELIST = {c.strip().lower() for c in _raw_whitelist.split(',') if c.strip()}


@terminal_bp.route('/terminal/exec', methods=['POST'])
def executar():
    data = request.get_json() or {}
    cmd  = (data.get('command') or '').strip()

    if not cmd:
        return jsonify({'output': '', 'error': 'Comando vazio', 'code': 1}), 400

    base = cmd.split()[0].lower()
    if base not in WHITELIST:
        logger.warning('Comando bloqueado: %s', cmd)
        return jsonify({
            'output': '',
            'error':  f'Comando "{base}" nao permitido. Whitelist: {sorted(WHITELIST)}',
            'code':   1,
        }), 403

    try:
        result = subprocess.run(
            cmd,
            shell=True,
            capture_output=True,
            text=True,
            encoding='cp850',
            errors='replace',
            timeout=10,
        )
        logger.info('Terminal: %s → code %d', cmd, result.returncode)
        return jsonify({
            'output': result.stdout,
            'error':  result.stderr,
            'code':   result.returncode,
        })
    except subprocess.TimeoutExpired:
        return jsonify({'output': '', 'error': 'Tempo limite excedido (10s)', 'code': 1})
    except Exception as e:
        logger.error('Falha no terminal: %s', e)
        return jsonify({'output': '', 'error': str(e), 'code': 1})
