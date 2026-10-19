const $=id=>document.getElementById(id);
const S={sound:true,time:90,goals:5,ai:false};
const show=id=>document.querySelectorAll('.screen').forEach(e=>e.classList.toggle('active',e.id===id));
document.querySelectorAll('[data-go]').forEach(b=>b.onclick=()=>show(b.dataset.go));
$('b-play').onclick=()=>show('s-count');
$('b-opt').onclick=()=>show('s-opt');
$('o-snd').onchange=e=>S.sound=e.target.checked;
$('o-time').onchange=e=>S.time=+e.target.value;
$('o-goals').onchange=e=>S.goals=+e.target.value;
$('o-ai').onchange=e=>S.ai=e.target.checked;
$('b-again').onclick=()=>show('s-menu');

/* Sonido */
let ac;
function beep(f,d,t='square',v=.12){if(!S.sound)return;try{ac=ac||new AudioContext();const o=ac.createOscillator(),g=ac.createGain();o.type=t;o.frequency.value=f;g.gain.value=v;o.connect(g);g.connect(ac.destination);o.start();g.gain.exponentialRampToValueAtTime(.001,ac.currentTime+d);o.stop(ac.currentTime+d)}catch(e){}}

/* Torneo */
let N=0,rounds=[],cur=null,lastMsg='';
document.querySelectorAll('[data-n]').forEach(b=>b.onclick=()=>{N=+b.dataset.n;
  $('names').innerHTML=Array.from({length:N},(_, i)=>`<input type="text" maxlength="10" placeholder="Jugador ${i+1}" value="Jugador ${i+1}">`).join('');show('s-names')});
$('b-start').onclick=()=>{
  const nm=[...document.querySelectorAll('#names input')].map((x,i)=>x.value.trim()||'Jugador '+(i+1));
  for(let i=nm.length-1;i>0;i--){const j=Math.random()*(i+1)|0;[nm[i],nm[j]]=[nm[j],nm[i]]}
  rounds=[];let sz=N;while(sz>1){sz/=2;rounds.push(Array.from({length:sz},()=>({a:null,b:null,sa:null,sb:null,w:null})))}
  rounds[0].forEach((m,i)=>{m.a=nm[i*2];m.b=nm[i*2+1]});lastMsg='';showBracket()};
function nextMatch(){for(const r of rounds)for(const m of r)if(m.a&&m.b&&m.w===null)return m;return null}
function renderBracket(el){
  const T=['Final','Semifinales','Cuartos de final'];
  el.innerHTML=rounds.map((r,ri)=>`<div class="col"><h4>${T[rounds.length-1-ri]}</h4>`+r.map(m=>['a','b'].map(k=>m[k]).length&&`<div class="match">`+['a','b'].map(k=>{
    const st=m.w===null?'':(m.w===m[k]?'win':'lose');
    return `<div class="row ${st}"><span>${m[k]||'—'}</span><b>${m.w===null?'':m['s'+k]} ${st==='win'?'✓':st==='lose'?'✗':''}</b></div>`}).join('')+`</div>`).join('')+`</div>`).join('')}
function showBracket(){
  const nx=nextMatch();
  if(!nx){const f=rounds[rounds.length-1][0];
    $('champ').textContent='🏆 Campeón: '+f.w;
    $('final').textContent=`Resultado final: ${f.a} ${f.sa} - ${f.sb} ${f.b}. ${lastMsg}`;
    renderBracket($('br2'));beep(660,.4,'triangle');show('s-end');return}
  renderBracket($('br'));
  $('msg').textContent=(lastMsg?lastMsg+' · ':'')+`Próximo: ${nx.a} vs ${nx.b}`;
  cur=nx;show('s-bracket')}
$('b-next').onclick=()=>startMatch(cur);

/* Opciones nuevas */
Object.assign(S,{speed:1,stam:true,shape:'rect',bg:'grass',ui:'auto'});
const bind=(id,k,f=v=>v)=>$(id).onchange=e=>{S[k]=f(e.target.type==='checkbox'?e.target.checked:e.target.value);if(k==='ui')applyUI()};
bind('o-spd','speed',parseFloat);bind('o-stam','stam');bind('o-shape','shape');bind('o-bg','bg');bind('o-ui','ui');
function applyUI(){const r=document.documentElement;S.ui==='auto'?r.removeAttribute('data-theme'):r.setAttribute('data-theme',S.ui)}
const SHAPES={
 rect:[[40,30],[860,30],[860,450],[40,450]],
 hex:[[40,170],[150,30],[750,30],[860,170],[860,310],[750,450],[150,450],[40,310]],
 oct:[[130,30],[770,30],[860,120],[860,360],[770,450],[130,450],[40,360],[40,120]],
 dia:[[40,170],[450,30],[860,170],[860,310],[450,450],[40,310]],
 bev:[[90,30],[810,30],[860,80],[860,400],[810,450],[90,450],[40,400],[40,80]]};
