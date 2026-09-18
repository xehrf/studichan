// Справочные данные для страницы университета: климат, транспортные связи,
// ориентиры города и провинциальные стипендии.
//
// Всё, что собирается здесь, — предварительная оценка уровня города или
// провинции, а не проверенный факт о конкретном кампусе. Поэтому сид
// сохраняет такие записи с data_status = 'requires_verification', а карточка
// показывает пометку «требует проверки», пока редактор не сверит данные с
// официальной страницей вуза. Точные значения (площадь кампуса, состояние
// общежитий, расстояния от ворот) заполняются вручную через CSV-импорт.

// Климатические нормы: средняя температура декабря–февраля и июня–августа,
// среднегодовая относительная влажность.
export const cityClimate = {
  Пекин: { winter: -3, summer: 26, humidity: 55, zone: 'continental' },
  Тяньцзинь: { winter: -2, summer: 26, humidity: 60, zone: 'continental' },
  Баодин: { winter: -3, summer: 26, humidity: 60, zone: 'continental' },
  Циньхуандао: { winter: -4, summer: 24, humidity: 63, zone: 'continental' },
  Тайюань: { winter: -4, summer: 23, humidity: 60, zone: 'continental' },
  'Хух-Хото': { winter: -10, summer: 22, humidity: 55, zone: 'continental' },
  Харбин: { winter: -17, summer: 22, humidity: 65, zone: 'severe' },
  Чанчунь: { winter: -14, summer: 23, humidity: 64, zone: 'severe' },
  Шэньян: { winter: -10, summer: 24, humidity: 65, zone: 'severe' },
  Далянь: { winter: -3, summer: 23, humidity: 66, zone: 'maritime' },
  Шанхай: { winter: 5, summer: 28, humidity: 74, zone: 'subtropical' },
  Нанкин: { winter: 3, summer: 27, humidity: 75, zone: 'subtropical' },
  Сучжоу: { winter: 4, summer: 28, humidity: 77, zone: 'subtropical' },
  Сюйчжоу: { winter: 1, summer: 27, humidity: 70, zone: 'subtropical' },
  Ханчжоу: { winter: 5, summer: 28, humidity: 76, zone: 'subtropical' },
  Нинбо: { winter: 6, summer: 28, humidity: 78, zone: 'subtropical' },
  Вэньчжоу: { winter: 8, summer: 28, humidity: 78, zone: 'subtropical' },
  Хэфэй: { winter: 4, summer: 28, humidity: 75, zone: 'subtropical' },
  Цзинань: { winter: -1, summer: 27, humidity: 57, zone: 'continental' },
  Циндао: { winter: 1, summer: 24, humidity: 72, zone: 'maritime' },
  Наньчан: { winter: 6, summer: 29, humidity: 76, zone: 'subtropical' },
  Фучжоу: { winter: 12, summer: 29, humidity: 76, zone: 'subtropical' },
  Сямынь: { winter: 13, summer: 28, humidity: 77, zone: 'subtropical' },
  Ухань: { winter: 5, summer: 29, humidity: 76, zone: 'subtropical' },
  Чанша: { winter: 6, summer: 29, humidity: 78, zone: 'subtropical' },
  Чжэнчжоу: { winter: 1, summer: 27, humidity: 64, zone: 'continental' },
  Кайфын: { winter: 1, summer: 27, humidity: 66, zone: 'continental' },
  Гуанчжоу: { winter: 14, summer: 29, humidity: 77, zone: 'tropical' },
  Шэньчжэнь: { winter: 16, summer: 29, humidity: 74, zone: 'tropical' },
  Наньнин: { winter: 13, summer: 28, humidity: 79, zone: 'tropical' },
  Хайкоу: { winter: 18, summer: 29, humidity: 84, zone: 'tropical' },
  Чунцин: { winter: 8, summer: 29, humidity: 79, zone: 'subtropical' },
  Чэнду: { winter: 6, summer: 25, humidity: 80, zone: 'subtropical' },
  Гуйян: { winter: 5, summer: 23, humidity: 77, zone: 'subtropical' },
  Куньмин: { winter: 9, summer: 20, humidity: 70, zone: 'mild' },
  Сиань: { winter: 1, summer: 26, humidity: 67, zone: 'continental' },
  Янлин: { winter: 0, summer: 25, humidity: 68, zone: 'continental' },
  Ланьчжоу: { winter: -5, summer: 22, humidity: 56, zone: 'dry' },
  Иньчуань: { winter: -6, summer: 23, humidity: 55, zone: 'dry' },
  Синин: { winter: -7, summer: 17, humidity: 57, zone: 'highland' },
  Урумчи: { winter: -12, summer: 24, humidity: 58, zone: 'dry' },
  Лхаса: { winter: -1, summer: 16, humidity: 43, zone: 'highland' },
}

