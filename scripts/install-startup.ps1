# ==============================================================================
# NEXUS — Instalador de Tarefa Agendada (Windows Task Scheduler)
# Rodrigo Carvalho Mamede
#
# Registra o start-nexus.ps1 para rodar automaticamente no login do usuario,
# em segundo plano, sem abrir nenhuma janela.
#
# REQUISITO: Execute como Administrador
# ==============================================================================

# Verificar se esta rodando como Administrador
$eAdmin = ([Security.Principal.WindowsPrincipal] `
           [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole(
           [Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $eAdmin) {
    Write-Host ''
    Write-Host ' ERRO: Execute este script como Administrador.' -ForegroundColor Red
    Write-Host ' Clique direito no PowerShell > "Executar como administrador"' -ForegroundColor Yellow
    Write-Host ''
    exit 1
}

# ─── Configuracoes da tarefa ──────────────────────────────────────────────────
$nomeTask   = 'NEXUS Auto Start'
$scriptPath = 'C:\Users\Diggo.Dev\Documents\projetos pessoais\Omen\nexus\scripts\start-nexus.ps1'

# Verificar se o script de inicializacao existe
if (-not (Test-Path $scriptPath)) {
    Write-Host ''
    Write-Host " ERRO: Script nao encontrado em:" -ForegroundColor Red
    Write-Host "   $scriptPath" -ForegroundColor Yellow
    Write-Host ''
    exit 1
}

Write-Host ''
Write-Host ' Instalando tarefa agendada NEXUS Auto Start...' -ForegroundColor Cyan
Write-Host ''

# ─── Remover tarefa anterior se existir ───────────────────────────────────────
Unregister-ScheduledTask -TaskName $nomeTask -Confirm:$false -ErrorAction SilentlyContinue

# ─── Definir acao: executar o script PowerShell oculto ───────────────────────
$acao = New-ScheduledTaskAction `
    -Execute  'powershell.exe' `
    -Argument "-WindowStyle Hidden -ExecutionPolicy Bypass -NonInteractive -File `"$scriptPath`""

# ─── Gatilho: ao fazer login (qualquer usuario) ───────────────────────────────
$gatilho = New-ScheduledTaskTrigger -AtLogOn

# ─── Configuracoes de execucao ────────────────────────────────────────────────
$config = New-ScheduledTaskSettingsSet `
    -AllowStartIfOnBatteries `
    -DontStopIfGoingOnBatteries `
    -StartWhenAvailable `
    -MultipleInstances IgnoreNew `
    -ExecutionTimeLimit (New-TimeSpan -Minutes 10)

# ─── Registrar tarefa com privilegio elevado ──────────────────────────────────
Register-ScheduledTask `
    -TaskName   $nomeTask `
    -Action     $acao `
    -Trigger    $gatilho `
    -Settings   $config `
    -RunLevel   Highest `
    -Force | Out-Null

# ─── Verificar se foi registrada com sucesso ──────────────────────────────────
$verificar = Get-ScheduledTask -TaskName $nomeTask -ErrorAction SilentlyContinue

if ($verificar) {
    Write-Host ' [OK] Tarefa registrada com sucesso!' -ForegroundColor Green
    Write-Host ''
    Write-Host '      Nome   : NEXUS Auto Start' -ForegroundColor White
    Write-Host "      Script : $scriptPath" -ForegroundColor White
    Write-Host '      Gatilho: Ao fazer login' -ForegroundColor White
    Write-Host '      Modo   : Oculto (sem janelas)' -ForegroundColor White
    Write-Host ''
    Write-Host ' Proximos passos:' -ForegroundColor Cyan
    Write-Host '   1. Editar start-nexus.ps1 com seu Railway Token, Service ID e Environment ID'
    Write-Host '   2. Reiniciar o PC para testar a inicializacao automatica'
    Write-Host '   3. Verificar o log em: %TEMP%\nexus-start.log'
    Write-Host ''
} else {
    Write-Host ' ERRO: Falha ao registrar a tarefa agendada.' -ForegroundColor Red
    Write-Host ' Tente executar novamente como Administrador.' -ForegroundColor Yellow
    Write-Host ''
    exit 1
}

# ─── Opcao de executar agora para testar ──────────────────────────────────────
$executarAgora = Read-Host ' Deseja executar o NEXUS agora para testar? (s/n)'
if ($executarAgora -eq 's' -or $executarAgora -eq 'S') {
    Write-Host ''
    Write-Host ' Iniciando NEXUS...' -ForegroundColor Cyan
    Start-ScheduledTask -TaskName $nomeTask
    Write-Host ' Aguarde ~30 segundos e verifique: %TEMP%\nexus-start.log' -ForegroundColor Yellow
    Write-Host ''
}
