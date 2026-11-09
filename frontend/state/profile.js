globalThis.Profile = (() => {
  const accountKey = "ashen-vault:account:v4";
  const resetKey = "ashen-vault:reset:glala-v4";
  const previousPlayerKeys = ["ashen-vault:account:v3", "ashen-vault:inventory:v1"];
  const blank = () => ({...AshenLoot.emptyBag(), version:2, heroes:{}, selected:"", gold:0});
  const newAccount = () => ({version:4, slots:[null,null,null], stash:{capacity:0,items:[]}});
  let account = newAccount(), active = -1, bag = blank(), lastRead = null;
  let practiceOnly=false, temporary = false, problem = "", timer;

  function bind(next) {
    bag = next;
    bag.heroes ??= {};
    bag.gold ??= 0;
    if (bag.selected && bag.heroes[bag.selected]) {
      const hero=bag.heroes[bag.selected];
      hero.totalXp??=0;
      bag.worn=hero.worn;
    }
  }
  // Run only from the campaign entry. A training visit never mutates player storage.
  function clearPreviousGeneration() {
    try {
      if (localStorage.getItem(resetKey)==="1") return;
      for (const key of previousPlayerKeys) {
        if (localStorage.getItem(key)!=null) localStorage.removeItem(key);
      }
      localStorage.setItem(resetKey,"1");
    } catch {
      problem ||= "旧试玩存档清理未完成，下次进入时会重试。";
    }
  }
  try {
    lastRead = localStorage.getItem(accountKey) ?? null;
    if (lastRead) {
      const data = JSON.parse(lastRead);
      if (data.version!==4 || data.slots?.length!==3 || !Array.isArray(data.stash?.items)) throw Error();
      account = data;
    }
    if(account.scratch)bind(account.scratch);
    if (Number.isInteger(account.last) && account.slots[account.last]) {
      active = account.last; bind(account.slots[active].data);
    }
  } catch { temporary=true; problem="存档读取失败，本次进度仅保存在页面中。"; }

  function persist() {
    if (temporary) return;
    let current;
    try { current=localStorage.getItem(accountKey) ?? null; }
    catch { temporary=true; problem="浏览器存储不可用，本次为临时存档。"; return; }
    if (current!==lastRead) {
      problem="另一标签页已更新存档，请刷新后继续。";throw Error(problem);
    }
    const snapshot=JSON.stringify(account);
    try { localStorage.setItem(accountKey,snapshot); lastRead=snapshot; }
    catch { temporary=true; problem="浏览器无法写入，本次进度仅保存在页面中。"; }
  }
  function restore(target,source) {
    for(const key of Object.keys(target))if(!Object.hasOwn(source,key))delete target[key];
    for(const [key,value] of Object.entries(source)){
      if(value && typeof value==="object" && target[key] && typeof target[key]==="object" && Array.isArray(value)===Array.isArray(target[key]))restore(target[key],value);
      else target[key]=value;
    }
    if(Array.isArray(source))target.length=source.length;
  }
  function commit(change) {
    const previous=structuredClone(account), before=active, transient=active<0?structuredClone(bag):null;
    try {
      const result=change();
      if (active>=0) persist();
      clearTimeout(timer); timer=undefined;
      return result;
    } catch (error) {
      restore(account,previous);active=before;bind(before>=0?account.slots[before].data:transient);
      throw error;
    }
  }
  function openSlot(i) {
    if (!Number.isInteger(i) || !account.slots[i]) throw Error("存档位为空。");
    flush();practiceOnly=false;active=i;bind(account.slots[i].data);
  }
  function create(i,role,name) {
    name=String(name||"").trim();
    if (!Number.isInteger(i)||i<0||i>2||account.slots[i]||!role||!name||[...name].length>12) throw Error("请选择空存档位，并输入 1～12 个字的名字。");
    practiceOnly=false;
    return commit(()=>{
      const data={...blank(),selected:role};
      data.heroes={[role]:{worn:data.worn,chapter:0,best:0,starterEcho:true}};
      account.slots[i]={role,name,data};account.last=i;active=i;bind(data);
    });
  }
  function practice(role="glala") {
    flush();practiceOnly=true;active=-1;bind(blank());bag.selected=role;bag.heroes[role]={worn:bag.worn,chapter:0,best:0,totalXp:0};
  }
  function select(id) {
    if (!id || bag.selected===id) return;
    if (practiceOnly) {practice(id);return;}
    if (active<0) {create(account.slots.findIndex(slot=>!slot),id,"格拉拉");return;}
    commit(()=>{
      bag.heroes[id] ??= {worn:{},chapter:0,best:0};
      bag.selected=id;bind(bag);
    });
  }
  function flush() {
    if(timer===undefined)return;
    clearTimeout(timer);timer=undefined;
    try { if(active<0 && !practiceOnly)account.scratch=bag; if(!practiceOnly)persist(); } catch(error){problem=error.message}
  }
  function changed(){if(!practiceOnly && timer===undefined)timer=setTimeout(flush,120);}
  function unlockPrice() { return 25*(account.stash.capacity+1)*(account.stash.capacity+2)/2; }
  // Reports keep the original drop snapshot; its current owner is read from the actual containers.
  function locateEcho(uid) {
    const current=bag.items.find(row=>row.uid===uid);
    if(current)return {place:"bag",equipped:AshenLoot.protectedGear(bag,current)};
    if(account.stash.items.some(item=>item.uid===uid))return {place:"shared"};
    for(const [index,slot] of account.slots.entries()){
      if(!slot || index===active)continue;
      const item=slot.data?.items?.find(row=>row.uid===uid);
      if(item)return {place:"other",number:index+1,name:slot.name,equipped:AshenLoot.protectedGear(slot.data,item)};
    }
    return null;
  }
  function expand() {
    if(active<0)throw Error("请先读取角色。");
    return commit(()=>{
      const price=unlockPrice();
      if(bag.gold<price)throw Error("尼奥德不足。");
      bag.gold-=price;account.stash.capacity++;
    });
  }
  function transfer(uid,deposit) {
    if(active<0)throw Error("请先读取角色。");
    return commit(()=>{
      const from=deposit?bag.items:account.stash.items, to=deposit?account.stash.items:bag.items;
      const item=from.find(entry=>entry.uid===uid);
      if(!item)throw Error("这件装备已转移。");
      if(deposit && AshenLoot.protectedGear(bag,item))throw Error("请先卸下装备。");
      if(to.length>=(deposit?account.stash.capacity:AshenLoot.capacity))throw Error(deposit?"仓库格已满。":"角色背包已满。");
      from.splice(from.indexOf(item),1);to.push(item);
    });
  }
  window.addEventListener("pagehide",flush);
  return {clearPreviousGeneration,create,openSlot,practice,select,changed,flush,commit,expand,transfer,unlockPrice,locateEcho,
    slotsFor:id=>bag.heroes[id]?.worn || (!bag.selected?bag.worn:{}),
    get slots(){return account.slots},get slot(){return account.slots[active]},
    get stash(){return account.stash},get bag(){return bag},get hero(){return bag.heroes[bag.selected]},get problem(){return problem}};
})();
