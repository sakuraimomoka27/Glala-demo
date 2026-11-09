// Build receipts from the items already settled by the room. Reading one never grants rewards.
globalThis.ExpeditionReview = {
  append(previous, chapterId, stage, number, outcome, receipt, bag, ownedBefore, shardsBefore) {
    const owned = new Set(bag.items.map(item => item.uid));
    const rooms = previous?.chapterId === chapterId ? previous.rooms.map(room => ({
      ...room,
      items: room.items.map(item => ownedBefore.has(item.uid) && !owned.has(item.uid)
        ? {...item, salvaged:true} : item)
    })) : [];
    const growth = receipt.growth || outcome.growth || {};
    const items = outcome.rewards.map(item => ({
      ...structuredClone(item), salvaged:!owned.has(item.uid)
    }));
    rooms.push({
      id: stage.id, number, name: stage.name, kills:outcome.kills,
      gold:receipt.gold, killGold:growth.killGold || 0, xp:growth.xp || 0,
      levelStart:growth.levelStart || 1, levelEnd:growth.levelEnd || 1,
      shards:bag.shards-shardsBefore, summons:[...receipt.summons], items
    });
    return {chapterId,rooms};
  }
};
