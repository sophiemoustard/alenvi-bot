const rp = require('request-promise');

exports.storeUserAddress = async (id, token, payload) => {
  const options = {
    url: `${process.env.API_HOSTNAME}/users/${id}/storeAddress`,
    json: true,
    headers: {
      'x-access-token': token
    },
    body: {
      payload
    },
    resolveWithFullResponse: true,
    time: true,
  };
  const res = await rp.put(options);
  if (res.body.success == false) {
    throw new Error(`Error while storing user address: ${res.body.message}`);
  }
  // return res;
};

exports.getAlenviUserById = async (id) => {
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

exports.getAlenviUsers = async (token, params) => {
  const options = {
    url: `${process.env.API_HOSTNAME}/users`,
    json: true,
    qs: params,
    resolveWithFullResponse: true,
    time: true,
  };
  const res = await rp.get(options);
  if (res.body.success == false) {
    throw new Error(`Error while getting infos from Alenvi users: ${res.body.message}`);
  }
  return res;
};

exports.updateAlenviUserById = async (id, token, payload) => {
  const options = {
    url: `${process.env.API_HOSTNAME}/users/${id}`,
    json: true,
    headers: {
      'x-access-token': token
    },
    body: payload,
    resolveWithFullResponse: true,
    time: true,
  };
  const res = await rp.put(options);
  if (res.body.success == false) {
    throw new Error(`Error while updating Alenvi user info: ${res.body.message}`);
  }
  return res;
};
