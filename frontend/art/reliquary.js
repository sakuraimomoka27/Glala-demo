// Only the verified stage/exchange registry can address a card illustration.
globalThis.EchoIcon=(()=>{
  const base=new URL("echoes/",document.currentScript.src),sheets=new Map(),requests=new WeakMap();
  const book=FANTASY_CARDS, exchange=new Set(book.exchange.map(x=>x.id));
  function idFor(item){
    if(!item)return null;
    if(exchange.has(item.goldStarId)&&item.goldStarId===item.coreId)return item.coreId;
    if(item.tier==="unique"&&item.uniqueId==="tidal_bell"&&exchange.has(132206))return 132206;
    const pool=book.fights[item.fantasyBoss]?.[item.fantasyMode];
    return pool?.ids.includes(item.coreId)&&book.cards[item.coreId]?.tier===item.tier?item.coreId:null;
  }
  function frame(c,w,h,tint){
    const rect=(x,y,a,b,color)=>{c.fillStyle=color;c.fillRect(x,y,a,b)};
    rect(0,0,w,1,"#171922");rect(0,h-1,w,1,"#171922");rect(0,0,1,h,"#171922");rect(w-1,0,1,h,"#171922");
    for(const [x,y,s,t] of [[1,1,1,1],[w-2,1,-1,1],[1,h-2,1,-1],[w-2,h-2,-1,-1]]){
      rect(s===1?x:x-5,y,6,1,tint);rect(x,t===1?y:y-5,1,6,tint);rect(x+s,y+t,1,1,"#fff1d2");
    }
  }
  // Unbound items use typographic inventory marks, never an unrelated card or character.
  const marks={
    boots:["      bb ","     bcb ","     baab","    baab ","   bccab "," bbaaab  ","bccccb   ","baabb    "," bbb     "],
    armor:["bbb   bbb","bcb b bcb","bccbcbcab","bcaaaaaab"," bcaabab "," bcaaab  ","  bcab   ","   bb    ","    b    "],
    charm:["   bcb   ","   bab   ","  bcccb  "," bcacaab ","bcaccaaab"," bcaaaab ","  bcaab  ","   bab   ","    b    "],
    ring:["   ccc   ","  bcacb  "," bccbabb ","bcb   bab","bc     ab","bc     ab"," bcb  ab ","  bcaab  ","   bbb   "]
  };
  function neutral(c,w,h,item,tint){
    c.fillStyle="#252831";c.fillRect(0,0,w,h);
    const mid=w>>1,y0=h>>1;
    for(let y=-16;y<=16;y++){
      const half=Math.min(15,21-Math.abs(y));c.fillStyle=Math.abs(y)===16?"#64594e":"#47434a";c.fillRect(mid-half,y0+y,half*2+1,1);
      if(Math.abs(y)<15){c.fillStyle=y<0?"#33363e":"#2c3039";c.fillRect(mid-half+1,y0+y,half*2-1,1)}
    }
    for(const side of [-1,1])for(const y of [-9,0,9]){c.fillStyle="#716354";c.fillRect(mid+side*13,y0+y,2,1)}
    const mark=marks[item?.slot]||marks.charm,x=mid-9,y=y0-9,inks={a:"#857b71",b:"#b5aa96",c:"#f0dfb9"};
    mark.forEach((row,j)=>[...row].forEach((v,i)=>{if(inks[v]){c.fillStyle=inks[v];c.fillRect(x+i*2,y+j*2,2,2)}}));frame(c,w,h,tint);
  }
  function getSheet(kind){
    let s=sheets.get(kind);if(s)return s;
    const img=new Image();s={img,pending:new Map()};sheets.set(kind,s);
    img.onload=()=>{for(const [canvas,render] of s.pending){if(requests.get(canvas)===render)render()}s.pending.clear()};
    img.onerror=()=>s.pending.clear();img.src=new URL(kind+".png",base);return s;
  }
  function paint(canvas,id,kind,tint,item){
    const card=book.cards[id],detail=kind==="detail",w=detail&&card?128:48,h=detail&&card?140:48;
    canvas.width=w;canvas.height=h;const c=canvas.getContext("2d");c.imageSmoothingEnabled=false;
    canvas.dataset.echoArt=card?String(id):"mark";canvas.dataset.echoFormat=detail&&card?"detail":"icon";
    neutral(c,w,h,item,tint);requests.delete(canvas);
    if(!card)return canvas;
    const s=getSheet(detail?"cards":"icons");
    const render=()=>{c.drawImage(s.img,(card.cell%9)*w,Math.floor(card.cell/9)*h,w,h,0,0,w,h);frame(c,w,h,tint);};
    if(s.img.complete&&s.img.naturalWidth)render();
    else if(!s.img.complete){requests.set(canvas,render);s.pending.set(canvas,render)}
    return canvas;
  }
  function draw(canvas,item={},kind){return paint(canvas,idFor(item),kind,item?.color||"#b1a899",item)}
  function preview(canvas,id,kind){
    const card=book.cards[id];if(!card)throw Error("回响不在图鉴收录范围内");
    return paint(canvas,id,kind,exchange.has(+id)?"#e5ca76":card.tier==="rare"?"#e3cc69":"#ef9a58");
  }
  function origin(item){
    const id=idFor(item);if(!id)return "";
    if(item.goldStarId===id)return "金星套装 · 大秘境第 20 层起限时通关掉落";
    if(exchange.has(id))return "卡面："+book.cards[id].name+" · 金星兑换（240 耀金星徽）";
    const boss=globalThis.ASHEN_CONTENT.summons.find(s=>s.id===item.fantasyBoss);
    return (boss?.name||"虚数体")+"讨伐战 · "+(item.fantasyMode==="origin"?"真源":"困难");
  }
  function token(key){
    const img=document.createElement("img");img.src=new URL(key+".png",base);img.alt="";img.width=20;img.height=20;img.className="wallet-token";return img;
  }
  return Object.freeze({draw,preview,idFor,origin,token});
})();
