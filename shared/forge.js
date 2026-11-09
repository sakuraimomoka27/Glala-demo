globalThis.AshenForge=(()=>{
 // The offered roll is fixed for this item until a purchase. Closing the preview or
 // refreshing cannot reveal another outcome for free; the next purchase uses a new seed.
 function randomFor(key){
   let h=2166136261;for(const c of key){h=Math.imul(h^c.charCodeAt(0),16777619)}
   return ()=>{h=(h+0x6d2b79f5)|0;let t=Math.imul(h^h>>>15,1|h);t^=t+Math.imul(t^t>>>7,61|t);return ((t^t>>>14)>>>0)/4294967296};
 }
 function preview(catalog,item,index=item.stats?.length>1?1:0){
   if(item.locked||item.uniqueId||item.tier==="unique"||item.tier==="common"||!Number.isInteger(index)||!item.stats?.[index])return null;
   const used=new Set(item.stats.filter((_,i)=>i!==index).map(line=>line.stat));
   const rng=randomFor(item.uid+":"+(item.forgeCount||0)+":"+index);
   const rows=catalog.affixes.filter(a=>EchoItem.eligible(a,item.tier)&&!used.has(a.stat));
   let weight=rng()*rows.reduce((s,a)=>s+a.weight,0);
   const affix=rows.find(a=>(weight-=a.weight)<0)||rows.at(-1);
   if(!affix)return null;
   const rollQuality=rng(),strength=ItemStrength.of(item);
   const base=catalog.equipment.find(row=>row.id===item.baseId);
   return {uid:item.uid,index,count:item.forgeCount||0,cost:3+2*item.rank,rollQuality,strength,
     line:EchoItem.line(affix,ItemStrength.scale(strength),rollQuality,base)};
 }
 function changedFields(item,offer){
   if(offer.line){
     const stats=item.stats.slice();
     stats[offer.index]={...offer.line};
     return {stats,rollQuality:offer.rollQuality,forgeCount:offer.count+1};
   }
   return {upgrade:offer.rank+1,upgradeAttack:(item.upgradeAttack||0)+offer.power};
 }
 function previewItem(item,offer){
   return {...item,...changedFields(item,offer)};
 }
 function apply(bag,catalog,offer){
   const item=bag.items.find(i=>i.uid===offer?.uid),current=item&&preview(catalog,item,offer?.index);
   if(!current || current.count!==offer.count || current.cost!==offer.cost ||
      current.strength!==offer.strength || current.rollQuality!==offer.rollQuality ||
      ["stat","series","name","value","min","max"].some(key=>current.line[key]!==offer.line?.[key]))return "预览已失效，请重新打开。";
   if(bag.shards<current.cost)return "碎片不足。";
   bag.shards-=current.cost;Object.assign(item,changedFields(item,current));
   return "";
 }
 function upgradeQuote(catalog,item){
   const base=catalog.equipment.find(row=>row.id===item.baseId);
   const rank=item.upgrade||0;
   const cap=base?.upgradeCap??3;
   if(item.locked || rank>=cap)return null;
   return {uid:item.uid,rank,cap,power:base?.upgradePower??2,cost:(base?.upgradeCost??4)*(rank+1)};
 }
 function upgrade(bag,catalog,quote){
   const item=bag.items.find(row=>row.uid===quote?.uid);
   const next=item&&upgradeQuote(catalog,item);
   if(!next || next.rank!==quote.rank || next.cost!==quote.cost || next.power!==quote.power)throw new Error("强化预览已变化，请重新选择。");
   if(bag.shards<next.cost)throw new Error("碎片不足。");
   bag.shards-=next.cost;Object.assign(item,changedFields(item,next));
 }
 return {preview,previewItem,apply,upgradeQuote,upgrade};
})();
