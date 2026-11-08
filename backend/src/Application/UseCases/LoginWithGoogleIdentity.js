export class LoginWithGoogleIdentity {
  constructor({ authRepository, tokenService }) {
    this.authRepository = authRepository;
    this.tokenService = tokenService;
  }
  async execute(subject) {
    const user = await this.authRepository.findActiveByGoogleSubject(subject);
    if (!user) throw Object.assign(new Error('Identity is not provisioned'), { code: 'IDENTITY_NOT_PROVISIONED' });
    return { user, accessToken: this.tokenService.issue(user.UserId, user.AuthVersion || 0), expiresInSeconds: this.tokenService.lifetimeSeconds() };
  }
}
