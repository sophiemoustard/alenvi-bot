const Ogust = require('../../config').Ogust;
const rp = require('request-promise');

/*
** Get a customer by customer id
** PARAMS:
** - token: token after login
** - id: customer id
** Method: POST
*/
exports.getCustomerByCustomerId = async (token, id, pageOption) => {
  const options = {
    url: `${Ogust.API_LINK}getCustomer`,
    json: true,
    body: {
      token,
      nbperpage: pageOption.nbPerPage,
      pagenum: pageOption.pageNum,
      id_customer: id,
    },
    resolveWithFullResponse: true,
    time: true,
  };
  const res = await rp.post(options);
  if (res.body.status == 'KO') {
    throw new Error(`Error while getting customer by id: ${res.body.message}`);
  }
  return res;
};

exports.getThirdPartyInformationsByCustomerId = async (token, id, pageOption) => {
  const options = {
    url: `${Ogust.API_LINK}getThirdPartyInformations`,
    json: true,
    body: {
      token,
      nbperpage: pageOption.nbPerPage,
      pagenum: pageOption.pageNum,
      third_party: 'C',
      third_party_id: id,
    },
    resolveWithFullResponse: true,
    time: true,
  };
  const res = await rp.post(options);
  if (res.body.status == 'KO') {
    throw new Error(`Error while getting third party info by customer by id: ${res.body.message}`);
  }
  return res;
};
