const google = require('googleapis');

exports.getNewsAlenvi = () => {
  return new Promise((resolve, reject) => {
    const jwtClient = new google.auth.JWT(
      process.env.GOOGLE_DRIVE_API_EMAIL,
      null,
      process.env.GOOGLE_DRIVE_API_PRIVATE_KEY.replace(/\\n/g, '\n'),
      [
        'https://www.googleapis.com/auth/drive.metadata.readonly'
      ]
    );
    // authenticate request
    jwtClient.authorize((err) => {
      if (err) {
        reject(err);
      }
      console.log('Successfully connected to Google Drive API !');
    });
    // Google Drive API
    const drive = google.drive('v3');
    drive.files.list({
      auth: jwtClient,
      q: `'${process.env.GOOGLE_DRIVE_NEWS_FOLDER_ID}' in parents`,
      //  pageSize: 10,
      fields: 'nextPageToken, files(id, name, webViewLink)'
    }, (err, response) => {
      if (err) {
        reject(`The API returned an error: ${err}`);
      }
      resolve(response.files);
    });
  });
};
