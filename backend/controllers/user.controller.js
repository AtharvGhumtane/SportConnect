import Profile from "../models/profile.model.js";
import User from "../models/user.model.js";
import ConnectionRequest from "../models/connections.model.js";
import crypto from "crypto";
import path from "path";
import PDFDocument from "pdfkit";
import bcrypt from "bcryptjs";
import fs from "fs";
import { connections } from "mongoose";
import Post from "../models/posts.model.js";
import Comment from "../models/comments.model.js";
import mongoose from "mongoose"; 
import { fileURLToPath } from "url";
import Notification from "../models/notification.model.js";
import Team from "../models/teams.model.js";
import OTP from "../models/otp.model.js";
import { sendMail } from "../config/mailer.js";
import { OAuth2Client } from "google-auth-library";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const convertUserDataTOPDF = async (userData) => {
    const doc = new PDFDocument();

    const outputPath = crypto.randomBytes(32).toString("hex") + ".pdf";
    const stream  = fs.createWriteStream(path.join(__dirname, "../uploads", outputPath));

    doc.pipe(stream);

    if (userData?.userId?.profilePicture) {
        const imagePath = path.join(__dirname, "../uploads", userData.userId.profilePicture);
        if (fs.existsSync(imagePath)) {
            doc.image(imagePath, { align: "center", width: 100 });
        } else {
            console.warn(`Profile picture not found at: ${imagePath}`);
        }
    }
    const name = userData?.userId?.name || "N/A";
    const email = userData?.userId?.email || "N/A";
    const username = userData?.userId?.username || "N/A";
    const bio = userData?.bio || "";
    const currentPost = userData?.currentPost || userData?.currentPosition || "";

    doc.fontSize(14).text(`Name: ${name}`);
    doc.fontSize(14).text(`Email: ${email}`);
    doc.fontSize(14).text(`Username: ${username}`);
    doc.fontSize(14).text(`Bio: ${bio}`);
    doc.fontSize(14).text(`Current Position: ${currentPost}`);
    doc.fontSize(14).text("Past Work");
    if (Array.isArray(userData?.pastWork)) {
        userData.pastWork.forEach((work) => {
            doc.fontSize(14).text(`Company: ${work.company || ''}`);
            doc.fontSize(14).text(`Position: ${work.position || ''}`);
            doc.fontSize(14).text(`Duration: ${work.years || ''}`);
        });
    }

    doc.end();

    return outputPath;
}







// Helper function to generate unique username for OAuth signups
const generateUniqueUsername = async (baseName) => {
    let cleanBase = baseName.toLowerCase().replace(/[^a-z0-9]/g, "");
    if (!cleanBase) cleanBase = "athlete";
    
    let isUnique = false;
    let username = "";
    
    while (!isUnique) {
        const randomNum = Math.floor(1000 + Math.random() * 9000);
        username = `${cleanBase}${randomNum}`;
        const existing = await User.findOne({ username });
        if (!existing) {
            isUnique = true;
        }
    }
    return username;
};

