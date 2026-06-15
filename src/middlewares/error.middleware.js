const { ZodError } = require("zod");
const logger = require("../logger");
const {fromZodError} = require("zod-validation-error");
const { mongoose } = require("mongoose");
const { JsonWebTokenError } = require("jsonwebtoken");

exports.notFound = (_req, res, _next) => {
  const err = new Error("Route Not Found");
  err.status = 404;
  logger.error(err, {service:"error"});
  res.status(err.status).json({ error: err.message });
};

exports.errorHandler = (err, _req, res, _next) => {
  logger.error(err,{service:"error"});
  if(err instanceof ZodError){
    const validationError = fromZodError(err);
    const errs =validationError.details[0];
    err.status = 400; 
  return  res.status(err.status || 400).json({ error: errs.message}); 
  }
  if (err instanceof mongoose.Error.CastError && err.kind === 'ObjectId') {
    err.message( 'Invalid account ID format' );
}
  if(err instanceof mongoose.Error){
    if (err.name === 'MongoServerError') { 
      const field = Object.keys(err.keyPattern)[0];
      const value = err.keyValue[field];
      res.status(err.status).json({ error: `${value} already exist`});
    }
    if(err.code === 11000) err.message("duplicate data found")
      if (err.code === 11000) { // Check for the E11000 duplicate key error code
        const field = Object.keys(err.keyValue)[0];
        err.message(`An account with this ${field} already exists.`);
      }
    if(err === "ValidationError") {
      err.message(err.message)
      err.status = 400
    }
    return  res.status(err.status || 400).json({ error: err?.message || "Invalid data supplied"});
  }
  if( err instanceof JsonWebTokenError){
    if(err.message === "TokenExpiredError"){
      err.status = 401
    return  res.status(err.status).json({ error: err.message});
    }
    if(err.message === "JsonWebTokenError"){
      err.status = 401
    return  res.status(err.status).json({ error: "Invalid Token"});
    }
  }
  if (err.message?.toLowerCase().includes("invalid file format")) {
    return  res.status(400).json({ error: err.message});
  }
  if (err.message?.toLowerCase().includes("file too large")) {
    return  res.status(400).json({ error: err.message});
  }
  if (err.error)
    return res
      .status(err.status || 404)
      .json({ error: "No Internet connection" });
  res.status(err.status || 500).json({ error: err.message || "Unknown error" });
};
