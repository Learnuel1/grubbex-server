const { CONSTANTS } = require("../config");
const SettingModel = require("../models/setting.model")

exports.updateSettingNotification = async (info) => {
    try{
        const data  = await SettingModel.find({});
        const target = info.target;
        delete info.target; 
        const findSection = data[0]?.[target]; 
        if(!findSection){ 
            const save = await SettingModel.create({...data});
            save[target].push(info);
           return save.save();
        }else{
            let find, findOthers;
            if(target === CONSTANTS.SETTING_FIELDS_OBJ.TYPE.notification){
              find = findSection.find(x => x.name === info.name);
              findOthers = findSection.filter(x => x.name !== info.name); 
            if(find){
                if(find.type === info.type) throw new Error("Notification already set")
                find.type = info.type;
            findOthers.push(find); 
            data[0].target = findOthers 
            } else {
                findOthers.push(info) 
            }
        } else if (target === CONSTANTS.SETTING_FIELDS_OBJ.TYPE.userManagement){ 
              find = findSection.find(x => x.accountType === info.accountType);
              findOthers = findSection.filter(x => x.accountType !== info.accountType);
            if(find){
                if(find.permission === info.permission) throw new Error("User management Permission already set")
                find.permission = info.permission;
            findOthers.push(find); 
            data[0].target = findOthers 
            } else {
                findOthers.push(info) 
            }
        } else if (target === CONSTANTS.SETTING_FIELDS_OBJ.TYPE.emailTemplates){
              find = findSection.find(x => x.name === info.name);
              findOthers = findSection.filter(x => x.name !== info.name);
            if(find){
                if(find.template === info.template) throw new Error("Email template already set")
                find.template = info.template;
            findOthers.push(find); 
            data[0].target = findOthers 
            } else {
                findOthers.push(info)
        }
    }else if( target === CONSTANTS.SETTING_FIELDS_OBJ.TYPE.payoutDuration) {
            find = findSection.find(x => x.name === info.name);
            findOthers = findSection.filter(x => x.name !== info.name);
            if(find) if(find.name === info.name) throw new Error(`${find.name} payout duration already set`);

            findOthers.push(info);
        }
             return await SettingModel.findByIdAndUpdate({_id:data[0]._id}, {$set:{[target]: findOthers}})
        }
         
    } catch (error) {
        return {error: error.message}
    }
}
exports.getNotificationSetting = async () => {
    try {
        const data  = await SettingModel.find({});
        return data[0]?.notification || [];
    } catch (error) {
        return {error: error.message}
    }
}
exports.getUserManagementSetting = async (query = {}) => {
    try {
        const data  = await SettingModel.find(query).select("-_id -__v -createdAt -updatedAt -userManagement._id -userManagement.createdBy");
        return data[0]?.userManagement || [];
    } catch (error) {
        return {error: error.message}
    }
}
exports.getNotificationSetting = async (query = {}) => {
    try {
        const data  = await SettingModel.find(query).select("-_id -__v -createdAt -updatedAt -notification._id -notification.createdBy");
        return data[0]?.notification || [];
    } catch (error) {
        return {error: error.message}
    }
}
exports.getEmailTemplateSetting = async (query = {}) => {
    try {
        const data  = await SettingModel.find(query).select("-_id -__v -createdAt -updatedAt -emailTemplates._id -emailTemplates.createdBy");
        if(data[0]?.emailTemplates && data[0].emailTemplates.length > 0) {
            let name = query.name ? query.name : "";
            const find = name ? data[0].emailTemplates.find(x => x.name === query.name): data[0].emailTemplates;
            return find || [];
        } 
    } catch (error) {
        return {error: error.message}
    }
}
 
exports.getPayoutDuration = async (query = {}) => {
    try {
        const data  = await SettingModel.find().select("-_id -__v -createdAt -updatedAt -payoutDuration._id -payoutDuration.createdBy");
        return data[0]?.payoutDuration || [];
    } catch (error) {
        return {error: error.message}
    }
}