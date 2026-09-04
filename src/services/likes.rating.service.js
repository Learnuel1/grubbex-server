const { CONSTANTS } = require("../config");
const AccountModel = require("../models/account.model");
const LikeRateFollowReview = require("../models/like.rate.follow.review.model");
const LikeModel = require("../models/likes.model")
const ProductModel = require("../models/product.model");
const StoreModel = require("../models/store.model");
const mongoose = require("mongoose");
 
const normalRating =  async (info) => {  
    if(info?.prodId)  {
        // get all product rating
        const productInfo = await LikeModel.find({prodId: info.prodId, type: info.type}).populate("event");
        const total = productInfo.map(item => item.event.rating).reduce((acc, current) => acc + current, 0);
        return rating = Number(total) > 0 ? Number(total) /( productInfo.length * 100) : 1 ;
    }
    else if(info?.storeId) {
        const storeInfo = await LikeModel.find({storeId: info.storeId, type: info.type}).populate("event");
        const total = storeInfo.map(item => item.event.rating).reduce((acc, current) => acc + current, 0);
        return rating = Number(total) > 0 ? Number(total) / (storeInfo.length * 100) : 1;   
    }
    else if(info?.riderId) {
        const riderInfo = await LikeModel.find({riderId: info.riderId, type: info.type}).populate("event");
        const total = riderInfo.map(item => item.event.rating).reduce((acc, current) => acc + current, 0);
        return rating = Number(total) > 0 ? Number(total) / (riderInfo.length * 100): 1;
    }
    else {
       throw new Error("ID is required")
    }

}
const bayesianAverageRating =  async (info) => {  
    if(info?.prodId)  {
        // get all product rating
        const productInfo = await LikeModel.find({prodId: info.prodId, type: info.type}).populate("event");
        const total = productInfo.map(item => item.event.rating).reduce((acc, current) => acc + current, 0);
        return rating = total / productInfo.length +(1/productInfo.length)*(1/1)*(4-(total / productInfo.length));
    }
    else if(info?.storeId) {
        const storeInfo = await LikeModel.find({storeId: info.storeId, type: info.type}).populate("event");
        const total = storeInfo.map(item => item.event.rating).reduce((acc, current) => acc + current, 0);
        return rating =  Number(total) > 0 ? Number(total) / productInfo.length +(1/productInfo.length)*(1/1)*(4-(total / productInfo.length)) : 1;
    }
    else if(info?.riderId) {
        const riderInfo = await LikeModel.find({riderId: info.riderId, type: info.type}).populate("event");
        const total = riderInfo.map(item => item.event.rating).reduce((acc, current) => acc + current, 0);
       return rating = Number(total) > 0 ? Number(total) / productInfo.length +(1/productInfo.length)*(1/1)*(4-(total / productInfo.length)) : 1;
    }
    else {
       throw new Error("ID is required")
    }

}
const  hybridRating = (normalRating, bayesianAverageRating, alpha = 0.5) => {
    return (alpha * bayesianAverageRating) + ((1 - alpha) * normalRating);
  }
const  combinedRating = (normalRating, bayesianAverageRating, w1 = 0.6, w2 = 0.4) => {
    return (w1 * normalRating) + (w2 * bayesianAverageRating);
  }
const  switchingRating = async (normalRating, bayesianAverageRating, threshold = 6, numRatings = 0) => {
    if (numRatings < threshold) {
      return normalRating;
    } else if (numRatings < 10) {
      return bayesianAverageRating;
    }else if (numRatings < 30) return hybridRating(normalRating, bayesianAverageRating);
    else return combinedRating(normalRating, bayesianAverageRating);
  }
  
