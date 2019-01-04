//This is the "Offline copy of pages" wervice worker

//Install stage sets up the index page (home page) in the cahche and opens a new cache
self.addEventListener('install', function (event) {
    var indexPage = new Request('/index.html');
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
            
    var fetchCached = function (request, dofetch) {
        return caches.open('pwa-offline').then(function (cache) {
            return cache.match(event.request).then(function (matching) {
                //Check to see if you have it in the cache, Return response
                //If not in the cache, fetch online
                return !matching || matching.status == 404 
                    ? (dofetch? fetchOnline(request): Promise.reject('no-match'))
                    : matching;
            }).catch(function (err) {
                console.warn(err)
            });
        }).catch(function (err) {
            console.warn(err);
            return fetch(request);
        });
    };

    var fetchOnline = function(request, docache){
        return fetch(request).then(function(response){
            event.waitUntil(caches.open('pwa-offline').then(function (cache) {
                try {
                    return cache.put(request, response);
                } catch (e) {
                    console.warn(e);
                }
            }).catch(function (err) {
                console.warn(err);
            }));
            
            return response;
        }).catch(function (error) {
            console.log('[PWA] Network request Failed. Serving content from cache: ' + error);
            if(docache)
                return fetchCached(request, false);

            return Promise.reject('no-match');
        }).catch(function (err) {
            console.warn(err);
            return fetchCached(request, false)
        });
    };

    event.respondWith(fetchOnline(event.request));
})
