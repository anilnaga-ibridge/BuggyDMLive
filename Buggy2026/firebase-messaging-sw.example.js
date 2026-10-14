importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js");

// Copy this file to firebase-messaging-sw.js during environment provisioning
// and replace the placeholders with that environment's Firebase web app values.
firebase.initializeApp({
    apiKey: "${FIREBASE_API_KEY}",
    authDomain: "${FIREBASE_AUTH_DOMAIN}",
    projectId: "${FIREBASE_PROJECT_ID}",
    storageBucket: "${FIREBASE_STORAGE_BUCKET}",
    messagingSenderId: "${FIREBASE_MESSAGING_SENDER_ID}",
    appId: "${FIREBASE_APP_ID}",
    measurementId: "${FIREBASE_MEASUREMENT_ID}",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
    const data = payload.data || {};
    const title = data.title || (payload.notification && payload.notification.title) || "Notification";
    const body = data.body || (payload.notification && payload.notification.body) || "";
    const image = data.image || (payload.notification && payload.notification.image) || undefined;

    self.registration.showNotification(title, {
        body,
        icon: image,
        data,
    });
});

self.addEventListener("notificationclick", (event) => {
    event.notification.close();
    const data = event.notification.data || {};
    const url = resolveTargetUrl(data);

    event.waitUntil(
        self.clients
            .matchAll({ type: "window", includeUncontrolled: true })
            .then((windowClients) => {
                const existing = windowClients.find((client) =>
                    client.url.startsWith(self.location.origin),
                );
                if (existing) {
                    existing.focus();
                    return existing.navigate(url);
                }
                return self.clients.openWindow(url);
            }),
    );
});

function resolveTargetUrl(data) {
    const base = self.location.origin;
    if (data && data.type === "order_status" && data.order_id) {
        return base + "/profile?page=orders&orderId=" + encodeURIComponent(data.order_id);
    }
    if (data && data.type === "message") {
        return base + "/profile?page=inbox";
    }
    return base + "/";
}
