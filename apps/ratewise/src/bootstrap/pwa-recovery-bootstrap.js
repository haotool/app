/* global URL, isRatewiseCache, clearRatewiseCaches */
(function (globalScope) {
  var APP_VERSION = '__APP_VERSION__';
  // RECOVERY_EPOCH 使用 APP_VERSION：每次部署自動觸發舊版用戶的快取清理。
  // 舊的硬編碼 epoch 只觸發一次；改用版本號後，任何新版本均視為新 epoch。
  var RECOVERY_EPOCH = APP_VERSION;
  var APP_VERSION_KEY = 'app_version';
  var VERSION_HISTORY_KEY = 'version_history';
  var RECOVERY_KEY = 'ratewise_pwa_recovery_epoch';
  var CACHE_KEYS = ['exchangeRates'];
  var RATEWISE_SCOPE = '__RATEWISE_SCOPE__';
  /* CACHE_OWNERSHIP_HELPERS */

  function getScopeUrl() {
    return new URL(RATEWISE_SCOPE, globalScope.location.href).href;
  }

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
      registration.scope === getScopeUrl(),
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
    var hasRatewiseCaches = cacheNames.some(function (name) {
      return isRatewiseCache(name, getScopeUrl());
    });

    if (storedVersion && storedVersion !== APP_VERSION) {
      return true;
    }

    return !storedVersion && (hasRatewiseRegistration || hasRatewiseCaches);
  }

  async function recover() {
    var registrations = await getRegistrations();
    await Promise.all(
      registrations.filter(isRatewiseRegistration).map(function (registration) {
        return registration.unregister();
      }),
    );

    await clearRatewiseCaches(globalScope.caches, getScopeUrl());

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
