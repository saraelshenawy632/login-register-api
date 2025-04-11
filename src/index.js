import bcrypt from 'bcrypt';
import express from 'express';
import session from 'express-session';
import { engine } from 'express-handlebars';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import MongoStore from 'connect-mongo';
import dotenv from 'dotenv';
import User from './models/user.js';
import nodemailer from 'nodemailer';
import cors from 'cors';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env/secret.env') });

const app = express();
const port = process.env.PORT || 3000;

app.engine('hbs', engine({
    extname: '.hbs',
    defaultLayout: 'main',
    layoutsDir: path.join(__dirname, 'templates', 'layouts'),
    partialsDir: path.join(__dirname, 'templates', 'partials'),
    helpers: {
        increment: value => parseInt(value) + 1
    },
    runtimeOptions: {
        allowProtoPropertiesByDefault: true,
        allowProtoMethodsByDefault: true
    }
}));
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'templates'));

app.use(cors({
    origin: 'http://localhost:3000',
    credentials: true
}));

app.use(express.static(path.join(__dirname, '../public')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

async function connectDB() {
    try {
        await mongoose.connect(process.env.MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            serverSelectionTimeoutMS: 50000
        });
        console.log('✅ Connected to MongoDB');
    } catch (err) {
        console.error('❌ Error connecting to MongoDB:', err);
        process.exit(1);
    }
}
connectDB();

app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
        mongoUrl: process.env.MONGO_URI,
        ttl: 14 * 24 * 60 * 60,
        collectionName: 'sessions'
    }),
    cookie: { maxAge: 1000 * 60 * 60 * 2 }
}));

function isAuthenticated(req, res, next) {
    req.session.user ? next() : res.redirect('/login');
}

function isAdmin(req, res, next) {
    console.log('Session User:', req.session.user);

    if (!req.session.user) {
        return res.status(401).json({ message: '❌ Unauthorized! Please log in.' });
    }

    if (req.session.user.role !== 'admin') {
        return res.status(403).json({ message: '❌ Access denied! Admins only.' });
    }

    next();
}

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});


app.get('/', (req, res) => {
    res.json({
        message: 'Welcome to the Home Page',
        isLoggedIn: !!req.session.user
    });
});

app.get('/register', (req, res) => {
    res.json({ message: 'Register endpoint' });
});

app.post('/register', async (req, res) => {
    try {
        const { firstName, lastName, phoneNumber, address, role, email, password } = req.body;

        if (!firstName || !lastName || !phoneNumber || !address || !role || !email || !password) {
            return res.status(400).json({ message: '⚠️ All fields are required!' });
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: '⚠️ Email already registered!' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = new User({ firstName, lastName, phoneNumber, address, role, email, password: hashedPassword });
        await newUser.save();

        req.session.user = {
            id: newUser._id,
            email: newUser.email,
            firstName: newUser.firstName,
            lastName: newUser.lastName,
            role: newUser.role
        };

        const { password: _, ...safeUser } = newUser.toObject();
        res.status(201).json({ message: '✅ Registration successful!', user: safeUser });
    } catch (error) {
        console.error('❌ Error during registration:', error);
        res.status(500).json({ message: '❌ Server error during registration.' });
    }
});

app.get('/login', (req, res) => {
    res.json({
        message: 'Login endpoint',
        error: req.query.error,
        success: req.query.success
    });
});

app.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email }).select('+password');

        if (!user) {
            return res.status(404).json({ message: 'User not found!' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Incorrect password!' });
        }

        req.session.user = {
            id: user._id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role 
        };

        const { password: _, ...safeUser } = user.toObject();
        res.json({ message: 'Login successful!', user: safeUser });
    } catch (error) {
        console.error('❌ Error during login:', error);
        res.status(500).json({ message: 'Server error during login.' });
    }
});

app.get('/details', isAuthenticated, (req, res) => {
    res.json({
        message: 'Dashboard endpoint',
        user: req.session.user,
        isAdmin: req.session.user.role === 'admin'
    });
});

app.get('/admin/users', isAuthenticated, isAdmin, async (req, res) => {
    try {
        const users = await User.find({}, '-password');
        res.json({ message: 'All Users', users });
    } catch (error) {
        console.error('❌ Error fetching users:', error);
        res.status(500).json({ message: '❌ Server error while fetching users.' });
    }
});

app.post('/update', isAuthenticated, async (req, res) => {
    try {
        const { id, password, ...rest } = req.body;
        console.log('Received ID:', id); 

        const user = await User.findById(id);
        if (!user) return res.status(404).json({ message: '❌ المستخدم غير موجود.' });

        Object.assign(user, rest);
        if (password) user.password = await bcrypt.hash(password, 10);
        const updatedUser = await user.save();

        if (req.session.user.id === id) {
            req.session.user.role = updatedUser.role;
        }

        const { password: _, ...safeUser } = updatedUser.toObject();
        res.status(200).json({ message: '✅ تم تحديث البيانات بنجاح!', user: safeUser });
    } catch (error) {
        console.error('❌ خطأ أثناء تحديث البيانات:', error);
        res.status(500).json({ message: '❌ خطأ في الخادم أثناء تحديث البيانات.' });
    }
});

app.get('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            console.error('❌ Error during logout:', err);
            return res.status(500).json({ message: '❌ Error during logout.' });
        }
        res.clearCookie('connect.sid');
        res.json({ message: '✅ Logout successful!' });
    });
});


app.use((req, res) => {
    res.status(404).json({ message: '❌ Page not found' });
});


app.listen(port, () => {
    console.log(`🚀 Server running at http://localhost:${port}`);
});

export default app;
