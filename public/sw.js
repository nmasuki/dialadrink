var CACHE_VERSION = 4.4;

function getCacheName(destination){
    return destination + "s-v" + CACHE_VERSION;
}

function updateCache(request, response) {
    return caches.open(getCacheName(request.destination)).then(function(cache){
        try {
            return cache.put(request, response.clone()).catch(console.log);
        } catch (e) {
            console.warn(e);
        }
        return null;
    });
}

function fetchCached(request) {
    if(request.headers.get("X-CSRF-Token"))//Don't use cached ajax requests
        return fetchOnline(request, false);

    return caches.open(getCacheName(request.destination)).then(function (cache) {
        return cache.match(request).then(function (matching) {
            //Check to see if you have it in the cache, Return response
            if(matching && matching.status != 404 )
                return matching.clone();
            //If not in the cache, fetch online
            console.log('[PWA] No cache match. Serving content from http!', request.url);
            return fetchOnline(request, true);
        }).catch(function (err) {
            console.warn(err)
        });
    }).catch(function (err) {
        console.warn(err);
        return fetch(request);
    });
}

function fetchOnline(request, docache, event){
    return fetch(request).then(function(response){
        if(request.headers.get("X-CSRF-Token"))//Don't cache ajax requests
            return Promise.resolve(response.clone());
        else if(request.url.indexOf("/admin") >= 0) //Don't cache admin requests
            return Promise.resolve(response.clone());

        if(event)
            event.waitUntil(updateCache(request, response));
        else
            return updateCache(request, response).then(function(){ return response.clone(); });
        
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
}

self.addEventListener('activate', function(event) {
  // Active worker won't be treated as activated until promise resolves successfully.
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.map(function(cacheName) {
          if (!cacheName.endsWith("-v" + CACHE_VERSION)) {
            console.log('Deleting out of date cache:', cacheName);            
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

//Install stage sets up the index page (home page) in the cache and opens a new cache
self.addEventListener('install', function (event) {
    var indexPage = new Request('/index.html', {destination: "document"});
    event.waitUntil(
        fetch(indexPage).then(function (response) {
            return caches.open('documents-v' + CACHE_VERSION).then(function (cache) {
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
    if(event.request.destination == "document")         
        event.respondWith(fetchOnline(event.request, true, event));
    else
        event.respondWith(fetchCached(event.request, true, event));
});
