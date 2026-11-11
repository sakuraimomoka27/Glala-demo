/* Menu art uses the same source pixel grid as the field. This module does not access the save. */
globalThis.WorldFolio=(()=>{
  const base=new URL(".",document.currentScript.src),images=new Map();
  const chapters=["belfry","thicket","forge","frost","eclipse","cinder"];
  const rigs=["atlas","dione","mnemosyne","prometheus","cronus","hecate"];
  const props=["chests","kiln","instrument","desk"];
  const reduced=matchMedia("(prefers-reduced-motion: reduce)");
  function url(name){return new URL("world-folio/"+name+".png",base).href}
  function load(name,dir="world-folio"){
    const key=dir+"/"+name;
    if(!images.has(key)){const img=new Image();images.set(key,img);img.src=new URL(key+".png",base)}
    return images.get(key);
  }
  function image(name,cls){const el=document.createElement("img");el.alt="";el.className=cls;el.src=url(name);return el}
  function cover(canvas){
    const bg=load("departure"),g=canvas.getContext("2d");canvas.width=704;canvas.height=396;
    canvas.setAttribute("aria-hidden","true");g.imageSmoothingEnabled=false;
    let last=-1000;
    function paint(t){
      if(!canvas.isConnected)return;
      if(t-last>=100||reduced.matches){
        last=t;if(bg.naturalWidth)g.drawImage(bg,0,0,704,396);
        const sec=reduced.matches?0:t/1000;
        GlalaArt.drawActor(g,403,320,false,null,{state:"idle",clock:sec},1.15);
      }
      if(!reduced.matches)requestAnimationFrame(paint);
    }
    // Both images must be ready before freezing a reduced-motion cover.
    Promise.allSettled([bg.decode(),load("field","glala").decode()]).then(()=>requestAnimationFrame(paint));
  }
  const marks={
    keeper:[".1111111.","122222221","111111111","122111221","122131221","122111221","111111111"],
    smith:["....1111.","...122221","...122221","....1111.","...13....","..13.....",".13......"],
    surveyor:["....1....","..11211..",".1223221.","123232321",".1223221.","..11211..","....1...."],
    clerk:["1111.1111","122212221","123212321","122212221","123212321","122212221","111131111"],
    won:[".......11","......13.",".11..13..","132113...","..121....","...1....."],
    lost:["11.....11",".21...12.","..21.12..","...131...","..12.21..",".12...21.","11.....11"],
    seal:["....1....","....2....","..12221..","123232321","..12221..","....2....","....1...."]
  };
  function badge(key){
    const c=document.createElement("canvas");c.width=18;c.height=18;c.className="folio-badge";c.setAttribute("aria-hidden","true");
    const g=c.getContext("2d"),colors=["","#ad8857","#e6c487","#fff0bb"];
    (marks[key]||marks.seal).forEach((row,j)=>[...row].forEach((p,i)=>{if(p!=="."){g.fillStyle=colors[p];g.fillRect(i*2,2+j*2,2,2)}}));
    return c;
  }
  function landmark(id){return chapters.includes(id)?image(id==="cinder"?"prometheus":id,"folio-landmark"):null}
  function rig(id){return rigs.includes(id)?image(id,"folio-rig"):null}
  const baseline=156,layout=Object.freeze({width:576,height:184,npcBaseline:baseline});
  let townBase,baseReady=false;
  function street(){
    if(!townBase){townBase=document.createElement("canvas");townBase.width=1152;townBase.height=368}
    if(baseReady)return townBase;
    const g=townBase.getContext("2d");g.setTransform(2,0,0,2,0,0);g.imageSmoothingEnabled=false;
    const lanes=load("lanes","krosos"),blocks=LevelPaint.load("plinth"),furniture=props.map(p=>load(p));
    g.fillStyle="#443d40";g.fillRect(0,0,576,184);
    if(lanes.naturalWidth)g.drawImage(lanes,0,-19,576,176);
    g.fillStyle="#302c34";g.fillRect(0,baseline,576,30);
    if(blocks.naturalWidth)LevelPaint.terrain(g,"plinth",0,baseline,576,baseline);
    g.fillStyle="#d9be8d";g.fillRect(0,baseline,576,1);g.fillStyle="#796655";g.fillRect(0,baseline+2,576,1);
    const places=[[54,29],[183,40],[334,44],[516,32]];
    furniture.forEach((img,i)=>{if(img.naturalWidth){const [x,h]=places[i],w=Math.round(img.width*h/img.height);g.drawImage(img,x-w/2,baseline-h,w,h)}});
    baseReady=[lanes,blocks,...furniture].every(img=>img.complete&&img.naturalWidth);
    return townBase;
  }
  const periods={"106012":6,"106018":6,"106014":6,"103077":2};
  function person(g,skin,x,y,time){
    if(!Object.hasOwn(periods,skin))return;
    const img=load("npc-"+skin),frame=reduced.matches?0:Math.floor(time*8/periods[skin])%8;
    if(img.naturalWidth)g.drawImage(img,frame*288,0,288,152,Math.round(x)-72,y-66.5,144,76);
  }
  function town(canvas,x,character,time,motion,stations){
    if(canvas.width!==1152||canvas.height!==368){canvas.width=1152;canvas.height=368}
    const g=canvas.getContext("2d");g.setTransform(1,0,0,1,0,0);g.imageSmoothingEnabled=false;
    g.drawImage(street(),0,0);g.setTransform(2,0,0,2,0,0);
    for(const s of stations)person(g,s.skin,s.x*576,baseline,time);
    const px=Math.round(x*576);g.fillStyle="#392e32";g.fillRect(px-6,baseline-1,12,2);
    GlalaArt.drawActor(g,px,baseline,motion.face<0,character,{state:motion.moving?"walk":"idle",clock:time,phase:(time*2.6)%1},.55);
    g.fillStyle="#44352e";g.fillRect(px-3,baseline-22,7,2);g.fillStyle="#ffe9a3";g.fillRect(px-2,baseline-22,5,1);g.fillRect(px-1,baseline-21,3,1);g.fillRect(px,baseline-20,1,1);
  }
  return {url,load,cover,chapters,rig,landmark,badge,person,town,layout};
})();
