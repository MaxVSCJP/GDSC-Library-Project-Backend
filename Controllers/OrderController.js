const express = require("express");
const mongoose = require("mongoose");
const axios = require("axios");
const https = require("https");
const Orders = require("../Models/OrderModel");
const Books = require("../Models/BookModel");
const User = require("../Models/UserModel");
const emailer = require("nodemailer");
const { body, validationResult } = require("express-validator");
require("dotenv").config();

const transporter = emailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL,
    pass: process.env.EMAIL_PASSWORD,
  },
});

const axiosInstance = axios.create({
  httpsAgent: new https.Agent({
    rejectUnauthorized: false,
    secureProtocol: "TLSv1_2_method",
  }),
});

const CHAPA_URL =
  process.env.CHAPA_URL || "https://api.chapa.co/v1/transaction/initialize";
const CHAPA_AUTH = process.env.CHAPA_AUTH;

const config = {
  headers: {
    Authorization: `Bearer ${CHAPA_AUTH}`,
  },
};

exports.BuyBook = [
  body("FirstName")
    .trim()
    .isLength({ min: 1 })
    .withMessage("First Name is required")
    .matches(/^[a-zA-Z]+$/)
    .withMessage("Invalid First Name"),

  body("LastName")
    .trim()
    .isLength({ min: 1 })
    .withMessage("Last Name is required")
    .matches(/^[a-zA-Z]+$/)
    .withMessage("Invalid Last Name"),

  body("Phone")
    .matches(/^\+?[0-9\s\-\(\)]+$/)
    .withMessage("Invalid phone number")
    .isLength({ min: 9, max: 15 })
    .withMessage("Phone number must be between 9 and 15 characters long"),

  body("Price")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Price must be a positive number"),

  body("Title")
    .trim()
    .isLength({ min: 1 })
    .withMessage("Title is required")
    .matches(/^[a-zA-Z0-9\s:-]+$/)
    .withMessage("Invalid book title"),

  body("OwnerId")
    .custom((value) => {
      console.log("OwnerId:", value);
      return mongoose.Types.ObjectId.isValid(value);
    })
    .withMessage("Invalid Owner ID"),

  body("BookId")
    .custom((value) => {
      console.log("BookId:", value);
      return mongoose.Types.ObjectId.isValid(value);
    })
    .withMessage("Invalid Book ID"),

  body("Quantity")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Quantity must be a positive integer"),

  body("ReturnURL")
    .trim()
    .isLength({ min: 1 })
    .withMessage("ReturnURL is required")
    .matches(
      /^https:\/\/(Anbibu\.(pro\.et|netlify\.app)|localhost:(5173|3000))\/book\/[a-zA-Z0-9]+$/
    )
    .withMessage("Invalid Return URL"),

  async (req, res) => {
    const {
      FirstName,
      LastName,
      Phone,
      Title,
      OwnerId,
      BookId,
      ReturnURL,
      Quantity,
      BuyerEmail,
    } = req.body;
    console.log(req.body);
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const Book = await Books.findById(BookId);

    if (Book.Quantity < Quantity) {
      res.status(400).json({ message: "Order Amount more than available" });
    }

    const CALLBACK_URL = `${process.env.SERVER_URL}/order/verify-payment/`;

    const TEXT_REF = "tx-anbibuBookBuy-" + Date.now() + "-" + BookId;

    const data = {
      amount: `${Book.Price * Quantity}`,
      currency: "ETB",
      phone_number: Phone,
      first_name: FirstName,
      last_name: LastName,
      tx_ref: TEXT_REF,
      callback_url: CALLBACK_URL + TEXT_REF,
      return_url: ReturnURL,
    };

    await axiosInstance
      .post(CHAPA_URL, data, config)
      .then(async (response) => {
        res.status(200).json({ checkout_url: response.data.data.checkout_url });
        const newOrder = new Orders({
          Buyer: FirstName + " " + LastName,
          BuyerEmail,
          Seller: OwnerId,
          Book: BookId,
          Title,
          BuyerPhone: Phone,
          Price: Book.Price,
          Quantity,
          BookImageURL: Book.BookImageURL,
          TransactionID: TEXT_REF,
        });
        await newOrder.save();
        axiosInstance
          .get(CALLBACK_URL + TEXT_REF)
          .catch((err) => console.log("First error: ", err.message));
      })
      .catch((err) => console.log("making payment error", err.message));
  },
];

