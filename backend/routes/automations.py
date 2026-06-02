import json
import logging
import subprocess
import threading
import time
import uuid
from datetime import datetime
from pathlib import Path
from flask import Blueprint, jsonify, request

automations_bp = Blueprint('automations', __name__)
logger = logging.getLogger(__name__)

DATA_DIR  = Path(__file__).parent.parent / 'data'
AUTO_FILE = DATA_DIR / 'automations.json'

try:
    import psutil
    PSUTIL_OK = True
except ImportError:
    PSUTIL_OK = False

_ultimo_disparo: dict[str, float] = {}


def _load():
    try:
        with open(AUTO_FILE, encoding='utf-8') as f:
            return json.load(f)
    except Exception:
        return []


def _save(data):
    DATA_DIR.mkdir(exist_ok=True)
    with open(AUTO_FILE, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)


def _get_metric(metric):
    if not PSUTIL_OK:
        return None
    try:
        if metric == 'cpu':
            return psutil.cpu_percent(interval=0.5)
        if metric == 'ram':
            return psutil.virtual_memory().percent
        if metric == 'temp':
            temps = psutil.sensors_temperatures() if hasattr(psutil, 'sensors_temperatures') else {}
            for entradas in (temps or {}).values():
                for e in entradas:
                    if e.current:
                        return e.current
    except Exception:
        pass
    return None


def _executar_acao(acao: dict):
    tipo  = acao.get('type', '')
    alvo  = acao.get('target', '')
    if tipo == 'notify':
        logger.info('NEXUS Automacao: %s', alvo or 'Alerta')
    elif tipo == 'kill_process' and alvo:
        subprocess.run(['taskkill', '/F', '/IM', alvo], capture_output=True)
        logger.info('Processo encerrado pela automacao: %s', alvo)
    elif tipo == 'shutdown':
        subprocess.run(['shutdown', '/s', '/t', '0'], capture_output=True)
        logger.info('Desligamento acionado por automacao')


def _avaliar(auto: dict) -> bool:
    trig      = auto.get('trigger', {})
    metric    = trig.get('metric', '')
    op        = trig.get('operator', '>')
    threshold = float(trig.get('value', 0))

    valor = _get_metric(metric)
    if valor is None:
        return False
    if op == '>' and valor > threshold:
        return True
    if op == '<' and valor < threshold:
        return True
    return False


def _monitorar():
    while True:
        time.sleep(30)
        autos = _load()
        agora = time.time()

        for a in autos:
            aid      = a.get('id', '')
            cooldown = float(a.get('cooldown_minutes', 5)) * 60
            ultimo   = _ultimo_disparo.get(aid, 0)

            if agora - ultimo < cooldown:
                continue
            if _avaliar(a):
                _ultimo_disparo[aid] = agora
                try:
                    _executar_acao(a.get('action', {}))
                    logger.info('Automacao disparada: %s', aid)
                except Exception as e:
                    logger.error('Falha na automacao %s: %s', aid, e)


threading.Thread(target=_monitorar, daemon=True, name='automations-monitor').start()


@automations_bp.route('/automations/create', methods=['POST'])
def criar():
    data = request.get_json() or {}
    auto = {
        'id':               str(uuid.uuid4()),
        'trigger':          data.get('trigger', {}),
        'action':           data.get('action', {}),
        'cooldown_minutes': data.get('cooldown_minutes', 5),
        'criado':           datetime.now().isoformat(),
    }
    autos = _load()
    autos.append(auto)
    _save(autos)
    return jsonify({'mensagem': 'Automacao criada!', 'id': auto['id']})


@automations_bp.route('/automations/list', methods=['GET'])
def listar():
    return jsonify(_load())


@automations_bp.route('/automations/<id_>', methods=['DELETE'])
def remover(id_):
    autos = _load()
    novo  = [a for a in autos if a.get('id') != id_]
    if len(novo) == len(autos):
        return jsonify({'erro': 'Automacao nao encontrada'}), 404
    _save(novo)
    return jsonify({'mensagem': 'Automacao removida'})
