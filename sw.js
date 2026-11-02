// Service worker de "Control de Materiales".
// Solo guarda la "cáscara" de la app (esta misma página, el manifiesto y los íconos).
// Los datos de los alumnos NUNCA se guardan aquí: las peticiones a Supabase y a
// cualquier otro sitio van siempre directo a internet.
const CACHE = "materiales-v1";

self.addEventListener("install", e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(["./", "index.html", "manifest.webmanifest", "icon-192.png", "icon-512.png"]))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(claves => Promise.all(claves.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== "GET" || url.origin !== location.origin) return; // Supabase y librerías: directo a internet
  // Primero internet (así siempre ves la versión más nueva); si no hay señal, la copia guardada.
  e.respondWith(
    fetch(req)
      .then(res => { if (res.ok) { const copia = res.clone(); caches.open(CACHE).then(c => c.put(req, copia)) } return res })
      .catch(() => caches.match(req).then(r => r || caches.match("index.html")))
  );
});