// Ближайшие крупные города: расстояние и время в пути по железной дороге
// (скоростные поезда там, где они есть) и на автомобиле.
export const cityConnections = {
  Пекин: [
    { city: 'Тяньцзинь', railKm: 137, railMinutes: 33, roadKm: 140, roadMinutes: 120 },
    { city: 'Шицзячжуан', railKm: 280, railMinutes: 70, roadKm: 290, roadMinutes: 200 },
    { city: 'Цзинань', railKm: 420, railMinutes: 90, roadKm: 430, roadMinutes: 270 },
  ],
  Тяньцзинь: [
    { city: 'Пекин', railKm: 137, railMinutes: 33, roadKm: 140, roadMinutes: 120 },
    { city: 'Цзинань', railKm: 320, railMinutes: 90, roadKm: 350, roadMinutes: 220 },
  ],
  Баодин: [
    { city: 'Пекин', railKm: 140, railMinutes: 40, roadKm: 150, roadMinutes: 120 },
    { city: 'Шицзячжуан', railKm: 130, railMinutes: 35, roadKm: 140, roadMinutes: 100 },
  ],
  Циньхуандао: [
    { city: 'Пекин', railKm: 300, railMinutes: 90, roadKm: 300, roadMinutes: 210 },
    { city: 'Шэньян', railKm: 400, railMinutes: 120, roadKm: 420, roadMinutes: 270 },
  ],
  Тайюань: [
    { city: 'Пекин', railKm: 510, railMinutes: 150, roadKm: 500, roadMinutes: 330 },
    { city: 'Сиань', railKm: 600, railMinutes: 180, roadKm: 650, roadMinutes: 420 },
  ],
  'Хух-Хото': [
    { city: 'Пекин', railKm: 490, railMinutes: 140, roadKm: 500, roadMinutes: 330 },
    { city: 'Датун', railKm: 290, railMinutes: 100, roadKm: 290, roadMinutes: 210 },
  ],
  Харбин: [
    { city: 'Чанчунь', railKm: 250, railMinutes: 60, roadKm: 250, roadMinutes: 160 },
    { city: 'Шэньян', railKm: 550, railMinutes: 120, roadKm: 550, roadMinutes: 360 },
    { city: 'Далянь', railKm: 900, railMinutes: 220, roadKm: 900, roadMinutes: 540 },
  ],
  Чанчунь: [
    { city: 'Харбин', railKm: 250, railMinutes: 60, roadKm: 250, roadMinutes: 160 },
    { city: 'Шэньян', railKm: 300, railMinutes: 70, roadKm: 300, roadMinutes: 180 },
  ],
  Шэньян: [
    { city: 'Чанчунь', railKm: 300, railMinutes: 70, roadKm: 300, roadMinutes: 180 },
    { city: 'Далянь', railKm: 380, railMinutes: 120, roadKm: 400, roadMinutes: 240 },
    { city: 'Пекин', railKm: 680, railMinutes: 180, roadKm: 700, roadMinutes: 450 },
  ],
  Далянь: [
    { city: 'Шэньян', railKm: 380, railMinutes: 120, roadKm: 400, roadMinutes: 240 },
    { city: 'Пекин', railKm: 900, railMinutes: 270, roadKm: 830, roadMinutes: 540 },
  ],
  Шанхай: [
    { city: 'Сучжоу', railKm: 85, railMinutes: 25, roadKm: 100, roadMinutes: 80 },
    { city: 'Ханчжоу', railKm: 170, railMinutes: 45, roadKm: 180, roadMinutes: 120 },
    { city: 'Нанкин', railKm: 300, railMinutes: 70, roadKm: 300, roadMinutes: 200 },
  ],
  Нанкин: [
    { city: 'Шанхай', railKm: 300, railMinutes: 70, roadKm: 300, roadMinutes: 200 },
    { city: 'Ханчжоу', railKm: 250, railMinutes: 80, roadKm: 270, roadMinutes: 180 },
    { city: 'Хэфэй', railKm: 160, railMinutes: 45, roadKm: 165, roadMinutes: 120 },
  ],
  Сучжоу: [
    { city: 'Шанхай', railKm: 85, railMinutes: 25, roadKm: 100, roadMinutes: 80 },
    { city: 'Нанкин', railKm: 220, railMinutes: 60, roadKm: 230, roadMinutes: 160 },
  ],
  Сюйчжоу: [
    { city: 'Нанкин', railKm: 300, railMinutes: 80, roadKm: 320, roadMinutes: 210 },
    { city: 'Цзинань', railKm: 320, railMinutes: 80, roadKm: 340, roadMinutes: 220 },
  ],
  Ханчжоу: [
    { city: 'Шанхай', railKm: 170, railMinutes: 45, roadKm: 180, roadMinutes: 120 },
    { city: 'Нинбо', railKm: 150, railMinutes: 50, roadKm: 160, roadMinutes: 120 },
    { city: 'Сучжоу', railKm: 155, railMinutes: 60, roadKm: 165, roadMinutes: 120 },
  ],
  Нинбо: [
    { city: 'Ханчжоу', railKm: 150, railMinutes: 50, roadKm: 160, roadMinutes: 120 },
    { city: 'Шанхай', railKm: 300, railMinutes: 120, roadKm: 220, roadMinutes: 160 },
  ],
  Вэньчжоу: [
    { city: 'Ханчжоу', railKm: 400, railMinutes: 120, roadKm: 380, roadMinutes: 270 },
    { city: 'Нинбо', railKm: 280, railMinutes: 90, roadKm: 270, roadMinutes: 180 },
  ],
  Хэфэй: [
    { city: 'Нанкин', railKm: 160, railMinutes: 45, roadKm: 165, roadMinutes: 120 },
    { city: 'Ухань', railKm: 350, railMinutes: 120, roadKm: 380, roadMinutes: 240 },
    { city: 'Шанхай', railKm: 450, railMinutes: 135, roadKm: 470, roadMinutes: 300 },
  ],
  Цзинань: [
    { city: 'Циндао', railKm: 390, railMinutes: 100, roadKm: 360, roadMinutes: 240 },
    { city: 'Пекин', railKm: 420, railMinutes: 90, roadKm: 430, roadMinutes: 270 },
  ],
  Циндао: [
    { city: 'Цзинань', railKm: 390, railMinutes: 100, roadKm: 360, roadMinutes: 240 },
    { city: 'Шанхай', railKm: 700, railMinutes: 240, roadKm: 780, roadMinutes: 510 },
  ],
  Наньчан: [
    { city: 'Чанша', railKm: 350, railMinutes: 100, roadKm: 400, roadMinutes: 270 },
    { city: 'Ухань', railKm: 350, railMinutes: 120, roadKm: 350, roadMinutes: 240 },
  ],
  Фучжоу: [
    { city: 'Сямынь', railKm: 270, railMinutes: 90, roadKm: 280, roadMinutes: 180 },
    { city: 'Ханчжоу', railKm: 620, railMinutes: 180, roadKm: 700, roadMinutes: 420 },
  ],
  Сямынь: [
    { city: 'Фучжоу', railKm: 270, railMinutes: 90, roadKm: 280, roadMinutes: 180 },
    { city: 'Шэньчжэнь', railKm: 500, railMinutes: 180, roadKm: 560, roadMinutes: 360 },
  ],
  Ухань: [
    { city: 'Чанша', railKm: 350, railMinutes: 80, roadKm: 360, roadMinutes: 240 },
    { city: 'Чжэнчжоу', railKm: 530, railMinutes: 120, roadKm: 540, roadMinutes: 330 },
    { city: 'Шанхай', railKm: 830, railMinutes: 240, roadKm: 840, roadMinutes: 540 },
  ],
  Чанша: [
    { city: 'Ухань', railKm: 350, railMinutes: 80, roadKm: 360, roadMinutes: 240 },
    { city: 'Гуанчжоу', railKm: 700, railMinutes: 150, roadKm: 720, roadMinutes: 480 },
  ],
  Чжэнчжоу: [
    { city: 'Кайфын', railKm: 70, railMinutes: 25, roadKm: 75, roadMinutes: 60 },
    { city: 'Сиань', railKm: 500, railMinutes: 120, roadKm: 500, roadMinutes: 330 },
    { city: 'Ухань', railKm: 530, railMinutes: 120, roadKm: 540, roadMinutes: 330 },
  ],
  Кайфын: [
    { city: 'Чжэнчжоу', railKm: 70, railMinutes: 25, roadKm: 75, roadMinutes: 60 },
    { city: 'Сиань', railKm: 570, railMinutes: 150, roadKm: 570, roadMinutes: 390 },
  ],
  Гуанчжоу: [
    { city: 'Шэньчжэнь', railKm: 140, railMinutes: 30, roadKm: 140, roadMinutes: 100 },
    { city: 'Гонконг', railKm: 180, railMinutes: 50, roadKm: 190, roadMinutes: 150 },
    { city: 'Чжухай', railKm: 170, railMinutes: 60, roadKm: 150, roadMinutes: 120 },
  ],
  Шэньчжэнь: [
    { city: 'Гонконг', railKm: 35, railMinutes: 20, roadKm: 40, roadMinutes: 60 },
    { city: 'Гуанчжоу', railKm: 140, railMinutes: 30, roadKm: 140, roadMinutes: 100 },
  ],
  Наньнин: [
    { city: 'Гуйлинь', railKm: 350, railMinutes: 150, roadKm: 370, roadMinutes: 240 },
    { city: 'Гуанчжоу', railKm: 570, railMinutes: 210, roadKm: 600, roadMinutes: 390 },
  ],
  Хайкоу: [
    { city: 'Санья', railKm: 300, railMinutes: 90, roadKm: 290, roadMinutes: 210 },
    { city: 'Гуанчжоу', railKm: 480, railMinutes: 330, roadKm: 500, roadMinutes: 540 },
  ],
  Чунцин: [
    { city: 'Чэнду', railKm: 300, railMinutes: 80, roadKm: 310, roadMinutes: 210 },
    { city: 'Гуйян', railKm: 350, railMinutes: 120, roadKm: 420, roadMinutes: 270 },
  ],
  Чэнду: [
    { city: 'Чунцин', railKm: 300, railMinutes: 80, roadKm: 310, roadMinutes: 210 },
    { city: 'Сиань', railKm: 660, railMinutes: 180, roadKm: 700, roadMinutes: 480 },
  ],
  Гуйян: [
    { city: 'Чунцин', railKm: 350, railMinutes: 120, roadKm: 420, roadMinutes: 270 },
    { city: 'Куньмин', railKm: 460, railMinutes: 120, roadKm: 520, roadMinutes: 330 },
  ],
  Куньмин: [
    { city: 'Гуйян', railKm: 460, railMinutes: 120, roadKm: 520, roadMinutes: 330 },
    { city: 'Наньнин', railKm: 700, railMinutes: 240, roadKm: 800, roadMinutes: 540 },
  ],
  Сиань: [
    { city: 'Чжэнчжоу', railKm: 500, railMinutes: 120, roadKm: 500, roadMinutes: 330 },
    { city: 'Ланьчжоу', railKm: 570, railMinutes: 180, roadKm: 620, roadMinutes: 420 },
    { city: 'Чэнду', railKm: 660, railMinutes: 180, roadKm: 700, roadMinutes: 480 },
  ],
  Янлин: [
    { city: 'Сиань', railKm: 80, railMinutes: 30, roadKm: 90, roadMinutes: 80 },
    { city: 'Баоцзи', railKm: 90, railMinutes: 35, roadKm: 100, roadMinutes: 90 },
  ],
  Ланьчжоу: [
    { city: 'Синин', railKm: 215, railMinutes: 70, roadKm: 220, roadMinutes: 150 },
    { city: 'Сиань', railKm: 570, railMinutes: 180, roadKm: 620, roadMinutes: 420 },
  ],
  Иньчуань: [
    { city: 'Ланьчжоу', railKm: 450, railMinutes: 180, roadKm: 470, roadMinutes: 300 },
    { city: 'Сиань', railKm: 620, railMinutes: 180, roadKm: 700, roadMinutes: 450 },
  ],
  Синин: [
    { city: 'Ланьчжоу', railKm: 215, railMinutes: 70, roadKm: 220, roadMinutes: 150 },
    { city: 'Лхаса', railKm: 1970, railMinutes: 1260, roadKm: 1950, roadMinutes: 1440 },
  ],
  Урумчи: [
    { city: 'Турфан', railKm: 190, railMinutes: 60, roadKm: 190, roadMinutes: 140 },
    { city: 'Ланьчжоу', railKm: 1780, railMinutes: 660, roadKm: 1900, roadMinutes: 1200 },
  ],
  Лхаса: [
    { city: 'Шигацзе', railKm: 250, railMinutes: 120, roadKm: 280, roadMinutes: 240 },
    { city: 'Синин', railKm: 1970, railMinutes: 1260, roadKm: 1950, roadMinutes: 1440 },
  ],
}

