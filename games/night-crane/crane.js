"use strict";
const $=id=>document.getElementById(id),canvas=$("harbor"),c=canvas.getContext("2d");
const strings={
 vi:{studio:"Đại Công Trường Xưởng",title:"Cầu Trục Ca Đêm",best:"Kỷ lục",load:"Kiện",miss:"Lượt trượt còn lại",drop:"Thả hàng",fall:"Đang hạ hàng",restart:"Chơi lại",win:"Đủ sáu kiện. Tàu có thể rời bến.",lose:"Hết lượt. Chơi lại để xếp chuyến hàng mới.",land:"Kiện hàng đã nằm chắc trên boong.",splash:"Kiện vừa trượt khỏi chồng hàng.",help:"Chạm mặt nước, bấm Thả hàng hoặc nhấn Space khi kiện nằm trên vạch vàng. Chồng đủ sáu kiện trước khi trượt ba lần."},
 en:{studio:"Grand Works Studio",title:"Night Crane",best:"Personal best",load:"Loads",miss:"Misses left",drop:"Release load",fall:"Lowering load",restart:"Play again",win:"Six loads secured. The ship is ready to leave.",lose:"The shift is over. Play again to load another ship.",land:"Load secured on deck.",splash:"The load missed the stack.",help:"Tap the harbor, press Release load or hit Space when the crate is above the yellow mark. Stack six loads before three misses."}
};
let lang=navigator.language.startsWith("vi")?"vi":"en",best=0;
try{const saved=JSON.parse(localStorage.getItem("grandworks.crane.v1"));if(Number.isInteger(saved?.best)&&saved.best>=0&&saved.best<=6)best=saved.best;if(["vi","en"].includes(saved?.lang))lang=saved.lang;}catch{}
const requestedLang=new URLSearchParams(location.search).get("lang");
if(["vi","en"].includes(requestedLang))lang=requestedLang;
let stack=[],misses=0,phase=-1,fall=null,msg="",last=0,raf=0;
const t=()=>strings[lang],done=()=>stack.length===6||misses===3;
const hook=()=>450+260*Math.sin(phase), target=()=>stack.length?stack.at(-1):450;
function save(){try{localStorage.setItem("grandworks.crane.v1",JSON.stringify({best,lang}));}catch{}}
function labels(){
  const s=t();document.documentElement.lang=lang;document.title=s.title+" · "+s.studio;$("lang").value=lang;
  for(const id of ["studio","title","help"])$(id).textContent=s[id];
  $("best").textContent=s.best+" · "+best+"/6";$("score").textContent=s.load+" "+stack.length+"/6   ·   "+s.miss+" "+(3-misses);
  $("drop").textContent=done()?s.restart:fall?s.fall:s.drop;$("drop").disabled=!!fall;
  $("message").textContent=msg?s[msg]:"";canvas.setAttribute("aria-label",s.title+" · "+$("score").textContent);
}
function rect(x,y,w,h,color){c.fillStyle=color;c.fillRect(x,y,w,h);}
function line(x,y,u,v,color,w=1){c.strokeStyle=color;c.lineWidth=w;c.beginPath();c.moveTo(x,y);c.lineTo(u,v);c.stroke();}
function crate(x,y,level){
  const colors=["#d99853","#93a5a0","#b86d4e","#abafa3","#c28c50","#82a5a1"];
  rect(x-49,y-28,98,28,"#182b36");rect(x-47,y-26,94,24,colors[level%6]);
  for(let i=-40;i<45;i+=10){rect(x+i,y-24,3,20,"#384548");rect(x+i+3,y-24,1,20,"#d7c79d");}
  rect(x-47,y-27,94,3,"#ebc59a");rect(x+17,y-20,22,8,"#e6d9bd");
}
function scene(){
  const grad=c.createLinearGradient(0,0,0,375);grad.addColorStop(0,"#182e48");grad.addColorStop(1,"#b47463");c.fillStyle=grad;c.fillRect(0,0,900,475);
  for(let i=0;i<67;i++)rect((i*173)%900,12+((i*97)%185),2,1,"#ced0c0");
  c.fillStyle="#efca89";c.beginPath();c.arc(735,89,28,0,Math.PI*2);c.fill();
  for(let i=0;i<17;i++){const x=i*58-8,y=294-(i*37)%64;rect(x,y,53,330-y,"#435064");for(let j=0;j<4;j++)rect(x+5+j*11,y+8,5,3,j%3?"#7b7978":"#dbc18e");}
  for(const x of [22,640,810]){line(x,315,x,215,"#495260",5);line(x,215,x+72,182,"#495260",4);line(x+58,190,x+58,222,"#495260",1);}
  rect(0,328,900,147,"#263c50");for(let i=0;i<55;i++)rect((i*71)%900,336+(i*27)%135,13+(i%6)*5,2,i%5?"#384c5c":"#967a68");
  c.fillStyle="#182e39";c.beginPath();c.moveTo(188,357);c.lineTo(696,357);c.lineTo(655,397);c.lineTo(237,397);c.closePath();c.fill();
  rect(192,354,500,6,"#ba814d");rect(230,338,56,16,"#63767b");rect(240,324,28,15,"#b9a58b");
  rect(85,51,12,310,"#233b45");rect(67,352,55,13,"#b18958");
  for(let i=0;i<12;i++){const x=82+i*56;line(x,29,x+56,57,"#bb9668",3);line(x,57,x+56,29,"#a68363",2);}
  rect(77,25,684,5,"#d7b47b");rect(77,55,684,5,"#8c7055");
  stack.forEach((x,i)=>crate(x,353-i*28,i));
  if(!done()){
    const hx=hook(),edge=353-stack.length*28;
    rect(hx-15,40,30,16,"#d09b52");rect(hx-9,54,18,7,"#2d3c40");
    const y=fall?fall.y:109,x=fall?fall.x:hx;
    line(hx-6,59,hx-6,fall?83:81,"#c0b294",1.5);line(hx+6,59,hx+6,fall?83:81,"#c0b294",1.5);
    crate(x,y,stack.length);
    line(target()-32,edge,target()+32,edge,"#f5c36a",3);
  }
}
function release(){
  if(done()){stack=[];misses=0;msg="";phase=-1;last=0;start();labels();return;}
  if(fall)return;fall={x:hook(),y:109,vy:20,miss:false};labels();
}
function frame(now){
  const dt=last?Math.min(.05,(now-last)/1000):0;last=now;
  phase+=dt*(1.05+.09*stack.length);
  if(fall){fall.vy+=dt*460;fall.y+=fall.vy*dt;
    if(!fall.miss&&fall.y>=353-stack.length*28){
      if(Math.abs(fall.x-target())<=33){stack.push(fall.x);fall=null;best=Math.max(best,stack.length);msg=done()?"win":"land";save();labels();}
      else fall.miss=true;
    }
    if(fall?.y>449){fall=null;misses++;msg=done()?"lose":"splash";labels();}
  }
  scene();raf=done()?0:requestAnimationFrame(frame);
}
function start(){if(!raf){last=0;raf=requestAnimationFrame(frame);}}
$("drop").onclick=release;canvas.onclick=release;document.addEventListener("keydown",e=>{if(e.code==="Space"&&!e.repeat&&e.target.tagName!=="SELECT"&&e.target.tagName!=="BUTTON"){e.preventDefault();release();}});
$("lang").onchange=e=>{lang=e.target.value;updateLanguageUrl();save();labels();};
document.addEventListener("visibilitychange",()=>{if(document.hidden){cancelAnimationFrame(raf);raf=0;}else if(!done())start();});
labels();start();

function updateLanguageUrl(){
  if(location.protocol==="file:"||!location.search)return;
  const url=new URL(location.href);url.searchParams.set("lang",lang);history.replaceState(null,"",url);
}
