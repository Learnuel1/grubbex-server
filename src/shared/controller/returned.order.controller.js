const { CONSTANTS } = require("../../config");
const { returnOrder } = require("../services/interface");
const { META } = require("../utils/actions");
const { APIError } = require("../utils/apiError");
const { uploadFileToCloudinary } = require("../utils/cloudinary");

exports.returnOrderItem = async (req, res, next) => {
  try {
    const { orderId, reason } = req.body;
    if(!orderId) return next(APIError.badRequest("Order ID to return is required"));
    if(!reason) return next(APIError.badRequest("Provide reason for the return"));
    // very file that order exist
    const orderExist = await getOrderById(orderId);
    if(!orderExist) return next(APIError.notFound("Order does not exist"))
    if(orderExist?.error) return next(APIError.notFound(orderExist.error));
    // check if the user is the owner of the order
    if(orderExist.shopper !== req.user) {
      logger.info("Fraudulent return detected", {service: META.ORDER});
      return next(APIError.badRequest("Invalid return request"));
    }
    if(orderExist.status !== CONSTANTS.ORDER_STATUS_OBJ.delivered) return next(APIError.badRequest("Invalid order status"));
     
    
    if(req?.files?.length === 0) return next(APIError.badRequest("Provide product images to be returned"));
     
    // other images
    otherImages = [];
    if (req?.files?.others?.length > 0) {
      const { others } = req.files;
      let info = await uploadFileToCloudinary(others, req);
      if (info?.error) return next(APIError.badRequest(info.message));
      otherImages.push({
        id: info.public_id,
        url: info.secure_url,
      })
      others.shift();
      if (others?.length > 0) {
        const info_2 = await uploadFileToCloudinary(others, req);
        if (info_2.error) return next(APIError.badRequest(info_2.message));
        otherImages.push({
          id: info_2.public_id,
          url: info_2.secure_url,
        })
      }
      others.shift();
      if (others?.length > 0) {
        const info_3 = await uploadFileToCloudinary(others, req);
        if (info_3.error) return next(APIError.badRequest(info_3.message));
        otherImages.push({
          id: info_3.public_id,
          url: info_3.secure_url,
        })
      }
      others.shift();
      if (others?.length > 0) {
        const info_4 = await uploadFileToCloudinary(others, req);
        if (info_4.error) return next(APIError.badRequest(info_4.message));
        otherImages.push({
          id: info_4.public_id,
          url: info_4.secure_url,
        })
      }

      logger.info(`${otherImages?.length} images uploaded successfully for order return'`, {
        service: META.CLOUDINARY,
      });
    }
    const returnedOrder = {
        ...orderExist,
        images: [...otherImages],
        returnStatus: CONSTANTS.ORDER_STATUS_OBJ.pending,
        adminStatus: CONSTANTS.ORDER_STATUS_OBJ.pending,
        returnedOrderStates: {
            status:CONSTANTS.ORDER_STATUS_OBJ.pending,
            date: new Date(),
            by: req.user,
            type: req.userType,
            currentState: CONSTANTS.ORDER_STATUS_OBJ.pending
        }
    }

    const createProduct = await returnOrder(returnedOrder);
    if (!createProduct) return next(APIError.badRequest("Returning of order failed, try again"));
    if (createProduct?.error) return next(APIError.badRequest(createProduct.error));
    logger.info("Order return was successful", {service: META.PRODUCT});
    // notify store

    // notify admin
    res.status(201).json({success: true, msg: "Product created successfully"})
  } catch (error) {
    next(error)
  }
}