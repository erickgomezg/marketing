export class EmailOutboxDispatcher {
  constructor({ userRepository, encryptor, emailProvider }) {
    this.userRepository = userRepository;
    this.encryptor = encryptor;
    this.emailProvider = emailProvider;
    this.running = false;
  }

  async dispatchPending() {
    if (this.running) return;
    this.running = true;
    try {
      const result = await this.userRepository.outbox('claim');
      for (const row of result.recordset || []) {
        try {
          const message = this.encryptor.decrypt(row.PayloadEncrypted);
          await this.emailProvider.send(message);
          await this.userRepository.outbox('sent', { outboxId: row.OutboxId });
        } catch {
          await this.userRepository.outbox('failed', { outboxId: row.OutboxId, errorCode: 'EMAIL_DELIVERY_FAILED' }).catch(() => {});
        }
      }
    } finally {
      this.running = false;
    }
  }
}
