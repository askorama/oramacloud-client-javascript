var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// node_modules/.pnpm/cuid@3.0.0/node_modules/cuid/lib/pad.js
var require_pad = __commonJS({
  "node_modules/.pnpm/cuid@3.0.0/node_modules/cuid/lib/pad.js"(exports, module) {
    module.exports = function pad(num, size) {
      var s = "000000000" + num;
      return s.substr(s.length - size);
    };
  }
});

// node_modules/.pnpm/cuid@3.0.0/node_modules/cuid/lib/fingerprint.browser.js
var require_fingerprint_browser = __commonJS({
  "node_modules/.pnpm/cuid@3.0.0/node_modules/cuid/lib/fingerprint.browser.js"(exports, module) {
    var pad = require_pad();
    var env = typeof window === "object" ? window : self;
    var globalCount = Object.keys(env).length;
    var mimeTypesLength = navigator.mimeTypes ? navigator.mimeTypes.length : 0;
    var clientId = pad((mimeTypesLength + navigator.userAgent.length).toString(36) + globalCount.toString(36), 4);
    module.exports = function fingerprint() {
      return clientId;
    };
  }
});

// node_modules/.pnpm/cuid@3.0.0/node_modules/cuid/lib/getRandomValue.browser.js
var require_getRandomValue_browser = __commonJS({
  "node_modules/.pnpm/cuid@3.0.0/node_modules/cuid/lib/getRandomValue.browser.js"(exports, module) {
    var getRandomValue;
    var crypto = typeof window !== "undefined" && (window.crypto || window.msCrypto) || typeof self !== "undefined" && self.crypto;
    if (crypto) {
      lim = Math.pow(2, 32) - 1;
      getRandomValue = function() {
        return Math.abs(crypto.getRandomValues(new Uint32Array(1))[0] / lim);
      };
    } else {
      getRandomValue = Math.random;
    }
    var lim;
    module.exports = getRandomValue;
  }
});

// node_modules/.pnpm/cuid@3.0.0/node_modules/cuid/index.js
var require_cuid = __commonJS({
  "node_modules/.pnpm/cuid@3.0.0/node_modules/cuid/index.js"(exports, module) {
    var fingerprint = require_fingerprint_browser();
    var pad = require_pad();
    var getRandomValue = require_getRandomValue_browser();
    var c = 0;
    var blockSize = 4;
    var base = 36;
    var discreteValues = Math.pow(base, blockSize);
    function randomBlock() {
      return pad((getRandomValue() * discreteValues << 0).toString(base), blockSize);
    }
    function safeCounter() {
      c = c < discreteValues ? c : 0;
      c++;
      return c - 1;
    }
    function cuid2() {
      var letter = "c", timestamp = (/* @__PURE__ */ new Date()).getTime().toString(base), counter = pad(safeCounter().toString(base), blockSize), print = fingerprint(), random = randomBlock() + randomBlock();
      return letter + timestamp + counter + print + random;
    }
    cuid2.slug = function slug() {
      var date = (/* @__PURE__ */ new Date()).getTime().toString(36), counter = safeCounter().toString(36).slice(-4), print = fingerprint().slice(0, 1) + fingerprint().slice(-1), random = randomBlock().slice(-2);
      return date.slice(-2) + counter + print + random;
    };
    cuid2.isCuid = function isCuid(stringToCheck) {
      if (typeof stringToCheck !== "string")
        return false;
      if (stringToCheck.startsWith("c"))
        return true;
      return false;
    };
    cuid2.isSlug = function isSlug(stringToCheck) {
      if (typeof stringToCheck !== "string")
        return false;
      var stringLength = stringToCheck.length;
      if (stringLength >= 7 && stringLength <= 10)
        return true;
      return false;
    };
    cuid2.fingerprint = fingerprint;
    module.exports = cuid2;
  }
});

