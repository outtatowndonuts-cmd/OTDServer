/**
 * Module dependencies.
 */
const path = require('node:path');
const logger = require('./config/logger');
const express = require('express');
const compression = require('compression');
const session = require('express-session');
const errorHandler = require('errorhandler');
const lusca = require('lusca');
const { MongoStore } = require('connect-mongo');
const mongoose = require('mongoose');
const passport = require('passport');
const rateLimit = require('express-rate-limit');
const { flash } = require('./config/flash');

/**
 * Load environment variables from .env file, where API keys and passwords are configured.
 */
try {
  process.loadEnvFile('.env');
} catch (err) {
  if (err && err.code === 'ENOENT') {
    logger.info('No .env file found. Using environment variables from the host.');
  } else {
    logger.error('Error loading .env file:', err);
  }
}

/**
 * Set config values
 */
const secureTransfer = (process.env.BASE_URL ?? '').startsWith('https');

/**
 * Rate limiting configuration
 * This is a basic rate limiting configuration. You may want to adjust the settings
 * based on your application's needs and the expected traffic patterns.
 * Also, consider adding a proxy such as cloudflare for production.
 */
const RATE_LIMIT_GLOBAL = parseInt(process.env.RATE_LIMIT_GLOBAL, 10) || 200; // Default to 200 per 15 min if env variable not set
const RATE_LIMIT_STRICT = parseInt(process.env.RATE_LIMIT_STRICT, 10) || 5; // Default to 5 per hr if env variable not set
const RATE_LIMIT_LOGIN = parseInt(process.env.RATE_LIMIT_LOGIN, 10) || 10; // Default to 10 per hr if env variable not set

// Global Rate Limiter Config
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: RATE_LIMIT_GLOBAL, // requests per 15 minutes
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});
// Strict Auth Rate Limiter Config for signup, password recover, account verification, login by email, send 2FA email
const strictLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: RATE_LIMIT_STRICT, // attempts per hour
  standardHeaders: true,
  legacyHeaders: false,
});

// Login Rate Limiter Config
const loginLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: RATE_LIMIT_LOGIN, // attempts per hour
  standardHeaders: true,
  legacyHeaders: false,
});
// Login 2FA Rate Limiter Config - allow more requests for 2FA pages per login to avoid UX issues.
// This is after a valid username/password submission, so the attack surface is smaller
// and we want to avoid locking out legitimate users who mistype their 2FA code.
const login2FALimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: RATE_LIMIT_LOGIN * 5,
  standardHeaders: true,
  legacyHeaders: false,
});

// This logic for numberOfProxies works for local testing, ngrok use, single host deployments
// behind cloudflare, etc. You may need to change it for more complex network settings.
// See readme.md for more info.
let numberOfProxies;
if (secureTransfer) numberOfProxies = 1;
else numberOfProxies = 0;

/**
 * Logging configuration — loaded at the top of the file.
 */

/**
 * Controllers (route handlers).
 */
const homeController = require('./controllers/home');
const userController = require('./controllers/user');
const applyController = require('./controllers/apply');

const contactController = require('./controllers/contact');
const webauthnController = require('./controllers/webauthn');

/**
 * API keys and Passport configuration.
 */
const passportConfig = require('./config/passport');
const { requireRole } = require('./shared/requireRole');

/**
 * Request logging configuration
 */
const { morganLogger } = require('./config/morgan');

/**
 * Create Express server.
 */
const app = express();

/**
 * Connect to MongoDB.
 */
mongoose.connect(process.env.MONGODB_URI);
mongoose.connection.on('error', (err) => {
  logger.error('MongoDB connection error. Please make sure MongoDB is running.', { err });
  process.exit(1);
});

/**
 * Express configuration.
 */
