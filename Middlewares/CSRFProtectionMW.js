// const { csrf } = require("csrf-csrf");
require("dotenv").config();

/* const csrfProtection = csrfSync({
  secret: process.env.CSRF_SECRET || "defaultSecretKey",
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "none",
  },
});

function csrfMiddleware(req, res, next) {
  csrfProtection(req, res, (err) => {
    if (err) {
      if (err.code === "EBADCSRFTOKEN") {
        return res.status(403).json({ error: "Invalid or missing CSRF token" });
      }
    }
    next();
  });
} */

/* const csrfProtection = csrf({
  secret: process.env.CSRF_SECRET || "defaultSecretKey",
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "none",
  },
}); */

const { doubleCsrf } = require("csrf-csrf");

// Set up csrf-csrf middleware with your options
const { doubleCsrfProtection, generateToken } = doubleCsrf({
  getSecret: () => process.env.CSRF_SECRET, // Your secret key for hashing CSRF tokens
  cookieName: "csrfToken", // The name of the CSRF token cookie
  cookieOptions: {
    sameSite: "none", // CSRF cookie security settings
    path: "/",
    secure: process.env.NODE_ENV === "production", // Set to false for development, true in production
  },
  ignoredMethods: ["HEAD", "OPTIONS"], // Methods that are not protected
  getTokenFromRequest: (req) => req.headers["x-csrf-token"], // Function to get the CSRF token from the request
});

function csrfMiddleware(req, res, next) {
  doubleCsrfProtection(req, res, (err) => {
    if (err) {
      console.error("CSRF validation error:", err);
      if (err.code === "EBADCSRFTOKEN") {
        return res.status(403).json({ error: "Invalid or missing CSRF token" });
      }
    }
    next();
  });
}

exports.csrfProtection = csrfMiddleware;
exports.generateToken = generateToken;
