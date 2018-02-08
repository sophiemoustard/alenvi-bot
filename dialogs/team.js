const builder = require('botbuilder');
const _ = require('lodash');

const checkOgustToken = require('../helpers/checkOgustToken').checkToken;
// const { getTeamBySector } = require('../helpers/team');
const { getAlenviUsers } = require('../models/Alenvi/users');
const { getList } = require('../models/Ogust/getList');

const whichDirectory = async (session) => {
  session.sendTyping();
  await checkOgustToken(session);
  builder.Prompts.choice(session, 'Quelle personne souhaites-tu contacter ?', 'Mon équipe|Autres communautés|Alenvi bureau', { maxRetries: 0 });
};

const redirectToDirectorySelected = (session, results) => {
  if (results.response) {
    if (session.userData.alenvi) {
      switch (results.response.entity) {
        case 'Mon équipe':
          session.replaceDialog('/show_team', { team: true });
          break;
        case 'Autres communautés':
          session.replaceDialog('/show_sector_team');
          break;
        case 'Alenvi bureau':
          session.replaceDialog('/show_team', { staff: true });
          break;
      }
    } else {
      return session.endDialog('Tu dois te connecter pour accéder à cette fonctionnalité ! :)');
    }
  } else {
    session.cancelDialog(0, '/not_understand');
  }
};

exports.selectDirectory = [whichDirectory, redirectToDirectorySelected];

const whichSector = async (session) => {
  try {
    session.sendTyping();
    await checkOgustToken(session);
    const sectorsRaw = await getList(session.userData.ogust.tokenConfig.token, 'employee.sector');
    const sectors = sectorsRaw.body.list;
    const formattedSectors = {};
    for (const k in sectors) {
      if (k !== '*' && k !== session.userData.alenvi.sector) {
        formattedSectors[sectors[k]] = k;
      }
    }
    session.dialogData.sectors = formattedSectors;
    builder.Prompts.choice(session, 'Quelle communauté précisément ?', formattedSectors, { listStyle: builder.ListStyle.button, maxRetries: 0 });
  } catch (err) {
    console.error(err);
    return session.endDialog("Flûte, impossible de récupérer la liste des communautés pour le moment :/ Réessaie, et si le problème persiste n'hésite pas à contacter l'équipe technique !");
  }
};

const formatPerson = async (coworker) => {
  let person = {};
  if (!coworker.firstname) {
    person = coworker.lastname;
  } else {
    person = `${coworker.firstname} ${coworker.lastname}`;
  }
  return person;
};

const getCardsAttachments = async (session, params) => {
  const myCards = [];
  // const myRawTeam = await getTeamBySector(session, session.userData.alenvi.sector);
  const myRawTeam = await getAlenviUsers(session.userData.alenvi.token, params);
  const myTeam = myRawTeam.body.data.users;
  const mySortedTeam = _.sortBy(myTeam, ['lastname']);
  const lengthTeam = mySortedTeam.length;
  for (let i = 0; i < lengthTeam; i++) {
    if (mySortedTeam[i].employee_id == session.userData.alenvi.employee_id && lengthTeam === 1) {
      return session.endDialog('Il semble que tu sois le premier membre de ta communauté ! :)');
    }
    if (mySortedTeam[i].employee_id != session.userData.alenvi.employee_id && mySortedTeam[i].firstname !== 'Admin' && mySortedTeam[i].firstname !== 'Pigi') {
      const person = await formatPerson(mySortedTeam[i]);
      const mobilePhone = mySortedTeam[i].mobilePhone || null;
      // const contact = mySortedTeam[i].facebook && mySortedTeam[i].facebook.address ? `https://m.me/${mySortedTeam[i].facebook.address.user.id}` : null;
      const picture = mySortedTeam[i].picture || 'https://cdn.head-fi.org/g/2283245_l.jpg';
      const buttons = [];
      // if (contact) {
      //   buttons.push(builder.CardAction.openUrl(session, contact, 'Contacter'));
      // }
      if (mobilePhone) {
        buttons.push(builder.CardAction.openUrl(session, `tel:+33${mobilePhone}`, '📱 Contacter'));
      }
      myCards.push(
        new builder.ThumbnailCard(session)
          .title(person)
          // .text(mobilePhone)
          .images([
            builder.CardImage.create(session, picture)
          ])
          .buttons(buttons)
      );
    }
  }
  return myCards;
};

const showMyTeam = async (session, results) => {
  try {
    session.sendTyping();
    await checkOgustToken(session);
    const queryParams = {};
    console.log('RESULTS', results);
    if (results.response) {
      if (session.dialogData.sectors) {
        queryParams.sector = session.dialogData.sectors[results.response.entity];
        queryParams.role = 'Auxiliaire';
      }
    } else if (results.staff) {
      queryParams.sector = '*';
    } else if (results.team) {
      queryParams.sector = session.userData.alenvi.sector;
    } else {
      session.cancelDialog(0, '/not_understand');
    }
    const cards = await getCardsAttachments(session, queryParams);
    const message = new builder.Message(session)
      .attachmentLayout(builder.AttachmentLayout.carousel)
      .attachments(cards);
    session.endDialog(message);
  } catch (err) {
    console.error(err);
    return session.endDialog("Oh non, je n'ai pas réussi à récupérer ton équipe :/ Si le problème persiste, essaie de contacter un administrateur !");
  }
};

exports.showTeam = [showMyTeam];
exports.showSectorTeam = [whichSector, showMyTeam];
