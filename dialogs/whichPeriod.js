const builder = require('botbuilder');

const checkOgustToken = require('../helpers/checkOgustToken').checkToken;

const planning = require('../helpers/planning/treatment.js');

const whichPeriod = async (session, args) => {
  try {
    await checkOgustToken(session);
    session.sendTyping();
    session.dialogData.offset = args.offset || 0;
    session.dialogData.personChosen = args.personChosen || '';
    session.dialogData.personType = args.personType || '';
    session.dialogData.period = planning.getPeriodByOffset(session.dialogData.offset, 'weeks');
    let targetPlanning = '';
    switch (session.dialogData.personChosen) {
      case 'Self':
        targetPlanning = 'ton planning';
        break;
      case 'Auxiliary':
      case 'Customer':
        targetPlanning = 'son planning';
        break;
      case 'Community':
        targetPlanning = 'le planning de ta communauté';
        break;
    }
    builder.Prompts.choice(session, `Pour quel jour souhaites-tu consulter ${targetPlanning} ?`, session.dialogData.period, { maxRetries: 0 });
  } catch (err) {
    console.error(err);
    return session.endDialog("Mince, je n'ai pas réussi à récupérer ton autorisation pour obtenir ces informations :/ Si le problème persiste, essaie de contacter l'équipe technique !");
  }
};

const handlePeriodOrGetPlanningSelected = (session, results) => {
  const params = {};
  if (results.response) {
    // Use args to save week's offset in the new dialog => dialogData is unset in each new one
    params.personChosen = session.dialogData.personChosen;
    params.personType = session.dialogData.personType;
    if (results.response.entity === 'Précédent') {
      params.offset = --session.dialogData.offset;
      return session.replaceDialog('/which_period', params);
    } else if (results.response.entity === 'Suivant') {
      params.offset = ++session.dialogData.offset;
      return session.replaceDialog('/which_period', params);
    }
    if (session.dialogData.period[results.response.entity]) {
      switch (session.dialogData.personType) {
        case 'Self':
        case 'Auxiliary':
        case 'Customer':
          return planning.getPlanningByChosenDay(session, results);
        case 'Community':
          return planning.getCommunityPlanningByChosenDay(session, results);
      }
    }
  } else {
    return session.cancelDialog(0, '/not_understand');
  }
};

exports.whichPeriod = [whichPeriod, handlePeriodOrGetPlanningSelected];
