(()=>{
  const $=id=>document.getElementById(id),book=FANTASY_CARDS,summons=ASHEN_CONTENT.summons;
  const machines=Object.keys(book.fights).map(k=>summons.find(s=>s.id===k));
  const powers=new Map(ASHEN_CONTENT.powers.map(p=>[p.id,p]));
  let source="atlas",mode="origin",selected=132040;
  const element=["","火","水","地","风","光","暗"];
  const btn=(name,fn,on)=>{const b=document.createElement("button");b.type="button";b.textContent=name;b.setAttribute("aria-pressed",String(on));b.onclick=fn;return b};
  function show(){
    const shop=source==="exchange",carriers=source==="carriers",machine=machines.find(m=>m.id===source);
    const ids=carriers?Object.values(book.carriers):shop?book.exchange.map(x=>x.id):book.fights[source][mode].ids;
    if(!ids.includes(selected))selected=ids[0];
    const s=document.querySelector(".sources"),m=document.querySelector(".modes");s.replaceChildren();m.replaceChildren();
    for(const entry of [...machines,{id:"carriers",name:"威能 SSR"},{id:"exchange",name:"金星套装"}]){
      const b=btn(entry.name,()=>{source=entry.id;show();s.querySelector('[aria-pressed=true]').focus({preventScroll:true})},source===entry.id);
      s.append(b);
    }
    if(carriers){
      $("kicker").textContent="通用掉落";
      $("heading").textContent="威能 SSR 回响";
      $("lore").textContent="每张回响固定携带一条威能，另有四条随机魔法词缀。";
      $("description").textContent="选择卡面可查看威能效果与原作掉落来源。";
      $("source-plate").replaceChildren();
    }else{
      $("kicker").textContent=shop?"大秘境　／　金星套装":"虚数体幻想战　／　"+machine.series;
      $("heading").textContent=shop?"金星套装回响":machine.name+"讨伐战";
      const art=shop?document.createElement("img"):WorldFolio.rig(source);
      if(shop){art.src=WorldFolio.url("star-badge");art.className="exchange-seal"}
      art.alt=shop?"耀金星徽":machine.name+"战斗立像";$("source-plate").replaceChildren(art);
      $("lore").textContent=shop?"限时通关大秘境第 20 层起可获得。每种回响可重复装盘，集齐同名 2、4、6 件依次激活效果。":machine.description;
      $("description").textContent=shop?"六张原卡的商会兑换价各为 240 耀金星徽。本作收录为 UR 套装，每枚有专属威能与四条随机词缀。":(mode==="hard"?"关卡难度：简单至困难　·　":"关卡难度：极难至炼狱　·　")+"本场可掉落的共鸣回响";
    }
    $("count").textContent=ids.length+" 张";m.hidden=!machine;
    if(machine)for(const [id,label] of [["hard","困难"],["origin","真源"]])m.append(btn(label,()=>{mode=id;show();m.querySelector('[aria-pressed=true]').focus({preventScroll:true})},mode===id));
    const list=$("cards");list.replaceChildren();
    for(const id of ids){
      const c=book.cards[id],b=btn("",()=>select(id),id===selected);b.dataset.core=id;
      const img=document.createElement("canvas");img.setAttribute("aria-hidden","true");EchoIcon.preview(img,id);
      const info=document.createElement("span"),q=document.createElement("small"),n=document.createElement("b");
      q.textContent=carriers?"SSR · "+powers.get(c.powerId).name:shop?"金星 UR":c.tier==="rare"?"SR":"SSR";
      n.textContent=c.name;info.append(q,n);b.append(img,info);list.append(b);
    }
    select(selected);
    function select(id){
      selected=id;const c=book.cards[id];
      for(const b of list.children)b.setAttribute("aria-pressed",String(+b.dataset.core===id));
      EchoIcon.preview($("illustration"),id,"detail");$("illustration").setAttribute("aria-label",c.name+"卡面");
      $("series").textContent="共鸣回响　／　"+element[c.element]+"属性";$("title").textContent=c.name;
      $("rarity").textContent=shop?"金星 UR":c.tier==="rare"?"SR":"SSR";
      const origin=$("origin");
      if(carriers){
        const power=powers.get(c.powerId);
        origin.textContent=power.name+" · "+power.description;
        origin.append(document.createElement("br"),"原作来源 · "+c.access);
      }else if(shop){
        const set=GoldStars.sets[id];
        origin.textContent=set.name+" · "+set.effect.replace("#",set.range.join("～"));
        set.tiers.forEach((effect,i)=>origin.append(document.createElement("br"),2*(i+1)+" 件 · "+effect));
      }else origin.textContent=machine.name+"讨伐战 · "+(mode==="hard"?"困难":"真源")+"掉落";
    }
  }
  show();
})();
