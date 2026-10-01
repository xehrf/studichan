// Тест профориентации по модели интересов Холланда (RIASEC): шесть типов,
// по четыре утверждения на тип, ответы по шкале 1–5. Утверждения авторские.
// Результат — подсказка для выбора направления, а не психологический диагноз.

export const CAREER_TYPES = ['R', 'I', 'A', 'S', 'E', 'C']

export const CAREER_STATEMENTS = [
  { type: 'R', ru: 'Мне нравится собирать, чинить или настраивать технику своими руками.', kk: 'Техниканы өз қолыммен жинағанды, жөндегенді немесе баптағанды ұнатамын.', en: 'I enjoy building, fixing or setting up devices with my own hands.' },
  { type: 'I', ru: 'Мне нравится разбираться, почему что-то происходит, и докапываться до причин.', kk: 'Бір нәрсенің неге болатынын түсініп, себебін іздегенді ұнатамын.', en: 'I like figuring out why things happen and getting to the root cause.' },
  { type: 'A', ru: 'Мне нравится рисовать, фотографировать, снимать видео или придумывать дизайн.', kk: 'Сурет салғанды, суретке түсіргенді, бейне түсіргенді немесе дизайн ойлап тапқанды ұнатамын.', en: 'I like drawing, taking photos, filming videos or creating designs.' },
  { type: 'S', ru: 'Мне нравится объяснять другим то, в чём я разбираюсь.', kk: 'Өзім түсінетін нәрсені басқаларға түсіндіргенді ұнатамын.', en: 'I enjoy explaining things I understand to other people.' },
  { type: 'E', ru: 'Мне нравится организовывать людей и брать ответственность на себя.', kk: 'Адамдарды ұйымдастырып, жауапкершілікті өзіме алғанды ұнатамын.', en: 'I like organising people and taking responsibility.' },
  { type: 'C', ru: 'Мне нравится, когда всё разложено по полочкам и есть чёткий план.', kk: 'Бәрі ретімен тұрып, нақты жоспар болғанын ұнатамын.', en: 'I like it when everything is well organised and there is a clear plan.' },
  { type: 'R', ru: 'Я бы с удовольствием работал(а) на стройке, в лаборатории или на производстве, а не только за компьютером.', kk: 'Тек компьютер алдында емес, құрылыста, зертханада немесе өндірісте жұмыс істегім келер еді.', en: 'I would happily work on a construction site, in a lab or at a factory, not only at a computer.' },
  { type: 'I', ru: 'Я люблю решать сложные задачи по математике, физике или химии.', kk: 'Математика, физика немесе химиядан күрделі есептер шығарғанды жақсы көремін.', en: 'I love solving hard problems in maths, physics or chemistry.' },
  { type: 'A', ru: 'Я люблю писать тексты, истории или посты.', kk: 'Мәтін, әңгіме немесе пост жазғанды жақсы көремін.', en: 'I love writing texts, stories or posts.' },
  { type: 'S', ru: 'Ко мне часто приходят за советом или поддержкой.', kk: 'Маған жиі кеңес немесе қолдау сұрап келеді.', en: 'People often come to me for advice or support.' },
  { type: 'E', ru: 'Я хотел(а) бы когда-нибудь открыть свой бизнес.', kk: 'Бір күні өз бизнесімді ашқым келеді.', en: 'I would like to start my own business one day.' },
  { type: 'C', ru: 'Я внимательно отношусь к деталям, цифрам и документам.', kk: 'Егжей-тегжейге, сандар мен құжаттарға мұқият қараймын.', en: 'I pay close attention to details, numbers and documents.' },
  { type: 'R', ru: 'Мне интересно, как устроены машины, приборы и механизмы.', kk: 'Көліктердің, құрылғылар мен механизмдердің қалай жұмыс істейтіні маған қызық.', en: 'I am curious about how cars, devices and machines work.' },
  { type: 'I', ru: 'Мне интересно ставить опыты и проверять гипотезы.', kk: 'Тәжірибе жасап, болжамдарды тексеру маған қызық.', en: 'I find it interesting to run experiments and test ideas.' },
  { type: 'A', ru: 'Меня тянет к музыке, театру или кино.', kk: 'Мені музыка, театр немесе кино қызықтырады.', en: 'I am drawn to music, theatre or film.' },
  { type: 'S', ru: 'Я хотел(а) бы помогать людям: лечить, учить или защищать.', kk: 'Адамдарға көмектескім келеді: емдеу, оқыту немесе қорғау арқылы.', en: 'I would like to help people: to heal, teach or protect them.' },
  { type: 'E', ru: 'Мне легко убеждать других и выступать перед аудиторией.', kk: 'Басқаларды сендіру және көпшілік алдында сөйлеу маған оңай.', en: 'I find it easy to persuade others and speak in front of an audience.' },
  { type: 'C', ru: 'Мне нравится работать с таблицами, данными и отчётами.', kk: 'Кестелермен, деректермен және есептермен жұмыс істегенді ұнатамын.', en: 'I enjoy working with spreadsheets, data and reports.' },
  { type: 'R', ru: 'Мне нравится работать с природой, животными или растениями.', kk: 'Табиғатпен, жануарлармен немесе өсімдіктермен жұмыс істегенді ұнатамын.', en: 'I like working with nature, animals or plants.' },
  { type: 'I', ru: 'Я могу долго читать о науке, медицине или технологиях.', kk: 'Ғылым, медицина немесе технологиялар туралы ұзақ оқи аламын.', en: 'I can read about science, medicine or technology for hours.' },
  { type: 'A', ru: 'Мне важно делать что-то оригинальное, а не по шаблону.', kk: 'Мен үшін бір нәрсені үлгімен емес, өзіндік етіп жасау маңызды.', en: 'It matters to me to make something original rather than follow a template.' },
  { type: 'S', ru: 'Мне комфортно работать в команде и много общаться.', kk: 'Командада жұмыс істеу және көп араласу маған ыңғайлы.', en: 'I feel comfortable working in a team and talking to lots of people.' },
  { type: 'E', ru: 'Меня интересуют деньги, продажи и то, как зарабатывают компании.', kk: 'Мені ақша, сауда және компаниялардың қалай табыс табатыны қызықтырады.', en: 'I am interested in money, sales and how companies make a profit.' },
  { type: 'C', ru: 'Я предпочитаю понятные правила и инструкции, а не хаос.', kk: 'Бейберекеттіктен гөрі түсінікті ережелер мен нұсқауларды қалаймын.', en: 'I prefer clear rules and instructions to chaos.' },
]

