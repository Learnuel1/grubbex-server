const { CONSTANTS } = require("../config");
const PromotionModel = require("../models/promotion.model");

exports.create = async (details) => {
    try { 
        return await PromotionModel.create({...details});
    }
    catch (error) {
        return {error: error.message};
    } 
}

exports.delete = async ( id) => {
    try{
    const promotionExist = await PromotionModel.findOne({id});
    if(!promotionExist) return {error: "Promotion not found"};
    return await PromotionModel.findByIdAndDelete(promotionExist._id);
    } catch (error) {
        return {error: error.message}
    }
}
exports.promotionExist = async (id) => {
    try {
        return await PromotionModel.findOne({id});
    } catch (error) {
        return {error: error.message};
    }
}
exports.update = async (id, details) => {

    try {
        return await PromotionModel.findOneAndUpdate({id}, {details});
    } catch (error) {
        return {error: error.message };
    }
}
exports.updateStatus = async (id, status) => {
    try{
        return await PromotionModel.findOneAndUpdate({id},{status});
    } catch (error ) {
        return {error: error.message};
    }
}
exports.activePromotions = async () => {
    try {
        return await PromotionModel.find({
            status: "active",
            endDate: { $gte: new Date() }
        }).select("-_id -__v -status -account -image.id -startDate -endDate");
    } catch (error ){
        return {error: error.message}
    }
}
exports.inActivePromotions = async () => {
    try {
        return await PromotionModel.find({status:"inactive"}).select( "-_id -__v -status -account -image.id -startDate -endDate");
    } catch (error ){
        return {error: error.message}
    }
}
exports.promotions = async (query) => {
    try {
        return await PromotionModel.find(query).populate([{
            path: "account",
            model: "Account",
            select: "firstName lastName userId type -_id",
        }]).select("-_id -__v");
    } catch (error ){
        return {error: error.message}
    }
}