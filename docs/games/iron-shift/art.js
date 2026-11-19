"use strict";
const YardArt = (() => {
  const ink="#293e3c", wx=67, wy=29, ox=414, oy=122;
  const project=(x,y,z=0)=>[ox+(x-y)*wx,oy+(x+y)*wy-z];
  function face(c,vertices,fill,stroke=ink) {
    c.beginPath();
    vertices.forEach(([x,y],i)=>i ? c.lineTo(x,y) : c.moveTo(x,y));
    c.closePath(); c.fillStyle=fill; c.fill();
    if(stroke){c.strokeStyle=stroke;c.lineWidth=1.4;c.stroke();}
  }
  function line(c,a,b,color=ink,weight=1.4) {
    c.beginPath();c.moveTo(...a);c.lineTo(...b);c.strokeStyle=color;c.lineWidth=weight;c.stroke();
  }
  function slab(c,x,y,w,d,base,height,colors) {
    const corners=[[x,y],[x+w,y],[x+w,y+d],[x,y+d]];
    const bottom=corners.map(([a,b])=>project(a,b,base)), top=corners.map(([a,b])=>project(a,b,base+height));
    face(c,[top[3],top[2],bottom[2],bottom[3]],colors[1]);
    face(c,[top[1],top[2],bottom[2],bottom[1]],colors[2]);
    face(c,top,colors[0]);
  }
  const metal=["#91aaaa","#69847f","#475f60"], yellow=["#efc773","#ce9b49","#926b33"];
  const brick=["#bc7360","#95513e","#704138"], pale=["#eae6c9","#c3c4ad","#959e93"];
  function asset(c,type,x,y,dir=0,phase=0,busy=false) {
    const box=(a,b,w,d,z,h,colors)=>slab(c,x+a,y+b,w,d,z,h,colors);
    const p=(a,b,z=0)=>project(x+a,y+b,z);
    if(type==="erase"){
      box(-.34,-.24,.68,.48,0,12,brick);
      line(c,p(-.22,-.12,13),p(.22,.12,13),"#fbe8bf",3);
      line(c,p(.22,-.12,13),p(-.22,.12,13),"#fbe8bf",3);return;
    }
    if(type==="belt"){
      c.save();
      const oriented=(a,b,z)=>{for(let i=0;i<dir;i++) [a,b]=[-b,a];return p(a,b,z);};
      box(-.46,-.46,.92,.92,0,4,metal);
      face(c,[oriented(-.49,-.28,6),oriented(.49,-.28,6),oriented(.49,.28,6),oriented(-.49,.28,6)],"#4e6261");
      for(let i=0;i<4;i++){
        const a=-.44+((i/4+(phase%1)*.25)%1)*.88;
        line(c,oriented(a,-.26,7),oriented(a,.26,7),"#aec2b9",2);
      }
      face(c,[oriented(-.12,-.18,8),oriented(.13,0,8),oriented(-.12,.18,8)],"#efd38b",null);
      c.restore();return;
    }
    box(-.43,-.42,.86,.84,0,5,metal);
    if(type==="mine"){
      box(-.34,-.29,.25,.58,5,25,yellow);
      for(const [a,b,h] of [[.02,.1,17],[.22,.06,21],[.08,-.18,25],[.22,.22,14]]) {
        face(c,[p(a-.18,b,5),p(a,b-.13,5),p(a+.10,b,5),p(a,b+.14,5)],"#705244");
        face(c,[p(a-.18,b,6),p(a-.02,b,h),p(a+.10,b,6)],"#b17654");
        face(c,[p(a-.02,b,h),p(a,b-.13,6),p(a+.10,b,6)],"#805446");
      }
      box(-.30,-.1,.12,.14,30,28,metal);
      line(c,p(-.23,-.02,55),p(.24,-.02,63),ink,5);
      line(c,p(.24,-.02,63),p(.24,-.02,30),"#6a6250",1.5);
    } else if(type==="furnace"){
      box(-.34,-.31,.68,.64,5,35,brick);
      for(let row=0;row<3;row++){
        line(c,p(-.32,.333,11+row*9),p(.32,.333,11+row*9),"#c58060",1);
        line(c,p(row%2?-.15:.1,.333,5+row*9),p(row%2?-.15:.1,.333,12+row*9),"#c58060",1);
      }
      face(c,[p(-.21,.343,8),p(.16,.343,8),p(.16,.343,24),p(-.21,.343,24)],busy?"#fdb54c":"#472f29");
      box(-.21,-.21,.2,.2,40,37,pale);
      box(-.23,-.23,.24,.24,69,5,brick);
      if(busy){for(let i=0;i<3;i++){const [a,b]=p(-.12,-.12,82+i*8);c.fillStyle="rgba(113,119,109,.42)";c.beginPath();c.arc(a+Math.sin(phase+i)*3+i*2,b,4+i,0,Math.PI*2);c.fill();}}
    } else if(type==="press"){
      box(-.32,-.3,.65,.62,5,8,yellow);
      box(-.31,-.26,.13,.46,13,30,metal);
      box(.18,-.26,.13,.46,13,30,metal);
      box(-.35,-.30,.71,.54,43,10,yellow);
      box(-.10,-.05,.20,.16,31+(busy?Math.sin(phase*4)*6:0),11,brick);
      for(let i=0;i<4;i++) line(c,p(-.30+i*.15,.25,45),p(-.22+i*.15,.25,51),ink,3);
    } else if(type==="dock"){
      box(-.38,-.31,.76,.66,5,31,pale);
      face(c,[p(-.42,-.38,35),p(.42,-.38,35),p(.42,.02,48),p(-.42,.02,48)],"#71908a");
      face(c,[p(-.42,.02,48),p(.42,.02,48),p(.42,.40,35),p(-.42,.40,35)],"#577b76");
      for(let i=0;i<5;i++)line(c,p(-.35+i*.15,.02,48),p(-.35+i*.15,.38,36),"#97aaa2",1.3);
      face(c,[p(-.21,.36,5),p(.18,.36,5),p(.18,.36,27),p(-.21,.36,27)],ink);
    }
    if(type!=="dock"){
      const [dx,dy]=IronShift.directions[dir];
      face(c,[p(dx*.49,dy*.49,7),p(dx*.35-dy*.1,dy*.35+dx*.1,7),p(dx*.35+dy*.1,dy*.35-dx*.1,7)],"#ffd98a");
    }
  }
  function cargo(c,kind,x,y,z=16){
    if(kind==="bar") slab(c,x-.15,y-.09,.3,.18,z,6,["#d3e1dc","#9eb7b1","#688c8d"]);
    else if(kind==="ore") {
      const p=(a,b,h)=>project(x+a,y+b,z+h);
      face(c,[p(-.15,-.05,0),p(0,-.13,5),p(.12,0,1),p(0,.12,0)],"#b98160");
      face(c,[p(-.15,-.05,0),p(-.03,0,13),p(.12,0,1),p(0,.12,0)],"#985c40");
    } else {
      const [a,b]=project(x,y,z+4);c.save();c.translate(a,b);c.scale(1,.65);
      const pts=Array.from({length:24},(_,i)=>{const t=i*Math.PI/12;const r=i%3===0?8:12;return [r*Math.cos(t),r*Math.sin(t)];});
      face(c,pts,"#dbb367");c.fillStyle=ink;c.beginPath();c.arc(0,0,3,0,Math.PI*2);c.fill();c.restore();
    }
  }
  function backdrop(c){
    c.fillStyle="#dce0c9";c.fillRect(0,0,1000,520);
    for(let k=0;k<150;k++){const x=(k*461)%1000,y=(k*271)%520;line(c,[x,y],[x+3,y],"#c2c7b0",1);}
    // The riveted truss and rail siding frame the playable yard.
    const p=(x,y,z)=>project(x,y,z);
    for(const x of [0,5]){
      slab(c,x-.12,-1.18,.34,.31,0,5,pale);
      slab(c,x,-1.1,.12,.13,4,61,yellow);
    }
    for(let i=0;i<10;i++){
      const x=i*.5;line(c,p(x,-1.04,63),p(x+.5,-1.04,76),"#a47140",2.4);
      line(c,p(x,-1.04,76),p(x+.5,-1.04,63),"#aa824c",2);
    }
    for(const h of [63,76])line(c,p(0,-1.04,h),p(5.1,-1.04,h),"#87633d",3);
    slab(c,2.5,-1.19,.34,.30,62,8,yellow);
    for(const off of [0,.1])line(c,p(2.62+off,-1.02,62),p(2.62+off,-1.02,31),ink,1.3);
    slab(c,2.58,-1.10,.22,.16,25,6,brick);
    for(let i=0;i<24;i++)line(c,p(i*.29-.5,4.9,0),p(i*.29-.5,5.28,0),"#a5a18d",4);
    for(const y of [4.99,5.20])line(c,p(-.5,y,0),p(6.4,y,0),"#858f7f",2);
  }
  function yard(c,s,chosen,phase,moves,fraction){
    backdrop(c);
    const activeMoves=new Map(moves.map(m=>[m.to,m]));
    for(let y=0;y<5;y++)for(let x=0;x<7;x++){
      const i=y*7+x;
      slab(c,x-.49,y-.49,.98,.98,-4,4,i===chosen?["#f0d18a","#8a856b","#727965"]:["#cbd0b7","#9da88e","#89987f"]);
      const t=s.tiles[i];
      if(t)asset(c,t.type,x,y,t.dir,phase,!!t.cargo||t.type==="mine");
      if(t?.cargo && (!activeMoves.has(i)||fraction>=1))cargo(c,t.cargo,x,y,t.type==="belt"?9:15);
    }
    if(fraction<1) for(const {from,to,kind} of moves) {
      const x=from%7+(to%7-from%7)*fraction,y=Math.floor(from/7)+(Math.floor(to/7)-Math.floor(from/7))*fraction;
      cargo(c,kind,x,y,12);
    }
    // A parked ore wagon sits outside the editable floor.
    for(const x of [.1,.85])slab(c,x,4.96,.15,.32,0,7,metal);
    slab(c,-.05,4.86,1.27,.48,7,6,metal);
    slab(c,-.02,4.88,1.2,.44,13,12,brick);
    for(const x of [.02,.35,.68,1.01])line(c,project(x,5.33,14),project(x,5.33,24),"#683e32",2);
    for(let x=0;x<7;x++){
      const [u,v]=project(x,-.65);c.fillStyle=ink;c.font="bold 15px monospace";c.fillText(String.fromCharCode(65+x),u,v);
    }
    for(let y=0;y<5;y++){const [u,v]=project(-.72,y);c.fillText(String(y+1),u-8,v);}
    c.strokeStyle="#a9b399";c.lineWidth=1;
    for(const [x,y] of [[24,24],[976,24],[24,496],[976,496]]){
      line(c,[x-6,y],[x+6,y],"#879782",1);line(c,[x,y-6],[x,y+6],"#879782",1);
    }
  }
  function hit(u,v){
    const a=(u-ox)/wx,b=(v-oy)/wy,x=Math.round((a+b)/2),y=Math.round((b-a)/2);
    return x>=0&&x<7&&y>=0&&y<5?y*7+x:-1;
  }
  function preview(canvas,type){
    const c=canvas.getContext("2d");canvas.width=110;canvas.height=90;
    c.setTransform(.88,0,0,.88,55-ox*.88,66-oy*.88);asset(c,type,0,0);
  }
  return {yard,hit,preview};
})();
