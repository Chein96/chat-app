const path = require('path');
const http = require('http');
const express = require('express');
const socketio = require('socket.io');
const Filter = require('bad-words');
const { generateMessage, generateLocationMessage } = require('./utils/messages');
const { addUser, removeUser, getUser, getUsersInRoom, getRooms } = require('./utils/users');

const app = express();
const server = http.createServer(app);
const io = socketio(server);

const port = process.env.PORT || 3000;
const publicDirectoryPath = path.join(__dirname, '../public');

app.use(express.static(publicDirectoryPath));

io.on('connection', (socket) => {
    console.log('New WebSocket connection');

    socket.on('home', (callback) => {
        socket.emit('current-rooms', getRooms());
        callback();
    });

    socket.on('join', (options, callback) => {
        const { error, user } = addUser({ id: socket.id, ...options});

        if(error) {
            return callback(error);
        }

        const { username, room } = user;
        socket.join(room);

        socket.emit('message', generateMessage('Admin', 'Welcome!'));
        socket.broadcast.to(room).emit('message', generateMessage('Admin', `${username} has joined!`));

        io.to(room).emit('roomData', {
            room,
            users: getUsersInRoom(room)
        });

        callback();
    });

    socket.on('sendMessage', (message, callback) => {
        const { username, room } = getUser(socket.id);
        const filter = new Filter();

        if(filter.isProfane(message)){
            return callback('Profanities are not allowed!');
        }

        io.to(room).emit('message', generateMessage(username, message));
        callback();
    });

    socket.on('sendLocation', ({ latitude, longitude }, callback) => {
        const { username, room } = getUser(socket.id);
        io.to(room).emit('locationMessage', generateLocationMessage(username, `https://google.com/maps?q=${latitude},${longitude}`));
        callback();
    });

    socket.on('disconnect', () => {
        const user = removeUser(socket.id);

        if(user) {
            const { username, room } = user;
            io.to(room).emit('message', generateMessage('Admin', `${username} has left!`));

            io.to(room).emit('roomData', {
                room,
                users: getUsersInRoom(room)
            });
        }
    });
});

server.listen(port, () => {
    console.log(`Server is live on port ${port}.`);
});