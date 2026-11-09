/* Original pixel portraits of the imaginary constructs, painted on a fixed logical grid. */
globalThis.SummonArt = (() => {
  "use strict";
  const width=152, height=108, outline="#1b1d28";
  const themes = {
    dione:{night:"#1b2337", shade:"#293248", haze:"#3b4861", etch:"#53677a", light:"#9cdae6", spark:"#e1fcf6"},
    mnemosyne:{night:"#15292c", shade:"#203936", haze:"#304b43", etch:"#4b6555", light:"#9ccda6", spark:"#e2f1c1"},
    atlas:{night:"#2a2429", shade:"#393135", haze:"#4e4141", etch:"#685649", light:"#ccad78", spark:"#f5d79d"},
    prometheus:{night:"#2e202a",shade:"#402a35",haze:"#583b43",etch:"#7c544f",light:"#ec9b75",spark:"#ffd9a0"},
    cronus:{night:"#262738",shade:"#363747",haze:"#4b4857",etch:"#666272",light:"#dec79c",spark:"#fcf0c9"},
    hecate:{night:"#161d32",shade:"#222c43",haze:"#314055",etch:"#495a74",light:"#82cbd9",spark:"#c3fff2"},
    unknown:{night:"#242331", shade:"#31303e", haze:"#444050", etch:"#575267", light:"#a596ac", spark:"#d7c9c4"}
  };
  const names={dione:"狄俄涅",mnemosyne:"谟涅摩叙涅",atlas:"亚特拉斯",prometheus:"普罗米修斯",cronus:"克洛诺斯",hecate:"赫卡忒",unknown:"虚数体"};
  const cache = new Map();

  function identity(summon) {
    if (Object.hasOwn(themes,summon?.portrait)) return summon.portrait;
    const text=(typeof summon==="object" && summon ? [summon.id,summon.sourceId,summon.art,summon.name,summon.enName,summon.element] : [summon]).join(" ").toLowerCase();
    if (/12002|dione|狄俄涅/.test(text)) return "dione";
    if (/12004|mnemosyne|谟涅摩叙涅/.test(text)) return "mnemosyne";
    if (/12003|atlas|亚特拉斯/.test(text)) return "atlas";
    if (/12001|prometheus|普罗米修斯/.test(text)) return "prometheus";
    if (/12005|cronus|克洛诺斯/.test(text)) return "cronus";
    if (/12006|hecate|赫卡忒/.test(text)) return "hecate";
    return "unknown";
  }

  function brushes(ctx) {
    function rect(x,y,w,h,color) {
      ctx.fillStyle=color;
      ctx.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h));
    }
    function line(x0,y0,x1,y1,color) {
      const dx=Math.abs(x1-x0),dy=-Math.abs(y1-y0),sx=x0<x1?1:-1,sy=y0<y1?1:-1;
      let error=dx+dy;
      for (;;) {
        rect(x0,y0,1,1,color);
        if (x0===x1 && y0===y1) break;
        const doubled=2*error;
        if (doubled>=dy){error+=dy;x0+=sx;}
        if (doubled<=dx){error+=dx;y0+=sy;}
      }
    }
    function poly(points,color) {
      const ys=points.map(point=>point[1]);
      for (let y=Math.max(0,Math.min(...ys));y<Math.min(height,Math.max(...ys));y++) {
        const cuts=[];
        for (let i=0;i<points.length;i++){
          const [ax,ay]=points[i], [bx,by]=points[(i+1)%points.length];
          if ((ay<=y&&by>y)||(by<=y&&ay>y)) cuts.push(ax+(bx-ax)*(y-ay)/(by-ay));
        }
        cuts.sort((a,b)=>a-b);
        for (let i=0;i+1<cuts.length;i+=2) {
          const x=Math.ceil(cuts[i]);
          rect(x,y,Math.ceil(cuts[i+1])-x,1,color);
        }
      }
    }
    function armor(points,color) {
      poly(points,color);
      for(let i=0;i<points.length;i++) {
        const [x0,y0]=points[i],[x1,y1]=points[(i+1)%points.length];
        line(x0,y0,x1,y1,outline);
      }
    }
    return {rect,line,poly,armor};
  }

  function chamber(p,theme) {
    p.rect(0,0,width,height,theme.night);
    p.poly([[0,25],[29,9],[69,9],[103,3],[152,9],[152,81],[0,81]],theme.shade);
    for (let k=0;k<5;k++) {
      const x=8+k*34;
      p.poly([[x-22,79],[x-22,39],[x-15,25],[x,13],[x+15,25],[x+22,39],[x+22,79],[x+18,79],[x+18,40],[x+12,28],[x,18],[x-12,28],[x-18,40],[x-18,79]],theme.haze);
    }
    for (let x=-56;x<width;x+=16)p.line(x,107,x+76,68,theme.shade);
    for (let y=76;y<height;y+=7)p.line(0,y,151,y,theme.shade);
    // The engraved circle behind the construct recedes into the vaulted nave.
    for (const radius of [33,36]) {
      for (let degrees=0;degrees<360;degrees+=3) {
        const theta=degrees*Math.PI/180;
        const x=Math.round(75+radius*Math.cos(theta)),y=Math.round(48+radius*Math.sin(theta));
        p.rect(x,y,1,1,radius===36?theme.haze:theme.etch);
      }
    }
    for (let i=0;i<27;i++) {
      const x=(i*71+13)%149,y=(i*43+11)%96;
      p.rect(x,y,1,i%7===0?2:1,i%7===0?theme.light:theme.etch);
    }
  }

  function dione(p) {
    const pearl="#e4e4e6",white="#faf3e8",silver="#bfc2ce",lavender="#8b8da6",violet="#514864",dark="#38374d",blue="#91e3f0",gold="#c8a06e";
    // Crescent blade and the articulated wing on the far side.
    p.armor([[10,11],[22,26],[28,46],[36,56],[39,65],[33,73],[26,64],[24,54],[19,49],[16,30]],silver);
    p.poly([[11,13],[21,28],[25,47],[31,55],[30,59],[22,48],[18,31]],white);
    p.line(24,48,32,60,blue);
    p.armor([[33,62],[39,64],[38,76],[35,79],[31,75]],dark);
    p.armor([[85,45],[103,27],[123,11],[119,27],[111,39],[132,27],[124,43],[112,53],[102,65],[94,62]],violet);
    p.poly([[94,44],[112,25],[120,16],[115,32],[101,48]],pearl);
    p.poly([[100,46],[126,31],[120,42],[107,52]],lavender);
    for(let i=0;i<4;i++)p.line(107+i*3,47,114+i*4,61+i,lavender);
    // Pelvis and legs form the dark shape under the white plates.
    p.armor([[62,67],[82,63],[90,73],[88,82],[97,94],[103,105],[91,105],[82,91],[74,81],[70,92],[61,105],[49,105],[57,89],[56,78]],dark);
    p.armor([[57,73],[67,71],[72,77],[68,90],[60,99],[51,102],[52,90]],pearl);
    p.poly([[58,76],[67,73],[68,77],[60,88],[56,98],[53,99]],white);
    p.poly([[61,96],[70,81],[71,76],[73,79],[68,93],[62,100]],lavender);
    p.armor([[77,74],[87,71],[94,77],[95,87],[101,97],[99,100],[89,90],[81,88]],silver);
    p.poly([[81,77],[88,74],[92,78],[94,86],[89,85]],white);
    p.armor([[52,96],[59,95],[63,99],[58,105],[47,105]],lavender);
    p.rect(52,99,4,2,blue);
    p.armor([[91,91],[95,89],[99,92],[103,105],[95,105]],pearl);
    // The left arm reaches for the blade and the right carries a segmented gauntlet.
    p.armor([[53,43],[60,45],[58,57],[51,64],[43,68],[38,74],[33,72],[35,64],[42,58],[46,48]],dark);
    p.armor([[45,53],[54,52],[55,56],[46,64],[38,69],[36,66]],pearl);
    p.poly([[46,54],[52,53],[49,59],[40,65],[39,64]],white);
    p.armor([[91,45],[97,47],[99,59],[104,66],[105,78],[98,85],[92,82],[93,74],[87,64]],dark);
    p.armor([[93,57],[98,59],[103,69],[100,76],[94,73],[90,63]],silver);
    p.poly([[94,59],[97,61],[101,69],[98,72],[94,68]],white);
    // Raised pauldrons, narrow waist and two overlapping breastplates.
    p.armor([[51,39],[60,36],[68,43],[67,51],[55,56],[47,50],[46,45]],pearl);
    p.poly([[48,44],[53,40],[60,38],[64,42],[54,43],[49,48]],white);
    p.poly([[48,49],[59,45],[65,45],[57,52],[52,53]],lavender);
    p.armor([[61,43],[73,39],[87,42],[96,48],[87,59],[84,66],[77,72],[66,68],[63,58],[57,52]],violet);
    p.armor([[60,43],[70,41],[78,46],[76,51],[68,56],[62,54],[57,48]],pearl);
    p.poly([[59,45],[68,43],[75,46],[66,48],[61,50]],white);
    p.armor([[78,46],[86,42],[94,46],[90,52],[82,57],[76,52]],silver);
    p.line(79,50,86,47,blue);
    p.poly([[66,61],[74,63],[81,59],[80,66],[74,69],[68,66]],dark);
    p.armor([[85,40],[98,34],[104,35],[100,43],[100,49],[92,53],[84,48]],pearl);
    p.poly([[87,41],[99,36],[102,36],[97,41],[91,43]],white);
    p.poly([[91,45],[100,40],[99,44],[94,48]],"#ad6773");
    // Crown horn, mask and cyan visor.
    p.armor([[66,29],[70,23],[77,22],[84,29],[83,38],[76,43],[70,40],[65,36]],violet);
    p.armor([[68,29],[72,24],[77,24],[81,28],[76,29],[73,37],[68,35]],pearl);
    p.armor([[68,30],[66,26],[60,18],[63,22],[70,26],[72,28]],white);
    p.armor([[73,25],[77,16],[79,6],[81,13],[79,23],[76,28]],silver);
    p.line(78,18,80,10,blue);
    p.poly([[69,32],[74,29],[77,29],[74,33],[69,35]],dark);
    p.line(70,32,74,30,blue);
    p.poly([[74,36],[78,32],[79,37],[75,41]],pearl);
    p.rect(76,64,2,2,gold);
  }

  function mnemosyne(p) {
    const pine="#34544a",jade="#508363",mint="#8eb392",ivory="#dedfca",white="#f4ecd7",slate="#4b5260",dark="#2d333e",amber="#ffc464",leaf="#9fe076";
    // Swept-back wind blades use an entirely different outline from Dione's fan.
    p.armor([[80,44],[96,28],[126,13],[123,19],[104,36],[118,33],[134,32],[118,42],[105,44],[112,47],[125,52],[108,51],[98,50],[93,56]],pine);
    p.poly([[93,39],[107,27],[123,16],[116,24],[103,36]],mint);
    p.poly([[105,42],[126,34],[120,38],[110,42]],jade);
    p.armor([[61,47],[49,34],[36,30],[43,40],[39,44],[48,47],[43,56],[56,54]],pine);
    p.armor([[61,67],[80,65],[88,72],[88,83],[93,88],[99,103],[90,104],[78,87],[70,81],[65,94],[57,105],[44,105],[51,93],[53,81]],dark);
    p.armor([[53,76],[63,71],[69,77],[65,90],[59,96],[50,98],[50,91]],jade);
    p.poly([[55,78],[61,73],[65,75],[62,84],[56,92],[53,91]],mint);
    p.armor([[50,95],[58,92],[62,96],[58,102],[51,106],[42,105]],ivory);
    p.line(46,103,54,98,white);
    p.armor([[76,73],[84,71],[91,76],[94,85],[91,91],[85,89],[81,83],[76,81]],ivory);
    p.poly([[84,74],[88,76],[91,84],[88,85],[84,79]],white);
    p.armor([[90,88],[94,85],[99,91],[105,104],[99,102],[95,96],[92,97]],jade);
    p.line(94,89,98,93,amber);
    p.armor([[54,46],[58,51],[56,58],[51,64],[48,75],[44,81],[39,79],[40,72],[44,65],[44,57]],dark);
    p.armor([[43,59],[52,55],[53,60],[46,68],[43,75],[39,78],[39,70]],ivory);
    p.poly([[40,67],[45,61],[49,59],[46,64],[42,71]],white);
    p.armor([[89,46],[99,45],[102,54],[100,61],[106,63],[105,72],[97,80],[92,77],[93,67],[88,60]],dark);
    p.armor([[95,58],[101,55],[101,62],[107,63],[103,71],[98,74],[94,70]],jade);
    p.poly([[98,61],[100,59],[100,63],[104,65],[101,68],[97,68]],mint);
    p.armor([[56,44],[62,40],[72,39],[85,40],[92,46],[88,57],[80,62],[78,69],[66,73],[59,69],[59,61],[54,54]],slate);
    p.armor([[53,45],[64,41],[74,42],[78,48],[73,55],[70,61],[61,59],[56,53]],ivory);
    p.poly([[55,46],[64,43],[71,43],[74,47],[66,48],[61,54],[57,51]],white);
    p.poly([[64,61],[72,58],[76,51],[78,54],[73,64],[69,67]],pine);
    p.armor([[74,47],[83,41],[95,44],[94,50],[87,56],[79,58],[74,54]],jade);
    p.poly([[78,48],[85,45],[92,46],[89,48],[84,49],[81,54],[77,53]],mint);
    p.poly([[83,49],[88,48],[87,51],[82,53]],amber);
    p.armor([[46,37],[52,34],[60,35],[66,41],[62,46],[54,48],[45,46],[42,41]],ivory);
    p.poly([[43,39],[49,36],[54,36],[50,39],[49,45],[45,44]],jade);
    p.line(52,44,58,43,amber);
    p.armor([[87,37],[99,30],[105,29],[102,37],[108,40],[102,46],[93,48],[85,44]],jade);
    p.poly([[89,36],[100,32],[103,31],[98,36],[92,40]],mint);
    p.armor([[67,28],[76,23],[86,23],[89,20],[93,20],[89,25],[79,30],[76,37],[69,39],[64,34]],pine);
    p.poly([[68,28],[75,24],[81,25],[76,29],[71,30]],ivory);
    p.armor([[66,31],[71,29],[78,29],[75,34],[70,38],[67,35]],leaf);
    p.line(67,32,72,30,amber);
    p.poly([[71,37],[76,33],[75,38],[72,41],[69,39]],jade);
    p.line(61,66,65,67,amber);
  }

  function atlas(p) {
    const iron="#4e4243",joint="#57494a",shade="#786957",sand="#aa9475",tan="#c7ac83",light="#e4d1ab",alloy="#e0b276",blue="#84dae1",dark="#39323a";
    // Shoulder cannon and heavy over-the-back siege assembly.
    p.armor([[85,48],[96,32],[101,24],[102,15],[108,11],[118,14],[123,20],[121,28],[118,31],[127,42],[124,49],[113,50],[102,45],[96,53]],iron);
    p.armor([[100,28],[100,19],[106,13],[114,14],[120,19],[119,24],[111,24],[108,29],[106,38]],sand);
    p.poly([[102,21],[107,15],[113,16],[116,18],[110,18],[106,24]],tan);
    p.rect(111,20,4,2,blue);
    p.armor([[45,40],[26,34],[16,32],[17,29],[36,31],[54,33],[63,39],[61,43]],sand);
    p.poly([[19,30],[35,32],[48,34],[53,36],[35,34]],light);
    p.line(33,34,42,36,blue);
    // Large articulated legs under the angular waist.
    p.armor([[62,68],[84,67],[91,71],[90,82],[93,85],[98,92],[102,104],[89,106],[80,94],[74,84],[66,83],[59,91],[50,101],[36,104],[32,101],[40,92],[46,80],[51,76]],dark);
    p.armor([[48,79],[57,72],[66,74],[69,79],[62,87],[53,92],[45,90]],sand);
    p.poly([[49,79],[56,75],[61,75],[57,80],[48,86]],light);
    p.poly([[54,87],[65,77],[66,80],[60,86],[54,89]],shade);
    p.armor([[42,91],[48,88],[54,91],[53,98],[45,103],[34,105],[32,102]],sand);
    p.poly([[35,101],[43,95],[47,93],[44,99]],light);
    p.armor([[77,73],[86,70],[94,73],[98,81],[98,88],[92,94],[82,89],[79,83]],sand);
    p.poly([[80,75],[86,72],[92,75],[93,79],[83,80]],light);
    p.armor([[90,88],[98,84],[102,86],[106,99],[107,105],[95,106],[88,98]],tan);
    p.poly([[93,91],[98,87],[100,89],[102,98],[98,96],[96,94]],light);
    p.armor([[92,96],[96,93],[101,95],[102,99],[97,102],[93,100]],shade);
    p.armor([[50,45],[61,39],[75,40],[90,39],[102,45],[103,54],[96,64],[88,69],[81,71],[65,71],[56,67],[48,61],[46,53]],joint);
    p.armor([[50,46],[60,41],[70,43],[75,49],[71,55],[60,58],[53,55]],sand);
    p.poly([[52,46],[60,43],[68,44],[71,47],[62,48],[57,53],[53,52]],light);
    p.armor([[73,49],[83,42],[93,42],[98,46],[96,51],[87,56],[78,55],[72,56]],alloy);
    p.poly([[77,49],[84,45],[91,44],[94,45],[85,48],[82,51]],light);
    p.armor([[60,58],[70,55],[78,55],[85,59],[83,65],[76,70],[66,68],[64,64]],shade);
    p.poly([[65,59],[71,56],[76,57],[72,61],[67,62]],tan);
    p.armor([[94,43],[103,38],[110,40],[117,48],[114,55],[106,61],[97,60],[93,53]],sand);
    p.poly([[97,43],[104,40],[109,42],[112,46],[105,48],[99,52]],tan);
    p.armor([[108,57],[116,53],[120,56],[122,65],[128,70],[128,80],[121,84],[113,81],[113,75],[109,71]],joint);
    p.armor([[111,60],[118,58],[120,63],[120,67],[125,70],[122,76],[117,76],[113,71]],sand);
    p.poly([[114,62],[118,60],[119,63],[119,67],[116,68]],blue);
    // Twin forward gun barrels are deliberately larger than the other two constructs' weapons.
    p.armor([[15,64],[31,62],[35,59],[49,56],[58,57],[63,61],[60,67],[52,70],[38,71],[33,74],[15,75],[8,73],[8,67]],iron);
    p.armor([[7,65],[30,62],[38,59],[50,58],[53,61],[47,64],[31,66],[27,69],[7,70]],sand);
    p.poly([[9,65],[28,63],[34,62],[30,65],[13,67],[9,68]],light);
    p.armor([[11,70],[29,68],[34,67],[45,65],[48,67],[43,70],[33,70],[29,73],[12,74]],shade);
    p.rect(8,67,3,2,dark);
    p.line(20,69,29,68,blue);
    p.armor([[47,58],[50,54],[56,53],[63,56],[65,61],[60,65],[54,65],[49,62]],shade);
    p.poly([[49,58],[53,55],[57,55],[58,58],[53,60]],light);
    p.armor([[60,36],[65,31],[73,29],[81,32],[83,37],[79,42],[75,44],[66,42]],joint);
    p.armor([[62,36],[67,31],[74,31],[78,33],[77,36],[72,37],[67,39]],light);
    p.poly([[65,38],[70,36],[75,36],[73,39],[68,41]],dark);
    p.line(67,38,71,37,blue);
    p.armor([[74,40],[81,36],[84,37],[81,42],[76,45],[72,44]],tan);
    p.rect(88,59,3,3,blue);
  }

  function prometheus(p) {
    const red="#a04749",ember="#d47257",deep="#623541",joint="#353841",silver="#c9c7c8",white="#f1e8db",shade="#8e91a0",aqua="#a1e8e8";
    // A pair of rigid red flight vanes and a long, forward-pointed sword.
    p.armor([[36,56],[32,39],[26,15],[34,22],[42,37],[41,18],[48,27],[53,45],[50,58],[44,66]],deep);
    p.poly([[28,18],[35,26],[41,43],[38,48],[35,39]],red);
    p.armor([[88,52],[94,29],[110,8],[112,25],[108,37],[121,19],[123,16],[121,34],[112,46],[136,73],[139,84],[111,66],[108,70],[95,57]],deep);
    p.poly([[97,37],[108,14],[109,25],[105,36],[109,46],[122,62],[109,55],[100,47]],red);
    p.poly([[114,41],[121,25],[119,36],[116,43],[133,70]],red);p.line(107,19,100,36,ember);
    p.armor([[53,61],[62,56],[80,55],[89,62],[87,72],[94,82],[103,99],[101,105],[88,103],[77,87],[71,77],[64,83],[57,95],[47,105],[37,105],[48,92],[50,81]],joint);
    p.armor([[51,69],[63,66],[69,71],[63,82],[58,89],[50,88],[46,82]],silver);
    p.poly([[51,72],[61,69],[63,71],[57,75],[52,84],[48,82]],white);
    p.armor([[48,86],[56,88],[56,93],[50,99],[48,104],[40,105],[43,97]],red);
    p.armor([[74,68],[84,65],[90,72],[94,81],[91,86],[85,86],[78,80]],silver);
    p.poly([[77,70],[83,67],[88,73],[90,78],[84,76]],white);
    p.armor([[88,84],[94,81],[99,86],[101,96],[106,104],[96,105],[91,96]],red);
    p.line(94,88,97,92,ember);
    p.armor([[52,38],[61,33],[70,35],[83,34],[94,40],[91,51],[85,58],[80,65],[68,69],[57,64],[54,56],[47,49]],joint);
    p.armor([[52,39],[62,36],[69,39],[68,44],[62,47],[52,46],[47,43]],red);
    p.poly([[50,40],[59,37],[65,38],[60,40],[54,43]],ember);
    p.armor([[68,39],[76,35],[86,37],[88,42],[81,48],[72,47],[64,46]],silver);
    p.poly([[70,39],[77,36],[83,38],[76,39],[70,44]],white);
    p.armor([[54,49],[63,46],[70,49],[72,53],[67,57],[58,56]],silver);
    p.armor([[68,54],[78,48],[86,48],[83,55],[76,60],[69,60]],shade);
    p.poly([[66,59],[73,60],[81,56],[78,62],[71,65],[65,63]],white);
    p.armor([[87,39],[96,33],[104,36],[110,44],[104,51],[96,52],[89,46]],red);
    p.poly([[91,39],[98,36],[104,39],[106,42],[98,41],[94,43]],ember);
    p.armor([[99,49],[106,46],[109,52],[105,61],[108,66],[103,71],[97,66],[96,62]],silver);
    p.poly([[101,51],[106,49],[105,56],[99,61]],white);p.rect(100,63,3,2,aqua);
    p.armor([[47,43],[54,45],[56,51],[49,59],[45,67],[38,70],[35,68],[39,58]],silver);
    p.armor([[40,57],[49,58],[48,63],[44,70],[39,72],[35,68]],red);p.line(40,61,45,60,ember);
    p.armor([[54,30],[58,22],[65,19],[73,21],[78,26],[75,32],[66,37],[57,35]],silver);
    p.poly([[55,29],[60,23],[66,21],[72,22],[65,25],[61,29]],white);
    p.armor([[56,30],[65,29],[73,26],[71,31],[63,35],[58,34]],joint);
    p.line(57,31,65,30,aqua);p.line(65,30,70,28,aqua);
    p.armor([[65,22],[66,12],[72,5],[70,19]],shade);p.poly([[67,20],[68,13],[71,8],[69,18]],white);
    p.armor([[73,30],[82,16],[86,14],[81,26],[75,34]],red);
    p.armor([[10,100],[13,91],[31,69],[34,64],[39,66],[42,64],[44,66],[39,70],[34,71]],red);
    p.poly([[12,96],[21,83],[31,71],[33,69],[30,75],[19,89]],ember);
    p.line(12,99,29,78,"#ffba76");p.line(31,66,38,70,silver);
  }

  function cronus(p) {
    const joint="#383942",metal="#858791",slate="#697381",silver="#c4c8cc",ivory="#e9e9e3",white="#fff6e6",gold="#c69e66",lit="#ffe39c";
    // Narrow feather-like blades hinge into two staggered fans. Gold conduits
    // divide the pale armor and remain legible when the body becomes a sprite.
    for(const [rootX,rootY,tipX,tipY] of [[92,43,123,12],[96,47,143,32],[95,53,140,63],[51,41,34,19],[48,49,28,57]]){
      const dx=tipX>rootX?1:-1;
      p.armor([[rootX,rootY+8],[rootX-2*dx,rootY-4],[rootX+8*dx,rootY-10],[tipX,tipY],[tipX-9*dx,tipY+7],[rootX+12*dx,rootY+2]],metal);
      p.poly([[rootX+2*dx,rootY-3],[rootX+9*dx,rootY-8],[tipX-3*dx,tipY+1],[tipX-10*dx,tipY+5],[rootX+12*dx,rootY-1]],ivory);
      p.line(rootX+3*dx,rootY+5,rootX+14*dx,rootY,gold);
    }
    p.armor([[58,62],[81,60],[89,66],[88,75],[94,89],[99,101],[96,105],[85,102],[77,86],[69,77],[66,88],[55,101],[47,104],[43,101],[52,89],[53,79]],joint);
    p.armor([[52,70],[61,66],[69,70],[66,78],[58,89],[51,87],[48,81]],silver);
    p.poly([[52,73],[60,68],[65,70],[62,75],[55,83],[51,82]],ivory);
    p.armor([[48,86],[56,86],[57,91],[51,100],[52,104],[40,105],[42,102]],slate);
    p.poly([[49,88],[53,88],[50,95],[45,102],[43,102]],ivory);
    p.armor([[73,69],[83,67],[88,72],[91,82],[85,85],[80,82]],ivory);
    p.poly([[78,70],[82,69],[86,73],[89,80],[85,78]],white);
    p.armor([[85,86],[92,80],[97,86],[99,97],[105,104],[99,105],[93,102],[87,95]],metal);
    p.poly([[92,85],[96,88],[97,96],[102,102],[96,99],[91,93]],silver);p.line(90,96,96,102,gold);
    p.armor([[54,41],[63,34],[74,35],[83,35],[94,41],[94,50],[87,58],[80,66],[69,71],[60,66],[56,57],[49,51]],joint);
    p.armor([[49,42],[57,37],[66,38],[71,43],[68,48],[58,51],[50,48]],silver);
    p.poly([[51,42],[58,39],[64,39],[67,42],[60,43],[53,46]],white);
    p.armor([[70,42],[78,36],[85,37],[90,41],[87,46],[78,50],[68,49]],ivory);
    p.poly([[72,43],[78,38],[83,38],[84,40],[78,42]],white);
    p.armor([[58,52],[69,49],[74,52],[70,58],[63,62],[60,59]],metal);
    p.armor([[73,52],[81,49],[88,48],[85,56],[77,61],[70,64],[69,59]],silver);
    p.line(53,49,66,50,gold);p.line(66,50,71,54,lit);p.line(71,55,67,62,gold);p.line(73,62,83,56,lit);
    p.armor([[88,38],[98,32],[104,33],[110,38],[108,46],[101,52],[93,49]],ivory);
    p.poly([[92,39],[99,34],[104,35],[106,37],[99,40],[96,44]],white);
    p.armor([[100,50],[106,47],[111,51],[111,60],[115,65],[113,73],[108,76],[104,72],[101,65]],metal);
    p.armor([[102,54],[107,50],[110,53],[109,60],[114,67],[111,70],[107,66]],silver);
    p.line(105,63,111,69,gold);
    p.armor([[47,42],[53,44],[52,51],[47,55],[45,65],[44,69],[39,70],[36,66],[37,59],[40,50]],metal);
    p.poly([[41,50],[47,45],[50,46],[48,51],[44,55],[42,62],[39,62]],ivory);
    p.armor([[57,30],[62,24],[68,20],[76,19],[80,23],[78,30],[68,36],[61,36]],metal);
    p.poly([[59,29],[64,24],[71,22],[74,22],[69,26],[62,31]],white);
    p.armor([[58,30],[66,28],[74,25],[72,30],[65,34],[60,34]],joint);
    p.line(59,31,67,29,lit);p.armor([[68,23],[71,14],[78,8],[76,17],[73,23]],ivory);
    p.armor([[73,24],[84,12],[95,5],[92,12],[82,23],[77,27]],silver);
    p.line(83,19,91,11,white);
    p.armor([[23,96],[33,76],[39,68],[37,65],[41,62],[44,67],[48,68],[47,70],[42,71],[32,86]],silver);
    p.line(24,94,37,74,lit);
  }

  function hecate(p){
    const dark="#292937",black="#222332",indigo="#3c405a",blue="#4f5d88",bright="#728cc0",aqua="#56c4df",frost="#a6ffed",ember="#a15369";
    // Blue ghost fire crowns the helm. A hanging flame mirrors it at the staff.
    function fire(x,y,scale){
      function shape(points,color){p.poly(points.map(([dx,dy])=>[x+Math.round(dx*scale),y+Math.round(dy*scale)]),color);}
      shape([[-7,0],[-10,-5],[-9,-11],[-5,-14],[-5,-10],[-1,-13],[2,-19],[1,-23],[5,-22],[8,-17],[7,-12],[11,-15],[12,-10],[10,-4],[6,-1]],"#3698bf");
      shape([[-6,-1],[-8,-6],[-7,-10],[-4,-8],[0,-11],[4,-17],[4,-20],[7,-17],[6,-11],[4,-8],[9,-11],[7,-4],[3,-1]],aqua);
      shape([[-3,-1],[-4,-5],[0,-6],[3,-11],[4,-8],[2,-4],[6,-5],[4,-1]],frost);
    }
    p.armor([[56,66],[75,61],[86,65],[89,71],[86,79],[94,86],[96,99],[101,105],[90,105],[82,96],[77,85],[70,80],[64,86],[61,97],[55,103],[44,104],[45,99],[50,90],[50,78]],black);
    p.armor([[52,69],[61,66],[68,71],[64,79],[59,87],[51,88],[47,83]],indigo);
    p.poly([[53,71],[61,69],[64,71],[59,76],[54,83],[50,84]],blue);
    p.armor([[49,85],[56,83],[61,87],[60,93],[55,100],[56,104],[42,105],[44,100]],indigo);
    p.poly([[50,88],[54,86],[56,88],[53,95],[46,101],[45,101]],bright);
    p.armor([[74,70],[82,67],[87,73],[90,81],[86,86],[80,84],[76,79]],indigo);
    p.poly([[77,72],[82,69],[85,73],[87,80],[81,78]],blue);
    p.armor([[85,85],[92,83],[95,87],[95,96],[100,101],[100,105],[90,103],[85,96]],indigo);p.line(91,88,92,95,bright);
    p.armor([[52,42],[58,38],[68,36],[80,36],[92,41],[96,48],[90,59],[83,64],[79,70],[68,73],[58,69],[56,59],[49,55]],dark);
    p.armor([[50,44],[58,38],[66,39],[70,43],[67,48],[57,52],[50,49]],indigo);
    p.poly([[52,44],[58,40],[63,41],[60,44],[56,48]],bright);
    p.armor([[68,44],[76,38],[85,39],[91,43],[86,50],[77,54],[67,50]],blue);
    p.poly([[71,44],[78,40],[85,40],[82,43],[77,45],[74,49]],bright);
    p.armor([[58,52],[68,50],[74,54],[69,60],[62,62],[58,59]],blue);
    p.poly([[60,53],[66,52],[71,54],[66,55],[61,59]],bright);
    p.armor([[72,55],[80,52],[87,49],[86,56],[81,60],[75,65],[70,64]],indigo);
    p.poly([[66,60],[72,54],[76,54],[74,60],[69,67],[64,64]],aqua);
    p.armor([[90,41],[100,35],[107,35],[114,40],[116,48],[111,53],[102,55],[93,50]],indigo);
    p.poly([[94,41],[101,37],[107,37],[111,40],[103,42],[98,46]],bright);
    p.armor([[100,54],[110,51],[114,57],[114,63],[111,69],[114,73],[110,78],[103,75],[101,67]],dark);
    p.poly([[103,55],[109,53],[112,56],[113,60],[108,60],[105,65]],blue);
    p.armor([[46,43],[53,45],[54,51],[49,57],[43,59],[41,68],[36,70],[34,67],[36,57],[39,51]],indigo);
    p.poly([[40,51],[46,46],[50,46],[49,50],[44,53],[41,56]],blue);
    fire(68,24,.85);
    p.armor([[54,33],[58,26],[65,23],[76,21],[80,24],[78,31],[73,35],[65,38],[59,37]],indigo);
    p.poly([[56,31],[60,27],[69,24],[74,23],[68,27],[59,32]],bright);
    p.armor([[56,32],[65,30],[75,25],[73,30],[67,36],[61,36]],black);
    p.line(58,33,65,31,ember);p.line(65,31,70,29,ember);p.rect(60,33,3,1,frost);
    p.armor([[72,33],[82,23],[86,20],[82,29],[75,37]],blue);
    p.armor([[27,101],[29,79],[31,56],[32,44],[34,44],[33,61],[31,82],[29,101]],indigo);
    p.line(30,81,32,53,bright);
    p.armor([[24,37],[28,41],[32,41],[37,37],[39,34],[39,40],[35,46],[31,48],[26,44]],bright);
    fire(32,40,.52);
    p.armor([[29,59],[33,56],[38,58],[38,61],[33,64],[29,63]],dark);p.line(31,59,35,58,bright);
  }

  function sigil(p,theme) {
    p.armor([[76,18],[97,45],[91,71],[76,90],[61,71],[55,45]],theme.haze);
    p.armor([[76,26],[87,46],[83,67],[76,79],[69,65],[65,46]],theme.etch);
    p.poly([[76,33],[83,47],[76,65],[69,47]],theme.light);
    p.line(76,34,76,64,theme.spark);
    p.line(61,61,46,78,theme.etch);
    p.line(90,61,104,78,theme.etch);
  }

  const constructs={dione,mnemosyne,atlas,prometheus,cronus,hecate,unknown:sigil};
  function tile(key) {
    if(cache.has(key)) return cache.get(key);
    const canvas=document.createElement("canvas");
    canvas.width=width;canvas.height=height;
    const p=brushes(canvas.getContext("2d")),theme=themes[key];
    chamber(p,theme);
    constructs[key](p,theme);
    for(const x of [3,width-9]) {
      p.rect(x,3,6,1,theme.light);
      p.rect(x+(x===3?0:5),4,1,4,theme.etch);
      p.rect(x,height-5,6,1,theme.light);
    }
    cache.set(key,canvas);
    return canvas;
  }
  const pending=new WeakMap();
  function draw(canvas,summon) {
    const key=identity(summon);
    canvas.width=width; canvas.height=height;
    const ctx=canvas.getContext("2d");
    ctx.imageSmoothingEnabled=false;
    ctx.drawImage(tile(key),0,0);
    if(globalThis.WorldFolio && key!=="unknown"){
      const body=WorldFolio.load(key),stage=key==="atlas"?WorldFolio.load("observatory","atlas"):WorldFolio.load(key+"-stage","elements");
      const token={};pending.set(canvas,token);
      function paint(){
        if(pending.get(canvas)!==token||!body.naturalWidth)return;
        canvas.width=304;canvas.height=216;ctx.imageSmoothingEnabled=false;
        ctx.fillStyle=themes[key].night;ctx.fillRect(0,0,304,216);
        if(stage.naturalWidth){const s=Math.max(304/stage.width,216/stage.height);ctx.drawImage(stage,(304-stage.width*s)/2,(216-stage.height*s)/2,stage.width*s,stage.height*s)}
        ctx.fillStyle="#11222dc9";ctx.fillRect(0,0,304,216);
        const s=Math.min(282/body.width,194/body.height),w=Math.round(body.width*s),h=Math.round(body.height*s);
        ctx.drawImage(body,Math.round((304-w)/2),204-h,w,h);
        ctx.fillStyle=themes[key].light;ctx.fillRect(7,7,18,2);ctx.fillRect(7,7,2,11);ctx.fillRect(279,207,18,2);
      }
      if(body.complete&&stage.complete)paint();else Promise.allSettled([body.decode(),stage.decode()]).then(paint);
    }else pending.delete(canvas);
    canvas.setAttribute?.("role","img");
    canvas.setAttribute?.("aria-label",(summon?.name || names[key])+"像素卡面");
  }

  const figures=new Map();
  const fieldBounds={
    dione:[9,5,124,102],mnemosyne:[35,12,100,95],
    atlas:[6,10,123,97],prometheus:[9,4,132,103],cronus:[22,4,123,103],hecate:[23,3,95,104],unknown:[45,17,61,74]
  };
  function actorSprite(key) {
    if(figures.has(key))return figures.get(key);
    const painting=document.createElement("canvas");
    painting.width=width;painting.height=height;
    constructs[key](brushes(painting.getContext("2d")),themes[key]);
    const sprite=document.createElement("canvas"),[x,y,w,h]=fieldBounds[key];
    // Preserve the source armour, weapons and silhouette; the field renderer chooses the scale.
    sprite.width=w;
    sprite.height=h;
    const ctx=sprite.getContext("2d");
    ctx.imageSmoothingEnabled=false;
    ctx.drawImage(painting,x,y,w,h,0,0,sprite.width,sprite.height);
    figures.set(key,sprite);
    return sprite;
  }
  const shades=new Map();
  function drawActor(ctx,x,y,faceLeft,summon,height=24,squash=1,tint) {
    const key=identity(summon);let sprite=actorSprite(key);
    if(tint){
      const shadeKey=key+tint;
      if(!shades.has(shadeKey)){const c=document.createElement("canvas");c.width=sprite.width;c.height=sprite.height;
        const brush=c.getContext("2d");brush.drawImage(sprite,0,0);brush.globalCompositeOperation="source-atop";
        brush.globalAlpha=.62;brush.fillStyle=tint;brush.fillRect(0,0,c.width,c.height);shades.set(shadeKey,c)}
      sprite=shades.get(shadeKey);
    }
    // The source poses face left.
    const left=faceLeft===true || (typeof faceLeft==="number" && faceLeft<0);
    ctx.save();
    ctx.translate(Math.round(x),Math.round(y));
    if(!left)ctx.scale(-1,1);
    const h=Math.round(height*squash),w=Math.round(height*sprite.width/sprite.height/Math.sqrt(squash));
    ctx.imageSmoothingEnabled=false;ctx.drawImage(sprite,-Math.floor(w/2),-h,w,h);
    ctx.restore();
  }
  return Object.freeze({draw,drawActor});
})();
