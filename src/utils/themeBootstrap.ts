export const themeBootstrapScript = `
  (function() {
    try {
      var savedTheme = localStorage.getItem('theme-preference');
      var resolvedTheme;
      if (savedTheme === 'dark' || savedTheme === 'light') {
        resolvedTheme = savedTheme;
      } else {
        resolvedTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      }
      document.documentElement.setAttribute('data-theme', resolvedTheme);
    } catch (e) {}
  })();
`;
