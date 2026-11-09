globalThis.KrososArt=(()=>{
  const directory=new URL("krosos/",document.currentScript.src),pictures=new Map();
  const reduced=matchMedia("(prefers-reduced-motion: reduce)");
  const snap=n=>Math.round(n*2)/2;
  function load(name){
    if(pictures.has(name))return;
    const img=new Image();img.src=new URL(name+".png",directory);pictures.set(name,img);
  }
  function preload(){
    for(const name of ["vista","lanes","jetty","pier","float","sluice","trestle","arcade","balcony","gate","awning","mill","wheel","skiff","resident-a","resident-b"]){
      load(name);
    }
  }
  function paint(name,x,y,w,h){
    const img=pictures.get(name);if(!img?.naturalWidth)return false;
    ctx.drawImage(img,snap(x),snap(y),snap(w),snap(h));return true;
  }
  function strip(name,offset,y,w,h){
    const phase=((snap(offset)%w)+w)%w;
    for(let x=-phase;x<W;x+=w)paint(name,x,y,w,h);
  }
  function wheelhouse(x,y,time){
    ctx.save();ctx.globalAlpha=.24;ctx.translate(0,2*y);ctx.scale(1,-1);
    paint("mill",x,y-29,64,29);ctx.restore();
    paint("mill",x,y-41,64,41);
    ctx.save();ctx.translate(snap(x+32),y-12);
    ctx.rotate((Math.floor(time*9)%160)*Math.PI/80);paint("wheel",-13,-13,26,26);ctx.restore();
    ctx.fillStyle="#a3c4a8";ctx.fillRect(snap(x+1),y,26,.5);ctx.fillRect(snap(x+41),y,18,.5);
  }
  function waterside(left,lift,time){
    strip("vista",left*.23+47,-2+lift*.08,596,H+4);
    const mid=left*.57,period=451;
    for(let i=Math.floor(mid/period)-1;i<=Math.ceil((mid+W)/period);i++){
      const x=i*period-mid;
      paint("skiff",x+161,122+Math.sin(time+i)*.65,37,27);
      wheelhouse(x+333,154,time);
    }
    ctx.fillStyle="#afdbd7";ctx.globalAlpha=.5;
    for(let i=0;i<37;i++){
      const x=((i*83+Math.floor(time*5)*(1+i%2)-Math.floor(left*.74))%628+628)%628;
      ctx.fillRect(x,145+(i*17)%46,2+i%5,.5);
    }
    ctx.globalAlpha=1;
  }
  function stage(p){
    const x=snap(p.left*SCALE),w=snap(p.right*SCALE)-x,y=snap(FLOOR-p.y*SCALE),waterline=FLOOR+13;
    if(p.art==="float"){
      const hull=waterline-8;
      paint("float",x-1,hull,w+2,9);
      paint("trestle",x,y,w,hull-y+2);
    }else if(p.art==="pier")paint("pier",x,y,w,waterline-y);
    else{
      const h=p.art==="arcade"?Math.min(w*.57,waterline-y):Math.min(w*.54,waterline-y);
      if(y+h<waterline)for(const end of [x+1,x+w-w*.18-1])paint("pier",end,y+h-3,w*.18,waterline-y-h+3);
      paint(p.art,x,y,w,h);
    }
    ctx.fillStyle="#f2cf90";ctx.fillRect(x+1,y,w-2,.75);
  }
  function dock(d){
    const start=snap(d.left*SCALE),end=snap(d.right*SCALE);
    const count=Math.max(1,Math.round((end-start)/88));
    for(let i=0;i<count;i++){
      const x=snap(start+i*(end-start)/count),to=snap(start+(i+1)*(end-start)/count);
      paint("jetty",x,FLOOR,to-x,23);
      ctx.save();ctx.globalAlpha=.16;ctx.translate(0,2*(FLOOR+23));ctx.scale(1,-1);
      paint("jetty",x,FLOOR,to-x,23);ctx.restore();
    }
  }
  function sluice(port,ready){
    const x=port.x*SCALE,y=FLOOR-port.y*SCALE;
    if(!ready){
      ctx.fillStyle="#343d3b";ctx.fillRect(snap(x-14),snap(y-42),28,42);
      for(let i=-13;i<=13;i+=5){ctx.fillStyle="#a18358";ctx.fillRect(snap(x+i),snap(y-44),1.5,44)}
    }
    paint("sluice",x-56,y-91,112,91);
    for(const dir of [-1,1]){
      ctx.fillStyle=ready?"#ffdd85":"#a15a4c";ctx.fillRect(snap(x+dir*32),snap(y-47),2.5,3);
    }
  }
  function street(door,left,lift,time){
    const base=door.streetStart*SCALE,local=left-base;
    strip("lanes",local*.52+14,-1+lift*.13,596,H);
    ctx.fillStyle="rgba(86,82,78,.10)";ctx.fillRect(0,0,W,FLOOR);
    ctx.translate(-left,lift);
    const period=door.streetBlock*SCALE;
    const first=Math.max(0,Math.floor(local/period)),last=Math.floor((local+W+24)/period);
    for(let i=first;i<=last;i++){
      const x=base+i*period;
      if(i%2===0){
        paint("awning",x-21,FLOOR-82,86,82);
        const b=Math.floor(time*.63+i)%2,wide=b?19:16;
        paint(b?"resident-b":"resident-a",x+6.1*SCALE-wide/2,FLOOR-48,wide,48);
      }else paint("gate",x+18.6*SCALE,FLOOR-78,64,78);
    }
    for(let x=base+Math.floor(local/104)*104;x<left+W;x+=104)LevelPaint.terrain(ctx,"plinth",x,FLOOR,104,FLOOR);
    ctx.fillStyle="#d6b98c";ctx.fillRect(left,FLOOR,W,1);
    for(const p of door.platforms){
      if(p.left<door.streetStart||p.right*SCALE<left||p.left*SCALE>left+W)continue;
      const x=p.left*SCALE,y=FLOOR-p.y*SCALE,w=(p.right-p.left)*SCALE;
      paint(p.art,x,y,w,FLOOR-y);
    }
    if(!door.loopBiome){
      const x=door.x*SCALE;
      paint("gate",x-36,FLOOR-88,72,88);
      for(const side of [-1,1]){
        ctx.fillStyle="#4f4038";ctx.fillRect(snap(x+side*28-2),FLOOR-48,4,7);
        ctx.fillStyle="#ffe0a2";ctx.fillRect(snap(x+side*28-1),FLOOR-47,2,4);
      }
    }
  }
  function begin(door,p,clock,ready){
    const inside=p.x>=door.streetStart;
    const start=inside?door.streetStart*SCALE:0,end=(inside?door.width:door.streetStart)*SCALE;
    const left=snap(Math.min(end-W,Math.max(start,p.x*SCALE-W*.4)));
    const lift=snap(Math.min(58,Math.max(0,(p.y-1.55)*14,33-(FLOOR-p.y*SCALE))));
    const time=reduced.matches?0:clock;
    ctx.imageSmoothingEnabled=false;ctx.fillStyle=inside?"#a5937b":"#7fafba";ctx.fillRect(0,0,W,H);
    if(inside){street(door,left,lift,time);return left}
    waterside(left,lift,time);ctx.translate(-left,lift);
    for(const d of door.decks)if(d.right*SCALE>=left&&d.left*SCALE<=left+W)dock(d);
    for(const p of door.platforms)if(p.left<door.streetStart&&p.right*SCALE>=left&&p.left*SCALE<=left+W)stage(p);
    if(door.loopBiome!=="water"&&door.waterGate.x*SCALE+56>left&&door.waterGate.x*SCALE-56<left+W)sluice(door.waterGate,ready);
    return left;
  }
  return {preload,begin};
})();
