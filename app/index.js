const io = require('socket.io')(80);
const redis = require('redis');
require('dotenv').config()

const redisClient = redis.createClient({
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
    password: process.env.REDIS_PASSWORD,
    db: 0
});

const pub = redis.createClient({
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
    password: process.env.REDIS_PASSWORD,
    db: 0
});

redisClient.on('error', err => console.error('Error connecting to redis', err));
redisClient.on('ready', () => {
    console.log('Connected to redis')
});

const connectedSockets = [];

redisClient.on('message', (channel, message) => {
    console.log(channel, message)

    if (channel === 'alerts') {
        io.sockets.emit(channel, message)
    }
});

redisClient.subscribe('alerts');


io.on('connection', (socket) => {
   console.log('user connected');

   connectedSockets.push(socket);
});