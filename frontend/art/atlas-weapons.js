globalThis.AtlasWeaponArt=(()=>{
  const {rect,fill,line}=PixelFX;
  const ink="#332e40",steel="#534351",bronze="#9f795d",gold="#e5bd87";
  function pod(a,open){
    ctx.save();ctx.translate(a.podX,a.podY);ctx.rotate(a.podAngle);
    fill([[-15,-5],[-10,-11],[9,-12],[16,-6],[14,10],[7,14],[-11,12],[-15,6]],ink);
    fill([[-13,-3],[-8,-8],[9,-9],[13,-5],[11,8],[6,11],[-11,9]],bronze);
    fill([[-12,-2],[7,-4],[12,-7],[11,0],[6,4],[-12,5]],gold);
    fill([[-11,6],[6,5],[11,2],[10,7],[5,10],[-11,9]],steel);
    for(let i=0;i<4;i++){
      const x=(i-1.5)*4.5;
      rect(x-2,-12,4,6,ink);rect(x-1,-11,2,2,open>.55?"#ff9161":"#776859");
      rect(x-1,7,2,1,"#b39379");
    }
    fill([[-11,-2],[2,-3],[0,0],[-9,2]],"#ffe1a8");
    fill([[3,-3],[11,-5],[9,-1],[1,1]],"#bd996f");
    line(-11,4,5,2,"#7c6051");
    rect(-11,6,2,2,"#eacf93");rect(7,3,2,2,"#eacf93");
    for(const side of [-1,1]){
      ctx.save();ctx.translate(side*11,-10);ctx.rotate(side*open*1.27);
      const inner=-side*11;
      fill([[0,1],[inner,1],[inner,-3],[inner*.4,-5],[0,-4]],ink);
      fill([[0,-1],[inner+side,-1],[inner+side,-3],[inner*.4,-4],[0,-3]],gold);
      ctx.restore();
    }
    ctx.restore();
  }
  function field(e){
    const g=e.guard;
    PixelFX.volley(g.zones,g.age,e.phase==="warning",Math.min(1,g.age/g.warning),
      z=>AtlasWeapons.port(e,z),z=>AtlasWeapons.path(e,z),PixelFX.ordnanceColors,SkillPatterns.weaponStyle(g.move[2]));
  }
  return {pod,field};
})();