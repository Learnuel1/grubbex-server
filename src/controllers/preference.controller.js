const logger = require("../logger");
const { createCategoryPreference, getCategoryPreference } = require("../services");
const { META } = require("../shared/utils/actions");
const { APIError } = require("../shared/utils/apiError");
const { shortIdGen } = require("../shared/utils/Generator");

exports.createPrefCategory = async (req, res, next) => {
  try {
      const {category} = req.body;
      if(!category || category.length === 0) return next(APIError.badRequest("Provide user preference"));
      const save = await createCategoryPreference( {
        id: shortIdGen(),
        account: req.user,
       category: category.map((cur)=> {return cur.trim()})
      });
      if(!save) return next(APIError.badRequest("Preference fail to create, try again"));
      if(save?.error) return next(APIError.badRequest(save.error));
      logger.info("Category preference created successfully", {service:META.PREFERENCE});
      res.status(200).json({success: true, msg: "Preference category created successfully"});
  } catch (error) {
    next(error)
  }
}
exports.getUserPreference = async (req, res, next)=> {
  try{
    let preference = await getCategoryPreference(req.user);
    logger.info("Preference retrieved successfully", {service: META.PREFERENCE})
    if(preference?.error) return next(APIError.badRequest(preference.error));
    res.status(200).json({success: true, msg: "Found", preference}) 
  } catch (error) {
    next(error)
  }
}