// node_modules/.pnpm/@orama+orama@1.0.6/node_modules/@orama/orama/dist/utils.js
var baseId = Date.now().toString().slice(5);
var nano = BigInt(1e3);
var milli = BigInt(1e6);
var second = BigInt(1e9);
async function formatNanoseconds(value) {
  if (typeof value === "number") {
    value = BigInt(value);
  }
  if (value < nano) {
    return `${value}ns`;
  } else if (value < milli) {
    return `${value / nano}\u03BCs`;
  } else if (value < second) {
    return `${value / milli}ms`;
  }
  return `${value / second}s`;
}

// node_modules/.pnpm/@orama+orama@1.0.6/node_modules/@orama/orama/dist/components/defaults.js
async function formatElapsedTime(n) {
  return {
    raw: Number(n),
    formatted: await formatNanoseconds(n)
  };
}

// src/index.ts
var import_cuid = __toESM(require_cuid(), 1);

// src/fetchFn.ts
async function fetchFn(url, method, headers, body) {
  const requestOptions = {
    method,
    headers: {
      "Content-Type": "application/json",
      ...headers
    }
  };
  if (method === "POST" && body !== void 0) {
    requestOptions.body = JSON.stringify(body);
  }
  return await fetch(url, requestOptions);
}

// src/collector.ts
var Collector = class {
  id;
  data;
  flushInterval;
  flushSize;
  endpoint;
  api_key;
  index;
  deploymentID;
  constructor(params) {
    this.data = [];
    this.id = params.id;
    this.flushInterval = params.flushInterval;
    this.flushSize = params.flushSize;
    this.endpoint = params.endpoint;
    this.api_key = params.api_key;
    this.index = params.index;
    this.deploymentID = params.deploymentID;
  }
  add(data) {
    this.data.push({
      index: this.index,
      id: this.id,
      source: "fe",
      deploymentID: this.deploymentID,
      rawSearchString: data.rawSearchString,
      query: data.query,
      resultsCount: data.resultsCount,
      roundTripTime: data.roundTripTime,
      contentEncoding: data.contentEncoding,
      searchedAt: data.searchedAt,
      userAgent: typeof navigator !== "undefined" ? navigator.userAgent : void 0,
      referrer: typeof document !== "undefined" ? document.referrer : void 0
    });
    if (this.data.length >= this.flushSize) {
      this.flush();
    }
  }
  flush() {
    if (this.data.length === 0) {
      return;
    }
    let data = this.data;
    this.data = [];
    fetchFn(this.endpoint, "POST", {
      Authorization: `Bearer ${this.api_key}`
    }, data).catch((err) => console.error(err));
  }
  async start() {
    setInterval(this.flush.bind(this), this.flushInterval);
  }
};

// src/index.ts
var OramaClient = class {
  api_key;
  endpoint;
  collector;
  constructor(params) {
    this.api_key = params.api_key;
    this.endpoint = params.endpoint;
    this.collector = this.init();
  }
  async search(query) {
    const timeStart = Date.now();
    const [results, contentEncoding] = await this.fetch("search", "POST", query);
    const timeEnd = Date.now();
    results.elapsed = await formatElapsedTime(BigInt(timeEnd - timeStart));
    this.collector.then((collector) => {
      if (collector) {
        collector.add({
          rawSearchString: query.term,
          resultsCount: results.hits.length,
          roundTripTime: timeEnd - timeStart,
          contentEncoding,
          query,
          searchedAt: new Date(timeStart)
        });
      }
    });
    return results;
  }
  createCollector(body) {
    const collector = new Collector({
      id: (0, import_cuid.default)(),
      flushInterval: 5e3,
      // @todo: make this configurable?
      flushSize: 25,
      // @todo: make this configurable?
      endpoint: body.collectUrl,
      api_key: this.api_key,
      deploymentID: body.deploymentID,
      index: body.index
    });
    return collector;
  }
  init() {
    return this.fetch("init", "POST").then(([b]) => this.createCollector(b)).catch((err) => console.log(err));
  }
  async fetch(path, method, body) {
    const res = await fetchFn(
      `${this.endpoint}/${path}`,
      method,
      { Authorization: `Bearer ${this.api_key}` },
      body
    );
    let contentEncoding = res.headers.get("Content-Encoding") || void 0;
    return [await res.json(), contentEncoding];
  }
};
export {
  OramaClient
};
