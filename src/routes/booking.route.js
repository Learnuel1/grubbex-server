const express = require("express");
const bookRoute = express.Router();
const Controller = require("../controllers");
const { userRequired, driverRequired } = require("../middlewares/auth.middleware");

bookRoute.post("/", userRequired, Controller.BookController.bookMuva).patch("/cancel", userRequired, Controller.BookController.cancelMuva).get("/", userRequired, Controller.BookController.bookingById).get("/all", userRequired, Controller.BookController.bookings).get("/available",userRequired, driverRequired, Controller.BookController.getAvailableBookings).patch("/",userRequired, driverRequired, Controller.BookController.bookingAvailableStatus).get("/muva-booking",userRequired, driverRequired, Controller.BookController.muvaBookings).post("/location", userRequired, driverRequired, Controller.BookController.currentLocation).get("/location", userRequired, Controller.BookController.getLocation).patch("/completed", userRequired, Controller.BookController.bookingDelivered)

module.exports ={
  bookRoute,
}