// ── SEND OTP CONTROLLER (Signup & Password Reset) ────────────────
export const sendOtp = async (req, res) => {
    try {
        const { email, type } = req.body; // type: "registration" | "password_reset"

        if (!email || !type) {
            return res.status(400).json({ message: "Email and request type are required" });
        }

        if (!["registration", "password_reset"].includes(type)) {
            return res.status(400).json({ message: "Invalid request type" });
        }

        const normalizedEmail = email.toLowerCase().trim();

        // Account existence checks based on type
        const existingUser = await User.findOne({ email: normalizedEmail });
        if (type === "registration" && existingUser) {
            return res.status(400).json({ message: "Email is already registered. Please sign in instead." });
        }
        if (type === "password_reset" && !existingUser) {
            return res.status(404).json({ message: "No account found with this email address." });
        }

        // Rate Limiting: Max 3 OTPs per email per 1 hour (3600000 ms)
        const oneHourAgo = new Date(Date.now() - 3600000);
        const recentOtpsCount = await OTP.countDocuments({
            email: normalizedEmail,
            createdAt: { $gte: oneHourAgo }
        });

        if (recentOtpsCount >= 3) {
            return res.status(429).json({
                message: "Rate limit exceeded. You can only request 3 OTP codes per hour. Please wait before trying again."
            });
        }

        // Remove any previous active OTPs for this email and type
        await OTP.deleteMany({ email: normalizedEmail, type });

        // Generate 6-digit random code & hash with bcrypt
        const rawOtp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpHash = await bcrypt.hash(rawOtp, 10);

        // Save hashed OTP in DB (expires in 5 minutes via Mongoose TTL)
        await OTP.create({
            email: normalizedEmail,
            otpHash,
            type,
            attempts: 0
        });

        // Send Email via Nodemailer (or log to console if dev fallback)
        const subject = type === "registration"
            ? "Your SportConnect Email Verification Code"
            : "SportConnect Password Reset Code";

        const htmlBody = `
            <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #0f1923; color: #e2e8f0; border-radius: 12px;">
                <h2 style="color: #10b981;">SportConnect Authentication Code</h2>
                <p>Use the following 6-digit code to complete your ${type === 'registration' ? 'registration' : 'password reset'}:</p>
                <div style="font-size: 28px; font-weight: 800; letter-spacing: 4px; color: #10b981; margin: 20px 0; background: rgba(16,185,129,0.1); padding: 12px; display: inline-block; border-radius: 8px;">
                    ${rawOtp}
                </div>
                <p style="color: #94a3b8; font-size: 13px;">This code is valid for <strong>5 minutes</strong> and can only be used once.</p>
            </div>
        `;

        await sendMail({
            to: normalizedEmail,
            subject,
            html: htmlBody,
            otp: rawOtp
        });

        return res.status(200).json({ message: "Verification code sent to your email!" });
    } catch (error) {
        console.error("Send OTP error:", error);
        return res.status(500).json({ message: error.message || "Failed to send verification code" });
    }
};

