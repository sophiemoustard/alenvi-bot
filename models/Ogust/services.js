const rp = require('request-promise');

exports.updateServiceById = async (token, serviceId, params) => {
  const options = {
    url: `${process.env.API_HOSTNAME}/ogust/services/${serviceId}`,
    json: true,
    headers: {
      'x-ogust-token': token
    },
    body: params,
    resolveWithFullResponse: true,
    time: true,
  };
  const res = await rp.put(options);
  if (res.body.success == false) {
    throw new Error(`Error while editing third party info by customer by id: ${res.body.message}`);
  }
  return res;
};
