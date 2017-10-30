const builder = require('botbuilder');

exports.sendMessageToUser = bot => (req, res) => {
  try {
    const address = req.body.address;
    // const stringAddress = decodeURIComponent(encodedAddress);
    // const address = JSON.parse(stringAddress);
    const text = req.body.message;
    const msg = new builder.Message().address(address).text(text);
    bot.send(msg.toMessage());
    res.send(200, 'Message sent to user.');
    return;
  } catch (e) {
    console.error(e);
  }
};
