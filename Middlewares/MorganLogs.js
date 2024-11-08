const morgan = require("morgan");
const Log = require("../Models/MorganLogModel");

/* morgan.token("response-time", function (req, res) {
  return res.getHeader("X-Response-Time");
});

morgan.token("userid", function (req, res) {
  return req.cookies.userid;
});

morgan.token("username", function (req, res) {
  return req.cookies.username;
});

morgan.token("ip", function (req, res) {
  return req.ip;
}); */

exports.logFormat = ":method :url :status";

exports.stream = {
  write: function (message) {
    const logData = message.trim().split(" ");
    const log = new Log({
      method: logData[0],
      url: logData[1],
      status: parseInt(logData[2]),
      /* responseTime: parseFloat(logData[3]),
      userId: logData[4],
      username: logData[5],
      ip: logData[6], */
    });
    log.save().catch((err) => console.error(err));
  },
};
