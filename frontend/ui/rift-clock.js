// Wall time keeps advancing between rooms and while simulation or menus are paused.
globalThis.RiftClock = function({getRun,expire,labels}) {
  let timer;
  function show(text,urgent=false) {
    for(const label of labels){
      label.hidden=!text;
      if(label.textContent!==text)label.textContent=text;
      if(text)label.dataset.urgent=String(urgent);
    }
  }
  function sync() {
    clearTimeout(timer);
    const run=getRun();
    if(!run?.deadline){show("");return}
    const left=Math.max(0,run.deadline-Date.now());
    const seconds=Math.ceil(left/1000);
    const time=Math.floor(seconds/60)+":"+String(seconds%60).padStart(2,"0");
    show("大秘境 "+run.level+" 层　"+time,seconds<=10);
    if(left>0){
      timer=setTimeout(sync,left-(seconds-1)*1000);
      return;
    }
    // view() can call sync before its new room is mounted. Settle after that transition.
    timer=setTimeout(()=>{
      const current=getRun();
      if(current?.id!==run.id || Date.now()<current.deadline){sync();return}
      try{expire(current)}catch(error){show(error.message,true);return}
      if(getRun()?.id===current.id)show("时限已尽　请刷新后重试",true);
      else sync();
    },0);
  }
  window.addEventListener("focus",sync);
  document.addEventListener("visibilitychange",sync);
  return {sync};
};
