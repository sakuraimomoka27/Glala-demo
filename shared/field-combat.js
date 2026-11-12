// Local space is metres, measured from the supporting surface. The animation
// renderer and the damage check read the same commitment and reach.
globalThis.FieldCombat=(()=>{
  const pixelsPerMetre=29;
  const lift=actor=>actor.guard.lift+(actor.skills?.state.leap?.height||0);
  const base=actor=>actor.y??(actor.guard?lift(actor):actor.baseY??0);
  const profiles={
    sentry:{skill:"cut",height:1.65,head:1.60,windup:.43,active:.16,recover:.80,reach:.92,fullReach:1.37,attack:"横斩",ink:"steel",contact:13},
    forgeguard:{skill:"heavy_cut",height:1.67,head:1.60,windup:.62,active:.20,recover:.94,reach:1.04,fullReach:1.67,attack:"重剑横斩",swingImpulse:1.15,ink:"steel",contact:14},
    trial_guard:{skill:"stone_cut",height:1.65,head:1.60,windup:.50,active:.18,recover:.84,reach:.92,attack:"碎岩横击",swingImpulse:1.15,ink:"stone",contact:12},
    shade:{skill:"claw",height:1.02,head:.90,windup:.31,active:.14,recover:.65,reach:.86,attack:"前爪突袭",ink:"claw",contact:13},
    archer:{skill:"arrow",height:1.65,head:1.54,draw:.55,cooldown:3.4,reach:8,portX:.52,portY:1.01,attack:"箭矢",ink:"arrow"},
    watcher:{skill:"pulse",fixedPort:true,firstAim:1.25,height:1.26,draw:.85,cooldown:3.0,reach:6.7,portX:.15,portY:.505,attack:"警戒脉冲",ink:"pulse"}
  };
  function profile(id,kind){return profiles[id]||(kind==="bow"?profiles.archer:profiles.sentry)}
  function attackProfile(actor){return profile(actor.fieldAttack||actor.id,actor.kind)}
  function melee(actor,dt,target,move,reach,action){
    const dx=target?target.x-actor.x:Infinity,y=base(actor);
    actor.swingTime=(actor.swingTime||0)-dt;
    if(actor.swing==="tell"){
      if(actor.swingTime<=0){
        actor.swing="cut";actor.swingTime=move.active;actor.cutHit=!target;
        actor.swingSkill=action.peek();actor.firstCut=true;
        if(target&&!CombatSkills.definitions[actor.swingSkill].style){
          actor.cutHit=action.cast(actor.swingSkill,actor.swingDir,{},true)!==false;
        }
        action.onSwing?.(actor.swingDir);
      }
    }else if(actor.swing==="cut"){
      if(target&&!actor.cutHit){
        const id=actor.swingSkill||action.peek(),skill=CombatSkills.definitions[id];
        const args=skill.style?{radius:id===move.skill?reach:skill.radius,silent:id===move.skill||!actor.firstCut}:{};
        const result=action.cast(id,actor.swingDir,args,actor.firstCut!==false);
        actor.cutHit=skill.style?result:result!==false;
        if(result!==false)actor.firstCut=false;
      }
      if(actor.swingTime<=0){
        actor.swing="recover";actor.swingTime=EchoModifiers.cadence(action.build,actor.swingSkill,move.recover/(actor.aggression??1));
      }
    }else{
      if(target)action.approach?.(.38,dx);
      if(actor.swingTime<=0&&Math.abs(dx)<reach&&base(target)<y+1&&base(target)+.55>y){
        actor.swing="tell";actor.swingDir=Math.sign(dx)||1;
        actor.swingTime=EchoModifiers.jumpDelay(action.build,action.peek(),move.windup);
      }
    }
  }
  // The action owns lock, contact window and recovery. The caster owns its skill rotation and damage.
  function attack(actor,dt,target,action){
    const move=attackProfile(actor),dx=target?target.x-actor.x:Infinity;
    if(!move.draw){
      melee(actor,dt,target,move,action.compact?move.reach:move.fullReach??move.reach,action);
      return;
    }
    if(target)action.approach?.(4,dx);
    actor.aim??=move.draw;
    draw(actor,dt,dx,base(actor),action.compact&&!move.fixedPort,action.range??move.reach,move,action.build,port=>{
      const id=action.peek(),args={launchX:port.x,launchY:port.y};
      const fired=action.cast(id,port.dir,args,true);
      if(fired!==false){
        actor.releasedSkill=id;
        action.onRelease?.(id,port.dir,args);
      }
      return fired;
    });
  }
  function defaultSkill(actor,move,build,bow=actor.kind==="bow"){
    if(!actor.fieldAttack&&bow)return actor.rangedEffect||(build?.shotPeriod?"shot":move.skill);
    return move.skill;
  }
  function configuredAttack(actor,dt,target,action){
    const move=attackProfile(actor),fallback=defaultSkill(actor,move,action.build);
    attack(actor,dt,target,{
      ...action,
      peek:()=>actor.rotation?.length?action.skills().peek(actor.rotation):fallback,
      cast:(id,dir,args,advance)=>{
        // A later live frame retries the locked skill without consuming the next slot.
        const fixed=advance&&actor.rotation?.length?undefined:id;
        return action.skills().castConfigured(actor,action.targets(),action.hooks(dir,fixed),{target,dir,...args},fixed);
      }
    });
  }
  function draw(actor,dt,dx,base,compact,activeRange,config,build,release){
    actor.release=Math.max(0,(actor.release||0)-dt);
    if(Math.abs(dx)>activeRange){
      actor.aim=Math.max(config.draw,actor.aim-dt);actor.aimDir=0;return;
    }
    actor.aim-=dt;
    if(actor.aim<=config.draw&&!actor.aimDir)actor.aimDir=Math.sign(dx)||-1;
    if(actor.aim>0)return;
    const dir=actor.aimDir;
    const x=actor.x+dir*(compact?0:config.portX),y=base+(compact?.42:config.portY);
    if(release({x,y,dir})===false)return;
    actor.shotDir=dir;actor.aimDir=0;actor.release=.22;const recovery=(config.cooldown-config.draw)/(actor.aggression??1);
    actor.aim=config.draw+(build?EchoModifiers.cadence(build,actor.releasedSkill,recovery):recovery);
  }
  function ranged(actor,dt,dx,base,compact,activeRange,shots,onRelease,canShoot){
    const config=profile(actor.fieldAttack||actor.id,"bow");
    draw(actor,dt,dx,base,compact,activeRange,config,actor.echoBuild,onRelease||(port=>{
      if(!CombatSkills.canLaunch(shots,canShoot))return false;
      CombatSkills.launch(shots,defaultSkill(actor,config,actor.echoBuild,true),{...port,power:actor.skillPower??actor.rangedPower??1,source:actor,hostile:true});
    }));
  }
  function mechanisms(specs,offset=0){
    return (specs||[]).map(a=>({id:"watcher",kind:"device",name:"警戒机关",x:a.x+offset,baseY:a.y,aim:profiles.watcher.firstAim,hp:1,max:1,
      skillPower:a.skillPower,rotation:a.attackSkill?[a.attackSkill]:[]}));
  }
  function posture(e,time){
    const config=attackProfile(e),age=time-(e.hitAt??-Infinity);
    if(e.kind==="bow")return e.release>0?3:e.aimDir?2:Math.abs(e.vx||0)>.02?Math.floor(time*5)%2:0;
    if(age>=0&&age<.21)return 20+Math.min(3,Math.floor(age/.21*4));
    const hit=profile(e.id,e.kind).contact;
    if(e.swing==="tell")return 8+Math.floor(clamp(1-e.swingTime/config.windup)*(hit-9));
    if(e.swing==="cut")return hit+Math.floor(clamp(1-e.swingTime/config.active)*2);
    if(e.swing==="recover"&&e.swingTime>0)return hit+2+Math.floor(clamp(1-e.swingTime*(e.aggression??1)/config.recover)*(19-hit-2));
    if(e.id!=="trial_guard"&&Math.abs(e.vx||0)>.02)return 24+Math.floor((e.walkDistance||0)*8/(e.id==="shade"?.88:.65))%8;
    return Math.floor(time*4+(e.poseOffset||0))%8;
  }
  function direction(e,facing){
    if(e.release>0)return e.shotDir<0;
    if(e.aimDir)return e.aimDir<0;
    if(e.swing==="tell"||e.swing==="cut"||e.swing==="recover"&&e.swingTime>0)return e.swingDir<0;
    return facing;
  }
  const clamp=t=>Math.max(0,Math.min(1,t)),nativeHeight={sentry:94,forgeguard:94,trial_guard:93,shade:88,watcher:92};
  return {profiles,profile,attackProfile,attack,configuredAttack,ranged,mechanisms,posture,direction,nativeHeight,pixelsPerMetre,lift,base};
})();
