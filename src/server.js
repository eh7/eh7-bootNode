const Path = require('path')
const Hapi = require('@hapi/hapi')
const Inert = require('@hapi/inert')
//const Vision = require('@hapi/vision')
//const Ejs = require('ejs')

const init = async () => {
    const server = Hapi.server({
      port: 3000,
      host: 'localhost',
      routes: {
        files: {
           relativeTo: Path.join(__dirname, '../public')
        }
      } 
    });
    await server.register(Inert)
//    await server.register(Vision)
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
