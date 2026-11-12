globalThis.FieldArt=(()=>{
  const root=new URL(".",document.currentScript.src);
  const sheets=new Map(),strokes=new Map(),hitCells=new Map();

  const palettes={
    steel:["#34354c","#828fb9","#badfeb","#fff4c3"],stone:["#583039","#ce733c","#ffb351","#fff0ab"],
    claw:["#233c4d","#398e9a","#71e0cb","#e9ffff"],arrow:["#432d43","#8a674d","#e4bd78","#ffedbb"],
    pulse:["#432d4d","#ba416d","#ff8b72","#fff2a3"]
  };
  const nativeHeight=FieldCombat.nativeHeight;
  const clamp=t=>Math.max(0,Math.min(1,t));
  function sheet(id){
    if(id!=="archer"&&!Object.hasOwn(nativeHeight,id))return null;
    if(!sheets.has(id)){
      const im=new Image();im.onload=()=>window.dispatchEvent(new Event("level-art-ready"));
      im.src=new URL(id==="archer"?"krosos/fighters.png":"field-enemies/"+id+".png",root);sheets.set(id,im);
    }
    return sheets.get(id);
  }
  function preload(enemies,devices){
    for(const id of new Set(enemies.map(e=>e.id)))sheet(id);
    if(devices.length)sheet("watcher");
    globalThis.PixelFX?.preload();
  }
  function sprite(g,id,frame,x,y,left,height,flash=false){
    const im=sheet(id);if(!im?.naturalWidth)return false;
    g.save();g.translate(Math.round(x*2)/2,Math.round(y*2)/2);
    const k=height/(nativeHeight[id]||96);g.scale(left?k:-k,k);g.imageSmoothingEnabled=false;
    const bow=id==="archer",w=bow?144:224,h=bow?104:152,foot=bow?100:133;
    const sx=bow?144*frame:frame%8*w,sy=bow?104:Math.floor(frame/8)*h;
    if(flash){
      const key=id+":"+frame;
      if(!hitCells.has(key)){
        const c=document.createElement("canvas");c.width=w;c.height=h;
        const ink=c.getContext("2d");ink.drawImage(im,sx,sy,w,h,0,0,w,h);
        ink.globalCompositeOperation="source-atop";ink.fillStyle="#fff4c6b8";ink.fillRect(0,0,w,h);
        hitCells.set(key,c);
      }
      g.drawImage(hitCells.get(key),-w/2,-foot);
    }else g.drawImage(im,sx,sy,w,h,-w/2,-foot,w,h);
    g.restore();return true;
  }
  function draw(e,x,y,facing,time){
    const config=FieldCombat.profile(e.id,e.kind),height=e.headHeight?config.height*SCALE:JumpPhysics.headHeight*SCALE+1;
    return sprite(ctx,e.id,FieldCombat.posture(e,time),x,y,FieldCombat.direction(e,facing),height,time-(e.hitAt??-Infinity)<.065);
  }
  // Build the same pixel-cut ribbons used by machine weapons once per phase.
  // An overlapping crowd then costs a single draw per active weapon.
  function stroke(ink,index,colors=palettes[ink]){
    const key=colors[0]+ink+index;if(strokes.has(key))return strokes.get(key);
    const c=document.createElement("canvas");c.width=88;c.height=56;const g=c.getContext("2d");
    g.scale(2,2);const t=index/5;
    if(ink==="stone"){
      for(let i=0;i<5;i++){
        const x=4+i*7,y=23-(i%2)*4*Math.sin(t*Math.PI),h=6+(i%3)*3;
        PixelFX.fill([[x-3,y],[x+1,y-h],[x+5,y-h-2],[x+3,y+1]],colors[1],g);
        PixelFX.fill([[x,y-2],[x+2,y-h],[x+4,y-h-1]],colors[3],g);
      }
      PixelFX.ribbon(3,18,36,6,-1.08,1.5,3,colors,g);
    }else{
      const a=-1.55+.74*t;
      PixelFX.ribbon(3,13,35,12,a,1.98,6,colors,g);
      PixelFX.ribbon(3,15,31,10,a+.25,1.65,2.4,colors,g);
      if(ink==="claw")PixelFX.ribbon(3,17,26,9,a+.44,1.53,2.4,colors,g);
    }
    strokes.set(key,c);return c;
  }
  function warning(x,y,dir,reach,p,colors){
    const length=reach*SCALE;ctx.save();ctx.translate(x,y);ctx.scale(dir,1);
    ctx.fillStyle=colors[1];for(let i=3;i<length;i+=4)ctx.fillRect(i,-1,2,1);
    ctx.fillStyle=p>.7?colors[3]:colors[2];ctx.fillRect(Math.round(length)-1,-2,2,2);
    const r=1+Math.floor(p*2);ctx.fillRect(5-r,-9,2*r+1,1);ctx.fillRect(5,-9-r,1,2*r+1);
    ctx.restore();
  }
  function cues(e,x,y,hostile=true){
    const c=FieldCombat.attackProfile(e),color=hostile?palettes[c.ink]:["#264555","#4a8aaa","#94d8e5","#f0ffed"];
    const reach=e.headHeight?(c.fullReach??c.reach):c.reach;
    if(e.swing==="tell")warning(x,y,e.swingDir,reach,clamp(1-e.swingTime/c.windup),color);
    if(e.swing==="cut"&&(!e.swingSkill||e.swingSkill===c.skill)){
      const t=clamp(1-e.swingTime/c.active);
      const height=e.headHeight?29:20;
      const width=reach*SCALE*1.13,stone=c.ink==="stone";
      const drawn=c.ink!=="claw"&&globalThis.EffectLibrary?.draw(ctx,stone?"shockwave":"slash",
        x+e.swingDir*width*.46,stone?y:y-height*.42,
        {progress:t,width,height:height*(stone?1.65:1.35),dir:e.swingDir,hostile});
      if(!drawn){
        ctx.save();ctx.translate(x,y);ctx.scale(e.swingDir,1);
        ctx.drawImage(stroke(c.ink,Math.min(5,Math.floor(t*6)),color),0,-height+3,width,height);ctx.restore();
      }
    }
    if(c.draw){
      const compact=!e.headHeight&&!c.fixedPort,yy=y-(compact?.42:c.portY)*SCALE;
      const d=e.aimDir||(e.release>0?e.shotDir:0);if(!d)return;
      const start=x+(compact?0:d*c.portX*SCALE);
      if(e.aimDir){
        const t=clamp(1-e.aim/c.draw),end=c===FieldCombat.profiles.watcher?41:22;
        ctx.fillStyle=color[1];for(let i=3;i<=end;i+=5)ctx.fillRect(Math.round(start+d*i),Math.round(yy),2,.5);
        ctx.fillStyle=color[2];ctx.fillRect(start-1,yy-1,2,2);if(t>.5){ctx.fillRect(start-2,yy,5,.7);ctx.fillRect(start,yy-2,.7,4)}
      }else if(e.release>.07){
        ctx.save();ctx.translate(start,yy);ctx.scale(-d,1);
        PixelFX.muzzle(0,0,0,(e.release-.07)*3.5,color);ctx.restore();
      }
    }
  }
  function projectile(a){
    const x=Math.round(a.x*SCALE),y=Math.round(FLOOR-a.y*SCALE),colors=a.hostile===false?["#264555","#4a8aaa","#94d8e5","#f0ffed"]:(palettes[a.ink]||palettes.arrow);
    ctx.save();ctx.translate(x,y);ctx.scale(a.dir,1);
    const trail=Math.min(a.ink==="pulse"?19:12,Math.round(a.age*a.speed*SCALE));
    ctx.fillStyle=colors[1];ctx.fillRect(-trail,-.5,trail,1);
    if(a.ink==="pulse"){
      PixelFX.fill([[-7,0],[-2,-2],[3,0],[-2,2]],colors[2]);ctx.fillStyle=colors[3];ctx.fillRect(-3,-.5,5,1);
    }else{
      ctx.fillStyle=colors[2];ctx.fillRect(-7,-.5,7,1);ctx.fillRect(-7,-2,2,1);ctx.fillRect(-7,1,2,1);
      PixelFX.fill([[-2,-2],[3,0],[-2,2]],colors[3]);
    }
    ctx.restore();
  }
  function watcher(s,time,playerX){
    const x=s.x*SCALE,y=FLOOR-s.baseY*SCALE,left=s.aimDir?s.aimDir<0:s.release>0?s.shotDir<0:playerX<s.x;
    const n=s.release>0?14+Math.min(4,Math.floor((.22-s.release)*22)):s.aimDir?8+Math.floor(clamp(1-s.aim/.85)*4):Math.floor(time*4)%8;
    sprite(ctx,"watcher",n,x,y,left,1.26*SCALE);cues(s,x,y);
  }
  function hit(effect){
    const t=effect.age/effect.life,ink=effect.txt==="pulse"?"pulse":"arrow";
    const x=Math.round(effect.x*SCALE),y=Math.round(FLOOR-effect.y*SCALE);
    PixelFX.stamp(ink==="pulse"?"fire":"cut",x,y+4,t,13*(1-t*.4));
    const r=Math.max(1,Math.round(4*(1-t)));
    ctx.fillStyle=effect.hostile===false?"#94d8e5":palettes[ink][2];
    ctx.fillRect(x-r,y,r*2+1,1);ctx.fillRect(x,y-r,1,r*2+1);
  }
  return {sheet,preload,sprite,draw,cues,projectile,watcher,hit};
})();
