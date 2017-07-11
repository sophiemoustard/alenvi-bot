const builder = require('botbuilder');

const checkOgustToken = require('../helpers/checkOgustToken').checkToken;

const whichPeriod = async (session, args) => {
  try {
    const targetPlanning = {
      Self: 'ton planning',
      Auxiliary: 'son planning',
      Customer: 'son planning',
      Community: 'le planning de ta communauté'
    };
    await checkOgustToken(session);
    session.sendTyping();
    session.dialogData.personChosen = args.personChosen || '';
    session.dialogData.personType = args.personType || '';
    builder.Prompts.choice(session, `Pour quelle période souhaites-tu consulter ${targetPlanning[session.dialogData.personType]} ?`, 'A la journée|A la semaine|Au mois', { maxRetries: 0 });
  } catch (err) {
    console.error(err);
    return session.endDialog("Mince, j'ai eu un problème lors de la récupération des différentes périodes disponibles :/ Si le problème persiste, essaie de contacter l'équipe technique !");
  }
};

const handlePeriod = (session, results) => {
  const params = {};
  const periodList = {
    'A la journée': { name: 'PerDay', type: 'weeks' },
    'A la semaine': { name: 'PerWeek', type: 'weeks' },
    'Au mois': { name: 'PerMonth', type: 'months' }
  };
  if (results.response) {
    params.offset = 0;
    params.personChosen = session.dialogData.personChosen;
    params.personType = session.dialogData.personType;
    params.periodChosen = periodList[results.response.entity];
    return session.replaceDialog('/which_period_unit', params);
  }
  return session.cancelDialog(0, '/not_understand');
};

exports.whichPeriod = [whichPeriod, handlePeriod];
