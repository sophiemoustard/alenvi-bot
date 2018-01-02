const rp = require('request-promise');

exports.storePlanningUpdate = async (id, token, payload) => {
  const options = {
    url: `${process.env.API_HOSTNAME}/planningUpdates?userId=${id}`,
    json: true,
    headers: {
      'x-access-token': token
    },
    body: {
      content: payload.content,
      type: payload.type,
      involved: payload.involved,
      check: payload.check ? payload.check : null
    },
    resolveWithFullResponse: true,
    time: true,
  };
  const res = await rp.post(options);
  if (res.body.success == false) {
    throw new Error(`Error while storing planning update: ${res.body.message}`);
  }
  // return res;
};
