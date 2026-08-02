(function () {
  try {
    var t = localStorage.getItem('pta_theme');
    if (!t) t = 'light';
    if (t === 'dark') {
      document.documentElement.classList.add('dark');
    } else if (t === 'system') {
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        document.documentElement.classList.add('dark');
      }
    } else {
      document.documentElement.classList.remove('dark');
    }
  } catch (e) {}
})();
