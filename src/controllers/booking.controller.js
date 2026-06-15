const { CONSTANTS } = require("../config");
const { createBooking, cancelBooking, getBookings, getItemById, getBookingById, acceptRejectBooking, getMuvaBookings, updateLocation, muvaLocation, getUserById, muvaDelivered, fundWallet } = require("../services");
const {APIError} = require("../utils/apiError");
const logger = require("../logger");
const { META } = require("../utils/actions");
const {  accessPath, cloudinary } = require("../utils/cloudinary");
const buildRes = require("../utils/responseBuilder");
const { availableBookings } = require("../services/booking.service");
const { bookingNotifyMailHandler } = require("../utils/mailer");

exports.bookMuva = async (req, res, next) => {
  try{ 
    if (req.userRole.toLowerCase() === CONSTANTS.ACCOUNT_TYPE[2].toLowerCase()) return next(APIError.unauthorized());
      const senderInfo = ["name","address", "landMark", "phone"];
      const {sender, recipient, items}  = req.body;
      for(const field of senderInfo)
      if(!sender[field]){
        return next(APIError.badRequest(`${field} is required`));
      };
      for(const field of senderInfo)
      if(!recipient[field]){
        return next(APIError.badRequest(`${field} is required`));
      };
      if (!items || items.length === 0) return next(APIError.badRequest("Provide item(s)"));
      if(isNaN(sender.phone)) return next(APIError.badRequest("Phone number must be digits"))
      if(isNaN(recipient.phone)) return next(APIError.badRequest("Phone number must be digits"))
      if(sender.alternatePhone){
        if(isNaN(sender.alternatePhone)) return next(APIError.badRequest("Phone number must be digits"))
      }
       const bookDetails = {
          ...sender, 
          recipient: [recipient],
        }
        bookDetails.items =[];
        if(items){
          for(const item of items){
          if(!item.itemTypeId) return next(APIError.badRequest("Invalid item data"))
          if(!item.quantity) return next(APIError.badRequest("Invalid item quantity"))
          if(!item.valueEstimate) return next(APIError.badRequest("Provide estimated value"))
          if(isNaN(item.valueEstimate)) return next(APIError.badRequest("Invalid estimated value"))
          if(!item.weight) return next(APIError.badRequest("Provide item(s) weight"))
          const find =  await  getItemById(item.itemTypeId);
          if(!find) return next(APIError.badRequest("Invalid item provided"));
          if(find.error) return next(APIError.badRequest(find.error));
          bookDetails.items.push({itemName:find.name,category:find.category, itemTypeId:find._id, quantity: item.quantity, weight:item.weight, valueEstimate:item.valueEstimate, category:find.category})
          }
        } 
        bookDetails.user= req.userId;
        if(req.body.images){
          const {images } = req.body;
        if(images.length === 0) return next(APIError.badRequest("Images can't be empty"));
        // check the format of the images
        // images.forEach(el =>{
        //   if(!CONSTANTS.IMAGE_FORMAT.includes(el.format)) return next(APIError.badRequest("An image format is invalid"));
        // });
        // save image
        bookDetails.images = [];
        for (const image of images) {
          const upload = await cloudinary.uploader.upload(image.imageData, {
            upload_preset:accessPath.preset,
            folder: accessPath.folder,
          });
          bookDetails.images.push({url:upload.secure_url, Id:upload.public_id})
          logger.info("Image uploaded successfully", {service: META.CLOUDINARY});
        }
      
      };
     const saveBooking = await createBooking(bookDetails)
     if(!saveBooking)  return next(APIError.badRequest("Booking failed, try again"));
     if(saveBooking.error)  return next(APIError.badRequest(saveBooking.error));
     const data = buildRes.buildBooking(saveBooking.toObject());
     const response = buildRes.commonResponse("Booking Created Successfully", data, "booking");
     logger.info("Booking created successfully", {service: META.BOOKING});
     // Send notification to muva
     res.status(201).json(response);
  }catch( error){
    next(error);
  }
}

