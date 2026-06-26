const { CONSTANTS } = require('../../config');
const config = require('../../config/env');
const logger = require('../../logger');
const {
	KYCUpdate,
	getUserKYC,
	updateUserKYCStatus,
	searchUserKYC,
	cityInfoUpdate,
	getUserKYCByAccountId,
	getStoreInfo,
	findUserByCustomId,
} = require('../services/interface');
const { uniqueIdGen, shortIdGen } = require('../utils/Generator');
const { META } = require('../utils/actions');
const { APIError } = require('../utils/apiError');
const {
	uploadFileToCloudinary,
	deleteFileFromCloudinary,
	uploadSingleFileToCloudinary,
} = require('../utils/cloudinary');
// const flutterwaveAuth = require('../utils/flutterwave.auth');
const Flutterwave = require('flutterwave-node-v3');
const { flutterwave } = require('../utils/flutterwave.auth'); 
const buildRes = require("../utils/seedData");
const { findStore, updateStoreLocation } = require('../../api/store/service');
const { hashSync } = require('bcryptjs');
const { verifyLocation } = require('../services/google.service'); 
exports.updateProfile = async (req, res, next) => {
	try { 
		if (req.userType === CONSTANTS.ACCOUNT_TYPE_OBJ.business && req.files.length === 0 )
			return next(APIError.badRequest('Business logo and banner is required'));
		if (req.userType === CONSTANTS.ACCOUNT_TYPE_OBJ.business && (!req?.files?.logo || req.files.logo.length === 0) )
			return next(APIError.badRequest('Business logo is required'));
			// profile object
			const {storeId,
				state,
				city,
				lga,
				town,
				street,
				houseNo,
				landMark, 
				description,
			} = req.body;

			const info = await getUserKYC(req.user); 
			//check if store exist
			if(req.userType === CONSTANTS.ACCOUNT_TYPE_OBJ.business){
				const storeExist = await  findStore({storeId})
				if( !storeExist || storeExist.length === 0) return next(APIError.badRequest("Store does not exist"))

			}
			//  check if there is existing profile files
			if (info && info.profile.length > 0) {
				//delete existing Profile
				if(info.profile?.logo){
					const delLogo = await deleteFileFromCloudinary(info.profile[0]?.logo?.id);
					if (delLogo.error) return next(APIError.badRequest(delLogo.message));
				}
				if(info.profile[0]?.banner)
				{
					const delBanner = await deleteFileFromCloudinary(info.profile[0]?.banner?.id);
					if (delBanner?.error) return next(APIError.badRequest(delBanner.message));
				}
				logger.info('Existing picture deleted successfully', {
					service: META.CLOUDINARY,
				});
			}
			
			let logoUpload ;
			if(req.userType === CONSTANTS.ACCOUNT_TYPE_OBJ.business){
			 	 logoUpload = await uploadFileToCloudinary(req.files.logo, req);
				
			if (logoUpload?.error) return next(APIError.badRequest(logoUpload.message));
			logger.info('Profile picture uploaded successfully', {
				service: META.CLOUDINARY,
			});
			req.body.logo = {
				id: logoUpload.public_id,
				url: logoUpload.secure_url,
			};
		}
			if(req.userType === CONSTANTS.ACCOUNT_TYPE_OBJ.business && req.files?.banner && req.files.banner.length > 0){
				const bannerUpload = await uploadFileToCloudinary(req.files.logo, req);
				if (bannerUpload?.error) return next(APIError.badRequest(bannerUpload.error));
				logger.info('Store banner uploaded successfully', {
					service: META.CLOUDINARY,
				});
				req.body.banner = {
					id: bannerUpload.public_id,
					url: bannerUpload.secure_url,
				};
			}
	// profile object
			const details = {
			kyc: CONSTANTS.KYC_TYPE_INFO.profile,
			status: CONSTANTS.KYC_STATUS[0],
			userId: req.userId,
			user: req.user,
			userType: req.userType,
			onBoarded: false,
			storeId: req.userType !== CONSTANTS.ACCOUNT_TYPE_OBJ.business ? null : storeId ,
		};
		details.profile = {  
			address: {
			state,
			city,
			lga,
			town,
			street,
			houseNo,
			landMark,
			description,
			},
			banner: req.userType !== CONSTANTS.ACCOUNT_TYPE_OBJ.business ? null : req.body.banner,
			logo: req.body.logo,
		 };

		 const cityInfo = {
			city,
			town,
			cityId: shortIdGen(),
			townId: shortIdGen(),
		 }
		const save = await KYCUpdate(details);
		if (save?.error) return next(APIError.badRequest(save.error));
		const cityUpdate = await cityInfoUpdate(cityInfo)
		if (cityUpdate?.error) return next(APIError.badRequest(cityUpdate.error));
		logger.info("City info updated successfully", {service: META.KYC})
		res
			.status(200)
			.json({ success: true, msg: `Profile updated successfully` });
	} catch (error) {
		next(error);
	}
};

