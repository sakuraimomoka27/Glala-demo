globalThis.UI = (() => {
  function pixelHeading(node, title, large) {
    const size = large ? 23 : 16, scale = large ? 2 : 1.25;
    const canvas = document.createElement("canvas");
    canvas.width = (size+1)*title.length+2; canvas.height=size+6;
    const ctx = canvas.getContext("2d");ctx.font=size+"px SimSun,serif";ctx.textBaseline="top";ctx.fillStyle="#f0d0a2";
    Array.from(title).forEach((char,i)=>ctx.fillText(char,1+i*(size+1),3));
    const pixels=ctx.getImageData(0,0,canvas.width,canvas.height);
    for(let i=3;i<pixels.data.length;i+=4)pixels.data[i]=pixels.data[i]>68?255:0;
    ctx.putImageData(pixels,0,0);canvas.className="pixel-heading";canvas.style.width=(canvas.width*scale)+"px";
    canvas.setAttribute("aria-hidden","true");node.setAttribute("aria-label",title);node.replaceChildren(canvas);
  }
  function el(tag, value, cls) {
    const node = document.createElement(tag);
    if (value !== undefined) node.textContent = value;
    if (cls) node.className = cls;
    if(tag==="h1" && value && value.length<=16)pixelHeading(node,value,true);
    return node;
  }
  function button(label, action, cls) {
    const node = el("button", label, cls); node.type = "button"; node.onclick = action; return node;
  }
  const tableNames = { worlds:"遗迹潮位",powers:"威能",uniques:"UR 回响",growth:"等级成长", summons:"虚数体", chapters:"世界章节", adventures:"冒险", characters:"角色", equipment:"回响", skills:"技能", levels:"关卡", monsters:"怪物", rarities:"品质", affixes:"词条" };
  const slots = {boots:"战靴", armor:"护甲", charm:"护符", ring:"戒指"};
  const stats = {
    jump:"起跳初速",fall:"下落加速度",attack:"踩踏伤害",move:"移动速度",haste:"起跳准备缩短",regen:"体力恢复",
    burnDamage:"灼烧伤害",ailmentHit:"异常命中",burnTime:"灼烧持续",shotDamage:"弹丸伤害",
    shotRate:"射击间隔缩短",shotSize:"弹丸半径",jumpDamage:"跳跃伤害",defense:"伤害减免",health:"生命上限",
    waveDamage:"震波伤害",waveSize:"震波半径",slashDamage:"斩击伤害",slashRate:"斩击间隔缩短",
    slashSize:"斩击半径",petTime:"影仆持续",petHp:"影仆生命",petDamage:"影仆伤害"
  };
  const units={
    jump:" 米/秒",fall:" 米/秒²",attack:"",move:" 米/秒",haste:" 毫秒",regen:" 点/秒",
    burnDamage:"%",ailmentHit:" 个百分点",burnTime:" 秒",shotDamage:"%",shotRate:"%",shotSize:"%",
    jumpDamage:"%",defense:" 个百分点",health:" 点",waveDamage:"%",waveSize:"%",slashDamage:"%",
    slashRate:"%",slashSize:"%",petTime:" 秒",petHp:" 点",petDamage:"%"
  };
  function statValue(stat,value) {
    if(!Number.isFinite(value))return "—";
    return (value>0?"+":"")+Number(value.toFixed(2))+(units[stat]||"");
  }
  function baseText(item){
    if(item.baseAttack===undefined)return "";
    return "固定攻击 +"+item.baseAttack+"　固定生命 +"+item.baseHealth;
  }
  function qualityText(item,name=item.tierName){
    return Number.isInteger(item.itemPower)?name+" · "+ItemStrength.describe(item.itemPower):name;
  }
  function rangeText(line){
    if(!Number.isFinite(line.min)||!Number.isFinite(line.max))return "";
    return line.min===line.max?"（固定）":" ["+line.min+"～"+line.max+"]";
  }
  function powerText(item){
    if(!item.power)return "";
    return (item.uniqueId?"UR 专属特效":"SSR 威能")+" · "+item.power.name+"　"+item.power.description;
  }
  function statsText(item) {
    const lines=(item.stats||[]).filter(line=>line.value).map(line=>(line.name?line.name+" · ":"")+
      (stats[line.stat]||line.stat)+" "+statValue(line.stat,line.value));
    return [qualityText(item),baseText(item),...lines,powerText(item)].filter(Boolean).join(" · ");
  }
  function summonFinds(catalog,ids){
    const wrap=el("div",undefined,"summon-finds");
    for(const id of ids||[]){const s=catalog.summons.find(x=>x.id===id);if(!s)continue;
      const card=el("div"),art=el("canvas");SummonArt.draw(art,s);card.append(art,el("b","获得虚数体 · "+s.name),el("span",s.series+" · 加护领域"));wrap.append(card)}
    return wrap;
  }
  function openWorkshopDialog(parent,dialog){
    parent.append(dialog);
    dialog.addEventListener("keydown",e=>e.stopPropagation());
    dialog.addEventListener("cancel",e=>e.stopPropagation());
    dialog.addEventListener("close",()=>dialog.remove(),{once:true});
    dialog.showModal();
  }
  function echoGuide(catalog){
    const guide=el("details",undefined,"echo-guide");
    guide.append(el("summary","回响图鉴 · 品质与词缀"),el("p","每枚回响都有固定攻击和生命。攻击白值影响跃击、震波和直接攻击；灼烧与影仆按各自的词缀结算。"));
    const archive=el("a","查看幻想战与金星兑换卡面");archive.href="echoes.html";archive.target="_blank";archive.rel="noopener";guide.append(archive);
    guide.append(el("p","物品强度决定固定攻血及词缀区间。潮位 3 起可掉落「"+ItemStrength.describe(400)+"」及以上的回响。潮位 4 开放「"+ItemStrength.describe(660)+"」品级。"));
    for(const tier of catalog.rarities){
      const row=el("div"),name=el("b",tier.name);name.style.color=tier.color;row.append(name,el("span",EchoItem.qualityRule(tier.id)));guide.append(row);
    }
    for(const tier of catalog.rarities.filter(t=>["fine","rare"].includes(t.id))){
      const group=el("details");group.append(el("summary",tier.name+"起可出的词缀"));
      for(const line of catalog.affixes.filter(a=>a.minTier===tier.id)){
        const row=el("div");row.append(el("b",line.name),el("span",line.series+" · "+(stats[line.stat]||line.stat)));group.append(row);
      }
      guide.append(group);
    }
    return guide;
  }
  return { el,button,openWorkshopDialog,tableNames,slots,stats,statValue,statsText,baseText,rangeText,qualityText,powerText,summonFinds,echoGuide };
})();
