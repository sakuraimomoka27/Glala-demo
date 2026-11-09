/* The atlas and the town share a 576-pixel grid with the battle viewport.
   Only actors, lanterns and embers are redrawn while walking through town. */
globalThis.WorldArt = (() => {
  "use strict";
  const W = 576, H = 184;
  const ink = "#201d29", slit = "#282532", gold = "#dbc28e";
  const accents = ["#d5ab6e", "#a3bc88", "#d68d67", "#95bbd4", "#c2a0c4"];
  const sigilY = [94, 106, 96, 82, 87];
  const atlasHeight = 234;
  function mapLayout(chapterCount,roomCount) {
    const landmarks=Array.from({length:chapterCount},(_,i)=>({
      x:Math.round(W*(i+.5)/chapterCount),y:sigilY[i%sigilY.length]
    }));
    const rooms=Array.from({length:roomCount},(_,i)=>({
      x:Math.round(W*(i+.5)/roomCount),y:roomCount===1?188:186+[3,-5,1][i%3]
    }));
    return {width:W,height:atlasHeight,landmarks,rooms};
  }
  const cachedLayers = new Map();
  let townScenery;

  function brush(ctx) {
    function rect(x, y, w, h, color) {
      ctx.fillStyle = color;
      ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
    }
    function poly(points, color) {
      const ys = points.map(point => point[1]);
      for (let y = Math.ceil(Math.min(...ys)); y < Math.max(...ys); y++) {
        const cuts = [];
        for (let i = 0; i < points.length; i++) {
          const [x1, y1] = points[i], [x2, y2] = points[(i + 1) % points.length];
          if ((y1 <= y && y2 > y) || (y2 <= y && y1 > y))
            cuts.push(x1 + (y - y1) * (x2 - x1) / (y2 - y1));
        }
        cuts.sort((a, b) => a - b);
        for (let i = 0; i < cuts.length; i += 2)
          rect(Math.ceil(cuts[i]), y, Math.ceil(cuts[i + 1]) - Math.ceil(cuts[i]), 1, color);
      }
    }
    function circle(x, y, radius, color) {
      for (let dy = -radius; dy <= radius; dy++) {
        const length = Math.floor(Math.sqrt(radius * radius - dy * dy));
        rect(x - length, y + dy, length * 2 + 1, 1, color);
      }
    }
    function line(x1, y1, x2, y2, color, weight = 1) {
      const steps = Math.max(Math.abs(x1 - x2), Math.abs(y1 - y2), 1);
      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        rect(x1 + (x2 - x1) * t, y1 + (y2 - y1) * t, weight, weight, color);
      }
    }
    return { rect, poly, circle, line };
  }
  function rng(seed) {
    return () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
  }
  function canvasContext(canvas,density=1) {
    if (canvas.width !== W*density) canvas.width = W*density;
    if (canvas.height !== H*density) canvas.height = H*density;
    const ctx = canvas.getContext("2d");
    ctx.setTransform(density,0,0,density,0,0);
    ctx.imageSmoothingEnabled = false;
    return ctx;
  }
  function ridge(p, random, base, amplitude, spacing, color) {
    const points = [[-spacing, H]];
    for (let x = -spacing; x <= W + spacing; x += spacing)
      points.push([x, base - random() * amplitude]);
    points.push([W + spacing, H]);
    p.poly(points, color);
  }
  function sky(p, random, town) {
    const bands = town
      ? ["#25283e", "#34354d", "#51475a", "#735760", "#a17871"]
      : ["#252b3a", "#31394a", "#41495a", "#565665", "#696272"];
    const starts = [0, 22, 43, 58, 72];
    bands.forEach((c, i) => p.rect(0, starts[i], W, H - starts[i], c));
    for (let i = 0; i < 69; i++) {
      const x = random() * W, y = random() * 53;
      p.rect(x, y, 1, 1, i % 6 ? "#797985" : "#cec4aa");
    }
    const moonX = town ? 295 : 382;
    p.circle(moonX, 35, 19, "#75747b");
    p.circle(moonX, 35, 17, "#b9ad9e");
    p.circle(moonX, 35, 15, "#d4c3a8");
    [[-9, -3, 3], [-3, -8, 2], [3, 7, 4], [8, 0, 2]].forEach(([x, y, r]) => p.circle(moonX+x, 35+y, r, "#b5a99c"));
    for (let i = 0; i < 31; i++) {
      const y = 17 + random() * 50;
      p.rect(random() * W, y, 7 + random()*37, 1, y < 42 ? "#4b4959" : "#70636b");
    }
    ridge(p, random, 93, 51, 19, town ? "#51495a" : "#4d5261");
    ridge(p, random, 104, 31, 14, town ? "#393949" : "#393f4c");
  }
  function arch(p, x, base, width, height, color) {
    const half = width / 2, shoulder = base - height * .64;
    p.poly([[x-half,base],[x-half,shoulder],[x-half*.7,shoulder-4],[x,base-height],
      [x+half*.7,shoulder-4],[x+half,shoulder],[x+half,base]], color);
  }
  function spire(p, x, base, height, width, body, roof, light) {
    const y = base - height, roofHeight = Math.round(height * .39);
    p.rect(x - width / 2, y + roofHeight, width, height - roofHeight, body);
    p.poly([[x-width/2-2,y+roofHeight+1],[x,y],[x+width/2+2,y+roofHeight+1]], roof);
    p.line(x, y+1, x-width/2-1, y+roofHeight, light);
    p.rect(x + width/2-2, y+roofHeight+2, 2, height-roofHeight-2, slit);
    p.rect(x-width/2-1, y+roofHeight, width+2, 2, light);
    for(let yy=y+roofHeight+4; yy < base-3; yy+=9) p.rect(x-1,yy,2,4,"#d4ae78");
  }
  function pine(p, x, base, height, color) {
    const width = height * .23;
    p.rect(x-1,base-3,2,4,color);
    p.poly([[x,base-height],[x+width*.66,base-height*.56],[x+width*.4,base-height*.56],
      [x+width,base-2],[x-width,base-2],[x-width*.4,base-height*.52],
      [x-width*.7,base-height*.52]], color);
  }
  function landmarks(p, random) {
    // Bell abbey, wildwood, foundry, high keep, and the royal cathedral.
    const stone = "#585866", edge = "#a19486";
    for (const [x, height, width] of [[34,38,8],[53,58,16],[68,75,13],[82,41,9]])
      spire(p,x,91,height,width,stone,"#3c3c4d",edge);
    p.rect(33,72,56,21,stone);
    arch(p,55,92,12,20,slit);
    for(let x=34;x<88;x+=7) p.rect(x,69,4,4,"#7c7377");
    // A few weathered cloister windows.
    for(let x=69;x<=82;x+=6) arch(p,x,87,4,9,"#ccb98c");
    for(let i=0;i<37;i++){const x=117+random()*94;pine(p,x,103+random()*5,15+random()*27,i%3?"#3b5052":"#53635d");}
    const tree = (x,y,h) => {
      p.rect(x-2,y-h,4,h,"#5e514c");
      for(const dir of [-1,1]) p.line(x,y-h/2,x+dir*10,y-h+3,"#6a5e53",2);
      for(const [dx,dy,r] of [[-11,3,8],[11,3,9],[0,-5,11],[1,3,11]])
        p.circle(x+dx,y-h+dy,r,"#485b55");
      p.rect(x-10,y-h-8,8,1,"#77806a");
    };
    tree(160,97,33);tree(181,98,29);
    for(const [x,h] of [[260,29],[273,40],[296,35],[306,25]]) {
      p.rect(x,93-h,6,h,"#645361");p.rect(x-1,91-h,8,3,"#a18176");
      for(let j=0;j<3;j++)p.rect(x+2+j*3,88-h-j*4,8+j*2,2,"#71606c");
    }
    p.poly([[244,94],[249,78],[260,78],[269,70],[318,85],[323,94]],"#735753");
    for(let x=256;x<314;x+=10)arch(p,x,93,6,11,"#d08b66");
    p.poly([[347,91],[377,62],[393,38],[406,30],[428,66],[452,86]],"#596773");
    p.poly([[366,79],[392,40],[405,30],[399,54],[391,52],[382,66],[378,64]],"#b9c6c2");
    spire(p,397,83,55,10,"#727884","#404653","#b9c4c1");
    spire(p,418,86,43,11,"#626875","#434955","#aab8b6");
    p.rect(390,74,34,10,"#69707a");
    for(const [x,h,w] of [[483,48,8],[495,60,10],[518,80,16],[540,60,9],[551,43,8]])
      spire(p,x,86,h,w,"#61566a","#423c52","#a79a9f");
    p.poly([[482,88],[482,74],[518,50],[552,74],[552,88]],"#615764");
    for(const x of [495,506,518,530,541])arch(p,x,86,5,x===518?16:10,"#c9a78e");
    p.rect(518,4,1,12,"#d5be96");p.rect(515,7,7,1,"#d5be96");
  }
  function tunnel(p, points, floor, trim) {
    for(let i=1; i<points.length; i++) {
      const [x1,y1]=points[i-1], [x2,y2]=points[i];
      const x=Math.min(x1,x2),y=Math.min(y1,y2),w=Math.abs(x1-x2),h=Math.abs(y1-y2);
      p.rect(x-2,y-2,w+5,h+5,trim);p.rect(x-1,y-1,w+3,h+3,floor);
    }
  }
  function cutaway(p, random) {
    const heights = [94,106,96,82,87];
    const rooms=[];
    for(let i=0;i<5;i++){
      const cx=Math.round(W*(i+.5)/5), y=heights[i], accent=accents[i];
      const main = [cx, y+31];
      const side = [cx-27, y+45], upper = [cx+30, y+17], deep=[cx+16,y+58];
      rooms.push(main);
      tunnel(p, [[cx,y],main], "#393740", "#897866");
      tunnel(p, [side,[side[0],main[1]],main,[upper[0],main[1]],upper], "#322e37", "#776c65");
      tunnel(p, [main,[cx+6,main[1]],[cx+6,deep[1]],deep], "#322e37", "#776c65");
      for(const [x0,y0,w,h] of [[...main,20,9],[...side,15,8],[...upper,16,9],[...deep,12,6]]) {
        const x=x0-w/2,y=y0-h/2;
        p.rect(x,y,w,h,"#80716b");p.rect(x+1,y+1,w-2,h-2,"#33303b");
        p.rect(x+2,y+h-2,w-4,1,accent);
        for(let offset=3;offset<w-2;offset+=5)p.rect(x+offset,y+2,2,2,"#ab937b");
      }
      for(let j=0;j<5;j++)p.rect(cx-2,y+6+j*4,5,1,accent);
      if(i) {
        const prev=rooms[i-1], mid=cx-55;
        tunnel(p, [[prev[0]+10,prev[1]],[mid,prev[1]],[mid,main[1]],[cx-10,main[1]]], "#352e36", "#817266");
      }
    }
    for(let i=0;i<140;i++) {
      const x=random()*W, y=143+random()*36;
      if((i%5)===0)p.rect(x,y,2+random()*4,1,"#61545c");
    }
  }
  function sigil(p, x, y, index, selected, locked) {
    const color = selected ? "#ffe0a1" : locked ? "#90848a" : accents[index%accents.length];
    p.poly([[x,y-10],[x+10,y],[x,y+10],[x-10,y]],ink);
    p.poly([[x,y-8],[x+8,y],[x,y+8],[x-8,y]],color);
    p.poly([[x,y-6],[x+6,y],[x,y+6],[x-6,y]],"#363441");
    // The Roman numeral remains legible against the inset shield on small maps.
    const glyphs=[["1","1","1","1","1"],["101","101","101","101","101"],["10101","10101","10101","10101","10101"],["10101","10101","10101","10010","10010"],["10001","10001","01010","01010","00100"]];
    (glyphs[index]||["010","111","010"]).forEach((row,j)=>[...row].forEach((pixel,i)=>{
      if(pixel==="1")p.rect(x-Math.floor(row.length/2)+i,y-2+j,1,1,color);
    }));
    if(selected){
      for(const s of [-1,1]){p.rect(x+s*13-1,y,3,1,color);p.rect(x+s*12,y-1,1,3,color);}
      p.poly([[x-3,y-17],[x+4,y-17],[x,y-12]],color);
    }
  }
  function chapterPassage(p,layout,ci,stages) {
    const accent=accents[ci%accents.length],entry=layout.landmarks[ci],nodes=layout.rooms;
    const floor="#38333e",wall="#7d6b62";
    p.rect(0,151,W,atlasHeight-151,"#262430");
    p.rect(0,151,W,2,"#564955");p.rect(0,155,W,1,"#423a46");
    for(let y=163;y<atlasHeight-4;y+=9){
      for(let x=(y%2)*9;x<W;x+=25)p.rect(x,y,18+(x%4),1,"#302c38");
    }
    if(!entry||!nodes.length)return;
    // A corridor drops from the chosen landmark into this chapter's itinerary.
    tunnel(p,[[entry.x,entry.y+10],[entry.x,158],[nodes[0].x,158],[nodes[0].x,nodes[0].y]],floor,wall);
    for(let i=1;i<nodes.length;i++){
      const prev=nodes[i-1],next=nodes[i],bend=Math.round((prev.x+next.x)*.5);
      const points=[[prev.x,prev.y],[bend,prev.y],[bend,next.y],[next.x,next.y]];
      tunnel(p,points,floor,stages[i].locked?"#5c515a":accent);
      const dir=next.x>=prev.x?1:-1;
      p.poly([[bend+4*dir,next.y-3],[bend+9*dir,next.y],[bend+4*dir,next.y+3]],stages[i].locked?"#82717c":accent);
    }
    nodes.forEach(({x,y},i)=>{
      const stage=stages[i],tone=stage.locked?"#887c89":stage.cleared?"#a4c4a2":"#f2cf88";
      const w=18,h=11;
      p.rect(x-w/2-1,y-h/2-1,w+2,h+2,ink);
      p.rect(x-w/2,y-h/2,w,h,tone);
      p.rect(x-w/2+1,y-h/2+1,w-2,h-2,"#393540");
      if(stage.locked){
        p.rect(x-2,y-3,5,3,tone);p.rect(x-1,y-2,3,2,"#393540");p.rect(x-3,y,7,3,tone);
      }else if(stage.cleared){
        p.line(x-3,y,x-1,y+2,tone);p.line(x-1,y+2,x+3,y-2,tone);
      }else{
        arch(p,x,y+3,8,8,"#dec18a");arch(p,x,y+3,5,6,"#696058");
        p.rect(x,y,1,3,"#fff1b6");
      }
    });
    p.rect(6,atlasHeight-5,W-12,1,"#60515e");p.rect(10,atlasHeight-3,W-20,1,"#433947");
  }
  function map(canvas, chapters, selectedIndex=0, stages=[]) {
    const layout=mapLayout(chapters.length,stages.length);
    canvas.width=W;canvas.height=atlasHeight;
    const ctx=canvas.getContext("2d");ctx.imageSmoothingEnabled=false;
    const p=brush(ctx), random=rng(97213);
    sky(p,random,false);
    landmarks(p,random);
    const horizon=[];
    for(let x=-4;x<=W+6;x+=7){
      const n=Math.max(0,Math.min(4,Math.floor(x/(W/5))));
      const y=sigilY[n]+3+Math.round(2*Math.sin(x*.12))+random()*3;
      horizon.push([x,y]);
    }
    p.poly([...horizon,[W,H],[0,H]],"#302d38");
    for(let i=1;i<horizon.length;i++){
      p.line(...horizon[i-1],...horizon[i],"#ac9780",2);
      p.line(horizon[i-1][0],horizon[i-1][1]+3,horizon[i][0],horizon[i][1]+3,"#61565a");
    }
    for(let i=0;i<360;i++) {
      const x=random()*W, y=112+random()*68;
      p.rect(x,y,2+random()*12,1,i%6?"#3d3742":"#4c424b");
    }
    cutaway(p,random);
    chapterPassage(p,layout,selectedIndex,stages);
    for(const x of [6,W-7]){p.rect(x,6,1,14,"#8a7a72");p.rect(x===6?x:x-13,6,14,1,"#8a7a72");}
    layout.landmarks.forEach(({x,y},i)=>sigil(p,x,y,i,i===selectedIndex,chapters[i].locked));
    return layout;
  }

  function bricks(p,random,x,y,w,h,tones) {
    p.rect(x,y,w,h,tones[0]);
    for(let row=0;row*5<h;row++){
      for(let offset=row%2?-6:0;offset<w;offset+=12){
        const left=Math.max(0,offset),right=Math.min(w,offset+11);
        if(right<=left)continue;
        p.rect(x+left,y+row*5,right-left,Math.min(4,h-row*5),tones[1+Math.floor(random()*(tones.length-1))]);
      }
    }
  }
  function roof(p,x,y,w,h,bright,dark) {
    p.poly([[x-4,y],[x+w*.46,y-h],[x+w+4,y]],dark);
    p.poly([[x-4,y],[x+w*.46,y-h],[x+w*.70,y],[x-1,y]],bright);
    for(let i=1;i<=4;i++){
      const half=i/5;
      p.rect(x+w*.46*(1-half),y-h+h*half,w*.64*half,1,dark);
    }
    p.line(x-4,y,x+w*.46,y-h,"#bd9884");
    p.rect(x-4,y,w+8,3,"#302a34");p.rect(x-4,y,w+8,1,"#9c8075");
  }
  function windowLit(p,x,y) {
    arch(p,x,y,11,16,"#332c38");arch(p,x,y-1,7,12,"#e3aa71");
    p.rect(x,y-11,1,11,"#6a4b48");p.rect(x-3,y-5,7,1,"#6a4b48");
    p.rect(x-7,y,14,2,"#aa8a77");
  }
  function crate(p,x,y,w) {
    p.rect(x,y,w,w-2,"#42323a");p.rect(x+1,y+1,w-2,w-4,"#86624e");
    p.line(x+1,y+1,x+w-3,y+w-5,"#ad8261",2);
    p.rect(x,y,w,2,"#ba926d");p.rect(x,y+w-4,w,2,"#624a43");
  }
  function sign(p,x,kind) {
    p.rect(x-3,101,24,2,"#b39072");p.rect(x+15,102,1,5,"#95877d");
    p.rect(x+19,102,1,5,"#95877d");p.rect(x+9,106,17,16,"#332e35");
    p.rect(x+10,107,15,14,"#ab8d6d");p.rect(x+11,108,13,12,"#584750");
    const xx=x+17,yy=113;
    if(kind==="box"){
      p.rect(xx-4,yy-2,9,6,"#d5a870");p.rect(xx-3,yy-3,7,1,"#f4cf8f");p.rect(xx-4,yy,9,1,"#57424b");p.rect(xx,yy,2,3,"#f0d59b");
    }else if(kind==="forge"){
      p.line(xx-3,yy+3,xx+2,yy-3,"#d7b593",2);p.rect(xx,yy-4,5,3,"#eed7b2");
    }else if(kind==="rift"){
      p.poly([[xx,yy-5],[xx+4,yy],[xx,yy+5],[xx-4,yy]],"#b3accd");p.rect(xx-1,yy-2,2,5,"#604e74");
    }else{
      p.rect(xx-4,yy-3,4,7,"#e0c7a1");p.rect(xx+1,yy-3,4,7,"#c7a888");p.rect(xx,yy-2,1,7,"#785e55");
    }
  }
  function warehouse(p,random) {
    bricks(p,random,48,94,86,51,["#403842","#68535b","#725d62","#62535b"]);
    roof(p,47,95,87,28,"#74575b","#53444f");
    for(const x of [52,76,105,129])p.rect(x,94,3,50,"#44343f");
    p.rect(48,111,86,3,"#48383f");p.line(53,110,75,96,"#4b3841",2);
    windowLit(p,66,128);arch(p,96,144,21,29,"#302a32");
    for(let x=89;x<=103;x+=4)p.rect(x,124,2,20,"#705348");
    crate(p,51,133,12);crate(p,60,138,9);crate(p,118,132,13);sign(p,108,"box");
  }
  function forge(p,random) {
    bricks(p,random,177,89,88,57,["#413944","#6c5558","#745b5b","#655359"]);
    p.rect(242,54,12,36,"#61505a");p.rect(240,52,16,4,"#a18074");
    roof(p,175,90,90,22,"#825950","#59454e");
    arch(p,217,144,39,42,"#392b34");arch(p,218,144,25,28,"#884e47");
    arch(p,218,144,15,18,"#ed985b");
    p.poly([[212,143],[216,134],[218,137],[220,131],[223,143]],"#ffd483");
    p.rect(183,122,9,21,"#5d4846");p.poly([[180,118],[199,118],[196,121],[191,122],[190,125],[184,125],[183,122]],"#a2a1a0");
    p.rect(236,133,12,9,"#6b5044");p.rect(234,133,16,2,"#ac8c6b");sign(p,240,"forge");
  }
  function sanctum(p,random) {
    bricks(p,random,333,97,65,49,["#423e50","#635c70","#746779","#655d72"]);
    spire(p,342,117,63,12,"#62596d","#4b445b","#ab93a2");
    spire(p,390,116,54,12,"#635b73","#494356","#aa94a3");
    p.poly([[338,103],[366,66],[395,103]],"#6c6072");
    p.line(338,103,366,66,"#bb9ca6",2);p.line(366,66,395,103,"#918195",2);
    arch(p,366,145,40,52,"#998599");arch(p,366,145,33,46,"#413549");
    arch(p,366,145,26,39,"#665574");arch(p,366,145,17,32,"#302b42");
    p.circle(366,85,5,"#aa91ab");p.circle(366,85,3,"#695578");
    sign(p,393,"rift");
  }
  function scriptorium(p,random) {
    bricks(p,random,439,86,82,58,["#453c44","#896e63","#957967","#80675f"]);
    roof(p,437,88,86,32,"#6c6670","#494454");windowLit(p,451,116);windowLit(p,502,115);
    p.rect(445,90,3,53,"#57434a");p.rect(481,90,3,54,"#57434a");p.rect(516,90,3,54,"#57434a");
    p.line(445,90,481,108,"#59454c",2);p.line(482,108,516,90,"#59454c",2);
    arch(p,471,145,14,30,"#43333d");
    p.poly([[487,123],[516,123],[526,133],[482,133]],"#ab8968");p.rect(486,142,34,3,"#6b5049");
    for(let i=0;i<8;i++)p.rect(488+i*4,136-i%3,3,6+i%3,i%3?"#ad8b72":"#897c85");
    sign(p,510,"book");
  }
  function street(){
    const canvas=document.createElement("canvas"),p=brush(canvasContext(canvas)),random=rng(92481);
    sky(p,random,true);
    // Towers beyond the walls establish a horizon separate from the market street.
    for(const [x,h,w] of [[7,49,12],[29,59,12],[146,47,12],[279,58,14],[306,76,12],[321,49,10],[421,57,11],[535,52,11],[564,67,15]])
      spire(p,x,116,h,w,"#484554","#393949","#79717a");
    p.rect(0,114,W,30,"#514854");
    for(let x=0;x<W;x+=14)p.rect(x,110,6,5,"#514854");
    for(const x of [19,147,288,322,422,553]){
      pine(p,x,143,24+random()*18,"#353b41");
      pine(p,x+10,142,20+random()*12,"#454849");
    }
    warehouse(p,random);forge(p,random);sanctum(p,random);scriptorium(p,random);
    p.rect(0,144,W,21,"#625354");p.rect(0,148,W,17,"#726060");
    for(let i=0;i<250;i++){const x=random()*W,y=146+random()*17;p.rect(x,y,2+random()*7,1,i%4?"#826e69":"#9a8278");}
    bricks(p,random,0,165,W,19,["#352e37","#55464a","#5f4d50","#594b50"]);
    p.rect(0,164,W,2,"#b49b86");p.rect(0,167,W,1,"#7a6462");
    for(const x of [26,151,283,415,547]){
      p.rect(x,119,3,26,"#463944");p.rect(x-3,118,9,2,"#a58972");
      p.rect(x-2,111,7,7,"#483a42");p.rect(x-1,112,5,5,"#e6b47b");
      p.rect(x+1,113,2,3,"#ffe9ab");p.rect(x,109,3,2,"#9e8475");
    }
    return canvas;
  }

  const hood = [
    ".....dd....","....daadd..","...daaaabd.","..daabbbbbd","...dfffsdd.","...dffsfd..","...dbbffd..",
    "..daaaaad..","..dbbiaabd.",".daaaiabffd",".daaaiaad..","daaaaiabbdd","dddbbbbdddd","..dbd.dbdd.","..dhh.dhhd."
  ];
  const helmet = [
    "....ddd....","...dhhhd...","..dhhhhhd..",".dahhhbhhd.",".dddbbbddd.","..dffbsd...","..dffsfd...",
    "..dhhahhd..",".dhhahahhd.","dbaaaibhbfd","dhhaaibbhfd",".dhhhibhd..",".ddbbbbbdd.","..dbd.dbd..","..dhh.dhhd."
  ];
  const brim = [
    ".....dd....","....dadd...","...daaad...","..daaabbd..","..dbbibbd..","dbbbbbbbbd.",
    "..dhfffsd..","..dhffsfd..","..dhbbffd..","..daaaaad..",".daaaiabfd.",".daaaiabffd","daaaaiaaabd","dddbbbbdddd","..dhh.dhh.."
  ];
  function figure(p,x,y,model,color) {
    const rows=model==="knight"?helmet:model==="witch"?brim:hood;
    const palette={d:ink,a:color||"#9684a2",b:"#514456",i:"#d7ad73",f:"#e5bd9b",s:"#a47a71",h:"#a8a1a2"};
    rows.forEach((row,j)=>[...row].forEach((cell,i)=>{
      if(palette[cell])p.rect(x-5+i,y-rows.length+j,1,1,palette[cell]);
    }));
  }
  const townLayout=Object.freeze({width:W,height:H,npcBaseline:148});
  function town(canvas,playerX=.5,character={},time=0,motion={},stations=[]) {
    const ctx=canvasContext(canvas,2),p=brush(ctx),seconds=Number(time)||0;
    townScenery??=street();
    ctx.drawImage(townScenery,0,0);
    for(const station of stations){
      const x=Math.round(station.x*W);
      figure(p,x,townLayout.npcBaseline,station.model,station.color);
      p.rect(x-4,125,8,1,"#877360");p.rect(x-1,123,2,4,"#d8bf86");
    }
    for(let i=0;i<5;i++){
      const rise=(seconds*(5+i)+i*3)%14;
      p.rect(218+Math.round(Math.sin(rise+i)*3),136-rise,1,2,"#ffd48a");
      p.rect(366+Math.round(Math.cos(rise+i)*7),132-rise,1,1,"#cab3dd");
    }
    const px=Math.round(Math.min(1,Math.max(0,playerX))*W);
    p.rect(px-7,158,15,2,"#433943");GlalaArt.drawActor(ctx,px,158,motion.face===true||motion.face<0,character,{state:motion.moving?"walk":"idle",phase:(time*2.6)%1,clock:time});
    p.poly([[px-3,125],[px+4,125],[px,129]],"#ffda87");
  }
  // Sparse landmarks on a transparent layer. Reuse one bitmap per chapter
  // when the battle renderer redraws its backdrop every animation frame.
  function roomLayer(ctx,theme,width,height) {
    const themes=["belfry","thicket","forge","frost","eclipse"];
    const number=themes.includes(theme)?themes.indexOf(theme)+1:Number(theme);
    if(!Number.isInteger(number)||number<1||number>5)return;
    const key=number+"-"+width+"-"+height;
    if(!cachedLayers.has(key)){
      const canvas=document.createElement("canvas");canvas.width=width;canvas.height=height;
      const p=brush(canvas.getContext("2d")), random=rng(157+number),accent=accents[number-1];
      const floor=Math.round(height*.84);
      if(number===1){
        for(const x of [75,405]){p.rect(x,0,1,16,"#877770");arch(p,x,36,13,19,"#766659");p.rect(x-8,35,17,2,accent);p.rect(x,37,2,3,accent);}
      }else if(number===2){
        for(let i=0;i<32;i++)pine(p,i*width/32,floor-2,18+random()*45,i%2?"#344345":"#3e4b49");
      }else if(number===3){
        for(const x of [42,183,396,510]){p.rect(x,floor-48,13,48,"#544348");arch(p,x+6,floor-5,8,20,"#a66b54");p.rect(x-2,floor-49,17,3,accent);}
      }else if(number===4){
        for(const x of [35,143,404,529])spire(p,x,floor-10,47+random()*36,12,"#505766","#363c50","#99a7ae");
      }else{
        for(const x of [62,178,398,517]){arch(p,x,floor-15,19,43,"#77637b");arch(p,x,floor-17,14,37,"#45384f");p.rect(x-1,floor-48,2,21,accent);}
      }
      cachedLayers.set(key,canvas);
    }
    ctx.drawImage(cachedLayers.get(key),0,0);
  }
  return Object.freeze({ map,town,townLayout,roomLayer });
})();
