import nodemailer from 'nodemailer';
// NEU: BASE_URL hinzufügen
import { SMTP_EMAIL, SMTP_PASSWORD, BASE_URL } from '$env/static/private'; 

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: SMTP_EMAIL,
        pass: SMTP_PASSWORD
    }
});

// reqUrl können wir hier jetzt weglassen
export async function sendVerificationEmail(toEmail, code, token) {
    
    // NEU: Der Link baut sich nun bombenfest aus deiner .env Datei auf
    const magicLink = `${BASE_URL}/verify/${token}`;

    const mailOptions = {
        from: `"Storify Inventar" <${SMTP_EMAIL}>`,
        to: toEmail,
        subject: 'Bitte bestätige deine E-Mail-Adresse',
        html: `... dein restlicher HTML Code bleibt genau gleich ...`
    };

    await transporter.sendMail(mailOptions);
}