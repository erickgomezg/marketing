import { User } from '../../Domain/Entities/User.js';

export class LoginWithPassword {
  constructor({ authRepository, passwordHasher, tokenService }) {
    this.authRepository = authRepository;
    this.passwordHasher = passwordHasher;
    this.tokenService = tokenService;
  }

  async execute({ email, password }) {
    if (typeof email !== 'string' || typeof password !== 'string' || !email.trim() || !password) {
      throw Object.assign(new Error('Invalid credentials'), { code: 'INVALID_CREDENTIALS' });
    }
    const record = await this.authRepository.findByEmail(email.trim().toLowerCase());
    if (!record?.IsActive || !record.PasswordHash || !(await this.passwordHasher.verify(record.PasswordHash, password))) {
      throw Object.assign(new Error('Invalid credentials'), { code: 'INVALID_CREDENTIALS' });
    }
    const user = new User({ userId: record.UserId, email: record.Email, displayName: record.DisplayName, role: record.Role, isActive: record.IsActive });
    const accessToken = this.tokenService.issue(user.userId, record.AuthVersion || 0);
    return { user: { userId: user.userId, email: user.email, displayName: user.displayName, role: user.role }, accessToken, expiresInSeconds: this.tokenService.lifetimeSeconds() };
  }
}
