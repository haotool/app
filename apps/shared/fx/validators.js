/* eslint-disable */
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __commonJS = (cb, mod) =>
  function __require() {
    return (
      mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod),
      mod.exports
    );
  };
var __copyProps = (to, from, except, desc) => {
  if ((from && typeof from === 'object') || typeof from === 'function') {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, {
          get: () => from[key],
          enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable,
        });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (
  (target = mod != null ? __create(__getProtoOf(mod)) : {}),
  __copyProps(
    // If the importer is in node compatibility mode or this is not an ESM
    // file that has been converted to a CommonJS file using a Babel-
    // compatible transform (i.e. "__esModule" has not been set), then set
    // "default" to the CommonJS "module.exports" for node compatibility.
    isNodeMode || !mod || !mod.__esModule
      ? __defProp(target, 'default', { value: mod, enumerable: true })
      : target,
    mod,
  )
);

// node_modules/.pnpm/ajv-formats@3.0.1_ajv@8.20.0/node_modules/ajv-formats/dist/formats.js
var require_formats = __commonJS({
  'node_modules/.pnpm/ajv-formats@3.0.1_ajv@8.20.0/node_modules/ajv-formats/dist/formats.js'(
    exports,
  ) {
    'use strict';
    Object.defineProperty(exports, '__esModule', { value: true });
    exports.formatNames = exports.fastFormats = exports.fullFormats = void 0;
    function fmtDef(validate, compare) {
      return { validate, compare };
    }
    exports.fullFormats = {
      // date: http://tools.ietf.org/html/rfc3339#section-5.6
      date: fmtDef(date, compareDate),
      // date-time: http://tools.ietf.org/html/rfc3339#section-5.6
      time: fmtDef(getTime(true), compareTime),
      'date-time': fmtDef(getDateTime(true), compareDateTime),
      'iso-time': fmtDef(getTime(), compareIsoTime),
      'iso-date-time': fmtDef(getDateTime(), compareIsoDateTime),
      // duration: https://tools.ietf.org/html/rfc3339#appendix-A
      duration: /^P(?!$)((\d+Y)?(\d+M)?(\d+D)?(T(?=\d)(\d+H)?(\d+M)?(\d+S)?)?|(\d+W)?)$/,
      uri,
      'uri-reference':
        /^(?:[a-z][a-z0-9+\-.]*:)?(?:\/?\/(?:(?:[a-z0-9\-._~!$&'()*+,;=:]|%[0-9a-f]{2})*@)?(?:\[(?:(?:(?:(?:[0-9a-f]{1,4}:){6}|::(?:[0-9a-f]{1,4}:){5}|(?:[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){4}|(?:(?:[0-9a-f]{1,4}:){0,1}[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){3}|(?:(?:[0-9a-f]{1,4}:){0,2}[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){2}|(?:(?:[0-9a-f]{1,4}:){0,3}[0-9a-f]{1,4})?::[0-9a-f]{1,4}:|(?:(?:[0-9a-f]{1,4}:){0,4}[0-9a-f]{1,4})?::)(?:[0-9a-f]{1,4}:[0-9a-f]{1,4}|(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?))|(?:(?:[0-9a-f]{1,4}:){0,5}[0-9a-f]{1,4})?::[0-9a-f]{1,4}|(?:(?:[0-9a-f]{1,4}:){0,6}[0-9a-f]{1,4})?::)|[Vv][0-9a-f]+\.[a-z0-9\-._~!$&'()*+,;=:]+)\]|(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)|(?:[a-z0-9\-._~!$&'"()*+,;=]|%[0-9a-f]{2})*)(?::\d*)?(?:\/(?:[a-z0-9\-._~!$&'"()*+,;=:@]|%[0-9a-f]{2})*)*|\/(?:(?:[a-z0-9\-._~!$&'"()*+,;=:@]|%[0-9a-f]{2})+(?:\/(?:[a-z0-9\-._~!$&'"()*+,;=:@]|%[0-9a-f]{2})*)*)?|(?:[a-z0-9\-._~!$&'"()*+,;=:@]|%[0-9a-f]{2})+(?:\/(?:[a-z0-9\-._~!$&'"()*+,;=:@]|%[0-9a-f]{2})*)*)?(?:\?(?:[a-z0-9\-._~!$&'"()*+,;=:@/?]|%[0-9a-f]{2})*)?(?:#(?:[a-z0-9\-._~!$&'"()*+,;=:@/?]|%[0-9a-f]{2})*)?$/i,
      // uri-template: https://tools.ietf.org/html/rfc6570
      'uri-template':
        /^(?:(?:[^\x00-\x20"'<>%\\^`{|}]|%[0-9a-f]{2})|\{[+#./;?&=,!@|]?(?:[a-z0-9_]|%[0-9a-f]{2})+(?::[1-9][0-9]{0,3}|\*)?(?:,(?:[a-z0-9_]|%[0-9a-f]{2})+(?::[1-9][0-9]{0,3}|\*)?)*\})*$/i,
      // For the source: https://gist.github.com/dperini/729294
      // For test cases: https://mathiasbynens.be/demo/url-regex
      url: /^(?:https?|ftp):\/\/(?:\S+(?::\S*)?@)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z0-9\u{00a1}-\u{ffff}]+-)*[a-z0-9\u{00a1}-\u{ffff}]+)(?:\.(?:[a-z0-9\u{00a1}-\u{ffff}]+-)*[a-z0-9\u{00a1}-\u{ffff}]+)*(?:\.(?:[a-z\u{00a1}-\u{ffff}]{2,})))(?::\d{2,5})?(?:\/[^\s]*)?$/iu,
      email:
        /^[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/i,
      hostname:
        /^(?=.{1,253}\.?$)[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[-0-9a-z]{0,61}[0-9a-z])?)*\.?$/i,
      // optimized https://www.safaribooksonline.com/library/view/regular-expressions-cookbook/9780596802837/ch07s16.html
      ipv4: /^(?:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)\.){3}(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)$/,
      ipv6: /^((([0-9a-f]{1,4}:){7}([0-9a-f]{1,4}|:))|(([0-9a-f]{1,4}:){6}(:[0-9a-f]{1,4}|((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9a-f]{1,4}:){5}(((:[0-9a-f]{1,4}){1,2})|:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9a-f]{1,4}:){4}(((:[0-9a-f]{1,4}){1,3})|((:[0-9a-f]{1,4})?:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9a-f]{1,4}:){3}(((:[0-9a-f]{1,4}){1,4})|((:[0-9a-f]{1,4}){0,2}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9a-f]{1,4}:){2}(((:[0-9a-f]{1,4}){1,5})|((:[0-9a-f]{1,4}){0,3}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9a-f]{1,4}:){1}(((:[0-9a-f]{1,4}){1,6})|((:[0-9a-f]{1,4}){0,4}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(:(((:[0-9a-f]{1,4}){1,7})|((:[0-9a-f]{1,4}){0,5}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:)))$/i,
      regex,
      // uuid: http://tools.ietf.org/html/rfc4122
      uuid: /^(?:urn:uuid:)?[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i,
      // JSON-pointer: https://tools.ietf.org/html/rfc6901
      // uri fragment: https://tools.ietf.org/html/rfc3986#appendix-A
      'json-pointer': /^(?:\/(?:[^~/]|~0|~1)*)*$/,
      'json-pointer-uri-fragment': /^#(?:\/(?:[a-z0-9_\-.!$&'()*+,;:=@]|%[0-9a-f]{2}|~0|~1)*)*$/i,
      // relative JSON-pointer: http://tools.ietf.org/html/draft-luff-relative-json-pointer-00
      'relative-json-pointer': /^(?:0|[1-9][0-9]*)(?:#|(?:\/(?:[^~/]|~0|~1)*)*)$/,
      // the following formats are used by the openapi specification: https://spec.openapis.org/oas/v3.0.0#data-types
      // byte: https://github.com/miguelmota/is-base64
      byte,
      // signed 32 bit integer
      int32: { type: 'number', validate: validateInt32 },
      // signed 64 bit integer
      int64: { type: 'number', validate: validateInt64 },
      // C-type float
      float: { type: 'number', validate: validateNumber },
      // C-type double
      double: { type: 'number', validate: validateNumber },
      // hint to the UI to hide input strings
      password: true,
      // unchecked string payload
      binary: true,
    };
    exports.fastFormats = {
      ...exports.fullFormats,
      date: fmtDef(/^\d\d\d\d-[0-1]\d-[0-3]\d$/, compareDate),
      time: fmtDef(
        /^(?:[0-2]\d:[0-5]\d:[0-5]\d|23:59:60)(?:\.\d+)?(?:z|[+-]\d\d(?::?\d\d)?)$/i,
        compareTime,
      ),
      'date-time': fmtDef(
        /^\d\d\d\d-[0-1]\d-[0-3]\dt(?:[0-2]\d:[0-5]\d:[0-5]\d|23:59:60)(?:\.\d+)?(?:z|[+-]\d\d(?::?\d\d)?)$/i,
        compareDateTime,
      ),
      'iso-time': fmtDef(
        /^(?:[0-2]\d:[0-5]\d:[0-5]\d|23:59:60)(?:\.\d+)?(?:z|[+-]\d\d(?::?\d\d)?)?$/i,
        compareIsoTime,
      ),
      'iso-date-time': fmtDef(
        /^\d\d\d\d-[0-1]\d-[0-3]\d[t\s](?:[0-2]\d:[0-5]\d:[0-5]\d|23:59:60)(?:\.\d+)?(?:z|[+-]\d\d(?::?\d\d)?)?$/i,
        compareIsoDateTime,
      ),
      // uri: https://github.com/mafintosh/is-my-json-valid/blob/master/formats.js
      uri: /^(?:[a-z][a-z0-9+\-.]*:)(?:\/?\/)?[^\s]*$/i,
      'uri-reference': /^(?:(?:[a-z][a-z0-9+\-.]*:)?\/?\/)?(?:[^\\\s#][^\s#]*)?(?:#[^\\\s]*)?$/i,
      // email (sources from jsen validator):
      // http://stackoverflow.com/questions/201323/using-a-regular-expression-to-validate-an-email-address#answer-8829363
      // http://www.w3.org/TR/html5/forms.html#valid-e-mail-address (search for 'wilful violation')
      email:
        /^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)*$/i,
    };
    exports.formatNames = Object.keys(exports.fullFormats);
    function isLeapYear(year) {
      return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
    }
    var DATE = /^(\d\d\d\d)-(\d\d)-(\d\d)$/;
    var DAYS = [0, 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    function date(str) {
      const matches = DATE.exec(str);
      if (!matches) return false;
      const year = +matches[1];
      const month = +matches[2];
      const day = +matches[3];
      return (
        month >= 1 &&
        month <= 12 &&
        day >= 1 &&
        day <= (month === 2 && isLeapYear(year) ? 29 : DAYS[month])
      );
    }
    function compareDate(d1, d2) {
      if (!(d1 && d2)) return void 0;
      if (d1 > d2) return 1;
      if (d1 < d2) return -1;
      return 0;
    }
    var TIME = /^(\d\d):(\d\d):(\d\d(?:\.\d+)?)(z|([+-])(\d\d)(?::?(\d\d))?)?$/i;
    function getTime(strictTimeZone) {
      return function time(str) {
        const matches = TIME.exec(str);
        if (!matches) return false;
        const hr = +matches[1];
        const min = +matches[2];
        const sec = +matches[3];
        const tz = matches[4];
        const tzSign = matches[5] === '-' ? -1 : 1;
        const tzH = +(matches[6] || 0);
        const tzM = +(matches[7] || 0);
        if (tzH > 23 || tzM > 59 || (strictTimeZone && !tz)) return false;
        if (hr <= 23 && min <= 59 && sec < 60) return true;
        const utcMin = min - tzM * tzSign;
        const utcHr = hr - tzH * tzSign - (utcMin < 0 ? 1 : 0);
        return (utcHr === 23 || utcHr === -1) && (utcMin === 59 || utcMin === -1) && sec < 61;
      };
    }
    function compareTime(s1, s2) {
      if (!(s1 && s2)) return void 0;
      const t1 = /* @__PURE__ */ new Date('2020-01-01T' + s1).valueOf();
      const t2 = /* @__PURE__ */ new Date('2020-01-01T' + s2).valueOf();
      if (!(t1 && t2)) return void 0;
      return t1 - t2;
    }
    function compareIsoTime(t1, t2) {
      if (!(t1 && t2)) return void 0;
      const a1 = TIME.exec(t1);
      const a2 = TIME.exec(t2);
      if (!(a1 && a2)) return void 0;
      t1 = a1[1] + a1[2] + a1[3];
      t2 = a2[1] + a2[2] + a2[3];
      if (t1 > t2) return 1;
      if (t1 < t2) return -1;
      return 0;
    }
    var DATE_TIME_SEPARATOR = /t|\s/i;
    function getDateTime(strictTimeZone) {
      const time = getTime(strictTimeZone);
      return function date_time(str) {
        const dateTime = str.split(DATE_TIME_SEPARATOR);
        return dateTime.length === 2 && date(dateTime[0]) && time(dateTime[1]);
      };
    }
    function compareDateTime(dt1, dt2) {
      if (!(dt1 && dt2)) return void 0;
      const d1 = new Date(dt1).valueOf();
      const d2 = new Date(dt2).valueOf();
      if (!(d1 && d2)) return void 0;
      return d1 - d2;
    }
    function compareIsoDateTime(dt1, dt2) {
      if (!(dt1 && dt2)) return void 0;
      const [d1, t1] = dt1.split(DATE_TIME_SEPARATOR);
      const [d2, t2] = dt2.split(DATE_TIME_SEPARATOR);
      const res = compareDate(d1, d2);
      if (res === void 0) return void 0;
      return res || compareTime(t1, t2);
    }
    var NOT_URI_FRAGMENT = /\/|:/;
    var URI =
      /^(?:[a-z][a-z0-9+\-.]*:)(?:\/?\/(?:(?:[a-z0-9\-._~!$&'()*+,;=:]|%[0-9a-f]{2})*@)?(?:\[(?:(?:(?:(?:[0-9a-f]{1,4}:){6}|::(?:[0-9a-f]{1,4}:){5}|(?:[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){4}|(?:(?:[0-9a-f]{1,4}:){0,1}[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){3}|(?:(?:[0-9a-f]{1,4}:){0,2}[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){2}|(?:(?:[0-9a-f]{1,4}:){0,3}[0-9a-f]{1,4})?::[0-9a-f]{1,4}:|(?:(?:[0-9a-f]{1,4}:){0,4}[0-9a-f]{1,4})?::)(?:[0-9a-f]{1,4}:[0-9a-f]{1,4}|(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?))|(?:(?:[0-9a-f]{1,4}:){0,5}[0-9a-f]{1,4})?::[0-9a-f]{1,4}|(?:(?:[0-9a-f]{1,4}:){0,6}[0-9a-f]{1,4})?::)|[Vv][0-9a-f]+\.[a-z0-9\-._~!$&'()*+,;=:]+)\]|(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)|(?:[a-z0-9\-._~!$&'()*+,;=]|%[0-9a-f]{2})*)(?::\d*)?(?:\/(?:[a-z0-9\-._~!$&'()*+,;=:@]|%[0-9a-f]{2})*)*|\/(?:(?:[a-z0-9\-._~!$&'()*+,;=:@]|%[0-9a-f]{2})+(?:\/(?:[a-z0-9\-._~!$&'()*+,;=:@]|%[0-9a-f]{2})*)*)?|(?:[a-z0-9\-._~!$&'()*+,;=:@]|%[0-9a-f]{2})+(?:\/(?:[a-z0-9\-._~!$&'()*+,;=:@]|%[0-9a-f]{2})*)*)(?:\?(?:[a-z0-9\-._~!$&'()*+,;=:@/?]|%[0-9a-f]{2})*)?(?:#(?:[a-z0-9\-._~!$&'()*+,;=:@/?]|%[0-9a-f]{2})*)?$/i;
    function uri(str) {
      return NOT_URI_FRAGMENT.test(str) && URI.test(str);
    }
    var BYTE = /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/gm;
    function byte(str) {
      BYTE.lastIndex = 0;
      return BYTE.test(str);
    }
    var MIN_INT32 = -(2 ** 31);
    var MAX_INT32 = 2 ** 31 - 1;
    function validateInt32(value) {
      return Number.isInteger(value) && value <= MAX_INT32 && value >= MIN_INT32;
    }
    function validateInt64(value) {
      return Number.isInteger(value);
    }
    function validateNumber() {
      return true;
    }
    var Z_ANCHOR = /[^\\]\\Z/;
    function regex(str) {
      if (Z_ANCHOR.test(str)) return false;
      try {
        new RegExp(str);
        return true;
      } catch (e) {
        return false;
      }
    }
  },
});

// node_modules/.pnpm/ajv@8.20.0/node_modules/ajv/dist/runtime/ucs2length.js
var require_ucs2length = __commonJS({
  'node_modules/.pnpm/ajv@8.20.0/node_modules/ajv/dist/runtime/ucs2length.js'(exports) {
    'use strict';
    Object.defineProperty(exports, '__esModule', { value: true });
    function ucs2length(str) {
      const len = str.length;
      let length = 0;
      let pos = 0;
      let value;
      while (pos < len) {
        length++;
        value = str.charCodeAt(pos++);
        if (value >= 55296 && value <= 56319 && pos < len) {
          value = str.charCodeAt(pos);
          if ((value & 64512) === 56320) pos++;
        }
      }
      return length;
    }
    exports.default = ucs2length;
    ucs2length.code = 'require("ajv/dist/runtime/ucs2length").default';
  },
});

// fx-validators.js
var import_formats = __toESM(require_formats());
var validateSourceQuote = validate82;
var schema20 = {
  type: 'object',
  properties: {
    providerId: { type: 'string', maxLength: 512 },
    subjectCurrency: { type: 'string', pattern: '^[A-Z]{3}$', maxLength: 512 },
    priceCurrency: { type: 'string', pattern: '^[A-Z]{3}$', maxLength: 512 },
    unitAmount: { type: 'string', pattern: '^(0|[1-9][0-9]*)(\\.[0-9]+)?$', maxLength: 512 },
    buy: {
      anyOf: [
        { type: 'string', pattern: '^(0|[1-9][0-9]*)(\\.[0-9]+)?$', maxLength: 512 },
        { type: 'null' },
      ],
    },
    sell: {
      anyOf: [
        { type: 'string', pattern: '^(0|[1-9][0-9]*)(\\.[0-9]+)?$', maxLength: 512 },
        { type: 'null' },
      ],
    },
    sourcePublishedAt: {
      anyOf: [{ type: 'string', format: 'date-time', maxLength: 512 }, { type: 'null' }],
    },
    fetchedAt: { type: 'string', format: 'date-time', maxLength: 512 },
    lastSuccessfulCheckAt: { type: 'string', format: 'date-time', maxLength: 512 },
    serviceCountry: { type: 'string', pattern: '^[A-Z]{2}$', maxLength: 512 },
    deliveryMethod: { enum: ['cash', 'account'] },
    channel: { enum: ['branch', 'online', 'atm', 'unknown'] },
    branchId: { type: 'string', maxLength: 512 },
    denominations: {
      type: 'array',
      items: { type: 'string', pattern: '^(0|[1-9][0-9]*)(\\.[0-9]+)?$', maxLength: 512 },
      maxItems: 100,
    },
    amountRange: {
      type: 'object',
      properties: {
        currency: { type: 'string', pattern: '^[A-Z]{3}$', maxLength: 512 },
        min: { type: 'string', pattern: '^(0|[1-9][0-9]*)(\\.[0-9]+)?$', maxLength: 512 },
        max: { type: 'string', pattern: '^(0|[1-9][0-9]*)(\\.[0-9]+)?$', maxLength: 512 },
      },
      required: ['currency', 'min', 'max'],
      additionalProperties: false,
    },
    qualifications: { type: 'array', items: { type: 'string', maxLength: 512 }, maxItems: 100 },
    feeStatus: { enum: ['unknown', 'no_additional_fee', 'unsupported'] },
    sourceUrl: { type: 'string', maxLength: 512 },
    originalBuyField: { type: 'string', maxLength: 512 },
    originalSellField: { type: 'string', maxLength: 512 },
    mappingVersion: { type: 'string', maxLength: 512 },
    originalUnitAmount: {
      type: 'string',
      pattern: '^(0|[1-9][0-9]*)(\\.[0-9]+)?$',
      maxLength: 512,
    },
    dataKind: { enum: ['published_board', 'fixed_fallback', 'reference', 'derived_cross'] },
    feeEvidenceUrl: { type: 'string', minLength: 1, maxLength: 512, pattern: '^https://' },
  },
  required: [
    'providerId',
    'subjectCurrency',
    'priceCurrency',
    'unitAmount',
    'buy',
    'sell',
    'sourcePublishedAt',
    'fetchedAt',
    'lastSuccessfulCheckAt',
    'serviceCountry',
    'deliveryMethod',
    'channel',
  ],
  additionalProperties: false,
};
var func1 = Object.prototype.hasOwnProperty;
var func2 = require_ucs2length().default;
var pattern3 = new RegExp('^[A-Z]{3}$', 'u');
var pattern5 = new RegExp('^(0|[1-9][0-9]*)(\\.[0-9]+)?$', 'u');
var pattern8 = new RegExp('^[A-Z]{2}$', 'u');
var pattern14 = new RegExp('^https://', 'u');
var formats0 = import_formats.fullFormats['date-time'];
function validate82(
  data,
  { instancePath = '', parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {},
) {
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate82.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = void 0;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = void 0;
  }
  if (errors === 0) {
    if (data && typeof data == 'object' && !Array.isArray(data)) {
      let missing0;
      if (
        (data.providerId === void 0 && (missing0 = 'providerId')) ||
        (data.subjectCurrency === void 0 && (missing0 = 'subjectCurrency')) ||
        (data.priceCurrency === void 0 && (missing0 = 'priceCurrency')) ||
        (data.unitAmount === void 0 && (missing0 = 'unitAmount')) ||
        (data.buy === void 0 && (missing0 = 'buy')) ||
        (data.sell === void 0 && (missing0 = 'sell')) ||
        (data.sourcePublishedAt === void 0 && (missing0 = 'sourcePublishedAt')) ||
        (data.fetchedAt === void 0 && (missing0 = 'fetchedAt')) ||
        (data.lastSuccessfulCheckAt === void 0 && (missing0 = 'lastSuccessfulCheckAt')) ||
        (data.serviceCountry === void 0 && (missing0 = 'serviceCountry')) ||
        (data.deliveryMethod === void 0 && (missing0 = 'deliveryMethod')) ||
        (data.channel === void 0 && (missing0 = 'channel'))
      ) {
        validate82.errors = [
          {
            instancePath,
            schemaPath: '#/required',
            keyword: 'required',
            params: { missingProperty: missing0 },
            message: "must have required property '" + missing0 + "'",
          },
        ];
        return false;
      } else {
        const _errs1 = errors;
        for (const key0 in data) {
          if (!func1.call(schema20.properties, key0)) {
            validate82.errors = [
              {
                instancePath,
                schemaPath: '#/additionalProperties',
                keyword: 'additionalProperties',
                params: { additionalProperty: key0 },
                message: 'must NOT have additional properties',
              },
            ];
            return false;
            break;
          }
        }
        if (_errs1 === errors) {
          if (data.providerId !== void 0) {
            let data0 = data.providerId;
            const _errs2 = errors;
            if (errors === _errs2) {
              if (typeof data0 === 'string') {
                if (func2(data0) > 512) {
                  validate82.errors = [
                    {
                      instancePath: instancePath + '/providerId',
                      schemaPath: '#/properties/providerId/maxLength',
                      keyword: 'maxLength',
                      params: { limit: 512 },
                      message: 'must NOT have more than 512 characters',
                    },
                  ];
                  return false;
                }
              } else {
                validate82.errors = [
                  {
                    instancePath: instancePath + '/providerId',
                    schemaPath: '#/properties/providerId/type',
                    keyword: 'type',
                    params: { type: 'string' },
                    message: 'must be string',
                  },
                ];
                return false;
              }
            }
            var valid0 = _errs2 === errors;
          } else {
            var valid0 = true;
          }
          if (valid0) {
            if (data.subjectCurrency !== void 0) {
              let data1 = data.subjectCurrency;
              const _errs4 = errors;
              if (errors === _errs4) {
                if (typeof data1 === 'string') {
                  if (func2(data1) > 512) {
                    validate82.errors = [
                      {
                        instancePath: instancePath + '/subjectCurrency',
                        schemaPath: '#/properties/subjectCurrency/maxLength',
                        keyword: 'maxLength',
                        params: { limit: 512 },
                        message: 'must NOT have more than 512 characters',
                      },
                    ];
                    return false;
                  } else {
                    if (!pattern3.test(data1)) {
                      validate82.errors = [
                        {
                          instancePath: instancePath + '/subjectCurrency',
                          schemaPath: '#/properties/subjectCurrency/pattern',
                          keyword: 'pattern',
                          params: { pattern: '^[A-Z]{3}$' },
                          message: 'must match pattern "^[A-Z]{3}$"',
                        },
                      ];
                      return false;
                    }
                  }
                } else {
                  validate82.errors = [
                    {
                      instancePath: instancePath + '/subjectCurrency',
                      schemaPath: '#/properties/subjectCurrency/type',
                      keyword: 'type',
                      params: { type: 'string' },
                      message: 'must be string',
                    },
                  ];
                  return false;
                }
              }
              var valid0 = _errs4 === errors;
            } else {
              var valid0 = true;
            }
            if (valid0) {
              if (data.priceCurrency !== void 0) {
                let data2 = data.priceCurrency;
                const _errs6 = errors;
                if (errors === _errs6) {
                  if (typeof data2 === 'string') {
                    if (func2(data2) > 512) {
                      validate82.errors = [
                        {
                          instancePath: instancePath + '/priceCurrency',
                          schemaPath: '#/properties/priceCurrency/maxLength',
                          keyword: 'maxLength',
                          params: { limit: 512 },
                          message: 'must NOT have more than 512 characters',
                        },
                      ];
                      return false;
                    } else {
                      if (!pattern3.test(data2)) {
                        validate82.errors = [
                          {
                            instancePath: instancePath + '/priceCurrency',
                            schemaPath: '#/properties/priceCurrency/pattern',
                            keyword: 'pattern',
                            params: { pattern: '^[A-Z]{3}$' },
                            message: 'must match pattern "^[A-Z]{3}$"',
                          },
                        ];
                        return false;
                      }
                    }
                  } else {
                    validate82.errors = [
                      {
                        instancePath: instancePath + '/priceCurrency',
                        schemaPath: '#/properties/priceCurrency/type',
                        keyword: 'type',
                        params: { type: 'string' },
                        message: 'must be string',
                      },
                    ];
                    return false;
                  }
                }
                var valid0 = _errs6 === errors;
              } else {
                var valid0 = true;
              }
              if (valid0) {
                if (data.unitAmount !== void 0) {
                  let data3 = data.unitAmount;
                  const _errs8 = errors;
                  if (errors === _errs8) {
                    if (typeof data3 === 'string') {
                      if (func2(data3) > 512) {
                        validate82.errors = [
                          {
                            instancePath: instancePath + '/unitAmount',
                            schemaPath: '#/properties/unitAmount/maxLength',
                            keyword: 'maxLength',
                            params: { limit: 512 },
                            message: 'must NOT have more than 512 characters',
                          },
                        ];
                        return false;
                      } else {
                        if (!pattern5.test(data3)) {
                          validate82.errors = [
                            {
                              instancePath: instancePath + '/unitAmount',
                              schemaPath: '#/properties/unitAmount/pattern',
                              keyword: 'pattern',
                              params: { pattern: '^(0|[1-9][0-9]*)(\\.[0-9]+)?$' },
                              message: 'must match pattern "^(0|[1-9][0-9]*)(\\.[0-9]+)?$"',
                            },
                          ];
                          return false;
                        }
                      }
                    } else {
                      validate82.errors = [
                        {
                          instancePath: instancePath + '/unitAmount',
                          schemaPath: '#/properties/unitAmount/type',
                          keyword: 'type',
                          params: { type: 'string' },
                          message: 'must be string',
                        },
                      ];
                      return false;
                    }
                  }
                  var valid0 = _errs8 === errors;
                } else {
                  var valid0 = true;
                }
                if (valid0) {
                  if (data.buy !== void 0) {
                    let data4 = data.buy;
                    const _errs10 = errors;
                    const _errs11 = errors;
                    let valid1 = false;
                    const _errs12 = errors;
                    if (errors === _errs12) {
                      if (typeof data4 === 'string') {
                        if (func2(data4) > 512) {
                          const err0 = {
                            instancePath: instancePath + '/buy',
                            schemaPath: '#/properties/buy/anyOf/0/maxLength',
                            keyword: 'maxLength',
                            params: { limit: 512 },
                            message: 'must NOT have more than 512 characters',
                          };
                          if (vErrors === null) {
                            vErrors = [err0];
                          } else {
                            vErrors.push(err0);
                          }
                          errors++;
                        } else {
                          if (!pattern5.test(data4)) {
                            const err1 = {
                              instancePath: instancePath + '/buy',
                              schemaPath: '#/properties/buy/anyOf/0/pattern',
                              keyword: 'pattern',
                              params: { pattern: '^(0|[1-9][0-9]*)(\\.[0-9]+)?$' },
                              message: 'must match pattern "^(0|[1-9][0-9]*)(\\.[0-9]+)?$"',
                            };
                            if (vErrors === null) {
                              vErrors = [err1];
                            } else {
                              vErrors.push(err1);
                            }
                            errors++;
                          }
                        }
                      } else {
                        const err2 = {
                          instancePath: instancePath + '/buy',
                          schemaPath: '#/properties/buy/anyOf/0/type',
                          keyword: 'type',
                          params: { type: 'string' },
                          message: 'must be string',
                        };
                        if (vErrors === null) {
                          vErrors = [err2];
                        } else {
                          vErrors.push(err2);
                        }
                        errors++;
                      }
                    }
                    var _valid0 = _errs12 === errors;
                    valid1 = valid1 || _valid0;
                    const _errs14 = errors;
                    if (data4 !== null) {
                      const err3 = {
                        instancePath: instancePath + '/buy',
                        schemaPath: '#/properties/buy/anyOf/1/type',
                        keyword: 'type',
                        params: { type: 'null' },
                        message: 'must be null',
                      };
                      if (vErrors === null) {
                        vErrors = [err3];
                      } else {
                        vErrors.push(err3);
                      }
                      errors++;
                    }
                    var _valid0 = _errs14 === errors;
                    valid1 = valid1 || _valid0;
                    if (!valid1) {
                      const err4 = {
                        instancePath: instancePath + '/buy',
                        schemaPath: '#/properties/buy/anyOf',
                        keyword: 'anyOf',
                        params: {},
                        message: 'must match a schema in anyOf',
                      };
                      if (vErrors === null) {
                        vErrors = [err4];
                      } else {
                        vErrors.push(err4);
                      }
                      errors++;
                      validate82.errors = vErrors;
                      return false;
                    } else {
                      errors = _errs11;
                      if (vErrors !== null) {
                        if (_errs11) {
                          vErrors.length = _errs11;
                        } else {
                          vErrors = null;
                        }
                      }
                    }
                    var valid0 = _errs10 === errors;
                  } else {
                    var valid0 = true;
                  }
                  if (valid0) {
                    if (data.sell !== void 0) {
                      let data5 = data.sell;
                      const _errs16 = errors;
                      const _errs17 = errors;
                      let valid2 = false;
                      const _errs18 = errors;
                      if (errors === _errs18) {
                        if (typeof data5 === 'string') {
                          if (func2(data5) > 512) {
                            const err5 = {
                              instancePath: instancePath + '/sell',
                              schemaPath: '#/properties/sell/anyOf/0/maxLength',
                              keyword: 'maxLength',
                              params: { limit: 512 },
                              message: 'must NOT have more than 512 characters',
                            };
                            if (vErrors === null) {
                              vErrors = [err5];
                            } else {
                              vErrors.push(err5);
                            }
                            errors++;
                          } else {
                            if (!pattern5.test(data5)) {
                              const err6 = {
                                instancePath: instancePath + '/sell',
                                schemaPath: '#/properties/sell/anyOf/0/pattern',
                                keyword: 'pattern',
                                params: { pattern: '^(0|[1-9][0-9]*)(\\.[0-9]+)?$' },
                                message: 'must match pattern "^(0|[1-9][0-9]*)(\\.[0-9]+)?$"',
                              };
                              if (vErrors === null) {
                                vErrors = [err6];
                              } else {
                                vErrors.push(err6);
                              }
                              errors++;
                            }
                          }
                        } else {
                          const err7 = {
                            instancePath: instancePath + '/sell',
                            schemaPath: '#/properties/sell/anyOf/0/type',
                            keyword: 'type',
                            params: { type: 'string' },
                            message: 'must be string',
                          };
                          if (vErrors === null) {
                            vErrors = [err7];
                          } else {
                            vErrors.push(err7);
                          }
                          errors++;
                        }
                      }
                      var _valid1 = _errs18 === errors;
                      valid2 = valid2 || _valid1;
                      const _errs20 = errors;
                      if (data5 !== null) {
                        const err8 = {
                          instancePath: instancePath + '/sell',
                          schemaPath: '#/properties/sell/anyOf/1/type',
                          keyword: 'type',
                          params: { type: 'null' },
                          message: 'must be null',
                        };
                        if (vErrors === null) {
                          vErrors = [err8];
                        } else {
                          vErrors.push(err8);
                        }
                        errors++;
                      }
                      var _valid1 = _errs20 === errors;
                      valid2 = valid2 || _valid1;
                      if (!valid2) {
                        const err9 = {
                          instancePath: instancePath + '/sell',
                          schemaPath: '#/properties/sell/anyOf',
                          keyword: 'anyOf',
                          params: {},
                          message: 'must match a schema in anyOf',
                        };
                        if (vErrors === null) {
                          vErrors = [err9];
                        } else {
                          vErrors.push(err9);
                        }
                        errors++;
                        validate82.errors = vErrors;
                        return false;
                      } else {
                        errors = _errs17;
                        if (vErrors !== null) {
                          if (_errs17) {
                            vErrors.length = _errs17;
                          } else {
                            vErrors = null;
                          }
                        }
                      }
                      var valid0 = _errs16 === errors;
                    } else {
                      var valid0 = true;
                    }
                    if (valid0) {
                      if (data.sourcePublishedAt !== void 0) {
                        let data6 = data.sourcePublishedAt;
                        const _errs22 = errors;
                        const _errs23 = errors;
                        let valid3 = false;
                        const _errs24 = errors;
                        if (errors === _errs24) {
                          if (errors === _errs24) {
                            if (typeof data6 === 'string') {
                              if (func2(data6) > 512) {
                                const err10 = {
                                  instancePath: instancePath + '/sourcePublishedAt',
                                  schemaPath: '#/properties/sourcePublishedAt/anyOf/0/maxLength',
                                  keyword: 'maxLength',
                                  params: { limit: 512 },
                                  message: 'must NOT have more than 512 characters',
                                };
                                if (vErrors === null) {
                                  vErrors = [err10];
                                } else {
                                  vErrors.push(err10);
                                }
                                errors++;
                              } else {
                                if (!formats0.validate(data6)) {
                                  const err11 = {
                                    instancePath: instancePath + '/sourcePublishedAt',
                                    schemaPath: '#/properties/sourcePublishedAt/anyOf/0/format',
                                    keyword: 'format',
                                    params: { format: 'date-time' },
                                    message: 'must match format "date-time"',
                                  };
                                  if (vErrors === null) {
                                    vErrors = [err11];
                                  } else {
                                    vErrors.push(err11);
                                  }
                                  errors++;
                                }
                              }
                            } else {
                              const err12 = {
                                instancePath: instancePath + '/sourcePublishedAt',
                                schemaPath: '#/properties/sourcePublishedAt/anyOf/0/type',
                                keyword: 'type',
                                params: { type: 'string' },
                                message: 'must be string',
                              };
                              if (vErrors === null) {
                                vErrors = [err12];
                              } else {
                                vErrors.push(err12);
                              }
                              errors++;
                            }
                          }
                        }
                        var _valid2 = _errs24 === errors;
                        valid3 = valid3 || _valid2;
                        const _errs26 = errors;
                        if (data6 !== null) {
                          const err13 = {
                            instancePath: instancePath + '/sourcePublishedAt',
                            schemaPath: '#/properties/sourcePublishedAt/anyOf/1/type',
                            keyword: 'type',
                            params: { type: 'null' },
                            message: 'must be null',
                          };
                          if (vErrors === null) {
                            vErrors = [err13];
                          } else {
                            vErrors.push(err13);
                          }
                          errors++;
                        }
                        var _valid2 = _errs26 === errors;
                        valid3 = valid3 || _valid2;
                        if (!valid3) {
                          const err14 = {
                            instancePath: instancePath + '/sourcePublishedAt',
                            schemaPath: '#/properties/sourcePublishedAt/anyOf',
                            keyword: 'anyOf',
                            params: {},
                            message: 'must match a schema in anyOf',
                          };
                          if (vErrors === null) {
                            vErrors = [err14];
                          } else {
                            vErrors.push(err14);
                          }
                          errors++;
                          validate82.errors = vErrors;
                          return false;
                        } else {
                          errors = _errs23;
                          if (vErrors !== null) {
                            if (_errs23) {
                              vErrors.length = _errs23;
                            } else {
                              vErrors = null;
                            }
                          }
                        }
                        var valid0 = _errs22 === errors;
                      } else {
                        var valid0 = true;
                      }
                      if (valid0) {
                        if (data.fetchedAt !== void 0) {
                          let data7 = data.fetchedAt;
                          const _errs28 = errors;
                          if (errors === _errs28) {
                            if (errors === _errs28) {
                              if (typeof data7 === 'string') {
                                if (func2(data7) > 512) {
                                  validate82.errors = [
                                    {
                                      instancePath: instancePath + '/fetchedAt',
                                      schemaPath: '#/properties/fetchedAt/maxLength',
                                      keyword: 'maxLength',
                                      params: { limit: 512 },
                                      message: 'must NOT have more than 512 characters',
                                    },
                                  ];
                                  return false;
                                } else {
                                  if (!formats0.validate(data7)) {
                                    validate82.errors = [
                                      {
                                        instancePath: instancePath + '/fetchedAt',
                                        schemaPath: '#/properties/fetchedAt/format',
                                        keyword: 'format',
                                        params: { format: 'date-time' },
                                        message: 'must match format "date-time"',
                                      },
                                    ];
                                    return false;
                                  }
                                }
                              } else {
                                validate82.errors = [
                                  {
                                    instancePath: instancePath + '/fetchedAt',
                                    schemaPath: '#/properties/fetchedAt/type',
                                    keyword: 'type',
                                    params: { type: 'string' },
                                    message: 'must be string',
                                  },
                                ];
                                return false;
                              }
                            }
                          }
                          var valid0 = _errs28 === errors;
                        } else {
                          var valid0 = true;
                        }
                        if (valid0) {
                          if (data.lastSuccessfulCheckAt !== void 0) {
                            let data8 = data.lastSuccessfulCheckAt;
                            const _errs30 = errors;
                            if (errors === _errs30) {
                              if (errors === _errs30) {
                                if (typeof data8 === 'string') {
                                  if (func2(data8) > 512) {
                                    validate82.errors = [
                                      {
                                        instancePath: instancePath + '/lastSuccessfulCheckAt',
                                        schemaPath: '#/properties/lastSuccessfulCheckAt/maxLength',
                                        keyword: 'maxLength',
                                        params: { limit: 512 },
                                        message: 'must NOT have more than 512 characters',
                                      },
                                    ];
                                    return false;
                                  } else {
                                    if (!formats0.validate(data8)) {
                                      validate82.errors = [
                                        {
                                          instancePath: instancePath + '/lastSuccessfulCheckAt',
                                          schemaPath: '#/properties/lastSuccessfulCheckAt/format',
                                          keyword: 'format',
                                          params: { format: 'date-time' },
                                          message: 'must match format "date-time"',
                                        },
                                      ];
                                      return false;
                                    }
                                  }
                                } else {
                                  validate82.errors = [
                                    {
                                      instancePath: instancePath + '/lastSuccessfulCheckAt',
                                      schemaPath: '#/properties/lastSuccessfulCheckAt/type',
                                      keyword: 'type',
                                      params: { type: 'string' },
                                      message: 'must be string',
                                    },
                                  ];
                                  return false;
                                }
                              }
                            }
                            var valid0 = _errs30 === errors;
                          } else {
                            var valid0 = true;
                          }
                          if (valid0) {
                            if (data.serviceCountry !== void 0) {
                              let data9 = data.serviceCountry;
                              const _errs32 = errors;
                              if (errors === _errs32) {
                                if (typeof data9 === 'string') {
                                  if (func2(data9) > 512) {
                                    validate82.errors = [
                                      {
                                        instancePath: instancePath + '/serviceCountry',
                                        schemaPath: '#/properties/serviceCountry/maxLength',
                                        keyword: 'maxLength',
                                        params: { limit: 512 },
                                        message: 'must NOT have more than 512 characters',
                                      },
                                    ];
                                    return false;
                                  } else {
                                    if (!pattern8.test(data9)) {
                                      validate82.errors = [
                                        {
                                          instancePath: instancePath + '/serviceCountry',
                                          schemaPath: '#/properties/serviceCountry/pattern',
                                          keyword: 'pattern',
                                          params: { pattern: '^[A-Z]{2}$' },
                                          message: 'must match pattern "^[A-Z]{2}$"',
                                        },
                                      ];
                                      return false;
                                    }
                                  }
                                } else {
                                  validate82.errors = [
                                    {
                                      instancePath: instancePath + '/serviceCountry',
                                      schemaPath: '#/properties/serviceCountry/type',
                                      keyword: 'type',
                                      params: { type: 'string' },
                                      message: 'must be string',
                                    },
                                  ];
                                  return false;
                                }
                              }
                              var valid0 = _errs32 === errors;
                            } else {
                              var valid0 = true;
                            }
                            if (valid0) {
                              if (data.deliveryMethod !== void 0) {
                                let data10 = data.deliveryMethod;
                                const _errs34 = errors;
                                if (!(data10 === 'cash' || data10 === 'account')) {
                                  validate82.errors = [
                                    {
                                      instancePath: instancePath + '/deliveryMethod',
                                      schemaPath: '#/properties/deliveryMethod/enum',
                                      keyword: 'enum',
                                      params: {
                                        allowedValues: schema20.properties.deliveryMethod.enum,
                                      },
                                      message: 'must be equal to one of the allowed values',
                                    },
                                  ];
                                  return false;
                                }
                                var valid0 = _errs34 === errors;
                              } else {
                                var valid0 = true;
                              }
                              if (valid0) {
                                if (data.channel !== void 0) {
                                  let data11 = data.channel;
                                  const _errs35 = errors;
                                  if (
                                    !(
                                      data11 === 'branch' ||
                                      data11 === 'online' ||
                                      data11 === 'atm' ||
                                      data11 === 'unknown'
                                    )
                                  ) {
                                    validate82.errors = [
                                      {
                                        instancePath: instancePath + '/channel',
                                        schemaPath: '#/properties/channel/enum',
                                        keyword: 'enum',
                                        params: { allowedValues: schema20.properties.channel.enum },
                                        message: 'must be equal to one of the allowed values',
                                      },
                                    ];
                                    return false;
                                  }
                                  var valid0 = _errs35 === errors;
                                } else {
                                  var valid0 = true;
                                }
                                if (valid0) {
                                  if (data.branchId !== void 0) {
                                    let data12 = data.branchId;
                                    const _errs36 = errors;
                                    if (errors === _errs36) {
                                      if (typeof data12 === 'string') {
                                        if (func2(data12) > 512) {
                                          validate82.errors = [
                                            {
                                              instancePath: instancePath + '/branchId',
                                              schemaPath: '#/properties/branchId/maxLength',
                                              keyword: 'maxLength',
                                              params: { limit: 512 },
                                              message: 'must NOT have more than 512 characters',
                                            },
                                          ];
                                          return false;
                                        }
                                      } else {
                                        validate82.errors = [
                                          {
                                            instancePath: instancePath + '/branchId',
                                            schemaPath: '#/properties/branchId/type',
                                            keyword: 'type',
                                            params: { type: 'string' },
                                            message: 'must be string',
                                          },
                                        ];
                                        return false;
                                      }
                                    }
                                    var valid0 = _errs36 === errors;
                                  } else {
                                    var valid0 = true;
                                  }
                                  if (valid0) {
                                    if (data.denominations !== void 0) {
                                      let data13 = data.denominations;
                                      const _errs38 = errors;
                                      if (errors === _errs38) {
                                        if (Array.isArray(data13)) {
                                          if (data13.length > 100) {
                                            validate82.errors = [
                                              {
                                                instancePath: instancePath + '/denominations',
                                                schemaPath: '#/properties/denominations/maxItems',
                                                keyword: 'maxItems',
                                                params: { limit: 100 },
                                                message: 'must NOT have more than 100 items',
                                              },
                                            ];
                                            return false;
                                          } else {
                                            var valid4 = true;
                                            const len0 = data13.length;
                                            for (let i0 = 0; i0 < len0; i0++) {
                                              let data14 = data13[i0];
                                              const _errs40 = errors;
                                              if (errors === _errs40) {
                                                if (typeof data14 === 'string') {
                                                  if (func2(data14) > 512) {
                                                    validate82.errors = [
                                                      {
                                                        instancePath:
                                                          instancePath + '/denominations/' + i0,
                                                        schemaPath:
                                                          '#/properties/denominations/items/maxLength',
                                                        keyword: 'maxLength',
                                                        params: { limit: 512 },
                                                        message:
                                                          'must NOT have more than 512 characters',
                                                      },
                                                    ];
                                                    return false;
                                                  } else {
                                                    if (!pattern5.test(data14)) {
                                                      validate82.errors = [
                                                        {
                                                          instancePath:
                                                            instancePath + '/denominations/' + i0,
                                                          schemaPath:
                                                            '#/properties/denominations/items/pattern',
                                                          keyword: 'pattern',
                                                          params: {
                                                            pattern:
                                                              '^(0|[1-9][0-9]*)(\\.[0-9]+)?$',
                                                          },
                                                          message:
                                                            'must match pattern "^(0|[1-9][0-9]*)(\\.[0-9]+)?$"',
                                                        },
                                                      ];
                                                      return false;
                                                    }
                                                  }
                                                } else {
                                                  validate82.errors = [
                                                    {
                                                      instancePath:
                                                        instancePath + '/denominations/' + i0,
                                                      schemaPath:
                                                        '#/properties/denominations/items/type',
                                                      keyword: 'type',
                                                      params: { type: 'string' },
                                                      message: 'must be string',
                                                    },
                                                  ];
                                                  return false;
                                                }
                                              }
                                              var valid4 = _errs40 === errors;
                                              if (!valid4) {
                                                break;
                                              }
                                            }
                                          }
                                        } else {
                                          validate82.errors = [
                                            {
                                              instancePath: instancePath + '/denominations',
                                              schemaPath: '#/properties/denominations/type',
                                              keyword: 'type',
                                              params: { type: 'array' },
                                              message: 'must be array',
                                            },
                                          ];
                                          return false;
                                        }
                                      }
                                      var valid0 = _errs38 === errors;
                                    } else {
                                      var valid0 = true;
                                    }
                                    if (valid0) {
                                      if (data.amountRange !== void 0) {
                                        let data15 = data.amountRange;
                                        const _errs42 = errors;
                                        if (errors === _errs42) {
                                          if (
                                            data15 &&
                                            typeof data15 == 'object' &&
                                            !Array.isArray(data15)
                                          ) {
                                            let missing1;
                                            if (
                                              (data15.currency === void 0 &&
                                                (missing1 = 'currency')) ||
                                              (data15.min === void 0 && (missing1 = 'min')) ||
                                              (data15.max === void 0 && (missing1 = 'max'))
                                            ) {
                                              validate82.errors = [
                                                {
                                                  instancePath: instancePath + '/amountRange',
                                                  schemaPath: '#/properties/amountRange/required',
                                                  keyword: 'required',
                                                  params: { missingProperty: missing1 },
                                                  message:
                                                    "must have required property '" +
                                                    missing1 +
                                                    "'",
                                                },
                                              ];
                                              return false;
                                            } else {
                                              const _errs44 = errors;
                                              for (const key1 in data15) {
                                                if (
                                                  !(
                                                    key1 === 'currency' ||
                                                    key1 === 'min' ||
                                                    key1 === 'max'
                                                  )
                                                ) {
                                                  validate82.errors = [
                                                    {
                                                      instancePath: instancePath + '/amountRange',
                                                      schemaPath:
                                                        '#/properties/amountRange/additionalProperties',
                                                      keyword: 'additionalProperties',
                                                      params: { additionalProperty: key1 },
                                                      message:
                                                        'must NOT have additional properties',
                                                    },
                                                  ];
                                                  return false;
                                                  break;
                                                }
                                              }
                                              if (_errs44 === errors) {
                                                if (data15.currency !== void 0) {
                                                  let data16 = data15.currency;
                                                  const _errs45 = errors;
                                                  if (errors === _errs45) {
                                                    if (typeof data16 === 'string') {
                                                      if (func2(data16) > 512) {
                                                        validate82.errors = [
                                                          {
                                                            instancePath:
                                                              instancePath +
                                                              '/amountRange/currency',
                                                            schemaPath:
                                                              '#/properties/amountRange/properties/currency/maxLength',
                                                            keyword: 'maxLength',
                                                            params: { limit: 512 },
                                                            message:
                                                              'must NOT have more than 512 characters',
                                                          },
                                                        ];
                                                        return false;
                                                      } else {
                                                        if (!pattern3.test(data16)) {
                                                          validate82.errors = [
                                                            {
                                                              instancePath:
                                                                instancePath +
                                                                '/amountRange/currency',
                                                              schemaPath:
                                                                '#/properties/amountRange/properties/currency/pattern',
                                                              keyword: 'pattern',
                                                              params: { pattern: '^[A-Z]{3}$' },
                                                              message:
                                                                'must match pattern "^[A-Z]{3}$"',
                                                            },
                                                          ];
                                                          return false;
                                                        }
                                                      }
                                                    } else {
                                                      validate82.errors = [
                                                        {
                                                          instancePath:
                                                            instancePath + '/amountRange/currency',
                                                          schemaPath:
                                                            '#/properties/amountRange/properties/currency/type',
                                                          keyword: 'type',
                                                          params: { type: 'string' },
                                                          message: 'must be string',
                                                        },
                                                      ];
                                                      return false;
                                                    }
                                                  }
                                                  var valid5 = _errs45 === errors;
                                                } else {
                                                  var valid5 = true;
                                                }
                                                if (valid5) {
                                                  if (data15.min !== void 0) {
                                                    let data17 = data15.min;
                                                    const _errs47 = errors;
                                                    if (errors === _errs47) {
                                                      if (typeof data17 === 'string') {
                                                        if (func2(data17) > 512) {
                                                          validate82.errors = [
                                                            {
                                                              instancePath:
                                                                instancePath + '/amountRange/min',
                                                              schemaPath:
                                                                '#/properties/amountRange/properties/min/maxLength',
                                                              keyword: 'maxLength',
                                                              params: { limit: 512 },
                                                              message:
                                                                'must NOT have more than 512 characters',
                                                            },
                                                          ];
                                                          return false;
                                                        } else {
                                                          if (!pattern5.test(data17)) {
                                                            validate82.errors = [
                                                              {
                                                                instancePath:
                                                                  instancePath + '/amountRange/min',
                                                                schemaPath:
                                                                  '#/properties/amountRange/properties/min/pattern',
                                                                keyword: 'pattern',
                                                                params: {
                                                                  pattern:
                                                                    '^(0|[1-9][0-9]*)(\\.[0-9]+)?$',
                                                                },
                                                                message:
                                                                  'must match pattern "^(0|[1-9][0-9]*)(\\.[0-9]+)?$"',
                                                              },
                                                            ];
                                                            return false;
                                                          }
                                                        }
                                                      } else {
                                                        validate82.errors = [
                                                          {
                                                            instancePath:
                                                              instancePath + '/amountRange/min',
                                                            schemaPath:
                                                              '#/properties/amountRange/properties/min/type',
                                                            keyword: 'type',
                                                            params: { type: 'string' },
                                                            message: 'must be string',
                                                          },
                                                        ];
                                                        return false;
                                                      }
                                                    }
                                                    var valid5 = _errs47 === errors;
                                                  } else {
                                                    var valid5 = true;
                                                  }
                                                  if (valid5) {
                                                    if (data15.max !== void 0) {
                                                      let data18 = data15.max;
                                                      const _errs49 = errors;
                                                      if (errors === _errs49) {
                                                        if (typeof data18 === 'string') {
                                                          if (func2(data18) > 512) {
                                                            validate82.errors = [
                                                              {
                                                                instancePath:
                                                                  instancePath + '/amountRange/max',
                                                                schemaPath:
                                                                  '#/properties/amountRange/properties/max/maxLength',
                                                                keyword: 'maxLength',
                                                                params: { limit: 512 },
                                                                message:
                                                                  'must NOT have more than 512 characters',
                                                              },
                                                            ];
                                                            return false;
                                                          } else {
                                                            if (!pattern5.test(data18)) {
                                                              validate82.errors = [
                                                                {
                                                                  instancePath:
                                                                    instancePath +
                                                                    '/amountRange/max',
                                                                  schemaPath:
                                                                    '#/properties/amountRange/properties/max/pattern',
                                                                  keyword: 'pattern',
                                                                  params: {
                                                                    pattern:
                                                                      '^(0|[1-9][0-9]*)(\\.[0-9]+)?$',
                                                                  },
                                                                  message:
                                                                    'must match pattern "^(0|[1-9][0-9]*)(\\.[0-9]+)?$"',
                                                                },
                                                              ];
                                                              return false;
                                                            }
                                                          }
                                                        } else {
                                                          validate82.errors = [
                                                            {
                                                              instancePath:
                                                                instancePath + '/amountRange/max',
                                                              schemaPath:
                                                                '#/properties/amountRange/properties/max/type',
                                                              keyword: 'type',
                                                              params: { type: 'string' },
                                                              message: 'must be string',
                                                            },
                                                          ];
                                                          return false;
                                                        }
                                                      }
                                                      var valid5 = _errs49 === errors;
                                                    } else {
                                                      var valid5 = true;
                                                    }
                                                  }
                                                }
                                              }
                                            }
                                          } else {
                                            validate82.errors = [
                                              {
                                                instancePath: instancePath + '/amountRange',
                                                schemaPath: '#/properties/amountRange/type',
                                                keyword: 'type',
                                                params: { type: 'object' },
                                                message: 'must be object',
                                              },
                                            ];
                                            return false;
                                          }
                                        }
                                        var valid0 = _errs42 === errors;
                                      } else {
                                        var valid0 = true;
                                      }
                                      if (valid0) {
                                        if (data.qualifications !== void 0) {
                                          let data19 = data.qualifications;
                                          const _errs51 = errors;
                                          if (errors === _errs51) {
                                            if (Array.isArray(data19)) {
                                              if (data19.length > 100) {
                                                validate82.errors = [
                                                  {
                                                    instancePath: instancePath + '/qualifications',
                                                    schemaPath:
                                                      '#/properties/qualifications/maxItems',
                                                    keyword: 'maxItems',
                                                    params: { limit: 100 },
                                                    message: 'must NOT have more than 100 items',
                                                  },
                                                ];
                                                return false;
                                              } else {
                                                var valid6 = true;
                                                const len1 = data19.length;
                                                for (let i1 = 0; i1 < len1; i1++) {
                                                  let data20 = data19[i1];
                                                  const _errs53 = errors;
                                                  if (errors === _errs53) {
                                                    if (typeof data20 === 'string') {
                                                      if (func2(data20) > 512) {
                                                        validate82.errors = [
                                                          {
                                                            instancePath:
                                                              instancePath +
                                                              '/qualifications/' +
                                                              i1,
                                                            schemaPath:
                                                              '#/properties/qualifications/items/maxLength',
                                                            keyword: 'maxLength',
                                                            params: { limit: 512 },
                                                            message:
                                                              'must NOT have more than 512 characters',
                                                          },
                                                        ];
                                                        return false;
                                                      }
                                                    } else {
                                                      validate82.errors = [
                                                        {
                                                          instancePath:
                                                            instancePath + '/qualifications/' + i1,
                                                          schemaPath:
                                                            '#/properties/qualifications/items/type',
                                                          keyword: 'type',
                                                          params: { type: 'string' },
                                                          message: 'must be string',
                                                        },
                                                      ];
                                                      return false;
                                                    }
                                                  }
                                                  var valid6 = _errs53 === errors;
                                                  if (!valid6) {
                                                    break;
                                                  }
                                                }
                                              }
                                            } else {
                                              validate82.errors = [
                                                {
                                                  instancePath: instancePath + '/qualifications',
                                                  schemaPath: '#/properties/qualifications/type',
                                                  keyword: 'type',
                                                  params: { type: 'array' },
                                                  message: 'must be array',
                                                },
                                              ];
                                              return false;
                                            }
                                          }
                                          var valid0 = _errs51 === errors;
                                        } else {
                                          var valid0 = true;
                                        }
                                        if (valid0) {
                                          if (data.feeStatus !== void 0) {
                                            let data21 = data.feeStatus;
                                            const _errs55 = errors;
                                            if (
                                              !(
                                                data21 === 'unknown' ||
                                                data21 === 'no_additional_fee' ||
                                                data21 === 'unsupported'
                                              )
                                            ) {
                                              validate82.errors = [
                                                {
                                                  instancePath: instancePath + '/feeStatus',
                                                  schemaPath: '#/properties/feeStatus/enum',
                                                  keyword: 'enum',
                                                  params: {
                                                    allowedValues:
                                                      schema20.properties.feeStatus.enum,
                                                  },
                                                  message:
                                                    'must be equal to one of the allowed values',
                                                },
                                              ];
                                              return false;
                                            }
                                            var valid0 = _errs55 === errors;
                                          } else {
                                            var valid0 = true;
                                          }
                                          if (valid0) {
                                            if (data.sourceUrl !== void 0) {
                                              let data22 = data.sourceUrl;
                                              const _errs56 = errors;
                                              if (errors === _errs56) {
                                                if (typeof data22 === 'string') {
                                                  if (func2(data22) > 512) {
                                                    validate82.errors = [
                                                      {
                                                        instancePath: instancePath + '/sourceUrl',
                                                        schemaPath:
                                                          '#/properties/sourceUrl/maxLength',
                                                        keyword: 'maxLength',
                                                        params: { limit: 512 },
                                                        message:
                                                          'must NOT have more than 512 characters',
                                                      },
                                                    ];
                                                    return false;
                                                  }
                                                } else {
                                                  validate82.errors = [
                                                    {
                                                      instancePath: instancePath + '/sourceUrl',
                                                      schemaPath: '#/properties/sourceUrl/type',
                                                      keyword: 'type',
                                                      params: { type: 'string' },
                                                      message: 'must be string',
                                                    },
                                                  ];
                                                  return false;
                                                }
                                              }
                                              var valid0 = _errs56 === errors;
                                            } else {
                                              var valid0 = true;
                                            }
                                            if (valid0) {
                                              if (data.originalBuyField !== void 0) {
                                                let data23 = data.originalBuyField;
                                                const _errs58 = errors;
                                                if (errors === _errs58) {
                                                  if (typeof data23 === 'string') {
                                                    if (func2(data23) > 512) {
                                                      validate82.errors = [
                                                        {
                                                          instancePath:
                                                            instancePath + '/originalBuyField',
                                                          schemaPath:
                                                            '#/properties/originalBuyField/maxLength',
                                                          keyword: 'maxLength',
                                                          params: { limit: 512 },
                                                          message:
                                                            'must NOT have more than 512 characters',
                                                        },
                                                      ];
                                                      return false;
                                                    }
                                                  } else {
                                                    validate82.errors = [
                                                      {
                                                        instancePath:
                                                          instancePath + '/originalBuyField',
                                                        schemaPath:
                                                          '#/properties/originalBuyField/type',
                                                        keyword: 'type',
                                                        params: { type: 'string' },
                                                        message: 'must be string',
                                                      },
                                                    ];
                                                    return false;
                                                  }
                                                }
                                                var valid0 = _errs58 === errors;
                                              } else {
                                                var valid0 = true;
                                              }
                                              if (valid0) {
                                                if (data.originalSellField !== void 0) {
                                                  let data24 = data.originalSellField;
                                                  const _errs60 = errors;
                                                  if (errors === _errs60) {
                                                    if (typeof data24 === 'string') {
                                                      if (func2(data24) > 512) {
                                                        validate82.errors = [
                                                          {
                                                            instancePath:
                                                              instancePath + '/originalSellField',
                                                            schemaPath:
                                                              '#/properties/originalSellField/maxLength',
                                                            keyword: 'maxLength',
                                                            params: { limit: 512 },
                                                            message:
                                                              'must NOT have more than 512 characters',
                                                          },
                                                        ];
                                                        return false;
                                                      }
                                                    } else {
                                                      validate82.errors = [
                                                        {
                                                          instancePath:
                                                            instancePath + '/originalSellField',
                                                          schemaPath:
                                                            '#/properties/originalSellField/type',
                                                          keyword: 'type',
                                                          params: { type: 'string' },
                                                          message: 'must be string',
                                                        },
                                                      ];
                                                      return false;
                                                    }
                                                  }
                                                  var valid0 = _errs60 === errors;
                                                } else {
                                                  var valid0 = true;
                                                }
                                                if (valid0) {
                                                  if (data.mappingVersion !== void 0) {
                                                    let data25 = data.mappingVersion;
                                                    const _errs62 = errors;
                                                    if (errors === _errs62) {
                                                      if (typeof data25 === 'string') {
                                                        if (func2(data25) > 512) {
                                                          validate82.errors = [
                                                            {
                                                              instancePath:
                                                                instancePath + '/mappingVersion',
                                                              schemaPath:
                                                                '#/properties/mappingVersion/maxLength',
                                                              keyword: 'maxLength',
                                                              params: { limit: 512 },
                                                              message:
                                                                'must NOT have more than 512 characters',
                                                            },
                                                          ];
                                                          return false;
                                                        }
                                                      } else {
                                                        validate82.errors = [
                                                          {
                                                            instancePath:
                                                              instancePath + '/mappingVersion',
                                                            schemaPath:
                                                              '#/properties/mappingVersion/type',
                                                            keyword: 'type',
                                                            params: { type: 'string' },
                                                            message: 'must be string',
                                                          },
                                                        ];
                                                        return false;
                                                      }
                                                    }
                                                    var valid0 = _errs62 === errors;
                                                  } else {
                                                    var valid0 = true;
                                                  }
                                                  if (valid0) {
                                                    if (data.originalUnitAmount !== void 0) {
                                                      let data26 = data.originalUnitAmount;
                                                      const _errs64 = errors;
                                                      if (errors === _errs64) {
                                                        if (typeof data26 === 'string') {
                                                          if (func2(data26) > 512) {
                                                            validate82.errors = [
                                                              {
                                                                instancePath:
                                                                  instancePath +
                                                                  '/originalUnitAmount',
                                                                schemaPath:
                                                                  '#/properties/originalUnitAmount/maxLength',
                                                                keyword: 'maxLength',
                                                                params: { limit: 512 },
                                                                message:
                                                                  'must NOT have more than 512 characters',
                                                              },
                                                            ];
                                                            return false;
                                                          } else {
                                                            if (!pattern5.test(data26)) {
                                                              validate82.errors = [
                                                                {
                                                                  instancePath:
                                                                    instancePath +
                                                                    '/originalUnitAmount',
                                                                  schemaPath:
                                                                    '#/properties/originalUnitAmount/pattern',
                                                                  keyword: 'pattern',
                                                                  params: {
                                                                    pattern:
                                                                      '^(0|[1-9][0-9]*)(\\.[0-9]+)?$',
                                                                  },
                                                                  message:
                                                                    'must match pattern "^(0|[1-9][0-9]*)(\\.[0-9]+)?$"',
                                                                },
                                                              ];
                                                              return false;
                                                            }
                                                          }
                                                        } else {
                                                          validate82.errors = [
                                                            {
                                                              instancePath:
                                                                instancePath +
                                                                '/originalUnitAmount',
                                                              schemaPath:
                                                                '#/properties/originalUnitAmount/type',
                                                              keyword: 'type',
                                                              params: { type: 'string' },
                                                              message: 'must be string',
                                                            },
                                                          ];
                                                          return false;
                                                        }
                                                      }
                                                      var valid0 = _errs64 === errors;
                                                    } else {
                                                      var valid0 = true;
                                                    }
                                                    if (valid0) {
                                                      if (data.dataKind !== void 0) {
                                                        let data27 = data.dataKind;
                                                        const _errs66 = errors;
                                                        if (
                                                          !(
                                                            data27 === 'published_board' ||
                                                            data27 === 'fixed_fallback' ||
                                                            data27 === 'reference' ||
                                                            data27 === 'derived_cross'
                                                          )
                                                        ) {
                                                          validate82.errors = [
                                                            {
                                                              instancePath:
                                                                instancePath + '/dataKind',
                                                              schemaPath:
                                                                '#/properties/dataKind/enum',
                                                              keyword: 'enum',
                                                              params: {
                                                                allowedValues:
                                                                  schema20.properties.dataKind.enum,
                                                              },
                                                              message:
                                                                'must be equal to one of the allowed values',
                                                            },
                                                          ];
                                                          return false;
                                                        }
                                                        var valid0 = _errs66 === errors;
                                                      } else {
                                                        var valid0 = true;
                                                      }
                                                      if (valid0) {
                                                        if (data.feeEvidenceUrl !== void 0) {
                                                          let data28 = data.feeEvidenceUrl;
                                                          const _errs67 = errors;
                                                          if (errors === _errs67) {
                                                            if (typeof data28 === 'string') {
                                                              if (func2(data28) > 512) {
                                                                validate82.errors = [
                                                                  {
                                                                    instancePath:
                                                                      instancePath +
                                                                      '/feeEvidenceUrl',
                                                                    schemaPath:
                                                                      '#/properties/feeEvidenceUrl/maxLength',
                                                                    keyword: 'maxLength',
                                                                    params: { limit: 512 },
                                                                    message:
                                                                      'must NOT have more than 512 characters',
                                                                  },
                                                                ];
                                                                return false;
                                                              } else {
                                                                if (func2(data28) < 1) {
                                                                  validate82.errors = [
                                                                    {
                                                                      instancePath:
                                                                        instancePath +
                                                                        '/feeEvidenceUrl',
                                                                      schemaPath:
                                                                        '#/properties/feeEvidenceUrl/minLength',
                                                                      keyword: 'minLength',
                                                                      params: { limit: 1 },
                                                                      message:
                                                                        'must NOT have fewer than 1 characters',
                                                                    },
                                                                  ];
                                                                  return false;
                                                                } else {
                                                                  if (!pattern14.test(data28)) {
                                                                    validate82.errors = [
                                                                      {
                                                                        instancePath:
                                                                          instancePath +
                                                                          '/feeEvidenceUrl',
                                                                        schemaPath:
                                                                          '#/properties/feeEvidenceUrl/pattern',
                                                                        keyword: 'pattern',
                                                                        params: {
                                                                          pattern: '^https://',
                                                                        },
                                                                        message:
                                                                          'must match pattern "^https://"',
                                                                      },
                                                                    ];
                                                                    return false;
                                                                  }
                                                                }
                                                              }
                                                            } else {
                                                              validate82.errors = [
                                                                {
                                                                  instancePath:
                                                                    instancePath +
                                                                    '/feeEvidenceUrl',
                                                                  schemaPath:
                                                                    '#/properties/feeEvidenceUrl/type',
                                                                  keyword: 'type',
                                                                  params: { type: 'string' },
                                                                  message: 'must be string',
                                                                },
                                                              ];
                                                              return false;
                                                            }
                                                          }
                                                          var valid0 = _errs67 === errors;
                                                        } else {
                                                          var valid0 = true;
                                                        }
                                                      }
                                                    }
                                                  }
                                                }
                                              }
                                            }
                                          }
                                        }
                                      }
                                    }
                                  }
                                }
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    } else {
      validate82.errors = [
        {
          instancePath,
          schemaPath: '#/type',
          keyword: 'type',
          params: { type: 'object' },
          message: 'must be object',
        },
      ];
      return false;
    }
  }
  validate82.errors = vErrors;
  return errors === 0;
}
validate82.evaluated = { props: true, dynamicProps: false, dynamicItems: false };
var validateQuoteSnapshot = validate83;
var schema21 = {
  type: 'object',
  properties: {
    quoteId: { type: 'string', maxLength: 2e4 },
    quoteSeriesId: { type: 'string', maxLength: 2e4 },
    providerId: { type: 'string', maxLength: 512 },
    fromCurrency: { type: 'string', pattern: '^[A-Z]{3}$', maxLength: 512 },
    toCurrency: { type: 'string', pattern: '^[A-Z]{3}$', maxLength: 512 },
    providerSide: { enum: ['buy', 'sell'] },
    status: { enum: ['available', 'unavailable'] },
    rate: {
      anyOf: [
        { type: 'string', pattern: '^(0|[1-9][0-9]*)(\\.[0-9]+)?$', maxLength: 512 },
        { type: 'null' },
      ],
    },
    unavailableReason: { enum: ['not_quoted', null] },
    sourceQuote: { $ref: '#/$defs/SourceQuote' },
    methodVersion: { const: '1' },
  },
  required: [
    'quoteId',
    'quoteSeriesId',
    'providerId',
    'fromCurrency',
    'toCurrency',
    'providerSide',
    'status',
    'rate',
    'unavailableReason',
    'sourceQuote',
    'methodVersion',
  ],
  additionalProperties: false,
};
function validate53(
  data,
  { instancePath = '', parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {},
) {
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate53.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = void 0;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = void 0;
  }
  if (errors === 0) {
    if (data && typeof data == 'object' && !Array.isArray(data)) {
      let missing0;
      if (
        (data.providerId === void 0 && (missing0 = 'providerId')) ||
        (data.subjectCurrency === void 0 && (missing0 = 'subjectCurrency')) ||
        (data.priceCurrency === void 0 && (missing0 = 'priceCurrency')) ||
        (data.unitAmount === void 0 && (missing0 = 'unitAmount')) ||
        (data.buy === void 0 && (missing0 = 'buy')) ||
        (data.sell === void 0 && (missing0 = 'sell')) ||
        (data.sourcePublishedAt === void 0 && (missing0 = 'sourcePublishedAt')) ||
        (data.fetchedAt === void 0 && (missing0 = 'fetchedAt')) ||
        (data.lastSuccessfulCheckAt === void 0 && (missing0 = 'lastSuccessfulCheckAt')) ||
        (data.serviceCountry === void 0 && (missing0 = 'serviceCountry')) ||
        (data.deliveryMethod === void 0 && (missing0 = 'deliveryMethod')) ||
        (data.channel === void 0 && (missing0 = 'channel'))
      ) {
        validate53.errors = [
          {
            instancePath,
            schemaPath: '#/required',
            keyword: 'required',
            params: { missingProperty: missing0 },
            message: "must have required property '" + missing0 + "'",
          },
        ];
        return false;
      } else {
        const _errs1 = errors;
        for (const key0 in data) {
          if (!func1.call(schema20.properties, key0)) {
            validate53.errors = [
              {
                instancePath,
                schemaPath: '#/additionalProperties',
                keyword: 'additionalProperties',
                params: { additionalProperty: key0 },
                message: 'must NOT have additional properties',
              },
            ];
            return false;
            break;
          }
        }
        if (_errs1 === errors) {
          if (data.providerId !== void 0) {
            let data0 = data.providerId;
            const _errs2 = errors;
            if (errors === _errs2) {
              if (typeof data0 === 'string') {
                if (func2(data0) > 512) {
                  validate53.errors = [
                    {
                      instancePath: instancePath + '/providerId',
                      schemaPath: '#/properties/providerId/maxLength',
                      keyword: 'maxLength',
                      params: { limit: 512 },
                      message: 'must NOT have more than 512 characters',
                    },
                  ];
                  return false;
                }
              } else {
                validate53.errors = [
                  {
                    instancePath: instancePath + '/providerId',
                    schemaPath: '#/properties/providerId/type',
                    keyword: 'type',
                    params: { type: 'string' },
                    message: 'must be string',
                  },
                ];
                return false;
              }
            }
            var valid0 = _errs2 === errors;
          } else {
            var valid0 = true;
          }
          if (valid0) {
            if (data.subjectCurrency !== void 0) {
              let data1 = data.subjectCurrency;
              const _errs4 = errors;
              if (errors === _errs4) {
                if (typeof data1 === 'string') {
                  if (func2(data1) > 512) {
                    validate53.errors = [
                      {
                        instancePath: instancePath + '/subjectCurrency',
                        schemaPath: '#/properties/subjectCurrency/maxLength',
                        keyword: 'maxLength',
                        params: { limit: 512 },
                        message: 'must NOT have more than 512 characters',
                      },
                    ];
                    return false;
                  } else {
                    if (!pattern3.test(data1)) {
                      validate53.errors = [
                        {
                          instancePath: instancePath + '/subjectCurrency',
                          schemaPath: '#/properties/subjectCurrency/pattern',
                          keyword: 'pattern',
                          params: { pattern: '^[A-Z]{3}$' },
                          message: 'must match pattern "^[A-Z]{3}$"',
                        },
                      ];
                      return false;
                    }
                  }
                } else {
                  validate53.errors = [
                    {
                      instancePath: instancePath + '/subjectCurrency',
                      schemaPath: '#/properties/subjectCurrency/type',
                      keyword: 'type',
                      params: { type: 'string' },
                      message: 'must be string',
                    },
                  ];
                  return false;
                }
              }
              var valid0 = _errs4 === errors;
            } else {
              var valid0 = true;
            }
            if (valid0) {
              if (data.priceCurrency !== void 0) {
                let data2 = data.priceCurrency;
                const _errs6 = errors;
                if (errors === _errs6) {
                  if (typeof data2 === 'string') {
                    if (func2(data2) > 512) {
                      validate53.errors = [
                        {
                          instancePath: instancePath + '/priceCurrency',
                          schemaPath: '#/properties/priceCurrency/maxLength',
                          keyword: 'maxLength',
                          params: { limit: 512 },
                          message: 'must NOT have more than 512 characters',
                        },
                      ];
                      return false;
                    } else {
                      if (!pattern3.test(data2)) {
                        validate53.errors = [
                          {
                            instancePath: instancePath + '/priceCurrency',
                            schemaPath: '#/properties/priceCurrency/pattern',
                            keyword: 'pattern',
                            params: { pattern: '^[A-Z]{3}$' },
                            message: 'must match pattern "^[A-Z]{3}$"',
                          },
                        ];
                        return false;
                      }
                    }
                  } else {
                    validate53.errors = [
                      {
                        instancePath: instancePath + '/priceCurrency',
                        schemaPath: '#/properties/priceCurrency/type',
                        keyword: 'type',
                        params: { type: 'string' },
                        message: 'must be string',
                      },
                    ];
                    return false;
                  }
                }
                var valid0 = _errs6 === errors;
              } else {
                var valid0 = true;
              }
              if (valid0) {
                if (data.unitAmount !== void 0) {
                  let data3 = data.unitAmount;
                  const _errs8 = errors;
                  if (errors === _errs8) {
                    if (typeof data3 === 'string') {
                      if (func2(data3) > 512) {
                        validate53.errors = [
                          {
                            instancePath: instancePath + '/unitAmount',
                            schemaPath: '#/properties/unitAmount/maxLength',
                            keyword: 'maxLength',
                            params: { limit: 512 },
                            message: 'must NOT have more than 512 characters',
                          },
                        ];
                        return false;
                      } else {
                        if (!pattern5.test(data3)) {
                          validate53.errors = [
                            {
                              instancePath: instancePath + '/unitAmount',
                              schemaPath: '#/properties/unitAmount/pattern',
                              keyword: 'pattern',
                              params: { pattern: '^(0|[1-9][0-9]*)(\\.[0-9]+)?$' },
                              message: 'must match pattern "^(0|[1-9][0-9]*)(\\.[0-9]+)?$"',
                            },
                          ];
                          return false;
                        }
                      }
                    } else {
                      validate53.errors = [
                        {
                          instancePath: instancePath + '/unitAmount',
                          schemaPath: '#/properties/unitAmount/type',
                          keyword: 'type',
                          params: { type: 'string' },
                          message: 'must be string',
                        },
                      ];
                      return false;
                    }
                  }
                  var valid0 = _errs8 === errors;
                } else {
                  var valid0 = true;
                }
                if (valid0) {
                  if (data.buy !== void 0) {
                    let data4 = data.buy;
                    const _errs10 = errors;
                    const _errs11 = errors;
                    let valid1 = false;
                    const _errs12 = errors;
                    if (errors === _errs12) {
                      if (typeof data4 === 'string') {
                        if (func2(data4) > 512) {
                          const err0 = {
                            instancePath: instancePath + '/buy',
                            schemaPath: '#/properties/buy/anyOf/0/maxLength',
                            keyword: 'maxLength',
                            params: { limit: 512 },
                            message: 'must NOT have more than 512 characters',
                          };
                          if (vErrors === null) {
                            vErrors = [err0];
                          } else {
                            vErrors.push(err0);
                          }
                          errors++;
                        } else {
                          if (!pattern5.test(data4)) {
                            const err1 = {
                              instancePath: instancePath + '/buy',
                              schemaPath: '#/properties/buy/anyOf/0/pattern',
                              keyword: 'pattern',
                              params: { pattern: '^(0|[1-9][0-9]*)(\\.[0-9]+)?$' },
                              message: 'must match pattern "^(0|[1-9][0-9]*)(\\.[0-9]+)?$"',
                            };
                            if (vErrors === null) {
                              vErrors = [err1];
                            } else {
                              vErrors.push(err1);
                            }
                            errors++;
                          }
                        }
                      } else {
                        const err2 = {
                          instancePath: instancePath + '/buy',
                          schemaPath: '#/properties/buy/anyOf/0/type',
                          keyword: 'type',
                          params: { type: 'string' },
                          message: 'must be string',
                        };
                        if (vErrors === null) {
                          vErrors = [err2];
                        } else {
                          vErrors.push(err2);
                        }
                        errors++;
                      }
                    }
                    var _valid0 = _errs12 === errors;
                    valid1 = valid1 || _valid0;
                    const _errs14 = errors;
                    if (data4 !== null) {
                      const err3 = {
                        instancePath: instancePath + '/buy',
                        schemaPath: '#/properties/buy/anyOf/1/type',
                        keyword: 'type',
                        params: { type: 'null' },
                        message: 'must be null',
                      };
                      if (vErrors === null) {
                        vErrors = [err3];
                      } else {
                        vErrors.push(err3);
                      }
                      errors++;
                    }
                    var _valid0 = _errs14 === errors;
                    valid1 = valid1 || _valid0;
                    if (!valid1) {
                      const err4 = {
                        instancePath: instancePath + '/buy',
                        schemaPath: '#/properties/buy/anyOf',
                        keyword: 'anyOf',
                        params: {},
                        message: 'must match a schema in anyOf',
                      };
                      if (vErrors === null) {
                        vErrors = [err4];
                      } else {
                        vErrors.push(err4);
                      }
                      errors++;
                      validate53.errors = vErrors;
                      return false;
                    } else {
                      errors = _errs11;
                      if (vErrors !== null) {
                        if (_errs11) {
                          vErrors.length = _errs11;
                        } else {
                          vErrors = null;
                        }
                      }
                    }
                    var valid0 = _errs10 === errors;
                  } else {
                    var valid0 = true;
                  }
                  if (valid0) {
                    if (data.sell !== void 0) {
                      let data5 = data.sell;
                      const _errs16 = errors;
                      const _errs17 = errors;
                      let valid2 = false;
                      const _errs18 = errors;
                      if (errors === _errs18) {
                        if (typeof data5 === 'string') {
                          if (func2(data5) > 512) {
                            const err5 = {
                              instancePath: instancePath + '/sell',
                              schemaPath: '#/properties/sell/anyOf/0/maxLength',
                              keyword: 'maxLength',
                              params: { limit: 512 },
                              message: 'must NOT have more than 512 characters',
                            };
                            if (vErrors === null) {
                              vErrors = [err5];
                            } else {
                              vErrors.push(err5);
                            }
                            errors++;
                          } else {
                            if (!pattern5.test(data5)) {
                              const err6 = {
                                instancePath: instancePath + '/sell',
                                schemaPath: '#/properties/sell/anyOf/0/pattern',
                                keyword: 'pattern',
                                params: { pattern: '^(0|[1-9][0-9]*)(\\.[0-9]+)?$' },
                                message: 'must match pattern "^(0|[1-9][0-9]*)(\\.[0-9]+)?$"',
                              };
                              if (vErrors === null) {
                                vErrors = [err6];
                              } else {
                                vErrors.push(err6);
                              }
                              errors++;
                            }
                          }
                        } else {
                          const err7 = {
                            instancePath: instancePath + '/sell',
                            schemaPath: '#/properties/sell/anyOf/0/type',
                            keyword: 'type',
                            params: { type: 'string' },
                            message: 'must be string',
                          };
                          if (vErrors === null) {
                            vErrors = [err7];
                          } else {
                            vErrors.push(err7);
                          }
                          errors++;
                        }
                      }
                      var _valid1 = _errs18 === errors;
                      valid2 = valid2 || _valid1;
                      const _errs20 = errors;
                      if (data5 !== null) {
                        const err8 = {
                          instancePath: instancePath + '/sell',
                          schemaPath: '#/properties/sell/anyOf/1/type',
                          keyword: 'type',
                          params: { type: 'null' },
                          message: 'must be null',
                        };
                        if (vErrors === null) {
                          vErrors = [err8];
                        } else {
                          vErrors.push(err8);
                        }
                        errors++;
                      }
                      var _valid1 = _errs20 === errors;
                      valid2 = valid2 || _valid1;
                      if (!valid2) {
                        const err9 = {
                          instancePath: instancePath + '/sell',
                          schemaPath: '#/properties/sell/anyOf',
                          keyword: 'anyOf',
                          params: {},
                          message: 'must match a schema in anyOf',
                        };
                        if (vErrors === null) {
                          vErrors = [err9];
                        } else {
                          vErrors.push(err9);
                        }
                        errors++;
                        validate53.errors = vErrors;
                        return false;
                      } else {
                        errors = _errs17;
                        if (vErrors !== null) {
                          if (_errs17) {
                            vErrors.length = _errs17;
                          } else {
                            vErrors = null;
                          }
                        }
                      }
                      var valid0 = _errs16 === errors;
                    } else {
                      var valid0 = true;
                    }
                    if (valid0) {
                      if (data.sourcePublishedAt !== void 0) {
                        let data6 = data.sourcePublishedAt;
                        const _errs22 = errors;
                        const _errs23 = errors;
                        let valid3 = false;
                        const _errs24 = errors;
                        if (errors === _errs24) {
                          if (errors === _errs24) {
                            if (typeof data6 === 'string') {
                              if (func2(data6) > 512) {
                                const err10 = {
                                  instancePath: instancePath + '/sourcePublishedAt',
                                  schemaPath: '#/properties/sourcePublishedAt/anyOf/0/maxLength',
                                  keyword: 'maxLength',
                                  params: { limit: 512 },
                                  message: 'must NOT have more than 512 characters',
                                };
                                if (vErrors === null) {
                                  vErrors = [err10];
                                } else {
                                  vErrors.push(err10);
                                }
                                errors++;
                              } else {
                                if (!formats0.validate(data6)) {
                                  const err11 = {
                                    instancePath: instancePath + '/sourcePublishedAt',
                                    schemaPath: '#/properties/sourcePublishedAt/anyOf/0/format',
                                    keyword: 'format',
                                    params: { format: 'date-time' },
                                    message: 'must match format "date-time"',
                                  };
                                  if (vErrors === null) {
                                    vErrors = [err11];
                                  } else {
                                    vErrors.push(err11);
                                  }
                                  errors++;
                                }
                              }
                            } else {
                              const err12 = {
                                instancePath: instancePath + '/sourcePublishedAt',
                                schemaPath: '#/properties/sourcePublishedAt/anyOf/0/type',
                                keyword: 'type',
                                params: { type: 'string' },
                                message: 'must be string',
                              };
                              if (vErrors === null) {
                                vErrors = [err12];
                              } else {
                                vErrors.push(err12);
                              }
                              errors++;
                            }
                          }
                        }
                        var _valid2 = _errs24 === errors;
                        valid3 = valid3 || _valid2;
                        const _errs26 = errors;
                        if (data6 !== null) {
                          const err13 = {
                            instancePath: instancePath + '/sourcePublishedAt',
                            schemaPath: '#/properties/sourcePublishedAt/anyOf/1/type',
                            keyword: 'type',
                            params: { type: 'null' },
                            message: 'must be null',
                          };
                          if (vErrors === null) {
                            vErrors = [err13];
                          } else {
                            vErrors.push(err13);
                          }
                          errors++;
                        }
                        var _valid2 = _errs26 === errors;
                        valid3 = valid3 || _valid2;
                        if (!valid3) {
                          const err14 = {
                            instancePath: instancePath + '/sourcePublishedAt',
                            schemaPath: '#/properties/sourcePublishedAt/anyOf',
                            keyword: 'anyOf',
                            params: {},
                            message: 'must match a schema in anyOf',
                          };
                          if (vErrors === null) {
                            vErrors = [err14];
                          } else {
                            vErrors.push(err14);
                          }
                          errors++;
                          validate53.errors = vErrors;
                          return false;
                        } else {
                          errors = _errs23;
                          if (vErrors !== null) {
                            if (_errs23) {
                              vErrors.length = _errs23;
                            } else {
                              vErrors = null;
                            }
                          }
                        }
                        var valid0 = _errs22 === errors;
                      } else {
                        var valid0 = true;
                      }
                      if (valid0) {
                        if (data.fetchedAt !== void 0) {
                          let data7 = data.fetchedAt;
                          const _errs28 = errors;
                          if (errors === _errs28) {
                            if (errors === _errs28) {
                              if (typeof data7 === 'string') {
                                if (func2(data7) > 512) {
                                  validate53.errors = [
                                    {
                                      instancePath: instancePath + '/fetchedAt',
                                      schemaPath: '#/properties/fetchedAt/maxLength',
                                      keyword: 'maxLength',
                                      params: { limit: 512 },
                                      message: 'must NOT have more than 512 characters',
                                    },
                                  ];
                                  return false;
                                } else {
                                  if (!formats0.validate(data7)) {
                                    validate53.errors = [
                                      {
                                        instancePath: instancePath + '/fetchedAt',
                                        schemaPath: '#/properties/fetchedAt/format',
                                        keyword: 'format',
                                        params: { format: 'date-time' },
                                        message: 'must match format "date-time"',
                                      },
                                    ];
                                    return false;
                                  }
                                }
                              } else {
                                validate53.errors = [
                                  {
                                    instancePath: instancePath + '/fetchedAt',
                                    schemaPath: '#/properties/fetchedAt/type',
                                    keyword: 'type',
                                    params: { type: 'string' },
                                    message: 'must be string',
                                  },
                                ];
                                return false;
                              }
                            }
                          }
                          var valid0 = _errs28 === errors;
                        } else {
                          var valid0 = true;
                        }
                        if (valid0) {
                          if (data.lastSuccessfulCheckAt !== void 0) {
                            let data8 = data.lastSuccessfulCheckAt;
                            const _errs30 = errors;
                            if (errors === _errs30) {
                              if (errors === _errs30) {
                                if (typeof data8 === 'string') {
                                  if (func2(data8) > 512) {
                                    validate53.errors = [
                                      {
                                        instancePath: instancePath + '/lastSuccessfulCheckAt',
                                        schemaPath: '#/properties/lastSuccessfulCheckAt/maxLength',
                                        keyword: 'maxLength',
                                        params: { limit: 512 },
                                        message: 'must NOT have more than 512 characters',
                                      },
                                    ];
                                    return false;
                                  } else {
                                    if (!formats0.validate(data8)) {
                                      validate53.errors = [
                                        {
                                          instancePath: instancePath + '/lastSuccessfulCheckAt',
                                          schemaPath: '#/properties/lastSuccessfulCheckAt/format',
                                          keyword: 'format',
                                          params: { format: 'date-time' },
                                          message: 'must match format "date-time"',
                                        },
                                      ];
                                      return false;
                                    }
                                  }
                                } else {
                                  validate53.errors = [
                                    {
                                      instancePath: instancePath + '/lastSuccessfulCheckAt',
                                      schemaPath: '#/properties/lastSuccessfulCheckAt/type',
                                      keyword: 'type',
                                      params: { type: 'string' },
                                      message: 'must be string',
                                    },
                                  ];
                                  return false;
                                }
                              }
                            }
                            var valid0 = _errs30 === errors;
                          } else {
                            var valid0 = true;
                          }
                          if (valid0) {
                            if (data.serviceCountry !== void 0) {
                              let data9 = data.serviceCountry;
                              const _errs32 = errors;
                              if (errors === _errs32) {
                                if (typeof data9 === 'string') {
                                  if (func2(data9) > 512) {
                                    validate53.errors = [
                                      {
                                        instancePath: instancePath + '/serviceCountry',
                                        schemaPath: '#/properties/serviceCountry/maxLength',
                                        keyword: 'maxLength',
                                        params: { limit: 512 },
                                        message: 'must NOT have more than 512 characters',
                                      },
                                    ];
                                    return false;
                                  } else {
                                    if (!pattern8.test(data9)) {
                                      validate53.errors = [
                                        {
                                          instancePath: instancePath + '/serviceCountry',
                                          schemaPath: '#/properties/serviceCountry/pattern',
                                          keyword: 'pattern',
                                          params: { pattern: '^[A-Z]{2}$' },
                                          message: 'must match pattern "^[A-Z]{2}$"',
                                        },
                                      ];
                                      return false;
                                    }
                                  }
                                } else {
                                  validate53.errors = [
                                    {
                                      instancePath: instancePath + '/serviceCountry',
                                      schemaPath: '#/properties/serviceCountry/type',
                                      keyword: 'type',
                                      params: { type: 'string' },
                                      message: 'must be string',
                                    },
                                  ];
                                  return false;
                                }
                              }
                              var valid0 = _errs32 === errors;
                            } else {
                              var valid0 = true;
                            }
                            if (valid0) {
                              if (data.deliveryMethod !== void 0) {
                                let data10 = data.deliveryMethod;
                                const _errs34 = errors;
                                if (!(data10 === 'cash' || data10 === 'account')) {
                                  validate53.errors = [
                                    {
                                      instancePath: instancePath + '/deliveryMethod',
                                      schemaPath: '#/properties/deliveryMethod/enum',
                                      keyword: 'enum',
                                      params: {
                                        allowedValues: schema20.properties.deliveryMethod.enum,
                                      },
                                      message: 'must be equal to one of the allowed values',
                                    },
                                  ];
                                  return false;
                                }
                                var valid0 = _errs34 === errors;
                              } else {
                                var valid0 = true;
                              }
                              if (valid0) {
                                if (data.channel !== void 0) {
                                  let data11 = data.channel;
                                  const _errs35 = errors;
                                  if (
                                    !(
                                      data11 === 'branch' ||
                                      data11 === 'online' ||
                                      data11 === 'atm' ||
                                      data11 === 'unknown'
                                    )
                                  ) {
                                    validate53.errors = [
                                      {
                                        instancePath: instancePath + '/channel',
                                        schemaPath: '#/properties/channel/enum',
                                        keyword: 'enum',
                                        params: { allowedValues: schema20.properties.channel.enum },
                                        message: 'must be equal to one of the allowed values',
                                      },
                                    ];
                                    return false;
                                  }
                                  var valid0 = _errs35 === errors;
                                } else {
                                  var valid0 = true;
                                }
                                if (valid0) {
                                  if (data.branchId !== void 0) {
                                    let data12 = data.branchId;
                                    const _errs36 = errors;
                                    if (errors === _errs36) {
                                      if (typeof data12 === 'string') {
                                        if (func2(data12) > 512) {
                                          validate53.errors = [
                                            {
                                              instancePath: instancePath + '/branchId',
                                              schemaPath: '#/properties/branchId/maxLength',
                                              keyword: 'maxLength',
                                              params: { limit: 512 },
                                              message: 'must NOT have more than 512 characters',
                                            },
                                          ];
                                          return false;
                                        }
                                      } else {
                                        validate53.errors = [
                                          {
                                            instancePath: instancePath + '/branchId',
                                            schemaPath: '#/properties/branchId/type',
                                            keyword: 'type',
                                            params: { type: 'string' },
                                            message: 'must be string',
                                          },
                                        ];
                                        return false;
                                      }
                                    }
                                    var valid0 = _errs36 === errors;
                                  } else {
                                    var valid0 = true;
                                  }
                                  if (valid0) {
                                    if (data.denominations !== void 0) {
                                      let data13 = data.denominations;
                                      const _errs38 = errors;
                                      if (errors === _errs38) {
                                        if (Array.isArray(data13)) {
                                          if (data13.length > 100) {
                                            validate53.errors = [
                                              {
                                                instancePath: instancePath + '/denominations',
                                                schemaPath: '#/properties/denominations/maxItems',
                                                keyword: 'maxItems',
                                                params: { limit: 100 },
                                                message: 'must NOT have more than 100 items',
                                              },
                                            ];
                                            return false;
                                          } else {
                                            var valid4 = true;
                                            const len0 = data13.length;
                                            for (let i0 = 0; i0 < len0; i0++) {
                                              let data14 = data13[i0];
                                              const _errs40 = errors;
                                              if (errors === _errs40) {
                                                if (typeof data14 === 'string') {
                                                  if (func2(data14) > 512) {
                                                    validate53.errors = [
                                                      {
                                                        instancePath:
                                                          instancePath + '/denominations/' + i0,
                                                        schemaPath:
                                                          '#/properties/denominations/items/maxLength',
                                                        keyword: 'maxLength',
                                                        params: { limit: 512 },
                                                        message:
                                                          'must NOT have more than 512 characters',
                                                      },
                                                    ];
                                                    return false;
                                                  } else {
                                                    if (!pattern5.test(data14)) {
                                                      validate53.errors = [
                                                        {
                                                          instancePath:
                                                            instancePath + '/denominations/' + i0,
                                                          schemaPath:
                                                            '#/properties/denominations/items/pattern',
                                                          keyword: 'pattern',
                                                          params: {
                                                            pattern:
                                                              '^(0|[1-9][0-9]*)(\\.[0-9]+)?$',
                                                          },
                                                          message:
                                                            'must match pattern "^(0|[1-9][0-9]*)(\\.[0-9]+)?$"',
                                                        },
                                                      ];
                                                      return false;
                                                    }
                                                  }
                                                } else {
                                                  validate53.errors = [
                                                    {
                                                      instancePath:
                                                        instancePath + '/denominations/' + i0,
                                                      schemaPath:
                                                        '#/properties/denominations/items/type',
                                                      keyword: 'type',
                                                      params: { type: 'string' },
                                                      message: 'must be string',
                                                    },
                                                  ];
                                                  return false;
                                                }
                                              }
                                              var valid4 = _errs40 === errors;
                                              if (!valid4) {
                                                break;
                                              }
                                            }
                                          }
                                        } else {
                                          validate53.errors = [
                                            {
                                              instancePath: instancePath + '/denominations',
                                              schemaPath: '#/properties/denominations/type',
                                              keyword: 'type',
                                              params: { type: 'array' },
                                              message: 'must be array',
                                            },
                                          ];
                                          return false;
                                        }
                                      }
                                      var valid0 = _errs38 === errors;
                                    } else {
                                      var valid0 = true;
                                    }
                                    if (valid0) {
                                      if (data.amountRange !== void 0) {
                                        let data15 = data.amountRange;
                                        const _errs42 = errors;
                                        if (errors === _errs42) {
                                          if (
                                            data15 &&
                                            typeof data15 == 'object' &&
                                            !Array.isArray(data15)
                                          ) {
                                            let missing1;
                                            if (
                                              (data15.currency === void 0 &&
                                                (missing1 = 'currency')) ||
                                              (data15.min === void 0 && (missing1 = 'min')) ||
                                              (data15.max === void 0 && (missing1 = 'max'))
                                            ) {
                                              validate53.errors = [
                                                {
                                                  instancePath: instancePath + '/amountRange',
                                                  schemaPath: '#/properties/amountRange/required',
                                                  keyword: 'required',
                                                  params: { missingProperty: missing1 },
                                                  message:
                                                    "must have required property '" +
                                                    missing1 +
                                                    "'",
                                                },
                                              ];
                                              return false;
                                            } else {
                                              const _errs44 = errors;
                                              for (const key1 in data15) {
                                                if (
                                                  !(
                                                    key1 === 'currency' ||
                                                    key1 === 'min' ||
                                                    key1 === 'max'
                                                  )
                                                ) {
                                                  validate53.errors = [
                                                    {
                                                      instancePath: instancePath + '/amountRange',
                                                      schemaPath:
                                                        '#/properties/amountRange/additionalProperties',
                                                      keyword: 'additionalProperties',
                                                      params: { additionalProperty: key1 },
                                                      message:
                                                        'must NOT have additional properties',
                                                    },
                                                  ];
                                                  return false;
                                                  break;
                                                }
                                              }
                                              if (_errs44 === errors) {
                                                if (data15.currency !== void 0) {
                                                  let data16 = data15.currency;
                                                  const _errs45 = errors;
                                                  if (errors === _errs45) {
                                                    if (typeof data16 === 'string') {
                                                      if (func2(data16) > 512) {
                                                        validate53.errors = [
                                                          {
                                                            instancePath:
                                                              instancePath +
                                                              '/amountRange/currency',
                                                            schemaPath:
                                                              '#/properties/amountRange/properties/currency/maxLength',
                                                            keyword: 'maxLength',
                                                            params: { limit: 512 },
                                                            message:
                                                              'must NOT have more than 512 characters',
                                                          },
                                                        ];
                                                        return false;
                                                      } else {
                                                        if (!pattern3.test(data16)) {
                                                          validate53.errors = [
                                                            {
                                                              instancePath:
                                                                instancePath +
                                                                '/amountRange/currency',
                                                              schemaPath:
                                                                '#/properties/amountRange/properties/currency/pattern',
                                                              keyword: 'pattern',
                                                              params: { pattern: '^[A-Z]{3}$' },
                                                              message:
                                                                'must match pattern "^[A-Z]{3}$"',
                                                            },
                                                          ];
                                                          return false;
                                                        }
                                                      }
                                                    } else {
                                                      validate53.errors = [
                                                        {
                                                          instancePath:
                                                            instancePath + '/amountRange/currency',
                                                          schemaPath:
                                                            '#/properties/amountRange/properties/currency/type',
                                                          keyword: 'type',
                                                          params: { type: 'string' },
                                                          message: 'must be string',
                                                        },
                                                      ];
                                                      return false;
                                                    }
                                                  }
                                                  var valid5 = _errs45 === errors;
                                                } else {
                                                  var valid5 = true;
                                                }
                                                if (valid5) {
                                                  if (data15.min !== void 0) {
                                                    let data17 = data15.min;
                                                    const _errs47 = errors;
                                                    if (errors === _errs47) {
                                                      if (typeof data17 === 'string') {
                                                        if (func2(data17) > 512) {
                                                          validate53.errors = [
                                                            {
                                                              instancePath:
                                                                instancePath + '/amountRange/min',
                                                              schemaPath:
                                                                '#/properties/amountRange/properties/min/maxLength',
                                                              keyword: 'maxLength',
                                                              params: { limit: 512 },
                                                              message:
                                                                'must NOT have more than 512 characters',
                                                            },
                                                          ];
                                                          return false;
                                                        } else {
                                                          if (!pattern5.test(data17)) {
                                                            validate53.errors = [
                                                              {
                                                                instancePath:
                                                                  instancePath + '/amountRange/min',
                                                                schemaPath:
                                                                  '#/properties/amountRange/properties/min/pattern',
                                                                keyword: 'pattern',
                                                                params: {
                                                                  pattern:
                                                                    '^(0|[1-9][0-9]*)(\\.[0-9]+)?$',
                                                                },
                                                                message:
                                                                  'must match pattern "^(0|[1-9][0-9]*)(\\.[0-9]+)?$"',
                                                              },
                                                            ];
                                                            return false;
                                                          }
                                                        }
                                                      } else {
                                                        validate53.errors = [
                                                          {
                                                            instancePath:
                                                              instancePath + '/amountRange/min',
                                                            schemaPath:
                                                              '#/properties/amountRange/properties/min/type',
                                                            keyword: 'type',
                                                            params: { type: 'string' },
                                                            message: 'must be string',
                                                          },
                                                        ];
                                                        return false;
                                                      }
                                                    }
                                                    var valid5 = _errs47 === errors;
                                                  } else {
                                                    var valid5 = true;
                                                  }
                                                  if (valid5) {
                                                    if (data15.max !== void 0) {
                                                      let data18 = data15.max;
                                                      const _errs49 = errors;
                                                      if (errors === _errs49) {
                                                        if (typeof data18 === 'string') {
                                                          if (func2(data18) > 512) {
                                                            validate53.errors = [
                                                              {
                                                                instancePath:
                                                                  instancePath + '/amountRange/max',
                                                                schemaPath:
                                                                  '#/properties/amountRange/properties/max/maxLength',
                                                                keyword: 'maxLength',
                                                                params: { limit: 512 },
                                                                message:
                                                                  'must NOT have more than 512 characters',
                                                              },
                                                            ];
                                                            return false;
                                                          } else {
                                                            if (!pattern5.test(data18)) {
                                                              validate53.errors = [
                                                                {
                                                                  instancePath:
                                                                    instancePath +
                                                                    '/amountRange/max',
                                                                  schemaPath:
                                                                    '#/properties/amountRange/properties/max/pattern',
                                                                  keyword: 'pattern',
                                                                  params: {
                                                                    pattern:
                                                                      '^(0|[1-9][0-9]*)(\\.[0-9]+)?$',
                                                                  },
                                                                  message:
                                                                    'must match pattern "^(0|[1-9][0-9]*)(\\.[0-9]+)?$"',
                                                                },
                                                              ];
                                                              return false;
                                                            }
                                                          }
                                                        } else {
                                                          validate53.errors = [
                                                            {
                                                              instancePath:
                                                                instancePath + '/amountRange/max',
                                                              schemaPath:
                                                                '#/properties/amountRange/properties/max/type',
                                                              keyword: 'type',
                                                              params: { type: 'string' },
                                                              message: 'must be string',
                                                            },
                                                          ];
                                                          return false;
                                                        }
                                                      }
                                                      var valid5 = _errs49 === errors;
                                                    } else {
                                                      var valid5 = true;
                                                    }
                                                  }
                                                }
                                              }
                                            }
                                          } else {
                                            validate53.errors = [
                                              {
                                                instancePath: instancePath + '/amountRange',
                                                schemaPath: '#/properties/amountRange/type',
                                                keyword: 'type',
                                                params: { type: 'object' },
                                                message: 'must be object',
                                              },
                                            ];
                                            return false;
                                          }
                                        }
                                        var valid0 = _errs42 === errors;
                                      } else {
                                        var valid0 = true;
                                      }
                                      if (valid0) {
                                        if (data.qualifications !== void 0) {
                                          let data19 = data.qualifications;
                                          const _errs51 = errors;
                                          if (errors === _errs51) {
                                            if (Array.isArray(data19)) {
                                              if (data19.length > 100) {
                                                validate53.errors = [
                                                  {
                                                    instancePath: instancePath + '/qualifications',
                                                    schemaPath:
                                                      '#/properties/qualifications/maxItems',
                                                    keyword: 'maxItems',
                                                    params: { limit: 100 },
                                                    message: 'must NOT have more than 100 items',
                                                  },
                                                ];
                                                return false;
                                              } else {
                                                var valid6 = true;
                                                const len1 = data19.length;
                                                for (let i1 = 0; i1 < len1; i1++) {
                                                  let data20 = data19[i1];
                                                  const _errs53 = errors;
                                                  if (errors === _errs53) {
                                                    if (typeof data20 === 'string') {
                                                      if (func2(data20) > 512) {
                                                        validate53.errors = [
                                                          {
                                                            instancePath:
                                                              instancePath +
                                                              '/qualifications/' +
                                                              i1,
                                                            schemaPath:
                                                              '#/properties/qualifications/items/maxLength',
                                                            keyword: 'maxLength',
                                                            params: { limit: 512 },
                                                            message:
                                                              'must NOT have more than 512 characters',
                                                          },
                                                        ];
                                                        return false;
                                                      }
                                                    } else {
                                                      validate53.errors = [
                                                        {
                                                          instancePath:
                                                            instancePath + '/qualifications/' + i1,
                                                          schemaPath:
                                                            '#/properties/qualifications/items/type',
                                                          keyword: 'type',
                                                          params: { type: 'string' },
                                                          message: 'must be string',
                                                        },
                                                      ];
                                                      return false;
                                                    }
                                                  }
                                                  var valid6 = _errs53 === errors;
                                                  if (!valid6) {
                                                    break;
                                                  }
                                                }
                                              }
                                            } else {
                                              validate53.errors = [
                                                {
                                                  instancePath: instancePath + '/qualifications',
                                                  schemaPath: '#/properties/qualifications/type',
                                                  keyword: 'type',
                                                  params: { type: 'array' },
                                                  message: 'must be array',
                                                },
                                              ];
                                              return false;
                                            }
                                          }
                                          var valid0 = _errs51 === errors;
                                        } else {
                                          var valid0 = true;
                                        }
                                        if (valid0) {
                                          if (data.feeStatus !== void 0) {
                                            let data21 = data.feeStatus;
                                            const _errs55 = errors;
                                            if (
                                              !(
                                                data21 === 'unknown' ||
                                                data21 === 'no_additional_fee' ||
                                                data21 === 'unsupported'
                                              )
                                            ) {
                                              validate53.errors = [
                                                {
                                                  instancePath: instancePath + '/feeStatus',
                                                  schemaPath: '#/properties/feeStatus/enum',
                                                  keyword: 'enum',
                                                  params: {
                                                    allowedValues:
                                                      schema20.properties.feeStatus.enum,
                                                  },
                                                  message:
                                                    'must be equal to one of the allowed values',
                                                },
                                              ];
                                              return false;
                                            }
                                            var valid0 = _errs55 === errors;
                                          } else {
                                            var valid0 = true;
                                          }
                                          if (valid0) {
                                            if (data.sourceUrl !== void 0) {
                                              let data22 = data.sourceUrl;
                                              const _errs56 = errors;
                                              if (errors === _errs56) {
                                                if (typeof data22 === 'string') {
                                                  if (func2(data22) > 512) {
                                                    validate53.errors = [
                                                      {
                                                        instancePath: instancePath + '/sourceUrl',
                                                        schemaPath:
                                                          '#/properties/sourceUrl/maxLength',
                                                        keyword: 'maxLength',
                                                        params: { limit: 512 },
                                                        message:
                                                          'must NOT have more than 512 characters',
                                                      },
                                                    ];
                                                    return false;
                                                  }
                                                } else {
                                                  validate53.errors = [
                                                    {
                                                      instancePath: instancePath + '/sourceUrl',
                                                      schemaPath: '#/properties/sourceUrl/type',
                                                      keyword: 'type',
                                                      params: { type: 'string' },
                                                      message: 'must be string',
                                                    },
                                                  ];
                                                  return false;
                                                }
                                              }
                                              var valid0 = _errs56 === errors;
                                            } else {
                                              var valid0 = true;
                                            }
                                            if (valid0) {
                                              if (data.originalBuyField !== void 0) {
                                                let data23 = data.originalBuyField;
                                                const _errs58 = errors;
                                                if (errors === _errs58) {
                                                  if (typeof data23 === 'string') {
                                                    if (func2(data23) > 512) {
                                                      validate53.errors = [
                                                        {
                                                          instancePath:
                                                            instancePath + '/originalBuyField',
                                                          schemaPath:
                                                            '#/properties/originalBuyField/maxLength',
                                                          keyword: 'maxLength',
                                                          params: { limit: 512 },
                                                          message:
                                                            'must NOT have more than 512 characters',
                                                        },
                                                      ];
                                                      return false;
                                                    }
                                                  } else {
                                                    validate53.errors = [
                                                      {
                                                        instancePath:
                                                          instancePath + '/originalBuyField',
                                                        schemaPath:
                                                          '#/properties/originalBuyField/type',
                                                        keyword: 'type',
                                                        params: { type: 'string' },
                                                        message: 'must be string',
                                                      },
                                                    ];
                                                    return false;
                                                  }
                                                }
                                                var valid0 = _errs58 === errors;
                                              } else {
                                                var valid0 = true;
                                              }
                                              if (valid0) {
                                                if (data.originalSellField !== void 0) {
                                                  let data24 = data.originalSellField;
                                                  const _errs60 = errors;
                                                  if (errors === _errs60) {
                                                    if (typeof data24 === 'string') {
                                                      if (func2(data24) > 512) {
                                                        validate53.errors = [
                                                          {
                                                            instancePath:
                                                              instancePath + '/originalSellField',
                                                            schemaPath:
                                                              '#/properties/originalSellField/maxLength',
                                                            keyword: 'maxLength',
                                                            params: { limit: 512 },
                                                            message:
                                                              'must NOT have more than 512 characters',
                                                          },
                                                        ];
                                                        return false;
                                                      }
                                                    } else {
                                                      validate53.errors = [
                                                        {
                                                          instancePath:
                                                            instancePath + '/originalSellField',
                                                          schemaPath:
                                                            '#/properties/originalSellField/type',
                                                          keyword: 'type',
                                                          params: { type: 'string' },
                                                          message: 'must be string',
                                                        },
                                                      ];
                                                      return false;
                                                    }
                                                  }
                                                  var valid0 = _errs60 === errors;
                                                } else {
                                                  var valid0 = true;
                                                }
                                                if (valid0) {
                                                  if (data.mappingVersion !== void 0) {
                                                    let data25 = data.mappingVersion;
                                                    const _errs62 = errors;
                                                    if (errors === _errs62) {
                                                      if (typeof data25 === 'string') {
                                                        if (func2(data25) > 512) {
                                                          validate53.errors = [
                                                            {
                                                              instancePath:
                                                                instancePath + '/mappingVersion',
                                                              schemaPath:
                                                                '#/properties/mappingVersion/maxLength',
                                                              keyword: 'maxLength',
                                                              params: { limit: 512 },
                                                              message:
                                                                'must NOT have more than 512 characters',
                                                            },
                                                          ];
                                                          return false;
                                                        }
                                                      } else {
                                                        validate53.errors = [
                                                          {
                                                            instancePath:
                                                              instancePath + '/mappingVersion',
                                                            schemaPath:
                                                              '#/properties/mappingVersion/type',
                                                            keyword: 'type',
                                                            params: { type: 'string' },
                                                            message: 'must be string',
                                                          },
                                                        ];
                                                        return false;
                                                      }
                                                    }
                                                    var valid0 = _errs62 === errors;
                                                  } else {
                                                    var valid0 = true;
                                                  }
                                                  if (valid0) {
                                                    if (data.originalUnitAmount !== void 0) {
                                                      let data26 = data.originalUnitAmount;
                                                      const _errs64 = errors;
                                                      if (errors === _errs64) {
                                                        if (typeof data26 === 'string') {
                                                          if (func2(data26) > 512) {
                                                            validate53.errors = [
                                                              {
                                                                instancePath:
                                                                  instancePath +
                                                                  '/originalUnitAmount',
                                                                schemaPath:
                                                                  '#/properties/originalUnitAmount/maxLength',
                                                                keyword: 'maxLength',
                                                                params: { limit: 512 },
                                                                message:
                                                                  'must NOT have more than 512 characters',
                                                              },
                                                            ];
                                                            return false;
                                                          } else {
                                                            if (!pattern5.test(data26)) {
                                                              validate53.errors = [
                                                                {
                                                                  instancePath:
                                                                    instancePath +
                                                                    '/originalUnitAmount',
                                                                  schemaPath:
                                                                    '#/properties/originalUnitAmount/pattern',
                                                                  keyword: 'pattern',
                                                                  params: {
                                                                    pattern:
                                                                      '^(0|[1-9][0-9]*)(\\.[0-9]+)?$',
                                                                  },
                                                                  message:
                                                                    'must match pattern "^(0|[1-9][0-9]*)(\\.[0-9]+)?$"',
                                                                },
                                                              ];
                                                              return false;
                                                            }
                                                          }
                                                        } else {
                                                          validate53.errors = [
                                                            {
                                                              instancePath:
                                                                instancePath +
                                                                '/originalUnitAmount',
                                                              schemaPath:
                                                                '#/properties/originalUnitAmount/type',
                                                              keyword: 'type',
                                                              params: { type: 'string' },
                                                              message: 'must be string',
                                                            },
                                                          ];
                                                          return false;
                                                        }
                                                      }
                                                      var valid0 = _errs64 === errors;
                                                    } else {
                                                      var valid0 = true;
                                                    }
                                                    if (valid0) {
                                                      if (data.dataKind !== void 0) {
                                                        let data27 = data.dataKind;
                                                        const _errs66 = errors;
                                                        if (
                                                          !(
                                                            data27 === 'published_board' ||
                                                            data27 === 'fixed_fallback' ||
                                                            data27 === 'reference' ||
                                                            data27 === 'derived_cross'
                                                          )
                                                        ) {
                                                          validate53.errors = [
                                                            {
                                                              instancePath:
                                                                instancePath + '/dataKind',
                                                              schemaPath:
                                                                '#/properties/dataKind/enum',
                                                              keyword: 'enum',
                                                              params: {
                                                                allowedValues:
                                                                  schema20.properties.dataKind.enum,
                                                              },
                                                              message:
                                                                'must be equal to one of the allowed values',
                                                            },
                                                          ];
                                                          return false;
                                                        }
                                                        var valid0 = _errs66 === errors;
                                                      } else {
                                                        var valid0 = true;
                                                      }
                                                      if (valid0) {
                                                        if (data.feeEvidenceUrl !== void 0) {
                                                          let data28 = data.feeEvidenceUrl;
                                                          const _errs67 = errors;
                                                          if (errors === _errs67) {
                                                            if (typeof data28 === 'string') {
                                                              if (func2(data28) > 512) {
                                                                validate53.errors = [
                                                                  {
                                                                    instancePath:
                                                                      instancePath +
                                                                      '/feeEvidenceUrl',
                                                                    schemaPath:
                                                                      '#/properties/feeEvidenceUrl/maxLength',
                                                                    keyword: 'maxLength',
                                                                    params: { limit: 512 },
                                                                    message:
                                                                      'must NOT have more than 512 characters',
                                                                  },
                                                                ];
                                                                return false;
                                                              } else {
                                                                if (func2(data28) < 1) {
                                                                  validate53.errors = [
                                                                    {
                                                                      instancePath:
                                                                        instancePath +
                                                                        '/feeEvidenceUrl',
                                                                      schemaPath:
                                                                        '#/properties/feeEvidenceUrl/minLength',
                                                                      keyword: 'minLength',
                                                                      params: { limit: 1 },
                                                                      message:
                                                                        'must NOT have fewer than 1 characters',
                                                                    },
                                                                  ];
                                                                  return false;
                                                                } else {
                                                                  if (!pattern14.test(data28)) {
                                                                    validate53.errors = [
                                                                      {
                                                                        instancePath:
                                                                          instancePath +
                                                                          '/feeEvidenceUrl',
                                                                        schemaPath:
                                                                          '#/properties/feeEvidenceUrl/pattern',
                                                                        keyword: 'pattern',
                                                                        params: {
                                                                          pattern: '^https://',
                                                                        },
                                                                        message:
                                                                          'must match pattern "^https://"',
                                                                      },
                                                                    ];
                                                                    return false;
                                                                  }
                                                                }
                                                              }
                                                            } else {
                                                              validate53.errors = [
                                                                {
                                                                  instancePath:
                                                                    instancePath +
                                                                    '/feeEvidenceUrl',
                                                                  schemaPath:
                                                                    '#/properties/feeEvidenceUrl/type',
                                                                  keyword: 'type',
                                                                  params: { type: 'string' },
                                                                  message: 'must be string',
                                                                },
                                                              ];
                                                              return false;
                                                            }
                                                          }
                                                          var valid0 = _errs67 === errors;
                                                        } else {
                                                          var valid0 = true;
                                                        }
                                                      }
                                                    }
                                                  }
                                                }
                                              }
                                            }
                                          }
                                        }
                                      }
                                    }
                                  }
                                }
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    } else {
      validate53.errors = [
        {
          instancePath,
          schemaPath: '#/type',
          keyword: 'type',
          params: { type: 'object' },
          message: 'must be object',
        },
      ];
      return false;
    }
  }
  validate53.errors = vErrors;
  return errors === 0;
}
validate53.evaluated = { props: true, dynamicProps: false, dynamicItems: false };
function validate83(
  data,
  { instancePath = '', parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {},
) {
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate83.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = void 0;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = void 0;
  }
  if (errors === 0) {
    if (data && typeof data == 'object' && !Array.isArray(data)) {
      let missing0;
      if (
        (data.quoteId === void 0 && (missing0 = 'quoteId')) ||
        (data.quoteSeriesId === void 0 && (missing0 = 'quoteSeriesId')) ||
        (data.providerId === void 0 && (missing0 = 'providerId')) ||
        (data.fromCurrency === void 0 && (missing0 = 'fromCurrency')) ||
        (data.toCurrency === void 0 && (missing0 = 'toCurrency')) ||
        (data.providerSide === void 0 && (missing0 = 'providerSide')) ||
        (data.status === void 0 && (missing0 = 'status')) ||
        (data.rate === void 0 && (missing0 = 'rate')) ||
        (data.unavailableReason === void 0 && (missing0 = 'unavailableReason')) ||
        (data.sourceQuote === void 0 && (missing0 = 'sourceQuote')) ||
        (data.methodVersion === void 0 && (missing0 = 'methodVersion'))
      ) {
        validate83.errors = [
          {
            instancePath,
            schemaPath: '#/required',
            keyword: 'required',
            params: { missingProperty: missing0 },
            message: "must have required property '" + missing0 + "'",
          },
        ];
        return false;
      } else {
        const _errs1 = errors;
        for (const key0 in data) {
          if (!func1.call(schema21.properties, key0)) {
            validate83.errors = [
              {
                instancePath,
                schemaPath: '#/additionalProperties',
                keyword: 'additionalProperties',
                params: { additionalProperty: key0 },
                message: 'must NOT have additional properties',
              },
            ];
            return false;
            break;
          }
        }
        if (_errs1 === errors) {
          if (data.quoteId !== void 0) {
            let data0 = data.quoteId;
            const _errs2 = errors;
            if (errors === _errs2) {
              if (typeof data0 === 'string') {
                if (func2(data0) > 2e4) {
                  validate83.errors = [
                    {
                      instancePath: instancePath + '/quoteId',
                      schemaPath: '#/properties/quoteId/maxLength',
                      keyword: 'maxLength',
                      params: { limit: 2e4 },
                      message: 'must NOT have more than 20000 characters',
                    },
                  ];
                  return false;
                }
              } else {
                validate83.errors = [
                  {
                    instancePath: instancePath + '/quoteId',
                    schemaPath: '#/properties/quoteId/type',
                    keyword: 'type',
                    params: { type: 'string' },
                    message: 'must be string',
                  },
                ];
                return false;
              }
            }
            var valid0 = _errs2 === errors;
          } else {
            var valid0 = true;
          }
          if (valid0) {
            if (data.quoteSeriesId !== void 0) {
              let data1 = data.quoteSeriesId;
              const _errs4 = errors;
              if (errors === _errs4) {
                if (typeof data1 === 'string') {
                  if (func2(data1) > 2e4) {
                    validate83.errors = [
                      {
                        instancePath: instancePath + '/quoteSeriesId',
                        schemaPath: '#/properties/quoteSeriesId/maxLength',
                        keyword: 'maxLength',
                        params: { limit: 2e4 },
                        message: 'must NOT have more than 20000 characters',
                      },
                    ];
                    return false;
                  }
                } else {
                  validate83.errors = [
                    {
                      instancePath: instancePath + '/quoteSeriesId',
                      schemaPath: '#/properties/quoteSeriesId/type',
                      keyword: 'type',
                      params: { type: 'string' },
                      message: 'must be string',
                    },
                  ];
                  return false;
                }
              }
              var valid0 = _errs4 === errors;
            } else {
              var valid0 = true;
            }
            if (valid0) {
              if (data.providerId !== void 0) {
                let data2 = data.providerId;
                const _errs6 = errors;
                if (errors === _errs6) {
                  if (typeof data2 === 'string') {
                    if (func2(data2) > 512) {
                      validate83.errors = [
                        {
                          instancePath: instancePath + '/providerId',
                          schemaPath: '#/properties/providerId/maxLength',
                          keyword: 'maxLength',
                          params: { limit: 512 },
                          message: 'must NOT have more than 512 characters',
                        },
                      ];
                      return false;
                    }
                  } else {
                    validate83.errors = [
                      {
                        instancePath: instancePath + '/providerId',
                        schemaPath: '#/properties/providerId/type',
                        keyword: 'type',
                        params: { type: 'string' },
                        message: 'must be string',
                      },
                    ];
                    return false;
                  }
                }
                var valid0 = _errs6 === errors;
              } else {
                var valid0 = true;
              }
              if (valid0) {
                if (data.fromCurrency !== void 0) {
                  let data3 = data.fromCurrency;
                  const _errs8 = errors;
                  if (errors === _errs8) {
                    if (typeof data3 === 'string') {
                      if (func2(data3) > 512) {
                        validate83.errors = [
                          {
                            instancePath: instancePath + '/fromCurrency',
                            schemaPath: '#/properties/fromCurrency/maxLength',
                            keyword: 'maxLength',
                            params: { limit: 512 },
                            message: 'must NOT have more than 512 characters',
                          },
                        ];
                        return false;
                      } else {
                        if (!pattern3.test(data3)) {
                          validate83.errors = [
                            {
                              instancePath: instancePath + '/fromCurrency',
                              schemaPath: '#/properties/fromCurrency/pattern',
                              keyword: 'pattern',
                              params: { pattern: '^[A-Z]{3}$' },
                              message: 'must match pattern "^[A-Z]{3}$"',
                            },
                          ];
                          return false;
                        }
                      }
                    } else {
                      validate83.errors = [
                        {
                          instancePath: instancePath + '/fromCurrency',
                          schemaPath: '#/properties/fromCurrency/type',
                          keyword: 'type',
                          params: { type: 'string' },
                          message: 'must be string',
                        },
                      ];
                      return false;
                    }
                  }
                  var valid0 = _errs8 === errors;
                } else {
                  var valid0 = true;
                }
                if (valid0) {
                  if (data.toCurrency !== void 0) {
                    let data4 = data.toCurrency;
                    const _errs10 = errors;
                    if (errors === _errs10) {
                      if (typeof data4 === 'string') {
                        if (func2(data4) > 512) {
                          validate83.errors = [
                            {
                              instancePath: instancePath + '/toCurrency',
                              schemaPath: '#/properties/toCurrency/maxLength',
                              keyword: 'maxLength',
                              params: { limit: 512 },
                              message: 'must NOT have more than 512 characters',
                            },
                          ];
                          return false;
                        } else {
                          if (!pattern3.test(data4)) {
                            validate83.errors = [
                              {
                                instancePath: instancePath + '/toCurrency',
                                schemaPath: '#/properties/toCurrency/pattern',
                                keyword: 'pattern',
                                params: { pattern: '^[A-Z]{3}$' },
                                message: 'must match pattern "^[A-Z]{3}$"',
                              },
                            ];
                            return false;
                          }
                        }
                      } else {
                        validate83.errors = [
                          {
                            instancePath: instancePath + '/toCurrency',
                            schemaPath: '#/properties/toCurrency/type',
                            keyword: 'type',
                            params: { type: 'string' },
                            message: 'must be string',
                          },
                        ];
                        return false;
                      }
                    }
                    var valid0 = _errs10 === errors;
                  } else {
                    var valid0 = true;
                  }
                  if (valid0) {
                    if (data.providerSide !== void 0) {
                      let data5 = data.providerSide;
                      const _errs12 = errors;
                      if (!(data5 === 'buy' || data5 === 'sell')) {
                        validate83.errors = [
                          {
                            instancePath: instancePath + '/providerSide',
                            schemaPath: '#/properties/providerSide/enum',
                            keyword: 'enum',
                            params: { allowedValues: schema21.properties.providerSide.enum },
                            message: 'must be equal to one of the allowed values',
                          },
                        ];
                        return false;
                      }
                      var valid0 = _errs12 === errors;
                    } else {
                      var valid0 = true;
                    }
                    if (valid0) {
                      if (data.status !== void 0) {
                        let data6 = data.status;
                        const _errs13 = errors;
                        if (!(data6 === 'available' || data6 === 'unavailable')) {
                          validate83.errors = [
                            {
                              instancePath: instancePath + '/status',
                              schemaPath: '#/properties/status/enum',
                              keyword: 'enum',
                              params: { allowedValues: schema21.properties.status.enum },
                              message: 'must be equal to one of the allowed values',
                            },
                          ];
                          return false;
                        }
                        var valid0 = _errs13 === errors;
                      } else {
                        var valid0 = true;
                      }
                      if (valid0) {
                        if (data.rate !== void 0) {
                          let data7 = data.rate;
                          const _errs14 = errors;
                          const _errs15 = errors;
                          let valid1 = false;
                          const _errs16 = errors;
                          if (errors === _errs16) {
                            if (typeof data7 === 'string') {
                              if (func2(data7) > 512) {
                                const err0 = {
                                  instancePath: instancePath + '/rate',
                                  schemaPath: '#/properties/rate/anyOf/0/maxLength',
                                  keyword: 'maxLength',
                                  params: { limit: 512 },
                                  message: 'must NOT have more than 512 characters',
                                };
                                if (vErrors === null) {
                                  vErrors = [err0];
                                } else {
                                  vErrors.push(err0);
                                }
                                errors++;
                              } else {
                                if (!pattern5.test(data7)) {
                                  const err1 = {
                                    instancePath: instancePath + '/rate',
                                    schemaPath: '#/properties/rate/anyOf/0/pattern',
                                    keyword: 'pattern',
                                    params: { pattern: '^(0|[1-9][0-9]*)(\\.[0-9]+)?$' },
                                    message: 'must match pattern "^(0|[1-9][0-9]*)(\\.[0-9]+)?$"',
                                  };
                                  if (vErrors === null) {
                                    vErrors = [err1];
                                  } else {
                                    vErrors.push(err1);
                                  }
                                  errors++;
                                }
                              }
                            } else {
                              const err2 = {
                                instancePath: instancePath + '/rate',
                                schemaPath: '#/properties/rate/anyOf/0/type',
                                keyword: 'type',
                                params: { type: 'string' },
                                message: 'must be string',
                              };
                              if (vErrors === null) {
                                vErrors = [err2];
                              } else {
                                vErrors.push(err2);
                              }
                              errors++;
                            }
                          }
                          var _valid0 = _errs16 === errors;
                          valid1 = valid1 || _valid0;
                          const _errs18 = errors;
                          if (data7 !== null) {
                            const err3 = {
                              instancePath: instancePath + '/rate',
                              schemaPath: '#/properties/rate/anyOf/1/type',
                              keyword: 'type',
                              params: { type: 'null' },
                              message: 'must be null',
                            };
                            if (vErrors === null) {
                              vErrors = [err3];
                            } else {
                              vErrors.push(err3);
                            }
                            errors++;
                          }
                          var _valid0 = _errs18 === errors;
                          valid1 = valid1 || _valid0;
                          if (!valid1) {
                            const err4 = {
                              instancePath: instancePath + '/rate',
                              schemaPath: '#/properties/rate/anyOf',
                              keyword: 'anyOf',
                              params: {},
                              message: 'must match a schema in anyOf',
                            };
                            if (vErrors === null) {
                              vErrors = [err4];
                            } else {
                              vErrors.push(err4);
                            }
                            errors++;
                            validate83.errors = vErrors;
                            return false;
                          } else {
                            errors = _errs15;
                            if (vErrors !== null) {
                              if (_errs15) {
                                vErrors.length = _errs15;
                              } else {
                                vErrors = null;
                              }
                            }
                          }
                          var valid0 = _errs14 === errors;
                        } else {
                          var valid0 = true;
                        }
                        if (valid0) {
                          if (data.unavailableReason !== void 0) {
                            let data8 = data.unavailableReason;
                            const _errs20 = errors;
                            if (!(data8 === 'not_quoted' || data8 === null)) {
                              validate83.errors = [
                                {
                                  instancePath: instancePath + '/unavailableReason',
                                  schemaPath: '#/properties/unavailableReason/enum',
                                  keyword: 'enum',
                                  params: {
                                    allowedValues: schema21.properties.unavailableReason.enum,
                                  },
                                  message: 'must be equal to one of the allowed values',
                                },
                              ];
                              return false;
                            }
                            var valid0 = _errs20 === errors;
                          } else {
                            var valid0 = true;
                          }
                          if (valid0) {
                            if (data.sourceQuote !== void 0) {
                              const _errs21 = errors;
                              if (
                                !validate53(data.sourceQuote, {
                                  instancePath: instancePath + '/sourceQuote',
                                  parentData: data,
                                  parentDataProperty: 'sourceQuote',
                                  rootData,
                                  dynamicAnchors,
                                })
                              ) {
                                vErrors =
                                  vErrors === null
                                    ? validate53.errors
                                    : vErrors.concat(validate53.errors);
                                errors = vErrors.length;
                              }
                              var valid0 = _errs21 === errors;
                            } else {
                              var valid0 = true;
                            }
                            if (valid0) {
                              if (data.methodVersion !== void 0) {
                                const _errs22 = errors;
                                if ('1' !== data.methodVersion) {
                                  validate83.errors = [
                                    {
                                      instancePath: instancePath + '/methodVersion',
                                      schemaPath: '#/properties/methodVersion/const',
                                      keyword: 'const',
                                      params: { allowedValue: '1' },
                                      message: 'must be equal to constant',
                                    },
                                  ];
                                  return false;
                                }
                                var valid0 = _errs22 === errors;
                              } else {
                                var valid0 = true;
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    } else {
      validate83.errors = [
        {
          instancePath,
          schemaPath: '#/type',
          keyword: 'type',
          params: { type: 'object' },
          message: 'must be object',
        },
      ];
      return false;
    }
  }
  validate83.errors = vErrors;
  return errors === 0;
}
validate83.evaluated = { props: true, dynamicProps: false, dynamicItems: false };
var validateEstimateRequest = validate85;
var schema22 = {
  type: 'object',
  properties: {
    fromCurrency: { type: 'string', pattern: '^[A-Z]{3}$', maxLength: 512 },
    toCurrency: { type: 'string', pattern: '^[A-Z]{3}$', maxLength: 512 },
    amount: { type: 'string', pattern: '^(0|[1-9][0-9]*)(\\.[0-9]+)?$', maxLength: 512 },
    mode: { enum: ['EXACT_IN', 'EXACT_OUT'] },
  },
  required: ['fromCurrency', 'toCurrency', 'amount', 'mode'],
  additionalProperties: false,
};
function validate85(
  data,
  { instancePath = '', parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {},
) {
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate85.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = void 0;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = void 0;
  }
  if (errors === 0) {
    if (data && typeof data == 'object' && !Array.isArray(data)) {
      let missing0;
      if (
        (data.fromCurrency === void 0 && (missing0 = 'fromCurrency')) ||
        (data.toCurrency === void 0 && (missing0 = 'toCurrency')) ||
        (data.amount === void 0 && (missing0 = 'amount')) ||
        (data.mode === void 0 && (missing0 = 'mode'))
      ) {
        validate85.errors = [
          {
            instancePath,
            schemaPath: '#/required',
            keyword: 'required',
            params: { missingProperty: missing0 },
            message: "must have required property '" + missing0 + "'",
          },
        ];
        return false;
      } else {
        const _errs1 = errors;
        for (const key0 in data) {
          if (
            !(
              key0 === 'fromCurrency' ||
              key0 === 'toCurrency' ||
              key0 === 'amount' ||
              key0 === 'mode'
            )
          ) {
            validate85.errors = [
              {
                instancePath,
                schemaPath: '#/additionalProperties',
                keyword: 'additionalProperties',
                params: { additionalProperty: key0 },
                message: 'must NOT have additional properties',
              },
            ];
            return false;
            break;
          }
        }
        if (_errs1 === errors) {
          if (data.fromCurrency !== void 0) {
            let data0 = data.fromCurrency;
            const _errs2 = errors;
            if (errors === _errs2) {
              if (typeof data0 === 'string') {
                if (func2(data0) > 512) {
                  validate85.errors = [
                    {
                      instancePath: instancePath + '/fromCurrency',
                      schemaPath: '#/properties/fromCurrency/maxLength',
                      keyword: 'maxLength',
                      params: { limit: 512 },
                      message: 'must NOT have more than 512 characters',
                    },
                  ];
                  return false;
                } else {
                  if (!pattern3.test(data0)) {
                    validate85.errors = [
                      {
                        instancePath: instancePath + '/fromCurrency',
                        schemaPath: '#/properties/fromCurrency/pattern',
                        keyword: 'pattern',
                        params: { pattern: '^[A-Z]{3}$' },
                        message: 'must match pattern "^[A-Z]{3}$"',
                      },
                    ];
                    return false;
                  }
                }
              } else {
                validate85.errors = [
                  {
                    instancePath: instancePath + '/fromCurrency',
                    schemaPath: '#/properties/fromCurrency/type',
                    keyword: 'type',
                    params: { type: 'string' },
                    message: 'must be string',
                  },
                ];
                return false;
              }
            }
            var valid0 = _errs2 === errors;
          } else {
            var valid0 = true;
          }
          if (valid0) {
            if (data.toCurrency !== void 0) {
              let data1 = data.toCurrency;
              const _errs4 = errors;
              if (errors === _errs4) {
                if (typeof data1 === 'string') {
                  if (func2(data1) > 512) {
                    validate85.errors = [
                      {
                        instancePath: instancePath + '/toCurrency',
                        schemaPath: '#/properties/toCurrency/maxLength',
                        keyword: 'maxLength',
                        params: { limit: 512 },
                        message: 'must NOT have more than 512 characters',
                      },
                    ];
                    return false;
                  } else {
                    if (!pattern3.test(data1)) {
                      validate85.errors = [
                        {
                          instancePath: instancePath + '/toCurrency',
                          schemaPath: '#/properties/toCurrency/pattern',
                          keyword: 'pattern',
                          params: { pattern: '^[A-Z]{3}$' },
                          message: 'must match pattern "^[A-Z]{3}$"',
                        },
                      ];
                      return false;
                    }
                  }
                } else {
                  validate85.errors = [
                    {
                      instancePath: instancePath + '/toCurrency',
                      schemaPath: '#/properties/toCurrency/type',
                      keyword: 'type',
                      params: { type: 'string' },
                      message: 'must be string',
                    },
                  ];
                  return false;
                }
              }
              var valid0 = _errs4 === errors;
            } else {
              var valid0 = true;
            }
            if (valid0) {
              if (data.amount !== void 0) {
                let data2 = data.amount;
                const _errs6 = errors;
                if (errors === _errs6) {
                  if (typeof data2 === 'string') {
                    if (func2(data2) > 512) {
                      validate85.errors = [
                        {
                          instancePath: instancePath + '/amount',
                          schemaPath: '#/properties/amount/maxLength',
                          keyword: 'maxLength',
                          params: { limit: 512 },
                          message: 'must NOT have more than 512 characters',
                        },
                      ];
                      return false;
                    } else {
                      if (!pattern5.test(data2)) {
                        validate85.errors = [
                          {
                            instancePath: instancePath + '/amount',
                            schemaPath: '#/properties/amount/pattern',
                            keyword: 'pattern',
                            params: { pattern: '^(0|[1-9][0-9]*)(\\.[0-9]+)?$' },
                            message: 'must match pattern "^(0|[1-9][0-9]*)(\\.[0-9]+)?$"',
                          },
                        ];
                        return false;
                      }
                    }
                  } else {
                    validate85.errors = [
                      {
                        instancePath: instancePath + '/amount',
                        schemaPath: '#/properties/amount/type',
                        keyword: 'type',
                        params: { type: 'string' },
                        message: 'must be string',
                      },
                    ];
                    return false;
                  }
                }
                var valid0 = _errs6 === errors;
              } else {
                var valid0 = true;
              }
              if (valid0) {
                if (data.mode !== void 0) {
                  let data3 = data.mode;
                  const _errs8 = errors;
                  if (!(data3 === 'EXACT_IN' || data3 === 'EXACT_OUT')) {
                    validate85.errors = [
                      {
                        instancePath: instancePath + '/mode',
                        schemaPath: '#/properties/mode/enum',
                        keyword: 'enum',
                        params: { allowedValues: schema22.properties.mode.enum },
                        message: 'must be equal to one of the allowed values',
                      },
                    ];
                    return false;
                  }
                  var valid0 = _errs8 === errors;
                } else {
                  var valid0 = true;
                }
              }
            }
          }
        }
      }
    } else {
      validate85.errors = [
        {
          instancePath,
          schemaPath: '#/type',
          keyword: 'type',
          params: { type: 'object' },
          message: 'must be object',
        },
      ];
      return false;
    }
  }
  validate85.errors = vErrors;
  return errors === 0;
}
validate85.evaluated = { props: true, dynamicProps: false, dynamicItems: false };
var validateEstimateResult = validate86;
var schema23 = {
  type: 'object',
  properties: {
    status: { enum: ['available', 'unavailable'] },
    fromAmount: {
      anyOf: [
        { type: 'string', pattern: '^(0|[1-9][0-9]*)(\\.[0-9]+)?$', maxLength: 512 },
        { type: 'null' },
      ],
    },
    toAmount: {
      anyOf: [
        { type: 'string', pattern: '^(0|[1-9][0-9]*)(\\.[0-9]+)?$', maxLength: 512 },
        { type: 'null' },
      ],
    },
    quoteId: { type: ['string', 'null'] },
    rate: {
      anyOf: [
        { type: 'string', pattern: '^(0|[1-9][0-9]*)(\\.[0-9]+)?$', maxLength: 512 },
        { type: 'null' },
      ],
    },
    reason: { type: ['string', 'null'] },
    feeStatus: { enum: ['unknown', 'no_additional_fee', 'unsupported'] },
  },
  required: ['status', 'fromAmount', 'toAmount', 'quoteId', 'rate', 'reason', 'feeStatus'],
  additionalProperties: false,
};
function validate86(
  data,
  { instancePath = '', parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {},
) {
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate86.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = void 0;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = void 0;
  }
  if (errors === 0) {
    if (data && typeof data == 'object' && !Array.isArray(data)) {
      let missing0;
      if (
        (data.status === void 0 && (missing0 = 'status')) ||
        (data.fromAmount === void 0 && (missing0 = 'fromAmount')) ||
        (data.toAmount === void 0 && (missing0 = 'toAmount')) ||
        (data.quoteId === void 0 && (missing0 = 'quoteId')) ||
        (data.rate === void 0 && (missing0 = 'rate')) ||
        (data.reason === void 0 && (missing0 = 'reason')) ||
        (data.feeStatus === void 0 && (missing0 = 'feeStatus'))
      ) {
        validate86.errors = [
          {
            instancePath,
            schemaPath: '#/required',
            keyword: 'required',
            params: { missingProperty: missing0 },
            message: "must have required property '" + missing0 + "'",
          },
        ];
        return false;
      } else {
        const _errs1 = errors;
        for (const key0 in data) {
          if (
            !(
              key0 === 'status' ||
              key0 === 'fromAmount' ||
              key0 === 'toAmount' ||
              key0 === 'quoteId' ||
              key0 === 'rate' ||
              key0 === 'reason' ||
              key0 === 'feeStatus'
            )
          ) {
            validate86.errors = [
              {
                instancePath,
                schemaPath: '#/additionalProperties',
                keyword: 'additionalProperties',
                params: { additionalProperty: key0 },
                message: 'must NOT have additional properties',
              },
            ];
            return false;
            break;
          }
        }
        if (_errs1 === errors) {
          if (data.status !== void 0) {
            let data0 = data.status;
            const _errs2 = errors;
            if (!(data0 === 'available' || data0 === 'unavailable')) {
              validate86.errors = [
                {
                  instancePath: instancePath + '/status',
                  schemaPath: '#/properties/status/enum',
                  keyword: 'enum',
                  params: { allowedValues: schema23.properties.status.enum },
                  message: 'must be equal to one of the allowed values',
                },
              ];
              return false;
            }
            var valid0 = _errs2 === errors;
          } else {
            var valid0 = true;
          }
          if (valid0) {
            if (data.fromAmount !== void 0) {
              let data1 = data.fromAmount;
              const _errs3 = errors;
              const _errs4 = errors;
              let valid1 = false;
              const _errs5 = errors;
              if (errors === _errs5) {
                if (typeof data1 === 'string') {
                  if (func2(data1) > 512) {
                    const err0 = {
                      instancePath: instancePath + '/fromAmount',
                      schemaPath: '#/properties/fromAmount/anyOf/0/maxLength',
                      keyword: 'maxLength',
                      params: { limit: 512 },
                      message: 'must NOT have more than 512 characters',
                    };
                    if (vErrors === null) {
                      vErrors = [err0];
                    } else {
                      vErrors.push(err0);
                    }
                    errors++;
                  } else {
                    if (!pattern5.test(data1)) {
                      const err1 = {
                        instancePath: instancePath + '/fromAmount',
                        schemaPath: '#/properties/fromAmount/anyOf/0/pattern',
                        keyword: 'pattern',
                        params: { pattern: '^(0|[1-9][0-9]*)(\\.[0-9]+)?$' },
                        message: 'must match pattern "^(0|[1-9][0-9]*)(\\.[0-9]+)?$"',
                      };
                      if (vErrors === null) {
                        vErrors = [err1];
                      } else {
                        vErrors.push(err1);
                      }
                      errors++;
                    }
                  }
                } else {
                  const err2 = {
                    instancePath: instancePath + '/fromAmount',
                    schemaPath: '#/properties/fromAmount/anyOf/0/type',
                    keyword: 'type',
                    params: { type: 'string' },
                    message: 'must be string',
                  };
                  if (vErrors === null) {
                    vErrors = [err2];
                  } else {
                    vErrors.push(err2);
                  }
                  errors++;
                }
              }
              var _valid0 = _errs5 === errors;
              valid1 = valid1 || _valid0;
              const _errs7 = errors;
              if (data1 !== null) {
                const err3 = {
                  instancePath: instancePath + '/fromAmount',
                  schemaPath: '#/properties/fromAmount/anyOf/1/type',
                  keyword: 'type',
                  params: { type: 'null' },
                  message: 'must be null',
                };
                if (vErrors === null) {
                  vErrors = [err3];
                } else {
                  vErrors.push(err3);
                }
                errors++;
              }
              var _valid0 = _errs7 === errors;
              valid1 = valid1 || _valid0;
              if (!valid1) {
                const err4 = {
                  instancePath: instancePath + '/fromAmount',
                  schemaPath: '#/properties/fromAmount/anyOf',
                  keyword: 'anyOf',
                  params: {},
                  message: 'must match a schema in anyOf',
                };
                if (vErrors === null) {
                  vErrors = [err4];
                } else {
                  vErrors.push(err4);
                }
                errors++;
                validate86.errors = vErrors;
                return false;
              } else {
                errors = _errs4;
                if (vErrors !== null) {
                  if (_errs4) {
                    vErrors.length = _errs4;
                  } else {
                    vErrors = null;
                  }
                }
              }
              var valid0 = _errs3 === errors;
            } else {
              var valid0 = true;
            }
            if (valid0) {
              if (data.toAmount !== void 0) {
                let data2 = data.toAmount;
                const _errs9 = errors;
                const _errs10 = errors;
                let valid2 = false;
                const _errs11 = errors;
                if (errors === _errs11) {
                  if (typeof data2 === 'string') {
                    if (func2(data2) > 512) {
                      const err5 = {
                        instancePath: instancePath + '/toAmount',
                        schemaPath: '#/properties/toAmount/anyOf/0/maxLength',
                        keyword: 'maxLength',
                        params: { limit: 512 },
                        message: 'must NOT have more than 512 characters',
                      };
                      if (vErrors === null) {
                        vErrors = [err5];
                      } else {
                        vErrors.push(err5);
                      }
                      errors++;
                    } else {
                      if (!pattern5.test(data2)) {
                        const err6 = {
                          instancePath: instancePath + '/toAmount',
                          schemaPath: '#/properties/toAmount/anyOf/0/pattern',
                          keyword: 'pattern',
                          params: { pattern: '^(0|[1-9][0-9]*)(\\.[0-9]+)?$' },
                          message: 'must match pattern "^(0|[1-9][0-9]*)(\\.[0-9]+)?$"',
                        };
                        if (vErrors === null) {
                          vErrors = [err6];
                        } else {
                          vErrors.push(err6);
                        }
                        errors++;
                      }
                    }
                  } else {
                    const err7 = {
                      instancePath: instancePath + '/toAmount',
                      schemaPath: '#/properties/toAmount/anyOf/0/type',
                      keyword: 'type',
                      params: { type: 'string' },
                      message: 'must be string',
                    };
                    if (vErrors === null) {
                      vErrors = [err7];
                    } else {
                      vErrors.push(err7);
                    }
                    errors++;
                  }
                }
                var _valid1 = _errs11 === errors;
                valid2 = valid2 || _valid1;
                const _errs13 = errors;
                if (data2 !== null) {
                  const err8 = {
                    instancePath: instancePath + '/toAmount',
                    schemaPath: '#/properties/toAmount/anyOf/1/type',
                    keyword: 'type',
                    params: { type: 'null' },
                    message: 'must be null',
                  };
                  if (vErrors === null) {
                    vErrors = [err8];
                  } else {
                    vErrors.push(err8);
                  }
                  errors++;
                }
                var _valid1 = _errs13 === errors;
                valid2 = valid2 || _valid1;
                if (!valid2) {
                  const err9 = {
                    instancePath: instancePath + '/toAmount',
                    schemaPath: '#/properties/toAmount/anyOf',
                    keyword: 'anyOf',
                    params: {},
                    message: 'must match a schema in anyOf',
                  };
                  if (vErrors === null) {
                    vErrors = [err9];
                  } else {
                    vErrors.push(err9);
                  }
                  errors++;
                  validate86.errors = vErrors;
                  return false;
                } else {
                  errors = _errs10;
                  if (vErrors !== null) {
                    if (_errs10) {
                      vErrors.length = _errs10;
                    } else {
                      vErrors = null;
                    }
                  }
                }
                var valid0 = _errs9 === errors;
              } else {
                var valid0 = true;
              }
              if (valid0) {
                if (data.quoteId !== void 0) {
                  let data3 = data.quoteId;
                  const _errs15 = errors;
                  if (typeof data3 !== 'string' && data3 !== null) {
                    validate86.errors = [
                      {
                        instancePath: instancePath + '/quoteId',
                        schemaPath: '#/properties/quoteId/type',
                        keyword: 'type',
                        params: { type: schema23.properties.quoteId.type },
                        message: 'must be string,null',
                      },
                    ];
                    return false;
                  }
                  var valid0 = _errs15 === errors;
                } else {
                  var valid0 = true;
                }
                if (valid0) {
                  if (data.rate !== void 0) {
                    let data4 = data.rate;
                    const _errs17 = errors;
                    const _errs18 = errors;
                    let valid3 = false;
                    const _errs19 = errors;
                    if (errors === _errs19) {
                      if (typeof data4 === 'string') {
                        if (func2(data4) > 512) {
                          const err10 = {
                            instancePath: instancePath + '/rate',
                            schemaPath: '#/properties/rate/anyOf/0/maxLength',
                            keyword: 'maxLength',
                            params: { limit: 512 },
                            message: 'must NOT have more than 512 characters',
                          };
                          if (vErrors === null) {
                            vErrors = [err10];
                          } else {
                            vErrors.push(err10);
                          }
                          errors++;
                        } else {
                          if (!pattern5.test(data4)) {
                            const err11 = {
                              instancePath: instancePath + '/rate',
                              schemaPath: '#/properties/rate/anyOf/0/pattern',
                              keyword: 'pattern',
                              params: { pattern: '^(0|[1-9][0-9]*)(\\.[0-9]+)?$' },
                              message: 'must match pattern "^(0|[1-9][0-9]*)(\\.[0-9]+)?$"',
                            };
                            if (vErrors === null) {
                              vErrors = [err11];
                            } else {
                              vErrors.push(err11);
                            }
                            errors++;
                          }
                        }
                      } else {
                        const err12 = {
                          instancePath: instancePath + '/rate',
                          schemaPath: '#/properties/rate/anyOf/0/type',
                          keyword: 'type',
                          params: { type: 'string' },
                          message: 'must be string',
                        };
                        if (vErrors === null) {
                          vErrors = [err12];
                        } else {
                          vErrors.push(err12);
                        }
                        errors++;
                      }
                    }
                    var _valid2 = _errs19 === errors;
                    valid3 = valid3 || _valid2;
                    const _errs21 = errors;
                    if (data4 !== null) {
                      const err13 = {
                        instancePath: instancePath + '/rate',
                        schemaPath: '#/properties/rate/anyOf/1/type',
                        keyword: 'type',
                        params: { type: 'null' },
                        message: 'must be null',
                      };
                      if (vErrors === null) {
                        vErrors = [err13];
                      } else {
                        vErrors.push(err13);
                      }
                      errors++;
                    }
                    var _valid2 = _errs21 === errors;
                    valid3 = valid3 || _valid2;
                    if (!valid3) {
                      const err14 = {
                        instancePath: instancePath + '/rate',
                        schemaPath: '#/properties/rate/anyOf',
                        keyword: 'anyOf',
                        params: {},
                        message: 'must match a schema in anyOf',
                      };
                      if (vErrors === null) {
                        vErrors = [err14];
                      } else {
                        vErrors.push(err14);
                      }
                      errors++;
                      validate86.errors = vErrors;
                      return false;
                    } else {
                      errors = _errs18;
                      if (vErrors !== null) {
                        if (_errs18) {
                          vErrors.length = _errs18;
                        } else {
                          vErrors = null;
                        }
                      }
                    }
                    var valid0 = _errs17 === errors;
                  } else {
                    var valid0 = true;
                  }
                  if (valid0) {
                    if (data.reason !== void 0) {
                      let data5 = data.reason;
                      const _errs23 = errors;
                      if (typeof data5 !== 'string' && data5 !== null) {
                        validate86.errors = [
                          {
                            instancePath: instancePath + '/reason',
                            schemaPath: '#/properties/reason/type',
                            keyword: 'type',
                            params: { type: schema23.properties.reason.type },
                            message: 'must be string,null',
                          },
                        ];
                        return false;
                      }
                      var valid0 = _errs23 === errors;
                    } else {
                      var valid0 = true;
                    }
                    if (valid0) {
                      if (data.feeStatus !== void 0) {
                        let data6 = data.feeStatus;
                        const _errs25 = errors;
                        if (
                          !(
                            data6 === 'unknown' ||
                            data6 === 'no_additional_fee' ||
                            data6 === 'unsupported'
                          )
                        ) {
                          validate86.errors = [
                            {
                              instancePath: instancePath + '/feeStatus',
                              schemaPath: '#/properties/feeStatus/enum',
                              keyword: 'enum',
                              params: { allowedValues: schema23.properties.feeStatus.enum },
                              message: 'must be equal to one of the allowed values',
                            },
                          ];
                          return false;
                        }
                        var valid0 = _errs25 === errors;
                      } else {
                        var valid0 = true;
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    } else {
      validate86.errors = [
        {
          instancePath,
          schemaPath: '#/type',
          keyword: 'type',
          params: { type: 'object' },
          message: 'must be object',
        },
      ];
      return false;
    }
  }
  validate86.errors = vErrors;
  return errors === 0;
}
validate86.evaluated = { props: true, dynamicProps: false, dynamicItems: false };
var validateSelectionContext = validate87;
var schema24 = {
  type: 'object',
  properties: {
    now: { type: 'string', format: 'date-time', maxLength: 512 },
    country: { type: 'string', maxLength: 512 },
    deliveryMethod: { enum: ['cash', 'account'] },
    channel: { enum: ['branch', 'online', 'atm', 'unknown'] },
    branchId: { type: 'string', maxLength: 512 },
    denomination: { type: 'string', pattern: '^(0|[1-9][0-9]*)(\\.[0-9]+)?$', maxLength: 512 },
    qualifications: { type: 'array', items: { type: 'string', maxLength: 512 } },
  },
  required: ['now', 'country', 'deliveryMethod', 'channel'],
  additionalProperties: false,
};
function validate87(
  data,
  { instancePath = '', parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {},
) {
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate87.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = void 0;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = void 0;
  }
  if (errors === 0) {
    if (data && typeof data == 'object' && !Array.isArray(data)) {
      let missing0;
      if (
        (data.now === void 0 && (missing0 = 'now')) ||
        (data.country === void 0 && (missing0 = 'country')) ||
        (data.deliveryMethod === void 0 && (missing0 = 'deliveryMethod')) ||
        (data.channel === void 0 && (missing0 = 'channel'))
      ) {
        validate87.errors = [
          {
            instancePath,
            schemaPath: '#/required',
            keyword: 'required',
            params: { missingProperty: missing0 },
            message: "must have required property '" + missing0 + "'",
          },
        ];
        return false;
      } else {
        const _errs1 = errors;
        for (const key0 in data) {
          if (
            !(
              key0 === 'now' ||
              key0 === 'country' ||
              key0 === 'deliveryMethod' ||
              key0 === 'channel' ||
              key0 === 'branchId' ||
              key0 === 'denomination' ||
              key0 === 'qualifications'
            )
          ) {
            validate87.errors = [
              {
                instancePath,
                schemaPath: '#/additionalProperties',
                keyword: 'additionalProperties',
                params: { additionalProperty: key0 },
                message: 'must NOT have additional properties',
              },
            ];
            return false;
            break;
          }
        }
        if (_errs1 === errors) {
          if (data.now !== void 0) {
            let data0 = data.now;
            const _errs2 = errors;
            if (errors === _errs2) {
              if (errors === _errs2) {
                if (typeof data0 === 'string') {
                  if (func2(data0) > 512) {
                    validate87.errors = [
                      {
                        instancePath: instancePath + '/now',
                        schemaPath: '#/properties/now/maxLength',
                        keyword: 'maxLength',
                        params: { limit: 512 },
                        message: 'must NOT have more than 512 characters',
                      },
                    ];
                    return false;
                  } else {
                    if (!formats0.validate(data0)) {
                      validate87.errors = [
                        {
                          instancePath: instancePath + '/now',
                          schemaPath: '#/properties/now/format',
                          keyword: 'format',
                          params: { format: 'date-time' },
                          message: 'must match format "date-time"',
                        },
                      ];
                      return false;
                    }
                  }
                } else {
                  validate87.errors = [
                    {
                      instancePath: instancePath + '/now',
                      schemaPath: '#/properties/now/type',
                      keyword: 'type',
                      params: { type: 'string' },
                      message: 'must be string',
                    },
                  ];
                  return false;
                }
              }
            }
            var valid0 = _errs2 === errors;
          } else {
            var valid0 = true;
          }
          if (valid0) {
            if (data.country !== void 0) {
              let data1 = data.country;
              const _errs4 = errors;
              if (errors === _errs4) {
                if (typeof data1 === 'string') {
                  if (func2(data1) > 512) {
                    validate87.errors = [
                      {
                        instancePath: instancePath + '/country',
                        schemaPath: '#/properties/country/maxLength',
                        keyword: 'maxLength',
                        params: { limit: 512 },
                        message: 'must NOT have more than 512 characters',
                      },
                    ];
                    return false;
                  }
                } else {
                  validate87.errors = [
                    {
                      instancePath: instancePath + '/country',
                      schemaPath: '#/properties/country/type',
                      keyword: 'type',
                      params: { type: 'string' },
                      message: 'must be string',
                    },
                  ];
                  return false;
                }
              }
              var valid0 = _errs4 === errors;
            } else {
              var valid0 = true;
            }
            if (valid0) {
              if (data.deliveryMethod !== void 0) {
                let data2 = data.deliveryMethod;
                const _errs6 = errors;
                if (!(data2 === 'cash' || data2 === 'account')) {
                  validate87.errors = [
                    {
                      instancePath: instancePath + '/deliveryMethod',
                      schemaPath: '#/properties/deliveryMethod/enum',
                      keyword: 'enum',
                      params: { allowedValues: schema24.properties.deliveryMethod.enum },
                      message: 'must be equal to one of the allowed values',
                    },
                  ];
                  return false;
                }
                var valid0 = _errs6 === errors;
              } else {
                var valid0 = true;
              }
              if (valid0) {
                if (data.channel !== void 0) {
                  let data3 = data.channel;
                  const _errs7 = errors;
                  if (
                    !(
                      data3 === 'branch' ||
                      data3 === 'online' ||
                      data3 === 'atm' ||
                      data3 === 'unknown'
                    )
                  ) {
                    validate87.errors = [
                      {
                        instancePath: instancePath + '/channel',
                        schemaPath: '#/properties/channel/enum',
                        keyword: 'enum',
                        params: { allowedValues: schema24.properties.channel.enum },
                        message: 'must be equal to one of the allowed values',
                      },
                    ];
                    return false;
                  }
                  var valid0 = _errs7 === errors;
                } else {
                  var valid0 = true;
                }
                if (valid0) {
                  if (data.branchId !== void 0) {
                    let data4 = data.branchId;
                    const _errs8 = errors;
                    if (errors === _errs8) {
                      if (typeof data4 === 'string') {
                        if (func2(data4) > 512) {
                          validate87.errors = [
                            {
                              instancePath: instancePath + '/branchId',
                              schemaPath: '#/properties/branchId/maxLength',
                              keyword: 'maxLength',
                              params: { limit: 512 },
                              message: 'must NOT have more than 512 characters',
                            },
                          ];
                          return false;
                        }
                      } else {
                        validate87.errors = [
                          {
                            instancePath: instancePath + '/branchId',
                            schemaPath: '#/properties/branchId/type',
                            keyword: 'type',
                            params: { type: 'string' },
                            message: 'must be string',
                          },
                        ];
                        return false;
                      }
                    }
                    var valid0 = _errs8 === errors;
                  } else {
                    var valid0 = true;
                  }
                  if (valid0) {
                    if (data.denomination !== void 0) {
                      let data5 = data.denomination;
                      const _errs10 = errors;
                      if (errors === _errs10) {
                        if (typeof data5 === 'string') {
                          if (func2(data5) > 512) {
                            validate87.errors = [
                              {
                                instancePath: instancePath + '/denomination',
                                schemaPath: '#/properties/denomination/maxLength',
                                keyword: 'maxLength',
                                params: { limit: 512 },
                                message: 'must NOT have more than 512 characters',
                              },
                            ];
                            return false;
                          } else {
                            if (!pattern5.test(data5)) {
                              validate87.errors = [
                                {
                                  instancePath: instancePath + '/denomination',
                                  schemaPath: '#/properties/denomination/pattern',
                                  keyword: 'pattern',
                                  params: { pattern: '^(0|[1-9][0-9]*)(\\.[0-9]+)?$' },
                                  message: 'must match pattern "^(0|[1-9][0-9]*)(\\.[0-9]+)?$"',
                                },
                              ];
                              return false;
                            }
                          }
                        } else {
                          validate87.errors = [
                            {
                              instancePath: instancePath + '/denomination',
                              schemaPath: '#/properties/denomination/type',
                              keyword: 'type',
                              params: { type: 'string' },
                              message: 'must be string',
                            },
                          ];
                          return false;
                        }
                      }
                      var valid0 = _errs10 === errors;
                    } else {
                      var valid0 = true;
                    }
                    if (valid0) {
                      if (data.qualifications !== void 0) {
                        let data6 = data.qualifications;
                        const _errs12 = errors;
                        if (errors === _errs12) {
                          if (Array.isArray(data6)) {
                            var valid1 = true;
                            const len0 = data6.length;
                            for (let i0 = 0; i0 < len0; i0++) {
                              let data7 = data6[i0];
                              const _errs14 = errors;
                              if (errors === _errs14) {
                                if (typeof data7 === 'string') {
                                  if (func2(data7) > 512) {
                                    validate87.errors = [
                                      {
                                        instancePath: instancePath + '/qualifications/' + i0,
                                        schemaPath: '#/properties/qualifications/items/maxLength',
                                        keyword: 'maxLength',
                                        params: { limit: 512 },
                                        message: 'must NOT have more than 512 characters',
                                      },
                                    ];
                                    return false;
                                  }
                                } else {
                                  validate87.errors = [
                                    {
                                      instancePath: instancePath + '/qualifications/' + i0,
                                      schemaPath: '#/properties/qualifications/items/type',
                                      keyword: 'type',
                                      params: { type: 'string' },
                                      message: 'must be string',
                                    },
                                  ];
                                  return false;
                                }
                              }
                              var valid1 = _errs14 === errors;
                              if (!valid1) {
                                break;
                              }
                            }
                          } else {
                            validate87.errors = [
                              {
                                instancePath: instancePath + '/qualifications',
                                schemaPath: '#/properties/qualifications/type',
                                keyword: 'type',
                                params: { type: 'array' },
                                message: 'must be array',
                              },
                            ];
                            return false;
                          }
                        }
                        var valid0 = _errs12 === errors;
                      } else {
                        var valid0 = true;
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    } else {
      validate87.errors = [
        {
          instancePath,
          schemaPath: '#/type',
          keyword: 'type',
          params: { type: 'object' },
          message: 'must be object',
        },
      ];
      return false;
    }
  }
  validate87.errors = vErrors;
  return errors === 0;
}
validate87.evaluated = { props: true, dynamicProps: false, dynamicItems: false };
var validateDerivedCrossQuote = validate88;
function validate88(
  data,
  { instancePath = '', parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {},
) {
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate88.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = void 0;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = void 0;
  }
  if (errors === 0) {
    if (data && typeof data == 'object' && !Array.isArray(data)) {
      let missing0;
      if (
        (data.kind === void 0 && (missing0 = 'kind')) ||
        (data.providerId === void 0 && (missing0 = 'providerId')) ||
        (data.fromCurrency === void 0 && (missing0 = 'fromCurrency')) ||
        (data.toCurrency === void 0 && (missing0 = 'toCurrency')) ||
        (data.rate === void 0 && (missing0 = 'rate')) ||
        (data.legs === void 0 && (missing0 = 'legs')) ||
        (data.recommendable === void 0 && (missing0 = 'recommendable'))
      ) {
        validate88.errors = [
          {
            instancePath,
            schemaPath: '#/required',
            keyword: 'required',
            params: { missingProperty: missing0 },
            message: "must have required property '" + missing0 + "'",
          },
        ];
        return false;
      } else {
        const _errs1 = errors;
        for (const key0 in data) {
          if (
            !(
              key0 === 'kind' ||
              key0 === 'providerId' ||
              key0 === 'fromCurrency' ||
              key0 === 'toCurrency' ||
              key0 === 'rate' ||
              key0 === 'legs' ||
              key0 === 'recommendable'
            )
          ) {
            validate88.errors = [
              {
                instancePath,
                schemaPath: '#/additionalProperties',
                keyword: 'additionalProperties',
                params: { additionalProperty: key0 },
                message: 'must NOT have additional properties',
              },
            ];
            return false;
            break;
          }
        }
        if (_errs1 === errors) {
          if (data.kind !== void 0) {
            const _errs2 = errors;
            if ('derived_cross' !== data.kind) {
              validate88.errors = [
                {
                  instancePath: instancePath + '/kind',
                  schemaPath: '#/properties/kind/const',
                  keyword: 'const',
                  params: { allowedValue: 'derived_cross' },
                  message: 'must be equal to constant',
                },
              ];
              return false;
            }
            var valid0 = _errs2 === errors;
          } else {
            var valid0 = true;
          }
          if (valid0) {
            if (data.providerId !== void 0) {
              const _errs3 = errors;
              if (typeof data.providerId !== 'string') {
                validate88.errors = [
                  {
                    instancePath: instancePath + '/providerId',
                    schemaPath: '#/properties/providerId/type',
                    keyword: 'type',
                    params: { type: 'string' },
                    message: 'must be string',
                  },
                ];
                return false;
              }
              var valid0 = _errs3 === errors;
            } else {
              var valid0 = true;
            }
            if (valid0) {
              if (data.fromCurrency !== void 0) {
                const _errs5 = errors;
                if (typeof data.fromCurrency !== 'string') {
                  validate88.errors = [
                    {
                      instancePath: instancePath + '/fromCurrency',
                      schemaPath: '#/properties/fromCurrency/type',
                      keyword: 'type',
                      params: { type: 'string' },
                      message: 'must be string',
                    },
                  ];
                  return false;
                }
                var valid0 = _errs5 === errors;
              } else {
                var valid0 = true;
              }
              if (valid0) {
                if (data.toCurrency !== void 0) {
                  const _errs7 = errors;
                  if (typeof data.toCurrency !== 'string') {
                    validate88.errors = [
                      {
                        instancePath: instancePath + '/toCurrency',
                        schemaPath: '#/properties/toCurrency/type',
                        keyword: 'type',
                        params: { type: 'string' },
                        message: 'must be string',
                      },
                    ];
                    return false;
                  }
                  var valid0 = _errs7 === errors;
                } else {
                  var valid0 = true;
                }
                if (valid0) {
                  if (data.rate !== void 0) {
                    const _errs9 = errors;
                    if (typeof data.rate !== 'string') {
                      validate88.errors = [
                        {
                          instancePath: instancePath + '/rate',
                          schemaPath: '#/properties/rate/type',
                          keyword: 'type',
                          params: { type: 'string' },
                          message: 'must be string',
                        },
                      ];
                      return false;
                    }
                    var valid0 = _errs9 === errors;
                  } else {
                    var valid0 = true;
                  }
                  if (valid0) {
                    if (data.legs !== void 0) {
                      let data5 = data.legs;
                      const _errs11 = errors;
                      if (errors === _errs11) {
                        if (Array.isArray(data5)) {
                          if (data5.length > 2) {
                            validate88.errors = [
                              {
                                instancePath: instancePath + '/legs',
                                schemaPath: '#/properties/legs/maxItems',
                                keyword: 'maxItems',
                                params: { limit: 2 },
                                message: 'must NOT have more than 2 items',
                              },
                            ];
                            return false;
                          } else {
                            if (data5.length < 2) {
                              validate88.errors = [
                                {
                                  instancePath: instancePath + '/legs',
                                  schemaPath: '#/properties/legs/minItems',
                                  keyword: 'minItems',
                                  params: { limit: 2 },
                                  message: 'must NOT have fewer than 2 items',
                                },
                              ];
                              return false;
                            } else {
                              var valid1 = true;
                              const len0 = data5.length;
                              for (let i0 = 0; i0 < len0; i0++) {
                                const _errs13 = errors;
                                if (typeof data5[i0] !== 'string') {
                                  validate88.errors = [
                                    {
                                      instancePath: instancePath + '/legs/' + i0,
                                      schemaPath: '#/properties/legs/items/type',
                                      keyword: 'type',
                                      params: { type: 'string' },
                                      message: 'must be string',
                                    },
                                  ];
                                  return false;
                                }
                                var valid1 = _errs13 === errors;
                                if (!valid1) {
                                  break;
                                }
                              }
                            }
                          }
                        } else {
                          validate88.errors = [
                            {
                              instancePath: instancePath + '/legs',
                              schemaPath: '#/properties/legs/type',
                              keyword: 'type',
                              params: { type: 'array' },
                              message: 'must be array',
                            },
                          ];
                          return false;
                        }
                      }
                      var valid0 = _errs11 === errors;
                    } else {
                      var valid0 = true;
                    }
                    if (valid0) {
                      if (data.recommendable !== void 0) {
                        const _errs15 = errors;
                        if (false !== data.recommendable) {
                          validate88.errors = [
                            {
                              instancePath: instancePath + '/recommendable',
                              schemaPath: '#/properties/recommendable/const',
                              keyword: 'const',
                              params: { allowedValue: false },
                              message: 'must be equal to constant',
                            },
                          ];
                          return false;
                        }
                        var valid0 = _errs15 === errors;
                      } else {
                        var valid0 = true;
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    } else {
      validate88.errors = [
        {
          instancePath,
          schemaPath: '#/type',
          keyword: 'type',
          params: { type: 'object' },
          message: 'must be object',
        },
      ];
      return false;
    }
  }
  validate88.errors = vErrors;
  return errors === 0;
}
validate88.evaluated = { props: true, dynamicProps: false, dynamicItems: false };
var validateObjectReference = validate89;
var pattern25 = new RegExp('^(?!/)(?!.*(?:^|/)\\.\\.?(?:/|$))[A-Za-z0-9_/-]+\\.json$', 'u');
var pattern26 = new RegExp('^[a-f0-9]{64}$', 'u');
function validate89(
  data,
  { instancePath = '', parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {},
) {
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate89.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = void 0;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = void 0;
  }
  if (errors === 0) {
    if (data && typeof data == 'object' && !Array.isArray(data)) {
      let missing0;
      if (
        (data.path === void 0 && (missing0 = 'path')) ||
        (data.sha256 === void 0 && (missing0 = 'sha256'))
      ) {
        validate89.errors = [
          {
            instancePath,
            schemaPath: '#/required',
            keyword: 'required',
            params: { missingProperty: missing0 },
            message: "must have required property '" + missing0 + "'",
          },
        ];
        return false;
      } else {
        const _errs1 = errors;
        for (const key0 in data) {
          if (!(key0 === 'path' || key0 === 'sha256')) {
            validate89.errors = [
              {
                instancePath,
                schemaPath: '#/additionalProperties',
                keyword: 'additionalProperties',
                params: { additionalProperty: key0 },
                message: 'must NOT have additional properties',
              },
            ];
            return false;
            break;
          }
        }
        if (_errs1 === errors) {
          if (data.path !== void 0) {
            let data0 = data.path;
            const _errs2 = errors;
            if (errors === _errs2) {
              if (typeof data0 === 'string') {
                if (func2(data0) > 512) {
                  validate89.errors = [
                    {
                      instancePath: instancePath + '/path',
                      schemaPath: '#/properties/path/maxLength',
                      keyword: 'maxLength',
                      params: { limit: 512 },
                      message: 'must NOT have more than 512 characters',
                    },
                  ];
                  return false;
                } else {
                  if (!pattern25.test(data0)) {
                    validate89.errors = [
                      {
                        instancePath: instancePath + '/path',
                        schemaPath: '#/properties/path/pattern',
                        keyword: 'pattern',
                        params: {
                          pattern: '^(?!/)(?!.*(?:^|/)\\.\\.?(?:/|$))[A-Za-z0-9_/-]+\\.json$',
                        },
                        message:
                          'must match pattern "^(?!/)(?!.*(?:^|/)\\.\\.?(?:/|$))[A-Za-z0-9_/-]+\\.json$"',
                      },
                    ];
                    return false;
                  }
                }
              } else {
                validate89.errors = [
                  {
                    instancePath: instancePath + '/path',
                    schemaPath: '#/properties/path/type',
                    keyword: 'type',
                    params: { type: 'string' },
                    message: 'must be string',
                  },
                ];
                return false;
              }
            }
            var valid0 = _errs2 === errors;
          } else {
            var valid0 = true;
          }
          if (valid0) {
            if (data.sha256 !== void 0) {
              let data1 = data.sha256;
              const _errs4 = errors;
              if (errors === _errs4) {
                if (typeof data1 === 'string') {
                  if (!pattern26.test(data1)) {
                    validate89.errors = [
                      {
                        instancePath: instancePath + '/sha256',
                        schemaPath: '#/properties/sha256/pattern',
                        keyword: 'pattern',
                        params: { pattern: '^[a-f0-9]{64}$' },
                        message: 'must match pattern "^[a-f0-9]{64}$"',
                      },
                    ];
                    return false;
                  }
                } else {
                  validate89.errors = [
                    {
                      instancePath: instancePath + '/sha256',
                      schemaPath: '#/properties/sha256/type',
                      keyword: 'type',
                      params: { type: 'string' },
                      message: 'must be string',
                    },
                  ];
                  return false;
                }
              }
              var valid0 = _errs4 === errors;
            } else {
              var valid0 = true;
            }
          }
        }
      }
    } else {
      validate89.errors = [
        {
          instancePath,
          schemaPath: '#/type',
          keyword: 'type',
          params: { type: 'object' },
          message: 'must be object',
        },
      ];
      return false;
    }
  }
  validate89.errors = vErrors;
  return errors === 0;
}
validate89.evaluated = { props: true, dynamicProps: false, dynamicItems: false };
var validateProvider = validate90;
var schema27 = {
  type: 'object',
  properties: {
    providerId: { type: 'string', minLength: 1, maxLength: 512 },
    kind: { enum: ['bank', 'exchange_shop'] },
    name: { type: 'string', minLength: 1, maxLength: 512 },
    sourceUrl: { type: 'string', format: 'uri' },
    serviceCountries: {
      type: 'array',
      items: { type: 'string', pattern: '^[A-Z]{2}$' },
      minItems: 1,
    },
    termsUrl: { type: ['string', 'null'] },
    redistributionStatus: { enum: ['verified', 'unknown', 'restricted'] },
    attribution: { type: 'string', minLength: 1, maxLength: 512 },
  },
  required: [
    'providerId',
    'kind',
    'name',
    'sourceUrl',
    'serviceCountries',
    'termsUrl',
    'redistributionStatus',
    'attribution',
  ],
  additionalProperties: false,
};
var formats8 = import_formats.fullFormats.uri;
function validate90(
  data,
  { instancePath = '', parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {},
) {
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate90.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = void 0;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = void 0;
  }
  if (errors === 0) {
    if (data && typeof data == 'object' && !Array.isArray(data)) {
      let missing0;
      if (
        (data.providerId === void 0 && (missing0 = 'providerId')) ||
        (data.kind === void 0 && (missing0 = 'kind')) ||
        (data.name === void 0 && (missing0 = 'name')) ||
        (data.sourceUrl === void 0 && (missing0 = 'sourceUrl')) ||
        (data.serviceCountries === void 0 && (missing0 = 'serviceCountries')) ||
        (data.termsUrl === void 0 && (missing0 = 'termsUrl')) ||
        (data.redistributionStatus === void 0 && (missing0 = 'redistributionStatus')) ||
        (data.attribution === void 0 && (missing0 = 'attribution'))
      ) {
        validate90.errors = [
          {
            instancePath,
            schemaPath: '#/required',
            keyword: 'required',
            params: { missingProperty: missing0 },
            message: "must have required property '" + missing0 + "'",
          },
        ];
        return false;
      } else {
        const _errs1 = errors;
        for (const key0 in data) {
          if (
            !(
              key0 === 'providerId' ||
              key0 === 'kind' ||
              key0 === 'name' ||
              key0 === 'sourceUrl' ||
              key0 === 'serviceCountries' ||
              key0 === 'termsUrl' ||
              key0 === 'redistributionStatus' ||
              key0 === 'attribution'
            )
          ) {
            validate90.errors = [
              {
                instancePath,
                schemaPath: '#/additionalProperties',
                keyword: 'additionalProperties',
                params: { additionalProperty: key0 },
                message: 'must NOT have additional properties',
              },
            ];
            return false;
            break;
          }
        }
        if (_errs1 === errors) {
          if (data.providerId !== void 0) {
            let data0 = data.providerId;
            const _errs2 = errors;
            if (errors === _errs2) {
              if (typeof data0 === 'string') {
                if (func2(data0) > 512) {
                  validate90.errors = [
                    {
                      instancePath: instancePath + '/providerId',
                      schemaPath: '#/properties/providerId/maxLength',
                      keyword: 'maxLength',
                      params: { limit: 512 },
                      message: 'must NOT have more than 512 characters',
                    },
                  ];
                  return false;
                } else {
                  if (func2(data0) < 1) {
                    validate90.errors = [
                      {
                        instancePath: instancePath + '/providerId',
                        schemaPath: '#/properties/providerId/minLength',
                        keyword: 'minLength',
                        params: { limit: 1 },
                        message: 'must NOT have fewer than 1 characters',
                      },
                    ];
                    return false;
                  }
                }
              } else {
                validate90.errors = [
                  {
                    instancePath: instancePath + '/providerId',
                    schemaPath: '#/properties/providerId/type',
                    keyword: 'type',
                    params: { type: 'string' },
                    message: 'must be string',
                  },
                ];
                return false;
              }
            }
            var valid0 = _errs2 === errors;
          } else {
            var valid0 = true;
          }
          if (valid0) {
            if (data.kind !== void 0) {
              let data1 = data.kind;
              const _errs4 = errors;
              if (!(data1 === 'bank' || data1 === 'exchange_shop')) {
                validate90.errors = [
                  {
                    instancePath: instancePath + '/kind',
                    schemaPath: '#/properties/kind/enum',
                    keyword: 'enum',
                    params: { allowedValues: schema27.properties.kind.enum },
                    message: 'must be equal to one of the allowed values',
                  },
                ];
                return false;
              }
              var valid0 = _errs4 === errors;
            } else {
              var valid0 = true;
            }
            if (valid0) {
              if (data.name !== void 0) {
                let data2 = data.name;
                const _errs5 = errors;
                if (errors === _errs5) {
                  if (typeof data2 === 'string') {
                    if (func2(data2) > 512) {
                      validate90.errors = [
                        {
                          instancePath: instancePath + '/name',
                          schemaPath: '#/properties/name/maxLength',
                          keyword: 'maxLength',
                          params: { limit: 512 },
                          message: 'must NOT have more than 512 characters',
                        },
                      ];
                      return false;
                    } else {
                      if (func2(data2) < 1) {
                        validate90.errors = [
                          {
                            instancePath: instancePath + '/name',
                            schemaPath: '#/properties/name/minLength',
                            keyword: 'minLength',
                            params: { limit: 1 },
                            message: 'must NOT have fewer than 1 characters',
                          },
                        ];
                        return false;
                      }
                    }
                  } else {
                    validate90.errors = [
                      {
                        instancePath: instancePath + '/name',
                        schemaPath: '#/properties/name/type',
                        keyword: 'type',
                        params: { type: 'string' },
                        message: 'must be string',
                      },
                    ];
                    return false;
                  }
                }
                var valid0 = _errs5 === errors;
              } else {
                var valid0 = true;
              }
              if (valid0) {
                if (data.sourceUrl !== void 0) {
                  let data3 = data.sourceUrl;
                  const _errs7 = errors;
                  if (errors === _errs7) {
                    if (errors === _errs7) {
                      if (typeof data3 === 'string') {
                        if (!formats8(data3)) {
                          validate90.errors = [
                            {
                              instancePath: instancePath + '/sourceUrl',
                              schemaPath: '#/properties/sourceUrl/format',
                              keyword: 'format',
                              params: { format: 'uri' },
                              message: 'must match format "uri"',
                            },
                          ];
                          return false;
                        }
                      } else {
                        validate90.errors = [
                          {
                            instancePath: instancePath + '/sourceUrl',
                            schemaPath: '#/properties/sourceUrl/type',
                            keyword: 'type',
                            params: { type: 'string' },
                            message: 'must be string',
                          },
                        ];
                        return false;
                      }
                    }
                  }
                  var valid0 = _errs7 === errors;
                } else {
                  var valid0 = true;
                }
                if (valid0) {
                  if (data.serviceCountries !== void 0) {
                    let data4 = data.serviceCountries;
                    const _errs9 = errors;
                    if (errors === _errs9) {
                      if (Array.isArray(data4)) {
                        if (data4.length < 1) {
                          validate90.errors = [
                            {
                              instancePath: instancePath + '/serviceCountries',
                              schemaPath: '#/properties/serviceCountries/minItems',
                              keyword: 'minItems',
                              params: { limit: 1 },
                              message: 'must NOT have fewer than 1 items',
                            },
                          ];
                          return false;
                        } else {
                          var valid1 = true;
                          const len0 = data4.length;
                          for (let i0 = 0; i0 < len0; i0++) {
                            let data5 = data4[i0];
                            const _errs11 = errors;
                            if (errors === _errs11) {
                              if (typeof data5 === 'string') {
                                if (!pattern8.test(data5)) {
                                  validate90.errors = [
                                    {
                                      instancePath: instancePath + '/serviceCountries/' + i0,
                                      schemaPath: '#/properties/serviceCountries/items/pattern',
                                      keyword: 'pattern',
                                      params: { pattern: '^[A-Z]{2}$' },
                                      message: 'must match pattern "^[A-Z]{2}$"',
                                    },
                                  ];
                                  return false;
                                }
                              } else {
                                validate90.errors = [
                                  {
                                    instancePath: instancePath + '/serviceCountries/' + i0,
                                    schemaPath: '#/properties/serviceCountries/items/type',
                                    keyword: 'type',
                                    params: { type: 'string' },
                                    message: 'must be string',
                                  },
                                ];
                                return false;
                              }
                            }
                            var valid1 = _errs11 === errors;
                            if (!valid1) {
                              break;
                            }
                          }
                        }
                      } else {
                        validate90.errors = [
                          {
                            instancePath: instancePath + '/serviceCountries',
                            schemaPath: '#/properties/serviceCountries/type',
                            keyword: 'type',
                            params: { type: 'array' },
                            message: 'must be array',
                          },
                        ];
                        return false;
                      }
                    }
                    var valid0 = _errs9 === errors;
                  } else {
                    var valid0 = true;
                  }
                  if (valid0) {
                    if (data.termsUrl !== void 0) {
                      let data6 = data.termsUrl;
                      const _errs13 = errors;
                      if (typeof data6 !== 'string' && data6 !== null) {
                        validate90.errors = [
                          {
                            instancePath: instancePath + '/termsUrl',
                            schemaPath: '#/properties/termsUrl/type',
                            keyword: 'type',
                            params: { type: schema27.properties.termsUrl.type },
                            message: 'must be string,null',
                          },
                        ];
                        return false;
                      }
                      var valid0 = _errs13 === errors;
                    } else {
                      var valid0 = true;
                    }
                    if (valid0) {
                      if (data.redistributionStatus !== void 0) {
                        let data7 = data.redistributionStatus;
                        const _errs15 = errors;
                        if (
                          !(data7 === 'verified' || data7 === 'unknown' || data7 === 'restricted')
                        ) {
                          validate90.errors = [
                            {
                              instancePath: instancePath + '/redistributionStatus',
                              schemaPath: '#/properties/redistributionStatus/enum',
                              keyword: 'enum',
                              params: {
                                allowedValues: schema27.properties.redistributionStatus.enum,
                              },
                              message: 'must be equal to one of the allowed values',
                            },
                          ];
                          return false;
                        }
                        var valid0 = _errs15 === errors;
                      } else {
                        var valid0 = true;
                      }
                      if (valid0) {
                        if (data.attribution !== void 0) {
                          let data8 = data.attribution;
                          const _errs16 = errors;
                          if (errors === _errs16) {
                            if (typeof data8 === 'string') {
                              if (func2(data8) > 512) {
                                validate90.errors = [
                                  {
                                    instancePath: instancePath + '/attribution',
                                    schemaPath: '#/properties/attribution/maxLength',
                                    keyword: 'maxLength',
                                    params: { limit: 512 },
                                    message: 'must NOT have more than 512 characters',
                                  },
                                ];
                                return false;
                              } else {
                                if (func2(data8) < 1) {
                                  validate90.errors = [
                                    {
                                      instancePath: instancePath + '/attribution',
                                      schemaPath: '#/properties/attribution/minLength',
                                      keyword: 'minLength',
                                      params: { limit: 1 },
                                      message: 'must NOT have fewer than 1 characters',
                                    },
                                  ];
                                  return false;
                                }
                              }
                            } else {
                              validate90.errors = [
                                {
                                  instancePath: instancePath + '/attribution',
                                  schemaPath: '#/properties/attribution/type',
                                  keyword: 'type',
                                  params: { type: 'string' },
                                  message: 'must be string',
                                },
                              ];
                              return false;
                            }
                          }
                          var valid0 = _errs16 === errors;
                        } else {
                          var valid0 = true;
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    } else {
      validate90.errors = [
        {
          instancePath,
          schemaPath: '#/type',
          keyword: 'type',
          params: { type: 'object' },
          message: 'must be object',
        },
      ];
      return false;
    }
  }
  validate90.errors = vErrors;
  return errors === 0;
}
validate90.evaluated = { props: true, dynamicProps: false, dynamicItems: false };
var validateProviderSnapshot = validate91;
function validate55(
  data,
  { instancePath = '', parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {},
) {
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate55.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = void 0;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = void 0;
  }
  if (errors === 0) {
    if (data && typeof data == 'object' && !Array.isArray(data)) {
      let missing0;
      if (
        (data.quoteId === void 0 && (missing0 = 'quoteId')) ||
        (data.quoteSeriesId === void 0 && (missing0 = 'quoteSeriesId')) ||
        (data.providerId === void 0 && (missing0 = 'providerId')) ||
        (data.fromCurrency === void 0 && (missing0 = 'fromCurrency')) ||
        (data.toCurrency === void 0 && (missing0 = 'toCurrency')) ||
        (data.providerSide === void 0 && (missing0 = 'providerSide')) ||
        (data.status === void 0 && (missing0 = 'status')) ||
        (data.rate === void 0 && (missing0 = 'rate')) ||
        (data.unavailableReason === void 0 && (missing0 = 'unavailableReason')) ||
        (data.sourceQuote === void 0 && (missing0 = 'sourceQuote')) ||
        (data.methodVersion === void 0 && (missing0 = 'methodVersion'))
      ) {
        validate55.errors = [
          {
            instancePath,
            schemaPath: '#/required',
            keyword: 'required',
            params: { missingProperty: missing0 },
            message: "must have required property '" + missing0 + "'",
          },
        ];
        return false;
      } else {
        const _errs1 = errors;
        for (const key0 in data) {
          if (!func1.call(schema21.properties, key0)) {
            validate55.errors = [
              {
                instancePath,
                schemaPath: '#/additionalProperties',
                keyword: 'additionalProperties',
                params: { additionalProperty: key0 },
                message: 'must NOT have additional properties',
              },
            ];
            return false;
            break;
          }
        }
        if (_errs1 === errors) {
          if (data.quoteId !== void 0) {
            let data0 = data.quoteId;
            const _errs2 = errors;
            if (errors === _errs2) {
              if (typeof data0 === 'string') {
                if (func2(data0) > 2e4) {
                  validate55.errors = [
                    {
                      instancePath: instancePath + '/quoteId',
                      schemaPath: '#/properties/quoteId/maxLength',
                      keyword: 'maxLength',
                      params: { limit: 2e4 },
                      message: 'must NOT have more than 20000 characters',
                    },
                  ];
                  return false;
                }
              } else {
                validate55.errors = [
                  {
                    instancePath: instancePath + '/quoteId',
                    schemaPath: '#/properties/quoteId/type',
                    keyword: 'type',
                    params: { type: 'string' },
                    message: 'must be string',
                  },
                ];
                return false;
              }
            }
            var valid0 = _errs2 === errors;
          } else {
            var valid0 = true;
          }
          if (valid0) {
            if (data.quoteSeriesId !== void 0) {
              let data1 = data.quoteSeriesId;
              const _errs4 = errors;
              if (errors === _errs4) {
                if (typeof data1 === 'string') {
                  if (func2(data1) > 2e4) {
                    validate55.errors = [
                      {
                        instancePath: instancePath + '/quoteSeriesId',
                        schemaPath: '#/properties/quoteSeriesId/maxLength',
                        keyword: 'maxLength',
                        params: { limit: 2e4 },
                        message: 'must NOT have more than 20000 characters',
                      },
                    ];
                    return false;
                  }
                } else {
                  validate55.errors = [
                    {
                      instancePath: instancePath + '/quoteSeriesId',
                      schemaPath: '#/properties/quoteSeriesId/type',
                      keyword: 'type',
                      params: { type: 'string' },
                      message: 'must be string',
                    },
                  ];
                  return false;
                }
              }
              var valid0 = _errs4 === errors;
            } else {
              var valid0 = true;
            }
            if (valid0) {
              if (data.providerId !== void 0) {
                let data2 = data.providerId;
                const _errs6 = errors;
                if (errors === _errs6) {
                  if (typeof data2 === 'string') {
                    if (func2(data2) > 512) {
                      validate55.errors = [
                        {
                          instancePath: instancePath + '/providerId',
                          schemaPath: '#/properties/providerId/maxLength',
                          keyword: 'maxLength',
                          params: { limit: 512 },
                          message: 'must NOT have more than 512 characters',
                        },
                      ];
                      return false;
                    }
                  } else {
                    validate55.errors = [
                      {
                        instancePath: instancePath + '/providerId',
                        schemaPath: '#/properties/providerId/type',
                        keyword: 'type',
                        params: { type: 'string' },
                        message: 'must be string',
                      },
                    ];
                    return false;
                  }
                }
                var valid0 = _errs6 === errors;
              } else {
                var valid0 = true;
              }
              if (valid0) {
                if (data.fromCurrency !== void 0) {
                  let data3 = data.fromCurrency;
                  const _errs8 = errors;
                  if (errors === _errs8) {
                    if (typeof data3 === 'string') {
                      if (func2(data3) > 512) {
                        validate55.errors = [
                          {
                            instancePath: instancePath + '/fromCurrency',
                            schemaPath: '#/properties/fromCurrency/maxLength',
                            keyword: 'maxLength',
                            params: { limit: 512 },
                            message: 'must NOT have more than 512 characters',
                          },
                        ];
                        return false;
                      } else {
                        if (!pattern3.test(data3)) {
                          validate55.errors = [
                            {
                              instancePath: instancePath + '/fromCurrency',
                              schemaPath: '#/properties/fromCurrency/pattern',
                              keyword: 'pattern',
                              params: { pattern: '^[A-Z]{3}$' },
                              message: 'must match pattern "^[A-Z]{3}$"',
                            },
                          ];
                          return false;
                        }
                      }
                    } else {
                      validate55.errors = [
                        {
                          instancePath: instancePath + '/fromCurrency',
                          schemaPath: '#/properties/fromCurrency/type',
                          keyword: 'type',
                          params: { type: 'string' },
                          message: 'must be string',
                        },
                      ];
                      return false;
                    }
                  }
                  var valid0 = _errs8 === errors;
                } else {
                  var valid0 = true;
                }
                if (valid0) {
                  if (data.toCurrency !== void 0) {
                    let data4 = data.toCurrency;
                    const _errs10 = errors;
                    if (errors === _errs10) {
                      if (typeof data4 === 'string') {
                        if (func2(data4) > 512) {
                          validate55.errors = [
                            {
                              instancePath: instancePath + '/toCurrency',
                              schemaPath: '#/properties/toCurrency/maxLength',
                              keyword: 'maxLength',
                              params: { limit: 512 },
                              message: 'must NOT have more than 512 characters',
                            },
                          ];
                          return false;
                        } else {
                          if (!pattern3.test(data4)) {
                            validate55.errors = [
                              {
                                instancePath: instancePath + '/toCurrency',
                                schemaPath: '#/properties/toCurrency/pattern',
                                keyword: 'pattern',
                                params: { pattern: '^[A-Z]{3}$' },
                                message: 'must match pattern "^[A-Z]{3}$"',
                              },
                            ];
                            return false;
                          }
                        }
                      } else {
                        validate55.errors = [
                          {
                            instancePath: instancePath + '/toCurrency',
                            schemaPath: '#/properties/toCurrency/type',
                            keyword: 'type',
                            params: { type: 'string' },
                            message: 'must be string',
                          },
                        ];
                        return false;
                      }
                    }
                    var valid0 = _errs10 === errors;
                  } else {
                    var valid0 = true;
                  }
                  if (valid0) {
                    if (data.providerSide !== void 0) {
                      let data5 = data.providerSide;
                      const _errs12 = errors;
                      if (!(data5 === 'buy' || data5 === 'sell')) {
                        validate55.errors = [
                          {
                            instancePath: instancePath + '/providerSide',
                            schemaPath: '#/properties/providerSide/enum',
                            keyword: 'enum',
                            params: { allowedValues: schema21.properties.providerSide.enum },
                            message: 'must be equal to one of the allowed values',
                          },
                        ];
                        return false;
                      }
                      var valid0 = _errs12 === errors;
                    } else {
                      var valid0 = true;
                    }
                    if (valid0) {
                      if (data.status !== void 0) {
                        let data6 = data.status;
                        const _errs13 = errors;
                        if (!(data6 === 'available' || data6 === 'unavailable')) {
                          validate55.errors = [
                            {
                              instancePath: instancePath + '/status',
                              schemaPath: '#/properties/status/enum',
                              keyword: 'enum',
                              params: { allowedValues: schema21.properties.status.enum },
                              message: 'must be equal to one of the allowed values',
                            },
                          ];
                          return false;
                        }
                        var valid0 = _errs13 === errors;
                      } else {
                        var valid0 = true;
                      }
                      if (valid0) {
                        if (data.rate !== void 0) {
                          let data7 = data.rate;
                          const _errs14 = errors;
                          const _errs15 = errors;
                          let valid1 = false;
                          const _errs16 = errors;
                          if (errors === _errs16) {
                            if (typeof data7 === 'string') {
                              if (func2(data7) > 512) {
                                const err0 = {
                                  instancePath: instancePath + '/rate',
                                  schemaPath: '#/properties/rate/anyOf/0/maxLength',
                                  keyword: 'maxLength',
                                  params: { limit: 512 },
                                  message: 'must NOT have more than 512 characters',
                                };
                                if (vErrors === null) {
                                  vErrors = [err0];
                                } else {
                                  vErrors.push(err0);
                                }
                                errors++;
                              } else {
                                if (!pattern5.test(data7)) {
                                  const err1 = {
                                    instancePath: instancePath + '/rate',
                                    schemaPath: '#/properties/rate/anyOf/0/pattern',
                                    keyword: 'pattern',
                                    params: { pattern: '^(0|[1-9][0-9]*)(\\.[0-9]+)?$' },
                                    message: 'must match pattern "^(0|[1-9][0-9]*)(\\.[0-9]+)?$"',
                                  };
                                  if (vErrors === null) {
                                    vErrors = [err1];
                                  } else {
                                    vErrors.push(err1);
                                  }
                                  errors++;
                                }
                              }
                            } else {
                              const err2 = {
                                instancePath: instancePath + '/rate',
                                schemaPath: '#/properties/rate/anyOf/0/type',
                                keyword: 'type',
                                params: { type: 'string' },
                                message: 'must be string',
                              };
                              if (vErrors === null) {
                                vErrors = [err2];
                              } else {
                                vErrors.push(err2);
                              }
                              errors++;
                            }
                          }
                          var _valid0 = _errs16 === errors;
                          valid1 = valid1 || _valid0;
                          const _errs18 = errors;
                          if (data7 !== null) {
                            const err3 = {
                              instancePath: instancePath + '/rate',
                              schemaPath: '#/properties/rate/anyOf/1/type',
                              keyword: 'type',
                              params: { type: 'null' },
                              message: 'must be null',
                            };
                            if (vErrors === null) {
                              vErrors = [err3];
                            } else {
                              vErrors.push(err3);
                            }
                            errors++;
                          }
                          var _valid0 = _errs18 === errors;
                          valid1 = valid1 || _valid0;
                          if (!valid1) {
                            const err4 = {
                              instancePath: instancePath + '/rate',
                              schemaPath: '#/properties/rate/anyOf',
                              keyword: 'anyOf',
                              params: {},
                              message: 'must match a schema in anyOf',
                            };
                            if (vErrors === null) {
                              vErrors = [err4];
                            } else {
                              vErrors.push(err4);
                            }
                            errors++;
                            validate55.errors = vErrors;
                            return false;
                          } else {
                            errors = _errs15;
                            if (vErrors !== null) {
                              if (_errs15) {
                                vErrors.length = _errs15;
                              } else {
                                vErrors = null;
                              }
                            }
                          }
                          var valid0 = _errs14 === errors;
                        } else {
                          var valid0 = true;
                        }
                        if (valid0) {
                          if (data.unavailableReason !== void 0) {
                            let data8 = data.unavailableReason;
                            const _errs20 = errors;
                            if (!(data8 === 'not_quoted' || data8 === null)) {
                              validate55.errors = [
                                {
                                  instancePath: instancePath + '/unavailableReason',
                                  schemaPath: '#/properties/unavailableReason/enum',
                                  keyword: 'enum',
                                  params: {
                                    allowedValues: schema21.properties.unavailableReason.enum,
                                  },
                                  message: 'must be equal to one of the allowed values',
                                },
                              ];
                              return false;
                            }
                            var valid0 = _errs20 === errors;
                          } else {
                            var valid0 = true;
                          }
                          if (valid0) {
                            if (data.sourceQuote !== void 0) {
                              const _errs21 = errors;
                              if (
                                !validate53(data.sourceQuote, {
                                  instancePath: instancePath + '/sourceQuote',
                                  parentData: data,
                                  parentDataProperty: 'sourceQuote',
                                  rootData,
                                  dynamicAnchors,
                                })
                              ) {
                                vErrors =
                                  vErrors === null
                                    ? validate53.errors
                                    : vErrors.concat(validate53.errors);
                                errors = vErrors.length;
                              }
                              var valid0 = _errs21 === errors;
                            } else {
                              var valid0 = true;
                            }
                            if (valid0) {
                              if (data.methodVersion !== void 0) {
                                const _errs22 = errors;
                                if ('1' !== data.methodVersion) {
                                  validate55.errors = [
                                    {
                                      instancePath: instancePath + '/methodVersion',
                                      schemaPath: '#/properties/methodVersion/const',
                                      keyword: 'const',
                                      params: { allowedValue: '1' },
                                      message: 'must be equal to constant',
                                    },
                                  ];
                                  return false;
                                }
                                var valid0 = _errs22 === errors;
                              } else {
                                var valid0 = true;
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    } else {
      validate55.errors = [
        {
          instancePath,
          schemaPath: '#/type',
          keyword: 'type',
          params: { type: 'object' },
          message: 'must be object',
        },
      ];
      return false;
    }
  }
  validate55.errors = vErrors;
  return errors === 0;
}
validate55.evaluated = { props: true, dynamicProps: false, dynamicItems: false };
function validate91(
  data,
  { instancePath = '', parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {},
) {
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate91.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = void 0;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = void 0;
  }
  if (errors === 0) {
    if (data && typeof data == 'object' && !Array.isArray(data)) {
      let missing0;
      if (
        (data.schemaVersion === void 0 && (missing0 = 'schemaVersion')) ||
        (data.providerId === void 0 && (missing0 = 'providerId')) ||
        (data.quotes === void 0 && (missing0 = 'quotes'))
      ) {
        validate91.errors = [
          {
            instancePath,
            schemaPath: '#/required',
            keyword: 'required',
            params: { missingProperty: missing0 },
            message: "must have required property '" + missing0 + "'",
          },
        ];
        return false;
      } else {
        const _errs1 = errors;
        for (const key0 in data) {
          if (!(key0 === 'schemaVersion' || key0 === 'providerId' || key0 === 'quotes')) {
            validate91.errors = [
              {
                instancePath,
                schemaPath: '#/additionalProperties',
                keyword: 'additionalProperties',
                params: { additionalProperty: key0 },
                message: 'must NOT have additional properties',
              },
            ];
            return false;
            break;
          }
        }
        if (_errs1 === errors) {
          if (data.schemaVersion !== void 0) {
            const _errs2 = errors;
            if ('3.0' !== data.schemaVersion) {
              validate91.errors = [
                {
                  instancePath: instancePath + '/schemaVersion',
                  schemaPath: '#/properties/schemaVersion/const',
                  keyword: 'const',
                  params: { allowedValue: '3.0' },
                  message: 'must be equal to constant',
                },
              ];
              return false;
            }
            var valid0 = _errs2 === errors;
          } else {
            var valid0 = true;
          }
          if (valid0) {
            if (data.providerId !== void 0) {
              let data1 = data.providerId;
              const _errs3 = errors;
              if (errors === _errs3) {
                if (typeof data1 === 'string') {
                  if (func2(data1) > 512) {
                    validate91.errors = [
                      {
                        instancePath: instancePath + '/providerId',
                        schemaPath: '#/properties/providerId/maxLength',
                        keyword: 'maxLength',
                        params: { limit: 512 },
                        message: 'must NOT have more than 512 characters',
                      },
                    ];
                    return false;
                  } else {
                    if (func2(data1) < 1) {
                      validate91.errors = [
                        {
                          instancePath: instancePath + '/providerId',
                          schemaPath: '#/properties/providerId/minLength',
                          keyword: 'minLength',
                          params: { limit: 1 },
                          message: 'must NOT have fewer than 1 characters',
                        },
                      ];
                      return false;
                    }
                  }
                } else {
                  validate91.errors = [
                    {
                      instancePath: instancePath + '/providerId',
                      schemaPath: '#/properties/providerId/type',
                      keyword: 'type',
                      params: { type: 'string' },
                      message: 'must be string',
                    },
                  ];
                  return false;
                }
              }
              var valid0 = _errs3 === errors;
            } else {
              var valid0 = true;
            }
            if (valid0) {
              if (data.quotes !== void 0) {
                let data2 = data.quotes;
                const _errs5 = errors;
                if (errors === _errs5) {
                  if (Array.isArray(data2)) {
                    if (data2.length > 1e4) {
                      validate91.errors = [
                        {
                          instancePath: instancePath + '/quotes',
                          schemaPath: '#/properties/quotes/maxItems',
                          keyword: 'maxItems',
                          params: { limit: 1e4 },
                          message: 'must NOT have more than 10000 items',
                        },
                      ];
                      return false;
                    } else {
                      if (data2.length < 1) {
                        validate91.errors = [
                          {
                            instancePath: instancePath + '/quotes',
                            schemaPath: '#/properties/quotes/minItems',
                            keyword: 'minItems',
                            params: { limit: 1 },
                            message: 'must NOT have fewer than 1 items',
                          },
                        ];
                        return false;
                      } else {
                        var valid1 = true;
                        const len0 = data2.length;
                        for (let i0 = 0; i0 < len0; i0++) {
                          const _errs7 = errors;
                          if (
                            !validate55(data2[i0], {
                              instancePath: instancePath + '/quotes/' + i0,
                              parentData: data2,
                              parentDataProperty: i0,
                              rootData,
                              dynamicAnchors,
                            })
                          ) {
                            vErrors =
                              vErrors === null
                                ? validate55.errors
                                : vErrors.concat(validate55.errors);
                            errors = vErrors.length;
                          }
                          var valid1 = _errs7 === errors;
                          if (!valid1) {
                            break;
                          }
                        }
                      }
                    }
                  } else {
                    validate91.errors = [
                      {
                        instancePath: instancePath + '/quotes',
                        schemaPath: '#/properties/quotes/type',
                        keyword: 'type',
                        params: { type: 'array' },
                        message: 'must be array',
                      },
                    ];
                    return false;
                  }
                }
                var valid0 = _errs5 === errors;
              } else {
                var valid0 = true;
              }
            }
          }
        }
      }
    } else {
      validate91.errors = [
        {
          instancePath,
          schemaPath: '#/type',
          keyword: 'type',
          params: { type: 'object' },
          message: 'must be object',
        },
      ];
      return false;
    }
  }
  validate91.errors = vErrors;
  return errors === 0;
}
validate91.evaluated = { props: true, dynamicProps: false, dynamicItems: false };
var validateReleaseManifest = validate93;
var schema29 = {
  type: 'object',
  properties: {
    schemaVersion: { const: '3.0' },
    generatedAt: { type: 'string', format: 'date-time' },
    providers: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          providerId: { type: 'string', minLength: 1, maxLength: 512 },
          snapshot: { $ref: '#/$defs/ObjectReference' },
          checkStatus: { enum: ['ok', 'failed', 'carried_forward'] },
          lastSuccessfulCheckAt: { type: 'string', format: 'date-time' },
        },
        required: ['providerId', 'snapshot', 'checkStatus', 'lastSuccessfulCheckAt'],
        additionalProperties: false,
      },
      maxItems: 1e3,
    },
    history: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          providerId: { type: 'string', minLength: 1, maxLength: 512 },
          date: { type: 'string', format: 'date' },
          snapshot: { $ref: '#/$defs/ObjectReference' },
        },
        required: ['providerId', 'date', 'snapshot'],
        additionalProperties: false,
      },
      maxItems: 1e5,
    },
    deprecation: {
      type: 'object',
      properties: {
        activatedAt: { anyOf: [{ type: 'string', format: 'date-time' }, { type: 'null' }] },
        sunsetAt: { anyOf: [{ type: 'string', format: 'date-time' }, { type: 'null' }] },
        replacement: { type: 'string', minLength: 1, maxLength: 512 },
      },
      required: ['activatedAt', 'sunsetAt', 'replacement'],
      additionalProperties: false,
    },
  },
  required: ['schemaVersion', 'generatedAt', 'providers', 'history', 'deprecation'],
  additionalProperties: false,
};
var formats14 = import_formats.fullFormats.date;
function validate66(
  data,
  { instancePath = '', parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {},
) {
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate66.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = void 0;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = void 0;
  }
  if (errors === 0) {
    if (data && typeof data == 'object' && !Array.isArray(data)) {
      let missing0;
      if (
        (data.path === void 0 && (missing0 = 'path')) ||
        (data.sha256 === void 0 && (missing0 = 'sha256'))
      ) {
        validate66.errors = [
          {
            instancePath,
            schemaPath: '#/required',
            keyword: 'required',
            params: { missingProperty: missing0 },
            message: "must have required property '" + missing0 + "'",
          },
        ];
        return false;
      } else {
        const _errs1 = errors;
        for (const key0 in data) {
          if (!(key0 === 'path' || key0 === 'sha256')) {
            validate66.errors = [
              {
                instancePath,
                schemaPath: '#/additionalProperties',
                keyword: 'additionalProperties',
                params: { additionalProperty: key0 },
                message: 'must NOT have additional properties',
              },
            ];
            return false;
            break;
          }
        }
        if (_errs1 === errors) {
          if (data.path !== void 0) {
            let data0 = data.path;
            const _errs2 = errors;
            if (errors === _errs2) {
              if (typeof data0 === 'string') {
                if (func2(data0) > 512) {
                  validate66.errors = [
                    {
                      instancePath: instancePath + '/path',
                      schemaPath: '#/properties/path/maxLength',
                      keyword: 'maxLength',
                      params: { limit: 512 },
                      message: 'must NOT have more than 512 characters',
                    },
                  ];
                  return false;
                } else {
                  if (!pattern25.test(data0)) {
                    validate66.errors = [
                      {
                        instancePath: instancePath + '/path',
                        schemaPath: '#/properties/path/pattern',
                        keyword: 'pattern',
                        params: {
                          pattern: '^(?!/)(?!.*(?:^|/)\\.\\.?(?:/|$))[A-Za-z0-9_/-]+\\.json$',
                        },
                        message:
                          'must match pattern "^(?!/)(?!.*(?:^|/)\\.\\.?(?:/|$))[A-Za-z0-9_/-]+\\.json$"',
                      },
                    ];
                    return false;
                  }
                }
              } else {
                validate66.errors = [
                  {
                    instancePath: instancePath + '/path',
                    schemaPath: '#/properties/path/type',
                    keyword: 'type',
                    params: { type: 'string' },
                    message: 'must be string',
                  },
                ];
                return false;
              }
            }
            var valid0 = _errs2 === errors;
          } else {
            var valid0 = true;
          }
          if (valid0) {
            if (data.sha256 !== void 0) {
              let data1 = data.sha256;
              const _errs4 = errors;
              if (errors === _errs4) {
                if (typeof data1 === 'string') {
                  if (!pattern26.test(data1)) {
                    validate66.errors = [
                      {
                        instancePath: instancePath + '/sha256',
                        schemaPath: '#/properties/sha256/pattern',
                        keyword: 'pattern',
                        params: { pattern: '^[a-f0-9]{64}$' },
                        message: 'must match pattern "^[a-f0-9]{64}$"',
                      },
                    ];
                    return false;
                  }
                } else {
                  validate66.errors = [
                    {
                      instancePath: instancePath + '/sha256',
                      schemaPath: '#/properties/sha256/type',
                      keyword: 'type',
                      params: { type: 'string' },
                      message: 'must be string',
                    },
                  ];
                  return false;
                }
              }
              var valid0 = _errs4 === errors;
            } else {
              var valid0 = true;
            }
          }
        }
      }
    } else {
      validate66.errors = [
        {
          instancePath,
          schemaPath: '#/type',
          keyword: 'type',
          params: { type: 'object' },
          message: 'must be object',
        },
      ];
      return false;
    }
  }
  validate66.errors = vErrors;
  return errors === 0;
}
validate66.evaluated = { props: true, dynamicProps: false, dynamicItems: false };
function validate93(
  data,
  { instancePath = '', parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {},
) {
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate93.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = void 0;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = void 0;
  }
  if (errors === 0) {
    if (data && typeof data == 'object' && !Array.isArray(data)) {
      let missing0;
      if (
        (data.schemaVersion === void 0 && (missing0 = 'schemaVersion')) ||
        (data.generatedAt === void 0 && (missing0 = 'generatedAt')) ||
        (data.providers === void 0 && (missing0 = 'providers')) ||
        (data.history === void 0 && (missing0 = 'history')) ||
        (data.deprecation === void 0 && (missing0 = 'deprecation'))
      ) {
        validate93.errors = [
          {
            instancePath,
            schemaPath: '#/required',
            keyword: 'required',
            params: { missingProperty: missing0 },
            message: "must have required property '" + missing0 + "'",
          },
        ];
        return false;
      } else {
        const _errs1 = errors;
        for (const key0 in data) {
          if (
            !(
              key0 === 'schemaVersion' ||
              key0 === 'generatedAt' ||
              key0 === 'providers' ||
              key0 === 'history' ||
              key0 === 'deprecation'
            )
          ) {
            validate93.errors = [
              {
                instancePath,
                schemaPath: '#/additionalProperties',
                keyword: 'additionalProperties',
                params: { additionalProperty: key0 },
                message: 'must NOT have additional properties',
              },
            ];
            return false;
            break;
          }
        }
        if (_errs1 === errors) {
          if (data.schemaVersion !== void 0) {
            const _errs2 = errors;
            if ('3.0' !== data.schemaVersion) {
              validate93.errors = [
                {
                  instancePath: instancePath + '/schemaVersion',
                  schemaPath: '#/properties/schemaVersion/const',
                  keyword: 'const',
                  params: { allowedValue: '3.0' },
                  message: 'must be equal to constant',
                },
              ];
              return false;
            }
            var valid0 = _errs2 === errors;
          } else {
            var valid0 = true;
          }
          if (valid0) {
            if (data.generatedAt !== void 0) {
              let data1 = data.generatedAt;
              const _errs3 = errors;
              if (errors === _errs3) {
                if (errors === _errs3) {
                  if (typeof data1 === 'string') {
                    if (!formats0.validate(data1)) {
                      validate93.errors = [
                        {
                          instancePath: instancePath + '/generatedAt',
                          schemaPath: '#/properties/generatedAt/format',
                          keyword: 'format',
                          params: { format: 'date-time' },
                          message: 'must match format "date-time"',
                        },
                      ];
                      return false;
                    }
                  } else {
                    validate93.errors = [
                      {
                        instancePath: instancePath + '/generatedAt',
                        schemaPath: '#/properties/generatedAt/type',
                        keyword: 'type',
                        params: { type: 'string' },
                        message: 'must be string',
                      },
                    ];
                    return false;
                  }
                }
              }
              var valid0 = _errs3 === errors;
            } else {
              var valid0 = true;
            }
            if (valid0) {
              if (data.providers !== void 0) {
                let data2 = data.providers;
                const _errs5 = errors;
                if (errors === _errs5) {
                  if (Array.isArray(data2)) {
                    if (data2.length > 1e3) {
                      validate93.errors = [
                        {
                          instancePath: instancePath + '/providers',
                          schemaPath: '#/properties/providers/maxItems',
                          keyword: 'maxItems',
                          params: { limit: 1e3 },
                          message: 'must NOT have more than 1000 items',
                        },
                      ];
                      return false;
                    } else {
                      var valid1 = true;
                      const len0 = data2.length;
                      for (let i0 = 0; i0 < len0; i0++) {
                        let data3 = data2[i0];
                        const _errs7 = errors;
                        if (errors === _errs7) {
                          if (data3 && typeof data3 == 'object' && !Array.isArray(data3)) {
                            let missing1;
                            if (
                              (data3.providerId === void 0 && (missing1 = 'providerId')) ||
                              (data3.snapshot === void 0 && (missing1 = 'snapshot')) ||
                              (data3.checkStatus === void 0 && (missing1 = 'checkStatus')) ||
                              (data3.lastSuccessfulCheckAt === void 0 &&
                                (missing1 = 'lastSuccessfulCheckAt'))
                            ) {
                              validate93.errors = [
                                {
                                  instancePath: instancePath + '/providers/' + i0,
                                  schemaPath: '#/properties/providers/items/required',
                                  keyword: 'required',
                                  params: { missingProperty: missing1 },
                                  message: "must have required property '" + missing1 + "'",
                                },
                              ];
                              return false;
                            } else {
                              const _errs9 = errors;
                              for (const key1 in data3) {
                                if (
                                  !(
                                    key1 === 'providerId' ||
                                    key1 === 'snapshot' ||
                                    key1 === 'checkStatus' ||
                                    key1 === 'lastSuccessfulCheckAt'
                                  )
                                ) {
                                  validate93.errors = [
                                    {
                                      instancePath: instancePath + '/providers/' + i0,
                                      schemaPath:
                                        '#/properties/providers/items/additionalProperties',
                                      keyword: 'additionalProperties',
                                      params: { additionalProperty: key1 },
                                      message: 'must NOT have additional properties',
                                    },
                                  ];
                                  return false;
                                  break;
                                }
                              }
                              if (_errs9 === errors) {
                                if (data3.providerId !== void 0) {
                                  let data4 = data3.providerId;
                                  const _errs10 = errors;
                                  if (errors === _errs10) {
                                    if (typeof data4 === 'string') {
                                      if (func2(data4) > 512) {
                                        validate93.errors = [
                                          {
                                            instancePath:
                                              instancePath + '/providers/' + i0 + '/providerId',
                                            schemaPath:
                                              '#/properties/providers/items/properties/providerId/maxLength',
                                            keyword: 'maxLength',
                                            params: { limit: 512 },
                                            message: 'must NOT have more than 512 characters',
                                          },
                                        ];
                                        return false;
                                      } else {
                                        if (func2(data4) < 1) {
                                          validate93.errors = [
                                            {
                                              instancePath:
                                                instancePath + '/providers/' + i0 + '/providerId',
                                              schemaPath:
                                                '#/properties/providers/items/properties/providerId/minLength',
                                              keyword: 'minLength',
                                              params: { limit: 1 },
                                              message: 'must NOT have fewer than 1 characters',
                                            },
                                          ];
                                          return false;
                                        }
                                      }
                                    } else {
                                      validate93.errors = [
                                        {
                                          instancePath:
                                            instancePath + '/providers/' + i0 + '/providerId',
                                          schemaPath:
                                            '#/properties/providers/items/properties/providerId/type',
                                          keyword: 'type',
                                          params: { type: 'string' },
                                          message: 'must be string',
                                        },
                                      ];
                                      return false;
                                    }
                                  }
                                  var valid2 = _errs10 === errors;
                                } else {
                                  var valid2 = true;
                                }
                                if (valid2) {
                                  if (data3.snapshot !== void 0) {
                                    const _errs12 = errors;
                                    if (
                                      !validate66(data3.snapshot, {
                                        instancePath:
                                          instancePath + '/providers/' + i0 + '/snapshot',
                                        parentData: data3,
                                        parentDataProperty: 'snapshot',
                                        rootData,
                                        dynamicAnchors,
                                      })
                                    ) {
                                      vErrors =
                                        vErrors === null
                                          ? validate66.errors
                                          : vErrors.concat(validate66.errors);
                                      errors = vErrors.length;
                                    }
                                    var valid2 = _errs12 === errors;
                                  } else {
                                    var valid2 = true;
                                  }
                                  if (valid2) {
                                    if (data3.checkStatus !== void 0) {
                                      let data6 = data3.checkStatus;
                                      const _errs13 = errors;
                                      if (
                                        !(
                                          data6 === 'ok' ||
                                          data6 === 'failed' ||
                                          data6 === 'carried_forward'
                                        )
                                      ) {
                                        validate93.errors = [
                                          {
                                            instancePath:
                                              instancePath + '/providers/' + i0 + '/checkStatus',
                                            schemaPath:
                                              '#/properties/providers/items/properties/checkStatus/enum',
                                            keyword: 'enum',
                                            params: {
                                              allowedValues:
                                                schema29.properties.providers.items.properties
                                                  .checkStatus.enum,
                                            },
                                            message: 'must be equal to one of the allowed values',
                                          },
                                        ];
                                        return false;
                                      }
                                      var valid2 = _errs13 === errors;
                                    } else {
                                      var valid2 = true;
                                    }
                                    if (valid2) {
                                      if (data3.lastSuccessfulCheckAt !== void 0) {
                                        let data7 = data3.lastSuccessfulCheckAt;
                                        const _errs14 = errors;
                                        if (errors === _errs14) {
                                          if (errors === _errs14) {
                                            if (typeof data7 === 'string') {
                                              if (!formats0.validate(data7)) {
                                                validate93.errors = [
                                                  {
                                                    instancePath:
                                                      instancePath +
                                                      '/providers/' +
                                                      i0 +
                                                      '/lastSuccessfulCheckAt',
                                                    schemaPath:
                                                      '#/properties/providers/items/properties/lastSuccessfulCheckAt/format',
                                                    keyword: 'format',
                                                    params: { format: 'date-time' },
                                                    message: 'must match format "date-time"',
                                                  },
                                                ];
                                                return false;
                                              }
                                            } else {
                                              validate93.errors = [
                                                {
                                                  instancePath:
                                                    instancePath +
                                                    '/providers/' +
                                                    i0 +
                                                    '/lastSuccessfulCheckAt',
                                                  schemaPath:
                                                    '#/properties/providers/items/properties/lastSuccessfulCheckAt/type',
                                                  keyword: 'type',
                                                  params: { type: 'string' },
                                                  message: 'must be string',
                                                },
                                              ];
                                              return false;
                                            }
                                          }
                                        }
                                        var valid2 = _errs14 === errors;
                                      } else {
                                        var valid2 = true;
                                      }
                                    }
                                  }
                                }
                              }
                            }
                          } else {
                            validate93.errors = [
                              {
                                instancePath: instancePath + '/providers/' + i0,
                                schemaPath: '#/properties/providers/items/type',
                                keyword: 'type',
                                params: { type: 'object' },
                                message: 'must be object',
                              },
                            ];
                            return false;
                          }
                        }
                        var valid1 = _errs7 === errors;
                        if (!valid1) {
                          break;
                        }
                      }
                    }
                  } else {
                    validate93.errors = [
                      {
                        instancePath: instancePath + '/providers',
                        schemaPath: '#/properties/providers/type',
                        keyword: 'type',
                        params: { type: 'array' },
                        message: 'must be array',
                      },
                    ];
                    return false;
                  }
                }
                var valid0 = _errs5 === errors;
              } else {
                var valid0 = true;
              }
              if (valid0) {
                if (data.history !== void 0) {
                  let data8 = data.history;
                  const _errs16 = errors;
                  if (errors === _errs16) {
                    if (Array.isArray(data8)) {
                      if (data8.length > 1e5) {
                        validate93.errors = [
                          {
                            instancePath: instancePath + '/history',
                            schemaPath: '#/properties/history/maxItems',
                            keyword: 'maxItems',
                            params: { limit: 1e5 },
                            message: 'must NOT have more than 100000 items',
                          },
                        ];
                        return false;
                      } else {
                        var valid3 = true;
                        const len1 = data8.length;
                        for (let i1 = 0; i1 < len1; i1++) {
                          let data9 = data8[i1];
                          const _errs18 = errors;
                          if (errors === _errs18) {
                            if (data9 && typeof data9 == 'object' && !Array.isArray(data9)) {
                              let missing2;
                              if (
                                (data9.providerId === void 0 && (missing2 = 'providerId')) ||
                                (data9.date === void 0 && (missing2 = 'date')) ||
                                (data9.snapshot === void 0 && (missing2 = 'snapshot'))
                              ) {
                                validate93.errors = [
                                  {
                                    instancePath: instancePath + '/history/' + i1,
                                    schemaPath: '#/properties/history/items/required',
                                    keyword: 'required',
                                    params: { missingProperty: missing2 },
                                    message: "must have required property '" + missing2 + "'",
                                  },
                                ];
                                return false;
                              } else {
                                const _errs20 = errors;
                                for (const key2 in data9) {
                                  if (
                                    !(
                                      key2 === 'providerId' ||
                                      key2 === 'date' ||
                                      key2 === 'snapshot'
                                    )
                                  ) {
                                    validate93.errors = [
                                      {
                                        instancePath: instancePath + '/history/' + i1,
                                        schemaPath:
                                          '#/properties/history/items/additionalProperties',
                                        keyword: 'additionalProperties',
                                        params: { additionalProperty: key2 },
                                        message: 'must NOT have additional properties',
                                      },
                                    ];
                                    return false;
                                    break;
                                  }
                                }
                                if (_errs20 === errors) {
                                  if (data9.providerId !== void 0) {
                                    let data10 = data9.providerId;
                                    const _errs21 = errors;
                                    if (errors === _errs21) {
                                      if (typeof data10 === 'string') {
                                        if (func2(data10) > 512) {
                                          validate93.errors = [
                                            {
                                              instancePath:
                                                instancePath + '/history/' + i1 + '/providerId',
                                              schemaPath:
                                                '#/properties/history/items/properties/providerId/maxLength',
                                              keyword: 'maxLength',
                                              params: { limit: 512 },
                                              message: 'must NOT have more than 512 characters',
                                            },
                                          ];
                                          return false;
                                        } else {
                                          if (func2(data10) < 1) {
                                            validate93.errors = [
                                              {
                                                instancePath:
                                                  instancePath + '/history/' + i1 + '/providerId',
                                                schemaPath:
                                                  '#/properties/history/items/properties/providerId/minLength',
                                                keyword: 'minLength',
                                                params: { limit: 1 },
                                                message: 'must NOT have fewer than 1 characters',
                                              },
                                            ];
                                            return false;
                                          }
                                        }
                                      } else {
                                        validate93.errors = [
                                          {
                                            instancePath:
                                              instancePath + '/history/' + i1 + '/providerId',
                                            schemaPath:
                                              '#/properties/history/items/properties/providerId/type',
                                            keyword: 'type',
                                            params: { type: 'string' },
                                            message: 'must be string',
                                          },
                                        ];
                                        return false;
                                      }
                                    }
                                    var valid4 = _errs21 === errors;
                                  } else {
                                    var valid4 = true;
                                  }
                                  if (valid4) {
                                    if (data9.date !== void 0) {
                                      let data11 = data9.date;
                                      const _errs23 = errors;
                                      if (errors === _errs23) {
                                        if (errors === _errs23) {
                                          if (typeof data11 === 'string') {
                                            if (!formats14.validate(data11)) {
                                              validate93.errors = [
                                                {
                                                  instancePath:
                                                    instancePath + '/history/' + i1 + '/date',
                                                  schemaPath:
                                                    '#/properties/history/items/properties/date/format',
                                                  keyword: 'format',
                                                  params: { format: 'date' },
                                                  message: 'must match format "date"',
                                                },
                                              ];
                                              return false;
                                            }
                                          } else {
                                            validate93.errors = [
                                              {
                                                instancePath:
                                                  instancePath + '/history/' + i1 + '/date',
                                                schemaPath:
                                                  '#/properties/history/items/properties/date/type',
                                                keyword: 'type',
                                                params: { type: 'string' },
                                                message: 'must be string',
                                              },
                                            ];
                                            return false;
                                          }
                                        }
                                      }
                                      var valid4 = _errs23 === errors;
                                    } else {
                                      var valid4 = true;
                                    }
                                    if (valid4) {
                                      if (data9.snapshot !== void 0) {
                                        const _errs25 = errors;
                                        if (
                                          !validate66(data9.snapshot, {
                                            instancePath:
                                              instancePath + '/history/' + i1 + '/snapshot',
                                            parentData: data9,
                                            parentDataProperty: 'snapshot',
                                            rootData,
                                            dynamicAnchors,
                                          })
                                        ) {
                                          vErrors =
                                            vErrors === null
                                              ? validate66.errors
                                              : vErrors.concat(validate66.errors);
                                          errors = vErrors.length;
                                        }
                                        var valid4 = _errs25 === errors;
                                      } else {
                                        var valid4 = true;
                                      }
                                    }
                                  }
                                }
                              }
                            } else {
                              validate93.errors = [
                                {
                                  instancePath: instancePath + '/history/' + i1,
                                  schemaPath: '#/properties/history/items/type',
                                  keyword: 'type',
                                  params: { type: 'object' },
                                  message: 'must be object',
                                },
                              ];
                              return false;
                            }
                          }
                          var valid3 = _errs18 === errors;
                          if (!valid3) {
                            break;
                          }
                        }
                      }
                    } else {
                      validate93.errors = [
                        {
                          instancePath: instancePath + '/history',
                          schemaPath: '#/properties/history/type',
                          keyword: 'type',
                          params: { type: 'array' },
                          message: 'must be array',
                        },
                      ];
                      return false;
                    }
                  }
                  var valid0 = _errs16 === errors;
                } else {
                  var valid0 = true;
                }
                if (valid0) {
                  if (data.deprecation !== void 0) {
                    let data13 = data.deprecation;
                    const _errs26 = errors;
                    if (errors === _errs26) {
                      if (data13 && typeof data13 == 'object' && !Array.isArray(data13)) {
                        let missing3;
                        if (
                          (data13.activatedAt === void 0 && (missing3 = 'activatedAt')) ||
                          (data13.sunsetAt === void 0 && (missing3 = 'sunsetAt')) ||
                          (data13.replacement === void 0 && (missing3 = 'replacement'))
                        ) {
                          validate93.errors = [
                            {
                              instancePath: instancePath + '/deprecation',
                              schemaPath: '#/properties/deprecation/required',
                              keyword: 'required',
                              params: { missingProperty: missing3 },
                              message: "must have required property '" + missing3 + "'",
                            },
                          ];
                          return false;
                        } else {
                          const _errs28 = errors;
                          for (const key3 in data13) {
                            if (
                              !(
                                key3 === 'activatedAt' ||
                                key3 === 'sunsetAt' ||
                                key3 === 'replacement'
                              )
                            ) {
                              validate93.errors = [
                                {
                                  instancePath: instancePath + '/deprecation',
                                  schemaPath: '#/properties/deprecation/additionalProperties',
                                  keyword: 'additionalProperties',
                                  params: { additionalProperty: key3 },
                                  message: 'must NOT have additional properties',
                                },
                              ];
                              return false;
                              break;
                            }
                          }
                          if (_errs28 === errors) {
                            if (data13.activatedAt !== void 0) {
                              let data14 = data13.activatedAt;
                              const _errs29 = errors;
                              const _errs30 = errors;
                              let valid6 = false;
                              const _errs31 = errors;
                              if (errors === _errs31) {
                                if (errors === _errs31) {
                                  if (typeof data14 === 'string') {
                                    if (!formats0.validate(data14)) {
                                      const err0 = {
                                        instancePath: instancePath + '/deprecation/activatedAt',
                                        schemaPath:
                                          '#/properties/deprecation/properties/activatedAt/anyOf/0/format',
                                        keyword: 'format',
                                        params: { format: 'date-time' },
                                        message: 'must match format "date-time"',
                                      };
                                      if (vErrors === null) {
                                        vErrors = [err0];
                                      } else {
                                        vErrors.push(err0);
                                      }
                                      errors++;
                                    }
                                  } else {
                                    const err1 = {
                                      instancePath: instancePath + '/deprecation/activatedAt',
                                      schemaPath:
                                        '#/properties/deprecation/properties/activatedAt/anyOf/0/type',
                                      keyword: 'type',
                                      params: { type: 'string' },
                                      message: 'must be string',
                                    };
                                    if (vErrors === null) {
                                      vErrors = [err1];
                                    } else {
                                      vErrors.push(err1);
                                    }
                                    errors++;
                                  }
                                }
                              }
                              var _valid0 = _errs31 === errors;
                              valid6 = valid6 || _valid0;
                              const _errs33 = errors;
                              if (data14 !== null) {
                                const err2 = {
                                  instancePath: instancePath + '/deprecation/activatedAt',
                                  schemaPath:
                                    '#/properties/deprecation/properties/activatedAt/anyOf/1/type',
                                  keyword: 'type',
                                  params: { type: 'null' },
                                  message: 'must be null',
                                };
                                if (vErrors === null) {
                                  vErrors = [err2];
                                } else {
                                  vErrors.push(err2);
                                }
                                errors++;
                              }
                              var _valid0 = _errs33 === errors;
                              valid6 = valid6 || _valid0;
                              if (!valid6) {
                                const err3 = {
                                  instancePath: instancePath + '/deprecation/activatedAt',
                                  schemaPath:
                                    '#/properties/deprecation/properties/activatedAt/anyOf',
                                  keyword: 'anyOf',
                                  params: {},
                                  message: 'must match a schema in anyOf',
                                };
                                if (vErrors === null) {
                                  vErrors = [err3];
                                } else {
                                  vErrors.push(err3);
                                }
                                errors++;
                                validate93.errors = vErrors;
                                return false;
                              } else {
                                errors = _errs30;
                                if (vErrors !== null) {
                                  if (_errs30) {
                                    vErrors.length = _errs30;
                                  } else {
                                    vErrors = null;
                                  }
                                }
                              }
                              var valid5 = _errs29 === errors;
                            } else {
                              var valid5 = true;
                            }
                            if (valid5) {
                              if (data13.sunsetAt !== void 0) {
                                let data15 = data13.sunsetAt;
                                const _errs35 = errors;
                                const _errs36 = errors;
                                let valid7 = false;
                                const _errs37 = errors;
                                if (errors === _errs37) {
                                  if (errors === _errs37) {
                                    if (typeof data15 === 'string') {
                                      if (!formats0.validate(data15)) {
                                        const err4 = {
                                          instancePath: instancePath + '/deprecation/sunsetAt',
                                          schemaPath:
                                            '#/properties/deprecation/properties/sunsetAt/anyOf/0/format',
                                          keyword: 'format',
                                          params: { format: 'date-time' },
                                          message: 'must match format "date-time"',
                                        };
                                        if (vErrors === null) {
                                          vErrors = [err4];
                                        } else {
                                          vErrors.push(err4);
                                        }
                                        errors++;
                                      }
                                    } else {
                                      const err5 = {
                                        instancePath: instancePath + '/deprecation/sunsetAt',
                                        schemaPath:
                                          '#/properties/deprecation/properties/sunsetAt/anyOf/0/type',
                                        keyword: 'type',
                                        params: { type: 'string' },
                                        message: 'must be string',
                                      };
                                      if (vErrors === null) {
                                        vErrors = [err5];
                                      } else {
                                        vErrors.push(err5);
                                      }
                                      errors++;
                                    }
                                  }
                                }
                                var _valid1 = _errs37 === errors;
                                valid7 = valid7 || _valid1;
                                const _errs39 = errors;
                                if (data15 !== null) {
                                  const err6 = {
                                    instancePath: instancePath + '/deprecation/sunsetAt',
                                    schemaPath:
                                      '#/properties/deprecation/properties/sunsetAt/anyOf/1/type',
                                    keyword: 'type',
                                    params: { type: 'null' },
                                    message: 'must be null',
                                  };
                                  if (vErrors === null) {
                                    vErrors = [err6];
                                  } else {
                                    vErrors.push(err6);
                                  }
                                  errors++;
                                }
                                var _valid1 = _errs39 === errors;
                                valid7 = valid7 || _valid1;
                                if (!valid7) {
                                  const err7 = {
                                    instancePath: instancePath + '/deprecation/sunsetAt',
                                    schemaPath:
                                      '#/properties/deprecation/properties/sunsetAt/anyOf',
                                    keyword: 'anyOf',
                                    params: {},
                                    message: 'must match a schema in anyOf',
                                  };
                                  if (vErrors === null) {
                                    vErrors = [err7];
                                  } else {
                                    vErrors.push(err7);
                                  }
                                  errors++;
                                  validate93.errors = vErrors;
                                  return false;
                                } else {
                                  errors = _errs36;
                                  if (vErrors !== null) {
                                    if (_errs36) {
                                      vErrors.length = _errs36;
                                    } else {
                                      vErrors = null;
                                    }
                                  }
                                }
                                var valid5 = _errs35 === errors;
                              } else {
                                var valid5 = true;
                              }
                              if (valid5) {
                                if (data13.replacement !== void 0) {
                                  let data16 = data13.replacement;
                                  const _errs41 = errors;
                                  if (errors === _errs41) {
                                    if (typeof data16 === 'string') {
                                      if (func2(data16) > 512) {
                                        validate93.errors = [
                                          {
                                            instancePath: instancePath + '/deprecation/replacement',
                                            schemaPath:
                                              '#/properties/deprecation/properties/replacement/maxLength',
                                            keyword: 'maxLength',
                                            params: { limit: 512 },
                                            message: 'must NOT have more than 512 characters',
                                          },
                                        ];
                                        return false;
                                      } else {
                                        if (func2(data16) < 1) {
                                          validate93.errors = [
                                            {
                                              instancePath:
                                                instancePath + '/deprecation/replacement',
                                              schemaPath:
                                                '#/properties/deprecation/properties/replacement/minLength',
                                              keyword: 'minLength',
                                              params: { limit: 1 },
                                              message: 'must NOT have fewer than 1 characters',
                                            },
                                          ];
                                          return false;
                                        }
                                      }
                                    } else {
                                      validate93.errors = [
                                        {
                                          instancePath: instancePath + '/deprecation/replacement',
                                          schemaPath:
                                            '#/properties/deprecation/properties/replacement/type',
                                          keyword: 'type',
                                          params: { type: 'string' },
                                          message: 'must be string',
                                        },
                                      ];
                                      return false;
                                    }
                                  }
                                  var valid5 = _errs41 === errors;
                                } else {
                                  var valid5 = true;
                                }
                              }
                            }
                          }
                        }
                      } else {
                        validate93.errors = [
                          {
                            instancePath: instancePath + '/deprecation',
                            schemaPath: '#/properties/deprecation/type',
                            keyword: 'type',
                            params: { type: 'object' },
                            message: 'must be object',
                          },
                        ];
                        return false;
                      }
                    }
                    var valid0 = _errs26 === errors;
                  } else {
                    var valid0 = true;
                  }
                }
              }
            }
          }
        }
      }
    } else {
      validate93.errors = [
        {
          instancePath,
          schemaPath: '#/type',
          keyword: 'type',
          params: { type: 'object' },
          message: 'must be object',
        },
      ];
      return false;
    }
  }
  validate93.errors = vErrors;
  return errors === 0;
}
validate93.evaluated = { props: true, dynamicProps: false, dynamicItems: false };
var validateCurrentRelease = validate96;
function validate96(
  data,
  { instancePath = '', parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {},
) {
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate96.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = void 0;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = void 0;
  }
  if (errors === 0) {
    if (data && typeof data == 'object' && !Array.isArray(data)) {
      let missing0;
      if (
        (data.schemaVersion === void 0 && (missing0 = 'schemaVersion')) ||
        (data.releaseId === void 0 && (missing0 = 'releaseId')) ||
        (data.manifest === void 0 && (missing0 = 'manifest'))
      ) {
        validate96.errors = [
          {
            instancePath,
            schemaPath: '#/required',
            keyword: 'required',
            params: { missingProperty: missing0 },
            message: "must have required property '" + missing0 + "'",
          },
        ];
        return false;
      } else {
        const _errs1 = errors;
        for (const key0 in data) {
          if (!(key0 === 'schemaVersion' || key0 === 'releaseId' || key0 === 'manifest')) {
            validate96.errors = [
              {
                instancePath,
                schemaPath: '#/additionalProperties',
                keyword: 'additionalProperties',
                params: { additionalProperty: key0 },
                message: 'must NOT have additional properties',
              },
            ];
            return false;
            break;
          }
        }
        if (_errs1 === errors) {
          if (data.schemaVersion !== void 0) {
            const _errs2 = errors;
            if ('3.0' !== data.schemaVersion) {
              validate96.errors = [
                {
                  instancePath: instancePath + '/schemaVersion',
                  schemaPath: '#/properties/schemaVersion/const',
                  keyword: 'const',
                  params: { allowedValue: '3.0' },
                  message: 'must be equal to constant',
                },
              ];
              return false;
            }
            var valid0 = _errs2 === errors;
          } else {
            var valid0 = true;
          }
          if (valid0) {
            if (data.releaseId !== void 0) {
              let data1 = data.releaseId;
              const _errs3 = errors;
              if (errors === _errs3) {
                if (typeof data1 === 'string') {
                  if (!pattern26.test(data1)) {
                    validate96.errors = [
                      {
                        instancePath: instancePath + '/releaseId',
                        schemaPath: '#/properties/releaseId/pattern',
                        keyword: 'pattern',
                        params: { pattern: '^[a-f0-9]{64}$' },
                        message: 'must match pattern "^[a-f0-9]{64}$"',
                      },
                    ];
                    return false;
                  }
                } else {
                  validate96.errors = [
                    {
                      instancePath: instancePath + '/releaseId',
                      schemaPath: '#/properties/releaseId/type',
                      keyword: 'type',
                      params: { type: 'string' },
                      message: 'must be string',
                    },
                  ];
                  return false;
                }
              }
              var valid0 = _errs3 === errors;
            } else {
              var valid0 = true;
            }
            if (valid0) {
              if (data.manifest !== void 0) {
                const _errs5 = errors;
                if (
                  !validate66(data.manifest, {
                    instancePath: instancePath + '/manifest',
                    parentData: data,
                    parentDataProperty: 'manifest',
                    rootData,
                    dynamicAnchors,
                  })
                ) {
                  vErrors =
                    vErrors === null ? validate66.errors : vErrors.concat(validate66.errors);
                  errors = vErrors.length;
                }
                var valid0 = _errs5 === errors;
              } else {
                var valid0 = true;
              }
            }
          }
        }
      }
    } else {
      validate96.errors = [
        {
          instancePath,
          schemaPath: '#/type',
          keyword: 'type',
          params: { type: 'object' },
          message: 'must be object',
        },
      ];
      return false;
    }
  }
  validate96.errors = vErrors;
  return errors === 0;
}
validate96.evaluated = { props: true, dynamicProps: false, dynamicItems: false };
var validateDerivedEstimateResult = validate98;
var schema31 = {
  type: 'object',
  properties: {
    status: { enum: ['available', 'unavailable'] },
    fromAmount: {
      anyOf: [
        { type: 'string', pattern: '^(0|[1-9][0-9]*)(\\.[0-9]+)?$', maxLength: 512 },
        { type: 'null' },
      ],
    },
    toAmount: {
      anyOf: [
        { type: 'string', pattern: '^(0|[1-9][0-9]*)(\\.[0-9]+)?$', maxLength: 512 },
        { type: 'null' },
      ],
    },
    quoteId: { type: ['string', 'null'] },
    rate: {
      anyOf: [
        { type: 'string', pattern: '^(0|[1-9][0-9]*)(\\.[0-9]+)?$', maxLength: 512 },
        { type: 'null' },
      ],
    },
    reason: { type: ['string', 'null'] },
    feeStatus: { enum: ['unknown', 'no_additional_fee', 'unsupported'] },
    kind: { const: 'derived_cross' },
    legs: { type: 'array', items: { type: 'string' }, maxItems: 2 },
    recommendable: { const: false },
  },
  required: [
    'status',
    'fromAmount',
    'toAmount',
    'quoteId',
    'rate',
    'reason',
    'feeStatus',
    'kind',
    'legs',
    'recommendable',
  ],
  additionalProperties: false,
};
function validate98(
  data,
  { instancePath = '', parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {},
) {
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate98.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = void 0;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = void 0;
  }
  if (errors === 0) {
    if (data && typeof data == 'object' && !Array.isArray(data)) {
      let missing0;
      if (
        (data.status === void 0 && (missing0 = 'status')) ||
        (data.fromAmount === void 0 && (missing0 = 'fromAmount')) ||
        (data.toAmount === void 0 && (missing0 = 'toAmount')) ||
        (data.quoteId === void 0 && (missing0 = 'quoteId')) ||
        (data.rate === void 0 && (missing0 = 'rate')) ||
        (data.reason === void 0 && (missing0 = 'reason')) ||
        (data.feeStatus === void 0 && (missing0 = 'feeStatus')) ||
        (data.kind === void 0 && (missing0 = 'kind')) ||
        (data.legs === void 0 && (missing0 = 'legs')) ||
        (data.recommendable === void 0 && (missing0 = 'recommendable'))
      ) {
        validate98.errors = [
          {
            instancePath,
            schemaPath: '#/required',
            keyword: 'required',
            params: { missingProperty: missing0 },
            message: "must have required property '" + missing0 + "'",
          },
        ];
        return false;
      } else {
        const _errs1 = errors;
        for (const key0 in data) {
          if (!func1.call(schema31.properties, key0)) {
            validate98.errors = [
              {
                instancePath,
                schemaPath: '#/additionalProperties',
                keyword: 'additionalProperties',
                params: { additionalProperty: key0 },
                message: 'must NOT have additional properties',
              },
            ];
            return false;
            break;
          }
        }
        if (_errs1 === errors) {
          if (data.status !== void 0) {
            let data0 = data.status;
            const _errs2 = errors;
            if (!(data0 === 'available' || data0 === 'unavailable')) {
              validate98.errors = [
                {
                  instancePath: instancePath + '/status',
                  schemaPath: '#/properties/status/enum',
                  keyword: 'enum',
                  params: { allowedValues: schema31.properties.status.enum },
                  message: 'must be equal to one of the allowed values',
                },
              ];
              return false;
            }
            var valid0 = _errs2 === errors;
          } else {
            var valid0 = true;
          }
          if (valid0) {
            if (data.fromAmount !== void 0) {
              let data1 = data.fromAmount;
              const _errs3 = errors;
              const _errs4 = errors;
              let valid1 = false;
              const _errs5 = errors;
              if (errors === _errs5) {
                if (typeof data1 === 'string') {
                  if (func2(data1) > 512) {
                    const err0 = {
                      instancePath: instancePath + '/fromAmount',
                      schemaPath: '#/properties/fromAmount/anyOf/0/maxLength',
                      keyword: 'maxLength',
                      params: { limit: 512 },
                      message: 'must NOT have more than 512 characters',
                    };
                    if (vErrors === null) {
                      vErrors = [err0];
                    } else {
                      vErrors.push(err0);
                    }
                    errors++;
                  } else {
                    if (!pattern5.test(data1)) {
                      const err1 = {
                        instancePath: instancePath + '/fromAmount',
                        schemaPath: '#/properties/fromAmount/anyOf/0/pattern',
                        keyword: 'pattern',
                        params: { pattern: '^(0|[1-9][0-9]*)(\\.[0-9]+)?$' },
                        message: 'must match pattern "^(0|[1-9][0-9]*)(\\.[0-9]+)?$"',
                      };
                      if (vErrors === null) {
                        vErrors = [err1];
                      } else {
                        vErrors.push(err1);
                      }
                      errors++;
                    }
                  }
                } else {
                  const err2 = {
                    instancePath: instancePath + '/fromAmount',
                    schemaPath: '#/properties/fromAmount/anyOf/0/type',
                    keyword: 'type',
                    params: { type: 'string' },
                    message: 'must be string',
                  };
                  if (vErrors === null) {
                    vErrors = [err2];
                  } else {
                    vErrors.push(err2);
                  }
                  errors++;
                }
              }
              var _valid0 = _errs5 === errors;
              valid1 = valid1 || _valid0;
              const _errs7 = errors;
              if (data1 !== null) {
                const err3 = {
                  instancePath: instancePath + '/fromAmount',
                  schemaPath: '#/properties/fromAmount/anyOf/1/type',
                  keyword: 'type',
                  params: { type: 'null' },
                  message: 'must be null',
                };
                if (vErrors === null) {
                  vErrors = [err3];
                } else {
                  vErrors.push(err3);
                }
                errors++;
              }
              var _valid0 = _errs7 === errors;
              valid1 = valid1 || _valid0;
              if (!valid1) {
                const err4 = {
                  instancePath: instancePath + '/fromAmount',
                  schemaPath: '#/properties/fromAmount/anyOf',
                  keyword: 'anyOf',
                  params: {},
                  message: 'must match a schema in anyOf',
                };
                if (vErrors === null) {
                  vErrors = [err4];
                } else {
                  vErrors.push(err4);
                }
                errors++;
                validate98.errors = vErrors;
                return false;
              } else {
                errors = _errs4;
                if (vErrors !== null) {
                  if (_errs4) {
                    vErrors.length = _errs4;
                  } else {
                    vErrors = null;
                  }
                }
              }
              var valid0 = _errs3 === errors;
            } else {
              var valid0 = true;
            }
            if (valid0) {
              if (data.toAmount !== void 0) {
                let data2 = data.toAmount;
                const _errs9 = errors;
                const _errs10 = errors;
                let valid2 = false;
                const _errs11 = errors;
                if (errors === _errs11) {
                  if (typeof data2 === 'string') {
                    if (func2(data2) > 512) {
                      const err5 = {
                        instancePath: instancePath + '/toAmount',
                        schemaPath: '#/properties/toAmount/anyOf/0/maxLength',
                        keyword: 'maxLength',
                        params: { limit: 512 },
                        message: 'must NOT have more than 512 characters',
                      };
                      if (vErrors === null) {
                        vErrors = [err5];
                      } else {
                        vErrors.push(err5);
                      }
                      errors++;
                    } else {
                      if (!pattern5.test(data2)) {
                        const err6 = {
                          instancePath: instancePath + '/toAmount',
                          schemaPath: '#/properties/toAmount/anyOf/0/pattern',
                          keyword: 'pattern',
                          params: { pattern: '^(0|[1-9][0-9]*)(\\.[0-9]+)?$' },
                          message: 'must match pattern "^(0|[1-9][0-9]*)(\\.[0-9]+)?$"',
                        };
                        if (vErrors === null) {
                          vErrors = [err6];
                        } else {
                          vErrors.push(err6);
                        }
                        errors++;
                      }
                    }
                  } else {
                    const err7 = {
                      instancePath: instancePath + '/toAmount',
                      schemaPath: '#/properties/toAmount/anyOf/0/type',
                      keyword: 'type',
                      params: { type: 'string' },
                      message: 'must be string',
                    };
                    if (vErrors === null) {
                      vErrors = [err7];
                    } else {
                      vErrors.push(err7);
                    }
                    errors++;
                  }
                }
                var _valid1 = _errs11 === errors;
                valid2 = valid2 || _valid1;
                const _errs13 = errors;
                if (data2 !== null) {
                  const err8 = {
                    instancePath: instancePath + '/toAmount',
                    schemaPath: '#/properties/toAmount/anyOf/1/type',
                    keyword: 'type',
                    params: { type: 'null' },
                    message: 'must be null',
                  };
                  if (vErrors === null) {
                    vErrors = [err8];
                  } else {
                    vErrors.push(err8);
                  }
                  errors++;
                }
                var _valid1 = _errs13 === errors;
                valid2 = valid2 || _valid1;
                if (!valid2) {
                  const err9 = {
                    instancePath: instancePath + '/toAmount',
                    schemaPath: '#/properties/toAmount/anyOf',
                    keyword: 'anyOf',
                    params: {},
                    message: 'must match a schema in anyOf',
                  };
                  if (vErrors === null) {
                    vErrors = [err9];
                  } else {
                    vErrors.push(err9);
                  }
                  errors++;
                  validate98.errors = vErrors;
                  return false;
                } else {
                  errors = _errs10;
                  if (vErrors !== null) {
                    if (_errs10) {
                      vErrors.length = _errs10;
                    } else {
                      vErrors = null;
                    }
                  }
                }
                var valid0 = _errs9 === errors;
              } else {
                var valid0 = true;
              }
              if (valid0) {
                if (data.quoteId !== void 0) {
                  let data3 = data.quoteId;
                  const _errs15 = errors;
                  if (typeof data3 !== 'string' && data3 !== null) {
                    validate98.errors = [
                      {
                        instancePath: instancePath + '/quoteId',
                        schemaPath: '#/properties/quoteId/type',
                        keyword: 'type',
                        params: { type: schema31.properties.quoteId.type },
                        message: 'must be string,null',
                      },
                    ];
                    return false;
                  }
                  var valid0 = _errs15 === errors;
                } else {
                  var valid0 = true;
                }
                if (valid0) {
                  if (data.rate !== void 0) {
                    let data4 = data.rate;
                    const _errs17 = errors;
                    const _errs18 = errors;
                    let valid3 = false;
                    const _errs19 = errors;
                    if (errors === _errs19) {
                      if (typeof data4 === 'string') {
                        if (func2(data4) > 512) {
                          const err10 = {
                            instancePath: instancePath + '/rate',
                            schemaPath: '#/properties/rate/anyOf/0/maxLength',
                            keyword: 'maxLength',
                            params: { limit: 512 },
                            message: 'must NOT have more than 512 characters',
                          };
                          if (vErrors === null) {
                            vErrors = [err10];
                          } else {
                            vErrors.push(err10);
                          }
                          errors++;
                        } else {
                          if (!pattern5.test(data4)) {
                            const err11 = {
                              instancePath: instancePath + '/rate',
                              schemaPath: '#/properties/rate/anyOf/0/pattern',
                              keyword: 'pattern',
                              params: { pattern: '^(0|[1-9][0-9]*)(\\.[0-9]+)?$' },
                              message: 'must match pattern "^(0|[1-9][0-9]*)(\\.[0-9]+)?$"',
                            };
                            if (vErrors === null) {
                              vErrors = [err11];
                            } else {
                              vErrors.push(err11);
                            }
                            errors++;
                          }
                        }
                      } else {
                        const err12 = {
                          instancePath: instancePath + '/rate',
                          schemaPath: '#/properties/rate/anyOf/0/type',
                          keyword: 'type',
                          params: { type: 'string' },
                          message: 'must be string',
                        };
                        if (vErrors === null) {
                          vErrors = [err12];
                        } else {
                          vErrors.push(err12);
                        }
                        errors++;
                      }
                    }
                    var _valid2 = _errs19 === errors;
                    valid3 = valid3 || _valid2;
                    const _errs21 = errors;
                    if (data4 !== null) {
                      const err13 = {
                        instancePath: instancePath + '/rate',
                        schemaPath: '#/properties/rate/anyOf/1/type',
                        keyword: 'type',
                        params: { type: 'null' },
                        message: 'must be null',
                      };
                      if (vErrors === null) {
                        vErrors = [err13];
                      } else {
                        vErrors.push(err13);
                      }
                      errors++;
                    }
                    var _valid2 = _errs21 === errors;
                    valid3 = valid3 || _valid2;
                    if (!valid3) {
                      const err14 = {
                        instancePath: instancePath + '/rate',
                        schemaPath: '#/properties/rate/anyOf',
                        keyword: 'anyOf',
                        params: {},
                        message: 'must match a schema in anyOf',
                      };
                      if (vErrors === null) {
                        vErrors = [err14];
                      } else {
                        vErrors.push(err14);
                      }
                      errors++;
                      validate98.errors = vErrors;
                      return false;
                    } else {
                      errors = _errs18;
                      if (vErrors !== null) {
                        if (_errs18) {
                          vErrors.length = _errs18;
                        } else {
                          vErrors = null;
                        }
                      }
                    }
                    var valid0 = _errs17 === errors;
                  } else {
                    var valid0 = true;
                  }
                  if (valid0) {
                    if (data.reason !== void 0) {
                      let data5 = data.reason;
                      const _errs23 = errors;
                      if (typeof data5 !== 'string' && data5 !== null) {
                        validate98.errors = [
                          {
                            instancePath: instancePath + '/reason',
                            schemaPath: '#/properties/reason/type',
                            keyword: 'type',
                            params: { type: schema31.properties.reason.type },
                            message: 'must be string,null',
                          },
                        ];
                        return false;
                      }
                      var valid0 = _errs23 === errors;
                    } else {
                      var valid0 = true;
                    }
                    if (valid0) {
                      if (data.feeStatus !== void 0) {
                        let data6 = data.feeStatus;
                        const _errs25 = errors;
                        if (
                          !(
                            data6 === 'unknown' ||
                            data6 === 'no_additional_fee' ||
                            data6 === 'unsupported'
                          )
                        ) {
                          validate98.errors = [
                            {
                              instancePath: instancePath + '/feeStatus',
                              schemaPath: '#/properties/feeStatus/enum',
                              keyword: 'enum',
                              params: { allowedValues: schema31.properties.feeStatus.enum },
                              message: 'must be equal to one of the allowed values',
                            },
                          ];
                          return false;
                        }
                        var valid0 = _errs25 === errors;
                      } else {
                        var valid0 = true;
                      }
                      if (valid0) {
                        if (data.kind !== void 0) {
                          const _errs26 = errors;
                          if ('derived_cross' !== data.kind) {
                            validate98.errors = [
                              {
                                instancePath: instancePath + '/kind',
                                schemaPath: '#/properties/kind/const',
                                keyword: 'const',
                                params: { allowedValue: 'derived_cross' },
                                message: 'must be equal to constant',
                              },
                            ];
                            return false;
                          }
                          var valid0 = _errs26 === errors;
                        } else {
                          var valid0 = true;
                        }
                        if (valid0) {
                          if (data.legs !== void 0) {
                            let data8 = data.legs;
                            const _errs27 = errors;
                            if (errors === _errs27) {
                              if (Array.isArray(data8)) {
                                if (data8.length > 2) {
                                  validate98.errors = [
                                    {
                                      instancePath: instancePath + '/legs',
                                      schemaPath: '#/properties/legs/maxItems',
                                      keyword: 'maxItems',
                                      params: { limit: 2 },
                                      message: 'must NOT have more than 2 items',
                                    },
                                  ];
                                  return false;
                                } else {
                                  var valid4 = true;
                                  const len0 = data8.length;
                                  for (let i0 = 0; i0 < len0; i0++) {
                                    const _errs29 = errors;
                                    if (typeof data8[i0] !== 'string') {
                                      validate98.errors = [
                                        {
                                          instancePath: instancePath + '/legs/' + i0,
                                          schemaPath: '#/properties/legs/items/type',
                                          keyword: 'type',
                                          params: { type: 'string' },
                                          message: 'must be string',
                                        },
                                      ];
                                      return false;
                                    }
                                    var valid4 = _errs29 === errors;
                                    if (!valid4) {
                                      break;
                                    }
                                  }
                                }
                              } else {
                                validate98.errors = [
                                  {
                                    instancePath: instancePath + '/legs',
                                    schemaPath: '#/properties/legs/type',
                                    keyword: 'type',
                                    params: { type: 'array' },
                                    message: 'must be array',
                                  },
                                ];
                                return false;
                              }
                            }
                            var valid0 = _errs27 === errors;
                          } else {
                            var valid0 = true;
                          }
                          if (valid0) {
                            if (data.recommendable !== void 0) {
                              const _errs31 = errors;
                              if (false !== data.recommendable) {
                                validate98.errors = [
                                  {
                                    instancePath: instancePath + '/recommendable',
                                    schemaPath: '#/properties/recommendable/const',
                                    keyword: 'const',
                                    params: { allowedValue: false },
                                    message: 'must be equal to constant',
                                  },
                                ];
                                return false;
                              }
                              var valid0 = _errs31 === errors;
                            } else {
                              var valid0 = true;
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    } else {
      validate98.errors = [
        {
          instancePath,
          schemaPath: '#/type',
          keyword: 'type',
          params: { type: 'object' },
          message: 'must be object',
        },
      ];
      return false;
    }
  }
  validate98.errors = vErrors;
  return errors === 0;
}
validate98.evaluated = { props: true, dynamicProps: false, dynamicItems: false };
export {
  validateCurrentRelease,
  validateDerivedCrossQuote,
  validateDerivedEstimateResult,
  validateEstimateRequest,
  validateEstimateResult,
  validateObjectReference,
  validateProvider,
  validateProviderSnapshot,
  validateQuoteSnapshot,
  validateReleaseManifest,
  validateSelectionContext,
  validateSourceQuote,
};
