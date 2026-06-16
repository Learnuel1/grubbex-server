const logger = require("../../logger");
const { META } = require("../utils/actions");
const { APIError } = require("../utils/apiError"); 
const { sendEMailHandler } = require("../utils/interface");

exports.sendMail = async (req, res, next) => {
  try{
    const { email, subject, message, url} = req.body;
    const {files} = req;
    if (!email || email.length === 0) return next(APIError.badRequest("email is required")); 
    if(!subject) return next(APIError.badRequest("Provide email subject"));
    if(!message) return next(APIError.badRequest("Provide email message"));
    const attach = [];
    if(files && files.length > 0){
      files.forEach((cur) =>{
        attach.push({name:cur.originalname, path: cur.path});
      })
    }; 
    if(url) attach.push({name:url, path: url})
    const result = await sendEMailHandler(
      email,
     subject, 
      message,
      attach
    );
    if (result.error)
      return next(APIError.badRequest('Email failed to send, try again.'));
    logger.info('Email sent successfully', { service: META.MAIL});
    res.status(200).json({success:true, msg: "Email sent successfully"})
  } catch (error) {
    next (error);
  }
}