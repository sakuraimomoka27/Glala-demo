// Affix values and power triggers are resolved per wearer, independently of faction.
globalThis.EchoModifiers=(()=>{
  const machineKinds=[
    "shot_jet","shot_reach","shot_pierce","shot_far","shot_close","shot_back","shot_crest","shot_spring","shot_opening","shot_air",
    "burn_kindle","burn_cap","burn_fuel","burn_hunt","burn_quick","burn_high","burn_last","burn_breath","burn_pack","burn_flash",
    "wave_cost","wave_threshold","wave_heavy","wave_guard","wave_inner","wave_rim","wave_shelter","wave_wound","wave_refund","wave_third",
    "wind_reserve","wind_frugal","wind_lift","wind_reversal","wind_guard","wind_mend","wind_edge","wind_cutter","wind_blade","wind_repay",
    "slash_solo","slash_crowd","slash_rear","slash_repeat","slash_third","slash_breath","slash_mend","slash_air","slash_blade","slash_guard",
    "shadow_cap","shadow_quick","shadow_reach","shadow_wound","shadow_life","shadow_stride","shadow_third","shadow_veil","shadow_lure","shadow_burst",
  ];
  function machineValues(powers={}){
    return Object.fromEntries(Object.entries(powers).map(([kind,p])=>[kind,p.power]));
  }
  const domains={burn:["burnDamage","ailmentHit","burnTime"],shot:["shotDamage","shotRate","shotSize"],
    earth:["waveDamage","waveSize"],slash:["slashDamage","slashRate","slashSize"],shadow:["petHp","petTime","petDamage"]};
  const statIds=["jump","fall","attack","move","haste","regen","jumpDamage","defense","health",...Object.values(domains).flat()];
  const seriesByStat={jump:"暴风",haste:"暴风",move:"暴风",fall:"钢岩",attack:"钢岩",regen:"绀碧"};
  const seriesOf=row=>row.series||seriesByStat[row.stat]||"暴风";
  const families={shot:"shot",tide_volley:"shot",return_blade:"shot",slash:"slash",burn:"burn",shadow:"shadow",
    twin_shadow:"shadow",wave:"earth",impact_ring:"earth",kill_wave:"earth",bell_wave:"earth",shield_wave:"earth"};
  const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));
  function supports(stat,kind){
    const family=Object.keys(domains).find(k=>domains[k].includes(stat));
    return !family||family===kind;
  }
  function applies(stat,id){return supports(stat,families[id==="shatter_shield"?"shield_wave":id])&&!(stat==="shotRate"&&id==="return_blade")}
  function entries(value,affixes){
    if(value===undefined||value==="")return [];
    if(typeof value!=="string")throw Error("回响配置须为文本");
    const seen=new Set();
    return value.split(/[,，]/).map(entry=>{
      const pair=entry.trim().split(/\s*[:：]\s*/),id=pair[0];
      if(!/^[a-z][a-z0-9_-]{0,47}$/.test(id)||pair.length>(affixes?2:1))throw Error("无效回响配置「"+entry+"」");
      if(seen.has(id))throw Error("重复引用「"+id+"」");
      seen.add(id);
      if(pair.length===1)return {id};
      const amount=Number(pair[1]);
      if(!/^(?:\d+(?:\.\d+)?|\.\d+)$/.test(pair[1])||!Number.isFinite(amount)||amount>Number.MAX_SAFE_INTEGER)
        throw Error("词条数值须为非负有限数");
      return {id,value:amount};
    });
  }
  function lines(item,main){
    return (item.stats||[]).map(line=>{
      const boosted=!!main&&line.series===main.series;
      return {...line,boosted,effective:line.value*(boosted?1+main.boost:1)};
    });
  }
  function resolve(catalog,items,main,...sources){
    const totals=Object.create(null),powerItems=[];
    function add(item){for(const line of lines(item,main))totals[line.stat]=(totals[line.stat]||0)+line.effective}
    for(const item of items)add(item);
    for(const source of sources){
      for(const entry of entries(source?.echoAffixes,true)){
        const row=catalog.affixes.find(a=>a.id===entry.id);
        if(!row)throw Error("缺少回响词条「"+entry.id+"」");
        add({stats:[{stat:row.stat,series:seriesOf(row),value:entry.value??row.min}]});
      }
      for(const {id} of entries(source?.echoPowers,false)){
        const power=catalog.powers.find(p=>p.id===id);
        if(!power)throw Error("缺少威能「"+id+"」");
        powerItems.push({power});
      }
    }
    return {...EchoSets.resolve([...items,...powerItems],...sources.map(s=>s?.echoSets)),totals};
  }
  function cadence(build,id,period){
    const family=families[id];
    const stat=family==="slash"?"slashRate":family==="shot"&&id!=="return_blade"?"shotRate":null;
    const rate=build?.totals?.[stat]||0;
    return rate?Math.min(period,Math.max(.30,period*(1-clamp(rate/100,0,.75)))):period;
  }
  function jumpDelay(build,id,seconds){
    return id==="air_step"||id==="dive"?Math.max(0,seconds-(build?.totals?.haste||0)/1000-(build?.rebound?.024:0)):seconds;
  }
  // Input numbers are unmodified. Repeated hits and delayed casts retain this snapshot.
  function skill(build,id,base){
    const s=build.totals,family=families[id],out={...base};
    const val=k=>s[k]||0,pct=k=>1+val(k)/100;
    if(family==="burn"){
      out.power*=pct("burnDamage");out.duration=clamp(out.duration+val("burnTime"),.5,12);
      out.accuracy=clamp((out.accuracy||0)+val("ailmentHit")/100,0,1);
    }else if(family==="shadow"){
      out.power*=pct("petDamage");out.hp=(out.hp??2)+Math.floor(val("petHp"));
      out.duration=clamp(out.duration+val("petTime"),.5,12);
    }else if(family){
      const key=family==="earth"?"wave":family;
      out.power*=pct(key+"Damage");
      out.radius*=pct(key+"Size");
      if(family==="shot")out.radius=clamp(out.radius,id==="return_blade"?.12:.08,1.5);
      if(family==="slash")out.radius=clamp(out.radius,.2,2.4);
      if(id==="wave")out.radius=clamp(out.radius,.2,4);
    }
    if(id==="air_step")out.speed??=clamp(8+val("jump")+(build.rebound?.7:0),7.3,15);
    if(id==="stomp"||id==="dive")out.power=stompPower(build,out.power);
    if(id==="dive"&&out.warning===undefined)out.warning=jumpDelay(build,id,.55);
    return out;
  }
  function stompPower(build,power){
    return (power+(build?.totals?.attack||0))*(build?.jumpMultiplier??1);
  }
  function stats(build){
    const s=build.totals,blade=build.powers.return_blade;
    build.baseMaxHp=Math.max(1,build.whiteHealth+Math.floor(s.health||0));
    build.move+=s.move||0;build.regen+=s.regen||0;
    build.defense=s.defense||0;build.stompPct=s.jumpDamage||0;build.attack+=s.attack||0;
    build.launch=clamp(build.launch+(s.jump||0),7.3,15);
    build.fall=clamp(build.fall+(s.fall||0),8,75);
    if(build.powers.air_step)build.extraJumps++;
    if(blade)build.skillBases.return_blade={power:blade.power+.65*build.whiteAttack,radius:blade.radius};
    return EchoSets.stats(build);
  }
  function onJump(build,cast,owner,h){
    if(build.bladeDamage)cast("return_blade",owner,[],h,{power:build.bladeDamage,radius:build.bladeSize,dir:h.dir??owner.dir??owner.guard?.dir??1});
  }
  function onApex(build,cast,owner,dir,h){
    if((build?.powers?.air_step||build?.rebound)&&owner.hp>0&&owner.airJumps>0)cast("air_step",owner,[],h,{dir});
  }
  function onContact(build,cast,owner,target,damage,opponents,h){
    const fault=build.powers?.impact_ring;
    if(!fault)return;
    const ring=skill(build,"impact_ring",{power:damage*fault.power,radius:fault.radius});
    cast("impact_ring",owner,opponents(),h,{...ring,x:target.x,y:StrikeSkills.base(target),exclude:target,
      power:Math.max(1,Math.round(ring.power)),color:"#ef9e64"});
  }
  function directStomp(style){return style==="stomp"||style==="core"}
  function hitBonus(build,owner,target,style,state){
    if(!directStomp(style))return 0;
    const powers=build.powers||{};
    let bonus=target.hp===(target.max??target.maxHp)?powers.opening_stomp?.power||0:0;
    if(state?.windPrimed)bonus+=powers.wind_edge?.power||0;
    if(powers.spent_stomp && build.staminaMax>0 && Number.isFinite(owner.stamina))
      bonus+=powers.spent_stomp.power*clamp(1-owner.stamina/build.staminaMax,0,1);
    return bonus;
  }
  function onHit(build,state,cast,owner,target,style,damage,opponents,h){
    const powers=build.powers||{},direct=directStomp(style);
    if(direct&&state.windPrimed){
      state.windPrimed=false;
      if(powers.wind_repay)cast("stamina",owner,[],h,{power:powers.wind_repay.power,max:build.staminaMax});
    }
    if(direct && powers.repeat_stamina){
      if(state.lastStompTarget===target)
        cast("stamina",owner,[],h,{power:powers.repeat_stamina.power,max:build.staminaMax});
      state.lastStompTarget=target.hp>0?target:null;
    }
    if(target.hp>0||target.skillShade||owner.hp<=0)return;
    if(powers.kill_mend && owner.hp<build.maxHp)
      cast("heal",owner,[],h,{power:(build.maxHp-owner.hp)*powers.kill_mend.power/100,max:build.maxHp});
    if(direct && powers.kill_wave){
      const wave=skill(build,"kill_wave",{power:damage*powers.kill_wave.power,radius:powers.kill_wave.radius});
      cast("impact_ring",owner,opponents(),h,{...wave,power:Math.max(1,Math.round(wave.power)),
        x:target.x,y:StrikeSkills.base(target),exclude:target,color:"#ea917a"});
    }
  }
  return {statIds,seriesByStat,seriesOf,domains,supports,applies,entries,lines,resolve,stats,stompPower,skill,cadence,jumpDelay,onJump,onApex,onContact,hitBonus,onHit,clamp,machineKinds,machineValues};
})();