export const CAREER_SCALE = {
  ru: ['Совсем не про меня', 'Скорее нет', 'Иногда', 'Скорее да', 'Точно про меня'],
  kk: ['Мүлдем мен туралы емес', 'Көбіне жоқ', 'Кейде', 'Көбіне иә', 'Дәл мен туралы'],
  en: ['Not me at all', 'Mostly not', 'Sometimes', 'Mostly yes', 'Totally me'],
}

export const CAREER_TYPE_INFO = {
  R: {
    ru: { title: 'Практик', text: 'Тебе ближе работа с техникой, материалами, природой и результатом, который можно потрогать.', jobs: 'инженер, архитектор, агроном, технолог, энергетик' },
    kk: { title: 'Практик', text: 'Саған техникамен, материалдармен, табиғатпен жұмыс және қолмен ұстауға болатын нақты нәтиже жақын.', jobs: 'инженер, сәулетші, агроном, технолог, энергетик' },
    en: { title: 'Doer', text: 'You lean towards hands-on work with technology, materials and nature, with results you can touch.', jobs: 'engineer, architect, agronomist, technologist, energy specialist' },
  },
  I: {
    ru: { title: 'Исследователь', text: 'Тебя увлекают вопросы «почему» и «как»: наука, анализ, сложные задачи.', jobs: 'врач, программист, учёный, аналитик данных, биотехнолог' },
    kk: { title: 'Зерттеуші', text: 'Сені «неге» және «қалай» деген сұрақтар қызықтырады: ғылым, талдау, күрделі есептер.', jobs: 'дәрігер, бағдарламашы, ғалым, деректер талдаушысы, биотехнолог' },
    en: { title: 'Thinker', text: 'You are driven by “why” and “how”: science, analysis and hard problems.', jobs: 'doctor, software developer, scientist, data analyst, biotechnologist' },
  },
  A: {
    ru: { title: 'Творец', text: 'Тебе важно самовыражение: образы, тексты, музыка, дизайн и нестандартные идеи.', jobs: 'дизайнер, архитектор, журналист, переводчик, режиссёр' },
    kk: { title: 'Шығармашыл', text: 'Сен үшін өзіңді көрсету маңызды: бейнелер, мәтіндер, музыка, дизайн және ерекше идеялар.', jobs: 'дизайнер, сәулетші, журналист, аудармашы, режиссер' },
    en: { title: 'Creator', text: 'Self-expression matters to you: images, writing, music, design and unusual ideas.', jobs: 'designer, architect, journalist, translator, film director' },
  },
  S: {
    ru: { title: 'Наставник', text: 'Тебе нравится помогать, объяснять и работать с людьми.', jobs: 'учитель, врач, психолог, социальный работник, HR-специалист' },
    kk: { title: 'Тәлімгер', text: 'Саған көмектесу, түсіндіру және адамдармен жұмыс істеу ұнайды.', jobs: 'мұғалім, дәрігер, психолог, әлеуметтік қызметкер, HR маманы' },
    en: { title: 'Helper', text: 'You enjoy helping, explaining and working with people.', jobs: 'teacher, doctor, psychologist, social worker, HR specialist' },
  },
  E: {
    ru: { title: 'Лидер', text: 'Тебя тянет вести за собой, убеждать, договариваться и запускать проекты.', jobs: 'предприниматель, юрист, менеджер, маркетолог, дипломат' },
    kk: { title: 'Көшбасшы', text: 'Сені басқаларды соңыңнан ертіп, сендіріп, келіссөз жүргізіп, жоба бастау қызықтырады.', jobs: 'кәсіпкер, заңгер, менеджер, маркетолог, дипломат' },
    en: { title: 'Leader', text: 'You like leading, persuading, negotiating and launching projects.', jobs: 'entrepreneur, lawyer, manager, marketer, diplomat' },
  },
  C: {
    ru: { title: 'Организатор', text: 'Тебе комфортно с порядком, цифрами, данными и чёткими процессами.', jobs: 'финансист, бухгалтер, аналитик, логист, аудитор' },
    kk: { title: 'Ұйымдастырушы', text: 'Саған тәртіп, сандар, деректер және нақты процестер ыңғайлы.', jobs: 'қаржыгер, бухгалтер, талдаушы, логист, аудитор' },
    en: { title: 'Organiser', text: 'You are at ease with order, numbers, data and clear processes.', jobs: 'financial analyst, accountant, analyst, logistics specialist, auditor' },
  },
}

