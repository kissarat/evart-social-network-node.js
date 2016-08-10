# Evart Social Network
## Требования
Выделенный сервер
* Linux или FreeBSD (используеться /dev/random и libmagic)
* Nginx
* Node.js 4
* MongoDB 3.2 (используеться $lookup)

## Установка
Работает на Mac OS X (рабочая ОС), Debian, FreeBSD. Весь процесс установки можно прочитать в vagrant.sh .
В Vagrant не запускаеться из-за проблем с vboxsf .
Должен быть распакован в папку /usr/local/site/socex .
  Для Debian надо заменить /etc/nginx/nginx.conf файлом server/nginx/nginx.conf и /etc/mongod.conf
  файлом server/mongodb/mongod.conf
```
sudo apt-get install nginx mongodb-org build-essential git libmagic-dev
bash build.sh
```
gulpfile.js - собирает клиент на основании client/index.html и сохраняет в папку app

Картинки и звуки в client.zip на http://www.ex.ua/view/102108796
или https://drive.google.com/file/d/0B7PC5xPswSL6c0FUdjVrc2RmcFU/view?usp=sharing

## Структура
### client - Клиенский код

Marionette.js 3.0, backbone.paginator, backbone.stickit, backbone.validation

* js/data.js - статические данные используемые на клиенте и сервере
* js/common.js - код, которий может запускатся в Web Workers
* js/main.js - дополнение к common.js, запускаемое непосредственно в окне
* js/load.js - загружчик, которий регистрирует agent и загружает язык с languages
* js/database.js - кеш данных, кторий может сохранять в IndexedDB или LocalStorage
* js/socket.js - отвечает за постоянное подключения к серверу

Модуля:
* js/views.js - виджекты, которие не ввошли в другие модлуя
* js/dock.js - нижнее меню
* js/menu.js - боковые меню
* js/user.js - профайл и авторизация
* js/message.js - стена (wall), диолги (dialog), коментарии (comment), чаты и новости
* js/peer.js - WebRTC видео-звонки
* js/geo.js - получение списка городов с ВКонтакте, писалось с расчетом на регионального таргетинга в будущем
* js/file.js - работа с файламы любих типов, в photo.js используеться
* js/video.js - видео (пока только youtube)

### server - Сервер

Mongoose, Twilio для SMS

Написано с нуля с соображений производилельности, читать местами трудно, особенно labiak/web_extensions.js.
Загружает все модуля с папки modules автоматически.

* server.js - точка вхождения (класс Server)
* labiak/web.js - контекст запроса (класс Context)
* labiak/web_extensions.js - часть Context отвественная за обработку результата исполнения контролера.
В частности реализован механизм конвеера обработчиков (что-то похожее на async) который делает код action-на более
декларативным. Для примера см. modules/user.informer
* server.json - настроики сервера
* client.json - настроики сервера и клиента, который передаються клиенту во время загрузки фронт-енда (см modules/agent.POST)
* nginx/config - файлы настроек nginx
* ban.js - сервис добавления в бан nginx/config/blacklist.conf (cм. настройки nginx/config/socex.conf)

Модуля:
* modules/agent.js - регистрация агента (в т.ч. браузера) пользователя
* modules/user.js - работа с профилем, регристрация, вход и просмотр списка всех пользователей
User.type может быть user, group, admin
* modules/list.js - работа со списками друзей и подпищиками групп
* modules/record.js - события пользователя. Реализовано для списка подтверждения в друзья
* modules/message.js - стена (wall), диолги (dialog), коментарии (comment), чаты и новости
* modules/attitude.js - лайки, работает с любой сущностью
* modules/album.js - работа с альбомами
* modules/admin.js - редактирования базы админом, также только-админские методы есть и в других модулях

Другие модуля соотвествуют client/js

### static
На сервере - отдельный диск. Файлы, загружаемые пользователем, сохраняются сначала в static/id, а потом static/md5

### utilities
Здесь собрано много хлама. На работу сервера не влияет.
Генерировал миллионы сообщений, работало сносно

### test
Тестированием всерьез занялся в последнне время, покрыто немного. Старые самопальные тесты были в utilities
Используеться mocha, chai, supertest (http-клиент).
В устанавливаються глобальные перепменные test/bootstrap.test.js в расширяеться модуль assert методами validator,
есть надстройка на async для загрузки данных.

## Другие файлы
* build.sh cоздает необходимые файлы и npm update
* clear.sh удаляет файлы созданые build.sh
* environment.sh включает в $PATH исполняемые файлы с node_modules/.bin
* service.sh скрипт для установки сервера как сервиса в /etc/init.d
* vagrant.sh provision-файл Vagrant. Пробувал разворачивать в Vagrant чтобы можно было использовать разные node_modules,
но не получилось
* .eslintrc настроен стиль кода. Касаеться только сервера

## Описание
Вызовы API начинаються с пути /api/
Если отрыить путь /api/ то можно увидеть схему всех данных.
Для осуществление любых операций для начала надо зарегистрировать agent (POST /api/agent) и получить 40-ка символьный
auth (Access Token), который нужно передавать при каждом запросе загаловком, параметром или cookie.

Каждая сущность имеет поля created, time в формате ISO 8601. ObjectID состоит из номера сущности (1 байт), времени в
наносекундах (8 байт) и случайное число (3 байта).
Вызови API также можно осуществлять начиная с пути /api-cache/, если их можно кешировать (например информация о файлах).
Кешировать также можно на клиенте с помощью методов App.local реализированых в client/js/database.js . На данный момент
кеш сохраняеться только в памьяти, но если реализовать механизм инвалидации, то может сохраняться и постоянно.
