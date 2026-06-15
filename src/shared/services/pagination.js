const { default: mongoose } = require("mongoose");
exports.paginate = async (modelName, query = {}, page = 1, limit = 10) => {
  try { 
      // Get the Mongoose model dynamically
      const Model = mongoose.model(modelName);

      // Calculate skip value based on page number and limit
      const skip = (page - 1) * limit;

      // Perform find operation with pagination using Mongoose
      const data = await Model.find(query).skip(skip).limit(limit);

      return data;
  } catch (error) {
      return {error}
  }
}

exports.search = async (modelName,query={}, page = 1, limit = 10) => {
  try {
    const Model = mongoose.model(modelName);
    // Perform case-insensitive text search using regex and Mongoose
    return  await Model.find(query).skip(page).limit(limit).select({__v:0});
} catch (error) {
    return {error};
}
}


// const res = {
//   $or:[
//    {name: { $regex: new RegExp(query, 'i') } },
//    {userId: { $regex: new RegExp(query, 'i') } },
//    {verified: { $regex: new RegExp(query, 'i') } },
//    {username: { $regex: new RegExp(query, 'i') } },
//    {email: { $regex: new RegExp(query, 'i') } },
//    {phoneNumber: { $regex: new RegExp(query, 'i') } },
//    {type: { $regex: new RegExp(query, 'i') } },
//    {state: { $regex: new RegExp(query, 'i') } },
//    {balance: { $regex: new RegExp(query, 'i') } },
//    {createAt: { $regex: new RegExp(query, 'i') } },
//  ]
// }