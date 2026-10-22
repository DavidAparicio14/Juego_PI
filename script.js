const $=id=>document.getElementById(id);
const S={sound:true,time:180,goals:5,speed:1,stam:true,size:'m',bg:'grass',ui:'auto',diff:'normal',music:true,pu:true}; // speed fijo en 1 (Normal)
const show=id=>document.querySelectorAll('.screen').forEach(e=>e.classList.toggle('active',e.id===id));
document.querySelectorAll('[data-go]').forEach(b=>b.onclick=()=>show(b.dataset.go));
$('b-play').onclick=()=>{MODE=null;show('s-count')};
$('b-modes').onclick=()=>show('s-modes');
$('m-gold').onclick=()=>{MODE='gold';openNames(2)};
$('m-2v2').onclick=()=>{MODE='2v2';openNames(2)};
$('m-ice').onclick=()=>{MODE='ice';openNames(2)};

/* Opciones: los controles son un borrador; S (lo aplicado) solo cambia al pulsar "Aplicar cambios" */
const OPT=[['o-snd','sound'],['o-mus','music'],['o-pu','pu'],['o-time','time'],['o-goals','goals'],['o-stam','stam'],['o-diff','diff'],['o-size','size'],['o-bg','bg'],['o-ui','ui']];
const rd=([id,k])=>{const e=$(id);return e.type==='checkbox'?e.checked:typeof S[k]==='number'?+e.value:e.value};
const wr=([id,k])=>{const e=$(id);if(e.type==='checkbox')e.checked=S[k];else e.value=String(S[k])};
const dirty=()=>OPT.some(o=>rd(o)!==S[o[1]]);
const refresh=()=>{$('b-apply').hidden=!dirty()};
function applyOpts(){OPT.forEach(o=>S[o[1]]=rd(o));applyUI();try{localStorage.setItem('hexball-opts',JSON.stringify(S))}catch(e){}}
function revertOpts(){OPT.forEach(wr);refresh()}
try{const sv=JSON.parse(localStorage.getItem('hexball-opts')||'{}');
  OPT.forEach(([id,k])=>{const v=sv[k],e=$(id);
    if(typeof v===typeof S[k]&&(e.type==='checkbox'||[...(e.options||[])].some(o=>o.value===String(v))))S[k]=v})}catch(e){}
applyUI();revertOpts();
OPT.forEach(([id])=>$(id).onchange=refresh);
$('b-opt').onclick=()=>{revertOpts();$('o-ok').textContent='';show('s-opt')};
$('b-apply').onclick=()=>{applyOpts();refresh();$('o-ok').textContent='✓ Cambios aplicados'};
$('b-optback').onclick=()=>dirty()?$('dlg').classList.add('on'):show('s-menu');
$('d-yes').onclick=()=>{applyOpts();$('dlg').classList.remove('on');show('s-menu')};
$('d-no').onclick=()=>{revertOpts();$('dlg').classList.remove('on');show('s-menu')};
$('dlg').onclick=e=>{if(e.target===$('dlg'))$('dlg').classList.remove('on')};
$('b-again').onclick=()=>{MODE=null;show('s-menu')};
$('b-names-back').onclick=()=>show(MODE?'s-modes':'s-count');

/* Sonido: todo sintetizado con WebAudio (sin archivos) */
let ac,mg,mb,NB,musT=null,amb=null;
function A(){if(!S.sound)return null;try{if(!ac){ac=new(window.AudioContext||window.webkitAudioContext)();mg=ac.createGain();mg.gain.value=.8;mg.connect(ac.destination);
  mb=ac.createGain();mb.gain.value=.32;mb.connect(mg);const n=ac.sampleRate*2;NB=ac.createBuffer(1,n,ac.sampleRate);const d=NB.getChannelData(0);for(let i=0;i<n;i++)d[i]=Math.random()*2-1}
  if(ac.state==='suspended')ac.resume();return ac}catch(e){return null}}
function tone(f,d,t='square',v=.12,w=0,f2,out){const a=A();if(!a)return;const s=a.currentTime+w,o=a.createOscillator(),g=a.createGain();o.type=t;o.frequency.setValueAtTime(f,s);
  if(f2)o.frequency.exponentialRampToValueAtTime(f2,s+d);g.gain.setValueAtTime(v,s);g.gain.exponentialRampToValueAtTime(.001,s+d);o.connect(g);g.connect(out||mg);o.start(s);o.stop(s+d+.02)}
function beep(f,d,t='square',v=.12){tone(f,d,t,v)}
function noise(d,f,v=.2,att=.01,ty='bandpass',w=0,out){const a=A();if(!a)return;const s=a.currentTime+w,n=a.createBufferSource(),fl=a.createBiquadFilter(),g=a.createGain();
  n.buffer=NB;fl.type=ty;fl.frequency.value=f;fl.Q.value=.8;g.gain.setValueAtTime(.0001,s);g.gain.linearRampToValueAtTime(v,s+att);g.gain.exponentialRampToValueAtTime(.001,s+d);
  n.connect(fl);fl.connect(g);g.connect(out||mg);n.start(s,Math.random());n.stop(s+d+.05)}
const cdTick=()=>tone(440,.2,'square',.14);
const goSound=()=>{tone(880,.35,'square',.14);tone(1320,.35,'triangle',.1)};
const sndKick=()=>{noise(.09,300,.3,.003,'lowpass');tone(160,.09,'sine',.25,0,70)};
const sndNitro=()=>noise(.4,1800,.14,.06);
const sndWhoosh=()=>noise(.15,2200,.05,.03);
const cheer=v=>{noise(2.2,900,.3*v,.25);noise(2.6,1700,.14*v,.35)};
function sndGoal(){[220,277,330].forEach(f=>tone(f,1,'sawtooth',.08));[523,659,784,1047].forEach((f,i)=>tone(f,.25,'square',.09,.12*i));cheer(1)}
function sndWin(){[523,659,784,659,784,1047].forEach((f,i)=>tone(f,.3,'square',.1,.15*i));cheer(1)}
function sndPU(ty){if(ty==='ice'){tone(1400,.35,'sine',.12,0,2200);tone(1900,.35,'sine',.1,.09,2800)}
  else if(ty==='stun'){tone(400,.6,'sawtooth',.1,0,120);tone(300,.6,'square',.06,.05,90)}
  else if(ty==='spike'){tone(220,.25,'square',.12,0,70);noise(.2,900,.2,.005)}
  else{noise(.5,3500,.45,.005,'highpass');tone(90,.5,'sawtooth',.2,0,30)}}
