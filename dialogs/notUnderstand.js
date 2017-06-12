//=========================================================
// Not understand
//=========================================================

module.exports = (session, args) => {
  console.log("/NOT_UNDERSTAND");
  session.sendTyping();
  session.endDialog("Je n'ai pas compris, voila ce que je te propose...");
  session.replaceDialog("/hello");
}
