globalThis.ShadowSkill=(()=>{
  const limit=(x,a,b)=>Math.max(a,Math.min(b,x));
  const base=e=>e.y??e.baseY??0;
  function cast(state,p,settings,width,h,twins){
    const m=settings.mods||{};
    settings={...settings,shadowRadius:settings.shadowRadius*(1+(m.shadow_reach||0)/100)};
    for(const flank of twins?[-1,1]:[0]){
      if(state.shades.length>=(twins?4:2)+Math.floor(m.shadow_cap||0))state.shades.shift().hp=0;
      const x=limit(p.x+flank*.5,.55,width-.7),y=base(p);
      state.shades.push({x,y,base:y,skillShade:true,hp:settings.shadowHp,life:settings.shadowLife,settings,phase:0,grace:.25+(m.shadow_veil||0),face:p.dir,flank,target:null,mode:"wait",seek:flank===1?.08:0,jumps:0,landedHits:0});
      h.fx("clip",x,y,"shadeAura","",1.35);
    }
  }
  function tick(state,dt,enemies,h,width){
    for(let i=state.shades.length-1;i>=0;i--){
      const s=state.shades[i];s.life-=dt;s.grace=Math.max(0,s.grace-dt);
      if(s.life<=0||s.hp<=0){
        const burst=s.hp>0&&s.settings.mods?.shadow_burst;
        s.hp=0;state.shades.splice(i,1);
        if(burst){
          h.fx("wave",s.x,s.y,"","#bb96de",1.4);
          for(const e of enemies)if(e.hp>0&&Math.hypot(e.x-s.x,base(e)-s.y)<=1.4)
            h.hit(e,s.settings.shadowDamage*burst/100,"shadow");
        }
        continue;
      }
      update(s,dt,enemies,h,s.settings,width,state);
    }
  }
  // Search at decision points rather than every physics tick.
  function update(s,dt,enemies,h,b,roomWidth,state){
    const m=b.mods||{},stride=3.6*(1+(m.shadow_stride||0)/100);
    s.seek-=dt;
    const safe=e=>e?.hp>0 && !(e.kind==="bell" && (e.phase==="warning"||e.phase==="attack"));
    if(s.mode==="hop"){
      s.phase=Math.min(1,s.phase+dt/b.shadowPeriod);
      if(!safe(s.target))s.target=null;
      if(s.target && s.endY===0){const predicted=s.target.x+limit(s.target.vx||0,-4,4)*b.shadowPeriod*(1-s.phase)-(s.flank||s.face)*s.offset;
        const nx=limit(s.dest+limit(predicted-s.dest,-dt*2.5,dt*2.5),Math.max(.55,s.start-stride),Math.min(roomWidth-.7,s.start+stride));
        if(!(h.platforms||[]).some(v=>v.y>.84&&v.left<=nx&&v.right>=nx))s.dest=nx;}
      s.x=s.start+(s.dest-s.start)*s.phase;
      s.y=s.startY+(s.endY-s.startY)*s.phase+4*s.phase*(1-s.phase)*1.05;
      if(s.phase<1)return;
      s.base=s.y=s.endY;s.mode="wait";s.seek=0;
      if(safe(s.target)&&Math.abs(s.base-base(s.target))<.85 && Math.abs(s.target.x-s.x)<=b.shadowRadius){
        const target=s.target,hp=target.hp;
        const bonus=(s.hp<=1?m.shadow_wound||0:0)+((s.landedHits+1)%3===0?m.shadow_third||0:0);
        h.hit(target,b.shadowDamage*(1+bonus/100),"shadow");state.shadeHits++;
        if(target.hp<hp&&++s.landedHits===1)s.life+=m.shadow_life||0;
        s.grace=m.shadow_veil?Math.max(.28,s.grace):.28;
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
        if(h.platforms.some(v=>v.y>base(e)+.84 && predicted>=v.left && predicted<=v.right &&
          Math.min(predicted-v.left,v.right-predicted)+.12>b.shadowRadius))continue;
      }
      const cost=Math.abs(e.x-s.x)+(s.hp<=1&&e.kind==="bell"?3:0);
      if(cost<best){best=cost;target=e}}
    if(!target){s.target=null;return}
    s.target=target;s.face=target.x>=s.x?1:-1;
    // Aim for the outer lip of the head, rather than run through the enemy's feet.
    const offset=s.hp<=1?Math.min(.64,b.shadowRadius*.75):Math.min(.36,b.shadowRadius*.42);
    s.offset=offset;const predicted=target.x+limit(target.vx||0,-4,4)*b.shadowPeriod;
    s.dest=limit(s.x+limit(predicted-(s.flank||s.face)*offset-s.x,-stride,stride),.55,roomWidth-.7);
    s.endY=0;for(const p of h.platforms||[])if(p.left<=s.dest && p.right>=s.dest && p.y<=s.base+1)s.endY=Math.max(s.endY,p.y);
    // When elevated terrain would obstruct the attack, land just outside its edge.
    if(s.endY>base(target)+.84&&Math.abs(s.dest-target.x)<=b.shadowRadius){
      const platform=(h.platforms||[]).find(v=>v.y===s.endY&&s.dest>=v.left&&s.dest<=v.right);
      if(platform){const edges=[platform.left-.12,platform.right+.12].filter(x=>x>=.55&&x<=roomWidth-.7);
        const edge=edges.sort((a,z)=>Math.abs(a-target.x)-Math.abs(z-target.x))[0];
        if(edge!==undefined && Math.abs(edge-s.x)<=stride){s.dest=edge;s.endY=0}}
    }
    s.start=s.x;s.startY=s.y;s.phase=0;s.mode="hop";s.jumps++;
  }
  function decoy(shades,attacker,opponent){
    let best=null,nearest=Math.abs(attacker.x-opponent.x);
    for(const shade of shades){
      const distance=Math.abs(attacker.x-shade.x);
      if(shade.hp>0&&distance<nearest&&distance<3.2+(shade.settings?.mods?.shadow_lure||0)){best=shade;nearest=distance}
    }
    return best;
  }
  function hurt(shade){if(shade.hp>0&&shade.grace<=0){shade.hp--;shade.grace=.55;return true}}
  return {cast,tick,decoy,hurt};
})();
