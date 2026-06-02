import base64
import logging
import sys
from datetime import datetime
from flask import Blueprint, jsonify

screenshot_bp = Blueprint('screenshot', __name__)
logger = logging.getLogger(__name__)

if sys.platform == 'win32':
    try:
        import mss
        import mss.tools
        MSS_OK = True
    except ImportError:
        MSS_OK = False
        logger.warning('mss nao instalado — endpoint /screenshot indisponivel')
else:
    MSS_OK = False


@screenshot_bp.route('/screenshot', methods=['GET'])
def capturar():
    if not MSS_OK:
        return jsonify({'erro': 'Captura de tela nao disponivel nesta plataforma'}), 503

    try:
        with mss.mss() as sct:
            monitor = sct.monitors[1]
            img     = sct.grab(monitor)
            buf     = mss.tools.to_png(img.rgb, img.size)
        encoded = base64.b64encode(buf).decode('ascii')
        return jsonify({
            'screenshot': encoded,
            'formato':    'png',
            'timestamp':  datetime.now().isoformat(),
            'largura':    img.size[0],
            'altura':     img.size[1],
        })
    except Exception as e:
        logger.error('Falha na captura de tela: %s', e)
        return jsonify({'erro': 'Falha ao capturar tela'}), 500