// Насколько каждый тип интересов подходит к направлениям каталога.
const TYPE_SPECIALTIES = {
  R: { engineering: 3, agriculture: 3, architecture: 2, cs: 1 },
  I: { science: 3, medicine: 3, cs: 3, engineering: 2 },
  A: { arts: 3, architecture: 3, languages: 2, humanities: 2 },
  S: { education: 3, social: 3, medicine: 2, humanities: 1, languages: 1 },
  E: { business: 3, law: 3, economics: 2, social: 2 },
  C: { economics: 3, business: 2, cs: 2, law: 1 },
}

// answers — массив значений 1–5 в порядке CAREER_STATEMENTS.
export const scoreCareerTest = (answers) => {
  const scores = Object.fromEntries(CAREER_TYPES.map(type => [type, 0]))
  CAREER_STATEMENTS.forEach((statement, index) => { scores[statement.type] += answers[index] || 0 })
  const perType = CAREER_STATEMENTS.length / CAREER_TYPES.length
  // Перевод суммы (от perType до perType·5) в проценты.
  const percents = Object.fromEntries(CAREER_TYPES.map(type => [type, Math.round(((scores[type] - perType) / (perType * 4)) * 100)]))
  const top = [...CAREER_TYPES].sort((a, b) => percents[b] - percents[a]).slice(0, 2)
  const specialtyScores = {}
  for (const type of CAREER_TYPES) {
    for (const [key, weight] of Object.entries(TYPE_SPECIALTIES[type])) specialtyScores[key] = (specialtyScores[key] || 0) + percents[type] * weight
  }
  const specialties = Object.entries(specialtyScores).sort((a, b) => b[1] - a[1]).slice(0, 4).map(([key]) => key)
  return { scores: percents, top, specialties }
}
