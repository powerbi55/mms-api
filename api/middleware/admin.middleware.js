module.exports = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      ok: false,
      message: 'Unauthorized'
    });
  }

  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({
      ok: false,
      message: 'Admin permission required'
    });
  }

  next();
};
