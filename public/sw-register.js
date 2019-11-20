var applicationServerPublicKey = window.vapidPublicKey;

function urlB64ToUint8Array(base64String) {
  var padding = '='.repeat((4 - base64String.length % 4) % 4);
  var base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  var rawData = window.atob(base64);
  var outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
}

function getCookie(name) {
  var start = document.cookie.indexOf(name) + name.length + 1;
  var sepPos = document.cookie.indexOf(";", start);
  return document.cookie.substr(start, (sepPos < 0 ? document.cookie.length : sepPos) - start);
}

function updateSubscriptionOnServer(subscription) {
  // Send subscription to application server
  console.log("Sending subscription data fo Server!", subscription);
  fetch('/api/user/webpush', {
      method: "POST",
      body: JSON.stringify(subscription || {}),
      headers: {
        'content-type': 'application/json',
        'X-Requested-With': 'xmlhttprequest',
        'X-CSRF-Token': getCookie("XSRF-TOKEN")
      }
    })
    .then(res => console.log("Subscription data sent!", res))
    .catch(err => console.warn("Error sending subscription!", err));
}

//Register Push notification
function subscribeToPushNotification(swReg) {
  console.log('Subscribing user to push notifications');
  swReg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlB64ToUint8Array(applicationServerPublicKey)
    })
    .then(function (subscription) {
      console.log("Subscription OK!");
      updateSubscriptionOnServer(subscription);
    })
    .catch(function (err) {
      console.log('Failed to subscribe the user: ', err);
    });
}

function initializePush(swReg) {
  // Set the initial subscription value
  swReg.pushManager.getSubscription()
    .then(function (subscription) {
      if (subscription) {
        console.log('User already subscribed.');
        updateSubscriptionOnServer(subscription);
      } else {
        console.log('User is NOT subscribed.');
        subscribeToPushNotification(swReg);
      }
    });
}


//This is the "Offline page" service worker
if ('serviceWorker' in navigator) {
  console.log('Service Worker is supported!');

  // Use the window load event to keep the page load performant
  window.addEventListener('load', function () {
    navigator.serviceWorker.register('/sw.js')
      .then(function (swReg) {
        console.log('Service Worker is registered', swReg);
        if ('PushManager' in window) {
          console.log('Push is supported!');
          setTimeout(function () {
            initializePush(swReg);
          }, 5000);
        } else {
          console.warn('Push messaging is not supported');
        }

      })
      .catch(function (error) {
        console.error('Service Worker Error', error);
      });
  });

  if (Notification.permission === 'denied') {
    console.log("Push Messaging Blocked.");
    updateSubscriptionOnServer(null);
  }
}