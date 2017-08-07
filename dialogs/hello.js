// =========================================================
// Hello when connected or not
// =========================================================

const builder = require('botbuilder');

exports.hello_first = [
  (session) => {
    session.sendTyping();
    session.send("Hello ! Je m'appelle Pigi, le petit oiseau qui facilite ton quotidien chez Alenvi 😉");
    session.send("Il semblerait que nous ne nous connaissions pas encore ! Peux-tu t'authentifier grâce aux identifiants fournis par Alenvi, pour que je puisse te reconnaître ?");
    session.replaceDialog('/login_facebook');
  }
];

const rootGreetingMenu = (session) => {
  session.sendTyping(); // Hello ${session.userData.alenvi.firstname}!
  builder.Prompts.choice(session, 'Comment puis-je t’aider ? 😉', 'Consulter planning|Modifier planning|Bénéficiaires|Equipe|Infos|Formation|URGENCE', { maxRetries: 0 });
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
          session.replaceDialog('/show_my_customers');
          break;
        case 'Equipe':
          session.replaceDialog('/show_team');
          break;
        case 'Infos':
          session.replaceDialog('/select_infos');
          break;
        case 'Formation':
          session.replaceDialog('/training_choice');
          break;
        case 'URGENCE':
          session.replaceDialog('/show_emergency');
          break;
      }
    }
    // session.endDialog();
  } else {
    return session.cancelDialog(0, '/not_understand');
  }
};

exports.hello = [rootGreetingMenu, redirectMenuResult];