exports.cancelMuva = async (req, res, next) => {
  try{
    const {bookId} = req.body;
    if(!bookId)  return next(APIError.badRequest("Book ID is required"));
    const cancel = await cancelBooking({user:req.userId, bookId});
    if(!cancel) return next(APIError.badRequest("Booking failed to cancel, try again"));
    if(cancel.error) return next(APIError.badRequest(cancel.error));
    res.status(200).json({success: true, msg: "Booking deleted successfully"});
  }catch(error){
    next(error);
  }
}
exports.muvas = async (req, res, next) => {
  try{
    const bookings = await getBookings(req.userId);
    if(!bookings || bookings.length === 0) return next(APIError.notFound("No Booking Found"));
    if(bookings.error) return next(APIError.badRequest(bookings.error));
    const response = buildRes.commonResponse("Found", bookings, "booking")
    res.status(200).json(response);
  }catch(error){
    next(error);
  }
}
exports.bookingById = async (req, res, next) => {
  try{
    if(req.userRole.toLowerCase() === CONSTANTS.ACCOUNT_TYPE[2].toLowerCase() && !req.onBoarded || req.onBoarded === false) return next(APIError.unauthorized("You need to complete profile setup"));
    const {bookId}  = req.query;
    let booking ;
   if(req.userRole.toLowerCase() === CONSTANTS.ACCOUNT_TYPE[2].toLowerCase())
     booking = await getBookingById(bookId);
    else booking = await getBookings(req.userId, bookId);
    if(!booking) return next(APIError.notFound(`No booking found for ${bookId}`));
    if(booking.error) return next(APIError.badRequest(booking.error));
    const response = buildRes.commonResponse("Found", booking, "booking")
    res.status(200).json(response);
  }catch(error){
    next(error);
  }
}
exports.bookings = async (req, res, next) => {
  try{
    if(req.userRole.toLowerCase() === CONSTANTS.ACCOUNT_TYPE[2].toLowerCase() && !req.onBoarded || req.onBoarded === false) return next(APIError.unauthorized("You need to complete profile setup"));
    const bookings = await getBookings(req.userId);
    if(!bookings || bookings.length === 0) return next(APIError.notFound("No Booking Found"));
    if(bookings.error) return next(APIError.badRequest(bookings.error));
    const response = buildRes.commonResponse("Found", bookings, "booking")
    res.status(200).json(response);
  }catch(error){
    next(error);
  }
}
exports.getAvailableBookings = async (req, res, next) => {
  try{
    if(!req.onBoarded || req.onBoarded === false) return next(APIError.unauthorized("You need to complete profile setup"));
    const bookings =  await availableBookings();
    if (!bookings || bookings.length === 0) return next(APIError.badRequest("No record found"));
    if (bookings.error) return next(APIError.badRequest(bookings.error));
    const response = buildRes.commonResponse("Found", bookings, "booking");
    logger.info("Available booking retrieved successfully", {service: META.BOOKING});
    res.status(200).json(response);
  }catch(error){
    next(error)
  }
}
exports.bookingAvailableStatus = async (req, res, next) => {
  try{
    const {bookId, status} = req.query;
    if(!req.onBoarded || req.onBoarded === false) return next(APIError.unauthorized("You need to complete profile setup"));
    if (!bookId) return next(APIError.badRequest("Book ID is required"));
    if (!status) return next(APIError.badRequest("Book status is required"));
    if (!CONSTANTS.BOOK_STATUS.includes(status))  return next(APIError.badRequest("Invalid book status"));
    const update   = await acceptRejectBooking(bookId, req.userId, status);
    if (!update) return next(APIError.badRequest(`Booking: ${bookId} does not exist`));
    if (update.error) return next(APIError.badRequest(update.error));
    logger.info("Booking isAvailable status updated",  {service: META.BOOKING});
    // send email to notify user
    // if(status.toLowerCase() === CONSTANTS.BOOK_STATUS[3]){
      // EMAIL HANDLER 
      const muvaInfo = await getUserById(update.muva);
      const userInfo = await getUserById(update.user);
      const info ={
        bookId: update.bookId,
        fullname: update.name,
        receiver:  update.recipient[0].name,
        receiverContact: update.recipient[0].phone,
        receiverAddress: update.recipient[0].address,
        muvaId: muvaInfo?.userId, 
      }
      info.title  = status.toLowerCase() == CONSTANTS.BOOK_STATUS[3] ? "BOOKING ACCEPTED" : "BOOKING CANCELLED" 
      const notify =    await bookingNotifyMailHandler(userInfo.email, "Booking Notification", info)
      if(notify.error) logger.info(notify.error, {service:META.MAIL})
      else logger.info("Booking status update mail sent", {service:META.MAIL})
    res.status(200).json({success: true, msg: `Booking ${status}ed successfully`});
  // }
  }catch(error) {
    return next(error)
  }
}
exports.muvaBookings = async (req, res, next) => {
  try{
    let status  = null;
    if( req.query?.status){
      if (!CONSTANTS.BOOK_STATUS.includes(req.query.status)) return next(APIError.unauthorized("Invalid booking status"));
      status = req.query.status;
    }
    if(!req.onBoarded) return next(APIError.unauthorized("You need to complete profile setup"));
    const bookings   = await getMuvaBookings(req.userId, status);
    if (!bookings || bookings.length === 0) return next(APIError.badRequest("No Record found"));
    if (bookings.error) return next(APIError.badRequest(bookings.error));
    logger.info("Muva Bookings retrieved successfully",  {service: META.BOOKING});
    const response = buildRes.commonResponse("Found", bookings, "booking");
    res.status(200).json(response);
  }catch(error) {
    return next(error)
  }
}

