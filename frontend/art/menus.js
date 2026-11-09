/* Draw at the native pixel grid once per menu view. */
(() => {
  "use strict";
  const ink = "#161622";
  function noise(seed) {
    return () => {
      seed = (Math.imul(1664525, seed) + 1013904223) >>> 0;
      return seed / 4294967296;
    };
  }

  function painter(canvas, width, height) {
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    ctx.imageSmoothingEnabled = false;
    function rect(x, y, w, h, color) {
      ctx.fillStyle = color;
      ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
    }
    function disk(x, y, r, color) {
      for (let j = -r; j <= r; j++) {
        const span = Math.floor(Math.sqrt(r * r - j * j));
        rect(x - span, y + j, span * 2 + 1, 1, color);
      }
    }
    function polygon(points, color) {
      const ys = points.map(p => p[1]);
      for (let y = Math.ceil(Math.min(...ys)); y < Math.max(...ys); y++) {
        const cuts = [];
        for (let i = 0; i < points.length; i++) {
          const [x1, y1] = points[i], [x2, y2] = points[(i + 1) % points.length];
          if ((y1 <= y && y < y2) || (y2 <= y && y < y1)) {
            cuts.push(x1 + (x2 - x1) * (y - y1) / (y2 - y1));
          }
        }
        cuts.sort((a, b) => a - b);
        for (let i = 0; i + 1 < cuts.length; i += 2) {
          rect(Math.ceil(cuts[i]), y, Math.ceil(cuts[i + 1]) - Math.ceil(cuts[i]), 1, color);
        }
      }
    }
    return { rect, polygon, disk };
  }

  function masonry(p, rng, x, y, width, height, tile, shades, mortar) {
    p.rect(x, y, width, height, mortar);
    for (let row = 0; row * 5 < height; row++) {
      for (let col = row % 2 ? -tile / 2 : 0; col < width; col += tile) {
        const start = Math.max(0, col), end = Math.min(width, col + tile - 1);
        if (end > start) p.rect(x + start, y + row * 5, end - start, Math.min(4, height - row * 5), shades[Math.floor(rng() * shades.length)]);
      }
    }
  }

  function spire(p, x, base, height, width, color, side, windows) {
    const top = base - height, roof = top + Math.floor(height * 0.38);
    p.rect(x, roof, width, base - roof, color);
    p.polygon([[x - 2, roof + 1], [x + width * 0.5, top], [x + width + 2, roof + 1]], color);
    p.polygon([[x + width * 0.5, top], [x + width + 2, roof + 1], [x + width * 0.66, roof + 1]], side);
    p.rect(x + width - 3, roof, 3, base - roof, side);
    if (windows) {
      for (let j = roof + 6; j < base - 5; j += 12) {
        p.rect(x + width * 0.44, j, 2, 4, windows);
      }
    }
  }

  function flare(p, x, y, size) {
    p.polygon([[x - size, y], [x - size + 1, y - 6], [x - 2, y - 4], [x + 1, y - 13], [x + size, y - 4], [x + size, y]], "#d7784a");
    p.polygon([[x - size + 1, y], [x + 1, y - 8], [x + size - 1, y]], "#ffd587");
    p.rect(x - size - 1, y, size * 2 + 2, 3, "#a78667");
    p.rect(x - 1, y + 3, 3, 6, "#534756");
  }

  function gate(p, rng, cx, ground) {
    const shades = ["#454051", "#534958", "#5b505d", "#484452"];
    spire(p, cx - 66, ground, 129, 25, "#373242", "#292837", "#9b7966");
    spire(p, cx + 44, ground, 144, 21, "#393341", "#292735", "#c09371");
    spire(p, cx - 14, ground - 66, 64, 20, "#4d4351", "#302c3a");
    masonry(p, rng, cx - 57, ground - 80, 114, 80, 18, shades, "#32303d");
    p.polygon([[cx - 59, ground - 80], [cx, ground - 106], [cx + 59, ground - 80]], "#524857");
    p.polygon([[cx - 58, ground - 80], [cx, ground - 106], [cx + 58, ground - 80], [cx + 52, ground - 80], [cx, ground - 102], [cx - 51, ground - 80]], "#847071");
    const arch = (half, top, shoulder, col) => p.polygon([[cx-half,ground], [cx-half,shoulder], [cx-half+8,shoulder-15], [cx,top], [cx+half-8,shoulder-15], [cx+half,shoulder], [cx+half,ground]],col);
    arch(37, ground - 88, ground - 52, "#a89583");
    arch(34, ground - 84, ground - 51, "#534856");
    arch(29, ground - 77, ground - 48, "#73606a");
    arch(25, ground - 72, ground - 47, "#171621");
    arch(21, ground - 66, ground - 45, "#332533");
    arch(15, ground - 58, ground - 39, "#442b32");
    for (let side of [-1, 1]) {
      const x = cx + side * 53;
      masonry(p, rng, x-5, ground-97, 10, 97, 10, ["#635765","#756671","#4e4655"],"#3f3745");
      p.rect(x-8,ground-82,16,3,"#9b8580");
      p.rect(x-7,ground-38,14,3,"#82707a");
      p.rect(x-9,ground-5,18,5,"#5b5261");
      flare(p,x-side*13,ground-27,3);
    }
    // Tattered pennant hangs from the upper tower.
    p.rect(cx + 54, ground - 149, 1, 16, "#a99a8c");
    p.polygon([[cx+55,ground-149],[cx+70,ground-146],[cx+65,ground-144],[cx+72,ground-142],[cx+55,ground-143]],"#965b58");
  }

  const mage = [
    "..........kk.........",
    ".........kppk........",
    ".......kkpvpk........",
    "......kpppvvpk.......",
    ".....kpppppvvpk......",
    "....kpppggggggpk.....",
    "...kppgggggggpppk....",
    ".kkvvvvvvvvvvvvvvkk..",
    "kkpppppppppppppppvvk.",
    "...kwsffftffk........",
    "...kwsffktffk........",
    "..kwssffffffk........",
    "..kwsssttttkk........",
    ".kwsskkggggkk........",
    ".ksskppgggppvk.......",
    ".kskpppgpppppfk......",
    ".kkpppllllppvvk......",
    ".kppppgggggpppk......",
    "kppppppllllpppvk.....",
    "kppppppllllpppvk.....",
    ".kkkkkkkkkkkkkk......",
    "...kbbbk...kbbk......",
    "..kggbbk..kggbk......",
    "..kkkkkk..kkkkk......"
  ];
  const guard = [
    "........rrr..........",".......rgggr.........",".......rgrrr.........",".....kkhhhhkk........","....khHHHHhhhk.......","....khHHHggghhk......","...khhhhhhhhhhk......","...kggggggggggk......","....kfkkftffkk.......","....kffftfffk........","....kfttfttfk........","...kkhggggghhkk......","..khHhhHHHHHhvhk.....",".khHHhhHHHHHhhvfk....",".khHhhggggghhhhfkk...","..kfkghhhhhghhkk.....","..kkphhHhhHhhpk......","..kppggggggggpk......","..kppppk..kpppk......","..khHhhk..khHhk......",".kgggggk.kggggk......",".khhhhbk.khhhhk......",".kkkkkkk.kkkkkk......"
  ];
  const ranger = [
    "........kkk..........","......kkpppkk........",".....kpppvpppk.......","....kppvvpppppk......","...kppppppvvvppk.....","...kppkkffffffpk.....","...kpkfffktfkkpk.....","...kpkffttfffkpk.....","....kppgggggggkk.....","...kpggggggggppk.....","..kpppkkgggppppvk....","..kppklppgplpppvk....",".kppklpppgplkppffk...",".kppklpppgglkppffk...","kpppklggggggkpppkk...","kppkplbbbllbkpppvk...","kppkplbbkklbkpppvk...",".kkkplbbkklbkppkk....","...kbbbk..kbblk......","..kgbbbk.kgbbbk......","..kkkkkk.kkkkkk......"
  ];
  function figure(p, x, y, scale, accent, role) {
    const palette = {k:ink, p:accent, v:"#afa3b4", g:"#dfac6e", w:"#e8d9c9", s:"#b7a8ba", t:"#b7897d", f:"#f2cfb1", l:"#453845", b:"#624753", h:accent, H:"#c9c6ca", r:"#a96057"};
    const rows = [mage, guard, ranger][role];
    rows.forEach((row,j) => { for (let i=0; i<row.length; i++) if (palette[row[i]]) p.rect(x+i*scale,y+j*scale,scale,scale,palette[row[i]]); });
  }

  function drawTitle(canvas) {
    const p = painter(canvas,576,190), rng = noise(1774);
    const sky = ["#202033","#29273c","#302d43","#3b354a","#453d50","#504654","#5a4d58"];
    p.rect(0,0,576,190,"#26232f");
    sky.forEach((color,i) => p.rect(0,i*24,576,25,color));
    for (let i=0; i<127; i++) p.rect(rng()*576,rng()*100,rng()<.1?2:1,1,rng()<.5?"#666079":"#9990a0");
    p.disk(327,47,39,"#524654"); p.disk(327,47,36,"#78646b"); p.disk(327,47,34,"#e3b994"); p.disk(327,47,32,"#efd2aa");
    for(let i=0; i<42; i++) {
      const x=Math.floor(rng()*56)-28, y=Math.floor(rng()*56)-28;
      if(x*x+y*y<770) p.rect(327+x,47+y,rng()*6+1,2,"#d6b192");
    }
    for(let i=0;i<32;i++) p.rect(rng()*576,rng()*77+15,10+rng()*45,1+rng()*2,"#4f4658");
    for(let layer=0;layer<2;layer++) {
      const ridge=[[0,168],[0,96+layer*17]];
      for(let x=0;x<600;x+=10) ridge.push([x,79+layer*22+rng()*24]);
      ridge.push([576,170]);
      p.polygon(ridge,layer?"#383747":"#484353");
    }
    for(let i=0;i<36;i++) {
      const x=i*17+rng()*11;
      spire(p,x,148,34+rng()*35,7+rng()*10,"#333242","#30303e",i%5===0?"#a88170":null);
    }
    gate(p,rng,411,154);
    // Broken bridge with exposed arches and worn gold edges.
    masonry(p,rng,0,154,576,28,20,["#393545","#47414e","#4d4552","#3d3846"],"#2b2835");
    p.rect(0,154,576,2,"#a29089");
    for(let x=12;x<576;x+=45) {
      p.polygon([[x,182],[x,174],[x+5,168],[x+12,164],[x+22,168],[x+26,174],[x+26,182]],"#1e1c29");
      p.rect(x-5,158,7,24,"#4e4753");
    }
    for(let i=0;i<14;i++){
      const x=18+rng()*287;
      p.rect(x,145,2,9,"#272432");p.rect(x-1,144,4,2,"#80727a");
    }
    p.polygon([[0,153],[17,151],[30,155],[44,156],[60,168],[78,170],[102,183],[147,181],[163,185],[196,182],[245,185],[280,182],[306,188],[337,184],[385,188],[419,178],[446,177],[489,168],[517,170],[547,154],[576,149],[576,191],[0,191]],"#201e2b");
    for(let i=0;i<29;i++){let x=rng()*576;p.rect(x,183+rng()*7,5+rng()*7,1,rng()<.4?"#554650":"#372f3d");}
    for(let i=0;i<48;i++){const x=rng()*576,y=157-rng()*62;p.rect(x,y,1+rng()*1.5,1,rng()<.26?"#e7a66d":"#8f6f67");}
    const art=canvas.getContext("2d"),background=document.createElement("canvas");
    background.width=96;background.height=144;
    background.getContext("2d").drawImage(canvas,126,18,96,144,0,0,96,144);
    const reduced=window.matchMedia?.("(prefers-reduced-motion: reduce)");
    function paintGlala(seconds){
      art.drawImage(background,126,18);
      const beat=seconds%3.6,air=Math.min(1,Math.max(0,(beat-.22)/.88));
      const lift=4*air*(1-air),state=beat<.22?"crouch":beat<1.1?(air<.18?"launch":air<.4?"rise":air<.58?"apex":"fall"):beat<1.21?"land":beat<1.34?"recover":"idle";
      art.save();art.scale(2,2);
      const phase=state==="crouch"?beat/.22:state==="land"?(beat-1.1)/.11:state==="recover"?(beat-1.21)/.13:state==="idle"?(seconds*.8)%1:air;
      GlalaArt.drawActor(art,87,77-Math.round(lift*23),false,"glala",{state,phase,clock:seconds});
      art.restore();
    }
    paintGlala(1.6);
    if(reduced?.matches)return;
    let origin,last=-100;
    function animate(time){
      if(!canvas.isConnected)return;
      if(time-last>=70){origin??=time;last=time;paintGlala(reduced?.matches?1.6:(time-origin)/1000+1.6)}
      if(!reduced?.matches)requestAnimationFrame(animate);
    }
    requestAnimationFrame(animate);
  }

  function drawCamp(canvas) {
    const p=painter(canvas,576,88),rng=noise(931);
    p.rect(0,0,576,88,"#272538");
    p.rect(0,23,576,20,"#393344");
    p.rect(0,43,576,27,"#574353");
    p.disk(462,23,14,"#bc9791");p.disk(465,18,13,"#272538");
    for(let i=0;i<75;i++)p.rect(rng()*576,rng()*33,1,1,"#887484");
    for(let x=0;x<576;x+=17){
      const height=10+rng()*19;
      p.polygon([[x-9,58],[x+9,58-height],[x+24,58]],"#35303f");
    }
    spire(p,360,58,48,14,"#37303f","#2b2736","#b48871");
    spire(p,388,59,35,11,"#423444","#2b2736","#bb8a70");
    p.rect(0,58,576,30,"#302936");p.rect(0,68,576,20,"#241f2b");
    for(let i=0;i<100;i++)p.rect(rng()*576,60+rng()*28,2+rng()*8,1,"#473a45");
    for(const [x,h] of [[96,30],[178,20],[450,25]]){
      p.polygon([[x-45,67],[x,65-h],[x+41,67]],"#84635e");
      p.polygon([[x,65-h],[x+16,67],[x+41,67]],"#534451");
      p.polygon([[x-13,67],[x,72-h],[x+10,67]],"#29232e");
      p.rect(x,63-h,1,h+5,"#c69a76");
    }
    for(let i=6;i>=0;i--)p.rect(280-i*4,71+(6-i),i*8+1,1,"#705145");
    p.rect(273,69,24,3,"#ad7855");p.rect(276,72,21,3,"#6e4e43");
    p.polygon([[275,70],[278,57],[281,60],[285,44],[289,56],[291,50],[295,69]],"#da814d");
    p.polygon([[281,69],[285,54],[288,60],[291,67]],"#ffcd79");
    for(let i=0;i<12;i++)p.rect(281+rng()*16,40+rng()*16,1,2,"#db9d63");
    p.rect(228,43,2,24,"#7c6458");p.rect(229,43,12,2,"#a58a6e");
    p.rect(237,45,1,3,"#a58a6e");p.rect(234,48,7,8,"#8f6951");p.rect(236,49,3,5,"#ffd09a");
    for(let x of [12,34,510,545,568]){
      const h=25+rng()*28;
      p.polygon([[x-16,71],[x,71-h],[x+16,71]],"#211e2a");p.rect(x-2,69,4,13,"#211e2a");
    }
  }

  function tintInfo(accent) {
    const valid = /^#[a-f0-9]{6}$/i.test(accent) ? accent : "#82618c";
    const channels = [1,3,5].map(i=>parseInt(valid.slice(i,i+2),16));
    return { color: valid, role: channels[0] > channels[2] && channels[0] >= channels[1] ? 1 : channels[1] >= channels[0] && channels[1] >= channels[2] ? 2 : 0 };
  }

  function drawPortrait(canvas,accent,model) {
    const p=painter(canvas,80,64), {color}=tintInfo(accent),role=({witch:0,knight:1,scout:2})[model]??0;
    p.rect(0,0,80,64,"#22212e");p.disk(40,30,26,"#332b3b");p.disk(40,30,23,"#45384a");
    for(let i=0;i<5;i++) {p.rect(3+i*3,3,2,1,"#837268");p.rect(75-i*3,60,2,1,"#837268");}
    p.rect(17,53,46,3,"#594957");p.rect(13,56,54,4,"#342d39");p.rect(11,60,58,2,"#705e63");
    figure(p,23,6+(role===2?5:0),2,color,role);
  }

  function drawLevel(canvas,accent) {
    const p=painter(canvas,144,60), {color,role}=tintInfo(accent), rng=noise(655+role);
    p.rect(0,0,144,60,"#292838");p.rect(0,23,144,37,"#363244");p.disk(104,14,10,"#c2a891");
    const ridge=[[0,50],[0,30]];
    for(let x=0;x<153;x+=8)ridge.push([x,25+rng()*10]);
    ridge.push([144,50]);p.polygon(ridge,"#46404e");
    for(let i=0;i<11;i++)spire(p,i*15+rng()*5,48,11+rng()*19,4+rng()*6,"#32303f","#282635");
    if(role===1) {
      for(let x of [28,51,68])p.polygon([[x,50],[x+2,31],[x+7,24],[x+10,46],[x+9,50]],color);
      flare(p,92,45,2);
    } else if(role===2) {
      for(let i=0;i<9;i++){const x=9+i*14,h=9+rng()*23;p.polygon([[x-6,47],[x,47-h],[x+7,47]],color);}
    } else {
      masonry(p,rng,35,23,12,26,6,[color,"#65596a"],"#3a3543");
      masonry(p,rng,75,19,12,30,6,[color,"#65596a"],"#3a3543");
      p.polygon([[34,23],[58,12],[88,19],[85,23],[58,17],[39,28]],color);
    }
    masonry(p,rng,0,49,144,11,10,["#49404b","#534954","#5c4e59"],"#322b37");
    p.rect(0,49,144,1,"#a08b80");
  }

  function lantern(canvas){
    const p=painter(canvas,40,44);
    p.rect(18,3,4,2,"#a18a74");p.rect(16,5,2,6,"#675b68");p.rect(22,5,2,6,"#675b68");
    p.polygon([[10,17],[16,12],[18,10],[22,10],[24,12],[30,17]],"#87726a");
    p.rect(9,17,22,2,"#c4a17e");p.rect(11,19,18,2,"#50444d");
    p.polygon([[12,21],[28,21],[25,34],[15,34]],"#564954");
    p.polygon([[15,21],[25,21],[23,32],[17,32]],"#332e40");
    p.rect(19,22,2,9,"#8d7473");p.rect(16,33,8,2,"#9f8974");
    p.rect(12,35,16,2,"#675766");p.rect(16,37,8,2,"#494050");p.rect(19,39,2,2,"#96816e");
  }
  window.MenuArt = Object.freeze({
    draw(canvas,kind,color,model) {
      if(kind==="title")drawTitle(canvas);
      if(kind==="camp")drawCamp(canvas);
      if(kind==="portrait")drawPortrait(canvas,color,model);
      if(kind==="level")drawLevel(canvas,color);
      if(kind==="lantern")lantern(canvas);
    }
  });
})();

