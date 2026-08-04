const multer = require("multer")
const { CONSTANTS } = require("../../config")

const imageFilter = (req, file, cb) => {
	if (CONSTANTS.IMAGE_FORMAT.includes(file.mimetype)) {
		cb(null, true)
	} else {
		cb(null, false)
		 cb(new Error("Invalid file format or size (1mb or less)"))
	}
}
const fileFilter = (req, file, cb) => {
	if (CONSTANTS.KYC_FORMAT.includes(file.mimetype)) {
		cb(null, true)
	} else if(file.mimetype.startsWith("video/")){
		videoFilter(req,file, cb);
	} else {
		cb(null, false)
		 cb(new Error("Invalid file format or size (3mb or less)"))
	}
}
const videoFilter = (req, file, cb) => {
	console.log(file)
	if ( file.mimetype.startsWith("video/")) {
		cb(null, true)
	} else {
		cb(null, false)
		 cb(new Error("Invalid file format or size (10mb or less)"))
	}
}

const multerImage = multer({
	storage: multer.diskStorage({}),
	limits: {
		fileSize: 1024 * 1024 * 3
	},
	fileFilter: imageFilter
})
const multerFile = multer({
	storage: multer.diskStorage({}),
	limits: {
		fileSize: 1024 * 1024 * 3
	},
	fileFilter: fileFilter
})
const multerVideo = multer({
	storage: multer.diskStorage({}),
	limits: {
		fileSize: 1020 *1024 * 10
	},
	fileFilter: videoFilter
})

module.exports ={
  multerImage,
  multerFile,
  multerVideo
}