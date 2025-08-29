import path from 'path';
import { Client, LocalAuth, Message } from 'whatsapp-web.js';
import QRCode from 'qrcode';
import { db } from './db';

type Notifier = (event: string, payload: any) => void;

export function createWaClient(notify: Notifier) {
  // Salva a sessão fora do projeto (ajuda MUITO no Windows)
  const dataPath =
    (process.env.LOCALAPPDATA && path.join(process.env.LOCALAPPDATA, 'wwebjs_data')) ||
    path.join(process.cwd(), 'wwebjs_data');

  const client = new Client({
    authStrategy: new LocalAuth({
      clientId: 'ludy-session',   // troque se quiser forçar uma nova sessão
      dataPath,                   // diretório persistente de sessão
    }),
    puppeteer: {
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    },
  });

  // --- Eventos de status / diagnóstico ---
  client.on('loading_screen', (percent, message) => {
    notify('status', { status: 'loading', percent, message });
  });

  client.on('qr', async (qr) => {
    const dataUrl = await QRCode.toDataURL(qr);
    notify('qr', { dataUrl });
    notify('status', { status: 'qr' });
  });

  client.on('ready', () => {
    notify('status', { status: 'ready', dataPath });
  });

  client.on('auth_failure', (msg) => {
    // Credenciais inválidas/corrompidas — você pode sugerir trocar clientId
    notify('status', { status: 'auth_failure', message: msg });
  });

  client.on('disconnected', (reason) => {
    notify('status', { status: 'disconnected', reason });
  });

  // --- Mensagens ---
  client.on('message', async (msg: Message) => {
    // salva recebida
    db.prepare(
      `INSERT INTO messages(chatId, fromMe, body, ts, sessionId) VALUES(?,?,?,?,?)`
    ).run(msg.from, 0, msg.body, Date.now(), 'ludy-session');

    notify('inbound', { chatId: msg.from, body: msg.body });

    // gera resposta com IA (com try/catch para não derrubar o servidor)
    try {
      const { generateReply } = await import('./ai');
      const reply = await generateReply(msg.body);

      await msg.reply(reply);

      db.prepare(
        `INSERT INTO messages(chatId, fromMe, body, ts, sessionId) VALUES(?,?,?,?,?)`
      ).run(msg.from, 1, reply, Date.now(), 'ludy-session');

      notify('outbound', { chatId: msg.from, body: reply });
    } catch (err: any) {
      // fallback para não travar fluxo se a IA falhar
      const reply = '⚠️ IA indisponível no momento. Recebi sua mensagem!';
      await msg.reply(reply);

      db.prepare(
        `INSERT INTO messages(chatId, fromMe, body, ts, sessionId) VALUES(?,?,?,?,?)`
      ).run(msg.from, 1, reply, Date.now(), 'ludy-session');

      notify('outbound', { chatId: msg.from, body: reply, error: String(err?.message || err) });
    }
  });

  // Inicializa com proteção básica para não crashar em EBUSY
  client.initialize().catch((err) => {
    // Se der EBUSY/EPERM, geralmente é arquivo travado no Windows
    notify('status', { status: 'init_error', error: String(err?.message || err), dataPath });
  });

  // Fecha sessão/Chromium com Ctrl+C
  process.on('SIGINT', async () => {
    try { await client.destroy(); } catch { /* ignore */ }
    process.exit(0);
  });

  return client;
}
