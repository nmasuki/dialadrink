var WebSocket = require('ws');
var LocalStorage = require('../helpers/LocalStorage');
var ls = new LocalStorage('ws-messages');
var fs = require('fs');

function getWSSConfigs() {
    var wssConfigs = require('../../data/wsconfig');
    var config = {};

    if (wssConfigs.perMessageDeflate)
        config.perMessageDeflate = wssConfigs.perMessageDeflate;

    var certFiles = {
        privateKey: wssConfigs.WebSocketServer.privateKey || 'ssl-cert/privkey.pem',
        certificate: wssConfigs.WebSocketServer.certificate || 'ssl-cert/fullchain.pem'
    };

    if (!fs.existsSync(certFiles.privateKey) || !fs.existsSync(certFiles.certificate)) {
        console.warn("WSS:", "Missing file '%s', '%s'", certFiles.privateKey, certFiles.certificate);
        config.port = wssConfigs.WebSocketServer.port;
        return config;
    }

    console.info("WSS:", 'Loading certificate files [%s, %s]', certFiles.privateKey, certFiles.certificate);
    // read ssl certificate
    var privateKey = fs.readFileSync(certFiles.privateKey, 'utf8');
    var certificate = fs.readFileSync(certFiles.certificate, 'utf8');

    var credentials = {
        key: privateKey,
        cert: certificate
    };

    //pass in your credentials to create an https server
    config.server = require('https').createServer(credentials);
    config.server.listen(wssConfigs.WebSocketServer.port || 8080);

    if (wssConfigs.perMessageDeflate)
        config.perMessageDeflate = wssConfigs.perMessageDeflate;

    return config;
}

var CONFIG = Object.assign({
    RetryCount: 5,
    RetryWait: 10000
}, getWSSConfigs());

function isJSONString(text){
    if (/^[\],:{}\s]*$/.test(text.replace(/\\["\\\/bfnrtu]/g, '@').replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g, ']').replace(/(?:^|:|,)(?:\s*\[)+/g, ''))) {
        return true;
    } else {
        return false;
    }
}

function processIncoming(message) {
    try {
        if (isJSONString(message)) {
            var obj = JSON.parse(message);
            switch (obj.cmd || obj.info) {
                case 'number':
                    this.phone = obj.phone;
                    break;
                case 'message_status':
                    console.log("WSS:", "Message Status:" + obj.status, obj.msgid);
                    var data = ls.get(obj.msgid);
                    
                    if(data){
                        data.statusLog = data.statusLog || [];
                        data.status = obj.status;
                        ls.save(data);
                    }

                    break;
            }
        }else{
            console.log("WSS:", "Recieved message: " + text);
        }
    } catch (e) {
        console.error("WSS:", "Message Error!", message, e);
    }
}

function sendWSMessage(dest, msg, msgid, attempts) {
    attempts = attempts || 0;
    msgid = msgid || Array(10).join('x').split('x')
            .map(x => String.fromCharCode(Math.ceil(65 + Math.random() * 25))).join('');
    var clients = Array.from(self.server.clients).filter(c => client.readyState === WebSocket.OPEN);

    if (attempts > CONFIG.RetryCount) {
        console.warn(`Delivery failed after ${attempts} attempts`);
        return Promise.reject(`Delivery failed after ${attempts} attempts`);
    }

    var client = clients[attempts++ % clients.length];
    var retrySendWSMessage = function (err) {
        console.warn((err || "Unknown Error!") + ". Retrying in %d seconds. Attempt %d of %d", attempts * CONFIG.RetryWait / 1000, attempts, CONFIG.RetryCount);
        return new Promise((fulfill, reject) => {
            setTimeout(() => sendWSMessage(dest, msg, msgid, attempts).then(fulfill).catch(reject), CONFIG.RetryWait * attempts);
        });
    };

    if (!clients.length)
        return retrySendWSMessage("No client found!");

    var payload = {
        id: msgid,
        cmd: 'message',
        status: "INITIALIZED",
        data: {
            msgid: msgid,
            text: msg,
            dest: dest,
            inbound: false,
            sending: true,
            created_at: new Date().toISOString(),
            attempts: attempts
        }
    };

    ls.save(payload);

    console.info("Sending message to: %s '%s'", dest, msg);
    return new Promise((fulfill, reject) => {
        client.send(JSON.stringify(payload), function (err) {
            if (err)
                return retrySendWSMessage(err).then(fulfill).catch(reject);

            fulfill(payload.data);
        });
    });
}

var wss = global.wss || (global.wss = new WebSocket.Server(CONFIG));

// Broadcast to all.
wss.broadcast = function broadcast(payload) {
    wss.clients.forEach(function each(client) {
        if (client.readyState === WebSocket.OPEN)
            return new Promise((fulfill, reject) => {
                client.send(JSON.stringify(payload), function (err) {
                    if (err)
                        reject(err);
                    else
                        fulfill(payload.data);
                });
            });
    });
};

wss.on('connection', function connection(ws, req) {    
    ws.clientIp = (req.headers['x-forwarded-for'] || '').split(',')[0] ||
        req.connection.remoteAddress ||
        req.socket.remoteAddress;

    console.log("WSS:", "Client connected! ", ws.clientIp);
    ws.on('pong', function heartbeat() {
        this.isAlive = true;
    });

    ws.on('message', function incoming(message) {
        console.info("WSS:", "Message received: '%s'", message);
        if (typeof wss.processIncoming == "function")
            wss.processIncoming.call(this, message);
        processIncoming.call(this, message);
    });
});

var interval = setInterval(function ping() {
    wss.clients.forEach(function each(ws) {
        if (ws.isAlive === false)
            return ws.terminate();

        ws.isAlive = false;
        ws.ping(function noop() {
            console.log("ping!");
        });
    });
}, 30000);

module.exports = {
    server: wss,
    sendSMS: sendWSMessage
};