const THEMES={
 grass:{o:'#1f5a33',a:'#2f8a4a',b:'#359752',l:'#ffffff'},
 night:{o:'#0a1220',a:'#16352a',b:'#1a3d31',l:'#9fd8c0'},
 light:{o:'#e8eef2',a:'#cfe6d4',b:'#dcefe0',l:'#2d4a3a'},
 ice:{o:'#9ec3dc',a:'#cfe8f7',b:'#e3f3fd',l:'#2a6a96'},
 sand:{o:'#8a6a3a',a:'#e0c48a',b:'#e8d19c',l:'#7a4f1e'},
 neon:{o:'#0b0620',a:'#150a38',b:'#1b0f48',l:'#2cf2ff'}};

/* Juego */
const cv=$('cv'),cx=cv.getContext('2d');
const L=40,R=860,GY1=170,GY2=310,PR=18,BR=10;
let G=null,F=null;const K={};
addEventListener('keydown',e=>{if(G&&['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Enter'].includes(e.code))e.preventDefault();K[e.code]=1});
addEventListener('keyup',e=>K[e.code]=0);
const CTL=[{u:'KeyW',d:'KeyS',l:'KeyA',r:'KeyD',k:'Space',s:'ShiftLeft'},{u:'ArrowUp',d:'ArrowDown',l:'ArrowLeft',r:'ArrowRight',k:'Enter',s:'ShiftRight'}];
const COL=['#e5483d','#2f6fe0'];

function buildField(){
  const P=SHAPES[S.shape],pw=[],bw=[];
  P.forEach((a,i)=>{const b=P[(i+1)%P.length];pw.push([a,b]);
    if(a[0]===b[0]&&(a[0]===L||a[0]===R)){const y1=Math.min(a[1],b[1]),y2=Math.max(a[1],b[1]);
      if(y1<GY1)bw.push([[a[0],y1],[a[0],GY1]]);if(y2>GY2)bw.push([[a[0],GY2],[a[0],y2]])}
    else bw.push([a,b])});
  [[L,10],[R,890]].forEach(([x,d])=>bw.push([[x,GY1],[d,GY1]],[[d,GY1],[d,GY2]],[[d,GY2],[x,GY2]]));
  F={P,pw,bw}}
function wall(o,r,W,bo){for(const[a,b]of W){const dx=b[0]-a[0],dy=b[1]-a[1];
  const t=Math.max(0,Math.min(1,((o.x-a[0])*dx+(o.y-a[1])*dy)/(dx*dx+dy*dy)));
  const px=a[0]+t*dx,py=a[1]+t*dy,ex=o.x-px,ey=o.y-py,d=Math.hypot(ex,ey)||.001;
  if(d<r){const nx=ex/d,ny=ey/d;o.x=px+nx*r;o.y=py+ny*r;const v=o.vx*nx+o.vy*ny;
    if(v<0){o.vx-=(1+bo)*v*nx;o.vy-=(1+bo)*v*ny}}}}
function inPoly(x,y,P){let c=false;for(let i=0,j=P.length-1;i<P.length;j=i++)
  if((P[i][1]>y)!==(P[j][1]>y)&&x<(P[j][0]-P[i][0])*(y-P[i][1])/(P[j][1]-P[i][1])+P[i][0])c=!c;return c}
function spawn(){for(let k=0;k<40;k++){const x=120+Math.random()*660,y=60+Math.random()*360,P=F.P;
  if(inPoly(x,y,P)&&inPoly(x+28,y,P)&&inPoly(x-28,y,P)&&inPoly(x,y+28,P)&&inPoly(x,y-28,P)){G.pk.push({x,y});return}}}

function startMatch(m){
  buildField();
  G={m,sc:[0,0],t:S.time,state:'kick',wait:60,sudden:false,fin:false,msgT:0,pk:[],pt:120,
   p:[{n:m.a,x:0,y:0,vx:0,vy:0,cd:0,st:0},{n:m.b,x:0,y:0,vx:0,vy:0,cd:0,st:0}],b:{x:450,y:240,vx:0,vy:0}};
  reset();$('ov').classList.remove('on');
  $('h-a').textContent=m.a;$('h-b').textContent=m.b;hud();show('s-match');beep(880,.3,'triangle')}
