const AccountModel = require("../../../models/account.model");
const InvitationModel = require("../../../models/invitation.models");

exports.invite = async (info) => {
  try {
    const emailExist = await InvitationModel.findOne({email:info.email});
    if(emailExist) return {error:"Invite already exist"}
    const accountExist = await AccountModel.findOne({email:info.email});
    if(accountExist) return {error: "You can't invite existing user"}
    return await InvitationModel.create({...info});
  } catch (error) {
    return {error};
  }
}

exports.findInvitationByToken = async (id) => {
  try {
    return await InvitationModel.findOne({id});
  } catch (error) {
    return {error};
  }
}

exports.removeInvitationByToken = async (token) => {
  try {
    return await InvitationModel.findOneAndDelete({token});
  } catch (error) {
    return {error}
  }
}

exports.removeInvitationByEmail = async (email) => {
  try {
    return await InvitationModel.findOneAndDelete({email});
  } catch (error) {
    return {error}
  }
}
exports.removeInvitation = async (id) => {
  try {
    return await InvitationModel.findOneAndDelete({id});
  } catch (error) {
    return {error}
  }
}
exports.invitations = async (search) => {
  try {
    return await InvitationModel.find(search).select("-_id -__v -token");
  } catch (error) {
    return {error}
  }
}