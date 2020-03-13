
const logoutHandler = (req, res) => {
  req.session.destroy();
  res.send('logout successfully!');
}

module.exports = {
  logoutHandler
};