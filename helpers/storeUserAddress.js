const jwt = require('jsonwebtoken');

const users = require('../models/Alenvi/users');
const { tokenConfig } = require('../config/config');

exports.storeUserAddress = async (session) => {
  try {
    session.userData.alenvi.facebook = session.userData.alenvi.facebook || {};
    session.userData.alenvi.facebook.address = session.message.address;
    const userAddress = session.userData.alenvi.facebook.address;
    const payload = {
      _id: session.userData.alenvi._id
    };
    const accessToken = jwt.sign(payload, tokenConfig.secret, { expiresIn: tokenConfig.expiresIn });
    await users.storeUserAddress(payload._id, accessToken, userAddress);
    console.log('Storing user address in DB...');
  } catch (e) {
    console.error(e.message);
  }
};
