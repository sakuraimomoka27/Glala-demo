// Positions are in room metres (positive y is up). Mount geometry is in rig pixels.
globalThis.AtlasWeapons=(()=>{
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const moves=[
    ["双轨贯穿炮","避开青色瞄线，炮口上方可落脚","rail"],
    ["背炮交错轰击","离开琥珀色炮击落点","mortar"],
    ["蜂巢飞弹齐射","红圈锁定后，穿过弹着点之间的空隙","missile"],
    ["大陆震脉","跳越向两侧推进的地裂","rift"],
    ["列柱隆起","站在石印之间","stone"]
  ];
  const isWeapon=id=>id==="rail"||id==="mortar"||id==="missile";
  function plan(type,target,edge,e,platforms){
    const rail=type==="rail",mortar=type==="mortar";
    const offsets=rail?[0,0]:mortar?[.70,-1.25]:[0,-2.65,2.45,-.75];
    // The dorsal barrels face forward. Missiles can turn and attack the far side.
    const limit=mortar?e.x-4.1:edge-.65;
    const anchor=clamp(target.x,.65-Math.min(...offsets),limit-Math.max(...offsets));
    return offsets.map((offset,i)=>{
      const x=rail?target.x:anchor+offset;
      const ledge=platforms.find(p=>x>=p.left&&x<=p.right&&p.y<=target.y+.75);
      const onDeck=target.perch?.enemy===e&&Math.abs(x-GuardianCombat.partX(e,target.perch.part))<=GuardianCombat.partRadius(e,target.perch.part);
      const y=rail?target.y+.34:onDeck?GuardianCombat.partY(e,target.perch.part,SCALE,x):ledge?.y??0;
      const flight=rail?0:mortar?1.03:1.13+.06*(i%2);
      return {type,index:i,weapon:true,targetX:x,targetY:y,at:i*(rail?.40:mortar?.48:.24),
        flight,dur:flight+(rail?.36:.48),blastRadius:mortar?.86:.64};
    });
  }
  function port(e,z){
    const a=e.guard.rig.pose;
    let x,y,angle,dx,dy;
    if(z.type==="rail"){
      x=a.elbowX;y=-a.deckY;angle=a.railAngle;dx=-117;dy=z.index%2?27:11;
    }else if(z.type==="mortar"){
      x=a.trunnionX;y=a.trunnionY;angle=a.gunAngle;dx=-118;dy=z.index%2?11:1;
    }else{
      x=a.podX;y=a.podY;angle=a.podAngle;dx=(z.index-1.5)*4.5;dy=-11;
    }
    const c=Math.cos(angle),s=Math.sin(angle);
    return {x:e.x+(x+dx*c-dy*s)/SCALE,y:-(y+dx*s+dy*c)/SCALE,angle};
  }
  function path(e,z){
    const start=port(e,z),ax=start.x,ay=start.y;
    const c=Math.cos(start.angle),s=Math.sin(start.angle);
    if(z.type==="rail"){
      const length=Math.max(0,Math.min(ax/c,s<-.001?-ay/s:100));
      return {ax,ay,bx:ax-length*c,by:ay+length*s};
    }
    const bx=z.targetX,by=z.targetY;
    if(z.type==="mortar"){
      const lead=clamp((ax-bx)*.47,.65,3.3);
      // A quadratic starts on the physical bore axis and falls under constant acceleration.
      const a=e.guard.rig.pose;
      return {ax,ay,cx:ax-c*lead,cy:ay+s*lead,bx,by,
        breechX:e.x+a.trunnionX/SCALE,breechY:-a.trunnionY/SCALE};
    }
    // Eject along the tube, fan out, then dive onto the locked mark.
    const fan=(z.index-1.5)*.56;
    return {ax,ay,cx:ax+Math.sin(start.angle)*1.5,cy:ay+Math.cos(start.angle)*1.5,
      dx:bx+fan,dy:Math.max(ay+2.55,by+2.8),bx,by};
  }
  function fire(e,z){
    z.path=path(e,z);
    const r=e.guard.rig;
    if(z.type==="rail")r.recoil=1;
    else if(z.type==="mortar")r.dorsalKick=1;
    else r.podKick=1;
    globalThis.DropSound?.ordnance?.(z.type);
  }
  return {moves,isWeapon,plan,port,path,point:Ordnance.point,fire,hits:Ordnance.hits};
})();
