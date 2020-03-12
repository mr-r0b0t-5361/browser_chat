
const auth = (req, res, next) => {
  if (req.session && req.session.admin) {
    return next();
  }
  res.sendStatus(401);
};

module.exports = {
  auth
};