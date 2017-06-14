const Ogust = require('../config').Ogust;
const rp = require('request-promise');

/** ******** SALARIES **********/

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
exports.getSalariesByEmployeeId = (token, id, pageOption) => {
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
  rp.post(options);
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
exports.getSalaries = (token, pageOption) => {
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
  rp.post(options);
};
