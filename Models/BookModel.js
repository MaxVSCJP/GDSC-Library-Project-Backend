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
  },
  Genre: {
    type: [String],
  },
  NumberOfCopies: {
    type: Number,
    default: 1,
  },
  Description: {
    type: String,
    required: false,
  },
  Price: {
    type: Number,
    default: 0,
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
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
