const mongoose = require("mongoose");

const userModel = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  username: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  location: {
    type: String,
    required: false,
  },
  phone: {
    type: String,
    required: true,
    unique: true,
  },
  ProfilePicURL: {
    type: String,
    required: false,
  },
  ProfilePicID: {
    type: String,
    required: false,
  },
  role: {
    type: String,
    required: true,
    enum: ["vendor", "writer", "admin", "user"],
    default: "user",
  },
  books: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Book",
    },
  ],
  BankAccount: {
    type: String,
    required: true,
  },
});

module.exports = mongoose.model("User", userModel);
