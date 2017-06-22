// =========================================================
// Hello when connected or not
// =========================================================

const builder = require('botbuilder');

exports.hello_first = [
  (session) => {
    console.log('WENT IN HELLO_FIRST');
    session.sendTyping();
    session.send("Hello ! Je m'appelle Pigi, le petit oiseau qui facilite ton quotidien chez Alenvi 😉");
    session.send("Il semblerait que nous ne nous connaissions pas encore ! Peux-tu t'authentifier grâce aux identifiants fournis par Alenvi, pour que je puisse te reconnaître ?");
    session.beginDialog('/login_facebook');
  }
];

const rootGreetingMenu = (session) => {
  console.log('WENT IN HELLO > MENU');
  session.sendTyping(); // Hello ${session.userData.alenvi.firstname}!
  builder.Prompts.choice(session, 'Comment puis-je t’aider ? 😉', 'Consulter planning|Modifier planning|Bénéficiaires|Equipe', { maxRetries: 0 });
};

const redirectMenuResult = (session, results) => {
  console.log('WENT IN HELLO > REDIRECTMENURESULT');
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
      }
    }
    // session.endDialog();
  } else {
    return session.cancelDialog(0, '/not_understand');
  }
};

exports.hello = [rootGreetingMenu, redirectMenuResult];
