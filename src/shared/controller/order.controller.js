const jwt = require("jsonwebtoken");
const config = require("../../config/env");
const { OTPGen, shortIdGen } = require("../utils/Generator");
const { hashSync } = require("bcryptjs");
const {
  getStoreByProductId,
  verifyProductPromoCode,
  getFilteredProducts,
  removeSoldProductQuantity,
  nearByStore,
} = require("../../api/store/service");
const {
  saveOrderOTP,
  getOrderOTP,
  payStackPayWithCard,
  createDraftOrder,
  verifyPayStackTransaction,
  getOrderByReference,
  updateCompletedOrder,
  createTempTransaction,
  getTemporalTransaction,
  storeOrders,
  removeTemporalTransaction,
  createTransactionHistory,
  updateAdminWallet,
  updateWallet,
  userExistByMail,
  getWalletBalance,
  walletBalance,
  updateOrderStatus,
  getOrderById,
  findMutedByUser,
  getUserKYC,
  getOrderByIdForVerification,
  updateOrderVerificationInfo,
  getOrderByQRData,
  findOrderForQRCodeGeneration,
  getStoreInfo,
  getStoreAddress,
  userExistById,
  acceptOrRejectOrder,
  getRiderOrder,
  getStoreAddressWithId,
  createAdminTransactionHistory,
  createUserNotification,
  findUserByCustomId,
  completeOrderDelivery,
} = require("../services/interface");
const { META } = require("../../utils/actions");
const { APIError } = require("../utils/apiError");
const logger = require("../../logger");
const { registrationOTPMailHandler } = require("../utils/mailer");
const { paymentReference, generateQRCode } = require("../../utils/validation");
const {
  payWithCard,
  validateCardOTP,
  verifyPayment,
} = require("../services/flutter.payment.services");
const { getAccountByGrubbexId } = require("../../services");
const { options } = require("../../utils/paystack.auth");
const https = require("https");
const { CONSTANTS } = require("../../config");
const crypto = require("crypto");
const {
  uploadBase64ToCloudinary,
  deleteFileFromCloudinary,
} = require("../utils/cloudinary");
const { ERROR_FIELD } = require("../utils/actions");
const qrcodeService = require("../../services/qrcode.service");

const { updateOrderQRCodeInfo } = require("../services/order.service");
const path = require("path");
const {
  getDistanceKmBetweenAddresses,
  verifyLocation,
  getGeocodeAddress,
} = require("../services/google.service");
const Notification = require("../utils/Notification");

  // create order QRCODE
          const width = 300,
            logoSize = 80;
          const logoPath = path.join(
            __dirname,
            "../../assets/img/GrubbexLogo.png",
          );

const notification = new Notification();
exports.initializeOrderWithFlutter = async (req, res, next) => {
  try {
    const { orderId } = req.body;
    // do some checks
    //1. does product in card exist

    for (const product of req.body.items) {
      const productExists = await getFilteredProducts({
        prodId: product.prodId,
      });

      if (!productExists || productExists.length === 0) {
        return next(
          APIError.notFound(`Product with ID ${product.prodId} does not exist`),
        );
      }
      if (productExists[0].storeId !== req.body.storeId) {
        return next(
          APIError.badRequest(
            `Product with ID ${product.name} does not belong to the store`,
          ),
        );
      }
      if (
        product.quantity > productExists[0].quantity ||
        product.quantity <= 0
      ) {
        return next(
          APIError.badRequest(
            `Product with ID ${product.name} has invalid quantity`,
          ),
        );
      }
    }
    logger.info(
      `Product${req.body.items.length > 0 ? "s" : ""} verification successful`,
      { service: META.ORDER },
    );

    // check for promo code to verify pricing
    let deduction = 0;
    let total = req.body.total;
    if (req.body?.promoCode && req.body.promoCode.length > 0) {
      for (const promoCode in req.body.promoCode) {
        total = 0;
        const pricing = await verifyProductPromoCode(promoCode);
        if (!pricing) return next(APIError.notFound("Promo code not found"));
        if (pricing?.error) return next(APIError.badRequest(pricing.error));
        if (pricing?.deduction && pricing?.deduction > 0) {
          deduction += pricing.discount;
          total += pricing.price - (pricing.discount / 100) * pricing.price;
        } else total = pricing.price;
      }
      if (deduction > 0) {
        req.body.discount = deduction;
      }
      logger.info(`Promo code applied successfully`, { service: META.ORDER });
    }
    if (req.body.total !== total) {
      return next(
        APIError.badRequest("Total amount does not match the calculated total"),
      );
    }
    // verify card Details
    const { cardDetails } = req.body;
    const userInfo = await getAccountByGrubbexId(req.userId);
    const ref = paymentReference();
    req.body.reference = ref;
    const phoneNumber = `${userInfo.countryCode}${userInfo.phoneNumber.slice(1)}`;
    const cardPayload = {
      card_number: cardDetails.cardNumber,
      expiry_month: cardDetails.expiryDate.split("/")[0],
      expiry_year: cardDetails.expiryDate.split("/")[1],
      cvv: cardDetails.cvv,
      currency: "NGN",
      amount: req.body.total,
      email: req.email,
      fullname: cardDetails.fullName,
      phone_number: phoneNumber,
      tx_ref: ref,
      // redirect_url: 'https://example_company.com/success',
      enckey: process.env.FLW_ENCRYPTION_KEY,
      authorization: {
        mode: "pin",
        // pin: cardDetails.pin,
      },
    };

    const initializeCardCharge = await payWithCard(cardPayload);
    if (initializeCardCharge?.error)
      return next(APIError.badRequest(initializeCardCharge.error));
    if (initializeCardCharge?.status === "pending_otp") {
      // save the REFERENCE INFORMATION FOR THE CUSTOMER
      const transactionId = initializeCardCharge.response.data.id;
      const info = {
        email: req.email,
        refreshToken: initializeCardCharge.flw_ref,
        otp: ref,
        orderId,
      };
      // save order as draft
      req.body.status = CONSTANTS.ORDER_STATUS_OBJ.draft;
      const createOrderOTP = await saveOrderOTP(info);
      if (!createOrderOTP)
        return next(APIError.badRequest("Failed to create order OTP"));
      if (createOrderOTP?.error)
        return next(APIError.badRequest(createOrderOTP.error));
      logger.info("Order OTP created successfully", { service: META.ORDER });

      // OTP is required to complete the transaction
      logger.info("OTP required for payment", { service: META.PAYMENT });
      const temporalOrder = await createDraftOrder(req.body, email);
      if (!temporalOrder)
        return next(APIError.badRequest("Failed to create order, try again"));
      return res.status(200).json({
        status: "success",
        msg: "Order OTP sent successfully",
        data: {
          ref: initializeCardCharge.flw_ref,
        },
      });
    } else
      return next(APIError.badRequest("Failed to create order OTP, try again"));
  } catch (error) {
    next(error);
  }
};

