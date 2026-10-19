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

/* Juego */
const cv=$('cv'),cx=cv.getContext('2d');
const L=40,R=860,TP=30,BT=450,GY1=170,GY2=310,PR=18,BR=10;
let G=null;const K={};
addEventListener('keydown',e=>{if(G&&['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Enter'].includes(e.code))e.preventDefault();K[e.code]=1});
addEventListener('keyup',e=>K[e.code]=0);
const CTL=[{u:'KeyW',d:'KeyS',l:'KeyA',r:'KeyD',k:'Space'},{u:'ArrowUp',d:'ArrowDown',l:'ArrowLeft',r:'ArrowRight',k:'Enter'}];
const COL=['#e5483d','#2f6fe0'];

function startMatch(m){
  G={m,sc:[0,0],t:S.time,state:'kick',wait:60,sudden:false,fin:false,msgT:0,p:[{n:m.a,x:0,y:0,vx:0,vy:0,cd:0},{n:m.b,x:0,y:0,vx:0,vy:0,cd:0}],b:{x:450,y:240,vx:0,vy:0}};
  reset();$('ov').classList.remove('on');
  $('h-a').textContent=m.a;$('h-b').textContent=m.b;hud();show('s-match');beep(880,.3,'triangle')}
function reset(){const[p,q]=G.p;Object.assign(p,{x:220,y:240,vx:0,vy:0});Object.assign(q,{x:680,y:240,vx:0,vy:0});Object.assign(G.b,{x:450,y:240,vx:0,vy:0})}
function hud(){$('h-sa').textContent=G.sc[0];$('h-sb').textContent=G.sc[1];
  const t=Math.ceil(G.t);$('h-t').textContent=G.sudden?'GOL DE ORO':Math.floor(t/60)+':'+String(t%60).padStart(2,'0')}
$('b-quit').onclick=()=>{G=null;show('s-menu')};

function input(i){const p=G.p[i],c=CTL[i];
  if(i===1&&S.ai){const b=G.b;let tx=b.x+30,ty=b.y;if(p.x<b.x+5){tx=b.x+45;ty=b.y+(p.y>b.y?70:-70)}
    const dx=tx-p.x,dy=ty-p.y,d=Math.hypot(dx,dy)||1;
    const near=Math.hypot(b.x-p.x,b.y-p.y)<PR+BR+8&&b.x<p.x+6;
    return{x:dx/d*(d>6),y:dy/d*(d>6),k:near&&Math.random()<.5}}
  return{x:(K[c.r]?1:0)-(K[c.l]?1:0),y:(K[c.d]?1:0)-(K[c.u]?1:0),k:!!K[c.k]}}

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
  G.p.forEach((p,i)=>{const c=input(i);let dx=c.x,dy=c.y;const l=Math.hypot(dx,dy);if(l>1){dx/=l;dy/=l}
    p.vx=(p.vx+dx*.38)*.9;p.vy=(p.vy+dy*.38)*.9;p.x+=p.vx;p.y+=p.vy;
    p.x=Math.max(L+PR,Math.min(R-PR,p.x));p.y=Math.max(TP+PR,Math.min(BT-PR,p.y));
    p.cd--;p.kick=c.k;
    const ex=b.x-p.x,ey=b.y-p.y,d=Math.hypot(ex,ey)||1;
    if(c.k&&p.cd<=0&&d<PR+BR+8){b.vx=p.vx*.5+ex/d*9.5;b.vy=p.vy*.5+ey/d*9.5;p.cd=15;beep(260,.07)}});
  /* jugador contra jugador */
  const[p,q]=G.p;{const ex=q.x-p.x,ey=q.y-p.y,d=Math.hypot(ex,ey)||1;if(d<PR*2){const o=(PR*2-d)/2,nx=ex/d,ny=ey/d;p.x-=nx*o;p.y-=ny*o;q.x+=nx*o;q.y+=ny*o}}
  /* jugador contra balón: empujar, conducir y robar */
  G.p.forEach(p=>{const ex=b.x-p.x,ey=b.y-p.y,d=Math.hypot(ex,ey)||1;
    if(d<PR+BR){const nx=ex/d,ny=ey/d;b.x=p.x+nx*(PR+BR);b.y=p.y+ny*(PR+BR);
      const rel=(b.vx-p.vx)*nx+(b.vy-p.vy)*ny;if(rel<0){b.vx-=1.5*rel*nx;b.vy-=1.5*rel*ny}}});
  b.vx*=.985;b.vy*=.985;b.x+=b.vx;b.y+=b.vy;
  if(b.y-BR<TP){b.y=TP+BR;b.vy*=-.8}if(b.y+BR>BT){b.y=BT-BR;b.vy*=-.8}
  const mouth=b.y>GY1&&b.y<GY2;
  if(b.x-BR<L){if(mouth){if(b.x<L){if(b.y-BR<GY1){b.y=GY1+BR;b.vy*=-.5}if(b.y+BR>GY2){b.y=GY2-BR;b.vy*=-.5}}}else{b.x=L+BR;b.vx*=-.8}}
  if(b.x+BR>R){if(mouth){if(b.x>R){if(b.y-BR<GY1){b.y=GY1+BR;b.vy*=-.5}if(b.y+BR>GY2){b.y=GY2-BR;b.vy*=-.5}}}else{b.x=R-BR;b.vx*=-.8}}
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