const sndSpawn=()=>{tone(660,.12,'triangle',.08);tone(990,.14,'triangle',.08,.1)};
/* Música de fondo (bucle de 4 compases) + murmullo de la afición */
function mus(n,w){const s=n&15,bar=(n>>4)&3,r=[110,87.31,130.81,98][bar],m=bar===0?3:4;
  if(s%4===0)tone(130,.16,'sine',.55,w,40,mb);
  if(s%2===1)noise(.04,7000,.06,.002,'highpass',w,mb);
  if([0,3,6,8,11,14].includes(s))tone(r,.18,'square',.1,w,null,mb);
  if(s%2===0)tone(r*4*2**([0,m,7,12][(s>>1)%4]/12),.14,'triangle',.08,w,null,mb)}
function musicStop(){clearInterval(musT);musT=null;if(amb){try{amb.stop()}catch(e){}amb=null}}
function musicStart(){musicStop();const a=A();if(!a)return;
  if(S.music){let st=0,nx=a.currentTime+.15;const sp=60/136/4;musT=setInterval(()=>{while(nx<a.currentTime+.4){mus(st++,nx-a.currentTime);nx+=sp}},100)}
  const n=a.createBufferSource(),f=a.createBiquadFilter(),g=a.createGain();n.buffer=NB;n.loop=true;f.type='lowpass';f.frequency.value=700;g.gain.value=.03;n.connect(f);f.connect(g);g.connect(mg);n.start();amb=n}

/* Torneo */
let N=0,rounds=[],cur=null,lastMsg='',AIS=new Set(),MODE=null,HUM=0,TEAMS=[[],[]]; // MODE: null = torneo, 'gold' = gol de oro, '2v2' = 2 contra 2 · HUM = nº de humanos · TEAMS = nombres por equipo (2v2)
const isAI=n=>AIS.has(n);
/* Si solo hay 1 humano, siempre juega a la izquierda (rojo) con WASD + Espacio + Shift */
function fixSides(m){if(MODE==='2v2')return;if(HUM===1&&m&&m.a&&m.b&&!isAI(m.b)){[m.a,m.b]=[m.b,m.a]}}
function setSlotAI(r,ai){const inp=r.querySelector('input');if(ai===(r.dataset.ai==='1'))return;
  if(ai)r.dataset.saved=inp.value;
  r.dataset.ai=ai?'1':'0';inp.disabled=ai;inp.value=ai?'IA':(r.dataset.saved||inp.placeholder);
  r.querySelectorAll('.seg button').forEach(x=>x.classList.toggle('on',(x.dataset.t==='ai')===ai))}
function openNames(n){N=n;const t2=MODE==='2v2';
  $('b-start').textContent=MODE?'Empezar partido':'Empezar torneo';
  $('names-t').textContent=t2?'Tu equipo':'Jugadores';
  $('names-s').textContent=t2?'Elige quién juega en tu equipo (rojo). Los rivales son dos IA.':'Edita el nombre o elige que juegue la IA';
  $('names').innerHTML=Array.from({length:N},(_, i)=>`<div class="pl" data-ai="0"><input type="text" maxlength="10" placeholder="Jugador ${i+1}" value="Jugador ${i+1}"><div class="seg"><button type="button" data-t="h" class="on">👤 Jugador</button><button type="button" data-t="ai">🤖 IA</button></div></div>`).join('');
  if(t2)setSlotAI($('names').children[1],true); // por defecto: tú + compañero IA
  show('s-names')}
document.querySelectorAll('[data-n]').forEach(b=>b.onclick=()=>openNames(+b.dataset.n));
$('names').onclick=e=>{const b=e.target.closest('.seg button');if(!b)return;
  setSlotAI(b.closest('.pl'),b.dataset.t==='ai')};
$('b-start').onclick=()=>{
  const ps=[...document.querySelectorAll('#names .pl')].map((r,i)=>({ai:r.dataset.ai==='1',n:r.querySelector('input').value.trim()||'Jugador '+(i+1)}));
  const nIA=ps.filter(p=>p.ai).length;let k=0;ps.forEach(p=>{if(p.ai)p.n=nIA>1?'IA '+(++k):'IA'});
  const seen=new Set();ps.forEach(p=>{const b=p.n;let c=1;while(seen.has(p.n))p.n=b.slice(0,8)+' '+(++c);seen.add(p.n)});
  HUM=ps.filter(p=>!p.ai).length;
  if(MODE==='2v2')ps.push({ai:true,n:'Rival 1'},{ai:true,n:'Rival 2'}); // rivales: siempre IA
  const seen2=new Set();ps.forEach(p=>{const b=p.n;let c=1;while(seen2.has(p.n))p.n=b.slice(0,8)+' '+(++c);seen2.add(p.n)});
  AIS=new Set(ps.filter(p=>p.ai).map(p=>p.n));
  if(MODE==='2v2'){TEAMS=[ps.slice(0,2).map(p=>p.n),ps.slice(2).map(p=>p.n)];
    rounds=[[{a:'Equipo rojo',b:'Equipo azul',sa:null,sb:null,w:null}]];lastMsg='';showBracket();return}
  const nm=ps.map(p=>p.n);
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
  const nx=nextMatch();fixSides(nx);
  if(!nx){const f=rounds[rounds.length-1][0];
    $('end-t').textContent=MODE?'🏆 Partido terminado':'🏆 Torneo terminado';
    $('champ').textContent='🏆 Campeón: '+f.w;
    $('final').textContent=`Resultado final: ${f.a} ${f.sa} - ${f.sb} ${f.b}. ${lastMsg}`;
    renderBracket($('br2'));beep(660,.4,'triangle');show('s-end');return}
  $('br-t').textContent=MODE==='2v2'?'🤝 2 contra 2':MODE==='ice'?'🧊 Campo de hielo':MODE?'⚡ Gol de oro':'Torneo';renderBracket($('br'));
  $('msg').textContent=(lastMsg?lastMsg+' · ':'')+(MODE==='2v2'?`Próximo: ${TEAMS[0].join(' + ')} vs ${TEAMS[1].join(' + ')}`:`Próximo: ${nx.a} vs ${nx.b}`);
  cur=nx;show('s-bracket')}
$('b-next').onclick=()=>startMatch(cur);

