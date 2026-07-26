import { Resend } from "resend";

export const sendMail = async ({ to, subject, html, otp }) => {
    const isProduction = process.env.NODE_ENV === "production";
    const apiKey = process.env.RESEND_API_KEY;

    if (apiKey) {
        try {
            const resend = new Resend(apiKey);
            const fromAddress = process.env.RESEND_FROM || '"SportConnect" <onboarding@resend.dev>';

            const response = await resend.emails.send({
                from: fromAddress,
                to,
                subject,
                html,
            });

            if (response.error) {
                throw new Error(response.error.message);
            }

            console.log(`[RESEND SUCCESS] Real email sent to ${to} via Resend API (id: ${response.data?.id})`);
            return { success: true, method: "resend", id: response.data?.id };
        } catch (error) {
            console.error("[RESEND ERROR] Failed to deliver email via Resend API:", error.message);
            if (isProduction) {
                throw new Error("Failed to send email via Resend: " + error.message);
            }
        }
    }

    // Development fallback (No RESEND_API_KEY configured in .env):
    // Logs the 6-digit OTP code directly to terminal output so developer can test sign-up
    if (!isProduction) {
        console.log(`\n==================================================`);
        console.log(` 📧 [OTP DEV LOG - NO RESEND_API_KEY CONFIGURED]`);
        console.log(` Target Email : ${to}`);
        console.log(` 🔑 OTP CODE   : ${otp}`);
        console.log(` Notice       : Add RESEND_API_KEY to backend/.env to send real emails via Resend API.`);
        console.log(`==================================================\n`);
        return { success: true, method: "console_dev" };
    }

    throw new Error("RESEND_API_KEY is not configured in production environment");
};
