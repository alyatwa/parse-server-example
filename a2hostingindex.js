// Example express application adding the parse-server module to expose Parse
// compatible API routes.

var express = require('express');
var ParseServer = require('parse-server').ParseServer;
var ParseDashboard = require( 'parse-dashboard' )
var path = require('path');
var fs = require('fs');
var SimpleSendGridAdapter = require('parse-server-sendgrid-adapter');

var databaseUri = process.env.DATABASE_URI || process.env.MONGODB_URI;

const MongoClient = require('mongodb').MongoClient;


if (!databaseUri) {
  console.log('DATABASE_URI not specified, falling back to localhost.');
}

var parsePgServer = new ParseServer({
  databaseURI: 'postgres://user:pass@localhost:5432/reca_mlma',
  appId: process.env.APP_ID,
  cloud: process.env.CLOUD_CODE_MAIN || __dirname + '/cloud/main.js',
  serverURL: 'https://site.com:50000/pg',
  masterKey: process.env.MASTER_KEY,
  appName: process.env.APP_NAME,
  verifyUserEmails: false,
  liveQuery: {
    classNames: ['_User']
  }
});

/*var api = new ParseServer({
  databaseURI: databaseUri || 'mongodb://localhost:27017/dev',
  cloud: process.env.CLOUD_CODE_MAIN || __dirname + '/cloud/main.js',
  appId: process.env.APP_ID || 'myAppId',
  clientKey: process.env.myclientKey,
  masterKey: process.env.MASTER_KEY || '', //Add your master key here. Keep it secret!
  serverURL: 'http://site.com:50000/parse' || process.env.SERVER_URL || 'http://localhost:1337/parse',  // Don't forget to change to https if needed,
    // Enable email verification
  verifyUserEmails: false,
   liveQuery: {
    classNames: ['_User']
  },
  
  publicServerURL: process.env.SERVER_URL || 'https://example.com/parse',
  // Your apps name. This will appear in the subject and body of the emails that are sent.
  appName: process.env.APP_NAME,
  // The email adapter
  emailAdapter: SimpleSendGridAdapter({
    apiKey: '',
    fromAddress: '',
  })
});*/

var app = express();

// Serve static assets from the /public folder
app.use('/public', express.static(path.join(__dirname, '/public')));


const dashboard = new ParseDashboard( {
  "allowInsecureHTTP": true,
  'apps': [
    {
      'serverURL': process.env.SERVER_URL,
      'appName': process.env.APP_NAME,
      'appId': process.env.APP_ID,
      'masterKey': process.env.MASTER_KEY
    }
  ],
  'users': [
    {
      'user': process.env.PARSE_DASHBOARD_ADMIN_USERNAME,
      'pass': process.env.PARSE_DASHBOARD_ADMIN_PASSWORD
    }
  ]
}, {allowInsecureHTTP: true} );

app.use( '/pg', parsePgServer )
//app.use( process.env.PARSE_MOUNT, api )
// Parse Dashboard   /dashboard
app.use( process.env.PARSE_DASHBOARD_MOUNT, dashboard )


// Serve the Parse API on the /parse URL prefix
var mountPath = process.env.PARSE_MOUNT || '/parse';
//app.use(mountPath, api);

// Parse Server plays nicely with the rest of your web routes
// render configuration information for at root
var publicf = path.join(__dirname, 'moklma');
app.get('/', function(req, res) {
    console.log('url: '+ req.protocol + "://" + req.headers.host + req.originalUrl);
    res.sendFile(path.join(publicf, 'index.html'));
});
app.use('/', express.static(publicf));

// There will be a test page available on the /test path of your server url
// Remove this before launching your app
app.get('/test', function(req, res) {
  res.sendFile(path.join(__dirname, '/public/test.html'));
});

var port = process.env.PORT || 1337;

var httpsServer = require('https').createServer({
  key: fs.readFileSync(path.join(__dirname,'/ssl/recap.pem')),
  cert: fs.readFileSync(path.join(__dirname,'/ssl/recap.crt'))
  }, app).listen(port, function() {
  console.log('parse-server running on SSL port ' + port + '.');
});

/*var httpServer = require('http').createServer(app);
httpServer.listen(port, function(e) {
    console.log('server: '+httpServer.address().address+' # parse-server-example running on port ' + port + '.');
});*/

// This will enable the Live Query real-time server
ParseServer.createLiveQueryServer(httpsServer);
