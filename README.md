# NEXUS — Control Everything. From Anywhere.

PWA mobile-first para controle remoto do PC via HTTP.  
Desenvolvido por **Rodrigo Carvalho Mamede**.

```
Stack: Python + Flask  ·  React + Vite + Tailwind CSS  ·  Cloudflare Tunnel
```

---

## Estrutura do Projeto

```
nexus/
  backend/          ← Servidor Flask (roda no PC)
  frontend/         ← PWA React (deploy na nuvem)
  README.md
```

---

## PARTE 1 — Backend (PC Windows)

### 1.1 Pré-requisitos

- Python 3.10 ou superior
- pip atualizado: `python -m pip install --upgrade pip`

### 1.2 Instalação

```bash
cd nexus/backend

# Criar ambiente virtual
python -m venv venv
venv\Scripts\activate

# Instalar dependências
pip install -r requirements.txt
```

### 1.3 Configurar o .env

```bash
copy .env.example .env
```

Edite o arquivo `.env` gerado:

```env
# Chave secreta — gere com: python -c "import secrets; print(secrets.token_hex(32))"
API_KEY=cole_sua_chave_aqui

# Domínio do frontend (Vercel, Cloudflare Pages, etc.)
# Separe múltiplos com vírgula: https://a.com,http://localhost:5173
CORS_ORIGIN=https://nexus.seudominio.pages.dev

# Wake-on-LAN
# Descobrir MAC: ipconfig /all → "Endereço Físico"
WOL_MAC=00:E0:4C:A1:1E:C0
WOL_BROADCAST=192.168.1.255

# Apps que podem ser abertos remotamente (minúsculos, separados por vírgula)
ALLOWED_APPS=chrome,spotify,notepad,vscode,explorer
```

### 1.4 Executar manualmente (teste)

```bash
# Com venv ativo
python app.py
# Servidor disponível em http://0.0.0.0:5000
```

Teste rápido: acesse `http://localhost:5000/health` no navegador.  
Deve retornar: `{"status": "online", "hostname": "SEU-PC"}`.

### 1.5 Instalar como Serviço Windows (início automático)

O serviço garante que o NEXUS suba junto com o Windows,  
mesmo sem login de usuário.

**Pré-requisito: NSSM**
1. Baixe em: https://nssm.cc/download
2. Extraia `nssm.exe` para `C:\Windows\System32\`

**Instalação:**
```
# Clique direito em install_service.bat → "Executar como administrador"
install_service.bat
```

**Gerenciar o serviço:**
```cmd
nssm start   NexusBackend
nssm stop    NexusBackend
nssm restart NexusBackend
nssm edit    NexusBackend    ← abre GUI de configuração
nssm remove  NexusBackend confirm
```

Os logs ficam em `backend/logs/`.

---

## PARTE 2 — Frontend (Deploy na Nuvem)

### 2.1 Instalação

```bash
cd nexus/frontend

npm install
```

### 2.2 Configurar o .env

```bash
copy .env.example .env
```

Edite `.env`:

```env
# IP local do seu PC (para uso em casa)
# Substitua pelo Cloudflare Tunnel para acesso externo
VITE_API_URL=http://192.168.1.100:5000

# Mesma API_KEY do backend
VITE_API_KEY=cole_sua_chave_aqui
```

### 2.3 Desenvolvimento local

```bash
npm run dev
# Abra http://localhost:5173
```

### 2.4 Build de produção

```bash
npm run build
# Arquivos gerados em dist/
```

### 2.5 Ícones PWA (necessário para instalação no iOS)

O `icon.svg` em `public/icons/` serve como referência visual.  
Para suporte completo como PWA instalável, gere os PNGs:

```bash
# Opção 1: Sharp (Node.js)
npm install -g sharp-cli
sharp -i public/icons/icon.svg -o public/icons/icon-192.png resize 192 192
sharp -i public/icons/icon.svg -o public/icons/icon-512.png resize 512 512

# Opção 2: Imagemagick
convert public/icons/icon.svg -resize 192x192 public/icons/icon-192.png
convert public/icons/icon.svg -resize 512x512 public/icons/icon-512.png
```

### 2.6 Deploy na Vercel

```bash
npm install -g vercel
vercel --prod
```

Durante o setup: framework → `Vite`, build command → `npm run build`, output → `dist`.

**Variáveis de ambiente na Vercel:**  
Vá em Project Settings → Environment Variables e adicione:
- `VITE_API_URL` = URL do Cloudflare Tunnel (ver Parte 3)
- `VITE_API_KEY` = sua API Key

### 2.7 Deploy no Cloudflare Pages

1. Conecte o repositório no Cloudflare Pages
2. Build command: `npm run build`
3. Build output: `dist`
4. Adicione as variáveis de ambiente acima

---

## PARTE 3 — Cloudflare Tunnel (Acesso Externo)

O Cloudflare Tunnel cria um canal seguro HTTPS do seu PC para a internet,  
sem abrir portas no roteador.

### 3.1 Instalar cloudflared no Windows

```powershell
# Via winget
winget install Cloudflare.cloudflared

