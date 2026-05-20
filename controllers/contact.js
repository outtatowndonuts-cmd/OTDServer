const validator = require('validator');
const nodemailerConfig = require('../config/nodemailer');
const ContactMessage = require('../models/ContactMessage');

async function validateReCAPTCHA(token) {
  const projectId = process.env.GOOGLE_PROJECT_ID;
  const siteKey = process.env.GOOGLE_RECAPTCHA_SITE_KEY;
  const apiKey = process.env.GOOGLE_API_KEY;
  const url = `https://recaptchaenterprise.googleapis.com/v1/projects/${projectId}/assessments?key=${apiKey}`;
  const body = {
    event: {
      token,
      siteKey,
    },
  };
  const resp = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await resp.json();
  return {
    valid: data.tokenProperties?.valid === true,
    score: data.riskAnalysis?.score ?? null,
    action: data.tokenProperties?.action ?? null,
    invalidReason: data.tokenProperties?.invalidReason ?? null,
  };
}

/**
 * GET /contact
 * Contact form page.
 */
exports.getContact = (req, res) => {
  const unknownUser = !req.user;

  if (!process.env.GOOGLE_RECAPTCHA_SITE_KEY) {
    console.warn('\x1b[33mWARNING: GOOGLE_RECAPTCHA_SITE_KEY is missing. Add a key to your .env, env variable, or use a WebApp Firewall with an interactive challenge before going to production.\x1b[0m');
  }

  res.render('contact', {
    title: 'Contact',
    sitekey: process.env.GOOGLE_RECAPTCHA_SITE_KEY || null, // Pass null if the key is missing
    unknownUser,
  });
};

/**
 * POST /contact
 * Send a contact form via Nodemailer.
 */
exports.postContact = async (req, res, next) => {
  const validationErrors = [];
  let fromName;
  let fromEmail;
  if (!req.user) {
    if (validator.isEmpty(req.body.name)) validationErrors.push({ msg: 'Please enter your name' });
    if (!validator.isEmail(req.body.email)) validationErrors.push({ msg: 'Please enter a valid email address.' });
  }
  if (validator.isEmpty(req.body.message)) validationErrors.push({ msg: 'Please enter your message.' });

  if (!process.env.GOOGLE_RECAPTCHA_SITE_KEY) {
    console.warn('\x1b[33mWARNING: GOOGLE_RECAPTCHA_SITE_KEY is missing. Add a key to your .env or use a WebApp Firewall for CAPTCHA validation before going to production.\x1b[0m');
  } else if (!validator.isEmpty(req.body['g-recaptcha-response'])) {
    try {
      const reCAPTCHAResponse = await validateReCAPTCHA(req.body['g-recaptcha-response']);
      if (!reCAPTCHAResponse.valid) {
        validationErrors.push({ msg: 'reCAPTCHA validation failed.' });
      }
    } catch (error) {
      console.error('Error validating reCAPTCHA:', error);
      validationErrors.push({ msg: 'Error validating reCAPTCHA. Please try again.' });
    }
  } else {
    validationErrors.push({ msg: 'reCAPTCHA response was missing.' });
  }

  if (validationErrors.length) {
    req.flash('errors', validationErrors);
    return res.redirect('/contact');
  }

  if (!req.user) {
    fromName = req.body.name;
    fromEmail = req.body.email;
  } else {
    fromName = req.user.profile.name || '';
    fromEmail = req.user.email;
  }

  // Save to database
  try {
    await ContactMessage.create({
      name: fromName,
      email: fromEmail,
      message: req.body.message,
    });
  } catch (err) {
    console.error('Failed to save contact message:', err);
    req.flash('errors', [{ msg: 'Error saving your message. Please try again shortly.' }]);
    return res.redirect('/contact');
  }

  // Notify admin via email (non-blocking)
  const adminNotifyEmail = async () => {
    const adminUrl = `${process.env.BASE_URL || ''}/admin#/contacts`;
    const mailOptions = {
      to: process.env.SITE_CONTACT_EMAIL,
      from: process.env.SITE_CONTACT_EMAIL,
      replyTo: `${fromName} <${fromEmail}>`,
      subject: `New Contact Message from ${fromName}`,
      text: `You have a new contact message.\n\nFrom: ${fromName} <${fromEmail}>\n\n${req.body.message}\n\n---\nReply via the admin panel: ${adminUrl}`,
    };
    const mailSettings = {
      successfulType: 'info',
      successfulMsg: '',
      loggingError: 'ERROR: Could not send admin contact notification.\n',
      errorType: 'errors',
      errorMsg: '',
      mailOptions,
      req,
    };
    return nodemailerConfig.sendMail(mailSettings);
  };

  adminNotifyEmail().catch((err) => console.error('Admin contact notify failed:', err));

  req.flash('success', { msg: 'Your message has been sent!' });
  res.redirect('/contact');
};