app.set('host', '0.0.0.0');
app.set('port', process.env.PORT || 8080);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');
app.set('trust proxy', numberOfProxies);
app.use(morganLogger());
app.use(compression());
app.use(
  express.json({
    verify: (req, res, buf) => {
      // Preserve raw body for Stripe webhook signature verification
      if (req.originalUrl === '/shop/webhook/stripe') {
        req.rawBody = buf;
      }
    },
  }),
);
app.use(express.urlencoded({ extended: true }));
app.use(limiter);
app.use(
  session({
    resave: false, // Only save session if modified
    saveUninitialized: false, // Do not save sessions until we have something to store
    secret: process.env.SESSION_SECRET,
    name: 'dsos',
    cookie: {
      maxAge: 1209600000, // Two weeks in milliseconds
      secure: secureTransfer,
      sameSite: 'lax',
    },
    store: MongoStore.create({ mongoUrl: process.env.MONGODB_URI }),
  }),
);
app.use(passport.initialize());
app.use(passport.session());
app.use(flash);
app.use((req, res, next) => {
  if (req.originalUrl === '/shop/webhook/stripe') {
    // Stripe webhooks are verified via signature, not CSRF
    next();
  } else {
    lusca.csrf()(req, res, next);
  }
});
app.use(lusca.xframe('SAMEORIGIN'));
app.use(lusca.xssProtection(true));
app.disable('x-powered-by');
// Make CSRF token available in all views
app.use((req, res, next) => {
  res.locals.user = req.user;
  res.locals._csrf = req.csrfToken ? req.csrfToken() : '';
  res.locals.fmtCurrency = (n) => {
    if (n == null || isNaN(n)) return '$0.00';
    const s = n.toFixed(3);
    return `$${s.endsWith('0') ? n.toFixed(2) : s}`;
  };
  next();
});

// Redirect pending users to /pending-approval for any route outside the allowed set.
const PENDING_ALLOWED_PREFIXES = ['/pending-approval', '/logout', '/account', '/login', '/auth'];
app.use((req, res, next) => {
  if (req.user && req.user.status === 'pending') {
    const allowed = req.path === '/pending-approval' || PENDING_ALLOWED_PREFIXES.some((p) => req.path === p || req.path.startsWith(`${p}/`)) || req.path.includes('.');
    if (!allowed) return res.redirect('/pending-approval');
  }
  next();
});

// --- Modular Business OS: Mount all modules ---
const modules = require('./config/modules');
modules.forEach((moduleRoute) => {
  app.use(moduleRoute.basePath, moduleRoute.router);
});

// Redirect unauthenticated GET requests to /shop for all non-public routes.
// Public paths: /shop and sub-routes, /apply, /pending-approval, auth/login/signup
// flows, and anything containing a dot (static assets).
const PUBLIC_PREFIXES = ['/shop', '/access', '/apply', '/pending-approval', '/login', '/logout', '/forgot', '/reset', '/signup', '/auth', '/contact'];
app.use((req, res, next) => {
  if (req.user || req.method !== 'GET') return next();
  const isPublic = PUBLIC_PREFIXES.some((p) => req.path === p || req.path.startsWith(`${p}/`)) || req.path.includes('.');
  if (!isPublic) return res.redirect('/shop');
  next();
});
// Function to validate if the URL is a safe relative path
const isSafeRedirect = (url) => /^\/[a-zA-Z0-9/_-]*$/.test(url);
app.use((req, res, next) => {
  // After successful login, redirect back to the intended page
  // Only set returnTo for GET requests (Only pages that a user can navigate to)
  if (req.method !== 'GET') {
    return next();
  }

  if (!req.user && req.path !== '/login' && !req.path.startsWith('/login/webauthn-') && req.path !== '/signup' && !req.path.startsWith('/auth') && !req.path.includes('.')) {
    const returnTo = req.originalUrl;
    if (isSafeRedirect(returnTo)) {
      req.session.returnTo = returnTo;
    } else {
      req.session.returnTo = '/';
    }
  } else if (req.user && (req.path === '/account' || req.path.startsWith('/api'))) {
    const returnTo = req.originalUrl;
    if (isSafeRedirect(returnTo)) {
      req.session.returnTo = returnTo;
      if (req.path.startsWith('/api/') && !req.session.baseReturnTo) {
        req.session.baseReturnTo = '/api';
      }
    } else {
      req.session.returnTo = '/';
      req.session.baseReturnTo = '/';
    }
  }
  next();
});
app.use('/', express.static(path.join(__dirname, 'public'), { maxAge: 31557600000 }));
app.use('/js/lib', express.static(path.join(__dirname, 'node_modules/chart.js/dist'), { maxAge: 31557600000 }));
app.use('/js/lib', express.static(path.join(__dirname, 'node_modules/@popperjs/core/dist/umd'), { maxAge: 31557600000 }));
app.use('/js/lib', express.static(path.join(__dirname, 'node_modules/bootstrap/dist/js'), { maxAge: 31557600000 }));
app.use('/js/lib', express.static(path.join(__dirname, 'node_modules/jquery/dist'), { maxAge: 31557600000 }));
app.use('/js/lib', express.static(path.join(__dirname, 'node_modules/@simplewebauthn/browser/dist/bundle'), { maxAge: 31557600000 }));
app.use('/webfonts', express.static(path.join(__dirname, 'node_modules/@fortawesome/fontawesome-free/webfonts'), { maxAge: 31557600000 }));
app.use('/image-cache', express.static(path.join(__dirname, 'tmp/image-cache'), { maxAge: 31557600000 }));

