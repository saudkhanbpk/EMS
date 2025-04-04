

// importScripts('https://www.gstatic.com/firebasejs/10.13.2/firebase-app-compat.js');
// importScripts('https://www.gstatic.com/firebasejs/10.13.2/firebase-messaging-compat.js');


// firebase.initializeApp({
//   apiKey: "AIzaSyAAUF5qzZrljXJjb96NmesXBydmn9Hmjss",
//   authDomain: "emsm-1d63e.firebaseapp.com",
//   projectId: "emsm-1d63e",
//   storageBucket: "emsm-1d63e.firebasestorage.app",
//   messagingSenderId: "98198623661",
//   appId: "1:98198623661:web:6e75496c45508cf37d7d24",
//   measurementId: "G-T7352X97BH"
// });

// // Retrieve an instance of Firebase Messaging so that it can handle background
// // messages.
// const messaging = firebase.messaging();
// messaging.onBackgroundMessage(function(payload) {
//     console.log('[firebase-messaging-sw.js] Received background message ', payload);
   
//     // Customize notification here
//     const notificationTitle = payload.notification.title;
//     const notificationOptions = {
//       body: payload.notification.body,
//       icon: payload.notification.image
//     };

//     self.registration.showNotification(notificationTitle,notificationOptions); })






importScripts("https://www.gstatic.com/firebasejs/10.13.2/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.13.2/firebase-messaging-compat.js");

if (!firebase.apps.length) {
  firebase.initializeApp({
    apiKey: "AIzaSyAAUF5qzZrljXJjb96NmesXBydmn9Hmjss",
    authDomain: "emsm-1d63e.firebaseapp.com",
    projectId: "emsm-1d63e",
    storageBucket: "emsm-1d63e.firebasestorage.app",
    messagingSenderId: "98198623661",
    appId: "1:98198623661:web:6e75496c45508cf37d7d24",
    measurementId: "G-T7352X97BH"
  });
}
// Retrieve Firebase Messaging instance
const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
    console.log("[firebase-messaging-sw.js] Received background message: ", payload);

    // Customize notification
    const notificationTitle = payload.notification?.title || "New Notification";
    const notificationOptions = {
        body: payload.notification?.body || "You have a new message",
        icon: payload.notification?.image || "/default-icon.png", // ✅ Fallback to a default icon
        click_action: payload.notification?.click_action || "/"
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
});
















    