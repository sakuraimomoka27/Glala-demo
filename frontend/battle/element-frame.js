// Local rig coordinates face left. All mounts, landing surfaces and launches use
// this fixed-step pose; the renderer only applies rigid joint transforms.
globalThis.ElementFrame=(()=>{
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),lerp=(a,b,t)=>a+(b-a)*t;
  const configs={
    prometheus:{scale:1.09,wing:59,blade:61,core:1,site:"炉腕",colors:["#6a2837","#ed5934","#ffae45","#fff1a4"],
      special:SkillPatterns.signatures.prometheus_mortar,prep:[.30,-.46,.64,-.78,.18],strike:[-.13,1.28,1.63,-.24,-.30]},
    dione:{scale:1.04,wing:68,blade:75,core:2,site:"潮汐肩核",colors:["#25466e","#368fca","#8ce9fa","#eeffff"],
      special:SkillPatterns.signatures.dione_rail,prep:[-.15,.85,.35,1.08,-.34],strike:[.16,1.23,1.71,-.22,.27]},
    mnemosyne:{scale:1,wing:77,blade:59,core:2,site:"风翼根部",colors:["#285748","#55b779","#b6f587","#f1ffcf"],
      special:SkillPatterns.signatures.mnemosyne_missile,prep:[.30,-.44,.86,.32,.57],strike:[-.27,1.52,1.96,.18,-.38]},
    cronus:{scale:1.13,wing:63,blade:83,core:1,site:"执剑腕甲",colors:["#79502e","#e2a640","#ffe398","#fffee0"],
      special:SkillPatterns.signatures.cronus_rail,prep:[-.24,1.72,2.45,1.28,-.40],strike:[.24,1.35,1.36,-.72,.32]},
    hecate:{scale:1.02,wing:45,blade:58,core:2,site:"蚀相肩核",colors:["#343458","#7967cf","#88c8ff","#dbfff9"],
      special:SkillPatterns.signatures.hecate_missile,prep:[.19,-.13,1.4,.82,-.66],strike:[-.15,.71,1.87,-.52,.53]}
  };
  const supported=e=>configs[e.machine?.id]&&e.machine.ability===e.guard?.key;
  // Project the two sides of the chassis separately. Distances are in the same
  // local pixels as the painted plates and the rider's three landing surfaces.
  const stance={
    prometheus:{shoulder:24,hip:11,feet:23,wing:.12,farWing:-1.02},
    dione:{shoulder:22,hip:10,feet:20,wing:.05,farWing:-1.10},
    mnemosyne:{shoulder:23,hip:12,feet:25,wing:.26,farWing:-1.18},
    cronus:{shoulder:24,hip:11,feet:23,wing:.23,farWing:-1.16},
    hecate:{shoulder:23,hip:10,feet:21,wing:.20,farWing:-.83}
  };
  // Chest, upper arm, forearm, weapon and wing angles, in radians at release.
  const strikes={
    vents:[.28,.26,.57,-.99,-.22],cinder:[.18,1.19,.91,-.44,.42],
    lance:[.19,1.43,1.58,-.38,.09],return:[-.14,1.48,2.09,.76,-.28],
    dash:[-.28,1.64,1.66,.02,-.64],dive:[.22,.56,.33,-1.19,.61],
    wheel:[.23,1.50,1.12,-.60,.48],scissors:[-.21,1.19,2.38,.84,-.36],
    shade:[-.21,1.34,1.73,.56,-.58],twins:[.12,.39,1.31,-.71,.68]
  };
  // Offsets from the painted grip/wing hinge to the emitting pixel, as a fraction
  // of the rigid sprite width. Crescent tips sit above their handles.
  const bladeTipY={prometheus:-.018,dione:-.075,mnemosyne:0,cronus:-.025,hecate:-.085};
  const wingTip={mnemosyne:[.80,-.90],hecate:[.43,-.97]};
  function mount(e){
    const cfg=configs[e.machine.id];
    const f=e.guard.frame={cfg,time:0,cast:0,release:0,stagger:0,used:false,walk:0,lastX:e.x,
      recovery:0,moves:[...e.guard.kit.moves,cfg.special],scale:cfg.scale*e.guard.size};
    e.guard.height=Math.round(154*f.scale);
    pose(e,0);
  }
  const add=(p,x,y,a=0)=>({x:p.x+x*Math.cos(a)-y*Math.sin(a),y:p.y+x*Math.sin(a)+y*Math.cos(a)});
  function leg(hip,ankle){
    const dx=ankle.x-hip.x,dy=ankle.y-hip.y,d=Math.hypot(dx,dy);
    const along=(39*39-43*43+d*d)/(2*d),bend=Math.sqrt(Math.max(0,39*39-along*along));
    const knee={x:hip.x+(dx*along-dy*bend)/d,y:hip.y+(dy*along+dx*bend)/d};
    return {hip,knee,ankle};
  }
  function pose(e,dt){
    const g=e.guard,f=g.frame,c=f.cfg,weak=e.phase==="weak";
    f.time+=dt;
    const travel=e.x-f.lastX;f.lastX=e.x;f.walk+=Math.abs(travel)*5;
    const tracking=e.phase==="armored"&&Math.abs(travel)>.0001;
    f.stride=lerp(f.stride||0,tracking?1:0,1-Math.exp(-8*dt));
    const phase=e.phase,id=SkillPatterns.weaponType(g.move?.[2])??g.move?.[2],attack=phase==="attack",warning=phase==="warning";
    const windup=warning?Math.min(1,g.age/Math.max(.32,g.warning*.65)):attack?1:0;
    f.cast=lerp(f.cast,windup,1-Math.exp(-10*dt));
    const u=attack?g.age/Math.max(.01,g.activeFor):0;
    // Parry/return, leap and orbit each have their own follow-through.
    const double=id==="return"||id==="twins"||id==="scissors";
    const stroke=attack?(double?Math.abs(Math.sin(u*Math.PI*2)):Math.sin(Math.min(1,u*2.8)*Math.PI*.72)):0;
    f.release=lerp(f.release,stroke,1-Math.exp(-17*dt));
    f.stagger=Math.max(0,f.stagger-dt*2.5);
    const pulse=Math.sin(f.time*1.95),breath=Math.sin(f.time*2.27+.6);
    const endPose=strikes[id]||c.strike;
    const channels=c.prep.map((hold,i)=>lerp(hold,endPose[i],f.release));
    const q=f.cast,tilt=.034*pulse+channels[0]*q+.1*f.stagger;
    f.recovery=lerp(f.recovery,weak?1:0,1-Math.exp(-4*dt));
    const geometry=stance[e.machine.id];
    // Advance the weapon-side shoulder during extension; the planted hips rotate less.
    const thrust=id==="dash"||id==="lance"||id==="wheel"||id==="scissors";
    const turn=q*(thrust?.12+.80*f.release:.06+.33*f.release);
    const hip={x:2*pulse+Math.sin(f.walk)*f.stride*2,y:-84+1.7*breath+q*4+4*f.stagger+4*f.recovery};
    const pelvisAngle=-.028*pulse+tilt*.32;
    const farHip=add(hip,-geometry.hip*.9,-2,pelvisAngle),nearHip=add(hip,geometry.hip,0,pelvisAngle);
    const step=Math.sin(f.walk),tread=6*f.stride;
    const farLeg=leg(farHip,{x:-geometry.feet+tread*step,y:-13-Math.max(0,step)*tread});
    const nearLeg=leg(nearHip,{x:geometry.feet-tread*step,y:-10-Math.max(0,-step)*tread});
    const span=geometry.shoulder;
    const shoulder=add(hip,span-turn*24-6*f.recovery,-34+2*turn,tilt);
    const rear=add(hip,-span+turn*9,-37-turn*2,tilt),neck=add(hip,-3-turn*4,-45,tilt);
    // The braced forearm lifts its rider within one heavy jump of the open pauldron.
    const upper=lerp(lerp(-.11+.07*pulse,channels[1],q),-.32,f.recovery);
    const fore=lerp(lerp(.34-.07*breath,channels[2],q),1.48,f.recovery);
    const elbow=add(shoulder,0,24,upper),hand=add(elbow,0,25,fore);
    const cross=id==="scissors"||id==="twins";
    const rearUpper=.20+.08*pulse+q*(cross?1.12:-.18),rearFore=.14+.08*breath+q*(cross?1.48:.43);
    const farElbow=add(rear,0,24,rearUpper),farHand=add(farElbow,0,24,rearFore);
    const wing=add(hip,span*.71-turn*7,-36,tilt),wingAngle=geometry.wing+.06*pulse+q*channels[4];
    const farWing=add(hip,-span*.64+turn*5,-38,tilt);
    const farWingAngle=geometry.farWing-.045*pulse+q*channels[4]*.57+turn*.39;
    let weapon=lerp(-.76+.06*breath,channels[3],q);
    if(id==="rail"&&(attack||warning)){
      const target=g.zones[0],k=SCALE/f.scale;
      const dx=(target.targetX-e.x)*k*(-g.dir)-hand.x,dy=(GuardianCombat.lift(e)-target.targetY)*k-hand.y;
      const delta=Math.atan2(-dy,-dx)-weapon;
      weapon+=Math.atan2(Math.sin(delta),Math.cos(delta))*q;
    }
    if(id==="mortar")weapon=lerp(weapon,.65+.12*f.release,q);
    const tip=add(hand,-c.blade*.86,c.blade*bladeTipY[e.machine.id],weapon);
    const outlet=wingTip[e.machine.id]||[.68,-.53],plume=add(wing,c.wing*outlet[0],c.wing*outlet[1],wingAngle);
    f.pose={hip,pelvisAngle,tilt,farLeg,nearLeg,shoulder,rear,elbow,hand,upper,fore,rearUpper,rearFore,farElbow,farHand,
      neck,headAngle:tilt+.065*Math.sin(f.time*1.25)-.12*q,wing,wingAngle,farWing,farWingAngle,weapon,tip,plume,
      decks:[add(nearLeg.knee,1,-2),add(hand,0,-5),add(SkillPatterns.weaponType(c.special[2])==="missile"?wing:shoulder,0,-7)]};
  }
  function world(e,p){const f=e.guard.frame,k=f.scale/SCALE;return {x:e.x-e.guard.dir*p.x*k,y:GuardianCombat.lift(e)-p.y*k}}
  function deck(e,i){return world(e,e.guard.frame.pose.decks[i])}
  function radius(e,i){return [22,17,16][i]*e.guard.frame.scale/SCALE}
  function port(e,z){
    const f=e.guard.frame,p=f.pose,launch=z.type==="missile"?p.plume:p.tip;
    const v=world(e,launch);
    v.angle=z.type==="missile"?-e.guard.dir*(.43+p.wingAngle):e.guard.dir<0?p.weapon:Math.PI-p.weapon;
    return v;
  }
  function sockets(e){
    const f=e.guard.frame;
    return {layout:"element",bodyMargin:4.1,platforms:f.platforms,port:z=>port(e,z),
      deckHeight:(x,target)=>{
        const perch=target.perch;
        if(perch?.enemy===e&&Math.abs(x-deck(e,perch.part).x)<radius(e,perch.part))return deck(e,perch.part).y;
      },
      tip:()=>world(e,f.pose.tip),recoil:()=>{f.stagger=.46}
    };
  }
  function path(e,z){return Ordnance.path(z,port(e,z))}
  return {supported,mount,pose,deck,radius,port,sockets,path,world};
})();
