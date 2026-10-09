// Helpers to register service worker and subscribe for push notifications
export async function getVapidPublicKey() {
  try {
    const res = await fetch('/api/push/vapidPublicKey');
    if (!res.ok) throw new Error('No VAPID key');
    const json = await res.json();
    return json.publicKey;
  } catch (e) {
    console.warn('Failed to get VAPID key', e);
    return null;
  }
}

export async function subscribeUserToPush() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    throw new Error('Push not supported');
  }
  const registration = await navigator.serviceWorker.ready;
  const vapidPublicKey = await getVapidPublicKey();
  if (!vapidPublicKey) throw new Error('Missing VAPID key');

  const convertedVapidKey = urlBase64ToUint8Array(vapidPublicKey);
  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: convertedVapidKey
  });

  // Send subscription to backend
  await fetch('/api/push/subscribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ subscription })
  });
  return subscription;
}

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
