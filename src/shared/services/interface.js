// temporal Account section
const TemporalModules  = require ("./temporal.service")
const AccountModules = require("./account.service")
const SubscriptionModule = require("./subscription.service");
const PaginationModule = require("./pagination");
const KYCModule = require("./kyc.service");
const NotificationModule = require("./notification.service");
const ChatModule = require("./chat.service");
const TicketModule = require("./ticket.service");
const FAQModule = require('./faq.service');
const ShippingAddressModule = require("./shipping.address.service");
const PaymentModule = require("./flutter.payment.services");
const OrderModule = require("./order.service");
const PayStackModule = require("./paystack.payment.services");
const WalletModule = require("./wallet.service");
const MutedOrderModel = require("./muted.order.service");  
const PayoutModule = require("./payout.service");
const LocationModule = require("./location.service");

exports.temporalAccExist =async (email) => await TemporalModules.findTemAccount(email);
exports.temporalAccExistByToken =async (token) => await TemporalModules.findTemAccountByToken(token);
exports.createTemporalAccount = async (schema, data) => await TemporalModules.registerTempAccount(data)
exports.createRecoveryTempInfo = async (schema, data) => await TemporalModules.recoveryTempInfo(data)
exports.send2FA_OTP = async (schema, data) => await TemporalModules.create2FA_OTP(data);
exports.mFA_status_update = async (id, status) => AccountModules.mFA_status(id, status);

exports.userExist = async (info) => await TemporalModules.findUser(info);
exports.roleExist = async (info) => await TemporalModules.findByRole(info);
exports.userExistByMail = async (email) => await TemporalModules.findUserByEmail(email);
exports.userExistToken = async (refreshToken) => await TemporalModules.findUserByToken(refreshToken);
exports.userExistById = async (id) => await TemporalModules.findUserById(id);
exports.saveOrderOTP = async(details) => await TemporalModules.createOrderOTP(details);
exports.getOrderOTP = async(details) => await TemporalModules.orderOTP(details);
exports.findUserByCustomId = async (userId) => await TemporalModules.findUserByCustomId(userId);
//ACCOUNT SECTION
exports.removeAccount = async (userId) => await AccountModules.delete(userId);
exports.createAccount = async (data) => await AccountModules.registerAccount(data);
exports.adminAccounts = async (search) => await AccountModules.admins(search);

// SUBSCRIPTION SECTION
exports.subscribe = async (info) =>  await SubscriptionModule.create(info);
exports.removeSubscription = async (info) => await SubscriptionModule.delete(info);
exports.updateSubscription = async (info) => await SubscriptionModule.update(info);
exports.searchSubscription = async (info) => await SubscriptionModule.search(info);
// PAGINATION
exports.paginateQuery = async (model, query={}, page = 1, limit = 10) => await PaginationModule.paginate(model, query={}, page = 1, limit = 10);

exports.searches = async (model, query, page, limit) => await PaginationModule.search(model, query, page, limit);


// KYC Section
exports.KYCUpdate = async (info) => await KYCModule.update(info);
exports.KYCcheck = async (user) => await KYCModule.checkKYC(user);
exports.getUserKYC = async (user) => await KYCModule.KYC(user);
exports.getUserKYCByAccountId = async (user) => await KYCModule.KYCByAccountId(user);
exports.updateUserKYCStatus = async (search, info) => await KYCModule.updateStatus(search, info);
exports.searchUserKYC = async (search) => await KYCModule.KYCSearch(search);
exports.cityInfoUpdate = async (info) => await KYCModule.updateCityInfo(info)
exports.getCityInfo = async () => await KYCModule.cityInfo()
exports.getTownInfo = async (cityId) => await KYCModule.townInfo(cityId);
exports.getStoreInfo = async (query) => await KYCModule.storeAddress(query);
exports.getStoreAddress = async (storeId) => await KYCModule.getStoreAddress(storeId);

 // NOTIFICATION SECTION
exports.getUserNotifications = async (account) => await NotificationModule.notifications(account);
exports.getUserNotificationByStatus = async (account, query) => await NotificationModule.NotificationByStatus(account, query)
exports.createUserNotification = async (info) => await NotificationModule.create(info);
exports.searchUseNotification = async (search) => await NotificationModule.searchNotification(search);
exports.viewNotification = async (id, viewed=true) => await NotificationModule.viewNotification(id, viewed);
exports.markAllAsRead = async (account, viewed = true) => await NotificationModule.markAllAsRead(account, viewed);
exports.removeNotification = async (notificationId, account) => await NotificationModule.remove(notificationId, account);

// CHAT SECTION
exports.sendChat = async (info) => await ChatModule.send(info);
exports.chatsByReceiver = async (receiver, sender) => await ChatModule.chatsByReceiver(receiver, sender);
exports.getSentAndReceivedChats = async (receiver) => await ChatModule.sentAndReceivedChats(receiver);
exports.getNewChats = async (receiver) => await ChatModule.newChats(receiver);
exports.updateReceivedChat = async (info) => await ChatModule.updateChatStatus(info);
exports.deleteSentChat = async (sender, chatId) => await ChatModule.deleteChat(sender, chatId);

// TICKET SECTION
exports.createTicket = async (details) => await TicketModule.open(details);
exports.findTicket = async (query, user) => await TicketModule.getTickets(query, user);
exports.closeTicket = async (ticketId, userinfo) => await TicketModule.close(ticketId, userinfo);
exports.updateTicket = async (ticketId, details) => await TicketModule.update(ticketId, details);
exports.createNewChat = async (ticketId, details) => await TicketModule.createChat(ticketId, details);
exports.readUserChat = async (ticketId, chatId, userId) => await TicketModule.read(ticketId, chatId, userId);

