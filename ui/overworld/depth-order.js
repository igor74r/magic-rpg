export function buildDepthItems(ow) {
  if (!ow?.player) return [];
  return [
    ...(ow.statics || []).map(item => ({ item, kind: 'static', footY: item.y + (item.depthOffset || 0) })),
    ...(ow.npcs || []).map(item => ({ item, kind: 'npc', footY: item.y + (item.depthOffset || 0) })),
    ...(ow.events || []).map(item => ({ item, kind: 'event', footY: item.y + (item.depthOffset || 0) })),
    ...(ow.enemies || []).filter(item => !item.dead).map(item => ({ item, kind: 'enemy', footY: item.y + (item.depthOffset || 0) })),
    { item: ow.player, kind: 'player', footY: ow.player.y + 12 }
  ].sort((a, b) => a.footY - b.footY);
}
