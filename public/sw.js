var CACHE_VERSION = 92;
importScripts('https://storage.googleapis.com/workbox-cdn/releases/3.6.1/workbox-sw.js');

function getCacheName(destination, inc) {
    inc = (inc || 0);
    return destination + ((destination.endsWith("s") ? "" : "s") + "-v") + (CACHE_VERSION + (inc / 10.0));
}

self.addEventListener("push", function(e) {
    var data = e.data.json();
    console.log("Push received...");

    self.registration.showNotification(data.title, {
        body: data.body || 'Notified by dial a drink',
        icon: data.icon || 'https://res.cloudinary.com/nmasuki/image/upload/c_fit,w_207,h_50/logo.png',
        buttons: data.buttons || [
            {action: '/', title: 'Continue Shopping'}
        ]
    });
});

self.addEventListener('notificationclick', function (event) {
    console.log(event.notification.data);
    event.notification.close();

    if (event.action.startsWith("/") || event.action.startsWith("http")) 
        clients.openWindow(event.action);
    else
        clients.openWindow("/");
}, false);

workbox.precaching.precacheAndRoute([{
        url: "/",
        revision: getCacheName("doc")
    }, {
        url: "/assets/fonts/digital-7.ttf",
        revision: getCacheName("fonts")
    }, {
        url: "/assets/HelveticaNeueCEfbfd.woff2",
        revision: getCacheName("fonts")
    }, {
        url: "/js/bootstrap/bootstrap-3.3.5.min.js",
        revision: getCacheName("script")
    }, {
        url: "/js/jquery/jquery-2.1.4.min.js",
        revision: getCacheName("script")
    }, {
        url: "/js/jquery/jquery-ui.min.js",
        revision: getCacheName("script")
    }, {
        url: "/js/all.scripts.min.js",
        revision: getCacheName("script")
    }, {
        url: "/styles/site.min.css",
        revision: getCacheName("style")
    }, {
        url: "/js/owlcarousel/assets/owl.carousel.min.css",
        revision: getCacheName("style")
    }, {
        url: "/js/owlcarousel/assets/owl.theme.default.min.css",
        revision: getCacheName("style")
    }, {
        url: "/js/all.scripts.min.js",
        revision: getCacheName("script")
    }, {
        url: "//fonts.googleapis.com/css?family=Montserrat:300,400,500,600,700|Open+Sans:400,700,300",
        revision: getCacheName("style")
    }, {
        url: "//code.jquery.com/ui/1.12.1/themes/base/jquery-ui.css",
        revision: getCacheName("style")
    }, {
        url: "//maxcdn.bootstrapcdn.com/font-awesome/4.4.0/css/font-awesome.min.css",
        revision: getCacheName("style")
    },
    /*{
        url: "https://cdn.okhi.io/prod/web/v4/okhi.min.js",
        revision: getCacheName("script")
    },*/
], {
    "cacheId": "dialadinkkenya",
    "directoryIndex": "/",
    "cleanUrls": false
});

workbox.clientsClaim();
workbox.skipWaiting();

workbox.routing.registerRoute(
    new RegExp('.*\.js'),
    workbox.strategies.cacheFirst({
        "cacheName": getCacheName("scripts"),
        "cacheableResponse": {
            "statuses": [0, 200]
        }
    }), 'GET');

workbox.routing.registerRoute(
    new RegExp('.*\.css'),
    workbox.strategies.cacheFirst({
        "cacheName": getCacheName("styles"),
        "cacheableResponse": {
            "statuses": [0, 200]
        }
    }), 'GET');

workbox.routing.registerRoute(
    new RegExp('https://maxcdn.bootstrapcdn.com/.*'),
    workbox.strategies.cacheFirst({
        "cacheName": getCacheName("bootstrap"),
        "cacheableResponse": {
            "statuses": [0, 200]
        }
    }), 'GET');

workbox.routing.registerRoute(
    new RegExp('https://fonts.googleapis.com/.*'),
    workbox.strategies.cacheFirst({
        "cacheName": getCacheName("googlefonts"),
        "cacheableResponse": {
            "statuses": [0, 200]
        }
    }), 'GET');

workbox.routing.registerRoute(
    /(https).*\.(?:png|jpg|jpeg|svg|gif)/,
    workbox.strategies.cacheFirst({
        "cacheName": getCacheName("images"),
        "cacheableResponse": {
            "statuses": [0, 200]
        },
        "plugins": [
            new workbox.expiration.Plugin({
                // Cache only 200 images
                maxEntries: 200,
                // Cache for a maximum of a week
                maxAgeSeconds: 7 * 24 * 60 * 60,
            })
        ],
    })
);
