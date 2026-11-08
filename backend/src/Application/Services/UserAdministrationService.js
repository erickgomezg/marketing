import { randomUUID } from 'node:crypto';

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const escapeHtml = (value) => value.replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);

function expiryFromEnv(name, fallback, min, max) {
  const value = Number(process.env[name] || fallback);
  if (!Number.isInteger(value) || value < min || value > max) throw new Error(`${name} is outside the allowed range`);
  return value;
}

export class UserAdministrationService {
  constructor({ userRepository, tokenService, passwordHasher, encryptor, outboxDispatcher }) {
    Object.assign(this, { userRepository, tokenService, passwordHasher, encryptor, outboxDispatcher });
  }

  async createUser(actorUserId, input) {
    const email = String(input.email || '').trim().toLowerCase();
    const displayName = String(input.displayName || '').trim();
    const role = input.role;
    if (!emailPattern.test(email) || email.length > 320 || displayName.length < 2 || displayName.length > 200 || !['Administrador', 'Viewer'].includes(role)) {
      throw Object.assign(new Error('Invalid user fields'), { code: 'INVALID_USER' });
    }
    const assignments = input.assignments || [];
    if (role === 'Viewer') this.validateAssignments(assignments);
    const targetUserId = randomUUID();
    const { token, tokenHash } = this.tokenService.create();
    const ttlHours = expiryFromEnv('INVITATION_TTL_HOURS', 72, 1, 720);
    const expiresAt = new Date(Date.now() + ttlHours * 60 * 60 * 1000);
    const url = this.actionUrl('/accept-invitation', token);
    const encryptedMessage = this.invitationMessage(email, displayName, url);
    const result = await this.userRepository.manage('create', {
      actorUserId, targetUserId, email, displayName, role,
      assignments: role === 'Viewer' ? assignments : [], tokenHash, expiresAt,
      payloadEncrypted: this.encryptor.encrypt(encryptedMessage),
    });
    await this.outboxDispatcher.dispatchPending().catch(() => {});
    return { user: result.recordset[0], actionLink: this.developmentLink(url) };
  }

  async updateUser(actorUserId, targetUserId, input) {
    const email = String(input.email || '').trim().toLowerCase();
    const displayName = String(input.displayName || '').trim();
    if (!emailPattern.test(email) || email.length > 320 || displayName.length < 2 || displayName.length > 200) throw Object.assign(new Error('Invalid user fields'), { code: 'INVALID_USER' });
    const result = await this.userRepository.manage('update', { actorUserId, targetUserId, email, displayName });
    return result.recordset[0];
  }

  setRole(actorUserId, targetUserId, role, assignments = []) {
    if (!['Administrador', 'Viewer'].includes(role)) throw Object.assign(new Error('Invalid role'), { code: 'INVALID_ROLE' });
    if (role === 'Viewer') this.validateAssignments(assignments);
    return this.userRepository.manage('role', { actorUserId, targetUserId, role, assignments });
  }

  async resendInvitation(actorUserId, targetUserId) {
    const { token, tokenHash } = this.tokenService.create();
    const ttlHours = expiryFromEnv('INVITATION_TTL_HOURS', 72, 1, 720);
    const expiresAt = new Date(Date.now() + ttlHours * 60 * 60 * 1000);
    const target = await this.userRepository.manage('get', { actorUserId, targetUserId });
    const user = target.recordset[0];
    if (!user || user.IsActive || user.ActivatedAt) throw Object.assign(new Error('Pending user not found'), { code: 'NOT_PENDING' });
    const url = this.actionUrl('/accept-invitation', token);
    await this.userRepository.invitation('resend', {
      actorUserId, targetUserId, tokenHash, expiresAt,
      payloadEncrypted: this.encryptor.encrypt(this.invitationMessage(user.Email, user.DisplayName, url)),
    });
    await this.outboxDispatcher.dispatchPending().catch(() => {});
    return { actionLink: this.developmentLink(url) };
  }

  revokeInvitation(actorUserId, targetUserId) {
    return this.userRepository.invitation('revoke', { actorUserId, targetUserId });
  }

