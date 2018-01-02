const rp = require('request-promise');

/*
** Get all employees
** PARAMS:
** - token: token after login
** Method: GET
*/
exports.getEmployees = async (params) => {
  console.log(params);
  const options = {
    url: `${process.env.API_HOSTNAME}/ogust/employees`,
    json: true,
    headers: {
      'x-ogust-token': params.token
    },
    qs: {
      nbperpage: params.nbPerPage,
      pagenum: params.pageNum,
      status: params.status || 'A',
      mobile_phone: params.mobile_phone
    },
    resolveWithFullResponse: true,
    time: true,
  };
  const res = await rp.get(options);
  if (res.body.success == false) {
    throw new Error(`Error while getting employees: ${res.body.message}`);
  }
  return res;
};

/*
** Get an employee by employee id
** PARAMS:
** - token: token after login
** - id: employee id
** Method: GET
*/
exports.getEmployeeById = async (token, id, pageOption) => {
  const options = {
    url: `${process.env.API_HOSTNAME}/ogust/employees/${id}`,
    json: true,
    headers: {
      'x-ogust-token': token
    },
    qs: {
      nbperpage: pageOption.nbPerPage,
      pagenum: pageOption.pageNum,
      status: 'A'
    },
    resolveWithFullResponse: true,
    time: true,
  };
  const res = await rp.get(options);
  if (res.body.success == false) {
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
** METHOD: GET
*/
exports.getEmployeesBySector = async (token, sector, pageOption) => {
  const options = {
    url: `${process.env.API_HOSTNAME}/ogust/employees/sector/${sector}`,
    json: true,
    headers: {
      'x-ogust-token': token
    },
    qs: {
      nbperpage: pageOption.nbPerPage,
      pagenum: pageOption.pageNum,
      status: 'A',
      nature: 'S'
    },
    resolveWithFullResponse: true,
    time: true,
  };
  const res = await rp.get(options);
  if (res.body.success == false) {
    throw new Error(`Error while getting employees by sector: ${res.body.message}`);
  }
  return res;
};

exports.getCustomers = async (token, id) => {
  const options = {
    url: `${process.env.API_HOSTNAME}/ogust/employees/${id}/customers`,
    json: true,
    headers: {
      'x-ogust-token': token
    },
    resolveWithFullResponse: true,
    time: true,
  };
  const res = await rp.get(options);
  if (res.body.success == false) {
    throw new Error(`Error while getting employee's customers: ${res.body.message}`);
  }
  return res;
};


/*
** Get salaries by employee id
** PARAMS:
** - token: token after login
** - id: employee id
** - pageOption:
** --- nbPerPage: X (number of results returned per pages)
** --- pageNum: Y (number of pages)
** METHOD: GET
*/
exports.getSalaries = async (token, id, pageOption) => {
  const options = {
    url: `${process.env.API_HOSTNAME}/ogust/employees/${id}/salaries`,
    json: true,
    headers: {
      'x-ogust-token': token
    },
    qs: {
      id_employee: id,
      nbperpage: pageOption.nbPerPage,
      pagenum: pageOption.pageNum
    },
    resolveWithFullResponse: true,
    time: true,
  };
  const res = await rp.get(options);
  if (res.body.success == false) {
    throw new Error(`Error while getting salaries by employee id: ${res.body.message}`);
  }
  return res;
};

/*
** Get services by employee id
** PARAMS:
** - token: token after login
** - id: employee id
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
exports.getServices = async (token, id, payload) => {
  const options = {
    url: `${process.env.API_HOSTNAME}/ogust/employees/${id}/services/`,
    json: true,
    headers: {
      'x-ogust-token': token
    },
    qs: {
      isRange: payload.isRange,
      isDate: payload.isDate,
      slotToSub: payload.slotToSub,
      slotToAdd: payload.slotToAdd,
      intervalType: payload.intervalType,
      startDate: payload.startDate,
      endDate: payload.endDate,
      status: payload.status,
      type: payload.type,
      idCustomer: payload.idCustomer
      // nbPerPage: payload.pageOption.nbPerPage,
      // pageNum: payload.pageOption.pageNum
    },
    resolveWithFullResponse: true,
    time: true,
  };
  const res = await rp.get(options);
  if (res.body.success == false) {
    throw new Error(`Error while getting services by employee id: ${res.body.message}`);
  }
  return res;
};
