// application/pdf

const builder = require('botbuilder');
const moment = require('moment-timezone');

const checkOgustToken = require('../helpers/checkOgustToken').checkToken;

const salaries = require('../models/Ogust/salaries');

// =========================================================
// Pay sheets dialog
// =========================================================

const getCardsAttachments = async (session) => {
  const mySalariesRaw = await salaries.getSalariesByEmployeeId(
    session.userData.ogust.tokenConfig.token,
    session.userData.alenvi.employee_id, { nbPerPage: 24, pageNum: 1 });
  const mySalaries = mySalariesRaw.body.array_salary.result;
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
