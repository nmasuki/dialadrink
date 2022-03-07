const keystone = require('keystone');
const Order = keystone.list('Order');
const ClientNotification = keystone.list('ClientNotification');
const WorkProcessor = require('../helpers/WorkProcessor');
const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Sartuday"];

const messageTemplate = {
    intro: [
        "Happy {dayOfWeek} {firstName}!",
        "Hi {firstName} and a happy {dayOfWeek}!",
        "Happy {dayOfWeek} {firstName} and a lovely evening!",
    ],
    dailyMessage: [
        /*Sunday*/  [],
        /*Monday*/  [],
        /*Tuesday*/ [],
        /*Wednesday*/[],
        /*Thursday*/[],
        /*Friday*/  [],
        /*Sartuday*/[],
    ],
    message: [        
        "We have some great offers on {favoriteDrink} for you!",
        "It's Another wonderful {dayOfWeek} to enjoy {favoriteDrink} with friends.",
        "Are you in the mood for a cold {favoriteDrink}?",
        "It is a terrific day for a {favoriteDrink}.",
        "We have some crazy offers this {dayOfWeek}!",
        "It's a wonderful {dayOfWeek} and we have great offers on {favoriteDrink} just for you.",
        "We have {favoriteDrink} on offer this {dayOfWeek}.",
        "{dayOfWeek} is the best day for a cold {favoriteDrink}.",
        "We know {dayOfWeek}'s are long. Enjoy a bottle of {favoriteDrink} with friends to relax."
    ],
    outro:[
        "Order a bottle right now!",
        "Order now! We will deliver with 30 mins",
        "Order now and enjoy free delivery within Nairobi",
        "Call +254723688108 for quick delivery",
        "Call +254723688108 for swift delivery to your door",
        "Have it delivered right to your door steps",
    ],

    get: function(obj, section){
        if(!messageTemplate[section]) section = 'message';
        return messageTemplate[section][randomInt(0, messageTemplate[section].length - 1)].format(obj).replace(/\s(\W)\s/g, '$1 ')
    },

    getMessage: function(obj){
        var parts = ['intro', 'message', 'outro'];
        var message = '';

        for(var i of parts)
            if(messageTemplate.hasOwnProperty(i))
                message += (message? ' ': '') + messageTemplate[i][randomInt(0, messageTemplate[i].length - 1)].format(obj).replace(/\s(\W)\s/g, '$1 ');

        return message.trim();
    }
}

function getWork(next, done) {
    var fromDate = new Date().addYears(-3);
    var oneWeekAgo = new Date().addDays(-6.9);
    var dayOfWeek = new Date().getDay();
    var weekOfMonth = new Date().getWeekOfMonth();

    Order.model.find({ orderDate: { $gt: fromDate } })
        .deepPopulate('client')
        .exec(function (err, orders) {
            var groupedOrders = orders
                .filter(o => o.orderDate && o.client && (!o.client.lastNotificationDate || o.client.lastNotificationDate <= oneWeekAgo))
                .groupBy(o => o.client._id.toString());

            var clientGroupedOrders = Object.values(groupedOrders).orderBy(o => -o.length);

            var clients = [];
            for (var clientOrders of clientGroupedOrders) {
                var favoriteWeekOrders = Object.values(clientOrders.groupBy(o => o.orderDate.getWeekOfMonth())).orderBy(o => -o.length)[0];
                if (favoriteWeekOrders.length && favoriteWeekOrders[0].orderDate.getWeekOfMonth() == weekOfMonth) {
                    var favoriteDayOrders = Object.values(clientOrders.groupBy(o => o.orderDate.getDay())).orderBy(o => -o.length)[0];
                    if (favoriteDayOrders.length && favoriteDayOrders[0].orderDate.getDay() == dayOfWeek)
                        clients.push(favoriteDayOrders[0].client);
                }

                if (clients.length >= 900)
                    break;
            }

            console.log(`Got ${clients.length} clients to sent daily notifications to...`);
            return next(null, clients, done);
        });
}

function doWork(err, clients, next) {
    if (err)
        return console.warn(err);

    if (clients && clients.length) {
        if (clients.length)
            console.log(clients.length + " client to send daily notifications to..");

        var promises = clients.map(createNotification);
        return Promise.all(promises).then(next);
    } else {
        if (typeof next == "function")
            next();

        return Promise.resolve();
    }
}

function randomInt(min, max) {
    return min + Math.round(Math.random() * (max - min));
}

function randomTrue(probability) {
    return (randomInt(1, 100) % Math.ceil(1 / (probability || 0.5)) == 0);
}

async function createNotification(client) {
    var dayOfWeek = new Date().getDay();
    var obj = Object.assign({
        dayOfWeek: daysOfWeek[dayOfWeek],
        favoriteDrink: (randomTrue() ? await client.getFavouriteDrink : await client.getFavouriteBrand),
        getFavouriteBrand: await client.getFavouriteBrand,
    }, client.toObject());

    var n = new ClientNotification.model({
        client: client,
        scheduleDate: new Date(),
        type: "sms",
        status: 'pending',
        message: {
            title: messageTemplate.get(obj),
            body: messageTemplate.getMessage(obj)
        }
    });

    var sessions = await client.getSessions();
    var webpushTokens = sessions.map(s => s.webpush).filter(t => !!t && t.endpoint);
    var fcmTokens = sessions.map(s => s.fcm).filter(t => !!t);

    //Send push notification to 80% of users with webpush or fcm token. 
    if ((webpushTokens.length || fcmTokens.length) && randomTrue(.80)) {
        n.type = "push"
        n.message.data = {
            buttons: [
                { action: '/checkout?mergeCart=true', title: "Checkout" },
                { action: '/', title: "Todays Offers" }
            ]
        }
    } else {
        n.message.body = `DIALADRINK: ${n.message.body}.`;
        if(!n.message.body.contains('http'))
            n.message.body += '. http://bit.ly/2TCl4MI';
    }
    
    console.log(`'${n.type.toUpperCase()}' to ${client.name}: ${n.message.body}`);
    if (process.env.NODE_ENV == "production")
        return await n.save();    
}

var lastRun = new Date().addDays(-2);
lastRun.setHours(15);

var worker = new WorkProcessor(getWork, doWork);
worker.runRequency = "daily";
worker.lastRun = lastRun;
module.exports = worker;