function applyUI(){const r=document.documentElement;S.ui==='auto'?r.removeAttribute('data-theme'):r.setAttribute('data-theme',S.ui)}
/* Campo: siempre hexágono. Solo cambia el tamaño (w=ancho, h=alto, g=ancho de la portería) */
const SIZES={s:{w:880,h:540,g:150},m:{w:1100,h:680,g:185},l:{w:1340,h:820,g:215}};
const THEMES={
 grass:{o:'#1f5a33',a:'#2f8a4a',b:'#359752',l:'#ffffff'},
 night:{o:'#0a1220',a:'#16352a',b:'#1a3d31',l:'#9fd8c0'},
 light:{o:'#e8eef2',a:'#cfe6d4',b:'#dcefe0',l:'#2d4a3a'},
 ice:{o:'#9ec3dc',a:'#cfe8f7',b:'#e3f3fd',l:'#2a6a96'},
 sand:{o:'#8a6a3a',a:'#e0c48a',b:'#e8d19c',l:'#7a4f1e'},
 neon:{o:'#0b0620',a:'#150a38',b:'#1b0f48',l:'#2cf2ff'}};

/* Juego */
const cv=$('cv'),cx=cv.getContext('2d');
const PR=24,BR=13,GD=36,PO=5;            // radio jugador, radio balón, profundidad de portería
const PAD_R=17,PAD_CD=600,START_NITRO=33; // radio del pad, recarga (10 s a 60fps), nitro inicial
let L,R,GY1,GY2,CX,CY;               // se calculan en buildField según el tamaño elegido
let G=null,F=null;const K={};
addEventListener('keydown',e=>{if(G&&['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Enter'].includes(e.code))e.preventDefault();K[e.code]=1});
addEventListener('keyup',e=>K[e.code]=0);
const CTL=[{u:'KeyW',d:'KeyS',l:'KeyA',r:'KeyD',k:'Space',s:'ShiftLeft'},{u:'ArrowUp',d:'ArrowDown',l:'ArrowLeft',r:'ArrowRight',k:'Enter',s:'ShiftRight'}];
const COL=['#e5483d','#2f6fe0'],COL2=['#ff8f78','#78aef5']; // COL2: color del 2º jugador de cada equipo (2v2)

function buildField(k=1){ // k = factor de ampliación del campo (2v2: 1.25); la portería crece algo menos
  const z=SIZES[S.size],FW=z.w*k,FH=z.h*k,gw=z.g*(1+(k-1)*.6),MX=GD+70,MY=70,W=FW+2*MX,H=FH+2*MY;
  CX=W/2;CY=H/2;L=CX-FW/2;R=CX+FW/2;GY1=CY-gw/2;GY2=CY+gw/2;
  const T=CY-FH/2,B=CY+FH/2,r=FH*.28;
  /* Hexágono: paredes verticales a los lados (porterías) y vértice arriba y abajo */
  const P=[[CX,T],[R,T+r],[R,B-r],[CX,B],[L,B-r],[L,T+r]],pw=[],bw=[];
  P.forEach((a,i)=>{const b=P[(i+1)%P.length];pw.push([a,b]);
    if(a[0]===b[0]&&(a[0]===L||a[0]===R)){const y1=Math.min(a[1],b[1]),y2=Math.max(a[1],b[1]);
      if(y1<GY1)bw.push([[a[0],y1],[a[0],GY1]]);if(y2>GY2)bw.push([[a[0],GY2],[a[0],y2]])}
    else bw.push([a,b])});
  [[L,L-GD],[R,R+GD]].forEach(([x,d])=>bw.push([[x,GY1],[d,GY1]],[[d,GY1],[d,GY2]],[[d,GY2],[x,GY2]]));
  [[L,GY1],[L,GY2],[R,GY1],[R,GY2]].forEach(q=>{bw.push([q,q,PO]);pw.push([q,q,PO])}); // postes con el tamaño del punto dibujado
  /* Pads de nitro como en Rocket League: 4 en las esquinas + 2 en el centro pegados a la pared (100 cada uno) */
  const pads=[];
  [P[1],P[2],P[4],P[5]].forEach(([x,y])=>{const dx=CX-x,dy=CY-y,d=Math.hypot(dx,dy);pads.push({x:x+dx/d*48,y:y+dy/d*48,amt:100})});
  pads.push({x:CX,y:T+36,amt:100},{x:CX,y:B-36,amt:100});
  F={P,pw,bw,pads,W,H,mr:FH*.13}}
/* Las paredes son las líneas visibles (grosor 3): el borde del balón/jugador toca el borde de la línea.
   Cada segmento puede llevar un 3er valor = grosor/2 (los postes miden 5, igual que el punto dibujado). */
function wall(o,r,W,bo){for(const[a,b,w=1.5]of W){const dx=b[0]-a[0],dy=b[1]-a[1],rw=r+w;
  const t=Math.max(0,Math.min(1,((o.x-a[0])*dx+(o.y-a[1])*dy)/(dx*dx+dy*dy||1)));
  const px=a[0]+t*dx,py=a[1]+t*dy,ex=o.x-px,ey=o.y-py,d=Math.hypot(ex,ey)||.001;
  if(d<rw){const nx=ex/d,ny=ey/d;o.x=px+nx*rw;o.y=py+ny*rw;const v=o.vx*nx+o.vy*ny;
    if(v<0){o.vx-=(1+bo)*v*nx;o.vy-=(1+bo)*v*ny}}}}
function gap(x,y,W){let m=1e9;for(const[a,b,w=1.5]of W){const dx=b[0]-a[0],dy=b[1]-a[1];
  const t=Math.max(0,Math.min(1,((x-a[0])*dx+(y-a[1])*dy)/(dx*dx+dy*dy||1)));m=Math.min(m,Math.hypot(x-a[0]-t*dx,y-a[1]-t*dy)-w)}return m}
function inField(x,y){return inPoly(x,y,F.P)||(y>GY1&&y<GY2&&x>L-GD&&x<R+GD)}
function inPoly(x,y,P){let c=false;for(let i=0,j=P.length-1;i<P.length;j=i++)
  if((P[i][1]>y)!==(P[j][1]>y)&&x<(P[j][0]-P[i][0])*(y-P[i][1])/(P[j][1]-P[i][1])+P[i][0])c=!c;return c}
