import nodemailer from "nodemailer";

export const sendMail = async ({ to, subject, html, otp }) => {
    const isProduction = process.env.NODE_ENV === "production";

    // If SMTP credentials are set in environment variables
    if (process.env.SMTP_USER && process.env.SMTP_PASS) {
        try {
            const transporter = nodemailer.createTransport({
                host: process.env.SMTP_HOST || "smtp.gmail.com",
                port: Number(process.env.SMTP_PORT) || 465,
                secure: Number(process.env.SMTP_PORT) === 465 || !process.env.SMTP_PORT,
                auth: {
                    user: process.env.SMTP_USER,
                    pass: process.env.SMTP_PASS,
                },
            });

            await transporter.sendMail({
                from: process.env.SMTP_FROM || `"SportConnect" <${process.env.SMTP_USER}>`,
                to,
                subject,
                html,
            });

            console.log(`[SMTP SUCCESS] Real email sent to ${to} via SMTP`);
            return { success: true, method: "smtp" };
        } catch (error) {
            console.error("[SMTP ERROR] Failed to deliver real email via SMTP:", error.message);
            if (isProduction) {
                throw new Error("Failed to send email via SMTP: " + error.message);
            }
        }
    }

    // Development fallback (No SMTP configured in .env):
    // Logs the 6-digit OTP code directly to terminal output so developer can test sign-up
    if (!isProduction) {
        console.log(`\n==================================================`);
        console.log(` 📧 [OTP DEV LOG - NO SMTP CONFIGURED]`);
        console.log(` Target Email : ${to}`);
        console.log(` 🔑 OTP CODE   : ${otp}`);
        console.log(` Notice       : Add SMTP_USER and SMTP_PASS to backend/.env to send real emails to Gmail.`);
        console.log(`==================================================\n`);
        return { success: true, method: "console_dev" };
    }

    throw new Error("SMTP service not configured in production environment");
};
