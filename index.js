// Example express application adding the parse-server module to expose Parse
// compatible API routes. 

var express = require('express');
var ParseServer = require('parse-server').ParseServer;
var ParseDashboard = require( 'parse-dashboard' )
var path = require('path');

var SimpleSendGridAdapter = require('parse-server-sendgrid-adapter');
var databaseUri = process.env.DATABASE_URI || process.env.MONGODB_URI;
//process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
if (!databaseUri) {
  console.log('DATABASE_URI not specified, falling back to localhost.');
}

var api = new ParseServer({
  databaseURI: databaseUri || 'mongodb://localhost:27017/dev',
  cloud: process.env.CLOUD_CODE_MAIN || __dirname + '/cloud/main.js',
  appId: process.env.APP_ID || 'APP_ID',
  //clientKey: process.env.myclientKey,
  masterKey: process.env.MASTER_KEY || '', //Add your master key here. Keep it secret!
  serverURL: process.env.SERVER_URL || 'http://localhost:1337/parse',  // Don't forget to change to https if needed,
    // Enable email verification
  verifyUserEmails: true,
   liveQuery: {
    classNames: ['_User']
  },
  maxUploadSize: process.env.maxUploadSize || "15mb",
  // The public URL of your app.
  // This will appear in the link that is used to verify email addresses and reset passwords.
  // Set the mount path as it is in serverURL
  publicServerURL: process.env.SERVER_URL || 'https://example.com/parse',
  // Your apps name. This will appear in the subject and body of the emails that are sent.
  appName: process.env.APP_NAME,
  // The email adapter
  emailAdapter: SimpleSendGridAdapter({
    apiKey: process.env.SENDGRID_API_KEY,
    fromAddress: process.env.fromAddress,
  })
});
// Client-keys like the javascript key or the .NET key are not necessary with parse-server
// If you wish you require them, you can set them as options in the initialization above:
// javascriptKey, restAPIKey, dotNetKey, clientKey

var app = express();

// Serve static assets from the /public folder
app.use('/public', express.static(path.join(__dirname, '/public')));


const dashboard = new ParseDashboard( {
 // "allowInsecureHTTP": true,
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


app.use( process.env.PARSE_MOUNT, api )
// Parse Dashboard   /dashboard
app.use( process.env.PARSE_DASHBOARD_MOUNT, dashboard )


// Serve the Parse API on the /parse URL prefix
var mountPath = process.env.PARSE_MOUNT || '/parse';
app.use(mountPath, api);

// Parse Server plays nicely with the rest of your web routes
// render configuration information for at root
app.get( '/', function( req, res ) {
  res.sendFile(path.join(__dirname, '/public/index.html'));
  /*res.status(200).json( {
    'appName': process.env.APP_NAME,
  } )*/
} )

app.get( '/firebase-messaging-sw.js', function( req, res ) {
  res.sendFile(path.join(__dirname, '/public/js/firebase-messaging-sw.js'));
} )
app.get( '/js/recorderWorkerMP3.js', function( req, res ) {
  res.sendFile(path.join(__dirname, '/public/js/recorderWorkerMP3.js'));
} )
app.get( '/recorderWorkerMP3.js', function( req, res ) {
  res.sendFile(path.join(__dirname, '/public/js/recorderWorkerMP3.js'));
} )
app.get( '/libmp3lame.js', function( req, res ) {
  res.sendFile(path.join(__dirname, '/public/js/libmp3lame.js'));
} )
app.get('/manage', function(req, res) {
       res.redirect(301, '/#/manage');
       res.end();
});
app.get('/records', function(req, res) {
       res.redirect(301, '/#/records');
       res.end();
});
app.get('/pp', function(req, res) {
       res.redirect(301, '/#/pp');
       res.end();
});
app.get('/tos', function(req, res) {
       res.redirect(301, '/#/tos');
       res.end();
});
app.get('/msg/:recordId', function(req, res) {
  let recordId = req.params.recordId;
  let redirectUrl = '/#/msg/'+recordId;
  let userAgent = req.headers['user-agent'];
  let bot = (userAgent.startsWith('facebookexternalhit/1.1') || userAgent === 'Facebot' || userAgent.startsWith('Twitterbot')) ? true : false
  var url = req.protocol + "://" + req.headers.host;
  console.log(userAgent+'  '+JSON.stringify(req.params));
 
   Parse.Cloud.run('getRecord', { recordId: recordId}).then(function(object) {
         if (bot) {
           let receiver = object.get('receiver');
             console.log('-----------bot----------');
          res.writeHead(200,{"Content-Type" : "text/html"});
          res.write(setRecordHead(receiver, msgimg, url, recordId));
          res.end();
         } else {
             console.log('-----------REAL----------');
            res.redirect(301, redirectUrl); 
         }
   }, function(data) {
       res.redirect(301, '/');
       res.end();
       console.log('cloud err:  ', data);
   });
  
  
});
var port = process.env.PORT || 1337;
var httpServer = require('http').createServer(app);
httpServer.listen(port, function(e) {
    console.log('server: '+httpServer.address().address+' # parse-server-example running on port ' + port + '.');
});


// This will enable the Live Query real-time server
ParseServer.createLiveQueryServer(httpServer);
