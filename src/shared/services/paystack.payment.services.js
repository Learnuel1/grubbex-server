const https = require('https');
const { options, paystackClient } = require('../../utils/paystack.auth');
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
            
                const response = await paystackClient.get(
                  `/transaction/verify/${reference}`);  
                const transaction = response.data.data;
                if (response.data.status && transaction.status === 'success') return transaction;
                
                return {error: response.data || 'Payment verification failed.'};
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

 exports.createRecipient = async (name, accountNumber, bankCode) => {
  try {
    const response = await paystackClient.post(
      '/transferrecipient',
      {
        type: 'nuban',
        name: name,
        account_number: accountNumber,
        bank_code: bankCode,
        currency: 'NGN'
      } 
    );

    if (response.data.status) { 
      return response.data.data.recipient_code;
    } else {
      throw new Error(response.data.message);
    }
  } catch (error) {
    return {error: error.response?.data || error.message};
  }
}
exports.initiateTransfer = async (recipientCode, amount, reason = 'Payout')  =>{
  try {
    const response = await paystackClient.post(
      '/transfer',
      {
        source: 'balance',             // fund from your balance
        amount: amount * 100,          // amount in kobo (e.g., 5000 = ₦50.00)
        recipient: recipientCode,
        reason: reason
      }
      );

    if (response.data.status) {
    
      return {
        transferCode: response.data.data.transfer_code,
        otpRequired: response.data.data.otp_required, // true if OTP is needed
        // other fields...
      };
    } else {
      throw new Error(response.data.message);
    }
  } catch (error) {
    return {error: error.response?.data || error.message};
  }
}
exports.finalizeTransfer = async (transferCode, otp) => {
  try {
    const response = await paystackClient.post(
      '/transfer/finalize_transfer',
      {
        transfer_code: transferCode,
        otp: otp
      }
      );

    if (response.data.status) {
      return response.data.data;
    } else {
      throw new Error(response.data.message);
    }
  } catch (error) {
    return {error: error.response?.data || error.message};
  }
}
exports.getTransferStatus =async (transferCode) => {
  try {
    const response = await paystackClient.get(
      `/transfer/${transferCode}` );

    if (response.data.status) { 
      return response.data.data;
    } else {
      throw new Error(response.data.message);
    }
  } catch (error) {
    console.error('Error fetching transfer status:', error.response?.data || error.message);
    throw error;
  }
}
exports.payStackBankList = async (currency = "NGN") => {
  try {
      const response = await paystackClient.get(`/bank?currency=${currency}`)
      if (response.data.status) {
      const banks = response.data.data;
     const simplified = banks.map(({id, code, name }) => ({id, code, name }));
      return simplified;  
    } else {
      throw new Error(response.data.message);
    }
  } catch (error) {
    return {error: error.message}
  }
}
exports.getAllTransfers = async (perPage = 50, page = 1) => {
  try {
    const response = await paystackClient.get('/transfer', {
      params: { perPage, page }
    });
    
    if (response.data.status) {
      return response.data.data; // Array of transfer records
    } else {
      throw new Error(response.data.message);
    }
  } catch (error) {
    return {error: error.response?.data || error.message};
  }
} 

// 1. Validate a customer (full KYC)
async function validateCustomerWithBVN(customerCode, bvn, accountNumber, bankCode) {
  try {
    const response = await paystackClient.post(
      `/customer/${customerCode}/identification`,
      {
        country: 'NG',
        type: 'bvn',
        bvn: bvn,
        bank_account_number: accountNumber,
        bank_code: bankCode
      }
    );

    if (response.data.status) {
      // Wait for webhook callback
      return response.data;
    } else {
      throw new Error(response.data.message);
    }
  } catch (error) {
    return {error: error.response?.data || error.message}
  }
}

// 2. Resolve BVN (get details)
exports.resolveBVN = async (bvn) => {
  try {
    const response = await paystackClient.get(`/bvn/resolve?bvn=${bvn}`);
    if (response.data.status) {
      return response.data.data;
    } else {
      throw new Error(response.data.message);
    }
  } catch (error) {
  return {error: error.response?.data || error.message};
  }
}

// 3. Match BVN to account
exports.matchBVN = async(bvn, accountNumber, bankCode) => {
  try {
    const response = await paystackClient.get(
      `/bvn/match?bvn=${bvn}&account_number=${accountNumber}&bank_code=${bankCode}`
    );
    
    if (response.data.status) {
      return response.data.data; // { matched: true/false, account_name: ... }
    } else {
      throw new Error(response.data.message);
    }
  } catch (error) {
  return {error: error.response?.data || error.message};
  }
}
exports.resolveBankAccount = async (account_number, bank_code) => {
  try{
    const resolveResponse = await paystackClient.get('/bank/resolve', {
      params: {
        account_number, 
        bank_code,
        currency: 'NGN'
      },
    });
        if (!resolveResponse.data.status) throw new Error(resolveResponse.data.message);
      const accountName = resolveResponse.data.data.account_name;
    return resolveResponse.data.data;
  } catch (error) {
    return {error: error.message };
  }
}