const { SendMailClient } = require("zeptomail")

const sendCertificateEmail = async ({ to, studentName, pdfBuffer }) => {
  if (!process.env.ZEPTO_MAIL_TOKEN) {
    throw new Error("ZEPTO_MAIL_TOKEN missing in .env")
  }
  if (!process.env.ZEPTO_MAIL_FROM) {
    throw new Error("ZEPTO_MAIL_FROM missing in .env")
  }

  const client = new SendMailClient({
    url: "api.zeptomail.in/",
    token: process.env.ZEPTO_MAIL_TOKEN,
  })

  try {
    const response = await client.sendMail({
      from: {
        address: process.env.ZEPTO_MAIL_FROM,
        name: "Certificate Team",
      },
      to: [
        {
          email_address: {
            address: to,
            name: studentName,
          },
        },
      ],
      subject: "Your Certificate",
      htmlbody: `
        <div style="font-family: Arial; padding: 20px;">
          <h2>Congratulations ${studentName}!</h2>
          <p>Please find your certificate attached.</p>
          <p>Best regards,<br/>Certificate Team</p>
        </div>
      `,
      textbody: `Congratulations ${studentName}. Your certificate is attached.`,
      attachments: [
        {
          name: "certificate.pdf",
          content: pdfBuffer.toString("base64"),
          mime_type: "application/pdf",
        },
      ],
    })

    console.log("Email sent to:", to, response)
    return true
  } catch (error) {
    console.error("ZeptoMail Error:", JSON.stringify(error, null, 2))
    throw new Error(`Failed to send certificate email: ${JSON.stringify(error)}`)
  }
}

module.exports = { sendCertificateEmail }