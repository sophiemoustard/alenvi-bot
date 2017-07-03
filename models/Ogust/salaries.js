const Ogust = require('../../config').Ogust;
const rp = require('request-promise');

/*
** Get salaries by employee id
** PARAMS:
** - token: token after login
** - id: employee id
** - pageOption:
** --- nbPerPage: X (number of results returned per pages)
** --- pageNum: Y (number of pages)
** METHOD: POST
*/
exports.getSalariesByEmployeeId = async (token, id, pageOption) => {
  const options = {
    url: `${Ogust.API_LINK}searchSalary`,
    json: true,
    body: {
      token,
      id_employee: id,
      nbperpage: pageOption.nbPerPage,
      pagenum: pageOption.pageNum,
    },
    resolveWithFullResponse: true,
    time: true,
  };
  const res = await rp.post(options);
  if (res.body.status == 'KO') {
    throw new Error(`Error while getting salaries by employee id: ${res.body.message}`);
  }
  return res;
};

/*
** Get all salaries
** PARAMS:
** - token: token after login
** - pageOption:
** --- nbPerPage: X (number of results returned per pages)
** --- pageNum: Y (number of pages)
** METHOD: POST
*/
exports.getSalaries = async (token, pageOption) => {
  const options = {
    url: `${Ogust.API_LINK}searchSalary`,
    json: true,
    body: {
      token,
      nbperpage: pageOption.nbPerPage,
      pagenum: pageOption.pageNum,
    },
    resolveWithFullResponse: true,
    time: true,
  };
  const res = await rp.post(options);
  if (res.body.status == 'KO') {
    throw new Error(`Error while getting salaries: ${res.body.message}`);
  }
  return res;
};
