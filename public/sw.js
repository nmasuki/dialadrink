//This is the "Offline copy of pages" wervice worker

//Install stage sets up the index page (home page) in the cahche and opens a new cache
self.addEventListener('install', function (event) {
    var indexPage = new Request('/');
    event.waitUntil(
        fetch(indexPage).then(function (response) {
            return caches.open('pwa-offline').then(function (cache) {
                //console.log('[PWA] Cached index page during Install', response.url);
                try {
                    return cache.put(indexPage, response);
                } catch (e) {
                    console.warn(e);
                }
                return null;
            }).catch(function (err) {
                console.warn(err)
            });
        }).catch(function (err) {
            console.warn(err)
        }));
});

//If any fetch fails, it will look for the request in the cache and serve it from there first
self.addEventListener('fetch', function (event) {
    var updateCache = function (request) {
        return caches.open('pwa-offline').then(function (cache) {
            return fetch(request).then(function (response) {
                try {
                    return cache.put(request, response);
                } catch (e) {
                    console.warn(e);
                }
                return null;
            }).catch(function (err) {
                console.warn(err)
            });
        }).catch(function (err) {
            console.warn(err)
        });
    };

    if (event.request.url.toLowerCase().indexOf(location.origin.toLowerCase()) >= 0) {
        //if (event.request.url.indexOf("/admin") < 0)
        event.waitUntil(updateCache(event.request));

        event.respondWith(
            fetch(event.request).catch(function (error) {
                console.log('[PWA] Network request Failed. Serving content from cache: ' + error);

                //Check to see if you have it in the cache
                //Return response
                //If not in the cache, then return error page
                return caches.open('pwa-offline').then(function (cache) {
                    return cache.match(event.request).then(function (matching) {
                        return !matching || matching.status == 404 ? Promise.reject('no-match') : matching;
                    });
                }).catch(function (err) {
                    console.warn(err)
                });
            }).catch(function (err) {
                console.warn(err)
            })
        );
    }
})
