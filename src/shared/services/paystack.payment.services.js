const https = require('https');
const { options } = require('../../utils/paystack.auth');
const { PAYSTACK_ROUTES, PAYSTACK_METHOD } = require('../../utils/paystack.routes');
const TemporalTransactionModel = require('../../models/temporal.transaction');
exports.payWithCard = async (payload) => {
    const params = JSON.stringify({
        email: payload.email, 
         amount: payload.amount*100,
         metadata: {
            ...payload
         }
    });

    return new Promise((resolve, reject) => {
        let data = '';
        const req = https.request(options(), res => {

            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (err) {
                    reject({error: err?.message || err});
                }
            });
        });

        req.on('error', error => {
            reject({ error: error.message });
        });

        req.write(params);
        req.end();
        if(resolve) return data;
    });
};
exports.verifyTransaction = async (payload) => {
    return new Promise((resolve, reject) => {
        let data = ''; 
        const req = https.request(options(PAYSTACK_ROUTES.verify_transaction, PAYSTACK_METHOD.GET, {reference:payload.reference}), res => {
            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (err) {
                    reject({ error: err?.message || err });
                }
            });
        });

        req.on('error', error => {
            reject({ error: error.message });
        });

        req.end();
    });
        
    };

exports.createTemporalTrans = async (info) => {
        try{
            await TemporalTransactionModel.findOneAndDelete({id:info.id});
            return await  TemporalTransactionModel.create({...info})
        } catch (error) {
            return {error}
        }
}
exports.findTemporalTransaction = async (query) => {
    try{
        return await TemporalTransactionModel.findOne(query)
    } catch (error) {
        return {error}
    }
}
exports.deleteTemporalTransaction = async (query) => {
    try{
        return await TemporalTransactionModel.findOneAndDelete(query)
    } catch (error) {
        return {error}
    }
}