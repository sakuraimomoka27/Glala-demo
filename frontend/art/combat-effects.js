// Draw in the same logical pixels as the actors. Only the featured drop needs a miniature.
globalThis.CombatArt=(()=>{
  const reduced=globalThis.matchMedia?.("(prefers-reduced-motion: reduce)");
  const plumeURL=new URL("jump-plumes.png",document.currentScript.src);
  let plumeSheet;
  function preloadPlumes(){
    if(plumeSheet)return;
    plumeSheet=new Image();plumeSheet.src=plumeURL;
  }
  const shakeButton=document.getElementById("camera-shake"),preference="ashen:combat-camera-shake";
  let shakeOverride=null;
  try{
    const saved=localStorage.getItem(preference);
    if(saved==="on"||saved==="off")shakeOverride=saved==="on";
  }catch{}
  const shakeEnabled=()=>shakeOverride??!reduced?.matches;
  function syncShakeButton(){
    if(!shakeButton)return;
    shakeButton.textContent="震动："+(shakeEnabled()?"开":"关");
    shakeButton.setAttribute("aria-pressed",String(shakeEnabled()));
    shakeButton.title=shakeOverride===null&&reduced?.matches?"系统当前偏好减少动态效果，点击可开启战斗震动":"切换战斗镜头震动";
  }
  if(shakeButton){
    shakeButton.onclick=()=>{
      shakeOverride=!shakeEnabled();
      try{localStorage.setItem(preference,shakeOverride?"on":"off")}catch{}
      syncShakeButton();screenCanvas.focus();
    };
    syncShakeButton();reduced?.addEventListener?.("change",syncShakeButton);
  }
  let picturedItem=null,miniature=null,captionWidth=0;
  function star(x,y,r,color){
    box(ctx,x-r,y,2*r+1,1,color);box(ctx,x,y-r,1,2*r+1,color);
    if(r>2)box(ctx,x-1,y-1,3,3,color);
  }
  const inks={
    stomp:["#25414c","#277d88","#76e0d1","#ffffda"], wave:["#533844","#b67646","#ffd475","#ffface"],
    core:["#533146","#dd6a3f","#ffd063","#ffffdb"], armor:["#394052","#677b91","#b4d6d9","#fff1bc"],
    block:["#514435","#9c763c","#eec463","#fffbd4"], wound:["#471d39","#aa354f","#ff755d","#fff2c4"],
    burn:["#512538","#c5493a","#ffae46","#fff0ad"], shot:["#153d60","#297ea0","#78e3ff","#ebffff"],
    slash:["#4c394e","#ac8758","#ffe180","#ffffe0"], blade:["#334153","#71948c","#aedcc0","#ffed9f"],
    shadow:["#34274f","#774aad","#c899ed","#f2e5ff"]
  };
  const cells=new Map(),turn=Math.PI*2;
  const elementalStamps={burn:"fire",shot:"water",slash:"cut",shadow:"shade",core:"fire"};
  // Rasterise each contact frame once into a transparent tile at battle density.
  // Long splinters follow the blow; the opposite lip and outline survive pale backgrounds.
  function contactCell(style,frame){
    const key=style+frame;if(cells.has(key))return cells.get(key);
    const sheet=document.createElement("canvas");sheet.width=sheet.height=160;
    const g=sheet.getContext("2d");g.scale(2,2);g.translate(40,40);
    const c=inks[style]||inks.stomp,t=frame/7,spread=1-(1-t)**2;
    const downward=["stomp","core","wave"].includes(style),metal=style==="armor"||style==="block";
    const cuts=style==="wound"||style==="slash"||style==="blade";
    function shard(x,y,dx,dy,w,color){
      const length=Math.hypot(dx,dy)||1,nx=-dy/length*w,ny=dx/length*w;
      PixelFX.fill([[x,y],[x+dx*.29+nx,y+dy*.29+ny],[x+dx,y+dy],[x+dx*.27-nx,y+dy*.27-ny]],color,g);
    }
    if(frame<=4){
      const r=(frame===0?9:15)*(1-t*.72);
      for(let i=0;i<8;i++){
        const a=i*turn/8+(cuts?-.53:.11),length=r*(i%2?.54:1)*(i===0&&cuts?1.6:1);
        const dx=Math.cos(a)*length,dy=Math.sin(a)*length;
        shard(0,0,dx,dy,3.4*(1-t),c[0]);shard(0,0,dx*.89,dy*.89,2.6*(1-t),c[2]);
      }
      shard(-4,2,10,-4,3,c[3]);shard(1,4,-2,-10,2,c[3]);
    }
    if(downward||metal||style==="shot"){
      const rx=5+24*spread,ry=(metal?.72:downward?.25:.54)*rx;
      for(let i=0;i<4;i++){
        const start=i*turn/4+t*.45;
        PixelFX.ribbon(0,0,rx,ry,start,Math.max(.25,1.25-t*.8),Math.max(1,3.5*(1-t)),[c[0],c[1],c[2],c[2]],g);
      }
    }
    for(let i=0;i<(metal?7:10);i++){
      const angle=downward?Math.PI+(i+.45)*Math.PI/10: i*2.40-.40;
      const ux=Math.cos(angle),uy=Math.sin(angle);
      const distance=(4+spread*(13+(i*13)%17)),gravity=t*t*(style==="burn"?-7:7);
      const x=distance*ux,y=distance*uy+gravity,length=(3+(i%3)*2)*(1-.66*t);
      shard(x,y,ux*length,uy*length,1.8*(1-.45*t),c[i%3===0?3:2]);
      if(i%3===1)shard(x-ux*3,y-uy*3,ux*2,uy*2,1,c[1]);
    }
    if(cuts)for(let i=-1;i<=1;i++)shard(-12+8*t+i*3,6+i*4,22*(1-t)+3,-12*(1-t)-2,2*(1-t)+.5,c[i===0?3:2]);
    cells.set(key,sheet);return sheet;
  }
  function burst(e){
    const t=Math.min(.999,e.age/e.life),frame=Math.floor(t*8),scale=e.radius*(reduced?.matches ? .78 : 1);
    const x=Math.round(e.x*SCALE),y=Math.round(FLOOR-e.y*SCALE);
    const hitClip=hitClips[e.txt];
    if(hitClip&&EffectLibrary.draw(ctx,hitClip,x,y,{progress:t,width:40*scale,dir:e.dir,hostile:e.hostile,alpha:Math.min(1,(1-t)*4)})){
      if(e.txt==="core")PixelFX.stamp("fire",x,y+6,t,42*scale,e.dir<0);
      return;
    }
    const stamp=elementalStamps[e.txt];
    if(stamp)PixelFX.stamp(stamp,x,y+6,t,Math.round((e.txt==="core"?54:34)*scale),e.dir<0);
    ctx.save();ctx.translate(x,y);ctx.scale(e.dir<0?-scale:scale,scale);
    ctx.globalAlpha=t>.73?Math.max(0,(1-t)/.27):1;
    ctx.drawImage(contactCell(e.txt,frame),-40,-40,80,80);ctx.restore();
  }
  const hitClips={stomp:"stompHit",core:"stompHit",shot:ProjectileEffects.definitions.shot.impactClip,shadow:"shadeStrike",burn:"burn",slash:"slash",blade:"waterHit"};
  const plumeTiming={
    takeoffCloud:[.08,.22,.43,.65,.84,1],landingCloud:[.11,.27,.51,.73,.89,1]
  };
  function plume(e,actorScale){
    const t=Math.min(.999,e.age/e.life),takeoff=e.kind==="takeoffCloud";
    const frame=plumeTiming[e.kind].findIndex(end=>t<end);
    const row=e.txt==="surface"?0:e.txt==="ground"?1:2;
    const x=e.x*SCALE,y=FLOOR-e.y*SCALE;
    if(takeoff&&e.txt==="air"){
      const width=178*e.radius*actorScale;
      if(EffectLibrary.draw(ctx,"airStep",x,y,{progress:t,width,dir:e.dir,alpha:Math.min(1,(1-t)*5)}))return;
    }
    if(!plumeSheet?.naturalWidth){
      if(!takeoff)PixelFX.ring(x,y,3+28*t*e.radius,2+2*t,"#eed8ad");
      return;
    }
    // Snap the pivot in backing pixels, also on zoomed and vertically scrolling stages.
    const m=ctx.getTransform(),cx=Math.round(m.a*x+m.c*y+m.e),cy=Math.round(m.b*x+m.d*y+m.f);
    const width=Math.round((takeoff?84*actorScale:110)*e.radius*Math.hypot(m.a,m.b));
    const height=Math.round(width/2),opacity=e.txt==="air" ? .73 : 1;
    ctx.save();ctx.setTransform(e.dir<0?-1:1,0,0,1,cx,cy);ctx.imageSmoothingEnabled=false;
    ctx.globalAlpha=opacity*Math.min(1,(1-t)/.18);
    const anchor=row===2?78:96;
    ctx.drawImage(plumeSheet,frame*224,row*112,224,112,-Math.round(width/2),-Math.round(height*anchor/112),width,height);
    ctx.restore();
  }
  function descent(p,x,y,small){
    if(p.grounded||p.vy>=-4||p.grace>1.12)return;
    const force=Math.min(1,(-p.vy-4)/6),height=small?16:29;
    ctx.save();ctx.globalAlpha=.45+force*.36;
    for(const side of [-1,1]){
      const dx=side*(small?5:9);
      PixelFX.fill([[x+dx,y-2],[x+dx+side*2,y-height*.55],[x+dx+side*1.5-p.dir*2,y-height*(1+force*.8)]],"#94d9cb");
    }
    ctx.restore();
  }
  function wave(e){
    const t=e.age/e.life,x=e.x*SCALE,y=FLOOR-e.y*SCALE,r=Math.max(3,e.radius*SCALE*t);
    const width=2.12*e.radius*SCALE;
    if(EffectLibrary.draw(ctx,"shockwave",x,y,{progress:t,width,height:Math.min(width,92),hostile:e.hostile,alpha:Math.min(1,(1-t)*5)}))return;
    ctx.save();ctx.globalAlpha=Math.min(1,(1-t)*5);
    PixelFX.ring(x,y,r,3+4*Math.sin(t*Math.PI),"#dcaa68");
    for(const s of [-1,1]){
      const xx=x+s*r;
      PixelFX.fill([[xx-s*13,y],[xx-s*7,y-3],[xx-s*11,y-9],[xx-s*3,y-6],[xx+s*1,y-13*(1-t)],[xx+s*3,y]],"#a66447");
      PixelFX.fill([[xx-s*9,y-1],[xx-s*4,y-4],[xx-s*5,y-7],[xx+s*2,y-2]],e.color);
      box(ctx,xx-1,y-3,3,2,"#fff3c0");
    }
    ctx.restore();
  }
  let lastDrawnKick=null,firstDrawAge=0;
  function shake(kick){
    if(!kick||!shakeEnabled())return;
    // Several physics steps can precede a display frame. Show the initial impact
    // at full strength once, then let it settle within the original time window.
    if(kick!==lastDrawnKick){lastDrawnKick=kick;firstDrawAge=kick.age}
    const t=Math.min(1,(kick.age-firstDrawAge)/Math.max(.001,kick.life-firstDrawAge));
    const gain=kick.power*(1-t)**1.4*screenCanvas.width/W;
    const vertical=kick.axis==="drop";
    const dx=Math.round(kick.dir*gain*Math.cos(t*15)*(vertical ? .29 : 1));
    const dy=vertical
      ? Math.round(gain*Math.cos(t*13))
      : Math.round(gain*Math.cos(t*19+.4)*.76);
    if(!dx&&!dy)return;
    // Shift the finished native frame after the active room's pan and zoom.
    // Extend the edge pixel into the exposed border; DOM controls keep their positions.
    const w=screenCanvas.width,h=screenCanvas.height;
    ctx.save();ctx.resetTransform();ctx.imageSmoothingEnabled=false;
    ctx.drawImage(screenCanvas,dx,dy);
    if(dx){const edge=dx>0?dx:w+dx-1;ctx.drawImage(screenCanvas,edge,0,1,h,dx>0?0:w+dx,0,Math.abs(dx),h)}
    if(dy){const edge=dy>0?dy:h+dy-1;ctx.drawImage(screenCanvas,0,edge,w,1,0,dy>0?0:h+dy,w,Math.abs(dy))}
    ctx.restore();
  }
  let hurtSprite;
  function glala(p,x,y,role,pose,scale,time){
    const age=time-(p.hurtAt??-Infinity);
    if(age<.16){
      hurtSprite??=document.createElement("canvas");
      if(hurtSprite.width!==80){hurtSprite.width=80;hurtSprite.height=80}
      const g=hurtSprite.getContext("2d");g.clearRect(0,0,80,80);
      g.save();g.scale(2,2);
      GlalaArt.drawActor(g,20,37,p.dir<0,role,{state:age<.07?"land":"recover",phase:age/.16,clock:time});g.restore();
      g.globalCompositeOperation="source-atop";g.fillStyle=age<.055?"#fff2d9ab":"#ed6a665e";
      g.fillRect(0,0,80,80);g.globalCompositeOperation="source-over";
      const recoil=reduced?.matches?0:Math.round(4*(1-age/.16));
      ctx.drawImage(hurtSprite,x-20*scale+p.hurtDir*recoil,y-37*scale-recoil*.5,40*scale,40*scale);
    }else{
      ctx.save();if(p.grace>0&&Math.floor(time*12)%2===0)ctx.globalAlpha=.65;
      GlalaArt.drawActor(ctx,x,y,p.dir<0,role,pose,scale);ctx.restore();
    }
  }
  function drop(e,viewLeft=0){
    const item=e.item,rank=item.rank,t=e.age/e.life,quiet=reduced?.matches;
    const x=Math.round(e.x*SCALE),ground=Math.round(FLOOR-e.y*SCALE);
    // Let the contact silhouette read before the nameplate and miniature rise.
    const reveal=e.age-.105;
    if(reveal<0){box(ctx,x-2,ground-1,5,1,e.color);return}
    const rise=quiet?1:Math.min(1,reveal/.16);
    const h=Math.round([6,9,24,38,51][rank]*rise);
    const apex=ground-h,crest=rank===4?"#fff3bd":"#fff0d0";
    ctx.save();ctx.globalAlpha=Math.min(1,(1-t)*8);
    if(rank>=2){
      // Stepped edges stay crisp against both pale moonlight and dark masonry.
      ctx.fillStyle=e.color;ctx.globalAlpha*=.21;
      ctx.fillRect(x-(rank+1),apex+6,rank*2+3,Math.max(1,h-6));
      ctx.globalAlpha=Math.min(1,(1-t)*8);
      box(ctx,x-1,apex,3,h,e.color);box(ctx,x,apex+2,1,Math.max(1,h-2),crest);
      if(rank>=3){
        for(const side of [-1,1]){
          box(ctx,x+side*5,apex+10,1,Math.max(1,h-13),e.color);
          box(ctx,x+side*7,apex+7,2,4,e.color);
        }
        star(x,apex,rank===4?5:3,crest);
      }
      if(rank===4){
        for(const side of [-1,1]){
          box(ctx,x+side*8-1,apex-3,3,2,e.color);
          box(ctx,x+side*6-1,apex,3,2,crest);
          box(ctx,x+side*4-1,apex+3,3,2,e.color);
        }
        box(ctx,x-11,ground-1,23,1,e.color);
      }
      const phase=quiet?0:Math.floor(e.age*8);
      for(let j=0;j<rank;j++){
        const py=ground-4-(j*9+phase*2)%Math.max(1,h);
        box(ctx,x+(j%2?1:-1)*(7+j*2),py,j===rank-1?2:1,2,e.color);
      }
    }else{
      box(ctx,x,apex,1,h,e.color);star(x,apex,rank+1,e.color);
    }
    const jump=quiet?0:Math.round(Math.sin(Math.min(1,reveal/.48)*Math.PI)*12);
    ctx.textAlign="center";ctx.font="bold 8px SimSun,monospace";
    if(picturedItem!==item){
      picturedItem=item;captionWidth=Math.min(W-8,Math.ceil(ctx.measureText(e.txt).width)+12);
      if(rank>=2){miniature??=document.createElement("canvas");EchoIcon.draw(miniature,item)}
    }
    if(rank>=2){
      const size=rank===4?18:14;ctx.imageSmoothingEnabled=false;
      ctx.drawImage(miniature,x-Math.floor(size/2),ground-size-jump,size,size);
    }else{box(ctx,x-2,ground-jump-3,5,3,e.color);box(ctx,x-1,ground-jump-4,2,2,crest)}
    const cx=Math.max(viewLeft+captionWidth/2+2,Math.min(viewLeft+W-captionWidth/2-2,x));
    const top=Math.max(1,Math.min(ground-20-jump,apex-(rank===4?8:4))-12);
    box(ctx,cx-captionWidth/2,top,captionWidth,12,"#1b1723");
    box(ctx,cx-captionWidth/2,top+11,captionWidth,1,e.color);
    if(rank>=3){box(ctx,cx-captionWidth/2,top,2,10,e.color);box(ctx,cx+captionWidth/2-2,top,2,10,e.color)}
    ctx.fillStyle=rank===4?crest:e.color;ctx.fillText(e.txt,cx,top+9,captionWidth-6);
    ctx.restore();
  }
  return {drop,burst,preloadPlumes,plume,descent,wave,shake,glala};
})();