// FAQ SECTION
exports.createNewFAQ = async (details) => await FAQModule.createFAQ(details);
exports.getAllFAQ = async (query, userType) => await FAQModule.getFAQ(query, userType);
exports.getFAQById = async (id, userType) => await FAQModule.getFAQById(id, userType);
exports.removeFAQ = async (id) => await FAQModule.deleteFAQ(id);
exports.updateFAQ = async (id, details) => await FAQModule.updateFAQ(id, details);

// SHIPPING ADDRESS SECTION
exports.createShippingAddress = async (shippingAddress) => await ShippingAddressModule.create(shippingAddress);
exports.getShippingAddressByUserId = async (query) => await ShippingAddressModule.findByUserId(query);
exports.deleteShippingAddressById = async (addressId, userId) => await ShippingAddressModule.deleteById(addressId, userId);
exports.updateShippingAddressById = async (addressId, userId, updateData) => await ShippingAddressModule.updateById(addressId, userId, updateData);

//Flutterwave Payment section
exports.orderWithCard = async ({ amount, currency, email, tx_ref, cardDetails }) => PaymentModule.payWithCard({ amount, currency, email, tx_ref, cardDetails });
exports.validateCardOTP = async ({ flw_ref, otp }) => PaymentModule.validateCardOTP({ flw_ref, otp });
exports.payment = async (user, amount) => PaymentModule.pay(user, amount);
exports.fundWallet = async (user, amount) => PaymentModule.fund(user, amount);
exports.getWalletBalance = async (user) => PaymentModule.walletBalance(user);
exports.getWalletHistory = async (user) => PaymentModule.WalletHistory(user);
exports.updateWalletHistory = async (info) => PaymentModule.updateHistory(info);

// PayStack Payment section
exports.payStackPayWithCard =  async(payload) =>  await PayStackModule.payWithCard(payload);
exports.createTempTransaction = async (info) => await PayStackModule.createTemporalTrans(info);
exports.getTemporalTransaction = async (query) => await PayStackModule.findTemporalTransaction(query);
exports.removeTemporalTransaction = async (query) => await PayStackModule.deleteTemporalTransaction(query);

// ORDER SECTION
exports.createDraftOrder = async (info) => await OrderModule.createDraft(info);
exports.verifyPayStackTransaction = async (payload) => await PayStackModule.verifyTransaction(payload);
exports.getOrderByReference = async (reference) => await OrderModule.orderByReference(reference);
exports.updateCompletedOrder = async (info, reference) => await OrderModule.updateOrderDetails(info, reference)
exports.storeOrders = async (query, page, limit) => await OrderModule.allOrders(query, page, limit);
exports.updateOrderStatus = async (query, status) => await OrderModule.updateOrderStatus(query, status);
exports.getOrderById = async (orderId) => await OrderModule.orderById(orderId);
exports.getOrderByIdForVerification = async (orderId) => await OrderModule.orderByIdForAuth(orderId);
exports.updateOrderVerificationInfo = async (info) => await OrderModule.updateOrderByIdForAuth(info);
exports.getOrderByQRData = async (info) => await OrderModule.findOrderByQRInfo(info);
exports.findOrderForQRCodeGeneration = async (orderId, info) => await OrderModule.findOrderForQRCodeGeneration(orderId, info);
exports.updateOrderQRCodeInfo = async (orderId, info) => await OrderModule.updateOrderQRCodeInfo(orderId, info);

// WALLET SECTION
exports.updateAdminWallet = async (info) => await WalletModule.adminWalletUpdate(info);
exports.updateWallet = async (info) => await WalletModule.walletUpdate(info);
exports.createTransactionHistory = async (info) => await WalletModule.newTransactionHistory(info);
exports.getWalletHistory = async (user) => await WalletModule.walletHistory(user);
exports.getWalletHistoryByDateRange = async (user, startDate, endDate) => await WalletModule.walletHistoryByDateRange(user, startDate, endDate);
exports.walletBalance = async (user) => await WalletModule.walletBalance(user);


// MUTED ORDER SECTION
exports.updateMutedOrder = async (orderId, duration) => await MutedOrderModel.updateMutedOrder(orderId, duration);
exports.findMutedByUser = async (riderId) => await MutedOrderModel.findMutedByUser(riderId);
exports.findMuted = async (query) => await MutedOrderModel.find(query);
exports.muteOrder = async (info) => await MutedOrderModel.create(info);


// PAYOUT SECTION
exports.createPayout = async (info) => await PayoutModule.create(info);
exports.getPayouts = async (status ="all", type = "business", search = null) => await PayoutModule.getPayouts(status, type, search);
exports.getRecentPayouts = async (status, type = "business", limit = 5) => await PayoutModule.getRecentPayouts(status, type, limit);
exports.getPayoutsAggregate = async (statuses, type = "business") => await PayoutModule.payoutAggregate(statuses, type);
exports.getTodayPayoutsAggregate = async (status, type = "business") => await PayoutModule.todayPayoutAggregate(status, type);
exports.topPayouts = async (type = "business", limit = 5) => await PayoutModule.topPayouts(type, limit);

// LOCATION SECTION
exports.updateLocationAndAvailability = async ( accountId,info) => await LocationModule.updateLocationAndAvailability(accountId, info);
exports.getRiderLocation = async (accountId) => await LocationModule.getRiderLocation(accountId);
exports.getOrderLocation = async (orderId, accountId) => await LocationModule.getOrderLocation(orderId, accountId);


// PROMOTION SECTION