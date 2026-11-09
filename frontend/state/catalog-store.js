globalThis.CatalogStore = (() => {
  const storageKey = "ashen-vault:catalog:v1";
  let catalog = ASHEN_CONTENT, revision = 0, history=[],notice = "";
  const service = globalThis.ASHEN_LOCAL_SERVICE === true;
  const verify=CatalogRules.prepareCatalog;
  async function init() {
    if (service) {
      const result = await fetch("/api/catalog",{cache:"no-store"});
      if (!result.ok) throw new Error("本地配置服务无法读取配置。");
      const body = await result.json();
      catalog = verify(body.catalog); revision = body.revision;history=body.history||[];
    } else {
      try { const raw = localStorage.getItem(storageKey); if(raw){const value=JSON.parse(raw);
        if(value.format==="studio-v1"){catalog=verify(value.catalog);revision=value.revision;history=value.history||[]}
        else catalog=verify(value);
      } }
      catch { notice="浏览器配置读取失败，已加载内置配置。"; }
    }
    catalog=verify(catalog);
  }
  async function save(data) {
    const snapshot=verify(data);
    const nextHistory=[{revision,catalog},...history].slice(0,3);
    if(service) {
      const res=await fetch("/api/catalog",{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({revision,catalog:snapshot})});
      const reply=await res.json();
      if(!res.ok)throw new Error(reply.error);
      revision=reply.revision;
    } else {
      const raw=localStorage.getItem(storageKey);let last=null;
      try{last=raw?JSON.parse(raw):null}catch{/* A corrupt legacy entry may be replaced by a verified draft. */}
      if((last?.format==="studio-v1"?last.revision:0)!==revision)throw new Error("其他页面已更新配置，请导出草稿后刷新。");
      localStorage.setItem(storageKey,JSON.stringify({format:"studio-v1",revision:revision+1,catalog:snapshot,history:nextHistory}));revision++;
    }
    catalog=snapshot;history=nextHistory;
  }
  return { init,save,verify,get data(){return catalog},get history(){return history},get revision(){return revision},get notice(){return notice},service };
})();
