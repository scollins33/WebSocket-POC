// helper function because yes
function logit(it) {
    console.log(it);
}

// require in everything we need
/*
    express = standard routing
    websocket = handles the websocketing
    http = overall http server, needed since you have to handle the upgrade to the 'ws://' protocol
    path = because filepaths
 */
const express = require('express');
const WebSocketServer = require('websocket').server;
const http = require('http');
const path = require('path');

// port for the server
const PORT = 3000;

// set up your express app then create the HTTP server with express app as your callback
let app = express();
let server = http.createServer(app);

// standard route to serve the base client page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, './client.html'));
});

// start the server by listening to the set PORT
server.listen(PORT, () => {
    logit(`Server running and listening on port ${PORT}`);
});


// create your websocket server using the HTTP server
const wsServer = new WebSocketServer({
    httpServer: server
});

// websocket array to manage all connections
let wsConnections = [];

// listen for websocket requests
wsServer.on('request', (request) => {
    // create a connection when accepting the websocket request
    let connection = request.accept(null, request.origin);
    // add the connection to the array
    wsConnections.push(connection);

    // log that the connection happened
    logit(`${connection.remoteAddress} connected using ${connection.webSocketVersion}`);

    // immediately send a message to the client using the new connection
    connection.sendUTF(JSON.stringify({
        type: 'welcome',
        msg: 'Welcome to the server! You have joined a new room'
    }));

    // set up the listener for messages from the client connection
    connection.on('message', (message) => {
        logit(`Raw message: ${message}`);
        logit(`Parsed message: ${JSON.parse(message)}`);
        // need to use the utf8Data section - since we stringify JSON you need to parse it
        logit(JSON.parse(message.utf8Data).msg);

        // send a message back to the client connection saying we get the message
        // this is unnecessary but proves the 2 way connection - at this point you're emulating the Request/Response paradigm
        // send UTF of a stringfied JSON object
        connection.sendUTF(
            JSON.stringify(
                {
                    type: 'info',
                    msg: 'I got your message'
                }
            )
        );
    });

    // listener for the connection closer
    connection.on('close', function () {
        // log we're closing
        console.log(connection.remoteAddress + " disconnected");

        // find the index value in the websocket array
        let index = wsConnections.indexOf(connection);

        // remove that connection from the websocket array
        if (index !== -1) {
            // remove the connection from the pool
            wsConnections.splice(index, 1);
        }
    })
});