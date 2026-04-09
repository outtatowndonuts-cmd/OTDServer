const validator = require('validator');
const User = require('../models/User');

/**
 * GET /apply
 * Employee application form.
 */
exports.getApply = (req, res) => {
  if (req.user) return res.redirect('/');
  res.render('apply', { title: 'Apply to Work Here' });
};

/**
 * POST /apply
 * Submit employee application. Creates a User with status: 'pending'.
 * Admin must approve before the account gains access.
 */
exports.postApply = async (req, res, next) => {
  const validationErrors = [];
  const name = req.body.name ? req.body.name.trim() : '';
  const email = req.body.email ? req.body.email.toLowerCase().trim() : '';
  const password = req.body.password || '';
  const note = req.body.note ? req.body.note.trim() : '';

  if (!name || name.length < 2) validationErrors.push({ msg: 'Please enter your full name (at least 2 characters).' });
  if (!validator.isEmail(email)) validationErrors.push({ msg: 'Please enter a valid email address.' });
  if (!validator.isLength(password, { min: 8 })) validationErrors.push({ msg: 'Password must be at least 8 characters.' });
  if (!note || note.length < 10) validationErrors.push({ msg: 'Please tell us a bit about why you want to work here (at least 10 characters).' });

  if (validationErrors.length) {
    req.flash('errors', validationErrors);
    return res.redirect('/apply');
  }

  try {
    const existing = await User.findOne({ email: { $eq: email } });
    if (existing) {
      req.flash('errors', { msg: 'An account with that email address already exists.' });
      return res.redirect('/apply');
    }

    const user = new User({
      email,
      password,
      status: 'pending',
      role: 'staff',
      applicationNote: note,
      profile: { name },
    });
    await user.save();

    req.flash('info', { msg: 'Your application has been submitted. An administrator will review it and get back to you.' });
    return res.redirect('/login');
  } catch (err) {
    return next(err);
  }
};
