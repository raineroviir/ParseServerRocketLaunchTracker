'use strict'
require('pdfjs-dist')
var fs = require('fs')
var cheerio = require('cheerio')
var express = require('express')
var ParseServer = require('parse-server').ParseServer
var Parse = require('parse/node')
var ParseDashboard = require('parse-dashboard')
var bodyParser = require('body-parser')
var fetch = require('isomorphic-fetch')
var SERVER_PORT = process.env.PORT || 3000
var SERVER_HOST = process.env.HOST || 'localhost'
var APP_ID = process.env.APP_ID || 'spacexperience'
var MASTER_KEY = process.env.MASTER_KEY || 'spacexperience'
var DATABASE_URI = process.env.MONGOLAB_URI || 'mongodb://localhost/chat_dev';
var IS_DEVELOPMENT = process.env.NODE_ENV !== 'production'
var DASHBOARD_AUTH = process.env.DASHBOARD_AUTH
var BUNDLE_ID = process.env.BUNDLE_ID || 'com.example.AwesomeSpaceXperience'
var MOUNTPATH = process.env.MOUNT_PATH || '/parse'
// require('./rethinkdb')

var api = new ParseServer({
  databaseURI: DATABASE_URI,
  cloud: './cloud',
  appId: APP_ID,
  masterKey: MASTER_KEY,
  verbose: false,
  serverURL: `http://${SERVER_HOST}:${SERVER_PORT}/parse`,
  push: {
    ios: [
      {
        pfx: './ParsePushDevCert.p12',
        bundleId: BUNDLE_ID,
        production: false
      },
      {
        pfx: './ParsePushProdCert.p12',
        bundleId: BUNDLE_ID,
        production: true
      }
    ]
  }
});

Parse.initialize(APP_ID);
Parse.serverURL = `http://localhost:${SERVER_PORT}/parse`;
Parse.Cloud.useMasterKey()
var app = express()
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(MOUNTPATH, api)
if (IS_DEVELOPMENT) {
  app.use(
    '/dashboard',
    ParseDashboard({
      apps: [{
        serverURL: '/parse',
        appId: APP_ID,
        masterKey: MASTER_KEY,
        appName: 'spacexp'
      }]
    })
  )
}

app.get('/api/reddit-launch-schedule', function(req, res) {

  let url = `https://www.reddit.com/r/spacex/wiki/launches/manifest.json`

  return fetch(url).then(response => response.json())
  .then(body => {
    const lastUpdate = searchAndSliceData('All information thought to be correct', '##Upcoming launches', body.data.content_md)
    let upcomingLaunchesString = searchAndSliceData('##Upcoming launches', '##Past Launches', body.data.content_md)
    let removeAmpsAndExpandDefinitions = upcomingLaunchesString.replace(/&amp;/g, '&').replace(/F9 FT/g, 'Falcon 9').replace(/CC LC40/g, 'Cape Canaveral, FL').replace(/LEO/g, 'Low Earth Orbit').replace(/GTO/g, 'Geo Transfer Orbit').replace(/PO/g, 'Polar Orbit').replace(/VAFB LC4E/g, 'Vandenberg AFB, CA').replace(/KSC LC39A/g, 'Kennedy Space Center, FL')
    let launchesArray = removeAmpsAndExpandDefinitions.split('\r\n')
    let result = []
    launchesArray.map(item => {
      let items = item.split('|')
        result.push({
        date: items[0],
        vehicle: items[1],
        launchSite: items[2],
        orbit: items[3],
        mass: items[4],
        payload: items[5],
        customer: items[6],
        ref: items[7]
      })
    })
    res.send(result.slice(4)) //first 3 array values are currently not launch missions
  }).catch((err) => console.error(`Error: ${err}`))
})

app.get('/api/parse-weather', function(req, res) {

  let url = `http://www.patrick.af.mil/weather/index.asp`

  let download = function(url, dest) {
    let file = fs.createWriteStream(dest);
    let request = http.get(url, function(response) {
      let lastModified = response.headers['last-modified']
      response.pipe(file)
      file.on('finish', () => {
        // let pdfPath = './airforceWeatherforecast.pdf'
        let pdfPath = dest
        let data = new Uint8Array(fs.readFileSync(pdfPath))
        pdfParsingFunction(data)
      })
    })
  };

  fetch(url).then(response => response.text())
  .then(body => {
    const $ = cheerio.load(body)
    let falconLaunchForecastURL = $('a').filter((index, element) => {
      return $(element).text() === 'Falcon Launch Forecast'
    }).attr('href')
    console.log(`Fetching URL: %s`, falconLaunchForecastURL)
    let filename = falconLaunchForecastURL.split('/').pop();

    if(!`./${filename}`) {
      download(falconLaunchForecastURL, filename)
    } else {
      let pdfPath = './airforceWeatherforecast.pdf'
      let data = new Uint8Array(fs.readFileSync(pdfPath))
      // let data = new Uint8Array(fs.readFileSync(filename))
      let urlSource = falconLaunchForecastURL
      pdfParsingFunction(data, urlSource)
    }
  })

  function pdfParsingFunction(filename, urlSource) {
    let loadingTask = PDFJS.getDocument(filename)
    loadingTask.then((pdfDocument) => {
      let metaData = pdfDocument.getMetadata().then(function (data) {
        console.log(`PDF Title: %s`, data.info['Title'])
        console.log('# Metadata Is Loaded');
        console.log('## Info');
        console.log(JSON.stringify(data.info, null, 2));
        console.log();
        if (data.metadata) {
          console.log('## Metadata');
          console.log(JSON.stringify(data.metadata.metadata, null, 2));
          console.log();
        }
        if(data.info['Title'] === 'NO Storm NO Launch') {
          return res.json({noLaunch: data.info['Title']})
        }
      }).catch(err => console.log(err));
      if (pdfDocument.pdfInfo.numPages > 1) {
        console.log(`Number of PDF Pages: %s`, pdfDocument.pdfInfo.numPages)
      }
      return pdfDocument.getPage(1)
    }).then((pdfPage) => {
      return pdfPage.getTextContent()
    }).then((content) => {
      let strings = content.items.map((item) => {
        return item.str
      })
      let finalString = strings.join(' ')
      // start idx = Launch day probability of violating launch weather
      let snippet = searchAndSliceData('Launch day probability', 'Primary concern', finalString)

      let percent = snippet.match(/\d/g);
      percent = percent.join("");
            console.log(percent)
            console.log(urlSource)
      let jsonResponse = {snippet: snippet, url: urlSource, fullReport: finalString, percent: percent}
      res.json(jsonResponse)
    }).catch((err) => console.error('Error: %s', err))
  }
})

function searchAndSliceData(startidx, endidx, data) {
  return data.slice(data.search(startidx),data.search(endidx))
}

app.listen(SERVER_PORT, function() {
  console.log('parse-server running on port 1337')
})
