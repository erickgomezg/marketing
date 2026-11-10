import { Router } from 'express';

export function createWhatsAppIntegrationRoutes({ authenticate, requireAdministrator, repository }) {
  const router = Router();
  const workerUrl = (process.env.WHATSAPP_WORKER_URL || 'http://whatsapp-worker:3100').replace(/\/$/, '');
  const token = process.env.WHATSAPP_INTERNAL_TOKEN;
  async function worker(path, options = {}) {
    if (!token || token.length < 32) throw Object.assign(new Error('WhatsApp integration unavailable'), { status: 503 });
    const response = await fetch(`${workerUrl}${path}`, {
      ...options, signal: AbortSignal.timeout(10000),
      headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json', ...(options.headers || {}) },
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw Object.assign(new Error(data.error || 'WhatsApp worker unavailable'), { status: response.status });
    return data;
  }
  router.use(authenticate, requireAdministrator);
  router.get('/status', async (_req, res) => {
    try {
      const [connection, configuration] = await Promise.all([worker('/status'), repository.getConfiguration()]);
      res.json({ ...connection, selectedGroup: configuration ? { id: configuration.group_jid, name: configuration.group_name } : null });
    } catch (error) { res.status(error.status || 503).json({ error: 'No fue posible consultar WhatsApp.' }); }
  });
  router.post('/connect', async (_req, res) => {
    try { res.status(202).json(await worker('/connect', { method: 'POST', body: '{}' })); }
    catch (error) { res.status(error.status || 503).json({ error: 'No fue posible iniciar WhatsApp.' }); }
  });
  router.post('/disconnect', async (_req, res) => {
    try { res.json(await worker('/disconnect', { method: 'POST', body: '{}' })); }
    catch (error) { res.status(error.status || 503).json({ error: 'No fue posible desconectar WhatsApp.' }); }
  });
  router.get('/groups', async (_req, res) => {
    try { res.json(await worker('/groups')); }
    catch (error) { res.status(error.status || 503).json({ error: 'No fue posible consultar los grupos.' }); }
  });
  router.put('/group', async (req, res) => {
    const { groupId, groupName } = req.body || {};
    try {
      const { groups } = await worker('/groups');
      const selected = groups.find(group => group.id === groupId && group.subject === groupName);
      if (!selected) return res.status(400).json({ error: 'El grupo seleccionado no está disponible en la cuenta vinculada.' });
      const configuration = await repository.saveConfiguration({ groupId, groupName, userId: req.auth.UserId });
      res.json({ selectedGroup: { id: configuration.group_jid, name: configuration.group_name } });
    } catch (error) { res.status(error.status || 503).json({ error: 'No fue posible guardar el grupo.' }); }
  });
  router.post('/test', async (_req, res) => {
    try {
      const configuration = await repository.getConfiguration();
      if (!configuration?.group_jid) return res.status(409).json({ error: 'Primero selecciona un grupo.' });
      await worker('/send', { method: 'POST', body: JSON.stringify({ groupId: configuration.group_jid, text: '✅ AI Marketing Manager: conexión de WhatsApp configurada correctamente.' }) });
      res.status(202).json({ accepted: true });
    } catch (error) { res.status(error.status || 503).json({ error: 'No fue posible enviar el mensaje de prueba.' }); }
  });
  return router;
}
