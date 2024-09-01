const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const helmet = require("helmet");
const mongoSanitize = require("express-mongo-sanitize");
const rateLimit = require('express-rate-limit');
const app = express();
const PORT = 6341;
const BookRoutes = require("./Routing/BookRoutes");
const AuthRoutes = require("./Routing/AuthRoutes");
const UserRoutes = require("./Routing/UserRoutes");


const corsOptions = {
    origin: "*",
    optionsSuccessStatus: 200
}


const limiter = rateLimit({
    windowMs: 10 * 60 * 1000,
    max: 200    
});


app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'"],
            objectSrc: ["'none'"]
        }
    }
}));

app.use(mongoSanitize());
app.use(limiter);
app.use(express.json());
app.use(cors(corsOptions))
app.use("/books", BookRoutes);
app.use("/auth", AuthRoutes);
app.use("/user", UserRoutes);




(async () => {
    try{
        await mongoose.connect("mongodb://localhost:27017/libraryDB");
        console.log("Connected to Database");
        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });
    }
    catch(err){
        console.log(err);
    }
})();