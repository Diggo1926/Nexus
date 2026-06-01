import logging
from flask import Blueprint, jsonify, request

media_bp = Blueprint('media', __name__)
logger = logging.getLogger(__name__)

# Importacoes opcionais — so funcionam no Windows com os pacotes instalados
try:
    import win32api, win32con
    WIN32 = True
except ImportError:
    WIN32 = False
    logger.warning('pywin32 indisponivel — controles de midia desabilitados')

try:
    from ctypes import cast, POINTER
    from comtypes import CLSCTX_ALL
    from pycaw.pycaw import AudioUtilities, IAudioEndpointVolume
    PYCAW = True
except ImportError:
    PYCAW = False
    logger.warning('pycaw indisponivel — controle de volume desabilitado')

# Virtual key codes para controle de midia
VK_PLAY_PAUSE = 0xB3
VK_NEXT       = 0xB0
VK_PREV       = 0xB1
VK_STOP       = 0xB2


def _tecla(vk: int) -> None:
    win32api.keybd_event(vk, 0, 0, 0)
    win32api.keybd_event(vk, 0, win32con.KEYEVENTF_KEYUP, 0)


def _vol_iface():
    devices = AudioUtilities.GetSpeakers()
    iface = devices.Activate(IAudioEndpointVolume._iid_, CLSCTX_ALL, None)
    return cast(iface, POINTER(IAudioEndpointVolume))


@media_bp.route('/media/volume', methods=['GET'])
def get_volume():
    if not PYCAW:
        return jsonify({'erro': 'Controle de volume indisponivel'}), 503
    try:
        vol = _vol_iface()
        return jsonify({
            'volume': round(vol.GetMasterVolumeLevelScalar() * 100),
            'muted': bool(vol.GetMute()),
        })
    except Exception:
        logger.error('Falha ao ler volume')
        return jsonify({'erro': 'Falha ao ler volume'}), 500


@media_bp.route('/media/volume', methods=['POST'])
def set_volume():
    if not PYCAW:
        return jsonify({'erro': 'Controle de volume indisponivel'}), 503

    dados = request.get_json(silent=True)
    if not dados or 'level' not in dados:
        return jsonify({'erro': 'Campo "level" obrigatorio'}), 400

    try:
        nivel = int(dados['level'])
        if not (0 <= nivel <= 100):
            raise ValueError
    except (ValueError, TypeError):
        return jsonify({'erro': 'level deve ser inteiro entre 0 e 100'}), 400

    try:
        _vol_iface().SetMasterVolumeLevelScalar(nivel / 100.0, None)
        logger.info('Volume definido')
        return jsonify({'mensagem': f'Volume: {nivel}%', 'volume': nivel})
    except Exception:
        logger.error('Falha ao definir volume')
        return jsonify({'erro': 'Falha ao definir volume'}), 500


@media_bp.route('/media/mute', methods=['POST'])
def mute():
    if not PYCAW:
        return jsonify({'erro': 'Controle de volume indisponivel'}), 503
    try:
        vol = _vol_iface()
        novo = not bool(vol.GetMute())
        vol.SetMute(novo, None)
        return jsonify({'mensagem': 'Mute alternado', 'muted': novo})
    except Exception:
        logger.error('Falha ao alternar mute')
        return jsonify({'erro': 'Falha ao alternar mute'}), 500


@media_bp.route('/media/play-pause', methods=['POST'])
def play_pause():
    if not WIN32:
        return jsonify({'erro': 'Controle de midia indisponivel'}), 503
    try:
        _tecla(VK_PLAY_PAUSE)
        return jsonify({'mensagem': 'Play/Pause'})
    except Exception:
        return jsonify({'erro': 'Falha no controle de midia'}), 500


@media_bp.route('/media/next', methods=['POST'])
def prox():
    if not WIN32:
        return jsonify({'erro': 'Controle de midia indisponivel'}), 503
    try:
        _tecla(VK_NEXT)
        return jsonify({'mensagem': 'Proxima faixa'})
    except Exception:
        return jsonify({'erro': 'Falha no controle de midia'}), 500


@media_bp.route('/media/prev', methods=['POST'])
def ant():
    if not WIN32:
        return jsonify({'erro': 'Controle de midia indisponivel'}), 503
    try:
        _tecla(VK_PREV)
        return jsonify({'mensagem': 'Faixa anterior'})
    except Exception:
        return jsonify({'erro': 'Falha no controle de midia'}), 500


@media_bp.route('/media/stop', methods=['POST'])
def parar():
    if not WIN32:
        return jsonify({'erro': 'Controle de midia indisponivel'}), 503
    try:
        _tecla(VK_STOP)
        return jsonify({'mensagem': 'Midia parada'})
    except Exception:
        return jsonify({'erro': 'Falha no controle de midia'}), 500
