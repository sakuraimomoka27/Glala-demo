// Main-slot abilities are per-wearer effects. Input, AI and presentation supply events.
globalThis.MainAbilities=(()=>{
  const {skill,cadence,clamp}=EchoModifiers;
  function source(catalog,row,equipped){
    return equipped??(row.mainAbility?catalog.summons.find(s=>s.id===row.mainAbility):undefined);
  }
  function prepare(catalog,base,main,monsterPower,mainPower){
    const kind=main?.ability||"",wind=kind==="wind";
    const build=EchoModifiers.stats({...base,mainAbility:main,kind,
      move:base.move+(wind?.7:0),launch:base.launch+(wind?.7:0),extraJumps:wind?1:0,
      rebound:wind?{name:"暴风借力",power:main.power??8,threshold:0}:null,reboundCost:8,waveCost:6,
      shieldPeriod:base.echo.shieldRatio?4:kind==="earth"?(main.period??4):0});
    const m=build.machineMods=EchoModifiers.machineValues(build.powers);
    if(build.extraJumps)build.extraJumps+=Math.floor(m.wind_reserve||0);
    build.waveCost=Math.max(1,build.waveCost-(m.wave_cost||0));
    build.windup=EchoModifiers.jumpDelay(build,"air_step",.068);
    const impactMass=EchoModifiers.clamp((base.weight-4)/8,0,2);
    return prepareSkills(build,{...EchoSets.skillSources(catalog,build.echo,main),main,impactMass,monsterPower,mainPower});
  }
  // Register the unmodified bases once. Automatic casts and the equipment preview use the same snapshots.
  function prepareSkills(build,{shooter,shadow,main,impactMass=0,monsterPower,mainPower}){
    const bases=build.skillBases,kind=main?.ability,white=build.whiteAttack;
    const power=main?.power??0,radius=main?.radius??0;
    if(shooter){
      const shotBase=shooter===main?(mainPower??power):(monsterPower??shooter.power??0);
      bases.shot={power:shotBase+.65*white,radius:shooter.radius??.34};
    }
    if(shadow){
      const attack=shadow===main?(mainPower??power):monsterPower??shadow.power??0;
      bases.shadow={power:attack+(build.echo.shadowAttackRatio||0)*(monsterPower??white),
        radius:shadow.radius??1,duration:shadow.duration??4,period:Math.max(.35,shadow.period??.85),hp:2};
    }
    if(kind==="burn")bases.burn={power:mainPower??power,duration:main.duration??3,
      chances:(main.burnChances||"100,80,55,35,15").split(/[,，]/).map(n=>clamp(Number(n)/100,0,1))};
    if(kind==="slash")bases.slash={power:(mainPower??power)+.85*white,radius};
    if(kind==="earth")bases.wave={power:power*(.52+impactMass*.88),radius:radius*(.52+impactMass*.64)};
    const get=id=>bases[id]?skill(build,id,bases[id]):{};
    const shot=get("shot"),shade=get("shadow"),slash=get("slash"),wave=get("wave"),burn=get("burn"),blade=get("return_blade");
    return Object.assign(build,{
      shotEffect:shooter?.ability,shotDamage:shot.power??0,shotSize:shot.radius??0,shotPeriod:shooter?Math.max(.30,cadence(build,"shot",shooter.period??1.2)):0,
      shadowDamage:shade.power??0,shadowRadius:shade.radius??0,shadowLife:shade.duration??0,shadowHp:shade.hp??0,shadowPeriod:shade.period??0,
      slashDamage:slash.power??0,slashRadius:slash.radius??0,slashPeriod:bases.slash?Math.max(.30,cadence(build,"slash",main.period??1.5)):0,
      wave:bases.wave?{name:"钢岩冲击",power:wave.power,radius:wave.radius,threshold:Math.max(1,8-(build.machineMods?.wave_threshold||0))}:null,
      burnDamage:burn.power??0,burnTime:burn.duration??0,burnChances:burn.chances??[],ailmentHit:clamp((build.totals.ailmentHit||0)/100,0,1),
      bladeDamage:blade.power??0,bladeSize:blade.radius??0
    });
  }
  function spend(owner,cost){
    if(owner.stamina===undefined||owner.stamina+1e-7<cost)return false;
    owner.stamina=Math.max(0,owner.stamina-cost);return true;
  }
  function create(b,cast,sets){
    let shotClock=b.shotPeriod,slashClock=b.slashPeriod;
    function shoot(owner,targets,h,options){
      cast(sets.variant("shot"),owner,targets,h,{power:b.shotDamage,radius:b.shotSize,dir:h.dir??owner.dir??1,...options});
    }
    function bowRelease(id,owner,opponents,h,port){
      if(b.shotPeriod&&id!=="shot"&&id!=="tide_volley")shoot(owner,opponents(),h,port);
    }
    function tick(dt,owner,targets,h,bow=false){
      if(owner.hp<=0)return;
      if(b.shotPeriod&&!bow){
        shotClock-=dt;
        if(shotClock<=1e-7){shotClock+=b.shotPeriod;shoot(owner,targets,h)}
      }
      if(b.slashPeriod){
        slashClock-=dt;
        if(slashClock<=1e-7){
          slashClock+=b.slashPeriod;cast("slash",owner,targets,h,{power:b.slashDamage,radius:b.slashRadius});
        }
      }
    }
    function jump(owner,h){
      owner.wave=true;
      if(b.shadowLife)cast(sets.variant("shadow"),owner,[],h,{power:b.shadowDamage,radius:b.shadowRadius,
        dir:h.dir??owner.dir??owner.guard?.dir??1,duration:b.shadowLife,period:b.shadowPeriod,hp:b.shadowHp});
    }
    function ignite(owner,target,h){
      if(b.burnTime&&target?.hp>0)cast("burn",owner,[target],h,{power:b.burnDamage,duration:b.burnTime,chances:b.burnChances,accuracy:b.ailmentHit});
    }
    function rebound(owner,h,requested,landed,eligible,speed){
      if(!requested)return;
      if(sets.rebound(owner,h,landed))return "free";
      if(b.rebound&&eligible&&speed>=b.rebound.threshold&&spend(owner,b.reboundCost)){
        cast("rebound",owner,[],h,{speed:b.rebound.power,silent:!!h.silent});return "paid";
      }
    }
    function shield(owner,h,baseDamage){
      if(b.echo.shieldRatio)sets.land(owner,h,baseDamage);
      else if(b.wave)cast("shield",owner,[],h,{cooldown:Math.max(.1,b.shieldPeriod*(1-(b.machineMods?.wave_guard||0)/100))});
    }
    function land(owner,h,speed=0,impactDamage,opponents,options){
      owner.airJumps=b.extraJumps;owner.bonus=true;
      const baseStomp=h.baseStomp??(()=>b.attack*b.jumpMultiplier);
      sets.land(owner,h,baseStomp);
      if(!b.wave||owner.wave===false||speed<b.wave.threshold||!spend(owner,b.waveCost))return;
      owner.wave=false;
      const power=b.wave.power>0?Math.max(1,Math.round((impactDamage??baseStomp())*b.wave.power)):0;
      const hits=cast("wave",owner,opponents(),h,{power,radius:b.wave.radius,...options});
      if(hits&&!b.echo.shieldRatio)shield(owner,h,baseStomp);
      return {power,hits};
    }
    return {tick,bowRelease,jump,ignite,rebound,shield,land};
  }
  return {source,prepare,spend,create};
})();
