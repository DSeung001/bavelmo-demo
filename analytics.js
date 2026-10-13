// Google Analytics(GA4). Loads gtag only when config.json carries a measurement ID, so local runs without one send nothing.
(() => {
  'use strict';
  async function start() {
    try {
      const response = await fetch('config.json', { signal: AbortSignal.timeout(8000) });
      if (!response.ok) return;
      const id = (await response.json()).gaMeasurementId;
      if (typeof id !== 'string' || !/^G-[A-Z0-9]+$/.test(id)) return;
      window.dataLayer = window.dataLayer || [];
      // gtag.js reads the queued Arguments objects, so this must not be an arrow function.
      window.gtag = function gtag() { window.dataLayer.push(arguments); };
      window.gtag('js', new Date());
      window.gtag('config', id);
      const script = document.createElement('script');
      script.async = true;
      script.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(id);
      document.head.append(script);
    } catch {
      // Analytics must never block the page.
    }
  }
  start();
})();
