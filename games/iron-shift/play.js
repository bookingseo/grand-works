"use strict";
const langData={
  vi:{studio:"Đại Công Trường Xưởng",title:"Ca Luyện Thép",shift:"CA",order:"PHIẾU GIAO HÀNG",names:["Quặng đầu ca","Mẻ thép đầu tiên","Bánh răng xuất xưởng","Xưởng tự do"],brief:["Nối băng tải ở D3 hướng ↘ đến kho G3. Bật máy để giao 3 kiện quặng.","Thay băng tải C3 bằng lò luyện, hướng ↘. Giao 4 thỏi thép cho kho.","Lắp máy ép ở E3, sau lò luyện. Giao 5 bánh răng cho kho.","Đã giao đủ ba đơn. Có thể mở mỏ mới, xoay hướng và thử dây chuyền khác."],kinds:["kiện quặng","thỏi thép","bánh răng","đã giao"],tools:{belt:"Băng tải",furnace:"Lò luyện",press:"Máy ép",mine:"Mỏ",dock:"Kho",erase:"Tháo"},run:"Bật máy",stop:"Tạm dừng",speed:"Tốc độ",turn:"Hướng ra",total:"Tổng hàng đã giao",empty:"Đất trống",apply:"Đặt tại ô",help:"Chọn thiết bị rồi chạm ô đất. Dùng R để xoay. Khi chọn sân xưởng, dùng phím mũi tên để chọn ô và Enter để đặt.",restart:"Ca mới",prompt:"Bắt đầu lại từ đơn quặng đầu ca?",cancel:"Tiếp tục ca",reset:"Bắt đầu lại",sandbox:"TỰ DO",saved:"Đã lưu tại máy.",noSave:"Trình duyệt không lưu được ca này."},
  en:{studio:"Grand Works Studio",title:"Iron Shift",shift:"SHIFT",order:"DISPATCH ORDER",names:["First ore shipment","The first smelt","Gears for dispatch","Open workshop"],brief:["Bridge D3 with a belt facing ↘ toward the depot at G3. Start the line and deliver 3 ore crates.","Replace the belt at C3 with a furnace facing ↘. Deliver 4 steel bars to the depot.","Fit a press at E3, downstream of the furnace. Deliver 5 gears to the depot.","All three orders shipped. Open another mine, turn the belts and try a new layout."],kinds:["ore crates","steel bars","gears","shipped"],tools:{belt:"Belt",furnace:"Furnace",press:"Press",mine:"Mine",dock:"Depot",erase:"Remove"},run:"Start line",stop:"Pause line",speed:"Speed",turn:"Outlet",total:"Lifetime shipments",empty:"Empty lot",apply:"Build here",help:"Pick a tool, then tap a plot. R turns the outlet. With the yard focused, use arrow keys to select a plot and Enter to build.",restart:"New shift",prompt:"Start again with the first ore order?",cancel:"Keep playing",reset:"Start again",sandbox:"FREE BUILD",saved:"Saved on this device.",noSave:"This browser could not save the shift."}
};
const $=id=>document.getElementById(id), canvas=$("yard"), ctx=canvas.getContext("2d");
const arrows=["↘","↙","↖","↗"], storeKey="grandworks.iron-shift.v1";
let lang=navigator.language.toLowerCase().startsWith("vi")?"vi":"en";
let state=IronShift.fresh(),tool="belt",dir=0,selected=17,speed=1,running=false;
let moves=[],frameId=0,last=0,elapsed=0,saveFailed=false;
try{
  const data=JSON.parse(localStorage.getItem(storeKey));
  if(data && IronShift.valid(data.state))state=data.state;
  if(data && ["vi","en"].includes(data.lang))lang=data.lang;
}catch{ /* A fresh shift works when local storage is unavailable. */ }
const requestedLang=new URLSearchParams(location.search).get("lang");
if(["vi","en"].includes(requestedLang))lang=requestedLang;
const t=()=>langData[lang], coord=i=>String.fromCharCode(65+i%7)+(1+Math.floor(i/7));
function save(){
  try{localStorage.setItem(storeKey,JSON.stringify({state,lang}));saveFailed=false;}
  catch{saveFailed=true;}
  $("status").textContent=saveFailed?t().noSave:t().saved;
}
const phone = matchMedia("(max-width:790px)");
const touchInput = matchMedia("(pointer:coarse)");
function paint(frac=1){
  ctx.save();
  if(phone.matches)ctx.translate(-55,-12);
  YardArt.yard(ctx,state,selected,state.tick+frac,moves,frac);
  if(phone.matches)YardArt.mark(ctx,selected,coord(selected));
  ctx.restore();
}
function resizeYard(){
  canvas.width=phone.matches?860:1000;
  canvas.height=phone.matches?443:520;
  paint();
}
phone.addEventListener("change", resizeYard);
$("zoom").onclick=()=>{
  const yard=$("yard-window"), zoomed=yard.classList.toggle("zoomed");
  $("zoom").setAttribute("aria-pressed",String(zoomed));
  yard.scrollLeft=(yard.scrollWidth-yard.clientWidth)/2;
  refresh();
};
function refresh(){
  const s=t(),j=state.job,order=IronShift.jobs[j];
  document.documentElement.lang=lang;document.title=s.title+" · "+s.studio;$("lang").value=lang;
  for(const id of ["studio","title","help","restart","cancel","reset","prompt","apply"])$(id).textContent=s[id];
  const zoomed=$("yard-window").classList.contains("zoomed");
  $("zoom").textContent=lang==="vi"?(zoomed?"Thu nhỏ":"Phóng to"):(zoomed?"Zoom out":"Zoom in");
  if(touchInput.matches)$("help").textContent=lang==="vi"?"Chọn thiết bị, rồi chạm ô đất để xây. Khi phóng to, vuốt ngang để xem sân. Có thể chọn tọa độ rồi bấm Đặt tại ô.":"Pick a tool and tap a plot to build. Zoom in and swipe across the yard, or pick a coordinate and tap Build here.";
  $("shift").textContent=order?s.shift+" 0"+(j+1)+" / 03":s.sandbox;
  $("orderLabel").textContent=s.order;$("order").textContent=s.names[j];$("brief").textContent=s.brief[j];
  $("count").textContent=order?state.count+"/"+order.count:state.shipped;$("unit").textContent=s.kinds[j];
  $("fill").style.width=(order?100*state.count/order.count:100)+"%";
  $("power").textContent=running?s.stop:s.run;$("power").setAttribute("aria-pressed",String(running));
  $("speed").textContent=speed+"×";$("speed").setAttribute("aria-label",s.speed+" "+speed+"×");
  $("turn").textContent=s.turn+"  "+arrows[dir];$("total").textContent=s.total+" · "+state.shipped;
  $("coordinate").value=selected;
  const tile=state.tiles[selected];$("legend").textContent=tile?s.tools[tile.type]+(tile.type==="dock"?"":" "+arrows[tile.dir]):s.empty;
  canvas.setAttribute("aria-label",s.title+" · "+coord(selected)+" · "+$("legend").textContent);
  for(const b of $("tools").children){
    b.lastChild.textContent=s.tools[b.dataset.type];b.setAttribute("aria-pressed",String(b.dataset.type===tool));
  }
}
function frame(now){
  if(!running)return;
  if(!last)last=now;
  elapsed+=Math.min(150,now-last)*speed;last=now;
  if(elapsed>=390){elapsed%=390;moves=IronShift.step(state);refresh();save();}
  paint(matchMedia("(prefers-reduced-motion: reduce)").matches?1:Math.min(1,elapsed/390));
  frameId=requestAnimationFrame(frame);
}
function toggle(on){
  running=on;cancelAnimationFrame(frameId);last=0;elapsed=0;moves=[];
  if(on)frameId=requestAnimationFrame(frame);else {paint();save();}
  refresh();
}
function build(index){selected=index;IronShift.build(state,index,tool,dir);moves=[];refresh();paint();save();}
function choose(index){if(index>=0 && index<35){selected=index;refresh();paint();}}
function rotate(){dir=(dir+1)%4;refresh();}
for(const type of Object.keys(t().tools)){
  const button=document.createElement("button"),icon=document.createElement("canvas"),label=document.createElement("span");
  button.type="button";button.dataset.type=type;icon.setAttribute("aria-hidden","true");
  YardArt.preview(icon,type);button.append(icon,label);
  button.onclick=()=>{tool=type;refresh();};$("tools").append(button);
}
for(let i=0;i<35;i++)$("coordinate").add(new Option(coord(i),String(i)));
$("coordinate").onchange=e=>choose(Number(e.target.value));$("apply").onclick=()=>build(selected);
$("power").onclick=()=>toggle(!running);$("turn").onclick=rotate;
$("speed").onclick=()=>{speed=speed===1?3:1;refresh();};
$("lang").onchange=e=>{lang=e.target.value;updateLanguageUrl();refresh();save();};
canvas.onclick=e=>{
  const rect=canvas.getBoundingClientRect(),i=YardArt.hit((e.clientX-rect.left)*canvas.width/rect.width+(phone.matches?55:0),(e.clientY-rect.top)*canvas.height/rect.height+(phone.matches?12:0));
  if(i>=0)build(i);
};
canvas.onkeydown=e=>{
  const d={ArrowRight:0,ArrowDown:1,ArrowLeft:2,ArrowUp:3}[e.key];
  if(d!==undefined){e.preventDefault();const [dx,dy]=IronShift.directions[d],x=selected%7+dx,y=Math.floor(selected/7)+dy;if(x>=0&&x<7&&y>=0&&y<5)choose(7*y+x);}
  if(e.key==="Enter"||e.key===" "){e.preventDefault();build(selected);}
};
document.addEventListener("keydown",e=>{if(!e.metaKey&&!e.ctrlKey&&!e.altKey&&e.key.toLowerCase()==="r"&&!$("confirm").open&&e.target.tagName!=="SELECT")rotate();});
$("restart").onclick=()=>$("confirm").showModal();$("confirm").onclose=()=>{if($("confirm").returnValue==="reset"){state=IronShift.fresh();selected=17;dir=0;tool="belt";toggle(false);}};
window.addEventListener("pagehide",save);document.addEventListener("visibilitychange",()=>{if(document.hidden && running)toggle(false);});
window.addEventListener("workshop-pause",()=>toggle(false));
refresh();resizeYard();

function updateLanguageUrl(){
  if(location.protocol==="file:"||!location.search)return;
  const url=new URL(location.href);url.searchParams.set("lang",lang);history.replaceState(null,"",url);
}
