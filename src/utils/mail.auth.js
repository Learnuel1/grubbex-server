const { BrevoClient } = require("@getbrevo/brevo");
const config = require("../config/env");
const {google} = require("googleapis")
require("dotenv").config();

exports.mailAuth = {
  service: `smtp.gmail.com`,
  auth: {
    user: config.MAIL_USER,
    pass: config.MAIL_PASS,
  },
};



const oAuth2Client = new google.auth.OAuth2(config.GOOGLE_CLIENT_ID,config.GOOGLE_CLIENT_SECRET,config.GOOGLE_REDIRECT_URL);
oAuth2Client.setCredentials({refresh_token: config.GOOGLE_REFRESH_TOKEN});
// const getAccessToken = ()=>  oAuth2Client.getAccessToken().then(data=>{
//   console.log(data)
// })
exports.getOAuthMailAuth  = async ()=> {
  const res = await oAuth2Client.getAccessToken();
const accessToken = res && res.token ? res.token : res;
  return {
  service: 'gmail',
  auth: {
    type: 'OAuth2',
    user: config.MAIL_USER,
    clientId: config.GOOGLE_CLIENT_ID,
    clientSecret: config.GOOGLE_CLIENT_SECRET,
    refreshToken: config.GOOGLE_REFRESH_TOKEN,
    accessToken
  },
}
}
const brevo = new BrevoClient({
  apiKey: config,
  timeoutInSeconds: 30,
  maxRetries: 3,
});



exports.domainMail = {
  mail: () => config.MAIL_USER,
 
};
