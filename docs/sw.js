/**
 * Copyright 2018 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *     http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// If the loader is already loaded, just stop.
if (!self.define) {
  let registry = {};

  // Used for `eval` and `importScripts` where we can't get script URL by other means.
  // In both cases, it's safe to use a global var because those functions are synchronous.
  let nextDefineUri;

  const singleRequire = (uri, parentUri) => {
    uri = new URL(uri + ".js", parentUri).href;
    return registry[uri] || (
      
        new Promise(resolve => {
          if ("document" in self) {
            const script = document.createElement("script");
            script.src = uri;
            script.onload = resolve;
            document.head.appendChild(script);
          } else {
            nextDefineUri = uri;
            importScripts(uri);
            resolve();
          }
        })
      
      .then(() => {
        let promise = registry[uri];
        if (!promise) {
          throw new Error(`Module ${uri} didn’t register its module`);
        }
        return promise;
      })
    );
  };

  self.define = (depsNames, factory) => {
    const uri = nextDefineUri || ("document" in self ? document.currentScript.src : "") || location.href;
    if (registry[uri]) {
      // Module is already loading or loaded.
      return;
    }
    let exports = {};
    const require = depUri => singleRequire(depUri, uri);
    const specialDeps = {
      module: { uri },
      exports,
      require
    };
    registry[uri] = Promise.all(depsNames.map(
      depName => specialDeps[depName] || require(depName)
    )).then(deps => {
      factory(...deps);
      return exports;
    });
  };
}
define(['./workbox-7e5eb42b'], (function (workbox) { 'use strict';

  self.skipWaiting();
  workbox.clientsClaim();
  /**
   * The precacheAndRoute() method efficiently caches and responds to
   * requests for URLs in the manifest.
   * See https://goo.gl/S9QRab
   */
  workbox.precacheAndRoute([{
    "url": "manifest.json",
    "revision": "dccdc21c84f6d5d52f3837ca4c0a61e4"
  }, {
    "url": "index.html",
    "revision": "85409784f8d315130b6b5abeebb14e0f"
  }, {
    "url": "favicon.ico",
    "revision": "e1625ff44026e81605560873d7fcf309"
  }, {
    "url": "icons/icon-512.png",
    "revision": "34e303b08c3898cf4d0296c88a7d32bd"
  }, {
    "url": "icons/icon-192.png",
    "revision": "16d8cd7e83a3b7e2f9f8a050e9a42ab1"
  }, {
    "url": "assets/virtual_pwa-register-4pQuFLuT.js",
    "revision": null
  }, {
    "url": "assets/vendor-C8bt_7hy.js",
    "revision": null
  }, {
    "url": "assets/thunder_peaks-02-Cxzv1XsC.json",
    "revision": null
  }, {
    "url": "assets/thunder_peaks-01-ChzRoqxD.json",
    "revision": null
  }, {
    "url": "assets/three-CENNe__j.js",
    "revision": null
  }, {
    "url": "assets/test-grove-BmjgbXKt.json",
    "revision": null
  }, {
    "url": "assets/stone_canyon-02-kPIR3dKT.json",
    "revision": null
  }, {
    "url": "assets/stone_canyon-01-C4f1aU_c.json",
    "revision": null
  }, {
    "url": "assets/spirit_beast-DulYBVVe.png",
    "revision": null
  }, {
    "url": "assets/secret_manual-CScs60z0.png",
    "revision": null
  }, {
    "url": "assets/phaser-B0p4fdBD.js",
    "revision": null
  }, {
    "url": "assets/moon_lake-02-DS0wZPCG.json",
    "revision": null
  }, {
    "url": "assets/moon_lake-01-DkQVrr6H.json",
    "revision": null
  }, {
    "url": "assets/mist_forest-02-DdAOJlgm.json",
    "revision": null
  }, {
    "url": "assets/mist_forest-01-Bx-wjaqd.json",
    "revision": null
  }, {
    "url": "assets/index-ZmMzrzUK.css",
    "revision": null
  }, {
    "url": "assets/index-Dt4J_hcV.js",
    "revision": null
  }, {
    "url": "assets/hidden_cave-B3gJzmH4.png",
    "revision": null
  }, {
    "url": "assets/frozen_palace-02-4AezZ3rv.json",
    "revision": null
  }, {
    "url": "assets/frozen_palace-01-C9e8neCI.json",
    "revision": null
  }, {
    "url": "assets/forgotten_memory-DIUJcbN9.png",
    "revision": null
  }, {
    "url": "assets/fallen_village-star-west-B1ZQQldU.json",
    "revision": null
  }, {
    "url": "assets/fallen_village-star-south-DLdKl8yo.json",
    "revision": null
  }, {
    "url": "assets/fallen_village-star-north-CkbuSf9B.json",
    "revision": null
  }, {
    "url": "assets/fallen_village-star-east-BBp6AkFf.json",
    "revision": null
  }, {
    "url": "assets/fallen_village-02-XesD3VXW.json",
    "revision": null
  }, {
    "url": "assets/fallen_village-01-DZ3_n6ln.json",
    "revision": null
  }, {
    "url": "assets/burning_desert-02-DUZWQQS6.json",
    "revision": null
  }, {
    "url": "assets/burning_desert-01-CFHgFukv.json",
    "revision": null
  }, {
    "url": "assets/ancient_sword-C5uOUtmA.png",
    "revision": null
  }, {
    "url": "assets/ancient_inheritance-CItgCV1O.png",
    "revision": null
  }, {
    "url": "favicon.ico",
    "revision": "e1625ff44026e81605560873d7fcf309"
  }, {
    "url": "icons/icon-192.png",
    "revision": "16d8cd7e83a3b7e2f9f8a050e9a42ab1"
  }, {
    "url": "icons/icon-512.png",
    "revision": "34e303b08c3898cf4d0296c88a7d32bd"
  }, {
    "url": "manifest.json",
    "revision": "dccdc21c84f6d5d52f3837ca4c0a61e4"
  }], {});
  workbox.cleanupOutdatedCaches();
  workbox.registerRoute(new workbox.NavigationRoute(workbox.createHandlerBoundToURL("/path-of-dao/index.html")));

}));
