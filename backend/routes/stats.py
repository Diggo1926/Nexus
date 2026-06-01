import time
import logging
import psutil
from flask import Blueprint, jsonify

stats_bp = Blueprint('stats', __name__)
logger = logging.getLogger(__name__)

# Estado da ultima leitura de rede para calcular velocidade
_net_anterior = None
_ts_anterior = None


@stats_bp.route('/stats')
def estatisticas():
    global _net_anterior, _ts_anterior

    try:
        cpu = psutil.cpu_percent(interval=None)
        freq = psutil.cpu_freq()
        ram = psutil.virtual_memory()
        net_atual = psutil.net_io_counters()
        ts_atual = time.time()

        # Velocidade de rede (bytes/s desde ultima leitura)
        upload_bps = download_bps = 0
        if _net_anterior and _ts_anterior:
            dt = ts_atual - _ts_anterior
            if dt > 0:
                upload_bps = max(0, (net_atual.bytes_sent - _net_anterior.bytes_sent) / dt)
                download_bps = max(0, (net_atual.bytes_recv - _net_anterior.bytes_recv) / dt)
        _net_anterior = net_atual
        _ts_anterior = ts_atual

        # Particoes de disco (apenas as montaveis)
        discos = []
        for p in psutil.disk_partitions(all=False):
            try:
                uso = psutil.disk_usage(p.mountpoint)
                discos.append({
                    'dispositivo': p.device,
                    'ponto': p.mountpoint,
                    'total_gb': round(uso.total / 1073741824, 1),
                    'usado_gb': round(uso.used / 1073741824, 1),
                    'livre_gb': round(uso.free / 1073741824, 1),
                    'percentual': uso.percent,
                })
            except (PermissionError, OSError):
                pass

        uptime_s = int(time.time() - psutil.boot_time())

        # GPU via GPUtil (opcional — apenas NVIDIA)
        gpu = None
        try:
            import GPUtil
            gpus = GPUtil.getGPUs()
            if gpus:
                g = gpus[0]
                gpu = {
                    'nome': g.name,
                    'carga': round(g.load * 100, 1),
                    'vram_usada_mb': round(g.memoryUsed),
                    'vram_total_mb': round(g.memoryTotal),
                    'temperatura': g.temperature,
                }
        except Exception:
            pass

        return jsonify({
            'cpu': {
                'percentual': cpu,
                'frequencia_mhz': round(freq.current) if freq else None,
                'nucleos': psutil.cpu_count(logical=False),
                'threads': psutil.cpu_count(logical=True),
            },
            'ram': {
                'total_gb': round(ram.total / 1073741824, 1),
                'usado_gb': round(ram.used / 1073741824, 1),
                'livre_gb': round(ram.available / 1073741824, 1),
                'percentual': ram.percent,
            },
            'gpu': gpu,
            'disco': discos,
            'rede': {
                'upload_bps': round(upload_bps),
                'download_bps': round(download_bps),
                'total_enviado': net_atual.bytes_sent,
                'total_recebido': net_atual.bytes_recv,
            },
            'uptime': {
                'total_segundos': uptime_s,
                'horas': uptime_s // 3600,
                'minutos': (uptime_s % 3600) // 60,
            },
        })

    except Exception:
        logger.error('Falha ao coletar estatisticas')
        return jsonify({'erro': 'Falha ao obter estatisticas'}), 500
