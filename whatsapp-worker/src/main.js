import express from 'express';
import pino from 'pino';
import QRCode from 'qrcode';
import makeWASocket, { DisconnectReason, fetchLatestBaileysVersion, useMultiFileAuthState } from '@whiskeysockets/baileys';

const app = express();
app.use(express.json({ limit: '64kb' }));
const port = Number(process.env.PORT || 3100);
const authPath = process.env.WHATSAPP_AUTH_PATH || '/app/auth';
const internalToken = process.env.WHATSAPP_INTERNAL_TOKEN;
if (!internalToken || internalToken.length < 32) throw new Error('WHATSAPP_INTERNAL_TOKEN must contain at least 32 characters');

let socket;
let status = 'disconnected';
let qrDataUrl = null;
let phoneNumber = null;
let lastError = null;
let reconnectTimer;
let starting = false;
let manualDisconnect = false;

app.get('/health', (_req, res) => res.json({ status: 'ok', service: 'whatsapp-worker' }));

app.use((req, res, next) => {
  const supplied = req.get('authorization')?.replace(/^Bearer\s+/i, '');
  if (!supplied || supplied !== internalToken) return res.status(401).json({ error: 'Unauthorized' });
  next();
});

app.get('/status', (_req, res) => res.json({ status, phoneNumber, qr: qrDataUrl, lastError }));
app.post('/connect', async (_req, res) => {
  try { await startSocket(); res.status(202).json({ status }); }
  catch { res.status(503).json({ error: 'Unable to start WhatsApp connection' }); }
});
app.post('/disconnect', async (_req, res) => {
  clearTimeout(reconnectTimer);
  manualDisconnect = true;
  if (socket) { socket.end(undefined); socket = undefined; }
  starting = false;
  status = 'disconnected'; qrDataUrl = null; phoneNumber = null;
  res.json({ status });
});
app.get('/groups', async (_req, res) => {
  if (status !== 'connected' || !socket) return res.status(409).json({ error: 'WhatsApp is not connected' });
  try {
    const groups = await socket.groupFetchAllParticipating();
    res.json({ groups: Object.values(groups).map(group => ({ id: group.id, subject: group.subject, size: group.size || group.participants?.length || 0 })).sort((a, b) => (a.subject || '').localeCompare(b.subject || '')) });
  } catch { res.status(503).json({ error: 'Unable to retrieve groups' }); }
});
app.post('/send', async (req, res) => {
  const { groupId, text } = req.body || {};
  if (status !== 'connected' || !socket) return res.status(409).json({ error: 'WhatsApp is not connected' });
  if (typeof groupId !== 'string' || !groupId.endsWith('@g.us') || typeof text !== 'string' || !text.trim() || text.length > 4000) return res.status(400).json({ error: 'Invalid message or group' });
  try {
    await socket.sendMessage(groupId, { text: text.trim() });
    res.status(202).json({ accepted: true });
  } catch { res.status(503).json({ error: 'Message could not be sent' }); }
});

async function startSocket() {
  if (starting || status === 'connected' || status === 'connecting') return;
  manualDisconnect = false;
  starting = true; status = 'connecting'; lastError = null;
  try {
    const { state, saveCreds } = await useMultiFileAuthState(authPath);
    const { version } = await fetchLatestBaileysVersion();
    const client = makeWASocket({
      version, auth: state, logger: pino({ level: 'silent' }),
      browser: ['AI Marketing Manager', 'Chrome', '1.0.0'],
      printQRInTerminal: false, markOnlineOnConnect: false,
      syncFullHistory: false, shouldSyncHistoryMessage: () => false
    });
    socket = client;
    client.ev.on('creds.update', saveCreds);
    client.ev.on('connection.update', async update => {
      if (update.qr) {
        try { qrDataUrl = await QRCode.toDataURL(update.qr); status = 'qr_required'; }
        catch { lastError = 'QR_GENERATION_FAILED'; status = 'error'; }
      }
      if (update.connection === 'open') {
        status = 'connected'; qrDataUrl = null;
        phoneNumber = client.user?.id?.split(':')[0] || null;
        lastError = null; starting = false;
      }
      if (update.connection === 'close') {
        const code = update.lastDisconnect?.error?.output?.statusCode;
        socket = undefined; qrDataUrl = null; phoneNumber = null; starting = false;
        if (manualDisconnect) { status = 'disconnected'; return; }
        if (code === DisconnectReason.loggedOut) { status = 'logged_out'; return; }
        status = 'reconnecting';
        clearTimeout(reconnectTimer);
        reconnectTimer = setTimeout(() => startSocket().catch(() => {}), 5000);
      }
    });
  } catch (error) {
    starting = false; status = 'error'; lastError = error?.code || 'CONNECTION_START_FAILED';
    throw error;
  }
}

app.listen(port, '0.0.0.0', () => {
  console.log(JSON.stringify({ level: 'info', event: 'whatsapp_worker_started', port }));
  startSocket().catch(() => {});
});
