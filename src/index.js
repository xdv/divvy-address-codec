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
  ripple:  'rpshnaf39wBUDNEGHJKLM4PQRST7VWXYZ2bcdeCg65jkm8oFqi1tuvAxyz',
  tipple: 'RPShNAF39wBUDnEGHJKLM4pQrsT7VWXYZ2bcdeCg65jkm8ofqi1tuvaxyz',
  stellar: 'gsphnaf39wBUDNEGHJKLM4PQRST7VWXYZ2bcdeCr65jkm8oFqi1tuvAxyz'
}

function buildCodecsMap(alphabets, Codec) {
  const codecs = {}
  for (const _name in ALPHABETS) {
    codecs[_name] = new Codec(ALPHABETS[_name])
  } if (alphabets !== ALPHABETS) {
    for (const _name2 in alphabets) {
      codecs[_name2] = new Codec(alphabets[_name2])
    }
  }
  return codecs
}

const options = {
  sha256: function(bytes) {
    return createHash('sha256').update(new Buffer(bytes)).digest()
  }
}

const alphabets = ALPHABETS

const codecMethods = {
  EdSeed: { // opts
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

const defaultAlphabet = 'ripple'

const Codec = codecFactory(options)
const codecs = buildCodecsMap(alphabets, Codec)

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


// entropy is a Buffer of size 16
// type is 'ed25519' or 'secp256k1'
function encodeSeed(entropy/*: Buffer*/, type/*: string*/)/*: string*/ {
  if (entropy.length !== 16) {
    throw new Error('entropy must have length 16')
  }
  if (type !== 'ed25519' && type !== 'secp256k1') {
    throw new Error('type must be ed25519 or secp256k1')
  }
  const opts = {
    expectedLength: 16,

    // for secp256k1, use `FAMILY_SEED`
    version: type === 'ed25519' ? ED25519_SEED : FAMILY_SEED
  }
  return codecs[defaultAlphabet].encode(entropy, opts)
}



// encodeSeed
// decodeSeed
// encodeAccountID
// decodeNodePublic
// const xrpCodec = {

// }


//encode*,decode*

// `name`:
// EdSeed
// Seed
// AccountID
// Address
// NodePublic
// NodePrivate
// K256Seed

// `opts`:
// codecMethods[name]
function addVersion(name, opts) {
  function add(operation) {

    const encode = operation === 'encode'

    api[operation + name] = function(arg, arg2) {
      let params = opts
      if (arg2 && encode) {
        // set these params for the encoder IF arg2 is set
        params = {
          expectedLength: opts.expectedLength,
          // `Seed` has multiple versions:
          version: opts.versions[opts.versionTypes.indexOf(arg2)]
        }
      }
      // for the decoder, it's the unmodified `opts`
      return api[operation](arg, params)
    }
    return api[operation + name]
  }
  const decode = add('decode')
  add('encode')
  api['isValid' + name] = function(arg) {
    try {
      decode(arg)
    } catch (e) {
      return false
    }
    return true
  }
}
console.log('---------------')



for (const k in codecMethods) {
  // console.log(k)
  addVersion(k, codecMethods[k])
}
console.log('---------------')

module.exports = api
