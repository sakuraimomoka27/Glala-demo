/* The atlas shares a 576-pixel grid with the battle viewport.
   Custom chapter orders retain the schematic map. */
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
    const glyphs=[["1","1","1","1","1"],["101","101","101","101","101"],["10101","10101","10101","10101","10101"],["10101","10101","10101","10010","10010"],["10001","10001","01010","01010","00100"],["1000101","1000101","0101001","0101001","0010001"]];
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
    if(chapters.length===WorldFolio.chapters.length&&chapters.every((c,i)=>c.id===WorldFolio.chapters[i])){
      canvas.width=W*2;canvas.height=atlasHeight*2;
      const ctx=canvas.getContext("2d");ctx.setTransform(2,0,0,2,0,0);ctx.imageSmoothingEnabled=false;
      const chart=WorldFolio.load("itinerary"),fire=WorldFolio.load("prometheus"),p=brush(ctx);
      layout.landmarks.forEach(point=>point.y=115);
      const paint=()=>{
        p.rect(0,0,W,atlasHeight,"#18262c");
        const finalWidth=W/chapters.length;
        if(chart.naturalWidth)ctx.drawImage(chart,0,-12,W-finalWidth,178);
        if(fire.naturalWidth){
          const height=Math.min(130,finalWidth*fire.naturalHeight/fire.naturalWidth);
          ctx.drawImage(fire,W-finalWidth,113-height,finalWidth,height);
        }
        chapterPassage(p,layout,selectedIndex,stages);
        layout.landmarks.forEach(({x,y},i)=>sigil(p,x,y,i,i===selectedIndex,chapters[i].locked));
      };
      paint();for(const img of [chart,fire])if(!img.complete)img.addEventListener("load",paint,{once:true});
      return layout;
    }
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
  return Object.freeze({ map,roomLayer });
})();
