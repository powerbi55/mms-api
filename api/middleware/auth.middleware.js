// middleware/auth.middleware.js
const jwt = require('jsonwebtoken');
const jwtConfig = require('../config/jwt');

module.exports = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ ok: false, message: 'No token' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, jwtConfig.secret);

    // ✅ decoded มี user_id, pns_id, role, dep_id
    req.user = {
      user_id: decoded.user_id,
      pns_id: decoded.pns_id,
      role: decoded.role,
      dep_id: decoded.dep_id
    };

    next();
  } catch (err) {
    return res.status(401).json({ ok: false, message: 'Invalid token' });
  }
};
