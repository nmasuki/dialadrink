
//This is the "Offline page" service worker
//Add this below content to your HTML page, or add the js file to your page at the very top to register sercie worker

if ('serviceWorker' in navigator) {
    // Use the window load event to keep the page load performant
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('/sw.js');
    });
  }