/**
 * Analytics IDs needed thru layout.pug; set as express local so we don't have to pass them with each render call
 */
app.locals.FACEBOOK_ID = process.env.FACEBOOK_ID ? process.env.FACEBOOK_ID : null;
app.locals.GOOGLE_ANALYTICS_ID = process.env.GOOGLE_ANALYTICS_ID ? process.env.GOOGLE_ANALYTICS_ID : null;
app.locals.FACEBOOK_PIXEL_ID = process.env.FACEBOOK_PIXEL_ID ? process.env.FACEBOOK_PIXEL_ID : null;

/**
 * Primary app routes.
 */
app.get('/', passportConfig.isApproved, requireRole('admin', 'manager', 'staff'), homeController.index);
app.get('/access', (req, res) => {
  if (req.user) return res.redirect('/');
  res.render('access', { title: 'Get Access' });
});
app.get('/apply', applyController.getApply);
app.post('/apply', strictLimiter, applyController.postApply);
app.get('/pending-approval', passportConfig.isAuthenticated, (req, res) => {
  res.render('pending-approval', { title: 'Application Pending' });
});
app.get('/login', userController.getLogin);
app.post('/login', loginLimiter, userController.postLogin);
app.get('/login/verify/:token', loginLimiter, userController.getLoginByEmail);
app.get('/login/2fa', login2FALimiter, userController.getTwoFactor);
app.post('/login/2fa', login2FALimiter, userController.postTwoFactor);
app.post('/login/2fa/resend', strictLimiter, userController.resendTwoFactorCode);
app.get('/login/2fa/totp', login2FALimiter, userController.getTotpVerify);
app.post('/login/2fa/totp', login2FALimiter, userController.postTotpVerify);
app.post('/login/webauthn-start', loginLimiter, webauthnController.postLoginStart);
app.get('/login/webauthn-start', (req, res) => res.redirect('/login')); // webauthn-start requires a POST
app.post('/login/webauthn-verify', loginLimiter, webauthnController.postLoginVerify);
app.get('/logout', userController.logout);
app.get('/forgot', userController.getForgot);
app.post('/forgot', strictLimiter, userController.postForgot);
app.get('/reset/:token', userController.getReset);
app.post('/reset/:token', loginLimiter, userController.postReset);
app.get('/signup', userController.getSignup);
app.post('/signup', userController.postSignup);
app.get('/contact', strictLimiter, contactController.getContact);
app.post('/contact', contactController.postContact);
app.get('/account/verify', passportConfig.isAuthenticated, userController.getVerifyEmail);
app.get('/account/verify/:token', passportConfig.isAuthenticated, userController.getVerifyEmailToken);
app.get('/account', passportConfig.isAuthenticated, userController.getAccount);
app.post('/account/profile', passportConfig.isAuthenticated, userController.postUpdateProfile);
app.post('/account/password', passportConfig.isAuthenticated, userController.postUpdatePassword);
app.post('/account/2fa/email/enable', passportConfig.isAuthenticated, userController.postEnable2FA);
app.post('/account/2fa/email/remove', passportConfig.isAuthenticated, userController.postRemoveEmail2FA);
app.get('/account/2fa/totp/setup', passportConfig.isAuthenticated, userController.getTotpSetup);
app.post('/account/2fa/totp/setup', passportConfig.isAuthenticated, userController.postTotpSetup);
app.post('/account/2fa/totp/remove', passportConfig.isAuthenticated, userController.postRemoveTotp);
app.post('/account/delete', passportConfig.isAuthenticated, userController.postDeleteAccount);
app.post('/account/logout-everywhere', passportConfig.isAuthenticated, userController.postLogoutEverywhere);
app.get('/account/unlink/:provider', passportConfig.isAuthenticated, userController.getOauthUnlink);
app.post('/account/webauthn/register', passportConfig.isAuthenticated, webauthnController.postRegisterStart);
app.get('/account/webauthn/register', (req, res) => res.redirect('/account')); // webauthn/register start requires a POST
app.post('/account/webauthn/verify', passportConfig.isAuthenticated, webauthnController.postRegisterVerify);
app.post('/account/webauthn/remove', passportConfig.isAuthenticated, webauthnController.postRemove);

