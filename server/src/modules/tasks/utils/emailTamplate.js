const nodemailer = require("nodemailer");
require("dotenv").config();

const transporter = (companyCredentials) => {
  let config = {
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    },
  };

  if (companyCredentials && companyCredentials.email_user && companyCredentials.email_pass) {
    config.auth.user = companyCredentials.email_user;
    config.auth.pass = companyCredentials.email_pass;
  }
  return nodemailer.createTransport(config);
};

async function sendTaskEmail(to, subject, htmlContent, companyCredentials = null) {
  const mailOptions = {
    from: `"Task Manager" <${(companyCredentials && companyCredentials.email_user) ? companyCredentials.email_user : process.env.EMAIL_USER}>`,
    to,
    subject,
    html: htmlContent,
  };

  try {
    const transport = transporter(companyCredentials);
    await transport.sendMail(mailOptions);
    console.log(`📧 Email sent to ${to}`);
  } catch (err) {
    console.error(`Failed to send email to : ${to} ::::: `, err);
  }
}
module.exports = { sendTaskEmail };