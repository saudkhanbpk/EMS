// Handle push notifications
self.addEventListener('push', (event) => {
    const payload = event.data?.json() || {};
    const title = payload.title || "New Notification";
    
    event.waitUntil(
      self.registration.showNotification(title, {
        body: payload.body || "You have a new message",
        icon: payload.icon || "/icon-192.png",
        data: { url: payload.url || '/' }
      })
    );
  });
  
  // Handle notification clicks
  self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    event.waitUntil(
      clients.matchAll({ type: 'window' }).then(clientList => {
        if (clientList.length > 0) return clientList[0].focus();
        return clients.openWindow(event.notification.data.url);
      })
    );
  });