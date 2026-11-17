/** Runs in <head> before the first paint: picks the saved theme, or the device's setting, and puts it on <html data-theme>.
 *  All dark styles key off [data-theme="dark"], so the whole app switches at once and there is no light flash. */
export const THEME_INIT = `(function(){try{var t=localStorage.getItem('theme');if(t!=='light'&&t!=='dark')t=matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';document.documentElement.setAttribute('data-theme',t);}catch(e){}})()`;
