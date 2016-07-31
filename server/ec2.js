var http = require('http'); // Завантаження модуль HTTP

// Створення web-серверу із задаванням функції зворотнього виклику
var server = http.createServer(function (req, res) {
    console.log('Початок обробки запиту');
    // Передаємо код відповіді і заголовки
    res.writeHead(200, {
        'Content-Type': 'text/plain; charset=UTF-8'
    });
    res.end('Тіло відповіді');
});

// Запуск web-серверу
server.listen(1991, "127.0.0.1", function () {
    console.log('Cервер запущено за адресою http://127.0.0.1:1991/');
});
