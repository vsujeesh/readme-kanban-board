// https://github.com/kaimallea/node-imgur
let imgur = require('imgur');
let webshot = require('webshot');
let fs = require('fs');
let utils = require('./utils');

let stopImgurUpload = true; // debugging

// fs.readFile function with a legit Promise wrapper
const getFile = (fileName, type) =>
  new Promise((resolve, reject) => {
    fs.readFile(fileName, type, (error, data) => {
      return error ? reject(error) : resolve(data);
    });
  });

// Get all the local files
let promisedCSS = getFile('./style.css', 'utf8');
let promisedMD = getFile('./test.md', 'utf8');

// When they're loaded, crack on with parsing everything
Promise.all([promisedCSS, promisedMD])
  .catch(error => console.log('Error (getFile): ', error))
  .then(values => {
    let css = values[0];
    let md = values[1];

    // I know I can write this better, erggh sod it
    let kanban = utils.stripKanban(md),
      kanbanParsed = utils.parseKanban(kanban);

    console.log(kanbanParsed);

    let kanbanHtml = utils.kanbanToHTML(kanbanParsed);

    console.log(kanbanHtml);

    // Create a PhantomJS simulation of the html and an image therein.
    // We have to physically save the file to disk, as webshot doesn't handle it another way (despite docs)
    let renderStream = webshot(
      kanbanHtml,
      './kanban.png', // image created locally
      {
        siteType: 'html',
        customCSS: css
      },
      err => {
        if (stopImgurUpload) {
          console.log('Stopping for debugging');
          return;
        }
        if (err) {
          console.log(err);
          return;
        }
        // Sweet, so the image was created. Let's sploodge it up to imgur
        fs.readFile('./kanban.png', function read(err, data) {
          console.log('Uploading to imgur..');
          imgur
            .uploadFile('./kanban.png')
            .then(json => {
              console.log(json.data.link);
            })
            .catch(err => {
              console.error(err.message);
            });
        });
      }
    );
  });
