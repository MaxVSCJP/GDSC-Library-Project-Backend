const mongoose = require("mongoose");

const bookModel = new mongoose.Schema({
  Title: {
    type: String,
    required: true,
  },
  Author: {
    type: String,
    required: true,
  },
  PublishYear: {
    type: Number,
    required: false,
  },
  Genre: {
    type: [String],
  },
  Quantity: {
    type: Number,
    default: 1,
  },
  Description: {
    type: String,
    required: false,
  },
  Price: {
    type: Number,
    required: true,
  },
  BookType: {
    type: String,
    required: true,
    enum: ["physical", "digital"],
  },
  BookFrom: {
    type: String,
    required: true,
    enum: ["vendor", "writer"],
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  BookPDFID: {
    type: String,
    required: false,
  },
  BookPDFURL: {
    type: String,
    required: false,
  },
  BookImageID: {
    type: String,
    required: false,
  },
  BookImageURL: {
    type: String,
    required: false,
  },
});

module.exports = mongoose.model("Book", bookModel);
