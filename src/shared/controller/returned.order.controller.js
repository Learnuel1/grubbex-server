const { verifyProductPromoCode } = require("../../api/store/service");
const { CONSTANTS } = require("../../config");
const logger = require("../../logger");
const { APIError } = require("../../utils/apiError");
const { returnOrder, getOrderByIdForReturn, getStoreAddressWithId, getAllReturnedOrders, updateReturnedOrderVerificationInfo, findReturnedOrderForQRCodeGeneration, findMutedByUser, getUserKYC } = require("../services/interface");
const { META } = require("../utils/actions");
const { uploadFileToCloudinary, uploadVideoFileToCloudinary, uploadBase64ToCloudinary, deleteFileFromCloudinary } = require("../utils/cloudinary");
const qrcodeService = require("../../services/qrcode.service");
const path = require("path");
const Notification = require("../utils/Notification");
const { OTPGen, shortIdGen } = require("../utils/Generator");
const jwt = require("jsonwebtoken");
const config = require("../../config/env");
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
exports.getReturnedOrders = async (req, res, next ) => {
  try{
   const { search, status, type } = req.query;
    const query = {};
      const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 10));
    const skip = (page - 1) * limit;
    if (req.userType.toLowerCase() === CONSTANTS.ACCOUNT_TYPE_OBJ.shopper) {
          if (status) {
            query.$and = [
              { returnStatus: status },
              { shopper: req.user }, 
            ];
          } else if (search) {
            query.$and = [
              { $or: [{ orderId: new RegExp(search, "i") }] },
              { shopper: req.user }, 
            ];
          } else {
            query.$and = [
              { shopper: req.user }, 
            ];
          }
        }else if (
              req.userType.toLowerCase() === CONSTANTS.ACCOUNT_ROLE_OBJ.business
            ) {
              if (status) {
                query.$and = [
                  { returnStatus: status },
                  { storeId: req.storeId },
                  { status: { $nin: [CONSTANTS.ORDER_STATUS_OBJ.pending] } },
                ];
              } else if (search) {
                query.$and = [
                  { $or: [{ orderId: new RegExp(search, "i") }] },
                  { storeId: req.storeId },
                  { returnStatus: { $nin: [CONSTANTS.ORDER_STATUS_OBJ.pending] } },
                ];
              } else {
                query.$and = [
                  { storeId: req.storeId },
                  { returnStatus: { $nin: [...CONSTANTS.ORDER_STATUS_OBJ.pending] } },
                ];
              }
            }else if (
      req.userType.toLowerCase() === CONSTANTS.ACCOUNT_ROLE_OBJ.admin
    ) {
      if (status) {
        query.$and = [
          { returnStatus: status },
          { status: { $nin: [CONSTANTS.ORDER_STATUS_OBJ.draft] } },
        ];
      } else if (search) {
        query.$and = [
          { $or: [{ orderId: new RegExp(search, "i") }] },
          { returnStatus: { $nin: [CONSTANTS.ORDER_STATUS_OBJ.draft] } },
        ];
      } else {
        query.$and = [
          { returnStatus: { $nin: [...CONSTANTS.ORDER_STATUS_OBJ.draft] } },
        ];
      }
    } else if (
          req.userType.toLowerCase() === CONSTANTS.ACCOUNT_ROLE_OBJ.rider
        ) {
          const mutedOrders = await findMutedByUser(req.userId);
          if (mutedOrders?.error)
            return next(APIError.badRequest(mutedOrders.error));
          // get user kyc:
          const kyc = await getUserKYC(req.user);
          const userInfo = await userExistById(req.user);
          if (!kyc || !kyc?.profile)
            return next(
              APIError.unauthorized(
                "You are not authorized to perform this action, complete your profile",
              ),
            );
          if (!kyc.isVerified && userInfo.isVerified === false)
            return next(
              APIError.unauthorized(
                "You are not authorized to perform this action, verify your account",
              ),
            );
          if (userInfo.state !== CONSTANTS.ACCOUNT_STATE_OBJ.active)
            return next(
              APIError.unauthorized(
                "You are not authorized to perform this action, contact support",
              ),
            );

            const { locationData } = userInfo;
             const riderLat = parseFloat(locationData.lat);
            const riderLng = parseFloat(locationData.lng);
            if (isNaN(riderLat) || isNaN(riderLng))
                return next(APIError.badRequest("Invalid coordinates"));
              const storeIds = nearByStores.map((s) => s.storeId);
          if (nearByStores.length === 0) {
            return res.status(200).json({
              success: true,
              data: [],
              pagination: {
                page,
                limit,
                total: 0,
                totalPages: 0,
                hasNext: false,
                hasPrev: false,
              },
            });
          }
           query.$and = [
                  {
                    storeId: { $in: storeIds },
                  }, 
                  { isAvailable: true }, 
                  { returnStatus: CONSTANTS.ORDER_STATUS_OBJ.ready },
                  { type: CONSTANTS.ORDER_STATUS_OBJ.pickup },
                ];
          } 
       const {orders, totalCount} = await  getAllReturnedOrders(query, skip, limit);
        if (!orders) return next(APIError.notFound("No return orders found"));
        if (orders?.error) return next(APIError.badRequest(orders.error));
        logger.info("Returned Orders fetched successfully", { service: META.ORDER });
        const totalPages = Math.ceil(totalCount / limit);
         query.$and = [
              { user: req.user },
              { returnStatus: { $nin: [CONSTANTS.ORDER_STATUS_OBJ.completed] } },
            ];
        if (req.userRole.toLowerCase() === CONSTANTS.ACCOUNT_ROLE_OBJ.business) {
              const ordersAwaiting = await storeOrders(query);
              const processingBalance = ordersAwaiting.reduce(
                (acc, order) => acc + (order.total || 0),
                0,
              );
              return res.status(200).json({
                success: true,
                msg:
                  orders.length > 0 ? "Returned Orders retrieved successfully" : "No order yet",
                data: orders,
                count: totalCount,
                processingBalance,
                pagination: {
                  page,
                  limit,
                  total: totalCount,
                  hasNext: page < totalPages,
                  hastPrev: page > 1,
                },
              });
            }else {
                  return res.status(200).json({
                    success: true,
                    msg:
                      orders.length > 0 ? "Returned Orders retrieved successfully" : "No order yet",
                    data: orders,
                    count: totalCount,
                    pagination: {
                      page,
                      limit,
                      total: totalCount,
                      hasNext: page < totalPages,
                      hastPrev: page > 1,
                    },
                  });
                }
  } catch (error) {
    next (error);
  }
}

