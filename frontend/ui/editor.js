globalThis.ContentEditor = function(root, leave) {
  const {el,button,tableNames} = UI, {schema} = CatalogRules;
  let draft=structuredClone(CatalogStore.data),table="equipment",index=0,query="",dirty=false,editVersion=0;
  const tabs=el("div",undefined,"tabs"),list=el("div",undefined,"record-list"),form=el("div",undefined,"fields");
  const title=el("h1","配置工坊"),status=el("p",undefined,"message");
  const undoStack=[],deps=el("div",undefined,"references"),versions=el("select");
  const undo=button("撤销上次修改",()=>{
    const prev=undoStack.pop();if(!prev)return;({draft,table,index,query}=prev);search.value=query;change();
    dirty=JSON.stringify(draft)!==JSON.stringify(CatalogStore.data);render();status.textContent=dirty?"已撤销，草稿尚未应用。":"已撤销，草稿与当前版本一致。";
  });
  function remember(){if(undoStack.length===15)undoStack.shift();undoStack.push({draft:structuredClone(draft),table,index,query});undo.disabled=false}
  function showRefs(){
    deps.replaceChildren();const row=draft[table][index];
    const refs=CatalogRules.references(draft).filter(r=>r.broken||(r.target===table&&r.id===row?.id));
    deps.append(el("small",refs.length?"引用位置（点击定位字段）":"当前记录没有被其他条目引用。"));
    for(const r of refs){const src=draft[r.table][r.index];deps.append(button((r.broken?"失效 · ":"")+tableNames[r.table]+" / "+src.name+" · "+r.label+" → "+r.id,()=>{
      table=r.table;index=r.index;query="";search.value="";render();form.querySelector('[data-field="'+r.field+'"]')?.focus();
    }))}
  }
  function showVersions(){
    versions.replaceChildren();for(const v of CatalogStore.history){const op=el("option","已应用版本 "+v.revision);op.value=v.revision;versions.append(op)}
    if(!versions.options.length)versions.append(el("option","尚无历史版本"));
    restore.disabled=versions.disabled=!CatalogStore.history.length;
  }
  const restore=button("载入历史为草稿",()=>{
    const v=CatalogStore.history.find(e=>e.revision===Number(versions.value));if(!v)return;
    try{const old=CatalogStore.verify(v.catalog);remember();draft=old;index=0;query="";search.value="";change();render();
      status.textContent="已载入版本 "+v.revision+"；点击应用配置后生效，也可以撤销。"}catch(e){status.textContent=e.message}
  });
  status.setAttribute("role","status");
  const file=el("input");file.type="file";file.accept=".json,application/json";file.hidden=true;
  const search=el("input");search.type="search";search.placeholder="搜索 ID 或名称";search.setAttribute("aria-label","搜索配置");
  search.oninput=()=>{query=search.value.trim().toLowerCase();render()};
  const matches=row=>(row.id+" "+row.name).toLowerCase().includes(query);
  const change=()=>{dirty=true;editVersion++;status.textContent="有未应用的更改";};
  function showList() {
    list.replaceChildren();
    draft[table].forEach((row,i)=>{
      if(!matches(row))return;
      const pick=button(row.name+" · "+row.id,()=>{index=i;render();},i===index?"selected":"");
      list.append(pick);
    });
  }
  function render() {
    tabs.replaceChildren(...Object.keys(schema).map(key=>button(tableNames[key]+" "+draft[key].length,()=>{
      table=key; index=0; query=""; search.value=""; render();
    },key===table?"selected":"")));
    if(!draft[table][index] || !matches(draft[table][index]))index=draft[table].findIndex(matches);
    showList();form.replaceChildren();const row=draft[table][index];
    duplicate.disabled=!row;remove.disabled=!row || draft[table].length===1;
    undo.disabled=!undoStack.length;showRefs();showVersions();
    if(!row){form.append(el("p","没有匹配的记录。请更改搜索词。"));return}
    for(const f of schema[table]){
      const label=el("label",f.label);
      let control;
      if(f.type==="ref"||f.type==="select"){
        control=el("select");
        const names=["slot","focusSlot"].includes(f.key)?UI.slots:f.key==="stat"?UI.stats:f.key==="ability"?{burn:"燃烧",shot:"水平水箭",wind:"高速连跳",earth:"护盾与冲击",slash:"周身剑光",shadow:"残影跃击"}:f.key==="kind"?{story:"剧情章节",lesser:"小秘境",greater:"大秘境",bell:"震击守关者",guard:"近战守卫",bow:"弓手",rebound:"借力反弹",wave:"震波"}:f.key==="trialRule"?{none:"普通关卡",dual:"随主位：连跳或冲击",chain:"前后排连踩",multi:"单踏群杀"}:{};
        const rarityNames=["minTier","quality"].includes(f.key)?Object.fromEntries(draft.rarities.map(r=>[r.id,r.name])):{};
        const values=f.type==="select"?f.options.map(value=>[value,rarityNames[value]??names[value]??value]):draft[f.ref]
          .filter(target=>!(f.key==="boot"||f.bootsOnly)||target.slot==="boots").map(target=>[target.id,target.name+" · "+target.id]);
        if(f.key==="skill"||f.optional&&!f.options?.includes(""))values.unshift(["","无"]);
        for(const [value,name] of values){const opt=el("option",name);opt.value=value;control.append(opt)}
      }else{
        control=el("input");control.type=f.type==="number"?"number":f.type==="color"?"color":"text";
        if(f.type==="number"){control.step="any";control.min=f.min;control.max=f.max;}
      }
      control.dataset.field=f.key;let recorded=false;control.onblur=()=>{recorded=false};
      control.value=row[f.key]??(f.key==="sprite"?"glala800006":"");control.oninput=()=>{
        if(!recorded){remember();recorded=true}
        if(f.optional&&control.value==="")delete row[f.key];
        else row[f.key]=f.type==="number"?(control.value===""?null:Number(control.value)):control.value;
        change();if(f.key==="id"||f.key==="name"){
          if(query && !matches(row)){query="";search.value="";status.textContent="名称或 ID 已更改，已清除搜索，保留当前条目。"}
          showList();
        }
        if(f.key==="id"||f.ref||f.refList)showRefs();
      };
      label.append(control);form.append(label);
    }
  }
  function add(){
    const source=draft[table][index];if(!source)return;
    remember();const row=structuredClone(source);let n=draft[table].length+1;
    do{row.id="new_"+n++}while(draft[table].some(r=>r.id===row.id));
    row.name="新"+tableNames[table];draft[table].push(row);index=draft[table].length-1;query="";search.value="";change();render();
  }
  function download(){
    const blob=new Blob([JSON.stringify(draft,null,2)],{type:"application/json"});
    const url=URL.createObjectURL(blob),link=el("a");link.href=url;link.download="ashen-catalog.json";link.click();setTimeout(()=>URL.revokeObjectURL(url),2000);
  }
  file.onchange=async()=>{
    try{if(!file.files[0])return;if(file.files[0].size>2_000_000)throw new Error("配置文件上限为 2 MB");
      const data=CatalogStore.verify(JSON.parse(await file.files[0].text()));remember();draft=data;index=0;change();render();}
    catch(error){status.textContent=error.message}finally{file.value=""}
  };
  const apply=button("应用配置",async()=>{
    apply.disabled=true;const version=editVersion;
    try{await CatalogStore.save(draft);dirty=version!==editVersion;showVersions();
      if(!dirty){undoStack.length=0;undo.disabled=true}
      status.textContent=dirty?"保存期间有新的更改，请再次应用。":"已应用版本 "+CatalogStore.revision+"，下次出征生效。";}
    catch(error){status.textContent=error.message}finally{apply.disabled=false}
  },"primary");
  const toolbar=el("div",undefined,"actions");
  const duplicate=button("复制新增",add),remove=button("删除选中行",()=>{
    if(index>=0 && draft[table].length>1){remember();draft[table].splice(index,1);change();render()}
  });
  toolbar.append(duplicate,remove,undo,button("导入 JSON",()=>file.click()),button("导出 JSON",download),apply);
  toolbar.append(button("可视化关卡编辑器",()=>{if(!dirty||confirm("离开并放弃未应用的配置？"))location.assign("level-editor.html")}));
  const archive=el("div",undefined,"actions");versions.setAttribute("aria-label","历史版本");archive.append(versions,restore);
  const pane=el("div",undefined,"editor-grid"),sidebar=el("aside");sidebar.append(search,list);pane.append(sidebar,form);
  root.replaceChildren(button("‹ 主菜单",()=>{if(!dirty || confirm("离开并放弃未应用的配置？"))leave()}),title,
    el("p",CatalogStore.service?"本地工作室 · 应用后写入项目数据目录":"浏览器工作室 · 应用后在此浏览器生效，可用 JSON 在设备间传递"),tabs,toolbar,archive,pane,deps,file,status);render();
};
