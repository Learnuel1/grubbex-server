const { CONSTANTS } = require("../config");
const { KYCModel } = require("../models/kyc.model");

exports.update = async(info) => {
  try{
    let update;
    let completed = 0;
    if(info.profile){
      const KYC = await KYCModel.findOne({user:info.user}).exec();
      if(!KYC)
      update = await KYCModel.create({...info,  $set: {
        profile: info.profile,
      }})
      else{
        update = await KYCModel.findOneAndUpdate({user:info.user},{
          $set: {
            profile: info.profile,
          }
        }, {returnOriginal: false}).exec();
      }
    }
    if(info.documents){
      const KYC = await KYCModel.findOne({user:info.user}).exec();
      if(!KYC){
        update = await KYCModel.create({...info,  $set: {
          profile: info.profile,
        }});
  }
      else{
        update = await KYCModel.findOneAndUpdate({user:info.user},{
          $addToSet: {
            documents: info.documents,
          }
        },{returnOriginal: false}).exec();
      }
    }
    if(info.bankDetails){
      const KYC = await KYCModel.findOne({user:info.user}).exec();
      if(!KYC)
      update = await KYCModel.create({...info, $set: {
        bankDetails: info.bankDetails,
      } });
      else{
        update = await KYCModel.findOneAndUpdate({user:info.user},{
          $addToSet: {
            bankDetails: info.bankDetails,
          }
        },{returnOriginal: false}).exec();
      }
    }
    if(info.location){
      update = await KYCModel.findOneAndUpdate({user:info.user},{
          location: info.location,
      },{returnOriginal: false}).exec();
    } else {
      update = await KYCModel.findOneAndUpdate({user:info.user},{
         location: info.location,
      },{returnOriginal: false}).exec();
    }
    
    const {profile, documents, bankDetails} = update;
      if(profile.length > 0){
        profile.forEach((cur) => {
          if(cur.imageUrl && cur.imageId && cur.startDate) {
            completed++;
            return onBoarded = true;
          }
        })
      } 
      if(documents.length > 0){
        documents.forEach((cur) => {
          if(cur.imageUrl && cur.imageId && cur.name && cur.docId) {
            completed++;
            return onBoarded = true;
          }
        })
      } 
      if(bankDetails.length > 0){
        bankDetails.forEach((cur) => {
          if(cur.accountNumber && cur.accountName && cur.bankName) {
            completed++;
            return onBoarded = true;
          }
        })
      }
      update.onBoarded = false;
      if(completed === 4)  update.onBoarded = true;
      update.save();
    return update
  }catch(error){
    if(error.name === "ValidationError" || error.name === "CastError") return {error: "Invalid data"};
    return {error};
  }
}
exports.checkKYC = async (user) => {
  try{
    return await KYCModel.findOne({user}).select("-_id -__v -createdAt -updatedAt -user").exec();
  }catch(error) {
    return {error};
  }
}
exports.KYC = async (user) => {
  try{
    return await KYCModel.findOne({user}).select("-_id -__v -createdAt -updatedAt -user").exec();
  }catch(error) {
    return {error};
  }
}

exports.updateStatus = async (user, info)=> {
  try{
    let completed = 0;
    const findKYC = await  KYCModel.findOne({user}).select(" -__v -createdAt -updatedAt").exec();
    if(!findKYC) return {error: "User does not exist"}
    const doc = findKYC.documents.find(x => x.docId === info.docId);
    if(!doc) return {error: "Document does not exist"}
    const otherDoc = findKYC.documents.filter(x => x.docId !== info.docId);
    doc.status = info.status;
    otherDoc.push(doc);
const {profile, documents, bankDetails} = findKYC;
      if(profile.length > 0 ){
        profile.forEach((cur) => {
          if(cur.imageUrl && cur.imageId && cur.startDate && cur.status === CONSTANTS.KYC_STATUS[2]) {
            completed++;
            return onBoarded = true;
          }
        })
      } 
      if(documents.length > 0){
        documents.forEach((cur) => {
          if(cur.imageUrl && cur.imageId && cur.name && cur.docId && cur.status === CONSTANTS.KYC_STATUS[2]) {
            completed++;
            return onBoarded = true;
          }
        })
      } 
      if(bankDetails.length > 0){
        bankDetails.forEach((cur) => {
          if(cur.accountNumber && cur.accountName && cur.bankName) {
            completed++;
            return onBoarded = true;
          }
        })
      }
      findKYC.onBoarded = false;
      findKYC.documents = otherDoc;
      if(completed === 4)  update.onBoarded = true;
      return findKYC.save();
  }catch(error){
    return {error};
  }
}