exports.rate = async (info) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try { 
    // ----------------------------------------------------
    // 1. PRODUCT RATING
    // ----------------------------------------------------
    // check if the user has rated  
    if(info?.prodId) {
       const rated = await LikeModel.findOne({account: info.account, prodId: info.prodId, type: info.type}).populate("event").session(session);
        const productInfo = await ProductModel.findOne({prodId: info.prodId}).session(session);
       
        // console.log(productInfo)
        if (!productInfo) {
          await session.abortTransaction();
           session.endSession();
          return {error: "Product not found"}
        };

        if (rated && rated !== null) { 
           if(info.type ===  CONSTANTS.ENDORSEMENT_TYPE_OBJ.rating) return {error: "You already rated this Product"}

          await LikeModel.findByIdAndDelete(rated._id).session(session);
          const remove =  await LikeRateFollowReview.findByIdAndDelete(rated.event).session(session);
          const count = await   LikeModel.countDocuments({prodId: info.prodId, type: info.type}).session(session); 
           info.type !== CONSTANTS.ENDORSEMENT_TYPE_OBJ.rating ? productInfo[info.type.concat("s")]  = count : productInfo[info.type]  = count ;
        await productInfo.save({ session });

        await session.commitTransaction();
        session.endSession();
        
          return remove;
        };
        const [opt] = await LikeRateFollowReview.create([{...info}], {session}) ;
        // rate the product
        const [like] = await LikeModel.create(
        [
          {
            prodId: info.prodId,
            account: info.account,
            product: productInfo._id,
            type: info.type, 
            userId: info.userId,
            event: opt._id,
          },
        ],
        { session }
      );
      
         // recompute overall rating 
          if(info.type ===  CONSTANTS.ENDORSEMENT_TYPE_OBJ.rating){
            const normal =  await normalRating(info);
            const bayesian = await bayesianAverageRating(info);
            productInfo.rating = await switchingRating(normal, bayesian, 6, productInfo.raters.length);
          } 
            const count = await   LikeModel.countDocuments({prodId: info.prodId, type: info.type}).session(session); 
          info.type !== CONSTANTS.ENDORSEMENT_TYPE_OBJ.rating ? productInfo[info.type.concat("s")]  = count : productInfo[info.type]  = count ;
          await productInfo.save({ session });

          await session.commitTransaction();
          session.endSession();

        return like;
    }
    // ----------------------------------------------------
    // 2. STORE RATING
    // ----------------------------------------------------
    if(info?.storeId) {
     const rated = await LikeModel.findOne({account: info.account, storeId: info.storeId,type: info.type}).session(session);
     const storeInfo = await StoreModel.findOne({storeId: info.storeId }).session(session);
        if (!storeInfo) {
          await session.abortTransaction();
          session.endSession();
          return {error: "Store not found"}
        };

        if (rated && rated !== null) { 
           if(info.type ===  CONSTANTS.ENDORSEMENT_TYPE_OBJ.rating) return {error: "You already rated this Store"}

            await LikeModel.findByIdAndDelete(rated._id).session(session);
          const remove =  await LikeRateFollowReview.findByIdAndDelete(rated.event).session(session);
          const count = await   LikeModel.countDocuments({storeId: info.storeId, type: info.type}).session(session); 
         info.type !== CONSTANTS.ENDORSEMENT_TYPE_OBJ.rating ? storeInfo[info.type.concat("s")]  = count : storeInfo[info.type]  = count ;
          storeInfo.save({session})  
           
         await session.commitTransaction();
         session.endSession();
            return remove;
          };
            const [opt] = await LikeRateFollowReview.create([{...info}], {session}) ;
          // like the product
          const [rate] = await LikeModel.create(
        [
          {
            storeId: info.storeId,
            account: info.account,
            store: storeInfo._id,
            type: info.type, 
            userId: info.userId,
            event: opt._id,
          },
        ],
        { session }
      );
       if(info.type ===  CONSTANTS.ENDORSEMENT_TYPE_OBJ.rating){
         
         const normal =  await normalRating(info);
         const bayesian = await bayesianAverageRating(info);
         storeInfo.rating = await switchingRating(normal, bayesian, 6, storeInfo.raters.length);;
        }
        const count = await   LikeModel.countDocuments({storeId: info.storeId, type: info.type}).session(session); 
        info.type !== CONSTANTS.ENDORSEMENT_TYPE_OBJ.rating ? storeInfo[info.type.concat("s")]  = count : storeInfo[info.type]  = count ;
        
         await storeInfo.save({ session });

        await session.commitTransaction();
        session.endSession();
          return rate;
    }
    // ----------------------------------------------------
    // 3. RIDER RATING
    // ----------------------------------------------------
    if(info?.riderId) {
     const rated = await LikeModel.findOne({account: info.account, riderId: info.riderId,type: info.type}).session(session);
     const riderInfo = await AccountModel.findOne({userId: info.riderId}).session(session);
        if (!riderInfo) {
          await session.abortTransaction();
          session.endSession();
          return {error: "Account not found"}
        };
        if (rated && rated !== null) {
          if(info.type ===  CONSTANTS.ENDORSEMENT_TYPE_OBJ.rating) return {error: "You already rated this Rider"}
            
           await LikeModel.findByIdAndDelete(rated._id).session(session);
          const remove =  await LikeRateFollowReview.findByIdAndDelete(rated.event).session(session);
          const count = await   LikeModel.countDocuments({riderId: info.riderId, type: info.type}).session(session); 
            info.type !== CONSTANTS.ENDORSEMENT_TYPE_OBJ.rating ? riderInfo[info.type.concat("s")]  = count : riderInfo[info.type]  = count ;
        await riderInfo.save({ session });

        await session.commitTransaction();
        session.endSession();
          return rated; 
        }
         const [opt] = await LikeRateFollowReview.create([{...info}], {session}) ;
          // rate the rider
          const [rate] = await LikeModel.create(
        [
          {
            riderId: info.riderId,
            account: info.account,
            rider: riderInfo._id,
            type: info.type, 
            userId: info.userId,
            event: opt._id,
          },
        ],
        { session }
      );
          if(info.type ===  CONSTANTS.ENDORSEMENT_TYPE_OBJ.rating) {

            const normal =  await normalRating(info);
            const bayesian = await bayesianAverageRating(info);
            riderInfo.rating = await switchingRating(normal, bayesian, 6, riderInfo.raters.length);
          }  
            const count = await   LikeModel.countDocuments({riderId: info.riderId, type: info.type}).session(session); 
         info.type !== CONSTANTS.ENDORSEMENT_TYPE_OBJ.rating ? riderInfo[info.type.concat("s")]  = count : riderInfo[info.type]  = count ;
          await riderInfo.save({ session });

        await session.commitTransaction();
      session.endSession();
          return rate;
    }
    await session.abortTransaction();
    session.endSession();
    return { error: "Invalid rating payload target" };
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    return {error: error.message};
  }
} 
exports.review = async (info) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try { 
    // ----------------------------------------------------
    // 1. PRODUCT REVIEWING
    // ----------------------------------------------------
    // check if the user has rated  
    if(info?.prodId) {
       const rated = await LikeModel.findOne({account: info.account, prodId: info.prodId, type: info.type}).populate("event").session(session);
        const productInfo = await ProductModel.findOne({prodId: info.prodId}).session(session);
       
        // console.log(productInfo)
        if (!productInfo) {
          await session.abortTransaction();
           session.endSession();
          return {error: "Product not found"}
        };

        if (rated && rated !== null) { 
           if(info.type ===  CONSTANTS.ENDORSEMENT_TYPE_OBJ.review) return {error: "You already reviewed this Product"}
        };
        const [opt] = await LikeRateFollowReview.create([{...info}], {session}) ;
        // rate the product
        const [like] = await LikeModel.create(
        [
          {
            prodId: info.prodId,
            account: info.account,
            product: productInfo._id,
            type: info.type, 
            userId: info.userId,
            event: opt._id,
          },
        ],
        { session }
      );
       
            const count = await   LikeModel.countDocuments({prodId: info.prodId, type: info.type}).session(session); 
         productInfo[info.type.concat("s")]  = count;
          await productInfo.save({ session });

          await session.commitTransaction();
          session.endSession();

        return like;
    }
    // ----------------------------------------------------
    // 2. STORE REVIEWING
    // ----------------------------------------------------
    if(info?.storeId) {
     const rated = await LikeModel.findOne({account: info.account, storeId: info.storeId,type: info.type}).session(session);
     const storeInfo = await StoreModel.findOne({storeId: info.storeId }).session(session);
        if (!storeInfo) {
          await session.abortTransaction();
          session.endSession();
          return {error: "Store not found"}
        };

        if (rated && rated !== null) {  
         await session.commitTransaction();
         session.endSession();
          if(info.type ===  CONSTANTS.ENDORSEMENT_TYPE_OBJ.review) return {error: "You already reviewed this Store"} 
            return remove;
          };
            const [opt] = await LikeRateFollowReview.create([{...info}], {session}) ;
          // like the product
          const [rate] = await LikeModel.create(
        [
          {
            storeId: info.storeId,
            account: info.account,
            store: storeInfo._id,
            type: info.type, 
            userId: info.userId,
            event: opt._id,
          },
        ],
        { session }
      );
         
        
        const count = await   LikeModel.countDocuments({storeId: info.storeId, type: info.type}).session(session); 
          storeInfo[info.type.concat("s")]  = count ;
         await storeInfo.save({ session });

        await session.commitTransaction();
        session.endSession();
          return rate;
    }
    // ----------------------------------------------------
    // 3. RIDER REVIEWING
    // ----------------------------------------------------
    if(info?.riderId) {
     const rated = await LikeModel.findOne({account: info.account, riderId: info.riderId,type: info.type}).session(session);
     const riderInfo = await AccountModel.findOne({userId: info.riderId}).session(session);
        if (!riderInfo) {
          await session.abortTransaction();
          session.endSession();
          return {error: "Account not found"}
        };
        if (rated && rated !== null) {
           
        await session.commitTransaction();
        session.endSession();
        if(info.type ===  CONSTANTS.ENDORSEMENT_TYPE_OBJ.rating) return {error: "You already reviewed this Rider"}
          return rated; 
        }
         const [opt] = await LikeRateFollowReview.create([{...info}], {session}) ;
          // rate the rider
          const [rate] = await LikeModel.create(
        [
          {
            riderId: info.riderId,
            account: info.account,
            rider: riderInfo._id,
            type: info.type, 
            userId: info.userId,
            event: opt._id,
          },
        ],
        { session }
      );
           
            const count = await   LikeModel.countDocuments({riderId: info.riderId, type: info.type}).session(session); 
          riderInfo[info.type.concat("s")]  = count   ;
          await riderInfo.save({ session });

        await session.commitTransaction();
      session.endSession();
          return rate;
    }
    await session.abortTransaction();
    session.endSession();
    return { error: "Invalid rating payload target" };
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    return {error: error.message};
  }
} 
 


