var keystone = require('keystone');
var Order = keystone.list('Order');
var ClientNotification = keystone.list('ClientNotification');
var WorkProcessor = require('../helpers/WorkProcessor');
var daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Sartuday"];

function getWork(next, done) {
    var fromDate = new Date().addYears(-1);
    var oneWeekAgo = new Date().addDays(-7);
    var dayOfWeek = new Date().getDay();
    var weekOfMonth = new Date().getWeekOfMonth();

    Order.model.find({ orderDate: { $gt: fromDate } })
        .deepPopulate('client')
        .exec(function (err, orders) {
            var groupedOrders = orders
                .filter(o => o.orderDate && o.client && (!o.client.lastNotificationDate || o.client.lastNotificationDate < oneWeekAgo))
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

                if (clients.length >= 20)
                    break;
            }

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
    return min + Math.round(Math.random() * (max - min + 1));
}

function randomTrue(probability) {
    return (randomInt(1, 100) % Math.ceil(1 / (probability || 0.5)) == 0);
}

var messageTemplates = [
    "DIALADRINK: Hey {firstName}! It's Another wonderful day to enjoy a {favoriteDrink}. Order a bottle right now to enjoy with friends",
    "DIALADRINK: Are you in the mood for a cold {favoriteDrink} {firstName}? Order now! We will deliver with 30 mins",
    "DIALADRINK: It is a terrific day for a {favoriteDrink}. We'll deliver right to your door with no delivery fee within Nairobi",
    "DIALADRINK has some crazy offers this {dayOfWeek} {firstName}! Order a {favoriteDrink} now and enjoy free delivery within Nairobi",
    "DIALADRINK: Hey {firstName}! It's a wonderful {dayOfWeek} and we have great offers on {favoriteDrink} just for you.",
    "DIALADRINK: Hey {firstName}! We have {favoriteDrink} on offer this {dayOfWeek}. Call +254723688108 for quick delivery",
    "DIALADRINK: Hey {firstName}! {dayOfWeek} is the best day for a cold {favoriteDrink}. Call +254723688108 for swift delivery to your door",
    "DIALADRINK: Hey {firstName}! We know {dayOfWeek}'s are usually long. Enjoy a bottle of {favoriteDrink} with friends to relax."
];

async function createNotification(client) {
    var obj = Object.assign({
        dayOfWeek: daysOfWeek[new Date().getDay()],
        favoriteDrink: (randomTrue() ? await client.getFavouriteDrink : await client.getFavouriteBrand)
    }, client.toObject());

    var message = messageTemplates[randomInt(0, messageTemplates.length - 1)].format(obj).replace(/\s(\W)/g, '$1') + '. http://bit.ly/2TCl4MI';

    var date = new Date().toISOString();
    var scheduleDate = new Date(date.substr(0, 10));
    var scheduleTime = date.substr(11).split(":");

    if (scheduleTime[0] > 22 - 3) {
        scheduleTime[0] = 18 - 3;
        scheduleDate = scheduleDate.addDays(1);
    } else if (scheduleTime[0] <= 11 - 3) {
        scheduleTime[0] = 18 - 3;
        scheduleTime[1] = 45;
    }

    var n = new ClientNotification.model({
        client: client,
        scheduleDate: new Date(scheduleDate.toISOString().substr(0, 10) + "T" + scheduleTime.join(":")),
        type: "sms",
        status: 'pending',
        message: {
            body: message.format(client)
        }
    });

    //Make 60% of the message push notifications
    if (randomTrue(.60)) {
        n.type = "push"
        n.message.title = "We have some great offers {firstName}!".format(client);
        n.message.data = {
            buttons: [
                { action: '/checkout?mergeCart=true', title: "Checkout" },
                { action: '/', title: "Todays Offers" }
            ]
        }
    }
    
    console.log(`'${n.type.toUpperCase()}' to ${client.name}: ${message}`);
    if (process.env.NODE_ENV == "production")
        return await n.save();
    
}

var lastRun = new Date().addDays(-2);
lastRun.setHours(15);

var worker = new WorkProcessor(getWork, doWork);
worker.runRequency = "daily";
worker.lastRun = lastRun;
module.exports = worker;
