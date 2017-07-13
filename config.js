require('dotenv');

module.exports = {
  Ogust: {
    API_LINK: 'https://my.ogust.com/api/v2/apiogust.php?method=',
  },
  Slack: {
    channels: {
      '*': 'G5QLJ49KL',
      'test': 'G5X9AKSF2',
      '1b*': 'G5QLJ49KL',
      '1a*': 'G5QLHLTPC',
    }
  },
  Cloudinary: {
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  }
};
