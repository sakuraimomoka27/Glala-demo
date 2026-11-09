globalThis.LevelPaint=(()=>{
  const base=new URL(".",document.currentScript.src);
  const sources={cliff:"gorge/rim",canal:"krosos/vista",street:"krosos/lanes",awning:"krosos/awning",
    rock:"gorge/rock",plinth:"gorge/pier",court:"gorge/arch",truss:"gorge/truss",arch:"gorge/arch",pier:"gorge/pier",
    hoist:"gorge/hoist",exit:"gorge/pass",boss:"gorge/prometheus-idle"};
  const images=new Map(),snap=n=>Math.round(n*2)/2;
  const textures=new WeakMap();
  function customImage(asset){
    if(!textures.has(asset)){
      const im=new Image();textures.set(asset,im);
      im.onload=()=>window.dispatchEvent(new Event("level-art-ready"));im.src=asset.png;
    }
    return textures.get(asset);
  }
  function custom(g,asset,x,y,w,base){
    const im=customImage(asset);if(!im.naturalWidth)return;
    const natural=asset.metres*29,h=natural*im.height/im.width;
    if(asset.role==="prop"){g.drawImage(im,snap(x-natural/2),snap(y-h),snap(natural),snap(h));return}
    g.save();g.beginPath();g.rect(x,y,w,Math.max(h,base-y+95));g.clip();
    if(asset.role==="solid"){g.fillStyle="#29232b";g.fillRect(x,y,w,Math.max(h,base-y+95))}
    const transform=g.getTransform(),start=Math.max(0,Math.floor((-transform.e/transform.a-x)/natural));
    const end=Math.min(w,(g.canvas.width-transform.e)/transform.a-x);
    for(let i=start;i*natural<end;i++)g.drawImage(im,snap(x+i*natural),snap(y),snap(natural),snap(h));
    g.restore();
  }
  function load(key){
    if(!images.has(key)){
      const img=new Image();img.src=new URL(sources[key]+".png",base);images.set(key,img);
    }
    return images.get(key);
  }
  function image(g,key,x,y,w,h){
    const im=load(key);if(im.naturalWidth)g.drawImage(im,snap(x),snap(y),snap(w),snap(h));
  }
  function background(g,key,left,w,h,lift=0,assets=[]){
    g.fillStyle=key==="canal"?"#537f83":key==="street"?"#78605b":"#3a303d";g.fillRect(0,0,w,h);
    const asset=assets.find(a=>a.id===key);
    if(asset){
      const im=customImage(asset);if(!im.naturalWidth)return;
      const width=Math.max(1,snap((h+20)*im.width/im.height)),start=snap(left*.24%width);
      for(let x=-start;x<w;x+=width)g.drawImage(im,x,-10+Math.min(8,lift*.1),width,h+20);
      return;
    }
    const period=720,phase=((snap(left*.24)%period)+period)%period;
    for(let x=-phase;x<w;x+=period)image(g,key,x,-10+Math.min(8,lift*.1),period,h+20);
  }
  // Crop repeated bays at their ends. Caps keep their pixel pitch on long spans.
  function terrain(g,key,x,y,w,baseY){
    const im=load(key);if(!im.naturalWidth)return;
    if(key==="plinth"){
      const h=baseY-y+96,step=26,rows=Math.ceil(h/9);
      g.save();g.beginPath();g.rect(x,y,w,h);g.clip();g.fillStyle="#463c42";g.fillRect(x,y,w,h);
      for(let j=0;j<rows;j++)for(let a=x-(j%2)*step/2;a<x+w;a+=step){
        const row=(j+Math.round((a-x)/step)+8)%3;
        g.drawImage(im,im.width*.30,im.height*(.30+row*.1),im.width*.39,im.height*.11,snap(a+.5),snap(y+1+j*9),step-.5,8.5);
      }
      g.restore();
    }else if(key==="pier"){
      const cap=Math.max(3,Math.min(9,w*.21)),h=Math.max(12,baseY-y+16);
      g.drawImage(im,0,im.height*.2,im.width,im.height*.8,snap(x),snap(y+cap),snap(w),snap(h-cap));
      g.drawImage(im,0,0,im.width,im.height*.2,snap(x),snap(y),snap(w),snap(cap));
    }else{
      const natural={rock:104,truss:62,court:86,arch:74}[key]||74;
      const n=Math.max(1,Math.round(w/natural)),bay=w/n;
      const h=key==="rock"?46:key==="truss"?Math.min(15,bay*.23):Math.max(25,Math.min(62,bay*.60));
      for(let i=0;i<n;i++){
        const a=snap(x+i*bay),b=snap(x+(i+1)*bay);
        if(key==="rock"){
          g.fillStyle="#251c27";g.fillRect(a,snap(y+2),b-a,Math.max(44,baseY-y+100));
        }
        if(key==="truss"){
          g.fillStyle="#4b3438";g.fillRect(a+2,snap(y+h-1),2,Math.max(0,baseY-y-h+18));
        }
        image(g,key,a,y,b-a,h);
      }
    }
    g.fillStyle=key==="truss"?"#daad77":"#eec392";g.fillRect(snap(x),snap(y),snap(w),.75);
  }
  function prop(g,key,x,y,ready=false){
    const sizes={hoist:[36,46],awning:[73,68],exit:[55,77]},[w,h]=sizes[key];
    image(g,key,x-w/2,y-h,w,h);
    if(key==="exit")for(const dir of [-1,1]){
      g.fillStyle=ready?"#fff09a":"#bd7453";g.fillRect(snap(x+dir*19),snap(y-40),2,3);
    }
  }
  function actor(g,type,x,y){
    if(type==="start"){GlalaArt.drawActor(g,x,y,false,{}, {state:"idle",clock:0},.55);return}
    if(type==="boss"){image(g,"boss",x-130,y-196,280,210);return}
    const id=LevelMap.palette[type]?.enemy||type,config=FieldCombat.profile(id);
    FieldArt.sprite(g,id,0,x,y,true,config.height*29);
  }
  return {load,background,terrain,prop,actor,custom,customImage};
})();