// Ориентиры города в стиле «что рядом» на Booking. Расстояние считается от
// центра города, а не от ворот конкретного кампуса: у большинства вузов в
// каталоге несколько площадок в разных районах.
const landmark = (ru, en, category, km) => ({ name: { ru, en, kk: ru }, category, km })

export const cityLandmarks = {
  Пекин: [
    landmark('Площадь Тяньаньмэнь и Запретный город', 'Tiananmen Square and the Forbidden City', 'landmark', 3),
    landmark('Храм Неба', 'Temple of Heaven', 'landmark', 5),
    landmark('Летний дворец', 'Summer Palace', 'landmark', 15),
    landmark('Торговый квартал Ванфуцзин', 'Wangfujing shopping street', 'mall', 4),
    landmark('Бар-квартал Саньлитунь', 'Sanlitun bars and cafes', 'food', 7),
    landmark('Вокзал Пекин-Южный', 'Beijing South railway station', 'transport', 6),
  ],
  Шанхай: [
    landmark('Набережная Вайтань (Бунд)', 'The Bund waterfront', 'landmark', 2),
    landmark('Телебашня «Жемчужина Востока»', 'Oriental Pearl Tower', 'landmark', 3),
    landmark('Торговая улица Нанкин-роуд', 'Nanjing Road shopping street', 'mall', 2),
    landmark('Квартал Синьтяньди', 'Xintiandi cafes and restaurants', 'food', 4),
    landmark('Сад Юйюань', 'Yu Garden', 'landmark', 3),
    landmark('Вокзал Шанхай-Хунцяо', 'Shanghai Hongqiao railway station', 'transport', 13),
  ],
  Гуанчжоу: [
    landmark('Телебашня «Кантон»', 'Canton Tower', 'landmark', 3),
    landmark('Остров Шамянь', 'Shamian Island', 'landmark', 5),
    landmark('Торговый центр Тяньхэ', 'Tianhe shopping district', 'mall', 4),
    landmark('Пешеходная улица Бэйцзин-лу', 'Beijing Road pedestrian street', 'food', 3),
    landmark('Парк Юэсю', 'Yuexiu Park', 'park', 4),
    landmark('Вокзал Гуанчжоу-Южный', 'Guangzhou South railway station', 'transport', 17),
  ],
  Шэньчжэнь: [
    landmark('Парк «Окно в мир»', 'Window of the World', 'landmark', 8),
    landmark('Пешеходная улица Дунмэнь', 'Dongmen pedestrian street', 'mall', 5),
    landmark('Творческий квартал OCT-Loft', 'OCT-Loft creative district', 'food', 7),
    landmark('Парк Ляньхуашань', 'Lianhuashan Park', 'park', 4),
    landmark('Пограничный переход Лоху в Гонконг', 'Luohu border crossing to Hong Kong', 'transport', 6),
    landmark('Вокзал Шэньчжэнь-Северный', 'Shenzhen North railway station', 'transport', 10),
  ],
  Ханчжоу: [
    landmark('Озеро Сиху', 'West Lake', 'landmark', 2),
    landmark('Храм Линъиньсы', 'Lingyin Temple', 'landmark', 8),
    landmark('Торговая улица Уяньлин', 'Wulin Road shopping street', 'mall', 3),
    landmark('Старинная улица Хэфан', 'Hefang ancient street', 'food', 3),
    landmark('Чайные плантации Лунцзин', 'Longjing tea plantations', 'park', 9),
    landmark('Вокзал Ханчжоу-Восточный', 'Hangzhou East railway station', 'transport', 6),
  ],
  Нанкин: [
    landmark('Мавзолей Сунь Ятсена', 'Sun Yat-sen Mausoleum', 'landmark', 9),
    landmark('Храм Конфуция и набережная Циньхуай', 'Confucius Temple and Qinhuai riverside', 'landmark', 3),
    landmark('Торговая площадь Синьцзекоу', 'Xinjiekou shopping square', 'mall', 2),
    landmark('Улица кафе Шигучэн', 'Shigucheng cafe street', 'food', 4),
    landmark('Озеро Сюаньу', 'Xuanwu Lake Park', 'park', 3),
    landmark('Вокзал Нанкин-Южный', 'Nanjing South railway station', 'transport', 10),
  ],
  Ухань: [
    landmark('Башня Жёлтого журавля', 'Yellow Crane Tower', 'landmark', 4),
    landmark('Озеро Дунху', 'East Lake', 'park', 6),
    landmark('Торговый квартал Цзянханьлу', 'Jianghan Road shopping street', 'mall', 5),
    landmark('Улица еды Хубу', 'Hubu Alley food street', 'food', 4),
    landmark('Набережная Янцзы', 'Yangtze riverside', 'landmark', 4),
    landmark('Вокзал Ухань', 'Wuhan railway station', 'transport', 12),
  ],
  Сиань: [
    landmark('Терракотовая армия', 'Terracotta Army', 'landmark', 40),
    landmark('Городская стена Сианя', 'Xi\'an City Wall', 'landmark', 3),
    landmark('Большая пагода диких гусей', 'Giant Wild Goose Pagoda', 'landmark', 5),
    landmark('Мусульманский квартал', 'Muslim Quarter food street', 'food', 3),
    landmark('Торговая улица Дунтадзе', 'Dongdajie shopping street', 'mall', 3),
    landmark('Вокзал Сиань-Северный', 'Xi\'an North railway station', 'transport', 12),
  ],
  Чэнду: [
    landmark('База панд в Чэнду', 'Chengdu Panda Base', 'landmark', 10),
    landmark('Улицы Куаньчжай', 'Kuanzhai Alley', 'food', 3),
    landmark('Торговая улица Чуньсилу', 'Chunxi Road shopping street', 'mall', 2),
    landmark('Парк Народа с чайными', 'People\'s Park teahouses', 'park', 2),
    landmark('Храм Уховцы', 'Wuhou Shrine', 'landmark', 4),
    landmark('Вокзал Чэнду-Восточный', 'Chengdu East railway station', 'transport', 8),
  ],
  Тяньцзинь: [
    landmark('Колесо обозрения «Глаз Тяньцзиня»', 'Tianjin Eye ferris wheel', 'landmark', 3),
    landmark('Итальянский квартал', 'Italian Style Town', 'food', 3),
    landmark('Древняя культурная улица', 'Ancient Culture Street', 'landmark', 3),
    landmark('Торговая улица Биньцзян', 'Binjiang Road shopping street', 'mall', 2),
    landmark('Парк Шуйшан', 'Shuishang Park', 'park', 7),
    landmark('Вокзал Тяньцзинь', 'Tianjin railway station', 'transport', 2),
  ],
  Харбин: [
    landmark('Софийский собор', 'Saint Sophia Cathedral', 'landmark', 3),
    landmark('Пешеходная улица Чжунъян', 'Zhongyang pedestrian street', 'mall', 3),
    landmark('Парк «Мир льда и снега»', 'Ice and Snow World', 'landmark', 12),
    landmark('Набережная Сунгари', 'Songhua riverside', 'park', 4),
    landmark('Русский квартал с кафе', 'Russian quarter cafes', 'food', 3),
    landmark('Вокзал Харбин-Западный', 'Harbin West railway station', 'transport', 9),
  ],
  Циндао: [
    landmark('Пирс Чжаньцяо', 'Zhanqiao Pier', 'landmark', 2),
    landmark('Музей пивоварни Tsingtao', 'Tsingtao Beer Museum', 'landmark', 4),
    landmark('Пляж Бадагуань', 'Badaguan beach', 'park', 6),
    landmark('Торговый квартал Тайдун', 'Taidong shopping street', 'mall', 4),
    landmark('Улица морепродуктов Пичайюань', 'Pichaiyuan seafood street', 'food', 4),
    landmark('Вокзал Циндао', 'Qingdao railway station', 'transport', 2),
  ],
  Сямынь: [
    landmark('Остров Гуланъюй', 'Gulangyu Island', 'landmark', 3),
    landmark('Храм Наньпутуо', 'Nanputuo Temple', 'landmark', 2),
    landmark('Пляжная набережная Хуаньдао', 'Huandao seaside promenade', 'park', 4),
    landmark('Торговая улица Чжуншань', 'Zhongshan Road shopping street', 'mall', 3),
    landmark('Улица кафе Шапово', 'Shapowei cafe district', 'food', 3),
    landmark('Вокзал Сямынь-Северный', 'Xiamen North railway station', 'transport', 22),
  ],
  Чунцин: [
    landmark('Древний город Цыцикоу', 'Ciqikou Ancient Town', 'landmark', 8),
    landmark('Квартал Хунъядун', 'Hongyadong stilted houses', 'landmark', 3),
    landmark('Торговая площадь Цзефанбэй', 'Jiefangbei shopping square', 'mall', 3),
    landmark('Улица хого', 'Hotpot restaurant street', 'food', 3),
    landmark('Парк Элин', 'Eling Park', 'park', 4),
    landmark('Вокзал Чунцин-Северный', 'Chongqing North railway station', 'transport', 8),
  ],
  Сучжоу: [
    landmark('Сад скромного чиновника', 'Humble Administrator\'s Garden', 'landmark', 3),
    landmark('Пешеходная улица Гуаньцянь', 'Guanqian pedestrian street', 'mall', 2),
    landmark('Водный город Чжоучжуан', 'Zhouzhuang water town', 'landmark', 30),
    landmark('Улица Пинцзян с чайными', 'Pingjiang Road teahouses', 'food', 3),
    landmark('Парк Цзиньцзи-Лейк', 'Jinji Lake park', 'park', 6),
    landmark('Вокзал Сучжоу', 'Suzhou railway station', 'transport', 3),
  ],
  Шэньян: [
    landmark('Императорский дворец Шэньяна', 'Mukden Palace', 'landmark', 2),
    landmark('Гробница Фулин', 'Fuling Tomb', 'landmark', 8),
    landmark('Пешеходная улица Чжунцзе', 'Zhongjie pedestrian street', 'mall', 2),
    landmark('Корейский квартал Сита', 'Xita Korean food street', 'food', 3),
    landmark('Парк Бэйлин', 'Beiling Park', 'park', 7),
    landmark('Вокзал Шэньян-Северный', 'Shenyang North railway station', 'transport', 3),
  ],
}