exports.initializeOrderWithPayStack = async (req, res, next) => {
  try {
    const { orderId, subTotal, store } = req.body;
    let VAT = req.body.subTotal * (config.VAT / 100);
    // do some checks
    //1. does product in card exist
    let qrText = "";
    const items = [];
    for (const product of req.body.items) {
      const productExists = await getFilteredProducts({
        prodId: product.prodId,
      });
      if (!productExists || productExists.length === 0) {
        return next(
          APIError.notFound(`Product with ID ${product.prodId} does not exist`),
        );
      }
      if (productExists[0].storeId !== req.body.storeId) {
        return next(
          APIError.badRequest(
            `The product ${productExists[0].title} does not belong to the store`,
          ),
        );
      }
      if (productExists[0].quantity === 0) {
        return next(
          APIError.badRequest(
            `The product ${productExists[0].title} is out of stock`,
          ),
        );
      }
      if (
        product.quantity > productExists[0].quantity ||
        product.quantity <= 0
      ) {
        return next(
          APIError.badRequest(
            `The product ${productExists[0].title} has invalid quantity`,
          ),
        );
      }
      qrText += `prodId:${product.prodId}-`;
      product.media = productExists[0].media;
      product.name = productExists[0].title;
      items.push(product);
    }
    req.body.items = items;
    logger.info(
      `Product${req.body.items.length > 0 ? "s" : ""} verification successful`,
      { service: META.ORDER },
    );

    // check for promo code to verify pricing
    let deduction = 0;
    let total = req.body.total;
    const {deliveryPrice} = req.body;
    if (req.body?.promoCode && req.body.promoCode.length > 0) {
      for (const promoCode in req.body.promoCode) {
        total = 0;
        const pricing = await verifyProductPromoCode(promoCode);
        if (!pricing) return next(APIError.notFound("Promo code not found"));
        if (pricing?.error) return next(APIError.badRequest(pricing.error));
        if (pricing?.deduction && pricing?.deduction > 0) {
          deduction += pricing.discount;
          total += pricing.price - (pricing.discount / 100) * pricing.price;
        }
      }
      if (deduction > 0) req.body.discount = deduction;

      logger.info(`Promo code applied successfully`, { service: META.ORDER });
    }
 
   
    // DELIVERY FEE
    const storeInfo = await getStoreAddressWithId(req.body.storeId);
    if (storeInfo.location.hasOwnProperty("latitude") === false)
      return next(APIError.badRequest("Store address could not be verified"));
    let storeAddress = null;
    const { location } = storeInfo;
    store[0].location = location;
    // storeAddress = storeInfo.address[0];
    storeAddress = storeInfo.location;
    req.body.store = storeInfo._id;
    const { destinationAddress } = req.body;
    if (!destinationAddress)
      return next(
        APIError.badRequest("Delivery address is required for delivery orders"),
      );
    if (req.body.type === CONSTANTS.DELIVERY_TYPE_OBJ.delivery) {
      if (destinationAddress.location.hasOwnProperty("latitude") === false)
        return next(APIError.badRequest("Delivery location is needed"));
      const destinationAddressCord = {
        latitude: destinationAddress.location.latitude,
        longitude: destinationAddress.location.longitude,
      };
      // calculate the distance between the store and the delivery address
      const destAddressExist = await verifyLocation(destinationAddressCord);
      if (!destAddressExist.ok) {
        logger.info("Delivery location could not be verified", {
          service: META.ORDER,
        });
        return next(
          APIError.badRequest(
            destAddressExist?.error ||
              "Delivery location could not be verified",
          ),
        );

      }

      const km = await getDistanceKmBetweenAddresses(
        {
          lat: destinationAddressCord.latitude,
          lng: destinationAddressCord.longitude,
        },
         { lat: location.latitude, lng: location.longitude },
        {
          apiKey: config.GOOGLE_MAPS_API_KEY,
          mode: CONSTANTS.TRANSPORTATION_MODE.driving,
        },
      );
      if (km?.error) return next(APIError.badRequest(km.error));
      req.body.destinationAddress.distance = km.distance.text;
      req.body.destinationAddress.duration = km.duration.text;
      const distanceValue =(km.distance.value / 1000).toFixed(1) ;
      logger.info(
        `Calculated  ${CONSTANTS.DELIVERY_TYPE_OBJ.delivery}  distance successfully `,
        { service: META.ORDER },
      );
      req.body.destinationAddress.distanceValue = distanceValue;
      // compute delivery cost
      req.body.destinationAddress.deliveryPrice =
        (km.distance.value / 1000).toFixed(1) * Number(config.DELIVERY_FEE_PER_KM) 
        req.body.destinationAddress.deliveryPrice += Number(config.DEFAULT_DELIVERY_FEE);
      req.body.destinationAddress.location.formattedAddress =
        destAddressExist.result.formatted_address;
         if (subTotal + VAT + req.body.destinationAddress.deliveryPrice !== total)
      return next(
        APIError.badRequest("Total amount does not match the calculated total"),
      );

    } else if (req.body.type === CONSTANTS.DELIVERY_TYPE_OBJ.pickup) {
      const destinationAddressCord = {
        latitude: destinationAddress.location.latitude,
        longitude: destinationAddress.location.longitude,
      };

      const destAddressExist = await verifyLocation(destinationAddressCord);
      if (!destAddressExist.ok) {
        logger.info("Self Pickup location could not be verified", {
          service: META.ORDER,
        });
        return next(
          APIError.badRequest(
            destAddressExist?.error ||
              "Self Pickup location could not be verified",
          ),
        );
      }
      const km = await getDistanceKmBetweenAddresses(
        {
          lat: destinationAddressCord.latitude,
          lng: destinationAddressCord.longitude,
        },
        { lat: location.latitude, lng: location.longitude },
        {
          apiKey: config.GOOGLE_MAPS_API_KEY,
          mode: CONSTANTS.TRANSPORTATION_MODE.driving,
        },
      );
      if (km?.error) return next(APIError.badRequest(km.error));
      req.body.destinationAddress.distance = km.distance.text;
      req.body.destinationAddress.duration = km.duration.text;
      const distanceValue = Number((km.distance.value / 1000).toFixed(1));
      logger.info(
        `Calculated ${CONSTANTS.DELIVERY_TYPE_OBJ.pickup} distance successfully `,
        { service: META.ORDER },
      );
      req.body.destinationAddress.distanceValue = distanceValue;
      // compute delivery cost
      // req.body.destinationAddress.deliveryPrice = distanceValue * Number(config.DELIVERY_FEE_PER_KM) + Number( config.DEFAULT_DELIVERY_FEE)
      req.body.destinationAddress.location.formattedAddress =
        destAddressExist.result.formatted_address;
         if (subTotal + VAT  !== total)
      return next(
        APIError.badRequest("Total amount does not match the calculated total"),
      );
    }
    req.body.total = Math.ceil(req.body.total);
    qrText += `amount:${Math.round(req.body.total)}-`;

    const userInfo = await getAccountByGrubbexId(req.userId);
    const phoneNumber = `${userInfo.countryCode}${userInfo.phoneNumber.slice(1)}`;
    let cardPayload = {};

    if (req.body.paymentType === CONSTANTS.PAYMENT_TYPE_OBJ.card) {
      cardPayload = {
        currency: "NGN",
        amount: req.body.total.toFixed(2),
        email: req.email,
        phone_number: phoneNumber,
        callback_url: `${config.PAYSTACK_CALL_BACK_URL}`,
        paymentEventType: CONSTANTS.TRANSACTION_TYPE.checkout,
        paymentType: CONSTANTS.PAYMENT_TYPE_OBJ.card,
        orderId,
        user: req.user,
        customerName: `${userInfo.firstName} ${userInfo.lastName}`,
         userType: req.userType,
      };
    } else if (req.body.paymentType === CONSTANTS.PAYMENT_TYPE_OBJ.wallet) {
      cardPayload = {
        amount: req.body.total.toFixed(2),
        email: req.email,
        phone_number: phoneNumber,
        paymentEventType: CONSTANTS.TRANSACTION_TYPE.checkout,
        paymentType: CONSTANTS.PAYMENT_TYPE_OBJ.wallet,
        orderId,
        user: req.user,
        customerName: `${userInfo.firstName} ${userInfo.lastName}`,
        userType: req.userType,
      };
      const userBal = await walletBalance(req.user);
      if (userBal?.error) return next(APIError.badRequest(userBal.error));
      if (userBal.balance < req.body.total)
        return next(APIError.badRequest("Insufficient wallet balance"));
    }
    qrText += `userId:${req.userId}-totalItems:${req.body.items.length}-storeId:${req.body.storeId}`;
    req.body.qrText = qrText;
    const initializeCardCharge = await payStackPayWithCard(cardPayload);

    if (initializeCardCharge?.error)
      return next(APIError.badRequest(initializeCardCharge.error));
    if (initializeCardCharge?.status === true) {
      // save the REFERENCE INFORMATION FOR THE CUSTOMER
      const info = {
        user: req.user,
        email: req.email,
        refreshToken: initializeCardCharge.data.access_code,
        otp: initializeCardCharge.data.reference,
        orderId,
     
      };
      req.body.reference = initializeCardCharge.data.reference;
      // save order as draft
      req.body.status = CONSTANTS.ORDER_STATUS_OBJ.draft;
      const createOrderOTP = await saveOrderOTP(info);
      if (!createOrderOTP)
        return next(APIError.badRequest("Failed to create order OTP"));
      if (createOrderOTP?.error)
        return next(APIError.badRequest(createOrderOTP.error));
      logger.info("Order OTP created successfully", { service: META.ORDER });
      const tempTrans = await createTempTransaction({
        id: qrText,
        reference: req.body.reference,
        event: CONSTANTS.TRANSACTION_TYPE.checkout,
        type: CONSTANTS.TRANSACTION_TYPE.debit
      });
      if (!tempTrans)
        return next(APIError.badRequest("Order Transaction Failed. try again"));
      if (tempTrans?.error) return next(APIError.badRequest(tempTrans.error));
      logger.info("Temporal Order Transaction created successfully", {
        service: META.PAYMENT,
      });
      // logger.info("OTP required for payment", {service: META.PAYMENT});
      const paymentInfo = {
        amount: req.body.total,
        status: CONSTANTS.ORDER_PAYMENT_STATUS.pending,
        date: new Date(),
      };
      req.body.payment = [paymentInfo];
      const orderStates = {
        status: req.body.status,
        by: req.user,
        type: req.userType,
        currentState: req.body.status,
        date: new Date(),
      }
      req.body.orderStates = [orderStates]
      const temporalOrder = await createDraftOrder(req.body);
      if (!temporalOrder)
        return next(APIError.badRequest("Failed to create order, try again"));
      if (temporalOrder?.error)
        return next(APIError.badRequest(temporalOrder.error));
      logger.info("Temporal Order created successfully", {
        service: META.PAYMENT,
      });
      return res.status(200).json({
        status: "success",
        msg: initializeCardCharge.message,
        data: {
          ...initializeCardCharge.data,
          orderId,
        },
      });
    } else
      return next(APIError.badRequest("Failed to create order, try again"));
  } catch (error) {
    next(error);
  }
};

