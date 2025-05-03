const express = require("express");
const router = express.Router();
const multer = require("multer");
const OrderController = require("../Controllers/OrderController");
const authMW = require("../Middlewares/AuthorizationMW");
const morgan = require("morgan");
const morganLogs = require("../Middlewares/MorganLogs");

const upload = multer().none();

router.post(
  "/BuyBook",
  morgan(morganLogs.logFormat, { stream: morganLogs.stream }),
  upload,
  OrderController.BuyBook
);

router.get(
  "/verify-payment/:id",
  morgan(morganLogs.logFormat, { stream: morganLogs.stream }),
  OrderController.VerifyPayment
);

router.get("/history", authMW(), OrderController.OrderHistory);

router.patch("/finish/:id", authMW(), OrderController.FinishOrder);

router.patch("/cancel/:id", authMW(), OrderController.CancelOrder);

module.exports = router;
