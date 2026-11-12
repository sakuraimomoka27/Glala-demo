globalThis.CombatSkills=(()=>{
  const strikes=StrikeSkills;
  const projectileLimit=64;
  const canLaunch=(bolts,roomAllows)=>bolts.length<projectileLimit&&(!roomAllows||roomAllows());
  function launch(bolts,id,params){const bolt=ProjectileEffects.cast(id,params);bolts.push(bolt);return bolt}
  function shot(c,id=c.id){
    const port=id==="shot"?.46:.42;
    const bolt=launch(c.state.bolts,id,{
      source:c.source,hostile:c.hostile,x:c.launchX??c.x,y:c.launchY??c.y+port,dir:c.dir,power:c.power,radius:c.radius
    });
    if(id!=="shot")return;
    const m=c.mods;
    function tune(b){
      b.originX=b.x;b.speed=b.effect.speed*(1+(m.shot_jet||0)/100);
      b.life*=1+(m.shot_reach||0)/100;b.piercesLeft=Math.floor(m.shot_pierce||0);
      if(c.airborne)b.radius*=1+(m.shot_air||0)/100;
    }
    tune(bolt);
    if(m.shot_crest && ++c.state.shotCount%3===0)bolt.power*=1+m.shot_crest/100;
    if(m.shot_back&&canLaunch(c.state.bolts,c.canShoot)){
      const rear=launch(c.state.bolts,id,{...bolt,dir:-bolt.dir,power:c.power*m.shot_back/100,radius:c.radius});
      tune(rear);
    }
  }
  function volley(c){
    shot(c,"shot");
    c.state.volleys.push({fresh:true,left:2,wait:.10,dir:c.dir,power:c.power,radius:c.radius,
      offsetX:(c.launchX??c.x)-c.source.x,offsetY:(c.launchY??c.y+.46)-strikes.base(c.source)});
  }
  function summon(c){
    ShadowSkill.cast(c.state,{x:c.x,y:c.y,dir:c.dir},{
      shadowLife:c.duration,shadowDamage:c.power,shadowRadius:c.radius,
      shadowHp:c.hp??2,shadowPeriod:Math.max(.12,(c.period??.85)*(1-(c.mods.shadow_quick||0)/100)),mods:c.mods
    },c.width,c,c.id==="twin_shadow");
  }
  function leap(c){
    if(c.hostile){
      const base=c.state.leap?.base??c.source.baseY??0;
      c.state.leap={base,id:c.id,dir:c.dir,vy:c.speed??8,height:c.state.leap?.height??0};
    }else{
      Object.assign(c.source,{vy:c.speed??8,grounded:false,perch:null,airAge:0});
    }
    if(c.id==="wind_rebound"&&c.extraJumps!==undefined)
      c.source.airJumps=Math.min(c.extraJumps,(c.source.airJumps||0)+1);
    if(!c.silent)c.fx("clip",c.x,c.y,"airStep","",1.8);
    return true;
  }
  function restore(c){
    const stat=c.id==="heal"?"hp":"stamina";
    const max=c.max??(stat==="hp"?c.maxHp??c.source.max:c.source.staminaMax);
    if(c.source[stat]===undefined||max===undefined)return;
    c.source[stat]=Math.min(max,c.source[stat]+c.power);
    if(!c.silent)c.fx("num",c.x,c.y+1,c.id==="heal"?"回复生命":"回复体力","#92d7ac");
  }
  function melee(c){
    if(!c.silent)c.fx("clip",c.x+c.dir*c.radius*.5,c.y+.35,c.id==="stone_cut"?"shockwave":"slash","",c.radius*1.5);
    return strikes.melee(c);
  }
  function stomp(c){
    if(c.target && (c.contact || Math.abs(c.target.x-c.x)<=c.radius && Math.abs(strikes.base(c.target)-c.y)<=1.7))
      c.hit(c.target,c.power,"stomp",{x:c.x,y:c.y,dir:c.dir});
  }
  const definitions={
    ...Object.fromEntries(Object.entries(ProjectileEffects.definitions).map(([id,projectile])=>
      [id,{...projectile,projectile:true,cast:shot}])),
    tide_volley:{name:"三连水箭",power:14,radius:ProjectileEffects.definitions.shot.radius,projectile:true,cast:volley},
    stomp:{name:"跃击",radius:.6,cast:stomp},
    wave:{name:"钢岩冲击",radius:1.55,cast:strikes.wave},
    impact_ring:{name:"落击震环",radius:1.5,cast:strikes.wave},
    shield_wave:{name:"破盾反震",radius:3.5,cast:strikes.wave},
    bell_wave:{name:"钟卫震击",radius:3,flat:true,maxHeight:.35,strictRadius:true,cast:strikes.wave},
    burn:{name:"燃烧",power:6,duration:3,cast:strikes.burn},
    shield:{name:"钢岩护盾",cast:strikes.shield},
    shatter_shield:{name:"破碎反震护盾",cast:strikes.shield},
    slash:{name:"周身剑光",power:21,radius:1.05,cast:strikes.slash},
    return_blade:{name:"回旋潮刃",radius:.34,cast:strikes.blade},
    shadow:{name:"残影跃击",power:12,radius:1,duration:4,cast:summon},
    twin_shadow:{name:"双残影跃击",power:12,radius:1,duration:4,cast:summon},
    chain:{name:"连锁剑光",radius:3,cast:strikes.chain},
    eruption:{name:"三重喷涌",radius:2.8,cast:strikes.eruption},
    air_step:{name:"空中再跳",cast:leap},rebound:{name:"借力反弹",cast:leap},
    wind_rebound:{name:"踏风反弹",cast:leap},
    heal:{name:"回复生命",cast:restore},stamina:{name:"回复体力",resourceOnly:true,cast:restore},
  };
  for(const move of Object.values(FieldCombat.profiles)){
    if(move.contact)definitions[move.skill]={name:move.attack,radius:move.reach,style:move.skill,cast:melee};
  }
  for(const [id,move] of Object.entries({...SkillPatterns.moves,...SkillPatterns.weapons,...SkillPatterns.signatures})){
    definitions[id]={name:move[0],hint:move[1],cast:SkillPatterns.cast};
  }
  const ids=Object.keys(definitions).filter(id=>!definitions[id].resourceOnly);
  function rotation(value){
    return value?value.split(/[,，]/).map(id=>id.trim()):[];
  }
  function create(width=20,hostile=false,build){
    const state={bolts:[],volleys:[],blades:[],shades:[],vents:[],patterns:[],burns:new Map(),shadeHits:0,shield:0,shieldWait:0,flash:0};
    const mods=build?.machineMods??EchoModifiers.machineValues(build?.powers);
    Object.assign(state,{shotCount:0,slashCount:0,waveCount:0});
    const sets=build?EchoSets.create(build,rawCast):null;
    const main=build?MainAbilities.create(build,rawCast,sets):null;
    let cursor=0;
    function effects(h,dir){
      if(!hostile)return h.fx;
      return (...args)=>{
        const e=h.fx(...args);
        if(e&&typeof e==="object")Object.assign(e,{hostile:true,dir});
        return e;
      };
    }
    function baseValues(skill){
      return {power:hostile?1:skill.power??1,radius:skill.radius??1,duration:skill.duration};
    }
    function recover(source,h,stamina,missingLifePct=0){
      if(!build||source.hp<=0)return;
      if(stamina&&source.stamina<build.staminaMax)
        rawCast("stamina",source,[],h,{power:stamina,max:build.staminaMax,silent:true});
      if(missingLifePct&&source.hp<build.maxHp)
        rawCast("heal",source,[],h,{power:(build.maxHp-source.hp)*missingLifePct/100,max:build.maxHp,silent:true});
    }
    function rawCast(id,source,targets,h,options={}){
      if(!Object.hasOwn(definitions,id))throw Error("未知战斗技能「"+id+"」");
      const skill=definitions[id];
      if(skill.projectile&&!canLaunch(state.bolts,h.canShoot))return false;
      const dir=options.dir??h.dir??source.dir??source.guard?.dir??1;
      const c={...baseValues(skill),flat:skill.flat,maxHeight:skill.maxHeight,strictRadius:skill.strictRadius,
        x:source.x,y:strikes.base(source),dir,target:targets[0],
        platforms:h.platforms,style:skill.style,maxHp:h.maxHp,extraJumps:h.extraJumps,...options,id,state,source,targets,hostile,width:h.roomWidth??width,fx:effects(h,dir),hit:h.hit,
        mods,weight:build?.weight,canShoot:h.canShoot,airborne:hostile?!!(state.leap||state.dive):source.grounded===false,
        recover:(stamina,hpPct)=>recover(source,h,stamina,hpPct)};
      return skill.cast(c);
    }
    function jump(source,h){
      if(!build)return;
      state.windPrimed=false;
      EchoModifiers.onJump(build,rawCast,source,h);
      main.jump(source,h);
    }
    function contact(source,target,power,opponents,h){
      if(build)EchoModifiers.onContact(build,rawCast,source,target,power,opponents,h);
    }
    function onHit(owner,target,style,power,opponents,h){
      if(!build)return;
      const killed=target.hp<=0;
      EchoModifiers.onHit(build,state,rawCast,owner,target,style,power,opponents,h);
      if(style==="stomp")main.ignite(owner,target,h);
      sets.hit(owner,target,style,power,opponents,h,killed);
    }
    function cast(id,source,targets,h,options={}){
      if(!Object.hasOwn(definitions,id))throw Error("未知战斗技能「"+id+"」");
      const groundJump=id==="air_step"&&(hostile?!state.leap&&!state.dive:source.grounded);
      if(build&&id==="air_step"&&source.stamina!==undefined){
        if(!groundJump&&!(source.airJumps>0))return;
        const cost=groundJump?build.jumpCost:Math.max(1,(build.reboundCost??8)-(mods.wind_frugal||0));
        if(!MainAbilities.spend(source,cost))return;
        if(!groundJump)source.airJumps--;
      }
      if(build?.totals){
        const skill=definitions[id],key=id==="twin_shadow"?"shadow":id==="tide_volley"?"shot":id;
        options=EchoModifiers.skill(build,id,{...baseValues(skill),...build.skillBases[key],...options});
      }
      const airStep=build&&id==="air_step"&&!groundJump;
      if(airStep){
        const falling=(hostile?state.leap?.vy:source.vy)<0;
        options.speed=(options.speed??8)*(1+((mods.wind_lift||0)+(falling?mods.wind_reversal||0:0))/100);
      }
      const result=rawCast(sets?sets.variant(id):id,source,targets,h,options);
      if(airStep&&result){
        state.windPrimed=!!(mods.wind_edge||mods.wind_repay);
        if(mods.wind_guard)rawCast("shield",source,[],h,{cooldown:mods.wind_guard,keepShield:true});
        if(!source.airJumps)recover(source,h,0,mods.wind_mend);
        if(mods.wind_cutter||mods.wind_blade){
          const base=h.baseStomp?.()??build.attack*build.jumpMultiplier;
          if(mods.wind_cutter)rawCast("shot",source,targets,h,{power:base*mods.wind_cutter/100,radius:.24});
          if(!source.airJumps&&mods.wind_blade)rawCast("return_blade",source,targets,h,{power:base*mods.wind_blade/100,radius:.3});
        }
      }
      if(groundJump)jump(source,{...h,dir:options.dir??h.dir});
      return result;
    }
    function peek(list){if(list.length)return list[cursor%list.length]}
    function next(list,source,targets,h,options){
      if(!list.length)return;
      const id=peek(list);
      const result=cast(id,source,targets,h,typeof options==="function"?options(id):options);
      if(result!==false)cursor=(cursor+1)%list.length;
      return result;
    }
    function castConfigured(source,targets,h,options,id){
      const power=source.skillPower??source.rangedPower;
      const params=power===undefined?options:{power,...options};
      return id===undefined?next(source.rotation,source,targets,h,params):cast(id,source,targets,h,params);
    }
    function tick(dt,source,targets,h){
      if(source.grounded)state.windPrimed=false;
      if(hostile)h={...h,fx:effects(h,source.swingDir||source.shotDir||source.guard?.dir||1)};
      if(main&&h.tickMain!==false)main.tick(dt,source,targets,h,hostile&&source.kind==="bow");
      state.shieldWait=Math.max(0,state.shieldWait-dt);state.flash=Math.max(0,state.flash-dt);
      if(state.vents.length)strikes.tickVents(state,dt,targets,h);
      if(state.blades.length)strikes.tickBlades(state,dt,targets,h,width);
      if(state.burns.size)strikes.tickBurns(state,dt,h);
      for(let i=state.volleys.length-1;i>=0;i--){
        const v=state.volleys[i];
        if(source.hp<=0){state.volleys.splice(i,1);continue}
        if(v.fresh){v.fresh=false;continue}
        v.wait-=dt;if(v.wait>1e-7)continue;
        rawCast("shot",source,targets,h,{power:v.power,radius:v.radius,dir:v.dir,launchX:source.x+v.offsetX,
          launchY:strikes.base(source)+v.offsetY});
        v.wait+=.10;if(--v.left===0)state.volleys.splice(i,1);
      }
      if(state.bolts.length){
        const world={enemies:targets,player:h.player??targets[0],playerHeight:h.playerHeight,
          shades:h.shades??(hostile?targets.slice(1):[]),solids:h.solids};
        for(let i=state.bolts.length-1;i>=0;i--){
          const bolt=state.bolts[i];
          const enemy=ProjectileEffects.advance(bolt,dt,h.roomWidth??width,world,h.fx);
          if(enemy){
            const hp=enemy.hp;
            let power=bolt.power;
            if(bolt.id==="shot"){
              const travel=Math.abs(bolt.x-bolt.originX);
              const rangeBonus=travel>=3?mods.shot_far:travel<=1?mods.shot_close:0;
              power*=1+((rangeBonus||0)+(hp===(enemy.max??enemy.maxHp)?mods.shot_opening||0:0))/100;
            }
            h.hit(enemy,power,bolt.id||"shot",bolt);
            if(bolt.id==="shot"&&enemy.hp<hp)recover(source,h,mods.shot_spring);
          }
          if(bolt.used)state.bolts.splice(i,1);
        }
      }
      if(state.shades.length)ShadowSkill.tick(state,dt,targets,h,width);
      if(state.patterns.length)SkillPatterns.tick(state,dt,source,targets,h);
      if(state.leap){
        const l=state.leap,rising=l.vy>0,gravity=rising?24:build?.fall??24;
        l.height+=l.vy*dt-.5*gravity*dt*dt;l.vy-=gravity*dt;
        if(rising&&l.vy<=0&&l.id==="air_step")EchoModifiers.onApex(build,cast,source,l.dir,h);
        if(!source.guard)source.baseY=l.base+Math.max(0,l.height);
        if(l.height<=0){
          state.leap=null;state.windPrimed=false;
          if(build)source.airJumps=build.extraJumps;
          if(source.hp>0)h.onLand?.(-l.vy,l.base);
        }
      }
    }
    function absorb(onBreak,onBlock){
      if(!state.shield)return false;
      state.shield=0;
      const power=state.counterPower;state.counterPower=undefined;
      onBlock?.();
      if(power!==undefined)onBreak?.(power);
      return true;
    }
    function block(owner,opponents,h,onBlock){
      return absorb(power=>cast("shield_wave",owner,opponents(),h,{power,color:hostile?undefined:"#f4ce86"}),onBlock);
    }
    function clear(){
      SkillPatterns.endDive(state);
      for(const shade of state.shades)shade.hp=0;
      state.bolts.length=state.volleys.length=state.blades.length=state.shades.length=state.vents.length=state.patterns.length=0;
      state.burns.clear();
      state.lastStompTarget=null;
      state.windPrimed=false;state.lastSlashHits=null;
      state.shotCount=state.slashCount=state.waveCount=0;
    }
    const decoy=(attacker,target)=>ShadowSkill.decoy(state.shades,attacker,target);
    return {state,sets,main,decoy,hurtShade:ShadowSkill.hurt,cast,castResolved:rawCast,jump,contact,onHit,next,peek,castConfigured,tick,absorb,block,clear};
  }
  return {definitions,ids,rotation,create,projectileLimit,canLaunch,launch};
})();