/**
 * OAuth authentication failure handler (common for all providers)
 * passport.js requires a static route for failureRedirect.
 * With this auth failure handler, we can decide where to redirect the user
 * and avoid infinite loops in cases when they navigate to a route
 * protected by isAuthorized and the user is not authorized.
 */
app.get('/auth/failure', (req, res) => {
  // Check if a flash message for 'errors' already exists in the session (do not consume it)
  const hasErrorFlash = req.session && req.session.flash && req.session.flash.errors && req.session.flash.errors.length > 0;

  if (!hasErrorFlash) {
    req.flash('errors', { msg: 'Authentication failed or provider account is already linked.' });
  }
  const { returnTo, baseReturnTo } = req.session;
  req.session.returnTo = undefined;
  req.session.baseReturnTo = undefined;
  const redirectTarget = baseReturnTo || returnTo;

  if (!redirectTarget || !isSafeRedirect(redirectTarget) || redirectTarget === req.originalUrl || redirectTarget.startsWith('/auth/')) {
    return res.redirect('/');
  }
  res.redirect(redirectTarget);
});

/**
 * OAuth authentication routes. (Sign in)
 */
app.get('/auth/google', passport.authenticate('google'));
app.get('/auth/google/callback', passport.authenticate('google', { failureRedirect: '/auth/failure' }), (req, res) => {
  res.redirect(req.session.returnTo || '/');
});

/**
 * Error Handler.
 */
app.use((req, res, next) => {
  const err = new Error('Not Found');
  err.status = 404;
  res.status(404).send('Page Not Found');
});

if (process.env.NODE_ENV === 'development') {
  // only use in development
  app.use(errorHandler());
} else {
  app.use((err, req, res, next) => {
    logger.error(err);
    res.status(500).send('Server Error');
  });
}

/**
 * Start Express server.
 */
app.listen(app.get('port'), () => {
  const { BASE_URL } = process.env;
  const colonIndex = BASE_URL.lastIndexOf(':');
  const port = parseInt(BASE_URL.slice(colonIndex + 1), 10);

  if (!BASE_URL.startsWith('http://localhost')) {
    logger.warn(`The BASE_URL environment variable is set to ${BASE_URL}. If you open the app directly at http://localhost:${app.get('port')} instead of via your HTTPS-terminating endpoint, CSRF checks may fail and OAuth sign-in will be rejected due to a redirect mismatch.`);
  } else if (app.get('port') !== port) {
    logger.warn(`BASE_URL port mismatch. BASE_URL: ${BASE_URL}, app port: ${app.get('port')}`);
  }

  logger.info(`App is running on http://localhost:${app.get('port')} in ${app.get('env')} mode.`);
});

module.exports = app;