exports.uploadDocument = async (req, res, next) => {
	try {
		if (req.userType === CONSTANTS.ACCOUNT_TYPE_OBJ.business && req.files?.length === 0 )
			return next(APIError.badRequest('Business document is required'));
		if(req.userType === CONSTANTS.ACCOUNT_TYPE_OBJ.business){
			const storeExist = await  findStore({storeId: req.body.storeId})
			if( !storeExist || storeExist.length === 0) return next(APIError.badRequest("Store does not exist"))

		}
		if ((req.files?.length === 0 && req.userType.toLowerCase() !== CONSTANTS.ACCOUNT_TYPE_OBJ.user) &&
			req.userType.toLowerCase() !== CONSTANTS.ACCOUNT_TYPE_OBJ.admin
		)
			return next(APIError.badRequest('File is required'));
		if (!req.body.type)
			return next(APIError.badRequest('KYC type is required'));
		if (req.userType === CONSTANTS.ACCOUNT_TYPE_OBJ.business && !req.body.storeId)
			return next(APIError.badRequest('Store ID is required'));
		if (!CONSTANTS.KYC_DOCUMENT_TYPE.includes(req.body.type.toUpperCase()))
			return next(APIError.badRequest('Invalid KYC document'));
		let otherDoc = [];
		const info = await getUserKYC(req.user);
		//  check if there is existing document files
		if (info && info?.documents?.length > 0) {
			// the document to delete
			const exist = info.documents.find(
				(x) => x.name.toLowerCase() === req.body.type.toLowerCase()
			);
			if (exist) {
				const del = await deleteFileFromCloudinary(exist.id);
				if(exist?.back){
					const del = await deleteFileFromCloudinary(exist.back.id);
				}
				//delete existing Profile
				if (del?.error) return next(APIError.badRequest(del.message));
				logger.info(`Deleted existing ${req.body.type} successfully`, {
					service: META.CLOUDINARY,
				});
				otherDoc = info.documents.filter(
					(x) =>
						x.name.toLowerCase() !== req.body.type.toLowerCase() &&
						exist.docId !== x.docId
				);
			} else otherDoc = info.documents;
		}
		// const upload = await uploadFileToCloudinary(req.files.file, req);
		const upload = await uploadFileToCloudinary(req.files.front, req);
		if (upload?.error) return next(APIError.badRequest(upload.message));
		logger.info('Document front uploaded successfully', {
			service: META.CLOUDINARY,
		});
		req.body.documents = {
			id: upload.public_id,
			url: upload.secure_url,
			docId: uniqueIdGen(),
			name: req.body.type,
			status: CONSTANTS.KYC_STATUS_OBJ.pending,
		};
		if(req.files?.back){
			const upload = await uploadFileToCloudinary(req.files.front, req);
			if (upload?.error) return next(APIError.badRequest(upload.message));
			logger.info('Document back uploaded successfully', {
				service: META.CLOUDINARY,
			});
			req.body.documents.back ={
				id: upload.public_id,
			url: upload.secure_url,
			}
		}
	
		otherDoc.push(req.body.documents);
		const details = {
			kyc: CONSTANTS.KYC_TYPE_INFO.document,
			status: CONSTANTS.KYC_STATUS_OBJ.pending,
			userId: req.userId,
			user: req.user,
			userType: req.userType,
			onBoarded: false,
			storeId: req.body.storeId,
		};
		details.documents = otherDoc;
		const save = await KYCUpdate(details);
		if (!save) return next(APIError.badRequest("Document failed to upload, try again"));
		if (save?.error) return next(APIError.badRequest(save.error));
		logger.info('Document updated successfully', {
			service: META.CLOUDINARY,
		});
		res
			.status(200)
			.json({
				success: true,
				msg: `${
					req.body.type?.toLowerCase() === "cac" ? "CAC" : req.body.type.charAt(0).toUpperCase() + req.body.type.slice(1)
				} Uploaded successfully`,
			});
	} catch (error) { 
		next(error);
	}
};

