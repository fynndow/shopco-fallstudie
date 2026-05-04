const { registerUser, loginUser, requestPasswordReset, confirmPasswordReset } = require('./authService');

async function register(req, res, next) {
  try {
    const result = await registerUser(req.body || {});
    res.status(201).json(result);
  } catch (err) { next(err); }
}

async function login(req, res, next) {
  try {
    const result = await loginUser(req.body || {});
    res.status(200).json(result);
  } catch (err) { next(err); }
}

async function forgotPassword(req, res, next) {
  try {
    await requestPasswordReset((req.body || {}).email || '');
    res.status(202).json({ ok: true });
  } catch (err) { next(err); }
}

async function resetPassword(req, res, next) {
  try {
    await confirmPasswordReset(req.body || {});
    res.status(200).json({ ok: true });
  } catch (err) { next(err); }
}

async function me(req, res) {
  res.status(200).json({ user: req.user });
}

module.exports = { register, login, forgotPassword, resetPassword, me };
