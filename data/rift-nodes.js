const entries = [
  ['rift-01','Тропа Пепельных Звёзд','ash','volcano','#e38b59','ash',['ashbound-renegade','fire-elemental','goblin'],1,'Обугленные арки и падающие искры'],
  ['rift-02','Затонувший Колокол','drowned','sunken-necropolis','#6aa8bb','rain',['drowned-scribe','ghost','crypt-hound'],1,'Затопленные залы, где звонит колокол'],
  ['rift-03','Сад Стеклянных Корней','glasswood','briar-hollow','#9caf63','rain',['thorn-stalker','moss-troll','spore-shaman'],1,'Стеклянные лианы и светящиеся корни'],
  ['rift-04','Плато Синего Пепла','blue-ash','shadow','#6a78be','ash',['wraith','shadow-mage','grave-scout'],1,'Пепельные дюны под синим небом'],
  ['rift-05','Кузня Без Рассвета','blackforge','obsidian-fields','#d36c43','embers',['magma-golem','obsidian-guard','flame-lord'],1,'Раскалённые кузнечные башни'],
  ['rift-06','Ледяное Эхо','echo-ice','frost-citadel','#8cc6e2','snow',['frost-wolf','mirror-revenant','rime-witch'],1,'Ледяные зеркала повторяют шаги'],
  ['rift-07','Песнь Песчаных Костей','bone-sand','desert','#c7a36b','ash',['sand-worm','dust-wraith','skeleton-archer'],1,'Костяные дюны и песчаные вихри'],
  ['rift-08','Архив Слепых Звёзд','blind-archive','library','#a487d7','ash',['flying-tome','book-guardian','archmage'],1,'Парящие библиотеки с пустыми страницами'],
  ['rift-09','Трещина Тихой Воды','quiet-water','swamp','#6fa59a','rain',['spore-shaman','ghost','crypt-hound'],1,'Чёрные каналы и мёртвые кувшинки'],
  ['rift-10','Кладбище Лунных Масок','moon-mask','graveyard','#9291bd','ash',['grave-scout','wraith','grave-king'],1,'Надгробия в форме безликих масок'],
  ['rift-11','Каньон Ржавого Солнца','rust-sun','desert','#d68c50','embers',['sand-worm','ash-harpy','dust-wraith'],1,'Расколотые солнечные обелиски'],
  ['rift-12','Пасть Пылающего Неба','sky-maw','dragon','#d75d49','embers',['dragonling','fire-drake','dragon-guardian'],1,'Огненные острова висят над пустотой'],
  ['rift-13','Роща Спящих Колоссов','sleeping-colossi','briar-hollow','#718d5e','rain',['moss-troll','rootbound-sentinel','elder-treant'],1,'Каменные великаны укрыты мхом'],
  ['rift-14','Подземный Прилив','underground-tide','sunken-necropolis','#4a94a8','rain',['drowned-scribe','bone-colossus','bone-tyrant'],1,'Подземное море затопило крипты'],
  ['rift-15','Обсерватория Пепла','ash-observatory','library','#b18c79','ash',['flying-tome','ashbound-renegade','archmage'],1,'Сломанные линзы смотрят в Разлом'],
  ['rift-16','Мост Перевёрнутых Башен','inverted-bridge','ruins','#8e9cb3','none',['dark-knight','grave-scout','mirror-revenant'],1,'Башни перевёрнуты над пропастью'],
  ['rift-17','Лес Красного Инея','red-frost','ice','#b96f79','snow',['frost-wolf','ice-elemental','frost-giant'],1,'Красный снег покрывает мёртвые ели'],
  ['rift-18','Долина Гулких Черепов','hollow-skulls','graveyard','#887b9f','ash',['skeleton','crypt-hound','grave-king'],1,'Черепа гудят от сырой магии'],
  ['rift-19','Поля Фиолетового Стекла','violet-glass','void-crater','#a477c9','ash',['riftstalker','void-harbinger','shadow-mage'],1,'Стеклянная равнина отражает чужие миры'],
  ['rift-20','Осколочный Перевал','shard-pass','ice','#9cc7d1','snow',['rime-witch','frost-giant','ice-queen'],1,'Острые кристаллы режут метель'],
  ['rift-21','Трон Безымянного','nameless-throne','shadow','#a34c73','ash',['shadow-mage','void-harbinger','riftstalker'],50,'Трон исчезнувшего владыки'],
  ['rift-22','Сердце Чёрной Кузни','blackforge-heart','volcano','#ed5d3e','embers',['magma-golem','obsidian-guard','flame-lord'],50,'Кузнечный реактор в сердце скалы'],
  ['rift-23','Склеп Тысячи Волн','thousand-waves','sunken-necropolis','#4c91a5','rain',['drowned-scribe','bone-colossus','bone-tyrant'],50,'Волны текут по потолку склепа'],
  ['rift-24','Предел Стеклянной Бури','glass-storm','desert','#d0a46c','ash',['sand-worm','ash-harpy','sand-king'],50,'Буря из стеклянных песчинок'],
  ['rift-25','Звёздная Печь','star-furnace','obsidian-fields','#d78b56','embers',['fire-elemental','dragon-guardian','ancient-dragon'],50,'Звезда плавится в древней печи'],
  ['rift-26','Собор Ледяных Теней','ice-shadow-cathedral','frost-citadel','#9db8df','snow',['mirror-revenant','rime-witch','ice-queen'],50,'Собор отражает того, кем ты мог стать'],
  ['rift-27','Предел Пустых Имен','empty-names','library','#a38ad6','ash',['flying-tome','book-guardian','void-harbinger'],50,'Имена вырваны из каждой книги'],
  ['rift-28','Кратер Разорванного Времени','broken-time','void-crater','#a05bca','ash',['riftstalker','void-harbinger','ancient-dragon'],50,'Осколки времени вращаются вокруг кратера'],
  ['rift-29','Море Пепельных Корней','ash-root-sea','briar-hollow','#829b61','rain',['rootbound-sentinel','elder-treant','moss-troll'],50,'Корни плывут по морю из пепла'],
  ['rift-30','Последняя Грань','last-edge','dragon','#dc655a','embers',['dragon-guardian','void-harbinger','ancient-dragon'],50,'Край Разлома, где сходятся все трещины']
];

export const RIFT_NODES = entries.map((entry, index) => ({
  id: entry[0],
  number: index + 1,
  name: entry[1],
  theme: entry[2],
  baseTheme: entry[3],
  accent: entry[4],
  weather: entry[5],
  enemies: entry[6],
  minLevel: entry[7],
  description: entry[8],
  cols: 42 + (index % 3) * 2,
  rows: 32 + (index % 2) * 2,
  seed: 7411 + index * 977,
  rewardTier: index < 10 ? 'T4' : index < 20 ? 'T5' : 'T6'
}));

export function getRiftNode(id) {
  return RIFT_NODES.find(node => node.id === id) || null;
}
