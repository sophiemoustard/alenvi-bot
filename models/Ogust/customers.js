const rp = require('request-promise');

/*
** Get a customer by customer id
** PARAMS:
** - token: token after login
** - id: customer id
** Method: GET
*/
exports.getCustomerByCustomerId = async (token, id, pageOption) => {
  const options = {
    url: `${process.env.WEBSITE_HOSTNAME}/api/ogust/customers/${id}`,
    json: true,
    headers: {
      'x-ogust-token': token
    },
    qs: {
      nbperpage: pageOption.nbPerPage,
      pagenum: pageOption.pageNum,
    },
    resolveWithFullResponse: true,
    time: true,
  };
  const res = await rp.get(options);
  if (res.body.success == false) {
    throw new Error(`Error while getting customer by id: ${res.body.message}`);
  }
  return res;
};

exports.getThirdPartyInformationByCustomerId = async (token, id, thirdParty, pageOption) => {
  const options = {
    url: `${process.env.WEBSITE_HOSTNAME}/api/ogust/customers/${id}/moreInfo`,
    json: true,
    headers: {
      'x-ogust-token': token
    },
    qs: {
      nbperpage: pageOption.nbPerPage,
      pagenum: pageOption.pageNum,
      third_party: thirdParty
    },
    resolveWithFullResponse: true,
    time: true,
  };
  const res = await rp.get(options);
  if (res.body.success == false) {
    throw new Error(`Error while getting third party info by customer by id: ${res.body.message}`);
  }
  return res;
};

exports.editThirdPartyInformationByCustomerId = async (token, id, thirdParty, arrayValues) => {
  const options = {
    url: `${process.env.WEBSITE_HOSTNAME}/api/ogust/customers/${id}/moreInfo`,
    json: true,
    headers: {
      'x-ogust-token': token
    },
    qs: {
      third_party: thirdParty
    },
    body: {
      array_values: arrayValues
    },
    resolveWithFullResponse: true,
    time: true,
  };
  const res = await rp.put(options);
  if (res.body.success == false) {
    throw new Error(`Error while editing third party info by customer by id: ${res.body.message}`);
  }
  return res;
};

/*
** Get services by customer id
** PARAMS:
** - token: token after login
** - id: customer id
** - isRange: true / false
** - isDate: true / false
** - slotToSub (time in number to subtract),
** - slotToAdd (time in number to add)
** - intervalType: "day", "week", "year", "hour"...
** - dateStart: YYYYMMDDHHmm format
** - dateEnd: YYYYMMDDHHmm format
** - status: '@!=|N', 'R'...
** - type: 'I'...
** - pageOption:
** --- nbPerPage: X (number of results returned per pages)
** --- pageNum: Y (number of pages)
** METHOD: POST
*/
exports.getServices = async (token, id, isRange, isDate, slotToSub, slotToAdd, intervalType, startDate, endDate, status, type, pageOption) => {
  const options = {
    url: `${process.env.WEBSITE_HOSTNAME}/api/ogust/customers/${id}/services/`,
    json: true,
    headers: {
      'x-ogust-token': token
    },
    qs: {
      isRange,
      isDate,
      slotToSub,
      slotToAdd,
      intervalType,
      startDate,
      endDate,
      status,
      type,
      nbPerPage: pageOption.nbPerPage,
      pageNum: pageOption.pageNum
    },
    resolveWithFullResponse: true,
    time: true,
  };
  const res = await rp.get(options);
  if (res.body.success == false) {
    throw new Error(`Error while getting services by customer id: ${res.body.message}`);
  }
  return res;
};
