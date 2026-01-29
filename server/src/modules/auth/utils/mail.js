const nodemailer = require("nodemailer");

const sendOtpMail = async (to, otp, companyCredentials = null) => {
  let transporterConfig = {
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  };

  // Override with company credentials if provided
  if (companyCredentials && companyCredentials.email_user && companyCredentials.email_pass) {
    transporterConfig = {
      service: "gmail",
      auth: {
        user: companyCredentials.email_user,
        pass: companyCredentials.email_pass,
      },
    };
  }

  const transporter = nodemailer.createTransport(transporterConfig);

  const fromEmail = (companyCredentials && companyCredentials.email_user)
    ? companyCredentials.email_user
    : process.env.EMAIL_USER;

  await transporter.sendMail({
    from: `"Support Team" <${fromEmail}>`,
    to,
    subject: "Your Password Reset OTP",
    html: `
      <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9; border-radius: 10px;">
        <div style="background-color: #0099FF; padding: 20px; border-radius: 10px 10px 0 0; text-align: center;">
             <h1 style="color: #ffffff; margin: 0; font-size: 24px;">Password Reset</h1>
        </div>
        <div style="background-color: #ffffff; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 2px 5px rgba(0,0,0,0.05);">
            <p style="font-size: 16px; color: #333333; margin-bottom: 20px;">Hello,</p>
            <p style="font-size: 16px; color: #555555; line-height: 1.6;">It looks like you forgot your password. No worries! Use the One-Time Password (OTP) below to reset it directly in the app.</p>
            
            <div style="margin: 30px 0; text-align: center;">
                <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #0099FF; background-color: #e6f4ff; padding: 15px 30px; border-radius: 5px; border: 2px dashed #0099FF;">${otp}</span>
            </div>

            <p style="font-size: 14px; color: #888888; text-align: center;">This OTP is valid for 10 minutes.</p>
            
            <hr style="border: 0; border-top: 1px solid #eeeeee; margin: 30px 0;">
            <p style="font-size: 12px; color: #999999; text-align: center;">If you didn't request a password reset, you can safely ignore this email.</p>
        </div>
        <div style="text-align: center; margin-top: 20px; color: #aaaaaa; font-size: 12px;">
            &copy; ${new Date().getFullYear()} Kleidsys Technologies. All rights reserved.
        </div>
      </div>
    `,
  });
};

module.exports = { sendOtpMail };
