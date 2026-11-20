export const PWA_SPLASH_SESSION_KEY = "vs-pwa-splash-session-v1"

export const pwaLaunchScript = `(function(){try{var installed=window.matchMedia("(display-mode: standalone)").matches||navigator.standalone===true;if(installed&&window.matchMedia("(max-width: 767px)").matches&&window.sessionStorage.getItem("${PWA_SPLASH_SESSION_KEY}")!=="1"){document.documentElement.setAttribute("data-pwa-launch","");}}catch{}})();`
