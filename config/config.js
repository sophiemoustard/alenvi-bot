const tokenConfig = {
  secret: process.env.TOKEN_SECRET,
  expiresIn: '24h'
};

module.exports = { tokenConfig };
