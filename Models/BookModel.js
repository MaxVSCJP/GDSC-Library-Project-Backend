const mongoose = require("mongoose");

const bookModel = new mongoose.Schema({
    Title: {
        type: String,
        required: true
    },
    Author: {
        type: String,
        required: true
    },
    PublishYear: {
        type: Number,
        required: true
    },
    Genre: {
        type: [String]
    },
    NumberOfCopies: {
        type: Number,
        default: 1
    },
    Description: {
        type: String,
        required: false
    },
    price: {
        type: Number,
        default: 0
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
});


module.exports = mongoose.model("Book", bookModel);