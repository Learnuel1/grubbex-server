const SubscriptionModel = require("../../models/subscription.model");

exports.create = async (info) => {
  try {
    const exist = await SubscriptionModel.findOne({email:info.email});
    if(exist && info?.subscribe) { 
      if ( info.subscribe === exist.subscribe) return {error: "Email is already subscribed"}
      exist.subscribe = info.subscribe;
    return  exist.save();
    } else if (exist && info.waitingList) {
      if(info.waitingList === exist.waitingList ) return {error: "Email is already enlisted"}
    }
    return await SubscriptionModel.create({...info});
  } catch (error) {
    return [error];
  }
}
exports.delete = async (info) => 
{
  try {
    const exist = await SubscriptionModel.findOne({email: info.email});
    if(!exist) return {error: "Record does not exist"};
    return await SubscriptionModel.deleteOne({_id:exist._id});
  } catch (error) {
    return {error};
  }
}

exports.search = async (search) => {
  try {
    return await SubscriptionModel.find(search).select(`id email createdAt updatedAt -_id`).exec();
  } catch (error) {
    return {error};
  }
}
exports.update = async (info) => {
  try {
    const sub = await SubscriptionModel.findOne({email: info.email}).exec();
    if(!sub) return {error: "Subscription does not exist"};
    if(sub && sub.subscribe === false) return {error: "You already unsubscribed"}
    else if(sub && sub.waitingList ===false) return {error: "You already left the wait list"} 
  sub.subscribe = info.subscribe;
  return sub.save();
  } catch (error) { 
    return {error};
  }
}