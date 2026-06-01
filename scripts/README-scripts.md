# NEXUS — Scripts de Inicializacao Automatica

Estes scripts configuram o NEXUS para iniciar automaticamente
ao ligar o PC, sem precisar abrir nenhum terminal.

---

## Como funciona

```
PC liga
  └─ Task Scheduler executa start-nexus.ps1 (oculto)
       ├─ Inicia o backend Flask (Python)
       ├─ Inicia o Cloudflare Tunnel → gera URL temporaria
       ├─ Atualiza NEXUS_LOCAL_URL no Railway via API
       └─ Dispara redeploy no Railway para recarregar a variavel
```

O tunel Cloudflare gera uma URL nova a cada reinicio, por isso
a atualizacao automatica do Railway e necessaria.

---

## 1. Obter o Railway Token

1. Acesse [railway.app](https://railway.app) e faca login
2. Clique no seu avatar → **Account Settings**
3. Va em **Tokens** → **New Token**
4. Nomeie como `NEXUS` e clique em **Create**
5. **Copie o token imediatamente** (ele so aparece uma vez)

---

## 2. Obter o Service ID e Environment ID

### Service ID
1. Abra o projeto NEXUS no Railway
2. Clique no servico do backend
3. Va em **Settings** → copie o **Service ID**

### Environment ID
1. No projeto NEXUS, clique em **Environments**
2. Selecione o ambiente (geralmente `production`)
3. O **Environment ID** aparece na URL do navegador:
   ```
   railway.app/project/.../environment/SEU-ENVIRONMENT-ID/...
   ```
   Ou em **Settings** do ambiente.

---

## 3. Configurar o script

Abra o arquivo `start-nexus.ps1` e substitua as tres linhas:

```powershell
$railwayToken  = 'RAILWAY_TOKEN_AQUI'
$serviceId     = 'RAILWAY_SERVICE_ID_AQUI'
$environmentId = 'RAILWAY_ENVIRONMENT_ID_AQUI'
```

Pelos valores reais:

```powershell
$railwayToken  = 'abc123...'   # seu token Railway
$serviceId     = 'srv_...'     # ID do servico
$environmentId = 'env_...'     # ID do ambiente
```

---

## 4. Instalar a tarefa agendada

1. Abra o PowerShell **como Administrador**
   (clique direito no menu Iniciar → Windows PowerShell (Admin))

2. Navegue ate a pasta dos scripts:
   ```powershell
   cd "C:\Users\Diggo.Dev\Documents\projetos pessoais\Omen\nexus\scripts"
   ```

3. Execute o instalador:
   ```powershell
   .\install-startup.ps1
   ```

4. Quando perguntado se deseja testar agora, digite `s` para confirmar

---

## 5. Verificar se funcionou

### Pelo arquivo de log
Apos o login (aguarde ~30 segundos), abra o arquivo:
```
%TEMP%\nexus-start.log
```
Deve conter algo como:
```
2025-01-01 10:00:00 | NEXUS iniciando...
2025-01-01 10:00:03 | Backend OK — respondendo em http://127.0.0.1:5000
2025-01-01 10:00:25 | URL do tunel obtida: https://abc-xyz.trycloudflare.com
2025-01-01 10:00:26 | Railway atualizado com sucesso.
2025-01-01 10:00:43 | Redeploy solicitado no Railway.
2025-01-01 10:00:43 | NEXUS inicializado com sucesso!
```

### Pelo app
1. Aguarde cerca de 2 minutos para o Railway redeployar
2. Acesse o frontend no Vercel
3. A aba **Status** deve mostrar o PC como **Online**

### Pelo Task Scheduler
1. Abra o **Agendador de Tarefas** (busque no menu Iniciar)
2. Procure por **NEXUS Auto Start**
3. Verifique se o status e **Pronto** ou **Em execucao**

---

## Logs de debug

| Arquivo | Conteudo |
|---|---|
| `%TEMP%\nexus-start.log` | Log principal do script |
| `%TEMP%\nexus-tunnel-out.log` | Saida do cloudflared (stdout) |
| `%TEMP%\nexus-tunnel-err.log` | Saida do cloudflared (stderr, contem a URL) |

---

## Remover a tarefa agendada

Para desinstalar, abra o PowerShell como Administrador e rode:

```powershell
Unregister-ScheduledTask -TaskName "NEXUS Auto Start" -Confirm:$false
```

---

## Requisitos

- Python com o backend NEXUS instalado
- `cloudflared` instalado e no PATH do sistema
- Conta Railway com o projeto NEXUS configurado
- Conexao com a internet no login

## Verificar se o cloudflared esta no PATH

```powershell
cloudflared --version
```

Se nao reconhecer o comando, instale via:
```
winget install Cloudflare.cloudflared
```
