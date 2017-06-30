const Ogust = require('../../config').Ogust;
const rp = require('request-promise');

/*
** Get all employees
** PARAMS:
** - token: token after login
** Method: POST
*/
exports.getEmployees = async (token, pageOption) => {
  const options = {
    url: `${Ogust.API_LINK}searchEmployee`,
    json: true,
    body: {
      token,
      nbperpage: pageOption.nbPerPage,
      pagenum: pageOption.pageNum,
      status: 'A'
    },
    resolveWithFullResponse: true,
    time: true,
  };
  const res = await rp.post(options);
  if (res.body.status == 'KO') {
    throw new Error(`Error while getting employees: ${res.body.message}`);
  }
  return res;
};

/*
** Get an employee by employee id
** PARAMS:
** - token: token after login
** - id: employee id
** Method: POST
*/
exports.getEmployeeById = async (token, id, pageOption) => {
  const options = {
    url: `${Ogust.API_LINK}getEmployee`,
    json: true,
    body: {
      token,
      nbperpage: pageOption.nbPerPage,
      pagenum: pageOption.pageNum,
      id_employee: id,
      status: 'A',
    },
    resolveWithFullResponse: true,
    time: true,
  };
  const res = await rp.post(options);
  if (res.body.status == 'KO') {
    throw new Error(`Error while getting employee by id: ${res.body.message}`);
  }
  return res;
};

/*
** Get employees by sector
** PARAMS:
** - token: token after login
** - sector: employee sector
** - pageOption:
** --- nbPerPage: X (number of results returned per pages)
** --- pageNum: Y (number of pages)
** METHOD: POST
*/
exports.getEmployeesBySector = async (token, sector, pageOption) => {
  const options = {
    url: `${Ogust.API_LINK}searchEmployee`,
    json: true,
    body: {
      token,
      nbperpage: pageOption.nbPerPage,
      pagenum: pageOption.pageNum,
      sector, // "1b*" for testing purpose, sector in prod
      status: 'A', // = "Actif"
      nature: 'S' // = "Salarié"
    },
    resolveWithFullResponse: true,
    time: true,
  };
  const res = await rp.post(options);
  if (res.body.status == 'KO') {
    throw new Error(`Error while getting employees by sector: ${res.body.message}`);
  }
  return res;
};
