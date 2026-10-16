import mongoose, { model, Schema } from "mongoose";

const authSchema = new mongoose.Schema({
    userName: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
        minlength: 3,
        maxlength: 20
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true
    },
    password: {
        type: String,
        minlength: 6,
        select: false // By default query mein nahi aayega (security)
    },
    fullName: {
        type: String,
        required: true,
        trim: true
    },
    bio: { type: String, default: '', maxlength: 150 },
    avatar: {
        type: String,
    },

    avatarFileId: {
        type: String,
        default: ""
    },

    link: { type: String, default: '' },
})

const userModel = mongoose.model('user', authSchema)
export default userModel