export class AccessService {
  constructor({ accessRepository, userRepository, userAdministration }) {
    Object.assign(this, { accessRepository, userRepository, userAdministration });
  }
  async listUsers(actorId) { return (await this.userRepository.manage('list', { actorUserId: actorId })).recordset; }
  async getUser(actorId, targetId) { return (await this.userRepository.manage('get', { actorUserId: actorId, targetUserId: targetId })).recordset[0] || null; }
  createUser(actorId, input) { return this.userAdministration.createUser(actorId, input); }
  updateUser(actorId, targetId, input) { return this.userAdministration.updateUser(actorId, targetId, input); }
  changeRole(actorId, targetId, role, assignments) { return this.userAdministration.setRole(actorId, targetId, role, assignments); }
  resendInvitation(actorId, targetId) { return this.userAdministration.resendInvitation(actorId, targetId); }
  revokeInvitation(actorId, targetId) { return this.userAdministration.revokeInvitation(actorId, targetId); }
  setUserActive(actorId, targetId, active) { return this.accessRepository.setUserActive(actorId, targetId, active); }
  listBusinesses(userId) { return this.accessRepository.listBusinesses(userId); }
  listSocialAccounts(userId, businessId, platformId) { return this.accessRepository.listSocialAccounts(userId, businessId, platformId); }
  listPermissions(actorId, targetId) { return this.accessRepository.listPermissions(actorId, targetId); }
  savePermissions(actorId, targetId, assignments) { return this.accessRepository.savePermissions(actorId, targetId, assignments); }
  assignmentOptions(actorId) { return this.userRepository.manage('assignment_options', { actorUserId: actorId }).then((result) => result.recordset); }
}
