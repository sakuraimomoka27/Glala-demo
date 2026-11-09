// Freeze the displayed selection. The owner revalidates and saves it in one transaction.
globalThis.SalvageReview = function(parent,items,balance,commit,complete){
  const {el,button}=UI;
  const ids=items.map(item=>item.uid);
  const amount=items.reduce((sum,item)=>sum+AshenLoot.salvageValue(item),0);
  const dialog=el("dialog",undefined,"workshop-dialog salvage-review");
  dialog.setAttribute("aria-label","分解回响");
  const title=el("div",undefined,"salvage-title");
  title.append(el("small","克罗索斯　／　回响工坊"),el("h2","分解回响"));
  const payout=el("div",undefined,"salvage-payout");
  payout.append(el("b","获得 "+amount+" 碎片"),el("span","持有 "+balance+" → "+(balance+amount)));
  payout.firstChild.prepend(EchoIcon.token("shards"));
  const grid=el("div",undefined,"salvage-grid");
  const pageSize=9,pages=Math.ceil(items.length/pageSize);
  let page=0;
  const nav=el("div",undefined,"salvage-pages"),label=el("span");
  const previous=button("上一页",()=>{page--;renderPage()});
  const next=button("下一页",()=>{page++;renderPage()});
  nav.append(previous,label,next);nav.hidden=pages<=1;
  function renderPage(){
    grid.replaceChildren();
    for(const item of items.slice(page*pageSize,(page+1)*pageSize)){
      const card=el("div",undefined,"salvage-card"),icon=el("canvas"),copy=el("div");
      EchoIcon.draw(icon,item);icon.setAttribute("aria-hidden","true");
      card.style.setProperty("--rarity",item.color);
      copy.append(el("b",item.name),el("span",UI.qualityText(item)+" · "+AshenLoot.salvageValue(item)+" 碎片"));
      card.append(icon,copy);grid.append(card);
    }
    previous.disabled=page===0;next.disabled=page===pages-1;
    label.textContent=(page+1)+" / "+pages;
  }
  renderPage();
  const note=el("p",items.length+" 枚回响将被消耗，分解后无法取回。");
  note.setAttribute("role","status");
  const foot=el("div",undefined,"salvage-actions"),cancel=button("取消",()=>dialog.close());
  const apply=button("确认分解",()=>{
    try{commit(ids,amount)}catch(error){note.textContent=error.message;return}
    dialog.close();complete(items.length,amount);
  });
  cancel.autofocus=true;foot.append(cancel,apply);
  dialog.append(title,payout,grid,nav,note,foot);UI.openWorkshopDialog(parent,dialog);
};
