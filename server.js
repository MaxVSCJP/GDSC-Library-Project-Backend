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

(async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);

    console.log("Connected to Database");
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (err) {
    console.log(err);
  }
})();

export default handler = serverless(app);
