// routes/adminRoutes.js

import express from 'express';
import User from '../models/user.js';
import bcrypt from 'bcrypt';
import { isAuthenticated, isAdmin } from '../middlewares/authMiddleware.js';

const router = express.Router();

// ✅ Get all users
router.get('/users', isAuthenticated, isAdmin, async (req, res) => {
    try {
        const users = await User.find({}).select('-password');
        res.status(200).json({
            success: true,
            data: users,
            message: 'Users fetched successfully'
        });
    } catch (error) {
        console.error('❌ Error fetching users:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch users',
            error: error.message
        });
    }
});

// ✅ Get single user by ID
router.get('/users/:userId', isAuthenticated, isAdmin, async (req, res) => {
    try {
        const user = await User.findById(req.params.userId).select('-password');
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        res.status(200).json({
            success: true,
            data: user,
            message: 'User fetched successfully'
        });
    } catch (error) {
        console.error('❌ Error fetching user:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch user',
            error: error.message
        });
    }
});

// ✅ Create user
router.post('/users', isAuthenticated, isAdmin, async (req, res) => {
    try {
        const { firstName, lastName, email, password, phoneNumber, address, role } = req.body;
        const existingUser = await User.findOne({ email });

        if (existingUser) return res.status(400).json({ success: false, message: 'Email already registered' });

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await User.create({
            firstName,
            lastName,
            email,
            password: hashedPassword,
            phoneNumber,
            address,
            role: role || 'user'
        });

        res.status(201).json({
            success: true,
            message: 'User created successfully',
            data: {
                id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        console.error('❌ Error creating user:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create user',
            error: error.message
        });
    }
});

// ✅ Update user
router.put('/users/:userId', isAuthenticated, isAdmin, async (req, res) => {
    try {
        const { firstName, lastName, phoneNumber, address, role, email, password } = req.body;
        const userId = req.params.userId;

        const existingUser = await User.findById(userId);
        if (!existingUser) return res.status(404).json({ success: false, message: 'User not found' });

        if (email && email !== existingUser.email) {
            const emailExists = await User.findOne({ email });
            if (emailExists) return res.status(400).json({ success: false, message: 'Email already in use' });
        }

        const updateData = { firstName, lastName, phoneNumber, address, role, email };
        if (password) updateData.password = await bcrypt.hash(password, 10);

        const updatedUser = await User.findByIdAndUpdate(userId, updateData, { new: true }).select('-password');

        res.status(200).json({
            success: true,
            data: updatedUser,
            message: 'User updated successfully'
        });
    } catch (error) {
        console.error('❌ Error updating user:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update user',
            error: error.message
        });
    }
});

// ✅ Delete user
router.delete('/users/:userId', isAuthenticated, isAdmin, async (req, res) => {
    try {
        const user = await User.findByIdAndDelete(req.params.userId);
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        res.status(200).json({ success: true, message: 'User deleted successfully' });
    } catch (error) {
        console.error('❌ Error deleting user:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete user',
            error: error.message
        });
    }
});

export default router;
