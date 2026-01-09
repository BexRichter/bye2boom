// Countdown timer for the footer
(() => {
  // Target date: when the deadline expires (adjust as needed)
  const targetDate = new Date('2028-12-31T23:59:59');

  function updateCountdown() {
    const now = new Date();
    const diff = targetDate - now;

    if (diff <= 0) {
      // Deadline passed
      document.querySelector('.years').innerHTML = '0<sub>YRS</sub>';
      document.querySelector('.days').innerHTML = '0<sub>DAYS</sub>';
      document.querySelector('.time').textContent = '00:00:00';
      return;
    }

    // Calculate time components
    const years = Math.floor(diff / (1000 * 60 * 60 * 24 * 365));
    const days = Math.floor((diff % (1000 * 60 * 60 * 24 * 365)) / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    // Update the display
    const yearsEl = document.querySelector('.years');
    const daysEl = document.querySelector('.days');
    const timeEl = document.querySelector('.time');

    if (yearsEl) yearsEl.innerHTML = `${years}<sub>YRS</sub>`;
    if (daysEl) daysEl.innerHTML = `${days}<sub>DAYS</sub>`;
    if (timeEl) timeEl.textContent = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }

  // Update immediately and then every second
  updateCountdown();
  setInterval(updateCountdown, 1000);
})();
