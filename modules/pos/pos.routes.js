const express = require('express');
const router = express.Router();
const posController = require('./pos.controller');

// Example route
router.get('/', posController.index);

module.exports = {
  basePath: '/pos',
  router,
};