exports.currentLocation = async (req, res, next) => {
  try{
    const {location, bookId} = req.body;
    if (!location  || location.length <1) return next(APIError.badRequest("Location info is required"));
    if (!bookId) return next(APIError.badRequest("Booking ID is required"));
    const check = await getBookingById(bookId);
    if(!check) return next(APIError.badRequest(`Booking: ${bookId} does not exist`));
    const details = {user:check.user, bookId, muva: req.userId, location};
    const update = await updateLocation(details);
    if(!update) return next(APIError.badRequest("Location update failed, try again"));
    if(update.error) return next(APIError.badRequest(update.error));
    logger.info("Muva location updated successfully", {service: META.BOOKING});
    res.status(200).json({success: true, msg: "Location updated successfully"});
  }catch(error){
    next(error);
  }
}
exports.getLocation = async (req, res, next) => {
  try{
    const {bookId} = req.query;
    if (!bookId) return next(APIError.badRequest("Booking ID is required"));
    const check = await getBookings(req.userId, bookId);
    if(!check) return next(APIError.badRequest(`Booking: ${bookId} does not exist`));
    const locate = await muvaLocation({user:req.userId, bookId});
    if(!locate) return next(APIError.badRequest("Location update failed, try again"));
    if(locate.error) return next(APIError.badRequest(locate.error));
    logger.info("Muva location retrieved successfully", {service: META.BOOKING});
    const response = buildRes.commonResponse("Found", locate, "info")
    res.status(200).json( response);
  }catch(error){
    next(error);
  }
}
exports.bookingDelivered = async (req, res, next) => {
  try{
    const {bookId} = req.body;
    if (!bookId) return next(APIError.badRequest("Booking ID is required"));
    const check = await getBookings(req.userId, bookId);
    if(!check) return next(APIError.badRequest(`Booking: ${bookId} does not exist`));
    const locate = await muvaDelivered({user:req.userId, bookId});
    if(!locate) return next(APIError.badRequest("Book update failed, try again"));
    if(locate.error) return next(APIError.badRequest(locate.error));

    const balance = check.amount - ((check.amount/100) * check.amount)
    const updateMuva= await fundWallet(req.userId, balance.toFixed(2));
    if(!updateMuva) next(APIError.customError("Muva account balance update Failed", 400))
    if(updateMuva.error) next(APIError.customError(updateMuva.error, 400))
    logger.info("Muva account balance updated successfully", {service:META.PAYMENT});
   
    logger.info("Muva completed delivery successfully", {service: META.BOOKING});
    res.status(200).json( {success: true, msg: "Booking delivered successfully"});
  }catch(error){
    next(error);
  }
}