# Ou baixe o instalador em:
# https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/
```

### 3.2 Autenticar com sua conta Cloudflare

```cmd
cloudflared tunnel login
```

Uma janela do navegador abrirá. Faça login e autorize o domínio desejado.

### 3.3 Criar o Tunnel

```cmd
cloudflared tunnel create nexus-backend
```

Anote o `<TUNNEL_ID>` exibido no terminal.

### 3.4 Configurar o roteamento

Crie o arquivo de configuração:

```
%USERPROFILE%\.cloudflared\config.yml
```

Conteúdo:

```yaml
tunnel: <TUNNEL_ID>
credentials-file: C:\Users\<SEU_USUARIO>\.cloudflared\<TUNNEL_ID>.json

ingress:
  - hostname: nexus.seudominio.com
    service: http://localhost:5000
  - service: http_status:404
```

Substitua:
- `<TUNNEL_ID>` pelo ID gerado no passo anterior
- `seudominio.com` pelo seu domínio no Cloudflare
- `<SEU_USUARIO>` pelo seu usuário do Windows

### 3.5 Apontar DNS

```cmd
cloudflared tunnel route dns nexus-backend nexus.seudominio.com
```

### 3.6 Testar o Tunnel

```cmd
cloudflared tunnel run nexus-backend
```

Acesse `https://nexus.seudominio.com/health` no celular.  
Deve retornar `{"status": "online", ...}`.

### 3.7 Iniciar o Tunnel automaticamente com o Windows

```cmd
cloudflared service install
```

Isso cria um serviço Windows que inicia o tunnel junto com o sistema.

### 3.8 Atualizar o frontend

No `.env` do frontend, substitua a URL local:

```env
VITE_API_URL=https://nexus.seudominio.com
```

Rebuilde e faça redeploy:

```bash
npm run build
vercel --prod  # ou redeploy no Cloudflare Pages
```

---

## PARTE 4 — Wake-on-LAN

WoL permite ligar o PC remotamente enquanto ele está desligado  
(a placa-mãe permanece com alimentação em standby).

### 4.1 Ativar na BIOS

1. Acesse a BIOS ao iniciar (geralmente Del, F2 ou F10)
2. Procure por: `Wake on LAN`, `PCI Power Up`, ou `ErP Ready`
3. **Habilite** a opção e salve

### 4.2 Ativar no Windows

```powershell
# Abra Gerenciador de Dispositivos → Adaptadores de rede
# Clique com o direito → Propriedades → Gerenciamento de Energia
# Marque: "Permitir que este dispositivo ative o computador"
# Na aba Avançado, ative: "Wake on Magic Packet"
```

### 4.3 Descobrir o MAC Address

```cmd
ipconfig /all
```

Procure a linha `Endereço Físico` da placa de rede com fio (ex: `00-E0-4C-A1-1E-C0`).  
Use hífens ou dois-pontos — ambos funcionam.

### 4.4 Descobrir o endereço de Broadcast

Geralmente é o IP da sua rede com o último octeto substituído por `255`:

- Sua rede: `192.168.1.x` → Broadcast: `192.168.1.255`
- Sua rede: `192.168.0.x` → Broadcast: `192.168.0.255`

### 4.5 Configurar no .env do backend

```env
WOL_MAC=00:E0:4C:A1:1E:C0
WOL_BROADCAST=192.168.1.255
```

> **Nota:** O PC de destino e o servidor NEXUS devem estar na mesma rede local  
> para o magic packet funcionar.

---

## Referência das Rotas da API

| Método | Rota              | Descrição                           |
|--------|-------------------|-------------------------------------|
| GET    | /health           | Status público (sem autenticação)   |
| GET    | /stats            | CPU, RAM, GPU, disco, rede, uptime  |
| POST   | /power/shutdown   | Desliga o PC                        |
| POST   | /power/restart    | Reinicia o PC                       |
| POST   | /power/hibernate  | Hiberna                             |
| POST   | /power/sleep      | Modo sleep                          |
| POST   | /power/cancel     | Cancela shutdown agendado           |
| POST   | /wol/wake         | Envia magic packet WoL              |
| GET    | /app/list         | Lista apps permitidos               |
| POST   | /app/open         | Abre um app `{"app": "chrome"}`     |
| GET    | /app/running      | Lista processos ativos              |
| POST   | /app/kill         | Encerra processo `{"pid": 1234}`    |
| GET    | /media/volume     | Volume atual                        |
| POST   | /media/volume     | Define volume `{"level": 50}`       |
| POST   | /media/mute       | Toggle mute                         |
| POST   | /media/play-pause | Simula Play/Pause                   |
| POST   | /media/next       | Próxima faixa                       |
| POST   | /media/prev       | Faixa anterior                      |
| POST   | /media/stop       | Para a mídia                        |

**Autenticação:** todas as rotas (exceto `/health`) exigem o header:
```
X-API-Key: sua_chave_aqui
```

---

## Segurança

- API Key definida em `.env` — **nunca** commite o `.env`
- `.env` já está no `.gitignore`
- CORS restrito ao domínio do frontend configurado
- Rate limiting: 30 requisições/minuto por IP
- Body size limitado a 1 MB
- Nenhum stack trace exposto ao cliente
- Apps abertos validados contra whitelist (`ALLOWED_APPS`)
- Nenhuma concatenação de strings em comandos — inputs sempre validados

---

*NEXUS — por Rodrigo Carvalho Mamede*
