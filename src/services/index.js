const AccountModule = require("./account.services"); 
const StoreCategoryModule = require("../api/store/service/store.category.service") 
const ItemModule = require("./item.service");
const BookingModule = require("./booking.service");
const KYCModule = require("./kyc.services");
const NotificationModule = require("../shared/services/notification.service");
const PreferenceModule = require("./preference.service");
const LikeModule = require("./likes.rating.service");
const ReviewModule = require("./review.service");
const PromotionModule = require("./promotion.service");
const SettingModule = require("./setting.service");

exports.registerUser = async (details) => AccountModule.register(details);
exports.registerTemUser = async(details) => AccountModule.registerTempAccount(details);
exports.updateUserTempToken = async (tokenInfo) => AccountModule.updateTempToken(tokenInfo);
exports.getTemporalUser = async (id, refreshToken, otp) => AccountModule.temporalUser(id, refreshToken, otp);
exports.deleteTempUser = async (id) => AccountModule.removeTempAccount(id);
exports.updateUserTempOTP = async (id, info) => AccountModule.updateTempOtp(id, info);
exports.removeUserTempToken = async (info) => AccountModule.deleteTempToken(info);
exports.createAdmin = async (details) => AccountModule.create(details);
exports.defaultAccount = async (details) => AccountModule.defaultRegistration(details);
exports.emailExist = async (email) => AccountModule.checkEmail(email);
exports.usernameExist = async (username) => AccountModule.checkUsername(username);
exports.logOutUser = async (id) => AccountModule.logOut(id);
exports.updateUserToken = async (id, refreshToken,token) => AccountModule.updateToken(id, refreshToken,token);
exports.getUserById = async (id) => AccountModule.checkById(id);
exports.updateUserPass = async (id, password) => AccountModule.updatePassword(id, password);
exports.getUserAccounts = async (search) => AccountModule.userAccounts(search);
exports.deleteUser = async (email) => AccountModule.removeAccount(email);
exports.userExistByEmail = async (email) => AccountModule.checkByEmail( email);
exports.passwordRecovery = async (info) => AccountModule.passwordRecoveryInfo(info);
exports.getPasswordRecoveryInfo = async (id) => AccountModule.getRecoveryInfo(id);
exports.removePasswordRecoveryInfo = async (id) => AccountModule.deleteRecoveryInfo(id); 
exports.updateUserInfo = async (id, details) => AccountModule.updateAccount(id, details);
exports.getAdmins = async () => AccountModule.getAdmin();
exports.getProfile = async (id) => AccountModule.profile(id);
exports.recoverInfoByRef = async (ref) => await AccountModule.getRecoveryInfoByRef(ref);
exports.getAccountByGrubbexId = async (grubbexId) => AccountModule.getAccountByGrubbexId(grubbexId);
exports.getAccountsForChat = async (senderInfo) => AccountModule.getAccountsForChat(senderInfo);
exports.updateAccountContact = async (user, contact) => await AccountModule.updateContact(user, contact);
exports.checkPhoneNumberExist = async (phone) => await AccountModule.phoneNumberExist(phone)

//  ITEM SECTION
exports.createItem = async (info) => ItemModule.create(info);
exports.updateItem = async (id, info) => ItemModule.update(id, info);
exports.deleteItem = async (id) => ItemModule.remove(id);
exports.getItems = async () => ItemModule.items();
exports.getItemById = async (id) => ItemModule.itemById(id);
exports.getItemsByCategory = async (category) => ItemModule.itemsByCategory(category);
exports.removeItem = async (id) => ItemModule.remove(id);

// Booking Section
exports.createBooking = async (info) => BookingModule.booking(info)
exports.cancelBooking = async (info) => BookingModule.cancel(info)
exports.getBookings = async (user, bookId ) => BookingModule.bookings(user, bookId)
exports.updateBooking = async( info, bookId, userId) => BookingModule.update(info, bookId, userId);
exports.bookingStatus = async(status, bookId, userId) => BookingModule.status(status, bookId, userId);
exports.getBookingById = async (bookId) => BookingModule.bookingById(bookId);
exports.BookingsAvailable = async () =>BookingModule.availableBookings();
exports.acceptRejectBooking = async (bookId, user, status) => BookingModule.updateBookingStatus(bookId, user, status);
exports.getMuvaBookings = async (muva, status) => BookingModule.muvaBookings(muva, status)
exports.updateLocation = async (details) => BookingModule.location(details);
exports.muvaLocation = async (details) => BookingModule.locate(details);
exports.muvaDelivered = async(details) => BookingModule.completed(details);

// Temporal Reference Section
// exports.generateTempRef = async (details) => TempRefModule.create(details);
// exports.getTempReference = async (reference) => TempRefModule.findByReference(reference);
// exports.deleteTempReference = async (reference) => TempRefModule.deleteByReference(reference);
 

// Profile Section 
exports.updateUserProfile = async (id, details) => AccountModule.updateProfile(id, details);
exports.getExistingPicture = async (id) => AccountModule.imageExist(id);



// KYC Section
exports.KYCUpdate = async (info) => KYCModule.update(info);
exports.KYCcheck = async (user) => KYCModule.checkKYC(user);
exports.getUserKYC = async (user) => KYCModule.KYC(user);
exports.updateUserKYCStatus = async (user, info) => KYCModule.updateStatus(user, info);


// USER PREFERENCE SECTION
exports.createCategoryPreference = async(info) => await PreferenceModule.createCategory(info);
exports.getCategoryPreference = async (account) => await PreferenceModule.getCategory(account);

// LIKE SECTION
exports.likeItem = async (info) => await LikeModule.like(info);
exports.rateItem = async (info) => await LikeModule.rate(info);
exports.reviewItem = async (info) => await ReviewModule.review(info);
exports.getShopperLikedProducts = async (query) => await LikeModule.searchLikedProduct(query);
exports.getShopperLikedStore = async (query) => await LikeModule.searchLikedStore
(query);

// PROMOTION SECTION
exports.newPromotion = async (details) => await PromotionModule.create(details);
exports.deletePromotion = async (id) => await PromotionModule.delete(id);
exports.findPromotionById = async (id) => await PromotionModule.promotionExist(id);
exports.updatePromotionInfo = async (id, details) => await PromotionModule.update(id, details);
exports.updatePromotionStatus = async (id, status) => await PromotionModule.updateStatus(id, status);
exports.getPromotions =  async (query) => await PromotionModule.promotions(query);
exports.getActivePromotions = async () => await PromotionModule.activePromotions();
exports.getInActivePromotions = async () => await PromotionModule.inActivePromotions();

//SETTING SECTION
exports.updateNotificationSetting = async (info) => await SettingModule.updateSettingNotification(info);
exports.getNotificationSetting = async () => await SettingModule.getNotificationSetting();
exports.userManagementSetting = async (query) => await SettingModule.getUserManagementSetting(query);
exports.emailTemplateSetting = async (query) => await SettingModule.getEmailTemplateSetting(query);
exports.payoutDuration = async (query) => await SettingModule.getPayoutDuration(query);
exports.getNotification = async (query) => await SettingModule.getNotificationSetting(query);