// Пробный тест по английскому в формате IELTS: Reading (два текста) и
// Grammar & Vocabulary. Тексты и задания авторские — официальные материалы
// IELTS защищены авторским правом. Балл ориентировочный, это не результат IELTS.

const TFNG = ['TRUE', 'FALSE', 'NOT GIVEN']

export const IELTS_SECTIONS = [
  {
    id: 'reading1',
    title: 'Reading · Passage 1',
    passageTitle: 'Farming on the Rooftops',
    passage: [
      'Across many large cities, flat rooftops that once held only air-conditioning units are being turned into small farms. Supporters argue that rooftop farming brings several benefits at once. Plants absorb rainwater that would otherwise rush into overloaded drains, and a layer of soil and leaves helps to keep the building below cooler in summer, reducing the energy needed for air conditioning. Fresh vegetables grown on a roof also travel only a few metres to local shops and restaurants, rather than hundreds of kilometres by truck.',
      'However, rooftop farms are not as simple to build as they might appear. Before any soil is added, engineers must check whether the roof can carry the extra weight, which increases sharply when the soil is wet. Many older buildings need expensive reinforcement, and this cost alone has stopped a number of projects. Water supply is another challenge, since pumping water to the top of a tall building requires energy.',
      'The economic picture is also mixed. Most rooftop farms produce high-value crops such as herbs and salad leaves, which grow quickly and sell at good prices. Staple foods like wheat or rice, which need large areas, are rarely grown. For this reason, experts agree that rooftop farming will never feed an entire city. Its real value, they suggest, may lie in education: many projects invite schoolchildren to plant seeds and learn where their food comes from.',
    ],
    instructions: 'Questions 1–4: Do the statements agree with the information in the passage? Choose TRUE, FALSE or NOT GIVEN. Questions 5–7: choose the correct answer.',
    questions: [
      { id: 'r1q1', text: 'Rooftop plants can reduce the amount of rainwater entering city drains.', options: TFNG, answer: 'TRUE' },
      { id: 'r1q2', text: 'Wet soil weighs less than dry soil.', options: TFNG, answer: 'FALSE' },
      { id: 'r1q3', text: 'Most rooftop farms in the world are located in Asia.', options: TFNG, answer: 'NOT GIVEN' },
      { id: 'r1q4', text: 'The cost of strengthening old buildings has prevented some rooftop farms from being built.', options: TFNG, answer: 'TRUE' },
      { id: 'r1q5', text: 'Why do most rooftop farms grow herbs and salad leaves?', options: ['They need very little water.', 'They grow fast and sell at good prices.', 'Restaurants refuse to buy other crops.', 'They are easier to transport.'], answer: 'They grow fast and sell at good prices.' },
      { id: 'r1q6', text: 'According to experts, rooftop farming…', options: ['could replace traditional agriculture.', 'will soon feed most city residents.', 'cannot supply all the food a city needs.', 'is too expensive to continue.'], answer: 'cannot supply all the food a city needs.' },
      { id: 'r1q7', text: 'According to the last paragraph, the real value of rooftop farms may be in…', options: ['producing cheaper vegetables.', 'cooling city streets.', 'teaching children about food.', 'creating new jobs.'], answer: 'teaching children about food.' },
    ],
  },
  {
    id: 'reading2',
    title: 'Reading · Passage 2',
    passageTitle: 'Why Sleep Helps Us Learn',
    passage: [
      'For a long time, sleep was seen simply as a period of rest when the brain switched off. Research over the last few decades has shown that this view is wrong. During sleep, the brain remains highly active, and one of its most important tasks is to strengthen memories formed during the day.',
      'In a typical experiment, volunteers learn a list of word pairs in the evening. Half of them then sleep normally, while the other half stay awake through the night. When both groups are tested the next day, the people who slept usually remember significantly more. Interestingly, an advantage appears even when the sleepers are allowed only a short nap of around ninety minutes, which suggests that the timing of sleep may matter as much as its total length.',
      'Scientists believe that deep sleep, which occurs mostly in the first half of the night, is especially important for facts and vocabulary, while the lighter dream sleep that dominates the early morning seems to support skills and creative problem-solving. This may explain why students who stay up late and then wake early for an exam often perform worse than expected: they cut short exactly the stage of sleep that helps to organise new information.',
      'The practical advice is clear. Rather than studying through the night before an important test, learners should review the material in the evening and then get a full night of sleep.',
    ],
    instructions: 'Questions 8–11: Do the statements agree with the information in the passage? Choose TRUE, FALSE or NOT GIVEN. Questions 12–14: choose the correct answer.',
    questions: [
      { id: 'r2q1', text: 'The brain is mostly inactive during sleep.', options: TFNG, answer: 'FALSE' },
      { id: 'r2q2', text: 'In the experiment, volunteers who slept remembered more word pairs.', options: TFNG, answer: 'TRUE' },
      { id: 'r2q3', text: 'All the volunteers in the experiment were university students.', options: TFNG, answer: 'NOT GIVEN' },
      { id: 'r2q4', text: 'A short nap gave the volunteers no advantage.', options: TFNG, answer: 'FALSE' },
      { id: 'r2q5', text: 'Deep sleep is particularly useful for remembering…', options: ['physical skills.', 'facts and vocabulary.', 'dreams.', 'creative ideas.'], answer: 'facts and vocabulary.' },
      { id: 'r2q6', text: 'Students who stay up late and wake early for an exam may perform badly because they…', options: ['feel too nervous.', 'miss part of the sleep that organises new information.', 'forget to review the material.', 'get too much deep sleep.'], answer: 'miss part of the sleep that organises new information.' },
      { id: 'r2q7', text: 'What does the writer recommend before an important test?', options: ['Studying all night.', 'Taking several short naps.', 'Reviewing in the evening and then sleeping well.', 'Waking up early to revise.'], answer: 'Reviewing in the evening and then sleeping well.' },
    ],
  },
  {
    id: 'language',
    title: 'Grammar & Vocabulary',
    instructions: 'Questions 15–30: choose the correct option.',
    questions: [
      { id: 'g1', text: 'If I ___ more time, I would travel around Asia.', options: ['have', 'had', 'will have', 'am having'], answer: 'had' },
      { id: 'g2', text: 'She has lived in Almaty ___ 2019.', options: ['for', 'since', 'from', 'during'], answer: 'since' },
      { id: 'g3', text: 'By the time we arrived, the film ___.', options: ['already started', 'has already started', 'had already started', 'was already starting'], answer: 'had already started' },
      { id: 'g4', text: 'The new library, ___ opened last month, is very popular with students.', options: ['that', 'what', 'which', 'who'], answer: 'which' },
      { id: 'g5', text: 'I’m not used to ___ up so early.', options: ['get', 'getting', 'got', 'be getting'], answer: 'getting' },
      { id: 'g6', text: 'Hardly ___ begun when the fire alarm went off.', options: ['the exam had', 'had the exam', 'has the exam', 'the exam has'], answer: 'had the exam' },
      { id: 'g7', text: 'The government should ___ more money in public transport.', options: ['invest', 'spend', 'pay', 'cost'], answer: 'invest' },
      { id: 'g8', text: 'Many students find it difficult to ___ with stress during exams.', options: ['cope', 'overcome', 'handle', 'survive'], answer: 'cope' },
      { id: 'g9', text: 'The number of international students ___ increased dramatically.', options: ['have', 'has', 'are', 'were'], answer: 'has' },
      { id: 'g10', text: 'Choose the word closest in meaning to “significant”.', options: ['tiny', 'important', 'obvious', 'similar'], answer: 'important' },
      { id: 'g11', text: 'Choose the word closest in meaning to “decline” in “a decline in sales”.', options: ['growth', 'fall', 'change', 'peak'], answer: 'fall' },
      { id: 'g12', text: 'He apologised ___ late for the meeting.', options: ['to be', 'for being', 'being', 'that he is'], answer: 'for being' },
      { id: 'g13', text: 'Unless you ___ harder, you won’t pass the test.', options: ['study', 'will study', 'don’t study', 'studied'], answer: 'study' },
      { id: 'g14', text: 'The results were ___ than we had expected.', options: ['more better', 'much better', 'more good', 'best'], answer: 'much better' },
      { id: 'g15', text: 'Which sentence is correct?', options: ['Despite of the rain, we went out.', 'Although the rain, we went out.', 'Despite the rain, we went out.', 'In spite the rain, we went out.'], answer: 'Despite the rain, we went out.' },
      { id: 'g16', text: 'The project was a success; ___, it went over budget.', options: ['therefore', 'however', 'because', 'moreover'], answer: 'however' },
    ],
  },
]

