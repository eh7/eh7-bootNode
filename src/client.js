'use strict'

//const Libp2pNode = require('./libp2p-bundle.js')

const libp2p = require('libp2p')
const TCP = require('libp2p-tcp')
const Mplex = require('libp2p-mplex')
const SECIO = require('libp2p-secio')
const Bootstrap = require('libp2p-bootstrap')
const defaultsDeep = require('@nodeutils/defaults-deep')

const PeerInfo = require('peer-info')
const PeerId   = require('peer-id')
const pull = require('pull-stream')

const bootstrapers = [
  '/ip4/10.0.0.10/tcp/10333/ipfs/QmZiicp2DZuf9Xc9mNiMkc3hiDz4KipoiNzFZbhxLK9Do1'
]


class Libp2pNode extends libp2p {
  constructor (_options) {
    const defaults = {
      modules: {
        transport: [ TCP ],
        streamMuxer: [ Mplex ],
        connEncryption: [ SECIO ],
        peerDiscovery: [ Bootstrap ]
      },
      config: {
        peerDiscovery: {
          autoDial: true,
          bootstrap: {
            interval: 20e3,
            enabled: true,
            list: bootstrapers
          }
        }
      }
    }

    super(defaultsDeep(_options, defaults))
  }
}

let node

const nodeId = PeerId.create((err,nodeId) => {
  if(err) console.log(err)
  else {
    const nodeInfo = new PeerInfo(nodeId)
    nodeInfo.multiaddrs.add('/ip4/0.0.0.0/tcp/0')

    var node = new Libp2pNode({
      peerInfo: nodeInfo
    })
 
    node.start((err) => {
      if(err) console.log(err)
      else {
        console.log("Node Started, listening on:")
        nodeInfo.multiaddrs.forEach((ma) => {
          console.log(ma.toString())
        })
      }
    })

    node.on('peer:discovery', (peer) => {
      // No need to dial, autoDial is on
      console.log('Discovered:', peer.id.toB58String())
    })

    node.on('peer:connect', (peer) => {
      console.log('Connection established to:', peer.id.toB58String())
    })

  }
})

// _options.bootstrapList

/*
PeerId.createFromJSON(bootNode0Id,(err,bootNodeId) => {
  if(err) console.log(err)
  else {

    const bootNodeInfo = new PeerInfo(bootNodeId)
    bootNodeInfo.multiaddrs.add('/ip4/0.0.0.0/tcp/10333')
    var bootNode = new Libp2pNode({
      peerInfo: bootNodeInfo
    })

    bootNode.handle('/eh7/chat', (protocol, conn) => {
      console.log("chat request to listener")
    })

    bootNode.on('peer:discovery', (peer) => {
      console.log("peer:discovery: ", peer)
    })

    bootNode.on('peer:connect', (peer) => {
      console.log("peer:connect: ", peer)
    })

    bootNode.on('peer:disconnect', (peer) => {
      console.log("peer:disconnect: ", peer)
    })

    bootNode.start((err) => {
      if(err) {
        console.log(err.message)
        process.exit(1)
      } else {
        console.log('Boot Node ready, listening on:')
        bootNodeInfo.multiaddrs.forEach((ma) => {
          console.log(ma.toString())
        })
      }
    })
  }
})
*/

/*
PeerId.createFromJSON(require('./peer-id-dialer'),(err,dialerPeerId) => {

  PeerId.createFromJSON(require('./peer-id-listener'),(err,listenerPeerId) => {

    const listenerPeerInfo = new PeerInfo(listenerPeerId)
    listenerPeerInfo.multiaddrs.add('/ip4/0.0.0.0/tcp/10333')
    var listenerNode = new Libp2pNode({
      peerInfo: listenerPeerInfo
    })

    listenerNode.handle('/eh7/chat', (protocol, conn) => {
      console.log("chat request to listener")
    })

    listenerNode.start((err) => {
//      console.log(err)

      console.log('Listener ready, listening on:')

      listenerPeerInfo.multiaddrs.forEach((ma) => {
        console.log(ma.toString())
      })

      const dialerPeerInfo = new PeerInfo(dialerPeerId)
      dialerPeerInfo.multiaddrs.add('/ip4/0.0.0.0/tcp/0')
      var dialerNode = new Libp2pNode({
        peerInfo: dialerPeerInfo
      })

      dialerNode.start((err) => {
        if(err) {
          console.log(err.message)
          process.exit(1)
        } else {
          console.log('Dialer ready.')
          dialerPeerInfo.multiaddrs.forEach((ma) => {
            console.log(ma.toString())
          })

          console.log('Dialing Listener...')

          dialerNode.dialProtocol(listenerNode.peerInfo,'/eh7/chat',(err,conn) => {
             if(err) console.log(err)
             else {
               console.log("sending tx return")
               pull(
                 pull.values(["hello big"]),
                 conn
               )
              console.log("(dialerNode) dialed to listener '/eh7/chat' -> hello")
            }
          })

        }
      })
    })
  })

})
*/
