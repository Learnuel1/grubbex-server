const { compareSync, hashSync } = require('bcryptjs');
const {
	userExistByMail,
	userExistToken,
	userExistById,
	send2FA_OTP,
	KYCcheck,
	temporalAccExistByToken,
} = require('../services/interface');
const { APIError } = require('../utils/apiError');
const config = require('../../config/env');
const jwt = require('jsonwebtoken');
const { META, ERROR_FIELD } = require('../utils/actions');
const logger = require('../../logger');
const buildRes = require('../utils/seedData');
const { CONSTANTS } = require('../../config');
const { default: mongoose } = require('mongoose');
const { OTPGen, isStrongPassword } = require('../utils/Generator');
const {
	validateRequestData,
} = require('../middleware/data_validator.middleware');
const { registrationOTPMailHandler } = require('../utils/mailer');
const { getCategoryPreference } = require('../../services');
const { getStoreByOwner } = require('../../api/store/service');
 
exports.login = async (req, res, next) => {
	try {
		let refreshToken = req.cookies?.grub_ex;
		if (!refreshToken) refreshToken = req.headers?.authorization?.split(' ')[1];
		if (!refreshToken) refreshToken = req.headers?.cookie?.split('=')[1];
		const { email, password } = req.body;
		const exist = await userExistByMail(email);
		if (!exist) return next(APIError.notFound('User does not exist', 404));
		if (exist.error) return next(APIError.customError(exist.error, 400));
		if (
			!req.baseUrl.includes('m') &&
			(exist?.type?.toLowerCase() === CONSTANTS.ACCOUNT_TYPE_OBJ.rider ||
				exist?.type?.toLowerCase() === CONSTANTS.ACCOUNT_TYPE_OBJ.shopper)
		)
			return next(APIError.unauthorized('Please use mobile app'));
		if (
			req.baseUrl.includes('m') &&
			(exist.type.toLowerCase() === CONSTANTS.ACCOUNT_TYPE_OBJ.business ||
				exist.type.toLowerCase() === CONSTANTS.ACCOUNT_TYPE_OBJ.admin)
		)
			return next(APIError.unauthorized('Please visit Grubbex website'));
		if (!compareSync(password, exist.password))
			return next(APIError.badRequest('Incorrect password'));
		const foundUser = await userExistToken(refreshToken);
		if (foundUser) {
			jwt.verify(refreshToken, config.TOKEN_SECRETE, async (err, _decoded) => {
				if (err) {
					const untrusted = await userExistById(foundUser._id);
					untrusted.refreshToken = [];
					untrusted.save();
				}
				if(foundUser.email === email) { 
					logger.info('Token reuse detected', { service: META.AUTH });
					return next(APIError.customError('You are already logged in', 403));
				}
			});
			
			return next(APIError.customError('You are already logged in', 403));
		}

		// GET KYC
		let KYC;
		if (
			exist.type.toLowerCase() !==
				CONSTANTS.ACCOUNT_TYPE_OBJ.admin.toLowerCase() &&
			exist.type.toLowerCase() !== CONSTANTS.ACCOUNT_TYPE_OBJ.dev.toLowerCase()
		) {
			KYC = await KYCcheck(exist._id);
		}
		let onBoarded = false;
		if (email.toLowerCase() === CONSTANTS.TEST_EMAIL[1])
			KYC.onBoarded = onBoarded = true;
		else if (KYC) onBoarded = KYC.onBoarded; 
		KYC?.documents.forEach((doc) => {
		if(doc.status === CONSTANTS.KYC_STATUS_OBJ.rejected){
				 KYC.documents = [];
				 KYC.onBoarded= false;
				 onBoarded = false;
				 
			}
		})   
		let payload = {};
		payload = {
			id: exist._id,
			userId: exist.userId,
			type: exist.type,
			role: exist.role,
			firstName: exist.firstName,
			lastName: exist.lastName,
			email: exist.email,
			onBoarded,
		};
			
		if (exist.type.toLowerCase() === CONSTANTS.ACCOUNT_TYPE_OBJ.business && KYC?.store) {
			payload.storeId = KYC.store[0].storeId;
		}
		let token = jwt.sign(payload, config.TOKEN_SECRETE, {
			expiresIn: `${req.body?.rememberMe ? '10h' : '5h'}`,
		});
		let newRefreshToken = jwt.sign(payload, config.REFRESH_TOKEN_SECRETE, {
			expiresIn: `${req.body?.rememberMe ? '1d' : '10h'}`,
		});
		if (exist.mFA) {
			// create OTP
			const otp = OTPGen().toString();
			const hashedOTP = hashSync(otp, 10);
			const payload = {
				email,
				otp: hashedOTP,
			};
			const expiryMin = 3;
			newRefreshToken =  token = jwt.sign(payload, config.TOKEN_SECRETE, {
				expiresIn: `${expiryMin}m`,
			});
			const info = {
				email,
				otp: hashedOTP,
				refreshToken: token,
			};
			const create2FA_OTP = await send2FA_OTP(
				validateRequestData('ZTemporalAccountSchema'),
				info
			);
			if (!create2FA_OTP)
				return next(APIError.badRequest('2FA OTP failed to send'));
			if (create2FA_OTP.error)
				return next(APIError.badRequest(create2FA_OTP.error));
			logger.info('2FA OTP created successfully', { service: META.MFA });
			res.clearCookie('grub_ex');
			res.cookie('grub_ex', token, {
				httpOnly: false,
				secure: true,
				sameSite: 'none',
				// maxAge: 60 * 60 * 1000,
			});
			const template = "all_otp";
			const title = "One Time Password (OTP)"
			const message = " Please enter the code below to complete the login process.";
			
			//send OTP TO MAIL
			const result = await registrationOTPMailHandler(
				exist.email,
			  otp,
			  `${expiryMin} minutes`,
			  title,
			  message,
			  template,
			  "Grubbex Team",
			  "Login OTP"
			);
			 
			if (result.error) {
				return next(APIError.badRequest(ERROR_FIELD.FAILED_OTP));
			}
			logger.info('2FA OTP sent successfully', { service: META.MAIL });
			return res
				.status(200)
				.json({ success: true, msg: '2FA OTP sent successfully', token });
		}
		res.clearCookie('grub_ex', token, {
			httpOnly: false,
			secure: true,
			sameSite: 'none',
			// maxAge: 60 * 60 * 1000,
		});
		let newRefreshTokenArray = [];
		if (refreshToken)
			newRefreshTokenArray = exist.refreshToken.filter(
				(rt) => rt !== refreshToken
			);
		else newRefreshTokenArray = exist.refreshToken;
		exist.refreshToken = [...newRefreshTokenArray, token];

		// connections.push({activeId: activeId, userId: payload.id});

		exist.save();
		const data = buildRes.removeAuth(exist.toObject());
		 if(exist.type.toLowerCase() === CONSTANTS.ACCOUNT_TYPE_OBJ.shopper){
			 const preference = await getCategoryPreference(exist._id); 
			if(preference) {
				// search for stores in the preference category
				data.preference = preference.category;
			} else data.preference =  [];
		 }
		logger.info('Login successful', { service: META.AUTH });
		data.KYC = KYC ? KYC : [];
		data.onBoarded = onBoarded;
		// const userPreference = await getCategory(req.user);
		// if(userPreference) data.preference = userPreference
		const response = buildRes.reqResponse('login successful', data, 'user', {
			token,
			refreshToken: newRefreshToken,
		}); 
		res.cookie('grub_ex', newRefreshToken, {
			httpOnly: false,
			secure: true,
			sameSite: 'none',
			// maxAge: 60 * 60 * 1000,
		});
		res.status(200).json(response);
	} catch (error) {
		next(error);
	}
};
exports.m2FA_login = async (req, res, next) => {
	try {
		let refreshToken = req.token;
		const { otp } = req.body;
		if (!otp) return next(APIError.badRequest('OTP is required'));
		let foundUser = await temporalAccExistByToken(refreshToken)  
		if (!foundUser) {
			jwt.verify(refreshToken, config.TOKEN_SECRETE, async (err, _decoded) => {
				if (err) {
					logger.info('Token reuse detected', { service: META.MFA });
					return next(APIError.unauthorized(ERROR_FIELD.INVALID_TOKEN));
				}
			});
			logger.info('Token reuse detected', { service: META.AUTH });
			return next(APIError.customError('Token Not Found', 403));
		}
		jwt.verify(refreshToken, config.TOKEN_SECRETE, async (err, _decoded) => {
			if (err) {
				logger.info('Token Expired', { service: META.MFA });
				return next(APIError.unauthorized(ERROR_FIELD.EXPIRED_TOKEN));
			}
		});
		const exist = await userExistByMail(foundUser.email);
		if (!exist) return next(APIError.notFound('User does not exist', 404));
		if (exist?.error) return next(APIError.customError(exist.error, 400));
		// GET KYC
		let KYC;
		if (
			exist.type.toLowerCase() !==
				CONSTANTS.ACCOUNT_TYPE_OBJ.admin.toLowerCase() &&
			exist.type.toLowerCase() !== CONSTANTS.ACCOUNT_TYPE_OBJ.dev.toLowerCase()
		) {
			KYC = await KYCcheck(exist._id);
		}
		let onBoarded = '';
		if (exist.email.toLowerCase() === CONSTANTS.TEST_EMAIL[1])
			KYC.onBoarded = onBoarded = true;
		else if (KYC) onBoarded = KYC.onBoarded;
			KYC?.documents.forEach((doc) => {
		if(doc.status === CONSTANTS.KYC_STATUS_OBJ.rejected){
				 KYC.documents = [];
				 KYC.onBoarded= false;
				 onBoarded = false;
				 
			}
		})   
		let payload = {};
		payload = {
			id: exist._id,
			userId: exist.userId,
			type: exist.type,
			role: exist.role,
			firstName: exist.firstName,
			lastName: exist.lastName,
			email: exist.email,
			onBoarded,
		};
	
		if (exist.type.toLowerCase() === CONSTANTS.ACCOUNT_TYPE_OBJ.business && KYC?.store) {
			payload.storeI = KYC.store[0].storeId;
		}
		const token = jwt.sign(payload, config.TOKEN_SECRETE, { expiresIn: '5h' });
		const newRefreshToken = jwt.sign(payload, config.REFRESH_TOKEN_SECRETE, {
			expiresIn: '10h',
		});

		res.clearCookie('grub_ex', token, {
			httpOnly: false,
			secure: true,
			sameSite: 'none',
			// maxAge: 60 * 60 * 1000,
		});
		let newRefreshTokenArray = [];
		if (refreshToken)
			newRefreshTokenArray = exist.refreshToken.filter(
				(rt) => rt !== refreshToken
			);
		else newRefreshTokenArray = exist.refreshToken;
		exist.refreshToken = [...newRefreshTokenArray, token];

		// connections.push({activeId: activeId, userId: payload.id});

		exist.save();
		const data = buildRes.removeAuth(exist.toObject());
		 if(exist.type.toLowerCase() === CONSTANTS.ACCOUNT_TYPE_OBJ.shopper){
			 const preference = await getCategoryPreference(exist._id);
			if(preference && preference !== null) {
				// search for stores in the preference category
				data.preference = preference.category;
			} else data.preference =  [];
		 }
		logger.info('Login successful', { service: META.AUTH });

		data.KYC =  KYC ? KYC : [];
		data.onBoarded = onBoarded; 
		const response = buildRes.reqResponse('login successful', data, 'user', {
			token,
			refreshToken: newRefreshToken,
		});
		res.cookie('grub_ex', newRefreshToken, {
			httpOnly: false,
			secure: true,
			sameSite: 'none',
			// maxAge: 60 * 60 * 1000,
		});
		res.status(200).json(response);
	} catch (error) {
		next(error);
	}
};
exports.logout = async (req, res, next) => {
	try {
		let token = req.token;
		const found = await userExistToken(token);
		if (!found)
			return next(APIError.unauthenticated('You need to login first', 401));
		const payload = jwt.decode(token, config.TOKEN_SECRETE);
		const isUser = await userExistById(new mongoose.Types.ObjectId(payload.id));
		if (!isUser) return next(APIError.notFound(`user does not exist`, 404));
		if (isUser?.error) return next(APIError.badRequest(isUser?.error));
 
		if (isUser.role === CONSTANTS.ACCOUNT_TYPE_OBJ.rider) {
			isUser.refreshToken = [];
			isUser.save();
		} else {
			const refreshTokenArr = isUser.refreshToken.filter((rt) => rt !== token);
			isUser.refreshToken = [...refreshTokenArr];
			isUser.save();
		}
		logger.info('Logout successful', { service: META.AUTH });
		res.clearCookie('grub_ex');
		res
			.status(200)
			.json({ success: true, msg: 'You have successfully logged out' });
	} catch (error) {
		// if (error.message === ERROR_FIELD.JWT_EXPIRED) next(APIError.unauthenticated());
		next(error);
	}
};
exports.handleRefreshToken = async (req, res, next) => {
	let token = req.cookies?.grub_ex;
	if (!token) token = req.headers?.authorization?.split(' ')[1];
	if (!token) token = req.headers?.cookie?.split('=')[1];
	if (!token) return next(APIError.unauthenticated());
	const { refreshToken } = req.body;
	res.clearCookie('grub_ex', {
		httpOnly: true,
		sameSite: 'None',
		secure: true,
	});
	if (!refreshToken)
		return next(APIError.badRequest('RefreshToken is required'));
	const foundUser = await userExistToken(token);
	// Detected refresh toke reuse
	if (!foundUser) {
		const check = jwt.decode(token, config.TOKEN_SECRETE);
		if (!check) return next(APIError.unauthenticated());
		const usedToken = await userExistById(check.id);
		// usedToken.refreshToken = [];
		// usedToken.save();
		logger.info('Token reuse detected', { service: META.AUTH });
		return next(APIError.customError(ERROR_FIELD.INVALID_TOKEN, 403));
	}
	const newRefreshTokenArr = foundUser.refreshToken.filter(
		(rt) => rt !== token
	);
	jwt.verify(
		refreshToken,
		config.REFRESH_TOKEN_SECRETE,
		async (err, decoded) => {
			if (err) {
				foundUser.refreshToken = [...newRefreshTokenArr];
				foundUser.save();
			}
			if (err || foundUser._id.toString() !== decoded.id)
				return next(APIError.customError(ERROR_FIELD.JWT_EXPIRED, 403));
			const payload = {
				id: foundUser._id,
				userId: foundUser.userId,
				type: foundUser.type,
				role: foundUser.role,
				firstName: foundUser.firstName,
				lastName: foundUser.lastName,
				email: foundUser.email,
				onBoarded: foundUser.role === CONSTANTS.ACCOUNT_TYPE_OBJ.admin ? true : foundUser?.onBoarded
			};
			const token = jwt.sign(payload, config.TOKEN_SECRETE, {
				expiresIn: '5h',
			});
			const newRefreshToken = jwt.sign(payload, config.REFRESH_TOKEN_SECRETE, {
				expiresIn: '10h',
			});
			foundUser.refreshToken = [...newRefreshTokenArr, token];
			foundUser.save();
			logger.info('Refresh Token generated successfully', {
				service: META.AUTH,
			});
			res.cookie('grub_ex', token, {
				httpOnly: true,
				sameSite: 'None',
				secure: true,
			});
			res
				.status(200)
				.json({ success: true, token, refreshToken: newRefreshToken });
		}
	);
};
exports.checkUser = async (req, res, next) => {
	try {
		if (!req.token) return next(APIError.unauthenticated());
		logger.info('User check successful', { service: META.AUTH });
		const user = await userExistToken(req.token);
		const data = buildRes.removeAuth(user.toObject());
		// GET KYC
		let KYC;
		if (
			user.type.toLowerCase() !== CONSTANTS.ACCOUNT_TYPE_OBJ.admin.toLowerCase() &&
			user.type.toLowerCase() !== CONSTANTS.ACCOUNT_TYPE_OBJ.dev.toLowerCase()
		) {
			KYC = await KYCcheck(user._id);
		}
		let onBoarded = false;
		if (user.email.toLowerCase() === CONSTANTS.TEST_EMAIL[1])
			KYC.onBoarded = onBoarded = true;
		else if (KYC) onBoarded = KYC.onBoarded;
		data.kyc = KYC ? KYC : [];
		KYC?.documents.forEach((doc) => {
		if(doc.status === CONSTANTS.KYC_STATUS_OBJ.rejected){
				 KYC.documents = [];
				 KYC.onBoarded= false;
				 onBoarded = false;
				 
			}
		})  
		 if(user.type.toLowerCase() === CONSTANTS.ACCOUNT_TYPE_OBJ.shopper){
			 const preference = await getCategoryPreference(user._id); 
			if(preference) { 
				data.preference = preference.category;
			} else data.preference =  [];
		 }  
		return res
			.status(200)
			.json({ success: true, msg: 'User is Authenticated', user: data });
	} catch (error) {
		if (error.message === ERROR_FIELD.JWT_EXPIRED)
			next(APIError.customError(ERROR_FIELD.EXPIRED_TOKEN, 403));
		else next(error);
	}
};
exports.confirmPassword = async (req, res, next) => {
	try {
		const {password} = req.body;
		if (!password) return next(APIError.badRequest("Password is required"));
		
		const isUser  = await userExistById(req.user);
		if(!compareSync(password, isUser.password)) return next(APIError.badRequest("Incorrect password"));
		const payload = {email:isUser.email, id:isUser.userId};
		const token = jwt.sign(payload, config.TOKEN_SECRETE,{expiresIn:"3m"});
		res
				.status(200)
				.json({ success: true, msg: 'Password confirmed', token });
	} catch (error) {
		next (error)
	}
} 
exports.resetLogin = async (req, res, next) => {
	try {
		const { currentPassword, newPassword } = req.body;
		if (!req.userId) return next(APIError.unauthenticated());
		if (!currentPassword)
			return next(APIError.badRequest('Provide current password'));
		if (!newPassword) return next(APIError.badRequest('Provide new password'));
		if (!isStrongPassword(newPassword)) return next(APIError.badRequest('Password is weak'));
		const check = await getUserById(req.userId);
		if (!check) return res.status(404).json({ error: 'Incorrect password' });
		if (check.error) return res.status(404).json(check.error);
		const verify = compareSync(currentPassword, check.password);
		if (!verify)
			return next(APIError.customError('current password is incorrect', 400));
		const hashedPass = hashSync(newPassword, 12);
		const reset = await updateUserPass(req.userId, hashedPass);
		if (!reset) return next(APIError.customError());
		if (reset.error) return next(APIError.customError(reset.error, 400));
		await logOutUser(req.userId);
		logger.info('Login reset successful', { meta: 'auth-service' });
		res.clearCookie('jwt');
		res.status(200).json({ success: true, msg: 'Password reset successful' });
	} catch (error) {
		next(error);
	}
};
exports.logoutAll = async (req, res, next) => {
	try {
		let refreshToken = req.cookies?.jwt;
		if (!refreshToken) refreshToken = req.headers?.authorization?.split(' ')[1];
		if (!refreshToken) refreshToken = req.headers?.cookie?.split('=')[1];
		const found = await AccountModel.findOne({ refreshToken }).exec();
		if (!found) {
			const { username, password } = req.body;
			if (!username || !password)
				return next(APIError.customError('You need to login first', 401));
			const exist = await usernameExist(username);
			if (!exist)
				return next(APIError.customError('You need to login first', 401));
			if (exist.error) return next(APIError.customError(exist.error, 400));
			const verify = compareSync(password, exist.password);
			if (!verify)
				return next(APIError.customError('You need to login first', 401));
			exist.refreshToken = [];
			exist.save();
			logger.info('Logged out all sessions successfully', {
				meta: 'auth-service',
			});
			res.clearCookie('jwt');
			res
				.status(200)
				.json({ success: true, msg: 'You have successfully logged out' });
		} else {
			if (!refreshToken)
				return next(APIError.customError('You need to login first', 401));
			const payload = jwt.decode(refreshToken, config.REFRESH_TOKEN_SECRETE);
			const isUser = await getUserById(payload.id);
			if (!isUser)
				return next(APIError.customError(`user does not exist`, 404));
			if (isUser.error) return next(APIError.customError(isUser.error));
			isUser.refreshToken = [];
			isUser.save();
			logger.info('Logged out all sessions successfully', {
				meta: 'auth-service',
			});
			res.clearCookie('jwt');
			res
				.status(200)
				.json({ success: true, msg: 'You have successfully logged out' });
		}
	} catch (error) {
		next(error);
	}
};

