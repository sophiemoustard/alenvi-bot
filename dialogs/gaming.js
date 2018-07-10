const builder = require('botbuilder');

const intro = (session) => {
  session.sendTyping();
  session.send('Bonjour ! Bienvenue dans le jeu du plus ou moins !');
  builder.Prompts.text(session, 'Donne-moi un chiffre minimal :)');
};

const maxima = (session, result) => {
  session.sendTyping();
  session.userData.game = {};
  session.userData.game.minima = result.response;
  builder.Prompts.text(session, 'Merci. Maintenant, donne-moi un chiffre maximal :)');
};

const calcul = (session, result) => {
  session.sendTyping();
  session.userData.game.maxima = result.response;
  session.userData.game.random = Math.floor((Math.random() * ((session.userData.game.maxima - session.userData.game.minima) + 1)) + session.userData.game.minima);
  session.send('Je suis prêt.');
  session.replaceDialog('le_jeu_comme_je_veux');
};

const askNumber = (session) => {
  session.sendTyping();
  builder.Prompts.text(session, 'Devine mon chiffre :)');
};

const analyse = (session, result, next) => {
  session.sendTyping();
  if (result.response > session.userData.game.random) {
    session.send('C\'est moins :D');
    session.replaceDialog('le_jeu_comme_je_veux');
  } else if (result.response < session.userData.game.random) {
    session.send('C\'est plus :D');
    session.replaceDialog('le_jeu_comme_je_veux');
  }
  next();
};

const winwin = (session) => {
  session.endDialog('Bravo, tu as gagné ! Merci d\'avoir joué !');
};

exports.intro = [intro, maxima, calcul];
exports.gameplay = [askNumber, analyse, winwin];
