globalThis.Adventure=(()=>{
  function rooms(definition) {
    return definition.rooms.split(/[,，]/).map(id=>id.trim());
  }
  function completed(hero,definition) {
    return Boolean(hero.completed?.[definition.id]);
  }
  function riftEncounter(definition,level,catalog,world){
    const chapter=catalog.chapters.at(-1),route=WorldCampaign.rooms(chapter);
    const finale=catalog.levels.find(stage=>stage.id===route.at(-1));
    const base=WorldCampaign.encounter(chapter,route.length-1,finale,world);
    const greater=definition.kind==="greater",steps=greater?level-1:0;
    const healthFactor=greater?(1+(definition.hpGrowth??.22))**steps:(definition.lesserHpFactor??2.1);
    const damageFactor=(1+(definition.damageGrowth??.16))**steps;
    const lootFactor=(definition.lootBaseFactor??1.15)*(1+(definition.lootGrowth??.19))**steps;
    const riftBaseHp={};
    if(base.storyFrontHp!==undefined)riftBaseHp[finale.front]=base.storyFrontHp;
    if(base.storyRearHp!==undefined)riftBaseHp[finale.rear]=base.storyRearHp;
    const bossId=catalog.summons.find(row=>row.id===chapter.unlockSummon)?.boss;
    return {monsterLevel:base.monsterLevel,monsterHpBonus:base.monsterHpBonus,riftBaseHp,
      bossHpFloor:base.storyBossHp??catalog.monsters.find(row=>row.id===bossId)?.hp??0,
      hpScale:base.hpScale*healthFactor,damageScale:base.damageScale*damageFactor,aggression:base.aggression,
      speedScale:1+steps*(definition.speedGrowth??.03),
      echoBaseFactor:Math.round(base.echoBaseFactor*lootFactor*100)/100};
  }
  function roomEncounter(run,catalog){
    if(run.encounter)return run.encounter;
    // In-progress saves from before endgame scaling finish on their original curve.
    const world=run.world??catalog.worlds[0],steps=run.definition.kind==="greater"?run.level-1:0;
    return {hpScale:world.hpScale*(1+steps*(run.definition.hpGrowth??.22)),damageScale:world.damageScale,
      speedScale:1+steps*(run.definition.speedGrowth??.03)};
  }
  function riftEntryReason(hero,definition,catalog){
    if(definition.kind==="story")return "";
    const chapters=catalog.chapters,last=chapters.length-1;
    const roomCount=WorldCampaign.rooms(chapters[last]).length;
    if(WorldCampaign.cleared(hero,chapters,last)<roomCount)return "通关剧情 "+chapters.length+"-"+roomCount+" 后开放";
    if(definition.kind==="greater" && (hero.keys||0)<(definition.keyCost??1))return "钥石不足，请先通关小秘境";
    return "";
  }
  function begin(profile,definition,level=1,now=Date.now(),catalog=globalThis.ASHEN_CONTENT){
    const hero=profile.hero;
    if(!hero || hero.run)throw new Error("先完成或结束当前冒险。");
    if(definition.kind==="story" && completed(hero,definition))throw new Error("本章已经完成。");
    const locked=riftEntryReason(hero,definition,catalog);
    if(locked)throw Error(locked);
    const greater=definition.kind==="greater";
    if(greater){
      if(!Number.isInteger(level)||level<1||level>Math.min((hero.best||0)+1,definition.maxTier??30))throw new Error("该层尚未解锁。");
    }
    return profile.commit(()=>{
      const world=catalog?structuredClone(WorldDifficulty.current(catalog,hero)):undefined;
      const run={id:crypto.randomUUID(),world,definition:structuredClone(definition),rooms:rooms(definition),
        step:0,hp:null,level,startedAt:now};
      if(definition.kind!=="story")run.encounter=riftEncounter(definition,level,catalog,world);
      const variants=definition.variants?.split(/[,，]/).map(id=>id.trim());
      if(variants?.length)for(let i=1;i<run.rooms.length-1;i++)run.rooms[i]=variants[Math.floor(Math.random()*variants.length)];
      if(greater){
        hero.keys-=definition.keyCost??1;
        run.deadline=now+1000*(definition.timeLimit??100);
      }
      hero.run=run;
      return run;
    });
  }
  function settle(profile,id,step,outcome,now=Date.now()){
    const hero=profile.hero,run=hero?.run;
    if(!run||run.id!==id||run.step!==step)return null;
    return profile.commit(()=>{
      const income={gold:0,xp:outcome.growth?.xp??0,killGold:outcome.growth?.killGold??0,growth:outcome.growth};
      if(run.deadline && now>=run.deadline){
        delete hero.run;
        return {status:"时限已尽",timedOut:true,complete:false,...income};
      }
      if(!outcome.win){
        delete hero.run;
        return {status:outcome.retreated?"已撤离":"战斗失利",complete:false,...income};
      }
      const summons=Echoes.collectSummons(hero,outcome.summonDrops);
      for(const item of outcome.rewards)AshenLoot.collect(profile.bag,item);
      const gold=run.definition.kind==="story"?0:8;
      profile.bag.gold=(profile.bag.gold||0)+gold;
      income.gold=gold;
      run.hp=Math.min(outcome.maxHp,outcome.hp+1);
      run.step++;
      if(run.step<run.rooms.length)return {status:"房间已肃清",next:true,complete:false,summons,...income};
      const definition=run.definition;
      hero.completed??={};
      hero.completed[definition.id]=true;
      if(definition.kind==="story")hero.chapter=Math.max(1,hero.chapter||0);
      let shards=definition.shards,prize,goldStar;
      if(definition.kind==="greater"){
        hero.best=Math.max(hero.best||0,run.level);
        hero.times??={};
        const ms=Math.max(0,now-run.startedAt);
        hero.times[run.level]=Math.min(hero.times[run.level]??Infinity,ms);
        shards+=run.level*(definition.tierReward??2);
        const catalog=outcome.catalog;
        const roll=AshenLoot.makeRoller(catalog,Math.random,run.world??1,run.encounter?.echoBaseFactor);
        const [item]=roll({dropChance:1,bonusChance:0},true);
        item.riftTier=run.level;
        item.riftAttack=run.level*(definition.markPower??1);
        const kept=AshenLoot.collect(profile.bag,item);
        const star=GoldStars.roll(catalog,run.world??catalog.worlds[0],run.encounter?.echoBaseFactor??1,run.level,!hero.foundGoldStar);
        if(star){
          const kept=AshenLoot.collect(profile.bag,star);
          hero.foundGoldStar=true;
          goldStar={item:star,kept};
        }
        prize={name:item.name,itemPower:item.itemPower,tier:run.level,attack:item.riftAttack,kept,ms};
      }
      profile.bag.shards+=shards;
      hero.keys=(hero.keys||0)+definition.keys;
      delete hero.run;
      return {status:"冒险完成",complete:true,summons,shards,prize,goldStar,keys:definition.keys,ending:definition.ending,...income};
    });
  }
  function abandon(profile){
    profile.commit(()=>{delete profile.hero.run});
  }
  return {begin,settle,abandon,completed,roomEncounter,riftEntryReason};
})();
