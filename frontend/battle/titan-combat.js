// Room-local effects. Only the room's hit() awards kills and rolls loot.
globalThis.TitanCombat=(()=>{
  const limit=(x,a,b)=>Math.max(a,Math.min(b,x));
  function bodyDistance(e,x,y){
    const dx=Math.max(0,Math.abs(e.x-x)-.68*e.guard.size);
    const dy=Math.max(0,e.guard.lift-y,y-GuardianCombat.height(e,SCALE));
    return Math.hypot(dx,dy);
  }
  function create(b,roomWidth=20){
    const shadeRight=roomWidth-.7;
    const stars=b.stars||{};
    let shotClock=b.shotPeriod||0,burstLeft=0,burstWait=0,burstDir=1,stomps=0;
    const vents=[];
    const state={bolts:[],blades:[],shades:[],shadeHits:0,shield:0,shieldWait:0,period:b.slashPeriod||0,flash:0};
    const fx=(h,...args)=>h.fx(...args);
    function jump(p,h){
      if(b.bladeDamage && state.blades.length<2){
        state.blades.push({x:p.x,y:p.y+.45,dir:p.dir,age:0,returning:false,hits:new Set()});
      }
      if(!b.shadowLife)return;
      const twins=stars.shade>=6;
      for(const flank of twins?[-1,1]:[0]){
        if(state.shades.length>=(twins?4:2))state.shades.shift();
        const x=limit(p.x+flank*.5,.55,shadeRight);
        state.shades.push({x,y:p.y,base:p.y,hp:b.shadowHp,life:b.shadowLife,phase:0,grace:.25,face:p.dir,flank,target:null,mode:"wait",seek:flank===1?.08:0,jumps:0});
        fx(h,"clip",x,p.y,"shadeAura","",1.35);
      }
    }
    function ignite(e,h){
      if(b.kind!=="burn"||!e?.hp)return;
      const burning=e.burnLeft>0;
      const stacks=burning?e.burnStacks:0,rates=b.burnChances;
      if(!burning && Math.random()>=Math.min(1,rates[0]+b.ailmentHit))return;
      e.burnStacks=!burning?1:stacks<rates.length&&Math.random()<Math.min(1,rates[stacks]+b.ailmentHit)?stacks+1:stacks;
      e.burnLeft=b.burnTime;
      if(!burning)e.burnTick=.5;
      fx(h,"clip",e.x,(e.baseY||0)+.22,"burn","",1.05);
    }
    function shield(p,h){
      if((b.kind!=="earth"&&!(stars.stone>=6))||state.shieldWait>0||(stars.stone>=6&&state.shield))return;
      state.shield=1;state.shieldWait=b.shieldPeriod;fx(h,"num",p.x,p.y+1,"护盾","#caaf70");
    }
    function absorb(){if(!state.shield)return false;state.shield=0;return true}
    function decoy(e,p){
      let best=null,dist=Math.abs(e.x-p.x);for(const s of state.shades){
        const d=Math.abs(e.x-s.x);if(s.hp>0&&d<dist&&d<3.2){dist=d;best=s}
      }return best;
    }
    function hurtShade(s){if(s.hp>0 && s.grace<=0){s.hp--;s.grace=.55}}
    function stomp(target,damage,enemies,h){
      if(stars.ember>=6 && ++stomps===3){
        stomps=0;vents.push({x:target.x,y:target.baseY||0,damage,left:3,wait:0});
      }
      if(!(stars.light>=6))return;
      let from=target;
      const struck=new Set([target]);
      for(let hop=0;hop<4;hop++){
        let next=null,nearest=Infinity;
        for(const enemy of enemies){
          if(enemy.hp<=0||struck.has(enemy))continue;
          const distance=Math.hypot(enemy.x-from.x,(enemy.baseY||0)-(from.baseY||0));
          if(distance<=3 && distance<nearest){next=enemy;nearest=distance}
        }
        if(!next){
          if(hop===0 && target.hp>0){
            for(const direction of [-1,1]){
              const arc=h.fx("petalArc",target.x-direction*.65,(target.baseY||0)+1);
              if(arc)Object.assign(arc,{endX:target.x+direction*.65,endY:target.baseY||0,life:.32,hop:direction===1?1:0});
              if(target.hp>0)h.hit(target,Math.max(1,Math.round(damage*.6)),"slash");
            }
          }
          break;
        }
        const arc=h.fx("petalArc",from.x,(from.baseY||0)+.45);
        if(arc)Object.assign(arc,{endX:next.x,endY:(next.baseY||0)+.45,life:.32,hop});
        h.hit(next,damage,"slash");
        struck.add(next);from=next;
      }
    }
    function tick(dt,p,enemies,h){
      for(let i=vents.length-1;i>=0;i--){
        const vent=vents[i];vent.wait-=dt;
        if(vent.wait>1e-7)continue;
        fx(h,"clip",vent.x,vent.y,"burn","",4.4);
        fx(h,"wave",vent.x,vent.y,"","#ff9253",2.8);
        for(const enemy of enemies)if(enemy.hp>0 && Math.hypot(enemy.x-vent.x,(enemy.baseY||0)-vent.y)<=2.8)
          h.hit(enemy,vent.damage,"burn");
        vent.wait+=.25;
        if(--vent.left===0)vents.splice(i,1);
      }
      for(let i=state.blades.length-1;i>=0;i--){
        const blade=state.blades[i];blade.age+=dt;
        if(blade.age>=1.2){state.blades.splice(i,1);continue}
        if(!blade.returning&&(blade.age>=.6||blade.x>=roomWidth-.4||blade.x<=.4)){
          blade.returning=true;blade.dir*=-1;blade.hits.clear();
        }
        blade.x+=blade.dir*7*dt;
        for(const enemy of enemies){
          if(enemy.hp<=0||blade.hits.has(enemy)||(enemy.guard?bodyDistance(enemy,blade.x,blade.y):Math.hypot(enemy.x-blade.x,(enemy.baseY||0)+.45-blade.y))>b.bladeSize+.18)continue;
          blade.hits.add(enemy);h.hit(enemy,b.bladeDamage,"blade",blade);
        }
      }
      state.shieldWait=Math.max(0,state.shieldWait-dt);state.flash=Math.max(0,state.flash-dt);
      if(b.kind==="burn")for(const e of enemies){if(!e.hp||!e.burnLeft)continue;e.burnLeft=Math.max(0,e.burnLeft-dt);e.burnTick-=dt;
        if(e.burnTick<=1e-7){e.burnTick+=.5;h.hit(e,b.burnDamage*.5*e.burnStacks,"burn")}}
      if(b.kind==="slash"){
        state.period-=dt;
        if(state.period<=0){
          state.period+=b.slashPeriod;state.flash=.23;state.slashDir=p.dir;
          for(const e of enemies)if(e.hp&&(e.guard?bodyDistance(e,p.x,p.y+.45):Math.hypot(e.x-p.x,p.y-(e.baseY||0)-.12))<b.slashRadius)
            h.hit(e,b.slashDamage,"slash",e.guard?{x:p.x,y:p.y+.45,dir:p.dir}:undefined);
        }
      }
      if(b.shotPeriod){
        shotClock-=dt;burstWait-=dt;
        if(shotClock<=1e-7){
          shotClock+=b.shotPeriod;burstLeft=stars.tide>=6?3:1;burstWait=0;burstDir=p.dir;
        }
        if(burstLeft && burstWait<=1e-7){
          state.bolts.push({x:p.x,y:p.y+.46,dir:burstDir,vy:0,life:1.5});
          burstLeft--;burstWait+=.10;
        }
        for(let i=state.bolts.length-1;i>=0;i--){
          const m=state.bolts[i];m.life-=dt;m.x+=dt*7.5*m.dir;m.y+=dt*m.vy;
          const hit=enemies.find(e=>e.hp&&(e.guard?bodyDistance(e,m.x,m.y)<b.shotSize:Math.abs(e.x-m.x)<b.shotSize+.18&&Math.abs((e.baseY||0)+.45-m.y)<b.shotSize+.32));
          if(hit)h.hit(hit,b.shotDamage,"shot",m);
          if(hit||m.life<=0||m.x<0||m.x>roomWidth||m.y<0)state.bolts.splice(i,1);
        }
      }
      if(b.shadowLife)for(let i=state.shades.length-1;i>=0;i--){
        const s=state.shades[i];s.life-=dt;s.grace=Math.max(0,s.grace-dt);
        if(s.life<=0||s.hp<=0){state.shades.splice(i,1);continue}
        updateShade(s,dt,enemies,h);
      }
    }
    // Search at decision points rather than every physics tick.
    function updateShade(s,dt,enemies,h){
      s.seek-=dt;
      const safe=e=>e?.hp>0 && !(e.kind==="bell" && (e.phase==="warning"||e.phase==="attack"));
      if(s.mode==="hop"){
        s.phase=Math.min(1,s.phase+dt/b.shadowPeriod);
        if(!safe(s.target))s.target=null;
        if(s.target && s.endY===0){const predicted=s.target.x+limit(s.target.vx||0,-4,4)*b.shadowPeriod*(1-s.phase)-(s.flank||s.face)*s.offset;
          const nx=limit(s.dest+limit(predicted-s.dest,-dt*2.5,dt*2.5),Math.max(.55,s.start-3.6),Math.min(shadeRight,s.start+3.6));
          if(!(h.platforms||[]).some(v=>v.y>.84&&v.left<=nx&&v.right>=nx))s.dest=nx;}
        s.x=s.start+(s.dest-s.start)*s.phase;
        s.y=s.startY+(s.endY-s.startY)*s.phase+4*s.phase*(1-s.phase)*1.05;
        if(s.phase<1)return;
        s.base=s.y=s.endY;s.mode="wait";s.seek=0;
        if(safe(s.target)&&Math.abs(s.base-(s.target.baseY||0))<.85 && Math.abs(s.target.x-s.x)<=b.shadowRadius){
          h.hit(s.target,b.shadowDamage,"shadow");state.shadeHits++;s.grace=.28;
        }
        s.cooldown=.12;return;
      }
      s.cooldown=Math.max(0,(s.cooldown||0)-dt);if(s.cooldown>0 || s.seek>0)return;
      s.seek=.22;let target=null,best=Infinity;
      const danger=enemies.find(e=>e.hp&&e.kind==="bell"&&e.phase==="warning");
      for(const e of enemies){if(!safe(e)||danger && Math.abs(e.x-danger.x)<3)continue;
        // A shadow cannot strike through a platform. Only approach prey reachable from an edge.
        if(h.platforms?.length){
          const predicted=e.x+limit(e.vx||0,-4,4)*b.shadowPeriod;
          if(h.platforms.some(v=>v.y>(e.baseY||0)+.84 && predicted>=v.left && predicted<=v.right &&
            Math.min(predicted-v.left,v.right-predicted)+.12>b.shadowRadius))continue;
        }
        const cost=Math.abs(e.x-s.x)+(s.hp<=1&&e.kind==="bell"?3:0);
        if(cost<best){best=cost;target=e}}
      if(!target){s.target=null;return}
      s.target=target;s.face=target.x>=s.x?1:-1;
      // Aim for the outer lip of the head, rather than run through the enemy's feet.
      const offset=s.hp<=1?Math.min(.64,b.shadowRadius*.75):Math.min(.36,b.shadowRadius*.42);
      s.offset=offset;const predicted=target.x+limit(target.vx||0,-4,4)*b.shadowPeriod;
      s.dest=limit(s.x+limit(predicted-(s.flank||s.face)*offset-s.x,-3.6,3.6),.55,shadeRight);
      s.endY=0;for(const p of h.platforms||[])if(p.left<=s.dest && p.right>=s.dest && p.y<=s.base+1)s.endY=Math.max(s.endY,p.y);
      // When elevated terrain would obstruct the attack, land just outside its edge.
      if(s.endY>(target.baseY||0)+.84&&Math.abs(s.dest-target.x)<=b.shadowRadius){
        const platform=(h.platforms||[]).find(v=>v.y===s.endY&&s.dest>=v.left&&s.dest<=v.right);
        if(platform){const edges=[platform.left-.12,platform.right+.12].filter(x=>x>=.55&&x<=shadeRight);
          const edge=edges.sort((a,z)=>Math.abs(a-target.x)-Math.abs(z-target.x))[0];
          if(edge!==undefined && Math.abs(edge-s.x)<=3.6){s.dest=edge;s.endY=0}}
      }
      s.start=s.x;s.startY=s.y;s.phase=0;s.mode="hop";s.jumps++;
    }
    function clearProjectilesAndSummons(){
      state.bolts.length=state.blades.length=state.shades.length=vents.length=0;
      burstLeft=0;
    }
    return {state,tick,ignite,jump,stomp,shield,absorb,decoy,hurtShade,clearProjectilesAndSummons};
  }
  return {create};
})();
