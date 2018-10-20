/* eslint-disable no-unused-expressions/no-unused-expressions */

'use strict'

const assert = require('assert')
const api = require('../dist/xrp-codec')

// function toHex(bytes) {
//   return new Buffer(bytes).toString('hex').toUpperCase()
// }

function toBytes(hex) {
  return new Buffer(hex, 'hex').toJSON().data
}

describe('ripple-address-codec', function() {

  it('encodes a secp256k1 seed', function() {
    const result = api.encodeSeed(toBytes('CF2DE378FBDD7E2EE87D486DFB5A7BFF'), 'secp256k1')
    assert.equal(result, 'sn259rEFXrQrWyx3Q7XneWcwV6dfL')
  })

  it('encodes an ed25519 seed', function() {
    const result = api.encodeSeed(toBytes('4C3A1D213FBDFB14C7C28D609469B341'), 'ed25519')
    assert.equal(result, 'sEdTM1uX8pu2do5XvTnutH6HsouMaM2')
  })
  
})
