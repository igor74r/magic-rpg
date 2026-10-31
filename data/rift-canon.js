// Canonical progression data for «Осколки Разлома».
// Legacy campaign shards (forest/ruins/shadow) are intentionally separate.
export const DRAGON_SHARDS = [
  { id: 'ashen-herald', enemyId: 'ashen-herald', locationId: 'obsidian-fields', name: 'Пепельный Вестник', requiredLevel: 30, shardId: 'flame', shardName: 'Осколок Пламени' },
  { id: 'icy-grasp', enemyId: 'icy-grasp', locationId: 'frost-citadel', name: 'Ледяная Хватка', requiredLevel: 40, shardId: 'ice', shardName: 'Осколок Льда' },
  { id: 'blood-crown', enemyId: 'blood-crown', locationId: 'void-crater', name: 'Кровавая Корона', requiredLevel: 50, shardId: 'blood', shardName: 'Осколок Крови' }
];

export const RIFT_SHARD_SLOTS = ['flame', 'ice', 'blood'];
export const RIFT_MAX_LEVEL = 100;
export const RIFT_TIER_IDS = ['T1', 'T2', 'T3', 'T4', 'T5', 'T6'];
export const RIFT_FACET_COUNT = 30;
export const RIFT_INITIAL_FACET_COUNT = 20;
export const RIFT_LEVEL_GATED_FACET_COUNT = 10;
export const RIFT_FACET_LEVEL_GATE = 50;
