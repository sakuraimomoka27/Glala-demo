// An encounter belongs to one spawned enemy. Coordinates and timings here drive both
// damage and rendering; nothing is scheduled outside the room's fixed-step clock.
globalThis.GuardianCombat=(()=>{
  const clamp=(x,a,b)=>Math.max(a,Math.min(b,x)),lerp=(a,b,t)=>a+(b-a)*t;
  // Coordinates in the observatory are measured from the planted feet, in battle pixels.
  const bridge=[
    {left:4.55,right:6.15,y:.96},{left:6.65,right:8.5,y:1.91},
    {left:15.25,right:17.1,y:3.96},{left:17.55,right:19.3,y:2.77}
  ];
  function mountAtlas(e,platforms=bridge){
    e.x=13.1;
    e.guard.height=211;
    e.guard.next=0;
    e.guard.rig={lift:0,shutter:0,recoil:0,impact:0,pitch:0,used:false,idleTime:0,brace:0,
      platforms,dorsalKick:0,podKick:0,gunSet:0,podOpen:0,railSet:0,stepHeight:0};
    poseAtlas(e,0);
  }
  function updateRig(e,dt){
    const g=e.guard,r=g.rig;
    const sighting=e.phase==="warning"||e.phase==="attack",move=sighting?g.move[2]:"";
    const desiredLift=e.phase==="weak"?1:sighting?(move==="missile"?.49:move==="mortar"?.73:1):0;
    r.lift+=clamp(desiredLift-r.lift,-.55*dt,.74*dt);
    r.shutter=clamp(r.shutter+(e.phase==="weak"&&!r.used?3.4:-4.5)*dt,0,1);
    r.recoil=Math.max(0,r.recoil-3*dt);
    r.impact=Math.max(0,r.impact-1.65*dt);
    r.dorsalKick=Math.max(0,r.dorsalKick-3.7*dt);
    r.podKick=Math.max(0,r.podKick-6*dt);
    const follow=1-Math.exp(-5*dt);
    r.gunSet+=((move==="mortar"?1:0)-r.gunSet)*follow;
    r.podOpen+=((move==="missile"?1:0)-r.podOpen)*follow;
    r.railSet+=((move==="rail"?1:0)-r.railSet)*follow;
    const raised=e.phase==="warning"&&move==="rift"?Math.min(1,g.age*2.3):0;
    r.stepHeight+=(raised-r.stepHeight)*(1-Math.exp(-(raised?5:20)*dt));
    let pitch=move==="stone"?-.16:sighting?.065:0;
    if(move==="rail"){
      const shot=g.zones[0],a=r.pose,beamHeight=(a.deckY-11)/SCALE;
      const reach=Math.max(2,e.x+a.elbowX/SCALE-shot.targetX);
      pitch=clamp((shot.targetY-beamHeight)/reach,-.54,.22)+.035;
    }
    r.pitch+=(pitch-r.pitch)*(1-Math.exp(-6*dt));
    r.brace+=((sighting?1:0)-r.brace)*(1-Math.exp(-3*dt));
  }
  // All three decks and the drawing use this same, room-local fixed-step pose.
  // Seconds, lateral load, suspension travel, chest roll, head scan, back-gun elevation.
  // The long holds let the mass settle before the hips drive the next shift.
  const idleKeys=[
    [0,-.65,.32,-.45,.5,.5],[.82,.10,.90,-.22,.85,-.10],
    [1.62,1,.36,.95,.10,-.85],[2.18,.82,.18,.72,-.65,-.66],
    [3.20,-.24,.85,.12,-.85,.15],[4.18,-1,.42,-.90,.10,.84],
    [4.9,-.65,.32,-.45,.5,.5]
  ];
  function poseAtlas(e,dt){
    const r=e.guard.rig, lift=r.lift*r.lift*(3-2*r.lift);
    r.idleTime+=dt;
    const t=r.idleTime,cycle=t%4.9;
    const next=idleKeys.findIndex(key=>key[0]>cycle),lo=idleKeys[next-1],hi=idleKeys[next];
    const u=(cycle-lo[0])/(hi[0]-lo[0]),blend=u*u*(3-2*u);
    const channel=i=>lerp(lo[i],hi[i],blend);
    const weight=channel(1),compression=channel(2);
    const free=1-.62*r.brace;
    const hipX=-14+5*weight*free+5*r.recoil-3*r.railSet+3*r.podOpen+2.5*r.stepHeight;
    const hipY=-108+2.8+4.4*compression*free+3.2*r.brace+4*r.impact+4*r.gunSet+2*r.recoil+2.8*r.dorsalKick+1.2*r.podKick;
    const pelvisAngle=-.035*weight*free+.015*r.brace;
    const angle=.064*channel(3)*free-.055*r.brace+.074*r.recoil+.058*r.gunSet-.065*r.podOpen+.040*r.dorsalKick;
    const cos=Math.cos(angle),sin=Math.sin(angle);
    const shoulderX=hipX+31*cos+41*sin,shoulderY=-(hipY+31*sin-41*cos);
    const backAngle=.082*channel(5)*free+.045*r.brace+.20*r.gunSet-.09*r.dorsalKick-.045*r.recoil;
    const gunAngle=angle+backAngle;
    // Rear barrel rotates about its trunnion (36,-188); its central foothold is (-41,-190).
    const trunnionX=hipX+50*cos+80*sin+5*r.dorsalKick*Math.cos(gunAngle);
    const trunnionY=hipY+50*sin-80*cos+5*r.dorsalKick*Math.sin(gunAngle);
    const crownX=trunnionX-77*Math.cos(gunAngle)+2*Math.sin(gunAngle);
    const crownY=-(trunnionY-77*Math.sin(gunAngle)-2*Math.cos(gunAngle));
    const railAngle=Math.atan(.044-.079*lift+r.pitch+.019*weight*free);
    r.pose={hipX,hipY,angle,pelvisAngle,backAngle,headAngle:.13*channel(4)*free-.06*r.brace-.12*r.railSet+.10*r.podOpen,
      crownX,crownY,trunnionX,trunnionY,gunAngle,railAngle,shoulderX,shoulderY,
      podX:hipX+62*cos+56*sin,podY:hipY+62*sin-56*cos-5*r.podOpen+1.4*r.podKick,
      podAngle:angle-.12-.29*r.podOpen,stepHeight:r.stepHeight,
      elbowX:-4+9*r.recoil+(shoulderX-17)*.53,deckY:68+69*lift-5*r.impact+(shoulderY-149)*.43,
      shutter:r.shutter};
  }
  const atlasPose=e=>e.guard.rig.pose;
  function exposed(e){return e.phase==="weak"&&!e.guard.rig.used&&e.guard.rig.shutter>.76}
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
    switch(id){
      case "vents":return [0,-1,1].map((s,i)=>{const p=bound(locked+s*2.85);return z("flame",p,p,0,.68,2.7,.17*i,.56)});
      case "cinder":return [0,1].map(i=>z("ember",x,toward(8),0,.63,.47,i*.44,.99));
      case "lance":return [0,1,2].map(i=>z("spear",x,toward(10),.38,.62,.14,i*.30,.91));
      case "return":return [z("sickle",x,toward(8),1.55,.53,.24,0,.83),z("sickle",toward(8),x,.37,.56,.19,.88,.91)];
      case "dash":return [z("rush",x,lunge,0,.83,.58,0,.54)];
      case "dive":return [z("vortex",x,lunge,0,1.05,.60,0,.98)];
      case "rift":return [-1,1].map(s=>z("quake",x,bound(x+s*6.7),0,.66,.49,0,1.18));
      case "stone":return [-1,0,1].map((s,i)=>{const p=bound(locked+s*2.95);return z("crag",p,p,0,.71,1.95,i*.13,.74)});
      case "wheel":return [z("halo",x,x,0,2.15,1.40,0,.83)];
      case "scissors":return [-1,1].map((s,i)=>z("sword",bound(x+s*3.1),bound(x+s*1.35),.68,.45,.63,i*.16,.73));
      case "shade":return [z("phantom",x,locked,0,.93,.65,0,.85),z("phantom",x,locked,0,.83,.58,.59,.80)];
      case "twins":return [-1,1].map((s,i)=>z("phantom",bound(locked+s*4.1),bound(locked+s*1.85),0,.76,.62,i*.31,.95));
    }
  }
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
    for(const [from,delta,min,max] of [[x,dx,p.x-.16-pad,p.x+.16+pad],[y,dy,p.y-pad,p.y+.64+pad]]){
      if(Math.abs(delta)<1e-6){if(from<min||from>max)return false;continue}
      const a=(min-from)/delta,b=(max-from)/delta;lo=Math.max(lo,Math.min(a,b));hi=Math.min(hi,Math.max(a,b));
      if(lo>hi)return false;
    }
    return true;
  }
  function touches(zone,s,p){
    const dx=Math.abs(p.x-s.x),floor=zone.y===0?s.y:s.y-s.h;
    let top=s.y+s.h;
    if(zone.type==="flame"||zone.type==="crag")top*=1-.43*clamp((dx-.16)/s.r,0,1);
    if(!s.live||dx>=s.r+.16||p.y>=top||p.y+.64<=floor)return false;
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
  function attach(e){
    const key=e.bossStyle||e.machine?.ability,kit=kits[key];if(!kit)return;
    const size=clamp(e.bossScale??1,.85,1.25);
    e.guard={key,kit,size,height:Math.round(kit.height*size),next:e.bossOpener===2?1:0,
      dir:-1,lift:0,age:0,move:null,zones:[],activeFor:0,scratch:{}};
    e.phase="armored";e.phaseTime=Math.min(e.period??2.2,1.1);
  }
  function step(e,dt,p,decoy,edge,damage,damageShade){
    const g=e.guard,target=decoy||p,dx=target.x-e.x;
    if(g.rig){updateRig(e,dt);poseAtlas(e,dt)}
    if(g.frame)ElementFrame.pose(e,dt);
    g.age+=dt;e.phaseTime-=dt;
    if(e.phase==="armored"){
      if(!g.rig&&Math.abs(dx)>.9){if(Math.abs(dx)>1.75&&p.perch?.enemy!==e)g.dir=Math.sign(dx);const margin=g.frame?4.1:.75;e.x=clamp(e.x+Math.sign(dx)*e.speed*dt,margin,edge-margin)}
      if(e.phaseTime<=0){
        const castDir=Math.sign(dx)||g.dir;
        if(Math.abs(dx)>1.75&&p.perch?.enemy!==e)g.dir=castDir;
        const moves=g.rig?AtlasWeapons.moves:g.frame?g.frame.moves:g.kit.moves;
        g.move=moves[g.next];g.next=(g.next+1)%moves.length;
        const weapon=(g.rig||g.frame)&&AtlasWeapons.isWeapon(g.move[2]);
        g.zones=weapon?(g.frame?ElementFrame.plan(e,target,edge):AtlasWeapons.plan(g.move[2],target,edge,e,g.rig.platforms)):score(g.move[2],e.x,target.x,castDir,edge);
        if(g.frame)for(const zone of g.zones)if(zone.type==="rush"||zone.type==="vortex")zone.to=clamp(zone.to,4.1,edge-4.1);
        g.activeFor=Math.max(...g.zones.map(z=>z.at+z.dur));
        e.phase="warning";e.phaseTime=g.warning=Math.max(weapon?1.75:0,e.warning??.95);g.age=0;
      }
    }else if(e.phase==="warning"){
      if(e.phaseTime<=0){
        e.phase="attack";e.phaseTime=g.activeFor;g.age=0;
        if(g.zones[0].weapon)(g.frame?ElementFrame:AtlasWeapons).fire(e,g.zones[0]);
      }
    }else if(e.phase==="attack"){
      for(const zone of g.zones){
        let contact;
        if(zone.weapon){
          if(g.age<zone.at)continue;
          const weapon=g.frame?ElementFrame:AtlasWeapons;
          if(!zone.path)weapon.fire(e,zone);
          if(zone.type==="rail"&&g.age-zone.at<zone.dur){
            const port=weapon.port(e,zone);
            zone.path.ax=port.x;zone.path.ay=port.y;
          }
          contact=body=>Ordnance.hits(zone,g.age,dt,body,segmentHits);
        }else{
          if(g.frame&&!zone.origin&&g.age>=zone.at&&
             (zone.type==="spear"||zone.type==="ember"||zone.type==="sickle"&&zone.at===0)){
            zone.origin=ElementFrame.world(e,g.frame.pose.tip);
          }
          const s=sample(zone,g.age,g.scratch);
          if(zone.type==="rush"||zone.type==="vortex"){e.x=s.x;g.lift=s.lift}
          if(!s.live)continue;
          contact=body=>touches(zone,s,body);
        }
        if(!zone.hitPlayer && contact(p)){zone.hitPlayer=true;damage(e.name,g.move[0])}
        if(decoy && zone.hitShade!==decoy && contact(decoy)){zone.hitShade=decoy;damageShade(decoy)}
      }
      if(e.phaseTime<=0){e.phase="weak";e.phaseTime=g.rig?Math.max(4.3,e.weakTime||0):g.frame?Math.max(2.8,e.weakTime||0):e.weakTime??1.4;g.lift=0;g.age=0;g.zones=[];if(g.rig)g.rig.used=false;if(g.frame)g.frame.used=false}
    }else if(e.phaseTime<=0){
      e.phase="armored";
      e.phaseTime=g.rig?Math.max(4,e.period||0):e.hp<=e.max*.5?Math.min(.45,e.period??2.2):e.period??2.2;
      g.age=0;
    }
  }
  const height=(e,scale)=>e.guard.height/scale+e.guard.lift;
  // The helm accepts high jumps; a marked frontal plate stays reachable by heavy builds.
  const plate=(e)=>e.guard.lift+(e.phase==="weak"?.78:1.05)*Math.min(1.03,e.guard.size);
  const plateX=e=>e.x+e.guard.dir*.49*e.guard.size;
  // Front skirt, far pauldron and crown are one-way solid, independent of attack hazards.
  function partX(e,i){if(e.guard.frame)return ElementFrame.deck(e,i).x;if(e.guard.rig){const a=atlasPose(e);return e.x+(i===0?a.elbowX-62*Math.cos(a.railAngle):i===1?a.shoulderX:a.crownX)/SCALE}return i===0?plateX(e):i===1?e.x-e.guard.dir*.68*e.guard.size:e.x}
  function partY(e,i,scale,x=partX(e,i)){
    if(e.guard.frame)return ElementFrame.deck(e,i).y;
    if(e.guard.rig){
      const a=atlasPose(e),localX=(x-e.x)*scale;
      return (i===0?a.deckY-(localX-a.elbowX)*Math.tan(a.railAngle):i===1?a.shoulderY:a.crownY-(localX-a.crownX)*Math.tan(a.gunAngle))/scale;
    }
    return i===0?plate(e):i===1?e.guard.lift+e.guard.height*.68/scale:height(e,scale)
  }
  function partRadius(e,i){
    if(e.guard.frame)return ElementFrame.radius(e,i);
    if(e.guard.rig){const a=atlasPose(e);return (i===0?48*Math.cos(a.railAngle):i===1?15:20*Math.cos(a.gunAngle))/SCALE}
    return (i===0?.66:i===1?.45:.49)*e.guard.size
  }
  const label=e=>e.guard.rig?(exposed(e)?"肩部传动核已开启 · 从上方落击":e.phase==="armored"?"双轨炮降位 · 从断桥登上炮臂":e.phase==="weak"?(e.guard.rig.used?"肩核受创 · 可跳回右侧残台":"肩甲解锁中 · 准备登肩"):e.guard.move[0]+" · "+e.guard.move[1]):
    e.guard.frame&&e.phase==="weak"?e.guard.frame.cfg.site+(e.guard.frame.used?"已击破":"开放 · 跃击亮核"):
    e.phase==="warning"?e.guard.move[0]+"蓄势 · "+e.guard.move[1]:e.phase==="attack"?e.guard.move[0]:
    e.phase==="weak"?"核心暴露 · 落击亮核":"装甲闭合 · 侧甲可落脚";
  return {attach,step,sample,touches,leaper,height,plate,plateX,partX,partY,partRadius,label,mountAtlas,atlasPose,poseAtlas,exposed,bridge};
})();