function startMatch(m){
  fixSides(m);
  buildField(MODE==='2v2'?1.25:1);cv.width=F.W;cv.height=F.H;cv.style.setProperty('--ar',F.W/F.H);
  /* Jugadores: t = equipo (0 izquierda/rojo, 1 derecha/azul), s = puesto dentro del equipo, c = control humano (índice de CTL) o -1 */
  let hc=0;const ps=MODE==='2v2'?TEAMS.flatMap((tm,t)=>tm.map((n,s)=>({n,t,s,c:isAI(n)?-1:hc++}))):[m.a,m.b].map((n,t)=>({n,t,s:0,c:t}));
  ps.forEach(p=>Object.assign(p,{x:0,y:0,vx:0,vy:0,cd:0,st:0,r:PR,rc:0,col:(p.s?COL2:COL)[p.t]}));
  G={ex:[0,0],pu:[],puT:300,fx:[],pm:null,fans:[],m,sc:[0,0],t:S.time,state:'kick',wait:180,go:0,sudden:false,fin:false,msgT:0,pk:[],p:ps,ch:[-1,-1],lt:[null,null],b:{x:CX,y:CY,vx:0,vy:0}};
  if(MODE==='gold'){G.sudden=true;G.t=0} // gol de oro: sin tiempo, el primer gol gana
  G.fans=makeFans();
  const kb=p=>{const c=p.c===0,n=MODE==='2v2'?p.n:(p.t?'Azul':'Rojo');
    const pad=c?'<i></i><kbd>W</kbd><i></i><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd>':'<i></i><kbd>▲</kbd><i></i><kbd>◀</kbd><kbd>▼</kbd><kbd>▶</kbd>';
    return `<div class="kg" style="--c:${p.col}"><b class="who">${n}</b><div class="pad">${pad}</div><div class="ex"><kbd class="wide">${c?'Espacio':'Enter'}</kbd><span>chutar</span><kbd class="wide">⇧ ${c?'Shift izq.':'Shift der.'}</kbd><span>turbo</span></div></div>`};
  const hp=ps.filter(p=>!isAI(p.n)).map(kb);
  if(S.pu)hp.push('<div class="lg">❄️ Hielo: congela al rival 5 s · 💫 Aturdimiento: controles invertidos y sin chutar 5 s · 🌵 Pinchos: el balón se te pega 7 s · 🌩️ Rayo: aturde 1 s y encoge 6 s</div>');
  $('help').innerHTML=hp.join('')||'Partido entre IAs 🤖';
  reset();$('ov').classList.remove('on');
  const nm=t=>MODE==='2v2'?TEAMS[t].join(' + '):(t?m.b:m.a);
  $('h-a').textContent=nm(0);$('h-b').textContent=nm(1);hud();show('s-match');musicStart();cdTick()}
/* Saque inicial (inicio de partido y tras cada gol): posiciones, balón, pads y nitro = 33 para todos */
function reset(){const fw=R-L,fh=F.P[3][1]-F.P[0][1];
  G.p.forEach(p=>{const sg=p.t?1:-1;let x,y;
    if(G.p.length===2){x=CX+sg*fw*.28;y=CY}                       // 1v1: uno a cada lado
    else{x=CX+sg*fw*(p.s?.36:.17);y=CY+(p.s?-sg*.12:sg*.09)*fh}   // 2v2: delantero y defensa escalonados
    Object.assign(p,{x,y,lx:x,ly:y,vx:0,vy:0,st:START_NITRO,run:false,fz:0,sn:0,sh:0,stk:0,gl:0,r:PR,fx:p.t?-1:1,fy:0,rush:isAI(p.n)&&Math.random()<.88?200:0})});
  G.pu=[];G.fx=[];G.puT=300+Math.random()*300|0;
  G.ch=[-1,-1];G.lt=[null,null];
  Object.assign(G.b,{x:CX,y:CY,vx:0,vy:0});G.pk=F.pads.map(o=>({x:o.x,y:o.y,amt:o.amt,cd:0}))}
function hud(){$('h-sa').textContent=G.sc[0];$('h-sb').textContent=G.sc[1];
  const t=Math.ceil(G.t);$('h-t').textContent=G.sudden?'GOL DE ORO':Math.floor(t/60)+':'+String(t%60).padStart(2,'0')}
$('b-quit').onclick=()=>{musicStop();G=null;show('s-menu')};

/* Dificultad de la IA: mv=velocidad de movimiento, think=cada cuántos fotogramas decide, err=imprecisión (px),
   kick=prob. de chutar, dash=usa turbo, bst=va a por pads si tiene menos de este nitro, aim=apunta a la portería, pred=anticipa el balón */
const DIFF={
 easy:{mv:.6,think:30,err:55,kick:.18,dash:0,bst:0,aim:0,pred:0,pw:0},
 normal:{mv:1,think:1,err:0,kick:.5,dash:1,bst:25,aim:0,pred:0,pw:320},
 hard:{mv:1,think:1,err:0,kick:1,dash:1,bst:45,aim:1,pred:7,pw:700}};
/* Roles por equipo: el jugador más cercano al balón es el atacante; su compañero (IA) apoya/defiende.
   Con histéresis (45 px) para que no cambien de rol continuamente. */
function roles(){const b=G.b;for(const t of[0,1]){let best=-1,bd=1e9,cd=1e9;
  G.p.forEach((p,i)=>{if(p.t!==t)return;const d=Math.hypot(b.x-p.x,b.y-p.y);if(d<bd){bd=d;best=i}if(i===G.ch[t])cd=d});
  G.ch[t]=G.ch[t]>=0&&cd<bd+45?G.ch[t]:best}}