// Провинциальные стипендии. Размер и условия ежегодно пересматривает
// управление образования провинции, поэтому здесь только краткая справка:
// точные суммы и сроки нужно смотреть в объявлении текущего года.
const grant = (nameRu, nameEn, coverage, note) => ({ available: true, name: { ru: nameRu, en: nameEn, kk: nameRu }, coverage, note })
const unknownGrant = { available: null, name: null, coverage: null, note: null }

export const provinceGrants = {
  Пекин: grant('Пекинская муниципальная стипендия', 'Beijing Government Scholarship', 'tuition', 'apply_via_university'),
  Шанхай: grant('Шанхайская муниципальная стипендия', 'Shanghai Government Scholarship', 'full_or_tuition', 'apply_via_university'),
  Тяньцзинь: grant('Стипендия правительства Тяньцзиня', 'Tianjin Government Scholarship', 'tuition', 'apply_via_university'),
  Чунцин: grant('Стипендия правительства Чунцина', 'Chongqing Municipal Government Scholarship', 'tuition', 'apply_via_university'),
  Цзянсу: grant('Стипендия «Жасмин» провинции Цзянсу', 'Jasmine Jiangsu Government Scholarship', 'full_or_tuition', 'apply_via_university'),
  Чжэцзян: grant('Стипендия правительства Чжэцзян', 'Zhejiang Provincial Government Scholarship', 'tuition', 'apply_via_university'),
  Гуандун: grant('Стипендия правительства Гуандуна', 'Guangdong Provincial Government Scholarship', 'tuition', 'apply_via_university'),
  Шаньдун: grant('Стипендия правительства Шаньдуна', 'Shandong Provincial Government Scholarship', 'tuition', 'apply_via_university'),
  Хубэй: grant('Стипендия правительства Хубэй', 'Hubei Provincial Government Scholarship', 'tuition', 'apply_via_university'),
  Фуцзянь: grant('Стипендия правительства Фуцзянь', 'Fujian Provincial Government Scholarship', 'tuition', 'apply_via_university'),
  Аньхой: grant('Стипендия правительства Аньхой', 'Anhui Provincial Government Scholarship', 'tuition', 'apply_via_university'),
  Хэйлунцзян: grant('Стипендия правительства Хэйлунцзяна', 'Heilongjiang Provincial Government Scholarship', 'tuition', 'apply_via_university'),
  Ляонин: grant('Стипендия правительства Ляонина', 'Liaoning Provincial Government Scholarship', 'tuition', 'apply_via_university'),
  Цзилинь: grant('Стипендия правительства Цзилиня', 'Jilin Provincial Government Scholarship', 'tuition', 'apply_via_university'),
  Шэньси: grant('Стипендия правительства Шэньси', 'Shaanxi Provincial Government Scholarship', 'tuition', 'apply_via_university'),
  Сычуань: grant('Стипендия правительства Сычуани', 'Sichuan Provincial Government Scholarship', 'tuition', 'apply_via_university'),
  Хунань: grant('Стипендия правительства Хунани', 'Hunan Provincial Government Scholarship', 'tuition', 'apply_via_university'),
  Хэнань: grant('Стипендия правительства Хэнани', 'Henan Provincial Government Scholarship', 'tuition', 'apply_via_university'),
  Гуанси: grant('Стипендия правительства Гуанси', 'Guangxi Government Scholarship', 'tuition', 'apply_via_university'),
  Юньнань: grant('Стипендия правительства Юньнани', 'Yunnan Provincial Government Scholarship', 'tuition', 'apply_via_university'),
  Гуйчжоу: grant('Стипендия правительства Гуйчжоу', 'Guizhou Provincial Government Scholarship', 'tuition', 'apply_via_university'),
  Хайнань: grant('Стипендия правительства Хайнаня', 'Hainan Provincial Government Scholarship', 'tuition', 'apply_via_university'),
  Цзянси: unknownGrant,
  Хэбэй: unknownGrant,
  Шаньси: unknownGrant,
  Ганьсу: unknownGrant,
  Нинся: unknownGrant,
  Цинхай: unknownGrant,
  Синьцзян: unknownGrant,
  Тибет: unknownGrant,
  'Внутренняя Монголия': unknownGrant,
}

