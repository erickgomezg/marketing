export class LoginWithGoogleIdentity {
  constructor({ authRepository, sessionService }) {
    this.authRepository = authRepository;
    this.sessionService = sessionService;
  }
  async execute(subject) {
    const user = await this.authRepository.findActiveByGoogleSubject(subject);
    if (!user) throw Object.assign(new Error('Identity is not provisioned'), { code: 'IDENTITY_NOT_PROVISIONED' });
    const session = await this.sessionService.create(user);
    return { user, ...session };
  }
}
