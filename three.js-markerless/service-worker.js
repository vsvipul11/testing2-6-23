const cacheName = '232233';
// Default files to always cache

const BASE = self.location.href;
var cacheAssets = [
    './style.css',

    './img/gallery.svg',
    './img/ic_photo_camera_white_48px.svg',
    './img/ic_camera_front_white_36px.svg',
    './img/ic_fullscreen_white_48px.svg',
    './img/ic_fullscreen_exit_white_48px.svg',
    './img/ic_camera_rear_white_36px.svg',

    './js/adapter.min.js',
    './js/DetectRTC.min.js',
    './js/howler.core.min.js',
    './js/main.js',
    './js/screenfull.min.js',

    './libs/camera_utils.js',
    './libs/control_utils.js',
    './libs/drawing_utils.js',
    './libs/hands.js',
    './libs/mediapipe.js',

    './libs/hands/hands_solution_packed_assets_loader.js',
    './libs/hands/hands_solution_wasm_bin.js',
    './libs/hands/hands_solution_wasm_bin.wasm',
    './libs/hands/hands_solution_simd_wasm_bin.js',
    './libs/hands/hands_solution_simd_wasm_bin.wasm',
    './libs/hands/hands_solution_packed_assets.data',
    './libs/hands/hand_landmark_full.tflite',
    './libs/hands/hand_landmark_lite.tflite',
    './libs/hands/hands.binarypb',

    './snd/beep.mp3',
    './snd/click.mp3',
];
const noCaching = [
    './',
    './index.html',
    './service-worker.js',
]

// Call Install Event
self.addEventListener('install', e => {
    console.log('Service Worker: Installed');

    e.waitUntil(
        caches
        .open(cacheName)
        .then(cache => {
            console.log('Service Worker: Caching Files');
            cache.addAll(cacheAssets);
        })
        .then(() => self.skipWaiting())
    );
});

// Call Activate Event
self.addEventListener('activate', e => {
    console.log('Service Worker: Activated');
    // Remove unwanted caches
    e.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cache => {
                    if (cache !== cacheName) {
                        console.log('Service Worker: Clearing Old Cache');
                        return caches.delete(cache);
                    }
                })
            );
        })
    );
});

// Call Fetch Event
//self.addEventListener('fetch', e => {
//
//	e.respondWith(
//	  fetch(e.request)
//		.then(res => {
//		  // Make copy/clone of response
////		  const resClone = res.clone();
//		  // Open cahce
//		  caches.open(cacheName).then(cache => {
//			// Add response to cache
//			cache.put(e.request, res);
//		  });
//		  return res;
//		})
//		.catch(err => caches.match(e.request).then(res => res))
//	);
//  });

self.addEventListener('fetch', event => {
    // Prevent the default, and handle the request ourselves.
    event.respondWith(async function() {
        // Try to get the response from a cache.
        const cachedResponse = await caches.match(event.request);
        // Return it if we found one.
        var eventUrl = event.request.url.replace(BASE, './')
        var is_cache = noCaching.find(url => {
            return eventUrl == url;
        });
        if (cachedResponse && typeof(is_cache) == 'undefined') return cachedResponse;
        // If we didn't find a match in the cache, use the network.
        return fetch(event.request).then(res => {
            // Make copy/clone of response
            const resClone = res.clone();
            // Open cahce
            caches.open(cacheName).then(cache => {
                // Add response to cache
                cache.put(event.request, resClone);
            });
            return res;
        });
    }());
});