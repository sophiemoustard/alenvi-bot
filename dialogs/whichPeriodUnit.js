const builder = require('botbuilder');

const checkOgustToken = require('../helpers/checkOgustToken').checkToken;
const planning = require('../helpers/planning/treatment.js');

const whichPeriodUnit = async (session, args) => {
  try {
    session.sendTyping();
    await checkOgustToken(session);
    const periodList = {
      PerDay: 'Quel jour ?',
      PerWeek: 'Quelle semaine ?',
      PerMonth: 'Quel mois ?'
    };
    session.dialogData.offset = args.offset || 0;
    session.dialogData.periodChosen = args.periodChosen || '';
    session.dialogData.personChosen = args.personChosen || '';
    session.dialogData.personType = args.personType || '';
    session.dialogData.periodUnit = planning.getPeriodByOffset(session.dialogData.offset, session.dialogData.periodChosen);
    builder.Prompts.choice(session, periodList[session.dialogData.periodChosen.name], session.dialogData.periodUnit, { maxRetries: 0 });
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
    return planning.getPlanningByPeriodChosen(session, results);
  }
  return session.cancelDialog(0, '/not_understand');
};

exports.whichPeriodUnit = [whichPeriodUnit, handlePeriodUnit];