exports.completeOrder = async (req, res, next) => {
  try {
    const { otp, ref } = req.body;
    if (!otp || !ref)
      return next(APIError.badRequest("OTP and reference are required"));
    const orderOTP = await getOrderOTP({ email: req.email, refreshToken: ref });
    if (!orderOTP) return next(APIError.notFound("Order OTP does not exist"));
    const isOTPValid = await validateCardOTP({ ref, otp });
    if (isOTPValid?.error) return next(APIError.badRequest(isOTPValid.error));
    if (!isOTPValid?.status || isOTPValid.status !== "success") {
      return next(
        APIError.badRequest("Transaction failed to complete, try again"),
      );
    }
    if (
      isOTPValid.status === "success" &&
      isOTPValid.data.processor_response === "successful" &&
      isOTPValid.data.status === "successful"
    ) {
      // verify payment
      const isVerifyPayment = await verifyPayment(ref);
      if (isVerifyPayment?.error)
        return next(APIError.badRequest(isVerifyPayment.error));
      if (isVerifyPayment?.status !== "success") {
        return next(
          APIError.badRequest("Payment verification failed, try again"),
        );
      }
    }
    // proceed the payment for the order into store wallet
  } catch (error) {
    next(error);
  }
};
exports.payStackConfirmTransaction = async (req, res, next) => {
  try {
    const hash = crypto
      .createHmac("sha512", config.PAYSTACK_SECRETE_KEY)
      .update(JSON.stringify(req.body))
      .digest("hex");
    if (hash == req.headers["x-paystack-signature"]) {
      // Retrieve the request's body
      const { data: info, event } = req.body;
      if (event === "charge.success" && info.status === "success" && info.metadata.paymentEventType === CONSTANTS.TRANSACTION_TYPE.checkout) {
        logger.info("Payment successful", { service: META.PAYSTACK_SERVICE });
        const reference = info.reference;
        const transType = await getTemporalTransaction({ reference });
        if (!transType) {
          logger.error(`"Payment with Reference:${reference} was not found"`, {
            service: META.TEMPORAL_REF,
          });
          return next(
            APIError.notFound(
              `Payment with Reference:${reference} was not found`,
            ),
          );
        }
        if (transType?.error) {
          logger.error(transType.error, { service: META.TEMPORAL_REF });
          return next(APIError.badRequest(transType.error));
        }
        logger.info("Payment transaction found", {
          service: META.TEMPORAL_REF,
        });
        if (
          transType.event === CONSTANTS.TRANSACTION_TYPE.checkout &&
          info.metadata.paymentEventType ===
            CONSTANTS.TRANSACTION_TYPE.checkout &&
          info.metadata.paymentType === CONSTANTS.PAYMENT_TYPE_OBJ.card
        ) {
          const order = await getOrderByReference(reference);
          if (!order) return next(APIError.notFound("Order not found"));
          if (order?.error) return next(APIError.badRequest(order.error));
          logger.info("Order found successfully", { service: META.PAYMENT });
          if (order.total !== info.amount / 100)
            return next(
              APIError.badRequest(
                `"Order:${order.orderId} with reference{ ${reference} total does not match the payment amount"`,
              ),
            );
          logger.info("Order total verified successfully", {
            service: META.PAYMENT,
          });
          const grubbexCommission =
            order.subTotal * (Number(config.STORE_ORDER_COMMISSION_PERCENTAGE) / 100);
          const { items } = order;
          // update the store product quantity
          for (const item of items) {
            const productExists = await removeSoldProductQuantity(
              item.prodId,
              order.storeId,
              item.quantity,
            );
            if (!productExists)
              logger.error(`store product quantity failed to update`, {
                service: META.PAYMENT,
              });
            if (productExists?.error)
              return logger.error(productExists.error, {
                service: META.PAYMENT,
              });
          }
          logger.info("Store product quantity updated successfully", {
            service: META.PAYMENT,
          });
 
          const text = `${order.orderId}-${order.qrText}`;
          const qrCode = await qrcodeService.generateQRCodeWithLogo(
            text,
            logoPath,
            {
              width,
              logoSize,
              errorCorrectionLevel: "H",
            },
          );
        //   const qrCode = await generateQRCode(`${order.orderId}-${order.qrText}`);
          if (qrCode?.error) next(APIError.badRequest(qrCode.error));
          else
            logger.info("Order QR Code generated successfully", {
              service: META.PAYMENT,
            });
          const qrCodeUpload = await uploadBase64ToCloudinary(qrCode, req);
          if (qrCodeUpload?.error)
            return next(APIError.badRequest(qrCodeUpload.message));
          else
            logger.info("Order QRcode uploaded successfully", {
              service: META.CLOUDINARY,
            });

          const qrCodeObj = {
            id: qrCodeUpload.public_id,
            url: qrCodeUpload.secure_url,
          };
          // update order info
          const subTotal =  order.subTotal - grubbexCommission;
          const updateInfo = {
            status: CONSTANTS.ORDER_STATUS_OBJ.pending,
            qrCode: {
              ...qrCodeObj,
            },
            qrText: `${order.orderId}-${order.qrText}`,
            subTotal: subTotal,
            total: order.total + grubbexCommission,
          };
          updateInfo.payment = {
            amount: order.total,
            status: CONSTANTS.ORDER_PAYMENT_STATUS.completed,
            
          };
          if (order.type === CONSTANTS.ORDER_TYPE_OBJ.pickup) {
            const pickUpCharge =
              order.subTotal * (Number(config.STORE_PICKUP_CHARGE_PERCENTAGE) / 100);
            updateInfo.subTotal -= pickUpCharge;
            updateInfo.total += pickUpCharge;
          }
          order.total = updateInfo.total;
          order.subTotal = updateInfo.subTotal;
          const {orderStates} = order
         
            const otherOrderStates = []
           orderStates.forEach((cur) => {
            const{currentState, ...rest} = cur.toObject();
             otherOrderStates.push(rest)
          })   
          const orderState = {
            status: CONSTANTS.ORDER_STATUS_OBJ.pending,
            date: new Date(),
            by: info.metadata.user,
            type: info.metadata.userType,
            currentState: CONSTANTS.ORDER_STATUS_OBJ.pending,
          }
          otherOrderStates.push(orderState);
          updateInfo.orderStates = otherOrderStates 
          const updateOrder = await updateCompletedOrder(updateInfo, reference);
          if (!updateOrder)
            return logger.error("Completed order update failed", {
              service: META.PRODUCT,
            });
          if (updateOrder?.error)
            return logger.error(updateOrder.error, { service: META.PAYMENT });
          logger.info("Completed order details updated successfully", {
            service: META.PAYMENT,
          });
          // get Admin Account
          const admin = await userExistByMail(config.ADMIN_MAIL);
          if (!admin) return next(APIError.notFound("Admin account not found"));
          if (admin?.error) return next(APIError.badRequest(admin.error)); 
          const adminBal = await walletBalance(admin._id); 
          if (!adminBal) {
            const wallet = await updateAdminWallet({
              user: admin._id,
              balance: order.total,
            });
            if (!wallet)
              return next(APIError.badRequest("Failed to update admin wallet"));
            if (wallet?.error) return next(APIError.badRequest(wallet.error));
            logger.info("Admin wallet created successfully", {
              service: META.PAYMENT,
            });
          } else {
            if (adminBal?.error)
              return next(APIError.badRequest(adminBal.error));
            const walletInfoUpdate = await updateWallet({
              balance:admin.balance + order.total,
              user: admin._id,
            });
            if (!walletInfoUpdate)
              return next(
                APIError.badRequest("Failed to update grubbex wallet balance"),
              );
            if (walletInfoUpdate?.error)
              return next(APIError.badRequest(walletInfoUpdate.error));
            logger.info("Admin wallet updated successfully", {
              service: META.PAYMENT,
            });
          }
          const wallet = await getWalletBalance(info.metadata.user);
          if (wallet?.error) return next(APIError.badRequest(wallet.error));
          // update transaction history
          const details = {
            balanceBefore: wallet.balance,
            user: info.metadata.user,
            initiatedBy: info.metadata.user,
            amount: info.amount / 100,
            // credit: info.amount / 100,
            description: `Payment for order ${order.orderId}`,
            type: info.metadata.paymentEventType,
             reference: info.reference,
             currency: info.metadata.currency,
             status: info.status,
             order: order._id,
             orderId: info.metadata.orderId,
             ipAddress:info.ip_address,
          };
          if(transType.type === CONSTANTS.TRANSACTION_TYPE.credit){ 
            details.balanceAfter= wallet.balance + details.credit;
          }
          if(transType.type === CONSTANTS.TRANSACTION_TYPE.debit) {
            details.debit = info.amount/100;
             details.balanceAfter = wallet.balance == 0 ? 0: wallet.balance - details.debit;
            }

          const createHistory = await createTransactionHistory(details);
          if (!createHistory)
            return next(
              APIError.badRequest("Failed to create transaction history"),
            );
          if (createHistory?.error)
            return next(APIError.badRequest(createHistory.error));
          logger.info("Transaction history created and temporal transaction deleted successfully", {
            service: META.PAYMENT,
          });
          details.user = admin._id;
          details.balanceBefore = adminBal.balance;
          details.balanceAfter =  adminBal.balance + order.total
          details.credit = order.total;
            const createAdminHistory = await createAdminTransactionHistory(details);
          if (!createAdminHistory)
            return next(
              APIError.badRequest("Failed to create admin transaction history"),
            );
          if (createAdminHistory?.error)
            return next(APIError.badRequest(createAdminHistory.error));
          logger.info("Admin transaction history created successfully", {
            service: META.PAYMENT,
          });
          // send order confirmation mail

          const notice = {
            event: "Order Payment",
            order,
            email:info.metadata.email,
            customerName: info.metadata.customerName,
          };
          notification.emit("orderPayment", notice);
          notice.category = CONSTANTS.NOTIFICATION_TYPE_OBJ.transaction;
          notice.account = order.shopper;
          notice.userId = order.shopperId;
          notice.title = "Payment for order";
          notice.info = `Payment for order ${order.orderId} was successful`;
          notification.emit("notify", notice);


        } else if (
          transType.event === CONSTANTS.TRANSACTION_TYPE.checkout &&
          info.metadata.paymentEventType ===
            CONSTANTS.TRANSACTION_TYPE.checkout &&
          info.metadata.paymentType === CONSTANTS.PAYMENT_TYPE_OBJ.wallet
        ) {
          const order = await getOrderByReference(reference);

          if (!order) return next(APIError.notFound("Order not found"));
          if (order?.error) return next(APIError.badRequest(order.error));
          logger.info("Order found successfully", { service: META.PAYMENT });
          if (order.total !== info.amount / 100)
            return next(
              APIError.badRequest(
                `"Order:${order.orderId} with reference{ ${reference} total does not match the payment amount"`,
              ),
            );
          logger.info("Order total verified successfully", {
            service: META.PAYMENT,
          });

          const { items } = order;
          // update the store product quantity
          for (const item of items) {
            const productExists = await removeSoldProductQuantity(
              item.prodId,
              order.storeId,
              item.quantity,
            );
            if (!productExists)
              logger.error(`store product quantity failed to update`, {
                service: META.PAYMENT,
              });
            if (productExists?.error)
              return logger.error(productExists.error, {
                service: META.PAYMENT,
              });
          }
          logger.info("Store product quantity updated successfully", {
            service: META.PAYMENT,
          });

          // create order QR CODE
          const text = `${order.orderId}-${order.qrText}`;
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
            logger.info("Order barcode uploaded successfully", {
              service: META.CLOUDINARY,
            });

          const qrCodeObj = {
            id: qrCodeUpload.public_id,
            url: qrCodeUpload.secure_url,
          };
          // update order info
          const updateInfo = {
            status: CONSTANTS.ORDER_STATUS_OBJ.pending,
            qrCode: {
              ...qrCodeObj,
            },
            qrText: `${order.orderId}-${order.qrText}`,
          };
          const updateOrder = await updateCompletedOrder(updateInfo, reference);
          if (!updateOrder)
            return logger.error("Completed order update failed", {
              service: META.PRODUCT,
            });
          if (updateOrder?.error)
            return logger.error(updateOrder.error, { service: META.PAYMENT });
          logger.info("Competed order details updated successfully", {
            service: META.PAYMENT,
          });
          //update store wallet
          const admin = await userExistByMail(config.ADMIN_MAIL);
          if (!admin) return next(APIError.notFound("Admin account not found"));
          if (admin?.error) return next(APIError.badRequest(admin.error));
          const adminBal = await walletBalance(admin._id);
          if (adminBal?.error) return next(APIError.badRequest(adminBal.error));
          const updateAdminWallet = await updateWallet({
            user: admin._id,
            balance: adminBal.balance + info.amount / 100,
          });
          if (!updateAdminWallet)
            return next(
              APIError.badRequest("Failed to update grubbex wallet balance"),
            );
          if (updateAdminWallet?.error)
            return next(APIError.badRequest(updateAdminWallet.error));
          logger.info("Admin wallet updated successfully", {
            service: META.PAYMENT,
          });
          // update user wallet
          const userBal = await walletBalance(info.metadata.user);
          if (userBal?.error) return next(APIError.badRequest(userBal.error));
          if (userBal.balance < info.amount / 100)
            return next(APIError.badRequest("Insufficient wallet balance"));
          logger.info("User wallet balance verified successfully", {
            service: META.PAYMENT,
          });
          const updateBalance = await updateWallet({
            user: info.metadata.user,
            balance: userBal.balance - info.amount / 100,
          });

          if (!updateBalance)
            return next(
              APIError.badRequest("Failed to update shopper wallet balance"),
            );
          if (updateBalance?.error)
            return next(APIError.badRequest(updateBalance.error));
          logger.info("User Wallet balance updated successfully", {
            service: META.PAYMENT,
          });
          // update transaction history
          const details = {
            balance: updateBalance.balance,
            user: info.metadata.user,
            amount: info.amount / 100,
            description: "Payment for order",
            type: CONSTANTS.TRANSACTION_TYPE.checkout,
            transaction: [
              {
                reference: info.reference,
                type: CONSTANTS.TRANSACTION_TYPE.checkout,
              },
            ],
          };
          const createHistory = await createTransactionHistory(details);
          if (!createHistory)
            return next(
              APIError.badRequest("Failed to create transaction history"),
            );
          if (createHistory?.error)
            return next(APIError.badRequest(createHistory.error));
          logger.info("Transaction history created successfully", {
            service: META.PAYMENT,
          }); 
          
          // send order confirmation mail
          const notice = {
            event: "Order Payment",
            order,
          };
          notify.emit("orderPayment", notice);
        } else if (
          transType.event === CONSTANTS.TRANSACTION_TYPE.funding &&
          info.metadata.paymentEventType ===
            CONSTANTS.TRANSACTION_TYPE.funding &&
          info.metadata.paymentType === CONSTANTS.PAYMENT_TYPE_OBJ.card
        ) {
          const userBal = await walletBalance(info.metadata.user);
          const updateBalance = await updateWallet({
            user: info.metadata.user,
            balance: userBal.balance + info.amount / 100,
          });
          if (!updateBalance)
            return next(APIError.badRequest("Failed to update wallet balance"));
          if (updateBalance?.error)
            return next(APIError.badRequest(updateBalance.error));
          logger.info("Wallet balance updated successfully", {
            service: META.PAYMENT,
          });
          // update transaction history
          const details = {
            balance: updateBalance.balance,
            user: info.metadata.user,
            amount: info.amount / 100,
            description: "Wallet funding",
            type: CONSTANTS.TRANSACTION_TYPE.funding,
            transaction: [
              {
                reference: info.reference,
                type: CONSTANTS.TRANSACTION_TYPE.funding,
              },
            ],
          };
          const createHistory = await createTransactionHistory(details);
          if (!createHistory)
            return next(
              APIError.badRequest("Failed to create transaction history"),
            );
          if (createHistory?.error)
            return next(APIError.badRequest(createHistory.error));
          logger.info("Transaction history created successfully", {
            service: META.PAYMENT,
          });
          // delete temporal transaction
          const delTempRef = await removeTemporalTransaction({ reference });
          if (!delTempRef)
            return next(
              APIError.badRequest("Failed to delete temporal transaction"),
            );
          if (delTempRef?.error)
            return next(APIError.badRequest(delTempRef.error));
          logger.info("Temporal transaction deleted successfully", {
            service: META.PAYMENT,
          });
          // send email
          const notice = {
            event: "Account Funding",
          };
          notification.emit("orderPayment", notice);
        }
      } else if (event.event === 'customeridentification.success') {
    // Verification passed – update your database, mark KYC complete, etc.
    console.log('✅ Customer verified:', event.data);
    // event.data.customer_code, event.data.identification (contains BVN, etc.)
} else if (event.event === 'customeridentification.failed') {
      logger.info("BVN Verification failed", {service: META.PAYSTACK_SERVICE})
    // Verification failed – notify user, log reason
    console.log('❌ Verification failed:', event.data);
  }
    }
  } catch (error) {
    next(error);
  }
};

