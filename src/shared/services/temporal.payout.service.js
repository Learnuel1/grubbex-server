const TemporalTransferModel = require("../../models/temportal.payout.model")

exports.createTemporalTransfer = async (info) => {
    try {
        await TemporalTransferModel.findOneAndDelete({transferCode:info.transferCode});
        return await TemporalTransferModel.create({...info});
    } catch (error) {
        return {error: error.message }
    }
};
exports.findATemporalTransfer = async (query) => {
    try {
        return await TemporalTransferModel.findOne(query);
    } catch (error) {
         return {error: error.message }
    }
}
exports.findTemporalTransfers = async (query) => {
    try {
        return await TemporalTransferModel.find(query);
    } catch (error) {
         return {error: error.message }
    }
}
exports.deleteATemporalTransferByTransferCode = async (transferCode) => {
    try {
        const temExist = await TemporalTransferModel.findOne(transferCode);
        if(!temExist) return {error: "Transfer code does not exist"};
        return await TemporalTransferModel.findOneAndDelete({transferCode});
    } catch (error) {
        return {error: error.message }
    }
}