/* Service worker Chemického skladu OPAF.
   - stránka a ikony: najprv sieť (aby prišla nová verzia), bez siete z vyrovnávacej pamäte
   - knižnice a písma z CDN (aj OCR): z vyrovnávacej pamäte, na pozadí sa obnovia
   - PubChem a ostatné: vždy zo siete, nič sa neukladá */
const VERSION="20261117-131807";
const APP="chemsklad-supa-app-"+VERSION, LIB="chemsklad-lib-v1";
const SHELL=["./","./index.html","./manifest.webmanifest","./icons/icon-192.png","./icons/icon-512.png","./icons/apple-touch-icon.png","./icons/favicon-32.png"];
const LIB_HOSTS=["cdnjs.cloudflare.com","cdn.jsdelivr.net","unpkg.com","fonts.googleapis.com","fonts.gstatic.com","tessdata.projectnaptha.com"];

self.addEventListener("install",e=>{e.waitUntil(caches.open(APP).then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting()))});
self.addEventListener("activate",e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k.startsWith("chemsklad-supa-app-")&&k!==APP).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});

self.addEventListener("fetch",e=>{
  const req=e.request;if(req.method!=="GET")return;
  const url=new URL(req.url);
  if(url.origin===location.origin){
    e.respondWith(fetch(req).then(r=>{if(r.ok){const cp=r.clone();caches.open(APP).then(c=>c.put(req.mode==="navigate"?"./index.html":req,cp))}return r})
      .catch(()=>caches.match(req.mode==="navigate"?"./index.html":req,{ignoreSearch:true}).then(r=>r||caches.match("./index.html"))));
    return;
  }
  if(LIB_HOSTS.includes(url.hostname)){
    e.respondWith(caches.open(LIB).then(async c=>{
      const hit=await c.match(req);
      const net=fetch(req).then(r=>{if(r.ok||r.type==="opaque")c.put(req,r.clone());return r}).catch(()=>hit);
      return hit||net;
    }));
  }
});
