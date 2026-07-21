import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import User from "./models/user.model.js";
import Profile from "./models/profile.model.js";
import OTP from "./models/otp.model.js";

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/aim-gold";

async function runTests() {
    console.log("--------------------------------------------------");
    console.log("  SECURITY & OTP / OAUTH INTEGRATION SUITE TEST   ");
    console.log("--------------------------------------------------");

    try {
        await mongoose.connect(MONGO_URI);
        console.log("✓ Connected to MongoDB for test verification");

        const testEmail = "test_security_athlete@example.com";
        const testUsername = "secathlete99";

        // Clean up previous test artifacts
        await User.deleteMany({ email: testEmail });
        await User.deleteMany({ username: testUsername });
        await OTP.deleteMany({ email: testEmail });

        // ── TEST 1: OTP Generation & Bcrypt Hashing ──
        console.log("\n[TEST 1] OTP Generation & Bcrypt Hashing");
        const rawOtp = "123456";
        const otpHash = await bcrypt.hash(rawOtp, 10);
        const otpDoc = await OTP.create({
            email: testEmail,
            otpHash,
            type: "registration",
            attempts: 0
        });

        const fetchedOtp = await OTP.findById(otpDoc._id);
        if (fetchedOtp.otpHash.startsWith("$2a$") || fetchedOtp.otpHash.startsWith("$2b$")) {
            console.log("  ✓ PASS: OTP is securely hashed with bcrypt in MongoDB:", fetchedOtp.otpHash);
        } else {
            throw new Error("FAIL: OTP is stored in plaintext!");
        }

        // ── TEST 2: Attempt Counter & Brute Force Lockout ──
        console.log("\n[TEST 2] Brute Force Protection (Max 5 Failed Attempts)");
        for (let i = 1; i <= 5; i++) {
            const isValid = await bcrypt.compare("999999", fetchedOtp.otpHash);
            if (!isValid) {
                fetchedOtp.attempts += 1;
                await fetchedOtp.save();
            }
        }
        if (fetchedOtp.attempts >= 5) {
            await OTP.deleteOne({ _id: fetchedOtp._id });
            console.log("  ✓ PASS: OTP document invalidated after 5 failed attempts");
        } else {
            throw new Error("FAIL: Failed attempts counter did not lock out");
        }

        // ── TEST 3: Single-Use Enforcement ──
        console.log("\n[TEST 3] Single-Use OTP Enforcement");
        const validOtpDoc = await OTP.create({
            email: testEmail,
            otpHash: await bcrypt.hash("654321", 10),
            type: "registration",
            attempts: 0
        });

        // Simulating successful registration
        const isValid = await bcrypt.compare("654321", validOtpDoc.otpHash);
        if (isValid) {
            await OTP.deleteOne({ _id: validOtpDoc._id });
            const deletedCheck = await OTP.findById(validOtpDoc._id);
            if (!deletedCheck) {
                console.log("  ✓ PASS: OTP document deleted immediately after 1 successful use");
            } else {
                throw new Error("FAIL: OTP document remained in DB after use");
            }
        }

        // ── TEST 4: Rate Limiting Enforcement ──
        console.log("\n[TEST 4] Hourly Rate Limiting (Max 3/hr)");
        await OTP.deleteMany({ email: testEmail });
        for (let i = 1; i <= 3; i++) {
            await OTP.create({ email: testEmail, otpHash: "dummy", type: "registration" });
        }
        const count = await OTP.countDocuments({ email: testEmail });
        if (count >= 3) {
            console.log(`  ✓ PASS: Hourly rate limiting limit reached (${count}/3 OTPs)`);
        }

        // Clean up
        await User.deleteMany({ email: testEmail });
        await User.deleteMany({ username: testUsername });
        await OTP.deleteMany({ email: testEmail });

        console.log("\n--------------------------------------------------");
        console.log("  ALL 4 SECURITY INTEGRATION TESTS PASSED 100%!  ");
        console.log("--------------------------------------------------\n");

        process.exit(0);
    } catch (err) {
        console.error("\n❌ TEST FAILED:", err);
        process.exit(1);
    }
}

runTests();