exports.VerifyPayment = async (req, res) => {
  var requestOptions = {
    method: "GET",
    headers: config.headers,
    redirect: "follow",
  };
  fetch(
    "https://api.chapa.co/v1/transaction/verify/" + req.params.id,
    requestOptions
  )
    .then((response) => response.json())
    .then(async (result) => {
      const order = await Orders.findOne({
        TransactionID: req.params.id,
      }).populate("Book");

      const orderedBook = order.Book;

      try {
        const verifyOrder = await Orders.findOneAndUpdate(
          { TransactionID: req.params.id },
          {
            Verification: true,
          }
        );
        console.log("Payment Successful. Order placed successfully");
      } catch (error) {
        console.error("Making Order Error: ", error);
      }

      let updateBook;
      const BookId = orderedBook._id;

      try {
        updateBook = await Books.findByIdAndUpdate(
          BookId,
          { $inc: { Quantity: -order.Quantity } },
          { new: true }
        );
        if (updateBook.Quantity == 0) {
          const book = await Books.findById(BookId).select(
            "owner BookImageID BookPDFID"
          );

          if (book.BookImageID) {
            await cloudinary.uploader.destroy(book.BookImageID, (error) => {
              if (error) {
                res.status(500).json({
                  Status: "Failed",
                  message: "Failed to Delete Book",
                });
              }
            });
          }
          if (book.BookPDFID) {
            await cloudinary.uploader.destroy(book.BookPDFID, (error) => {
              if (error) {
                res.status(500).json({
                  Status: "Failed",
                  message: "Failed to Delete Book",
                });
              }
            });
          }

          await User.findByIdAndUpdate(book.owner, {
            $pull: { books: BookId },
          });

          await Books.findByIdAndDelete(BookId);
        }
      } catch (error) {
        console.error("Updating Book Error: ");
      }

      let user;
      const { Seller, BuyerEmail, Title, Price, Quantity } = order;

      try {
        user = await User.findById(Seller);
        var raw = {
          account_name: user.name,
          account_number: user.BankAccount,
          amount: Price * Quantity * 0.95,
          currency: "ETB",
          reference: `tx-anbibuBookTransfer-${BookId}-${
            user.name
          }-${Date.now()}`,
          bank_code: 946,
        };
        var requestOptions = {
          method: "POST",
          headers: config.headers,
          body: raw,
          redirect: "follow",
        };

        try {
          console.log(requestOptions);
          await fetch("https://api.chapa.co/v1/transfers", {
            method: "POST",
            headers: config.headers,
            body: raw,
          })
            .then((response) => response.json())
            .then((result) => console.log(result));
        } catch (error) {
          console.error("Transfering Payment Error: ", error);
        }
        console.log("Order: ", order);

        try {
          await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: BuyerEmail,
            subject: "Your order has been created successfully",
            text: `Your order Details are stated Below:\n
            Book Name: ${Title}\n
            Quantity: ${Quantity}\n
            Total Price: ${Price * Quantity}\n
            Order Date: ${order.OrderDate}\n
            Delivery Date: ${order.DeliveryDate}\n
            Seller Name: ${user.name}\n
            Seller Phone Number: ${user.phone}\n\n
            ${
              orderedBook.BookType == "digital"
                ? `Book PDF: ${orderedBook.BookPDFURL}`
                : ""
            }\n`,
          });
          console.log("Email sent successfully");
        } catch (err) {
          console.log("Sending mail error", err);
          if (!res.headersSent) {
            res
              .status(500)
              .json({ message: "Error sending email.", error: err.message });
          }
        }

        res.status(200).json({
          Status: "Successful",
          message: "Payment Verified and Transfered",
        });
      } catch (error) {
        console.log("Transfering Payment Error ", error);
      }
    })
    .catch((err) => console.log("Payment can't be verfied: ", err));
};

