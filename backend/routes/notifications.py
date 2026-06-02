import os
import json
import logging
import threading
import time
from pathlib import Path
from flask import Blueprint, jsonify, request

notifications_bp = Blueprint('notifications', __name__)
logger = logging.getLogger(__name__)

DATA_DIR = Path(__file__).parent.parent / 'data'
SUBS_FILE = DATA_DIR / 'subscriptions.json'

try:
    import psutil
    PSUTIL_OK = True
except ImportError:
    PSUTIL_OK = False

try:
    from pywebpush import webpush, WebPushException
    WEBPUSH_OK = True
except ImportError:
    WEBPUSH_OK = False

VAPID_PRIVATE = os.getenv('VAPID_PRIVATE_KEY', '')
VAPID_PUBLIC  = os.getenv('VAPID_PUBLIC_KEY', '')
VAPID_EMAIL   = os.getenv('VAPID_EMAIL', 'mailto:admin@nexus.local')

CPU_LIMIT    = 90
TEMP_LIMIT   = 85
RAM_LIMIT    = 95
DISCO_MIN_GB = 5

_cpu_alta_desde = None


def _load_subs():
    try:
        with open(SUBS_FILE) as f:
            return json.load(f)
    except Exception:
        return []


def _save_subs(subs):
    DATA_DIR.mkdir(exist_ok=True)
    with open(SUBS_FILE, 'w') as f:
        json.dump(subs, f, indent=2)


def _enviar_push(subscription, titulo, corpo):
    if not WEBPUSH_OK or not VAPID_PRIVATE:
        return
    try:
        webpush(
            subscription_info=subscription,
            data=json.dumps({'title': titulo, 'body': corpo}),
            vapid_private_key=VAPID_PRIVATE,
            vapid_claims={'sub': VAPID_EMAIL},
        )
    except WebPushException as e:
        logger.error('Falha ao enviar push: %s', e)
    except Exception as e:
        logger.error('Erro push inesperado: %s', e)


def _notificar_todos(titulo, corpo):
    for sub in _load_subs():
        _enviar_push(sub, titulo, corpo)


def _monitorar():
    global _cpu_alta_desde
    while True:
        time.sleep(30)
        if not PSUTIL_OK:
            continue
        try:
            cpu   = psutil.cpu_percent(interval=1)
            ram   = psutil.virtual_memory().percent
            disco = psutil.disk_usage('/').free / 1073741824

            if cpu > CPU_LIMIT:
                if _cpu_alta_desde is None:
                    _cpu_alta_desde = time.time()
                elif time.time() - _cpu_alta_desde >= 30:
                    _notificar_todos('CPU Alta', f'CPU em {cpu:.0f}% por mais de 30 segundos')
                    _cpu_alta_desde = None
            else:
                _cpu_alta_desde = None

            if ram > RAM_LIMIT:
                _notificar_todos('RAM Critica', f'RAM em {ram:.0f}%')

            if disco < DISCO_MIN_GB:
                _notificar_todos('Disco Cheio', f'Apenas {disco:.1f} GB livres')

            temps = psutil.sensors_temperatures() if hasattr(psutil, 'sensors_temperatures') else {}
            for nome, entradas in (temps or {}).items():
                for e in entradas:
                    if e.current and e.current > TEMP_LIMIT:
                        _notificar_todos('Temperatura Alta', f'{nome}: {e.current:.0f}°C')
                        break
        except Exception as e:
            logger.debug('Monitor notificacoes: %s', e)


threading.Thread(target=_monitorar, daemon=True, name='notif-monitor').start()


@notifications_bp.route('/notifications/subscribe', methods=['POST'])
def subscribe():
    sub = request.get_json()
    if not sub or 'endpoint' not in sub:
        return jsonify({'erro': 'Payload invalido'}), 400
    subs = _load_subs()
    endpoint = sub['endpoint']
    if not any(s.get('endpoint') == endpoint for s in subs):
        subs.append(sub)
        _save_subs(subs)
    return jsonify({'mensagem': 'Inscricao salva!'})


@notifications_bp.route('/notifications/test', methods=['POST'])
def test_notification():
    _notificar_todos('NEXUS', 'Notificacao de teste funcionando!')
    return jsonify({'mensagem': 'Notificacao de teste enviada!'})


@notifications_bp.route('/notifications/vapid-public', methods=['GET'])
def vapid_public():
    return jsonify({'publicKey': VAPID_PUBLIC})
