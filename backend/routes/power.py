import ctypes
import logging
import subprocess
from flask import Blueprint, jsonify

power_bp = Blueprint('power', __name__)
logger = logging.getLogger(__name__)


def _cmd(args: list[str], descricao: str) -> bool:
    try:
        subprocess.run(args, check=True, capture_output=True, timeout=10)
        logger.info('Executado: %s', descricao)
        return True
    except (subprocess.CalledProcessError, subprocess.TimeoutExpired, FileNotFoundError):
        logger.error('Falha: %s', descricao)
        return False


@power_bp.route('/power/shutdown', methods=['POST'])
def desligar():
    if _cmd(['shutdown', '/s', '/t', '0'], 'shutdown'):
        return jsonify({'mensagem': 'Desligando o PC...'})
    return jsonify({'erro': 'Falha ao desligar. Verifique as permissoes.'}), 500


@power_bp.route('/power/restart', methods=['POST'])
def reiniciar():
    if _cmd(['shutdown', '/r', '/t', '0'], 'restart'):
        return jsonify({'mensagem': 'Reiniciando o PC...'})
    return jsonify({'erro': 'Falha ao reiniciar.'}), 500


@power_bp.route('/power/hibernate', methods=['POST'])
def hibernar():
    if _cmd(['shutdown', '/h'], 'hibernate'):
        return jsonify({'mensagem': 'Hibernando...'})
    return jsonify({'erro': 'Falha ao hibernar. A hibernacao pode estar desabilitada.'}), 500


@power_bp.route('/power/sleep', methods=['POST'])
def sleep():
    try:
        # SetSuspendState(bHibernate, bForce, bWakeupEventsDisabled)
        ok = ctypes.windll.PowrProf.SetSuspendState(0, 1, 0)
        if not ok:
            raise OSError('SetSuspendState retornou falha')
        logger.info('Executado: sleep')
        return jsonify({'mensagem': 'Entrando em sleep...'})
    except Exception:
        logger.error('Falha: sleep')
        return jsonify({'erro': 'Falha ao entrar em sleep.'}), 500


@power_bp.route('/power/cancel', methods=['POST'])
def cancelar():
    if _cmd(['shutdown', '/a'], 'cancel-shutdown'):
        return jsonify({'mensagem': 'Shutdown cancelado.'})
    return jsonify({'erro': 'Nenhum shutdown pendente ou falha ao cancelar.'}), 500
