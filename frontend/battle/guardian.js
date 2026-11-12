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
    const sighting=e.phase==="warning"||e.phase==="attack",move=sighting?(SkillPatterns.weaponType(g.move[2])??g.move[2]):"";
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
  const {kits,score,sample,touches,leaper,segmentHits}=SkillPatterns;
  function attach(e){
    const key=e.bossStyle||e.machine?.ability,kit=kits[key];if(!kit)return;
    const size=clamp(e.bossScale??1,.85,1.25);
    e.guard={key,kit,size,height:Math.round(kit.height*size),next:e.bossOpener===2?1:0,
      dir:-1,lift:0,age:0,move:null,zones:[],activeFor:0,scratch:{}};
    e.phase="armored";e.phaseTime=Math.min(e.period??2.2,1.1)/(e.aggression??1);
  }
  function step(e,dt,p,decoy,edge,damage,damageShade,impulse,castSkill,motion){
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
        if(e.rotation?.length){
          const id=e.rotation[g.next%e.rotation.length],skill=CombatSkills.definitions[id];
          g.move=SkillPatterns.moves[id]||SkillPatterns.weapons[id]||SkillPatterns.signatures[id]||[skill.name,skill.hint||"注意出手时机",id];
          g.next=(g.next+1)%e.rotation.length;
        }else{g.move=moves[g.next];g.next=(g.next+1)%moves.length}
        const id=g.move[2],type=SkillPatterns.weaponType(id);
        g.castDir=castDir;g.castTarget=target;
        g.mount=g.rig?AtlasWeapons.mount(e):g.frame?ElementFrame.sockets(e):null;
        const longTell=type&&(g.mount||Object.hasOwn(SkillPatterns.signatures,id));
        g.warning=EchoModifiers.jumpDelay(e.echoBuild,id,Math.max(longTell?1.75:0,e.warning??.95));
        g.portableWeapon=!!(type&&!g.mount&&castSkill);
        g.pattern=null;g.activeFor=.36;
        if(type||SkillPatterns.moves[id]){
          const args={warning:g.warning,mount:g.mount,phaseDriven:!g.portableWeapon};
          const pattern=castSkill?castSkill(e,target,castDir,args,id):
            SkillPatterns.cast({...args,id,source:e,target,dir:castDir,width:edge,power:e.skillPower??1});
          if(args.phaseDriven)g.pattern=pattern;
          g.activeFor=pattern.duration;
        }
        g.zones=g.pattern?.zones??[];
        e.phase="warning";e.phaseTime=g.warning;g.age=0;
      }
    }else if(e.phase==="warning"){
      if(e.phaseTime<=0){
        e.phase="attack";e.phaseTime=g.activeFor;g.age=0;
        if(g.pattern)SkillPatterns.begin(g.pattern,g,e,{mount:g.mount,onJump:motion?.onJump});
        else if(!g.portableWeapon)castSkill(e,g.castTarget,g.castDir,{warning:0},g.move[2]);
      }
    }else if(e.phase==="attack"){
      if(g.pattern){
        SkillPatterns.advance(g.pattern,g,g.age,dt,e,decoy?[p,decoy]:[p],{
          mount:g.mount,impulse,onLand:motion?.onLand,
          hit:(target,power,style,point)=>{
            if(target===p)damage(e.name,g.move[0],point.dir,undefined,power,style);
            else damageShade(target,style,power);
          }
        });
      }
      if(e.phaseTime<=0){e.phase="weak";e.phaseTime=g.rig?Math.max(4.3,e.weakTime||0):g.frame?Math.max(2.8,e.weakTime||0):e.weakTime??1.4;g.lift=0;g.age=0;g.zones=[];g.pattern=null;if(g.rig)g.rig.used=false;if(g.frame)g.frame.used=false}
    }else if(e.phaseTime<=0){
      e.phase="armored";
      e.phaseTime=(g.rig?Math.max(4,e.period||0):e.hp<=e.max*.5?Math.min(.45,e.period??2.2):e.period??2.2)/(e.aggression??1);
      e.phaseTime=EchoModifiers.cadence(e.echoBuild,g.move[2],e.phaseTime);g.age=0;
    }
  }
  const lift=FieldCombat.lift;
  const height=(e,scale)=>e.guard.height/scale+lift(e);
  // The helm accepts high jumps; a marked frontal plate stays reachable by heavy builds.
  const plate=(e)=>lift(e)+(e.phase==="weak"?.78:1.05)*Math.min(1.03,e.guard.size);
  const plateX=e=>e.x+e.guard.dir*.49*e.guard.size;
  // Front skirt, far pauldron and crown are one-way solid, independent of attack hazards.
  function partX(e,i){if(e.guard.frame)return ElementFrame.deck(e,i).x;if(e.guard.rig){const a=atlasPose(e);return e.x+(i===0?a.elbowX-62*Math.cos(a.railAngle):i===1?a.shoulderX:a.crownX)/SCALE}return i===0?plateX(e):i===1?e.x-e.guard.dir*.68*e.guard.size:e.x}
  function partY(e,i,scale,x=partX(e,i)){
    if(e.guard.frame)return ElementFrame.deck(e,i).y;
    if(e.guard.rig){
      const a=atlasPose(e),localX=(x-e.x)*scale;
      return lift(e)+(i===0?a.deckY-(localX-a.elbowX)*Math.tan(a.railAngle):i===1?a.shoulderY:a.crownY-(localX-a.crownX)*Math.tan(a.gunAngle))/scale;
    }
    return i===0?plate(e):i===1?lift(e)+e.guard.height*.68/scale:height(e,scale)
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
  return {attach,step,sample,touches,leaper,lift,height,plate,plateX,partX,partY,partRadius,label,mountAtlas,atlasPose,poseAtlas,exposed,bridge};
})();
