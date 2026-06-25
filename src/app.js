const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const logger = require("./logger");
const { CONFIG, CORS_WHITELISTS } = require("./config");
const { errorHandler } = require("./middlewares/error.middleware");
const expressWinston = require("express-winston");
const rateLimit = require('express-rate-limit');
dotenv.config();

const app = express();  
app.set('trust proxy', 1);
// Create a limiter
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// Apply to all routes
app.use(limiter);

// Your routes
app.get('/api/orders', (req, res) => {
    res.json({ message: 'Orders list' });
});

app.listen(15000, () => console.log('App running'));
app.use(
  cors({
    origin: function (origin, cb) {
      logger.info({ origin, whitelists: CORS_WHITELISTS }, "Cors Info");
      logger.info({...CORS_WHITELISTS }, "Cors Info");
      if (!origin || CORS_WHITELISTS.includes(origin)) {
        return cb(null, true);
      }
      return cb(new Error("Not allowed by CORS"));
    },
    methods: ["GET", "PUT", "POST", "DELETE", "PATCH"],
    credentials: true,
  })
);
app.use(expressWinston.logger(logger));
// app.disable("etag");
app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ limit: "5mb", extended: true }));
app.use("/api/v1/status", (_req, res) => {
  res.send({ msg: `Yes!... Welcome to ${CONFIG.APP_NAME} API` });
});
app.use(errorHandler);
module.exports = app;
