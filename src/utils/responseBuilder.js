const buildUser = (userObj) => {
  const { _id, __v, password, refreshToken, ...data } = userObj;
  return data;
};
const buildTemporalUser = (userObj) => {
  const { _id, __v, createdAt, updatedAt, refreshToken, ...data } = userObj;
  return data;
};
const commonResponse = (msg, data, field = "data", others = {}, op = true) => {
  const response = {
    success: op,
    msg,
    [field]: data,
    ...others,
  };
  return response;
};
const buildItem = (itemObj) => {
  const { _id, __v, admin,  ...data } = itemObj;
  data.itemId = _id;
  return data;
};
const buildBooking = (bookingObj) => {
  const { _id, __v, user, updatedAt,  ...data } = bookingObj;
  return data;
};
 
module.exports = {
  buildUser, 
  commonResponse, 
  buildTemporalUser, 
  buildItem,
  buildBooking,
};
