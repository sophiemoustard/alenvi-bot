const Ogust = require('../config').Ogust;
const rp = require('request-promise');

/*
** Get a customer by customer id
** PARAMS:
** - token: token after login
** - id: customer id
** Method: POST
*/
exports.getCustomerByCustomerId = (token, id, pageOption) => {
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
  return rp.post(options);
};