// ── REGISTER WITH OTP CONTROLLER ────────────────
export const register = async (req, res) => {
    try {
        const { name, email, password, username, otp } = req.body;

        if (!name || !email || !password || !username || !otp) {
            return res.status(400).json({ message: "Please fill all fields and enter the verification code" });
        }

        const normalizedEmail = email.toLowerCase().trim();
        const normalizedUsername = username.trim();

        // 1. Verify User/Username uniqueness
        const userByEmail = await User.findOne({ email: normalizedEmail });
        if (userByEmail) return res.status(400).json({ message: "Email already registered" });

        const userByUsername = await User.findOne({ username: normalizedUsername });
        if (userByUsername) return res.status(400).json({ message: "Username already taken" });

        // 2. Fetch active OTP record
        const otpDoc = await OTP.findOne({ email: normalizedEmail, type: "registration" });
        if (!otpDoc) {
            return res.status(400).json({ message: "No active verification code found. Please request a new code." });
        }

        // 3. Brute force check: max 5 failed attempts allowed
        if (otpDoc.attempts >= 5) {
            await OTP.deleteOne({ _id: otpDoc._id });
            return res.status(400).json({ message: "Too many failed attempts. This verification code has been invalidated." });
        }

        // 4. Compare bcrypt hash
        const isOtpValid = await bcrypt.compare(otp.trim(), otpDoc.otpHash);
        if (!isOtpValid) {
            otpDoc.attempts += 1;
            await otpDoc.save();
            return res.status(400).json({ message: `Invalid verification code. (${5 - otpDoc.attempts} attempts remaining)` });
        }

        // 5. Single-use enforcement: Delete OTP document immediately upon success
        await OTP.deleteOne({ _id: otpDoc._id });

        // 6. Create User & Profile
        const hashedPassword = await bcrypt.hash(password, 10);
        const sessionToken = crypto.randomBytes(32).toString("hex");

        const newUser = new User({
            name: name.trim(),
            email: normalizedEmail,
            password: hashedPassword,
            username: normalizedUsername,
            token: sessionToken,
            provider: "email"
        });

        await newUser.save();

        const profile = new Profile({
            userId: newUser._id,
        });

        await profile.save();

        return res.status(201).json({
            message: "User registered successfully",
            token: sessionToken
        });
    } catch (error) {
        console.error("Register error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

// ── RESET PASSWORD WITH OTP CONTROLLER ────────────────
export const resetPassword = async (req, res) => {
    try {
        const { email, otp, newPassword } = req.body;

        if (!email || !otp || !newPassword) {
            return res.status(400).json({ message: "Email, verification code, and new password are required" });
        }

        const normalizedEmail = email.toLowerCase().trim();

        const user = await User.findOne({ email: normalizedEmail });
        if (!user) return res.status(404).json({ message: "User not found" });

        // Fetch active OTP record
        const otpDoc = await OTP.findOne({ email: normalizedEmail, type: "password_reset" });
        if (!otpDoc) {
            return res.status(400).json({ message: "No active verification code found. Please request a new code." });
        }

        // Brute force check: max 5 failed attempts
        if (otpDoc.attempts >= 5) {
            await OTP.deleteOne({ _id: otpDoc._id });
            return res.status(400).json({ message: "Too many failed attempts. Verification code invalidated." });
        }

        // Compare bcrypt hash
        const isOtpValid = await bcrypt.compare(otp.trim(), otpDoc.otpHash);
        if (!isOtpValid) {
            otpDoc.attempts += 1;
            await otpDoc.save();
            return res.status(400).json({ message: `Invalid verification code. (${5 - otpDoc.attempts} attempts remaining)` });
        }

        // Single-use deletion
        await OTP.deleteOne({ _id: otpDoc._id });

        // Hash new password and update user
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedPassword;
        await user.save();

        return res.status(200).json({ message: "Password reset successfully! You can now log in with your new password." });
    } catch (error) {
        console.error("Reset password error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

// ── GOOGLE OAUTH CONTROLLER (Server-Side ID Token Verification) ────────────────
export const googleOauth = async (req, res) => {
    try {
        const { idToken } = req.body;

        if (!idToken) {
            return res.status(400).json({ message: "Google ID Token is required" });
        }

        // Verify ID token server-side using google-auth-library
        const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
        let payload;

        try {
            const ticket = await client.verifyIdToken({
                idToken,
                audience: process.env.GOOGLE_CLIENT_ID || undefined,
            });
            payload = ticket.getPayload();
        } catch (authError) {
            console.error("Google ID Token Verification Failed:", authError.message);
            return res.status(401).json({ message: "Google authentication failed. Invalid ID Token." });
        }

        const { email, name, picture } = payload;
        if (!email) {
            return res.status(400).json({ message: "No email returned from Google account" });
        }

        const normalizedEmail = email.toLowerCase().trim();
        const sessionToken = crypto.randomBytes(32).toString("hex");

        let user = await User.findOne({ email: normalizedEmail });

        if (user) {
            // Existing user -> Account Linking
            user.token = sessionToken;
            if (!user.provider) user.provider = "google";
            await user.save();
        } else {
            // New user -> Auto-generate unique username & create User + Profile
            const username = await generateUniqueUsername(email.split("@")[0] || name || "athlete");
            user = new User({
                name: name || "Athlete",
                email: normalizedEmail,
                username,
                provider: "google",
                token: sessionToken,
            });
            await user.save();

            const profile = new Profile({
                userId: user._id,
            });
            await profile.save();
        }

        return res.status(200).json({
            message: "Google sign-in successful",
            token: sessionToken
        });
    } catch (error) {
        console.error("Google OAuth error:", error);
        return res.status(500).json({ message: "Google authentication server error" });
    }
};

// ── GITHUB OAUTH CONTROLLER (Code-to-Token Exchange & Primary Email Filter) ────────────────
export const githubOauth = async (req, res) => {
    try {
        const { code } = req.body;

        if (!code) {
            return res.status(400).json({ message: "GitHub authorization code is required" });
        }

        // 1. Exchange OAuth code for GitHub access token
        const tokenResponse = await fetch("https://github.com/login/oauth/access_token", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json",
            },
            body: JSON.stringify({
                client_id: process.env.GITHUB_CLIENT_ID,
                client_secret: process.env.GITHUB_CLIENT_SECRET,
                code,
            }),
        });

        const tokenData = await tokenResponse.json();
        if (tokenData.error || !tokenData.access_token) {
            return res.status(401).json({ message: tokenData.error_description || "Failed to exchange GitHub authorization code" });
        }

        const accessToken = tokenData.access_token;

        // 2. Fetch GitHub emails array
        const emailsResponse = await fetch("https://api.github.com/user/emails", {
            headers: {
                "Authorization": `token ${accessToken}`,
                "User-Agent": "SportConnect-App",
            },
        });

        const emails = await emailsResponse.json();
        if (!Array.isArray(emails)) {
            return res.status(400).json({ message: "Failed to fetch email address from GitHub profile" });
        }

        // 3. Filter primary && verified email
        const targetEmailObj = emails.find(e => e.primary && e.verified) || emails.find(e => e.verified);

        if (!targetEmailObj || !targetEmailObj.email) {
            return res.status(400).json({ message: "No verified email address found on GitHub account" });
        }

        const normalizedEmail = targetEmailObj.email.toLowerCase().trim();

        // 4. Fetch user profile for name/avatar
        const profileResponse = await fetch("https://api.github.com/user", {
            headers: {
                "Authorization": `token ${accessToken}`,
                "User-Agent": "SportConnect-App",
            },
        });
        const profileData = await profileResponse.json();

        const name = profileData.name || profileData.login || "Athlete";
        const sessionToken = crypto.randomBytes(32).toString("hex");

        let user = await User.findOne({ email: normalizedEmail });

        if (user) {
            // Account Linking
            user.token = sessionToken;
            if (!user.provider) user.provider = "github";
            await user.save();
        } else {
            // New User Registration with unique collision-checked username
            const username = await generateUniqueUsername(profileData.login || email.split("@")[0] || "athlete");
            user = new User({
                name,
                email: normalizedEmail,
                username,
                provider: "github",
                token: sessionToken,
            });
            await user.save();

            const profile = new Profile({
                userId: user._id,
            });
            await profile.save();
        }

        return res.status(200).json({
            message: "GitHub sign-in successful",
            token: sessionToken
        });
    } catch (error) {
        console.error("GitHub OAuth error:", error);
        return res.status(500).json({ message: "GitHub authentication server error" });
    }
};

export const login = async (req, res) => {
    try{
        const { email, password } = req.body;

        if(!email || !password) return res.status(400).json({message: "Please fill all the fields"});

        // Allow logging in with either email or username
        const user = await User.findOne({
            $or: [
                { email: email },
                { username: email }
            ]
        });

        if(!user) return res.status(404).json({message: "User not found"});

        const isMatch = await bcrypt.compare(password, user.password);

        if(!isMatch) return res.status(400).json({message:"Invalid Credentials"})

        const token = crypto.randomBytes(32).toString("hex");

        await User.updateOne(
            { _id: user._id },
            { token }
        );

        return res.json({token: token});

    }catch(error){
        return res.status(500).json({ message: "Internal server error"})
    }
}

export const uploadProfilePicture = async (req, res) => {
    const { token } = req.body;

    try{
        if (!req.file) return res.status(400).json({ message: "No image file provided" });

        const user = await User.findOne({token: token});

        if(!user) return res.status(400).json({message: "User not found"});

        user.profilePicture = req.file.filename;

        await user.save();
        
        return res.status(200).json({message: "Profile picture uploaded successfully"});
    }catch(error){
        return res.status(500).json({ message: "Internal server error"});
    }
}

export const updateUserProfile = async (req, res) => {
    try{
        const { token , ...newUserData} = req.body;
        
        const user = await User.findOne({token: token});

        if(!user) return res.status(400).json({message: "User not found"});

        const { username, email } = newUserData;

        const existingUser = await User.findOne({$or: [{ username }, { email }] });

        if(existingUser  && existingUser._id.toString() !== user._id.toString()) {
            return res.status(400).json({message: "Username or email already exists"});
        }

        Object.assign(user, newUserData);

        await user.save();

        return res.json({message: "User profile updated successfully", user});

    }catch(error){
        return res.status(500).json({ message:error.message });
    }
}

export const getUserAndProfile = async (req, res) => {
    try{
        const token = req.headers["x-auth-token"] || req.query.token || req.body?.token;

        console.log(`Token:${token}`)

        const user = await User.findOne({ token: token })

        if(!user) return res.status(400).json({ message: "User not found" });

        const userProfile = await Profile.findOne({ userId: user._id })
        .populate('userId', 'name email username profilePicture');

        return res.json({userProfile})

    }catch(error){
        return res.status(500).json({ message: error.message });
    }
}

export const updateProfileData = async (req, res) => {
    try{
        const { token, ...newProfileData } = req.body;

        const user = await User.findOne({token: token});

        if(!user) return res.status(400).json({message: "User not found"});

        let profile = await Profile.findOne({userId: user._id});

        // FIX: Create profile if it doesn't exist
        if(!profile) {
            profile = new Profile({
                userId: user._id,
                ...newProfileData
            });
        } else {
            // Update existing profile
            Object.assign(profile, newProfileData);
        }

        await profile.save();

        return res.json({message: "Profile updated successfully", profile});

    }catch(error){
        return res.status(500).json({ message: error.message });
    }
}

export const getAllUserProfile = async (req, res) => {
    try{
        const profiles = await Profile.find().populate('userId', 'name email username profilePicture');

        if(!profiles || profiles.length === 0) return res.status(404).json({message: "No profiles found"});

        return res.json({profiles});
    }catch(error){
        return res.status(500).json({ message: error.message });
    }
}


export const downloadProfile = async (req, res) => {
    try {
        const user_id = req.query.id;
        if (!user_id) return res.status(400).json({ message: "User ID is required" });

        const userProfile = await Profile.findOne({ userId: user_id })
            .populate('userId', 'name email username profilePicture');
        
        if (!userProfile) return res.status(404).json({ message: "Profile not found" });

        let outputPath = await convertUserDataTOPDF(userProfile);

        return res.json({"message": outputPath});
    } catch (error) {
        console.error("Download profile error:", error);
        return res.status(500).json({ message: error.message });
    }
}

export const sendConnectionRequest = async (req, res) => {
    const { token, connectionId } = req.body;
    try{
        const user = await User.findOne({ token });

        if(!user) return res.status(400).json({ message: "User not found" });

        const connectionUser = await User.findOne({_id: connectionId});

        if(!connectionUser) return res.status(400).json({ message: "Connection user not found" });

        if (user._id.toString() === connectionUser._id.toString()) {
            return res.status(400).json({ message: "Cannot send connection request to yourself" });
        }

        const existingRequest = await ConnectionRequest.findOne({
            $or: [
                { userId: user._id, connectionId: connectionUser._id },
                { userId: connectionUser._id, connectionId: user._id }
            ]
        });

        if(existingRequest) {
            return res.status(400).json({ message: "Connection request already sent or active" });
        }

        const request = new ConnectionRequest({
            userId: user._id,
            connectionId: connectionUser._id,
        });

        await request.save();

        const notification = new Notification({
            userId: connectionUser._id,
            senderId: user._id,
            type: "connection_request",
            relatedId: request._id,
            message: `${user.name} sent you a connection request.`,
        });
        await notification.save();

        return res.json({ message: "Connection request sent successfully" });

    }catch(error){
        return res.status(500).json({ message: error.message });
    }
}

// Fixed getMyConnectionRequests function - corrected variable name
// ✅ Get connection requests I SENT (outgoing)
export const getMyConnectionRequests = async (req, res) => {
    const token = req.headers["x-auth-token"] || req.query.token || req.body?.token;

    try{
        const user = await User.findOne({ token });

        if(!user) return res.status(404).json({ message: "User not found" });

        const connections = await ConnectionRequest.find({ userId: user._id })
        .populate('connectionId', 'name email username profilePicture');

        return res.json({connections});

    }catch(error) {
        console.error("Get my connection requests error:", error);
        return res.status(500).json({message:error.message});
    }
}

// ✅ Get connection requests I RECEIVED (incoming) - for accepting/rejecting
export const whatAreMyConnections = async (req, res) => {
    const token = req.headers["x-auth-token"] || req.query.token || req.body?.token;

    try{
        const user = await User.findOne({token});

        if(!user) return res.status(404).json({ message: "User not found" });

        // ✅ Find requests where current user is the connectionId (receiver)
        const connections = await ConnectionRequest.find({ connectionId: user._id })
        .populate('userId', 'name email username profilePicture');

        return res.json({connections});

    }catch(error) {
        console.error("What are my connections error:", error);
        return res.status(500).json({message:error.message});
    }    
}


export const acceptConnectionRequest = async (req, res) => {
    const { token, requestId, action_type } = req.body;

    try{
        const user = await User.findOne({ token }); 
        
        if(!user) return res.status(404).json({ message: "User not found" });

        // ✅ FIXED: Find connection request by ID and verify user is the receiver
        const connection = await ConnectionRequest.findOne({ 
            _id: requestId,
            connectionId: user._id // ✅ Ensure current user is the receiver of the request
        });

        if(!connection) return res.status(404).json({ message: "Connection request not found" });

        if(action_type === "accept") {
            connection.status_accepted = true;

            // Trigger notification back to original requester informing them they've been accepted
            const acceptNoti = new Notification({
                userId: connection.userId, // original requester
                senderId: user._id,       // user who accepted
                type: "connection_request",
                relatedId: connection._id,
                message: `${user.name} accepted your connection request.`
            });
            await acceptNoti.save();
        } else {
            connection.status_accepted = false;
        }

        await connection.save();

        return res.json({ message: "Connection request updated successfully" });
        
    }catch(error) {
        console.error("Accept connection error:", error);
        return res.status(500).json({ message: error.message });
    }
}  


// In your user.controller.js - commentPost function:

// Simple fix - just remove the mongoose validation:

export const commentPost = async (req, res) => {
  const { token, post_id, commentBody } = req.body;

  try {
    // Validate user
    const user = await User.findOne({ token }).select("_id name");
    if (!user) return res.status(404).json({ message: "User not found" });

    // Validate post
    const post = await Post.findById(post_id);
    if (!post) return res.status(404).json({ message: "Post not found" });

    // Create and save comment
    const comment = new Comment({
      userId: user._id,
      postId: post_id,
      body: commentBody,
    });

    await comment.save();

    // Create a notification for the post author (if commenter is not the author)
    if (post.userId && post.userId.toString() !== user._id.toString()) {
        const notification = new Notification({
            userId: post.userId,
            senderId: user._id,
            type: "comment",
            relatedId: post._id,
            message: `${user.name} commented on your post.`,
        });
        await notification.save();
    }

    return res.status(200).json({ message: "Comment added successfully" });
  } catch (error) {
    console.error("Comment error:", error);
    return res.status(500).json({ message: error.message });
  }
};




export const getUserProfileAndUserBasedOnUsername = async (req,res) => {
    const { username } = req.query;

    try{
       const user = await User.findOne({
        username
       });

       if(!user){
        return res.status(404).json({message:"User not found"})
       }

       const userProfile = await Profile.findOne({userId:user._id})
           .populate('userId','name username email profilePicture')
        
        // Fix: Return with userProfile key to match frontend expectation
        return res.json({"profile":userProfile})

    }catch(error){
        return res.status(500).json({message:error.message})
    }
}

export const getNotifications = async (req, res) => {
    const token = req.headers["x-auth-token"] || req.query.token || req.body?.token;

    try {
        const user = await User.findOne({ token });
        if (!user) return res.status(404).json({ message: "User not found" });

        const notifications = await Notification.find({ userId: user._id })
            .populate('senderId', 'name username profilePicture')
            .sort({ createdAt: -1 });

        return res.json({ notifications });
    } catch (error) {
        console.error("Get notifications error:", error);
        return res.status(500).json({ message: error.message });
    }
};

export const markNotificationsRead = async (req, res) => {
    const { token, notificationId } = req.body;

    try {
        const user = await User.findOne({ token });
        if (!user) return res.status(404).json({ message: "User not found" });

        if (notificationId) {
            await Notification.updateOne(
                { _id: notificationId, userId: user._id },
                { $set: { isRead: true } }
            );
        } else {
            await Notification.updateMany(
                { userId: user._id, isRead: false },
                { $set: { isRead: true } }
            );
        }

        return res.json({ message: "Notifications marked as read" });
    } catch (error) {
        console.error("Mark notifications read error:", error);
        return res.status(500).json({ message: error.message });
    }
};

export const getUserConnections = async (req, res) => {
    const { userId } = req.query;

    try {
        if (!userId) return res.status(400).json({ message: "User ID is required" });

        // Find all accepted connection requests where this user is either sender or receiver
        const connections = await ConnectionRequest.find({
            $or: [
                { userId: userId, status_accepted: true },
                { connectionId: userId, status_accepted: true }
            ]
        })
        .populate('userId', 'name email username profilePicture')
        .populate('connectionId', 'name email username profilePicture');

        // Map them to return the other user
        const formattedConnections = connections.map(conn => {
            if (conn.userId._id.toString() === userId.toString()) {
                return conn.connectionId;
            } else {
                return conn.userId;
            }
        });

        return res.json({ connections: formattedConnections });
    } catch (error) {
        console.error("Get user connections error:", error);
        return res.status(500).json({ message: error.message });
    }
};

export const getTrendingAthletes = async (req, res) => {
    try {
        // Fetch all connection requests and accepted connections
        const allConnections = await ConnectionRequest.find({});

        // Calculate count for each user
        const userStats = {};

        allConnections.forEach(conn => {
            const u1 = conn.userId?.toString();
            const u2 = conn.connectionId?.toString();

            if (u1) {
                if (!userStats[u1]) userStats[u1] = 0;
                userStats[u1]++;
            }
            if (u2) {
                if (!userStats[u2]) userStats[u2] = 0;
                userStats[u2]++;
            }
        });

        // Fetch all profiles and populate user details
        const profiles = await Profile.find().populate('userId', 'name email username profilePicture');

        // Add sorting score and filter out invalid user data
        const sortedProfiles = profiles
            .filter(p => p.userId)
            .map(p => {
                const userIdStr = p.userId._id.toString();
                const score = userStats[userIdStr] || 0;
                return { profile: p, score };
            })
            .sort((a, b) => b.score - a.score)
            .slice(0, 5)
            .map(item => item.profile);

        return res.json({ trending: sortedProfiles });
    } catch (error) {
        console.error("Get trending athletes error:", error);
        return res.status(500).json({ message: error.message });
    }
};

export const getUserStats = async (req, res) => {
    const token = req.headers["x-auth-token"] || req.query.token || req.body?.token;

    try {
        const user = await User.findOne({ token });
        if (!user) return res.status(404).json({ message: "User not found" });

        // 1. Total Connections (Accepted connections count)
        const connectionsCount = await ConnectionRequest.countDocuments({
            $or: [
                { userId: user._id, status_accepted: true },
                { connectionId: user._id, status_accepted: true }
            ]
        });

        // 2. Teams Joined (Joined teams count)
        const teamsCount = await Team.countDocuments({
            members: user._id
        });

        // 3. Total Posts Created (Posts count)
        const postsCount = await Post.countDocuments({
            userId: user._id
        });

        // 4. Total Likes Received (Sum of likes on posts you've created)
        const userPosts = await Post.find({ userId: user._id });
        let totalLikes = 0;
        userPosts.forEach(post => {
            if (Array.isArray(post.likes)) {
                totalLikes += post.likes.length;
            }
        });

        return res.json({
            stats: {
                connections: connectionsCount,
                teams: teamsCount,
                posts: postsCount,
                likes: totalLikes
            }
        });
    } catch (error) {
        console.error("Get user stats error:", error);
        return res.status(500).json({ message: error.message });
    }
};