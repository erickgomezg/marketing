export class User {
  constructor({ userId, email, displayName, role, isActive }) {
    if (!userId || !email || !displayName || !['Administrador', 'Viewer'].includes(role)) {
      throw new TypeError('Invalid user identity');
    }
    this.userId = userId;
    this.email = email;
    this.displayName = displayName;
    this.role = role;
    this.isActive = Boolean(isActive);
  }
}
