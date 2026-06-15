const logger = require("../../logger");
const { subscribe, removeSubscription, searchSubscription, updateSubscription } = require("../services/interface");
const { META } = require("../utils/actions");
const { APIError } = require("../utils/apiError");
const { shortIdGen } = require("../utils/Generator");
const { invitationMailHandler } = require("../utils/mailer");

exports.subscription = async (req, res, next) => {
  try {
    const {email} = req.body;
    const info = {
      email,
      subscribe: true,
      id: shortIdGen(),
    }
      const sub = await subscribe(info);
      if(!sub) return next(APIError.badRequest("Subscription failed, try again"));
      if(sub?.error) return next(APIError.badRequest(sub.error));
      logger.info("Subscription created successfully", {meta:META.SUBSCRIPTION});
      // send email notification
      res.status(200).json({success: true, msg: "Subscription completed successfully"});
  } catch (error) {
    next(error);
  }
}
exports.waiting = async (req, res, next) => {
  try {
    const {email} = req.body;
    const info = {
      email,
      waitingList: true,
      id: shortIdGen(),
    }
      const sub = await subscribe(info);
      if(!sub) return next(APIError.badRequest("Waiting list failed, try again"));
      if(sub?.error) return next(APIError.badRequest(sub.error));
      logger.info("Waiting list created successfully", {meta:META.SUBSCRIPTION});
      // send email notification
      const message = `Thank you for subscribing to Grubbex waiting list! We're excited to have you on board and can't wait to share the launch date of our product with you.
      
      In the meantime, if you have any questions or need further assistance, please don't hesitate to reach out to us.`
      const title = "Your Subscription to Our Waiting List is Confirmed";
      const result = await invitationMailHandler(email, "Welcome to Grubbex!","", title, message, "Grubbex Team", "onboarding");
      if (result?.error)
        return next(APIError.badRequest('Wait-list mail failed to send'));
      logger.info('Wait-list mail sent successfully', {
        meta: META.MAIL,
      });
      res.status(200).json({success: true, msg: "Waiting list subscription completed successfully"});
  } catch (error) {
    next(error);
  }
}
exports.unSubscription = async (req, res, next) => {
  try {
    const {email} = req.body;
    const info = {
      email,
      subscribe: false,
    }
      const sub = await updateSubscription(info);
      if(!sub) return next(APIError.badRequest("Un-subscription failed, try again"));
      if(sub?.error) return next(APIError.badRequest(sub.error));
      logger.info("Subscription removed successfully", {meta:META.SUBSCRIPTION});
      res.status(200).json({success: true, msg: "Subscription removed successfully"});
  } catch (error) {
    next(error);
  }
}
exports.searchWaitingList = async (req, res, next) => {
  try {
    const {search} = req.query;
    let queryString = {
      $and:[
        {email: {$regex: new RegExp(search, "i")}},
        {waitingList: true}
      ]
    };
    if (!search) queryString = {waitingList: true}
    const searchResult = await searchSubscription(queryString);
    if(searchResult?.error) return next(APIError.badRequest(searchResult.error));
    logger.info("Searched waiting list successfully", {meta:META.SUBSCRIPTION})
    res.status(200).json({success: true, msg: `${searchResult.length === 0 ? "No record found" : "Found"}`, emails: searchResult});
  } catch (error) {
    next(error)
  }
}
exports.searchSubs = async (req, res, next) => {
  try {
    const {search} = req.query;
    let queryString = search
   
      queryString=  {
        $and:[
          {email: {$regex: new RegExp(search, "i")}},
          {subscribe: true}
        ]
      };
      if (!search) queryString = {subscribe: true}
    const searchResult = await searchSubscription(queryString);
    if(searchResult?.error) return next(APIError.badRequest(searchResult.error));
    logger.info("Searched subscription list successfully", {meta:META.SUBSCRIPTION})
    res.status(200).json({success: true, msg: `${searchResult.length === 0 ? "No record found" : "Found"}`, emails: searchResult});
  } catch (error) {
    next(error)
  }
}
exports.searchUnSubscribed = async (req, res, next) => {
  try {
    const {search} = req.query;
    let queryString = search
   
      queryString=  {
        $and:[
          {email: {$regex: new RegExp(search, "i")}},
          {subscribe: false}
        ]
      };
      if (!search) queryString = {subscribe: true}
    const searchResult = await searchSubscription(queryString);
    if(searchResult?.error) return next(APIError.badRequest(searchResult.error));
    logger.info("Searched unsubscribed list successfully", {meta:META.SUBSCRIPTION})
    res.status(200).json({success: true, msg: `${searchResult.length === 0 ? "No record found" : "Found"}`, emails: searchResult});
  } catch (error) {
    next(error)
  }
}