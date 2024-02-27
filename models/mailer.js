'use strict'
const nodemailer = require('nodemailer')
const dotenv = require('dotenv').config();

// nodemailer.createTransport({
//   host: 'smtp.gmail.com', // SMTP server hostname
//   port: 587, // Port for TLS
//   secure: process.env.EMAIL_HOST_SECURE==='true', // true for 465, false for other ports
//   auth: {
//     user: process.env.EMAIL_HOST_USER, // Your email address
//     pass: process.env.EMAIL_HOST_PASSWORD, // Your email password
//   },
//   tls: {
//         rejectUnauthorized: false, // Disable SSL certificate verification
//       },
//   debug: true,
// });


const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    // TODO: replace `user` and `pass` values from <https://forwardemail.net>
    user: process.env.user,
    pass: process.env.pass
  },
  tls: {
    rejectUnauthorized: false // Disable SSL certificate verification
  },
  debug: true
})
function stringifyArray (mails) {
  let temp = [...mails]
  let res = ''
  temp.map(v => {
    res += v + ','
  })
  res = res.slice(0, -1)
  return res
}

// async..await is not allowed in global scope, must use a wrapper
async function sendSpecialOffer (mails, title ,content) {
  // send mail with defined transport object
  const info = await transporter.sendMail({
    from: '"Ocean Salon 🍃" <foo@example.com>', // sender address
    to: stringifyArray(mails), // list of receivers
    subject: title, // Subject line
    html: content // html body
  })

  console.log('Message sent: %s', info.messageId)
  // Message sent: <b658f8ca-6296-ccf4-8306-87d57a0b4321@example.com>

  //
  // NOTE: You can go to https://forwardemail.net/my-account/emails to see your email delivery status and preview
  //       Or you can use the "preview-email" npm package to preview emails locally in browsers and iOS Simulator
  //       <https://github.com/forwardemail/preview-email>
  //
}
module.exports={sendSpecialOffer}
