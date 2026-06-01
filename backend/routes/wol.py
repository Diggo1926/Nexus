import os
import logging
from flask import Blueprint, jsonify
from wakeonlan import send_magic_packet

wol_bp = Blueprint('wol', __name__)
logger = logging.getLogger(__name__)


@wol_bp.route('/wol/wake', methods=['POST'])
def acordar():
    mac = os.getenv('WOL_MAC', '').strip()
    broadcast = os.getenv('WOL_BROADCAST', '255.255.255.255').strip()

    if not mac:
        return jsonify({'erro': 'WOL_MAC nao configurado no .env do servidor'}), 500

    try:
        send_magic_packet(mac, ip_address=broadcast)
        logger.info('Magic packet WOL enviado para %s', broadcast)
        return jsonify({'mensagem': 'Magic packet enviado!'})
    except Exception:
        logger.error('Falha ao enviar WOL')
        return jsonify({'erro': 'Falha ao enviar magic packet'}), 500
