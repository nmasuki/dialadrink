var CACHE_VERSION = 10.1;
importScripts('https://storage.googleapis.com/workbox-cdn/releases/3.6.1/workbox-sw.js');

function getCacheName(destination, inc) {
    return destination + "s-v" + (CACHE_VERSION + (inc/10.0);
}

workbox.precaching.precacheAndRoute([
    {
        url: "/",
        version: getCacheName("doc")
    },{
        url: "/assets/fonts/digital-7.ttf",
        version: getCacheName("fonts")
    },{
        url: "/assets/HelveticaNeueCEfbfd.woff2",
        version: getCacheName("fonts")
    },{
        url: "/js/bootstrap/bootstrap-3.3.5.min.js",
        version: getCacheName("script")
    },{
        url: "/js/jquery/jquery-2.1.4.min.js",
        version: getCacheName("script")
    },{
        url: "/js/jquery/jquery-ui.min.js",
        version: getCacheName("script")
    },{
        url: "/js/all.scripts.min.js",
        version: getCacheName("script")
    },{
        url: "/styles/site.min.css",
        version: getCacheName("styles")
    },{
        url: "/owlcarousel/assets/owl.carousel.min.css",
        version: getCacheName("styles")
    },{
        url: "/owlcarousel/assets/owl.theme.default.min.css",
        version: getCacheName("styles")
    },{
        url: "/js/all.scripts.min.js",
        version: getCacheName("script")
    }

], {
    "cacheId": "dialadinkkenya",
    "directoryIndex": "/",
    "cleanUrls": false
})


workbox.clientsClaim();
workbox.skipWaiting();

workbox.routing.registerRoute(
    new RegExp('.*\.js'),
    workbox.strategies.cacheFirst({
        "cacheName": "scripts",
        "cacheableResponse": {
            "statuses": [0, 200]
        }
    }), 'GET');

workbox.routing.registerRoute(
    new RegExp('.*\.css'),
    workbox.strategies.cacheFirst({
        "cacheName": "styles",
        "cacheableResponse": {
            "statuses": [0, 200]
        }
    }), 'GET');

workbox.routing.registerRoute(
    new RegExp('https://maxcdn.bootstrapcdn.com/.*'),
    workbox.strategies.cacheFirst({
        "cacheName": "fontawsomeiconfonts",
        "cacheableResponse": {
            "statuses": [0, 200]
        }
    }), 'GET');

workbox.routing.registerRoute(
    new RegExp('https://fonts.googleapis.com/.*'),
    workbox.strategies.cacheFirst({
        "cacheName": "googlefontscache",
        "cacheableResponse": {
            "statuses": [0, 200]
        }
    }), 'GET');

workbox.routing.registerRoute(
    /.*\.(?:png|jpg|jpeg|svg|gif)/,
    workbox.strategies.cacheFirst({
        cacheName: 'images',
        plugins: [
            new workbox.expiration.Plugin({
                // Cache only 200 images
                maxEntries: 200,
                // Cache for a maximum of a week
                maxAgeSeconds: 7 * 24 * 60 * 60,
            })
        ],
    })
);