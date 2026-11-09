// Short, throttled pickup motifs. Audio starts only through the sound button.
globalThis.DropSound = (() => {
 let engine=null, last=-Infinity, lastRank=-1, lastImpact=-Infinity, enabled=false;
 const lastVoice=new Map(),contacts={
   swing:["triangle",420,130,.08,.035],block:["square",740,255,.09,.048],
   wound:["sawtooth",175,44,.14,.095],shot:["sine",710,235,.1,.065],
   slash:["sawtooth",420,100,.09,.055],blade:["triangle",530,235,.11,.065],
   shadow:["triangle",170,66,.10,.07],burn:["triangle",198,84,.075,.04]
 };
 const button=document.getElementById("sound");
 button.onclick=async()=>{
   document.getElementById("scene").focus();
   try{
     engine ||= new AudioContext();
     if(engine.state==="suspended")await engine.resume();
     enabled=!enabled;button.textContent=enabled?"音效：开":"音效：关";
   }catch{button.textContent="音效不可用";}
 };
 return { ordnance(type){
   if(!enabled||!engine)return;
   const now=engine.currentTime;
   const voices=type==="rail"?[["sawtooth",510,60,.22,.065],["triangle",125,35,.32,.12]]:
     type==="mortar"?[["triangle",144,32,.34,.19],["square",86,43,.12,.04]]:
     [["sawtooth",180,780,.15,.035],["triangle",490,235,.20,.045]];
   for(const [wave,from,to,length,level] of voices){
     const osc=engine.createOscillator(),gain=engine.createGain();osc.type=wave;
     osc.frequency.setValueAtTime(from,now);osc.frequency.exponentialRampToValueAtTime(to,now+length);
     gain.gain.setValueAtTime(.0001,now);gain.gain.exponentialRampToValueAtTime(level,now+.008);
     gain.gain.exponentialRampToValueAtTime(.0001,now+length);
     osc.connect(gain).connect(engine.destination);osc.start(now);osc.stop(now+length+.01);
     osc.onended=()=>{osc.disconnect();gain.disconnect()};
   }
 },contact(kind){
   if(!enabled||!engine||!Object.hasOwn(contacts,kind))return;
   const now=engine.currentTime;
   if(now-(lastVoice.get(kind)??-Infinity)<.09)return;
   lastVoice.set(kind,now);
   const [wave,from,to,duration,volume]=contacts[kind],osc=engine.createOscillator(),gain=engine.createGain();
   osc.type=wave;osc.frequency.setValueAtTime(from,now);osc.frequency.exponentialRampToValueAtTime(to,now+duration);
   gain.gain.setValueAtTime(.001,now);gain.gain.exponentialRampToValueAtTime(volume,now+.004);
   gain.gain.exponentialRampToValueAtTime(.0001,now+duration);
   osc.connect(gain).connect(engine.destination);osc.start(now);osc.stop(now+duration+.006);
   osc.onended=()=>{osc.disconnect();gain.disconnect()};
 },impact(heavy){
   if(!enabled||!engine||engine.currentTime-lastImpact<.07)return;
   const now=lastImpact=engine.currentTime,osc=engine.createOscillator(),gain=engine.createGain();
   const length=heavy?.13:.075;
   osc.type="triangle";osc.frequency.setValueAtTime(heavy?128:235,now);
   osc.frequency.exponentialRampToValueAtTime(heavy?42:88,now+length);
   gain.gain.setValueAtTime(.001,now);gain.gain.exponentialRampToValueAtTime(heavy?.13:.085,now+.004);
   gain.gain.exponentialRampToValueAtTime(.0001,now+length);
   osc.connect(gain).connect(engine.destination);osc.start(now);osc.stop(now+length+.01);
   osc.onended=()=>{osc.disconnect();gain.disconnect()};
 },play(rank){
   if(!enabled || !engine || (engine.currentTime-last<.12 && rank<=lastRank))return;
   last=engine.currentTime;lastRank=rank;
   const notes=rank>1?[1,1.25,1.5]:[1,1.25];
   notes.forEach((ratio,i)=>{
     const time=last+i*.055, osc=engine.createOscillator(),gain=engine.createGain();
     osc.type="triangle";osc.frequency.value=(310+rank*92)*ratio;
     gain.gain.setValueAtTime(.0001,time);gain.gain.exponentialRampToValueAtTime(.06,time+.008);
     gain.gain.exponentialRampToValueAtTime(.0001,time+.13);osc.connect(gain).connect(engine.destination);
     osc.start(time);osc.stop(time+.14);osc.onended=()=>{osc.disconnect();gain.disconnect()};
   });
 }};
})();
