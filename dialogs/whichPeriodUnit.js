const builder = require('botbuilder');

const checkOgustToken = require('../helpers/checkOgustToken').checkToken;
const planning = require('../helpers/planning/treatment.js');

const whichPeriodUnit = async (session, args) => {
  try {
    await checkOgustToken(session);
    session.sendTyping();
    session.dialogData.offset = args.offset || 0;
    session.dialogData.periodChosen = args.periodChosen || '';
    session.dialogData.personChosen = args.personChosen || '';
    session.dialogData.personType = args.personType || '';
    console.log(session.dialogData);
    session.dialogData.periodUnit = planning.getPeriodByOffset(session.dialogData.offset, session.dialogData.periodChosen);
    builder.Prompts.choice(session, 'Quand exactement ?', session.dialogData.periodUnit, { maxRetries: 0 });
  } catch (err) {
    console.error(err);
    return session.endDialog("Oups, j'ai eu un problème pour récupérer le planning exacte :/ Si le problème persiste, essaie de contacter l'équipe technique !");
  }
};

const handlePeriodUnit = (session, results) => {
  const params = {};
  params.personChosen = session.dialogData.personChosen;
  params.personType = session.dialogData.personType;
  params.periodChosen = session.dialogData.periodChosen;
  if (results.response) {
    if (results.response.entity === 'Précédent') {
      params.offset = --session.dialogData.offset;
      return session.replaceDialog('/which_period_unit', params);
    } else if (results.response.entity === 'Suivant') {
      params.offset = ++session.dialogData.offset;
      return session.replaceDialog('/which_period_unit', params);
    }
    return planning.getPlanningByChosenDay(session, results);
    // if (session.dialogData.periodUnit[results.response.entity]) {
    //   switch (session.dialogData.personType) {
    //     case 'Self':
    //     case 'Auxiliary':
    //     case 'Customer':
    //       return planning.getPlanningByChosenDay(session, results);
    //     case 'Community':
    //       return planning.getCommunityPlanningByChosenDay(session, results);
    //   }
    // }
  }
  return session.cancelDialog(0, '/not_understand');
};

exports.whichPeriodUnit = [whichPeriodUnit, handlePeriodUnit];