exports.bankDetails = async (req, res, next) => {
	try {
		//verify bank 
		const check = {
			account_number: req.body.accountNumber,
			account_bank: req.body.bankCode
		};
		const verify = await flutterwave.Misc.verify_Account(check);
		if (verify.status === 'error')
			return next(APIError.badRequest(verify.message));
		logger.info('Account number verified successfully', {
			service: META.FLUTTER_WAVE_SERVICE,
		});
		const accountName = verify.data.account_name.split(" ");
		if(req.body?.bvn && req.body?.bvn?.trim() !==""){
			//verify bvn
			const intBVN = await flutterwave.Misc.bvn({bvn:req.body.bvn, firstname: accountName[0], lastname: accountName[1], redirect_url: config.FRONTEND_ORIGIN_URL});
			if (!intBVN || intBVN.status === 'error')
				return next(APIError.badRequest(intBVN?.message || 'BVN initialization failed, try again'));
			if (!intBVN.data || !intBVN.data.reference)
				return next(APIError.badRequest('BVN reference validation failed, try again'));
			logger.info('BVN verification initiated successfully', {
				service: META.FLUTTER_WAVE_SERVICE,
			});
			const verifyBVN = await flutterwave.Misc.verifybvn({reference: intBVN.data.reference});
			if (!verifyBVN || verifyBVN.status === 'error')
				return next(APIError.badRequest(verifyBVN?.message || 'BVN verification failed'));
			logger.info('BVN verified successfully', {
				service: META.FLUTTER_WAVE_SERVICE,
			});
		}
       const info = await getUserKYC(req.user);
       if (info && info?.bankDetails?.length > 0) {
        const exist = info.bankDetails.find(
          (x) => x.bankName?.toLowerCase() === req.body.bankName.toLowerCase() &&  x.accountNumber?.toLowerCase() === req.body.accountNumber.toLowerCase() 
        );
        if (exist)
           return next(APIError.badRequest("Bank details already exist"));
       }
         
  const details = {
        kyc: CONSTANTS.KYC_TYPE_INFO.bankDetails,
        status: CONSTANTS.KYC_STATUS_OBJ.pending,
        userId: req.userId,
        user: req.user,
		userType: req.userType
      };
      details.bankDetails = { 
        bankName: req.body.bankName,
         accountNumber: verify.data.account_number, 
         accountName: verify.data.account_name,
		 bvn: req.body?.bvn ? hashSync(req.body.bvn, 10) : null,
         }; 
      const save = await KYCUpdate(details);
      if (save?.error) return next(APIError.badRequest(save.error));
      res
        .status(200)
        .json({
          success: true,
          msg: ` Account details updated successfully`,
        });
		logger.info('Bank info verified successfully', { service: META.KYC });
	} catch (error) {
		next(error);
	}
};
exports.getKYC = async (req, res, next) => {
	try {
		const kyc = await getUserKYC(req.user);
		if (!kyc) return res.status(200).json({success: true, msg:'No record found', kyc:[]});
		if (kyc?.error) return next(APIError.badRequest(kyc.error));
		logger.info('KYC info retrieved successfully', { service: META.KYC });
		const response = buildRes.reqResponse('Found', kyc, 'kyc');
		res.status(200).json(response);
	} catch (error) {
		next(error);
	}
};
exports.getKYCByAccountId = async (req, res, next) => {
	try {
		const {userId} = req.params;
		if(!userId) return next (APIError.badRequest("Account ID is required"));
		const kyc = await getUserKYCByAccountId(userId);
		if (!kyc) return res.status(200).json({success: true, msg:'No record found', kyc:[]});
		if (kyc?.error) return next(APIError.badRequest(kyc.error));
		logger.info('KYC info retrieved successfully', { service: META.KYC });
		const {profile, documents, logistics } = kyc;
		
		delete kyc.profile;
		delete kyc. documents;
		kyc.documents = [];
		kyc.logistics = [];
		documents.forEach((cur) =>{
			const {id, back, ...data } = cur;
			if(back) {
				data.back = {url: back.url };
			}
			kyc.documents.push(data)
		}) 
		logistics.forEach((cur) =>{
			const {id, back, vehicleRegistration, insurance, ...data } = cur;
			if(back) data.back = {url: back.url };
			if(vehicleRegistration) {
				const {id, ...info } = vehicleRegistration;
				data.vehicleRegistration = info;
			}
			if(insurance) {
				const {id, ...info} = insurance;
				 data.insurance = info;	
			}
			kyc.logistics.push(data)
		}) 
		const profileData = {};
		profile.forEach((cur) => {
			const { address, banner, logo } = cur;
			if(banner){
				profileData.banner= {url: banner.url}
			}
			if(logo){
				profileData.logo = {url: logo.url}; 
			}
			profileData.address = address 
		}) 
		kyc.profile = {info:profileData};
		const response = buildRes.reqResponse('Found', kyc, 'kyc');
		res.status(200).json(response);
	} catch (error) {
		next(error);
	}
};
exports.searchKYC = async (req, res, next) => {
  try{ 
    const {search} = req.query;
    let queryString = {
      $or:[
        {userId: new RegExp(search, "i")},
        {"document.name": new RegExp(search, "i")}, 
         {"logistics.name": new RegExp(search, "i")}
      ]
    }; 
	if(!search) queryString = {}
    let kyc = await searchUserKYC(queryString);
    if (!kyc) kyc = [];
    if (kyc?.error) return next(APIError.badRequest(kyc.error));
    logger.info("KYC info retrieved successfully", {service: META.KYC});
    const response =  buildRes.reqResponse("Found", kyc, "kyc");
    res.status(200).json(response)
  }catch(error){
    next(error);
  }
}
exports.updateKYCStatus = async (req, res, next) => {
	try {
		const { docId, status, id } = req.body;
		if (!docId) return next(APIError.badRequest('Document ID is required'));
		if (!id) return next(APIError.badRequest('Driver account ID required'));
		if (!status)
			return next(APIError.badRequest('Document status is required'));
		 let statusUpdate = status.toLowerCase() === "reject"? status.concat("ed") : status.concat("d")
		if (!CONSTANTS.KYC_STATUS.includes(statusUpdate.toLowerCase()))
			return next(APIError.badRequest('Invalid document status'));
		const exist = await findUserByCustomId(id);
		if (!exist) return next(APIError.badRequest('Account does not exist'));
		if(exist?.error) return next(APIError.badRequest(exist.error));
		const field = exist.accountType === CONSTANTS.ACCOUNT_TYPE_OBJ.business ? "store.storeId" : "userId";
		const info = { docId, status:statusUpdate };
		const search = {
			$or:[
				{userId: id},
				{field: id}
			]
		}
		const update = await updateUserKYCStatus(search, info);
		if (!update)
			return next(APIError.badRequest('Status update failed, try again'));
		if (update?.error) return next(APIError.badRequest(update.error));
		logger.info('KYC status updated successfully', { meta: META.KYC });
		res
			.status(200)
			.json({ success: true, msg: 'KYC status updated successfully' });
	} catch (error) {
		next(error);
	}
};

