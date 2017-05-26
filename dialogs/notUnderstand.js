//=========================================================
// Not understand
//=========================================================

module.exports = (session, args) => {
  console.log("/NOT_UNDERSTAND");
  session.sendTyping();
  session.endDialog("Je n'ai pas compris . Peux-tu répéter autrement ?");
}
