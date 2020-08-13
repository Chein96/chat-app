const socket = io();

// Elements
$createButton = document.querySelector('#create-button');
$joinButton = document.querySelector('#join-button');
$login = document.querySelector('#login');

// Templates
const roomsTemplate = document.querySelector('#join-template').innerHTML;
const createTemplate = document.querySelector('#create-template').innerHTML;

$createButton.addEventListener('click', () => {
    const html = Mustache.render(createTemplate);
    $login.innerHTML = html;
});

socket.emit('home', (error) => {
    if(error){
        console.log(error);
    }
});

socket.on('current-rooms', (rooms) => {
    if(rooms.length === 0){
        return console.log('No rooms found.');
    }

    $joinButton.removeAttribute('disabled');
    $joinButton.addEventListener('click', () => {
        const html = Mustache.render(roomsTemplate, {
            rooms
        });
        $login.innerHTML = html;
    });
});
