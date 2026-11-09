(()=>{
  const $=id=>document.getElementById(id),book=FANTASY_CARDS,summons=ASHEN_CONTENT.summons;
  const machines=Object.keys(book.fights).map(k=>summons.find(s=>s.id===k));
  let source="atlas",mode="origin",selected=132040;
  const element=["","火","水","地","风","光","暗"];
  const btn=(name,fn,on)=>{const b=document.createElement("button");b.type="button";b.textContent=name;b.setAttribute("aria-pressed",String(on));b.onclick=fn;return b};
  function show(){
    const shop=source==="exchange",machine=machines.find(m=>m.id===source),ids=shop?book.exchange.map(x=>x.id):book.fights[source][mode].ids;
    if(!ids.includes(selected))selected=ids[0];
    const s=document.querySelector(".sources"),m=document.querySelector(".modes");s.replaceChildren();m.replaceChildren();
    for(const entry of [...machines,{id:"exchange",name:"金星兑换"}])s.append(btn(entry.name,()=>{source=entry.id;show()},source===entry.id));
    $("kicker").textContent=shop?"商会　／　金星兑换":"虚数体幻想战　／　"+machine.series;
    $("heading").textContent=shop?"耀金星徽兑换":machine.name+"讨伐战";
    if(!shop)for(const [id,label] of [["hard","困难"],["origin","真源"]])m.append(btn(label,()=>{mode=id;show()},mode===id));
    $("description").textContent=shop?"每张兑换价为 240 耀金星徽。这六张原作 SSR 收录为横版 UR 卡面。":(mode==="hard"?"潮位 1–3　·　":"潮位 4–7　·　")+"本场可掉落的共鸣回响";
    const list=$("cards");list.replaceChildren();
    for(const id of ids){
      const c=book.cards[id],b=btn("",()=>select(id),id===selected);b.dataset.core=id;
      const img=document.createElement("canvas");img.setAttribute("aria-hidden","true");EchoIcon.preview(img,id);
      const info=document.createElement("span"),q=document.createElement("small"),n=document.createElement("b");
      q.textContent=shop?"UR 卡面":c.tier==="rare"?"SR":"SSR";n.textContent=c.name;info.append(q,n);b.append(img,info);list.append(b);
    }
    select(selected);
    function select(id){
      selected=id;const c=book.cards[id];
      for(const b of list.children)b.setAttribute("aria-pressed",String(+b.dataset.core===id));
      EchoIcon.preview($("illustration"),id,"detail");$("illustration").setAttribute("aria-label",c.name+"卡面");
      $("series").textContent="共鸣回响　／　"+element[c.element]+"属性";$("title").textContent=c.name;
      $("rarity").textContent=shop?"UR 卡面":c.tier==="rare"?"SR":"SSR";
      $("origin").textContent=shop?"金星兑换 · 240 耀金星徽 · 原作 SSR":machine.name+"讨伐战 · "+(mode==="hard"?"困难":"真源")+"掉落";
    }
  }
  show();
})();