export const IELTS_QUESTION_COUNT = IELTS_SECTIONS.reduce((sum, section) => sum + section.questions.length, 0)

// Доля верных ответов → ориентировочный балл. Задания проще настоящего
// IELTS, поэтому пороги выше официальной шкалы Reading (там 30/40 ≈ 7.0):
// лучше занизить оценку, чем обнадёжить абитуриента.
const BANDS = [[0.95, 8], [0.87, 7.5], [0.78, 7], [0.68, 6.5], [0.58, 6], [0.48, 5.5], [0.38, 5], [0.25, 4.5], [0, 4]]

export const scoreIeltsTest = (answers) => {
  let correct = 0
  const sections = {}
  const mistakes = []
  for (const section of IELTS_SECTIONS) {
    let sectionCorrect = 0
    for (const question of section.questions) {
      if (answers[question.id] === question.answer) sectionCorrect += 1
      else mistakes.push(question.id)
    }
    sections[section.id] = { correct: sectionCorrect, total: section.questions.length }
    correct += sectionCorrect
  }
  const share = correct / IELTS_QUESTION_COUNT
  const band = BANDS.find(([threshold]) => share >= threshold)[1]
  return { correct, total: IELTS_QUESTION_COUNT, band, sections, mistakes }
}

export const findIeltsQuestion = (id) => {
  for (const section of IELTS_SECTIONS) {
    const question = section.questions.find(item => item.id === id)
    if (question) return { section, question }
  }
  return null
}
