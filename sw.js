// public/sw.js
self.addEventListener('push', function (event) {
  const data = event.data ? event.data.json() : {};
  const title = data.title || 'Mekha Shop';
  const options = {
    body: data.body || 'Новое уведомление',
    icon: '/favicon.svg',
    vibrate: [200, 100, 200]
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});