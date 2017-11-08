const users = require('../models/Alenvi/users');

exports.storeUserAddress = async (session) => {
  try {
    session.userData.alenvi.facebook = session.userData.alenvi.facebook || {};
    session.userData.alenvi.facebook.address = session.message.address;
    const userAddress = session.userData.alenvi.facebook.address;
    await users.storeUserAddress(session.userData.alenvi._id, session.userData.alenvi.token, userAddress);
    console.log('Storing user address in DB...');
  } catch (e) {
    console.error(e.message);
  }
};
