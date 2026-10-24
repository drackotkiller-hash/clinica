/* Service worker de Clínica Alba: recibe las notificaciones push del llamado de turno,
   aunque la página esté cerrada o la pantalla bloqueada. */
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));

self.addEventListener('push', e => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch (_) { d = { body: e.data ? e.data.text() : '' }; }
  const title = d.title || 'Clínica Alba: es tu turno';
  // Siempre se muestra la notificación (iPhone revoca los permisos si un push no muestra nada)
  e.waitUntil(self.registration.showNotification(title, {
    body: d.body || 'Dirígete a tu consulta.',
    tag: d.tag || 'turno',
    renotify: true,
    requireInteraction: true,
    vibrate: [300, 150, 300, 150, 600],
    icon: 'icon-192.png',
    badge: 'icon-192.png',
    data: { url: './' }
  }));
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil((async () => {
    const cs = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const c of cs) { if ('focus' in c) return c.focus(); }
    return self.clients.openWindow((e.notification.data && e.notification.data.url) || './');
  })());
});
