const jwt = require("jsonwebtoken");
require("dotenv").config();

function authorize() {
    return (req, res, next) => {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];


        if(!token) return res.status(401).json({error: "Empty token"});

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = decoded;
            console.log(req.user)
            next();
        }
        catch(e) {
            res.status(401).json({error: "Unknown User, Possible Tampering"})
        }

    }
}

module.exports = authorize;