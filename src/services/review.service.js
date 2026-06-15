const AccountModel = require("../models/account.model");
const ProductModel = require("../models/product.model");
const ReviewModel = require("../models/review.model");
const StoreModel = require("../models/store.model");

exports.review =  async(info) => {
    try{
        if(info?.prodId){
            const product = await ProductModel.findOne({prodId: info.prodId});
          if(!product) return {error: "Product does not exist"}; 
          if(product &&  product.reviews.includes(info.account)) return {error: "Product already reviewed by you"} ;
        const review =await ReviewModel.create({...info});
        product.reviews.push(info.account);
        product.save();
        return review;
        }else if(info.storeId){
            const store = await StoreModel.findOne({storeId: info.storeId });
            if(!store) return {error: "Store does not exist"} ;
            if(store && store.reviews.includes(info.account)) return {error: "Store already reviewed by you"} ;
          const review =await ReviewModel.create({...info});
          store.reviews.push(info.account)
            store.save();
          return review;
        }else if(info.riderId){
            // you can only review a rider if you have used that rider's service
            const rider = await AccountModel.findOne({userId: info.riderId });
            if(!rider) return {error: "Rider does not exist"} ;
            if(rider && rider.reviews.includes(info.account)) return {error: "Rider already reviewed by you"} ;
          const review =await ReviewModel.create({...info});
          rider.reviews.push(info.account)
            rider.save();
          return review;
        }else return {error: "Review type does not exist"};
         
    } catch (error) {
        return {error: error.message };
    }
}
exports.delete = async(reviewId, shopper) => {
    try{
        const reviewExist = await ReviewModel.findOneAndDelete({shopper, id: reviewId});
        if(!reviewExist) return {error: "Review does not exist"};
    } catch ( error ) {
        return { error : error.message };
    }
} 