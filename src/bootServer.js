'use strict'

const Libp2pNode = require('./libp2p-bundle.js')
const PeerInfo = require('peer-info')
const PeerId   = require('peer-id')
const pull = require('pull-stream')
const Pushable = require('pull-pushable')
const p = Pushable()
  
let bootNode
let peers = []


/*
const readline = require('readline')

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

rl.question('What do you think of Node.js? ', (answer) => {
  console.log(`You entered: ${answer}`);
  rl.close();
})
*/

const bootNode0Id = require('./peer-id-bootServer0')

PeerId.createFromJSON(bootNode0Id,(err,bootNodeId) => {
  if(err) console.log(err)
  else {

    const bootNodeInfo = new PeerInfo(bootNodeId)
    bootNodeInfo.multiaddrs.add('/ip4/10.0.0.4/tcp/10333')
    bootNode = new Libp2pNode({
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

      peers.push(peer)


      bootNode.dialProtocol(peer.id, '/eh7/cmd/0.0.1', (err, conn) => {
        var cmd = "gpio -g read 21"
//        var cmd = "gpio -g write 21 0"
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

const switchBoilerOn = () => {
  bootNode.dialProtocol(peers[0].id, '/eh7/cmd/0.0.1', (err, conn) => {
    var cmd = "gpio -g write 21 1"
    console.log("test dial to '/eh7/cmd/0.0.1' :: "  + cmd)
    pull(
      pull.values([cmd]),
      conn,
      pull.collect((err, data) => {
        if (err) { throw err }
        console.log('data received: ', data.toString())
        getBoilerPowerStatus() 
        console.log("Boiler is 'on'.")
      })
    )
  })
}

const switchBoilerOff = () => {
  bootNode.dialProtocol(peers[0].id, '/eh7/cmd/0.0.1', (err, conn) => {
//    console.log(param.test)
    var cmd = "gpio -g write 21 0"
    console.log("test dial to '/eh7/cmd/0.0.1' :: "  + cmd)
    pull(
      pull.values([cmd]),
      conn,
      pull.collect((err, data) => {
        if (err) { throw err }
        console.log('data received: ', data.toString())
        getBoilerPowerStatus() 
        console.log("Boiler is 'off'.")
      })
    )
  })
}

const getBoilerPowerStatus = () => {
  bootNode.dialProtocol(peers[0].id, '/eh7/cmd/0.0.1', (err, conn) => {
    var cmd = "gpio -g read 21"
    console.log("test dial to '/eh7/cmd/0.0.1' :: "  + cmd)
    pull(
      pull.values([cmd]),
      conn,
      pull.collect((err, data) => {
        if (err) { throw err }
        console.log('data received: ', data.toString())

        var boilerStatus = "off"
        const returnStatus = data.toString()
        if(returnStatus == 1) boilerStatus = 'on'
        console.log("The boiler in '" + boilerStatus + "'.")
      })
    )
  })
}


const server = require('./ejsServer.js')

server.route({
  method: 'GET',
  path: '/1',
  handler: (request, h) => {
    console.log(1)
    return 'Hello World NUMBER 1!';
  }
})

const controlPostHandler = (request, h) => {
  let param = request.payload
  Object.keys(param).forEach(function (name) {
    var value = param[name]
    console.log(name + "=" + value)
  })
//  if(typeof param.test !== 'undefined')
//    console.log(param.test)
  return h.view('control', {})
}

const controlGetHandler = (request, h) => {
  let param = request.query
  Object.keys(param).forEach(function (name) {
    var value = param[name]
    console.log(name + "=" + value)
  })

  if(typeof peers[0] !== 'undefined'){
   if(param.boiler === 'status')
    getBoilerPowerStatus()
   else if(param.boiler === 'on')
    switchBoilerOn()
   else if(param.boiler === 'off')
    switchBoilerOff()
   else
     console.log("Loading, do nothing!!!")
  } else 
    console.log("No peer defined!!!")
  

  return h.view('control', {})
}

server.route({ method: 'GET', path: '/', handler: controlGetHandler })
server.route({ method: 'POST', path: '/', handler: controlPostHandler })
