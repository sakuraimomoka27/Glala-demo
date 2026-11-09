/* 800006 field guide painting and field animation share the bare glala's markings.
   Each cached combat cell is drawn at its final size with a common ground anchor. */
globalThis.GlalaArt = (() => {
  "use strict";
  const source=new URL("glala/",document.currentScript.src);
  const portraitSheet=new Image(),fieldSheet=new Image(),waitingPortraits=new Set();
  const ready=image=>image.complete&&image.naturalWidth>0;
  portraitSheet.onload=()=>{
    portraitCanvas=null;
    for(const canvas of waitingPortraits)draw(canvas);
    waitingPortraits.clear();
  };
  portraitSheet.onerror=()=>waitingPortraits.clear();
  portraitSheet.src=new URL("portrait.png",source);fieldSheet.src=new URL("field.png",source);
  const coat={
    ink:"#27212a", coal:"#342b2c", claw:"#453a39", bark:"#503831", umber:"#74513c",
    chestnut:"#956540", amber:"#bb8552", ochre:"#d5a56b", honey:"#e3bd84",
    shadow:"#b9a58b", sand:"#d5bfa0", cream:"#ebd7b5", milk:"#f8e7c7", ivory:"#fff4da",
    pupil:"#211b1e", shine:"#fff6df"
  };
  function brush(ctx) {
    function rect(x,y,w,h,color) {
      ctx.fillStyle=color;
      ctx.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h));
    }
    function oval(x,y,rx,ry,color) {
      rx=Math.round(rx);ry=Math.round(ry);
      for(let dy=-ry;dy<=ry;dy++){
        const span=Math.floor(rx*Math.sqrt(Math.max(0,1-(dy/ry)**2)));
        rect(x-span,y+dy,span*2+1,1,color);
      }
    }
    function poly(points,color) {
      const ys=points.map(point=>point[1]);
      for(let y=Math.min(...ys);y<Math.max(...ys);y++){
        const hits=[];
        for(let i=0;i<points.length;i++){
          const [ax,ay]=points[i],[bx,by]=points[(i+1)%points.length];
          if((ay<=y&&by>y)||(by<=y&&ay>y))hits.push(ax+(bx-ax)*(y-ay)/(by-ay));
        }
        hits.sort((a,b)=>a-b);
        for(let i=0;i+1<hits.length;i+=2){
          const start=Math.ceil(hits[i]),end=Math.ceil(hits[i+1]);
          if(end>start)rect(start,y,end-start,1,color);
        }
      }
    }
    return {rect,oval,poly};
  }

  function portraitBackground(p) {
    p.rect(0,0,112,76,"#191f29");
    p.rect(1,1,110,74,"#292d37");
    p.oval(56,36,38,36,"#393840");
    p.oval(56,36,36,34,"#51474a");
    p.oval(56,36,35,33,"#36343c");
    for(const x of [14,96]){
      p.rect(x,17,2,36,"#424149");
      p.rect(x-2,50,6,3,"#48434a");
      p.rect(x-2,54,6,2,"#32303a");
    }
    p.poly([[0,60],[17,54],[23,55],[32,49],[41,56],[69,63],[89,52],[98,56],[112,49],[112,76],[0,76]],"#282c33");
    p.rect(1,63,110,12,"#25272e");
    p.rect(1,66,110,1,"#3f393d");
    p.oval(57,67,28,4,"#1c1d24");
    for(let i=0;i<22;i++){
      const x=(i*37+18)%110,y=(i*13+7)%58;
      if(x<31||x>82)p.rect(x,y,1,i%7===0?2:1,i%4?"#685754":"#c39e73");
    }
    for(const x of [4,103]){
      p.rect(x,4,5,1,"#b89a76");p.rect(x+(x===4?0:4),5,1,3,"#796a63");
      p.rect(x,71,5,1,"#796a63");
    }
  }

  function portrait(p) {
    const c=coat;
    // The back is a warm, low egg with the tuft distinct against the sky.
    p.poly([[52,23],[48,20],[46,16],[47,11],[50,7],[54,4],[57,3],[55,8],[56,12],[57,15],[61,12],[60,16],[64,15],[61,19],[63,19],[58,22]],c.ink);
    p.poly([[51,20],[48,17],[48,13],[51,9],[54,6],[55,5],[53,11],[55,15],[57,16],[59,14],[58,18],[60,17],[56,20]],c.bark);
    p.poly([[50,18],[50,15],[53,11],[52,16],[55,15],[56,17],[54,20]],c.umber);
    p.rect(51,16,1,2,c.chestnut);
    p.poly([[38,58],[33,61],[26,62],[20,60],[23,64],[29,66],[37,65],[43,62]],c.ink);
    p.poly([[34,62],[26,64],[23,62],[28,65],[36,64]],c.umber);
    p.poly([[32,33],[28,31],[25,26],[24,20],[28,23],[32,24],[37,22],[42,25],[42,31]],c.ink);
    p.poly([[27,24],[32,26],[37,25],[39,27],[34,31],[31,30]],c.claw);
    p.poly([[30,26],[34,28],[37,26],[34,29]],c.umber);
    p.poly([[70,30],[70,24],[76,21],[82,17],[84,16],[83,24],[80,30],[76,34]],c.ink);
    p.poly([[73,26],[77,23],[81,20],[80,26],[77,29],[74,30]],c.claw);
    p.poly([[76,25],[80,22],[78,26],[75,28]],c.umber);
    p.oval(55,45,28,23,c.ink);
    p.oval(55,44,27,23,c.bark);
    p.oval(54,44,26,22,c.chestnut);
    p.poly([[28,38],[30,32],[35,27],[44,23],[55,21],[65,23],[72,26],[76,32],[71,38],[60,42],[41,47],[35,58],[30,54]],c.amber);
    p.poly([[30,39],[36,32],[40,30],[38,34],[43,31],[40,38],[34,42],[32,49],[31,53],[29,46]],c.chestnut);
    p.poly([[45,25],[54,22],[63,23],[68,25],[64,27],[58,26],[54,28],[50,27],[47,29]],c.ochre);
    p.poly([[30,48],[34,44],[34,48],[39,44],[37,50],[32,54]],c.umber);
    p.poly([[34,56],[38,52],[36,57],[38,55],[37,60]],c.bark);
    // Cream facial disc opens into the belly. A small V of back fur marks the brow.
    p.poly([[37,43],[39,34],[44,29],[50,27],[55,29],[60,33],[64,28],[69,26],[74,29],[78,34],[80,43],[80,52],[76,59],[68,64],[60,67],[50,67],[43,64],[39,59],[36,52]],c.sand);
    p.poly([[37,43],[40,35],[44,31],[49,28],[54,29],[60,34],[64,29],[69,27],[73,29],[77,35],[79,43],[78,54],[73,60],[66,64],[62,66],[56,64],[52,65],[45,62],[41,57],[38,50]],c.cream);
    p.poly([[38,41],[42,34],[48,30],[52,30],[58,34],[60,36],[64,32],[67,29],[71,29],[76,35],[75,42],[77,45],[75,52],[70,54],[69,58],[64,57],[60,61],[55,57],[50,58],[45,55],[43,51],[40,49]],c.milk);
    p.poly([[40,39],[45,34],[50,32],[54,33],[56,35],[52,36],[48,36],[45,41],[42,43]],c.ivory);
    p.poly([[64,36],[67,32],[71,31],[74,34],[73,37],[70,36],[68,38]],c.ivory);
    p.poly([[43,45],[47,43],[50,44],[52,48],[50,51],[48,49],[46,50]],c.ivory);
    p.poly([[60,46],[65,42],[70,42],[74,45],[73,47],[68,46],[64,49]],c.ivory);
    p.poly([[42,55],[46,58],[51,57],[53,60],[57,59],[60,62],[65,59],[69,60],[74,56],[71,61],[65,64],[62,65],[57,63],[53,64],[47,62]],c.sand);
    p.poly([[49,28],[52,26],[58,27],[63,25],[67,25],[63,28],[61,32],[58,31],[55,29]],c.bark);
    p.poly([[52,25],[56,23],[62,23],[65,24],[61,25],[60,28],[57,27]],c.chestnut);
    // The swept side feathers and short dark claws are painted as part of the animal.
    p.poly([[35,40],[30,43],[25,42],[25,39],[21,38],[24,36],[20,32],[27,34],[29,32],[30,35],[35,33],[33,37],[37,36]],c.ink);
    p.poly([[25,34],[30,37],[33,35],[31,39],[27,40]],c.claw);
    p.poly([[24,37],[27,38],[29,38],[27,39]],c.umber);
    p.poly([[78,40],[82,36],[88,33],[86,39],[89,38],[87,42],[82,46],[78,47]],c.ink);
    p.poly([[80,41],[84,38],[86,36],[84,40],[85,40],[82,43]],c.claw);
    // Two very short forepaws ride in front of the chest; each ends in hooked dark claws.
    for(const [x,y,near] of [[35,48,true],[78,47,false]]){
      p.oval(x,y,near?6:4,near?6:5,c.ink);
      p.oval(x+1,y,near?5:3,near?5:4,c.umber);
      p.oval(x+2,y+1,near?3:2,3,c.amber);
      for(const [dx,dy] of [[0,-3],[3,-1],[4,2]]){
        p.poly([[x+dx,y+dy],[x+dx+2,y+dy-1],[x+dx+3,y+dy],[x+dx+2,y+dy+3],[x+dx+1,y+dy+4],[x+dx+1,y+dy+2]],c.coal);
        p.rect(x+dx+1,y+dy,1,1,c.claw);
      }
    }
    for(const [x,y] of [[40,59],[43,62],[66,62],[70,60]]) {
      p.poly([[x,y],[x+2,y-1],[x+3,y],[x+2,y+3],[x-1,y+4]],c.claw);
      p.rect(x+1,y,1,1,c.umber);
    }
    for(const [x,y,rx] of [[51,38,4],[69,36,3]]) {
      p.oval(x,y+1,rx+1,5,c.cream);p.oval(x,y,rx,4,c.pupil);
      p.rect(x-1,y-2,2,2,c.shine);p.rect(x+1,y+2,1,1,c.bark);
    }
    p.poly([[57,41],[59,38],[62,38],[64,39],[61,40],[59,44]],c.umber);
    p.poly([[57,41],[59,39],[62,39],[59,41]],c.honey);
    p.rect(41,34,1,1,c.ochre);p.rect(37,48,1,2,c.ochre);
  }

  let portraitCanvas;
  function draw(canvas,character,mode="portrait") {
    if(!portraitCanvas){
      portraitCanvas=document.createElement("canvas");
      portraitCanvas.width=224;portraitCanvas.height=152;
      const ctx=portraitCanvas.getContext("2d"),p=brush(ctx);
      ctx.scale(2,2);
      portraitBackground(p);
      ctx.imageSmoothingEnabled=false;
      if(ready(portraitSheet)){
        const height=69,width=height*portraitSheet.width/portraitSheet.height;
        ctx.drawImage(portraitSheet,Math.round((112-width)/2),4,width,height);
      }else{
        ctx.save();ctx.translate(112,0);ctx.scale(-1,1);portrait(p);ctx.restore();
      }
    }
    if(!portraitSheet.complete)waitingPortraits.add(canvas);
    canvas.width=224;canvas.height=152;
    const ctx=canvas.getContext("2d");
    ctx.imageSmoothingEnabled=false;ctx.drawImage(portraitCanvas,0,0);
    canvas.setAttribute?.("role","img");
    canvas.setAttribute?.("aria-label","格拉拉像素肖像");
  }

  const anchorX=20,anchorY=36;
  const base=Object.freeze({rx:11,ry:9,lean:0,tuft:0,tip:0,ears:0,wing:0,foot:0,stride:0,eye:0,gaze:0});
  // Each hold is a hand-selected key pose. Logical extents and appendage positions are independent.
  const shapes={
    idle:[{}, {ry:10,wing:1,tip:1}, {eye:2}, {ry:10,wing:1,eye:2,tip:1}],
    walk:[
      {lean:1,stride:2,tip:-1,wing:1}, {lean:1,stride:3,ry:10,tip:-2},
      {lean:2,stride:1,tuft:1,wing:-1}, {lean:1,stride:-2,tip:1,wing:1},
      {lean:1,stride:-3,ry:10,tip:2}, {lean:2,stride:-1,wing:-1}
    ],
    coil:[
      {rx:12,ry:9,lean:1,wing:1}, {rx:12,ry:8,lean:1,tip:1,ears:1,wing:2},
      {rx:13,ry:8,lean:2,tip:1,ears:1,wing:2,foot:1}
    ],
    crouch:[
      {rx:13,ry:7,lean:2,tip:2,ears:1,wing:2,foot:1},
      {rx:14,ry:6,lean:2,tuft:1,tip:3,ears:2,wing:3,foot:2,eye:1},
      {rx:14,ry:6,lean:3,tuft:2,tip:3,ears:2,wing:3,foot:2,eye:1}
    ],
    launch:[
      {rx:10,ry:11,lean:2,tip:-2,ears:-1,wing:-2,foot:-2,gaze:-1},
      {rx:9,ry:12,lean:2,tuft:1,tip:-3,ears:-1,wing:-3,foot:-2,gaze:-1},
      {rx:10,ry:11,lean:1,tip:-3,wing:-3,foot:-1,gaze:-1}
    ],
    rise:[
      {rx:10,ry:11,lean:1,tip:-3,wing:-3,foot:-1,gaze:-1},
      {rx:10,ry:10,lean:1,tip:-2,wing:-2,gaze:-1},
      {rx:11,ry:10,lean:1,tuft:-1,tip:-1,wing:-1,gaze:-1}
    ],
    apex:[
      {rx:11,ry:9,lean:1,tuft:-1,wing:1,gaze:-1},
      {rx:12,ry:9,tuft:-2,tip:1,wing:2,foot:1},
      {rx:12,ry:9,lean:-1,tuft:-2,tip:2,wing:2,foot:1,gaze:1}
    ],
    fall:[
      {rx:11,ry:9,lean:-1,tuft:-2,tip:2,wing:1,foot:1,gaze:1},
      {rx:10,ry:10,lean:-1,tuft:-3,tip:2,wing:-1,foot:2,gaze:1},
      {rx:10,ry:11,lean:-1,tuft:-3,tip:3,wing:-2,foot:2,gaze:2}
    ],
    land:[
      {rx:12,ry:8,tuft:-1,tip:2,wing:1,foot:2,gaze:1},
      {rx:15,ry:6,tuft:2,tip:3,ears:2,wing:3,foot:3,eye:1},
      {rx:14,ry:6,lean:-1,tuft:2,tip:2,ears:2,wing:2,foot:3,eye:1}
    ],
    recover:[
      {rx:13,ry:7,lean:-1,tuft:1,tip:-1,ears:1,wing:2,foot:2},
      {rx:11,ry:10,tuft:-1,tip:-2,wing:-1,foot:1},
      {rx:11,ry:9,tip:1}
    ]
  };

  function fieldPaws(p,s,cx,cy) {
    const c=coat;
    for(const side of [-1,1]){
      const near=side<0, width=near?3:2;
      const x=cx+side*(s.rx-(near?3:1))-Math.round(s.foot*.5);
      const bob=Math.round(s.stride*side*.45);
      const y=cy+2+Math.round(s.wing*.5)+bob-(s.foot>0?1:0);
      p.oval(x,y,width,2,c.coal);
      p.rect(x-1,y,2,2,c.umber);
      p.rect(x,y-1,2,1,c.amber);
      p.rect(x+1,y,1,2,c.claw);p.rect(x+2,y+1,1,2,c.coal);
    }
    // Dark markings hug the grounded belly; they never extend into legs.
    p.rect(cx-4,anchorY-4,2,2,c.claw);p.rect(cx-3,anchorY-2,1,1,c.bark);
    p.rect(cx+4,anchorY-4,2,1,c.claw);
  }
  function fieldPlume(p,s,x,y) {
    const c=coat,tx=x+s.tip;
    p.poly([[x-2,y+2],[x-4,y],[tx-5,y-4+s.tuft],[tx-4,y-7+s.tuft],[tx-2,y-9+s.tuft],[tx+1,y-10+s.tuft],[tx,y-7+s.tuft],[tx+1,y-4+s.tuft],[tx+3,y-5+s.tuft],[tx+2,y-2+s.tuft],[tx+4,y-3+s.tuft],[tx+3,y],[x+1,y+2]],c.ink);
    p.poly([[x-1,y+1],[tx-3,y-2+s.tuft],[tx-3,y-5+s.tuft],[tx-1,y-7+s.tuft],[tx-1,y-4+s.tuft],[tx+1,y-2+s.tuft],[tx+2,y-3+s.tuft],[x+1,y]],c.umber);
    p.rect(tx-1,y-4+s.tuft,1,2,c.chestnut);
  }
  function fieldEar(p,x,y,side,delta) {
    const c=coat;
    p.poly([[x-2*side,y+1],[x+side,y],[x+5*side,y-3+delta],[x+4*side,y+1+delta],[x+3*side,y+3],[x,y+5],[x-3*side,y+3]],c.ink);
    p.poly([[x,y+2],[x+3*side,y+delta],[x+2*side,y+2],[x,y+4]],c.claw);
  }
  function fieldFur(p,s,x,y) {
    const c=coat,r=s.rx,h=s.ry,top=y-h;
    p.oval(x,y,r,h,c.ink);
    p.oval(x,y,r-1,h-1,c.bark);
    p.oval(x,y-1,r-2,h-2,c.chestnut);
    p.oval(x+1,y,r-3,h-1,c.amber);
    p.oval(x+2,y+1,r-3,h-2,c.sand);
    p.oval(x+2,y,r-3,h-2,c.cream);
    p.oval(x+2,y-1,r-4,Math.max(2,h-3),c.milk);
    const brow=x+2;
    p.poly([[brow-4,top+1],[brow+4,top+1],[brow+5,top+2],[brow+3,top+3],[brow+2,top+5],[brow,top+4],[brow-1,top+3],[brow-4,top+3]],c.umber);
    p.rect(brow-2,top+1,4,1,c.ochre);
    p.poly([[x-r+1,y-1],[x-r+5,y-5],[x-r+4,y-2],[x-r+6,y-3],[x-r+5,y],[x-r+3,y+2],[x-r+3,y+4],[x-r+1,y+1]],c.umber);
    p.poly([[x-5,y+h-5],[x-3,y+h-4],[x,y+h-4],[x+1,y+h-3],[x+4,y+h-4],[x+2,y+h-2],[x-2,y+h-2]],c.sand);
    p.rect(x+r-3,y+1,1,2,c.cream);
  }
  function fieldSideFeathers(p,s,x,y) {
    const c=coat,tipY=y+s.wing;
    p.poly([[x+3,y-3],[x,y-2],[x-3,tipY-4],[x-3,tipY-2],[x-5,tipY-3],[x-3,tipY],[x-4,tipY+1],[x-1,tipY+2],[x+1,tipY+4],[x+4,y+2]],c.ink);
    p.poly([[x+2,y-2],[x-2,tipY-2],[x,tipY+1],[x+2,tipY+2]],c.claw);
    p.rect(x,tipY,2,1,c.umber);
  }
  function fieldFace(p,s,x,y) {
    const c=coat;
    const ey=y-Math.max(2,Math.round(s.ry*.32))+s.gaze;
    for(const [eyeX,dy] of [[x-1,0],[x+6,-1]]){
      if(s.eye===2){p.rect(eyeX-1,ey+dy+1,3,1,c.pupil);continue;}
      p.rect(eyeX-1,ey+dy,3,s.eye===1?2:3,c.pupil);
      p.rect(eyeX,ey+dy-1,1,1,c.pupil);
      p.rect(eyeX-1,ey+dy,1,1,c.shine);
    }
    p.rect(x+2,ey+2,3,1,c.honey);p.rect(x+2,ey+3,2,1,c.umber);
    p.rect(x+2,ey+4,1,1,c.bark);
  }
  const frames=new Map();
  function renderCell(state,index) {
    const key=state+"/"+index;
    if(frames.has(key))return frames.get(key);
    const canvas=document.createElement("canvas");canvas.width=40;canvas.height=38;
    const p=brush(canvas.getContext("2d")),s={...base,...shapes[state][index]};
    const x=anchorX+s.lean,bottom=anchorY-1,y=bottom-s.ry;
    const tailX=x-s.rx+2;
    p.poly([[tailX,bottom-4],[tailX-2,bottom-3],[tailX-4,bottom-4],[tailX-3,bottom-2],[tailX+1,bottom-1],[tailX+3,bottom-2]],coat.bark);
    fieldPlume(p,s,x-1,y-s.ry);
    fieldEar(p,x-s.rx+3,y-s.ry+3,-1,s.ears);
    fieldEar(p,x+s.rx-4,y-s.ry+2,1,s.ears);
    fieldFur(p,s,x,y);
    fieldSideFeathers(p,s,x-s.rx+2,y);
    fieldPaws(p,s,x,y);
    fieldFace(p,s,x,y);
    frames.set(key,canvas);
    return canvas;
  }

  function poseFrame(pose) {
    const state=Object.hasOwn(shapes,pose?.state)?pose.state:"idle";
    const clock=Number.isFinite(pose?.clock)?Math.max(0,pose.clock):0;
    if(state==="idle"){
      const breath=Math.floor(clock*1.7)%2;
      const blink=clock%3.6>=3.42?2:0;
      return renderCell(state,breath+blink);
    }
    let progress=pose?.phase;
    if(!Number.isFinite(progress))progress=state==="walk"?(clock*2.6)%1:0;
    const cell=Math.max(0,Math.min(shapes[state].length-1,Math.floor(progress*shapes[state].length)));
    return renderCell(state,cell);
  }
  // The 80 px cells share a bottom-center anchor at (40,74).
  // Two source pixels correspond to one world pixel in every room.
  const framesByState={
    walk:[4,5,6,7,8,9,10,11],coil:[12,13,14],crouch:[14,15],
    launch:[16,17],rise:[18,19],apex:[20,21,22,23],fall:[24,25,26],
    land:[27,28,29],recover:[29,30,31]
  };
  function fieldFrame(pose){
    const clock=Number.isFinite(pose?.clock)?Math.max(0,pose.clock):0;
    const sequence=framesByState[pose?.state];
    if(!sequence){
      const blink=clock%3.6;
      if(blink>=3.36)return blink<3.48?2:3;
      return Math.floor(clock*1.7)%2;
    }
    const phase=Number.isFinite(pose.phase)?pose.phase:pose.state==="walk"?(clock*2.6)%1:0;
    return sequence[Math.min(sequence.length-1,Math.max(0,Math.floor(phase*sequence.length)))];
  }
  function drawActor(ctx,x,y,face,character,pose,worldScale=1) {
    const left=face===true||(typeof face==="number"&&face<0);
    ctx.save();ctx.translate(Math.round(x),Math.round(y));
    ctx.scale(left?-worldScale:worldScale,worldScale);
    ctx.imageSmoothingEnabled=false;
    if(ready(fieldSheet)){
      const frame=fieldFrame(pose);
      ctx.drawImage(fieldSheet,(frame%8)*80,Math.floor(frame/8)*80,80,80,-20,-37,40,40);
    }else ctx.drawImage(poseFrame(pose),-anchorX,-anchorY);
    ctx.restore();
  }
  return Object.freeze({draw,drawActor});
})();