exports.payStackVerifyTransaction = async (req, res, next) => {
  try {
    const reference = req.query.reference;
    if (!reference) return next(APIError.badRequest("Reference is required"));
    const verifyTransaction = await verifyPayStackTransaction(reference);
    if (verifyTransaction?.error)
      return next(APIError.badRequest(verifyTransaction.error));
    if (verifyTransaction?.status !== "success")
      return next(APIError.badRequest(verifyTransaction.message));

    if (verifyTransaction.status === "success") {
      logger.info("Payment verified successfully", {
        service: META.PAYSTACK_SERVICE,
      });
      return res
        .status(200)
        .json({
          success: true,
          msg: "Payment Verified Successfully",
          data: {
            reference: verifyTransaction.reference,
            amount: verifyTransaction.amount,
          },
        });
    }
  } catch (error) {
    next(error);
  }
};
exports.getAllOrders = async (req, res, next) => {
  try {
    const { search, status, type } = req.query;
    const query = {};
    // 2. Pagination params
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 10));
    const skip = (page - 1) * limit;
    const pipeline = [];
    if (req.userType.toLowerCase() === CONSTANTS.ACCOUNT_TYPE_OBJ.shopper) {
      if (status) {
        query.$and = [
          { status: status },
          { shopper: req.user },
          // {status: {$nin: [CONSTANTS.ORDER_STATUS_OBJ.draft] }}
        ];
      } else if (search) {
        query.$and = [
          { $or: [{ orderId: new RegExp(search, "i") }] },
          { shopper: req.user },
          // {status: {$nin: [CONSTANTS.ORDER_STATUS_OBJ.draft] }}
        ];
      } else {
        query.$and = [
          { shopper: req.user },
          //{status: {$nin: [...CONSTANTS.ORDER_STATUS_OBJ.draft] }}
        ];
      }
    } else if (
      req.userType.toLowerCase() === CONSTANTS.ACCOUNT_ROLE_OBJ.business
    ) {
      if (status) {
        query.$and = [
          { status: status },
          { storeId: req.storeId },
          { status: { $nin: [CONSTANTS.ORDER_STATUS_OBJ.draft] } },
        ];
      } else if (search) {
        query.$and = [
          { $or: [{ orderId: new RegExp(search, "i") }] },
          { storeId: req.storeId },
          { status: { $nin: [CONSTANTS.ORDER_STATUS_OBJ.draft] } },
        ];
      } else {
        query.$and = [
          { storeId: req.storeId },
          { status: { $nin: [...CONSTANTS.ORDER_STATUS_OBJ.draft] } },
        ];
      }
    } else if (
      req.userType.toLowerCase() === CONSTANTS.ACCOUNT_ROLE_OBJ.admin
    ) {
      if (status) {
        query.$and = [
          { status: status },
          { status: { $nin: [CONSTANTS.ORDER_STATUS_OBJ.draft] } },
        ];
      } else if (search) {
        query.$and = [
          { $or: [{ orderId: new RegExp(search, "i") }] },
          { status: { $nin: [CONSTANTS.ORDER_STATUS_OBJ.draft] } },
        ];
      } else {
        query.$and = [
          { status: { $nin: [...CONSTANTS.ORDER_STATUS_OBJ.draft] } },
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

      const nearByStores = await nearByStore(riderLng, riderLat);
      if (!nearByStores)
        return next(APIError.badRequest("No order in yor current location"));
      if (nearByStores?.error)
        return next(APIError.badRequest(nearByStores.error));
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
        // {status: CONSTANTS.ORDER_STATUS_OBJ.pending},
        { isAvailable: true },
        // {_id: { $nin: mutedOrders.map(order => order.order)}},
        { storeStatus: CONSTANTS.ORDER_STATUS_OBJ.ready },
        { type: {$ne: CONSTANTS.ORDER_STATUS_OBJ.pickup }},
      ];
    }

    // get order
    const orders = await storeOrders(query, page, limit);
    if (!orders) return next(APIError.notFound("No orders found"));
    if (orders?.error) return next(APIError.badRequest(orders.error));
    logger.info("Orders fetched successfully", { service: META.ORDER });
    const totalPages = Math.ceil(orders.length / limit);

    // get store pending balance
    query.$and = [
      { user: req.user },
      { status: { $nin: [CONSTANTS.ORDER_STATUS_OBJ.completed] } },
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
          orders.length > 0 ? "Orders retrieved successfully" : "No order yet",
        data: orders,
        count: orders.length,
        processingBalance,
        pagination: {
          page,
          limit,
          total: orders.length,
          hasNext: page < totalPages,
          hastPrev: page > 1,
        },
      });
    } else {
      return res.status(200).json({
        success: true,
        msg:
          orders.length > 0 ? "Orders retrieved successfully" : "No order yet",
        data: orders,
        count: orders.length,
        pagination: {
          page,
          limit,
          total: orders.length,
          hasNext: page < totalPages,
          hastPrev: page > 1,
        },
      });
    }
  } catch (error) {
    next(error);
  }
};
exports.orderStatusUpdate = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;
    const query = {};
    if (!orderId) return next(APIError.badRequest("Order ID is required"));
    if (!status) return next(APIError.badRequest("Order status is required"));
    if (status === CONSTANTS.ORDER_STATUS_OBJ.draft)
      return next(
        APIError.badRequest(
          `You are not allowed to update order status to ${CONSTANTS.ORDER_STATUS_OBJ.draft}`,
        ),
      );
    if (
      !Object.values(CONSTANTS.ORDER_STATUS_OBJ).includes(status.toLowerCase())
    ) {
      return next(APIError.badRequest("Invalid order status"));
    }
    if (req.userType === CONSTANTS.ACCOUNT_ROLE_OBJ.shopper) {
      return next(
        APIError.forbidden("You are not allowed to update order status"),
      );
    }
     const orderState = {
        status: status,
        by: req.user,
        type: req.userType,
        currentState: status
      }
    if (req.userType === CONSTANTS.ACCOUNT_ROLE_OBJ.business) {
      // get store pending balance
      query.$and = [
        { storeId: req.storeId },
        { orderId: orderId },
        {
          storeStatus: {
            $nin: [
              CONSTANTS.ORDER_STATUS_OBJ.completed,
              CONSTANTS.ORDER_STATUS_OBJ.draft,
            ],
          },
        },
      ];
     
      const order = await updateOrderStatus(query, { storeStatus: status , orderState});
      if (!order) return next(APIError.notFound("Order not found"));
      if (order?.error) return next(APIError.badRequest(order.error));
      logger.info("Order status updated successfully", { service: META.ORDER });
      return res
        .status(200)
        .json({ success: true, msg: "Order status updated successfully" });
    } else if (req.userType === CONSTANTS.ACCOUNT_ROLE_OBJ.admin) {
      query.$and = [
        { orderId: orderId },
        {
          storeStatus: {
            $nin: [
              CONSTANTS.ORDER_STATUS_OBJ.completed,
              CONSTANTS.ORDER_STATUS_OBJ.draft,
            ],
          },
        },
      ];
      const order = await updateOrderStatus(query, { storeStatus: status ,orderState});
      if (!order) return next(APIError.notFound("Order not found"));
      if (order?.error) return next(APIError.badRequest(order.error));
      logger.info("Order status updated successfully", { service: META.ORDER });
      return res
        .status(200)
        .json({ success: true, msg: "Order status updated successfully" });
    } else if (req.userType === CONSTANTS.ACCOUNT_ROLE_OBJ.rider) {
      query.$and = [
        { orderId: orderId },
        { rider: req.user },
        {
          available: {
            $nin: [
              CONSTANTS.ORDER_STATUS_OBJ.completed,
              CONSTANTS.ORDER_STATUS_OBJ.draft,
            ],
          },
        },
      ];
      const order = await updateOrderStatus(query, { status, orderState });
      if (!order) return next(APIError.notFound("Order not found"));
      if (order?.error) return next(APIError.badRequest(order.error));
      logger.info("Order status updated successfully", { service: META.ORDER });
      return res
        .status(200)
        .json({ success: true, msg: "Order status updated successfully" });
    }
  } catch (error) {
    next(error);
  }
};
// exports.generateOrderPickUpCode = async (req, res, next) => {
//   try {
//     const { orderId } = req.params;
//     if (!orderId) return next(APIError.badRequest("Order ID is required"));
//     const orderExist = await getOrderByIdForVerification(orderId);
//     if (!orderExist || orderExist.length === 0)
//       return next(APIError.notFound("Order not Found"));
//     if (orderExist?.error) return next(APIError.badRequest(orderExist.error));
//     if (orderExist.storeStatus === CONSTANTS.ORDER_STATUS_OBJ.pickup)
//       return next(APIError.badRequest("Order has been Picked up already"));
//     if (orderExist.storeStatus !== CONSTANTS.ORDER_STATUS_OBJ.ready)
//       return next(APIError.badRequest("Order is not ready for pick up"));
//     if(orderExist.store.toString() !== req.user.toString()) return next(APIError.unauthorized());
//     // sign the text with jwt
//     const qrText = `${orderExist.qrText}-${shortIdGen()}`;
//     const signedQrText = jwt.sign({ data: qrText }, config.TOKEN_SECRETE, {
//       expiresIn: "5m",
//     }); 
//     const qrCode = await qrcodeService.generateQRCodeWithLogo(
//             qrText,
//             logoPath,
//             {
//               width,
//               logoSize,
//               errorCorrectionLevel: "H",
//             },
//           );
//     // const qrCode = await generateQRCode(signedQrText);
//     // generate random 6 digit code
//     const pickUpCode = OTPGen().toString();
//     const auth = {
//       code: pickUpCode,
//       token: signedQrText,
//     };
//     const data = {
//       _id: orderExist._id,
//       orderId,
//       storeId: orderExist.storeId,
//       auth,
//     };
//     const updateOrderAuth = await updateOrderVerificationInfo(data);
//     if (!updateOrderAuth)
//       return next(
//         APIError.badRequest("Failed to generate order pick up code, try again"),
//       );
//     if (updateOrderAuth?.error)
//       return next(APIError.badRequest(updateOrderAuth.error));
//     logger.info("Order pick up code generated successfully", {
//       service: META.ORDER,
//     });
//     return res
//       .status(200)
//       .json({
//         success: true,
//         msg: "Order pick up code generated successfully",
//         data: { pickUpCode, expiresIn: "5m" , qrCode,},
//       });
//   } catch (error) {
//     next(error);
//   }
// };
exports.verifyPickUpByQRCodeAndCode = async (req, res, next) => {
  let sectionUsed;
  try {
    const { qrCode, code } = req.body;
    const auth = {};
    let data;
    let orderExist;
    if (!qrCode && !code)
      return next(
        APIError.badRequest("Scan QR Code or provided code is required"),
      );
    if (code) {
      sectionUsed = "code";
      if (code.toString().length !== 6)
        return next(APIError.badRequest("Code must be 6 digits"));
      if (isNaN(code))
        return next(APIError.badRequest("Code must be only digits"));
      auth.code = code.toString();
      orderExist = await getOrderByQRData(auth);
      if (!orderExist || orderExist.length === 0)
        return next(APIError.notFound("Order not Found or Invalid Pick up Code"));
      if (orderExist?.error) return next(APIError.badRequest(orderExist.error));
      const token = orderExist.auth?.token;
      if (!token) return next(APIError.badRequest("Fake Pickup Detected"));
      const decoded = jwt.verify(token, config.TOKEN_SECRETE);
      if (!decoded)
        return next(APIError.badRequest("Pickup Code Expired"));
      data = decoded.data;
      logger.info("Code Token verified successfully", { service: META.ORDER });

    } else if (qrCode) {
      sectionUsed = "QRcode";
        auth.qrCode = qrCode.slice(0, qrCode.lastIndexOf('-')); 
      auth.pickUpCode = qrCode.slice(qrCode.lastIndexOf('-')+1).split(':')[1];
      orderExist = await getOrderByQRData(auth);
      if (!orderExist || orderExist.length === 0)
        return next(APIError.notFound("Invalid QR Code"));
      if (orderExist?.error) return next(APIError.badRequest(orderExist.error));
      const token = orderExist.auth?.token;
      if (!token) return next(APIError.badRequest("Fake Pickup Detected")); 
      const decoded = jwt.verify(token, config.TOKEN_SECRETE);
      if (!decoded)
        return next(APIError.badRequest("Invalid or expired QR Code"));
      logger.info("QR CODE verified successfully", { service: META.ORDER });
      auth.token = token;
      data = decoded.data; 
    }
    if (orderExist.storeStatus === CONSTANTS.ORDER_STATUS_OBJ.pickup )
      return next(APIError.badRequest("Order has been Picked up already"));
    if (orderExist.storeStatus !== CONSTANTS.ORDER_STATUS_OBJ.ready)
      return next(APIError.badRequest("Order is not ready for pick up"));
    if (orderExist.orderId !== data.split("-")[0])
      return next(APIError.badRequest("Unverified Order"));
    if (
      req.userId !== orderExist.riderId &&
      orderExist.orderId !== data.split("-")[0] && req.userType !== CONSTANTS.ACCOUNT_TYPE_OBJ.shopper
    )
      return next(APIError.unauthorized("Fake Rider for the Pickup"));
    logger.info("Rider and Order authenticated successfully", {
      service: META.ORDER,
    });
    const storeKYC = await getStoreAddress(orderExist.storeId);
    const {location} = storeKYC;
    const info = {
      _id: orderExist._id,
      orderId: orderExist.orderId,
      storeId: orderExist.storeId,
      auth: { pickedUpdAt: Date.now() },
      status: req.userType === CONSTANTS.ACCOUNT_TYPE_OBJ.shopper ? CONSTANTS.ORDER_STATUS_OBJ.delivered : CONSTANTS.ORDER_STATUS_OBJ.pickup,
      storeStatus:CONSTANTS.ORDER_STATUS_OBJ.pickup,
      qrCode: orderExist.qrCode,
    };
    const orderState = {
      status: req.userType === CONSTANTS.ACCOUNT_TYPE_OBJ.shopper ? CONSTANTS.ORDER_STATUS_OBJ.delivered : CONSTANTS.ORDER_STATUS_OBJ.pickup,
      by:req.user,
      type: req.userType,
      currentState: req.userType === CONSTANTS.ACCOUNT_TYPE_OBJ.shopper ? CONSTANTS.ORDER_STATUS_OBJ.delivered : CONSTANTS.ORDER_STATUS_OBJ.pickup,
    }
     info.riderCurrentLocation = location;
    info.orderState = orderState;
    const updateOrderAuth = await updateOrderVerificationInfo(info);
    if (!updateOrderAuth)
      return next(
        APIError.badRequest(
          "Failed to authenticate order pick up code, try again",
        ),
      );
    if (updateOrderAuth?.error)
      return next(APIError.badRequest(updateOrderAuth.error));
    logger.info("Order pick up completed successfully", {
      service: META.ORDER,
    });
    // get order owner 
    const shopper = await findUserByCustomId(orderExist.shopperId);
    if(!shopper) return next(APIError.badRequest("Account not found"));
    if(shopper?.error) return next(APIError.badRequest(shopper.error));
    // send email to notify user // app notification
    const options = {
      to: shopper.email,
      subject: req.userType === CONSTANTS.ACCOUNT_TYPE_OBJ.shopper ? `Order Pick up by YOu`:  `Order Pick up by Rider`,
      name: `${shopper.firstName} ${shopper.lastName}`,
      event: "orderPickup",
    }
     notification.emit("emailer", options)

    // notification
    const notifyData = {
      userId: orderExist.shopperId,
      title: req.userType === CONSTANTS.ACCOUNT_TYPE_OBJ.shopper ? "YOu picked up your Order" :"Order Picked Up",
      account: orderExist.shopper,
      category: CONSTANTS.NOTIFICATION_TYPE_OBJ.order,
      info: `Your order with Order ID: ${orderExist.orderId} has been picked up by  ${req.userType === CONSTANTS.ACCOUNT_TYPE_OBJ.shopper? "you": "the rider"}`,
    }; 
    notification.emit("notify", notifyData)
    
    res
      .status(200)
      .json({ success: true, msg: "Pick up completed successfully" });
  } catch (error) { 
    if (error.message === ERROR_FIELD.JWT_EXPIRED && sectionUsed === "code")
      next(APIError.badRequest("Pick up CODE expired"));
    if (error.message === ERROR_FIELD.JWT_EXPIRED && sectionUsed === "QRcode")
      next(APIError.badRequest("Pick up QR CODE expired"));
    else next(error);
  }
};
// exports.verifyPickUpByQRCode = async (req, res, next) => {
//   let sectionUsed;
//   try {
//     const {id} = req.params;
//     const auth = {};
//     let data;
//     let orderExist;
//     if (!id )
//       return next(
//         APIError.badRequest("Scan QR Code"),
//       );
      
