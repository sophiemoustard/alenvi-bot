const builder = require('botbuilder');

const checkOgustToken = require('../helpers/checkOgustToken').checkToken;
const { getTeamBySector } = require('../helpers/team');
const { formatPromptListPersons } = require('../helpers/planning/format');
const { getCustomers } = require('./../models/Ogust/employees');

const whichPerson = async (session, args) => {
  try {
    let myRawPersons;
    let personTypeId;
    let promptMsg;
    session.dialogData.personType = args.personType || '';
    session.sendTyping();
    await checkOgustToken(session);
    switch (args.personType) {
      case 'Customer':
        myRawPersons = await getCustomers(session.userData.ogust.tokenConfig.token, session.userData.alenvi.employee_id);
        myRawPersons = myRawPersons.body.data.customers;
        if (myRawPersons.length == 0) {
          return session.endDialog(`Il semble que tu n'aies pas encore de bénéficiaire !`);
        }
        personTypeId = 'id_customer';
        promptMsg = 'Quel(le) bénéficiaire précisément ?';
        break;
      case 'Auxiliary':
        myRawPersons = await getTeamBySector(session, session.userData.alenvi.sector);
        personTypeId = 'id_employee';
        promptMsg = 'Quel(le) auxiliaire précisément ?';
        break;
      case 'Self':
        return session.replaceDialog('/which_period', { offset: '0', personChosen: '', personType: session.dialogData.personType });
      case 'Community':
        return session.replaceDialog('/which_period_unit', { offset: '0', personChosen: '', personType: session.dialogData.personType, periodChosen: { name: 'PerDay', type: 'weeks' } });
      case '':
        throw new Error('personType argument is empty');
      default:
        break;
    }
    session.dialogData.myPersons = await formatPromptListPersons(session, myRawPersons, personTypeId);
    builder.Prompts.choice(session, promptMsg, session.dialogData.myPersons, { maxRetries: 0 });
  } catch (err) {
    console.error(err);
    return session.endDialog("Mince, je n'ai pas réussi à récupérer les personnes correspondantes :/ Si le problème persiste, essaye de contacter l'équipe technique !");
  }
};

const redirectToWhichPeriod = (session, results) => {
  if (results.response) {
    if (session.dialogData.myPersons[results.response.entity]) {
      const params = {
        personChosen: session.dialogData.myPersons[results.response.entity],
        personType: session.dialogData.personType
      };
      return session.replaceDialog('/display_calendar', params);
      // return session.replaceDialog('/which_period', params);
    }
  } else {
    session.cancelDialog(0, '/not_understand');
  }
};

exports.whichPerson = [whichPerson, redirectToWhichPeriod];
