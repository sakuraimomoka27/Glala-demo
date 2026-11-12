globalThis.SkillPatterns=(()=>{
  const clamp=(x,a,b)=>Math.max(a,Math.min(b,x)),lerp=(a,b,t)=>a+(b-a)*t;
  const kits={
    burn:{height:61,ink:"#783747",mid:"#f07748",lit:"#ffe39a",moves:[
      ["炉心喷涌","离开地面火印","vents"],["燎原火线","跳过推进的火浪","cinder"]]},
    shot:{height:59,ink:"#275475",mid:"#57b6df",lit:"#d9ffff",moves:[
      ["三叉潮枪","跃过低位水枪","lance"],["折返潮刃","去时贴地，回流时跳起","return"]]},
    wind:{height:58,ink:"#365961",mid:"#79cfa4",lit:"#e7ffb7",moves:[
      ["裂风突贯","跳过冲刺路径","dash"],["天穹坠袭","移出锁定的风眼","dive"]]},
    earth:{height:66,ink:"#694b44",mid:"#c89454",lit:"#ffe8a0",moves:[
      ["大陆震脉","跳越向两侧推进的地裂","rift"],["列柱隆起","站在石印之间","stone"]]},
    slash:{height:62,ink:"#776242",mid:"#f0c979",lit:"#ffffdc",moves:[
      ["日轮回斩","退出近身剑圈","wheel"],["双翼裁决","穿过外侧剑光，靠近中轴","scissors"]]},
    shadow:{height:60,ink:"#523768",mid:"#b68be2",lit:"#f2daff",moves:[
      ["残月投影","离开残影落点","shade"],["双相蚀印","站在双影印之间","twins"]]}
  };
  const z=(type,from,to,y,r,h,at,dur)=>({type,from,to,y,r,h,at,dur});
  function score(id,x,target,dir,edge){
    const bound=v=>clamp(v,.75,edge-.75),toward=n=>bound(x+dir*n),locked=bound(target);
    const lunge=bound(x+dir*clamp(Math.abs(locked-x),2,6.4));
    return planners[id]({x, bound, toward, locked, lunge});
  }
  const planners={
    vents:({bound, locked})=>[0,-1,1].map((s,i)=>{const p=bound(locked+s*2.85);return z("flame",p,p,0,.68,2.7,.17*i,.56)}),
    cinder:({x, toward})=>[0,1].map(i=>z("ember",x,toward(8),0,.63,.47,i*.44,.99)),
    lance:({x, toward})=>[0,1,2].map(i=>z("spear",x,toward(10),.38,.62,.14,i*.30,.91)),
    return:({x, toward})=>[z("sickle",x,toward(8),1.55,.53,.24,0,.83),z("sickle",toward(8),x,.37,.56,.19,.88,.91)],
    dash:({x, lunge})=>[z("rush",x,lunge,0,.83,.58,0,.54)],
    dive:({x, lunge})=>[z("vortex",x,lunge,0,1.05,.60,0,.98)],
    rift:({x, bound})=>[-1,1].map(s=>z("quake",x,bound(x+s*6.7),0,.66,.49,0,1.18)),
    stone:({bound, locked})=>[-1,0,1].map((s,i)=>{const p=bound(locked+s*2.95);return z("crag",p,p,0,.71,1.95,i*.13,.74)}),
    wheel:({x})=>[z("halo",x,x,0,2.15,1.40,0,.83)],
    scissors:({x, bound})=>[-1,1].map((s,i)=>z("sword",bound(x+s*3.1),bound(x+s*1.35),.68,.45,.63,i*.16,.73)),
    shade:({x, locked})=>[z("phantom",x,locked,0,.93,.65,0,.85),z("phantom",x,locked,0,.83,.58,.59,.80)],
    twins:({bound, locked})=>[-1,1].map((s,i)=>z("phantom",bound(locked+s*4.1),bound(locked+s*1.85),0,.76,.62,i*.31,.95)),
  };
  const leaper=k=>k==="phantom"||k==="vortex";
  // Units are metres, y is height above the floor. A leaping shadow only hits on landing.
  function sample(zone,t,out={}){
    const u=clamp((t-zone.at)/zone.dur,0,1),leap=leaper(zone.type),flight=leap?Math.min(1,u/.73):u;
    out.u=u;out.x=lerp(zone.from,zone.to,flight);
    out.lift=leap?4*flight*(1-flight)*(zone.type==="vortex"?2.1:1.55):0;
    out.live=t>=zone.at && t<zone.at+zone.dur && (!leap||u>=.73);
    out.y=zone.y;out.r=zone.r;out.h=zone.h*(zone.type==="flame"?Math.min(1,.48+u*6):zone.type==="crag"?Math.min(1,.60+4*u):1);
    if(zone.origin){
      const v=clamp(u/.45,0,1),settle=v*v*(3-2*v);
      out.x=lerp(zone.origin.x,out.x,settle);out.y=lerp(zone.origin.y,out.y,settle);
    }
    return out;
  }
  function haloPoint(s,a){return [s.x+Math.cos(a)*s.r,s.h*(.52-Math.sin(a)*.54)]}
  // A bright sword segment against the player's body; the empty center of an orbit is safe.
  function segmentHits(p,x,y,X,Y,pad=.08){
    const dx=X-x,dy=Y-y;let lo=0,hi=1;
    for(const [from,delta,min,max] of [[x,dx,p.x-(p.halfWidth??.16)-pad,p.x+(p.halfWidth??.16)+pad],[y,dy,p.y-pad,p.y+(p.height??.64)+pad]]){
      if(Math.abs(delta)<1e-6){if(from<min||from>max)return false;continue}
      const a=(min-from)/delta,b=(max-from)/delta;lo=Math.max(lo,Math.min(a,b));hi=Math.min(hi,Math.max(a,b));
      if(lo>hi)return false;
    }
    return true;
  }
  function touches(zone,s,p){
    const dx=Math.abs(p.x-s.x),floor=zone.y===0?s.y:s.y-s.h;
    let top=s.y+s.h;
    if(zone.type==="flame"||zone.type==="crag")top*=1-.43*clamp((dx-(p.halfWidth??.16))/s.r,0,1);
    if(!s.live||dx>=s.r+(p.halfWidth??.16)||p.y>=top||p.y+(p.height??.64)<=floor)return false;
    if(zone.type==="halo"){
      for(let i=0;i<4;i++){
        const a=i*Math.PI*.5+s.u*Math.PI*2;
        let first=haloPoint(s,a);
        for(let j=1;j<=4;j++){
          const end=haloPoint(s,a+j*.25);
          if(segmentHits(p,...first,...end))return true;
          first=end;
        }
      }
      return false;
    }
    if(zone.type==="sword"){const offset=(Math.sign(zone.to-zone.from)||1)*s.r*.7;
      return segmentHits(p,s.x-offset,s.y-s.h,s.x+offset,s.y+s.h)}
    return true;
  }
  const moves=Object.fromEntries(Object.values(kits).flatMap(kit=>kit.moves.map(move=>[move[2],move])));
  const weapons={
    rail:["双轨贯穿炮","避开青色瞄线，炮口上方可落脚","rail"],
    mortar:["背炮交错轰击","离开琥珀色炮击落点","mortar"],
    missile:["蜂巢飞弹齐射","红圈锁定后，穿过弹着点之间的空隙","missile"]
  };
  const salvo=(type,layout,name,hint,style)=>({type,layout,name,hint,style});
  const salvos={
    atlas_rail:salvo("rail","atlas",weapons.rail[0],weapons.rail[1]),
    atlas_mortar:salvo("mortar","atlas",weapons.mortar[0],weapons.mortar[1]),
    atlas_missile:salvo("missile","atlas",weapons.missile[0],weapons.missile[1]),
    prometheus_mortar:salvo("mortar","element","熔炉爆破弹","离开橙色炉印"),
    dione_rail:salvo("rail","element","潮汐折光","跃离潮刃的蓝色瞄线"),
    mnemosyne_missile:salvo("missile","element","叶刃追风弹","移出双翼锁定的风眼","wind"),
    cronus_rail:salvo("rail","element","日冕贯光","避开金色剑线"),
    hecate_missile:salvo("missile","element","蚀月游魂","离开幽蓝月印","shade")
  };
  const signatures=Object.fromEntries(Object.entries(salvos).map(([id,s])=>[id,[s.name,s.hint,id]]));
  const weaponStyle=id=>salvos[id]?.style;
  const weaponType=id=>Object.hasOwn(weapons,id)?id:salvos[id]?.type;
  function plan(id,source,target,dir,width,warning,power,platforms,mount){
    const type=weaponType(id),layout=salvos[id]?.layout??mount?.layout??"single";
    const originY=FieldCombat.base(source);
    target??={x:source.x+dir*4,y:originY};
    const zones=type?Ordnance.plan(type,layout,source,target,width,dir,platforms,mount):score(id,source.x,target.x,dir,width);
    for(const zone of zones){
      zone.struck=new Set();
      if(mount?.bodyMargin&&(zone.type==="rush"||zone.type==="vortex"))zone.to=clamp(zone.to,mount.bodyMargin,width-mount.bodyMargin);
    }
    return {id,zones,originY,dir,age:-warning,warning,power,duration:Math.max(...zones.map(z=>z.at+z.dur))};
  }
  function cast(c){
    const warning=c.warning??(Object.hasOwn(signatures,c.id)?1.75:.55);
    const pattern=plan(c.id,c.source,c.target,c.dir,c.width,warning,c.power,c.mount?.platforms??c.platforms,c.mount);
    if(!c.phaseDriven)c.state.patterns.push(pattern);
    return pattern;
  }
  function setDiveHeight(source,floor,lift){
    if(source.guard)source.guard.lift=lift;
    else if(source.y===undefined)source.baseY=floor+lift;
    else Object.assign(source,{y:floor+lift,vy:0,grounded:false,perch:null,windup:0});
  }
  function endDive(state){
    if(!state.dive)return;
    setDiveHeight(state.dive.source,state.dive.floor,0);
    state.dive=null;
  }
  function begin(pattern,state,source,h){
    if(pattern.id==="dive"&&!state.dive&&source.hp!==0){
      state.dive={source,cast:pattern,floor:pattern.originY};
      if(!state.leap&&source.grounded!==false)h.onJump?.();
    }
    const first=pattern.zones[0];
    if(first.weapon&&!first.path&&source.hp!==0)fire(first,source,h.mount);
  }
  function fire(z,source,mount){
    Ordnance.fire(z,mount?.port(z)??Ordnance.portablePort(source,z));
    mount?.recoil(z);
  }
  // Room AI can own the phase clock. All casters advance the same hit windows,
  // locked trajectories and per-zone hit set against their actual opponents.
  function advance(pattern,state,age,dt,source,targets,h){
    for(const z of pattern.zones){
      if(age<z.at||age>=z.at+z.dur)continue;
      let shape;
      if(z.weapon){
        if(!z.path){if(source.hp===0)continue;fire(z,source,h.mount)}
        if(z.type==="rail"){
          const port=h.mount?.port(z)??Ordnance.portablePort(source,z);z.path.ax=port.x;z.path.ay=port.y;
        }
        if(!z.kickSent){z.kickSent=true;h.impulse?.(z.path.ax,z.type==="rail"?3.8:z.type==="mortar"?2.8:1.4,pattern.dir)}
        if(z.flight&&age-z.at>=z.flight&&!z.blastSent){
          z.blastSent=true;h.impulse?.(z.path.bx,z.type==="mortar"?3.5:2.3,pattern.dir);
        }
      }else{
        if(!z.origin&&(z.type==="spear"||z.type==="ember"||z.type==="sickle"&&z.at===0))
          z.origin=h.mount?.tip?.();
        shape=sample(z,age);
        if(source.hp!==0&&(z.type==="rush"||z.type==="vortex")){
          source.x=shape.x;
          if(state.dive?.cast===pattern){
            if(shape.live){endDive(state);h.onLand?.(8,pattern.originY)}
            else setDiveHeight(source,pattern.originY,shape.lift);
          }
        }
        if(!shape.live)continue;
        if(!z.kickSent){z.kickSent=true;h.impulse?.(shape.x,["quake","crag","rush","flame"].includes(z.type)?3:1.35,pattern.dir)}
      }
      for(const target of targets){
        if(target.hp<=0||z.struck.has(target))continue;
        const y=FieldCombat.base(target),body={x:target.x,y:y-(z.weapon?0:pattern.originY)};
        if(target.guard){body.height=target.guard.height/FieldCombat.pixelsPerMetre;body.halfWidth=.68*target.guard.size}
        if(!(z.weapon?Ordnance.hits(z,age,dt,body,segmentHits):touches(z,shape,body)))continue;
        z.struck.add(target);
        h.hit(target,pattern.power,z.type==="vortex"?"stomp":"strike",{x:target.x,y:y+.35,dir:Math.sign(target.x-(z.path?.ax??source.x))||pattern.dir});
      }
    }
  }
  function tick(state,dt,source,targets,h){
    for(let i=state.patterns.length-1;i>=0;i--){
      const pattern=state.patterns[i];pattern.age+=dt;
      if(pattern.age>=pattern.duration){
        if(state.dive?.cast===pattern){endDive(state);h.onLand?.(8,pattern.originY)}
        state.patterns.splice(i,1);continue;
      }
      if(pattern.age<0)continue;
      if(!pattern.started){pattern.started=true;begin(pattern,state,source,h)}
      advance(pattern,state,pattern.age,dt,source,targets,h);
    }
  }
  return {kits,moves,weapons,signatures,weaponType,weaponStyle,plan,begin,advance,score,sample,touches,leaper,segmentHits,cast,tick,endDive};
})();
