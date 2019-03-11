require('dotenv').config();
const io = require('socket.io')(80);
const redis = require('redis');
const Push = require('pushover-notifications');
let notify = null;

// Setup the connection to Redis
const redisClient = redis.createClient({
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
    password: process.env.REDIS_PASSWORD,
    db: 0
});

// Setup the connection to Pushover
// Is Pushover enabled?
if (process.env.PUSHOVER_ENABLED === 'true') {
    console.log('Starting pushover...');

    notify = new Push({
        user: process.env.PUSHOVER_USER,
        token: process.env.PUSHOVER_TOKEN,
        onerror: (err) => {
            console.error('Push error', err);
        }
    });
}

// Listen for either a ready state on Redis or an error
redisClient.on('error', err => console.error('Error connecting to redis', err));
redisClient.on('ready', () => {
    console.log('Connected to redis')
});

// Sub to the Redis alerts channel
redisClient.subscribe('alerts');

// Listen for Pub'd messages on Redis
redisClient.on('message', (channel, message) => {
    console.log(channel, message)

    // We have a message on the alerts channel, time to pass it on!
    if (channel === 'alerts') {
        // Pass the message to all sockets listening on the same 'alerts' channel
        io.sockets.emit(channel, message);


        const alert = JSON.parse(message);
        // If the alert is of status 'Error' (an intruder) & Pushover is enabled; send a push notification
        if (alert.status === 'Error' && process.env.PUSHOVER_ENABLED === 'true') {
            notify.send({
                title: `Security Alert`,
                message: `${alert.name}: ${alert.text}`,
                sound: 'magic'
            })
        }
    }
});

// When a new socket connects log out a message
io.on('connection', (socket) => {
   console.log('user connected');
});