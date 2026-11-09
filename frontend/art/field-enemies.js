globalThis.FieldArt=(()=>{
  const root=new URL(".",document.currentScript.src);
  const sheets=new Map(),strokes=new Map();

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
  function sprite(g,id,frame,x,y,left,height){
    const im=sheet(id);if(!im?.naturalWidth)return false;
    g.save();g.translate(Math.round(x*2)/2,Math.round(y*2)/2);
    const k=height/(nativeHeight[id]||96);g.scale(left?k:-k,k);g.imageSmoothingEnabled=false;
    if(id==="archer")g.drawImage(im,144*frame,104,144,104,-72,-100,144,104);
    else g.drawImage(im,frame%8*224,Math.floor(frame/8)*152,224,152,-112,-133,224,152);
    g.restore();return true;
  }
  function draw(e,x,y,facing,time){
    const config=FieldCombat.profile(e.id,e.kind),height=e.headHeight?config.height*SCALE:JumpPhysics.headHeight*SCALE+1;
    return sprite(ctx,e.id,FieldCombat.posture(e,time),x,y,FieldCombat.direction(e,facing),height);
  }
  // Build the same pixel-cut ribbons used by machine weapons once per phase.
  // An overlapping crowd then costs a single draw per active weapon.
  function stroke(ink,index){
    const key=ink+index;if(strokes.has(key))return strokes.get(key);
    const c=document.createElement("canvas");c.width=80;c.height=40;const g=c.getContext("2d"),colors=palettes[ink];
    g.scale(2,2);const t=index/5;
    if(ink==="stone"){
      for(let i=0;i<5;i++){
        const x=7+i*6,y=15-(i%2)*5*Math.sin(t*Math.PI);
        PixelFX.fill([[x-2,y],[x,y-3-i%2],[x+2,y-1],[x+1,y+1]],i%2?colors[1]:colors[2],g);
      }
      PixelFX.ribbon(3,17,32,8,-1.08,1.05,3,colors,g);
    }else{
      PixelFX.ribbon(3,14,31+2*t,9,-1.62+.35*t,1.48,4.5,colors,g);
      if(ink==="claw")PixelFX.ribbon(2,18,29,8,-1.5+.35*t,1.3,3,colors,g);
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
  function cues(e,x,y){
    const c=FieldCombat.profile(e.id,e.kind),color=palettes[c.ink],reach=e.headHeight?(c.fullReach??c.reach):c.reach;
    if(e.swing==="tell")warning(x,y,e.swingDir,reach,clamp(1-e.swingTime/c.windup),color);
    if(e.swing==="cut"){
      const t=clamp(1-e.swingTime/c.active);ctx.save();ctx.translate(x,y);ctx.scale(e.swingDir,1);
      ctx.drawImage(stroke(c.ink,Math.min(5,Math.floor(t*6))),0,-17,reach*SCALE*1.12,18);ctx.restore();
    }
    if(e.kind==="bow"||e.id==="watcher"){
      const compact=!e.headHeight&&e.id!=="watcher",yy=y-(compact?.42:c.portY)*SCALE;
      const d=e.aimDir||(e.release>0?e.shotDir:0);if(!d)return;
      const start=x+(compact?0:d*c.portX*SCALE);
      if(e.aimDir){
        const t=clamp(1-e.aim/c.draw),end=e.id==="watcher"?41:22;
        ctx.fillStyle=color[1];for(let i=3;i<=end;i+=5)ctx.fillRect(Math.round(start+d*i),Math.round(yy),2,.5);
        ctx.fillStyle=color[2];ctx.fillRect(start-1,yy-1,2,2);if(t>.5){ctx.fillRect(start-2,yy,5,.7);ctx.fillRect(start,yy-2,.7,4)}
      }else if(e.release>.10){PixelFX.flare(start,yy,3+e.release*12,color[2])}
    }
  }
  function projectile(a){
    const x=Math.round(a.x*SCALE),y=Math.round(FLOOR-a.y*SCALE),colors=palettes[a.ink]||palettes.arrow;
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
    PixelFX.stamp(ink==="pulse"?"fire":"cut",effect.x*SCALE,FLOOR-effect.y*SCALE+4,t,13*(1-t*.4));
  }
  return {sheet,preload,sprite,draw,cues,projectile,watcher,hit};
})();
