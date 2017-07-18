const Ogust = require('../../config').Ogust;
const rp = require('request-promise');

exports.getList = async (token, key) => {
  const options = {
    url: `${Ogust.API_LINK}getList`,
    json: true,
    body: {
      token,
      key,
    },
    resolveWithFullResponse: true,
    time: true,
  };
  const res = await rp.post(options);
  if (res.body.status == 'KO') {
    throw new Error(`Error while getting list: ${res.body.message}`);
  }
  return res;
};