exports.search = async (req, res, next) => {
	try {
		const kyc = await getUserKYC(req.user);
		if (!kyc) return res.status(200).json({success: true, msg:'No record found', kyc});
		if (kyc.error) return next(APIError.badRequest(kyc.error));
		logger.info('KYC info retrieved successfully', { service: META.KYC });
		const response = buildRes.reqResponse('Found', kyc, 'kyc');
		res.status(200).json(response);
	} catch (error) {
		next(error);
	}
};
exports.finalizeUpload = async (req, res, next) => {
	try{
		const {tin, storeId} = req.body;
		if (!storeId) return next(APIError.badRequest("Store ID is required"));

		const info = await getUserKYC(req.user);
		if (!info && info?.documents?.length === 0)  return next(APIError.badRequest("Upload document"));
		const details = {
			kyc: CONSTANTS.KYC_TYPE_INFO.tin,
			userId: req.userId,
			user: req.user,
			userType: req.userType,
			updateInfo: {
				status: CONSTANTS.KYC_STATUS_OBJ.pending,
				onBoarded: false,
				storeId: storeId,
				tin: tin ? tin : "",
			}
		}; 
		const save = await KYCUpdate(details);
		if (!save) return next(APIError.badRequest("Document update failed to finalize, try again"));
		if (save?.error) return next(APIError.badRequest(save.error));
		logger.info('Document update finalized successfully', {
			service: META.CLOUDINARY,
		});
		res
			.status(200)
			.json({
				success: true,
				msg: `Document update finalized successfully`,
			});
	} catch (error){
		next (error);
	}
}
exports.updateLogistics = async (req, res, next ) => {
	try{
		
		const info = await getUserKYC(req.user);
		if (!info && info?.logistics?.length === 0)  return next(APIError.badRequest("Upload logistics"));
		const details = {
			kyc: CONSTANTS.KYC_TYPE_INFO.logistics,
			userId: req.userId,
			user: req.user,
			userType: req.userType,
			updateInfo: {
				status: CONSTANTS.KYC_STATUS_OBJ.pending,
				onBoarded: false, 
			}
		};  
	if(req?.files?.vehicleRegistration?.length >0) {
		if(info?.logistics[0]?.vehicleRegistration  && req.body?.vehicleType.toLowerCase() ===info?.logistics[0]?.vehicleType.toLowerCase()){
			// delete existing image
			const upload = await deleteFileFromCloudinary(info.logistics[0].vehicleRegistration?.id);
			if (upload?.error) return next(APIError.badRequest(upload.message));
			logger.info('Existing vehicle registration deleted successfully', {
				service: META.CLOUDINARY,
			});
			
		} 
		// upload file to cloudinary
		const upload = await uploadFileToCloudinary(req.files.vehicleRegistration, req);
			if (upload?.error) return next(APIError.badRequest(upload.message));
			logger.info('Logistics vehicle registration uploaded successfully', {
				service: META.CLOUDINARY,
			});
			req.body.vehicleRegistration = {
				id: upload.public_id,
				url: upload.secure_url, 
			docId: uniqueIdGen(),
			name: CONSTANTS.KYC_TYPE_INFO.vehicleRegistration,
			status: CONSTANTS.KYC_STATUS_OBJ.pending,
		 
			}
	}
	if(req?.files?.insurance?.length > 0) {
		if(info?.logistics[0]?.insurance && req.body.vehicleType.toLowerCase() ===info?.logistics[0]?.vehicleType.toLowerCase() ){
			// delete existing image
			const upload = await deleteFileFromCloudinary(info.logistics[0].insurance.id);
			if (upload?.error) return next(APIError.badRequest(upload.message));
			logger.info('Existing vehicle insurance deleted successfully', {
				service: META.CLOUDINARY,
			});
		} 
		// upload file to cloudinary
		const upload = await uploadFileToCloudinary(req.files.insurance, req);
			if (upload?.error) return next(APIError.badRequest(upload.message));
			logger.info('Logistics vehicle insurance uploaded successfully', {
				service: META.CLOUDINARY,
			});
			req.body.insurance ={
				id: upload.public_id,
				url: upload.secure_url,
				docId: uniqueIdGen(),
			name: CONSTANTS.KYC_TYPE_INFO.insurance,
			status: CONSTANTS.KYC_STATUS_OBJ.pending,
			}
	}
		const infoToUpdate = info.logistics.filter(item => item.vehicleType.toLowerCase() !== req.body.vehicleType.toLowerCase()&& item.model !== req.body.model);
		const newInfo = {};
		for (let key in req.body){ 
			newInfo[key] = req.body[key];
		} 
		if (Object.keys(newInfo).length > 7) return next(APIError.badRequest("Logistics has more fields than required"));
		infoToUpdate.push(newInfo)
		details.logistics =infoToUpdate;
		const save = await KYCUpdate(details);
		if(!save) return next(APIError.badRequest("Vehicle registration failed, try again"));
		if(save?.error) return next (APIError.badRequest(save.error));
		logger.info("Logistics registration completed successfully", {service: META.KYC})
		res.status(200).json({success: true, msg: "Logistics registration completed successfully"})
	} catch (error) { 
		next(error)
	}
}
exports.removeLogistics = async (req, res, next ) => {
	try {
		const { vehicleType, model } = req.query;
		if(!vehicleType) return next(APIError.badRequest("Vehicle type is required"));
		if(!model) return next(APIError.badRequest("Vehicle model is required"));
		const info = await getUserKYC(req.user);
		if (!info || info?.logistics?.length === 0)  return next(APIError.notFound("No logistics found"));
		const infoToUpdate = info.logistics.filter(item => item.vehicleType.toLowerCase() !== vehicleType.toLowerCase()&& item.model !== model);
		infoToRemove = info.logistics.filter(item => item.vehicleType?.toLowerCase() === vehicleType.toLowerCase() && item.model.toLowerCase() === model.toLowerCase());
		if(infoToRemove.length === 0) return next(APIError.notFound("Logistics not found"));
		if(infoToRemove[0]?.vehicleRegistration){
			const upload = await deleteFileFromCloudinary(infoToRemove[0].vehicleRegistration.id);
			if (upload?.error) return next(APIError.badRequest(upload.message));
			logger.info('Vehicle registration deleted successfully', {
				service: META.CLOUDINARY,
			});
		}
		if(infoToRemove[0]?.insurance){
			const upload = await deleteFileFromCloudinary(infoToRemove[0].insurance.id);
			if (upload?.error) return next(APIError.badRequest(upload.message));
			logger.info('Vehicle insurance deleted successfully', {
				service: META.CLOUDINARY,
			});
		}
		const details = {
			kyc: CONSTANTS.KYC_TYPE_INFO.logistics,
			userId: req.userId,
			user: req.user,
			userType: req.userType,
			updateInfo: {
				status: CONSTANTS.KYC_STATUS_OBJ.pending,
				onBoarded: false, 
			}
		};  
		details.logistics =infoToUpdate;
		const save = await KYCUpdate(details);
		if(!save) return next(APIError.badRequest("Vehicle removal failed, try again"));
		if(save?.error) return next (APIError.badRequest(save.error));
		logger.info("Logistics removed successfully", {service: META.KYC})
		res.status(200).json({success: true, msg: "Logistics removed successfully"})
	} catch (error) {
		next (error)
	}
}
exports.getStoreAddress = async (req, res, next) => {
	try {
		const {storeId, prodId} = req.query;
		if(!storeId && ! prodId) return next(APIError.badRequest("Store ID or Product ID is required"));
		const query = prodId ? {prodId} : {storeId};
		const address = await getStoreInfo(query);
		if(!address) return next(APIError.badRequest("Store address not found"));
		if(address?.error) return next(APIError.badRequest(address.error));
		logger.info("Store address retrieved successfully", {service: META.KYC});
		res.status(200).json({success: true, msg: "Found",  address: address.profile[0].address});
	} catch (error) {
		next (error)
	}
}
exports.updateProfileImage = async (req, res, next) => {
	try {	
		if (!req.file)
			return next(APIError.badRequest('Profile picture is required'));
		const info = await getUserKYC(req.user); 
		//  check if there is existing profile files
		if (info && info.profile.length > 0) {
			//delete existing Profile
			if(info.profile?.logo){
				const delLogo = await deleteFileFromCloudinary(info.profile[0]?.logo?.id);
				if (delLogo.error) return next(APIError.badRequest(delLogo.message));
			}
			logger.info('Existing picture deleted successfully', {
				service: META.CLOUDINARY,
			});
		}
		// upload file to cloudinary
		const upload = await uploadSingleFileToCloudinary(req.file, req);
			if (upload?.error) return next(APIError.badRequest(upload.message));
			logger.info('Profile picture uploaded successfully', {	meta: META.CLOUDINARY,	});
			req.body.logo = {
				id: upload.public_id,
				url: upload.secure_url,
			};
	// profile object
			const details = {
			kyc: CONSTANTS.KYC_TYPE_INFO.profile,
			status: CONSTANTS.KYC_STATUS[0],
			userId: req.userId,
			user: req.user,
			userType: req.userType,
			onBoarded: false,
		};
		details.profile = { 
			logo: req.body.logo,
		 };
		const infoToUpdate = info.profile.filter(item => item?.logo?.id !== req.body.logo.id);
		infoToUpdate.push(details.profile)
		details.profile = infoToUpdate;
		 const save = await KYCUpdate(details);
		if (save?.error) return next(APIError.badRequest(save.error));
		logger.info("Profile picture updated successfully", {service: META.KYC})
		res
			.status(200)
			.json({ success: true, msg: `Profile picture updated successfully` });

	} catch (error) {	
		next (error);
	}
}
exports.updateLocation = async (req, res, next) => {
	try{
		const { latitude, longitude, storeId} = req.body
		if(!latitude) return next(APIError.badRequest("Location latitude is required"))
		if(!longitude) return next(APIError.badRequest("Location longitude is required")); 
		const info = await getUserKYC(req.user); 
		if(!info) return next(APIError.badRequest("User not found"));
		let storeExist;
			//check if store exist
			if(req.userType === CONSTANTS.ACCOUNT_TYPE_OBJ.business){
				if(!storeId) return next(APIError.badRequest("Store ID is required"));
				  storeExist = await  findStore({storeId})
				if( !storeExist || storeExist.length === 0) return next(APIError.badRequest("Store does not exist"));
				if(storeExist[0].user.toString() !== req.user.toString()) return next(APIError.unauthorized("Operation forbidden"));
			}
			//verify location
			const locationInfo = await verifyLocation({latitude, longitude});
			if(locationInfo?.error) return next (APIError.badRequest(locationInfo.error));
			logger.info("Location confirmed by MAP API", {service: META.LOCATION})
			const details = {
				location: {
				latitude,
				longitude,
				type: "Point",
				coordinates: [longitude, latitude],
				formattedAddress: locationInfo.result.formatted_address
			},
			user: req.user,
			userId: req.userId,
			userType: req.userType,
			kyc : CONSTANTS.KYC_TYPE_INFO.location ,
			}
			// UPDATE KYC 
		const updateLocation = await KYCUpdate(details)
		if(!updateLocation) return next(APIError.badRequest("Location KYC update failed, try again"));
		if (updateLocation?.error) return next(APIError.badRequest(updateLocation.error));
		details.locationStatus = CONSTANTS.LOCATION_STATUS.set;
		logger.info("KYC Location updated successfully", {service: META.KYC})
		// update store location
		if(req.userType === CONSTANTS.ACCOUNT_TYPE_OBJ.business){
		const store = await updateStoreLocation(storeId, details)
		if(!store) return next(APIError.badRequest("Store location update failed, try again"));
		if(store?.error ) return next (APIError.badRequest(store.error));
		}
		logger.info("Location updated successfully", {service: META.KYC})
		res.status(200).json({success: true, msg: "Location updated successfully"});
	} catch (error) {
		next (error)
	}
}