/* istanbul ignore file */
/**
 * React 19 相容的 react-is shim
 * - React 19 移除 AsyncMode，舊版 react-is 在 SSR/SSG 時會嘗試設定 undefined.AsyncMode 而崩潰
 * - 依據 React 19 升級指南以最小實作覆蓋常用 API，避免觸碰移除的 AsyncMode 實作
 *
 * 參考來源：
 * - [context7:reactjs/react.dev:2024-04-25] React 19 upgrade guide（移除 legacy render API 與 AsyncMode）
 */

const hasSymbol = typeof Symbol === 'function' && typeof Symbol.for === 'function';

const REACT_ELEMENT_TYPE = hasSymbol ? Symbol.for('react.element') : 0xeac7;
const REACT_PORTAL_TYPE = hasSymbol ? Symbol.for('react.portal') : 0xeaca;
const REACT_FRAGMENT_TYPE = hasSymbol ? Symbol.for('react.fragment') : 0xeacb;
const REACT_STRICT_MODE_TYPE = hasSymbol ? Symbol.for('react.strict_mode') : 0xeacc;
const REACT_PROFILER_TYPE = hasSymbol ? Symbol.for('react.profiler') : 0xead2;
const REACT_PROVIDER_TYPE = hasSymbol ? Symbol.for('react.provider') : 0xeacd;
const REACT_CONTEXT_TYPE = hasSymbol ? Symbol.for('react.context') : 0xeace;
const REACT_FORWARD_REF_TYPE = hasSymbol ? Symbol.for('react.forward_ref') : 0xead0;
const REACT_SUSPENSE_TYPE = hasSymbol ? Symbol.for('react.suspense') : 0xead1;
const REACT_SUSPENSE_LIST_TYPE = hasSymbol ? Symbol.for('react.suspense_list') : 0xead8;
const REACT_MEMO_TYPE = hasSymbol ? Symbol.for('react.memo') : 0xead3;
const REACT_LAZY_TYPE = hasSymbol ? Symbol.for('react.lazy') : 0xead4;

// React 19 不再使用，但為舊版依賴保留穩定常數，避免寫入 undefined 導致崩潰
const AsyncMode = hasSymbol ? Symbol.for('react.async_mode') : 0xeacf;
const ConcurrentMode = hasSymbol ? Symbol.for('react.concurrent_mode') : 0xeacf;

interface ReactLike {
  $$typeof?: symbol | number;
  type?: unknown;
}

function typeOf(object?: ReactLike | null): symbol | number | undefined {
  if (typeof object !== 'object' || object === null) {
    return undefined;
  }

  const $$typeof = object.$$typeof;

  switch ($$typeof) {
    case REACT_ELEMENT_TYPE: {
      const type = object.type as ReactLike;
      switch (type) {
        case REACT_FRAGMENT_TYPE:
        case REACT_STRICT_MODE_TYPE:
        case REACT_PROFILER_TYPE:
        case REACT_SUSPENSE_TYPE:
        case REACT_SUSPENSE_LIST_TYPE:
          return type;
        default: {
          const innerType = type?.$$typeof;
          switch (innerType) {
            case REACT_CONTEXT_TYPE:
            case REACT_PROVIDER_TYPE:
            case REACT_FORWARD_REF_TYPE:
            case REACT_MEMO_TYPE:
            case REACT_LAZY_TYPE:
              return innerType;
            default:
              return REACT_ELEMENT_TYPE;
          }
        }
      }
    }
    case REACT_PORTAL_TYPE:
      return REACT_PORTAL_TYPE;
    default:
      return undefined;
  }
}

function isValidElementType(type: unknown): boolean {
  if (typeof type === 'string' || typeof type === 'function') {
    return true;
  }

  if (
    type === REACT_FRAGMENT_TYPE ||
    type === REACT_PROFILER_TYPE ||
    type === REACT_STRICT_MODE_TYPE ||
    type === REACT_SUSPENSE_TYPE ||
    type === REACT_SUSPENSE_LIST_TYPE
  ) {
    return true;
  }

  if (typeof type === 'object' && type !== null) {
    const $$typeof = (type as ReactLike).$$typeof;
    return (
      $$typeof === REACT_CONTEXT_TYPE ||
      $$typeof === REACT_PROVIDER_TYPE ||
      $$typeof === REACT_FORWARD_REF_TYPE ||
      $$typeof === REACT_MEMO_TYPE ||
      $$typeof === REACT_LAZY_TYPE
    );
  }

  return false;
}

