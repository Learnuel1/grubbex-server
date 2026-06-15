const { CONSTANTS } = require("../config");
const BookingModel = require("../models/booking.model");
const MuvaLocationModel = require("../models/muva.location.model");
const { BookingId } = require("../utils/validation");

exports.booking = async (info) => {
  try{
      if(!info.recipient) return {error: "Recipient failed to create"};
      info.bookId = BookingId();
        return await BookingModel.create({...info, 
        $set:{
          recipient:info.recipient
        },
        $set: {
          images: info.images,
        },
        $set: {
          items: info.items,
        }
        });
  }catch(error){
    if(error.name === "ValidationError") return {error: "Invalid data"};
    if (error.name === 'MongoServerError') { 
      const field = Object.keys(error.keyPattern)[0];
      const value = error.keyValue[field];
      return {error: `'${value}' already exist`}
    }
    return {error};
  }
}

exports.cancel = async (info) => {
  try{
    const booking = await BookingModel.findOneAndUpdate({user:info.user, bookId: info.bookId},{
      status:CONSTANTS.BOOK_STATUS[1]
    },{
      returnOriginal: false
    }).exec();
    if(!booking) return {error: "Booking does not exist"};
    return booking;
  }catch(error){
    if(error.name === "ValidationError" || error.name === "CastError") return {error: "Invalid data"};
    return {error};
  }
}
exports.bookings = async (user, bookId = null) => {
  try{
    if(bookId === null)
    return await BookingModel.find({user}).select("-_id -__v -itemId -user").exec();
  else return await BookingModel.find({user, bookId}).select("-_id -__v -itemId").exec();
  }catch(error){
      if(error.name === "ValidationError" || error.name === "CastError") return {error: "Invalid data"};
      return {error};
  }
}
exports.availableBookings = async () => {
  try{
    return await BookingModel.find({isAvailable: true}).select("-_id -__v -itemId").exec();
  }catch(error){
      if(error.name === "ValidationError" || error.name === "CastError") return {error: "Invalid data"};
      return {error};
  }
}
exports.bookingById = async (bookId) => {
  try{
    return await BookingModel.findOne({bookId}).select("-_id -__v ").exec();
  }catch(error){
    if(error.name === "ValidationError" || error.name === "CastError") return {error: "Invalid data"};
    return {error};
  }
}

exports.update = async (info, bookId, userId, amount = 0) => {
  try{
    return await BookingModel.findByIdAndUpdate({bookId, _id:userId},{...info}).exec()
  }catch(error){
    if(error.name === "ValidationError" || error.name === "CastError") return {error: "Invalid data"};
    return {error};
  }
}

exports.status = async (status, bookId, userId) =>{
  try{
    return await BookingModel.findByIdAndUpdate({bookId, _id:userId},{status}).exec()
  }catch(error){
    if(error.name === "ValidationError" || error.name === "CastError") return {error: "Invalid data"};
    return {error};
  }
}
// Accept or reject booking
exports.updateBookingStatus = async (bookId, user, status) => {
  try{
    const booking = await BookingModel.findOne({bookId}).exec();
    if(booking) {
      if (status === CONSTANTS.BOOK_STATUS[3] && booking.isAvailable == true)
      {
      booking.isAvailable = false;
      booking.muva = user;
      booking.status = CONSTANTS.BOOK_STATUS[3];
      }
      else if (status === CONSTANTS.BOOK_STATUS[4] && booking.isAvailable == false ){
        booking.isAvailable = true;
        booking.muva = null;
        booking.status = CONSTANTS.BOOK_STATUS[0];
      }else{
        return {error:`Booking ${bookId} is already ${status}ed`};
      }
      booking.save()
    }
    return booking;
  }catch(error) {
    if(error.name === "ValidationError" || error.name === "CastError") return {error: "Invalid data"};
    return {error};
  }
}
exports.muvaBookings = async (muva, status = null) => {
try{
  if (status === null)
      return await BookingModel.find({muva}).sort({updatedAt: 1}).select("-_id -__v -user -muva -isAvailable").exec();
    else  return await BookingModel.find({muva, status}).sort({updatedAt: 1}).select("-_id -__v -user -muva -isAvailable").exec();
}catch(error){
  if(error.name === "ValidationError" || error.name === "CastError") return {error: "Invalid data"};
  return {error}
}
}
exports.location = async (details) => {
  try{
    const info = await MuvaLocationModel.findOne({bookId:details.bookId}).exec();
    if(!info){
      return await MuvaLocationModel.create(
        {...details,
          $set:{
            location: details.location,
          } 
      })
    }else{
      info.location = details.location;
      info.save();
      return info;
    }
  }catch(error){
    return {error};
  }
}
exports.locate = async (details) => {
  try{
    return await MuvaLocationModel.findOne({bookId:details.bookId, user:details.user}).select("-_id -__v -createdAt -muva -user -bookId").exec();
  }catch (error) {
    return {error};
  }
}
exports.completed = async (details) => {
  try{
    return await BookingModel.findOneAndUpdate({bookId:details.bookId, muva:details.user},{status: CONSTANTS.BOOK_STATUS[5]},{returnOriginal: false}).exec();
  }catch (error) {
    return {error};
  }
}