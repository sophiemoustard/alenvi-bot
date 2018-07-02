const users = require('../models/Alenvi/users');

exports.storeUserAddress = async (session) => {
  try {
    session.userData.alenvi.facebook = session.userData.alenvi.facebook || {};
    session.userData.alenvi.facebook.address = session.message.address;
    const userAddress = { facebook: session.userData.alenvi.facebook };
    console.log('Storing user address in DB...');
    await users.updateAlenviUserById(session.userData.alenvi._id, session.userData.alenvi.token, userAddress);
  } catch (e) {
    console.error(e.message);
  }
};
