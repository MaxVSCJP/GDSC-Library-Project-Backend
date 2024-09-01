const User = require("../Models/UserModel");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { body, validationResult } = require('express-validator');
require("dotenv").config();


exports.signup = [
    // Validate and sanitize input fields
    body('name')
        .trim()
        .notEmpty().withMessage('Name is required')
        .isLength({ min: 2 }).withMessage('Name must be at least 2 characters long'),

    body('username')
        .trim()
        .notEmpty().withMessage('Username is required')
        .isLength({ min: 4 }).withMessage('Username must be at least 4 characters long'),

    body('email')
        .trim()
        .isEmail().withMessage('Invalid email address')
        .normalizeEmail(),

    body('password')
        .trim()
        .notEmpty().withMessage('Password is required')
        .isLength({ min: 8 }).withMessage('Password must be at least 6 characters long'),

    body('location')
        .optional({ checkFalsy: true })
        .trim()
        .isLength({ max: 100 }).withMessage('Location must be less than 100 characters'),

    body('phone')
        .optional({ checkFalsy: true })
        .trim()
        .matches(/^\d{10,15}$/).withMessage('Phone number must be between 10 to 15 digits'),

    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { name, username, email, password, location, phone } = req.body;

        try {
            const existingUser = await User.findOne({ $or: [{ email }, { username }, { phone }] });
            if (existingUser) {
                return res.status(400).json({ message: "Email, Username, or Phone Number already in use" });
            }

            const hashed = await bcrypt.hash(password, 13);

            const newUser = new User({
                name, username, email, password: hashed, location, phone
            });

            await newUser.save();

            res.status(201).json({ message: "User Created Successfully" });
        } catch (error) {
            console.log(error);
            res.status(500).json({ error: error.message });
        }
    }
];

exports.login = [

    body('username')
        .trim()
        .notEmpty().withMessage('Username is required')
        .isLength({ min: 4 }).withMessage('Username must be at least 4 characters long'),

    body('password')
        .trim()
        .notEmpty().withMessage('Password is required')
        .isLength({ min: 8 }).withMessage('Password must be at least 6 characters long'),

    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const {username, password} = req.body;

        try {
            const user = await User.findOne({username});
            if(!user) return res.status(404).json({error: "User not found"});

            const isMatch = await bcrypt.compare(password, user.password);
            if(!isMatch) return res.status(403).json({error: 'Wrong Password'});

            const token = jwt.sign({userId: user._id, username: user.username, email: user.email}, process.env.JWT_SECRET);

            res.json({token: token})

        } catch (error) {
            res.status(500).json({error: error.message});
        }

    }
]

