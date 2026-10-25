/* Service worker de Clínica Alba: recibe las notificaciones push del llamado de turno,
   aunque la página esté cerrada o la pantalla bloqueada, y al tocarlas abre los turnos llamados. */
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));

// La página guarda el número de turno de este teléfono (A-03, P-01...) al activar las notificaciones
async function turnoDe(cita) {
  try {
    const c = await caches.open('alba-turnos');
    const r = await c.match('turno-' + cita);
    return r ? (await r.text()) : '';
  } catch (_) { return ''; }
}

self.addEventListener('push', e => {
  e.waitUntil((async () => {
    let d = {};
    try { d = e.data ? e.data.json() : {}; } catch (_) { d = { body: e.data ? e.data.text() : '' }; }
    const tn = d.tn || (d.cita ? await turnoDe(d.cita) : '');
    // Siempre se muestra la notificación (iPhone revoca los permisos si un push no muestra nada)
    await self.registration.showNotification(d.title || 'Clínica Alba: es tu turno', {
      body: d.body || 'Dirígete a tu consulta.',
      tag: d.tag || 'turno',
      renotify: true,
      requireInteraction: true,
      vibrate: [300, 150, 300, 150, 600],
      icon: 'icon-192.png',
      badge: 'icon-192.png',
      data: { tn }
    });
  })());
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  const tn = (e.notification.data && e.notification.data.tn) || '';
  const url = new URL('./?llamados=1' + (tn ? '&turno=' + encodeURIComponent(tn) : ''), self.registration.scope).href;
  e.waitUntil((async () => {
    const cs = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const c of cs) {
      if ('focus' in c) {
        await c.focus();
        c.postMessage({ type: 'abrir-turnos', tn });
        return;
      }
    }
    return self.clients.openWindow(url);
  })());
});
