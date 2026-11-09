// A single native dialog keeps the scene paused until its last page closes.
// Keep the actual parent controls so list selection and keyboard focus survive inspection.
globalThis.GamePanelNavigation=(dialog,body,{enter,leave})=>{
  const trail=[];let current=null,active=false;
  function reset(){
    if(dialog.open||!active)return;
    active=false;current=null;trail.length=0;body.replaceChildren();leave();
  }
  function close(){if(dialog.open){dialog.close();reset()}}
  function draw(render){current=render;render(body);body.scrollTop=0;dialog.scrollTop=0}
  function open(render){
    trail.length=0;
    if(!dialog.open){
      // Native close events are queued; a quick reopen must release the previous session first.
      reset();enter();active=true;
      draw(render);dialog.showModal();
    }else draw(render);
  }
  function push(render){
    if(!dialog.open){open(render);return}
    const nodes=document.createDocumentFragment(),focus=document.activeElement;
    const parent={current,nodes,focus,bodyY:body.scrollTop,dialogY:dialog.scrollTop};
    while(body.firstChild)nodes.append(body.firstChild);
    trail.push(parent);draw(render);
    const anchor=body.querySelector("h1,h2")||body;
    anchor.tabIndex=-1;anchor.focus({preventScroll:true});
  }
  function back(){
    if(!trail.length){close();return}
    const parent=trail.pop();current=parent.current;body.replaceChildren(parent.nodes);
    parent.focus?.focus({preventScroll:true});body.scrollTop=parent.bodyY;dialog.scrollTop=parent.dialogY;
    body.firstElementChild?.dispatchEvent(new Event("game-reveal"));
  }
  // Handle Escape in the same input event; a queued native close leaves the dock
  // focused long enough for the player's next Space to reopen the menu.
  dialog.addEventListener("cancel",e=>{e.preventDefault();back()});
  dialog.addEventListener("close",reset);
  return {open,push,back,close,get current(){return current}};
};
