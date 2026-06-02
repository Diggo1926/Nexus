import json
import logging
import subprocess
import sys
import threading
import time
import uuid
from datetime import datetime
from pathlib import Path
from flask import Blueprint, jsonify, request

scheduler_bp = Blueprint('scheduler', __name__)
logger = logging.getLogger(__name__)

DATA_DIR       = Path(__file__).parent.parent / 'data'
SCHEDULES_FILE = DATA_DIR / 'schedules.json'

ACOES_CMD = {
    'shutdown':  ['shutdown', '/s', '/t', '0'],
    'restart':   ['shutdown', '/r', '/t', '0'],
    'hibernate': ['shutdown', '/h'],
}


def _load():
    try:
        with open(SCHEDULES_FILE) as f:
            return json.load(f)
    except Exception:
        return []


def _save(data):
    DATA_DIR.mkdir(exist_ok=True)
    with open(SCHEDULES_FILE, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)


def _executar(acao):
    if acao == 'sleep' and sys.platform == 'win32':
        import ctypes
        ctypes.windll.PowrProf.SetSuspendState(0, 1, 0)
    elif acao in ACOES_CMD and sys.platform == 'win32':
        subprocess.run(ACOES_CMD[acao], check=True, capture_output=True, timeout=10)


def _monitorar():
    ultimo_verificado = ''
    while True:
        time.sleep(15)
        agora       = datetime.now()
        hora_atual  = f'{agora.hour:02d}:{agora.minute:02d}'

        if hora_atual == ultimo_verificado:
            continue
        ultimo_verificado = hora_atual

        schedules = _load()
        alterado  = False

        for s in schedules[:]:
            if s.get('time') == hora_atual and s.get('ativo', True):
                try:
                    _executar(s['action'])
                    logger.info('Agendamento executado: %s as %s', s['action'], hora_atual)
                except Exception as e:
                    logger.error('Falha no agendamento %s: %s', s.get('id'), e)

                if s.get('repeat', 'once') == 'once':
                    schedules.remove(s)
                    alterado = True

        if alterado:
            _save(schedules)


threading.Thread(target=_monitorar, daemon=True, name='scheduler').start()


@scheduler_bp.route('/scheduler/create', methods=['POST'])
def criar():
    data   = request.get_json() or {}
    acao   = data.get('action', '')
    horario = data.get('time', '')
    repeat  = data.get('repeat', 'once')

    acoes_validas = list(ACOES_CMD.keys()) + ['sleep']
    if acao not in acoes_validas:
        return jsonify({'erro': f'Acao invalida. Validas: {acoes_validas}'}), 400
    if not horario or len(horario) != 5 or ':' not in horario:
        return jsonify({'erro': 'Horario invalido. Use HH:MM'}), 400

    agendamento = {
        'id':      str(uuid.uuid4()),
        'action':  acao,
        'time':    horario,
        'repeat':  repeat,
        'ativo':   True,
        'criado':  datetime.now().isoformat(),
    }
    schedules = _load()
    schedules.append(agendamento)
    _save(schedules)
    return jsonify({'mensagem': 'Agendamento criado!', 'id': agendamento['id']})


@scheduler_bp.route('/scheduler/list', methods=['GET'])
def listar():
    return jsonify(_load())


@scheduler_bp.route('/scheduler/<id_>', methods=['DELETE'])
def remover(id_):
    schedules = _load()
    novo = [s for s in schedules if s.get('id') != id_]
    if len(novo) == len(schedules):
        return jsonify({'erro': 'Agendamento nao encontrado'}), 404
    _save(novo)
    return jsonify({'mensagem': 'Agendamento removido'})