function reset(){const[p,q]=G.p;Object.assign(p,{x:220,y:240,vx:0,vy:0});Object.assign(q,{x:680,y:240,vx:0,vy:0});Object.assign(G.b,{x:450,y:240,vx:0,vy:0});G.pk=[]}
function hud(){$('h-sa').textContent=G.sc[0];$('h-sb').textContent=G.sc[1];
  const t=Math.ceil(G.t);$('h-t').textContent=G.sudden?'GOL DE ORO':Math.floor(t/60)+':'+String(t%60).padStart(2,'0')}
$('b-quit').onclick=()=>{G=null;show('s-menu')};

function input(i){const p=G.p[i],c=CTL[i];
  if(i===1&&S.ai){const b=G.b;let tx=b.x+30,ty=b.y;const db=Math.hypot(b.x-p.x,b.y-p.y);
    if(p.x<b.x+5){tx=b.x+45;ty=b.y+(p.y>b.y?70:-70)}
    if(S.stam&&p.st<25&&G.pk.length&&db>130){const o=G.pk.reduce((m,k)=>Math.hypot(k.x-p.x,k.y-p.y)<Math.hypot(m.x-p.x,m.y-p.y)?k:m);tx=o.x;ty=o.y}
    const dx=tx-p.x,dy=ty-p.y,d=Math.hypot(dx,dy)||1;
    const near=db<PR+BR+8&&b.x<p.x+6;
    return{x:dx/d*(d>6),y:dy/d*(d>6),k:near&&Math.random()<.5,d:p.st>15&&db>140}}
  return{x:(K[c.r]?1:0)-(K[c.l]?1:0),y:(K[c.d]?1:0)-(K[c.u]?1:0),k:!!K[c.k],d:!!K[c.s]}}

function step(){
  if(!G||G.state==='end')return;
  if(G.msgT>0)G.msgT--;
  if(G.wait>0){G.wait--;if(G.wait===0){
    if(G.state==='goal'){if(G.fin){finish();return}reset();G.state='kick';G.wait=45}
    else if(G.state==='kick'){G.state='play';beep(880,.2,'triangle')}}
    return}
  G.t-=1/60;
  if(G.t<=0&&!G.sudden){G.t=0;if(G.sc[0]===G.sc[1]){G.sudden=true;G.msgT=90;beep(400,.4,'sawtooth')}else{finish();return}}
  const b=G.b;
  if(S.stam&&--G.pt<=0){if(G.pk.length<3)spawn();G.pt=240+Math.random()*180}
  G.p.forEach((p,i)=>{const c=input(i);let dx=c.x,dy=c.y;const l=Math.hypot(dx,dy);if(l>1){dx/=l;dy/=l}
    const run=S.stam&&c.d&&p.st>0&&l>0;if(run)p.st=Math.max(0,p.st-.5);p.run=run;
    const a=.38*S.speed*(run?1.7:1);
    p.vx=(p.vx+dx*a)*.9;p.vy=(p.vy+dy*a)*.9;p.x+=p.vx;p.y+=p.vy;wall(p,PR,F.pw,0);
    if(S.stam)for(let k=G.pk.length-1;k>=0;k--){const o=G.pk[k];if(Math.hypot(o.x-p.x,o.y-p.y)<PR+10){G.pk.splice(k,1);p.st=Math.min(100,p.st+35);beep(900,.1,'sine')}}
    p.cd--;p.kick=c.k;
    const ex=b.x-p.x,ey=b.y-p.y,d=Math.hypot(ex,ey)||1;
    if(c.k&&p.cd<=0&&d<PR+BR+8){b.vx=p.vx*.5+ex/d*9.5;b.vy=p.vy*.5+ey/d*9.5;p.cd=15;beep(260,.07)}});
  const[p,q]=G.p;{const ex=q.x-p.x,ey=q.y-p.y,d=Math.hypot(ex,ey)||1;if(d<PR*2){const o=(PR*2-d)/2,nx=ex/d,ny=ey/d;p.x-=nx*o;p.y-=ny*o;q.x+=nx*o;q.y+=ny*o}}
  G.p.forEach(p=>{const ex=b.x-p.x,ey=b.y-p.y,d=Math.hypot(ex,ey)||1;
    if(d<PR+BR){const nx=ex/d,ny=ey/d;b.x=p.x+nx*(PR+BR);b.y=p.y+ny*(PR+BR);
      const rel=(b.vx-p.vx)*nx+(b.vy-p.vy)*ny;if(rel<0){b.vx-=1.5*rel*nx;b.vy-=1.5*rel*ny}}});
  b.vx*=.985;b.vy*=.985;
  for(let s=0;s<2;s++){b.x+=b.vx/2;b.y+=b.vy/2;wall(b,BR,F.bw,.8)}
  if(b.x<L-BR)goal(1);else if(b.x>R+BR)goal(0);
  hud()}
