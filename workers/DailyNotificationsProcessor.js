const keystone = require('keystone');
const Order = keystone.list('Order');
const ClientNotification = keystone.list('ClientNotification');
const WorkProcessor = require('../helpers/WorkProcessor');
const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Sartuday"];
const daylyMessageCounts = [10, 10, 10, 10, 30, 50, 50];

const messageTemplate = {
    intro: [
        "Hi {firstName}",
        "Happy {dayOfWeek} {firstName}!",
        "Happy {dayOfWeek} to you and to all out there!",
        "Hi {firstName} and a happy {dayOfWeek}!",
        "Happy {dayOfWeek} {firstName} and a lovely evening!",
    ],
    dailyMessage: [
        /*Sunday*/[],
        /*Monday*/[
            "The toughest activity of a week starts right from {dayOfWeek} morning. How about glass of {favoriteDrink} for making it through the day?",
            "After a long, hot {dayOfWeek}, few things are more rewarding than a tall, frosty glass of {favoriteDrink}.",
            "We wish you a warm and exciting week ahead. How about a frosty glass of {favoriteDrink} to brighten your week?",
            "Let's start this week with lots of positivity in our hearts! A glass of {favoriteDrink} could be what you need.",
            "Have a glass of {favoriteDrink} and start your week with great enthusiasm.",
            "May this week bring a lot of happiness to you all.",
        ],
        /*Tuesday*/["A glass of {favoriteDrink} sounds like a good idea this evening."],
        /*Wednesday*/[
            "Time to relax with a refreshing {favoriteDrink}!",
        ],
        /*Thursday*/[
            "How about a TBT with a {favoriteDrink}! We got you!",
        ],
        /*Friday*/[
            "Quench your thirst with a sip of cold {favoriteDrink}",
            "Have a glass of {favoriteDrink} and end your week with great enthusiasm.",
            "It's {dayOfWeek}! We made it through this week. How about glass of {favoriteDrink} to celebrate?"
        ],
        /*Sartuday*/[],
    ],
    message: [
        "We have some great offers on {favoriteDrink} for you!",
        "It's Another wonderful {dayOfWeek} to enjoy {favoriteDrink} with friends.",
        "Are you in the mood for a cold glass of {favoriteDrink}?",
        "It is a terrific day for a {favoriteDrink}.",
        "We have some crazy offers this {dayOfWeek}!",
        "It's a wonderful {dayOfWeek} and we have great offers on {favoriteDrink} just for you.",
        "We have {favoriteDrink} on offer this {dayOfWeek}.",
        "{dayOfWeek} is the best day for a cold {favoriteDrink}.",
        "We know {dayOfWeek}'s are long. Enjoy a bottle of {favoriteDrink} with friends to relax."
    ],
    outro: [
        "Order a bottle right now!",
        "Order now! We will deliver with 30 mins",
        "Order now and enjoy free delivery within Nairobi",
        "Call +254723688108 for quick delivery",
        "Call +254723688108 for swift delivery to your door",
        "Have it delivered right to your door steps",
    ],

    get: function (obj, section) {
        if (!messageTemplate[section]) 
            section = 'message';

        var messages = messageTemplate[section] || [];

        if(section == 'message'){
            var dailyMsgs = messageTemplate.dailyMessage[new Date().getDay()] || [];
            messages = messages.concat(dailyMsgs)
        }

        return messages[randomInt(0, messages.length - 1)].format(obj).replace(/\s(\W)\s/g, '$1 ')
    },

    getMessage: function (obj) {
        var parts = ['intro', 'message', 'outro'];
        var message = '';

        for (var i of parts)
            if (messageTemplate.hasOwnProperty(i))
                message += (message ? ' ' : '') + messageTemplate.get(obj, i);

        return message.trim();
    }
}

async function getWork(next, done) {
    var fromDate = new Date().addYears(-3);
    var oneWeekAgo = new Date().addDays(-6.9);
    var dayOfWeek = new Date().getDay();
    var weekOfMonth = new Date().getWeekOfMonth();
    var daylyMessageCount = daylyMessageCounts[dayOfWeek] || 10;

    var orders = await Order.model.find({ orderDate: { $gt: fromDate } }).deepPopulate('client').exec();

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

        if (clients.length >= daylyMessageCount)
            break;
    }

    if (clients.length < daylyMessageCount) {
        console.log(`Got only within week ${weekOfMonth} ${clients.length} clients to sent daily notifications to...`);

        for (var clientOrders of clientGroupedOrders) {
            var favoriteWeekOrders = Object.values(clientOrders.groupBy(o => o.orderDate.getWeekOfMonth())).orderBy(o => -o.length)[0];

            if (favoriteWeekOrders.length) {
                var daydiff = Math.abs(favoriteWeekOrders[0].orderDate.getWeekOfMonth() - weekOfMonth);
                if (daydiff != 0 && daydiff <= 2) {
                    var favoriteDayOrders = Object.values(clientOrders.groupBy(o => o.orderDate.getDay())).orderBy(o => -o.length)[0];
                    if (favoriteDayOrders.length && favoriteDayOrders[0].orderDate.getDay() == dayOfWeek)
                        clients.push(favoriteDayOrders[0].client);
                }
            }

            if (clients.length >= daylyMessageCount)
                break;
        }
    }

    console.log(`Got ${clients.length} clients to sent daily notifications to...`);
    next(null, clients, done);

    return clients;
}

function doWork(err, clients, next) {
    if (err)
        return console.warn(err);

    if (clients && clients.length) {
        if (clients.length)
            console.log(clients.length + " client to send daily notifications to..");

        var promise = new Promise((resolve, reject) => {
            var index = 0;
            (function popNext() {
                if (clients.length) {
                    var client = clients[index++];
                    if (client)
                        return createNotification(client).always(() => popNext());
                }

                console.log(`Done Generating ${index - 1}/${clients.length} daily notifications!`);
                resolve(index);
            })();
        });

        return promise.then(() => {
            if (typeof next == "function")
                next();
        });
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
    if ((webpushTokens.length || fcmTokens.length)) {
        n.type = "push"
        n.message.data = {
            buttons: [
                { action: '/checkout?mergeCart=true', title: "Checkout" },
                { action: '/', title: "Todays Offers" }
            ]
        }
    } else {
        n.message.body = `DIALADRINK: ${n.message.body}.`;
        if (!n.message.body.contains('http'))
            n.message.body += '. http://bit.ly/2TCl4MI';
    }

    //console.log(`'${n.type.toUpperCase()}' to ${client.name}: ${n.message.body}`);
    //if (process.env.NODE_ENV == "production")
    return await n.save(() => {
        client.lastNotificationDate = n.scheduleDate;
        return client.save();
    });
}

var lastRun = new Date().addDays(-2);
lastRun.setHours(15);

var worker = new WorkProcessor(getWork, doWork);
worker.runRequency = "daily";
worker.lastRun = lastRun;
module.exports = worker;
