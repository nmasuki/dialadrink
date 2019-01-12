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
    var updateCache = function (request, response) {
        return caches.open('pwa-offline').then(function(cache){
            try {
                return cache.put(request, response.clone()).catch(console.log);
            } catch (e) {
                console.warn(e);
            }
            return null;
        });
    };

    var fetchCached = function (request, dofetch) {
        if(request.headers.get("X-Requested-With"))
            return fetch(request);

        docache = dofetch || dofetch == undefined;
        
        return caches.open('pwa-offline').then(function (cache) {
            return cache.match(request).then(function (matching) {
                //Check to see if you have it in the cache, Return response
                if(matching && matching.status != 404 )
                    return matching.clone();
                //If not in the cache, fetch online
                if(dofetch)
                {
                    console.log('[PWA] No cache match. Serving content from http!', request.url);
                    return fetchOnline(request);
                }
                else 
                    return Promise.reject('no-match');

            }).catch(function (err) {
                console.warn(err)
            });
        }).catch(function (err) {
            console.warn(err);
            return fetch(request);
        });
    };

    var fetchOnline = function(request, docache){
        docache = docache || docache == undefined;
        return fetch(request).then(function(response){
            if(request.url.indexOf("/admin") < 0)
                event.waitUntil(updateCache(request, response));
            return Promise.resolve(response.clone());
        }).catch(function (error) {
            console.log('[PWA] Network request Failed. ' + error);
            if(docache)
            {
                console.log("[PWA] Serving content from cache:", request.url);
                return fetchCached(request, false);
            }
            else
                return Promise.reject('no-match');
        });
    };

    event.respondWith(fetchCached(event.request, true));
})
