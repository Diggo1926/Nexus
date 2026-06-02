import logging
import sys
from flask import Blueprint, jsonify

presentation_bp = Blueprint('presentation', __name__)
logger = logging.getLogger(__name__)

if sys.platform == 'win32':
    try:
        import pyautogui
        pyautogui.FAILSAFE = False
        PYAUTOGUI_OK = True
    except ImportError:
        PYAUTOGUI_OK = False
        logger.warning('pyautogui nao instalado — endpoints de apresentacao indisponiveis')
else:
    PYAUTOGUI_OK = False


def _pressionar(key: str, descricao: str):
    if not PYAUTOGUI_OK:
        return jsonify({'erro': 'pyautogui nao disponivel nesta plataforma'}), 503
    try:
        pyautogui.press(key)
        logger.info('Apresentacao: %s (%s)', descricao, key)
        return jsonify({'mensagem': descricao})
    except Exception as e:
        logger.error('Falha ao pressionar %s: %s', key, e)
        return jsonify({'erro': 'Falha ao simular tecla'}), 500


@presentation_bp.route('/presentation/next', methods=['POST'])
def next_slide():
    return _pressionar('right', 'Proximo slide')


@presentation_bp.route('/presentation/prev', methods=['POST'])
def prev_slide():
    return _pressionar('left', 'Slide anterior')


@presentation_bp.route('/presentation/start', methods=['POST'])
def start_presentation():
    return _pressionar('f5', 'Iniciar apresentacao')


@presentation_bp.route('/presentation/stop', methods=['POST'])
def stop_presentation():
    return _pressionar('escape', 'Encerrar apresentacao')


@presentation_bp.route('/presentation/black', methods=['POST'])
def black_screen():
    return _pressionar('b', 'Tela preta')
