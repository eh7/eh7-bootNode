'use strict'

const TCP = require('libp2p-tcp')
const MulticastDNS = require('libp2p-mdns')
const WS = require('libp2p-websockets')
const Bootstrap = require('libp2p-bootstrap')
const spdy = require('libp2p-spdy')
const KadDHT = require('libp2p-kad-dht')
const mplex = require('libp2p-mplex')
const secio = require('libp2p-secio')
const Gossipsub = require('libp2p-gossipsub')
const defaultsDeep = require('@nodeutils/defaults-deep')
const libp2p = require('libp2p')

const pull = require('pull-stream')
const PeerInfo = require('peer-info')
const PeerId   = require('peer-id')

function mapMuxers (list) {
  return list.map((pref) => {
    if (typeof pref !== 'string') {
      return pref
    }
    switch (pref.trim().toLowerCase()) {
      case 'spdy': return spdy
      case 'mplex': return mplex
      default:
        throw new Error(pref + ' muxer not available')
    }
  })
}

function getMuxers (muxers) {
  const muxerPrefs = process.env.LIBP2P_MUXER
  if (muxerPrefs && !muxers) {
    return mapMuxers(muxerPrefs.split(','))
  } else if (muxers) {
    return mapMuxers(muxers)
  } else {
    return [mplex, spdy]
  }
}

class Libp2pNode extends libp2p {
  constructor (_options) {
    const defaults = {
      modules: {
        transport: [
          TCP,
          WS
        ],
        streamMuxer: getMuxers(_options.muxer),
        connEncryption: [ secio ],
        peerDiscovery: [
          Bootstrap,
          MulticastDNS
        ],
        pubsub: Gossipsub,
        dht: KadDHT
      },
      config: {
        peerDiscovery: {
          mdns: {
            interval: 10000,
            enabled: false
          },
          bootstrap: {
            interval: 10000,
            enabled: false,
            list: _options.bootstrapList
          }
        },
        pubsub: {
          enabled: true,
          emitSelf: true
        },
        dht: {
          kBucketSize: 20
        }
      }
    }

    super(defaultsDeep(_options, defaults))
  }
}
module.exports = Libp2pNode