//       auth.qrcode = id.slice(0, id.lastIndexOf('-')); 
//       auth.pickUpCode = id.slice(id.lastIndexOf('-'));
//       console.log(auth)
//       orderExist = await getOrderByQRData(auth);
//       if (!orderExist || orderExist.length === 0)
//         return next(APIError.notFound("Order not Found"));
//       if (orderExist?.error) return next(APIError.badRequest(orderExist.error));
//       // verify token
//       const token = orderExist.auth?.token;
//       if (!token) return next(APIError.badRequest("Fake Pickup Detected"));
//       const decoded = jwt.verify(token, config.TOKEN_SECRETE);
//       if (!decoded)
//         return next(APIError.badRequest("Pickup Code Expired"));
//       data = decoded.data;
//       logger.info("QR CODE verified successfully", { service: META.ORDER });
//     if (orderExist.storeStatus === CONSTANTS.ORDER_STATUS_OBJ.pickup)
//       return next(APIError.badRequest("Order has been Picked up already"));
//     if (orderExist.storeStatus !== CONSTANTS.ORDER_STATUS_OBJ.ready)
//       return next(APIError.badRequest("Order is not ready for pick up"));
//     if (orderExist.orderId !== data.split("-")[0])
//       return next(APIError.badRequest("Unverified Order"));
//     if (
//       req.userId !== orderExist.riderId &&
//       orderExist.orderId !== data.split("-")[0]
//     )
//       return next(APIError.unauthorized("Fake Rider for the Pickup"));
//     logger.info("Rider and Order authenticated successfully", {
//       service: META.ORDER,
//     });
//  const storeKYC = await getStoreAddress(orderExist.storeId);
//     const {location} = storeKYC;
    
