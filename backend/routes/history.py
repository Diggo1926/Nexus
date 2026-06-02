import json
import logging
import threading
import time
from datetime import datetime, timedelta
from pathlib import Path
from flask import Blueprint, jsonify, request

history_bp = Blueprint('history', __name__)
logger = logging.getLogger(__name__)

DATA_DIR     = Path(__file__).parent.parent / 'data'
HISTORY_FILE = DATA_DIR / 'history.json'
MAX_SNAPSHOTS = 1440  # 24 horas de dados a 1 snap/min

try:
    import psutil
    PSUTIL_OK = True
except ImportError:
    PSUTIL_OK = False

try:
    import GPUtil
    GPUTIL_OK = True
except ImportError:
    GPUTIL_OK = False


def _load_history():
    try:
        with open(HISTORY_FILE) as f:
            return json.load(f)
    except Exception:
        return []


def _save_history(data):
    DATA_DIR.mkdir(exist_ok=True)
    with open(HISTORY_FILE, 'w') as f:
        json.dump(data, f)


def _capturar_snapshot():
    if not PSUTIL_OK:
        return None
    snap = {
        'ts':  datetime.now().isoformat(),
        'cpu': psutil.cpu_percent(interval=1),
        'ram': psutil.virtual_memory().percent,
        'gpu': None,
        'temp': None,
    }
    if GPUTIL_OK:
        try:
            gpus = GPUtil.getGPUs()
            if gpus:
                snap['gpu'] = round(gpus[0].load * 100, 1)
        except Exception:
            pass
    temps = psutil.sensors_temperatures() if hasattr(psutil, 'sensors_temperatures') else {}
    for entradas in (temps or {}).values():
        for e in entradas:
            if e.current:
                snap['temp'] = round(e.current, 1)
                break
        if snap['temp']:
            break
    return snap


def _coletar():
    while True:
        time.sleep(60)
        snap = _capturar_snapshot()
        if snap:
            h = _load_history()
            h.append(snap)
            if len(h) > MAX_SNAPSHOTS:
                h = h[-MAX_SNAPSHOTS:]
            _save_history(h)
            logger.debug('History snapshot salvo: cpu=%.1f ram=%.1f', snap['cpu'], snap['ram'])


threading.Thread(target=_coletar, daemon=True, name='history-collector').start()


@history_bp.route('/history', methods=['GET'])
def get_history():
    period  = request.args.get('period', '1h')
    minutos = {'1h': 60, '6h': 360, '24h': 1440}.get(period, 60)
    cutoff  = datetime.now() - timedelta(minutes=minutos)

    all_data = _load_history()
    filtrado = []
    for s in all_data:
        try:
            if datetime.fromisoformat(s['ts']) >= cutoff:
                filtrado.append(s)
        except Exception:
            pass
    return jsonify(filtrado)
