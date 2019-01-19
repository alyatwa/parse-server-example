// Give the service worker access to Firebase Messaging.
// Note that you can only use Firebase Messaging here, other Firebase libraries
// are not available in the service worker.
importScripts('https://www.gstatic.com/firebasejs/4.8.1/firebase-app.js');
importScripts('https://www.gstatic.com/firebasejs/4.8.1/firebase-messaging.js');

// Initialize the Firebase app in the service worker by passing in the
// messagingSenderId.
firebase.initializeApp({
  'messagingSenderId': '337711436260'
});

// Retrieve an instance of Firebase Messaging so that it can handle background
// messages.
const messaging = firebase.messaging();
messaging.setBackgroundMessageHandler(function(payload) {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  // Customize notification here
  
  var notificationTitle = 'New Message!';
  var notificationOptions = {
    body: 'You Got New Message',
    icon: '/firebase-logo.png'
  };

  return self.registration.showNotification(notificationTitle,
    notificationOptions);
});

var CACHE_NAME = 'moklma-cache';
var urlsToCache = [
  './',
  'firebase-messaging-sw.js',
  'manifest.json',
  'main.css',
  'main.js',
  'copy.svg',
  'icons_192.png',
  'icons_512.png'
];
console.log('loading sw');

/*self.addEventListener('install', function (event) {
  // Perform install steps
  console.log('installing sw');
  event.waitUntil(
    caches.open(CACHE_NAME)
    .then(function (cache) {
      console.log('Opened cache');
      var x = cache.addAll(urlsToCache);
      console.log('cache added');
      return x;
    })
  );
});*/

self.addEventListener('fetch', (event) => {});
