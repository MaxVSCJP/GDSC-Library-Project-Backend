const express = require("express");
const serverless = require("serverless-http");
const cors = require("cors");
const mongoose = require("mongoose");
const helmet = require("helmet");
const mongoSanitize = require("express-mongo-sanitize");
const rateLimit = require("express-rate-limit");
const xssClean = require("xss-clean");
require("dotenv").config();
const app = express();
const PORT = process.env.PORT || 1738;
const BookRoutes = require("./Routing/BookRoutes");
const AuthRoutes = require("./Routing/AuthRoutes");
const UserRoutes = require("./Routing/UserRoutes");
const SearchRoute = require("./Routing/SearchRoute");

let isConnected = false;

const connectToDatabase = async () => {
  if (isConnected) {
    console.log("Reusing existing database connection");
    return;
  }

  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    isConnected = true;
    console.log("Connected to Database");
  } catch (err) {
    console.error("Error connecting to database", err);
    throw err;
  }
};

app.use(async (req, res, next) => {
  await connectToDatabase();
  next();
});

const corsOptions = {
  origin: "*",
  optionsSuccessStatus: 200,
};

const limiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 200,
});

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        objectSrc: ["'none'"],
      },
    },
  })
);

app.use(xssClean());
app.use(limiter);
app.use(express.json());
app.use(mongoSanitize());
app.use(cors(corsOptions));
app.use("/books", BookRoutes);
app.use("/auth", AuthRoutes);
app.use("/user", UserRoutes);
app.use("/search", SearchRoute);
app.get("/*", (req, res) => {
  res.status(200).json({ message: "Welcome to the API" });
});

module.exports.handler = serverless(app);
