// Room coordinates are in metres. A cast snapshots its power, facing and allegiance.
globalThis.ProjectileEffects = (() => {
  const definitions = Object.freeze({
    arrow: Object.freeze({name:"普通箭",attack:"箭矢",speed:4.4,ink:"arrow"}),
    pulse: Object.freeze({name:"警戒脉冲",speed:5.6,ink:"pulse"}),
    shot: Object.freeze({name:"水箭", power:14, speed:7.5, life:1.5, radius:.34, flightClip:"waterArrow", impactClip:"waterHit"})
  });

  function cast(id, {source, hostile, x, y, dir, power, radius}) {
    const effect=definitions[id];
    if(effect.ink)return {id,x,y,dir,power,source:source.name,hostile,speed:effect.speed,
      attack:effect.attack??effect.name,ink:effect.ink,age:0};
    return {id, effect, source, hostile, x, y, dir, power, radius:radius ?? effect.radius, age:0, life:effect.life};
  }

  // Sweep the complete step. A nearer opponent can intercept a shot before a wall,
  // and the wall wins ties with a body that starts on its surface.
  function advance(shot,dt,width,world,fx){
    const {x,y,dir,effect}=shot;
    if(shot.used||y<0){shot.used=true;return null}
    const elapsed=effect?Math.min(dt,shot.life):dt;
    const endX=Math.max(0,Math.min(width,x+dir*(shot.speed??effect?.speed)*elapsed));
    let distance=Math.abs(endX-x),target=null,impacted=false;
    function consider(left,right,body){
      if(body&&shot.pierced?.has(body))return;
      if(dir>0?right<x:left>x)return;
      const ahead=Math.max(0,dir>0?left-x:x-right);
      if(ahead>distance||impacted&&ahead===distance)return;
      impacted=true;distance=ahead;target=body;
    }
    for(const wall of world.solids||[]){
      if((wall.art==="rock"||wall.art==="plinth")&&y<=wall.y)consider(wall.left,wall.right,null);
    }
    if(shot.hostile){
      function check(body,halfWidth,height){
        if(!body||body.hp<=0)return;
        const feet=FieldCombat.base(body);
        if(effect){
          if(y<feet-shot.radius||y>feet+height+shot.radius)return;
          halfWidth+=shot.radius;
        }else if(y<=feet||y>=feet+height)return;
        consider(body.x-halfWidth,body.x+halfWidth,body);
      }
      for(const shade of world.shades||[])check(shade,effect ? .18 : .28,.8);
      check(world.player,effect ? .16 : .25,world.playerHeight??.8);
    }else{
      for(const e of world.enemies){
        if(e.hp<=0)continue;
        const feet=FieldCombat.base(e);
        let halfWidth;
        if(!effect){
          const height=e.guard?e.guard.height/FieldCombat.pixelsPerMetre:e.headHeight??.8;
          if(y<feet||y>feet+height)continue;
          halfWidth=e.guard?.size??.25;
        }else if(e.guard){
          const dy=Math.max(0,feet-y,y-feet-e.guard.height/FieldCombat.pixelsPerMetre);
          if(dy>=shot.radius)continue;
          halfWidth=.68*e.guard.size+Math.sqrt(shot.radius*shot.radius-dy*dy);
        }else{
          if(Math.abs(feet+.45-y)>=.32+shot.radius)continue;
          halfWidth=.18+shot.radius;
        }
        consider(e.x-halfWidth,e.x+halfWidth,e);
      }
    }
    shot.x=x+dir*distance;shot.age+=elapsed;
    if(effect)shot.life-=elapsed;
    shot.used=impacted||shot.life<=0||endX<=0||endX>=width;
    if(impacted){
      const spark=effect?fx("clip",shot.x,y,effect.impactClip,"",40/FieldCombat.pixelsPerMetre)
        :fx("projectileHit",shot.x,y,shot.ink,"",1);
      if(spark)Object.assign(spark,{hostile:shot.hostile,dir});
    }
    if(target&&shot.piercesLeft>0&&shot.life>0){
      shot.pierced??=new Set();shot.pierced.add(target);shot.piercesLeft--;shot.used=false;
    }
    return target;
  }
  return {definitions,cast,advance,advanceField:advance};
})();
