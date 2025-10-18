// functions/index.js
const { onCall, HttpsError } = require('firebase-functions/v2/https')
const { defineSecret } = require('firebase-functions/params')
const logger = require('firebase-functions/logger')
const admin = require('firebase-admin')
const sgMail = require('@sendgrid/mail')

admin.initializeApp()

const SENDGRID_KEY = defineSecret('SENDGRID_KEY')

exports.sendEmail = onCall(
  { region: 'australia-southeast1', secrets: [SENDGRID_KEY] },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Please log in first.')
    }

    const key = (process.env.SENDGRID_KEY || '').trim()
    if (!key.startsWith('SG.') || key.length < 25) {
      logger.error('SENDGRID_KEY missing or invalid at runtime')
      throw new HttpsError('failed-precondition', 'SendGrid key not available at runtime.')
    }
    sgMail.setApiKey(key)
    logger.info('SendGrid key loaded (masked): ' + key.slice(0, 6) + '...' + key.slice(-4))

    const { to, subject, message, attachmentBase64, attachmentName, sandbox } = request.data || {}
    if (!to || !subject || !message) {
      throw new HttpsError('invalid-argument', 'Missing email fields.')
    }

    const msg = {
      to,
      from: '0725rex@gmail.com',
      subject,
      html: `<p>${message}</p>`,
    }

    if (attachmentBase64 && attachmentName) {
      msg.attachments = [
        {
          content: attachmentBase64,
          filename: attachmentName,
          type: 'application/octet-stream',
          disposition: 'attachment',
        },
      ]
    }

    try {
      await sgMail.send(msg)
      return { success: true }
    } catch (err) {
      const details =
        (err?.response?.body?.errors &&
          err.response.body.errors.map((e) => e.message).join('; ')) ||
        err?.response?.body?.message ||
        err?.message ||
        'Unknown error'
      logger.error('SendGrid Error', err?.response?.body || err)
      throw new HttpsError('internal', details)
    }
  },
)
