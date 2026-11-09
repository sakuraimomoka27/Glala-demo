// These rules also run in the offline client and the local content tools.
globalThis.ItemStrength=(()=>{
  // Legacy colours carried a 1–2 multiplier. Keep their rolls and map them into the first band.
  function legacy(item){return Math.max(1,Math.min(399,1+Math.round(398*((item.tierMultiplier||1)-1))))}
  function of(item){return item.itemPower??legacy(item)}
  function grade(power){return power>=660?"ancestral":power>=400?"sacred":"base"}
  const names={base:"基型",sacred:"鸣刻",ancestral:"源铸"};
  function describe(power){return names[grade(power)]+" · 强度 "+power}
  function chanceAtLeast(world,threshold){
    return Math.max(0,world.maxPower-Math.max(threshold,world.minPower)+1)/(world.maxPower-world.minPower+1);
  }
  function scale(power){
    if(power>=660)return 3.5+(power-660)/280;
    if(power>=400)return 2.5+(power-400)/518;
    return 1+(power-1)/398;
  }
  function roll(world,rng){
    if(!world||!Number.isInteger(world.level)||!Number.isInteger(world.minPower)||!Number.isInteger(world.maxPower))throw Error("缺少有效的遗迹潮位掉落配置。");
    const cap=world.level<=2?399:world.level===3?659:800;
    if(world.level<1||world.minPower<1||world.minPower>world.maxPower||world.maxPower>cap)throw Error("物品强度超出当前潮位的掉落范围。");
    return world.minPower+Math.floor(rng()*(world.maxPower-world.minPower+1));
  }
  return {of,legacy,grade,scale,roll,describe,chanceAtLeast};
})();
globalThis.EchoItem=(()=>{
  const limits={common:[0,0],fine:[1,2],rare:[3,4],legendary:[4,4],unique:[4,4]};
  const ranks=Object.keys(limits);
  function qualityRule(id){
    const [min,max]=limits[id];
    if(id==="common")return "仅基础攻血";
    const count=min===max?String(min):min+"～"+max;
    if(id==="unique")return count+" 条固定词缀 · 专属特效 · 同名限一件";
    return count+" 条魔法词缀"+(id==="legendary"?" · 一条 SSR 威能":"");
  }
  function pick(rows,rng,weight){
    let point=rng()*rows.reduce((sum,row)=>sum+weight(row),0);
    return rows.find(row=>(point-=weight(row))<0)||rows.at(-1);
  }
  function eligible(affix,tier){
    return tier!=="common" && (affix.minTier!=="rare" || ranks.indexOf(tier)>=2) && affix.weight>0;
  }
  function line(a,scale,roll,base){
    const floor=a.stat===base?.stat?Math.min(a.max,Math.max(a.min,base.value||0)):a.min;
    const round=value=>Math.round(value*100)/100;
    return {id:a.id,stat:a.stat,name:a.name,series:a.series||Echoes.seriesByStat[a.stat]||"暴风",
      value:round((floor+(a.max-floor)*roll)*scale),min:round(floor*scale),max:round(a.max*scale)};
  }
  function fill(stats,base,tier,catalog,count,rng,scale){
    const used=new Set(stats.map(s=>s.stat));
    let quality=0,added=0;
    while(stats.length<count){
      const pool=catalog.affixes.filter(a=>eligible(a,tier.id)&&!used.has(a.stat));
      if(!pool.length)throw Error("品质可用词缀不足："+tier.name);
      const a=pick(pool,rng,row=>row.weight*(row.stat===base.stat?6:row.series===base.series?3:1));
      const roll=rng();stats.push(line(a,scale,roll,base));used.add(a.stat);quality+=roll;added++;
    }
    return added?quality/added:0;
  }
  function powerSnapshot(p){return {id:p.id,name:p.name,kind:p.kind,power:p.power,radius:p.radius,description:p.description}}
  function mint(catalog,base,tier,rng,world=catalog.worlds[0]){
    let unique;
    if(tier.id==="unique"){
      unique=pick(catalog.uniques.filter(u=>u.dropWeight>0),rng,u=>u.dropWeight);
      base=catalog.equipment.find(e=>e.id===unique.template);
    }
    const itemPower=ItemStrength.roll(world,rng),scale=ItemStrength.scale(itemPower);
    const item={format:2,uid:crypto.randomUUID(),kind:"echo",icon:base.icon,baseId:base.id,name:unique?.name||base.echoName||base.name+"回响",
      slot:base.slot,weight:base.weight,skill:base.skill,itemPower,sourceWorld:world.level,
      baseAttack:Math.round(base.baseAttack*scale),baseHealth:Math.round(base.baseHealth*scale),tier:tier.id,
      tierName:tier.name,color:tier.color,rank:ranks.indexOf(tier.id),stats:[],rollQuality:0};
    if(unique){
      item.uniqueId=unique.id;
      item.stats=unique.fixedAffixes.split(/[,，]/).map(id=>{
        const fixed=line(catalog.affixes.find(a=>a.id===id.trim()),scale,1);
        fixed.min=fixed.max;
        return fixed;
      });
      item.power=powerSnapshot(catalog.powers.find(p=>p.id===unique.powerId));item.rollQuality=1;
    }else{
      const [min,max]=limits[tier.id],count=min+Math.floor(rng()*(max-min+1));
      item.rollQuality=fill(item.stats,base,tier,catalog,count,rng,scale);
      if(tier.id==="legendary")item.power=powerSnapshot(pick(catalog.powers.filter(p=>p.quality==="legendary"&&p.weight>0),rng,p=>p.weight));
    }
    return item;
  }
  function upgradeLegacy(item,catalog){
    if(item.format===2){
      item.itemPower??=ItemStrength.legacy(item);
      item.tierName=catalog.rarities.find(t=>t.id===item.tier)?.name??item.tierName;
      return;
    }
    const base=catalog.equipment.find(e=>e.id===item.baseId)||{baseAttack:1,baseHealth:1};
    const stats=item.stats??=[];
    let rank=Math.max(0,Math.min(3,item.rank||0));
    if(stats.length)rank=Math.max(rank,stats.length>2?2:1);
    const tier=catalog.rarities.find(t=>t.id===ranks[rank]);
    let seed=2166136261;for(const c of String(item.uid))seed=Math.imul(seed^c.charCodeAt(0),16777619);
    const rng=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/2**32);
    fill(stats,base,tier,catalog,limits[tier.id][0],rng,tier.multiplier);
    if(rank===3)item.power=powerSnapshot(pick(catalog.powers.filter(p=>p.quality==="legendary"&&p.weight>0),rng,p=>p.weight));
    Object.assign(item,{format:2,baseAttack:base.baseAttack,baseHealth:base.baseHealth,tier:tier.id,tierName:tier.name,
      tierMultiplier:tier.multiplier,itemPower:ItemStrength.legacy({tierMultiplier:tier.multiplier}),color:tier.color,rank});
  }
  return {eligible,line,mint,upgradeLegacy,qualityRule};
})();
globalThis.Echoes = (() => {
  const seriesByStat={jump:"暴风",haste:"暴风",move:"暴风",fall:"钢岩",attack:"钢岩",regen:"绀碧"};
  const owns=(hero,id)=>!!id && (hero?.ownedSummons||[]).includes(id);
  function bindSummon(profile,id){
    if(id && !owns(profile.hero,id))throw Error("请先讨伐对应的虚数体并通过本关。");
    profile.commit(()=>{profile.hero.summon=id});
  }
  function collectSummons(hero,drops){
    const found=[];
    for(const id of drops||[]){
      if(!id || owns(hero,id))continue;
      (hero.ownedSummons??=[]).push(id);found.push(id);
    }
    return found;
  }
  function normalize(item,catalog){
    const base=catalog.equipment.find(row=>row.id===item.baseId);
    if(item.kind!=="echo"){item.kind="echo";item.name=base?.echoName||item.name+"回响"}
    if(base?.icon && !item.icon)item.icon=base.icon;
    (item.stats||[]).forEach((line,index)=>{line.series??=(index===0?base?.series:catalog.affixes.find(a=>a.name===line.name)?.series)||seriesByStat[line.stat]||"暴风"});
    return item;
  }
  function initialize(profile,catalog){
    const hero=profile.hero;if(!hero)return;
    const invalidSummon=hero.summon && !owns(hero,hero.summon);
    const shared=profile.slot?profile.stash?.items||[]:[];
    const current=item=>item.format===2&&Number.isInteger(item.itemPower)&&item.tierName===catalog.rarities.find(t=>t.id===item.tier)?.name;
    if(Array.isArray(hero.disc) && !invalidSummon && profile.bag.items.every(current) && shared.every(current))return;
    profile.commit(()=>{
      if(invalidSummon)delete hero.summon;
      for(const item of [...profile.bag.items,...shared]){normalize(item,catalog);EchoItem.upgradeLegacy(item,catalog)}
      if(hero.starterEcho){
        const base=catalog.equipment.find(row=>row.id==="tinband")||catalog.equipment[0];
        const tier=catalog.rarities.find(t=>t.id==="fine");
        const item={format:2,uid:crypto.randomUUID(),kind:"echo",starter:true,baseId:base.id,name:"归途的回响",slot:base.slot,weight:base.weight,skill:"",
          itemPower:1,baseAttack:base.baseAttack,baseHealth:base.baseHealth,tier:tier.id,tierName:tier.name,color:tier.color,rank:1,rollQuality:.5,
          stats:[{stat:"regen",series:"绀碧",value:2},{stat:"jump",series:"暴风",name:"腾跃",value:.2}]};
        profile.bag.items.push(item);hero.starterEcho=false;
        hero.worn[base.slot]=item.uid;
      }
      if(!hero.disc){
        hero.disc=[...new Set(Object.values(hero.worn||{}))].filter(id=>profile.bag.items.some(item=>item.uid===id)).slice(0,10);
        const boot=profile.bag.items.find(item=>item.uid===hero.worn?.boots);
        if(boot)hero.bootId=boot.baseId;
        hero.worn={};profile.bag.worn=hero.worn;
      }
    });
  }
  function plan(disc,uid,index){
    if(!Number.isInteger(index)||index<0||index>=10)throw Error("武器盘只有 10 个位置。");
    const next=disc.slice();
    const previous=uid?next.indexOf(uid):-1;
    if(previous>=0 && previous!==index)next[previous]=next[index]||null;
    next[index]=uid||null;
    return next;
  }
  function equip(profile,uid,index){
    profile.commit(()=>{
      if(uid && !profile.bag.items.some(item=>item.uid===uid))throw Error("回响不在角色背包中。");
      const disc=plan(profile.hero.disc,uid,index),error=discError(profile.bag,disc);
      if(error)throw Error(error);
      profile.hero.disc=disc;
    });
  }
  function discError(bag,disc){
    const names=new Set(),ids=new Set();
    for(const item of bag.items){
      if(!item.uniqueId||!disc.includes(item.uid))continue;
      if(names.has(item.name)||ids.has(item.uniqueId))return "同名 UR 只能装备一件："+item.name;
      names.add(item.name);ids.add(item.uniqueId);
    }
    return "";
  }
  function lines(item,summon){
    return (item.stats||[]).map(line=>({...line,boosted:!!summon && line.series===summon.series,
      effective:line.value*(summon && line.series===summon.series?1+summon.boost:1)}));
  }
  return {seriesByStat,normalize,initialize,plan,equip,discError,lines,owns,bindSummon,collectSummons};
})();
globalThis.AshenLoot = (() => {
  function pool(rows, field,slot,multiplier=1) {
    let total = 0;
    const entries = rows.filter(row => row[field] > 0).map(row => {
      total += row[field]*(slot && row.slot===slot?multiplier:1);
      return { row, ceiling: total };
    });
    return rng => {
      const point = rng() * total;
      let left = 0, right = entries.length - 1;
      while (left < right) {
        const mid = (left + right) >>> 1;
        if (point < entries[mid].ceiling) right = mid;
        else left = mid + 1;
      }
      return entries[left].row;
    };
  }
  function makeRoller(catalog,rng=Math.random,source=1) {
    const world=typeof source==="number"?catalog.worlds.find(row=>row.level===source):source;
    if(!world)throw Error("掉落来源的遗迹潮位不存在。");
    const common=catalog.equipment.filter(row=>!row.sourceMonster);
    const book=globalThis.FANTASY_CARDS, bossRolls=new Map();
    const mode=world.level>=4?"origin":"hard";
    for(const machine of catalog.summons||[]){
      const stage=book?.fights[machine.id]?.[mode];
      if(!stage||!machine.boss)continue;
      const candidates=common.filter(row=>row.series===machine.series),bases=candidates.length?candidates:common;
      const byTier=new Map();
      for(const id of stage.ids){
        const card=book.cards[id],list=byTier.get(card.tier)||[];
        list.push({id,card});byTier.set(card.tier,list);
      }
      const allowed=catalog.rarities.filter(q=>q.weight>0&&byTier.has(q.id));
      const tierRoll=allowed.length&&pool(allowed,"weight");
      bossRolls.set(machine.boss,()=>{
        if(!tierRoll)return null;
        const tier=tierRoll(rng),list=byTier.get(tier.id),{id,card}=list[Math.floor(rng()*list.length)];
        const base=bases[card.cell%bases.length];
        const item=EchoItem.mint(catalog,{...base,echoName:card.name,series:machine.series},tier,rng,world);
        return Object.assign(item,{coreId:id,fantasyBoss:machine.id,fantasyMode:mode});
      });
    }
    const signatures=new Map(catalog.equipment.filter(row=>row.sourceMonster).map(row=>[row.sourceMonster,row]));
    const template = pool(common, "dropWeight");
    const lowTiers=catalog.rarities.filter(row=>["common","fine"].includes(row.id)&&row.weight>0);
    const low=lowTiers.length?pool(lowTiers,"weight"):()=>catalog.rarities.find(row=>row.id==="common");
    const focused=new Map();
    const rarity = pool(catalog.rarities, "weight");
    function roll(pick,chooseTier=rarity) {
      return EchoItem.mint(catalog,pick(rng),chooseTier(rng),rng,world);
    }
    return (level, lastEnemy, monsterId) => {
      if(bossRolls.has(monsterId)){
        if(!lastEnemy && rng()>=level.dropChance)return [];
        const take=bossRolls.get(monsterId),items=[take()];
        if(rng()<level.bonusChance)items.push(take());
        return items.filter(Boolean);
      }
      const native=signatures.get(monsterId);
      const signature=native && rng()<(native.sourceChance??.4);
      if (!signature && !lastEnemy && rng() >= level.dropChance) return [];
      let pick=template;
      if(level.focusSlot){const key=level.focusSlot+"/"+(level.focusMultiplier??3);
        if(!focused.has(key))focused.set(key,pool(common,"dropWeight",level.focusSlot,level.focusMultiplier??3));
        pick=focused.get(key)}
      const drops = [signature?roll(()=>native,low):roll(pick)];
      if (rng() < level.bonusChance) drops.push(roll(pick));
      return drops;
    };
  }
  const capacity = 240;
  const emptyBag = () => ({ version: 1, items: [], worn: {}, shards: 0 });
  function equipped(bag, item) { return bag.worn?.[item.slot] === item.uid || !!bag.heroes?.[bag.selected]?.disc?.includes(item.uid); }
  function protectedGear(bag,item) {
    return equipped(bag,item) || Object.values(bag.heroes||{}).some(hero=>hero.worn?.[item.slot]===item.uid||hero.disc?.includes(item.uid));
  }
  const salvageValue = item => item.rank + 1;
  const canSalvage = (bag,item) => !item.locked && !protectedGear(bag,item);
  function recycle(bag, item) {
    bag.items.splice(bag.items.indexOf(item), 1);
    bag.shards += salvageValue(item);
  }
  function compare(a,b){
    return a.rank-b.rank || ItemStrength.of(a)-ItemStrength.of(b) || (a.rollQuality||0)-(b.rollQuality||0);
  }
  function collect(bag, item) {
    if (bag.items.length >= capacity) {
      let weakest;
      for (const owned of bag.items)
        if (!owned.locked && !protectedGear(bag, owned) && (!weakest || compare(owned,weakest)<0)) weakest = owned;
      if (!weakest || compare(weakest,item)>=0) { bag.shards += salvageValue(item); return false; }
      recycle(bag, weakest);
    }
    bag.items.push(item);
    return true;
  }
  function salvageOne(bag,item) {
    if(!bag.items.includes(item)||!canSalvage(bag,item))return false;
    recycle(bag,item);return true;
  }
  function salvage(bag, rank) {
    const candidates = bag.items.filter(item => canSalvage(bag,item) && item.rank <= rank);
    for (const item of candidates) recycle(bag,item);
    return candidates.length;
  }
  // Commit exactly the instances shown in the preview, even if the bag was reordered.
  function salvageSelection(bag,ids,expectedShards){
    const selected=new Set(ids);
    const items=bag.items.filter(item=>selected.has(item.uid));
    if(!items.length || ids.length!==items.length || selected.size!==ids.length ||
       items.some(item=>!canSalvage(bag,item)) || items.reduce((sum,item)=>sum+salvageValue(item),0)!==expectedShards){
      throw Error("待分解回响已变化，请重新选择。");
    }
    for(const item of items)recycle(bag,item);
    return expectedShards;
  }
  return { makeRoller, compare, capacity, emptyBag, collect, salvage, salvageOne, salvageSelection, salvageValue, canSalvage, equipped, protectedGear };
})();
