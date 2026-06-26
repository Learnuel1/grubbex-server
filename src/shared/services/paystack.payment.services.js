const https = require('https');
const { options } = require('../../utils/paystack.auth');
const { PAYSTACK_ROUTES, PAYSTACK_METHOD } = require('../../utils/paystack.routes');
const TemporalTransactionModel = require('../../models/temporal.transaction');
const { default: axios } = require('axios');
const config = require('../../config/env');
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


exports.verifyTransaction = async (reference) => {
        try{
             if (!reference) return next(APIError.badRequest('Missing transaction reference'));
            
                const response = await axios.get(
                  `https://api.paystack.co/transaction/verify/${reference}`,
                  {
                    headers: { Authorization: `Bearer ${config.PAYSTACK_SECRETE_KEY}` },
                  }
                );  
                const transaction = response.data.data;
                if (response.data.status && transaction.status === 'success') return transaction;
                
                return {error: res.data || 'Payment verification failed.'};
        } catch(error) {
            return {error:error.message }
        }
    }
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