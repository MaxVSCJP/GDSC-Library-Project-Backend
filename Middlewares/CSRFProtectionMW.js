require("dotenv").config();

const { doubleCsrf } = require("csrf-csrf");

const { doubleCsrfProtection, generateToken } = doubleCsrf({
  getSecret: () => process.env.CSRF_SECRET,
  cookieName: "csrfToken",
  cookieOptions: {
    sameSite: "none",
    path: "/",
    secure: process.env.NODE_ENV === "production",
    httpOnly: false,
    maxAge: 1000 * 60 * 60 * 24 * 100,
  },
  ignoredMethods: ["HEAD", "OPTIONS"],
  getTokenFromRequest: (req) => req.headers["x-csrf-token"],
});

function csrfMiddleware(req, res, next) {
  doubleCsrfProtection(req, res, (err) => {
    if (err) {
      console.log(req.cookies);
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
