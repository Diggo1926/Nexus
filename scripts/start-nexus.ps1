# ==============================================================================
# NEXUS — Script de inicializacao automatica
# Rodrigo Carvalho Mamede
#
# Executa na ordem:
#   1. Inicia o backend Python (Flask)
#   2. Inicia o Cloudflare Tunnel e extrai a URL gerada
#   3. Atualiza a variavel NEXUS_LOCAL_URL no Railway via API
#   4. Dispara redeploy do Railway para recarregar a variavel
#
# Log salvo em: %TEMP%\nexus-start.log
# ==============================================================================

$ErrorActionPreference = 'SilentlyContinue'

# ─── Caminhos ─────────────────────────────────────────────────────────────────
$backendDir = 'C:\Users\Diggo.Dev\Documents\projetos pessoais\Omen\nexus\backend'
$logInicio  = "$env:TEMP\nexus-start.log"
$logTunelOut = "$env:TEMP\nexus-tunnel-out.log"
$logTunelErr = "$env:TEMP\nexus-tunnel-err.log"

# ─── Credenciais Railway ───────────────────────────────────────────────────────
# EDITE ESTAS TRES LINHAS antes de usar o script (ver README-scripts.md)
$railwayToken  = 'RAILWAY_TOKEN_AQUI'
$serviceId     = 'RAILWAY_SERVICE_ID_AQUI'
$environmentId = 'RAILWAY_ENVIRONMENT_ID_AQUI'

# ─── Helper: escrever log com timestamp ───────────────────────────────────────
function Write-Log {
    param([string]$msg)
    $ts = Get-Date -Format 'yyyy-MM-dd HH:mm:ss'
    "$ts | $msg" | Add-Content -Path $logInicio -Encoding UTF8
}

# Limpar logs anteriores
Remove-Item $logInicio, $logTunelOut, $logTunelErr -Force -ErrorAction SilentlyContinue

Write-Log '========================================'
Write-Log 'NEXUS iniciando...'
Write-Log '========================================'

# ─── 1. Backend Python ────────────────────────────────────────────────────────
Write-Log 'Iniciando backend Python (app.py)...'

Start-Process `
    -WindowStyle Hidden `
    -FilePath    'python' `
    -ArgumentList 'app.py' `
    -WorkingDirectory $backendDir

# Aguarda o Flask subir
Start-Sleep -Seconds 3

# Verificacao de saude do backend
try {
    $check = Invoke-WebRequest -Uri 'http://127.0.0.1:5000/health' `
                               -UseBasicParsing -TimeoutSec 5
    if ($check.StatusCode -eq 200) {
        Write-Log 'Backend OK — respondendo em http://127.0.0.1:5000'
    }
} catch {
    Write-Log 'AVISO: Backend nao respondeu no /health ainda (pode estar carregando).'
}

# ─── 2. Cloudflare Tunnel ─────────────────────────────────────────────────────
Write-Log 'Iniciando Cloudflare Tunnel...'

Start-Process `
    -WindowStyle Hidden `
    -FilePath    'cloudflared' `
    -ArgumentList 'tunnel --url http://127.0.0.1:5000' `
    -RedirectStandardOutput $logTunelOut `
    -RedirectStandardError  $logTunelErr

# Polling: aguarda a URL aparecer nos logs (ate 60 segundos)
Write-Log 'Aguardando URL do tunel (timeout: 60s)...'

$tunnelUrl  = ''
$maxTentativas = 30   # 30 iteracoes x 2 segundos = 60s
$tentativa  = 0

while ($tentativa -lt $maxTentativas -and -not $tunnelUrl) {
    Start-Sleep -Seconds 2
    $tentativa++

    # Cloudflared pode escrever em stdout ou stderr dependendo da versao
    foreach ($arq in @($logTunelOut, $logTunelErr)) {
        if (Test-Path $arq) {
            $conteudo = Get-Content $arq -Raw -ErrorAction SilentlyContinue
            if ($conteudo) {
                $match = [regex]::Match($conteudo, 'https://[a-z0-9\-]+\.trycloudflare\.com')
                if ($match.Success) {
                    $tunnelUrl = $match.Value
                    break
                }
            }
        }
    }
}

if (-not $tunnelUrl) {
    Write-Log 'ERRO: URL do tunel nao encontrada apos 60s.'
    Write-Log 'Verifique se o cloudflared esta instalado e o backend esta rodando.'
    exit 1
}

Write-Log "URL do tunel obtida: $tunnelUrl"

# ─── 3. Atualizar NEXUS_LOCAL_URL no Railway ──────────────────────────────────
Write-Log 'Atualizando variavel NEXUS_LOCAL_URL no Railway...'

$mutation = @"
mutation {
  variableUpsert(input: {
    serviceId: "$serviceId"
    environmentId: "$environmentId"
    name: "NEXUS_LOCAL_URL"
    value: "$tunnelUrl"
  })
}
"@

$bodyVar = @{ query = $mutation } | ConvertTo-Json -Compress

try {
    Invoke-RestMethod `
        -Uri     'https://backboard.railway.app/graphql/v2' `
        -Method  POST `
        -Headers @{
            'Authorization' = "Bearer $railwayToken"
            'Content-Type'  = 'application/json'
        } `
        -Body $bodyVar | Out-Null

    Write-Log 'Railway atualizado com sucesso.'
} catch {
    Write-Log "ERRO ao atualizar Railway: $_"
    exit 1
}

# ─── 4. Redeploy no Railway para recarregar as variaveis ──────────────────────
Write-Log 'Aguardando 15 segundos antes do redeploy...'
Start-Sleep -Seconds 15

Write-Log 'Solicitando redeploy no Railway...'

$deployMutation = @"
mutation {
  serviceInstanceRedeploy(
    serviceId: "$serviceId"
    environmentId: "$environmentId"
  )
}
"@

$bodyDeploy = @{ query = $deployMutation } | ConvertTo-Json -Compress

try {
    Invoke-RestMethod `
        -Uri     'https://backboard.railway.app/graphql/v2' `
        -Method  POST `
        -Headers @{
            'Authorization' = "Bearer $railwayToken"
            'Content-Type'  = 'application/json'
        } `
        -Body $bodyDeploy | Out-Null

    Write-Log 'Redeploy solicitado no Railway.'
} catch {
    Write-Log "AVISO: Falha ao solicitar redeploy: $_"
}

# ─── Conclusao ────────────────────────────────────────────────────────────────
Write-Log '========================================'
Write-Log 'NEXUS inicializado com sucesso!'
Write-Log "Tunel ativo: $tunnelUrl"
Write-Log 'O Railway ira recarregar em ~2 minutos.'
Write-Log '========================================'
