globalThis.SalvageReview = function(parent,{item,rarities,getBag},commit,complete){
  const {el,button}=UI;
  const dialog=el("dialog",undefined,"workshop-dialog salvage-review");
  const heading=item?"分解回响":"一键分解";
  dialog.setAttribute("aria-label",heading);
  const title=el("div",undefined,"salvage-title");
  title.append(el("small","克罗索斯　／　回响工坊"),el("h2",heading));dialog.append(title);
  const payout=el("div",undefined,"salvage-payout");
  const gain=el("b"),wallet=el("span");payout.append(gain,wallet);
  const grid=el("div",undefined,"salvage-grid");
  const pageSize=9;
  let items=[],ids=[],amount=0,page=0,rule;
  const nav=el("div",undefined,"salvage-pages"),label=el("span");
  const previous=button("上一页",()=>{page--;renderPage()});
  const next=button("下一页",()=>{page++;renderPage()});
  nav.append(previous,label,next);
  function renderPage(){
    const pages=Math.ceil(items.length/pageSize);
    grid.replaceChildren();
    for(const item of items.slice(page*pageSize,(page+1)*pageSize)){
      const card=el("div",undefined,"salvage-card"),icon=el("canvas"),copy=el("div");
      EchoIcon.draw(icon,item);icon.setAttribute("aria-hidden","true");
      card.style.setProperty("--rarity",item.color);
      copy.append(el("b",item.name),el("span",UI.qualityText(item)+" · "+AshenLoot.salvageValue(item)+" 碎片"));
      card.append(icon,copy);grid.append(card);
    }
    nav.hidden=pages<=1;previous.disabled=page===0;next.disabled=page+1>=pages;
    label.textContent=pages?(page+1)+" / "+pages:"";
  }
  const note=el("p");
  note.setAttribute("role","status");
  const foot=el("div",undefined,"salvage-actions"),cancel=button("取消",()=>dialog.close());
  const apply=button("确认分解",()=>{
    try{commit(ids,amount,rule)}catch(error){note.textContent=error.message;return}
    dialog.close();complete(items.length,amount);
  });
  cancel.autofocus=true;foot.append(cancel,apply);
  function preview(nextRule,message){
    const bag=getBag();
    rule=nextRule;
    items=item?[item]:bag.items.filter(it=>AshenLoot.canSalvage(bag,it,rule));
    // Freeze the quoted IDs and payout until the player changes the rule.
    ids=items.map(it=>it.uid);
    amount=items.reduce((sum,it)=>sum+AshenLoot.salvageValue(it),0);
    gain.replaceChildren(EchoIcon.token("shards"),"获得 "+amount+" 碎片");
    wallet.textContent="持有 "+bag.shards+" → "+(bag.shards+amount);
    note.textContent=items.length?items.length+" 枚回响将被消耗，分解后无法取回。":message||"没有符合条件的闲置回响。";
    apply.disabled=!items.length;page=0;renderPage();
  }
  if(item)preview();
  else{
    const controls=el("div",undefined,"salvage-filters");
    const mode=el("select"),rarity=el("select"),strength=el("input");
    mode.append(new Option("按稀有度","rarity"),new Option("按装备强度","strength"));
    rarities.slice(0,AshenLoot.maxBulkRank+1).forEach((tier,rank)=>rarity.append(new Option(tier.name,String(rank))));
    strength.type="number";strength.min="1";strength.max=String(ItemStrength.maxPower);strength.step="1";
    strength.placeholder="1～"+strength.max;
    const modeLabel=el("label","分解方式"),rarityLabel=el("label","稀有度上限（含）"),strengthLabel=el("label","装备强度上限（含）");
    modeLabel.append(mode);rarityLabel.append(rarity);strengthLabel.append(strength);
    controls.append(modeLabel,rarityLabel,strengthLabel);
    dialog.append(controls,el("p","筛选整个背包，保留已锁定、已装盘和 UR（含金星）回响。"));
    function update(){
      const byStrength=mode.value==="strength";
      rarityLabel.hidden=byStrength;strengthLabel.hidden=!byStrength;
      const limit=byStrength?strength.valueAsNumber:Number(rarity.value);
      const invalid=byStrength&&(!strength.value||!strength.validity.valid);
      preview({mode:mode.value,limit},invalid?"请输入 1～"+strength.max+" 的整数强度上限。":"");
    }
    mode.onchange=rarity.onchange=strength.oninput=update;
    update();
  }
  dialog.append(payout,grid,nav,note,foot);UI.openWorkshopDialog(parent,dialog);
};
