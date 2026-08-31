export const translations = {
  en: {
    title: 'Chinese Universities',
    subtitle: 'Study in China',
    searchPlaceholder: 'Search university or city...',
    filterAll: 'All',
    regions: { North: 'North', East: 'East', Central: 'Central', South: 'South', West: 'West' },
    loading: 'Loading universities...',
    location: (city) => `${city}`,
    region: (region) => `Region: ${region}`,
    ranking: (rank) => `#${rank}`,
    tuition: 'Tuition',
    learnMore: 'Learn more',
    agencyHandled: (count) => `Handled by agency • ${count} students`,
    requirements: 'Requirements',
    specialties: 'Specialties',
    back: '← Back',
    handledBy: 'Handled by',
    visitWebsite: 'Visit website',
    submitApplication: 'Submit Application',
    wantToApply: 'I want to apply',
    signIn: 'Sign In',
    signUp: 'Sign Up',
    email: 'Email',
    password: 'Password',
    fullName: 'Full name',
    createAccount: 'Create Account',
    signInBtn: 'Sign In',
    dontHaveAccount: "Don't have an account?",
    haveAccount: 'Already have an account?',
    logout: 'Logout',
    error: 'Error',
    specialtyNames: {
      'Business': 'Business',
      'Computer Science': 'Computer Science',
      'Economics': 'Economics',
      'Engineering': 'Engineering',
      'Law': 'Law',
      'Liberal Arts': 'Liberal Arts',
      'Medicine': 'Medicine'
    }
  },
  ru: {
    title: 'Китайские университеты',
    subtitle: 'Учись в Китае',
    searchPlaceholder: 'Поиск университета или города...',
    filterAll: 'Все',
    regions: { North: 'Север', East: 'Восток', Central: 'Центр', South: 'Юг', West: 'Запад' },
    loading: 'Загрузка университетов...',
    location: (city) => `${city}`,
    region: (region) => `Регион: ${region}`,
    ranking: (rank) => `#${rank}`,
    tuition: 'Стоимость обучения',
    learnMore: 'Подробнее',
    agencyHandled: (count) => `Работает агентство • ${count} студентов`,
    requirements: 'Требования',
    specialties: 'Специальности',
    back: '← Назад',
    handledBy: 'Работает с нами',
    visitWebsite: 'Посетить сайт',
    submitApplication: 'Подать заявку',
    wantToApply: 'Я хочу подать заявку',
    signIn: 'Войти',
    signUp: 'Регистрация',
    email: 'Email',
    password: 'Пароль',
    fullName: 'Полное имя',
    createAccount: 'Создать аккаунт',
    signInBtn: 'Войти',
    dontHaveAccount: 'Нет аккаунта?',
    haveAccount: 'Уже есть аккаунт?',
    logout: 'Выход',
    error: 'Ошибка',
    specialtyNames: {
      'Business': 'Бизнес',
      'Computer Science': 'Информатика',
      'Economics': 'Экономика',
      'Engineering': 'Инженерия',
      'Law': 'Право',
      'Liberal Arts': 'Гуманитарные науки',
      'Medicine': 'Медицина'
    }
  },
  kk: {
    title: 'Қытай университеттері',
    subtitle: 'Қытайда оқы',
    searchPlaceholder: 'Университет немесе қаланы іздеңіз...',
    filterAll: 'Барлығы',
    regions: { North: 'Солтүстік', East: 'Шығыс', Central: 'Орталық', South: 'Оңтүстік', West: 'Батыс' },
    loading: 'Университеттер жүктелінде...',
    location: (city) => `${city}`,
    region: (region) => `Аймақ: ${region}`,
    ranking: (rank) => `#${rank}`,
    tuition: 'Оқу төлемі',
    learnMore: 'Толығырақ',
    agencyHandled: (count) => `Агенттік істеледі • ${count} студент`,
    requirements: 'Талаптар',
    specialties: 'Мамандықтар',
    back: '← Артқа',
    handledBy: 'Біздің агенттік',
    visitWebsite: 'Сайтты ашу',
    submitApplication: 'Өтінім беру',
    wantToApply: 'Мен өтінім бергісі келемін',
    signIn: 'Кіру',
    signUp: 'Тіркелу',
    email: 'Email',
    password: 'Пароль',
    fullName: 'Толық аты',
    createAccount: 'Аккаунт құру',
    signInBtn: 'Кіру',
    dontHaveAccount: 'Аккаунтыңыз жоқ па?',
    haveAccount: 'Өзіңіздің аккаунтыңыз барма?',
    logout: 'Шығу',
    error: 'Қате',
    specialtyNames: {
      'Business': 'Бизнес',
      'Computer Science': 'Компьютерлық ғылым',
      'Economics': 'Экономика',
      'Engineering': 'Инженерия',
      'Law': 'Құқық',
      'Liberal Arts': 'Ғылым және өндіктер',
      'Medicine': 'Медицина'
    }
  },
}

export const useTranslation = (lang) => {
  return (key, ...args) => {
    const keys = key.split('.')
    let value = translations[lang] || translations.en

    for (const k of keys) {
      value = value[k]
      if (!value) return key
    }

    if (typeof value === 'function') {
      return value(...args)
    }
    return value
  }
}
