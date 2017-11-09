const cloudinary = require('cloudinary');
const cloudinaryConfig = require('../../../config').Cloudinary;

cloudinary.config(cloudinaryConfig);

exports.memVideosList = [
  {
    number: 1,
    title: 'La mémorisation',
    image_link: cloudinary.url('images/bot/formation/memoires/movie_1.png'),
    show_link: 'https://vimeo.com/215223686/364e45ed62',
    script_link: 'https://drive.google.com/open?id=0B3bqjy-Bj6OHRWJjWnBhbHJIdEk',
    questionnaire_link: 'https://docs.google.com/forms/d/e/1FAIpQLSdeT6GLIVdubFYW7yoxAtVyVd7YFYNzmcm4xXuO4AI2d5AjZg/viewform',
  }, {
    number: 2,
    title: 'Les mémoires',
    image_link: cloudinary.url('images/bot/formation/memoires/movie_2.png'),
    show_link: 'https://vimeo.com/218619824/d93a7eb05d',
    script_link: 'https://drive.google.com/open?id=0B3bqjy-Bj6OHTlNRQXFQMDRTeTQ',
    questionnaire_link: 'https://docs.google.com/forms/d/1sQAgxb77CbGzlkUXEH3q3qQ8IqPQkK-Y59am9BET56w/viewform'
  }, {
    number: 3,
    title: 'Les fonction exécutives',
    image_link: cloudinary.url('images/bot/formation/memoires/movie_3.png'),
    show_link: 'https://vimeo.com/220545373/f66d08e99a',
    script_link: 'https://drive.google.com/open?id=0B3bqjy-Bj6OHM1pJVEV4c3hOOUk',
    questionnaire_link: 'https://docs.google.com/forms/d/e/1FAIpQLSeXyQCzme8BbuiQh6Vj67lpwbreAgbSPZ0z6kysaSc-QfCVjA/viewform'
  }, {
    number: 4,
    title: 'Les fonctions instrumentales',
    image_link: cloudinary.url('images/bot/formation/memoires/movie_4.png'),
    show_link: 'https://vimeo.com/222328774/4f611bf120',
    script_link: 'https://drive.google.com/open?id=0B3bqjy-Bj6OHMC03QjJnaXBfWEU',
    questionnaire_link: 'https://docs.google.com/forms/d/e/1FAIpQLSfBUaeevc7cz0nff10YADPrPzyT0hZLIdq4MmcQO4ROsaiMlw/viewform'
  }, {
    number: 5,
    title: "La maladie d'Alzheimer",
    image_link: cloudinary.url('images/bot/formation/memoires/movie_5.png'),
    show_link: 'https://vimeo.com/223966961/a1e7a13ba6',
    script_link: 'https://drive.google.com/open?id=0B3bqjy-Bj6OHT0dQYm9uSHdGcVE',
    questionnaire_link: 'https://docs.google.com/forms/d/e/1FAIpQLSehlb_89ZxiiRettko1kwLS2088Ovoo2eIarZN83-K30pQSNQ/viewform'
  }, {
    number: 6,
    title: "La maladie d'Alzheimer et sa prise en charge",
    image_link: cloudinary.url('images/bot/formation/memoires/movie_6.png'),
    show_link: 'https://vimeo.com/224495770/03cf53a02c',
    script_link: 'https://drive.google.com/open?id=0B3bqjy-Bj6OHd3pxcElWOUdpZVk',
    questionnaire_link: 'https://docs.google.com/forms/d/e/1FAIpQLSe6U8HazD3KqPTduIvUxWnkoyfuyqNGJVNtuzcSyS6jxzpQlQ/viewform'
  }, {
    number: 7,
    title: 'Les symptômes psycho-comportementaux',
    image_link: cloudinary.url('images/bot/formation/memoires/movie_7.png', { quality: 'auto' }),
    show_link: 'https://vimeo.com/237597571/e1012d57f5',
    script_link: 'https://drive.google.com/open?id=0B3bqjy-Bj6OHWmtPaTZjelR4Yzg',
    questionnaire_link: 'https://docs.google.com/forms/d/e/1FAIpQLScYauOAMbAj7wrcZ4iq8keGDUNrlqjYy1dgBZ-KZ_515OkRzw/viewform'
  }, {
    number: 8,
    title: 'La communication',
    image_link: cloudinary.url('images/bot/formation/memoires/movie_8.png', { effect: 'auto_contrast', quality: 'auto' }),
    show_link: 'https://vimeo.com/241861431/ca434d62c2',
    script_link: 'https://drive.google.com/open?id=0B8gI-MT7hHSSREI5N3BON2VQM00'
  }
];
