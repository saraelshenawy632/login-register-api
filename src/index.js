import express from 'express';
import session from 'express-session';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import MongoStore from 'connect-mongo';
import { connectDB } from './config/db.js';
import cors from 'cors';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// تعديل مسار ملف .env
dotenv.config({ path: path.resolve(__dirname, '../.env/secret.env') });

const app = express();

// إضافة middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// تبسيط تشغيل السيرفر
const startServer = async () => {
    try {
        await connectDB();
        console.log('✅ Connected to MongoDB');

        // إعداد الجلسة
        app.use(session({
            secret: process.env.SESSION_SECRET,
            resave: false,
            saveUninitialized: false,
            store: MongoStore.create({
                mongoUrl: process.env.MONGO_URI,
                ttl: 14 * 24 * 60 * 60
            }),
            cookie: { 
                secure: process.env.NODE_ENV === 'production',
                maxAge: 1000 * 60 * 60 * 24 // 24 hours
            }
        }));

        // Routes
        app.use('/api/auth', authRoutes);
        app.use('/api/user', userRoutes);
        app.use('/api/admin', adminRoutes);

        const PORT = process.env.PORT || 3000;
        app.listen(PORT,  () => {
            console.log(`🚀 Server running on http://localhost:${PORT}`);
        });

    } catch (error) {
        console.error('❌ Server error:', error.message);
        if (error.code === 'EADDRINUSE') {
            console.error(`Port ${PORT} is already in use. Please try a different port.`);
        }
        process.exit(1);
    }
};

startServer();

export default app;
