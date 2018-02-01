const _ = require('lodash');

// a must be the user data from Alenvi DB, o is data from Ogust, firstCustom and secondCustom are arrays of string of properties we want to compare with each set of data if both objects have not the same properties name or length.
exports.diffAlenviOgust = (a, o, firstCustom, secondCustom) => {
  // for the diff to work you have to pick the same properties on each set of data
  const filteredAlenviData = _.pick(a, firstCustom);
  const filteredOgustData = _.pick(o, secondCustom);
  const correspKeyName = {
    first_name: 'firstname',
    last_name: 'lastname',
    email: 'local.email',
    sector: 'sector',
    mobile_phone: 'mobilePhone'
  };
  const diff = {};
  for (const k in filteredOgustData) {
    if (filteredOgustData[k] !== filteredAlenviData[correspKeyName[k]]) {
      diff[correspKeyName[k]] = filteredOgustData[k];
    }
  }
  return diff;
};