function goal(i){G.sc[i]++;G.state='goal';G.wait=100;G.msgT=100;G.who=G.p[i].n;
  G.fin=G.sudden||G.sc[i]>=S.goals;beep(520,.15);setTimeout(()=>beep(780,.3),150);hud()}
function finish(){
  G.state='end';const m=G.m,[a,b]=G.sc,w=a>b?m.a:m.b;
  $('ov-t').textContent='🏁 Gana '+w;$('ov-s').textContent=`${m.a} ${a} - ${b} ${m.b}`;$('ov').classList.add('on');
  beep(600,.5,'triangle');
  $('b-cont').onclick=()=>{m.sa=a;m.sb=b;m.w=w;const lo=a>b?m.b:m.a;
    for(let r=0;r<rounds.length;r++){const i=rounds[r].indexOf(m);if(i>=0){if(r+1<rounds.length)rounds[r+1][i>>1][i%2?'b':'a']=w;break}}
    lastMsg=`${w} pasa, ${lo} eliminado (${a}-${b})`;G=null;showBracket()}}

function path(P){cx.beginPath();P.forEach(([x,y],i)=>i?cx.lineTo(x,y):cx.moveTo(x,y));cx.closePath()}
function draw(){
  if(!G)return;const b=G.b,T=THEMES[S.bg];
  cx.fillStyle=T.o;cx.fillRect(0,0,900,480);
  cx.save();path(F.P);cx.clip();
  for(let i=0;i<9;i++){cx.fillStyle=i%2?T.a:T.b;cx.fillRect(i*100,0,100,480)}
  cx.strokeStyle=T.l;cx.lineWidth=3;cx.beginPath();cx.moveTo(450,0);cx.lineTo(450,480);cx.stroke();
  cx.beginPath();cx.arc(450,240,60,0,7);cx.stroke();cx.restore();
  cx.strokeStyle=T.l;cx.lineWidth=3;path(F.P);cx.stroke();
  [[L-30,0],[R,0]].forEach(([x])=>{cx.fillStyle='rgba(0,0,0,.35)';cx.fillRect(x,GY1,30,GY2-GY1);cx.strokeRect(x,GY1,30,GY2-GY1)});
  cx.fillStyle=T.l;[[L,GY1],[L,GY2],[R,GY1],[R,GY2]].forEach(([x,y])=>{cx.beginPath();cx.arc(x,y,5,0,7);cx.fill()});
  if(S.stam)G.pk.forEach(o=>{const r=11+Math.sin(performance.now()/180)*2;cx.beginPath();cx.arc(o.x,o.y,r,0,7);cx.fillStyle='#ffd23f';cx.fill();cx.strokeStyle='#8a6a00';cx.lineWidth=2;cx.stroke();
    cx.fillStyle='#5a4300';cx.font='bold 14px system-ui';cx.textAlign='center';cx.fillText('⚡',o.x,o.y+5)});
  G.p.forEach((p,i)=>{cx.beginPath();cx.arc(p.x,p.y,PR,0,7);cx.fillStyle=COL[i];cx.fill();
    cx.lineWidth=p.kick||p.run?5:3;cx.strokeStyle=p.kick?'#fff':p.run?'#ffd23f':'#111';cx.stroke();
    cx.fillStyle='#fff';cx.font='bold 16px system-ui';cx.textAlign='center';cx.fillText(p.n[0].toUpperCase(),p.x,p.y+6);
    cx.font='bold 13px system-ui';cx.lineWidth=3;cx.strokeStyle='rgba(0,0,0,.7)';cx.strokeText(p.n,p.x,p.y-PR-6);cx.fillText(p.n,p.x,p.y-PR-6);
    if(S.stam){cx.fillStyle='rgba(0,0,0,.65)';cx.fillRect(p.x-20,p.y+PR+5,40,6);cx.fillStyle='#ffd23f';cx.fillRect(p.x-19,p.y+PR+6,38*p.st/100,4)}});
  cx.beginPath();cx.arc(b.x,b.y,BR,0,7);cx.fillStyle='#fff';cx.fill();cx.lineWidth=2;cx.strokeStyle='#111';cx.stroke();
  if(G.state==='goal'||G.msgT>0){cx.font='bold 64px system-ui';cx.textAlign='center';cx.lineWidth=6;cx.strokeStyle='#000';
    const t=G.state==='goal'?(G.who?'¡GOL de '+G.who+'!':'¡GOL!'):'¡GOL DE ORO!';cx.strokeText(t,450,250);cx.fillStyle='#ffd23f';cx.fillText(t,450,250)}}

let last=performance.now(),acc=0;
function loop(t){requestAnimationFrame(loop);acc+=Math.min(t-last,100);last=t;
  if(!G){acc=0;return}
  while(acc>=16.667){step();acc-=16.667}draw()}
requestAnimationFrame(loop);