function draw(){
  if(!G)return;const b=G.b;
  for(let i=0;i<9;i++){cx.fillStyle=i%2?'#2f8a4a':'#359752';cx.fillRect(i*100,0,100,480)}
  cx.strokeStyle='rgba(255,255,255,.85)';cx.lineWidth=3;
  cx.strokeRect(L,TP,R-L,BT-TP);cx.beginPath();cx.moveTo(450,TP);cx.lineTo(450,BT);cx.stroke();
  cx.beginPath();cx.arc(450,240,60,0,7);cx.stroke();
  cx.fillStyle='rgba(0,0,0,.35)';cx.fillRect(L-30,GY1,30,GY2-GY1);cx.fillRect(R,GY1,30,GY2-GY1);
  cx.strokeStyle='#fff';cx.strokeRect(L-30,GY1,30,GY2-GY1);cx.strokeRect(R,GY1,30,GY2-GY1);
  cx.fillStyle='#fff';[[L,GY1],[L,GY2],[R,GY1],[R,GY2]].forEach(([x,y])=>{cx.beginPath();cx.arc(x,y,5,0,7);cx.fill()});
  G.p.forEach((p,i)=>{cx.beginPath();cx.arc(p.x,p.y,PR,0,7);cx.fillStyle=COL[i];cx.fill();
    cx.lineWidth=p.kick?5:3;cx.strokeStyle=p.kick?'#fff':'#111';cx.stroke();
    cx.fillStyle='#fff';cx.font='bold 16px system-ui';cx.textAlign='center';cx.fillText(p.n[0].toUpperCase(),p.x,p.y+6);
    cx.font='bold 13px system-ui';cx.lineWidth=3;cx.strokeStyle='rgba(0,0,0,.7)';cx.strokeText(p.n,p.x,p.y-PR-6);cx.fillText(p.n,p.x,p.y-PR-6)});
  cx.beginPath();cx.arc(b.x,b.y,BR,0,7);cx.fillStyle='#fff';cx.fill();cx.lineWidth=2;cx.strokeStyle='#111';cx.stroke();
  if(G.state==='goal'||G.msgT>0){cx.font='bold 64px system-ui';cx.textAlign='center';cx.lineWidth=6;cx.strokeStyle='#000';
    const t=G.state==='goal'?(G.who?'¡GOL de '+G.who+'!':'¡GOL!'):'¡GOL DE ORO!';cx.strokeText(t,450,250);cx.fillStyle='#ffd23f';cx.fillText(t,450,250)}}

let last=performance.now(),acc=0;
function loop(t){requestAnimationFrame(loop);acc+=Math.min(t-last,100);last=t;
  if(!G){acc=0;return}
  while(acc>=16.667){step();acc-=16.667}draw()}
requestAnimationFrame(loop);