//     const info = {
//       _id: orderExist._id,
//       orderId: orderExist.orderId,
//       storeId: orderExist.storeId,
//       auth: { pickedUpdAt: Date.now() },
//       status: CONSTANTS.ORDER_STATUS_OBJ.pickup,
//       storeStatus:CONSTANTS.ORDER_STATUS_OBJ.pickup,
//     };
//     const orderState = {
//       status: CONSTANTS.ORDER_STATUS_OBJ.pickup,
//       by:req.user,
//       type: req.userType,
//       currentState: CONSTANTS.ORDER_STATUS_OBJ.pickup,
//     }
//     info.riderCurrentLocation = location;
//     info.orderState = orderState;
//     const updateOrderAuth = await updateOrderVerificationInfo(info);
//     if (!updateOrderAuth)
//       return next(
//         APIError.badRequest(
//           "Failed to authenticate order pick up code, try again",
//         ),
//       );
//     if (updateOrderAuth?.error)
//       return next(APIError.badRequest(updateOrderAuth.error));
//     logger.info("Order pick up completed successfully", {
//       service: META.ORDER,
//     }); 
//   // get order owner 
//     const shopper = await findUserByCustomId(orderExist.shopperId);
//     if(!shopper) return next(APIError.badRequest("Account not found"));
//     if(shopper?.error) return next(APIError.badRequest(shopper.error));
//     // send email to notify user // app notification
//     const options = {
//       to: shopper.email,
//       subject: `Order Pick up by Rider`,
//       name: `${shopper.firstName} ${shopper.lastName}`,
//       event: "orderPickup",
//     }
//      notification.emit("emailer", options)

//     // notification
//     const notifyData = {
//       userId: orderExist.shopperId,
//       title: "Order Picked Up",
//       account: orderExist.shopper,
//       category: CONSTANTS.NOTIFICATION_TYPE_OBJ.order,
//       info: `Your order with Order ID: ${orderExist.orderId} has been picked up by the rider`,
//     }; 
//     notification.emit("notify", notifyData)
    
//     res
//       .status(200)
//       .json({ success: true, msg: "Pick up completed successfully" });
//   } catch (error) {
  
