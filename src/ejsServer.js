const Path = require('path')
const Hapi = require('@hapi/hapi')
const Inert = require('@hapi/inert')
const Vision = require('@hapi/vision')
const Ejs = require('ejs')

/*
const Bcrypt = require('bcrypt')

const users = [
  {
    username: 'john',
    password: '$2a$10$iqJSHD.BGr0E2IxQwYgJmeP3NvhPrXAeLSaGCj6IR/XU5QtjVu5Tm',   // 'secret'
    name: 'John Doe',
    id: '2133d32a'
  }
]
*/

const server = Hapi.server({
  port: 3000,
  host: 'localhost',
  routes: {
    files: {
      relativeTo: Path.join(__dirname, '../public')
    }
  }
})

const rootHandler = (request, h) => {
  return h.view('index', {
    title: 'ejs | Hapi ' + request.server.version,
    message: 'Hello Ejs!'
  })
}

const controlPostHandler = (request, h) => {
  let param = request.payload 
  if(typeof param.test !== 'undefined')
    console.log(param.test)
  return h.view('control', {})
}

const controlHandler = (request, h) => {
  let param = request.query || request.payload 
  if(typeof param.boiler !== 'undefined')
    console.log(param['boiler'])
  return h.view('control', {
    title: 'ejs | Hapi ' + request.server.version,
    message: 'Hello Ejs!'
  })
}

const init = async () => {
    await server.register([Vision,Inert])
    server.views({
      engines: { ejs: Ejs },
      relativeTo: __dirname,
      path: '../ejs'
    })
//    server.route({ method: 'GET', path: '/', handler: rootHandler })
    server.route({ method: 'GET', path: '/', handler: controlHandler })
    server.route({ method: 'POST', path: '/', handler: controlPostHandler })
    server.route({
        method: 'GET',
        path: '/{param*}',
        handler: {
            directory: {
                path: '.',
                redirectToSlash: true
            }
        }
    })
    server.events.on('response', function (request) {
      console.log(request.info.remoteAddress + ': ' + request.method.toUpperCase() + ' ' + request.path + ' --> ' + request.response.statusCode)
    })
    await server.start()
    console.log('Server running on %s', server.info.uri);
}
process.on('unhandledRejection', (err) => {
    console.log(err);
    process.exit(1);
})

init()