exports.searchLikedProduct = async (query) =>{
  try{
    return data = await LikeModel.find(query).populate([
     { 
      model: "Product",
      path: "product",
      select: "-_id -__v -createdAt -updatedAt -category -user -raters -status -likers -reviews -barcode -store ",
      sort: {rating: 1, likes: 1}
    }
    ]).select("-_id -__v -createdAt -updatedAt -account -rating -ratingWeight -type");
     
  } catch (error) {
    return {error : error.message};
  }
}

exports.searchLikedStore = async (query) =>{
   try{
    return data = await LikeModel.find(query).populate([
     { 
      model: "Store",
      path: "store",
      select: "-_id -__v -createdAt -updatedAt -category -user -raters -status -likers -reviews -barcode -store ",
      sort: {rating: 1, likes: 1}
    }
    ]).select("-_id -__v -createdAt -updatedAt -account -rating -ratingWeight -type");
     
  } catch (error) {
    return {error : error.message};
  }
}
 
exports.deleteReview = async(reviewId, shopper) => {
    try{
        const reviewExist = await ReviewModel.findOneAndDelete({shopper, id: reviewId});
        if(!reviewExist) return {error: "Review does not exist"};
    } catch ( error ) {
        return { error : error.message };
    }
}

exports.searchRatings = async (info, query, skip, limit, userId) => {
  try {  
    if(info?.prodId) {
       const rated = await LikeModel.find({prodId: info.prodId, type: info.type}).populate([
          {
        model: "Account",
        path: "account",
        select: "firstName lastName picture.url -_id"
      }, {
        model: "LikeRateFollowReview",
        path: "event",
        select: "rating review -_id"
      }]).select("-_id -__v -account -createdAt -updatedAt -store -product -barcode -ratingWeight -event -storeId ").skip(skip).limit(limit).lean();
       let extraData ;
        if (rated && rated !== null) { 
          const productInfo = await ProductModel.findOne(query).select("prodId name description price rating likes reviews -_id");
          const count = await   LikeModel.countDocuments({prodId: info.prodId, type: info.type})
          const liked = await LikeModel.findOne({prodId: info.prodId, userId, type: info.type});
          extraData = productInfo.toObject();
          if(liked && liked !== null) {
            extraData[info.type] = true;
            extraData.userId = liked.userId;
          }
           if(info.type === CONSTANTS.ENDORSEMENT_TYPE_OBJ.follower) {
            extraData.followers = rated.length;
          }
          return {data:rated, total:count, extraData};
        }else { 
          return {error: `"No ${info.type} on this Product"`}
        } 
    }
    // ----------------------------------------------------
    // 2. STORE RATING
    // ----------------------------------------------------
    if(info?.storeId) {
     const rated = await LikeModel.find({storeId: info.storeId,type: info.type}).populate([
          {
        model: "Account",
        path: "account",
        select: "firstName lastName picture.url userId -_id"
      },{
        model: "LikeRateFollowReview",
        path: "event",
        select: "rating review -_id"
      }]).select("-_id -__v -account -createdAt -updatedAt -store -product -barcode -ratingWeight -event -storeId ").skip(skip).limit(limit).lean(); 
       let extraData ;
        if (rated && rated !== null) { 
             const storeInfo = await StoreModel.findOne(query).select("storeId name  category.name rating likes reviews followers -_id"); 
          const count = await   LikeModel.countDocuments({storeId: info.storeId,type: info.type})
           const liked = await LikeModel.findOne({prodId: info.prodId, userId, type: info.type});
         
           extraData = storeInfo.toObject();
          if(liked && liked !== null) {
            extraData[info.type] = true;
            extraData.userId = liked.userId;
          }
          if(info.type === CONSTANTS.ENDORSEMENT_TYPE_OBJ.follower) {
            extraData.followers = rated.length;
          }
          return {data:rated, total:count, extraData};
          }else{
            return {error: `"No ${info.type} on this Store"`}
          }
            
    }
    // ----------------------------------------------------
    // 3. RIDER RATING
    // ----------------------------------------------------
    if(info?.riderId) {
    const rated = await LikeModel.find({riderId: info.riderId,type: info.type}).populate([
          {
        model: "Account",
        path: "account",
        select: "firstName lastName picture.url userId -_id"
      },{
        model: "LikeRateFollowReview",
        path: "event",
        select: "rating review -_id"
      }]).select("-_id -__v -account -createdAt -updatedAt -store -product -barcode -ratingWeight -event -storeId ").skip(skip).limit(limit).lean();  
        let extraData ;
        if (rated && rated !== null) { 
             const riderInfo = await AccountModel.findOne(query).select("riderId name  rating likes reviews followers -_id"); 
          const count = await   LikeModel.countDocuments({riderId: info.riderId,type: info.type})
          const liked = await LikeModel.findOne({prodId: info.prodId, userId, type: info.type});
         
          extraData = riderInfo.toObject();
          if(liked && liked !== null) {
            extraData[info.type] = true;
            extraData.userId = liked.userId;
          }
          if(info.type === CONSTANTS.ENDORSEMENT_TYPE_OBJ.follower) { 
            extraData.followers = rated.length;
          }
          return {data:rated, total:count, extraData };
          }else{
            return {error: `"No ${info.type} on this Rider"`}
          }
         
           
    }
    
    return { error: "Invalid rating payload target" };
  } catch (error) {
     
    return {error: error.message};
  }
} 