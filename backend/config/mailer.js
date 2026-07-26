import { BrevoClient } from "@getbrevo/brevo";

export const sendMail = async ({ to, subject, html, otp }) => {
    const isProduction = process.env.NODE_ENV === "production";
    const apiKey = process.env.BREVO_API_KEY;

    if (apiKey) {
        try {
            const client = new BrevoClient({ apiKey });

            const data = await client.transactionalEmails.sendTransacEmail({
                subject,
                htmlContent: html,
                sender: {
                    name: process.env.BREVO_SENDER_NAME || "SportConnect",
                    email: process.env.BREVO_SENDER_EMAIL || "atharvghumtane02@gmail.com",
                },
                to: [{ email: to }],
            });

            console.log(`[BREVO SUCCESS] Real email sent to ${to} via Brevo API`);
            return { success: true, method: "brevo", messageId: data?.messageId };
        } catch (error) {
            const errMsg = error.body?.message || error.message;
            console.error("[BREVO ERROR] Failed to deliver email via Brevo API:", errMsg);
            if (isProduction) {
                throw new Error("Failed to send email via Brevo: " + errMsg);
            }
        }
    }

    // Development fallback (No BREVO_API_KEY configured in .env):
    // Logs the 6-digit OTP code directly to terminal output so developer can test sign-up
    if (!isProduction) {
        console.log(`\n==================================================`);
        console.log(` 📧 [OTP DEV LOG - NO BREVO_API_KEY CONFIGURED]`);
        console.log(` Target Email : ${to}`);
        console.log(` 🔑 OTP CODE   : ${otp}`);
        console.log(` Notice       : Add BREVO_API_KEY to backend/.env to send real emails via Brevo API.`);
        console.log(`==================================================\n`);
        return { success: true, method: "console_dev" };
    }

    throw new Error("BREVO_API_KEY is not configured in production environment");
};

