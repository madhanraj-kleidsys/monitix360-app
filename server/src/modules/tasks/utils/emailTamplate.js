const nodemailer = require("nodemailer");
require("dotenv").config();

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,       // your email (admin)
    pass: process.env.EMAIL_PASS        // app password (not your login password)
  },
});

async function sendTaskEmail(to, subject, htmlContent) {
  const mailOptions = {
    from: `"Task Manager" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html: htmlContent,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`📧 Email sent to ${to}`);
  } catch (err) {
    console.error("Failed to send email:", err);
  }
}



module.exports = { sendTaskEmail };