function input(i){const p=G.p[i],c=CTL[p.c];
  if(isAI(p.n)){const D=DIFF[S.diff]||DIFF.normal,b=G.b,sg=p.t?1:-1,A=p.ai||(p.ai={t:0,ox:0,oy:0});
    const gx=p.t?L:R,ogx=p.t?R:L,bx=b.x+b.vx*D.pred,by=b.y+b.vy*D.pred,db=Math.hypot(b.x-p.x,b.y-p.y);
    let ux=sg,uy=0;if(D.aim){const dx=bx-gx,dy=by-CY,l=Math.hypot(dx,dy)||1;ux=dx/l;uy=dy/l} // (ux,uy): "detrás del balón" respecto a la portería rival
    if(--A.t<=0){A.t=D.think;A.ox=(Math.random()*2-1)*D.err;A.oy=(Math.random()*2-1)*D.err}
    let tx=bx+ux*40+A.ox,ty=by+uy*40+A.oy;
    if((p.x-bx)*ux+(p.y-by)*uy<5){const s=((p.x-bx)*-uy+(p.y-by)*ux)<0?-1:1;tx=bx+ux*56-uy*90*s;ty=by+uy*56+ux*90*s} // estoy delante: rodear el balón
    if(G.p.length>2&&G.ch[p.t]!==i){tx=bx+(ogx-bx)*.5+A.ox;ty=by+(CY-by)*.35+A.oy} // apoyo: entre el balón y mi portería
    /* Saque: casi siempre va directo a por el balón con nitro hasta que alguien lo toca; después juega libre */
    const rush=p.rush>0&&(G.p.length===2||G.ch[p.t]===i);
    if(p.rush>0){p.rush--;if(G.lt[0]!=null||G.lt[1]!=null||db<p.r+BR+14)p.rush=0}
    const av=G.pk.filter(k=>k.cd<=0);
    if(!rush&&S.stam&&p.st<D.bst&&av.length&&db>130){const o=av.reduce((m,k)=>Math.hypot(k.x-p.x,k.y-p.y)<Math.hypot(m.x-p.x,m.y-p.y)?k:m);tx=o.x;ty=o.y}
    if(!rush&&D.pw&&G.pu.length&&db>110&&!p.stk){const u=G.pu.reduce((m,k)=>Math.hypot(k.x-p.x,k.y-p.y)<Math.hypot(m.x-p.x,m.y-p.y)?k:m);if(Math.hypot(u.x-p.x,u.y-p.y)<D.pw){tx=u.x;ty=u.y}}
    const dx=tx-p.x,dy=ty-p.y,d=Math.hypot(dx,dy)||1;
    const al=D.aim?((b.x-p.x)*-ux+(b.y-p.y)*-uy)/(db||1)>.5:(b.x-p.x)*sg<6;
    const near=db<p.r+BR+8&&al;
    return{x:dx/d*(d>6)*D.mv,y:dy/d*(d>6)*D.mv,k:near&&Math.random()<D.kick,d:!!D.dash&&(rush?p.st>0:p.st>(D.aim?8:15)&&db>(D.aim?110:140))}}
  return{x:(K[c.r]?1:0)-(K[c.l]?1:0),y:(K[c.d]?1:0)-(K[c.u]?1:0),k:!!K[c.k],d:!!K[c.s]}}

/* Habilidades: aparecen al azar en el centro; quien las toca las usa (hielo/aturdimiento/rayo sobre los rivales, pinchos sobre sí mismo) */
const PUN={ice:'❄️ ¡HIELO!',stun:'💫 ¡ATURDIMIENTO!',spike:'🌵 ¡PINCHOS!',bolt:'🌩️ ¡RAYO!'},PUT=['ice','stun','spike','bolt'];
const PUC={ice:'#6cc9f5',stun:'#a96bff',spike:'#8d9aa5',bolt:'#5b3bb5'},PUE={ice:'❄️',stun:'💫',spike:'🌵',bolt:'🌩️'};
const crowd=(t,v)=>{G.ex[t]=Math.min(1,Math.max(G.ex[t],v))};
function givePU(p,ty){const foes=G.p.filter(q=>q.t!==p.t);
  G.pm={t:120,txt:PUN[ty],n:p.n,col:p.col};
  if(ty==='ice')foes.forEach(q=>q.fz=300);
  else if(ty==='stun')foes.forEach(q=>q.sn=300);
  else if(ty==='spike')p.stk=900;
  else foes.forEach(q=>{q.sn=Math.max(q.sn,60);q.sh=360;G.fx.push({q,t:26})});
  sndPU(ty);crowd(p.t,.7);crowd(1-p.t,.3);cheer(.3)}
function powerups(){
  if(S.pu&&--G.puT<=0){G.puT=420+Math.random()*480|0;
    if(G.pu.length<2){const fw=R-L,fh=F.P[3][1]-F.P[0][1];let x,y,k=0;
      do{x=CX+(Math.random()*2-1)*fw*.2;y=CY+(Math.random()*2-1)*fh*.3;k++}while(k<20&&(Math.hypot(x-G.b.x,y-G.b.y)<70||G.p.some(p=>Math.hypot(x-p.x,y-p.y)<70)));
      G.pu.push({x,y,ty:PUT[Math.random()*4|0],life:900,ph:Math.random()*6});sndSpawn()}}
  G.pu=G.pu.filter(u=>{if(--u.life<=0)return false;
    const p=G.p.find(p=>Math.hypot(u.x-p.x,u.y-p.y)<p.r+19);if(!p)return true;givePU(p,u.ty);return false})}
/* Afición: filas de aficionados en la zona exterior del campo (izquierda = equipo rojo, derecha = azul, con algunos mezclados) */
function makeFans(){const a=[],sp=27,sk=['#f1c9a5','#d9a074','#a8734a','#7a4e2d'],hr=['#2b1b10','#5a3a1a','#c9a227','#111','#8a2b1b'];
  for(let y=24,r=0;y<F.H-14;y+=sp,r++)for(let x=22+(r%2)*sp/2;x<F.W-14;x+=sp){
    const jx=x+(Math.random()-.5)*7,jy=y+(Math.random()-.5)*7;
    if(inField(jx,jy)||gap(jx,jy,F.bw)<26)continue;
    const t=Math.random()<.85?(jx<CX?0:1):(jx<CX?1:0);
    a.push({x:jx,y:jy,t,c:Math.random()<.5?COL[t]:COL2[t],sk:sk[Math.random()*4|0],h:hr[Math.random()*5|0],ph:Math.random()*6.28,fl:Math.random()<.14})}
  return a}
