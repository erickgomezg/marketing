import { Router } from 'express';
export function createAccessRoutes({ accessService, authenticate, requireAdministrator }) {
const router = Router();
router.use(authenticate);
router.get('/me', (req, res) => res.json({ userId: req.auth.UserId, role: req.auth.Role, displayName: req.auth.DisplayName, email: req.auth.Email }));
router.get('/users', requireAdministrator, async (req, res, next) => {
  try { res.json(await accessService.listUsers(req.auth.UserId)); } catch (error) { next(error); }
});
router.get('/users/:userId', requireAdministrator, async (req, res, next) => {
  try { const user = await accessService.getUser(req.auth.UserId, req.params.userId); user ? res.json(user) : res.status(404).json({ error: 'Usuario no encontrado.' }); } catch (error) { next(error); }
});
router.get('/assignment-options', requireAdministrator, async (req, res, next) => {
  try { res.json(await accessService.assignmentOptions(req.auth.UserId)); } catch (error) { next(error); }
});
router.post('/users', requireAdministrator, async (req, res, next) => {
  try {
    const result = await accessService.createUser(req.auth.UserId, req.body || {});
    res.status(201).json({ user: result.user, invitation: 'pending', ...(result.actionLink ? { developmentActionLink: result.actionLink } : {}) });
  } catch (error) { next(error); }
});
router.put('/users/:userId', requireAdministrator, async (req, res, next) => {
  try { res.json(await accessService.updateUser(req.auth.UserId, req.params.userId, req.body || {})); } catch (error) { next(error); }
});
router.patch('/users/:userId/active', requireAdministrator, async (req, res, next) => {
  if (typeof req.body?.isActive !== 'boolean') return res.status(400).json({ error: 'Estado inválido' });
  try { await accessService.setUserActive(req.auth.UserId, req.params.userId, req.body.isActive); res.status(204).end(); } catch (error) { next(error); }
});
router.put('/users/:userId/active', requireAdministrator, async (req, res, next) => {
  if (typeof req.body?.isActive !== 'boolean') return res.status(400).json({ error: 'Estado inválido' });
  try { await accessService.setUserActive(req.auth.UserId, req.params.userId, req.body.isActive); res.status(204).end(); } catch (error) { next(error); }
});
router.patch('/users/:userId/role', requireAdministrator, async (req, res, next) => {
  try {
    await accessService.changeRole(req.auth.UserId, req.params.userId, req.body?.role, req.body?.assignments || []);
    res.status(204).end();
  } catch (error) { next(error); }
});
router.post('/users/:userId/invitation', requireAdministrator, async (req, res, next) => {
  try {
    const result = await accessService.resendInvitation(req.auth.UserId, req.params.userId);
    res.status(202).json({ invitation: 'pending', ...(result.actionLink ? { developmentActionLink: result.actionLink } : {}) });
  } catch (error) { next(error); }
});
router.post('/users/:userId/invitation/resend', requireAdministrator, async (req, res, next) => {
  try {
    const result = await accessService.resendInvitation(req.auth.UserId, req.params.userId);
    res.status(202).json({ invitation: 'pending', ...(result.actionLink ? { developmentActionLink: result.actionLink } : {}) });
  } catch (error) { next(error); }
});
router.post('/users/:userId/invitation/revoke', requireAdministrator, async (req, res, next) => {
  try { await accessService.revokeInvitation(req.auth.UserId, req.params.userId); res.status(204).end(); } catch (error) { next(error); }
});
router.get('/businesses', async (req, res, next) => {
  try { res.json(await accessService.listBusinesses(req.auth.UserId)); } catch (error) { next(error); }
});
router.get('/social-accounts', async (req, res, next) => {
  try {
    const businessId = req.query.businessId || null;
    const platform = req.query.socialPlatformId ? Number(req.query.socialPlatformId) : null;
    if (businessId && !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(businessId)) return res.status(400).json({ error: 'Filtros inválidos' });
    if (platform !== null && (!Number.isInteger(platform) || platform < 1)) return res.status(400).json({ error: 'Filtros inválidos' });
    res.json(await accessService.listSocialAccounts(req.auth.UserId, businessId, platform));
  } catch (error) { next(error); }
});
router.get('/users/:userId/permissions', requireAdministrator, async (req, res, next) => {
  try { res.json(await accessService.listPermissions(req.auth.UserId, req.params.userId)); } catch (error) { next(error); }
});
router.put('/users/:userId/permissions', requireAdministrator, async (req, res, next) => {
  try {
    if (!Array.isArray(req.body?.assignments) || req.body.assignments.length > 1000) return res.status(400).json({ error: 'Asignaciones inválidas' });
    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (req.body.assignments.some((item) => !uuidPattern.test(item.businessId || '') || !Number.isInteger(Number(item.socialPlatformId)) || typeof item.isActive !== 'boolean')) return res.status(400).json({ error: 'Asignaciones inválidas' });
    const assignments = req.body.assignments.map((item) => ({ businessId: item.businessId, socialPlatformId: Number(item.socialPlatformId), isActive: item.isActive === true }));
    await accessService.savePermissions(req.auth.UserId, req.params.userId, assignments);
    res.status(204).end();
  } catch (error) { next(error); }
});
router.use((error, _req, res, _next) => {
  if ([51001, 51005, 51006].includes(error.number)) return res.status(403).json({ error: 'Acceso denegado' });
  if ([51002, 51004].includes(error.number)) return res.status(404).json({ error: 'Recurso no encontrado' });
  if (error.number === 51012) return res.status(409).json({ error: 'No se puede desactivar al último Administrador activo.' });
  if (error.number === 51013 || error.number === 51016) return res.status(409).json({ error: error.number === 51013 ? 'La cuenta pendiente debe activar su invitación.' : 'Ya existe un usuario con ese correo.' });
  if ([51014, 51015, 51003].includes(error.number) || error.code === 'INVALID_USER' || error.code === 'INVALID_ROLE' || error.code === 'INVALID_ASSIGNMENTS') return res.status(400).json({ error: 'Datos de usuario o permisos inválidos.' });
  if ([51018, 51019].includes(error.number)) return res.status(400).json({ error: 'La invitación no es válida o expiró.' });
  if (error.number === 51020 || error.code === 'INVALID_RESET') return res.status(400).json({ error: 'El enlace de recuperación no es válido o expiró.' });
  if (error.number === 51003) return res.status(400).json({ error: 'Asignaciones inválidas' });
  return res.status(500).json({ error: 'No fue posible procesar la solicitud' });
});
return router;
}
