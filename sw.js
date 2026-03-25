const CACHE_NAME = 'nfs-dg-offline-v1';

// 서비스 워커 설치: 기본 파일(뼈대)을 창고에 저장합니다.
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            console.log('미쓰리: 창고에 기본 물품을 적재합니다!');
            return cache.addAll([
                './',
                './index.html',
                './manifest.json'
            ]);
        })
    );
    self.skipWaiting();
});

self.addEventListener('activate', event => {
    event.waitUntil(self.clients.claim());
});

// 오프라인 가동: 인터넷이 끊기면 창고(Cache)에서 물건을 꺼내줍니다.
self.addEventListener('fetch', event => {
    // GET 요청(화면 불러오기, 디자인 불러오기 등)만 가로챕니다.
    if (event.request.method !== 'GET') return;

    event.respondWith(
        caches.match(event.request).then(cachedResponse => {
            // 창고에 물건이 있으면 바로 꺼내줍니다! (오프라인 모드)
            if (cachedResponse) {
                return cachedResponse;
            }

            // 창고에 없으면 인터넷(네트워크)에서 가져오고, 가져온 김에 창고에 복사해둡니다.
            return fetch(event.request).then(networkResponse => {
                if(!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic' && networkResponse.type !== 'cors') {
                    return networkResponse;
                }
                const responseToCache = networkResponse.clone();
                caches.open(CACHE_NAME).then(cache => {
                    cache.put(event.request, responseToCache);
                });
                return networkResponse;
            }).catch(() => {
                // 인터넷도 끊기고 창고에도 없으면 조용히 무시합니다.
                console.log('미쓰리: 오프라인 상태이며, 저장된 데이터가 없습니다.');
            });
        })
    );
});