const InvitationModule = require("./invitation.service");


// INVITATION SECTION
exports.inviteAdmin = async (info) => await InvitationModule.invite(info);
exports.findInvitation =  async (ref) => await InvitationModule.findInvitationByToken(ref);
exports.deleteInviteByToken = async (token) => await InvitationModule.removeInvitationByToken(token)
exports.deleteInviteByEmail = async (email) => await InvitationModule.removeInvitationByEmail(email)
exports.getInvites = async (search) => await InvitationModule.invitations(search);
exports.deleteInvite = async (id) => await InvitationModule.removeInvitation(id)