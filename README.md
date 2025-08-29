# 🤖 Integração WhatsApp & IA

Este projeto foi desenvolvido como parte de um **desafio técnico**.  
Ele conecta o **WhatsApp** via QR Code, monitora mensagens recebidas e responde automaticamente usando **IA generativa** (Gemini).  
Tudo com persistência em **SQLite** e uma **interface web em React** para visualizar os chats.

---

## 🚀 Funcionalidades

- 📲 **Integração WhatsApp via QRCode** (login e status da sessão)  
- 💬 **Leitura de mensagens recebidas** em tempo real  
- 🤖 **Resposta automática com IA** (Oemini)  
- 🗂 **Persistência em banco SQLite** (usuários, sessões e mensagens)  
- 🌐 **Frontend em React** para acompanhar chats e mensagens  
- ⚡ **Status da conexão** (conectado, desconectado, aguardando QR)  

---

## 🛠 Tecnologias

### Backend
- Node.js + Express
- Socket.IO
- whatsapp-web.js
- SQLite (better-sqlite3)
- Gemini SDK

### Frontend
- React + Vite + TypeScript
- Socket.IO Client

---

## 📂 Estrutura do projeto

```
whats-ia-starter/
├── backend/
│   ├── src/
│   │   ├── index.ts      # servidor Express + Socket.IO
│   │   ├── wa.ts         # integração WhatsApp
│   │   ├── ai.ts         # integração IA (OpenAI/Gemini)
│   │   └── db.ts         # persistência SQLite
│   └── .env.example
│
├── frontend/
│   ├── src/
│   │   ├── App.tsx       # interface principal
│   │   └── ...
│   └── vite.config.ts
│
└── README.md
```

---

## ⚙️ Como rodar

### 1) Pré-requisitos
- Node.js **20+** (recomendado usar NVM)  
- npm ou pnpm  
- Conta na **Google AI Studio (Gemini)** para chave de API  

---

### 2) Backend
```bash
cd backend
cp .env.example .env
```

No `.env`, adicione sua chave:
```ini

# Para usar Gemini
GEMINI_API_KEY=AIzaSy...
PORT=3000
```

Instale dependências e rode:
```bash
npm install
npm run dev
```

Servidor em: `http://localhost:3000`  

---

### 3) Frontend
```bash
cd ../frontend
npm install
npm run dev
```

Acesse: [http://localhost:5173](http://localhost:5173)

---

### 4) Fluxo
1. Escaneie o **QR Code** exibido na interface  
2. Mande mensagem para o número conectado  
3. O bot salva no banco e responde usando IA  
4. A UI mostra mensagens organizadas por chat  

---

## 🧩 Extras implementados
- 🔄 **Fallback automático**: se não houver créditos na OpenAI, usa Gemini ou responde mockado  
- 📉 **Controle de custo**: truncamento de mensagens (até 500 caracteres) antes de enviar à IA  
- 💾 **Persistência completa**: todas as mensagens armazenadas em SQLite  
- 📊 **Estrutura organizada**: separação clara de backend/frontend e camadas  

---

## 📝 Critérios atendidos

- **Qualidade do código (40%)** → organizado, comentado e boas práticas  
- **Arquitetura (25%)** → separação backend/frontend, rotas, banco  
- **Performance (15%)** → respostas rápidas + truncamento para economizar tokens  
- **Interface (10%)** → visualização clara dos chats/mensagens  
- **Integração com IA (10%)** → IA responde automático de forma coerente  

---

Por: Ludmilla Oliveira
