import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        trim: true,
        match: [/.+\@.+\..+/, 'Please fill a valid email address']
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [6, 'Password must be at least 6 characters'],
        select: false // 🛡️ Hide password field by default in queries
    },
    firstName: {
        type: String,
        required: [true, 'First name is required'],
        trim: true
    },
    lastName: {
        type: String,
        required: [true, 'Last name is required'],
        trim: true
    },
    phoneNumber: {
        type: String,
        required: [true, 'Phone number is required'],
        trim: true,
        match: [/^\d{10,15}$/, 'Please fill a valid phone number']
    },
    address: {
        type: String,
        required: [true, 'Address is required'],
        trim: true
    },
    role: {
        type: String,
        required: [true, 'Role is required'],
        enum: ['user', 'admin'],
        default: 'user'
    }
}, {
    timestamps: true,
    toJSON: {
        virtuals: true,
        transform: (doc, ret) => {
            delete ret.password; // 🔐 Ensure password never comes back
            return ret;
        }
    }
});

// 📌 دالة تحديث المستخدم
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
        throw new Error(`❌ خطأ أثناء تحديث المستخدم: ${error.message}`);
    }
};

// Remove these lines as they don't belong in the model file
// db.users.findOne({ email: "your-email@example.com" })
// db.users.updateOne(
//     { email: "your-email@example.com" },
//     { $set: { role: "admin" } }
// )

const User = mongoose.model('User', userSchema);

export default User;