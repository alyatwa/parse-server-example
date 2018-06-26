// Example express application adding the parse-server module to expose Parse
// compatible API routes.

var express = require('express');
var ParseServer = require('parse-server').ParseServer;
var path = require('path');

var databaseUri = process.env.DATABASE_URI || process.env.MONGODB_URI;

if (!databaseUri) {
  console.log('DATABASE_URI not specified, falling back to localhost.');
}

var api = new ParseServer({
  databaseURI: databaseUri || 'mongodb://localhost:27017/dev',
  cloud: process.env.CLOUD_CODE_MAIN || __dirname + '/cloud/main.js',
  appId: process.env.APP_ID || 'myAppId',
  clientKey: process.env.myclientKey,
  masterKey: process.env.MASTER_KEY || '', //Add your master key here. Keep it secret!
  serverURL: process.env.SERVER_URL || 'http://localhost:1337/parse',  // Don't forget to change to https if needed,
    // Enable email verification
  verifyUserEmails: true,
  // The public URL of your app.
  // This will appear in the link that is used to verify email addresses and reset passwords.
  // Set the mount path as it is in serverURL
  publicServerURL: process.env.SERVER_URL || 'https://example.com/parse',
  // Your apps name. This will appear in the subject and body of the emails that are sent.
  appName: 'Parse App',
  // The email adapter
  emailAdapter: {
     module:'@parse-server-mailjet-adapter',
    options: {
      // The API key from your Mailjet account
      apiKey: process.env.YOUR_MAILJET_API_KEY,
      // The API secret from your Mailjet account
      apiSecret: process.env.YOUR_MAILJET_API_SECRET,
      // The email to send Mailjet templates bug reports to
      apiErrorEmail: "bugreport@yourdomain.com",
      // The email address that your emails come from
      fromEmail: "noreply@yourdomain.com",
      // The name do display as the sender (optional)
      fromName: "The sender name",
      //
      // Parameters for the reset password emails
      //
      // The subject of the email to reset the password
      passwordResetSubject: "Reset My Password",
      // Set it to use a template with your Mailjet account.
      // This is the id of the template to use.
      passwordResetTemplateId: 12345,
      // If you do not use template, you can set the plain text part here
      passwordResetTextPart: "Hi,\n\nYou requested to reset your password for {{var:appName}}.\n\nPlease, click here to set a new password: {{var:link}}",
      // If you do not use template, you can set the html part here
      passwordResetHtmlPart: "Hi,<p>You requested to reset your password for <b>{{var:appName}}</b>.</p><p>Please, click here to set a new password: {{var:link}}</p>",
      //
      // Parameters for the email verification emails
      //
      // The subject of the email to reset the password
      verificationEmailSubject: "Verify your email",
      // Set it to use a template with your Mailjet account.
      // This is the id of the template to use.
      verificationEmailTemplateId: 67890,
      // If you do not use template, you can set the plain text part here
      verificationEmailTextPart: "Hi,\n\nYou are being asked to confirm the e-mail address {{var:email}} with {{var:appName}}\n\nClick here to confirm it: {{var:link}}",
      // If you do not use template, you can set the html part here
      verificationEmailHtmlPart: "Hi,<p>You are being asked to confirm the e-mail address {{var:email}} with <b>{{var:appName}}</b></p><p>Click here to confirm it: {{var:link}}</p>",
      
    }
  },
  
  liveQuery: {
    classNames: ["Posts", "Comments"] // List of classes to support for query subscriptions
  }
});
// Client-keys like the javascript key or the .NET key are not necessary with parse-server
// If you wish you require them, you can set them as options in the initialization above:
// javascriptKey, restAPIKey, dotNetKey, clientKey

var app = express();

// Serve static assets from the /public folder
app.use('/public', express.static(path.join(__dirname, '/public')));

// Serve the Parse API on the /parse URL prefix
var mountPath = process.env.PARSE_MOUNT || '/parse';
app.use(mountPath, api);

// Parse Server plays nicely with the rest of your web routes
app.get('/', function(req, res) {
  res.status(200).send('I dream of being a website.  Please star the parse-server repo on GitHub!');
});

// There will be a test page available on the /test path of your server url
// Remove this before launching your app
app.get('/test', function(req, res) {
  res.sendFile(path.join(__dirname, '/public/test.html'));
});

var port = process.env.PORT || 1337;
var httpServer = require('http').createServer(app);
httpServer.listen(port, function() {
    console.log('parse-server-example running on port ' + port + '.');
});

// This will enable the Live Query real-time server
ParseServer.createLiveQueryServer(httpServer);