function step(){
  if(!G||G.state==='end')return;
  if(G.msgT>0)G.msgT--;
  G.ex[0]=Math.max(0,G.ex[0]-.005);G.ex[1]=Math.max(0,G.ex[1]-.005);
  if(G.pm&&--G.pm.t<=0)G.pm=null;
  G.fx=G.fx.filter(f=>--f.t>0);
  if(G.wait>0){G.wait--;if(G.wait===0){
    if(G.state==='goal'){if(G.fin){finish();return}reset();G.state='kick';G.wait=180;cdTick()}
    else if(G.state==='kick'){G.state='play';G.go=50;goSound()}}
    else if(G.state==='kick'&&G.wait%60===0)cdTick();
    return}
  if(G.go>0)G.go--;
  G.t-=1/60;
  if(G.t<=0&&!G.sudden){G.t=0;if(G.sc[0]===G.sc[1]){G.sudden=true;G.msgT=90;beep(400,.4,'sawtooth')}else{finish();return}}
  const b=G.b,ICE=MODE==='ice';
  G.pk.forEach(o=>{if(o.cd>0)o.cd--});
  if(G.p.length>2)roles();
  powerups();
  G.p.forEach((p,i)=>{let c=input(i);
    if(p.fz>0){p.fz--;c={x:0,y:0,k:false,d:false}}                       // congelado: no se mueve ni chuta
    else if(p.sn>0)c={x:-c.x,y:-c.y,k:false,d:c.d};                       // aturdido: controles invertidos, sin chutar
    if(p.sn>0)p.sn--;if(p.sh>0)p.sh--;if(p.stk>0)p.stk--;if(p.gl>0)p.gl--;
    p.r+=((p.sh>0?PR*.62:PR)-p.r)*.2;
    let dx=c.x,dy=c.y;const l=Math.hypot(dx,dy);if(l>1){dx/=l;dy/=l}
    if(l>0){const hl=Math.hypot(dx,dy);p.fx=dx/hl;p.fy=dy/hl}
    const run=S.stam&&c.d&&p.st>0&&l>0;if(run)p.st=Math.max(0,p.st-.5);
    if(run&&!p.run)sndNitro();else if(run&&++p.rc%10===0)sndWhoosh();
    p.run=run;
    const vm=3.42*S.speed*(run?1.7:1)*(p.sh>0?.6:1);   // velocidad máxima
    if(ICE){p.vx+=(dx*vm-p.vx)*.06;p.vy+=(dy*vm-p.vy)*.06}       // hielo: acelera y frena poco a poco (patina)
    else if(l>0){p.vx+=(dx*vm-p.vx)*.35;p.vy+=(dy*vm-p.vy)*.35}   // normal: respuesta directa
    else p.vx=p.vy=0;                                             // y al soltar la tecla frena de golpe (como HaxBall)
    if(p.fz>0)p.vx=p.vy=0;
    p.x+=p.vx;p.y+=p.vy;wall(p,p.r,F.pw,0);
    if(S.stam)for(const o of G.pk)if(o.cd<=0&&p.st<100&&Math.hypot(o.x-p.x,o.y-p.y)<p.r+PAD_R){o.cd=PAD_CD;p.st=Math.min(100,p.st+o.amt);beep(900,.1,'sine')}
    p.cd--;p.kick=c.k;
    const ex=b.x-p.x,ey=b.y-p.y,d=Math.hypot(ex,ey)||1;
    if(c.k&&p.cd<=0&&d<p.r+BR+8){p.gl=0;b.vx=p.vx*.5+ex/d*9.5;b.vy=p.vy*.5+ey/d*9.5;p.cd=15;G.lt[p.t]=i;sndKick();
      if(Math.abs(b.x-(p.t?L:R))<(R-L)*.3){crowd(p.t,.5);crowd(1-p.t,.35);cheer(.3)}else crowd(p.t,.15)}});
  for(let i=0;i<G.p.length;i++)for(let k=i+1;k<G.p.length;k++){const p=G.p[i],q=G.p[k],ex=q.x-p.x,ey=q.y-p.y,d=Math.hypot(ex,ey)||1,m=p.r+q.r;
    if(d<m){const o=(m-d)/2,nx=ex/d,ny=ey/d;p.x-=nx*o;p.y-=ny*o;q.x+=nx*o;q.y+=ny*o}}
  G.p.forEach(o=>{wall(o,o.r,F.pw,0);if(!inPoly(o.x,o.y,F.P)){o.x=o.lx;o.y=o.ly;o.vx=o.vy=0}else{o.lx=o.x;o.ly=o.y}});
  /* jugador -> balón. Si el balón quedaría fuera de las paredes (apretado contra la línea),
     el que retrocede es el jugador: el balón nunca se saca del campo. */
  G.p.forEach((p,pi)=>{const ex=b.x-p.x,ey=b.y-p.y,d=Math.hypot(ex,ey)||1,rr=p.r+BR;
    if(d<rr){G.lt[p.t]=pi;if(p.stk>0&&p.gl<=0){p.stk=0;p.gl=420;beep(200,.2,'square',.12)} // pinchos: el balón se pega 7 s
      const nx=ex/d,ny=ey/d,qx=p.x+nx*rr,qy=p.y+ny*rr;
      if(inField(qx,qy)&&gap(qx,qy,F.bw)>=BR-.01){b.x=qx;b.y=qy}
      else{p.x=b.x-nx*rr;p.y=b.y-ny*rr;wall(p,p.r,F.pw,0)}
      const rel=(b.vx-p.vx)*nx+(b.vy-p.vy)*ny;if(rel<0){b.vx-=1.5*rel*nx;b.vy-=1.5*rel*ny}}});
  const gp=G.p.find(q=>q.gl>0);
  if(gp){let ax=gp.x+gp.fx*(gp.r+BR),ay=gp.y+gp.fy*(gp.r+BR);
    if(!inField(ax,ay)||gap(ax,ay,F.bw)<BR-.01){ax=gp.x;ay=gp.y}
    b.x=ax;b.y=ay;b.vx=gp.vx;b.vy=gp.vy;G.lt[gp.t]=G.p.indexOf(gp)}
  else{
    const fr=ICE?.996:.985;b.vx*=fr;b.vy*=fr;
    const sp=Math.hypot(b.vx,b.vy);if(sp>18){b.vx*=18/sp;b.vy*=18/sp}
    const ns=Math.max(2,Math.ceil(Math.hypot(b.vx,b.vy)/3)); // subpasos: nunca atraviesa una pared
    for(let s=0;s<ns;s++){const lx=b.x,ly=b.y;b.x+=b.vx/ns;b.y+=b.vy/ns;wall(b,BR,F.bw,.8);
      if(!inField(b.x,b.y)){b.x=lx;b.y=ly;b.vx*=-.4;b.vy*=-.4}}} // red de seguridad: jamás fuera del campo
  /* Gol: el balón entero cruza la línea de gol Y está dentro de la boca de la portería */
  if(b.y>GY1&&b.y<GY2){if(b.x<L-BR-1.5)goal(1);else if(b.x>R+BR+1.5)goal(0)}
  hud()}
function goal(i){G.sc[i]++;G.state='goal';G.wait=100;G.msgT=100;G.who=G.lt[i]!=null?G.p[G.lt[i]].n:(G.p.length===2?G.p[i].n:null);
  G.fin=G.sudden||G.sc[i]>=S.goals;sndGoal();G.ex[i]=1;G.ex[1-i]=Math.max(G.ex[1-i],.2);hud()}
