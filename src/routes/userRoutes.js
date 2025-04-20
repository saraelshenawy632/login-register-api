import express from 'express';
import User from '../models/user.js';
import Message from '../models/message.js';
import bcrypt from 'bcrypt';
import { isAuthenticated } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Get user profile
router.get('/profile', isAuthenticated, async (req, res) => {
    try {
        const user = await User.findById(req.session.user.id).select('-password');
        res.status(200).json({
            success: true,
            data: user,
            message: 'Profile fetched successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch profile',
            error: error.message
        });
    }
});

// Update user profile
router.put('/profile', isAuthenticated, async (req, res) => {
    try {
        const { firstName, lastName, phoneNumber, address, email, password } = req.body;
        const userId = req.session.user.id;

        const updateData = { firstName, lastName, phoneNumber, address, email };
        if (password) {
            updateData.password = await bcrypt.hash(password, 10);
        }

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            updateData,
            { new: true, select: '-password' }
        );

        res.status(200).json({
            success: true,
            data: updatedUser,
            message: 'Profile updated successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to update profile',
            error: error.message
        });
    }
});

// Get user messages
router.get('/messages', isAuthenticated, async (req, res) => {
    try {
        const messages = await Message.find({
            $or: [
                { sender: req.session.user.id },
                { receiver: req.session.user.id }
            ]
        })
        .populate('sender', 'firstName lastName email')
        .populate('receiver', 'firstName lastName email')
        .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            data: messages,
            message: 'Messages fetched successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch messages',
            error: error.message
        });
    }
});

// Send message
router.post('/messages', isAuthenticated, async (req, res) => {
    try {
        const { receiverId, content } = req.body;

        const newMessage = await Message.create({
            sender: req.session.user.id,
            receiver: receiverId,
            content
        });

        const populatedMessage = await Message.findById(newMessage._id)
            .populate('sender', 'firstName lastName email')
            .populate('receiver', 'firstName lastName email');

        res.status(201).json({
            success: true,
            data: populatedMessage,
            message: 'Message sent successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to send message',
            error: error.message
        });
    }
});

// Delete message
router.delete('/messages/:messageId', isAuthenticated, async (req, res) => {
    try {
        const message = await Message.findOne({
            _id: req.params.messageId,
            sender: req.session.user.id
        });

        if (!message) {
            return res.status(404).json({
                success: false,
                message: 'Message not found or unauthorized'
            });
        }

        await message.remove();

        res.status(200).json({
            success: true,
            message: 'Message deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to delete message',
            error: error.message
        });
    }
});

export default router;
