// Endpoint and GET options match paper-copter-lab and chopsticks-game.
// A no-cors response cannot supply a readable total; never invent a count.
(() => {
  if (window.rushHourAccessRecorded) return;
  window.rushHourAccessRecorded = true;
  try {
    fetch('https://script.google.com/macros/s/AKfycbxssCIHsD-N97SHxNC_GN0ihYeC0qy-lb-EY0KmSs6Gnztaph1sITMerLVEnNWOGkYc/exec?app=rush-hour-puzzle', {
      method: 'GET',
      mode: 'no-cors',
      cache: 'no-store',
      credentials: 'omit',
      keepalive: true,
    }).catch(() => {});
  } catch {
    // Logging must never block the game. No retries or success claims.
  }
})();
