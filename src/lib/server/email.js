import nodemailer from 'nodemailer';
import { SMTP_EMAIL, SMTP_PASSWORD, BASE_URL } from '$env/static/private'; 

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: SMTP_EMAIL,
        pass: SMTP_PASSWORD
    }
});

export async function sendVerificationEmail(toEmail, code, token) {
    
    // Der Link baut sich nun bombenfest aus deiner .env Datei auf
    const magicLink = `${BASE_URL}/verify/${token}`;

    const mailOptions = {
        from: `"Sortify Inventar" <${SMTP_EMAIL}>`,
        to: toEmail,
        subject: 'Bitte bestätige deine E-Mail-Adresse',
        html: `
            <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 30px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
                <h2 style="color: #22c55e; margin-top: 0;">Willkommen bei Sortify!</h2>
                <p style="color: #334155; font-size: 16px; line-height: 1.5;">Bitte bestätige deine E-Mail-Adresse, um deinen Account für das digitale Kleinteilelager freizuschalten.</p>
                
                <p style="color: #334155; font-size: 15px; margin-top: 25px;"><strong>Option 1: Klicke auf diesen Link (Magic Link)</strong></p>
                <a href="${magicLink}" style="display: inline-block; background-color: #22c55e; color: #0B192C; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">
                    Account bestätigen
                </a>
                
                <p style="margin-top: 35px; color: #334155; font-size: 15px;"><strong>Option 2: Gib diesen Code auf der Webseite ein</strong></p>
                <div style="background-color: #f8fafc; padding: 20px; font-size: 28px; letter-spacing: 8px; text-align: center; border-radius: 8px; font-family: monospace; font-weight: bold; color: #16a34a; border: 2px solid #e2e8f0;">
                    ${code}
                </div>
                
                <hr style="border: none; border-top: 1px solid #e2e8f0; margin-top: 40px; margin-bottom: 20px;">
                <p style="font-size: 12px; color: #64748b; margin: 0;">Dieser Code und der Link sind aus Sicherheitsgründen 15 Minuten lang gültig.</p>
            </div>
        `
    };

    await transporter.sendMail(mailOptions);
}

export async function sendPasswordResetEmail(toEmail, token, baseUrl) {
    const resetLink = `${baseUrl}/reset-password/${token}`;

    const mailOptions = {
        from: `"Sortify Inventar" <${SMTP_EMAIL}>`,
        to: toEmail,
        subject: 'Dein Passwort zurücksetzen',
        html: `
            <div style="font-family: 'Segoe UI', Tahoma, Geneva, sans-serif; max-width: 600px; margin: 0 auto; padding: 30px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
                <h2 style="color: #3b82f6; margin-top: 0;">Passwort zurücksetzen</h2>
                <p style="color: #334155; font-size: 16px; line-height: 1.5;">Du hast eine Anfrage zum Zurücksetzen deines Passworts für Sortify gestellt.</p>
                
                <p style="color: #334155; font-size: 15px; margin-top: 25px;">Klicke auf den untenstehenden Link, um ein neues Passwort zu vergeben:</p>
                <a href="${resetLink}" style="display: inline-block; background-color: #3b82f6; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px; margin-top: 10px;">
                    Neues Passwort setzen
                </a>
                
                <hr style="border: none; border-top: 1px solid #e2e8f0; margin-top: 40px; margin-bottom: 20px;">
                <p style="font-size: 12px; color: #64748b; margin: 0;">Dieser Link ist aus Sicherheitsgründen für 1 Stunde gültig. Wenn du diese Anfrage nicht gestellt hast, kannst du diese E-Mail einfach ignorieren.</p>
            </div>
        `
    };

    await transporter.sendMail(mailOptions);
}