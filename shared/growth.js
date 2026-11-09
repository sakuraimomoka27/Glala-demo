globalThis.Growth=(()=>{
  function status(hero,catalog){
    const rows=catalog.growth;
    const totalXp=Math.max(0,hero?.totalXp??0);
    let i=0;
    while(i+1<rows.length && totalXp>=rows[i+1].totalXp)i++;
    const row=rows[i],next=rows[i+1];
    return {level:row.level,totalXp,xp:totalXp-row.totalXp,
      needed:next?next.totalXp-row.totalXp:0,capped:!next,
      hpBonus:row.hpBonus,staminaBonus:row.staminaBonus};
  }
  function roll(monster,rng=Math.random){
    const gold=monster.goldMin+Math.floor(rng()*(monster.goldMax-monster.goldMin+1));
    return {xp:monster.xp,gold};
  }
  function grant(profile,catalog,xp,killGold){
    const before=status(profile.hero,catalog);
    return profile.commit(()=>{
      profile.hero.totalXp=before.totalXp+xp;
      profile.bag.gold+=killGold;
      const after=status(profile.hero,catalog);
      return {xp,killGold,levelStart:before.level,levelEnd:after.level,
        hpGain:after.hpBonus-before.hpBonus,staminaGain:after.staminaBonus-before.staminaBonus};
    });
  }
  return {status,roll,grant};
})();
