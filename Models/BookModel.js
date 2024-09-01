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
        default: 5
    },
    Description: {
        type: String,
        required: false
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
});


module.exports = mongoose.model("Book", bookModel);