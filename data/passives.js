export const PASSIVE_TREE = {
  start: { id: 'start', x: 50, y: 50, name: 'Начало', desc: 'Точка отсчета', type: 'start', icon: '🌟', conn: [] },
  // Ветка Силы (Слева)
  s1: { id: 's1', x: 40, y: 50, name: 'Мощь', desc: '+10 СИЛ', type: 'minor', icon: '💪', conn: ['start', 's2'] },
  s2: { id: 's2', x: 30, y: 50, name: 'Сталь', desc: '+15 СИЛ', type: 'minor', icon: '⚔️', conn: ['s1', 's3', 's4'] },
  s3: { id: 's3', x: 20, y: 40, name: 'Титан', desc: '+20% HP', type: 'notable', icon: '🛡️', conn: ['s2'] },
  s4: { id: 's4', x: 20, y: 60, name: 'Берсерк', desc: '+20 СИЛ', type: 'notable', icon: '🔥', conn: ['s2'] },
  // Ветка Интеллекта (Справа)
  i1: { id: 'i1', x: 60, y: 50, name: 'Разум', desc: '+10 ИНТ', type: 'minor', icon: '🧠', conn: ['start', 'i2'] },
  i2: { id: 'i2', x: 70, y: 50, name: 'Магия', desc: '+15 ИНТ', type: 'minor', icon: '✨', conn: ['i1', 'i3', 'i4'] },
  i3: { id: 'i3', x: 80, y: 40, name: 'Архимаг', desc: '+20 ИНТ', type: 'notable', icon: '🧙', conn: ['i2'] },
  i4: { id: 'i4', x: 80, y: 60, name: 'Эрудит', desc: '+30% MP', type: 'notable', icon: '📘', conn: ['i2'] },
  // Ветка Телосложения (Снизу)
  c1: { id: 'c1', x: 50, y: 60, name: 'Стойкость', desc: '+10 ТЕЛ', type: 'minor', icon: '🪨', conn: ['start', 'c2'] },
  c2: { id: 'c2', x: 50, y: 70, name: 'Выносливость', desc: '+15 ТЕЛ', type: 'minor', icon: '❤️', conn: ['c1', 'c3', 'c4'] },
  c3: { id: 'c3', x: 40, y: 80, name: 'Защитник', desc: '+20 ТЕЛ', type: 'notable', icon: '🏰', conn: ['c2'] },
  c4: { id: 'c4', x: 60, y: 80, name: 'Регенерация', desc: '+10 МДР', type: 'notable', icon: '🌿', conn: ['c2'] }
};