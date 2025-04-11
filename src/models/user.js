import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import nodemailer from 'nodemailer';

const userSchema = new mongoose.Schema({
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    phoneNumber: { type: String },
    address: { type: String },
    role: { type: String, default: 'user' }
}, { timestamps: true });


const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true, 
    auth: {
        user: 'example@gmail.com', 
        pass: 'كلمة_مرور_التطبيق', 
    },
});

userSchema.statics.updateUser = async function (id, updateData) {
    try {
        const user = await this.findById(id);
        if (!user) {
            throw new Error('❌ المستخدم غير موجود.');
        }

        if (updateData.password) {
            updateData.password = await bcrypt.hash(updateData.password, 10);
        } else {
            delete updateData.password; 
        }

        const updatedUser = await this.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });

        return updatedUser;
    } catch (error) {
        throw new Error(`❌ خطأ أثناء تحديث البيانات: ${error.message}`);
    }
};

const User = mongoose.model('User', userSchema);

export default User;
