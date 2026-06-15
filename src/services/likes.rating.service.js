const AccountModel = require("../models/account.model");
const LikeModel = require("../models/likes.model")
const ProductModel = require("../models/product.model");
const StoreModel = require("../models/store.model");

exports.like = async (info) => {
  try { 
    // check if the user has liked  
    if(info?.prodId) {
       const liked = await LikeModel.findOne({account: info.account, prodId: info.prodId, type: info.type})
        const productInfo = await ProductModel.findOne({prodId: info.prodId});
        if (!productInfo) {
          return {error: "Product not found"}
        };
        if (liked) {
          const del = await LikeModel.deleteOne({account: info.account, prodId: info.prodId,type: info.type})
          productInfo.likes -= 1;
          productInfo.likers.pull(liked._id);
          await productInfo.save();
          return del;
        };
        // like the product
       const like = await LikeModel.create({
          prodId: info.prodId,
          account: info.account,
          product: productInfo._id,
          type: info.type,
          userId: info.userId,
        }); 
        productInfo.likes += 1;
        productInfo.likers.push(like._id);
        await productInfo.save();
        return like;
    }
    if(info?.storeId) {
     const liked = await LikeModel.findOne({account: info.account, storeId: info.storeId,type: info.type})
     const storeInfo = await StoreModel.findOne({storeId: info.storeId,type: info.type});
        if (!storeInfo) {
          return {error: "Store not found"}
        };
        if (liked) {
            const del = await LikeModel.deleteOne({account: info.account, storeId: info.storeId, type: info.type})
            storeInfo.likes -= 1;
            storeInfo.likers.pull(liked._id);
            await storeInfo.save();
            return del;
          };
          // like the store
         const like = await LikeModel.create({
            storeId: info.storeId,
            account: info.account,
            store: storeInfo._id,
            type: info.type,
            userId: info.userId,
          }); 
          storeInfo.likes += 1;
          storeInfo.likers.push(like._id);
          await storeInfo.save();
          return like;
    }
    if(info?.riderId) {
     const liked = await LikeModel.findOne({account: info.account, riderId: info.riderId,type: info.type})
     const riderInfo = await AccountModel.findOne({userId: info.riderId,type: info.type});
        if (!riderInfo) {
          return {error: "Account not found"}
        };
        if (liked) {
            const del = await LikeModel.deleteOne({account: info.account, riderId: info.riderId, type: info.type})
            riderInfo.likes -= 1;
            riderInfo.likers.pull(liked._id);
            await riderInfo.save();
            return del;
          };
          // like the rider
         const like = await LikeModel.create({
            riderId: info.riderId,
            account: info.account,
            rider: riderInfo._id,
            type: info.type,
            userId: info.userId,
          }); 
          riderInfo.likes += 1;
          riderInfo.likers.push(like._id);
          await riderInfo.save();
          return like;
    }
  } catch (error) {
    return {error: error.message};
  }
} 
const normalRating =  async (info) => {  
    if(info?.prodId)  {
        // get all product rating
        const productInfo = await LikeModel.find({prodId: info.prodId, type: info.type});
        const total = productInfo.map(item => item.rating).reduce((acc, current) => acc + current, 0);
        return rating = total /( productInfo.length * 100) ;
    }
    else if(info?.storeId) {
        const storeInfo = await LikeModel.find({storeId: info.storeId, type: info.type});
        const total = storeInfo.map(item => item.rating).reduce((acc, current) => acc + current, 0);
        return rating = total / (storeInfo.length * 100);   
    }
    else if(info?.riderId) {
        const riderInfo = await LikeModel.find({riderId: info.riderId, type: info.type});
        const total = riderInfo.map(item => item.rating).reduce((acc, current) => acc + current, 0);
        return rating = total / (riderInfo.length * 100);
    }
    else {
       throw new Error("ID is required")
    }

}
const bayesianAverageRating =  async (info) => {  
    if(info?.prodId)  {
        // get all product rating
        const productInfo = await LikeModel.find({prodId: info.prodId, type: info.type});
        const total = productInfo.map(item => item.rating).reduce((acc, current) => acc + current, 0);
        return rating = total / productInfo.length +(1/productInfo.length)*(1/1)*(4-(total / productInfo.length));
    }
    else if(info?.storeId) {
        const storeInfo = await LikeModel.find({storeId: info.storeId, type: info.type});
        const total = storeInfo.map(item => item.rating).reduce((acc, current) => acc + current, 0);
        return rating = total / productInfo.length +(1/productInfo.length)*(1/1)*(4-(total / productInfo.length));
    }
    else if(info?.riderId) {
        const riderInfo = await LikeModel.find({riderId: info.riderId, type: info.type});
        const total = riderInfo.map(item => item.rating).reduce((acc, current) => acc + current, 0);
       return rating = total / productInfo.length +(1/productInfo.length)*(1/1)*(4-(total / productInfo.length));
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
  try { 
    // check if the user has rated  
    if(info?.prodId) {
       const rated = await LikeModel.findOne({account: info.account, prodId: info.prodId, type: info.type})
        const productInfo = await ProductModel.findOne({prodId: info.prodId});
        if (!productInfo) {
          return {error: "Product not found"}
        };
       
        if (rated) { 
          rated.rating = info.rating;
          // recompute overall rating
          const normal =  await normalRating(info);
          const bayesian = await bayesianAverageRating(info);
       productInfo.rating = await switchingRating(normal, bayesian, 6, productInfo.raters.length);
         await rated.save();
         await productInfo.save();
          return rated;
        };
        // rate the product
       const like = await LikeModel.create({
          prodId: info.prodId,
          account: info.account,
          product: productInfo._id,
          type: info.type,
          rating: info.rating,
        }); 
         // recompute overall rating 
         const normal =  await normalRating(info);
         const bayesian = await bayesianAverageRating(info);
         productInfo.rating = await switchingRating(normal, bayesian, 6, productInfo.raters.length);;
         productInfo.raters.push(like._id);
         await productInfo.save();
        return like;
    }
    if(info?.storeId) {
     const rated = await LikeModel.findOne({account: info.account, storeId: info.storeId,type: info.type})
     const storeInfo = await StoreModel.findOne({storeId: info.storeId,type: info.type});
        if (!storeInfo) {
          return {error: "Store not found"}
        };
        if (rated) {
            rated.rating = info.rating;
            // recompute overall rating
            const normal =  await normalRating(info);
            const bayesian = await bayesianAverageRating(info);
         storeInfo.rating = await switchingRating(normal, bayesian, 6, storeInfo.raters.length);
           await rated.save();
           await storeInfo.save();
            return rated;
          };
          // like the product
         const rate = await LikeModel.create({
            storeId: info.storeId,
            account: info.account,
            store: storeInfo._id,
            type: info.type,
            rating: info.rating,
          }); 
          const normal =  await normalRating(info);
         const bayesian = await bayesianAverageRating(info);
         storeInfo.rating = await switchingRating(normal, bayesian, 6, storeInfo.raters.length);;
         storeInfo.raters.push(rate._id); 
          await storeInfo.save();
          return rate;
    }
    if(info?.riderId) {
     const rated = await LikeModel.findOne({account: info.account, riderId: info.riderId,type: info.type})
     const riderInfo = await AccountModel.findOne({userId: info.riderId,type: info.type});
        if (!riderInfo) {
          return {error: "Account not found"}
        };
        if (rated) {
            rated.rating = info.rating;
          // recompute overall rating
          const normal =  await normalRating(info);
          const bayesian = await bayesianAverageRating(info);
       riderInfo.rating = await switchingRating(normal, bayesian, 6, riderInfo.raters.length);
         await rated.save(); 
         await riderInfo.save();
          return rated; 
        }
          // rate the rider
         const rate = await LikeModel.create({
            riderId: info.riderId,
            account: info.account,
            rider: riderInfo._id,
            type: info.type
          }); 
          const normal =  await normalRating(info);
         const bayesian = await bayesianAverageRating(info);
         riderInfo.rating = await switchingRating(normal, bayesian, 6, riderInfo.raters.length);;
         riderInfo.raters.push(rate._id);  
          await riderInfo.save();
          return rate;
    }
  } catch (error) {
    return {error: error.message};
  }
} 
exports.review = async (info) => {
  try { 
    // check if the user has liked  
    if(info?.prodId) {
       const liked = await LikeModel.findOne({account: info.account, prodId: info.prodId, type: info.type})
        const productInfo = await ProductModel.findOne({prodId: info.prodId});
        if (!productInfo) {
          return {error: "Product not found"}
        };
         
        // like the product
       const like = await LikeModel.create({
          prodId: info.prodId,
          account: info.account,
          product: productInfo._id,
          type: info.type,
          review: info.review,
        });  
        productInfo.likers.push(like._id);
        await productInfo.save();
        return like;
    }
    if(info?.storeId) {
     const liked = await LikeModel.findOne({account: info.account, storeId: info.storeId,type: info.type})
     const storeInfo = await StoreModel.findOne({storeId: info.storeId,type: info.type});
        if (!storeInfo) {
          return {error: "Store not found"}
        };
        if (liked) {
            const del = await LikeModel.deleteOne({account: info.account, storeId: info.storeId, type: info.type})
            storeInfo.likes -= 1;
            storeInfo.likers.pull(liked._id);
            await storeInfo.save();
            return del;
          };
          // like the product
         const like = await LikeModel.create({
            storeId: info.storeId,
            account: info.account,
            store: storeInfo._id,
            type: info.type
          }); 
          storeInfo.likes += 1;
          storeInfo.likers.push(liked._id);
          await storeInfo.save();
          return like;
    }
    if(info?.riderId) {
     const liked = await LikeModel.findOne({account: info.account, riderId: info.riderId,type: info.type})
     const riderInfo = await AccountModel.findOne({userId: info.riderId,type: info.type});
        if (!riderInfo) {
          return {error: "Account not found"}
        };
        if (liked) {
            const del = await LikeModel.deleteOne({account: info.account, riderId: info.riderId, type: info.type})
            riderInfo.likes -= 1;
            riderInfo.likers.pull(liked._id);
            await riderInfo.save();
            return del;
          };
          // like the rider
         const like = await LikeModel.create({
            riderId: info.riderId,
            account: info.account,
            rider: riderInfo._id,
            type: info.type
          }); 
          riderInfo.likes += 1;
          riderInfo.likers.push(liked._id);
          await riderInfo.save();
          return like;
    }
  } catch (error) {
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
 