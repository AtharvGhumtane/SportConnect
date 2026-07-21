import mongoose from "mongoose";

const OtpSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        lowercase: true,
        trim: true,
    },
    otpHash: {
        type: String,
        required: true,
    },
    type: {
        type: String,
        enum: ["registration", "password_reset"],
        required: true,
    },
    attempts: {
        type: Number,
        default: 0,
    },
    createdAt: {
        type: Date,
        default: Date.now,
        expires: 300, // Automatic deletion after 5 minutes (300s)
    },
});

const OTP = mongoose.model("OTP", OtpSchema);

export default OTP;
