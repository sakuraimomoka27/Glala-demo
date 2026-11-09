globalThis.Adventure=(()=>{
  function rooms(definition) {
    return definition.rooms.split(/[,，]/).map(id=>id.trim());
  }
  function completed(hero,definition) {
    return Boolean(hero.completed?.[definition.id]);
  }
  function begin(profile,definition,level=1,now=Date.now(),catalog=globalThis.ASHEN_CONTENT){
    const hero=profile.hero;
    if(!hero || hero.run)throw new Error("先完成或结束当前冒险。");
    if(definition.kind==="story" && completed(hero,definition))throw new Error("本章已经完成。");
    if(definition.kind!=="story" && !hero.chapter)throw new Error("请先完成第一章。");
    const greater=definition.kind==="greater";
    if(greater){
      if(!Number.isInteger(level)||level<1||level>Math.min((hero.best||0)+1,definition.maxTier??30))throw new Error("该层尚未解锁。");
      if((hero.keys||0)<(definition.keyCost??1))throw new Error("钥石不足，请先通关小秘境。");
    }
    return profile.commit(()=>{
      const world=catalog?structuredClone(WorldDifficulty.current(catalog,hero)):undefined;
      const run={id:crypto.randomUUID(),world,definition:structuredClone(definition),rooms:rooms(definition),
        step:0,hp:null,level,startedAt:now};
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
      let shards=definition.shards,prize;
      if(definition.kind==="greater"){
        hero.best=Math.max(hero.best||0,run.level);
        hero.times??={};
        const ms=Math.max(0,now-run.startedAt);
        hero.times[run.level]=Math.min(hero.times[run.level]??Infinity,ms);
        shards+=run.level*(definition.tierReward??2);
        const catalog=outcome.catalog;
        const roll=AshenLoot.makeRoller(catalog,Math.random,run.world??1);
        const [item]=roll({dropChance:1,bonusChance:0},true);
        item.riftTier=run.level;
        item.riftAttack=run.level*(definition.markPower??1);
        const kept=AshenLoot.collect(profile.bag,item);
        prize={name:item.name,itemPower:item.itemPower,tier:run.level,attack:item.riftAttack,kept,ms};
      }
      profile.bag.shards+=shards;
      hero.keys=(hero.keys||0)+definition.keys;
      delete hero.run;
      return {status:"冒险完成",complete:true,summons,shards,prize,keys:definition.keys,ending:definition.ending,...income};
    });
  }
  function abandon(profile){
    profile.commit(()=>{delete profile.hero.run});
  }
  return {begin,settle,abandon,completed};
})();
