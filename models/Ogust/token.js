const rp = require('request-promise');

/** ******** AUTHENTIFICATION **********/

/*
** Get token from Ogust base
** Method: POST
*/
exports.getToken = async (token) => {
  const res = await rp.get({
    uri: `${process.env.WEBSITE_HOSTNAME}/api/ogust/token`,
    headers: {
      'x-access-token': token
    },
    json: true,
    resolveWithFullResponse: true,
    time: true,
  });
  if (res.body.status == 'KO') {
    throw new Error(`Error while getting employees: ${res.body.message}`);
  }
  return res;
};
