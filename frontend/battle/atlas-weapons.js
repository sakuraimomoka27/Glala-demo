// Positions are in room metres (positive y is up). Mount geometry is in rig pixels.
globalThis.AtlasWeapons=(()=>{
  const moves=["atlas_rail","atlas_mortar","atlas_missile"].map(id=>SkillPatterns.signatures[id]).concat([SkillPatterns.moves.rift,SkillPatterns.moves.stone]);
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
    const muzzle={x:e.x+(x+dx*c-dy*s)/SCALE,y:GuardianCombat.lift(e)-(y+dx*s+dy*c)/SCALE,angle,fixedBore:true};
    if(z.type==="mortar"){muzzle.breechX=e.x+a.trunnionX/SCALE;muzzle.breechY=GuardianCombat.lift(e)-a.trunnionY/SCALE}
    return muzzle;
  }
  function mount(e){
    return {layout:"atlas",fixedBore:true,platforms:e.guard.rig.platforms,port:z=>port(e,z),
      deckHeight:(x,target)=>{
        const perch=target.perch;
        if(perch?.enemy===e&&Math.abs(x-GuardianCombat.partX(e,perch.part))<=GuardianCombat.partRadius(e,perch.part))
          return GuardianCombat.partY(e,perch.part,SCALE,x);
      },
      recoil:z=>{e.guard.rig[z.type==="rail"?"recoil":z.type==="mortar"?"dorsalKick":"podKick"]=1}
    };
  }
  function path(e,z){return Ordnance.path(z,port(e,z))}
  return {moves,mount,port,path,point:Ordnance.point,hits:Ordnance.hits};
})();
