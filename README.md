# Studichan — каталог университетов мира

React-сайт и Node.js/Express API с базой PostgreSQL. Проект рассчитан на один
Render Web Service: фронтенд и `/api` работают на одном домене.

## Что уже настроено

- PostgreSQL вместо временной SQLite-базы;
- автоматическое создание таблиц при запуске;
- `render.yaml`, который создаёт сайт и базу в одном регионе Render;
- безопасное хранение паролей в bcrypt-хешах;
- вход и регистрация через Google OAuth 2.0;
- скрипт для сбора информации только с заранее одобренных официальных сайтов;
- каталог из 389 университетов: Казахстан, Китай и Гонконг, США, Европа и
  другие страны (Канада, Австралия, Япония, Корея, Сингапур, Турция, ОАЭ, Россия).

## Каталог вузов: откуда данные и как их менять

| Файл | Что в нём |
| --- | --- |
| `prisma/data/universities.json` | Исходный китайский каталог (115 вузов, старый формат) |
| `prisma/data/catalog/*.json` | Остальные вузы: `kazakhstan`, `china` (новые китайские и Гонконг), `usa`, `europe`, `world` |
| `prisma/data/enrichment.json` | Собирается автоматически: место в QS 2026, фото, координаты, год основания, число студентов |
| `src/catalog-config.js` | Страны, направления, стипендии и курсы валют к тенге |

Чтобы добавить вуз, допишите строку в нужный файл `prisma/data/catalog/*.json`:

```json
{"slug":"kimep-university","country":"KZ","nameEn":"KIMEP University","nameRu":"Университет КИМЭП","nameKk":"КИМЭП университеті",
 "cityEn":"Almaty","cityRu":"Алматы","cityKk":"Алматы","type":"private","website":"https://www.kimep.kz/",
 "specialties":["business","economics"],"tuition":[3500000,5000000,"KZT"],"requirements":{"UNT":"50+"},
 "scholarships":["university_aid"],"languages":["en"]}
```

- `slug` — адрес страницы вуза (`/u/kimep-university`), должен быть уникальным;
- `tuition` — `[минимум, максимум, валюта]` за год; в тенге пересчитывается по
  курсу из `src/catalog-config.js`, `null` — «стоимость уточняется»;
- `specialties`, `scholarships`, `languages` — ключи из `src/catalog-config.js`;
- необязательные поля: `region` (для Китая: `North`, `East`, `Central`, `South`,
  `West`), `wiki` — название статьи Википедии, если оно отличается от `nameEn`
  (`"ru:Название"` для русской Википедии, `false` — не искать), `qs` — название
  вуза в таблице QS, если автоматическое сопоставление не сработало.

После правок:

```bash
npm run enrich:universities   # рейтинг QS 2026 + фото и факты из Wikipedia/Wikidata (нужен интернет)
npm run db:seed               # записать каталог в базу (сеть не нужна)
```

Скрипт обогащения печатает, что требует ручной проверки: нечёткие совпадения с
QS, ненайденные статьи и сайты, которые расходятся с Wikidata.

Стоимость и требования — ориентировочные, на сайте они помечены как
предварительные. Перед публикацией конкретных цифр сверяйте их с официальным
сайтом вуза.

## Сервер hoster.kz (основной хостинг)

Сайт работает на облачном сервере hoster.kz (Ubuntu 24.04). Адрес сервера
хранится локально в `.deploy.env` (файл в `.gitignore`, репозиторий публичный):

```bash
echo 'DEPLOY_HOST=root@IP_СЕРВЕРА' > .deploy.env
```

- код: `/opt/studichan/app`, настройки и пароль базы — `/opt/studichan/app/.env`
  (только на сервере);
- служба `studichan` (systemd) сама перезапускается после сбоя и перезагрузки:
  `systemctl status studichan`, логи — `journalctl -u studichan -f`;
- nginx принимает запросы на 80 порту и передаёт их на `127.0.0.1:3000`;
- база PostgreSQL на этом же сервере, ежедневный дамп — `/var/backups/studichan`
  (хранится 14 дней);
- на сервере работают и другие проекты — меняйте только то, что относится к Studichan.

Обновить сайт после изменений:

```bash
npm run deploy
```

Скрипт соберёт фронтенд, скопирует код, загрузит каталог в базу и перезапустит
службу. Пока нет домена и HTTPS, в серверном `.env` стоит `COOKIE_SECURE=false`;
после подключения домена и сертификата его нужно поменять на `true`.

Необязательные настройки серверного `.env`:

- `ADMIN_EMAILS` — email через запятую, у кого открывается `/admin` (заявки,
  абитуриенты, выгрузка в Excel);
- `TELEGRAM_BOT_TOKEN` и `TELEGRAM_CHAT_ID` — уведомление о каждой новой заявке.

## Самый простой путь: ничего не скачивать, развернуть в Render

PostgreSQL не нужно устанавливать на компьютер. Render создаст управляемую
базу сам и передаст сайту секретную строку подключения `DATABASE_URL`.

1. Сохрани изменения в GitHub:

   ```bash
   git add .
   git commit -m "Move Studichan to PostgreSQL and Render"
   git push
   ```

