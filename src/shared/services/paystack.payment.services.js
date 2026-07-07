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

 exports.createRecipient = async (name, accountNumber, bankCode) => {
  try {
    const response = await axios.post(
      'https://api.paystack.co/transferrecipient',
      {
        type: 'nuban',
        name: name,
        account_number: accountNumber,
        bank_code: bankCode,
        currency: 'NGN'
      },
      {
        headers: {
          Authorization: `Bearer ${config.PAYSTACK_SECRETE_KEY}`,
          'Content-Type': 'application/json'
        }
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
    const response = await axios.post(
      'https://api.paystack.co/transfer',
      {
        source: 'balance',             // fund from your balance
        amount: amount * 100,          // amount in kobo (e.g., 5000 = ₦50.00)
        recipient: recipientCode,
        reason: reason
      },
      {
        headers: {
          Authorization: `Bearer ${config.PAYSTACK_SECRETE_KEY}`,
          'Content-Type': 'application/json'
        }
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
    throw error;
  }
}
exports.finalizeTransfer = async (transferCode, otp) => {
  try {
    const response = await axios.post(
      'https://api.paystack.co/transfer/finalize_transfer',
      {
        transfer_code: transferCode,
        otp: otp
      },
      {
        headers: {
          Authorization: `Bearer ${config.PAYSTACK_SECRETE_KEY}`,
          'Content-Type': 'application/json'
        }
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
    const response = await axios.get(
      `https://api.paystack.co/transfer/${transferCode}`,
      {
        headers: { Authorization: `Bearer ${config.PAYSTACK_SECRETE_KEY}` }
      }
    );

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
      console.log('Verification initiated:', response.data.message);
      // Wait for webhook callback
      return response.data;
    } else {
      throw new Error(response.data.message);
    }
  } catch (error) {
    console.error('BVN validation failed:', error.response?.data || error.message);
    throw error;
  }
}

// 2. Resolve BVN (get details)
async function resolveBVN(bvn) {
  try {
    const response = await paystackClient.get(`/bvn/resolve?bvn=${bvn}`);
    
    if (response.data.status) {
      return response.data.data;
    } else {
      throw new Error(response.data.message);
    }
  } catch (error) {
    console.error('BVN resolution failed:', error.response?.data || error.message);
    throw error;
  }
}

// 3. Match BVN to account
async function matchBVN(bvn, accountNumber, bankCode) {
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
    console.error('BVN match failed:', error.response?.data || error.message);
    throw error;
  }
}
