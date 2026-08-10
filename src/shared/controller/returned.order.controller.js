const { verifyProductPromoCode } = require("../../api/store/service");
const { CONSTANTS } = require("../../config");
const logger = require("../../logger");
const { APIError } = require("../../utils/apiError");
const { returnOrder, getOrderByIdForReturn, getStoreAddressWithId } = require("../services/interface");
const { META } = require("../utils/actions");
const { uploadFileToCloudinary, uploadVideoFileToCloudinary, uploadBase64ToCloudinary } = require("../utils/cloudinary");
const qrcodeService = require("../../services/qrcode.service");
const path = require("path");
const Notification = require("../utils/Notification");

const width = 300,
    logoSize = 80;
          const logoPath = path.join(
            __dirname,
            "../../assets/img/GrubbexLogo.png",
          );
          const notification = new Notification();
exports.returnOrderItem = async (req, res, next) => {
  try {
    const { orderId, items } = req.body;
  
    if(!orderId) return next(APIError.badRequest("Order ID to return is required"));
    if(!items || items.length === 0) return next(APIError.badRequest("Select item to return"));
      const itemArray = JSON.parse(items);
    // very file that order exist
    const findOrder = await getOrderByIdForReturn(orderId);
   
    let orderExist ;
    if(findOrder && findOrder.length > 0) orderExist = findOrder[0]
    if(!orderExist) return next(APIError.notFound("Order does not exist"))
    if(orderExist?.error) return next(APIError.notFound(orderExist.error));
    // check if the user is the owner of the order
    if(orderExist.shopper.toString() !== req.user.toString()) {
      logger.info("Fraudulent return detected", {service: META.ORDER});
      return next(APIError.badRequest("Invalid return request"));
    }
     let qrText = `${orderExist.orderId}-`;
     // check if order has been delivered first
    if(orderExist.status !== CONSTANTS.ORDER_STATUS_OBJ.delivered && orderExist.type === CONSTANTS.ORDER_TYPE_OBJ.delivery) return next(APIError.badRequest("Order cannot be returned because it is yet to be delivered"));
    else if(orderExist.status !== CONSTANTS.ORDER_STATUS_OBJ.delivered && orderExist.type === CONSTANTS.ORDER_TYPE_OBJ.pickup) return next(APIError.badRequest("Order cannot be returned because it is yet to be picked up"));

    const returnedItemsExist = [];
    let subTotal =0;
    let deduction = 0;
    for( let item of orderExist.items){
      const exist = itemArray.find(x => x.prodId === item.prodId);
      if(!exist) throw new Error("A select item was not found in the order");
      item.reason = exist.reason;
      returnedItemsExist.push(item);
      itemArray.splice(itemArray.indexOf(exist,1));
      subTotal += item.price;
       qrText += `prodId:${item.prodId}-`;
    }
    const {auth,_id, ...fields} = orderExist.toObject();
    for (const promoCode in fields.promoCode){
       const promoItem = await verifyProductPromoCode(promoCode);
       if (promoItem?.error) return next(APIError.badRequest(pricing.error));
       if(promoItem ){
        const item = returnItemsExist.find(x => x.prodId == promoItem.prodId);
        if(item){
          deduction += promoItem.discount;
          const discount = item.price - (promoItem.discount /100) * item.price;
          subTotal -= discount;
        }
       }
    }
     
    const returnedOrder = {
        ...fields, 
        order:_id,
        items: returnedItemsExist,
        returnStatus: CONSTANTS.ORDER_STATUS_OBJ.pending,
        adminStatus: CONSTANTS.ORDER_STATUS_OBJ.pending,
        returnedOrderStates: {
            status:CONSTANTS.ORDER_STATUS_OBJ.pending,
            date: new Date(),
            by: req.user,
            type: req.userType,
            currentState: CONSTANTS.ORDER_STATUS_OBJ.pending
        },
        reason: req.body?.reason,
    };
    returnedOrder.subTotal = subTotal;
    returnedOrder.discount = deduction;
    returnedOrder.total = subTotal;
     qrText += `amount:${Math.round(returnedOrder.total)}-userId:${req.userId}-totalItems:${returnedItemsExist.length}-storeId:${returnedOrder.storeId}`;
     returnedOrder.qrText = qrText;
    // get store address;
    
    const storeInfo = await getStoreAddressWithId(fields.storeId);
        if (storeInfo.location.hasOwnProperty("latitude") === false)
          return next(APIError.badRequest("Store address could not be verified"));
        let storeAddress = null;
        const { location } = storeInfo;
        returnedOrder.destinationAddress.location = location;
        returnedOrder.destinationAddress.account = fields.store; 
 
    if(req?.files?.length === 0) return next(APIError.badRequest("Provide product images to returned"));
    
    // other images
    otherImages = [];
    if (req?.files?.images?.length > 0) {
      const { images } = req.files;
      let info = await uploadFileToCloudinary(images, req);
      if (info?.error) return next(APIError.badRequest(info.message));
      otherImages.push({
        id: info.public_id,
        url: info.secure_url,
      })
      images.shift();
      if (images?.length > 0) {
        const info_2 = await uploadFileToCloudinary(images, req);
        if (info_2?.error) return next(APIError.badRequest(info_2.message));
        otherImages.push({
          id: info_2.public_id,
          url: info_2.secure_url,
        })
      }
      images.shift();
      if (images?.length > 0) {
        const info_3 = await uploadFileToCloudinary(images, req);
        if (info_3?.error) return next(APIError.badRequest(info_3.message));
        otherImages.push({
          id: info_3.public_id,
          url: info_3.secure_url,
        })
      }
      images.shift();
      if (images?.length > 0) {
        const info_4 = await uploadFileToCloudinary(images, req);
        if (info_4?.error) return next(APIError.badRequest(info_4.message));
        otherImages.push({
          id: info_4.public_id,
          url: info_4.secure_url,
        })
      }

      logger.info(`${otherImages?.length} images uploaded successfully for order return'`, {
        service: META.CLOUDINARY,
      });
      returnedOrder.images =  [...otherImages];
    }
    if(req?.files?.video){
        const {video } = req.files;
        const vid = await uploadVideoFileToCloudinary(video[0], req);
        if(vid?.error) return next(APIError.badRequest(vid.message));
        returnedOrder.video = {
          id: vid.public_id,
          url: vid.secure_url,
        }
        logger.info(`${video?.length} Video uploaded successfully for order return'`, {
        service: META.CLOUDINARY,
      });
      }
       const text = `${returnedOrder.orderId}-${qrText}`;
                const qrCode = await qrcodeService.generateQRCodeWithLogo(
                  text,
                  logoPath,
                  {
                    width,
                    logoSize,
                    errorCorrectionLevel: "H",
                  },
                );
                if (qrCode?.error) next(APIError.badRequest(qrCode.error));
                else
                  logger.info("Order QR Code generated successfully", {
                    service: META.PAYMENT,
                  });
                const qrCodeUpload = await uploadBase64ToCloudinary(qrCode, req);
                if (qrCodeUpload?.error)
                  return next(APIError.badRequest(qrCodeUpload.message));
                else
                  logger.info("Order QR code uploaded successfully", {
                    service: META.CLOUDINARY,
                  });
      
                returnedOrder.qrCode = {
                  id: qrCodeUpload.public_id,
                  url: qrCodeUpload.secure_url,
                };
    const createProduct = await returnOrder(returnedOrder);
    if (!createProduct) return next(APIError.badRequest("Returning of order failed, try again"));
    if (createProduct?.error) return next(APIError.badRequest(createProduct.error));
    logger.info("Order return was successful", {service: META.PRODUCT});
    // notify store
            const notice = {
            category: CONSTANTS.NOTIFICATION_TYPE_OBJ.order, 
            account: returnedOrder.store,
            title: "Returned Order",
            info: `${returnedItemsExist.length} item${returnedItemsExist.length > 1? 's':''} were returned from order ${returnedOrder.orderId}.`,
            userId: returnedOrder.storeId,
          };
          notification.emit("notify", notice);
    // notify admin
    notification.emit("systemNotify", {type:CONSTANTS.NOTIFICATION_TYPE_OBJ.orderReturned});
    res.status(201).json({success: true, msg: "Order Return successfully created"})
  } catch (error) { 
    next(error)
  }
}