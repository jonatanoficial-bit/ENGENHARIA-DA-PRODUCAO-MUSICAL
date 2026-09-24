const CACHE_NAME = 'emp-v1-11-0';
const APP_SHELL = [
  './', './index.html', './css/tokens.css', './css/base.css', './css/components.css',
  './css/layout.css', './css/phase-2.css', './css/phase-3.css', './css/platform.css', './css/final-polish.css', './css/phase-12.css', './css/phase-13.css', './css/phase-14.css', './css/phase-15.css', './css/phase-16.css', './css/phase-17.css', './css/phase-18.css', './css/phase-19.css', './css/phase-20.css', './css/phase-21.css', './css/phase-22.css', './css/phase-23-premium-learning.css', './css/phase-24-portal-experience.css', './js/app.js', './js/home.js', './js/portal.js', './js/course-catalog.js', './js/premium-learning-shell.js', './js/portal-session-controls.js', './js/student-assessments.js', './js/student-projects.js', './js/student-profile.js', './js/student-report-card.js', './js/student-access-tracker.js', './js/teacher-portal.js', './js/teacher-academic-dashboard.js', './js/academic-model.js', './js/supporters.js', './js/checkout-links.js', './js/smart-tools.js', './components/component-loader.js', './firebase/access-routing.js', './site.webmanifest'
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys
    .filter((key) => key.startsWith('emp-') && key !== CACHE_NAME)
    .map((key) => caches.delete(key)))));
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin || url.pathname.includes('/api/')) return;
  // Always obtain the latest code online; cached shell is an offline fallback only.
  event.respondWith(fetch(event.request).catch(async () => {
    const cached = await caches.match(event.request);
    return cached || Response.error();
  }));
});
