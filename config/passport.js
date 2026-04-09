const passport = require('passport');
const refresh = require('passport-oauth2-refresh');
const { Strategy: LocalStrategy } = require('passport-local');
const { OAuth2Strategy: GoogleStrategy } = require('passport-google-oauth');
const validator = require('validator');
const logger = require('./logger');

const User = require('../models/User');

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    return done(null, await User.findById(id));
  } catch (error) {
    return done(error);
  }
});

/**
 * Sign in using Email and Password.
 */
passport.use(
  new LocalStrategy({ usernameField: 'email' }, (email, password, done) => {
    User.findOne({ email: { $eq: email.toLowerCase() } })
      .then((user) => {
        if (!user) {
          return done(null, false, { msg: `Email ${email} not found.` });
        }
        if (!user.password) {
          return done(null, false, {
            msg: 'Your account was created with a sign-in provider. You can log in using the provider or an email link. To enable email and password login, set a new password in your profile settings.',
          });
        }
        user.comparePassword(password, (err, isMatch) => {
          if (err) {
            return done(err);
          }
          if (isMatch) {
            return done(null, user);
          }
          return done(null, false, { msg: 'Invalid email or password.' });
        });
      })
      .catch((err) => done(err));
  }),
);

/**
 * Helper function that contains the shared post-profile OAuth logic.
 * Returns User (new or updated) on success or throws Error on failure.
 */
async function handleAuthLogin(req, accessToken, refreshToken, providerName, params, providerProfile, sessionAlreadyLoggedIn, tokenSecret, oauth2provider, tokenConfig = {}, refreshTokenExpiration = null) {
  if (sessionAlreadyLoggedIn) {
    const existingUser = await User.findOne({
      [providerName]: { $eq: providerProfile.id },
    });
    if (existingUser && existingUser.id !== req.user.id) {
      throw new Error('PROVIDER_COLLISION');
    }
    let user;
    if (oauth2provider) {
      user = await saveOAuth2UserTokens(req, accessToken, refreshToken, params.expires_in, refreshTokenExpiration, providerName, tokenConfig);
    } else {
      user = await User.findById(req.user.id);
      user.tokens.push({ kind: providerName, accessToken, ...(tokenSecret && { tokenSecret }) });
    }
    user[providerName] = providerProfile.id;
    user.profile.name = user.profile.name || providerProfile.name;
    user.profile.gender = user.profile.gender || providerProfile.gender;

    if (providerProfile.picture) {
      if (!user.profile.pictures || user.profile.pictureSource === undefined) {
        user.profile.pictures = new Map();
        user.profile.picture = providerProfile.picture;
        user.profile.pictureSource = providerName;
      }
      user.profile.pictures.set(providerName, providerProfile.picture);
      if (user.profile.pictureSource === 'gravatar') {
        user.profile.picture = providerProfile.picture;
        user.profile.pictureSource = providerName;
      }
    }

    user.profile.location = user.profile.location || providerProfile.location;
    user.profile.website = user.profile.website || providerProfile.website;
    await user.save();
    return user;
  }
  const existingUser = await User.findOne({ [providerName]: { $eq: providerProfile.id } });
  if (existingUser) {
    return existingUser;
  }
  const normalizedEmail = providerProfile.email ? validator.normalizeEmail(providerProfile.email, { gmail_remove_dots: false }) : undefined;
  if (!normalizedEmail) {
    throw new Error('EMAIL_REQUIRED');
  }
  const existingEmailUser = await User.findOne({
    email: { $eq: normalizedEmail },
  });
  if (existingEmailUser) {
    throw new Error('EMAIL_COLLISION');
  }
  const user = new User();
  user.email = normalizedEmail;
  user[providerName] = providerProfile.id;
  req.user = user;
  if (oauth2provider) {
    await saveOAuth2UserTokens(req, accessToken, refreshToken, params.expires_in, refreshTokenExpiration, providerName, tokenConfig);
  } else {
    user.tokens.push({ kind: providerName, accessToken, ...(tokenSecret && { tokenSecret }) });
  }
  user.profile.name = providerProfile.name;
  user.profile.gender = providerProfile.gender;

  if (providerProfile.picture) {
    user.profile.pictures = new Map();
    user.profile.pictures.set(providerName, providerProfile.picture);
    user.profile.picture = providerProfile.picture;
    user.profile.pictureSource = providerName;
  }

  user.profile.location = providerProfile.location;
  user.profile.website = providerProfile.website;
  await user.save();
  return user;
}

/**
 * Helper function to handle OAuth errors with provider-specific messages.
 * Returns true if error was handled, false otherwise.
 */
function authError2Flash(err, req, done, providerDisplayName) {
  if (err.message === 'PROVIDER_COLLISION') {
    req.flash('errors', { msg: `There is another account in our system linked to your ${providerDisplayName} account. Please delete the duplicate account before linking ${providerDisplayName} to your current account.` });
    if (req.session) req.session.returnTo = undefined;
    done(null, req.user);
    return true;
  }
  if (err.message === 'EMAIL_COLLISION') {
    req.flash('errors', { msg: `Unable to sign in with ${providerDisplayName} at this time. If you have an existing account in our system, please sign in by email and link your account to ${providerDisplayName} in your user profile settings.` });
    done(null, false);
    return true;
  }
  if (err.message === 'EMAIL_REQUIRED') {
    req.flash('errors', { msg: `Unable to sign in with ${providerDisplayName}. No email address was provided for account creation.` });
    done(null, false);
    return true;
  }
  return false;
}

/**
 * Common function to handle OAuth2 token processing and saving user data.
 */
