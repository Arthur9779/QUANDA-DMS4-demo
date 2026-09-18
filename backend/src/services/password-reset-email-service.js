const nodemailer = require("nodemailer");

function createPasswordResetEmailSender({ config, transport } = {}) {
  let mailTransport = transport;
  if (!mailTransport && config.passwordResetEmailMode === "gmail") {
    mailTransport = nodemailer.createTransport({
      service: "gmail",
      auth: { user: config.gmailUser, pass: config.gmailAppPassword },
    });
  }

  return {
    async send({ to, resetUrl }) {
      if (config.passwordResetEmailMode !== "gmail") {
        if (config.nodeEnv === "production") {
          throw new Error("Password reset email delivery is not configured for production");
        }
        console.info(`[QUANDA API] password reset email prepared for ${to}`);
        return;
      }
      await mailTransport.sendMail({
        from: `QUANDA <${config.gmailUser}>`,
        to,
        subject: "Reset your QUANDA password",
        text: `Use this one-time link to reset your QUANDA password. It expires in ${config.passwordResetTokenMinutes} minutes:\n\n${resetUrl}\n\nIf you did not request this, you can ignore this email.`,
      });
    },
  };
}

module.exports = { createPasswordResetEmailSender };
