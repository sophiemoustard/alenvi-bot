const rp = require('request-promise');
const moment = require('moment-timezone');
const { storeUserAddress } = require('./storeUserAddress');

const getAlenviUserById = async (id) => {
  const options = {
    url: `${process.env.API_HOSTNAME}/bot/user/${id}`,
    json: true,
    resolveWithFullResponse: true,
    time: true,
  };
  const res = await rp.get(options);
  if (res.body.success == false) {
    throw new Error(`Error while refreshing infos from Alenvi: ${res.body.message}`);
  }
  return res;
};

const refreshAlenviToken = async (session) => {
  try {
    if (session.userData.alenvi.refreshToken) {
      const data = {};
      data.refreshToken = session.userData.alenvi.refreshToken;
      const newToken = await rp.post({
        url: `${process.env.API_HOSTNAME}/users/refreshToken`,
        json: true,
        resolveWithFullResponse: true,
        time: true,
        body: data
      });
      session.userData.alenvi.token = newToken.data.data.token;
      session.userData.alenvi.tokenExpiresIn = newToken.data.data.expiresIn;
      return false;
    }
    delete session.userData.alenvi.token;
    delete session.userData.alenvi.tokenExpiresIn;
  } catch (e) {
    console.error(e.response.message);
    if (e.response.status === 404) {
      delete session.userData.alenvi.token;
      delete session.userData.alenvi.refreshToken;
      delete session.userData.alenvi.tokenExpiresIn;
    }
    return false;
  }
};

const checkUserData = async (session) => {
  console.log('Refreshing Alenvi user data...');
  const userDataAlenviRaw = await getAlenviUserById(session.userData.alenvi._id);
  const userDataAlenvi = userDataAlenviRaw.body.data.user;
  session.userData.alenvi = userDataAlenvi;
  return session.userData.alenvi;
};

exports.checkToken = async (session) => {
  try {
    if (!session.userData.alenvi.refreshToken) {
      session.send("Il semble que tu ne fasses plus partie des employé(e)s d'Alenvi, je dois te déconnecter... Toute l'équipe te remercie d'avoir participé à l'aventure ! :)");
      delete session.userData.alenvi;
      session.replaceDialog('/logout_facebook');
    }
    if (session.userData.alenvi.token === '' || moment(moment().tz('Europe/Paris')).isAfter(session.userData.alenvi.expiresDate)) {
      await refreshAlenviToken(session);
    }
    await checkUserData(session);
    await storeUserAddress(session);
  } catch (err) {
    console.error(err);
    return session.endDialog("Oups ! Il y a eu une erreur au moment de rafraichir tes informations personnelles :/ Si ce problème persiste, n'hésite pas à contacter l'équipe technique !");
  }
};
