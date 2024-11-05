const express = require("express");
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
const cloudinary = require("cloudinary").v2;

cloudinary.config({
  cloudinary_url: process.env.CLOUDINARY_URL,
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
        imgSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'"],
        objectSrc: ["'none'"],
        connectSrc: ["'self'"],
        mediaSrc: ["'self'"],
        fontSrc: ["'self'"],
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

(async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to Database");
    app.listen(PORT, () => {
      console.log(`Server running at ${PORT}`);
    });
  } catch (error) {
    console.log(error);
  }
})();
