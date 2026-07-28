const CACHE_NAME = 'emp-v1-6-0';
const APP_SHELL = [
  './', './index.html', './css/tokens.css', './css/base.css', './css/components.css',
  './css/layout.css', './css/phase-2.css', './css/phase-3.css', './css/platform.css', './css/final-polish.css', './css/phase-12.css', './css/phase-13.css', './css/phase-14.css', './css/phase-15.css', './css/phase-16.css', './css/phase-17.css', './js/app.js', './js/home.js', './js/portal.js', './js/course-catalog.js', './js/student-assessments.js', './js/student-profile.js', './js/teacher-portal.js', './js/checkout-links.js', './js/smart-tools.js', './components/component-loader.js', './firebase/access-routing.js', './site.webmanifest'
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys
    .filter((key) => key !== CACHE_NAME)
    .map((key) => caches.delete(key)))));
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(caches.match(event.request).then((cached) => cached || fetch(event.request)));
});
