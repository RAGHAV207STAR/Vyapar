/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Give the service worker access to Firebase Messaging.
importScripts('https://www.gstatic.com/firebasejs/10.14.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.14.0/firebase-messaging-compat.js');

// Initialize the Firebase app in the service worker by passing in
// your app's FirebaseConfig.
firebase.initializeApp({
  apiKey: "AIzaSyAhK12VzVo30Mb12D5IYvAPvibkwOyIHT0",
  authDomain: "vyapardesk-500a8.firebaseapp.com",
  projectId: "vyapardesk-500a8",
  storageBucket: "vyapardesk-500a8.firebasestorage.app",
  messagingSenderId: "742226769824",
  appId: "1:742226769824:web:3748ca8c9f40f2e85316c5"
});

// Retrieve an instance of Firebase Messaging.
const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Background message received: ', payload);
  
  const title = payload.notification?.title || payload.data?.title || 'Vyapar Mitra';
  const options = {
    body: payload.notification?.body || payload.data?.body || 'New notification received',
    icon: '/android-chrome-192x192.png',
    badge: '/favicon-16x16.png',
    data: payload.data
  };

  self.registration.showNotification(title, options);
});

// Handle notification click to focus or open client page
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      if (clientList.length > 0) {
        return clientList[0].focus();
      }
      return self.clients.openWindow('/');
    })
  );
});
