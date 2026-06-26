type ConversionSuccessListener = () => void;

const listeners = new Set<ConversionSuccessListener>();
const SESSION_FIRED_KEY = 'ratewise:conversion-success-fired:v1';

export function notifyConversionSuccess() {
  if (typeof sessionStorage !== 'undefined') {
    try {
      if (sessionStorage.getItem(SESSION_FIRED_KEY) === 'true') {
        return;
      }
      sessionStorage.setItem(SESSION_FIRED_KEY, 'true');
    } catch {
      // Storage may be blocked in in-app browsers.
    }
  }

  listeners.forEach((listener) => listener());
}

export function subscribeConversionSuccess(listener: ConversionSuccessListener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function resetConversionSuccessSignalForTests() {
  listeners.clear();
  if (typeof sessionStorage !== 'undefined') {
    try {
      sessionStorage.removeItem(SESSION_FIRED_KEY);
    } catch {
      // ignore
    }
  }
}
