(function (globalScope) {
  var APP_VERSION = '__APP_VERSION__';
  var RECOVERY_EPOCH = '2026-03-11-pwa-hotfix-1';
  var APP_VERSION_KEY = 'app_version';
  var VERSION_HISTORY_KEY = 'version_history';
  var RECOVERY_KEY = 'ratewise_pwa_recovery_epoch';
  var CACHE_KEYS = ['exchangeRates'];
  var RATEWISE_SCOPE = '/ratewise/';

  function isSupported() {
    return (
      globalScope &&
      globalScope.location &&
      globalScope.navigator &&
      globalScope.navigator.serviceWorker &&
      typeof globalScope.navigator.serviceWorker.getRegistration === 'function' &&
      globalScope.caches &&
      globalScope.localStorage &&
      typeof globalScope.location.reload === 'function'
    );
  }

  function isOnline() {
    return !globalScope.navigator || globalScope.navigator.onLine !== false;
  }

  function getStoredVersion() {
    try {
      return globalScope.localStorage.getItem(APP_VERSION_KEY);
    } catch {
      return null;
    }
  }

  function hasCompletedRecovery() {
    try {
      return globalScope.localStorage.getItem(RECOVERY_KEY) === RECOVERY_EPOCH;
    } catch {
      return false;
    }
  }

  function setRecoveryMarker() {
    try {
      globalScope.localStorage.setItem(RECOVERY_KEY, RECOVERY_EPOCH);
    } catch {
      // ignore
    }
  }

  function clearRecoveryMarker() {
    try {
      globalScope.localStorage.removeItem(RECOVERY_KEY);
    } catch {
      // ignore
    }
  }

  function isRatewiseRegistration(registration) {
    return Boolean(
      registration &&
      typeof registration.scope === 'string' &&
      registration.scope.indexOf(RATEWISE_SCOPE) !== -1,
    );
  }

  function isRatewiseCache(name) {
    return /workbox|ratewise|html-cache|js-css-cache|image-cache|font-cache|static-data|api-cache/i.test(
      name,
    );
  }

  async function getRegistrations() {
    if (typeof globalScope.navigator.serviceWorker.getRegistrations === 'function') {
      return globalScope.navigator.serviceWorker.getRegistrations();
    }

    var registration = await globalScope.navigator.serviceWorker.getRegistration();
    return registration ? [registration] : [];
  }

  async function shouldRecover() {
    if (!isSupported() || !isOnline() || !APP_VERSION || hasCompletedRecovery()) {
      return false;
    }

    var storedVersion = getStoredVersion();
    var registrations = await getRegistrations();
    var cacheNames = await globalScope.caches.keys();
    var hasRatewiseRegistration = registrations.some(isRatewiseRegistration);
    var hasRatewiseCaches = cacheNames.some(isRatewiseCache);

    if (storedVersion && storedVersion !== APP_VERSION) {
      return true;
    }

    return !storedVersion && (hasRatewiseRegistration || hasRatewiseCaches);
  }

  async function recover() {
    var registrations = await getRegistrations();
    var cacheNames = await globalScope.caches.keys();

    await Promise.all(
      registrations.filter(isRatewiseRegistration).map(function (registration) {
        return registration.unregister();
      }),
    );

    await Promise.all(
      cacheNames.filter(isRatewiseCache).map(function (cacheName) {
        return globalScope.caches.delete(cacheName);
      }),
    );

    try {
      CACHE_KEYS.concat([APP_VERSION_KEY, VERSION_HISTORY_KEY]).forEach(function (key) {
        globalScope.localStorage.removeItem(key);
      });
    } catch {
      // ignore
    }
  }

  async function bootstrapPwaRecovery() {
    if (!(await shouldRecover())) {
      return false;
    }

    setRecoveryMarker();

    try {
      await recover();
      globalScope.location.reload();
      return true;
    } catch {
      clearRecoveryMarker();
      return false;
    }
  }

  globalScope.__RATEWISE_PWA_RECOVERY_PROMISE__ = bootstrapPwaRecovery();
})(typeof globalThis !== 'undefined' ? globalThis : this);