// Год основания указан только там, где он однозначно зафиксирован в истории
// вуза. Для остальных карточка показывает «уточняется», а редактор заполняет
// поле вручную.
export const foundedYears = {
  'Peking University': 1898,
  'Tsinghua University': 1911,
  'Fudan University': 1905,
  'Zhejiang University': 1897,
  'Shanghai Jiao Tong University': 1896,
  'Nanjing University': 1902,
  'University of Science and Technology of China': 1958,
  'Wuhan University': 1893,
  'Harbin Institute of Technology': 1920,
  "Xi'an Jiaotong University": 1896,
  'Sun Yat-sen University': 1924,
  'Sichuan University': 1896,
  'Shandong University': 1901,
  'Nankai University': 1919,
  'Tianjin University': 1895,
  'Tongji University': 1907,
  'Southeast University': 1902,
  'Huazhong University of Science and Technology': 1952,
  'Beijing Institute of Technology': 1940,
  'Beijing Normal University': 1902,
  'China Agricultural University': 1905,
  'Jilin University': 1946,
  'Xiamen University': 1921,
  'Central South University': 1952,
  'Hunan University': 976,
  'Chongqing University': 1929,
  'Dalian University of Technology': 1949,
  'Northeastern University': 1923,
  'East China Normal University': 1951,
  'Ocean University of China': 1924,
  'South China University of Technology': 1952,
  'Renmin University of China': 1937,
  'Beihang University': 1952,
  'Lanzhou University': 1909,
  'Northwestern Polytechnical University': 1938,
  'Harbin Engineering University': 1953,
  'Jinan University': 1906,
  'Soochow University': 1900,
  'Shenzhen University': 1983,
  'Ningbo University': 1986,
  'China University of Geosciences': 1952,
  'Beijing Jiaotong University': 1896,
  'Southwest Jiaotong University': 1896,
  'East China University of Science and Technology': 1952,
  'Nanjing Agricultural University': 1902,
  'Northwest A&F University': 1934,
  'Hohai University': 1915,
  'Jiangnan University': 1902,
  'Central China Normal University': 1903,
  'Nanchang University': 1921,
}

