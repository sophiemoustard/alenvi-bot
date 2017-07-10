const builder = require('botbuilder');

const whichTraining = (session) => {
  session.sendTyping();
  builder.Prompts.choice(session, 'Quelle formation souhaites-tu suivre ?', 'Formation mémoire|Com. bienveillante', { listStyle: builder.ListStyle.button, maxRetries: 0 });
};

const redirectToTrainingSelected = (session, results) => {
  if (results.response) {
    if (session.userData.alenvi) {
      switch (results.response.entity) {
        case 'Formation mémoire':
          session.replaceDialog('/show_training', { trainingType: 'memory' });
          break;
        case 'Com. bienveillante':
          session.replaceDialog('/show_training', { trainingType: 'com' });
          break;
      }
    } else {
      session.endDialog('Vous devez vous connecter pour accéder à cette fonctionalité ! :)');
    }
  } else {
    session.cancelDialog(0, '/not_understand');
  }
};

exports.trainingChoice = [whichTraining, redirectToTrainingSelected];
