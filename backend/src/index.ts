import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import { db } from './db';
import { createWaClient } from './wa';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const httpServer = createServer(app);
const io = new Server(httpServer, { cors: { origin: '*' } });

function notify(event: string, payload: any) { io.emit(event, payload); }
createWaClient(notify);

// status simples
app.get('/api/status', (_, res) => res.json({ ok: true }));

// lista de chats
app.get('/api/chats', (_, res) => {
  const rows = db.prepare(
    'SELECT chatId, MAX(ts) as lastTs FROM messages GROUP BY chatId ORDER BY lastTs DESC'
  ).all();
  res.json(rows);
});

// mensagens de um chat
app.get('/api/messages/:chatId', (req, res) => {
  const rows = db.prepare(
    'SELECT chatId, fromMe, body, ts FROM messages WHERE chatId=? ORDER BY ts ASC'
  ).all(req.params.chatId);
  res.json(rows);
});

const PORT = Number(process.env.PORT || 3000);
httpServer.listen(PORT, () => console.log(`API on :${PORT}`));