function finish(){
  G.state='end';const m=G.m,[a,b]=G.sc,w=a>b?m.a:m.b;
  $('ov-t').textContent='🏁 Gana '+w;$('ov-s').textContent=`${m.a} ${a} - ${b} ${m.b}`;$('ov').classList.add('on');
  musicStop();sndWin();
  $('b-cont').onclick=()=>{m.sa=a;m.sb=b;m.w=w;const lo=a>b?m.b:m.a;
    for(let r=0;r<rounds.length;r++){const i=rounds[r].indexOf(m);if(i>=0){if(r+1<rounds.length)rounds[r+1][i>>1][i%2?'b':'a']=w;break}}
    lastMsg=`${w} pasa, ${lo} eliminado (${a}-${b})`;G=null;showBracket()}}

function path(P){cx.beginPath();P.forEach(([x,y],i)=>i?cx.lineTo(x,y):cx.moveTo(x,y));cx.closePath()}
function hexPath(x,y,r){cx.beginPath();for(let i=0;i<6;i++){const a=Math.PI/3*i-Math.PI/2,px=x+r*Math.cos(a),py=y+r*Math.sin(a);i?cx.lineTo(px,py):cx.moveTo(px,py)}cx.closePath()}
function spikes(x,y,r,c,rot){cx.beginPath();for(let i=0;i<20;i++){const a=i*Math.PI/10+rot,q=i%2?r+3:r+11;cx.lineTo(x+Math.cos(a)*q,y+Math.sin(a)*q)}cx.closePath();cx.fillStyle=c;cx.fill();cx.strokeStyle='#222';cx.lineWidth=1.5;cx.stroke()}
function drawFans(tm){G.fans.forEach(f=>{const e=G.ex[f.t],up=Math.abs(Math.sin(tm/(280-130*e)+f.ph))*(1.2+e*9),x=f.x,y=f.y-up;
  if(e>.25||f.fl){const w=Math.sin(tm/110+f.ph)*4;cx.strokeStyle=f.c;cx.lineWidth=3;cx.beginPath();cx.moveTo(x-6,y+2);cx.lineTo(x-9+w,y-12);cx.moveTo(x+6,y+2);cx.lineTo(x+9-w,y-12);cx.stroke()}
  if(f.fl){const w=Math.sin(tm/150+f.ph)*3;cx.strokeStyle='#ddd';cx.lineWidth=1.5;cx.beginPath();cx.moveTo(x+11,y+8);cx.lineTo(x+11,y-20);cx.stroke();cx.fillStyle=f.c;cx.beginPath();cx.moveTo(x+11,y-20);cx.lineTo(x+24+w,y-15);cx.lineTo(x+11,y-10);cx.fill()}
  cx.fillStyle=f.c;cx.beginPath();cx.arc(x,y+5,9,0,7);cx.fill();
  cx.fillStyle=f.sk;cx.beginPath();cx.arc(x,y-4,5.5,0,7);cx.fill();
  cx.fillStyle=f.h;cx.beginPath();cx.arc(x,y-5.5,5.5,Math.PI,0);cx.fill();
  if(e>.5){cx.fillStyle='#411';cx.beginPath();cx.arc(x,y-2.5,2,0,7);cx.fill()}})}
function drawPU(tm){G.pu.forEach(u=>{if(u.life<180&&((u.life/8)|0)%2)return;
  const y=u.y+Math.sin(tm/250+u.ph)*3,C=PUC[u.ty];cx.save();cx.shadowColor=C;cx.shadowBlur=24;
  if(u.ty==='spike')spikes(u.x,y,17,'#9aa5ad',tm/1500);
  cx.beginPath();cx.arc(u.x,y,19,0,7);cx.fillStyle=C;cx.fill();cx.shadowBlur=0;cx.strokeStyle='#fff';cx.lineWidth=3;cx.stroke();
  cx.setLineDash([6,6]);cx.lineDashOffset=-tm/40;cx.beginPath();cx.arc(u.x,y,27,0,7);cx.strokeStyle=C;cx.lineWidth=2;cx.stroke();cx.setLineDash([]);
  cx.font='22px system-ui';cx.textAlign='center';cx.fillStyle='#fff';cx.fillText(PUE[u.ty],u.x,y+8);cx.restore()})}
