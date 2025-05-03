const mongoose = require("mongoose");

const OrderModel = new mongoose.Schema({
  Buyer: {
    type: String,
    required: true,
  },
  BuyerPhone: {
    type: String,
    required: true,
  },
  BuyerEmail: {
    type: String,
    required: true,
  },
  Seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  Book: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Book",
    required: true,
  },
  Title: {
    type: String,
    required: true,
  },
  Price: {
    type: Number,
    required: true,
  },
  Quantity: {
    type: Number,
  },
  OrderDate: {
    type: Date,
    default: Date.now,
  },
  DeliveryDate: {
    type: Date,
    required: false,
  },
  OrderStatus: {
    type: String,
    enum: ["Pending", "Delivered", "Cancelled"],
    default: "Pending",
  },
  BookImageURL: {
    type: String,
    required: false,
  },
  TransactionID: {
    type: String,
    required: true,
  },
  Verification: {
    type: Boolean,
    default: false,
  },
});

module.exports = mongoose.model("Order", OrderModel);