  async validateInvitation(token) {
    const tokenHash = this.tokenService.hash(token);
    if (!tokenHash) return null;
    const result = await this.userRepository.invitation('validate', { tokenHash });
    return result.recordset[0] || null;
  }

  async acceptInvitation(token, password) {
    const tokenHash = this.tokenService.hash(token);
    if (!tokenHash || typeof password !== 'string' || password.length < 12 || password.length > 256) throw Object.assign(new Error('Invitation is invalid or password does not meet requirements'), { code: 'INVALID_INVITATION' });
    const passwordHash = await this.passwordHasher.hash(password);
    await this.userRepository.invitation('accept', { tokenHash, passwordHash });
  }

  async requestPasswordReset(email) {
    const normalizedEmail = String(email || '').trim().toLowerCase();
    if (!emailPattern.test(normalizedEmail) || normalizedEmail.length > 320) return;
    const { token, tokenHash } = this.tokenService.create();
    const ttlMinutes = expiryFromEnv('PASSWORD_RESET_TTL_MINUTES', 30, 5, 1440);
    const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000);
    const url = this.actionUrl('/reset-password', token);
    await this.userRepository.passwordReset('request', {
      email: normalizedEmail, tokenHash, expiresAt,
      payloadEncrypted: this.encryptor.encrypt({
        to: normalizedEmail, subject: 'Recuperación de contraseña', text: `Usa este enlace para restablecer tu contraseña: ${url}`,
        html: `<p>Solicitaste restablecer tu contraseña.</p><p><a href="${escapeHtml(url)}">Restablecer contraseña</a></p><p>Si no lo solicitaste, ignora este mensaje.</p>`,
      }),
    });
    await this.outboxDispatcher.dispatchPending().catch(() => {});
  }

  async resetPassword(token, password) {
    const tokenHash = this.tokenService.hash(token);
    if (!tokenHash || typeof password !== 'string' || password.length < 12 || password.length > 256) throw Object.assign(new Error('Reset token is invalid or password does not meet requirements'), { code: 'INVALID_RESET' });
    const passwordHash = await this.passwordHasher.hash(password);
    await this.userRepository.passwordReset('reset', { tokenHash, passwordHash });
  }

  validateAssignments(assignments) {
    if (!Array.isArray(assignments) || assignments.length === 0 || assignments.length > 1000) throw Object.assign(new Error('Viewer requires permissions'), { code: 'INVALID_ASSIGNMENTS' });
    const seen = new Set();
    for (const assignment of assignments) {
      if (!assignment || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(assignment.businessId || '') || !Number.isInteger(Number(assignment.socialPlatformId))) throw Object.assign(new Error('Invalid assignment'), { code: 'INVALID_ASSIGNMENTS' });
      const socialPlatformId = Number(assignment.socialPlatformId);
      if (!Number.isSafeInteger(socialPlatformId) || socialPlatformId < 1) throw Object.assign(new Error('Invalid assignment'), { code: 'INVALID_ASSIGNMENTS' });
      const key = `${assignment.businessId.toLowerCase()}:${socialPlatformId}`;
      if (seen.has(key)) throw Object.assign(new Error('Duplicate assignment'), { code: 'INVALID_ASSIGNMENTS' });
      seen.add(key);
    }
  }

  actionUrl(path, token) {
    const base = (process.env.APP_PUBLIC_URL || 'http://localhost').replace(/\/$/, '');
    return `${base}${path}?token=${encodeURIComponent(token)}`;
  }

  developmentLink(url) {
    return process.env.NODE_ENV === 'development' && process.env.DEV_RETURN_ACTION_LINKS === 'true' ? url : undefined;
  }

  invitationMessage(email, displayName, url) {
    const safeName = escapeHtml(displayName);
    return { to: email, subject: 'Invitación a AI Marketing Manager', text: `Hola ${displayName}. Acepta la invitación: ${url}`, html: `<p>Hola ${safeName},</p><p>Te invitaron a AI Marketing Manager.</p><p><a href="${escapeHtml(url)}">Aceptar invitación</a></p><p>El enlace expira automáticamente.</p>` };
  }
}
