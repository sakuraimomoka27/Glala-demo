globalThis.SharedStashView = function(root,back) {
  const {el,button}=UI;
  const pageSize=12;
  const pages={bag:0,shared:0};
  const panes={};
  let selected=null;
  const items=side=>side==="bag"?Profile.bag.items:Profile.stash.items;
  const sideHeld=side=>side==="bag"?Profile.bag.items.length:Profile.stash.capacity;
  const actionLabel=side=>side==="bag"?"存入仓库":"取到背包";

  const shell=el("section",undefined,"shared-stash");
  const header=el("div",undefined,"stash-header");
  const title=el("div");title.append(el("h1","共享仓库"),el("span","三个存档共用"));
  const balance=el("b");
  const buy=button("",expand,"primary");buy.dataset.expandStash="";
  header.append(title,balance,buy,button("返回城镇",back));
  const columns=el("div",undefined,"stash-panes");
  const detail=el("section",undefined,"stash-detail");
  const message=el("p",undefined,"stash-feedback");message.setAttribute("role","status");
  shell.append(header,columns,detail,message);
  root.replaceChildren(shell);

  function reason(side,item) {
    if(side==="bag"){
      if(AshenLoot.protectedGear(Profile.bag,item))return "已装盘，请先卸下";
      if(!Profile.stash.capacity)return "请先开启仓位";
      if(Profile.stash.items.length>=Profile.stash.capacity)return "共享仓库已满";
    }else if(Profile.bag.items.length>=AshenLoot.capacity)return "角色背包已满";
    return "";
  }
  function expand(){
    const price=Profile.unlockPrice();
    try{
      Profile.expand();
      message.textContent="仓位已开，现在可寄存 "+Profile.stash.capacity+" 枚回响。花费 "+price+" 尼奥德。";
    }catch(error){message.textContent=error.message}
    draw();
  }
  function transfer(side,item){
    const destination=side==="bag"?"shared":"bag";
    try{Profile.transfer(item.uid,side==="bag")}
    catch(error){message.textContent=error.message;draw();return}
    // The opposite pane follows this instance; the source stays on its own current page.
    const index=items(destination).findIndex(row=>row.uid===item.uid);
    pages[destination]=Math.floor(index/pageSize);
    selected={side:destination,uid:item.uid};
    message.textContent=item.name+(destination==="shared"?"已存入共享仓库。":"已取到角色背包。");
    draw();
    panes[destination].grid.querySelector('[aria-pressed="true"]')?.focus({preventScroll:true});
  }
  function select(side,item){
    selected={side,uid:item.uid};
    drawSelection();
  }
  function changePage(side,delta){
    pages[side]+=delta;
    if(selected?.side===side)selected=null;
    draw();
    if(!selected){
      const first=items(side)[pages[side]*pageSize];
      if(first)select(side,first);
    }
    const pane=panes[side],key=delta<0?pane.prev:pane.next;
    (key.disabled?pane.grid.querySelector("button"):key)?.focus({preventScroll:true});
  }
  function createPane(side,label){
    const panel=el("section",undefined,"stash-pane");panel.dataset.stashSide=side;
    const head=el("div",undefined,"stash-pane-head"),count=el("span");
    head.append(el("h2",label),count);
    const grid=el("div",undefined,"stash-grid");
    const nav=el("nav",undefined,"stash-pager");nav.setAttribute("aria-label",label+"分页");
    const prev=button("‹",()=>changePage(side,-1)),next=button("›",()=>changePage(side,1));
    const page=el("span");page.dataset.pageCount="";next.dataset.nextPage="";
    prev.setAttribute("aria-label",label+"上一页");next.setAttribute("aria-label",label+"下一页");
    nav.append(prev,page,next);panel.append(head,grid,nav);columns.append(panel);
    panes[side]={grid,count,prev,next,page};
  }
  function tile(side,item){
    const cell=el("div",undefined,"stash-tile");cell.dataset.itemUid=item.uid;
    cell.style.setProperty("--rarity",item.color||"#bda98b");
    const inspect=button("",()=>select(side,item),"stash-select");
    inspect.setAttribute("aria-label","查看"+item.name+"，"+item.tierName);
    inspect.setAttribute("aria-pressed","false");
    const icon=el("canvas");EchoIcon.draw(icon,item);icon.setAttribute("aria-hidden","true");
    const marker=side==="bag"&&AshenLoot.protectedGear(Profile.bag,item)?"装盘":item.locked?"锁定":item.tierName;
    inspect.append(icon,el("small",marker),el("b",item.name));
    const move=button(side==="bag"?"→":"←",()=>transfer(side,item),"stash-move");
    move.dataset.transfer="";move.setAttribute("aria-label",actionLabel(side)+"："+item.name);
    const blocked=reason(side,item);move.disabled=!!blocked;move.title=blocked||actionLabel(side);
    cell.append(inspect,move);return cell;
  }
  function drawPane(side){
    const pane=panes[side],list=items(side),total=Math.max(1,Math.ceil(sideHeld(side)/pageSize));
    pages[side]=Math.max(0,Math.min(total-1,pages[side]));
    const start=pages[side]*pageSize,capacity=side==="bag"?AshenLoot.capacity:Profile.stash.capacity;
    pane.count.textContent=list.length+" / "+capacity+" 格";
    pane.page.textContent=(pages[side]+1)+" / "+total;
    pane.prev.disabled=!pages[side];pane.next.disabled=pages[side]+1>=total;
    pane.grid.replaceChildren();
    for(let i=start;i<start+pageSize;i++){
      if(list[i])pane.grid.append(tile(side,list[i]));
      else{
        const closed=i>=capacity;
        const empty=el("span",closed?"×":"◇","stash-empty"+(closed?" closed":""));
        empty.setAttribute("aria-hidden","true");pane.grid.append(empty);
      }
    }
  }
  function drawSelection(){
    for(const cell of shell.querySelectorAll("[data-item-uid]")){
      cell.querySelector(".stash-select").setAttribute("aria-pressed",String(cell.dataset.itemUid===selected?.uid));
    }
    detail.replaceChildren();
    const item=selected && items(selected.side).find(row=>row.uid===selected.uid);
    if(!item){detail.append(el("p","选择回响查看词条。"));return}
    const side=selected.side,blocked=reason(side,item),icon=el("canvas");
    EchoIcon.draw(icon,item,"detail");icon.setAttribute("aria-hidden","true");
    const info=el("div");info.append(el("small",(side==="bag"?"角色背包":"共享仓库")+"　／　"+item.tierName+(item.locked?"　·　已锁定":"")),
      el("h3",item.name),el("p",UI.statsText(item)||"无附加词条"));
    const control=el("div",undefined,"stash-detail-action"),move=button(actionLabel(side),()=>transfer(side,item),"primary");
    move.disabled=!!blocked;control.append(move);if(blocked)control.append(el("small",blocked));
    detail.append(icon,info,control);
  }
  function draw(){
    const price=Profile.unlockPrice();
    balance.textContent=Profile.slot.name+"　·　"+Profile.bag.gold+" 尼奥德";
    balance.prepend(EchoIcon.token("gold"));
    buy.textContent="开 1 格 · "+price+" 尼奥德";buy.disabled=Profile.bag.gold<price;
    buy.title=buy.disabled?"还需 "+(price-Profile.bag.gold)+" 尼奥德":"开启一个共享仓位";
    drawPane("bag");drawPane("shared");drawSelection();
  }
  createPane("bag","角色背包");createPane("shared","共享仓库");
  const first=Profile.bag.items.find(item=>!AshenLoot.protectedGear(Profile.bag,item))||Profile.bag.items[0];
  if(first)selected={side:"bag",uid:first.uid};
  message.textContent=Profile.problem||"";draw();
};