//     if (error.message === ERROR_FIELD.JWT_EXPIRED)
//       next(APIError.badRequest("Pick up QR CODE expired"));
//     else next(error);
//   }
// };
exports.getOrderQRCode = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    if (!orderId) return next(APIError.badRequest("Order ID is required"));
    const query = {};
    if (req.userType === CONSTANTS.ACCOUNT_ROLE_OBJ.business) {
      query.storeId = req.storeId;
    } else if (req.userType === CONSTANTS.ACCOUNT_ROLE_OBJ.shopper) {
      query.shopper = req.user;
    } else if (req.userType === CONSTANTS.ACCOUNT_ROLE_OBJ.rider) {
      query.rider = req.user;
    } else if (req.userType === CONSTANTS.ACCOUNT_ROLE_OBJ.admin) {
      query.orderId = orderId;
    }

    const order = await findOrderForQRCodeGeneration(orderId, query);
    if (!order) return next(APIError.notFound("Order not Found"));
    if (order?.error) return next(APIError.badRequest(order.error));
    if(order.storeStatus === CONSTANTS.ORDER_STATUS_OBJ.pickup && req.userType !== CONSTANTS.ACCOUNT_TYPE_OBJ.shopper) return next(APIError.badRequest("Order has been pickup already"))
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
    const updateToken = await updateOrderVerificationInfo(data)
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
exports.getOderDistance = async (req, res, next) => {
  try {
    const { storeId, lat, lng } = req.query;
    if (!storeId) return next(APIError.badRequest("Store ID is required"));
    if (!lat)
      return next(
        APIError.badRequest("Shopper latitude coordinate is required"),
      );
    if (!lng)
      return next(
        APIError.badRequest("Shopper longitude coordinate is required"),
      );
    if (isNaN(lat) || isNaN(lng))
      return next(
        APIError.badRequest("Location coordinate must be digit only"),
      );
    const verify = await verifyLocation({ latitude: lat, longitude: lng });
    if (verify?.error) return next(APIError.badRequest(verify.error));
    //check for store
    const storeInfo = await getStoreAddress(storeId);
    if (!storeInfo) return next(APIError.notFound("Store not found"));
    if (storeInfo?.error) return next(APIError.badRequest(storeInfo.error));
    if (storeInfo.location.hasOwnProperty("latitude") === false)
      return next(APIError.badRequest("Store address could not be verified"));
    let storeAddress = null;
    const { location } = storeInfo;
    storeAddress = storeInfo.location;
    const dis = await getDistanceKmBetweenAddresses(
      { lat, lng },
      { lat: location.latitude, lng: location.longitude },
      {
        apiKey: config.GOOGLE_MAPS_API_KEY,
        mode: CONSTANTS.TRANSPORTATION_MODE.driving,
      },
    );
    

    if (dis?.error) return next(APIError.badRequest(dis.error));
    const data = {
      distance: dis.distance.text,
      duration: dis.duration.text,
    };
    // compute delivery cost
    data.deliveryPrice =
      (dis.distance.value / 1000).toFixed(1) *
      Number(config.DELIVERY_FEE_PER_KM);
    data.deliveryPrice += Number(config.DEFAULT_DELIVERY_FEE);
    
    logger.info(`Delivery Price calculated successfully `, {
      service: META.ORDER,
    });
    res
      .status(200)
      .json({ success: true, msg: "Calculated Delivery cost", data });
  } catch (error) {
    next(error);
  }
};
exports.acceptOrder = async (req, res, next) => {
  try {
    const { orderId, status } = req.body;
    const rider = {};
    if (!orderId) return next(APIError.badRequest("Order ID is required"));
    if (!status) return next(APIError.badRequest("Status is required"));
    if (status.toLowerCase() !== "accept" && status.toLowerCase() !== "reject")
      return next(APIError.badRequest("Invalid order status"));
    // get user location data
    const userInfo = await userExistById(req.user);
    const kyc = await getUserKYC(req.user);
    if (!userInfo.verified)
      return next(
        APIError.unauthorized("completed onboarding and get verified"),
      );
    const { location } = kyc;
    const { locationData } = userInfo;
    if (locationData || location?.lat !== 0) {
      rider.riderCurrentLocation = {
        latitude: locationData.lat,
        longitude: locationData.lng,
        formattedAddress: locationData.others?.formattedAddress,
      };
      rider.isAvailable = status.toLowerCase() == "accept" ? false : true;
      rider.riderId = userInfo.userId;
      rider.type = req.userType;
      ((rider.rider = userInfo._id),
        (rider.status =
          status.toLowerCase() == "accept"
            ? CONSTANTS.ORDER_STATUS_OBJ.accepted
            : CONSTANTS.ORDER_STATUS_OBJ.pending),
        (rider.operation = status.toLowerCase()));
    } else {
      rider.riderCurrentLocation = {
        ...location,
      };
      rider.isAvailable = status.toLowerCase() == CONSTANTS.ORDER_STATUS_OBJ.accept ? false : true;
      rider.riderId = userInfo.userId;
      rider.rider = userInfo._id;
      rider.type = req.userType;
      ((rider.status =
        status.toLowerCase() == CONSTANTS.ORDER_STATUS_OBJ.accept
          ? CONSTANTS.ORDER_STATUS_OBJ.accept
          : CONSTANTS.ORDER_STATUS_OBJ.pending),
        (rider.operation = status.toLowerCase().concat("ed")));
    }
    const data = await acceptOrRejectOrder(rider, orderId);
    if (!data)
      return next(
        APIError.badRequest("Order acceptance could not completed, try again"),
      );
    if (data?.error) return next(APIError.badRequest(data.error));

    // notify
    const info = {
      title: CONSTANTS.ORDER_STATUS_OBJ.accept ? "Order Acceptance": "Order Cancelled",
      account: userInfo._id,
      category: CONSTANTS.NOTIFICATION_TYPE_OBJ.order,
      userId: userInfo.userId,
      info: CONSTANTS.ORDER_STATUS_OBJ.accept ?`Your order delivery has been accept by a rider`: "Your order delivery has been cancelled by the rider",
      userId: req.userId,
    };
    notification.emit("notify", info);
    // SEND NOTIFICATION MAIL
    logger.info("Notification created successfully", { service: META.ORDER });
    const payload = {
      to: userInfo.email,
      subject: CONSTANTS.ORDER_STATUS_OBJ.accept ? "Order Acceptance by Rider": "Order Cancelled by Rider",
      name: `${userInfo.firstName}`,
      event: CONSTANTS.EMAIL_TEMPLATES_OBJ.orderEmail,
    };
    notification.emit("emailer", payload);

    res
      .status(200)
      .json({ status: "success", msg: `Order ${status}ed successfully` });
  } catch (error) {
    next(error);
  }
};
exports.getAcceptedOrders = async (req, res, next) => {
  try {
    if (req.userType?.toLowerCase() !== CONSTANTS.ACCOUNT_ROLE_OBJ.rider) {
      return next(
        APIError.unauthorized("You are not authorized to view accepted orders"),
      );
    }
    let query;
    const { search } = req.query;
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 10));
    const skip = (page - 1) * limit;
    if (req.userType === CONSTANTS.ACCOUNT_TYPE_OBJ.rider) {
      query = {
        rider: req.user,
        // status: CONSTANTS.ORDER_STATUS_OBJ.accepted,
       status: { $ne: CONSTANTS.ORDER_STATUS_OBJ.delivered } ,
       // riderId: req.userId,
      };
    } else if (req.userType === CONSTANTS.ACCOUNT_TYPE_OBJ.shopper) {
      query = {
        shopper: req.user,
      };
    }

    if (search) {
      query.orderId = new RegExp(search, "i");
    }
    const { orders, total } = await getRiderOrder(query, skip, limit);
    if (!orders) {
      return res.status(200).json({
        success: true,
        msg: "No accepted orders yet",
        data: [],
        count: 0,
        total,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
      });
    }
    if (orders?.error) return next(APIError.badRequest(orders.error));
    const totalPages = total > 0 ? Math.ceil(total / limit) : 0;

    return res.status(200).json({
      success: true,
      msg:
        orders.length > 0
          ? "Accepted orders retrieved successfully"
          : "No accepted orders yet",
      data: orders,
      count: orders.length,
      total,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    next(error);
  }
};
exports.trackOrder = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    if (!orderId) return next(APIError.badRequest("Order ID is required"));
    const orderExist = await getOrderByIdForVerification(orderId);
    if (!orderExist || orderExist.length === 0)
      return next(APIError.notFound("Order not Found"));
    if (orderExist?.error) return next(APIError.badRequest(orderExist.error));
    if (orderExist.storeStatus !== CONSTANTS.ORDER_STATUS_OBJ.pickup)
      return next(APIError.badRequest("Order have not been Picked up"));
    const { riderCurrentLocation, destinationAddress } = orderExist;

    return res
      .status(200)
      .json({ success: true, destinationAddress, riderCurrentLocation });
  } catch (error) {
    next(error);
  }
};
exports.getStoreOrderByAdmin = async (req, res, next) => {
  try {
    const { storeId } = req.params;
    let query,
      page = 1,
      limit = 10;
    if (!storeId) return next(APIError.badRequest("Store ID is required"));
    // get order
    query = {
      storeId: storeId,
      status: { $nin: [CONSTANTS.ORDER_STATUS_OBJ.draft] },
    };
    const orders = await storeOrders(query, page, limit);
    if (!orders) return next(APIError.notFound("No orders found"));
    if (orders?.error) return next(APIError.badRequest(orders.error));
    logger.info("Orders fetched successfully", { service: META.ORDER });
    const totalPages = Math.ceil(orders.length / limit);

    return res.status(200).json({
      success: true,
      msg: orders.length > 0 ? "Orders retrieved successfully" : "No order yet",
      data: orders,
      count: orders.length,
      pagination: {
        page,
        limit,
        total: orders.length,
        hasNext: page < totalPages,
        hastPrev: page > 1,
      },
    });
  } catch (error) {
    next(error);
  }
};


