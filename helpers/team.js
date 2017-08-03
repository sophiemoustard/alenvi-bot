const employee = require('../models/Ogust/employees');

exports.getTeamBySector = async (session, sector) => {
  const myTeamRaw = await employee.getEmployeesBySector(
    session.userData.ogust.tokenConfig.token, sector, { nbPerPage: 20, pageNum: 1 });
  const myTeam = myTeamRaw.body.data.users.array_employee.result;
  if (Object.keys(myTeam).length === 0) {
    return session.endDialog('Il semble que tu sois le pillier de ta communauté ! :)');
  }
  return myTeam;
};
