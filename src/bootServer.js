'use strict'

const Libp2pNode = require('./libp2p-bundle.js')
const PeerInfo = require('peer-info')
const PeerId   = require('peer-id')
const pull = require('pull-stream')
const Pushable = require('pull-pushable')
const p = Pushable()

const bootNode0Id = require('./peer-id-bootServer0')

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
      pull(
        p,
        conn
      )

      pull(
        conn,
        pull.map((data) => {
          return data.toString('utf8').replace('\n', '')
        }),
        pull.drain(console.log)
      )

      process.stdin.setEncoding('utf8')
      process.openStdin().on('data', (chunk) => {
        var data = chunk.toString()
        p.push(data)
      })
    })

    bootNode.on('peer:discovery', (peer) => {
      console.log("peer:discovery: ", peer.id.toB58String())
    })

    bootNode.on('peer:connect', (peer) => {
      console.log("peer:connect: ", peer.id.toB58String())
//      bootNode.pubsub.publish('info',Buffer.from(`hello from ${peer.id.toB58String()}`),(err) => {if(err) console.log(err)})

      bootNode.dialProtocol(peer.id, '/eh7/cmd/0.0.1', (err, conn) => {
        var cmd = "gpio -g read 21"
        console.log("test dial to '/eh7/cmd/0.0.1' :: "  + cmd)
        pull(
          pull.values([cmd]),
          conn,
          pull.collect((err, data) => {
            if (err) { throw err }
            console.log('data received: ', data.toString())
          })
        )
      })
    })

    bootNode.on('peer:disconnect', (peer) => {
      console.log("peer:disconnect: ", peer.id.toB58String())
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
        bootNode.pubsub.subscribe('info',(msg) => {
          console.log(`PUBSUB) -> recieved:  ${msg.data.toString()}`)
        })
        console.log("Node listening on 'info' pubsub channel.")
      }
    })
  }
})