function draw(){
  if(!G)return;const b=G.b,T=MODE==='ice'?THEMES.ice:THEMES[S.bg],W=F.W,H=F.H,tm=performance.now();
  cx.fillStyle=T.o;cx.fillRect(0,0,W,H);cx.fillStyle='rgba(0,0,0,.22)';cx.fillRect(0,0,W,H);
  drawFans(tm);
  cx.save();path(F.P);cx.clip();
  const sw=(R-L)/10;for(let i=0;i<10;i++){cx.fillStyle=i%2?T.a:T.b;cx.fillRect(L+i*sw,0,sw+1,H)}
  cx.strokeStyle=T.l;cx.lineWidth=3;cx.beginPath();cx.moveTo(CX,0);cx.lineTo(CX,H);cx.stroke();
  hexPath(CX,CY,F.mr);cx.stroke();cx.restore();
  cx.strokeStyle=T.l;cx.lineWidth=3;path(F.P);cx.stroke();
  [L-GD,R].forEach(x=>{cx.fillStyle='rgba(0,0,0,.35)';cx.fillRect(x,GY1,GD,GY2-GY1);cx.strokeRect(x,GY1,GD,GY2-GY1)});
  cx.fillStyle=T.l;[[L,GY1],[L,GY2],[R,GY1],[R,GY2]].forEach(([x,y])=>{cx.beginPath();cx.arc(x,y,PO,0,7);cx.fill()});
  /* pads de nitro */
  if(S.stam)G.pk.forEach(o=>{
    if(o.cd>0){cx.beginPath();cx.arc(o.x,o.y,PAD_R,0,7);cx.fillStyle='rgba(0,0,0,.28)';cx.fill();
      cx.beginPath();cx.arc(o.x,o.y,PAD_R+3,-Math.PI/2,-Math.PI/2+Math.PI*2*(1-o.cd/PAD_CD));cx.strokeStyle='rgba(255,210,63,.65)';cx.lineWidth=3;cx.stroke()}
    else{const r=PAD_R+Math.sin(tm/180)*2;cx.beginPath();cx.arc(o.x,o.y,r,0,7);cx.fillStyle='#ffd23f';cx.fill();cx.strokeStyle='#8a6a00';cx.lineWidth=2;cx.stroke();
      cx.fillStyle='#5a4300';cx.font='bold 18px system-ui';cx.textAlign='center';cx.fillText('⚡',o.x,o.y+6.5)}});
  drawPU(tm);
  G.p.forEach(p=>{const lw=p.kick||p.run?5:3,r=p.r;
    if(p.stk>0||p.gl>0)spikes(p.x,p.y,r,p.gl>0?'#ff5a4d':'#9aa5ad',tm/900);
    cx.beginPath();cx.arc(p.x,p.y,r-lw/2,0,7);cx.fillStyle=p.col;cx.fill();
    cx.lineWidth=lw;cx.strokeStyle=p.kick?'#fff':p.run?'#ffd23f':'#111';cx.stroke();
    if(S.stam){const rr=r+5,f=p.st/100;
      cx.lineWidth=4;cx.beginPath();cx.arc(p.x,p.y,rr,0,7);cx.strokeStyle='rgba(0,0,0,.55)';cx.stroke();
      if(f>0){cx.beginPath();cx.arc(p.x,p.y,rr,-Math.PI/2,-Math.PI/2+Math.PI*2*Math.min(1,f));cx.strokeStyle=p.run?'#ff9d2e':'#ffd23f';cx.lineCap='round';cx.stroke();cx.lineCap='butt'}}
    if(p.sh>0){cx.lineWidth=3;cx.strokeStyle=`rgba(255,235,90,${.5+.5*Math.sin(tm/60)})`;cx.beginPath();cx.arc(p.x,p.y,r+10,0,7);cx.stroke()}
    if(p.fz>0){cx.fillStyle='rgba(160,225,255,.7)';cx.beginPath();cx.arc(p.x,p.y,r+4,0,7);cx.fill();cx.strokeStyle='#fff';cx.lineWidth=2.5;cx.stroke();
      cx.beginPath();cx.moveTo(p.x-r*.6,p.y-r*.3);cx.lineTo(p.x,p.y+r*.1);cx.lineTo(p.x+r*.5,p.y-r*.5);cx.moveTo(p.x,p.y+r*.1);cx.lineTo(p.x-r*.2,p.y+r*.7);cx.stroke()}
    cx.textAlign='center';cx.font='bold 17px system-ui';cx.lineWidth=3;cx.strokeStyle='rgba(0,0,0,.7)';
    const lab=p.gl>0?String(Math.ceil(p.gl/60)):S.stam?String(Math.round(p.st)):p.n[0].toUpperCase();
    cx.strokeText(lab,p.x,p.y+6);cx.fillStyle='#fff';cx.fillText(lab,p.x,p.y+6);
    cx.font='bold 14px system-ui';cx.strokeText(p.n,p.x,p.y-r-16);cx.fillText(p.n,p.x,p.y-r-16);
    if(p.fz>0){cx.font='20px system-ui';cx.fillText('❄️',p.x,p.y-r-34)}
    if(p.sn>0){cx.font='bold 18px system-ui';for(let k=0;k<3;k++){const a=tm/170+k*2.09;cx.fillStyle='#ffd23f';cx.strokeStyle='#000';cx.lineWidth=2;
      const sx=p.x+Math.cos(a)*(r+2),sy=p.y-r-14+Math.sin(a)*7;cx.strokeText('★',sx,sy+6);cx.fillText('★',sx,sy+6)}}});
  cx.beginPath();cx.arc(b.x,b.y,BR-1,0,7);cx.fillStyle='#fff';cx.fill();cx.lineWidth=2;cx.strokeStyle='#111';cx.stroke(); // borde exterior = radio BR = hitbox
  G.fx.forEach(f=>{const q=f.q;if(f.t>18){cx.fillStyle=`rgba(255,255,255,${(f.t-18)/8*.5})`;cx.fillRect(0,0,W,H)}
    cx.beginPath();cx.moveTo(q.x+(Math.random()-.5)*20,0);for(let k=1;k<9;k++)cx.lineTo(q.x+(Math.random()-.5)*50,q.y*k/9);cx.lineTo(q.x,q.y);
    cx.lineJoin='round';cx.strokeStyle='#ffe94d';cx.lineWidth=9;cx.stroke();cx.strokeStyle='#fff';cx.lineWidth=3;cx.stroke()});
  if(G.pm){cx.globalAlpha=Math.min(1,G.pm.t/20);cx.textAlign='center';cx.lineWidth=6;cx.strokeStyle='#000';
    cx.font='bold '+Math.round(W/24)+'px system-ui';cx.strokeText(G.pm.txt,CX,F.P[0][1]+80);cx.fillStyle='#fff';cx.fillText(G.pm.txt,CX,F.P[0][1]+80);
    cx.font='bold '+Math.round(W/46)+'px system-ui';cx.strokeText(G.pm.n,CX,F.P[0][1]+80+W/38);cx.fillStyle=G.pm.col;cx.fillText(G.pm.n,CX,F.P[0][1]+80+W/38);cx.globalAlpha=1}
  if(G.state==='kick'){const n=Math.ceil(G.wait/60),f=((G.wait-1)%60+1)/60;
    cx.font='bold '+Math.round(W/6*(.8+.3*f))+'px system-ui';cx.textAlign='center';cx.lineWidth=8;cx.strokeStyle='#000';cx.globalAlpha=.55+.45*f;
    cx.strokeText(n,CX,CY+W/18);cx.fillStyle='#ffd23f';cx.fillText(n,CX,CY+W/18);cx.globalAlpha=1}
  else if(G.go>0){cx.font='bold '+Math.round(W/9)+'px system-ui';cx.textAlign='center';cx.lineWidth=7;cx.strokeStyle='#000';cx.globalAlpha=Math.min(1,G.go/20);
    cx.strokeText('¡YA!',CX,CY+W/28);cx.fillStyle='#7dff9b';cx.fillText('¡YA!',CX,CY+W/28);cx.globalAlpha=1}
  if(G.state==='goal'||G.msgT>0){cx.font='bold '+Math.round(W/14)+'px system-ui';cx.textAlign='center';cx.lineWidth=6;cx.strokeStyle='#000';
    const t=G.state==='goal'?(G.who?'¡GOL de '+G.who+'!':'¡GOL!'):'¡GOL DE ORO!';cx.strokeText(t,CX,CY+10);cx.fillStyle='#ffd23f';cx.fillText(t,CX,CY+10)}}

let last=performance.now(),acc=0;
function loop(t){requestAnimationFrame(loop);acc+=Math.min(t-last,100);last=t;
  if(!G){acc=0;return}
  while(acc>=16.667){step();acc-=16.667}draw()}
requestAnimationFrame(loop);
