// Buggy User App Web Environment Configuration Template
// Copy this file to env.js and fill in your keys.
window.ENV = window.ENV || {};

window.ENV.GOOGLE_MAPS_WEB_API_KEY = "YOUR_GOOGLE_MAPS_WEB_API_KEY";
window.ENV.GOOGLE_SERVER_CLIENT_ID = "YOUR_GOOGLE_SERVER_CLIENT_ID.apps.googleusercontent.com";

window.ENV.FIREBASE_CONFIG = {
  apiKey: "YOUR_FIREBASE_WEB_API_KEY",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_FIREBASE_WEB_APP_ID"
};

if (typeof self !== 'undefined') {
  self.ENV = window.ENV;
}