exports.OrderHistory = async (req, res) => {
  try {
    console.log(req.user.userId);
    const orders = await Orders.find({ Seller: req.user.userId });
    if (!orders) {
      return res.status(404).json({
        Status: "Failed",
        message: "No Orders Found",
      });
    }
    res.status(200).json(orders);
  } catch (error) {
    console.error("Order History Error: ", error);
    res.status(500).json({
      Status: "Failed",
      message: "Failed to get Orders",
    });
  }
};

exports.FinishOrder = async (req, res) => {
  const orderId = req.params.id;

  try {
    const order = await Orders.findById(orderId);
    if (!order) {
      return res.status(404).json({
        Status: "Failed",
        message: "Order not found",
      });
    }

    if (order.Seller != req.user.userId) {
      return res.status(403).json({
        Status: "Failed",
        message: "You are not authorized to finish this order",
      });
    }

    const updatedOrder = await Orders.findByIdAndUpdate(
      orderId,
      { OrderStatus: "Delivered" },
      { new: true }
    );

    const { Seller, BuyerEmail, Title, Price, Quantity } = order;
    const user = await User.findById(Seller);

    try {
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: BuyerEmail,
        subject: "Your order has been fullfilled successfully",
        text: `Your order Details are stated below:\n
        Book Name: ${Title}\n
        Quantity: ${Quantity}\n
        Order Date: ${order.OrderDate}\n
        Seller Name: ${user.name}\n
        Seller Phone Number: ${user.phone}\n
        If you have any questions or complaints, please contact us through our website anbibu.pro.et:`,
      });

      console.log("Email sent successfully");
    } catch (err) {
      console.log("Sending mail error", err);
      if (!res.headersSent) {
        res
          .status(500)
          .json({ message: "Error sending email.", error: err.message });
      }
    }

    res.status(200).json(updatedOrder);
  } catch (error) {
    console.error("Finish Order Error: ", error);
    res.status(500).json({
      Status: "Failed",
      message: "Failed to Finish Order",
    });
  }
};

exports.CancelOrder = async (req, res) => {
  const orderId = req.params.id;

  try {
    const order = await Orders.findById(orderId);
    if (!order) {
      return res.status(404).json({
        Status: "Failed",
        message: "Order not found",
      });
    }

    if (order.Seller != req.user.userId) {
      return res.status(403).json({
        Status: "Failed",
        message: "You are not authorized to finish this order",
      });
    }

    const updatedOrder = await Orders.findByIdAndUpdate(
      orderId,
      { OrderStatus: "Cancelled" },
      { new: true }
    );

    const { Seller, BuyerEmail, Title, Price, Quantity } = order;
    const user = await User.findById(Seller);

    try {
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: BuyerEmail,
        subject: "Your order has been cancelled",
        text: `Your order Details are stated below:\n
        Book Name: ${Title}\n
        Quantity: ${Quantity}\n
        Order Date: ${order.OrderDate}\n
        Seller Name: ${user.name}\n
        Seller Phone Number: ${user.phone}\n
        If you have any questions or complaints, please contact us through our website at anbibu.pro.et:`,
      });

      console.log("Email sent successfully");
    } catch (err) {
      console.log("Sending mail error", err);
      if (!res.headersSent) {
        res
          .status(500)
          .json({ message: "Error sending email.", error: err.message });
      }
    }

    res.status(200).json(updatedOrder);
  } catch (error) {
    console.error("Cancel Order Error: ", error);
    res.status(500).json({
      Status: "Failed",
      message: "Failed to Cancel Order",
    });
  }
};
