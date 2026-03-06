const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
    try {
        // Create a transporter
        const transporter = nodemailer.createTransport({
            service: 'gmail', // Use Gmail as the default service
            auth: {
                user: process.env.EMAIL_USERNAME, // e.g., your-email@gmail.com
                pass: process.env.EMAIL_PASSWORD  // e.g., your app password from Google
            }
        });

        // Define the email options
        const mailOptions = {
            from: `ShopVerse Store <${process.env.EMAIL_USERNAME || 'noreply@shopverse.com'}>`,
            to: options.email,
            subject: options.subject,
            html: options.html
        };

        // Send the email
        const info = await transporter.sendMail(mailOptions);
        console.log('✅ Email sent successfully:', info.messageId);
    } catch (error) {
        console.error('❌ Error sending email. Is your EMAIL_USERNAME and EMAIL_PASSWORD correctly set in .env?', error.message);
        // We purposely don't throw here so that a failed email doesn't crash the order creation process
    }
};

module.exports = sendEmail;
