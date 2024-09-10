const express = require("express");
const mongoose = require("mongoose");
const { body, validationResult } = require('express-validator');
const User = require("../Models/UserModel");
const Books = require("../Models/BookModel");

exports.EditUser = [
    body('username')
    .optional()
    .trim()
    .notEmpty()
    .isLength({ min: 4 }).withMessage('Username must be at least 4 characters long')
    .matches(/^[a-zA-Z0-9\s:-]+$/).withMessage('Invalid Username'),
    
    body('name')
    .optional()
    .trim()
    .notEmpty().withMessage('Name cannot be empty')
    .matches(/^[a-zA-Z0-9\s:-]+$/).withMessage('Invalid Name'),

    body('email').optional().isEmail().withMessage('Invalid email address'),

    body('location')
    .optional()
    .trim()
    .notEmpty().withMessage('Location cannot be empty')
    .matches(/^[a-zA-Z0-9\s,'-()]+$/).withMessage("Invalid Location"),


    body('phone')
    .optional()
    .matches(/^\+?[0-9\s\-\(\)]+$/).withMessage('Invalid phone number')
    .isLength({ min: 9, max: 15 }).withMessage('Phone number must be between 9 and 15 characters long'),

    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { username, email, phone } = req.body;
        

        try {
            const existingUser = await User.findOne({ $or: [{ email }, {username}, { phone }] });
            if (existingUser) {
                return res.status(400).json({ message: "Username, Email, or Phone Number already in use" });
            }

            const updateData = req.body;

            const updatedUser = await User.findByIdAndUpdate(
                req.user.userId,
                { $set: updateData },
                { new: true, runValidators: true }
            );

            if (!updatedUser) {
                return res.status(404).send({ message: 'User not found' });
            }

            res.send(updatedUser);
        } catch (error) {
            res.status(500).send({ message: error.message });
        }
    }
];


exports.DeleteUser = async (req, res) => {
    try {
        await Books.deleteMany({owner: req.user.userId});
        const result = await User.findByIdAndDelete(req.user.userId);

        if (result.deletedCount === 0) {
            res.status(404).json({Status: "Failed", message: "No User to delete" });
        } else {
            res.status(204).send();
        }
    } catch (err) {
        console.error(err + " Failed to Delete User Account");
        res.status(500).json({Status: "Failed", message: "Failed to Delete User Account" });
    }
}

