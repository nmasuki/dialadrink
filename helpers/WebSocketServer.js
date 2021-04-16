var WebSocket = require('ws');
var ls = require('../helpers/LocalStorage').getInstance('ws-messages');
var CONFIG = require('../../data/wsconfig').getConfigs();
var keystone = require('keystone');

// WebSocket Server    
var wss;

try{
    wss = global.wss || (global.wss = new WebSocket.Server(CONFIG.WebSocketServer));
        
    // Broadcast to all.
    wss.broadcast = function broadcast(payload) {
        wss.clients.forEach(function each(client) {
            if (client.readyState === WebSocket.OPEN)
                return new Promise((resolve, reject) => {
                    client.send(JSON.stringify(payload), function (err) {
                        if (err)
                            return reject(err);

                        resolve(payload.data);
                    });
                });

            return Promise.resolve();
        });
    };

    wss.on("error", function(error){
        var ws = new WebSocket("ws://localhost:" + error.port);
        wss.clients = [ws];
        wss.user = {appPermissions :["sms"]};    
    });

    wss.on('connection', function connection(ws, req) {    
        ws.clientIp = ((req.headers['x-forwarded-for'] || '').split(',')[0] ||
            req.connection.remoteAddress ||
            req.socket.remoteAddress || '').trim(':f');

        console.log("WSS:", "Client connected! ", ws.clientIp);
        ws.on('pong', function heartbeat() { this.isAlive = true; });

        ws.on('message', function incoming(message) {
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
            ws.ping(function noop() {});
        });
    }, 30000);

} catch(e){
    console.log("Error creating WebSocketServer!!!", e);
}

function isJSONString(text){
    if (typeof text == "string" && /^[\],:{}\s]*$/.test(text.replace(/\\["\\\/bfnrtu]/g, '@').replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g, ']').replace(/(?:^|:|,)(?:\s*\[)+/g, ''))) {
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
                case 'user':
                    var auth = new Buffer.from(obj.data, 'hex').toString().split(":");          
                    console.log("WSS: User details:", auth.join(', '));  
                    this.phone = auth[0];
                    this.pwd = auth[1];

                    keystone.list('AppUser').model.findOne({phoneNumber: this.phone})
                        .exec((err, user) => {
                            console.log("WSS: Found user:", user.name.first, user.name.last);
                            this.user = user;

                            var clients = Array.from(wss.clients);
                            var activeClients = clients.filter(c => c.readyState === WebSocket.OPEN);
                            var authorizedClients = activeClients.filter(c => c.user && c.user.accountType.contains("office admin"));

                            console.log(
                                "WSS: Clients: " + clients.length,
                                "Active:", activeClients.length,
                                "Authorized:", authorizedClients.length
                            );

                        });

                    break;
                case 'number':
                    this.phone = obj.data;
                    break;
                case 'send_message':
                    sendWSMessage(obj.phone, obj.msg);
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
            console.log("WSS:", "Recieved message: " + message);
        }
    } catch (e) {
        console.error("WSS:", "Message Error!", message, e);
    }
}

function sendWSMessage(dest, msg, msgid, attempts) {
    attempts = (attempts || 0) + 1;
    msgid = msgid || Array(32).join('x').split('x').map(x => String.fromCharCode(Math.ceil(65 + Math.random() * 25))).join('');
        
    var payload = ls.get(msgid) || {
        _id: msgid,
        cmd: 'message',
        status: "INITIALIZED",
        activities: [],
        attempts: attempts,
        data: {
            msgid: msgid,
            text: msg,
            dest: dest,
            inbound: false,
            sending: true,
            created_at: new Date().toISOString(),            
        }
    };

    payload.activities = payload.activities || [{created_at: new Date().toISOString(), status:payload.status}];
    payload.attempts = attempts;
    ls.save(payload); 
    
    var retrySendWSMessage = function (err) {
        var errMsg;
        if (attempts > CONFIG.RetryCount) {
            errMsg = `Delivery failed after ${attempts-1} attempts`;
            payload.status = "TERMINAL_FAILURE";
            payload.activities.push({created_at: new Date().toISOString(), status:payload.status, error: errMsg});
            ls.save(payload);

            return Promise.reject(errMsg);
        }   

        errMsg = (err || "Unknown Error") + "! " +
            `Retrying in ${attempts * CONFIG.RetryWait / 1000.0} seconds. ` +
            `Attempt ${attempts} of ${CONFIG.RetryCount}`;

        console.warn("WSS:", errMsg);
        payload.status = "RETRYABLE_FAILURE";          
        payload.activities.push({created_at: new Date().toISOString(), status:payload.status,  error: errMsg});
        ls.save(payload);

        return new Promise((fulfill, reject) => {
            setTimeout(() => sendWSMessage(dest, msg, msgid, attempts).then(fulfill).catch(), CONFIG.RetryWait * attempts);
        });
    };

    if(!wss) return retrySendWSMessage("WSS not set!");    

    var clients = Array.from(wss.clients)
        .filter(c => c.readyState === WebSocket.OPEN && c.user && c.user.accountType.contains("office admin"));

    payload.attempts = attempts;
    payload.status = "PROCESSING";

     if (!clients.length)
        return retrySendWSMessage("No client found!");
               
    var client = clients[attempts % clients.length];
    console.info("Sending message to:", dest, msg);

    return new Promise((fulfill, reject) => {
        client.send(JSON.stringify(payload), function (err) {
            if (err){
                payload.activities.push({created_at: new Date().toISOString(), status:payload.status,  error: err});
                ls.save(payload);

                return retrySendWSMessage(err).then(fulfill).catch(reject);
            } else {
                payload.status = "SUCCESS";
                payload.activities.push({created_at: new Date().toISOString(), status:payload.status});
                ls.save(payload);                
            }
                
            fulfill(payload.data);
        });
    });
}

//Retry sending pending msgs
var pendingMsgs = ls.getAll().filter(d => d.status == 'INITIALIZED' || d.status == 'RETRYABLE_FAILURE');
if(pendingMsgs.length)
    pendingMsgs.forEach(d => d.data && sendWSMessage(d.data.dest, d.data.text, d.data.msgid, d.attempts).catch(console.error));

module.exports = {
    server: wss,
    sendSMS: sendWSMessage
};