globalThis.ForgeReview = function(parent,{item,projected,offer,delta,balance,position,commit,complete}){
  const {el,button}=UI,rolling=!!offer.line,operation=rolling?"洗练":"强化";
  const dialog=el("dialog",undefined,"workshop-dialog forge-review");
  dialog.setAttribute("aria-label",operation+"回响");
  const head=el("div",undefined,"forge-head"),icon=el("canvas"),caption=el("div");
  EchoIcon.draw(icon,item,"detail");icon.setAttribute("aria-hidden","true");
  caption.append(el("small","克罗索斯　／　回响工坊"),el("h2",operation+" · "+item.name),
    el("span",UI.qualityText(item)+"　／　"+position));
  head.append(icon,caption);

  const comparison=el("div",undefined,"forge-lines");
  function side(label,echo){
    const card=el("section"),line=echo.stats?.[offer.index];
    card.append(el("small",label));
    if(rolling){
      card.append(el("b",[line?.series,line?.name].filter(Boolean).join(" · ")),
        el("span",(UI.stats[line.stat]||line.stat)+" "+UI.statValue(line.stat,line.value)+UI.rangeText(line)));
    }else{
      card.append(el("b","强化 +"+(echo.upgrade||0)),
        el("span","攻击白值 +"+((echo.baseAttack||0)+(echo.upgradeAttack||0)+(echo.riftAttack||0))));
    }
    return card;
  }
  comparison.append(side("当前"+(rolling?"词条":""),item),side(operation+"后",projected));
  const result=el("section",undefined,"forge-changes");
  result.append(el("h3","角色属性对比"),delta.children.length?delta:el("p","当前搭配的战斗数值持平。"));

  const cost=el("div",undefined,"forge-cost"),shortfall=offer.cost-balance;
  cost.append(el("b","消耗 "+offer.cost+" 碎片"),el("span",shortfall>0?
    "持有 "+balance+"　·　还差 "+shortfall+" 碎片":"持有 "+balance+" → "+(balance-offer.cost)));
  cost.firstChild.prepend(EchoIcon.token("shards"));
  const error=el("p",undefined,"forge-error");error.hidden=true;error.setAttribute("role","alert");
  const cancel=button("取消",()=>dialog.close()),pay=button("确认"+operation,()=>{
    try{commit()}catch(failure){error.textContent=failure.message;error.hidden=false;return}
    dialog.close();complete();
  },"forge-pay");
  cancel.autofocus=true;pay.disabled=shortfall>0;
  const footer=el("div",undefined,"forge-actions");footer.append(cancel,pay);
  dialog.append(head,comparison,result,cost,error,footer);
  UI.openWorkshopDialog(parent,dialog);
};
