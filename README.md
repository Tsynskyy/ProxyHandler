# Proxy Handler

Инструменты для отслеживания, управления и настройки HTTP прокси для работы с двумя типами устройств:

1. **Резидент роутеры**: Устройства, которые подключаются к интернету через проводное соединение.
2. **4G/5G роутеры**: Устройства, которые используют SIM-карту и мобильные сети для подключения к интернету.

## Запуск прокси используя Playwright

Скрипт `launch.js` принимает на вход полную строку прокси (или ее часть, если ее можно найти в файле `Proxies.txt`). Используя библиотеку Playwright, создается временный образ браузера, который использует заданный прокси. Скрипт выполняет следующие задачи:

1. **Создание сессии браузера**: С помощью Playwright создается новый браузер с указанными параметрами прокси.

2. **Открытие страниц**:
   - **Страница веб-интерфейса роутера**: Открывается страница веб-интерфейса роутера и автоматически используется заданный пароль для прохождения этапа логина (по умолчанию admin).
   - **Проверка интернет-соединения**: Открываются сайты `speedtest.net`, `2ip.ru` и `dev-null.su`.

3. **Обработка ошибок**: На каждом этапе проверяется успешность действия и, в случае ошибки, выводится ее описание с возможной причиной.

## Проверка прокси на работоспособность

Скрипт `check.js` предназначен для проверки доступности интернета через прокси-серверы. Он принимает на вход список прокси-серверов из файла и выполняет следующие шаги:

1. **Проверка доступности интернета**:
   - Отправляется запрос на сайт `mail.ru`.
   - Если запрос успешен, возвращается сообщение о работоспособности прокси.
   
2. **Проверка неоплаченных услуг**:
   - Если запрос на `mail.ru` неудачен, отправляется запрос на страницу `dev-null.su`, которая указывает на неоплаченные услуги связи.
   - Если запрос на `dev-null.su` успешен, возвращается сообщение о неоплаченных услугах.

3. **Проверка доступности веб-интерфейса роутера**:
   - Если оба предыдущих запроса неудачны, проверяется доступность веб-интерфейса роутера.
   - Если веб-интерфейс доступен, возвращается сообщение о том, что интернет отсутствует.
   - В случае недоступности веб-интерфейса возвращается сообщение о недоступности прокси (не учитывается случай, когда страница веб-интерфейса не соответствует порту).
  
4. **Обработка ошибок**: На каждом этапе проверяется успешность действия и, в случае ошибки, выводится ее описание с возможной причиной.

## Перезагрузка прокси

Скрипт `reboot.js` предназначен для перезагрузки прокси-серверов. Он принимает на вход список прокси-серверов из файла и выполняет следующие шаги:

1. **Создание сессии браузера**: С помощью Playwright создается новый браузер в `headless` режиме (без графического интерфейса) с указанными параметрами прокси. Скрипт выполняет автоматический ввод пароля для входа в веб-интерфейс роутера.

2. **Переход на страницу перезагрузки**: После успешного входа скрипт переходит на страницу перезагрузки роутера.

3. **Отправка запроса на перезагрузку**: Скрипт отправляет запрос на перезагрузку роутера.

4. **Обработка ошибок**: На каждом этапе проверяется успешность действия и, в случае ошибки, выводится ее описание с возможной причиной.

## Прочий функционал

В репозитории также находятся функции для:
1. Получения, отправки и чтения сообщений 4G/5G роутеров.
2. Получения, отправки и чтения USSD кодов 4G/5G роутеров.
3. Чтения логина и пароля из веб-интерфейса резидент роутера. Функция извлекает значения полей "PAP/CHAP username" и "PAP/CHAP password" на странице настроек WAN интерфейса.
4. Проверки скорости соединения и пинга прокси-сервера с использованием библиотеки `speedtest`.
