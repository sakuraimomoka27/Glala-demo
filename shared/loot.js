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
    if(!world||!Number.isInteger(world.level)||!Number.isInteger(world.minPower)||!Number.isInteger(world.maxPower))throw Error("缺少有效的关卡难度掉落配置。");
    const cap=world.level<=2?399:world.level===3?659:800;
    if(world.level<1||world.minPower<1||world.minPower>world.maxPower||world.maxPower>cap)throw Error("物品强度超出当前难度的掉落范围。");
    return world.minPower+Math.floor(rng()*(world.maxPower-world.minPower+1));
  }
  return {of,legacy,grade,scale,roll,describe,chanceAtLeast};
})();
globalThis.GoldStars=(()=>{
  // Keys are original exchange-card IDs. Artwork alone never identifies a set item.
  const sets={
    132106:{key:"ember",series:"红莲",name:"余烬",range:[8,14],effect:"对半血以下目标的直接踩击伤害 +#%",
      tiers:["踩踏伤害 +10%","余烬的生效线提高到 75% 生命","熔炉喷发：每踩中三次，在第三次的落点连续喷发三次，半径 2.8 米，每次造成一次基础踩踏伤害"]},
    132206:{key:"tide",series:"绀碧",name:"潮息",range:[2,4],effect:"每秒额外恢复 # 点体力",
      tiers:["体力上限 +20","直接踩击命中恢复 4 点体力","潮汐三连：自动水箭每轮沿面朝方向连射三发，间隔 0.10 秒，每发均可独立命中；任意主位可用"]},
    132306:{key:"stone",series:"钢岩",name:"岩衣",range:[3,6],effect:"减伤增加 # 个百分点",
      tiers:["生命上限 +15%","总负重至少 10 时直接踩击伤害 +20%","碎岩壁垒：落地获得抵挡一次伤害的岩盾，最快每 4 秒补充；破盾时震击身边 3.5 米内的敌人，造成 180% 基准踩踏伤害"]},
    132406:{key:"wind",series:"暴风",name:"轻步",range:[1,3],effect:"地面起跳少消耗 # 点体力",
      tiers:["移动速度 +0.6 米/秒","每次腾空可额外空跳一次","踏风连跃：按住跳跃踩中敌人即免费反弹，并补回一次空跳，可借敌人连续腾空"]},
    132506:{key:"light",series:"辉煌",name:"樱刃",range:[5,10],effect:"踩踏伤害 +#%",
      tiers:["直接踩击满血目标时伤害 +15%","直接踩击首领时伤害 +15%","樱花连斩：踩中后剑光从目标逐个跳向附近敌人，每段最远 3 米，最多追斩四名不同敌人，每斩造成一次基础踩踏伤害。周围没有其他目标时，改对原目标追加两段各 60% 的十字斩"]},
    132606:{key:"shade",series:"宵暗",name:"王令",range:[8,14],effect:"直接踩击首领时伤害 +#%",
      tiers:["场上只剩一个敌人时，对它的伤害 +12%","击杀恢复 3% 最大生命","王座影卫：每次地面起跳召出两名影卫，最多四名同时索敌、跃击和引敌。影卫继承 60% 攻击白值，任意主位可用"]}
  };
  function counts(items){
    const result={};
    for(const item of items){
      const set=sets[item.goldStarId];
      if(set)result[set.key]=(result[set.key]||0)+1;
    }
    return result;
  }
  function chance(depth){return depth>=30?.35:depth>=25?.20:depth>=20?.10:0}
  function roll(catalog,world,factor,depth,first,rng=Math.random){
    const rate=chance(depth);
    if(!rate||(!first&&rng()>=rate))return null;
    const pool=FANTASY_CARDS.exchange;
    const id=pool[Math.floor(rng()*pool.length)].id,set=sets[id];
    const base=catalog.equipment.find(e=>!e.sourceMonster&&e.series===set.series)||catalog.equipment.find(e=>!e.sourceMonster);
    const tier=catalog.rarities.find(t=>t.id==="unique");
    return EchoItem.mint(catalog,{...base,series:set.series,baseAttack:2,baseHealth:2,weight:1,
      echoName:FANTASY_CARDS.cards[id].name},tier,rng,world,factor,{goldStarId:id});
  }
  function hitBonus(build,enemy,style,remaining){
    const stars=build.stars,powers=build.powers;
    const direct=style==="stomp"||style==="core",boss=enemy.kind==="bell";
    let bonus=0;
    if(stars.shade>=2 && remaining===1)bonus+=12;
    if(!direct)return bonus;
    if(stars.ember && enemy.hp<enemy.max*(stars.ember>=4?.75:.5))bonus+=powers.ember.power;
    if(stars.light>=2 && enemy.hp===enemy.max)bonus+=15;
    if(stars.light>=4 && boss)bonus+=15;
    if(stars.shade && boss)bonus+=powers.shade.power;
    if(stars.stone>=4 && build.weight>=10)bonus+=20;
    return bonus;
  }
  return {sets,counts,chance,roll,hitBonus};
})();
globalThis.EchoItem=(()=>{
  const limits={common:[0,0],fine:[1,2],rare:[3,4],legendary:[4,4],unique:[4,4]};
  const ranks=Object.keys(limits);
  function qualityRule(id){
    const [min,max]=limits[id];
    if(id==="common")return "仅基础攻血";
    const count=min===max?String(min):min+"～"+max;
    if(id==="unique")return "普通 UR 同名限一件，4 条固定词缀；金星 UR 可重复装盘，4 条随机词缀与专属威能";
    return count+" 条魔法词缀"+(id==="legendary"?" · 非泰坦回响附带威能":"");
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
  function mint(catalog,base,tier,rng,world=catalog.worlds[0],echoBaseFactor=1,options={}){
    let unique;
    const star=GoldStars.sets[options.goldStarId];
    if(tier.id==="unique" && !star){
      unique=pick(catalog.uniques.filter(u=>u.dropWeight>0),rng,u=>u.dropWeight);
      base=catalog.equipment.find(e=>e.id===unique.template);
    }
    const itemPower=ItemStrength.roll(world,rng),scale=ItemStrength.scale(itemPower);
    const item={format:2,uid:crypto.randomUUID(),kind:"echo",icon:base.icon,baseId:base.id,name:unique?.name||base.echoName||base.name+"回响",
      slot:base.slot,weight:base.weight,skill:base.skill,itemPower,sourceWorld:world.level,
      baseAttack:Math.round(base.baseAttack*scale*echoBaseFactor),baseHealth:Math.round(base.baseHealth*scale*echoBaseFactor),tier:tier.id,
      tierName:tier.name,color:tier.color,rank:ranks.indexOf(tier.id),stats:[],rollQuality:0};
    if(echoBaseFactor>1)item.echoBaseFactor=echoBaseFactor;
    if(star){
      item.goldStarId=options.goldStarId;item.coreId=options.goldStarId;
      const native=catalog.affixes.filter(a=>a.series===star.series && eligible(a,"unique"));
      if(native.length){
        const affix=pick(native,rng,a=>a.weight),roll=rng();
        item.stats.push(line(affix,scale,roll,base));
        item.rollQuality=(roll+3*fill(item.stats,base,tier,catalog,4,rng,scale))/4;
      }else item.rollQuality=fill(item.stats,base,tier,catalog,4,rng,scale);
      const [min,max]=star.range,roll=min+Math.floor(rng()*(max-min+1));
      item.power={id:star.key,kind:star.key,name:star.name,power:roll,description:star.effect.replace("#",String(roll))};
    }else if(unique){
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
      if(tier.id==="legendary"){
        const power=pick(catalog.powers.filter(p=>p.quality==="legendary"&&p.weight>0),rng,p=>p.weight);
        if(!options.titan)item.power=powerSnapshot(power);
      }
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
  function makeRoller(catalog,rng=Math.random,source=1,echoBaseFactor=1) {
    const world=typeof source==="number"?catalog.worlds.find(row=>row.level===source):source;
    if(!world)throw Error("掉落来源的关卡难度不存在。");
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
        const item=EchoItem.mint(catalog,{...base,echoName:card.name,series:machine.series},tier,rng,world,echoBaseFactor,{titan:true});
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
      return EchoItem.mint(catalog,pick(rng),chooseTier(rng),rng,world,echoBaseFactor);
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
    return a.rank-b.rank || (a.echoBaseFactor??1)-(b.echoBaseFactor??1) || ItemStrength.of(a)-ItemStrength.of(b) || (a.rollQuality||0)-(b.rollQuality||0);
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
