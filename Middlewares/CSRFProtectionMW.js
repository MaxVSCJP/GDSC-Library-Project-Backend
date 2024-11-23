require("dotenv").config();

const { doubleCsrf } = require("csrf-csrf");

const { doubleCsrfProtection, generateToken } = doubleCsrf({
  getSecret: () => process.env.CSRF_SECRET,
  cookieName: "csrfToken",
  cookieOptions: {
    sameSite: "none",
    path: "/",
    secure: process.env.NODE_ENV === "production",
  },
  ignoredMethods: ["HEAD", "OPTIONS"],
  getTokenFromRequest: (req) => req.headers["x-csrf-token"],
});

function csrfMiddleware(req, res, next) {
  doubleCsrfProtection(req, res, (err) => {
    console.error("CSRF Token from header: ", req.headers["x-csrf-token"]);
    console.error("CSRF Token from cookie: ", req.cookies.csrfToken);
    if (err) {
      console.log(req.cookies);
      console.error(
        "Error, CSRF Token from header: ",
        req.headers["x-csrf-token"]
      );
      console.error("Error, CSRF Token from cookie: ", req.cookies.csrfToken);
      if (err.code === "EBADCSRFTOKEN") {
        return res.status(403).json({ error: "Invalid or missing CSRF token" });
      }
    }
    next();
  });
}

exports.csrfProtection = csrfMiddleware;
exports.generateToken = generateToken;
