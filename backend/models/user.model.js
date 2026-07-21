import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    username: {
        type: String,
        required: true,
        unique: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
    },
    provider: {
        type: String,
        enum: ["email", "google", "github"],
        default: "email",
    },
    active: {
        type: Boolean,
        default: true,
    },
    password: {
        type: String,
        required: false, // Optional for OAuth users
    },
    profilePicture: {
        type: String,
        default: "default.jpg",
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    token: {
        type: String,
        default: "",
    },
});

const User = mongoose.model("User", UserSchema);

export default User;