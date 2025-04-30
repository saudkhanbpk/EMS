

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
        icon: payload.notification?.image || "/favicon.ico", // Use favicon as default icon
        badge: "/favicon.ico", // Add a badge for mobile devices
        vibrate: [200, 100, 200], // Vibration pattern for mobile devices
        tag: 'task-notification', // Group similar notifications
        data: {
            url: payload.data?.url || '/', // URL to open when notification is clicked
            taskId: payload.data?.taskId, // Store task ID if available
            projectId: payload.data?.projectId // Store project ID if available
        },
        actions: [
            {
                action: 'view',
                title: 'View Task',
                icon: '/favicon.ico'
            }
        ],
        requireInteraction: true // Keep notification visible until user interacts with it
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification click events
self.addEventListener('notificationclick', (event) => {
    console.log('[firebase-messaging-sw.js] Notification click Received:', event);

    // Close the notification
    event.notification.close();

    // Get the notification data
    const notificationData = event.notification.data;

    // Handle action buttons if clicked
    if (event.action === 'view' && notificationData.taskId) {
        // If the "View Task" action was clicked and we have a taskId
        const urlToOpen = `/taskboard?taskId=${notificationData.taskId}`;

        // Open or focus the relevant page
        event.waitUntil(
            clients.matchAll({type: 'window', includeUncontrolled: true})
            .then((windowClients) => {
                // Check if there is already a window/tab open with the target URL
                for (let i = 0; i < windowClients.length; i++) {
                    const client = windowClients[i];
                    // If so, focus it
                    if (client.url.includes('/taskboard') && 'focus' in client) {
                        return client.focus();
                    }
                }
                // If not, open a new window/tab
                if (clients.openWindow) {
                    return clients.openWindow(urlToOpen);
                }
            })
        );
    } else {
        // Default behavior for regular notification clicks
        const urlToOpen = notificationData.url || '/';

        event.waitUntil(
            clients.matchAll({type: 'window', includeUncontrolled: true})
            .then((windowClients) => {
                // Check if there is already a window/tab open with the target URL
                for (let i = 0; i < windowClients.length; i++) {
                    const client = windowClients[i];
                    // If so, focus it
                    if ('focus' in client) {
                        return client.focus();
                    }
                }
                // If not, open a new window/tab
                if (clients.openWindow) {
                    return clients.openWindow(urlToOpen);
                }
            })
        );
    }
});
