// Every cast receives the caster's position, opponents and the room's damage/FX callbacks.
globalThis.StrikeSkills=(()=>{
  const {base,pixelsPerMetre}=FieldCombat;
  function bodyDistance(e,x,y){
    if(!e.guard)return Math.hypot(e.x-x,base(e)+.45-y);
    const dx=Math.max(0,Math.abs(e.x-x)-.68*e.guard.size);
    const feet=base(e),dy=Math.max(0,feet-y,y-feet-e.guard.height/pixelsPerMetre);
    return Math.hypot(dx,dy);
  }
  function wave(c){
    const {x,y,targets,power}=c;
    const m=c.id==="wave"?c.mods||{}:{};
    const third=m.wave_third&&++c.state.waveCount%3===0;
    const radius=c.radius*(1+((third?m.wave_third:0)+(c.state?.shield?m.wave_shelter||0:0))/100);
    c.fx("wave",x,y,"",c.color||"#ffcf76",radius);
    let hits=0,damaged=0;
    for(const e of targets){
      if(e===c.exclude||e.hp<=0)continue;
      const dy=c.flat?0:base(e)-y;
      if(c.maxHeight!==undefined && base(e)-y>=c.maxHeight)continue;
      const distance=Math.hypot(e.x-x,dy);
      if(distance>radius)continue;
      if(c.strictRadius&&Math.abs(e.x-x)>=radius)continue;
      const hp=e.hp;
      let bonus=c.weight>=10?m.wave_heavy||0:0;
      if(distance<=radius/2)bonus+=m.wave_inner||0;
      if(distance>=radius*2/3)bonus+=m.wave_rim||0;
      if(hp<(e.max??e.maxHp)/2)bonus+=m.wave_wound||0;
      c.hit(e,power*(1+bonus/100),"wave",undefined,hits++);
      if(e.hp<hp)damaged++;
    }
    if(damaged>=2&&m.wave_refund)c.recover(m.wave_refund);
    return hits;
  }
  function slash(c){
    const m=c.mods||{},round=++c.state.slashCount;
    const radius=c.radius*(1+((c.airborne?m.slash_air||0:0)+(round%3===0?m.slash_third||0:0))/100);
    c.state.flash=.23;c.state.slashDir=c.dir;c.state.slashRadius=radius;
    const within=[];
    for(const e of c.targets){
      const distance=e.guard?bodyDistance(e,c.x,c.y+.45):Math.hypot(e.x-c.x,c.y-base(e)-.12);
      if(e.hp>0&&distance<radius)within.push(e);
    }
    const previous=c.state.lastSlashHits;
    const struck=m.slash_repeat?new Set():null;
    let damaged=false;
    const group=within.length===1?m.slash_solo||0:Math.min(3,within.length-1)*(m.slash_crowd||0);
    for(const e of within){
      const hp=e.hp;if(hp<=0)continue;
      let bonus=group+(c.state.shield?m.slash_guard||0:0);
      if((e.x-c.x)*c.dir<0)bonus+=m.slash_rear||0;
      if(previous?.has(e))bonus+=m.slash_repeat||0;
      c.hit(e,c.power*(1+bonus/100),"slash",e.guard?{x:c.x,y:c.y+.45,dir:c.dir}:undefined);
      if(e.hp>=hp)continue;
      damaged=true;struck?.add(e);
      if(e.hp<=0&&!e.skillShade&&m.slash_mend)c.recover(0,m.slash_mend);
    }
    c.state.lastSlashHits=struck;
    if(damaged&&m.slash_breath)c.recover(m.slash_breath);
    if(round%4===0&&m.slash_blade)blade({...c,power:c.power*m.slash_blade/100,radius:.3});
  }
  function chain(c){
    let from=c.target;
    if(!from)return;
    const struck=new Set([from]);
    function arc(x,y,toX,toY,hop){
      const effect=c.fx("petalArc",x,y);
      if(effect)Object.assign(effect,{endX:toX,endY:toY,life:.32,hop});
    }
    for(let hop=0;hop<4;hop++){
      let next=null,nearest=Infinity;
      for(const enemy of c.targets){
        if(enemy.hp<=0||struck.has(enemy))continue;
        const d=Math.hypot(enemy.x-from.x,base(enemy)-base(from));
        if(d<=c.radius&&d<nearest){next=enemy;nearest=d}
      }
      if(!next){
        if(!hop)for(const dir of [-1,1]){
          if(from.hp<=0)break;
          arc(from.x-dir*.65,base(from)+1,from.x+dir*.65,base(from),dir===1?1:0);
          c.hit(from,Math.max(1,Math.round(c.power*.6)),"slash");
        }
        break;
      }
      arc(from.x,base(from)+.45,next.x,base(next)+.45,hop);
      c.hit(next,c.power,"slash");struck.add(next);from=next;
    }
  }
  function burn(c){
    const e=c.target;
    if(!e||e.hp<=0)return;
    const m=c.mods||{},active=c.state.burns.get(e),rates=c.chances||[1,.8,.55,.35,.15];
    const cap=rates.length+Math.floor(m.burn_cap||0);
    const accuracy=(c.accuracy||0)+(e.hp<(e.max??e.maxHp)/2?(m.burn_hunt||0)/100:0);
    if(!active && Math.random()>=Math.min(1,rates[0]+accuracy))return;
    const status=active||{stacks:Math.min(cap,1+Math.floor(m.burn_kindle||0)),tick:Math.max(.01,.5*(1-(m.burn_quick||0)/100))};
    if(active&&status.stacks<cap&&Math.random()<Math.min(1,rates[Math.min(status.stacks,rates.length-1)]+accuracy)){
      status.stacks++;
      if(m.burn_breath)c.recover(m.burn_breath);
    }
    status.left=c.duration+(active?m.burn_fuel||0:0);status.power=c.power;status.mods=m;
    c.state.burns.set(e,status);
    e.burnLeft=status.left;e.burnStacks=status.stacks;
    c.fx("clip",e.x,base(e)+.22,"burn","",1.05);
    if(active&&m.burn_flash)c.hit(e,c.power*status.stacks*m.burn_flash/100,"burn");
  }
  function tickBurns(state,dt,h){
    for(const [e,s] of state.burns){
      if(e.hp<=0){state.burns.delete(e);continue}
      s.left=Math.max(0,s.left-dt);s.tick-=dt;
      if(s.tick<=1e-7){
        s.tick+=.5;
        const m=s.mods||{};
        let bonus=(s.stacks>=3?m.burn_high||0:0)+(s.left<=1+1e-7?m.burn_last||0:0);
        if(m.burn_pack){
          let others=0;
          for(const target of state.burns.keys())if(target!==e&&target.hp>0&&++others===3)break;
          bonus+=others*m.burn_pack;
        }
        h.hit(e,s.power*.5*s.stacks*(1+bonus/100),"burn");
      }
      e.burnLeft=s.left;e.burnStacks=s.stacks;
      if(!s.left)state.burns.delete(e);
    }
  }
  function shield(c){
    const s=c.state;
    if(s.shieldWait>0 || (c.keepShield&&s.shield))return;
    s.shield=1;s.shieldWait=c.cooldown??4;
    s.counterPower=c.id==="shatter_shield"?c.power:undefined;
    c.fx("num",c.x,c.y+1,"护盾","#caaf70");
  }
  function blade(c){
    if(c.state.blades.length<2)c.state.blades.push({x:c.x,y:c.y+.45,dir:c.dir,age:0,returning:false,hits:new Set(),radius:c.radius,power:c.power});
  }
  function tickBlades(state,dt,targets,h,width){
    for(let i=state.blades.length-1;i>=0;i--){
      const b=state.blades[i];b.age+=dt;
      if(b.age>=1.2){state.blades.splice(i,1);continue}
      if(!b.returning&&(b.age>=.6||b.x>=width-.4||b.x<=.4)){
        b.returning=true;b.dir*=-1;b.hits.clear();
      }
      b.x+=b.dir*7*dt;
      for(const e of targets)if(e.hp>0&&!b.hits.has(e)&&bodyDistance(e,b.x,b.y)<=b.radius+.18){
        b.hits.add(e);h.hit(e,b.power,"blade",b);
      }
    }
  }
  function eruption(c){
    c.state.vents.push({x:c.target?.x??c.x,y:c.target?base(c.target):c.y,power:c.power,radius:c.radius,left:3,wait:0});
  }
  function tickVents(state,dt,targets,h){
    for(let i=state.vents.length-1;i>=0;i--){
      const v=state.vents[i];v.wait-=dt;
      if(v.wait>1e-7)continue;
      h.fx("clip",v.x,v.y,"burn","",4.4);h.fx("wave",v.x,v.y,"","#ff9253",v.radius);
      for(const e of targets)if(e.hp>0&&Math.hypot(e.x-v.x,base(e)-v.y)<=v.radius)h.hit(e,v.power,"burn");
      v.wait+=.25;if(--v.left===0)state.vents.splice(i,1);
    }
  }
  function melee(c){
    const e=c.target;
    if(!e||e.hp<=0)return;
    const ahead=(e.x-c.x)*c.dir;
    if(ahead>=-.14&&ahead<=c.radius&&base(e)<c.y+.50&&base(e)+.55>c.y){
      c.hit(e,c.power,c.style||"slash",{dir:c.dir});return true;
    }
  }
  return {base,wave,slash,chain,burn,tickBurns,shield,blade,tickBlades,eruption,tickVents,melee};
})();
