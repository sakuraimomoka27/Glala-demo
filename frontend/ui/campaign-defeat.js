// Render the finished room's outcome. Rewards and chapter progress have already been decided.
globalThis.CampaignDefeatView = function(root,{chapter,stage,number,outcome,catalog,field,retry,map}){
  const {el,button}=UI;
  const screen=el("article",undefined,"campaign-defeat");
  const title=el("div",undefined,"defeat-title"),heading=el("h1","远征失利");
  title.append(el("small",chapter.name+"　／　探求记录"),heading,el("b",number+"　"+stage.name));
  const layout=el("div",undefined,"defeat-layout"),scene=el("figure",undefined,"defeat-scene");
  const picture=el("canvas");
  picture.width=field.width;picture.height=field.height;
  picture.getContext("2d").drawImage(field,0,0);
  picture.setAttribute("aria-label",stage.name+"的最后一刻");
  const caption=el("figcaption");
  caption.append(el("small","最后一击"),el("b",outcome.defeatCause||"生命耗尽"),
    el("span","击败 "+outcome.kills+" / "+outcome.total+" 名守卫"));
  scene.append(picture,caption);
  const loot=el("div",undefined,"defeat-loot"),income=el("section",undefined,"defeat-income");
  income.append(el("h2","已记入角色"),el("b","经验 +"+(outcome.growth?.xp||0)+"　·　尼奥德 +"+(outcome.growth?.killGold||0)),
    el("span","此前过门取得的收获已保留。"));
  const lost=el("section",undefined,"defeat-lost");
  lost.append(el("h2","本关未带出"));
  const machines=(outcome.summonDrops||[]).map(id=>catalog.summons.find(machine=>machine.id===id)).filter(Boolean);
  const echoes=outcome.rewards;
  lost.append(el("b","回响 "+echoes.length+" 枚　·　虚数体 "+machines.length+" 台"));
    const best=echoes.reduce((a,b)=>!a||AshenLoot.compare(b,a)>0?b:a,null);
  function row(name,label,paint){
    const line=el("div",undefined,"defeat-drop"),icon=el("canvas"),copy=el("div");
    paint(icon);icon.setAttribute("aria-hidden","true");
    copy.append(el("b",name),el("small",label));line.append(icon,copy);lost.append(line);
  }
  for(const machine of machines)row(machine.name,"虚数体",icon=>SummonArt.draw(icon,machine));
  if(best)row(best.name,best.tierName+" · 本关最高品质",icon=>EchoIcon.draw(icon,best));
  loot.append(income,lost);layout.append(scene,loot);
  const controls=el("nav",undefined,"defeat-controls"),path=el("div");
  path.append(el("b","可重试 "+number+"　"+stage.name),el("span","击败守卫后穿过出口，即可带走本关掉落。"));
  controls.append(path,button("返回大地图",map),button("重试本关",retry,"primary"));
  screen.append(title,layout,controls);root.replaceChildren(screen);
  heading.tabIndex=-1;heading.focus({preventScroll:true});
};
