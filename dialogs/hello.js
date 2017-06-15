const builder = require('botbuilder');

// =========================================================
// Hello when connected or not
// =========================================================

exports.hello_first = [
  (session) => {
    session.sendTyping();
    session.send("Hello ! Je m'appelle Pigi, le petit oiseau qui facilite ton quotidien chez Alenvi 😉");
    session.send("Il semblerait que nous ne nous connaissions pas encore ! Peux-tu t'authentifier chez Alenvi grâce à Facebook, pour que je puisse te reconnaître ?");
    session.beginDialog('/login_facebook');
  },
];

const rootGreetingMenu = (session) => {
  if (!session.userData.alenvi) {
    session.beginDialog('/hello_first');
  } else {
    session.sendTyping();
    builder.Prompts.choice(session, `Hello ${session.userData.alenvi.firstname}! 😉 Comment puis-je t’aider ?`, 'Consulter planning|Modifier planning|Bénéficiaires|Equipe');
  }
};

const redirectMenuResult = (session, results) => {
  if (results.response) {
    if (session.userData.alenvi) {
      console.log(results.response);
      switch (results.response.entity) {
        case 'Consulter planning':
          session.beginDialog('/select_show_planning');
          break;
        case 'Modifier planning':
          session.beginDialog('/select_modify_planning');
          break;
        case 'Bénéficiaires':
          session.beginDialog('/show_my_customers');
          break;
        case 'Equipe':
          session.beginDialog('/show_team');
          break;
        // case 'Infos':
        //   console.log('Infos');
        //   session.endDialog('Infos');
        //   break;
      }
      // session.endDialog();
    } else {
      session.endDialog('Vous devez vous connecter pour accéder à cette fonctionnalité ! :)');
    }
  }
};

exports.hello = [rootGreetingMenu, redirectMenuResult];