exports.getAccountOrders = async (req, res, next) => {
  try {
    const { search, status, type, userId, riderId } = req.query;
    const query = {};
    if(!userId && !riderId) return next(APIError.badRequest("Targeted user ID is required (riderId/userId)"));
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 10));
    const skip = (page - 1) * limit;
    const pipeline = [];
    if (userId) {
      if (status) {
        query.$and = [
          { status: status },
          { shopperId: UserId },
        ];
      } else if (search) {
        query.$and = [
          { shopperId: userId},
          // {status: {$nin: [CONSTANTS.ORDER_STATUS_OBJ.draft] }}
        ];
      } else {
        query.$and = [
          { shopperId: userId },
          //{status: {$nin: [...CONSTANTS.ORDER_STATUS_OBJ.draft] }}
        ];
      }
    } else if(riderId) {
         if (status) {
        query.$and = [
          { status: status },
          { riderId: riderId },
        ];
      } else if (search) {
        query.$and = [
          { riderId: riderId},
          // {status: {$nin: [CONSTANTS.ORDER_STATUS_OBJ.draft] }}
        ];
      } else {
        query.$and = [
          { riderId: riderId },
          //{status: {$nin: [...CONSTANTS.ORDER_STATUS_OBJ.draft] }}
        ];
      }
    }
     
    // get order
    const orders = await storeOrders(query, page, limit);
    if (!orders) return next(APIError.notFound("No orders found"));
    if (orders?.error) return next(APIError.badRequest(orders.error));
    logger.info("Orders fetched successfully", { service: META.ORDER });
    const totalPages = Math.ceil(orders.length / limit); 
    
      return res.status(200).json({
        success: true,
        msg:
          orders.length > 0 ? "Orders retrieved successfully" : "No order yet",
        data: orders,
        count: orders.length,
        pagination: {
          page,
          limit,
          total: orders.length,
          hasNext: page < totalPages,
          hastPrev: page > 1,
        },
      });
  } catch (error) {
    next(error);
  }
};
exports.verifyDeliveryByQRCodeAndCode = async (req, res, next) => {
  let sectionUsed;
  try {
    const { qrCode, code, orderId } = req.body;
    const auth = {};
    let data;
    let orderExist;
    if(!orderId) return next(APIError.badRequest("Order ID is required"));
    if (!qrCode && !code)
      return next(
        APIError.badRequest("Scan QR Code or provided code is required"),
      );
    if (code) {
      sectionUsed = "code";
      if (code.toString().length !== 6)
        return next(APIError.badRequest("Code must be 6 digits"));
      if (isNaN(code))
        return next(APIError.badRequest("Code must be only digits"));
      auth.code = code.toString();
      orderExist = await getOrderByQRData(auth);
      if (!orderExist || orderExist.length === 0)
        return next(APIError.notFound("Order not Found or Invalid Delivery Code"));
      if (orderExist?.error) return next(APIError.badRequest(orderExist.error));
      const token = orderExist.auth?.token;
      if (!token) return next(APIError.badRequest("Fake Delivery Detected"));
      const decoded = jwt.verify(token, config.TOKEN_SECRETE);
      if (!decoded)
        return next(APIError.badRequest("Delivery Code Expired"));
      data = decoded.data;
      logger.info("Code verified successfully", { service: META.ORDER });

    } else if (qrCode) {
      sectionUsed = "QRcode";
        auth.qrCode = qrCode.slice(0, qrCode.lastIndexOf('-')); 
      auth.pickUpCode = qrCode.slice(qrCode.lastIndexOf('-')+1).split(':')[1];
      orderExist = await getOrderByQRData(auth);
      if (!orderExist || orderExist.length === 0)
        return next(APIError.notFound("Invalid QR Code"));
      if (orderExist?.error) return next(APIError.badRequest(orderExist.error));
      const token = orderExist.auth?.token;
      if (!token) return next(APIError.badRequest("Fake Delivery Detected")); 
      const decoded = jwt.verify(token, config.TOKEN_SECRETE);
      if (!decoded)
        return next(APIError.badRequest("Invalid or expired QR Code"));
      logger.info("QR CODE verified successfully", { service: META.ORDER });
      auth.token = token;
      data = decoded.data; 
    }
    if (orderExist.storeStatus === CONSTANTS.ORDER_STATUS_OBJ.delivered)
      return next(APIError.badRequest("Order has been Delivered already"));
    if (orderExist.storeStatus !== CONSTANTS.ORDER_STATUS_OBJ.pickup)
      return next(APIError.badRequest("Order is not ready for Delivery"));
    if (orderExist.orderId !== data.split("-")[0])
      return next(APIError.badRequest("Unverified Delivery"));
    if (
      req.userId !== orderExist.riderId &&
      orderExist.orderId !== data.split("-")[0]
    )
      return next(APIError.unauthorized("Fake Rider for the Delivery"));
    logger.info("Rider and Order authenticated successfully", {
      service: META.ORDER,
    });
    const {destinationAddress} = orderExist;
    const storeKYC = await getStoreAddress(orderExist.storeId);
    const {location} = storeKYC;
    const info = {
      _id: orderExist._id,
      orderId: orderExist.orderId,
      storeId: orderExist.storeId,
      auth: { deliveredAt: Date.now() },
      status: CONSTANTS.ORDER_STATUS_OBJ.delivered,
      storeStatus:CONSTANTS.ORDER_STATUS_OBJ.delivered,
      qrCode: orderExist.qrCode,
    };
    const orderState = {
      status: CONSTANTS.ORDER_STATUS_OBJ.delivered,
      by:req.user,
      type: req.userType,
      currentState: CONSTANTS.ORDER_STATUS_OBJ.delivered,
    }
     
    info.orderState = orderState;
    // get order delivery for the grubbex
    const commission = destinationAddress.deliveryPrice * (config.ORDER_SERVICE_CHARGE_PERCENTAGE / 100);    const userWallet = await walletBalance(req.user);
    if (!userWallet)
              return next(APIError.badRequest("User Wallet not found"));
     
    const details = {
            balanceBefore: userWallet.balance,
            user: req.user,
            initiatedBy: req.user,
            amount: destinationAddress.deliveryPrice - commission,
            credit: destinationAddress.deliveryPrice - commission,
            description: `Payment for order ${ orderExist.orderId}`,
            type: CONSTANTS.TRANSACTION_TYPE.credit,
             reference: orderExist.reference,
             currency: "NGN",
             status: CONSTANTS.ORDER_PAYMENT_STATUS.success,
             order: orderExist._id,
             orderId: orderExist.orderId,
             balanceAfter: userWallet.balance + destinationAddress.deliveryPrice - commission
          };

    const updateOrderAuth = await completeOrderDelivery(info, details);
    if (!updateOrderAuth)
      return next(
        APIError.badRequest(
          "Failed to authenticate order Delivery code, try again",
        ),
      );
    if (updateOrderAuth?.error)
      return next(APIError.badRequest(updateOrderAuth.error));
    logger.info("Order Delivery completed successfully", {
      service: META.ORDER,
    });
    // get order owner 
    const shopper = await findUserByCustomId(orderExist.shopperId);
    if(!shopper) return next(APIError.badRequest("Account not found"));
    if(shopper?.error) return next(APIError.badRequest(shopper.error));
    // send email to notify user // app notification
    const options = {
      to: shopper.email,
      subject: `Order Delivered by Rider`,
      name: `${shopper.firstName} ${shopper.lastName}`,
      event: "orderDelivery",
    }
     notification.emit("emailer", options)

    // notification
    const notifyData = {
      userId: orderExist.shopperId,
      title: "Order Delivered",
      account: orderExist.shopper,
      category: CONSTANTS.NOTIFICATION_TYPE_OBJ.order,
      info: `Your order with Order ID: ${orderExist.orderId} has been delivered by the rider`,
    }; 
    notification.emit("notify", notifyData)
    const dataInfo = {
      userId: req.userId,
      title: "Order Delivered",
      account: orderExist.rider,
      category: CONSTANTS.NOTIFICATION_TYPE_OBJ.transaction,
      info: `Payment for Order ID: ${orderExist.orderId} delivered received successfully`,
    }; 
    notification.emit("notify", dataInfo);
    
    res
      .status(200)
      .json({ success: true, msg: "Delivery completed successfully" });
  } catch (error) { 
    if (error.message === ERROR_FIELD.JWT_EXPIRED && sectionUsed === "code")
      next(APIError.badRequest("Delivery CODE expired"));
    if (error.message === ERROR_FIELD.JWT_EXPIRED && sectionUsed === "QRcode")
      next(APIError.badRequest("Delivery QR CODE expired"));
    else next(error);
  }
};
