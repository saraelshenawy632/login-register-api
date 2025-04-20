import express from 'express';
import User from '../models/user.js';
import bcrypt from 'bcrypt';
import { isAuthenticated } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Register new user
router.post('/register', async (req, res) => {
    try {
        const { firstName, lastName, email, password, phoneNumber, address } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'Email already registered'
            });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create new user
        const user = await User.create({
            firstName,
            lastName,
            email,
            password: hashedPassword,
            phoneNumber,
            address,
            role: 'user'
        });

        res.status(201).json({
            success: true,
            message: 'Registration successful',
            data: {
                id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        console.error('❌ Registration error:', error);
        res.status(500).json({
            success: false,
            message: 'Registration failed',
            error: error.message
        });
    }
});

// Login user
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validate input
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email and password are required'
            });
        }

        // Find user and explicitly select password field
        const user = await User.findOne({ email }).select('+password');
        if (!user) {
            console.log('User not found:', email);
            return res.status(401).json({
                success: false,
                message: 'Email not found'
            });
        }

        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            console.log('Invalid password for user:', email);
            return res.status(401).json({
                success: false,
                message: 'Incorrect password'
            });
        }

        // Set user session
        req.session.user = {
            id: user._id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role
        };

        res.status(200).json({
            success: true,
            message: 'Login successful',
            data: {
                id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        console.error('❌ Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Login failed',
            error: error.message
        });
    }
});

// Logout user
router.post('/logout', isAuthenticated, (req, res) => {
    try {
        req.session.destroy();
        res.status(200).json({
            success: true,
            message: 'Logout successful'
        });
    } catch (error) {
        console.error('❌ Logout error:', error);
        res.status(500).json({
            success: false,
            message: 'Logout failed',
            error: error.message
        });
    }
});

// Get current user
router.get('/me', isAuthenticated, async (req, res) => {
    try {
        const user = await User.findById(req.session.user.id).select('-password');
        res.status(200).json({
            success: true,
            data: user,
            message: 'User data fetched successfully'
        });
    } catch (error) {
        console.error('❌ Error fetching user data:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch user data',
            error: error.message
        });
    }
});

// Update user
router.patch('/update_user', isAuthenticated, async (req, res) => {
    try {
        const { firstName, lastName, phoneNumber, address, email, password, role } = req.body;
        const userId = req.session.user.id;

        // First, verify user exists
        const existingUser = await User.findById(userId);
        if (!existingUser) {
            console.log('❌ User not found for update:', userId);
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Prepare update data with role
        const updateData = { firstName, lastName, phoneNumber, address, email, role };

        // Hash new password if provided
        if (password) {
            updateData.password = await bcrypt.hash(password, 10);
        }

        // Update user
        const updatedUser = await User.findByIdAndUpdate(
            userId,
            updateData,
            { new: true, select: '-password' }
        );

        console.log('✅ User updated successfully:', updatedUser._id);
        res.status(200).json({
            success: true,
            message: 'User updated successfully',
            data: updatedUser
        });
    } catch (error) {
        console.error('❌ Update user error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update user',
            error: error.message
        });
    }
});

export default router;
