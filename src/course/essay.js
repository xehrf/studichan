// Практикум «Эссе для поступления»: 12 уроков в пяти модулях. Теория,
// упражнения и комментарии к правкам переведены на три языка интерфейса,
// а сами фрагменты эссе «до» и «после» остаются на английском: на этом языке
// их подают в Common App, UCAS и зарубежные вузы. Все примеры авторские.

export const ESSAY_MODULES = [
  { id: 'idea', ru: 'Идея', en: 'The idea', kk: 'Идея' },
  { id: 'draft', ru: 'Черновик', en: 'The draft', kk: 'Жоба' },
  { id: 'program', ru: 'Ответы о программе', en: 'Programme answers', kk: 'Бағдарлама туралы жауаптар' },
  { id: 'ucas', ru: 'UCAS', en: 'UCAS', kk: 'UCAS' },
  { id: 'edit', ru: 'Редактура', en: 'Editing', kk: 'Редакциялау' },
]

export const ESSAY_LESSONS = [
  {
    id: 1,
    module: 'idea',
    minutes: 10,
    review: {
      before: 'Ever since I was a child, I have been passionate about science. I am a hardworking, responsible and creative person who always strives for excellence. I believe that your university will help me achieve my dreams.',
      after: 'In ninth grade I spent three weekends taking apart my grandfather’s broken radio. I never fixed it, but I learned to read a circuit diagram and found out that I like problems that refuse to be solved on the first try.',
    },
    ru: {
      title: 'Что на самом деле читает приёмная комиссия',
      summary: 'Эссе — единственная часть заявки, где комиссия слышит вас, а не ваши оценки. Разбираемся, что именно ищет читатель за 3–5 минут, которые у него есть на ваш текст.',
      points: [
        'Оценки и сертификаты отвечают на вопрос «справится ли он с учёбой». Эссе отвечает на другой: «каким человеком он придёт в нашу аудиторию».',
        'Читатель ищет три вещи: как вы думаете, что для вас важно и как вы меняетесь. Список достижений на это не отвечает — он уже есть в заявке.',
        'Сильное эссе можно узнать по тому, что его не мог написать никто другой. Если заменить ваше имя на чужое и текст останется правдой — он слишком общий.',
        'Комиссия читает сотни текстов подряд. Конкретная деталь в первых строках работает лучше любых громких слов о мечте и страсти.',
      ],
      mistakes: [
        'Пересказ резюме: олимпиады, кружки и волонтёрство одним списком.',
        'Слова-пустышки: «целеустремлённый», «ответственный», «с детства мечтал».',
        'Попытка угадать «правильного» кандидата вместо того, чтобы показать себя.',
      ],
      exercise: {
        title: 'Тест «чужого имени»',
        steps: [
          'Возьмите любой свой текст о себе: старое эссе, мотивационное письмо или описание в анкете.',
          'Подчеркните каждое предложение, которое осталось бы правдой, если бы его написал ваш одноклассник.',
          'Перепишите одно такое предложение так, чтобы в нём появилась деталь, которая есть только у вас: место, предмет, число, чьи-то слова.',
        ],
        placeholder: 'Было: …\nСтало: …',
      },
      reviewNotes: [
        '«Ever since I was a child» и «passionate about science» встречаются в тысячах эссе — читатель их пролистывает.',
        'Список качеств заменён одной сценой: качества видны из поступков, их не нужно называть.',
        'Признание неудачи («I never fixed it») звучит честнее и взрослее, чем «always strives for excellence».',
      ],
    },
    en: {
      title: 'What the admissions committee really reads',
      summary: 'The essay is the only part of the application where the committee hears you rather than your grades. Here is what a reader looks for in the 3–5 minutes they have for your text.',
      points: [
        'Grades and certificates answer “can this student cope with the course?”. The essay answers a different question: “what kind of person will join our classroom?”.',
        'The reader looks for three things: how you think, what matters to you and how you change. A list of achievements answers none of them — it is already in the application.',
        'A strong essay could not have been written by anyone else. If you could swap your name for someone else’s and the text would still be true, it is too general.',
        'Committees read hundreds of texts in a row. A concrete detail in the opening lines works better than any big words about dreams and passion.',
      ],
      mistakes: [
        'Retelling the CV: olympiads, clubs and volunteering in one list.',
        'Empty words: “goal-oriented”, “responsible”, “I have dreamt of it since childhood”.',
        'Trying to guess the “right” applicant instead of showing yourself.',
      ],
      exercise: {
        title: 'The “someone else’s name” test',
        steps: [
          'Take any text you have written about yourself: an old essay, a motivation letter or a form description.',
          'Underline every sentence that would still be true if a classmate had written it.',
          'Rewrite one of those sentences so it contains a detail only you have: a place, an object, a number, something someone said.',
        ],
        placeholder: 'Before: …\nAfter: …',
      },
      reviewNotes: [
        '“Ever since I was a child” and “passionate about science” appear in thousands of essays — readers skim past them.',
        'The list of qualities is replaced with one scene: qualities show in actions and do not need to be named.',
        'Admitting a failure (“I never fixed it”) sounds more honest and mature than “always strives for excellence”.',
      ],
    },
    kk: {
      title: 'Қабылдау комиссиясы шын мәнінде нені оқиды',
      summary: 'Эссе — өтінімнің комиссия сіздің бағаңызды емес, өзіңізді еститін жалғыз бөлігі. Оқырман мәтініңізге бөлетін 3–5 минутта нені іздейтінін талдаймыз.',
      points: [
        'Бағалар мен сертификаттар «ол оқуды игере ала ма» деген сұраққа жауап береді. Эссе басқа сұраққа жауап береді: «біздің аудиторияға қандай адам келеді».',
        'Оқырман үш нәрсені іздейді: қалай ойлайсыз, сіз үшін не маңызды және қалай өзгересіз. Жетістіктер тізімі бұған жауап бермейді — ол өтінімде бар.',
        'Күшті эссені басқа ешкім жаза алмайды. Егер атыңызды басқа біреудікімен ауыстырғанда мәтін әлі де шындық болып қалса — ол тым жалпы.',
        'Комиссия жүздеген мәтінді қатарынан оқиды. Алғашқы жолдардағы нақты деталь арман мен құштарлық туралы кез келген үлкен сөзден күштірек.',
      ],
      mistakes: [
        'Түйіндемені қайталау: олимпиадалар, үйірмелер мен волонтерлік бір тізіммен.',
        'Бос сөздер: «мақсатшыл», «жауапты», «бала кезімнен армандадым».',
        'Өзіңізді көрсетудің орнына «дұрыс» үміткерді табуға тырысу.',
      ],
      exercise: {
        title: '«Бөтен есім» тесті',
        steps: [
          'Өзіңіз туралы кез келген мәтінді алыңыз: ескі эссе, уәждеме хат немесе сауалнамадағы сипаттама.',
          'Оны сыныптасыңыз жазса да шындық болып қалатын әр сөйлемнің астын сызыңыз.',
          'Сондай бір сөйлемді тек сізде бар деталь пайда болатындай етіп қайта жазыңыз: орын, зат, сан, біреудің сөзі.',
        ],
        placeholder: 'Бұрын: …\nКейін: …',
      },
      reviewNotes: [
        '«Ever since I was a child» және «passionate about science» мыңдаған эсседе кездеседі — оқырман оларды өткізіп жібереді.',
        'Қасиеттер тізімі бір көрініспен алмастырылды: қасиеттер іс-әрекеттен көрінеді, оларды атаудың қажеті жоқ.',
        'Сәтсіздікті мойындау («I never fixed it») «always strives for excellence» дегеннен адалырақ әрі ересектеу естіледі.',
      ],
    },
  },
  {
    id: 2,
    module: 'idea',
    minutes: 20,
    review: {
      before: 'I want to write about my volunteering experience because it taught me a lot of important things about life and helped me become a better person.',
      after: 'Every Saturday I read the news aloud to Mr. Serik, who lost his sight at sixty. In March he stopped me mid-sentence and asked what “inflation” really meant. I did not know — and that question is why I now read economics books for fun.',
    },
    ru: {
      title: 'Инвентаризация опыта: где искать тему',
      summary: 'Хорошая тема почти никогда не лежит на поверхности. Составляем карту своего опыта и находим истории, о которых вы бы сами не подумали.',
      points: [
        'Тема — это не событие, а то, что оно в вас изменило. Поездка, спорт или волонтёрство сами по себе темой не являются.',
        'Ищите в мелочах: привычки, споры с родными, вещи на столе, вопросы, которые вы гуглите в два часа ночи.',
        'Лучшие темы часто связаны с противоречием: вы хотели одного, а получилось другое; думали одно, а поняли иное.',
        'Проверяйте тему вопросом «и что?». Если после истории нечего сказать о себе — это анекдот, а не эссе.',
      ],
      mistakes: [
        'Выбирать тему по «весу»: трагедия или победа на олимпиаде кажутся сильнее, чем обычный вторник.',
        'Писать о другом человеке: о бабушке или тренере, где автор эссе исчезает.',
        'Брать тему, которой вы стесняетесь или которую не готовы обсуждать на интервью.',
      ],
      exercise: {
        title: 'Карта опыта за 15 минут',
        steps: [
          'Выпишите по три пункта в каждую колонку: «что я делаю, когда никто не заставляет», «о чём я спорил(а) в последний год», «что я умею, а мои друзья — нет», «момент, когда я ошибся(лась)».',
          'Отметьте пункты, о которых вам интересно рассказывать дольше пяти минут.',
          'Для двух отмеченных пунктов ответьте одним предложением: «Это показывает, что я…».',
        ],
        placeholder: 'Когда никто не заставляет, я…\nПоследний спор…\nЯ умею…\nЯ ошибся(лась), когда…\n\nЭто показывает, что я…',
      },
      reviewNotes: [
        'В первой версии нет ни одного факта — только обещание, что опыт был важным.',
        'Вторая версия начинается с конкретного человека и действия, а затем показывает поворот — вопрос, на который автор не знал ответа.',
        'Волонтёрство здесь не тема, а повод: настоящая тема — как чужой вопрос разбудил интерес к экономике.',
      ],
    },
    en: {
      title: 'Taking stock of your experience: where to find a topic',
      summary: 'A good topic is rarely lying on the surface. We map your experience and find stories you would not have thought of yourself.',
      points: [
        'A topic is not an event but what that event changed in you. A trip, sport or volunteering are not topics on their own.',
        'Look in the small things: habits, arguments with family, objects on your desk, questions you google at 2 a.m.',
        'The best topics often involve a contradiction: you wanted one thing and got another; you thought one thing and realised something else.',
        'Test a topic with “so what?”. If there is nothing to say about yourself after the story, it is an anecdote, not an essay.',
      ],
      mistakes: [
        'Choosing a topic by its “weight”: a tragedy or an olympiad win seems stronger than an ordinary Tuesday.',
        'Writing about someone else — a grandmother or a coach — so the author disappears from the essay.',
        'Picking a topic you feel uneasy about or are not ready to discuss at an interview.',
      ],
      exercise: {
        title: 'An experience map in 15 minutes',
        steps: [
          'Write three items in each column: “what I do when nobody makes me”, “what I argued about this past year”, “what I can do that my friends cannot”, “a moment when I got it wrong”.',
          'Mark the items you would happily talk about for more than five minutes.',
          'For two marked items, finish one sentence: “This shows that I…”.',
        ],
        placeholder: 'When nobody makes me, I…\nMy last argument…\nI can…\nI got it wrong when…\n\nThis shows that I…',
      },
      reviewNotes: [
        'The first version contains no facts at all — only a promise that the experience mattered.',
        'The second version opens with a specific person and action, then shows a turn: a question the author could not answer.',
        'Volunteering is not the topic here but the occasion: the real topic is how someone else’s question sparked an interest in economics.',
      ],
    },
    kk: {
      title: 'Тәжірибені түгендеу: тақырыпты қайдан іздеу',
      summary: 'Жақсы тақырып сирек жағдайда бетінде жатады. Тәжірибеңіздің картасын жасап, өзіңіз ойламаған оқиғаларды табамыз.',
      points: [
        'Тақырып — оқиға емес, сол оқиғаның сізді қалай өзгерткені. Сапар, спорт немесе волонтерлік өз бетінше тақырып емес.',
        'Ұсақ-түйектен іздеңіз: әдеттер, туыстармен дау, үстеліңіздегі заттар, түнгі екіде іздейтін сұрақтарыңыз.',
        'Ең жақсы тақырыптар көбіне қайшылықпен байланысты: бір нәрсені қаладыңыз, басқасы шықты; бір нәрсе ойладыңыз, басқасын түсіндіңіз.',
        'Тақырыпты «сонда не?» сұрағымен тексеріңіз. Оқиғадан кейін өзіңіз туралы айтарыңыз болмаса — бұл эссе емес, анекдот.',
      ],
      mistakes: [
        'Тақырыпты «салмағына» қарап таңдау: трагедия немесе олимпиададағы жеңіс қарапайым сейсенбіден күштірек көрінеді.',
        'Басқа адам туралы жазу: әже немесе жаттықтырушы туралы, онда эссе авторы жоғалып кетеді.',
        'Ұялатын немесе сұхбатта талқылауға дайын емес тақырыпты алу.',
      ],
      exercise: {
        title: '15 минуттағы тәжірибе картасы',
        steps: [
          'Әр бағанға үш тармақтан жазыңыз: «ешкім мәжбүрлемегенде не істеймін», «соңғы жылы не туралы дауластым», «мен істей аламын, достарым — жоқ», «қателескен сәтім».',
          'Бес минуттан артық айтқыңыз келетін тармақтарды белгілеңіз.',
          'Белгіленген екі тармақ үшін бір сөйлеммен жауап беріңіз: «Бұл менің … екенімді көрсетеді».',
        ],
        placeholder: 'Ешкім мәжбүрлемегенде мен…\nСоңғы дау…\nМен істей аламын…\nМен қателескенде…\n\nБұл менің … екенімді көрсетеді',
      },
      reviewNotes: [
        'Бірінші нұсқада бірде-бір дерек жоқ — тек тәжірибенің маңызды болғаны туралы уәде.',
        'Екінші нұсқа нақты адам мен әрекеттен басталып, бетбұрысты көрсетеді — автор жауабын білмеген сұрақ.',
        'Мұнда волонтерлік тақырып емес, себеп қана: шын тақырып — бөтен сұрақтың экономикаға қызығушылықты қалай оятқаны.',
      ],
    },
  },
  {
    id: 3,
    module: 'idea',
    minutes: 20,
    review: {
      before: 'Chess has been a big part of my life. I started playing at seven, won many tournaments, became a candidate master, coached younger kids and learned discipline, patience and strategic thinking.',
      after: 'In the final round of the regional championship I offered a draw in a winning position because I was afraid to lose it. That evening I set up the board again and played the line I had avoided. It worked. Since then I have kept a notebook of moves I was too scared to make.',
    },
    ru: {
      title: 'Один эпизод — одна мысль: от темы к фокусу',
      summary: 'Даже хорошая тема тонет, если пытаться рассказать всё. Учимся сужать историю до одного эпизода и одной мысли, которая через него видна.',
      points: [
        'В 650 слов помещается одна сцена и один вывод. Хроника «с семи лет и до сегодняшнего дня» превращается в список.',
        'Ищите в теме момент выбора, сомнения или ошибки — в нём больше всего видно характер.',
        'Сформулируйте главную мысль эссе одним предложением до того, как начнёте писать. Если не получается — фокуса ещё нет.',
        'Всё, что не работает на эту мысль, уходит из текста, даже если это ваше лучшее достижение.',
      ],
      mistakes: [
        'Описывать всю «карьеру» в хобби вместо одного важного дня.',
        'Делать вывод, которого не видно из истории: «и это научило меня лидерству».',
        'Давать три разные мысли в одном эссе — читатель не запомнит ни одной.',
      ],
      exercise: {
        title: 'Сжать до одной мысли',
        steps: [
          'Возьмите тему из прошлого урока и выпишите пять конкретных моментов, связанных с ней.',
          'Выберите тот, где вы принимали решение или чего-то не понимали.',
          'Напишите главную мысль эссе одним предложением: «Я понял(а), что…», а затем вычеркните «Я понял(а), что» и проверьте, звучит ли мысль по-прежнему.',
        ],
        placeholder: 'Моменты:\n1.\n2.\n3.\n4.\n5.\n\nВыбранный момент: …\nГлавная мысль: …',
      },
      reviewNotes: [
        'Первая версия — хронология и список достижений, которые уже есть в анкете.',
        'Вторая берёт один ход в одной партии и через него показывает страх и то, как автор с ним работает.',
        'Тетрадь «ходов, которые я боялся сделать» — образ, который читатель запомнит, и мостик к выводу о том, как автор учится.',
      ],
    },
    en: {
      title: 'One episode, one idea: from topic to focus',
      summary: 'Even a good topic sinks if you try to tell everything. We learn to narrow the story to one episode and one idea that shows through it.',
      points: [
        '650 words hold one scene and one insight. A chronicle “from age seven until today” turns into a list.',
        'Look in your topic for a moment of choice, doubt or mistake — that is where character shows the most.',
        'State the main idea of the essay in one sentence before you start writing. If you cannot, there is no focus yet.',
        'Everything that does not serve this idea leaves the text, even if it is your best achievement.',
      ],
      mistakes: [
        'Describing your whole “career” in a hobby instead of one important day.',
        'Drawing a conclusion the story does not show: “and this taught me leadership”.',
        'Giving three different ideas in one essay — the reader will remember none of them.',
      ],
      exercise: {
        title: 'Squeeze it into one idea',
        steps: [
          'Take the topic from the previous lesson and list five specific moments connected to it.',
          'Choose the one where you made a decision or did not understand something.',
          'Write the main idea of the essay in one sentence: “I realised that…”, then delete “I realised that” and check whether the idea still stands.',
        ],
        placeholder: 'Moments:\n1.\n2.\n3.\n4.\n5.\n\nChosen moment: …\nMain idea: …',
      },
      reviewNotes: [
        'The first version is a timeline plus a list of achievements already in the application form.',
        'The second takes one move in one game and uses it to show fear and how the author deals with it.',
        'A notebook of “moves I was too scared to make” is an image the reader will remember and a bridge to how the author learns.',
      ],
    },
    kk: {
      title: 'Бір эпизод — бір ой: тақырыптан фокусқа',
      summary: 'Жақсы тақырыптың өзі бәрін айтуға тырысқанда батып кетеді. Оқиғаны бір эпизодқа және сол арқылы көрінетін бір ойға дейін тарылтуды үйренеміз.',
      points: [
        '650 сөзге бір көрініс пен бір қорытынды сыяды. «Жеті жастан бүгінге дейінгі» шежіре тізімге айналады.',
        'Тақырыптан таңдау, күмән немесе қателік сәтін іздеңіз — мінез сонда ең жақсы көрінеді.',
        'Жазуды бастамас бұрын эссенің негізгі ойын бір сөйлеммен тұжырымдаңыз. Шықпаса — фокус әлі жоқ.',
        'Осы ойға қызмет етпейтін бәрі мәтіннен шығады, тіпті ол ең жақсы жетістігіңіз болса да.',
      ],
      mistakes: [
        'Бір маңызды күннің орнына хоббидегі бүкіл «мансапты» сипаттау.',
        'Оқиғадан көрінбейтін қорытынды жасау: «және бұл мені көшбасшылыққа үйретті».',
        'Бір эссеге үш түрлі ой салу — оқырман бірін де есте сақтамайды.',
      ],
      exercise: {
        title: 'Бір ойға дейін қысқарту',
        steps: [
          'Өткен сабақтағы тақырыпты алып, онымен байланысты бес нақты сәтті жазыңыз.',
          'Шешім қабылдаған немесе бір нәрсені түсінбеген сәтті таңдаңыз.',
          'Эссенің негізгі ойын бір сөйлеммен жазыңыз: «Мен … екенін түсіндім», содан кейін «Мен түсіндім» дегенді сызып, ойдың әлі де тұрғанын тексеріңіз.',
        ],
        placeholder: 'Сәттер:\n1.\n2.\n3.\n4.\n5.\n\nТаңдалған сәт: …\nНегізгі ой: …',
      },
      reviewNotes: [
        'Бірінші нұсқа — хронология және сауалнамада бар жетістіктер тізімі.',
        'Екіншісі бір партиядағы бір жүрісті алып, сол арқылы қорқынышты және автордың онымен қалай жұмыс істейтінін көрсетеді.',
        '«Жасауға қорыққан жүрістерім» дәптері — оқырман есте сақтайтын бейне және автордың қалай үйренетіні туралы қорытындыға көпір.',
      ],
    },
  },
  {
    id: 4,
    module: 'draft',
    minutes: 20,
    limit: { words: 650 },
    review: {
      before: 'In this essay I will tell you about the most important experience of my life. First, I will describe my background. Then I will explain what happened. Finally, I will share what I learned.',
      after: 'The power went out at 6:40 p.m., twenty minutes before my first online lesson for the village school. Thirty-two students were waiting, and I had a phone at 14% battery.',
    },
    ru: {
      title: 'Структура личного эссе',
      summary: 'Личное эссе — не школьное сочинение с введением и заключением. Собираем каркас, который держит внимание: зацепка, контекст, поворот, рефлексия.',
      points: [
        'Зацепка (1–3 предложения): начните внутри сцены — с действия, детали или реплики. Не объявляйте, о чём будет текст.',
        'Контекст и развитие (≈ 30%): ровно столько предыстории, сколько нужно, чтобы понять ставки.',
        'Поворот (≈ 30%): момент, где что-то пошло не так, вы сомневались или поняли новое. Это сердце эссе.',
        'Рефлексия (≈ 30%): что изменилось в вашем мышлении и как это связано с тем, кем вы хотите стать. Не повторяйте историю — сделайте шаг дальше.',
        'Common App — до 650 слов. Черновик может быть длиннее: резать проще, чем дописывать.',
      ],
      mistakes: [
        'Вступление в стиле «В этом эссе я расскажу…».',
        'Цитата великого человека в первой строке.',
        'Финал, где последние 100 слов пересказывают начало.',
      ],
      exercise: {
        title: 'Каркас и первый черновик',
        steps: [
          'Распишите эссе на четыре блока: зацепка, контекст, поворот, рефлексия — по 1–2 предложения на каждый.',
          'Напишите три разных первых предложения: с действием, с деталью и с репликой. Оставьте самое сильное.',
          'Напишите черновик целиком, не останавливаясь на правку. Цель — 600–800 слов.',
        ],
        placeholder: 'Зацепка: …\nКонтекст: …\nПоворот: …\nРефлексия: …\n\nЧерновик:\n',
      },
      reviewNotes: [
        'Первая версия тратит три предложения на то, чтобы объяснить план, — читатель ещё ничего не узнал.',
        'Вторая сразу ставит в ситуацию: время, проблема, ставки (32 ученика) и ограничение (14% заряда).',
        'Конкретные числа делают сцену правдоподобной и заставляют читать дальше, чтобы узнать, что было потом.',
      ],
    },
    en: {
      title: 'The structure of a personal essay',
      summary: 'A personal essay is not a school composition with an introduction and conclusion. We build a frame that holds attention: hook, context, turn, reflection.',
      points: [
        'Hook (1–3 sentences): start inside a scene — with an action, a detail or a line of dialogue. Do not announce what the text is about.',
        'Context and development (≈ 30%): only as much background as the reader needs to understand the stakes.',
        'Turn (≈ 30%): the moment where something went wrong, you doubted or understood something new. This is the heart of the essay.',
        'Reflection (≈ 30%): what changed in your thinking and how it links to who you want to become. Do not retell the story — take a step further.',
        'The Common App limit is 650 words. A draft can be longer: cutting is easier than adding.',
      ],
      mistakes: [
        'An opening like “In this essay I will tell you…”.',
        'A quote from a great person in the first line.',
        'An ending where the last 100 words retell the beginning.',
      ],
      exercise: {
        title: 'Frame and first draft',
        steps: [
          'Outline the essay in four blocks: hook, context, turn, reflection — 1–2 sentences each.',
          'Write three different first sentences: with an action, with a detail and with a line of dialogue. Keep the strongest.',
          'Write the whole draft without stopping to edit. Aim for 600–800 words.',
        ],
        placeholder: 'Hook: …\nContext: …\nTurn: …\nReflection: …\n\nDraft:\n',
      },
      reviewNotes: [
        'The first version spends three sentences explaining the plan — the reader has learned nothing yet.',
        'The second drops the reader straight into the situation: time, problem, stakes (32 students) and a constraint (14% battery).',
        'Concrete numbers make the scene believable and make the reader want to know what happened next.',
      ],
    },
    kk: {
      title: 'Жеке эссенің құрылымы',
      summary: 'Жеке эссе — кіріспесі мен қорытындысы бар мектеп шығармасы емес. Назарды ұстайтын қаңқа құрастырамыз: ілмек, контекст, бетбұрыс, рефлексия.',
      points: [
        'Ілмек (1–3 сөйлем): көріністің ішінен бастаңыз — әрекеттен, детальдан немесе репликадан. Мәтін не туралы екенін жарияламаңыз.',
        'Контекст және даму (≈ 30%): тәуекелді түсінуге қажет болғанша ғана алғышарт.',
        'Бетбұрыс (≈ 30%): бір нәрсе дұрыс болмаған, күмәнданған немесе жаңа нәрсені түсінген сәт. Бұл — эссенің жүрегі.',
        'Рефлексия (≈ 30%): ойлауыңызда не өзгерді және оның кім болғыңыз келетінімен байланысы. Оқиғаны қайталамаңыз — бір қадам алға басыңыз.',
        'Common App — 650 сөзге дейін. Жоба ұзынырақ болуы мүмкін: қысқарту жазып толықтырудан оңай.',
      ],
      mistakes: [
        '«Бұл эсседе мен … туралы айтамын» стиліндегі кіріспе.',
        'Бірінші жолдағы ұлы адамның дәйексөзі.',
        'Соңғы 100 сөз басын қайталайтын финал.',
      ],
      exercise: {
        title: 'Қаңқа және алғашқы жоба',
        steps: [
          'Эссені төрт блокқа бөліп жазыңыз: ілмек, контекст, бетбұрыс, рефлексия — әрқайсысына 1–2 сөйлем.',
          'Үш түрлі бірінші сөйлем жазыңыз: әрекетпен, детальмен және репликамен. Ең күштісін қалдырыңыз.',
          'Түзетуге тоқтамай, жобаны толық жазыңыз. Мақсат — 600–800 сөз.',
        ],
        placeholder: 'Ілмек: …\nКонтекст: …\nБетбұрыс: …\nРефлексия: …\n\nЖоба:\n',
      },
      reviewNotes: [
        'Бірінші нұсқа жоспарды түсіндіруге үш сөйлем жұмсайды — оқырман әлі ештеңе білген жоқ.',
        'Екіншісі бірден жағдайға кіргізеді: уақыт, мәселе, тәуекел (32 оқушы) және шектеу (14% заряд).',
        'Нақты сандар көріністі сенімді етеді және ары қарай не болғанын білу үшін оқуға мәжбүрлейді.',
      ],
    },
  },
  {
    id: 5,
    module: 'draft',
    minutes: 15,
    review: {
      before: 'I was very nervous before my first debate tournament. I felt scared and unsure of myself, but in the end I overcame my fear and did well.',
      after: 'Before my first debate round I rewrote my opening line on the back of my hand three times, until the ink smudged into a blue blur. When the timer started, I could not read a word — so I looked up and simply said what I believed.',
    },
    ru: {
      title: 'Показывать, а не рассказывать',
      summary: 'Главный приём живого текста: вместо того чтобы называть чувства и качества, показать их через действия, детали и диалог.',
      points: [
        '«Я волновался» — это рассказ. «Я трижды переписал первую фразу на ладони» — это показ. Читатель сам делает вывод и поэтому в него верит.',
        'Работают пять чувств: что вы видели, слышали, держали в руках. Одна точная деталь сильнее абзаца описаний.',
        'Прямая речь оживляет сцену, но 1–2 реплик достаточно.',
        'Показ не значит «без мыслей»: в рефлексии вы прямо говорите, что поняли. Важен баланс сцены и смысла.',
      ],
      mistakes: [
        'Прилагательные вместо фактов: «огромный», «невероятный», «потрясающий».',
        'Названные эмоции: «я почувствовал гордость».',
        'Лишние детали, которые красивы, но ничего не значат для истории.',
      ],
      exercise: {
        title: 'Переписать три «рассказа» в «показ»',
        steps: [
          'Найдите в своём черновике три предложения, где вы называете чувство или качество.',
          'Для каждого задайте вопрос: «Что бы увидела камера в этот момент?».',
          'Перепишите каждое предложение через действие или деталь, не используя слово, которое называет эмоцию.',
        ],
        placeholder: '1. Было: …\n   Стало: …\n2. Было: …\n   Стало: …\n3. Было: …\n   Стало: …',
      },
      reviewNotes: [
        'В первой версии три слова об эмоциях (nervous, scared, unsure) и ни одного образа.',
        'Во второй волнение видно через действие (переписать на ладони трижды) и деталь (размазанные чернила).',
        'Поворот тоже показан: шпаргалка подвела — и автор нашёл собственный голос. Слово «overcame» больше не нужно.',
      ],
    },
    en: {
      title: 'Show, don’t tell',
      summary: 'The core technique of living prose: instead of naming feelings and qualities, show them through actions, details and dialogue.',
      points: [
        '“I was nervous” is telling. “I rewrote my first line on my palm three times” is showing. The reader draws the conclusion and therefore believes it.',
        'Use the five senses: what you saw, heard, held. One precise detail beats a paragraph of description.',
        'Direct speech brings a scene to life, but one or two lines are enough.',
        'Showing does not mean “no thoughts”: in the reflection you say plainly what you understood. Balance scene and meaning.',
      ],
      mistakes: [
        'Adjectives instead of facts: “huge”, “incredible”, “amazing”.',
        'Named emotions: “I felt proud”.',
        'Extra details that are pretty but mean nothing for the story.',
      ],
      exercise: {
        title: 'Turn three “tells” into “shows”',
        steps: [
          'Find three sentences in your draft where you name a feeling or a quality.',
          'For each, ask: “What would a camera see at this moment?”.',
          'Rewrite each sentence through an action or a detail, without the word that names the emotion.',
        ],
        placeholder: '1. Before: …\n   After: …\n2. Before: …\n   After: …\n3. Before: …\n   After: …',
      },
      reviewNotes: [
        'The first version has three emotion words (nervous, scared, unsure) and no images.',
        'In the second, nerves show through an action (rewriting on the hand three times) and a detail (the smudged ink).',
        'The turn is shown too: the crib note failed and the author found their own voice. “Overcame” is no longer needed.',
      ],
    },
    kk: {
      title: 'Айтпа, көрсет',
      summary: 'Тірі мәтіннің басты тәсілі: сезімдер мен қасиеттерді атаудың орнына оларды әрекет, деталь және диалог арқылы көрсету.',
      points: [
        '«Мен толқыдым» — бұл айту. «Бірінші сөйлемді алақаныма үш рет қайта жаздым» — бұл көрсету. Оқырман қорытындыны өзі жасайды, сондықтан оған сенеді.',
        'Бес сезім жұмыс істейді: не көрдіңіз, не естідіңіз, қолыңызда не ұстадыңыз. Бір дәл деталь бір абзац сипаттамадан күшті.',
        'Тура сөз көріністі жандандырады, бірақ 1–2 реплика жеткілікті.',
        'Көрсету «ойсыз» дегенді білдірмейді: рефлексияда не түсінгеніңізді тура айтасыз. Көрініс пен мағынаның тепе-теңдігі маңызды.',
      ],
      mistakes: [
        'Деректің орнына сын есімдер: «орасан», «керемет», «таңғажайып».',
        'Аталған эмоциялар: «мен мақтаныш сезіндім».',
        'Әдемі, бірақ оқиға үшін ештеңе білдірмейтін артық детальдар.',
      ],
      exercise: {
        title: 'Үш «айтуды» «көрсетуге» айналдыру',
        steps: [
          'Жобаңыздан сезімді немесе қасиетті атайтын үш сөйлем табыңыз.',
          'Әрқайсысы үшін сұраңыз: «Осы сәтте камера не көрер еді?».',
          'Әр сөйлемді эмоцияны атайтын сөзсіз, әрекет немесе деталь арқылы қайта жазыңыз.',
        ],
        placeholder: '1. Болды: …\n   Жаңа: …\n2. Болды: …\n   Жаңа: …\n3. Болды: …\n   Жаңа: …',
      },
      reviewNotes: [
        'Бірінші нұсқада эмоция туралы үш сөз (nervous, scared, unsure) бар, бірде-бір бейне жоқ.',
        'Екіншісінде толқу әрекет (алақанға үш рет жазу) және деталь (жайылған сия) арқылы көрінеді.',
        'Бетбұрыс та көрсетілген: шпаргалка көмектеспеді — автор өз дауысын тапты. «Overcame» сөзі енді керек емес.',
      ],
    },
  },
  {
    id: 6,
    module: 'draft',
    minutes: 15,
    review: {
      before: 'Moreover, this profound experience fundamentally transformed my perspective on the multifaceted nature of human interactions, thereby enabling me to become a more empathetic individual.',
      after: 'I used to think listening meant waiting for my turn to talk. After a month at the help desk, I learned to count to three before answering. Most people finish their thought on two.',
    },
    ru: {
      title: 'Свой голос: тон без пафоса',
      summary: 'Комиссия хочет услышать живого 17-летнего человека, а не пресс-релиз. Учимся писать просто, точно и узнаваемо.',
      points: [
        'Голос — это то, как вы рассказали бы историю умному другу. Прочитайте текст вслух: если так никто не говорит, перепишите.',
        'Сложные слова не делают текст умнее. Ясная мысль простыми словами производит впечатление сильнее, чем «multifaceted» и «paradigm».',
        'Юмор и самоирония уместны, если они естественны для вас. Не шутите ради шутки.',
        'Пишите на английском сами. Перевод с русского или казахского через переводчик и тексты, сгенерированные ИИ, звучат одинаково и плоско — и вузы всё чаще это проверяют.',
      ],
      mistakes: [
        'Слова-связки, которые утяжеляют текст: moreover, furthermore, thereby.',
        'Пафос: «изменило мою жизнь навсегда», «я понял смысл жизни».',
        'Чужой голос: родитель или репетитор переписал текст «как надо».',
      ],
      exercise: {
        title: 'Тест чтения вслух',
        steps: [
          'Прочитайте черновик вслух или запишите на диктофон.',
          'Отметьте места, где вы споткнулись или где звучите «не как вы».',
          'Перепишите самый тяжёлый абзац так, будто объясняете его другу в сообщении. Затем верните его в эссе, сохранив простоту.',
        ],
        placeholder: 'Где я споткнулся(ась): …\n\nАбзац было: …\n\nАбзац стало: …',
      },
      reviewNotes: [
        'Первая версия набита «умными» словами, но не содержит ни одного факта — непонятно, что произошло.',
        'Вторая говорит простым языком и показывает конкретную привычку (считать до трёх).',
        'Последняя короткая фраза — наблюдение с лёгкой иронией, по которому слышен автор.',
      ],
    },
    en: {
      title: 'Your own voice: tone without pathos',
      summary: 'The committee wants to hear a real 17-year-old, not a press release. We learn to write simply, precisely and recognisably.',
      points: [
        'Voice is how you would tell the story to a smart friend. Read the text aloud: if nobody talks like that, rewrite it.',
        'Long words do not make a text smarter. A clear thought in plain words impresses more than “multifaceted” and “paradigm”.',
        'Humour and self-irony are fine if they come naturally to you. Do not joke for the sake of it.',
        'Write in English yourself. Machine translations and AI-generated texts sound the same and flat — and universities check for this more and more.',
      ],
      mistakes: [
        'Connectors that weigh the text down: moreover, furthermore, thereby.',
        'Pathos: “changed my life forever”, “I understood the meaning of life”.',
        'Someone else’s voice: a parent or tutor rewrote the text “properly”.',
      ],
      exercise: {
        title: 'The read-aloud test',
        steps: [
          'Read the draft aloud or record it on your phone.',
          'Mark the places where you stumbled or did not sound like yourself.',
          'Rewrite the heaviest paragraph as if you were explaining it to a friend in a message. Then put it back into the essay, keeping it simple.',
        ],
        placeholder: 'Where I stumbled: …\n\nParagraph before: …\n\nParagraph after: …',
      },
      reviewNotes: [
        'The first version is full of “clever” words but contains no facts — it is unclear what happened.',
        'The second uses plain language and shows a specific habit (counting to three).',
        'The short last sentence is an observation with a touch of irony that lets you hear the author.',
      ],
    },
    kk: {
      title: 'Өз дауысыңыз: пафоссыз үн',
      summary: 'Комиссия баспасөз релизін емес, тірі 17 жасар адамды естігісі келеді. Қарапайым, дәл және танымал жазуды үйренеміз.',
      points: [
        'Дауыс — оқиғаны ақылды досыңызға қалай айтып берер едіңіз, сол. Мәтінді дауыстап оқыңыз: егер ешкім былай сөйлемесе, қайта жазыңыз.',
        'Күрделі сөздер мәтінді ақылдырақ етпейді. Қарапайым сөзбен айтылған анық ой «multifaceted» пен «paradigm»-нан күштірек әсер қалдырады.',
        'Әзіл мен өзін-өзі мысқылдау сізге табиғи болса, орынды. Әзіл үшін әзілдемеңіз.',
        'Ағылшынша өзіңіз жазыңыз. Аудармашы арқылы аударма мен ЖИ жасаған мәтіндер бірдей әрі жалпақ естіледі — және жоғары оқу орындары мұны жиі тексереді.',
      ],
      mistakes: [
        'Мәтінді ауырлататын байланыстырғыштар: moreover, furthermore, thereby.',
        'Пафос: «өмірімді мәңгілікке өзгертті», «өмірдің мәнін түсіндім».',
        'Бөтен дауыс: ата-ана немесе репетитор мәтінді «дұрыстап» қайта жазды.',
      ],
      exercise: {
        title: 'Дауыстап оқу тесті',
        steps: [
          'Жобаны дауыстап оқыңыз немесе диктофонға жазыңыз.',
          'Сүрінген немесе «өзіңіздей емес» естілген жерлерді белгілеңіз.',
          'Ең ауыр абзацты досыңызға хабарламада түсіндіргендей қайта жазыңыз. Содан кейін қарапайымдығын сақтап, эссеге қайтарыңыз.',
        ],
        placeholder: 'Қай жерде сүріндім: …\n\nАбзац бұрын: …\n\nАбзац кейін: …',
      },
      reviewNotes: [
        'Бірінші нұсқа «ақылды» сөздерге толы, бірақ бірде-бір дерек жоқ — не болғаны түсініксіз.',
        'Екіншісі қарапайым тілмен сөйлеп, нақты әдетті көрсетеді (үшке дейін санау).',
        'Соңғы қысқа сөйлем — автордың дауысы естілетін жеңіл мысқылды бақылау.',
      ],
    },
  },
  {
    id: 7,
    module: 'program',
    minutes: 20,
    limit: { words: 250 },
    review: {
      before: 'I want to study at your university because it is one of the best universities in the world, it has excellent professors, a diverse community and beautiful campus.',
      after: 'Professor Liang’s urban mobility lab is testing bus routes with smartphone data — the same problem I tried to solve for my town of 40,000 using a spreadsheet and two weeks of bus-stop counts. I want to learn to do it properly, and the second-year transport modelling course is where I would start.',
    },
    ru: {
      title: '«Почему именно мы»: исследование программы',
      summary: 'Вопрос «Why us?» проверяет не лесть, а совпадение: что конкретно в этой программе нужно именно вам. Учимся искать и подавать такие детали.',
      points: [
        'Ответ, который подходит к любому вузу, не подходит ни к одному. Рейтинг, «сильные преподаватели» и «красивый кампус» знает и комиссия.',
        'Ищите 2–3 конкретики: курс или модуль, лабораторию, профессора и его исследование, формат обучения, студенческую организацию, программу обмена.',
        'Каждую деталь связывайте с собой: «это есть у вас» + «вот что я с этим сделаю» + «вот почему мне это нужно».',
        'Источники: страница программы и учебный план (curriculum), сайты лабораторий, студенческие блоги, вебинары приёмной комиссии, разговоры со студентами.',
        'Для китайских вузов полезно упомянуть язык обучения, связь программы с вашей будущей работой и интерес к стране — но тоже через факты.',
      ],
      mistakes: [
        'Копировать текст с сайта вуза, не объясняя, зачем это вам.',
        'Перечислять пять профессоров и десять курсов — получается каталог.',
        'Ошибиться с названием вуза или программы при копировании ответа из другой заявки.',
      ],
      exercise: {
        title: 'Таблица совпадений',
        steps: [
          'Выберите один вуз из вашего списка и откройте страницу программы и учебный план.',
          'Выпишите три конкретные вещи, которых нет (или почти нет) в других вузах из вашего списка.',
          'Для каждой напишите связку: «У вас есть…», «Я хочу…, потому что…». Соберите из двух лучших ответ на 150–250 слов.',
        ],
        placeholder: 'Вуз и программа: …\n\n1. У вас есть… / Я хочу…, потому что…\n2. …\n3. …\n\nОтвет:\n',
      },
      reviewNotes: [
        'Первую версию можно отправить в любой вуз мира — поэтому она не работает ни для одного.',
        'Во второй названы конкретная лаборатория и курс, а интерес подтверждён собственным мини-проектом автора.',
        'Масштаб задачи (город на 40 000 жителей, таблица и две недели подсчётов) показывает инициативу честно, без преувеличений.',
      ],
    },
    en: {
      title: '“Why us?”: researching the programme',
      summary: 'The “Why us?” question tests fit, not flattery: what exactly in this programme you need. We learn to find such details and present them.',
      points: [
        'An answer that fits any university fits none. The committee already knows its ranking, “strong faculty” and “beautiful campus”.',
        'Find 2–3 specifics: a course or module, a lab, a professor and their research, the teaching format, a student society, an exchange programme.',
        'Link every detail to yourself: “you have this” + “here is what I will do with it” + “here is why I need it”.',
        'Sources: the programme page and curriculum, lab websites, student blogs, admissions webinars, conversations with students.',
        'For Chinese universities it helps to mention the language of instruction, how the programme links to your future work and your interest in the country — but through facts as well.',
      ],
      mistakes: [
        'Copying text from the university site without explaining why it matters to you.',
        'Listing five professors and ten courses — it turns into a catalogue.',
        'Getting the university or programme name wrong when reusing an answer from another application.',
      ],
      exercise: {
        title: 'A fit table',
        steps: [
          'Pick one university from your list and open the programme page and curriculum.',
          'Write down three specific things that other universities on your list do not have (or barely have).',
          'For each, write the link: “You have…”, “I want to…, because…”. Build a 150–250-word answer from the best two.',
        ],
        placeholder: 'University and programme: …\n\n1. You have… / I want to…, because…\n2. …\n3. …\n\nAnswer:\n',
      },
      reviewNotes: [
        'The first version could be sent to any university in the world — which is why it works for none.',
        'The second names a specific lab and course, and the interest is backed by the author’s own small project.',
        'The scale (a town of 40,000, a spreadsheet and two weeks of counting) shows initiative honestly, without exaggeration.',
      ],
    },
    kk: {
      title: '«Неге дәл біз»: бағдарламаны зерттеу',
      summary: '«Why us?» сұрағы мақтауды емес, сәйкестікті тексереді: бұл бағдарламадағы нақты не дәл сізге керек. Осындай детальдарды табуды және ұсынуды үйренеміз.',
      points: [
        'Кез келген оқу орнына келетін жауап ешқайсысына келмейді. Рейтингті, «күшті оқытушыларды» және «әдемі кампусты» комиссия өзі біледі.',
        '2–3 нақтылықты іздеңіз: курс немесе модуль, зертхана, профессор және оның зерттеуі, оқыту форматы, студенттік ұйым, алмасу бағдарламасы.',
        'Әр детальды өзіңізбен байланыстырыңыз: «сізде бұл бар» + «мен онымен мынаны істеймін» + «бұл маған неге керек».',
        'Дереккөздер: бағдарлама беті мен оқу жоспары (curriculum), зертханалар сайттары, студенттік блогтар, қабылдау комиссиясының вебинарлары, студенттермен әңгіме.',
        'Қытай университеттері үшін оқыту тілін, бағдарламаның болашақ жұмысыңызбен байланысын және елге қызығушылықты атап өткен пайдалы — бірақ бұл да деректер арқылы.',
      ],
      mistakes: [
        'Сізге не үшін керек екенін түсіндірмей, университет сайтынан мәтінді көшіру.',
        'Бес профессор мен он курсты тізбелеу — каталог шығады.',
        'Жауапты басқа өтінімнен көшіргенде университет немесе бағдарлама атауын қате жазу.',
      ],
      exercise: {
        title: 'Сәйкестік кестесі',
        steps: [
          'Тізіміңізден бір университетті таңдап, бағдарлама беті мен оқу жоспарын ашыңыз.',
          'Тізіміңіздегі басқа университеттерде жоқ (немесе дерлік жоқ) үш нақты нәрсені жазыңыз.',
          'Әрқайсысы үшін байланыс жазыңыз: «Сізде … бар», «Мен …-ны қалаймын, себебі…». Ең жақсы екеуінен 150–250 сөздік жауап құрастырыңыз.',
        ],
        placeholder: 'Университет және бағдарлама: …\n\n1. Сізде … бар / Мен … қалаймын, себебі…\n2. …\n3. …\n\nЖауап:\n',
      },
      reviewNotes: [
        'Бірінші нұсқаны әлемдегі кез келген университетке жіберуге болады — сондықтан ол ешқайсысына жұмыс істемейді.',
        'Екіншісінде нақты зертхана мен курс аталған, ал қызығушылық автордың өз шағын жобасымен расталған.',
        'Міндеттің ауқымы (40 000 тұрғыны бар қала, кесте және екі апталық санау) бастаманы асыра сілтемей, адал көрсетеді.',
      ],
    },
  },
  {
    id: 8,
    module: 'program',
    minutes: 20,
    limit: { words: 150 },
    review: {
      before: 'My study plan is to study hard, gain a lot of knowledge and experience in China, and after graduation contribute to the development of my country and friendship between our nations.',
      after: 'Year 1: HSK 5 and core courses in logistics. Year 2: an elective in cross-border e-commerce and an internship with a Khorgos dry-port operator. Years 3–4: a thesis on customs delays on the China–Kazakhstan border. After graduation I plan to join a freight forwarding company in Almaty.',
    },
    ru: {
      title: 'Короткие ответы и study plan',
      summary: 'Ответы на 50–250 слов и study plan для государственного гранта Китая (CSC) читают быстро. Учимся говорить главное в первой фразе и укладываться в лимит.',
      points: [
        'Короткий ответ — это одна мысль и одно доказательство. Начинайте сразу с сути, без вступления.',
        'Лимит слов — не цель, а потолок. 120 сильных слов лучше, чем 150 с «водой».',
        'Study plan для CSC: обычно 800 слов для магистратуры и 1500 для докторантуры, для бакалавриата — коротко. Нужны цель, план по годам, связь с вузом и планы после выпуска.',
        'Покажите реализм: язык (HSK), конкретные курсы, тему будущей дипломной работы, где вы будете работать после учёбы.',
        'Дополнительные вопросы вузов («опишите сообщество», «интеллектуальный опыт») ищут другую сторону вас — не повторяйте основное эссе.',
      ],
      mistakes: [
        'Общие фразы о дружбе народов и вкладе в развитие страны без конкретного плана.',
        'Повтор основного эссе в каждом коротком ответе.',
        'Превышение лимита: форма обрежет текст, и последняя мысль пропадёт.',
      ],
      exercise: {
        title: 'Study plan на одну страницу',
        steps: [
          'Сформулируйте цель обучения одной фразой: какую проблему или профессию вы выбираете.',
          'Распишите план по годам: язык, ключевые курсы, практика, тема диплома.',
          'Добавьте 1–2 предложения о том, где вы будете работать после выпуска и почему вам нужна именно эта программа. Уложитесь в 150 слов.',
        ],
        placeholder: 'Цель: …\nГод 1: …\nГод 2: …\nГоды 3–4: …\nПосле выпуска: …',
      },
      reviewNotes: [
        'Первую версию мог написать любой кандидат на любую программу — в ней нет ни одного плана.',
        'Вторая разложена по годам: язык, курсы, практика, тема диплома и работа после выпуска.',
        'Реальные места (сухой порт Хоргос, граница Китая и Казахстана) показывают, что автор знает свою отрасль и понимает, зачем едет в Китай.',
      ],
    },
    en: {
      title: 'Short answers and the study plan',
      summary: 'Answers of 50–250 words and the study plan for the Chinese Government Scholarship (CSC) are read quickly. We learn to say the main thing in the first sentence and stay within the limit.',
      points: [
        'A short answer is one idea and one piece of evidence. Start with the point, no introduction.',
        'A word limit is a ceiling, not a target. 120 strong words beat 150 padded ones.',
        'A CSC study plan is usually 800 words for a master’s and 1,500 for a doctorate, and brief for a bachelor’s. It needs a goal, a year-by-year plan, a link to the university and plans after graduation.',
        'Show realism: the language (HSK), specific courses, the topic of your future thesis, where you will work after your studies.',
        'University supplementary questions (“describe a community”, “an intellectual experience”) look for another side of you — do not repeat your main essay.',
      ],
      mistakes: [
        'General phrases about friendship between nations and contributing to your country without a concrete plan.',
        'Repeating the main essay in every short answer.',
        'Going over the limit: the form will cut the text and the last thought disappears.',
      ],
      exercise: {
        title: 'A one-page study plan',
        steps: [
          'State your study goal in one sentence: the problem or profession you choose.',
          'Write a year-by-year plan: language, key courses, internship, thesis topic.',
          'Add 1–2 sentences on where you will work after graduation and why you need this programme. Stay within 150 words.',
        ],
        placeholder: 'Goal: …\nYear 1: …\nYear 2: …\nYears 3–4: …\nAfter graduation: …',
      },
      reviewNotes: [
        'Any applicant could have written the first version for any programme — there is no plan in it.',
        'The second is laid out year by year: language, courses, internship, thesis topic and work after graduation.',
        'Real places (the Khorgos dry port, the China–Kazakhstan border) show the author knows their field and why they are going to China.',
      ],
    },
    kk: {
      title: 'Қысқа жауаптар және study plan',
      summary: '50–250 сөздік жауаптар мен Қытайдың мемлекеттік грантына (CSC) арналған study plan тез оқылады. Басты нәрсені бірінші сөйлемде айтуды және шектеуге сыюды үйренеміз.',
      points: [
        'Қысқа жауап — бір ой және бір дәлел. Кіріспесіз, бірден мәнінен бастаңыз.',
        'Сөз шектеуі — мақсат емес, төбе. 120 күшті сөз «сулы» 150 сөзден жақсы.',
        'CSC үшін study plan: әдетте магистратураға 800 сөз, докторантураға 1500 сөз, бакалавриатқа — қысқа. Мақсат, жылдар бойынша жоспар, университетпен байланыс және бітіргеннен кейінгі жоспар керек.',
        'Шынайылықты көрсетіңіз: тіл (HSK), нақты курстар, болашақ диплом жұмысының тақырыбы, оқудан кейін қайда жұмыс істейтініңіз.',
        'Университеттердің қосымша сұрақтары («қауымдастықты сипаттаңыз», «интеллектуалдық тәжірибе») сіздің басқа қырыңызды іздейді — негізгі эссені қайталамаңыз.',
      ],
      mistakes: [
        'Нақты жоспарсыз халықтар достығы және елдің дамуына үлес туралы жалпы сөздер.',
        'Әр қысқа жауапта негізгі эссені қайталау.',
        'Шектеуден асып кету: форма мәтінді қиып тастайды, соңғы ой жоғалады.',
      ],
      exercise: {
        title: 'Бір беттік study plan',
        steps: [
          'Оқу мақсатын бір сөйлеммен тұжырымдаңыз: қандай мәселені немесе мамандықты таңдайсыз.',
          'Жылдар бойынша жоспар жазыңыз: тіл, негізгі курстар, практика, диплом тақырыбы.',
          'Бітіргеннен кейін қайда жұмыс істейтініңіз және сізге дәл осы бағдарлама неге керек екені туралы 1–2 сөйлем қосыңыз. 150 сөзге сыйыңыз.',
        ],
        placeholder: 'Мақсат: …\n1-жыл: …\n2-жыл: …\n3–4 жылдар: …\nБітіргеннен кейін: …',
      },
      reviewNotes: [
        'Бірінші нұсқаны кез келген үміткер кез келген бағдарламаға жаза алар еді — онда бірде-бір жоспар жоқ.',
        'Екіншісі жылдарға бөлінген: тіл, курстар, практика, диплом тақырыбы және бітіргеннен кейінгі жұмыс.',
        'Нақты орындар (Қорғас құрғақ порты, Қытай–Қазақстан шекарасы) автордың өз саласын білетінін және Қытайға не үшін баратынын көрсетеді.',
      ],
    },
  },
  {
    id: 9,
    module: 'ucas',
    minutes: 20,
    limit: { chars: 4000 },
    review: {
      before: 'Question 1: I have always been fascinated by the human body and I have wanted to be a doctor since I was a little girl. Medicine is a noble profession that combines science and helping people.',
      after: 'Question 1: When my grandmother was diagnosed with type 2 diabetes, I noticed that her doctor spent more time explaining the illness than prescribing for it. I want to study Medicine because I am drawn to that half of the job — turning biology into decisions a patient can actually follow.',
    },
    ru: {
      title: 'UCAS personal statement: три вопроса',
      summary: 'С приёма 2026 года UCAS заменил свободное эссе тремя вопросами. Разбираем новый формат, лимит в 4000 знаков и то, что британские вузы ищут в каждом ответе.',
      points: [
        'Три вопроса: 1) Почему вы хотите изучать этот курс или предмет? 2) Как ваша учёба и квалификации подготовили вас к нему? 3) Что ещё вы сделали для подготовки вне учёбы и чем этот опыт полезен?',
        'Общий лимит — 4000 знаков с пробелами на все три ответа, минимум 350 знаков на каждый. Ориентир: примерно 40% / 30% / 30%.',
        'Одно заявление уходит во все пять выбранных вузов, поэтому пишите о предмете, а не о конкретном университете.',
        'Британские вузы на 70–80% смотрят на академический интерес. Личные истории уместны, только если ведут к предмету.',
        'Сроки: середина октября для Оксфорда, Кембриджа, медицины, стоматологии и ветеринарии; середина января — для остальных курсов (equal consideration). Точные даты сверяйте на ucas.com.',
      ],
      mistakes: [
        'Начинать с «I have always been fascinated…» или «Since I was a child…».',
        'Писать о внеклассных делах, которые никак не связаны с предметом.',
        'Распределить текст неравномерно: 3000 знаков на первый вопрос и по 500 на два других.',
      ],
      exercise: {
        title: 'Черновик трёх ответов',
        steps: [
          'Для вопроса 1 найдите момент, когда предмет впервые стал для вас вопросом, а не школьной темой.',
          'Для вопроса 2 выберите 2 предмета или проекта из школы и для каждого напишите, какой навык он дал для курса.',
          'Для вопроса 3 выберите 1–2 занятия вне школы и объясните, что они показали о вас как будущем студенте. Следите за счётчиком знаков.',
        ],
        placeholder: 'Question 1 — Why this course?\n\n\nQuestion 2 — Your studies\n\n\nQuestion 3 — Outside education\n',
      },
      reviewNotes: [
        'Первая версия начинается с двух самых частых клише в UCAS и не говорит, что именно интересно в медицине.',
        'Вторая берёт реальный эпизод и делает из него точную мысль о профессии: объяснять биологию так, чтобы пациент мог следовать решениям.',
        'Ответ остаётся о предмете, а не о бабушке: история работает как вход в объяснение мотивации.',
      ],
    },
    en: {
      title: 'The UCAS personal statement: three questions',
      summary: 'From 2026 entry UCAS replaced the free-form essay with three questions. We go through the new format, the 4,000-character limit and what UK universities look for in each answer.',
      points: [
        'Three questions: 1) Why do you want to study this course or subject? 2) How have your qualifications and studies helped you prepare for it? 3) What else have you done to prepare outside of education, and why are these experiences useful?',
        'The overall limit is 4,000 characters including spaces across all three answers, with at least 350 characters each. A guide: roughly 40% / 30% / 30%.',
        'One statement goes to all five chosen universities, so write about the subject, not a particular university.',
        'UK universities focus 70–80% on academic interest. Personal stories belong only if they lead to the subject.',
        'Deadlines: mid-October for Oxford, Cambridge, medicine, dentistry and veterinary courses; mid-January for other courses (equal consideration). Check the exact dates on ucas.com.',
      ],
      mistakes: [
        'Opening with “I have always been fascinated…” or “Since I was a child…”.',
        'Writing about extracurriculars that have nothing to do with the subject.',
        'Uneven balance: 3,000 characters for the first question and 500 for each of the others.',
      ],
      exercise: {
        title: 'A draft of the three answers',
        steps: [
          'For question 1, find the moment when the subject first became a question for you rather than a school topic.',
          'For question 2, pick 2 school subjects or projects and for each write which skill it gave you for the course.',
          'For question 3, pick 1–2 activities outside school and explain what they show about you as a future student. Watch the character counter.',
        ],
        placeholder: 'Question 1 — Why this course?\n\n\nQuestion 2 — Your studies\n\n\nQuestion 3 — Outside education\n',
      },
      reviewNotes: [
        'The first version opens with the two most common UCAS clichés and does not say what exactly interests the author in medicine.',
        'The second takes a real episode and turns it into a precise idea about the profession: explaining biology so a patient can follow decisions.',
        'The answer stays about the subject, not the grandmother: the story is a way into explaining motivation.',
      ],
    },
    kk: {
      title: 'UCAS personal statement: үш сұрақ',
      summary: '2026 жылғы қабылдаудан бастап UCAS еркін эссені үш сұрақпен алмастырды. Жаңа форматты, 4000 таңба шектеуін және британ университеттерінің әр жауаптан не іздейтінін талдаймыз.',
      points: [
        'Үш сұрақ: 1) Бұл курсты немесе пәнді неге оқығыңыз келеді? 2) Оқуыңыз бен біліктіліктеріңіз сізді оған қалай дайындады? 3) Оқудан тыс дайындық үшін тағы не істедіңіз және бұл тәжірибе неге пайдалы?',
        'Жалпы шектеу — үш жауапқа барлығы бос орындармен 4000 таңба, әрқайсысына кемінде 350 таңба. Бағдар: шамамен 40% / 30% / 30%.',
        'Бір мәлімдеме таңдалған бес университеттің бәріне жіберіледі, сондықтан нақты университет туралы емес, пән туралы жазыңыз.',
        'Британ университеттері 70–80%-ға академиялық қызығушылыққа қарайды. Жеке оқиғалар пәнге алып келсе ғана орынды.',
        'Мерзімдер: Оксфорд, Кембридж, медицина, стоматология және ветеринария үшін қазанның ортасы; қалған курстар үшін қаңтардың ортасы (equal consideration). Нақты күндерді ucas.com сайтынан тексеріңіз.',
      ],
      mistakes: [
        '«I have always been fascinated…» немесе «Since I was a child…» деп бастау.',
        'Пәнге еш қатысы жоқ сабақтан тыс істер туралы жазу.',
        'Мәтінді тең бөлмеу: бірінші сұраққа 3000 таңба, қалған екеуіне 500-ден.',
      ],
      exercise: {
        title: 'Үш жауаптың жобасы',
        steps: [
          '1-сұрақ үшін пән сіз үшін алғаш рет мектеп тақырыбы емес, сұраққа айналған сәтті табыңыз.',
          '2-сұрақ үшін мектептен 2 пән немесе жобаны таңдап, әрқайсысы курсқа қандай дағды бергенін жазыңыз.',
          '3-сұрақ үшін мектептен тыс 1–2 іс-әрекетті таңдап, олар сізді болашақ студент ретінде қалай көрсететінін түсіндіріңіз. Таңба санағышын қадағалаңыз.',
        ],
        placeholder: 'Question 1 — Why this course?\n\n\nQuestion 2 — Your studies\n\n\nQuestion 3 — Outside education\n',
      },
      reviewNotes: [
        'Бірінші нұсқа UCAS-тағы ең жиі екі клишеден басталады және медицинада нақты не қызықтыратынын айтпайды.',
        'Екіншісі нақты эпизодты алып, одан мамандық туралы дәл ой жасайды: биологияны пациент шешімдерді орындай алатындай түсіндіру.',
        'Жауап әже туралы емес, пән туралы болып қалады: оқиға уәжді түсіндіруге кіріспе ретінде жұмыс істейді.',
      ],
    },
  },
  {
    id: 10,
    module: 'ucas',
    minutes: 20,
    review: {
      before: 'Question 3: I read many books about economics, for example “Freakonomics”. I also took part in a Model UN conference and I volunteer at an animal shelter. These activities developed my communication and teamwork skills.',
      after: 'Question 3: “Freakonomics” convinced me that incentives explain almost everything — until I read Ha-Joon Chang, who argues that institutions matter more. To test the two ideas, I compared bread prices in Almaty markets before and after the 2024 subsidy change. My data were messy, but they made me want to learn econometrics properly.',
    },
    ru: {
      title: 'Академические доказательства: суперкуррикулярная активность',
      summary: 'Британские и многие европейские вузы ищут не просто активность, а то, как вы выходите за пределы школьной программы в своём предмете. Учимся писать об этом по формуле «что — что понял — что дальше».',
      points: [
        'Суперкуррикулярное — это всё, что углубляет предмет: книги, онлайн-курсы (MOOC), лекции, олимпиады, собственные мини-исследования, научные кружки, стажировки.',
        'Работает формула ABC: Action — что вы сделали; Benefit — что вы поняли или чему научились; Course — как это связано с будущим курсом.',
        'Одна книга, разобранная по существу, сильнее списка из десяти названий. Покажите, что вы спорите с идеями, а не просто их потребляете.',
        'Внеклассные занятия (спорт, волонтёрство, работа) уместны в вопросе 3, если вы объясните, какой навык они дают для учёбы — например, тайм-менеджмент или работу с людьми для медицины.',
      ],
      mistakes: [
        'Список книг и курсов без единой мысли о них.',
        'Навыки «communication и teamwork» без доказательств и связи с предметом.',
        'Упоминание книги, которую вы не читали, — на интервью в Оксфорде и Кембридже о ней спросят.',
      ],
      exercise: {
        title: 'ABC для двух активностей',
        steps: [
          'Выберите две вещи, которые вы сделали в своём предмете вне уроков.',
          'Для каждой напишите три строки: Action, Benefit, Course.',
          'Соедините их в абзац так, чтобы вторая активность вытекала из вопроса, который оставила первая.',
        ],
        placeholder: 'Активность 1\nAction: …\nBenefit: …\nCourse: …\n\nАктивность 2\nAction: …\nBenefit: …\nCourse: …\n\nАбзац:\n',
      },
      reviewNotes: [
        'Первая версия перечисляет занятия и заканчивается общими навыками, которые ничего не говорят о предмете.',
        'Вторая показывает спор двух идей и то, как автор попытался проверить их сам на реальных данных.',
        'Честное признание «my data were messy» превращается в мотивацию учиться — это ровно то, что ищет экономический факультет.',
      ],
    },
    en: {
      title: 'Academic evidence: supercurricular activities',
      summary: 'UK and many European universities look not just for activities but for how you go beyond the school syllabus in your subject. We learn to write about it with the formula “what — what I learned — what next”.',
      points: [
        'Supercurricular means anything that deepens the subject: books, online courses (MOOCs), lectures, olympiads, your own small research, science clubs, internships.',
        'Use the ABC formula: Action — what you did; Benefit — what you understood or learned; Course — how it links to the future course.',
        'One book discussed in substance beats a list of ten titles. Show that you argue with ideas rather than simply consume them.',
        'Extracurriculars (sport, volunteering, work) fit question 3 if you explain which skill they give you for study — for example, time management, or working with people for medicine.',
      ],
      mistakes: [
        'A list of books and courses without a single thought about them.',
        '“Communication and teamwork” skills with no evidence and no link to the subject.',
        'Mentioning a book you have not read — at Oxford and Cambridge interviews you will be asked about it.',
      ],
      exercise: {
        title: 'ABC for two activities',
        steps: [
          'Pick two things you have done in your subject outside lessons.',
          'For each, write three lines: Action, Benefit, Course.',
          'Join them into a paragraph so that the second activity follows from a question the first one left open.',
        ],
        placeholder: 'Activity 1\nAction: …\nBenefit: …\nCourse: …\n\nActivity 2\nAction: …\nBenefit: …\nCourse: …\n\nParagraph:\n',
      },
      reviewNotes: [
        'The first version lists activities and ends with general skills that say nothing about the subject.',
        'The second shows two ideas in conflict and how the author tried to test them with real data.',
        'The honest “my data were messy” becomes a motivation to learn — exactly what an economics department looks for.',
      ],
    },
    kk: {
      title: 'Академиялық дәлелдер: суперкуррикулярлық белсенділік',
      summary: 'Британ және көптеген еуропалық университеттер жай белсенділікті емес, өз пәніңізде мектеп бағдарламасынан қалай шығатыныңызды іздейді. Бұл туралы «не — не түсіндім — әрі қарай не» формуласымен жазуды үйренеміз.',
      points: [
        'Суперкуррикулярлық — пәнді тереңдететін бәрі: кітаптар, онлайн-курстар (MOOC), дәрістер, олимпиадалар, өз шағын зерттеулеріңіз, ғылыми үйірмелер, тағылымдамалар.',
        'ABC формуласы жұмыс істейді: Action — не істедіңіз; Benefit — не түсіндіңіз немесе үйрендіңіз; Course — оның болашақ курспен байланысы.',
        'Мәні бойынша талданған бір кітап он атаудың тізімінен күшті. Идеяларды жай тұтынбай, олармен дауласатыныңызды көрсетіңіз.',
        'Сабақтан тыс істер (спорт, волонтерлік, жұмыс) 3-сұраққа сай келеді, егер олардың оқуға қандай дағды беретінін түсіндірсеңіз — мысалы, уақытты басқару немесе медицина үшін адамдармен жұмыс.',
      ],
      mistakes: [
        'Олар туралы бірде-бір ойсыз кітаптар мен курстар тізімі.',
        'Дәлелсіз және пәнмен байланыссыз «communication және teamwork» дағдылары.',
        'Оқымаған кітапты атау — Оксфорд пен Кембридж сұхбатында ол туралы сұрайды.',
      ],
      exercise: {
        title: 'Екі белсенділік үшін ABC',
        steps: [
          'Пәніңіз бойынша сабақтан тыс істеген екі нәрсені таңдаңыз.',
          'Әрқайсысы үшін үш жол жазыңыз: Action, Benefit, Course.',
          'Екінші белсенділік біріншісі қалдырған сұрақтан туындайтындай етіп, оларды бір абзацқа біріктіріңіз.',
        ],
        placeholder: '1-белсенділік\nAction: …\nBenefit: …\nCourse: …\n\n2-белсенділік\nAction: …\nBenefit: …\nCourse: …\n\nАбзац:\n',
      },
      reviewNotes: [
        'Бірінші нұсқа іс-әрекеттерді тізбелеп, пән туралы ештеңе айтпайтын жалпы дағдылармен аяқталады.',
        'Екіншісі екі идеяның тартысын және автордың оларды нақты деректермен өзі тексеруге тырысқанын көрсетеді.',
        'Адал «my data were messy» оқуға деген уәжге айналады — экономика факультеті дәл осыны іздейді.',
      ],
    },
  },
  {
    id: 11,
    module: 'edit',
    minutes: 20,
    review: {
      before: 'It was at that moment that I suddenly realized that I really wanted to try to become someone who is able to actually help other people in a meaningful way, which was something that I had never really thought about before.',
      after: 'That was the first time I wanted to be useful rather than impressive.',
    },
    ru: {
      title: 'Редактура в три прохода',
      summary: 'Черновик написан — теперь его нужно сделать вдвое сильнее и, скорее всего, короче. Разбираем редактуру по слоям: смысл, абзацы, предложения.',
      points: [
        'Проход 1 — смысл: перечитайте эссе целиком и запишите главную мысль одной фразой. Если она изменилась по сравнению с планом, решите, какая сильнее.',
        'Проход 2 — абзацы: у каждого абзаца одна задача. Если абзац можно убрать без потери смысла — уберите.',
        'Проход 3 — предложения: убирайте слова-паразиты (really, very, actually, just, that), пассив и цепочки «which was something that…».',
        'Отложите текст хотя бы на день перед каждым проходом: свежий взгляд замечает в разы больше.',
        'Сокращение на 20–30% почти всегда делает эссе лучше.',
      ],
      mistakes: [
        'Начинать с запятых и грамматики, пока не ясна структура.',
        'Жалеть удачную фразу, которая не работает на главную мысль.',
        'Править на экране без перерывов — глаз «замыливается».',
      ],
      exercise: {
        title: 'Сократить абзац на треть',
        steps: [
          'Выберите самый длинный абзац черновика и посчитайте в нём слова.',
          'Вычеркните все слова-паразиты и повторы, замените пассив на актив.',
          'Перепишите абзац так, чтобы он стал на треть короче без потери смысла. Сравните длину.',
        ],
        placeholder: 'Было (… слов):\n\n\nСтало (… слов):\n',
      },
      reviewNotes: [
        '43 слова первой версии сжаты до 12 — мысль стала яснее, а не беднее.',
        'Исчезли «suddenly realized», «really», «actually», «try to» и громоздкое «which was something that».',
        'Противопоставление «useful rather than impressive» звучит как вывод автора, а не как оправдание.',
      ],
    },
    en: {
      title: 'Editing in three passes',
      summary: 'The draft is written — now it needs to become twice as strong and probably shorter. We edit in layers: meaning, paragraphs, sentences.',
      points: [
        'Pass 1 — meaning: reread the whole essay and write the main idea in one sentence. If it has changed since your plan, decide which one is stronger.',
        'Pass 2 — paragraphs: each paragraph has one job. If a paragraph can go without losing meaning, cut it.',
        'Pass 3 — sentences: remove filler words (really, very, actually, just, that), passive voice and chains like “which was something that…”.',
        'Put the text aside for at least a day before each pass: fresh eyes notice far more.',
        'Cutting 20–30% almost always makes an essay better.',
      ],
      mistakes: [
        'Starting with commas and grammar before the structure is clear.',
        'Holding on to a nice phrase that does not serve the main idea.',
        'Editing on screen without breaks — your eye gets used to the text.',
      ],
      exercise: {
        title: 'Cut a paragraph by a third',
        steps: [
          'Pick the longest paragraph in your draft and count its words.',
          'Strike out all filler words and repetitions, and turn passive into active.',
          'Rewrite the paragraph so it is a third shorter with no loss of meaning. Compare the length.',
        ],
        placeholder: 'Before (… words):\n\n\nAfter (… words):\n',
      },
      reviewNotes: [
        'The 43 words of the first version shrink to 12 — the idea became clearer, not poorer.',
        '“Suddenly realized”, “really”, “actually”, “try to” and the clumsy “which was something that” are gone.',
        'The contrast “useful rather than impressive” reads as the author’s conclusion, not an excuse.',
      ],
    },
    kk: {
      title: 'Үш өтуде редакциялау',
      summary: 'Жоба жазылды — енді оны екі есе күшті және, сірә, қысқарақ ету керек. Редакциялауды қабаттар бойынша талдаймыз: мағына, абзацтар, сөйлемдер.',
      points: [
        '1-өту — мағына: эссені толық қайта оқып, негізгі ойды бір сөйлеммен жазыңыз. Егер ол жоспармен салыстырғанда өзгерсе, қайсысы күштірек екенін шешіңіз.',
        '2-өту — абзацтар: әр абзацтың бір міндеті бар. Абзацты мағынасын жоғалтпай алып тастауға болса — алып тастаңыз.',
        '3-өту — сөйлемдер: паразит сөздерді (really, very, actually, just, that), ырықсыз етісті және «which was something that…» тізбектерін алып тастаңыз.',
        'Әр өту алдында мәтінді кемінде бір күнге қалдырыңыз: жаңа көзқарас әлдеқайда көп нәрсені байқайды.',
        '20–30%-ға қысқарту эссені әрдайым дерлік жақсартады.',
      ],
      mistakes: [
        'Құрылым анық болмай тұрып, үтірлер мен грамматикадан бастау.',
        'Негізгі ойға қызмет етпейтін сәтті сөйлемді аяу.',
        'Экранда үзіліссіз түзету — көз үйреніп қалады.',
      ],
      exercise: {
        title: 'Абзацты үштен бірге қысқарту',
        steps: [
          'Жобаның ең ұзын абзацын таңдап, ондағы сөздерді санаңыз.',
          'Барлық паразит сөздер мен қайталауларды сызып, ырықсыз етісті белсендіге ауыстырыңыз.',
          'Абзацты мағынасын жоғалтпай үштен бірге қысқа болатындай қайта жазыңыз. Ұзындығын салыстырыңыз.',
        ],
        placeholder: 'Бұрын (… сөз):\n\n\nКейін (… сөз):\n',
      },
      reviewNotes: [
        'Бірінші нұсқаның 43 сөзі 12-ге дейін қысқарды — ой кедейленген жоқ, анықтала түсті.',
        '«Suddenly realized», «really», «actually», «try to» және ебедейсіз «which was something that» жоғалды.',
        '«Useful rather than impressive» қарама-қайшылығы ақталу емес, автордың қорытындысы ретінде естіледі.',
      ],
    },
  },
  {
    id: 12,
    module: 'edit',
    minutes: 25,
    review: {
      before: 'In conclusion, this experience taught me many valuable lessons. I learned the importance of hard work, perseverance and never giving up. I am sure that these qualities will help me succeed at your university and in my future career.',
      after: 'The village school now has a generator, and I still have my phone with a cracked screen. On the back of it there is a sticker one of the students gave me: a lightning bolt with a smile. I keep it there to remember that the lesson worked not because of the plan, but because I kept talking when the lights went out.',
    },
    ru: {
      title: 'Финальная проверка и разбор полной правки',
      summary: 'Последний урок: как написать финал, который запомнится, как собрать обратную связь и что проверить перед кнопкой «Submit».',
      points: [
        'Финал не подводит итог, а закрывает круг: вернитесь к образу из начала или покажите, как он изменился. Не начинайте его со «In conclusion».',
        'Обратная связь: дайте текст двум людям — тому, кто хорошо знает вас, и тому, кто не знает совсем. Спросите: «Что ты запомнил(а)? Каким ты меня видишь по этому тексту?».',
        'Не позволяйте чужим правкам заменить ваш голос. Принимайте замечания о ясности, а не о стиле «как надо».',
        'Чек-лист перед отправкой: лимит слов или знаков, название вуза и программы, ответ на заданный вопрос, отсутствие клише в первой и последней строке, орфография (проверьте вслух и через проверку правописания).',
        'Вставьте текст в форму заранее: некоторые системы иначе считают знаки и ломают форматирование, курсив и кавычки.',
      ],
      mistakes: [
        'Финал-мораль: «это научило меня никогда не сдаваться».',
        'Отправка в последний день, когда сайт перегружен.',
        'Одинаковое эссе для разных вопросов без адаптации.',
      ],
      exercise: {
        title: 'Финал и чек-лист',
        steps: [
          'Перепишите последний абзац так, чтобы он перекликался с первой сценой эссе.',
          'Отправьте эссе двум читателям и запишите, что они запомнили. Совпадает ли это с вашей главной мыслью?',
          'Пройдите чек-лист из теории и отметьте, что исправили.',
        ],
        placeholder: 'Новый финал:\n\n\nЧто запомнили читатели:\n1.\n2.\n\nЧек-лист:\n[ ] лимит\n[ ] название вуза и программы\n[ ] ответ на вопрос\n[ ] первая и последняя строка без клише\n[ ] орфография',
      },
      reviewNotes: [
        'Первая версия — набор фраз, которые можно приклеить к любому эссе.',
        'Вторая возвращается к сцене из урока 4 (отключение света, телефон) и показывает, что изменилось с тех пор.',
        'Наклейка с молнией — конкретный образ, на котором текст заканчивается. Вывод звучит как личное наблюдение, а не как мораль.',
      ],
    },
    en: {
      title: 'Final check and a full edit breakdown',
      summary: 'The last lesson: how to write an ending people remember, how to collect feedback and what to check before you press “Submit”.',
      points: [
        'The ending does not sum up — it closes the circle: return to the image from the opening or show how it has changed. Do not start it with “In conclusion”.',
        'Feedback: give the text to two people — someone who knows you well and someone who does not know you at all. Ask: “What do you remember? How do you see me from this text?”.',
        'Do not let other people’s edits replace your voice. Take comments on clarity, not on how it “should” sound.',
        'Checklist before sending: word or character limit, university and programme name, an answer to the question asked, no clichés in the first and last line, spelling (read aloud and run a spell check).',
        'Paste the text into the form early: some systems count characters differently and break formatting, italics and quotation marks.',
      ],
      mistakes: [
        'A moral ending: “this taught me never to give up”.',
        'Submitting on the last day when the site is overloaded.',
        'The same essay for different questions without adapting it.',
      ],
      exercise: {
        title: 'The ending and the checklist',
        steps: [
          'Rewrite the last paragraph so it echoes the first scene of the essay.',
          'Send the essay to two readers and write down what they remembered. Does it match your main idea?',
          'Go through the checklist from the lesson and mark what you fixed.',
        ],
        placeholder: 'New ending:\n\n\nWhat readers remembered:\n1.\n2.\n\nChecklist:\n[ ] limit\n[ ] university and programme name\n[ ] answers the question\n[ ] no clichés in the first and last line\n[ ] spelling',
      },
      reviewNotes: [
        'The first version is a set of phrases you could stick onto any essay.',
        'The second returns to the scene from lesson 4 (the power cut, the phone) and shows what has changed since.',
        'The lightning-bolt sticker is a concrete image to end on. The conclusion sounds like a personal observation, not a moral.',
      ],
    },
    kk: {
      title: 'Соңғы тексеру және толық түзетуді талдау',
      summary: 'Соңғы сабақ: есте қалатын финалды қалай жазу, кері байланысты қалай жинау және «Submit» батырмасының алдында нені тексеру керек.',
      points: [
        'Финал қорытынды жасамайды, шеңберді жабады: басындағы бейнеге оралыңыз немесе оның қалай өзгергенін көрсетіңіз. Оны «In conclusion» деп бастамаңыз.',
        'Кері байланыс: мәтінді екі адамға беріңіз — сізді жақсы білетінге және мүлде білмейтінге. Сұраңыз: «Не есіңде қалды? Осы мәтін бойынша мені қандай көресің?».',
        'Бөтен түзетулер дауысыңызды алмастырмасын. Анықтық туралы ескертулерді қабылдаңыз, «қалай болу керек» стилі туралы емес.',
        'Жіберер алдындағы чек-лист: сөз немесе таңба шектеуі, университет пен бағдарлама атауы, қойылған сұраққа жауап, бірінші және соңғы жолда клишенің болмауы, емле (дауыстап оқып, емле тексеруінен өткізіңіз).',
        'Мәтінді формаға алдын ала қойыңыз: кейбір жүйелер таңбаларды басқаша санайды және пішімдеуді, курсив пен тырнақшаларды бұзады.',
      ],
      mistakes: [
        'Финал-мораль: «бұл мені ешқашан берілмеуге үйретті».',
        'Сайт шамадан тыс жүктелген соңғы күні жіберу.',
        'Әртүрлі сұрақтарға бейімдемей бірдей эссе жіберу.',
      ],
      exercise: {
        title: 'Финал және чек-лист',
        steps: [
          'Соңғы абзацты эссенің бірінші көрінісімен үндесетіндей қайта жазыңыз.',
          'Эссені екі оқырманға жіберіп, олардың не есте сақтағанын жазыңыз. Бұл негізгі ойыңызбен сәйкес келе ме?',
          'Теориядағы чек-листтен өтіп, нені түзеткеніңізді белгілеңіз.',
        ],
        placeholder: 'Жаңа финал:\n\n\nОқырмандар не есте сақтады:\n1.\n2.\n\nЧек-лист:\n[ ] шектеу\n[ ] университет пен бағдарлама атауы\n[ ] сұраққа жауап\n[ ] бірінші және соңғы жол клишесіз\n[ ] емле',
      },
      reviewNotes: [
        'Бірінші нұсқа — кез келген эссеге жапсыруға болатын сөйлемдер жиынтығы.',
        'Екіншісі 4-сабақтағы көрініске (жарықтың сөнуі, телефон) оралып, содан бері не өзгергенін көрсетеді.',
        'Найзағай жапсырмасы — мәтін аяқталатын нақты бейне. Қорытынды мораль емес, жеке бақылау ретінде естіледі.',
      ],
    },
  },
]

export const ESSAY_LESSON_COUNT = ESSAY_LESSONS.length

export const essayLessonText = (lesson, lang) => lesson[lang] || lesson.ru
export const essayModuleTitle = (moduleId, lang) => {
  const item = ESSAY_MODULES.find(entry => entry.id === moduleId)
  return item ? item[lang] || item.ru : ''
}

// Счётчик для поля упражнения: слова для Common App, знаки с пробелами для UCAS.
export const countText = (text, limit) => {
  if (limit?.chars) return text.length
  const words = text.trim().match(/\S+/g)
  return words ? words.length : 0
}
