/******************************************************************************
 * Copyright ContinuousC. Licensed under the "Elastic License 2.0".           *
 ******************************************************************************/

self.addEventListener("fetch", function (event) {
  event.respondWith(
    fetch(event.request)
      .then(function (response) {
        if (response.headers.get("X-OIDC-LOGOUT") === "true") {
          self.clients.matchAll().then((clients) => {
            clients.forEach((client) => client.navigate(client.url));
          });
        }
        return response;
      })
      .catch(function (error) {
        throw error;
      })
  );
});
