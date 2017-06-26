const rp = require('request-promise');
const employee = require('../Ogust/employees');

const getAlenviUserById = (id) => {
  const options = {
    url: `${process.env.WEBSITE_HOSTNAME}/api/bot/user/${id}`,
    json: true,
    resolveWithFullResponse: true,
    time: true,
  };
  return rp.get(options);
};

/*
** Get user data from Ogust base and compare it to alenvi user data
** Method: POST
*/
exports.checkUserData = async (session) => {
  // Special update for Alenvi Guillaume / Clément / Thibault / Admin
  if (session.userData.alenvi.employee_id == 1 || session.userData.alenvi.employee_id == 2 ||
  session.userData.alenvi.employee_id == 3 || session.userData.alenvi.employee_id == 4) {
    const userDataAlenviRaw = await getAlenviUserById(session.userData.alenvi._id);
    const userDataAlenvi = userDataAlenviRaw.body.data.user;
    session.userData.alenvi.firstname = userDataAlenvi.firstname;
    session.userData.alenvi.lastname = userDataAlenvi.lastname;
    session.userData.alenvi.sector = userDataAlenvi.sector;
    session.userData.alenvi.role = userDataAlenvi.role;
    return session.userData.alenvi;
  }
  const userDataOgustRaw = await employee.getEmployeeById(
    session.userData.ogust.tokenConfig.token,
    session.userData.alenvi.employee_id,
    { nbPerPage: 1, pageNum: 1 }
  );
  if (userDataOgustRaw.body.status === 'KO') {
    throw new Error(`Error while checking user data: ${userDataOgustRaw.body.message}`);
  }
  // console.log(userDataRaw);
  const userDataOgust = userDataOgustRaw.body.employee;
  if (Object.keys(userDataOgust).length === 0) {
    session.send(`Il semble que tu ne fasses plus partie des employé(e)s d'Alenvi, je dois te déconnecter... Toute l'équipe te remercie d'avoir participé à l'aventure ! :)`);
    delete session.userData.alenvi;
    delete session.userData.ogust;
    session.replaceDialog('/logout_facebook');
  }
  const userDataAlenviRaw = await getAlenviUserById(session.userData.alenvi._id);
  const userDataAlenvi = userDataAlenviRaw.body;
  if (userDataOgust.id_customer) {
    session.userData.alenvi.customer_id = userDataOgust.id_customer;
  }
  if (userDataOgust.id_employee) {
    session.userData.alenvi.employee_id = userDataOgust.id_employee;
  }
  if (userDataOgust.first_name) {
    session.userData.alenvi.firstname = userDataOgust.first_name;
  }
  session.userData.alenvi.lastname = userDataOgust.last_name;
  session.userData.alenvi.sector = userDataOgust.sector;
  session.userData.alenvi.role = userDataAlenvi.role;
  console.log('USER DATA ALENVI =');
  console.log(session.userData.alenvi);
  return session.userData.alenvi;
};
