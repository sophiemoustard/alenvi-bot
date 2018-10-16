// =========================================================
// Hello when connected or not
// =========================================================

const builder = require('botbuilder');

exports.hello_first = [
  (session) => {
    session.sendTyping();
    if ((session.message.sourceEvent.postback && session.message.sourceEvent.postback.referral && session.message.sourceEvent.postback.referral.ref) || (session.message.sourceEvent.referral && session.message.sourceEvent.referral.ref)) {
      return session.replaceDialog('/autoLogin_webapp');
    }
    session.send("Hello ! Je m'appelle Compani, le petit robot qui facilite ton quotidien chez Alenvi 😉");
    session.send("Il semblerait que nous ne nous connaissions pas encore ! Peux-tu t'authentifier grâce à tes identifiants, pour que je puisse te reconnaître ?");
    session.replaceDialog('/login_webapp');
  }
];

const getPersonalInfoAttachments = async (session) => {
  const url = `${process.env.WEBSITE_HOSTNAME}/bot/auxiliaries/${session.userData.alenvi._id}?&access_token=${session.userData.alenvi.token}`;
  const myCards = [];
  myCards.push(
    new builder.HeroCard(session)
      .title('Mes informations personnelles')
      .buttons([
        builder.CardAction.openUrl(session, url, 'Mettre à jour')
      ])
  );
  return myCards;
};

const displayMyInfoCard = async (session) => {
  try {
    const cards = await getPersonalInfoAttachments(session);
    const message = new builder.Message(session)
      .attachmentLayout(builder.AttachmentLayout.carousel)
      .attachments(cards);
    session.endDialog(message);
  } catch (err) {
    console.error(err);
    return session.endDialog("Je n'ai pas réussi à récupérer tes informations personnelles :/");
  }
};

const rootGreetingMenu = async (session) => {
  session.sendTyping();
  if (!session.userData.hasConnected) {
    session.send('Pour finaliser ton inscription chez Alenvi, merci de bien vouloir mettre à jour tes informations personnelles en cliquant ci-dessous. Et n’hésites pas à revenir me parler ensuite! ^_^ ');
    session.userData.hasConnected = true;
    displayMyInfoCard(session);
  } else {
    builder.Prompts.choice(session, 'Comment puis-je t’aider ? 😉', 'Consulter planning|Modifier planning|Bénéficiaires|Répertoire|Infos|Administratif|Formation|URGENCE', { maxRetries: 0 });
  }
};

const redirectMenuResult = (session, results) => {
  if (results.response) {
    if (session.userData.alenvi) {
      switch (results.response.entity) {
        case 'Consulter planning':
          session.replaceDialog('/select_show_planning');
          break;
        case 'Modifier planning':
          session.replaceDialog('/select_modify_planning');
          break;
        case 'Bénéficiaires':
          session.replaceDialog('/which_customers');
          break;
        case 'Répertoire':
          session.replaceDialog('/select_directory');
          break;
        case 'Infos':
          session.replaceDialog('/select_infos');
          break;
        case 'Administratif':
          session.replaceDialog('/administrative');
          break;
        case 'Formation':
          session.replaceDialog('/training_choice');
          break;
        case 'URGENCE':
          session.replaceDialog('/show_emergency');
          break;
        case 'Accueil aux.':
          session.replaceDialog('/ask_phone_nbr');
          break;
      }
    }
    // session.endDialog();
  } else {
    return session.cancelDialog(0, '/not_understand');
  }
};

exports.hello = [rootGreetingMenu, redirectMenuResult];