const isElement = (object: unknown): boolean => typeOf(object as ReactLike) === REACT_ELEMENT_TYPE;
const isPortal = (object: unknown): boolean => typeOf(object as ReactLike) === REACT_PORTAL_TYPE;
const isFragment = (object: unknown): boolean =>
  typeOf(object as ReactLike) === REACT_FRAGMENT_TYPE;
const isStrictMode = (object: unknown): boolean =>
  typeOf(object as ReactLike) === REACT_STRICT_MODE_TYPE;
const isProfiler = (object: unknown): boolean =>
  typeOf(object as ReactLike) === REACT_PROFILER_TYPE;
const isContextProvider = (object: unknown): boolean =>
  typeOf(object as ReactLike) === REACT_PROVIDER_TYPE;
const isContextConsumer = (object: unknown): boolean =>
  typeOf(object as ReactLike) === REACT_CONTEXT_TYPE;
const isForwardRef = (object: unknown): boolean =>
  typeOf(object as ReactLike) === REACT_FORWARD_REF_TYPE;
const isSuspense = (object: unknown): boolean =>
  typeOf(object as ReactLike) === REACT_SUSPENSE_TYPE;
const isSuspenseList = (object: unknown): boolean =>
  typeOf(object as ReactLike) === REACT_SUSPENSE_LIST_TYPE;
const isMemo = (object: unknown): boolean => typeOf(object as ReactLike) === REACT_MEMO_TYPE;
const isLazy = (object: unknown): boolean => typeOf(object as ReactLike) === REACT_LAZY_TYPE;
const isAsyncMode = (object: unknown): boolean => typeOf(object as ReactLike) === AsyncMode;
const isConcurrentMode = (object: unknown): boolean =>
  typeOf(object as ReactLike) === ConcurrentMode;

// 與 react-is 導出的常數同名，以維持 API 相容
const Fragment = REACT_FRAGMENT_TYPE;
const Portal = REACT_PORTAL_TYPE;
const StrictMode = REACT_STRICT_MODE_TYPE;
const Profiler = REACT_PROFILER_TYPE;
const ContextProvider = REACT_PROVIDER_TYPE;
const ContextConsumer = REACT_CONTEXT_TYPE;
const ForwardRef = REACT_FORWARD_REF_TYPE;
const Suspense = REACT_SUSPENSE_TYPE;
const SuspenseList = REACT_SUSPENSE_LIST_TYPE;
const Memo = REACT_MEMO_TYPE;
const Lazy = REACT_LAZY_TYPE;

export {
  typeOf,
  isElement,
  isValidElementType,
  isPortal,
  isFragment,
  isStrictMode,
  isProfiler,
  isContextProvider,
  isContextConsumer,
  isForwardRef,
  isSuspense,
  isSuspenseList,
  isMemo,
  isLazy,
  isAsyncMode,
  isConcurrentMode,
  AsyncMode,
  ConcurrentMode,
  // 常數導出 - 保持與 react-is 相同的命名
  Fragment,
  Portal,
  StrictMode,
  Profiler,
  ContextProvider,
  ContextConsumer,
  ForwardRef,
  Suspense,
  SuspenseList,
  Memo,
  Lazy,
  REACT_ELEMENT_TYPE,
  REACT_PORTAL_TYPE,
  REACT_FRAGMENT_TYPE,
  REACT_STRICT_MODE_TYPE,
  REACT_PROFILER_TYPE,
  REACT_PROVIDER_TYPE,
  REACT_CONTEXT_TYPE,
  REACT_FORWARD_REF_TYPE,
  REACT_SUSPENSE_TYPE,
  REACT_SUSPENSE_LIST_TYPE,
  REACT_MEMO_TYPE,
  REACT_LAZY_TYPE,
};
