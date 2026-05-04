const { verifyToken } = require('../auth/tokenService');

function authRequired(req, res, next) {
  const header = req.headers.authorization || '';
  if (!header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'UNAUTHORIZED' });
  }
  const token = header.slice(7);
  try {
    const payload = verifyToken(token);
    req.user = { id: payload.sub, email: payload.email };
    return next();
  } catch (err) {
    const code = err.code || 'UNAUTHORIZED';
    return res.status(401).json({ error: code });
  }
}

module.exports = { authRequired };
