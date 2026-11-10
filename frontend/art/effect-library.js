// Shared sprite library. Coordinates and sizes are logical pixels in the caller's canvas.
globalThis.EffectLibrary=(()=>{
  "use strict";
  const root=new URL("effects/",document.currentScript.src);
  const cell=160;
  // row, first cel, count, duration in seconds, wrap, normalized contact point
  function clip(label,row,first,count,seconds,loop=false,pivotX=.5,pivotY=.5){
    return Object.freeze({label,row,first,count,seconds,loop,pivotX,pivotY});
  }
  const clips=Object.freeze({
    waterArrow:clip("水箭 · 飞行",0,0,4,.25,true,.90,.5),
    waterHit:clip("水箭 · 迸裂",0,4,2,.17),
    burn:clip("燃烧",1,0,6,.48,true,.5,.82),
    slash:clip("斩击",2,0,6,.23),
    shockwave:clip("钢岩冲击",3,0,6,.32,false,.5,.78),
    shield:clip("护盾 · 环绕",4,0,4,.72,true),
    shieldBreak:clip("护盾 · 破碎",4,4,2,.20),
    shadeAura:clip("分身 · 残影",5,0,4,.48,true,.5,.78),
    shadeStrike:clip("分身 · 跃击",5,4,2,.20),
    airStep:clip("二段跳 · 破空",6,0,6,.33),
    returningBlade:clip("回旋潮刃",7,0,6,.32,true),
    stompHit:clip("跃击 · 命中",8,0,6,.27)
  });
  const sheets=new Map();
  function sheet(hostile){
    const key=hostile?"hostile":"allied";
    if(!sheets.has(key)){
      const image=new Image();
      image.src=new URL(key+".png",root);
      sheets.set(key,image);
    }
    return sheets.get(key);
  }
  function preload(){sheet(false);sheet(true)}
  function draw(g,id,x,y,{age=0,progress,width=40,height=width,dir=1,hostile=false,alpha=1}={}){
    const art=clips[id];
    if(!art||width<=0||height<=0||alpha<=0)return false;
    const image=sheet(hostile);
    if(!image.naturalWidth)return false;
    let phase=progress;
    if(phase===undefined){
      phase=Math.max(0,age)/art.seconds;
      if(art.loop)phase%=1;
      else if(phase>=1)return false;
    }
    const cel=art.first+Math.min(art.count-1,Math.floor(Math.max(0,phase)*art.count));
    // Preserve the arena's zoom/pan and snap the pivot to its physical pixel grid.
    const m=g.getTransform();
    const px=Math.round(m.a*x+m.c*y+m.e),py=Math.round(m.b*x+m.d*y+m.f);
    const sx=Math.hypot(m.a,m.b),sy=Math.hypot(m.c,m.d),face=dir<0?-1:1;
    if(!sx||!sy)return false;
    const w=Math.max(1,Math.round(width*sx)),h=Math.max(1,Math.round(height*sy));
    g.save();
    g.setTransform(face*m.a/sx,face*m.b/sx,m.c/sy,m.d/sy,px,py);
    g.imageSmoothingEnabled=false;g.globalAlpha*=Math.min(1,alpha);
    g.drawImage(image,cel*cell,art.row*cell,cell,cell,-Math.round(w*art.pivotX),-Math.round(h*art.pivotY),w,h);
    g.restore();return true;
  }
  return Object.freeze({clips,preload,draw});
})();
