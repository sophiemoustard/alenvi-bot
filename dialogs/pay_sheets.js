// application/pdf

const builder = require('botbuilder');
const moment = require('moment-timezone');

const checkOgustToken = require('../helpers/checkOgustToken').checkToken;

const employees = require('../models/Ogust/employees');

// =========================================================
// Pay sheets dialog
// =========================================================

const getCardsAttachments = async (session) => {
  const mySalariesRaw = await employees.getSalaries(
    session.userData.ogust.tokenConfig.token,
    session.userData.alenvi.employee_id, { nbPerPage: 24, pageNum: 1 });
  const mySalaries = mySalariesRaw.body.data.salaries.array_salary.result;
  if (Object.keys(mySalaries).length == 0) {
    session.endDialog(`Tu n'as pour le moment aucun bulletin de salaire !`);
  }
  const cards = [];
  moment.locale('fr');
  for (const k in mySalaries) {
    cards.push(
      new builder.HeroCard(session)
        .title(`Bulletin ${moment.tz(mySalaries[k].period_start, 'YYYYMMDDHHmm', 'Europe/Paris').format('MMM YYYY')}`)
        .buttons([
          builder.CardAction.openUrl(session, mySalaries[k].print_url, 'Visionner')
        ])
    );
  }
  return cards;
};


const selectMonth = async (session) => {
  try {
    session.sendTyping();
    await checkOgustToken(session);
    const cards = await getCardsAttachments(session);
    const message = new builder.Message(session)
      .attachmentLayout(builder.AttachmentLayout.carousel)
      .attachments(cards);
    session.endDialog(message);
  } catch (err) {
    console.error(err);
    return session.endDialog("Je n'ai pas réussi à récupérer tes bulletins de paie :/ Si le problème persiste, contacte l'équipe technique !");
  }
};

exports.select = [selectMonth];
