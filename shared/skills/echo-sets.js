globalThis.EchoSets=(()=>{
  // Keys are original exchange-card IDs. Artwork alone never identifies a set item.
  const sets={
    132106:{key:"ember",signature:"executeDamage",bonuses:{2:{stompPct:10},4:{executeThresholdBonus:.25},6:{eruptionEvery:3}},series:"红莲",name:"余烬",range:[8,14],effect:"对半血以下目标的直接踩击伤害 +#%",
      tiers:["踩踏伤害 +10%","余烬的生效线提高到 75% 生命","熔炉喷发：每踩中三次，在第三次的落点连续喷发三次，半径 2.8 米，每次造成一次基础踩踏伤害"]},
    132206:{key:"tide",signature:"regen",bonuses:{2:{stamina:20},4:{staminaOnStomp:4},6:{volley:1}},series:"绀碧",name:"潮息",range:[2,4],effect:"每秒额外恢复 # 点体力",
      tiers:["体力上限 +20","直接踩击命中恢复 4 点体力","潮汐三连：自动水箭每轮沿面朝方向连射三发，间隔 0.10 秒，每发均可独立命中；任意主位可用"]},
    132306:{key:"stone",signature:"defense",bonuses:{2:{healthPct:15},4:{heavyStompPct:20},6:{shieldRatio:1.8}},series:"钢岩",name:"岩衣",range:[3,6],effect:"减伤增加 # 个百分点",
      tiers:["生命上限 +15%","总负重至少 10 时直接踩击伤害 +20%","碎岩壁垒：落地获得抵挡一次伤害的岩盾，最快每 4 秒补充；破盾时震击身边 3.5 米内的敌人，造成 180% 基准踩踏伤害"]},
    132406:{key:"wind",signature:"jumpDiscount",bonuses:{2:{move:.6},4:{airJumps:1},6:{freeBounce:1}},series:"暴风",name:"轻步",range:[1,3],effect:"地面起跳少消耗 # 点体力",
      tiers:["移动速度 +0.6 米/秒","每次腾空可额外空跳一次","踏风连跃：按住跳跃踩中敌人即免费反弹，并补回一次空跳，可借敌人连续腾空"]},
    132506:{key:"light",signature:"stompPct",bonuses:{2:{fullHealthStompPct:15},4:{bossStompPct:15},6:{chain:1}},series:"辉煌",name:"樱刃",range:[5,10],effect:"踩踏伤害 +#%",
      tiers:["直接踩击满血目标时伤害 +15%","直接踩击首领时伤害 +15%","樱花连斩：踩中后剑光从目标逐个跳向附近敌人，每段最远 3 米，最多追斩四名不同敌人，每斩造成一次基础踩踏伤害。周围没有其他目标时，改对原目标追加两段各 60% 的十字斩"]},
    132606:{key:"shade",signature:"signatureBossPct",bonuses:{2:{lastTargetPct:12},4:{healOnKill:.03},6:{shadowAttackRatio:.6}},series:"宵暗",name:"王令",range:[8,14],effect:"直接踩击首领时伤害 +#%",
      tiers:["场上只剩一个敌人时，对它的伤害 +12%","击杀恢复 3% 最大生命","王座影卫：每次地面起跳召出两名影卫，最多四名同时索敌、跃击和引敌。影卫继承 60% 攻击白值，任意主位可用"]}
  };
  const byKey=Object.fromEntries(Object.values(sets).map(set=>[set.key,set]));
  // Configuration grants copies directly. Missing signatures use the set's minimum roll.
  function parse(value){
    const result={};
    if(value===undefined||value==="")return result;
    if(typeof value!=="string")throw Error("套装配置须为文本");
    for(const entry of value.split(/[,，]/)){
      const pair=/^([a-z_]+)\s*[:：]\s*([1-9]\d*)$/.exec(entry.trim());
      if(!pair||!Object.hasOwn(byKey,pair[1]))throw Error("无效套装「"+entry.trim()+"」，格式为 ember:6");
      if(Object.hasOwn(result,pair[1]))throw Error("同一套装只能配置一次");
      const count=Number(pair[2]);
      if(!Number.isSafeInteger(count))throw Error("套装件数须为正整数");
      result[pair[1]]=count;
    }
    return result;
  }
  function counts(items){
    const stars={};
    for(const item of items){
      const set=sets[item.goldStarId];
      if(set)stars[set.key]=(stars[set.key]||0)+1;
    }
    return stars;
  }
  function resolve(items,...presets){
    const stars=counts(items),powers={};
    for(const {power} of items)if(power && (!powers[power.kind]||power.power>powers[power.kind].power))powers[power.kind]=power;
    for(const preset of presets)for(const [key,n] of Object.entries(parse(preset))){
      stars[key]=(stars[key]||0)+n;
      const power=byKey[key].range[0];
      if(!powers[key]||powers[key].power<power)powers[key]={kind:key,power};
    }
    return {stars,powers,echo:modifiers(stars,powers)};
  }
  function modifiers(stars={},powers={}){
    const result={};
    for(const [key,set] of Object.entries(byKey)){
      const signature=powers[key]?.power;
      if(signature)result[set.signature]=(result[set.signature]||0)+signature;
      for(const [threshold,bonuses] of Object.entries(set.bonuses)){
        if(!(stars[key]>=Number(threshold)))continue;
        for(const [stat,n] of Object.entries(bonuses))result[stat]=(result[stat]||0)+n;
      }
    }
    return result;
  }
  function maxHealth(base,echo){return echo.healthPct?Math.floor(base*(100+echo.healthPct)/100):base}
  function skillSources(catalog,echo,main){
    const find=(id,granted)=>main?.ability===id?main:granted?catalog.summons.find(s=>s.ability===id):null;
    return {shooter:find("shot",echo.volley),shadow:find("shadow",echo.shadowAttackRatio)};
  }
  function stats(build){
    const m=build.echo;
    Object.assign(build,{
      maxHp:maxHealth(build.baseMaxHp,m),
      staminaMax:build.staminaMax+(m.stamina||0),regen:build.regen+(m.regen||0),
      move:build.move+(m.move||0),extraJumps:build.extraJumps+(m.airJumps||0),
      jumpCost:Math.max(1,build.jumpCost-(m.jumpDiscount||0)),
      defense:Math.max(0,Math.min(.7,(build.defense+(m.defense||0))/100)),
      jumpMultiplier:1+(build.stompPct+(m.stompPct||0))/100
    });
    return build;
  }
  function singleOpponent(targets){
    let found=false;
    for(const target of targets)if(target.hp>0){
      if(found)return false;
      found=true;
    }
    return found;
  }
  function hitBonus(build,target,style,remaining){
    const m=build.echo??modifiers(build.stars,build.powers);
    let bonus=0;
    if(m.lastTargetPct&&(typeof remaining==="function"?singleOpponent(remaining()):remaining===1))bonus=m.lastTargetPct;
    if(style!=="stomp"&&style!=="core")return bonus;
    const max=target.max??target.maxHp;
    if(target.hp<max*(.5+(m.executeThresholdBonus||0)))bonus+=m.executeDamage||0;
    if(target.hp===max)bonus+=m.fullHealthStompPct||0;
    if(target.kind==="bell")bonus+=(m.bossStompPct||0)+(m.signatureBossPct||0);
    if(build.weight>=10)bonus+=m.heavyStompPct||0;
    return bonus;
  }
  // One instance per wearer. Casts use the owner's combat runtime and room damage hooks.
  function create(build,cast){
    const m=build.echo??modifiers(build.stars,build.powers);
    let stomps=0;
    function variant(id){
      if(id==="shot"&&m.volley)return "tide_volley";
      if(id==="shadow"&&m.shadowAttackRatio)return "twin_shadow";
      return id;
    }
    function land(owner,h,baseDamage){
      if(m.shieldRatio)cast("shatter_shield",owner,[],h,{power:Math.round(baseDamage()*m.shieldRatio),cooldown:4,keepShield:true});
    }
    function stomp(target,power,targets,h,owner=target){
      if(m.eruptionEvery&&++stomps>=m.eruptionEvery){
        stomps=0;cast("eruption",owner,targets,h,{target,power});
      }
      if(m.chain)cast("chain",owner,targets,h,{target,power});
    }
    function onHit(owner,style,h){
      if(m.staminaOnStomp&&(style==="stomp"||style==="core"))
        cast("stamina",owner,[],h,{power:m.staminaOnStomp,max:build.staminaMax,silent:true});
    }
    function kill(owner,h){
      if(m.healOnKill&&owner.hp>0)cast("heal",owner,[],h,{power:m.healOnKill*build.maxHp,max:build.maxHp,silent:true});
    }
    function rebound(owner,h,requested){
      if(!requested||!m.freeBounce)return false;
      cast("wind_rebound",owner,[],h,{speed:build.launch,extraJumps:build.extraJumps});
      return true;
    }
    function hit(owner,target,style,power,opponents,h,killed=target.hp<=0){
      if(killed&&!target.skillShade)kill(owner,h);
      onHit(owner,style,h);
      if((style==="stomp"||style==="core")&&(m.eruptionEvery||m.chain))
        stomp(target,power,opponents(),h,owner);
    }
    return {variant,land,stomp,hit,rebound};
  }
  return {sets,byKey,parse,counts,resolve,modifiers,stats,maxHealth,skillSources,hitBonus,create};
})();
