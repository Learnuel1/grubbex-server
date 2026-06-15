const { CONSTANTS } = require("../../config");
const FaqModel = require("../../models/faq.model");

const createFAQ = async (faqData) => {
    try {
        return await FaqModel.create({...faqData});
    } catch (error) {
        if (error.code === 11000) {
            return { error: "FAQ Category already exist" };
        }
        return { error: error.message }
    }
};

const getFAQById = async (id, userType) => {
    try {
        if(userType && userType === CONSTANTS.ACCOUNT_TYPE_OBJ.admin){
            return await FaqModel.findOne({id}).populate([{
                model: "Account",
                path: "account",
                select: "userId firstName lastName type role -_id"
            }]).select("-_id -__v");
        }else{
            return await FaqModel.findOne({id}).select("-_id -__v -updatedAt -createdAt");
        }
    } catch (error) {
        return {error: error.message}
    }
};
const getFAQ = async (query, userType) => {
    try {
        if(userType && userType === CONSTANTS.ACCOUNT_TYPE_OBJ.admin){
            return await FaqModel.find(query).populate([{
                model: "Account",
                path: "account",
                select: "userId firstName lastName type role -_id"
            }]).select("-_id -__v");
        }else{
            return await FaqModel.find(query).select("-_id -__v -createdAt -account -updatedAt").sort({createdAt: -1});
        }
        } catch (error) {
       return {error: error.message}
    }
};

const updateFAQ = async (id, updateData) => {
    try { 
        const exist = await FaqModel.findOne({id});
        if(!exist) return {error: "FAQ does not exist"};
        return await FaqModel.findOneAndUpdate({id}, {...updateData}, {returnOriginal:false});
    } catch (error) {
        if (error.code === 11000) {
            return { error: "FAQ Category already exist" };
        }
        return {error: error.message}
    }
};

const deleteFAQ = async (id) => {
    try {
       return await FaqModel.findOneAndDelete({id});
    } catch (error) {
        throw new Error(error.message);
    }
};

module.exports = {
    createFAQ,
    getFAQById,
    updateFAQ,
    deleteFAQ,
    getFAQ,
};