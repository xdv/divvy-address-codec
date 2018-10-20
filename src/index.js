'use strict'

const codecFactory = require('./x-address-codec/address-codec')

const createHash = require('create-hash')

const NODE_PUBLIC = 28
const NODE_PRIVATE = 32
const ACCOUNT_ID = 0
const FAMILY_SEED = 33
const ED25519_SEED = [0x01, 0xE1, 0x4B]

const ALPHABETS = {
  bitcoin: '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz',
  ripple: 'rpshnaf39wBUDNEGHJKLM4PQRST7VWXYZ2bcdeCg65jkm8oFqi1tuvAxyz',
  tipple: 'RPShNAF39wBUDnEGHJKLM4pQrsT7VWXYZ2bcdeCg65jkm8ofqi1tuvaxyz',
  stellar: 'gsphnaf39wBUDNEGHJKLM4PQRST7VWXYZ2bcdeCr65jkm8oFqi1tuvAxyz'
}

function buildCodecsMap(alphabets, Codec) {
  var codecs = {};
  for (var _name in ALPHABETS) {
    codecs[_name] = new Codec(ALPHABETS[_name]);
  }if (alphabets !== ALPHABETS) {
    for (var _name2 in alphabets) {
      codecs[_name2] = new Codec(alphabets[_name2]);
    }
  }
  return codecs;
}

const options = {
  sha256: function(bytes) {
    return createHash('sha256').update(new Buffer(bytes)).digest()
  }
}

var alphabets = ALPHABETS

var codecMethods = {
  EdSeed: {
    expectedLength: 16,
    version: ED25519_SEED
  },
  Seed: {
    // TODO: Use a map, not a parallel array
    versionTypes: ['ed25519', 'secp256k1'],
    versions: [ED25519_SEED, FAMILY_SEED],
    expectedLength: 16
  },
  AccountID: {version: ACCOUNT_ID, expectedLength: 20},
  Address: {version: ACCOUNT_ID, expectedLength: 20},
  NodePublic: {version: NODE_PUBLIC, expectedLength: 33},
  NodePrivate: {version: NODE_PRIVATE, expectedLength: 32},
  K256Seed: {version: FAMILY_SEED, expectedLength: 16}
}

var defaultAlphabet = 'ripple'

var Codec = codecFactory(options)
var codecs = buildCodecsMap(alphabets, Codec)

const api = {
  Codec: Codec,
  codecs: codecs,
  decode: function decode(string, opts = {}) {
    const alphabet = opts.alphabet ? opts.alphabet : defaultAlphabet
    return codecs[alphabet].decode(string, opts)
  },
  encode: function encode(bytes, opts = {}) {
    const alphabet = opts.alphabet ? opts.alphabet : defaultAlphabet
    return codecs[alphabet].encode(bytes, opts)
  }
}

function addVersion(name, opts) {
  function add(operation) {
    var encode = operation === 'encode';
    var func = api[operation + name] = function (arg, arg2) {
      var params = opts;
      if (arg2 && encode) {
        params = {
          expectedLength: opts.expectedLength,
          version: opts.versions[opts.versionTypes.indexOf(arg2)]
        };
      }
      return api[operation](arg, params);
    };
    return func;
  }
  var decode = add('decode');
  add('encode');
  api['isValid' + name] = function (arg) {
    try {
      decode(arg);
    } catch (e) {
      return false;
    }
    return true;
  };
}
for (var k in codecMethods) {
  addVersion(k, codecMethods[k]);
}

module.exports = api
