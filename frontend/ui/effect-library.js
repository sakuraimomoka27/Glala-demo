(()=>{
  const $=id=>document.getElementById(id),lib=EffectLibrary;
  const stage=$("stage"),g=stage.getContext("2d"),scrub=$("scrub"),side=$("side");
  let id=location.hash.slice(1),dir=1,elapsed=0,lastTime,stripReady=false;
  let playing=!matchMedia("(prefers-reduced-motion: reduce)").matches;
  const entries=new Map(),frames=[];
  function updatePlay(){ $("play").textContent=playing?"暂停":"播放" }
  function sample(){
    stripReady=false;
    $("sample").textContent='EffectLibrary.draw(ctx, "'+id+'", x, y, { age, width: 64, dir: '+dir+', hostile: '+(side.value==="hostile")+' });';
  }
  function select(next){
    if(!Object.hasOwn(lib.clips,next))next="shield";
    id=next;elapsed=0;
    const clip=lib.clips[id];
    $("title").textContent=clip.label;$("key").textContent=id;
    for(const [key,b] of entries)b.setAttribute("aria-pressed",String(key===id));
    scrub.max=clip.count;scrub.value=1;frames.length=0;$("strip").replaceChildren();
    for(let i=0;i<clip.count;i++){
      const b=document.createElement("button"),c=document.createElement("canvas");
      c.width=c.height=84;b.setAttribute("aria-label","查看第 "+(i+1)+" 帧");
      b.onclick=()=>seek(i);b.append(c);$("strip").append(b);frames.push([b,c.getContext("2d")]);
    }
    sample();history.replaceState(null,"","#"+id);
  }
  function seek(frame){playing=false;updatePlay();elapsed=lib.clips[id].seconds*(frame+.5)/lib.clips[id].count}
  for(const [key,clip] of Object.entries(lib.clips)){
    const b=document.createElement("button"),tag=document.createElement("small");
    b.textContent=clip.label;tag.textContent=key;b.append(tag);
    b.onclick=()=>select(key);$("clips").append(b);entries.set(key,b);
  }
  $("play").onclick=()=>{playing=!playing;updatePlay()};
  scrub.oninput=()=>seek(Number(scrub.value)-1);
  side.onchange=sample;
  $("direction").onclick=()=>{dir=-dir;$("direction").textContent="朝向　"+(dir>0?"→":"←");sample()};
  $("copy").onclick=async()=>{
    try{await navigator.clipboard.writeText($("sample").textContent);$("copy").textContent="已复制";setTimeout(()=>$("copy").textContent="复制调用",900)}
    catch{const r=document.createRange();r.selectNodeContents($("sample"));const s=getSelection();s.removeAllRanges();s.addRange(r)}
  };
  function paint(now){
    if(playing&&lastTime!==undefined)elapsed+=(now-lastTime)/1000;
    lastTime=now;
    const clip=lib.clips[id],period=clip.seconds+(clip.loop?0:.35);
    const phase=(elapsed%period)/clip.seconds,frame=Math.min(clip.count-1,Math.floor(phase*clip.count));
    const width=200,x=256+dir*(clip.pivotX-.5)*width,y=125+(clip.pivotY-.5)*width;
    const hostile=side.value==="hostile";
    g.fillStyle="#191c25";g.fillRect(0,0,512,250);
    g.fillStyle="#262b35";
    for(let j=0;j<250;j+=16)for(let i=0;i<512;i+=16)g.fillRect(i,j,1,1);
    g.fillStyle="#5d5551";g.fillRect(Math.round(x)-4,Math.round(y),9,1);g.fillRect(Math.round(x),Math.round(y)-4,1,9);
    if(phase<1)lib.draw(g,id,x,y,{progress:phase,width,dir,hostile});
    let stripLoaded=true;
    for(let i=0;i<frames.length;i++){
      const [btn,mini]=frames[i];
      if(!stripReady){
        mini.clearRect(0,0,84,84);
        const drawn=lib.draw(mini,id,42+dir*(clip.pivotX-.5)*76,42+(clip.pivotY-.5)*76,{progress:(i+.5)/clip.count,width:76,dir,hostile});
        if(!drawn)stripLoaded=false;
      }
      const active=String(i===frame&&phase<1);
      if(btn.getAttribute("aria-pressed")!==active)btn.setAttribute("aria-pressed",active);
    }
    stripReady=stripLoaded;
    if(Number(scrub.value)!==frame+1)scrub.value=frame+1;
    const counter=(frame+1)+" / "+clip.count;if($("frame").value!==counter)$("frame").value=counter;
    requestAnimationFrame(paint);
  }
  lib.preload();select(id);updatePlay();requestAnimationFrame(paint);
})();