const tier1Cities = new Set(['Пекин', 'Шанхай', 'Гуанчжоу', 'Шэньчжэнь'])
const tier2Cities = new Set([
  'Ханчжоу', 'Нанкин', 'Сучжоу', 'Тяньцзинь', 'Ухань', 'Чэнду', 'Чунцин',
  'Сиань', 'Циндао', 'Сямынь', 'Нинбо', 'Чанша', 'Далянь', 'Хэфэй', 'Цзинань',
])

// Стоимость жизни в юанях за месяц. Кампусная вилка — это цена места в
// общежитии для иностранных студентов, городская — аренда студии не дальше
// трёх километров от кампуса вместе с коммунальными платежами.
const livingCostByTier = {
  1: { campus: [1200, 2400], city: [3500, 6000], utilities: [300, 500] },
  2: { campus: [800, 1800], city: [2000, 3500], utilities: [250, 400] },
  3: { campus: [600, 1200], city: [1200, 2500], utilities: [200, 350] },
}

const cityTier = (city) => (tier1Cities.has(city) ? 1 : tier2Cities.has(city) ? 2 : 3)

// Университетский «тир» по национальному рейтингу: он определяет типовые
// условия в общежитии и набор инфраструктуры на кампусе.
const universityTier = (ranking) => {
  if (!ranking) return 'standard'
  if (ranking <= 30) return 'top'
  if (ranking <= 100) return 'strong'
  return 'standard'
}