2. Зайди на [Render](https://render.com), выбери **New → Blueprint** и выбери
   репозиторий `studichan`.
3. Render прочитает `render.yaml`. Проверь, что он собирается создать:
   `studichan` (Web Service) и `studichan-db` (PostgreSQL).
4. Нажми **Apply**. После окончания деплоя открой URL сервиса вида
   `https://studichan.onrender.com`.

При первом старте Render создаст таблицы и загрузит каталог из JSON. Сайт не должен быть создан как **Static
Site**: нужен именно **Web Service**, потому что у него есть API и база.

## Локальная разработка (если всё же нужна)

1. Установи Node.js 22 и выполни:

   ```bash
   npm install
   ```

2. Создай файл `.env` из `.env.example` и задай `DATABASE_URL`.

   Легче всего сначала создать базу в Render, открыть её страницу, выбрать
   **Connect → External Database URL**, вставить URL в `.env` и добавить:

   ```env
   PGSSLMODE=require
   ```

   `.env` не отправляется в GitHub.

### Google-вход

В Google Cloud Console создай OAuth client типа **Web application**. В список
разрешённых redirect URI добавь адрес сервиса:
`https://YOUR-SERVICE.onrender.com/api/auth/google/callback`.
Для локальной разработки добавь также:
`http://localhost:3000/api/auth/google/callback`.

Задай в Render или `.env`:

```env
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_REDIRECT_URI=https://YOUR-SERVICE.onrender.com/api/auth/google/callback
```

После этого кнопка **Continue with Google** будет создавать пользователя при
первом входе и входить в существующий аккаунт при следующих входах.

3. Создай таблицы и тестовые данные:

   ```bash
   npm run db:migrate
   npm run db:seed
   ```

4. Запусти проект:

   ```bash
   npm run dev
   ```

   Открой `http://localhost:5173`.

## Сбор данных об университетах

Для автоматических переводов и фотографий можно запустить синхронизацию:

```bash
npm run sync:universities
```

Для загрузки фотографий всех университетов используй:

```bash
npm run sync:images
```

Перед этим укажи в `.env` адрес LibreTranslate. Для локального сервера его
можно запустить Docker-командой `docker run --rm -p 5000:5000 libretranslate/libretranslate`,
а в `.env` оставить `LIBRETRANSLATE_URL=http://localhost:5000/translate`.
Скрипт переводит поля на русский и казахский, а фото ищет в Wikimedia Commons
и сохраняет ссылку на страницу-источник. Для запуска на Render добавь URL
доступного LibreTranslate в переменную `LIBRETRANSLATE_URL`. Автоматическая
синхронизация не включена в Web Service и требует отдельного запуска.

Скрипт не пытается парсить весь интернет или обходить защиту сайтов. Он
загружает только URL, которые ты сам указал как официальные. Для каждого
университета он:

- проверяет, что URL находится на разрешённом домене;
- соблюдает базовые правила `robots.txt`;
- делает не чаще одного запроса к домену за две секунды;
- сохраняет источник и дату проверки;
- сначала создаёт JSON для ручной проверки и **ничего не пишет в базу**.

Начни с шаблона:

```bash
cp data/university-sources.example.csv data/university-sources.csv
npm run import:universities -- --input data/university-sources.csv
```

Открой созданный файл `data/review/universities-ГГГГ-ММ-ДД.json`. Если
результат нормальный, заполни или уточни поля в исходном CSV и выполни:

```bash
npm run import:universities -- --input data/university-sources.csv --apply
```

Для `--apply` нужна `DATABASE_URL` в `.env`. CSV-колонки:

| Колонка | Обязательна | Что писать |
| --- | --- | --- |
| `name`, `city`, `region` | Да | Название, город, регион (`North`, `East`, `Central`, `South`, `West`) |
| `official_domain` | Да | Официальный домен, например `tsinghua.edu.cn` |
| `website` | Нет | Главная официальная страница |
| `admissions_url`, `programs_url`, `fees_url` | Нет | Страницы для иностранных студентов, программ и стоимости |
| `specialties`, `requirements`, `tuition`, `ranking`, `description` | Нет | Проверенные вручную данные |

Важно: цена, требования и доступность программы меняются каждый год. Скрипт
помогает быстро собрать источники и описание, но перед публикацией карточки
эти поля нужно сверять с официальной страницей и датой набора.

## Полезные команды

```bash
npm run build              # production-сборка
npm run lint               # проверка кода
npm run db:migrate         # создать таблицы PostgreSQL
npm run db:seed            # загрузить каталог (389 университетов) в базу
npm run enrich:universities # обновить рейтинг QS, фото и факты из Wikipedia
npm run import:universities -- --help
```

## Безопасность

Импорт из браузера доступен только в локальной разработке. На опубликованном
сайте административный API отключён, чтобы посетитель не мог изменить каталог.
Для наполнения опубликованной базы используй CLI-скрипт с внешним URL базы.

Пользовательские сессии хранятся в PostgreSQL в виде хеша токена, а cookie
сессии недоступна JavaScript-коду браузера.
