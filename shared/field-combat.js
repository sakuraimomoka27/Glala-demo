// Local space is metres, measured from the supporting surface. The animation
// renderer and the damage check read the same commitment and reach.
globalThis.FieldCombat=(()=>{
  const profiles={
    sentry:{height:1.65,head:1.60,windup:.43,active:.16,recover:.80,reach:.92,fullReach:1.37,attack:"横斩",ink:"steel",contact:13},
    forgeguard:{height:1.67,head:1.60,windup:.62,active:.20,recover:.94,reach:1.04,fullReach:1.67,attack:"重剑横斩",ink:"steel",contact:14},
    trial_guard:{height:1.65,head:1.60,windup:.50,active:.18,recover:.84,reach:.92,attack:"碎岩横击",ink:"stone",contact:12},
    shade:{height:1.02,head:.90,windup:.31,active:.14,recover:.65,reach:.86,attack:"前爪突袭",ink:"claw",contact:13},
    archer:{height:1.65,head:1.54,draw:.55,cooldown:3.4,reach:8,portX:.52,portY:1.01,speed:4.4,attack:"箭矢",ink:"arrow"},
    watcher:{height:1.26,draw:.85,cooldown:3.0,reach:6.7,portX:.15,portY:.505,speed:5.6,attack:"警戒脉冲",ink:"pulse"}
  };
  function profile(id,kind){return profiles[id]||(kind==="bow"?profiles.archer:profiles.sentry)}
  function ranged(actor,dt,dx,base,compact,activeRange,shots){
    const config=profile(actor.id,"bow");
    actor.release=Math.max(0,(actor.release||0)-dt);
    if(Math.abs(dx)>activeRange){
      actor.aim=Math.max(config.draw,actor.aim-dt);actor.aimDir=0;return;
    }
    actor.aim-=dt;
    if(actor.aim<=config.draw&&!actor.aimDir)actor.aimDir=Math.sign(dx)||-1;
    if(actor.aim>0||shots.length>=64)return;
    const dir=actor.aimDir;
    shots.push({x:actor.x+dir*(compact?0:config.portX),y:base+(compact?.42:config.portY),dir,
      speed:config.speed,source:actor.name,attack:config.attack,ink:config.ink,age:0});
    actor.shotDir=dir;actor.aimDir=0;actor.release=.22;actor.aim=config.draw+(config.cooldown-config.draw)/(actor.aggression??1);
  }
  function mechanisms(specs,offset=0){
    return (specs||[]).map(a=>({id:"watcher",name:"警戒机关",x:a.x+offset,baseY:a.y,aim:1.25}));
  }
  function posture(e,time){
    const config=profile(e.id,e.kind),age=time-(e.hitAt??-Infinity);
    if(e.kind==="bow")return e.release>0?3:e.aimDir?2:Math.abs(e.vx||0)>.02?Math.floor(time*5)%2:0;
    if(age>=0&&age<.21)return 20+Math.min(3,Math.floor(age/.21*4));
    const hit=config.contact;
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
  return {profiles,profile,ranged,mechanisms,posture,direction,nativeHeight};
})();
