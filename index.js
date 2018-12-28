// Dependencies
var http = require('http')
var https = require('https')
var url = require('url')
var StringDecoder = require('string_decoder').StringDecoder
var config = require('./config')
var fs = require('fs')

// Instantiate the HTTP server
var httpServer = http.createServer(function(req, res){
   unifiedServer(req,res)
})

// Start the server
httpServer.listen(config.httpPort, function(){
    console.log("Server is listening on port "+config.httpPort+" in "+config.envName+" mode")
})

// Instantiate the HTTPS server
var httpsServerOptions = {
    'key': fs.readFileSync('./https/key-pem'),
    'cert': fs.readFileSync('./https/cert.pem')
}
var httpsServer = https.createServer(httpsServerOptions, function(req, res){
    unifiedServer(req,res)
 })

// Start the https server
httpsServer.listen(config.httpsPort, function(){
    console.log("Server is listening on port "+config.httpsPort+" in "+config.envName+" mode")
})

// All the server logic for both the http and https server
var unifiedServer =  function(req,res){
    // Get the url and parse it
    var parseUrl = url.parse(req.url, true)

    // Get the path
    var path = parseUrl.pathname
    var trimmedPath = path.replace(/^\/+|\/+$/g, '')

    // Get the query string as an objetc
    var queryStringObject = parseUrl.query

    // Get the HTTP method
    var method = req.method.toLowerCase()

    // Get the headers ad an object
    var headers = req.headers

    // Get the payload, if any
    var decoder = new StringDecoder('utf-8')
    var buffer = ''
    req.on('data',function(data){
        buffer += decoder.write(data)
    })
    req.on('end',function(){
        buffer += decoder.end()

        // Choose the handler this request should go to. IF one is not found, use the notFound handler
        var chosenHandler = typeof(router[trimmedPath]) !== 'undefined' ? router[trimmedPath] : handlers.notFound

        // Construct the data object to send to the handle
        var data = {
            'trimmedPath': trimmedPath,
            'queryStringObject': queryStringObject,
            'method': method,
            'headers': headers,
            'payload': buffer
        }

        // Route the request to the handler specified in the router
        chosenHandler(data, function(statusCode, payload){
            // Use the status code called back by the handler, or default to 200
            statusCode = typeof(statusCode) == 'number' ? statusCode : 200

            // Use the payload called back by the handler, or default to empty object
            payload = typeof(payload) == 'object' ? payload : {}

            // Convert the payload to a string
            var payloadString = JSON.stringify(payload)

            // Return the response
            res.setHeader('Content-Type','application/json')
            res.writeHead(statusCode)
            res.end(payloadString)

            // Log the request path
            console.log("Returning this response: ",statusCode, payloadString)
        })
    })
}

// Define the handlers
var handlers = {}

handlers.hello = function(data,callback){
    callback(200, {'message': 'Welcome to node js API'})
}

// NOt found handler
handlers.notFound = function(data,callback){
    callback(404)
}

// Define a request router
var router = {
    'hello': handlers.hello
}
