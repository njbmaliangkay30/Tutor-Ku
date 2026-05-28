// Service Worker for TutorKampus PWA
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', (event) => {
  let data = { title: 'TutorKampus', body: 'Anda menerima pesan baru' };
  
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data = { title: 'TutorKampus', body: event.data.text() };
    }
  }

  const options = {
    body: data.body,
    icon: '/icon.svg',
    badge: '/icon.svg',
    vibrate: [200, 100, 200],
    data: {
      url: data.url || '/chat'
    }
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  let targetUrl = '/';
  if (event.notification.data && event.notification.data.url) {
    targetUrl = event.notification.data.url;
  }

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Find matching tab
      for (const client of windowClients) {
        const clientUrl = new URL(client.url, self.location.origin);
        if (clientUrl.origin === self.location.origin) {
          return client.focus().then(() => {
            if (client.url !== targetUrl && 'navigate' in client) {
              return client.navigate(targetUrl);
            }
          });
        }
      }
      // If no tab open, open a new window
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
