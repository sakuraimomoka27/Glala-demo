(async()=>{
  "use strict";
  const $=id=>document.getElementById(id),canvas=$("map"),overview=$("overview"),P=LevelMap.palette;
  const gridStep=.25,unit=29,clamp=(n,a,b)=>Math.max(a,Math.min(b,n)),round=n=>Math.round(n*100)/100;
  let map,project,fileHandle=null,selection=-1,brush=null,left=0,drag=null,space=false,frame=0,tiles=[];
  const undo=[],redo=[],g=canvas.getContext("2d");
  const assetFor=key=>map.assets?.find(a=>a.id===key);
  const targetKey=()=>LevelMap.slotKey(...$("chapter-slot").value.split("/"));
  const targetNumber=()=>$("chapter-slot").selectedOptions[0].text.split(" ")[0];
  const message=(s,error=false)=>{$("status").textContent=s;$("status").classList.toggle("error",error)};
  const span=()=>Math.min(+$("zoom").value,map.width);
  function bounds(){const w=span()*unit,h=canvas.clientHeight*w/Math.max(1,canvas.clientWidth);return {w,h,base:h-36}}
  function point(e){const r=canvas.getBoundingClientRect(),v=bounds();return {x:left+(e.clientX-r.left)/r.width*span(),y:(v.base-(e.clientY-r.top)/r.height*v.h)/unit}}
  const snap=n=>round($("snap").checked?Math.round(n/gridStep)*gridStep:n);
  const snapshot=()=>JSON.stringify(map);
  function history(before){
    if(before===snapshot())return;undo.push(before);
    while(undo.length>1&&(undo.length>60||undo.reduce((n,s)=>n+s.length,0)>8_000_000))undo.shift();
    redo.length=0;save();
  }
  function save(){
    try{localStorage.setItem(LevelMap.draftKey,snapshot());message("草稿已保存。")}
    catch(e){message("无法保存草稿，请导出 JSON。",true)}
    sync();
  }
  function restore(from,to){if(!from.length)return;to.push(snapshot());map=JSON.parse(from.pop());selection=-1;save()}
  function setBrush(value){brush=value;for(const b of document.querySelectorAll(".tile"))b.classList.toggle("active",b.dataset.type===brush);canvas.style.cursor=brush?"crosshair":"default"}
  function safe(fn){return async()=>{try{await fn()}catch(e){if(e.name!=="AbortError")message(e.message,true)}}}
  function replace(data,note){LevelMap.validate(data,false);const before=snapshot();map=structuredClone(data);selection=-1;left=0;setBrush(null);history(before);sync();message(note)}
  function markerHeight(type){return ({start:.55,guard:1.65,infantry:1.65,elite:1.67,hound:1.02,watcher:1.26,bow:1.65,boss:6.55,exit:2.65,hoist:1.58,awning:2.34})[type]||1}
  function footprint(o){
    if(o.skin&&!LevelMap.terrain(o)){
      const asset=assetFor(o.skin),im=LevelPaint.customImage(asset);
      return {l:o.x-asset.metres/2,r:o.x+asset.metres/2,b:o.y,t:o.y+asset.metres*(im.naturalHeight||1)/(im.naturalWidth||1)};
    }
    if(LevelMap.terrain(o))return {l:o.x,r:o.x+o.w,b:o.y-Math.min(o.type==="truss"?.48:1.3,Math.max(.45,o.y+.4)),t:o.y+.09};
    const half=({start:.36,guard:.95,infantry:.57,elite:.85,hound:.85,watcher:.55,bow:.57,boss:1.95,exit:.96,hoist:.63,awning:1.25})[o.type];
    return {l:o.x-half,r:o.x+half,b:o.y,t:o.y+markerHeight(o.type)};
  }
  function pick(p){
    // Actors and markers are in front of terrain, and the narrow landing rim
    // wins over the taller support behind it.
    let index=-1,best=Infinity;
    map.objects.forEach((o,i)=>{const b=footprint(o);
      if(p.x<b.l-.06||p.x>b.r+.06||p.y<b.b-.12||p.y>b.t+.1)return;
      const score=LevelMap.terrain(o)?2+Math.abs(o.y-p.y):Math.abs((b.l+b.r)/2-p.x)*.05;
      if(score<=best){best=score;index=i}
    });return index;
  }
  function nearFloor(x,y){
    let nearest=null,d=.48;
    for(const o of map.objects)if(LevelMap.terrain(o)&&x>=o.x&&x<=o.x+o.w&&Math.abs(o.y-y)<=d){d=Math.abs(o.y-y);nearest=o.y}
    return nearest??y;
  }
  function place(o,x,y){
    const ground=LevelMap.terrain(o);
    o.x=round(clamp(snap(x),ground?0:.55,ground?map.width-o.w:map.width-.55));
    o.y=clamp(snap(y),0,8);
    if(!ground&&$("snap").checked)o.y=nearFloor(o.x,o.y);
  }
  function insert(type,p){
    const asset=assetFor(type);
    if(asset)type=LevelMap.roles[asset.role];
    if(!Object.hasOwn(P,type))return;
    const before=snapshot();
    if(type==="start"||type==="exit"||type==="boss")selection=map.objects.findIndex(o=>o.type===type);else selection=-1;
    if(selection<0){
      const o={type,x:0,y:0};if(asset)o.skin=asset.id;if(P[type].width)o.w=asset?.metres||P[type].width;
      selection=map.objects.push(o)-1;
    }
    place(map.objects[selection],p.x,p.y);
    setBrush(null);history(before);sync();
  }
  function editNumber(label,value,fn){
    const wrap=document.createElement("label"),input=document.createElement("input");
    wrap.textContent=label;input.type="number";input.step=".05";input.value=value;
    input.onchange=()=>{const n=input.valueAsNumber;if(!Number.isFinite(n)){sync();return}const before=snapshot();fn(n);history(before);sync()};
    wrap.append(input);return wrap;
  }
  function remove(){if(selection<0)return;const before=snapshot();map.objects.splice(selection,1);selection=-1;history(before)}
  function duplicate(){
    const o=map.objects[selection];if(!o||["start","exit","boss"].includes(o.type))return;
    const before=snapshot(),copy={...o};place(copy,o.x+(o.w||1),o.y);
    selection=map.objects.push(copy)-1;history(before);
  }
  function sync(){
    syncAssets();
    left=clamp(left,0,map.width-span());$("map-title").textContent=map.name;$("name").value=map.name;
    $("width").value=map.width;$("loop-end").value=map.loopEnd;$("background").value=map.background;
    $("length-label").textContent=map.width+" 米　·　"+map.objects.length+" 个元件";
    $("undo").disabled=!undo.length;$("redo").disabled=!redo.length;$("loop-play").disabled=!map.loopEnd;
    const o=map.objects[selection],props=$("properties");props.replaceChildren();
    $("selection").textContent=o?(assetFor(o.skin)?.name||P[o.type].label):"未选择";
    if(o){
      const xy=document.createElement("div");xy.className="pair";
      xy.append(editNumber("横坐标 / 米",o.x,v=>o.x=round(clamp(v,0,map.width-(o.w||0)))),
        editNumber("高度 / 米",o.y,v=>o.y=round(clamp(v,0,8))));props.append(xy);
      if(o.type==="watcher"){
        const label=document.createElement("label"),select=document.createElement("select");
        label.textContent="机关攻击效果";
        for(const id of CombatSkills.ids)select.add(new Option(CombatSkills.definitions[id].name+" · "+id,id));
        select.value=o.attackSkill??FieldCombat.profiles.watcher.skill;
        select.onchange=()=>{const before=snapshot();o.attackSkill=select.value;history(before);sync()};
        label.append(select);props.append(label,editNumber("技能基础伤害",o.skillPower??1,v=>o.skillPower=clamp(v,.01,1000)));
      }
      if(LevelMap.terrain(o))props.append(editNumber("落脚面宽 / 米",o.w,v=>o.w=round(clamp(v,.5,map.width-o.x))));
      if(LevelMap.terrain(o)){const note=document.createElement("p");note.textContent=["rock","plinth"].includes(o.type)?"实体地形 · 崖壁阻挡横移":"单向平台 · 可从下方向上跳穿";props.append(note)}
      for(const [text,fn] of [["复制",duplicate],["删除",remove]]){
        const btn=document.createElement("button");btn.textContent=text;btn.onclick=fn;
        btn.disabled=text==="复制"&&["start","exit","boss"].includes(o.type);props.append(btn);
      }
    }else{const tip=document.createElement("p");tip.textContent="点选画布上的元件可调整位置与宽度。";props.append(tip)}
    redraw();
  }
  function paintObject(ctx,o,x,y,w,base){
    if(o.skin)LevelPaint.custom(ctx,assetFor(o.skin),x,y,w,base);
    else if(LevelMap.terrain(o))LevelPaint.terrain(ctx,o.type,x,y,w,base);
    else if(o.type==="exit"||P[o.type].group==="景物")LevelPaint.prop(ctx,o.type,x,y,o.type==="exit");
    else LevelPaint.actor(ctx,o.type,x,y);
  }
  function draw(){
    frame=0;if(!map)return;
    const v=bounds(),pw=Math.max(2,Math.round(canvas.clientWidth*devicePixelRatio)),ph=Math.max(2,Math.round(canvas.clientHeight*devicePixelRatio));
    if(canvas.width!==pw||canvas.height!==ph){canvas.width=pw;canvas.height=ph}
    g.setTransform(pw/v.w,0,0,ph/v.h,0,0);g.imageSmoothingEnabled=false;
    LevelPaint.background(g,map.background,left*unit,v.w,v.h,0,map.assets);
    const x=n=>(n-left)*unit,y=n=>v.base-n*unit;
    const sorted=map.objects.filter(o=>{const half=assetFor(o.skin)?.metres||3;return o.x+(o.w||half)>=left-1&&o.x<left+span()+half});
    const layer=o=>P[o.type].group==="景物"||o.type==="exit"?0:LevelMap.terrain(o)?(o.y?1:2):3;
    for(const o of sorted.sort((a,b)=>layer(a)-layer(b)))paintObject(g,o,x(o.x),y(o.y),(o.w||0)*unit,v.base);
    if($("grid").checked){
      g.lineWidth=.5;g.strokeStyle="rgba(228,222,210,.18)";g.beginPath();
      for(let m=Math.ceil(left);m<=left+span();m++){g.moveTo(x(m),0);g.lineTo(x(m),v.h)}
      for(let m=0;y(m)>0;m++){g.moveTo(0,y(m));g.lineTo(v.w,y(m))}g.stroke();
    }
    g.font="9px Consolas, monospace";g.fillStyle="#181a20cb";g.fillRect(0,0,v.w,15);
    for(let m=Math.ceil(left/2)*2;m<=left+span();m+=2){g.fillStyle="#d0c9b8";g.fillText(m+"m",x(m)+2,10)}
    const o=map.objects[selection];
    if(o){
      const b=footprint(o);g.strokeStyle="#ffda90";g.lineWidth=1;g.setLineDash([3,2]);g.strokeRect(x(b.l),y(b.t),(b.r-b.l)*unit,(b.t-b.b)*unit);g.setLineDash([]);
      if(LevelMap.terrain(o)){g.fillStyle="#ffda90";g.fillRect(x(o.x+o.w)-2,y(o.y)-2,5,5)}
    }
    drawOverview();
  }
  function drawOverview(){
    const w=overview.width=Math.max(100,overview.clientWidth*2),h=overview.height=88,ctx=overview.getContext("2d");
    const x=m=>m/map.width*w, y=m=>h-18-m*6;
    ctx.fillStyle="#15191f";ctx.fillRect(0,0,w,h);
    for(const o of map.objects){
      if(LevelMap.terrain(o)){ctx.fillStyle=o.y?"#9a8e78":"#665e54";ctx.fillRect(x(o.x),y(o.y),Math.max(2,x(o.w)),o.y?3:8)}
      else if(o.type==="start"||o.type==="exit"||P[o.type].enemy){ctx.fillStyle=o.type==="start"?"#a9cab8":o.type==="exit"?"#ebca91":"#bb786e";ctx.fillRect(x(o.x)-2,y(o.y)-9,4,8)}
    }
    if(map.loopEnd){ctx.fillStyle="#baa3d1";ctx.fillRect(x(map.loopEnd),3,2,h-6)}
    ctx.fillStyle="#e8c18418";ctx.fillRect(x(left),1,x(span()),h-2);ctx.strokeStyle="#e3c18a";ctx.lineWidth=2;ctx.strokeRect(x(left)+1,2,x(span())-2,h-4);
  }
  function redraw(){if(!frame)frame=requestAnimationFrame(draw)}
  function previewTile(tile){
    const {ctx,type}=tile;ctx.setTransform(2,0,0,2,0,0);ctx.clearRect(0,0,56,30);ctx.imageSmoothingEnabled=false;
    ctx.save();
    if(P[type].width){ctx.translate(3,2);ctx.scale(.53,.53);LevelPaint.terrain(ctx,type,0,2,94,23)}
    else{const scale=type==="boss"?.16:type==="start"?1.45:Math.min(.65,25/(markerHeight(type)*unit));ctx.translate(28,28);ctx.scale(scale,scale);paintObject(ctx,{type},0,0,0,0)}
    ctx.restore();
  }
  function makeLibrary(){
    for(const group of ["地形","景物","角色与目标","机关"]){
      const title=document.createElement("h3"),list=document.createElement("div");title.textContent=group;list.className="group";$("palette").append(title,list);
      for(const [type,obj] of Object.entries(P).filter(([,o])=>o.group===group)){
        const b=document.createElement("button"),tile=document.createElement("canvas");tile.width=112;tile.height=60;
        b.className="tile";b.draggable=true;b.dataset.type=type;b.append(tile,document.createTextNode(obj.label));list.append(b);
        b.onclick=()=>setBrush(brush===type?null:type);b.ondragstart=e=>{e.dataTransfer.setData("text/plain",type);e.dataTransfer.effectAllowed="copy"};
        tiles.push({button:b,ctx:tile.getContext("2d"),type});
      }
    }
  }
  let assetSignature="";
  function syncAssets(){
    const assets=map.assets||[],signature=assets.map(a=>a.id+a.name+a.role).join("|");
    if(signature===assetSignature)return;assetSignature=signature;
    $("custom-library").replaceChildren();
    $("background").querySelectorAll("[data-custom]").forEach(el=>el.remove());
    for(const a of assets){
      if(a.role==="background"){
        const opt=new Option(a.name,a.id);opt.dataset.custom="1";$("background").append(opt);continue;
      }
      const b=document.createElement("button"),img=document.createElement("img");b.className="tile";b.draggable=true;b.dataset.type=a.id;
      img.src=a.png;img.alt="";b.append(img,document.createTextNode(a.name));b.onclick=()=>setBrush(a.id);
      b.ondragstart=e=>{e.dataTransfer.setData("text/plain",a.id);e.dataTransfer.effectAllowed="copy"};$("custom-library").append(b);
    }
  }
  // Transparent padding is removed once at import; the first opaque row of a
  // platform is exactly the editable collision line. Embedded PNGs travel with the map.
  async function importImage(file){
    if(!file||file.size>5_000_000)throw Error("选择一张小于 5 MB 的 PNG。");
    const raw=new Uint8Array(await file.arrayBuffer()),header=new DataView(raw.buffer);
    if(raw.length<24||header.getUint32(0)!==0x89504e47||header.getUint32(4)!==0x0d0a1a0a)throw Error("素材须为 PNG 图片。");
    const w=header.getUint32(16),h=header.getUint32(20);
    if(!w||!h||w*h>6_000_000||w>4096||h>4096)throw Error("图片须在 4096 像素、600 万总像素以内。");
    const role=$("asset-role").value,metres=+$("asset-width").value;
    if(!Number.isFinite(metres)||metres<.5||metres>24)throw Error("元件宽度须在 0.5 至 24 米之间。");
    const img=await createImageBitmap(file),c=document.createElement("canvas");c.width=w;c.height=h;
    const cg=c.getContext("2d",{willReadFrequently:true});cg.drawImage(img,0,0);img.close();
    let png;
    if(role==="background")png=c.toDataURL();else{
      const pixels=cg.getImageData(0,0,w,h).data;let l=w,t=h,r=-1,b=-1;
      for(let y=0;y<h;y++)for(let x=0;x<w;x++)if(pixels[(y*w+x)*4+3]>=128){l=Math.min(l,x);r=Math.max(r,x);t=Math.min(t,y);b=Math.max(b,y)}
      if(r<l)throw Error("图片中没有可见的元件。");
      const cut=document.createElement("canvas");cut.width=r-l+1;cut.height=b-t+1;
      cut.getContext("2d").drawImage(c,-l,-t);png=cut.toDataURL();
    }
    const a={id:"img-"+crypto.randomUUID(),name:file.name.replace(/\.png$/i,"").slice(0,48),role,metres,png};
    const next={...map,assets:[...(map.assets||[]),a]};
    if(role==="background")next.background=a.id;
    LevelMap.validate(next,false);const before=snapshot();map=next;history(before);
    if(role!=="background")setBrush(a.id);message("已加入 "+a.name+"。");
  }
  $("add-image").onclick=()=>$("image-file").click();
  $("image-file").onchange=safe(async()=>{const file=$("image-file").files[0];$("image-file").value="";if(file)await importImage(file)});
  window.addEventListener("level-art-ready",()=>{for(const t of tiles)previewTile(t);redraw()});
  canvas.ondragover=e=>e.preventDefault();canvas.ondrop=e=>{e.preventDefault();if(map)insert(e.dataTransfer.getData("text/plain"),point(e))};
  canvas.onpointerdown=e=>{
    if(!map)return;canvas.focus();const p=point(e);
    if(space||e.button===1){drag={pan:true,left,screen:e.clientX};e.preventDefault()}
    else if(brush){insert(brush,p);return}
    else{
      const prev=map.objects[selection],handle=prev&&LevelMap.terrain(prev)&&Math.abs(p.x-prev.x-prev.w)<.19&&Math.abs(p.y-prev.y)<.2;
      if(!handle)selection=pick(p);
      const obj=map.objects[selection];sync();if(!obj)return;
      drag={before:snapshot(),dx:p.x-obj.x,dy:p.y-obj.y,resize:handle};
    }
    canvas.setPointerCapture(e.pointerId);
  };
  canvas.onpointermove=e=>{
    if(!map)return;const p=point(e);$("coordinates").textContent="X "+p.x.toFixed(2)+" m　 Y "+p.y.toFixed(2)+" m";
    if(!drag)return;
    if(drag.pan)left=clamp(drag.left-(e.clientX-drag.screen)/canvas.clientWidth*span(),0,map.width-span());
    else{const o=map.objects[selection];if(drag.resize)o.w=round(clamp(snap(p.x-o.x),.5,map.width-o.x));else place(o,p.x-drag.dx,p.y-drag.dy)}
    redraw();
  };
  function release(){if(!drag)return;const before=drag.before;drag=null;if(before)history(before);sync()}
  canvas.onpointerup=release;canvas.onpointercancel=release;
  function navigate(e){const r=overview.getBoundingClientRect();left=clamp((e.clientX-r.left)/r.width*map.width-span()/2,0,map.width-span());redraw()}
  overview.onpointerdown=e=>{overview.setPointerCapture(e.pointerId);navigate(e)};overview.onpointermove=e=>{if(overview.hasPointerCapture(e.pointerId))navigate(e)};
  canvas.onwheel=e=>{e.preventDefault();left=clamp(left+(e.deltaX||e.deltaY)*span()/1000,0,map.width-span());redraw()};
  window.addEventListener("keydown",e=>{
    if(!map||e.target.closest("input,select,textarea"))return;
    if(e.code==="Space"&&e.target.tagName!=="BUTTON"){space=true;e.preventDefault()}
    if(e.key==="Escape")setBrush(null);
    if(e.key==="Delete"){remove();e.preventDefault()}
    if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==="z"){e.preventDefault();e.shiftKey?restore(redo,undo):restore(undo,redo)}
    if(e.target===overview&&["ArrowLeft","ArrowRight"].includes(e.key)){left=clamp(left+(e.key==="ArrowLeft"?-1:1)*span()/3,0,map.width-span());redraw();e.preventDefault()}
  });
  window.addEventListener("keyup",e=>{if(e.code==="Space")space=false});window.addEventListener("blur",()=>{space=false;release()});
  function setting(id,change){$(id).onchange=()=>{const before=snapshot();try{change($(id));LevelMap.validate(map,false);history(before);sync()}catch(e){map=JSON.parse(before);sync();message(e.message,true)}}}
  setting("name",el=>map.name=el.value.trim());setting("width",el=>map.width=el.valueAsNumber);setting("loop-end",el=>map.loopEnd=el.valueAsNumber);setting("background",el=>map.background=el.value);
  $("grid").onchange=redraw;$("zoom").onchange=()=>sync();$("undo").onclick=()=>restore(undo,redo);$("redo").onclick=()=>restore(redo,undo);
  $("new").onclick=()=>{fileHandle=null;replace(LevelMap.blank(),"已新建，可撤销。")};
  const fileTypes=[{description:"关卡地图 JSON",accept:{"application/json":[".json"]}}];
  $("open").onclick=safe(async()=>{
    if(!window.showOpenFilePicker){$("file").click();return}
    const [handle]=await showOpenFilePicker({types:fileTypes,id:"ashen-level-maps"});
    const f=await handle.getFile();if(f.size>4*1024*1024)throw Error("地图文件超过 4 MB。");
    replace(JSON.parse(await f.text()),"已打开 "+f.name);fileHandle=handle;
  });
  $("write").hidden=!window.showSaveFilePicker;
  $("write").onclick=safe(async()=>{
    LevelMap.validate(map);const contents=JSON.stringify(map,null,2);
    const handle=fileHandle||await showSaveFilePicker({types:fileTypes,suggestedName:"ember_pass.json",id:"ashen-level-maps"});
    const stream=await handle.createWritable();await stream.write(contents);await stream.close();
    fileHandle=handle;message("已写入 "+handle.name+"。");
  });
  $("file").onchange=safe(async()=>{const f=$("file").files[0];$("file").value="";if(!f)return;if(f.size>4*1024*1024)throw Error("地图文件超过 4 MB。");replace(JSON.parse(await f.text()),"已载入 "+f.name)});
  $("export").onclick=safe(()=>{LevelMap.validate(map,false);const url=URL.createObjectURL(new Blob([JSON.stringify(map,null,2)],{type:"application/json"}));const a=document.createElement("a");a.href=url;a.download=map.name+".json";a.click();setTimeout(()=>URL.revokeObjectURL(url),1500);message("已导出地图 JSON。")});
  $("apply").onclick=safe(()=>{LevelMap.validate(map);localStorage.setItem(targetKey(),snapshot());message("已应用，重新进入本浏览器的 "+targetNumber()+" 即可游玩。")});
  $("unbind").onclick=safe(()=>{localStorage.removeItem(targetKey());message(targetNumber()+" 已恢复项目布局。")});
  $("load-binding").onclick=safe(()=>{
    const stored=LevelMap.saved(targetKey(),true);
    if(!stored&&targetKey()!==LevelMap.appliedKey)throw Error("此关尚无编辑地图。可以新建后应用。");
    fileHandle=null;replace(stored||project,"已载入 "+targetNumber()+"。");
  });
  function play(loop){LevelMap.compile(map,loop);sessionStorage.setItem("ashen:level-workshop:preview",snapshot());localStorage.setItem(LevelMap.draftKey,snapshot());location.assign("./?scene=workshop"+(loop?"&loop=gorge":""))}
  $("play").onclick=safe(()=>play(false));$("loop-play").onclick=safe(()=>play(true));
  for(const [key,name] of Object.entries(LevelMap.backgrounds))$("background").append(new Option(name,key));
  for(const [ci,chapter] of ASHEN_CONTENT.chapters.entries()){
    for(const [si,id] of chapter.rooms.split(",").entries()){
      const stage=ASHEN_CONTENT.levels.find(row=>row.id===id.trim());if(!stage)continue;
      $("chapter-slot").append(new Option((ci+1)+"-"+(si+1)+" "+stage.name,chapter.id+"/"+stage.id));
    }
  }
  const savedSlot=sessionStorage.getItem("ashen:level-workshop:slot");
  $("chapter-slot").value=savedSlot;
  if(!$("chapter-slot").value)$("chapter-slot").value="cinder/ember_pass";
  $("chapter-slot").onchange=()=>sessionStorage.setItem("ashen:level-workshop:slot",$("chapter-slot").value);
  try{
    project=await LevelMap.shipped();map=project;
    try{map=LevelMap.saved(LevelMap.draftKey,false)||LevelMap.saved(LevelMap.appliedKey,true)||project}catch(e){message(e.message,true)}
    makeLibrary();sync();
    const refresh=()=>{for(const t of tiles)previewTile(t);redraw()};
    for(const key of ["cliff","canal","street","rock","arch","court","plinth","pier","truss","hoist","awning","exit","boss"])LevelPaint.load(key).addEventListener("load",refresh,{once:true});
    refresh();window.addEventListener("load",refresh,{once:true});new ResizeObserver(redraw).observe(canvas);
  }catch(e){message(e.message,true)}
})();
