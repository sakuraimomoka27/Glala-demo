globalThis.GorgeArt=(()=>{
  function preload(){
    for(const key of ["cliff","rock","truss","pier","arch","court","hoist","exit"])LevelPaint.load(key);
  }
  function begin(d,player,platforms,clock,ready){
    const density=screenCanvas.width/W,height=screenCanvas.height/density;
    const left=Math.round(Math.min(d.width*SCALE-W,Math.max(0,player.x*SCALE-W*.4))*2)/2;
    // Track tall climbs only when the actor approaches the top of the viewport.
    const footOnScreen=height-27-player.y*SCALE;
    const lift=Math.round(Math.max(0,42-footOnScreen)*density)/density;
    ctx.save();ctx.setTransform(density,0,0,density,0,0);ctx.imageSmoothingEnabled=false;
    LevelPaint.background(ctx,d.background||"cliff",left,W,height,lift,d.assets);
    ctx.translate(-left,height-27-FLOOR+lift);
    const visible=(a,b)=>b*SCALE>=left&&a*SCALE<=left+W;
    const props=d.decorations||d.hoists.map(x=>({type:"hoist",x,y:0}));
    const first=d.loopBiome?Math.floor(left/SCALE/d.arenaStart):0;
    const last=d.loopBiome?Math.floor((left+W)/SCALE/d.arenaStart):0;
    for(let i=first;i<=last;i++)for(const o of props){
      const x=o.x+i*d.arenaStart;
      const asset=o.skin&&d.assets.find(a=>a.id===o.skin),half=asset?asset.metres/2:2;
      if(!visible(x-half,x+half))continue;
      if(asset)LevelPaint.custom(ctx,asset,x*SCALE,FLOOR-o.y*SCALE,0,FLOOR);
      else LevelPaint.prop(ctx,o.type,x*SCALE,FLOOR-o.y*SCALE);
    }
    if(!d.loopBiome&&visible(d.x-2,d.x+2))LevelPaint.prop(ctx,"exit",d.x*SCALE,FLOOR-d.y*SCALE,ready);
    function paint(p){
      if(!visible(p.left,p.right))return;
      const asset=p.skin&&d.assets.find(a=>a.id===p.skin);
      if(asset)LevelPaint.custom(ctx,asset,p.left*SCALE,FLOOR-p.y*SCALE,(p.right-p.left)*SCALE,FLOOR);
      else LevelPaint.terrain(ctx,p.art||"pier",p.left*SCALE,FLOOR-p.y*SCALE,(p.right-p.left)*SCALE,FLOOR);
    }
    for(const p of platforms)paint(p);
    for(const p of d.decks)paint(p);
    return left;
  }
  return {preload,begin};
})();