const dormByTier = {
  top: { roomPlaces: [1, 2], bathroom: 'private', condition: 'good' },
  strong: { roomPlaces: [2, 3], bathroom: 'block', condition: 'fair' },
  standard: { roomPlaces: [2, 4], bathroom: 'shared', condition: 'fair' },
}

const facilitiesByTier = {
  top: ['canteen', 'shops', 'pharmacy', 'clinic', 'hospital', 'pool', 'gym', 'stadium', 'library', 'laundry', 'bank'],
  strong: ['canteen', 'shops', 'pharmacy', 'clinic', 'pool', 'gym', 'stadium', 'library', 'laundry', 'bank'],
  standard: ['canteen', 'shops', 'pharmacy', 'clinic', 'gym', 'stadium', 'library', 'laundry'],
}

const extraDocumentsByTier = {
  top: ['study_plan', 'recommendations', 'police_clearance', 'medical_form', 'financial_proof', 'language_certificate'],
  strong: ['study_plan', 'recommendations', 'police_clearance', 'medical_form', 'financial_proof'],
  standard: ['study_plan', 'police_clearance', 'medical_form', 'financial_proof'],
}

// Собственные скидки вуза. У китайских университетов набор почти всегда
// одинаковый — стипендия первокурсника и стипендия за успеваемость, — а вот
// размер и список факультетов каждый вуз объявляет сам, поэтому faculties
// остаётся пустым до ручной проверки.
const universityGrantsByTier = {
  top: [
    { key: 'president', discount: 100, faculties: [] },
    { key: 'excellence', discount: 50, faculties: [] },
  ],
  strong: [
    { key: 'freshman', discount: 50, faculties: [] },
    { key: 'excellence', discount: 30, faculties: [] },
  ],
  standard: [
    { key: 'freshman', discount: 30, faculties: [] },
  ],
}

