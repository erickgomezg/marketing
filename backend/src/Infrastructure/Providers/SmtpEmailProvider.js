import nodemailer from 'nodemailer';

export class SmtpEmailProvider {
  async send(message) {
    const host = process.env.SMTP_HOST;
    const from = process.env.SMTP_FROM;
    if (!host || !from) throw new Error('SMTP_HOST and SMTP_FROM are not configured');
    const port = Number(process.env.SMTP_PORT || 587);
    const transporter = nodemailer.createTransport({
      host, port, secure: port === 465,
      auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD } : undefined,
    });
    try {
      await transporter.sendMail({ from, to: message.to, subject: message.subject, text: message.text, html: message.html });
    } finally {
      transporter.close();
    }
  }
}
