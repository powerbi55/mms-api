// middleware/auth.middleware.js
const jwt = require('jsonwebtoken');
const jwtConfig = require('../config/jwt');

module.exports = (req, res, next) => {
  const auth = req.headers.authorization;
  if (!auth) {
    return res.status(401).json({ message: 'No token' });
  }

  const token = auth.split(' ')[1];

  try {
    const decoded = jwt.verify(token, jwtConfig.secret);
    console.log('JWT DECODED >>>', decoded);
    req.user = decoded; // { id, role }
    next();
  } catch (err) {
    res.status(401).json({ message: 'Invalid token' });
  }
};