// Приёмная кампания китайских вузов привязана к месяцам, а не к конкретным
// датам: храним день и месяц, чтобы карточка не устаревала через год.
const admissionWindows = {
  top: { autumn: { from: '12-01', to: '03-31' }, spring: { from: '09-01', to: '11-15' }, reviewWeeks: [6, 10] },
  strong: { autumn: { from: '11-01', to: '04-30' }, spring: { from: '09-01', to: '11-30' }, reviewWeeks: [4, 8] },
  standard: { autumn: { from: '11-01', to: '06-30' }, spring: { from: '09-01', to: '12-15' }, reviewWeeks: [3, 6] },
}

// Оценка каталога по десятибалльной шкале. Складывается из места в рейтинге
// Китая и мира, доступности государственной стипендии и безопасности города,
// чтобы у карточки был понятный и воспроизводимый балл.
export const catalogueRating = ({ ranking, rankingWorld, hasCscScholarship, safetyLevel }) => {
  const national = ranking ? Math.max(0, 4 - (ranking - 1) / 40) : 1.6
  const world = rankingWorld ? Math.max(0, 3 - (rankingWorld - 1) / 350) : 1
  const scholarship = hasCscScholarship ? 1.4 : 0.4
  const safety = safetyLevel === 'high' ? 1.6 : safetyLevel === 'medium' ? 1 : 0.6
  return Math.round(Math.min(10, national + world + scholarship + safety) * 10) / 10
}

// Собирает предварительный профиль кампуса из справочников выше. Возвращает
// ровно те поля, которые страница университета показывает как «предварительные»
// до ручной проверки.
export const getCampusProfile = (university) => {
  const { nameEn, city, province, ranking, rankingWorld, hasCscScholarship, safetyLevel } = university
  const tier = universityTier(ranking)
  const costs = livingCostByTier[cityTier(city)]
  const climate = cityClimate[city] || null

  return {
    foundedYear: foundedYears[nameEn] || null,
    climate,
    nearbyCities: cityConnections[city] || [],
    nearbyPlaces: cityLandmarks[city] || [],
    dorm: dormByTier[tier],
    facilities: facilitiesByTier[tier],
    livingCost: { ...costs, currency: 'CNY', radiusKm: 3 },
    languages: tier === 'standard' ? ['zh'] : ['zh', 'en'],
    extraDocuments: extraDocumentsByTier[tier],
    deadlines: admissionWindows[tier],
    universityGrants: universityGrantsByTier[tier],
    provinceGrant: provinceGrants[String(province).replace(/\s+/g, ' ').trim()] || unknownGrant,
    siteRating: catalogueRating({ ranking, rankingWorld, hasCscScholarship, safetyLevel }),
  }
}
