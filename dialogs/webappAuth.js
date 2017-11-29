const jwt = require('jsonwebtoken');
const { getAlenviUserById } = require('../models/Alenvi/users');

exports.login = async (session) => {
  const token = session.message.sourceEvent.referral.ref;
  jwt.verify(token, process.env.TOKEN_SECRET, async (err, decoded) => {
    if (err) {
      console.error('ERROR VERIFY TOKEN');
      console.error(err);
      if (err.name === 'JsonWebTokenError') {
        session.endDialog('Il y a eu un problème avec ta demande :/');
      }
      if (err.name === 'TokenExpiredError') {
        session.endDialog('Ta demande a expiré !');
      }
    } else {
      try {
        console.log('DECODED !');
        console.log(decoded);
        const userId = decoded._id;
        const userDataAlenviRaw = await getAlenviUserById(userId);
        const userDataAlenvi = userDataAlenviRaw.body.data.user;
        session.userData.alenvi = {};
        session.userData.alenvi._id = userDataAlenvi._id;
        session.userData.alenvi.firstname = userDataAlenvi.firstname;
        session.userData.alenvi.lastname = userDataAlenvi.lastname;
        session.userData.alenvi.employee_id = userDataAlenvi.employee_id;
        session.userData.alenvi.sector = userDataAlenvi.sector;
        session.userData.alenvi.role = userDataAlenvi.role;
        session.userData.alenvi.token = userDataAlenvi.alenviToken;
        session.send(`Je t'ai bien reconnu ${session.userData.alenvi.firstname}, merci de t'être connecté(e) ! :)`);
        session.replaceDialog('/hello');
      } catch (e) {
        console.error(e);
        return session.endDialog('Il y a eu un problème avec ta demande :/');
      }
    }
  });
};
