// db.js or connectDB.js

import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

export async function connectDB() {
    try {
        const mongoURI = process.env.MONGO_URI;
        console.log('Attempting to connect to MongoDB...');
        
        if (!mongoURI) {
            throw new Error('MONGO_URI is not defined in .env file');
        }

        await mongoose.connect(mongoURI, {
            serverSelectionTimeoutMS: 50000,
        });
        
        console.log('✅ Connected to MongoDB');
    } catch (err) {
        console.error('❌ Error connecting to MongoDB:', err.message);
        console.error('Full error:', err);
        process.exit(1);
    }
}