exports.getOrderQRCode = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    if (!orderId) return next(APIError.badRequest("Order ID is required"));
    const query = {};
    if (req.userType === CONSTANTS.ACCOUNT_ROLE_OBJ.business) {
      query.storeId = req.storeId;
    } else if (req.userType === CONSTANTS.ACCOUNT_ROLE_OBJ.shopper) {
      query.shopper = req.user;
    } else if (req.userType === CONSTANTS.ACCOUNT_ROLE_OBJ.admin) {
      query.orderId = orderId;
    }

    const order = await findReturnedOrderForQRCodeGeneration(orderId, query);
    if (!order) return next(APIError.notFound("Order not Found"));
    if (order?.error) return next(APIError.badRequest(order.error));
    if(order.returnStatus === CONSTANTS.ORDER_STATUS_OBJ.accepted && req.userType !== CONSTANTS.ACCOUNT_TYPE_OBJ.shopper) return next(APIError.badRequest("Order has been returned already"))
    if (order.qrCode && order.qrCode.url) {
      // delete existing QR code from cloudinary
      const deleteQrCode = await deleteFileFromCloudinary(order.qrCode.id);
      if (deleteQrCode?.error)
        logger.error(deleteQrCode.error, { service: META.CLOUDINARY });
      logger.info("Existing Order QR code deleted successfully", {
        service: META.ORDER,
      });
    }
    //const logoPath = path.join(__dirname, "../assets/img/GrubbexLogo.png");
    const expiresAt = new Date(Date.now() + 1 * 60 * 1000);
    // const qrCode = await qrcodeService.generateQRCodeWithLogo(
    //   order.qrText.concat(expiresAt),
    //   logoPath,
    //   (width),
    //   (logoSize),
    // );
     const pickUpCode = OTPGen().toString(); 
     const qrText = `${order.qrText}-${shortIdGen()}:${pickUpCode}`;
     const qrCode = await qrcodeService.generateQRCodeWithLogo(
            qrText,
            logoPath,
            {
              width,
              logoSize,
              errorCorrectionLevel: "H",
            },
          );
    if (!qrCode) return next(APIError.badRequest("Failed to generate QR code"));
    if (qrCode?.error) return next(APIError.badRequest(qrCode.error));
    const qrCodeUpload = await uploadBase64ToCloudinary(qrCode, req);
    if (qrCodeUpload?.error)
      return next(APIError.badRequest(qrCodeUpload.message));
    if (!qrCodeUpload)
      return next(APIError.badRequest("Failed to upload QR code"));
    logger.info("Order QR code generated and uploaded successfully", {
      service: META.ORDER,
    });
    const info = {};
      info.qrCode = {
      id: qrCodeUpload.public_id,
      url: qrCodeUpload.secure_url,
    };
    // sign a token
    const token = jwt.sign(
      { data: `${order.orderId}-${order.storeId}:${expiresAt}` },
      config.TOKEN_SECRETE,
      { expiresIn: "1m" },
    );
     
    info.token = token;
    info.auth = {
      code: pickUpCode,
      token,
    };
     const data = {
      _id: order._id,
      orderId,
      storeId: order.storeId,
      auth:info.auth,
      qrCode:info.qrCode,
    };
    // const updateToken = await updateOrderQRCodeInfo(orderId, info);
    const updateToken = await updateReturnedOrderVerificationInfo(data)
    if (!updateToken)
      return next(APIError.badRequest("Failed to update order QR code info"));
    if (updateToken?.error) return next(APIError.badRequest(updateToken.error));
    logger.info("Order QR code info updated successfully", {
      service: META.ORDER,
    });
    // update qr code info in order
    return res.status(200).json({
      success: true,
      data: {
        pickUpCode,
        expiresIn: 60,
        qrCodeUrl: qrCodeUpload.secure_url,
      },
    });
  } catch (error) {
    next(error);
  }
};