async function saveOAuth2UserTokens(req, accessToken, refreshToken, accessTokenExpiration, refreshTokenExpiration, providerName, tokenConfig = {}) {
  try {
    let user = await User.findById(req.user._id);
    if (!user) {
      ({ user } = req);
    }
    const providerToken = user.tokens.find((token) => token.kind === providerName);
    if (providerToken) {
      providerToken.accessToken = accessToken;
      if (accessTokenExpiration) {
        providerToken.accessTokenExpires = new Date(Date.now() + accessTokenExpiration * 1000).toISOString();
      } else {
        delete providerToken.accessTokenExpires;
      }
      if (refreshToken) {
        providerToken.refreshToken = refreshToken;
      }
      if (refreshTokenExpiration) {
        providerToken.refreshTokenExpires = new Date(Date.now() + refreshTokenExpiration * 1000).toISOString();
      } else if (refreshToken) {
        delete providerToken.refreshTokenExpires;
      }
    } else {
      const newToken = {
        kind: providerName,
        accessToken,
        ...(accessTokenExpiration && {
          accessTokenExpires: new Date(Date.now() + accessTokenExpiration * 1000).toISOString(),
        }),
        ...(refreshToken && { refreshToken }),
        ...(refreshTokenExpiration && {
          refreshTokenExpires: new Date(Date.now() + refreshTokenExpiration * 1000).toISOString(),
        }),
      };
      user.tokens.push(newToken);
    }

    if (tokenConfig) {
      Object.assign(user, tokenConfig);
    }

    user.markModified('tokens');
    await user.save();
    return user;
  } catch (err) {
    throw new Error(err);
  }
}

/**
 * Sign in with Google.
 */
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  const googleStrategyConfig = new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: '/auth/google/callback',
      scope: ['profile', 'email'],
      state: true,
      passReqToCallback: true,
    },
    async (req, accessToken, refreshToken, params, profile, done) => {
      try {
        const providerProfile = {
          id: profile.id,
          name: profile.displayName,
          gender: profile._json.gender,
          picture: profile._json.picture,
          email: profile.emails && profile.emails[0] && profile.emails[0].value ? profile.emails[0].value : undefined,
        };
        try {
          const sessionAlreadyLoggedIn = !!req.user;
          const user = await handleAuthLogin(req, accessToken, refreshToken, 'google', params, providerProfile, sessionAlreadyLoggedIn, null, true);
          if (sessionAlreadyLoggedIn && req.user.id === user.id) {
            req.flash('info', { msg: 'Google account has been linked.' });
          }
          return done(null, user);
        } catch (err) {
          if (authError2Flash(err, req, done, 'Google')) return;
          throw err;
        }
      } catch (err) {
        return done(err);
      }
    },
  );
  passport.use('google', googleStrategyConfig);
  refresh.use('google', googleStrategyConfig);
}

/**
 * Token Revocation Config
 */
const providerRevocationConfig = {
  google: {
    revokeURL: 'https://oauth2.googleapis.com/revoke',
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    authMethod: 'basic',
  },
};

exports.providerRevocationConfig = providerRevocationConfig;

/**
 * Login Required middleware.
 */
exports.isAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  req.flash('errors', { msg: 'You need to be logged in to access that page.' });
  res.redirect('/login');
};

/**
 * Approved employee check middleware.
 * Ensures the user is both authenticated and has an active (approved) account.
 */
exports.isApproved = (req, res, next) => {
  if (!req.isAuthenticated()) {
    req.flash('errors', { msg: 'You need to be logged in to access that page.' });
    return res.redirect('/login');
  }
  if (req.user.status === 'pending') {
    return res.redirect('/pending-approval');
  }
  if (req.user.status === 'suspended') {
    req.flash('errors', { msg: 'Your account has been suspended. Contact the administrator for more information.' });
    return res.redirect('/login');
  }
  if (req.user.status === 'denied') {
    req.flash('errors', { msg: 'Your application has been denied. Contact the administrator for more information.' });
    return res.redirect('/login');
  }
  return next();
};

/**
 * Authorization Required middleware.
 */
exports.isAuthorized = async (req, res, next) => {
  const provider = req.path.split('/')[2];
  const token = req.user.tokens.find((token) => token.kind === provider);
  if (token) {
    if (token.accessTokenExpires && new Date(token.accessTokenExpires).getTime() < Date.now() - 1 * 60 * 1000) {
      if (token.refreshToken) {
        if (token.refreshTokenExpires && new Date(token.refreshTokenExpires).getTime() < Date.now() - 1 * 60 * 1000) {
          return res.redirect(`/auth/${provider}`);
        }
        try {
          const newTokens = await new Promise((resolve, reject) => {
            refresh.requestNewAccessToken(`${provider}`, token.refreshToken, (err, accessToken, refreshToken, params) => {
              if (err) reject(err);
              resolve({ accessToken, refreshToken, params });
            });
          });

          req.user.tokens.forEach((tokenObject) => {
            if (tokenObject.kind === provider) {
              tokenObject.accessToken = newTokens.accessToken;
              if (newTokens.params.expires_in) tokenObject.accessTokenExpires = new Date(Date.now() + newTokens.params.expires_in * 1000).toISOString();
            }
          });

          await req.user.save();
          return next();
        } catch (err) {
          logger.error('Token refresh error', { provider, err });
          return res.redirect(`/auth/${provider}`);
        }
      } else {
        return res.redirect(`/auth/${provider}`);
      }
    } else {
      return next();
    }
  } else {
    return res.redirect(`/auth/${provider}`);
  }
};

// Add export for testing the internal functions
exports._saveOAuth2UserTokens = saveOAuth2UserTokens;
exports._handleAuthLogin = handleAuthLogin;
