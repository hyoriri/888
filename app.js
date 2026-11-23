const $=s=>document.querySelector(s);const catalog=[
{id:'chair',name:'Lounge Chair',ko:'월넛 라운지 체어',w:85,d:85,h:82,material:'월넛 합판 · 가죽',styles:['미드센추리','모던'],desc:'곡선형 등받이와 깊은 좌판으로 휴식 코너를 만드는 라운지 체어.',care:'마른 천으로 닦고 직사광선을 피해주세요.'},
{id:'sofa',name:'Fabric Sofa',ko:'컴팩트 패브릭 소파',w:165,d:85,h:78,material:'오크 · 면 혼방 패브릭',styles:['내추럴','미니멀','코지'],desc:'작은 거실에 맞는 2인용 소파. 밝은 패브릭이 공간을 가볍게 보이게 합니다.',care:'커버 관리 방법을 확인하고 정기적으로 먼지를 제거해주세요.'},
{id:'table',name:'Dining Table',ko:'오크 라운드 테이블',w:110,d:75,h:74,material:'오크 원목',styles:['내추럴','미니멀'],desc:'식사와 작업을 함께 할 수 있는 원목 테이블. 창가 배치를 권장합니다.',care:'물기를 바로 닦고 뜨거운 물건에는 받침을 사용해주세요.'},
{id:'bed',name:'Oak Bed',ko:'오크 침대 프레임',w:120,d:205,h:90,material:'오크 원목 · 린넨',styles:['내추럴','코지'],desc:'차분한 원목과 부드러운 침구를 조합하는 싱글 침대 계획안.',care:'침구를 주기적으로 환기하고 프레임은 건조하게 관리해주세요.'},
{id:'cabinet',name:'Sideboard',ko:'슬랫 수납장',w:120,d:40,h:75,material:'오크 무늬목 · 합판',styles:['미드센추리','모던','내추럴'],desc:'낮고 깊이가 얕아 벽면 수납에 적합합니다. 문 개폐 공간을 확보해주세요.',care:'표면에 장시간 물기가 닿지 않도록 관리해주세요.'},
{id:'shelf',name:'Bookshelf',ko:'오픈 우드 선반',w:80,d:35,h:180,material:'오크 원목',styles:['미니멀','내추럴'],desc:'얕은 깊이의 오픈 선반으로 책과 취향의 오브제를 함께 정리합니다.',care:'무거운 물건은 하단에 두고 벽 고정이 가능한지 확인해주세요.'},
{id:'light',name:'Pendant Light',ko:'레이어 펜던트 조명',w:45,d:45,h:30,material:'도장 알루미늄',styles:['모던','미드센추리','미니멀'],desc:'겹쳐진 갓으로 눈부심을 줄이는 형태의 조명. 설치 높이는 현장에 맞춰 조정해주세요.',care:'전원을 차단한 뒤 부드러운 마른 천으로 닦아주세요.'}];

const initial={w:360,d:400,styles:['내추럴'],saved:[],items:[{key:1,type:'bed',name:'고정 침대',w:120,d:200,x:0,y:0},{key:2,type:'window',name:'창문',w:140,d:10,x:150,y:0},{key:3,type:'door',name:'출입문',w:80,d:20,x:270,y:380}]};let state;try{state=JSON.parse(localStorage.getItem('roomfit-v1'))||initial}catch{state=initial}const fixedNames={bed:'침대',desk:'책상',closet:'옷장',stove:'가스레인지',builtin:'붙박이장',sink:'싱크대',storage:'수납함',window:'창문',door:'출입문',blocked:'사용 불가 공간',column:'기둥'};
if(!state||typeof state!=='object'||!Array.isArray(state.items))state=JSON.parse(JSON.stringify(initial));
state.styles=Array.isArray(state.styles)?state.styles:[];state.saved=Array.isArray(state.saved)?state.saved:[];
state.w=Number.isFinite(+state.w)?Math.max(200,Math.min(1000,+state.w)):360;state.d=Number.isFinite(+state.d)?Math.max(200,Math.min(1000,+state.d)):400;
state.items=state.items.filter(o=>o&&typeof o==='object').map((o,i)=>{const label=fixedNames[o.type];if(label&&(!o.name||o.name===label.slice(2)))o.name=label;if(!o.name)o.name='가구 '+(i+1);o.w=Math.max(5,Math.min(state.w,+o.w||60));o.d=Math.max(5,Math.min(state.d,+o.d||60));o.x=Math.max(0,Math.min(state.w-o.w,+o.x||0));o.y=Math.max(0,Math.min(state.d-o.d,+o.y||0));return o});
const escapeHtml=value=>String(value).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
state.plans=Array.isArray(state.plans)?state.plans:[];state.planName=state.planName||'나의 방 설계';state.activePlanId=state.activePlanId||null;
let profileTab='boards',deletePlanId=null;
let layoutHistory=[],layoutCursor=-1,restoringLayout=false,setupOpen=false,saveOpen=false,resizeKey=null;
let view='home' ,slide=0,paused=false,selected=null,season='가을';const main=$('#main');function persist(){try{localStorage.setItem('roomfit-v1',JSON.stringify(state))}catch{toast('브라우저 저장 공간을 사용할 수 없습니다.');return false}const count=$('#saved-count');if(count)count.textContent=state.plans.length;rememberLayout();updatePlanSaveStatus();return true}function toast(t){$('#toast').textContent=t;$('#toast').classList.add('show');setTimeout(()=>$('#toast').classList.remove('show'),2300)}function enter(target='home'){view=target;setupOpen=target==='studio'; $('#intro').hidden=true;$('#app').hidden=false;render();window.scrollTo(0,0)}$('#enter').onclick=()=>{enter('home');startFitFlow()};$('#menu').onclick=()=>{const open=$('nav').classList.toggle('open');$('#menu').setAttribute('aria-expanded',String(open))};document.querySelectorAll('[data-view]').forEach(b=>b.onclick=()=>go(b.dataset.view));$('.logo').onclick=e=>{e.preventDefault();view='home';$('#app').hidden=true;$('#intro').hidden=false;window.scrollTo(0,0);$('#enter-logo')?.focus?.({preventScroll:true})};function go(v){saveOpen=false;guideCoachStep=null;guideSizePending=false;view=v;$('nav').classList.remove('open');$('#menu').setAttribute('aria-expanded','false');render();window.scrollTo(0,0)}function head(en,title,sub){return `<div class="section-head"><div><span class="eyebrow">${en}</span><h1>${title}</h1><p>${sub}</p></div></div>`}function render(){persist();document.querySelectorAll('nav button').forEach(b=>b.classList.toggle('active',b.dataset.view===view||(view==='fit'&&b.dataset.view==='recommend')));if(view==='home')home();if(view==='studio'){studio();if(!plannerGuideSeen&&!state.activePlanId){plannerGuideSeen=true;queueMicrotask(()=>{if(view==='studio')openRoomGuide('board')})}}if(view==='fit')fitQuestion();if(view==='recommend')recommend();if(view==='catalog')browseFurniture();if(view==='season')seasons();if(view==='mypage'||view==='saved')mypage();bindBackupTools();animateView()}
function home(){main.innerHTML=`<section class="section fit-home"><div class="fit-home-intro"><span class="eyebrow">A SMALL ROOM, A GOOD START</span><h1>하나뿐인 내 방 꾸미기.<br>필요한 가구부터 골라드릴게요.</h1><p>방 크기와 생활 방식만 선택하세요.<br>원룸에 필요한 가구를 추천하고, 내 방에 들어가는 구성을 보여드려요.</p><button type="button" class="primary" id="home-fit-start">내 방에 맞는 가구 추천받기</button><button type="button" class="text-button" id="home-continue">작업 중인 설계 이어하기</button></div><img class="fit-home-image" src="assets/bed-hd.webp" alt="원목 침대와 차분한 원룸 가구"></section><section class="section fit-home-sets"><span class="eyebrow">ESSENTIALS FOR ONE</span><h2>원룸 생활에 필요한 것만.</h2><p>필수 가구는 함께, 악세사리는 선택으로.</p><div>${livingSets.map(x=>`<article><img src="assets/${x.image}-hd.webp" alt=""><h3>${x.name}</h3><p>${x.types.map(t=>livingFurniture[t].name).join(' · ')}</p></article>`).join('')}</div></section>`;$('#home-fit-start').onclick=startFitFlow;$('#home-continue').onclick=()=>{plannerGuideSeen=true;go('studio')}}
function recommend(){if(!fitResult){startFitFlow();return}renderFitResult()}

if(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches)paused=true;
const roomPresets=[{label:'작은 방',w:300,d:450},{label:'컴팩트 원룸',w:350,d:470},{label:'기본 원룸',w:400,d:500},{label:'여유 있는 원룸',w:450,d:600}];
const isBlocked=o=>o.type==='blocked'||o.type==='column';
function fitsBlocked(candidate,key){return !state.items.some(other=>other.key!==key&&(isBlocked(candidate)||isBlocked(other))&&overlap(candidate,other))}
function findFreeSpot(w,d){for(let y=0;y<=state.d-d;y+=10)for(let x=0;x<=state.w-w;x+=10){const area={x,y,w,d};if(!state.items.some(o=>overlap(area,o)))return area}return null}
function resizedRoomItems(items,w,d){
 if(items.some(o=>o.w>w||o.d>d))return null;
 const bounded=items.map(o=>({...o,x:clamp(o.x,0,w-o.w),y:clamp(o.y,0,d-o.d)}));
 const collides=(a,b)=>overlap(a,b)&&((isBlocked(a)||isBlocked(b))||(roomEffects.collision!==false&&collisionRelevant(a)&&collisionRelevant(b)));
 if(!bounded.some((o,i)=>bounded.some((q,j)=>i<j&&collides(o,q))))return bounded;
 const fixed=bounded.filter(o=>o.locked||isBlocked(o));
 if(fixed.some((o,i)=>fixed.some((q,j)=>i<j&&collides(o,q))))return null;
 const movable=bounded.filter(o=>!o.locked&&!isBlocked(o));
 for(const order of [movable,[...movable].sort((a,b)=>b.w*b.d-a.w*a.d)]){
  const placed=fixed.map(o=>({...o}));let failed=false;
  for(const original of order){
   const o={...original};
   if(placed.some(q=>collides(o,q))){
    const xs=new Set([0,w-o.w,o.x]),ys=new Set([0,d-o.d,o.y]);
    for(const q of placed){xs.add(q.x+q.w);xs.add(q.x-o.w);ys.add(q.y+q.d);ys.add(q.y-o.d)}
    const options=[];
    for(const x of xs)for(const y of ys)if(x>=0&&y>=0&&x+o.w<=w&&y+o.d<=d)options.push({x,y});
    options.sort((a,b)=>(a.x-o.x)**2+(a.y-o.y)**2-((b.x-o.x)**2+(b.y-o.y)**2));
    const spot=options.find(pos=>!placed.some(q=>collides({...o,...pos},q)));
    if(!spot){failed=true;break}Object.assign(o,spot);
   }
   placed.push(o);
  }
  if(!failed)return bounded.map(o=>placed.find(q=>q.key===o.key));
 }
 return null;
}
function setRoomSize(w,d){
 if(!Number.isFinite(w)||!Number.isFinite(d)||w<200||d<200||w>1000||d>1000){toast('가로·세로는 200~1000cm로 입력해주세요.');return false}
 const next=resizedRoomItems(state.items,w,d);
 if(!next){toast('현재 가구를 모두 넣을 공간이 부족해요. 가구를 줄이거나 잠금을 해제해주세요.');return false}
 const moved=next.some((o,i)=>o.x!==state.items[i].x||o.y!==state.items[i].y);
 state.w=w;state.d=d;state.items=next;persist();studio();
 if(moved)toast('선택한 방 크기에 맞춰 가구를 빈자리로 옮겼어요.');return true;
}

function addRoomItem(type){const dims={bed:[120,200],desk:[100,60],closet:[120,60],stove:[60,60],builtin:[180,60],sink:[120,60],storage:[60,40],window:[100,10],door:[80,20],blocked:[100,100],column:[40,40]}[type];const w=Math.min(dims[0],state.w),d=Math.min(dims[1],state.d),spot=type==='window'?findWindowSpot(w,d):findFreeSpot(w,d);if(!spot){toast('추가할 빈 공간이 부족합니다. 크기나 배치를 조정해주세요.');return}const item={key:Date.now()+Math.random(),type,name:fixedNames[type],...spot};state.items.push(item);selected=item.key;persist();drawBoard();pulseSelectedItem();return true;}
function studio(){main.innerHTML=`<section class="section planning-page">${head('ROOM PLANNER','내 방 설계','가구를 추가하고 끌어서 내 방에 배치해보세요.')}<details id="room-setup" class="room-setup" ${setupOpen?'open':''}><summary><strong>방 설정</strong><span>${state.w} × ${state.d} cm · ${(state.w*state.d/10000).toFixed(1)} m²</span></summary><div class="setup-content"><div class="panel"><h3>방 크기 선택</h3><div class="room-presets">${roomPresets.map((p,i)=>`<button class="room-preset ${state.w===p.w&&state.d===p.d?'selected':''}" data-preset="${i}" aria-pressed="${state.w===p.w&&state.d===p.d}"><strong>${p.label}</strong><span>${p.w} × ${p.d} cm</span><small>약 ${(p.w*p.d/33058).toFixed(1)}평 · ${(p.w*p.d/10000).toFixed(1)}m²</small></button>`).join('')}</div><p class="notice">대표 크기를 참고한 직사각형 예시입니다. 실제 실내 치수에 맞춰 수정하세요.</p><div class="row"><label class="field">가로 (cm)<input id="room-w" type="number" inputmode="numeric" min="200" max="1000" value="${state.w}"></label><label class="field">세로 (cm)<input id="room-d" type="number" inputmode="numeric" min="200" max="1000" value="${state.d}"></label></div><p id="room-size-status" class="form-feedback" role="status"></p><p id="area">${(state.w*state.d/10000).toFixed(1)} m² · 약 ${(state.w*state.d/33058).toFixed(1)}평</p></div></div><button id="setup-done" class="primary" type="button">적용하고 보드 열기</button></details><div class="studio workflow-studio"><div class="planning-board-area"><h2 tabindex="-1" id="board-title" class="sr-only">나의 설계보드</h2><p id="plan-save-status" class="plan-save-status" role="status"></p><div id="guide-coach" hidden></div><div class="simple-toolbar"><span class="board-view-label">평면 설계보드</span><div class="simple-actions"><button type="button" id="board-guide" class="outline">사용가이드</button><button type="button" id="layout-undo" class="outline">실행 취소</button><div class="save-control"><button type="button" id="save-open" class="outline" aria-controls="save-section" aria-expanded="${saveOpen}">저장</button><div id="save-section" class="save-board-panel" role="group" aria-label="설계보드 저장 옵션" ${saveOpen?'':'hidden'}><div><span class="eyebrow">SAVE YOUR PLAN</span><h3>설계보드 저장</h3><p>저장한 보드는 마이페이지에서 다시 열고 JPG로 저장할 수 있어요.</p></div><label class="field">설계보드 이름<input id="plan-name" maxlength="50" value="${escapeHtml(state.planName)}" placeholder="예: 나의 원룸 배치 A"></label><div class="save-board-actions"><button class="outline" id="save-plan">${state.activePlanId?'변경 내용 저장':'설계보드 저장'}</button>${state.activePlanId?'<button class="outline" id="save-copy">다른 이름으로 저장</button>':''}</div><p id="save-status" role="status"></p><div class="backup-tools"><button type="button" class="text-button" data-backup-export>설계 파일 백업</button><button type="button" class="text-button" data-backup-import>백업 불러오기</button></div></div></div><button type="button" id="add-open" class="primary">+ 가구 추가</button></div><p id="layout-check" role="status" class="layout-check"></p></div><div id="edit" class="selection-tools"></div><div class="board-wrap"><div id="board" class="board" style="aspect-ratio:${state.w}/${state.d}"></div><div class="board-caption"><span>가로 ${state.w} × 세로 ${state.d} cm</span><span id="board-scale-caption">한 칸 50 × 50cm</span></div></div><div id="room-stats" class="room-stats"></div><div class="simple-footer"><details class="board-options"><summary>배치 설정 · 가구 목록</summary><div class="board-option-controls"><label class="snap-option"><input id="collision-toggle" type="checkbox" ${roomEffects.collision!==false?'checked':''}>겹치면 빈자리로 밀기</label><label class="snap-option"><input id="snap-toggle" type="checkbox" ${roomEffects.snap?'checked':''}>10cm 단위 맞춤</label><button type="button" id="layout-redo" class="outline">다시 실행</button></div><div id="board-items" class="board-items" aria-label="설계보드 가구 목록"></div></details></div></div></div></section>`;drawBoard();bindBoardViews();bindWorkflow();$('#snap-toggle').onchange=e=>{roomEffects.snap=e.target.checked;saveEffects();toast(roomEffects.snap?'10cm 단위 맞춤 배치를 켰습니다.':'자유 배치로 바꿨습니다.')};document.querySelectorAll('[data-preset]').forEach(b=>b.onclick=async()=>{const p=roomPresets[+b.dataset.preset];await requestRoomSize(p.w,p.d)});['w','d'].forEach(k=>{const input=$('#room-'+k);input.oninput=()=>{const w=+$('#room-w').value,d=+$('#room-d').value;$('#area').textContent=w>=200&&d>=200&&w<=1000&&d<=1000?(w*d/10000).toFixed(1)+' m² · 약 '+(w*d/33058).toFixed(1)+'평':'가로·세로를 200~1000cm로 입력해주세요.';$('#room-size-status').textContent='적용하고 보드 열기를 누르면 변경돼요.'};input.onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();$('#setup-done').click()}}});document.querySelectorAll('[data-style]').forEach(b=>b.onclick=()=>{let t=b.dataset.style;state.styles=state.styles.includes(t)?state.styles.filter(x=>x!==t):[...state.styles,t];persist();studio()});document.querySelectorAll('[data-add]').forEach(b=>b.onclick=()=>addRoomItem(b.dataset.add));$('#plan-name').oninput=e=>{state.planName=e.target.value;persist()};$('#save-plan').onclick=()=>savePlan(false);if($('#save-copy'))$('#save-copy').onclick=()=>savePlan(true);}
function rulerTicks(size){const step=size>600?200:100;const values=[];for(let n=0;n<size;n+=step)values.push(n);values.push(size);return values}
function rulerMarkup(){return `<div class="ruler-x" aria-hidden="true">${rulerTicks(state.w).map(n=>`<span style="left:${n/state.w*100}%">${n}</span>`).join('')}</div><div class="ruler-y" aria-hidden="true">${rulerTicks(state.d).map(n=>`<span style="top:${n/state.d*100}%">${n}</span>`).join('')}</div><span class="ruler-unit">cm</span>`}
function drawBoard(){
 
 const board=$('#board');
 if(!board)return;
 board.onclick=e=>{if(e.target===board&&selected!==null){selected=null;resizeKey=null;drawBoard()}};
 syncBoardViews(board);
 if(boardView==='side'){drawSideBoard(board);return}
 board.style.height='auto';
 board.style.backgroundSize=(50/state.w*100)+'% '+(50/state.d*100)+'%';
 board.innerHTML=rulerMarkup()+doorGuides()+state.items.map((o,i)=>`<div tabindex="0" role="button" aria-label="${escapeHtml(o.name)} 위치 편집" aria-pressed="${selected===o.key}" class="item ${hasFurnitureArt(o)?'illustrated-item':''} ${isBlocked(o)?'unavailable':''} ${selected===o.key?'active':''}" data-key="${o.key}" data-type="${o.type}" style="left:${o.x/state.w*100}%;top:${o.y/state.d*100}%;width:${o.w/state.w*100}%;height:${o.d/state.d*100}%">${planFurnitureArt(o)}<span class="item-badge">${i+1}</span><span class="item-label">${escapeHtml(o.name)}</span></div>`).join('');
 function select(key){selected=key;board.querySelectorAll('.item').forEach(el=>{const active=+el.dataset.key===selected;el.classList.toggle('active',active);el.setAttribute('aria-pressed',String(active))});drawItemList();editor();updateGrip();showLayoutCheck(state.items.find(o=>o.key===selected))}
 const updateGrip=mountResizeGrip(board,false,(el,o)=>positionTopItem(el,o));
 board.querySelectorAll('.item').forEach(el=>{
  const key=+el.dataset.key;
  el.onclick=()=>select(key);
  el.onkeydown=e=>{
   if(e.key==='Enter'||e.key===' '){e.preventDefault();select(key);return}
  };
  function startDrag(e){
   if(state.items.find(o=>o.key===key)?.locked)return;
   if(e.button!==undefined&&e.button!==0)return;
   select(key);el.classList.add('dragging');const o=state.items.find(x=>x.key===key),rect=board.getBoundingClientRect();
   const point=e.touches?e.touches[0]:e,startX=point.clientX,startY=point.clientY,ox=o.x,oy=o.y,ow=o.w,od=o.d;
   const scaleX=(board.clientWidth||rect.width)/state.w,scaleY=(board.clientHeight||rect.height)/state.d;
   const move=ev=>{const p=ev.touches?ev.touches[0]:ev;if(e.pointerId!==undefined&&ev.pointerId!==e.pointerId)return;if(ev.cancelable)ev.preventDefault();const candidate={...o,w:ow,d:od,x:Math.round(Math.max(0,Math.min(state.w-ow,ox+(p.clientX-startX)/scaleX))),y:Math.round(Math.max(0,Math.min(state.d-od,oy+(p.clientY-startY)/scaleY)))};if(roomEffects.snap){candidate.x=Math.max(0,Math.min(state.w-ow,Math.round(candidate.x/10)*10));candidate.y=Math.max(0,Math.min(state.d-od,Math.round(candidate.y/10)*10))}if(o.type==='window')Object.assign(candidate,snapWindow(candidate));if(o.locked)return;if(!fitsBlocked(candidate,key)){el.classList.add('blocked-move');const feedback=$('#placement-feedback');if(feedback)feedback.textContent='사용 불가 공간과 겹쳐 이동할 수 없어요.';return}el.classList.remove('blocked-move');Object.assign(o,candidate);const feedback=$('#placement-feedback');if(feedback)feedback.textContent=o.name+' · X '+o.x+' / Y '+o.y+' cm';positionTopItem(el,o);updateGrip();showLayoutCheck(o)};
   const finish=()=>{el.classList.remove('blocked-move');el.classList.remove('dragging');if(o.x!==ox||o.y!==oy||o.w!==ow||o.d!==od){pulseSelectedItem();clickTone(true)}const feedback=$('#placement-feedback');if(feedback)feedback.textContent=o.name+' 배치 완료 · X '+o.x+' / Y '+o.y+' cm';['pointermove','touchmove','mousemove'].forEach(t=>window.removeEventListener(t,move));['pointerup','pointercancel','touchend','touchcancel','mouseup','blur'].forEach(t=>window.removeEventListener(t,finish));resolveDrop(o,{...o,x:ox,y:oy,w:ow,d:od});persist();drawBoard();refreshPlanner();showLayoutCheck(o)};
   const moveType=e.type==='touchstart'?'touchmove':e.type==='mousedown'?'mousemove':'pointermove';window.addEventListener(moveType,move,{passive:false});['pointerup','pointercancel','touchend','touchcancel','mouseup','blur'].forEach(t=>window.addEventListener(t,finish));
  }
  if(window.PointerEvent)el.onpointerdown=startDrag;else{el.ontouchstart=startDrag;el.onmousedown=startDrag}
 });drawItemList();editor();refreshPlanner();
}
function drawItemList(){const list=$('#board-items');if(!list)return;list.innerHTML=`<h3>가구·영역 목록 <span>${state.items.length}개</span></h3><p>이름을 누르면 가구 또는 사용 불가 영역을 편집할 수 있어요.</p><div class="board-item-list">${state.items.map((o,i)=>`<button class="board-item-row ${selected===o.key?'selected':''}" data-select-item="${o.key}" aria-pressed="${selected===o.key}"><span class="list-number">${i+1}</span><span class="list-name">${escapeHtml(o.name)}</span><small>${o.w} × ${o.d} cm</small></button>`).join('')}</div>`;list.querySelectorAll('[data-select-item]').forEach(el=>el.onclick=()=>{selected=+el.dataset.selectItem;drawBoard()})}
function editor(){const dimensionsOpen=$('.item-dimensions')?.open===true;const o=state.items.find(x=>x.key===selected);if(!o){resizeKey=null;$('#edit').innerHTML='';return}if(resizeKey!==o.key)resizeKey=null;$('#edit').innerHTML=`<div class="selection-bar"><strong>${escapeHtml(o.name)}</strong><div class="controls"><button type="button" id="rotate">회전</button><button type="button" id="toggle-resize" aria-pressed="${resizeKey===o.key}">크기</button><button type="button" id="duplicate-item">복제</button><button type="button" id="lock-item">${o.locked?'잠금 해제':'잠금'}</button><button type="button" id="remove">삭제</button></div></div>${isBlocked(o)?'<p class="blocked-hint">빗금 영역은 가구를 놓을 수 없는 공간입니다.</p>':''}<details class="item-dimensions" ${dimensionsOpen?'open':''}><summary>정확한 크기 · 위치 (cm)</summary><div class="precise-move" role="group" aria-label="가구 미세 이동"><span>1cm 이동</span>${[[0,-1,'위로'],[-1,0,'왼쪽'],[1,0,'오른쪽'],[0,1,'아래로']].map(([x,y,t])=>`<button type="button" class="outline" data-nudge="${x},${y}" ${o.locked?'disabled':''}>${t}</button>`).join('')}</div><div class="edit-fields">${[['x','왼쪽에서'],['y','위쪽에서'],['w','가로'],['d','세로']].map(([k,t])=>`<label>${t}<input type="number" inputmode="numeric" id="item-${k}" value="${o[k]}" min="${k==='x'||k==='y'?0:5}"></label>`).join('')}</div></details>`;$('#edit').querySelectorAll('[data-nudge]').forEach(b=>b.onclick=()=>{const [x,y]=b.dataset.nudge.split(',').map(Number);nudgeSelected(x,y,1)});function update(candidate){if(o.locked){toast('잠금을 먼저 해제해주세요.');editor();return false}candidate.w=Math.min(candidate.w,state.w);candidate.d=Math.min(candidate.d,state.d);candidate.x=Math.max(0,Math.min(candidate.x,state.w-candidate.w));candidate.y=Math.max(0,Math.min(candidate.y,state.d-candidate.d));if(!fitsBlocked(candidate,o.key)){toast('사용 불가 영역과 가구가 겹칩니다. 위치나 크기를 조정해주세요.');editor();return false}if(!applyCollision(candidate)){toast('이 크기로 놓을 자리가 없어요.');editor();return false}persist();drawBoard();return true}$('#edit').querySelector('.item-dimensions').insertAdjacentHTML('beforeend','<button type="button" class="outline" id="apply-item-dimensions">치수 적용</button><p id="dimension-error" role="status"></p>');$('#apply-item-dimensions').disabled=!!o.locked;$('#apply-item-dimensions').onclick=()=>{const candidate={...o};for(const k of ['x','y','w','d']){const input=$('#item-'+k),n=Number(input.value);if(input.value===''||!Number.isFinite(n)||n<(k==='x'||k==='y'?0:5)){ $('#dimension-error').textContent='위치는 0 이상, 크기는 5cm 이상으로 입력해주세요.';return}candidate[k]=n}if(candidate.w>state.w||candidate.d>state.d||candidate.x+candidate.w>state.w||candidate.y+candidate.d>state.d){$('#dimension-error').textContent='가구가 방 안에 들어오도록 위치와 크기를 입력해주세요.';return}update(candidate)};$('#duplicate-item').onclick=()=>duplicateFurniture(o);$('#lock-item').onclick=()=>{o.locked=!o.locked;persist();drawBoard()};['x','y','w','d'].forEach(k=>$('#item-'+k).disabled=!!o.locked);$('#rotate').disabled=!!o.locked;$('#toggle-resize').disabled=!!o.locked;$('#rotate').onclick=()=>{rotateBoardItem(o);$('#rotate')?.focus?.({preventScroll:true})};$('#toggle-resize').onclick=()=>{resizeKey=resizeKey===o.key?null:o.key;drawBoard();$('#toggle-resize')?.focus?.({preventScroll:true});if(resizeKey===o.key){const status=$('#placement-feedback');if(status)status.textContent='노란 손잡이를 끌어 크기를 바꿔보세요.'}};$('#remove').onclick=()=>{state.items=state.items.filter(x=>x.key!==selected);selected=null;persist();drawBoard()}}
function score(p){let style=state.styles.filter(t=>p.styles.includes(t)).length;let fits=p.w<=state.w&&p.d<=state.d;return (fits?100:0)+style*10}function overlap(a,b){return a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.d&&a.y+a.d>b.y}function place(p){if(p.id==='light'){toast('펜던트 조명은 천장 요소로 배치도에 추가되지 않습니다.');return}const found=fitFurniture(p);if(!found){toast('현재 배치에서 빈 공간이 부족합니다. 고정 가구 위치를 조정해주세요.');return}state.items.push({key:Date.now(),type:p.id,name:p.ko,...found,angle:found.rotated?90:0});selected=state.items.at(-1).key;persist();toast('설계 보드에 추가했습니다.');go('studio');pulseSelectedItem();setTimeout(()=>{const board=$('#board');if(board&&board.scrollIntoView)board.scrollIntoView({block:'center'})},80)}
function cards(list){return `<div class="cards">${list.map(p=>`<article class="card"><div class="card-image"><img src="assets/${p.id}-hd.webp" decoding="async" alt="${p.ko}" loading="lazy"></div><div class="card-title"><h3>${p.name}</h3><span class="tag">${p.id==='light'?'천장에 설치하는 조명':fitFurniture(p)?'내 방에 배치 가능한 가구':'현재 배치에 빈자리 부족'}</span></div><p>${p.ko}</p><p>${p.material}</p><p>W ${p.w} × D ${p.d} × H ${p.h} cm</p><div class="actions"><button class="save ${state.saved.includes(p.id)?'chosen':''}" data-save="${p.id}" aria-pressed="${state.saved.includes(p.id)}" aria-label="${p.ko} ${state.saved.includes(p.id)?'저장 취소':'저장'}">${state.saved.includes(p.id)?'저장됨':'저장'}</button><button data-detail="${p.id}">상세 정보 </button><button data-place="${p.id}">배치도에 추가</button></div></article>`).join('')}</div>`}function bindCards(){bindDetails();document.querySelectorAll('[data-save]').forEach(b=>b.onclick=()=>{let id=b.dataset.save;state.saved=state.saved.includes(id)?state.saved.filter(x=>x!==id):[...state.saved,id];persist();render()});document.querySelectorAll('[data-place]').forEach(b=>b.onclick=()=>place(catalog.find(p=>p.id===b.dataset.place)))}function bindDetails(){document.querySelectorAll('[data-detail]').forEach(b=>b.onclick=()=>detail(b.dataset.detail))}function browseFurniture(){const list=[...catalog].sort((a,b)=>Number(!!fitFurniture(b))-Number(!!fitFurniture(a))||score(b)-score(a));main.innerHTML=`<section class="section">${head('CURATED FOR YOUR ROOM','다양한 가구들을 구경해보세요',`설정한 방 ${state.w} × ${state.d}cm · ${(state.w*state.d/10000).toFixed(1)}m²에서, 가구와 문 열림 공간을 고려해 들어갈 자리를 확인했어요.`)}<button class="outline return-planner" onclick="go('studio')">설계보드로 가기</button>${cards(list)}<div class="banner"><div><h2>내 방에 어울리는 조합을 찾아보세요.</h2><p>가구의 크기와 소재를 비교하고, 마음에 드는 가구는 저장해 나중에 다시 살펴보세요.</p></div></div></section>`;bindCards();}
function saved(){profileTab='furniture';mypage()}
const seasonal={'봄':{en:'A fresh beginning.',img:'table',items:[['라이트 오크','봄의 밝은 자연광에 어울리는 연한 나뭇결입니다. 작은 테이블이나 선반에 적용하고, 화이트 패브릭과 조합해 산뜻한 분위기를 만들어보세요. 물기는 바로 닦아주세요.'],['코튼','겨울의 두툼한 쿠션 커버를 가벼운 코튼으로 바꿔보세요. 아이보리나 연한 파스텔을 사용하면 봄의 부드러운 느낌을 더할 수 있습니다. 세탁 표시를 확인해주세요.'],['라탄 포인트','짜임 사이로 가벼운 느낌을 주는 라탄 바구니를 활용해보세요. 밝은 원목 옆에 배치하면 봄의 자연스러운 분위기와 잘 어울립니다. 먼지는 부드러운 솔로 제거해주세요.']]},'여름':{en:'Light, airy, effortless.',img:'sofa',items:[['린넨','통기성이 좋은 침구와 커버로 가벼운 촉감을 구성하세요. 세탁 수축과 주름에 유의하세요.'],['메시','등받이와 좌판에 공기가 통하는 메시 소재의 의자를 고려해보세요. 오래 앉아 있는 여름 작업 공간에서 두꺼운 패브릭을 줄이는 선택이 됩니다. 오염은 제품 관리법에 맞춰 제거해주세요.'],['도장 금속','가느다란 도장 금속 프레임의 테이블이나 선반으로 여름 공간을 가볍게 구성해보세요. 화이트나 실버 계열을 활용하고, 습기가 닿는 부위는 건조하게 관리해주세요.']]},'가을':{en:'Warm textures, quiet moments.',img:'chair',items:[['월넛','깊은 브라운의 나뭇결로 따뜻한 분위기를 만듭니다. 직사광선과 급격한 습도 변화를 피하세요.'],['가죽','부드러운 광택과 밀도 있는 질감으로 휴식 코너를 구성하세요. 전용 관리법을 확인하세요.'],['울 혼방','쿠션과 블랭킷으로 포근한 촉감을 추가하세요. 세탁 표시를 먼저 확인하세요.']]},'겨울':{en:'A softer place to stay.',img:'bed',items:[['부클레','고리 형태의 입체적인 섬유가 겨울 공간에 포근한 표정을 더합니다. 소파 전체보다 쿠션이나 작은 스툴부터 적용해보세요. 보풀과 틈새 먼지는 제품 관리법에 맞춰 정리해주세요.'],['벨벳','빛에 따라 달라지는 깊은 색감으로 겨울의 아늑한 포인트를 만들어보세요. 버건디나 딥 브라운 쿠션을 아이보리 침구와 조합하고, 눌린 결은 제품 관리법에 따라 정돈해주세요.'],['우드 · 패브릭','원목 침대와 두툼한 침구, 러그를 함께 사용해 겨울의 시각적 온기를 더해보세요. 서로 다른 직물의 질감을 겹쳐 사용하되, 세탁과 환기가 쉬운 구성을 선택해주세요.']]}};
const seasonCopy={
 '봄':{label:'SPRING',title:'봄의 방, 산뜻한 시작.',intro:'밝은 오크와 코튼, 라탄을 중심으로 겨울의 무게감을 덜어내고 가볍고 생기 있는 공간을 계획해보세요.',heading:'밝은 원목과 가벼운 직물',tip:'크림 화이트·라이트 베이지를 바탕으로 세이지 그린을 소량 더해보세요. 두꺼운 블랭킷은 정리하고 코튼 쿠션과 작은 라탄 수납으로 분위기를 바꿔보세요.'},
 '여름':{label:'SUMMER',title:'여름의 방, 가볍고 시원하게.',intro:'린넨·메시·도장 금속을 활용해 통풍과 관리 편의성을 고려하고, 시각적으로도 여유로운 공간을 계획해보세요.',heading:'통기성과 가벼운 프레임',tip:'화이트·라이트 그레이에 옅은 블루를 더해보세요. 두꺼운 러그와 패브릭 소품을 줄이고, 가구 사이에 여유를 두어 창문 주변이 막히지 않도록 배치해보세요.'},
 '가을':{label:'AUTUMN',title:'가을의 방, 따뜻한 질감.',intro:'월넛·가죽·울 혼방을 중심으로 차분하고 포근한 가을 공간을 계획해보세요.',heading:'깊은 나뭇결과 포근한 촉감',tip:'월넛 브라운과 베이지를 바탕으로 테라코타를 더해보세요. 라운지 체어에 울 혼방 블랭킷을 걸고 따뜻한 색감의 조명을 곁들이면 차분한 휴식 코너가 됩니다.'},
 '겨울':{label:'WINTER',title:'겨울의 방, 부드럽게 감싸다.',intro:'부클레·벨벳·두툼한 패브릭을 겹쳐 사용해 포근한 촉감과 깊이 있는 색감을 담은 공간을 계획해보세요.',heading:'겹쳐 쓰는 부드러운 소재',tip:'아이보리·웜 그레이에 딥 브라운이나 버건디를 소량 더해보세요. 침구와 쿠션의 질감을 달리하고 러그와 블랭킷을 함께 사용해 아늑한 분위기를 만들어보세요.'}
};
function seasons(){const s=seasonal[season],copy=seasonCopy[season];main.innerHTML=`<section class="section">${head(copy.label+' / SEASONAL MATERIAL GUIDE',copy.title,copy.intro)}<div class="chips">${Object.keys(seasonal).map(t=>`<button class="chip ${t===season?'selected':''}" data-season="${t}">${t}</button>`).join('')}</div><div class="season-layout"><img class="season-image" src="assets/${s.img}-hd.webp" decoding="async" alt="${season} 추천 소재 가구"><div><span class="eyebrow">${season} MATERIAL EDIT</span><h2>${copy.heading}</h2><p class="eyebrow">${s.en}</p>${s.items.map(([t,d])=>`<div class="material"><h3>${t}</h3><p>${d}</p></div>`).join('')}<div class="material"><h3>${season} 스타일링 팁</h3><p>${copy.tip}</p></div></div></div></section>`;document.querySelectorAll('[data-season]').forEach(b=>b.onclick=()=>{season=b.dataset.season;seasons()})}
function closeDetails(){const dialog=$('#details');if(typeof dialog.close==='function')dialog.close();else dialog.removeAttribute('open');dialog.classList.remove('dialog-fallback')}
function detail(id){const p=catalog.find(x=>x.id===id);$('#detail-body').innerHTML=`<span class="eyebrow">FURNITURE CODEX</span><img src="assets/${p.id}-hd.webp" decoding="async" alt="${p.ko}"><h2>${p.name} / ${p.ko}</h2><p>${p.desc}</p><table><tr><td>소재</td><td>${p.material}</td></tr><tr><td>설계 참고 크기</td><td>${p.w} × ${p.d} × ${p.h} cm</td></tr><tr><td>어울리는 스타일</td><td>${p.styles.join(' · ')}</td></tr><tr><td>관리</td><td>${p.care}</td></tr></table><button class="primary" id="detail-add">배치도에 추가</button>`;if(typeof $('#details').showModal==='function')$('#details').showModal();else{$('#details').setAttribute('open','');$('#details').classList.add('dialog-fallback')}$('#detail-add').onclick=()=>{closeDetails();place(p)}}$('.close').onclick=()=>closeDetails();$('#details').onclick=e=>{if(e.target===$('#details'))closeDetails()};
function snapshotPlan(id){const now=new Date().toISOString(),prior=state.plans.find(p=>p.id===id);return{id,name:(state.planName||'나의 방 설계').trim().slice(0,50),w:state.w,d:state.d,styles:[...state.styles],items:JSON.parse(JSON.stringify(state.items)),accessories:Array.isArray(state.accessories)?[...state.accessories]:[],createdAt:prior?prior.createdAt:now,updatedAt:now}}
function savePlan(asCopy){state.planName=($('#plan-name')?.value||state.planName||'나의 방 설계').trim().slice(0,50)||'나의 방 설계';const previousPlans=state.plans,previousId=state.activePlanId;const id=!asCopy&&state.activePlanId?state.activePlanId:'plan-'+Date.now()+'-'+Math.random().toString(36).slice(2,7);const plan=snapshotPlan(id);state.plans=[plan,...state.plans.filter(p=>p.id!==id)];state.activePlanId=id;if(!persist()){state.plans=previousPlans;state.activePlanId=previousId;return false}toast('마이페이지의 나의 설계보드에 저장했습니다.');studio();$('#save-status').innerHTML='저장 완료 · <button class="text-button" id="view-saved-plan">마이페이지에서 확인</button>';$('#view-saved-plan').onclick=()=>{profileTab='boards';go('mypage')};$('#view-saved-plan').focus({preventScroll:true});return true}
function openPlan(id){const p=state.plans.find(p=>p.id===id);if(!p){toast('저장된 보드를 찾을 수 없습니다.');return}archiveWorkingDraft();state.w=p.w;state.d=p.d;state.styles=[...p.styles];state.items=JSON.parse(JSON.stringify(p.items));state.accessories=Array.isArray(p.accessories)?[...p.accessories]:[];state.planName=p.name;state.activePlanId=p.id;selected=null;resetLayoutHistory();persist();go('studio');toast('보드를 불러왔습니다. 수정 후 변경 내용을 저장하세요.')}
function newPlan(){startFitFlow()}
function miniPlan(plan){const pad=45;return `<svg class="plan-thumbnail" viewBox="${-pad} ${-pad} ${plan.w+pad*2} ${plan.d+pad*2}" role="img" aria-label="${escapeHtml(plan.name)} 배치도"><rect x="${-pad}" y="${-pad}" width="${plan.w+pad*2}" height="${plan.d+pad*2}" fill="#f5f1e9"/><text x="${plan.w/2}" y="-18" text-anchor="middle" font-family="Arial,sans-serif" font-size="14" fill="#665849">${plan.w} cm</text><rect width="${plan.w}" height="${plan.d}" fill="#faf7ef" stroke="#9a8b73" stroke-width="4"/>${rulerTicks(plan.w).map(x=>`<path d="M${x} 0V${plan.d}" stroke="#e7e0d3" stroke-width="1"/>`).join('')}${rulerTicks(plan.d).map(y=>`<path d="M0 ${y}H${plan.w}" stroke="#e7e0d3" stroke-width="1"/>`).join('')}${plan.items.map((o,i)=>`<rect x="${o.x}" y="${o.y}" width="${o.w}" height="${o.d}" fill="${isBlocked(o)?'#d7a39a':o.type==='window'?'#b9d6da':'#dbc39e'}" stroke="${isBlocked(o)?'#9a5748':'#a88961'}" stroke-width="2"/><text x="${o.x+o.w/2}" y="${o.y+o.d/2+4}" text-anchor="middle" font-size="14" font-family="Arial,sans-serif" fill="#332a20">${i+1}</text>`).join('')}<text x="${plan.w/2}" y="${plan.d+28}" text-anchor="middle" font-size="13" font-family="Arial,sans-serif" fill="#665849">${plan.w} × ${plan.d} cm</text></svg>`}
function mypage(){const boards=state.plans,furniture=catalog.filter(p=>state.saved.includes(p.id));main.innerHTML=`<section class="section mypage">${head('MY ROOMFIT','마이페이지','나의 공간 계획과 마음에 드는 가구를 한곳에서 관리하세요.')}<div class="profile-tabs" role="tablist" aria-label="마이페이지 항목"><button role="tab" aria-selected="${profileTab==='boards'}" class="${profileTab==='boards'?'selected':''}" id="tab-boards">나의 설계보드 <span>${boards.length}</span></button><button role="tab" aria-selected="${profileTab==='furniture'}" class="${profileTab==='furniture'?'selected':''}" id="tab-furniture">저장한 가구 <span>${furniture.length}</span></button></div><div class="backup-tools"><button type="button" class="outline" data-backup-export>설계 파일 백업</button><button type="button" class="outline" data-backup-import>백업 불러오기</button></div><p class="notice storage-note">이 브라우저에 저장됩니다. 같은 기기·브라우저에서 다시 확인할 수 있습니다.</p>${profileTab==='boards'?`<div class="profile-section-head"><div><h2>나의 설계보드</h2><p>저장한 배치를 다시 열어 수정하거나 JPG 이미지로 보관하세요.</p></div><button class="primary" id="new-plan">새 설계 시작</button></div>${boards.length?`<div class="saved-plans">${boards.map(p=>`<article class="saved-plan"><button class="plan-preview-button" data-open-plan="${p.id}" aria-label="${escapeHtml(p.name)} 열기">${miniPlan(p)}</button><div class="saved-plan-body"><h3>${escapeHtml(p.name)}</h3><p>${p.w} × ${p.d} cm · ${(p.w*p.d/10000).toFixed(1)}m² · ${p.items.filter(o=>!isBlocked(o)).length}개 가구·구조</p><small>최종 저장 ${new Date(p.updatedAt).toLocaleDateString('ko-KR')}</small><div class="plan-card-actions"><button class="outline" data-open-plan="${p.id}">열기·수정</button><button class="outline" data-jpg-plan="${p.id}">JPG로 저장</button></div><div class="plan-delete-actions">${deletePlanId===p.id?`<span>이 보드를 삭제할까요?</span><button class="delete-confirm" data-confirm-delete="${p.id}">삭제하기</button><button class="text-button" id="cancel-delete">취소</button>`:`<button class="text-button" data-delete-plan="${p.id}">보드 삭제</button>`}</div></div></article>`).join('')}</div>`:'<div class="empty"><h2>저장한 설계보드가 없습니다.</h2><p>내 방 설계에서 배치를 완성한 뒤 설계보드 저장 버튼을 눌러주세요.</p><button class="outline" id="continue-design">현재 설계 이어하기</button></div>'}`:`<div class="profile-section-head"><div><h2>저장한 가구</h2><p>마음에 드는 가구를 비교하고 설계보드에 추가하세요.</p></div><button class="outline" id="more-furniture">가구 추천 보기</button></div>${furniture.length?cards(furniture):'<div class="empty"><h2>아직 저장한 가구가 없습니다.</h2><p>가구 추천에서 저장 버튼을 눌러 취향에 맞는 가구를 모아보세요.</p></div>'}`}</section>`;$('#tab-boards').onclick=()=>{profileTab='boards';deletePlanId=null;mypage()};$('#tab-furniture').onclick=()=>{profileTab='furniture';deletePlanId=null;mypage()};if(profileTab==='boards'){$('#new-plan').onclick=newPlan;if($('#continue-design'))$('#continue-design').onclick=()=>go('studio');document.querySelectorAll('[data-open-plan]').forEach(b=>b.onclick=()=>openPlan(b.dataset.openPlan));document.querySelectorAll('[data-jpg-plan]').forEach(b=>b.onclick=()=>downloadPlanJpg(b.dataset.jpgPlan));document.querySelectorAll('[data-delete-plan]').forEach(b=>b.onclick=()=>{deletePlanId=b.dataset.deletePlan;mypage()});if($('#cancel-delete'))$('#cancel-delete').onclick=()=>{deletePlanId=null;mypage()};document.querySelectorAll('[data-confirm-delete]').forEach(b=>b.onclick=()=>{const id=b.dataset.confirmDelete,prior=state.plans;state.plans=state.plans.filter(p=>p.id!==id);if(!persist()){state.plans=prior;return}if(state.activePlanId===id)state.activePlanId=null;deletePlanId=null;persist();mypage();toast('설계보드를 삭제했습니다.')})}else{bindCards();$('#more-furniture').onclick=()=>go('recommend')}}
function drawPlanCanvas(plan){const canvas=document.createElement('canvas'),scale=Math.min(1680/plan.w,1250/plan.d),bw=plan.w*scale,bh=plan.d*scale,ox=(2000-bw)/2,oy=220,legendTop=oy+bh+110,legendRows=Math.ceil(plan.items.length/2);canvas.width=2000;canvas.height=Math.ceil(legendTop+legendRows*48+110);const ctx=canvas.getContext('2d');if(!ctx)throw Error('Canvas unavailable');ctx.fillStyle='#faf9f6';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.fillStyle='#24231f';ctx.font='bold 44px Arial,sans-serif';ctx.fillText('ROOMFIT',100,80);ctx.font='28px Arial,sans-serif';ctx.fillText(plan.name,100,135,1800);ctx.fillStyle='#756956';ctx.font='22px Arial,sans-serif';ctx.fillText(`${plan.w} × ${plan.d} cm · ${(plan.w*plan.d/10000).toFixed(1)} m² · ${plan.styles.join(' / ')}`,100,175);ctx.fillStyle='#f6f1e6';ctx.fillRect(ox,oy,bw,bh);ctx.lineWidth=1;ctx.strokeStyle='#d9d0c0';for(let x=0;x<=plan.w;x+=50){ctx.beginPath();ctx.moveTo(ox+x*scale,oy);ctx.lineTo(ox+x*scale,oy+bh);ctx.stroke()}for(let y=0;y<=plan.d;y+=50){ctx.beginPath();ctx.moveTo(ox,oy+y*scale);ctx.lineTo(ox+bw,oy+y*scale);ctx.stroke()}ctx.font='18px Arial,sans-serif';ctx.fillStyle='#6c5c48';ctx.textAlign='center';rulerTicks(plan.w).forEach(x=>ctx.fillText(String(x),ox+x*scale,oy-18));ctx.textAlign='right';rulerTicks(plan.d).forEach(y=>ctx.fillText(String(y),ox-16,oy+y*scale+6));ctx.textAlign='left';ctx.lineWidth=4;ctx.strokeStyle='#9f8f76';ctx.strokeRect(ox,oy,bw,bh);plan.items.filter(o=>o.type==='door').forEach(o=>{const a=doorClearance(o,plan);ctx.fillStyle='#f9e6c9';ctx.fillRect(ox+a.x*scale,oy+a.y*scale,a.w*scale,a.d*scale);ctx.save();ctx.strokeStyle='#b88950';ctx.setLineDash([8,6]);ctx.strokeRect(ox+a.x*scale,oy+a.y*scale,a.w*scale,a.d*scale);ctx.restore()});plan.items.forEach((o,i)=>{const x=ox+o.x*scale,y=oy+o.y*scale,w=o.w*scale,h=o.d*scale;ctx.fillStyle=isBlocked(o)?'#e2b6ac':o.type==='window'?'#c6dfe1':'#ddc5a2';ctx.fillRect(x,y,w,h);ctx.strokeStyle=isBlocked(o)?'#a86655':'#a68a64';ctx.lineWidth=2;ctx.strokeRect(x,y,w,h);if(isBlocked(o)){ctx.save();ctx.beginPath();ctx.rect(x,y,w,h);ctx.clip();ctx.strokeStyle='#b87f6c';ctx.lineWidth=2;for(let d=-h;d<w;d+=18){ctx.beginPath();ctx.moveTo(x+d,y);ctx.lineTo(x+d+h,y+h);ctx.stroke()}ctx.restore()}paintExportFurniture(ctx,o,x,y,w,h);if(w>30&&h>24){const num=String(i+1);ctx.font='bold 20px Arial,sans-serif';ctx.fillStyle='#fffdf6';ctx.fillRect(x+4,y+4,30,26);ctx.fillStyle='#342b20';ctx.fillText(num,x+10,y+24)}if(w>100&&h>50){ctx.font='18px Arial,sans-serif';const label=o.name;const textWidth=ctx.measureText(label).width;if(textWidth<w-12){ctx.fillStyle='#fffdf6';ctx.fillRect(x+(w-textWidth)/2-4,y+h/2-15,textWidth+8,26);ctx.fillStyle='#342b20';ctx.textAlign='center';ctx.fillText(label,x+w/2,y+h/2+4);ctx.textAlign='left'}}});ctx.fillStyle='#6c5c48';ctx.font='20px Arial,sans-serif';ctx.fillText('단위 cm · 그리드 한 칸 50 × 50 cm · 빗금은 사용 불가 공간',100,oy+bh+62);plan.items.forEach((o,i)=>{const x=100+(i%2)*920,y=legendTop+Math.floor(i/2)*48;ctx.fillStyle=isBlocked(o)?'#a86655':'#6d563c';ctx.fillRect(x,y-24,34,32);ctx.font='18px Arial,sans-serif';ctx.fillStyle='#fff';ctx.fillText(String(i+1),x+8,y-2);ctx.fillStyle='#332b22';ctx.font='21px Arial,sans-serif';ctx.fillText(`${o.name}  ·  ${o.w} × ${o.d} cm`,x+48,y,850)});if(plan.accessories?.length){ctx.fillStyle='#756956';ctx.font='20px Arial,sans-serif';ctx.fillText('추가 옵션 · '+plan.accessories.map(id=>roomAccessories.find(a=>a.id===id)?.name||id).join(' · '),100,canvas.height-40,1800)}return canvas}
async function downloadPlanJpg(id){const plan=state.plans.find(p=>p.id===id);if(!plan)return;try{if(document.fonts&&document.fonts.ready)await document.fonts.ready;const canvas=drawPlanCanvas(plan);const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/jpeg',.94));if(!blob)throw Error('JPG conversion failed');const url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download=(plan.name.replace(/[\\/:*?"<>|]/g,'_')||'ROOMFIT')+'.jpg';document.body.appendChild(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);toast('저장된 설계보드를 JPG로 저장했습니다.')}catch{toast('JPG 저장을 완료하지 못했습니다. 브라우저에서 다시 시도해주세요.')}}
persist();

function saveHomeFurniture(id){if(state.saved.includes(id)){toast('이미 저장한 가구입니다. 마이페이지에서 확인하세요.');return false}const previous=[...state.saved];state.saved.push(id);if(!persist()){state.saved=previous;return false}home();toast('마이페이지의 저장한 가구에 보관했습니다.');return true}

let roomEffects={snap:true};try{const saved=JSON.parse(localStorage.getItem('roomfit-effects-v1'));if(saved&&typeof saved==='object'){roomEffects.collision=saved.collision!==false;roomEffects.snap=saved.snap!==false}}catch{}
function saveEffects(){try{localStorage.setItem('roomfit-effects-v1',JSON.stringify(roomEffects))}catch{}}
function motionReduced(){return typeof window.matchMedia==='function'&&window.matchMedia('(prefers-reduced-motion: reduce)').matches}
function animateView(){if(motionReduced()||!main.animate)return;main.animate([{opacity:.35,transform:'translateY(6px)'},{opacity:1,transform:'translateY(0)'}],{duration:240,easing:'ease-out'})}
function pulseSelectedItem(){if(motionReduced())return;const el=document.querySelector('#board .item.active');if(el&&el.animate)el.animate([{boxShadow:'0 0 0 0 rgba(150,117,70,.35)'},{boxShadow:'0 0 0 12px rgba(150,117,70,0)'}],{duration:400,easing:'ease-out'})}

const spriteTypes=new Set(['bed','sofa','shelf','table','chair','plant','cabinet','light']);
const spriteURL=type=>'assets/pixel/sprite-'+type+'.svg';
const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
let boardView='top';
function bindBoardViews(){boardView='top'}
function syncBoardViews(board){
 boardView='top';board.classList.remove('side-board');
 board.style.aspectRatio=state.w+'/'+state.d;
 board.style.setProperty?.('--room-ratio',String(state.w/state.d));
 const caption=$('#board-scale-caption');if(caption)caption.textContent='한 칸 50 × 50cm';
}
function dragSprite(el,scene,onMove,onEnd,onKey){
 let active=null;
 el.onpointerdown=e=>{
  if(e.button!==0||active)return;
  active={id:e.pointerId,x:e.clientX,y:e.clientY,moved:false};
  el.setPointerCapture(e.pointerId);
 };
 el.onpointermove=e=>{
  if(!active||e.pointerId!==active.id)return;
  const dx=e.clientX-active.x,dy=e.clientY-active.y;
  if(!active.moved&&Math.hypot(dx,dy)<3)return;
  active.moved=true;
  const rect=scene.getBoundingClientRect();
  if(rect.width&&rect.height)onMove(dx/rect.width,dy/rect.height,false);
 };
 const finish=e=>{
  if(!active||e.pointerId!==active.id)return;
  const moved=active.moved;
  active=null;
  onEnd(moved);
 };
 el.onpointerup=finish;el.onpointercancel=finish;el.onlostpointercapture=finish;
 el.onkeydown=e=>{
  const delta={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]}[e.key];
  if(!delta)return;
  e.preventDefault();onKey(...delta);
 };
}
const introDefaults=[
 ['bed','침대',22,82,56,33],['sofa','소파',92,83,48,31],['shelf','책장',166,79,29,40],
 ['table','테이블',79,110,48,31],['chair','의자',145,89,35,32],
 ['plant','오른쪽 화분',197,93,9,20],['plant','왼쪽 화분',12,88,9,20]
];
function introPositions(){
 try{
  const saved=JSON.parse(localStorage.getItem('roomfit-intro-v1'));
  if(Array.isArray(saved))return saved;
 }catch{}
 return [];
}
function mountIntro(){
 const scene=$('#intro-stage');
 if(!scene||typeof document.createElement!=='function')return;
 const feedback=$('#intro-feedback');
 const saved=introPositions();
 const items=introDefaults.map(([type,name,x,y,w,h],i)=>({
  type,name,w,h,x:Number.isFinite(saved[i]?.x)?clamp(saved[i].x,0,224-w):x,
  y:Number.isFinite(saved[i]?.y)?clamp(saved[i].y,76,116):y
 }));
 function saveIntro(){try{localStorage.setItem('roomfit-intro-v1',JSON.stringify(items.map(({x,y})=>({x,y}))))}catch{}}
 function position(el,o){el.style.left=o.x/224*100+'%';el.style.top=o.y/116*100+'%';el.style.zIndex=Math.round(o.y)}
 items.forEach((o,i)=>{
  const el=document.createElement('button');el.type='button';el.className='intro-sprite '+o.type;
  el.setAttribute('aria-label',o.name+' 이동');el.title=o.name;el.style.width=o.w/224*100+'%';el.style.height=o.h/116*100+'%';
  const img=document.createElement('img');img.src=spriteURL(o.type);img.alt='';img.draggable=false;el.append(img);scene.append(el);position(el,o);
  let start=null,lastDrop=-Infinity;
  function move(dx,dy){o.x=clamp(Math.round(dx),0,224-o.w);o.y=clamp(Math.round(dy),76,116);position(el,o)}
  dragSprite(el,scene,(dx,dy)=>{start??={x:o.x,y:o.y};move(start.x+224*dx,start.y+116*dy);el.classList.add('sprite-moving')},moved=>{
   start=null;el.classList.remove('sprite-moving');
   if(moved){lastDrop=Date.now();saveIntro();clickTone(true);feedback.textContent=o.name+' 배치 완료'}
  },(dx,dy)=>{move(o.x+dx*3,o.y+dy*3);saveIntro();clickTone(true);feedback.textContent=o.name+' 위치 이동'});
  el.onclick=()=>{if(Date.now()-lastDrop>300)feedback.textContent=o.name+' 선택 · 끌거나 방향키로 이동하세요.'};
  o.reset=()=>{o.x=introDefaults[i][2];o.y=introDefaults[i][3];position(el,o)};
 });
 $('#intro-reset').onclick=()=>{items.forEach(o=>o.reset());saveIntro();feedback.textContent='처음 배치로 되돌렸어요.'};
}
function drawSideBoard(board){
 board.style.backgroundSize='';
 const floorStart=59,floorDepth=34;
 const yScale=floorDepth/100;
 board.innerHTML='<div class="side-floor" aria-hidden="true"></div>'+state.items.map((o,i)=>{
  const art=sideFurnitureArt(o);
  return `<button type="button" class="side-item" data-side-key="${o.key}" data-type="${escapeHtml(o.type)}" aria-label="${escapeHtml(o.name)} 위치 편집" aria-pressed="${selected===o.key}">${art}<span class="side-label">${i+1} · ${escapeHtml(o.name)}</span></button>`;
 }).join('');
 function position(el,o){
  const window=o.type==='window';
  const y=window?windowBottom(o):floorStart+(o.y+o.d/2)/state.d*floorDepth;
  const defaultHeight={bed:90,sofa:78,desk:74,closet:180,builtin:180,sink:90,storage:55,window:35,door:195,blocked:15,column:210,stove:85};
  const h=o.h||catalog.find(p=>p.id===o.type)?.h||defaultHeight[o.type]||72;
  const height=window?windowHeight(o)*wallScale:clamp(h/state.w*155,7,53);
  el.style.left=o.x/state.w*100+'%';el.style.top=y+'%';el.style.width=o.w/state.w*100+'%';el.style.height=height+'%';
  el.style.zIndex=(window?20:Math.round(y))+(selected===o.key?100:0);
 }
 const updateGrip=mountResizeGrip(board,true,position);
 function select(o){
  selected=o.key;
  board.querySelectorAll('[data-side-key]').forEach(el=>{
   el.setAttribute('aria-pressed',String(+el.dataset.sideKey===selected));
   const item=state.items.find(x=>x.key===+el.dataset.sideKey);if(item)position(el,item);
  });
  drawItemList();editor();updateGrip();showLayoutCheck(o);
 }
 board.querySelectorAll('[data-side-key]').forEach(el=>{
  const o=state.items.find(x=>x.key===+el.dataset.sideKey);if(!o)return;
  position(el,o);el.onclick=()=>select(o);
  let start=null;
  const feedback=()=>$('#placement-feedback');
  function move(x,y,step,keepX=false,keepY=false,sill=null){
   const snap=v=>Math.round(v/step)*step;
   const c={...o,x:clamp(keepX?x:snap(x),0,state.w-o.w),y:clamp(keepY?y:snap(y),0,state.d-o.d)};
   if(sill!==null)c.sill=clamp(keepY?sill:snap(sill),0,wallHeight-windowHeight(o));
   if(!fitsBlocked(c,o.key)){el.classList.add('invalid');if(feedback())feedback().textContent='사용 불가 공간과 겹쳐 이동할 수 없어요.';return false}
   el.classList.remove('invalid');
   const changed=c.x!==o.x||c.y!==o.y||(o.type==='window'&&c.sill!==windowSill(o));
   Object.assign(o,c);position(el,o);updateGrip();showLayoutCheck(o);
   if(feedback())feedback().textContent=o.type==='window'?'창문 · 바닥에서 '+windowSill(o)+' cm':o.name+' · X '+o.x+' / Y '+o.y+' cm';
   return changed;
  }
  function commit(){persist();drawItemList();editor();refreshPlanner();updateRoomStats();clickTone(true);if(feedback())feedback().textContent=o.type==='window'?'창문 배치 완료 · 바닥에서 '+windowSill(o)+' cm':o.name+' 배치 완료 · X '+o.x+' / Y '+o.y+' cm'}
  dragSprite(el,board,(dx,dy)=>{
   if(o.locked)return;
   start??={x:o.x,y:o.y,sill:windowSill(o)};select(o);el.classList.add('sprite-moving');
   const step=roomEffects.snap?10:1;
   if(o.type==='window')move(start.x+dx*state.w,start.y,step,dx===0,dy===0,start.sill-dy*100/wallScale);
   else move(start.x+dx*state.w,start.y+dy*state.d/yScale,step,dx===0,dy===0);
  },moved=>{
   el.classList.remove('sprite-moving','invalid');
   if(moved&&start&&(o.x!==start.x||o.y!==start.y||(o.type==='window'&&windowSill(o)!==start.sill))){resolveDrop(o,{...o,...start});commit();drawBoard()}
   start=null;
  },(dx,dy)=>{
   if(o.locked)return;select(o);const step=roomEffects.snap?10:1,before={...o};
   const moved=o.type==='window'?move(o.x+dx*step,o.y,step,dx===0,dy===0,windowSill(o)-dy*step):move(o.x+dx*step,o.y+dy*step,step,dx===0,dy===0);
   if(moved){resolveDrop(o,before);commit();drawBoard()}
  });
 });
 drawItemList();editor();refreshPlanner();
}
let clickSound=true,audioContext=null,lastTone=-Infinity;
try{clickSound=localStorage.getItem('roomfit-click-v1')!=='off'}catch{}
function clickTone(placement=false){
 if(!clickSound)return;
 try{
  const Audio=window.AudioContext||window.webkitAudioContext;if(!Audio)return;
  const context=audioContext??=new Audio();
  const play=()=>{
   if(!clickSound||context.state!=='running')return;
   const t=context.currentTime;if(t-lastTone<.025)return;lastTone=t;
   const gain=context.createGain(),a=context.createOscillator(),b=context.createOscillator();
   a.type='sine';b.type='triangle';a.frequency.value=placement?250:410;b.frequency.value=placement?730:1110;
   gain.gain.setValueAtTime(.0001,t);gain.gain.exponentialRampToValueAtTime(placement?.072:.052,t+.004);
   gain.gain.exponentialRampToValueAtTime(.0001,t+.075);
   a.connect(gain);b.connect(gain);gain.connect(context.destination);
   a.start(t);b.start(t);a.stop(t+.08);b.stop(t+.06);
   a.onended=()=>{a.disconnect();b.disconnect();gain.disconnect()};
  };
  if(context.state==='running')play();else context.resume().then(play).catch(()=>{});
 }catch{}
}
function syncSound(){
 document.querySelectorAll('.sound-control').forEach(button=>{
  button.setAttribute('aria-pressed',String(clickSound));button.textContent=clickSound?'소리 켬':'소리 끔';
 });
}
if($('#enter-logo'))$('#enter-logo').onclick=()=>enter('home');
document.querySelectorAll('.sound-control').forEach(button=>button.onclick=()=>{
 clickSound=!clickSound;
 try{localStorage.setItem('roomfit-click-v1',clickSound?'on':'off')}catch{}
 syncSound();if(clickSound)clickTone();
});
if(document.addEventListener)document.addEventListener('click',e=>{
 const target=e.target.closest?.('button,a[href],input[type="checkbox"],[role="button"]');
 if(target&&!target.matches('.sound-control')&&!target.disabled)clickTone();
},true);
syncSound();
mountIntro();

function nearestWall(o){
 const vertical=o.d>o.w;
 const edges=[
  ['top',o.y,false],['bottom',state.d-o.y-o.d,false],
  ['left',o.x,true],['right',state.w-o.x-o.w,true]
 ];
 edges.sort((a,b)=>a[1]-b[1]||Number(a[2]!==vertical)-Number(b[2]!==vertical));
 return edges[0];
}
function snapWindow(o){
 const [wall,dist,vertical]=nearestWall(o);
 if(dist>20)return o;
 const long=Math.max(o.w,o.d),short=Math.min(o.w,o.d);
 const w=Math.min(state.w,vertical?short:long),d=Math.min(state.d,vertical?long:short);
 const x=wall==='left'?0:wall==='right'?state.w-w:clamp(o.x+(o.w-w)/2,0,state.w-w);
 const y=wall==='top'?0:wall==='bottom'?state.d-d:clamp(o.y+(o.d-d)/2,0,state.d-d);
 return {...o,x:Math.round(x),y:Math.round(y),w,d};
}
function findWindowSpot(w,d){
 for(const y of [0,state.d-d]){
  for(let x=0;x<=state.w-w;x+=10){const c={x,y,w,d,type:'window'};if(fitsBlocked(c,null))return c}
 }
 for(const x of [0,state.w-d]){
  for(let y=0;y<=state.d-w;y+=10){const c={x,y,w:d,d:w,type:'window'};if(fitsBlocked(c,null))return c}
 }
 return null;
}
function positionTopItem(el,o){
 el.style.left=o.x/state.w*100+'%';el.style.top=o.y/state.d*100+'%';
 el.style.width=o.w/state.w*100+'%';el.style.height=o.d/state.d*100+'%';
}
function mountResizeGrip(board,side,paint){
 if(typeof board.appendChild!=='function')return ()=>{};
 const grip=document.createElement('button');
 grip.type='button';grip.className='resize-grip';grip.textContent='↘';grip.hidden=true;
 board.appendChild(grip);
 let start=null;
 const item=()=>state.items.find(o=>o.key===selected);
 const feedback=()=>$('#placement-feedback');
 function anchors(o){
  if(o.type!=='window')return [false,false];
  const [wall,dist]=nearestWall(o);
  return [dist===0&&wall==='right',dist===0&&wall==='bottom'];
 }
 function sync(){
  const o=item();grip.hidden=!o||o.locked||resizeKey!==o.key;if(grip.hidden)return;
  const [right,bottom]=anchors(start||o);
  const x=(right?o.x:o.x+o.w)/state.w*100;
  const onWall=side&&o.type==='window';
  const y=onWall?windowBottom(o)-windowHeight(o)*wallScale:side?59+(o.y+o.d/2)/state.d*34:(bottom?o.y:o.y+o.d)/state.d*100;
  grip.style.left='clamp(14px, '+x+'%, calc(100% - 14px))';
  grip.style.top='clamp(14px, '+y+'%, calc(100% - 14px))';
  grip.textContent=onWall?(right?'↖':'↗'):right?'↙':bottom?'↗':'↘';
  const label=o.name+' 크기 조절';
  grip.setAttribute('aria-label',label);grip.title=label+' · 드래그 또는 방향키';
 }
 function resize(base,dw,dd,step){
  const o=item();if(!o||o.locked||o.key!==base.key)return false;
  const [right,bottom]=anchors(base);
  const size=(initial,delta,max)=>clamp(delta===0?initial:Math.round((initial+delta)/step)*step,5,max);
  const w=size(base.w,right?-dw:dw,right?base.x+base.w:state.w-base.x);
  const onWall=side&&o.type==='window';
  const d=onWall?base.d:size(base.d,bottom?-dd:dd,bottom?base.y+base.d:state.d-base.y);
  const c={...base,w,d,x:right?base.x+base.w-w:base.x,y:bottom?base.y+base.d-d:base.y};
  if(onWall)c.windowHeight=clamp(size(windowHeight(base),-dd,wallHeight-windowSill(base)),15,wallHeight-windowSill(base));
  if(!fitsBlocked(c,o.key)){
   grip.classList.add('invalid');if(feedback())feedback().textContent='사용 불가 공간과 겹쳐 크기를 바꿀 수 없어요.';return false;
  }
  grip.classList.remove('invalid');
  const changed=c.w!==o.w||c.d!==o.d||(onWall&&c.windowHeight!==windowHeight(o));
  Object.assign(o,c);
  const el=board.querySelector(side?'[data-side-key="'+o.key+'"]':'[data-key="'+o.key+'"]');
  if(el)paint(el,o);
  sync();showLayoutCheck(o);
  if(feedback())feedback().textContent=o.name+' · '+o.w+' × '+(onWall?windowHeight(o):o.d)+' cm';
  return changed;
 }
 function commit(){
  const o=item();if(!o)return;
  persist();drawItemList();editor();refreshPlanner();updateRoomStats();clickTone(true);
  if(feedback())feedback().textContent=o.name+' 크기 변경 · '+o.w+' × '+(side&&o.type==='window'?windowHeight(o):o.d)+' cm';
 }
 dragSprite(grip,board,(dx,dy)=>{
  if(!item())return;
  start??={...item()};
  resize(start,dx*state.w,dy*(side&&start.type==='window'?100/wallScale:state.d/(side?.34:1)),roomEffects.snap?10:1);
 },moved=>{
  const o=item();
  grip.classList.remove('invalid');
  if(moved&&start&&o&&(o.w!==start.w||o.d!==start.d||(side&&o.type==='window'&&windowHeight(o)!==windowHeight(start)))){resolveDrop(o,start);commit();drawBoard()}
  start=null;sync();
 },(dx,dy)=>{
  const o=item();if(!o)return;
  const step=roomEffects.snap?10:1;
  const before={...o};if(resize(before,dx*step,dy*step,step)){resolveDrop(o,before);commit();drawBoard()}
 });
 sync();
 return sync;
}

const wallHeight=240,wallScale=.59*100/wallHeight;
function windowHeight(o){return clamp(Number.isFinite(o.windowHeight)?o.windowHeight:65,15,wallHeight)}
function windowSill(o){return clamp(Number.isFinite(o.sill)?o.sill:90,0,wallHeight-windowHeight(o))}
function windowBottom(o){return 59-windowSill(o)*wallScale}

function layoutSnapshot(){return JSON.stringify({w:state.w,d:state.d,items:state.items})}
function rememberLayout(){
 if(restoringLayout)return;
 const snap=layoutSnapshot();
 if(layoutHistory[layoutCursor]===snap)return;
 layoutHistory=layoutHistory.slice(0,layoutCursor+1);
 layoutHistory.push(snap);
 if(layoutHistory.length>40)layoutHistory.shift();
 layoutCursor=layoutHistory.length-1;
}
function resetLayoutHistory(){layoutHistory=[];layoutCursor=-1;rememberLayout()}
function restoreLayout(delta){
 const cursor=layoutCursor+delta;
 if(cursor<0||cursor>=layoutHistory.length)return;
 layoutCursor=cursor;restoringLayout=true;
 Object.assign(state,JSON.parse(layoutHistory[cursor]));
 if(!state.items.some(o=>o.key===selected))selected=null;
 persist();restoringLayout=false;studio();
 $(delta<0?'#layout-undo':'#layout-redo')?.focus?.();
 toast(delta<0?'이전 배치로 되돌렸어요.':'변경을 다시 적용했어요.');
}
function bindWorkflow(){
 bindLayoutLab();
 $('#board-guide').onclick=()=>openRoomGuide('board');
 updatePlanSaveStatus();renderGuideCoach();bindBackupTools();
 const setup=$('#room-setup'),done=$('#setup-done');
 const add=$('#add-open'),save=$('#save-open'),panel=$('#save-section');
 if(add)add.onclick=()=>openFurniturePicker(add);
 if(save&&panel){
  function showSave(open){
   saveOpen=open;panel.hidden=!open;save.setAttribute('aria-expanded',String(open));
  }
  save.onclick=()=>{
   showSave(!saveOpen);
   if(saveOpen)$('#plan-name')?.focus?.({preventScroll:true});
  };
  save.parentElement?.addEventListener('keydown',e=>{
   if(e.key==='Escape'&&saveOpen){showSave(false);save.focus();e.preventDefault()}
  });
 }
 if(setup)setup.ontoggle=()=>{setupOpen=setup.open};
 if(done)done.onclick=async()=>{
  const w=+$('#room-w').value,d=+$('#room-d').value;
  if(!Number.isFinite(w)||!Number.isFinite(d)||w<200||d<200||w>1000||d>1000){$('#room-size-status').textContent='가로·세로는 200~1000cm로 입력해주세요.';return}
  if(w!==state.w||d!==state.d){const applied=await requestRoomSize(w,d);if(applied!==true){const status=$('#room-size-status');if(status)status.textContent=applied===false?'이 크기로 변경할 수 없어요. 가구 크기와 겹침을 확인해주세요.':'변경을 취소했어요. 현재 방 크기는 유지됩니다.';return}}
  setupOpen=false;$('#room-setup').open=false;
  const title=$('#board-title');title?.focus?.({preventScroll:true});title?.scrollIntoView?.({block:'start'});
  if(guideSizePending){guideSizePending=false;openRoomGuide('board',1)}
 };
 const undo=$('#layout-undo'),redo=$('#layout-redo');
 if(undo)undo.onclick=()=>restoreLayout(-1);
 if(redo)redo.onclick=()=>restoreLayout(1);
}
function doorDirection(o,room=state){
 const horizontal=o.w>=o.d;
 const options=horizontal?['down','up']:['right','left'];
 const space={down:room.d-o.y-o.d,up:o.y,right:room.w-o.x-o.w,left:o.x};
 const preferred=options.includes(o.doorSwing)?o.doorSwing:space[options[0]]>=space[options[1]]?options[0]:options[1];
 const opposite=options.find(dir=>dir!==preferred),length=Math.max(o.w,o.d);
 return space[preferred]<length&&space[opposite]>space[preferred]?opposite:preferred;
}
function doorClearance(o,room=state){
 const direction=doorDirection(o,room),length=Math.max(o.w,o.d);
 let x=o.x,y=o.y;
 if(direction==='down')y+=o.d;
 if(direction==='up')y-=length;
 if(direction==='right')x+=o.w;
 if(direction==='left')x-=length;
 const right=Math.min(room.w,x+length),bottom=Math.min(room.d,y+length);
 x=Math.max(0,x);y=Math.max(0,y);
 return {x,y,w:Math.max(0,right-x),d:Math.max(0,bottom-y)};
}
function clearanceAreas(){return state.items.filter(o=>o.type==='door').map(o=>doorClearance(o)).filter(a=>a.w&&a.d)}
function doorGuides(){
 return clearanceAreas().map(a=>`<div class="door-guide" aria-hidden="true" style="left:${a.x/state.w*100}%;top:${a.y/state.d*100}%;width:${a.w/state.w*100}%;height:${a.d/state.d*100}%"><span>문 열림 참고</span></div>`).join('');
}
function fitFurniture(p){
 if(p.id==='light')return null;
 const occupied=state.items.filter(o=>o.type!=='window').concat(clearanceAreas());
 for(const [w,d,rotated] of [[p.w,p.d,false],[p.d,p.w,true]]){
  if(w>state.w||d>state.d||(rotated&&w===d))continue;
  const edges=(limit,offset,extent)=>{
   const all=[0,limit];
   for(const o of occupied)all.push(o[offset]+o[extent],o[offset]-(offset==='x'?w:d));
   for(let n=10;n<limit;n+=10)all.push(n);
   return [...new Set(all)].filter(n=>n>=0&&n<=limit).sort((a,b)=>a-b);
  };
  const xs=edges(state.w-w,'x','w'),ys=edges(state.d-d,'y','d');
  for(const y of ys)for(const x of xs){
   const c={x,y,w,d};
   if(!occupied.some(o=>overlap(c,o)))return {...c,rotated};
  }
 }
 return null;
}
function showLayoutCheck(o){
 const out=$('#layout-check');if(!out)return;
 const doors=clearanceAreas(),doorItems=state.items.filter(x=>x.type==='door');
 const outside=doorItems.some(x=>{const a=doorClearance(x);return a.w*a.d<Math.max(x.w,x.d)**2-.1});
 const furniture=state.items.filter(o=>!['window','door'].includes(o.type)&&!isBlocked(o));
 const hit=doors.some(d=>furniture.some(f=>overlap(d,f)));
 let message=doorItems.length?'점선은 문이 열릴 때 비워둘 참고 공간이에요.':'출입문을 추가하면 문 앞에 비워둘 공간을 볼 수 있어요.';
 let warn=hit||outside;
 if(outside)message='출입문의 열림 공간이 방 밖으로 나가요. 문 위치나 회전 방향을 확인하세요.';
 if(hit)message='문 앞 참고 공간에 가구가 있어요. 출입문과 가구 위치를 확인하세요.';
 if(o&&furniture.includes(o)){
  const others=furniture.filter(f=>f!==o);
  if(others.some(f=>overlap(o,f))){warn=true;message='선택한 가구가 다른 가구와 겹쳐요.'+(hit?' 문 앞 공간도 확인하세요.':'')}
  else if(!hit&&!outside){
   const gaps=[];
   for(const f of others){
    if(o.y<f.y+f.d&&o.y+o.d>f.y)gaps.push(Math.max(f.x-o.x-o.w,o.x-f.x-f.w));
    if(o.x<f.x+f.w&&o.x+o.w>f.x)gaps.push(Math.max(f.y-o.y-o.d,o.y-f.y-f.d));
   }
   if(gaps.length)message='선택한 가구와 가장 가까운 가구 사이 간격: '+Math.round(Math.min(...gaps))+' cm';
  }
 }
 if(out.textContent!==message)out.textContent=message;
 out.classList.toggle('is-warning',warn);
 const board=$('#board');
 if(board?.querySelectorAll)board.querySelectorAll('.door-guide').forEach(el=>el.classList.toggle('is-warning',hit));
}
function refreshPlanner(){
 updateRoomStats();
 const undo=$('#layout-undo'),redo=$('#layout-redo');
 if(undo)undo.disabled=layoutCursor<=0;
 if(redo)redo.disabled=layoutCursor>=layoutHistory.length-1;
 const board=$('#board');
 if(boardView==='top'&&board?.querySelectorAll&&typeof board.insertAdjacentHTML==='function'){
  board.querySelectorAll('.door-guide').forEach(el=>el.remove());
  board.insertAdjacentHTML('afterbegin',doorGuides());
 }
 showLayoutCheck(state.items.find(o=>o.key===selected));
 updateRoomStats();

}

const customFurnitureArt=new Set(['desk','closet','builtin','storage','sink','stove']);
function hasFurnitureArt(o){return !!o&&(customFurnitureArt.has(o.type)||['bed','sofa','chair','table','cabinet','shelf'].includes(o.type))}
function furnitureAngle(o){return Number.isFinite(o.angle)?((Math.round(o.angle/90)*90%360)+360)%360:0}
function planFurnitureArt(o){
 if(!hasFurnitureArt(o))return '';
 const angle=furnitureAngle(o),turned=angle%180!==0;
 const width=turned?90*o.d/o.w:90,height=turned?90*o.w/o.d:90;
 return '<span class="plan-furniture art-'+o.type+'" style="width:'+width+'%;height:'+height+'%;transform:translate(-50%,-50%) rotate('+angle+'deg)" aria-hidden="true"><span class="furniture-detail"></span></span>';
}
function sideFurnitureArt(o){
 if(!hasFurnitureArt(o))return '<span class="side-shape" aria-hidden="true"></span>';
 const aliases={desk:'table',closet:'cabinet',builtin:'cabinet',sink:'cabinet',storage:'cabinet',stove:'cabinet'};
 return '<img class="side-photo '+(furnitureAngle(o)>=180?'facing-reverse':'')+'" draggable="false" src="assets/'+(aliases[o.type]||o.type)+'-hd.webp" alt="">';
}
function rotateBoardItem(o){
 if(!o)return;
 if(o.locked){toast('잠금을 먼저 해제해주세요.');return}
 if(o.d>state.w||o.w>state.d){toast('방 크기를 넘어 회전할 수 없어요.');return}
 const next={...o,w:o.d,d:o.w,angle:(furnitureAngle(o)+90)%360};
 if(o.type==='door'){const directions=['down','left','up','right'];next.doorSwing=directions[(directions.indexOf(doorDirection(o))+1)%4]}
 next.x=clamp(Math.round(o.x+(o.w-next.w)/2),0,state.w-next.w);
 next.y=clamp(Math.round(o.y+(o.d-next.d)/2),0,state.d-next.d);
 if(!fitsBlocked(next,o.key)){toast('사용 불가 영역과 겹쳐 회전할 수 없어요.');return}
 if(!applyCollision(next)){toast('회전할 빈 공간이 없어요.');return}persist();drawBoard();
 const status=$('#placement-feedback');if(status)status.textContent=o.name+' · 90° 회전 완료';
}

let pickerMode='fit';
function openFurniturePicker(trigger){
 const dialog=$('#furniture-picker');
 if(!dialog)return;
 dialog.querySelector('.picker-close').onclick=()=>dialog.close();
 dialog.onclose=()=>trigger?.focus?.({preventScroll:true});
 dialog.querySelectorAll('[data-picker-tab]').forEach(button=>button.onclick=()=>{pickerMode=button.dataset.pickerTab;renderFurniturePicker()});
 renderFurniturePicker();
 dialog.showModal();
}
function renderFurniturePicker(){
 const dialog=$('#furniture-picker'),content=$('#picker-content'),status=$('#picker-status');
 status.textContent='';
 dialog.querySelectorAll('[data-picker-tab]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.pickerTab===pickerMode)));
 const basic=[['bed','침대'],['desk','책상'],['closet','옷장'],['storage','수납함']];
 const structure=[['window','창문'],['door','출입문'],['stove','가스레인지'],['builtin','붙박이장'],['sink','싱크대'],['blocked','사용 불가 영역'],['column','기둥']];
 const quick=list=>`<div class="picker-quick">${list.map(([id,name])=>`<button type="button" class="outline" data-picker-basic="${id}">${name} 추가</button>`).join('')}</div>`;
 const rows=catalog.map(p=>({p,spot:fitFurniture(p),score:p.styles.filter(t=>state.styles.includes(t)).length}));
 const listed=pickerMode==='saved'?rows.filter(row=>state.saved.includes(row.p.id)):pickerMode==='fit'?rows.filter(row=>row.spot).sort((a,b)=>b.score-a.score):rows;
 if(pickerMode==='custom'){
  renderCustomFurniture(content,status,dialog);return;
 }
 if(pickerMode==='structure'){
  content.innerHTML='<p>문, 창문과 움직일 수 없는 구조를 보드에 표시하세요.</p>'+quick(structure);
 }else{
  const filters=pickerMode==='fit'?`<p class="fit-explanation">방 ${state.w} × ${state.d}cm의 빈자리에 들어가는 가구예요. 문 열림 참고 공간을 피해 찾았으며, 통행 간격은 배치 후 확인하세요.</p><details class="picker-styles"><summary>인테리어 취향 설정</summary><div class="chips">${['내추럴','미니멀','모던','미드센추리','코지'].map(t=>`<button type="button" class="chip ${state.styles.includes(t)?'selected':''}" aria-pressed="${state.styles.includes(t)}" data-picker-style="${t}">${t}</button>`).join('')}</div></details>`:'';
  content.innerHTML=(pickerMode==='all'?'<h3>기본 가구</h3>'+quick(basic)+'<h3>가구 카탈로그</h3>':filters)+
   (listed.length?`<div class="picker-grid">${listed.map(({p,spot})=>`<article class="picker-card"><img src="assets/${p.id}-hd.webp" alt=""><div><h3>${p.ko}</h3><p>${p.w} × ${p.d} cm · ${spot?(spot.rotated?'돌려서 배치 가능':'배치 가능'):(p.id==='light'?'천장용 조명':'현재 빈자리 없음')}</p><p class="fit-reason">${escapeHtml(p.material)}<br>${escapeHtml(p.desc)}</p><button class="outline" type="button" data-picker-product="${p.id}" aria-label="${p.ko} 보드에 추가" ${spot?'':'disabled'}>보드에 추가</button></div></article>`).join('')}</div>`:(pickerMode==='saved'?'<p class="picker-empty">아직 저장한 가구가 없어요. 가구 추천에서 마음에 드는 가구를 저장하면 여기에 모여요.</p>':'<p class="picker-empty">지금은 맞는 빈자리가 없어요. 배치를 조정하거나 전체 가구를 확인해보세요.</p>'));
 }
 content.querySelectorAll('[data-picker-style]').forEach(button=>button.onclick=()=>{
  const t=button.dataset.pickerStyle,active=state.styles.includes(t);
  state.styles=active?state.styles.filter(x=>x!==t):[...state.styles,t];persist();
  renderFurniturePicker();content.querySelector('.picker-styles').open=true;
  content.querySelector('[data-picker-style="'+t+'"]')?.focus();
 });
 content.querySelectorAll('[data-picker-basic]').forEach(button=>button.onclick=()=>{
  if(addRoomItem(button.dataset.pickerBasic))finishPicker(dialog);
  else status.textContent='추가할 빈자리가 없어요. 보드의 배치를 먼저 조정해 주세요.';
 });
 content.querySelectorAll('[data-picker-product]').forEach(button=>button.onclick=()=>{
  const p=catalog.find(row=>row.id===button.dataset.pickerProduct),spot=p&&fitFurniture(p);
  if(!spot){status.textContent='현재 배치에는 놓을 자리가 없어요.';return}
  const {x,y,w,d}=spot;
  const o={key:Date.now()+Math.random(),type:p.id,name:p.ko,x,y,w,d,angle:spot.rotated?90:0};
  state.items.push(o);selected=o.key;persist();drawBoard();pulseSelectedItem();finishPicker(dialog);
 });
}
function finishPicker(dialog){
 dialog.close();
 const item=state.items.find(o=>o.key===selected),status=$('#placement-feedback');
 if(item&&status)status.textContent=item.name+' 추가 완료';
}

function collisionRelevant(o){return !['window','door','light'].includes(o.type)}
function collisionPlan(candidate,items=state.items){
 const next=items.map(o=>({...o}));
 const active=next.find(o=>o.key===candidate.key);
 if(!active)return null;
 Object.assign(active,candidate);
 if(!fitsBlocked(candidate,candidate.key))return null;
 if(roomEffects.collision===false||!collisionRelevant(active)||isBlocked(active))return next;
 const fixed=next.filter(o=>o.key!==active.key&&collisionRelevant(o)&&(o.locked||isBlocked(o)));
 if(fixed.some(o=>overlap(active,o)))return null;
 const placed=[active,...fixed];
 const others=next.filter(o=>o.key!==active.key&&!o.locked&&!isBlocked(o)&&collisionRelevant(o));
 for(const o of others){
  if(placed.some(q=>overlap(o,q))){
   const xs=new Set([0,state.w-o.w,o.x]),ys=new Set([0,state.d-o.d,o.y]);
   for(const q of placed){xs.add(q.x+q.w);xs.add(q.x-o.w);ys.add(q.y+q.d);ys.add(q.y-o.d)}
   const options=[];
   for(const x of xs)for(const y of ys)if(x>=0&&y>=0&&x+o.w<=state.w&&y+o.d<=state.d)options.push({x,y});
   options.sort((a,b)=>(a.x-o.x)**2+(a.y-o.y)**2-((b.x-o.x)**2+(b.y-o.y)**2));
   const free=options.find(p=>!placed.some(q=>overlap({...o,...p},q)));
   if(!free)return null;
   Object.assign(o,free);
  }
  placed.push(o);
 }
 return next;
}
function applyCollision(candidate){
 const plan=collisionPlan(candidate);if(!plan)return false;
 for(const o of state.items){const next=plan.find(p=>p.key===o.key);if(next)Object.assign(o,next)}
 return true;
}
function resolveDrop(o,before){
 if(applyCollision({...o}))return true;
 Object.assign(o,before);
 toast('빈 공간이 부족하거나 잠긴 가구가 있어 원래 위치로 돌아왔어요.');
 return false;
}
function duplicateFurniture(o){
 const spot=findFreeSpot(o.w,o.d);
 if(!spot){toast('복제할 빈자리가 없어요.');return}
 const copy={...o,...spot,key:Date.now()+Math.random(),locked:false,name:o.name+' 복사'};
 state.items.push(copy);selected=copy.key;persist();drawBoard();toast('가구를 복제했어요.');
}
let comparison=null,comparisonSide='A';
function bindLayoutLab(){
 const toggle=$('#collision-toggle');
 if(toggle)toggle.onchange=()=>{roomEffects.collision=toggle.checked;saveEffects()};
 updateRoomStats();
}
function updateRoomStats(){
 const target=$('#room-stats');if(!target)return;
 const furniture=state.items.filter(collisionRelevant);
 const xs=[0,state.w,...furniture.flatMap(o=>[o.x,o.x+o.w])].sort((a,b)=>a-b);
 let area=0;
 for(let i=1;i<xs.length;i++){
  const lo=xs[i-1],hi=xs[i];if(hi===lo)continue;
  const ranges=furniture.filter(o=>o.x<hi&&o.x+o.w>lo).map(o=>[o.y,o.y+o.d]).sort((a,b)=>a[0]-b[0]);
  let end=-Infinity,total=0;
  for(const [a,b] of ranges){total+=Math.max(0,b-Math.max(a,end));end=Math.max(end,b)}
  area+=(hi-lo)*total;
 }
 const free=Math.max(0,(state.w*state.d-area)/10000);
 target.innerHTML='<span>사용 가능한 바닥 <strong>'+free.toFixed(1)+' m²</strong></span><span>배치한 가구 <strong>'+state.items.filter(hasFurnitureArt).length+'개</strong></span>';
}

function chairSeparation(active,other,bounds){
 const clampRect=r=>({...r,x:clamp(r.x,0,100-r.w),y:clamp(r.y,0,100-r.d)});
 active=clampRect(active);other=clampRect(other);
 if(!overlap(active,other))return {active,other,hit:false};
 const gap=.8;
 const options=[
  {...other,x:active.x+active.w+gap},
  {...other,x:active.x-other.w-gap},
  {...other,y:active.y+active.d+gap},
  {...other,y:active.y-other.d-gap}
 ].filter(r=>r.x>=0&&r.y>=0&&r.x+r.w<=100&&r.y+r.d<=100);
 options.sort((a,b)=>(a.x-other.x)**2+(a.y-other.y)**2-((b.x-other.x)**2+(b.y-other.y)**2));
 const free=options.find(r=>!overlap(active,r));
 if(free)return {active,other:free,hit:true};
 const fallback=[
  {...active,x:other.x-active.w-gap},{...active,x:other.x+other.w+gap},
  {...active,y:other.y-active.d-gap},{...active,y:other.y+other.d+gap}
 ].filter(r=>r.x>=0&&r.y>=0&&r.x+r.w<=100&&r.y+r.d<=100&&!overlap(r,other));
 fallback.sort((a,b)=>(a.x-active.x)**2+(a.y-active.y)**2-((b.x-active.x)**2+(b.y-active.y)**2));
 return fallback.length?{active:fallback[0],other,hit:true}:null;
}
function mountPhotoChairs(){
 const stage=$('.intro-chair-stage');if(!stage)return;
 const chairs=[...stage.querySelectorAll('.intro-chair')];
 const initial=[{x:13,y:23},{x:57,y:23}];
 const positions=initial.map(p=>({...p}));
 let lastWarning=0,resetMessage=null;
 const feedback=$('#chair-feedback');
 function size(el){return {w:el.offsetWidth/stage.clientWidth*100,d:el.offsetHeight/stage.clientHeight*100}}
 function paint(){chairs.forEach((el,i)=>{el.style.left=positions[i].x+'%';el.style.top=positions[i].y+'%'})}
 function message(text){feedback.textContent=text;clearTimeout(resetMessage);resetMessage=setTimeout(()=>{feedback.textContent='의자를 끌어 움직여보세요.'},2000)}
 function move(i,x,y){
  const j=1-i,result=chairSeparation({...positions[i],...size(chairs[i]),x,y},{...positions[j],...size(chairs[j])});
  if(!result)return;
  Object.assign(positions[i],{x:result.active.x,y:result.active.y});Object.assign(positions[j],{x:result.other.x,y:result.other.y});
  paint();
  if(result.hit){message('의자는 겹쳐 놓을 수 없어요.');if(Date.now()-lastWarning>1400){toast('의자는 겹쳐 놓을 수 없어요.');lastWarning=Date.now()}}
 }
 chairs.forEach((el,i)=>{
  let start=null;paint();
  dragSprite(el,stage,(dx,dy)=>{
   start??={...positions[i]};el.classList.add('is-moving');move(i,start.x+dx*100,start.y+dy*100);
  },()=>{start=null;el.classList.remove('is-moving')},(dx,dy)=>move(i,positions[i].x+dx*2,positions[i].y+dy*2));
 });
 $('#chair-reset').onclick=()=>{positions.forEach((p,i)=>Object.assign(p,initial[i]));paint();message('처음 위치로 되돌렸어요.')};
}
mountPhotoChairs();

function renderCustomFurniture(content,status,dialog){
 content.innerHTML='<form id="custom-furniture"><p>이미 가지고 있거나 구입할 가구의 실제 크기로 배치해보세요.</p><div class="custom-fields"><label class="field">가구 이름<input name="title" maxlength="35" required placeholder="예: 내 책상"></label><label class="field">가구 종류<select name="type"><option value="desk">책상</option><option value="bed">침대</option><option value="closet">옷장</option><option value="storage">수납함</option><option value="sofa">소파</option><option value="table">테이블</option><option value="chair">의자</option></select></label><label class="field">가로 (cm)<input name="width" type="number" inputmode="decimal" min="5" max="'+state.w+'" step="1" required value="100"></label><label class="field">깊이 (cm)<input name="depth" type="number" inputmode="decimal" min="5" max="'+state.d+'" step="1" required value="60"></label><label class="field">높이 (cm)<input name="height" type="number" inputmode="decimal" min="5" max="240" required value="75"></label></div><button type="submit" class="primary">내 가구 보드에 추가</button></form>';
 const form=content.querySelector('form');
 form.onsubmit=e=>{
  e.preventDefault();
  const data=new FormData(form),name=String(data.get('title')).trim(),w=+data.get('width'),d=+data.get('depth'),h=+data.get('height'),type=String(data.get('type'));
  if(!name||![w,d,h].every(Number.isFinite)||w<5||d<5||h<5||w>state.w||d>state.d||h>240){status.textContent='방에 맞는 크기를 입력해주세요.';return}
  const spot=fitFurniture({id:type,w,d});
  if(!spot){status.textContent='이 크기의 가구를 놓을 빈자리가 없어요. 배치를 바꿔보세요.';return}
  const {x,y}=spot;
  const o={key:Date.now()+Math.random(),name,type,x,y,w:spot.w,d:spot.d,h,angle:spot.rotated?90:0};
  state.items.push(o);selected=o.key;persist();drawBoard();finishPicker(dialog);
 };
}
function nudgeSelected(dx,dy,step=10){
 const o=state.items.find(p=>p.key===selected);if(!o)return;
 if(o.locked){toast('잠금을 먼저 해제해주세요.');return}
 const next={...o,x:clamp(o.x+dx*step,0,state.w-o.w),y:clamp(o.y+dy*step,0,state.d-o.d)};
 if(o.type==='window')Object.assign(next,snapWindow(next));
 if(!applyCollision(next)){toast('이 위치로 이동할 공간이 없어요.');return}
 persist();drawBoard();
 const el=$('#board [data-key="'+o.key+'"]');el?.focus?.({preventScroll:true});
}
// Button-led onboarding, with optional access to the actual planning tools.
let plannerGuideSeen=false,guideReturnFocus=null,guideSizePending=false,guideCoachStep=null;
function openRoomGuide(kind='home',step=0){
 const dialog=$('#room-guide');
 guideCoachStep=null;renderGuideCoach();
 if(!dialog.open)guideReturnFocus=document.activeElement;
 const home=kind==='home';
 const steps=[
  ['방 크기를 골라주세요.','내 방과 비슷한 크기를 선택하세요. 실제 치수는 방 설정에서 언제든 수정할 수 있어요.'],
  ['먼저 움직일 수 없는 곳을 표시해요.','문·창문·붙박이장과 사용할 수 없는 공간을 추가하면, 남은 공간에 맞춰 가구를 계획하기 쉬워요.'],
  ['내 방에 놓을 가구를 골라요.','방에 들어가는 가구를 추천받거나, 가진 가구의 실제 치수를 직접 입력할 수 있어요.'],
  ['가구를 선택하고 배치를 다듬어요.','가구를 끌어서 이동하세요. 가구를 누르면 회전·크기 변경·복사·잠금 버튼이 나타나요. 겹치는 가구는 빈자리로 밀려나요.'],
  ['마음에 드는 배치를 저장해요.','저장 버튼 아래에서 이름을 정해 저장하세요. 마이페이지의 나의 설계보드에서 다시 열거나 JPG로 보관할 수 있어요.']
 ];
 const [title,desc]=home?['어떤 방을 만들고 싶으세요?','방의 조건을 정하고, 가구를 골라 직접 배치해보세요. 원하는 버튼부터 선택하면 돼요.']:steps[step];
 let choices='';
 if(home)choices='<button class="primary" data-guide-action="design">내 방 설계 시작</button><button class="outline" data-guide-action="browse">가구 먼저 둘러보기</button>';
 else if(step===0)choices=roomPresets.map((p,i)=>`<button class="guide-choice ${state.w===p.w&&state.d===p.d?'selected':''}" aria-pressed="${state.w===p.w&&state.d===p.d}" data-guide-preset="${i}"><strong>${p.label}</strong><span>${p.w} × ${p.d} cm</span></button>`).join('')+'<button class="outline guide-wide" data-guide-action="size">직접 치수 설정하기</button><button class="primary guide-wide" data-guide-next="1">현재 크기로 계속하기</button>';
 else if(step===1)choices='<button class="primary" data-guide-picker="structure">문·창문·고정 구조 추가</button><button class="outline" data-guide-next="2">지금은 건너뛰기</button>';
 else if(step===2)choices='<button class="primary" data-guide-picker="fit">내 방에 맞는 가구 추천</button><button class="outline" data-guide-picker="custom">내 가구 치수 직접 입력</button><button class="outline" data-guide-next="3">추가한 가구로 계속하기</button>';
 else if(step===3)choices='<div class="guide-tip">가구 선택 · 회전 · 크기 변경<br>평면도에서 실제 크기와 가구 간격 확인</div><button class="primary" data-guide-next="4">저장 방법 보기</button><button class="outline" data-guide-action="finish">직접 배치해보기</button>';
 else choices='<button class="primary" data-guide-action="save">저장 옵션 열기</button><button class="outline" data-guide-action="finish">설계 시작하기</button>';
 dialog.innerHTML=`<div class="guide-top"><span>ROOMFIT 사용가이드</span><button class="outline" type="button" data-guide-close>닫기</button></div>${home?'':`<p class="guide-progress">${step+1} / ${steps.length}<span>${steps.map((_,i)=>`<i class="${i===step?'current':''}"></i>`).join('')}</span></p>`}<h2 id="guide-title">${title}</h2><p id="guide-description">${desc}</p><div class="guide-choices ${!home&&step===0?'guide-presets':''}">${choices}</div>${!home&&step>0?'<button type="button" class="guide-back">이전 안내</button>':''}<p class="guide-footnote">${home?'배경 위의 버튼을 선택해 시작해보세요.':'설계보드의 사용가이드 버튼으로 언제든 다시 볼 수 있어요.'}</p>`;
 if(!dialog.open)dialog.showModal();
 dialog.querySelector('.guide-choices button')?.focus({preventScroll:true});
 dialog.querySelector('[data-guide-close]').onclick=()=>dialog.close();
 dialog.onclose=()=>{if(!dialog.open&&document.activeElement===document.body&&guideReturnFocus?.isConnected)guideReturnFocus.focus({preventScroll:true})};
 dialog.querySelectorAll('[data-guide-next]').forEach(b=>b.onclick=()=>openRoomGuide('board',+b.dataset.guideNext));
 dialog.querySelector('.guide-back')?.addEventListener('click',()=>openRoomGuide('board',step-1));
 dialog.querySelectorAll('[data-guide-preset]').forEach(b=>b.onclick=async()=>{const p=roomPresets[+b.dataset.guidePreset];const applied=await requestRoomSize(p.w,p.d);if(applied){openRoomGuide('board',0);dialog.querySelector('[data-guide-preset="'+b.dataset.guidePreset+'"]')?.focus({preventScroll:true})}else if(applied===false){const status=dialog.querySelector('.guide-footnote');status.textContent='현재 가구를 모두 넣을 공간이 부족해요. 가구를 줄이거나 잠금을 해제한 뒤 다시 선택해주세요.';status.setAttribute('role','alert')}});
 dialog.querySelectorAll('[data-guide-picker]').forEach(b=>b.onclick=()=>{
  dialog.close();setupOpen=false;$('#room-setup').open=false;pickerMode=b.dataset.guidePicker;
  const trigger=$('#add-open');openFurniturePicker(trigger);
  const picker=$('#furniture-picker');picker.addEventListener('close',()=>{if(view==='studio'){guideCoachStep=step+1;renderGuideCoach()}},{once:true});
 });
 dialog.querySelectorAll('[data-guide-action]').forEach(b=>b.onclick=()=>{
  const action=b.dataset.guideAction;dialog.close();
  if(action==='design'){startFitFlow()}
  if(action==='browse')go('recommend');
  if(action==='size'){guideSizePending=true;setupOpen=true;$('#room-setup').open=true;$('#room-w').focus();$('#room-setup').scrollIntoView({block:'start'})}
  if(action==='finish'||action==='save'){setupOpen=false;$('#room-setup').open=false;$('#board-title').focus();if(action==='save'&&!saveOpen)$('#save-open').click()}
 });
}

function planFingerprint(plan){return JSON.stringify({w:plan.w,d:plan.d,name:plan.name??plan.planName,styles:plan.styles,items:plan.items,accessories:plan.accessories||[]})}
function updatePlanSaveStatus(){
 const status=$('#plan-save-status');if(!status)return;
 const saved=state.plans.find(p=>p.id===state.activePlanId);
 const matches=saved&&planFingerprint(saved)===planFingerprint(state);
 status.textContent=matches?'저장된 보드 · '+saved.name:saved?'변경 내용 있음 · 저장 버튼을 눌러 보드에 반영하세요.':'작업 중 · 저장하면 마이페이지에 보관돼요.';
 status.dataset.saved=String(!!matches);
}
function renderGuideCoach(){
 const el=$('#guide-coach');if(!el)return;
 el.hidden=guideCoachStep===null;
 if(el.hidden){el.innerHTML='';return}
 const titles=['방 크기 설정','고정 구조 배치','가구 고르기','가구 이동·회전 안내','저장 방법'];
 el.innerHTML=`<span>구조와 가구를 배치한 뒤 다음 안내를 확인하세요.</span><div><button class="outline" id="guide-continue">${titles[guideCoachStep]} 계속 보기</button><button class="text-button" id="guide-dismiss">안내 마치기</button></div>`;
 $('#guide-continue').onclick=()=>openRoomGuide('board',guideCoachStep);
 $('#guide-dismiss').onclick=()=>{guideCoachStep=null;renderGuideCoach()};
}
document.addEventListener('pointerdown',e=>{
 if(saveOpen&&view==='studio'&&!e.target.closest('.save-control')){
  saveOpen=false;const panel=$('#save-section');if(panel)panel.hidden=true;$('#save-open')?.setAttribute('aria-expanded','false');
 }
});

function confirmRoomAction(title,description,label='적용하기'){
 const dialog=$('#action-dialog'),focus=document.activeElement;
 return new Promise(resolve=>{
  dialog.innerHTML=`<h2 id="action-title">${escapeHtml(title)}</h2><p>${escapeHtml(description)}</p><div class="action-buttons"><button type="button" class="outline" data-action-cancel>취소</button><button type="button" class="primary" data-action-confirm>${escapeHtml(label)}</button></div>`;
  let accepted=false;
  dialog.onclose=()=>{if(focus?.isConnected)focus.focus({preventScroll:true});resolve(accepted)};
  dialog.querySelector('[data-action-cancel]').onclick=()=>dialog.close();
  dialog.querySelector('[data-action-confirm]').onclick=()=>{accepted=true;dialog.close()};
  dialog.showModal();dialog.querySelector('[data-action-cancel]').focus();
 });
}
async function requestRoomSize(w,d){
 if(!Number.isFinite(w)||!Number.isFinite(d)||w<200||d<200||w>1000||d>1000)return setRoomSize(w,d);
 const next=resizedRoomItems(state.items,w,d);if(!next)return setRoomSize(w,d);
 const moved=next.filter((o,i)=>o.x!==state.items[i].x||o.y!==state.items[i].y);
 if(moved.length){
  const yes=await confirmRoomAction('가구 위치가 조정돼요',w+' × '+d+'cm로 바꾸면 '+moved.length+'개 개체가 방 안의 빈자리로 이동해요. 가구 크기는 유지되며 실행 취소로 되돌릴 수 있어요.','방 크기 적용');
  if(!yes)return null;
 }
 return setRoomSize(w,d);
}
function archiveWorkingDraft(){
 const saved=state.plans.find(p=>p.id===state.activePlanId);
 if(saved&&planFingerprint(saved)===planFingerprint(state))return;
 if(!state.items.length)return;
 const plan=snapshotPlan('recovered-'+Date.now()+'-'+Math.random().toString(36).slice(2,7));
 plan.name=('자동 보관 · '+state.planName).slice(0,50);state.plans=[plan,...state.plans];
}
function bindBackupTools(){
 document.querySelectorAll('[data-backup-export]').forEach(b=>b.onclick=exportRoomBackup);
 document.querySelectorAll('[data-backup-import]').forEach(b=>b.onclick=()=>{$('#backup-file').value='';$('#backup-file').click()});
 $('#backup-file').onchange=async e=>{
  const file=e.target.files?.[0];if(!file)return;
  try{
   if(file.size>2*1024*1024)throw Error('파일 크기는 2MB 이하여야 해요.');
   const backup=validateRoomBackup(JSON.parse(await file.text()));
   if(!await confirmRoomAction('백업을 불러올까요?','현재 미저장 작업은 자동 보관하고 백업의 작업을 열어요. 기존 설계보드는 유지됩니다.','불러오기'))return;
   archiveWorkingDraft();
   const stamp=Date.now();
   const restored=backup.plans.map((p,i)=>({...p,id:'import-'+stamp+'-'+i}));
   const current={...backup.current,id:'import-'+stamp+'-current'};
   state.plans=[current,...restored,...state.plans];state.saved=[...new Set([...state.saved,...backup.saved])];
   state.w=current.w;state.d=current.d;state.items=current.items;state.styles=current.styles;state.accessories=current.accessories||[];state.planName=current.name;state.activePlanId=current.id;
   selected=null;resizeKey=null;setupOpen=false;plannerGuideSeen=true;resetLayoutHistory();persist();go('studio');toast('백업을 불러왔어요. 기존 작업도 마이페이지에 보관했어요.');
  }catch(error){toast(error instanceof SyntaxError?'올바른 ROOMFIT 설계 파일이 아니에요.':error.message||'파일을 불러올 수 없어요.')}
 };
}
function exportRoomBackup(){
 const payload={format:'ROOMFIT',version:1,exportedAt:new Date().toISOString(),current:snapshotPlan('working'),plans:state.plans,saved:state.saved};
 const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');
 a.href=url;a.download='ROOMFIT-'+new Date().toISOString().slice(0,10)+'.roomfit.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),30000);toast('수정 가능한 설계 백업 파일을 만들었어요.');
}
function validateRoomBackup(data){
 const invalid=()=>{throw Error('지원하지 않거나 손상된 ROOMFIT 설계 파일이에요.')};
 if(!data||data.format!=='ROOMFIT'||data.version!==1||!Array.isArray(data.plans)||data.plans.length>100||!Array.isArray(data.saved))invalid();
 const types=new Set(['bed','desk','closet','storage','sofa','chair','table','cabinet','shelf','light','stove','builtin','sink','window','door','blocked','column']);
 const number=(v,min,max)=>typeof v==='number'&&Number.isFinite(v)&&v>=min&&v<=max;
 const plan=p=>{
  if(!p||!number(p.w,200,1000)||!number(p.d,200,1000)||typeof p.name!=='string'||!Array.isArray(p.items)||p.items.length>200||!Array.isArray(p.styles))invalid();
  const keys=new Set();
  const items=p.items.map(o=>{
   if(!o||!types.has(o.type)||typeof o.name!=='string'||!number(o.key,0,1e17)||keys.has(o.key)||!number(o.w,5,p.w)||!number(o.d,5,p.d)||!number(o.x,0,p.w-o.w)||!number(o.y,0,p.d-o.d))invalid();keys.add(o.key);
   const result={key:o.key,type:o.type,name:o.name.slice(0,50),x:o.x,y:o.y,w:o.w,d:o.d,angle:[0,90,180,270].includes(o.angle)?o.angle:0,locked:o.locked===true};
   if(number(o.h,5,240))result.h=o.h;if(['down','left','up','right'].includes(o.doorSwing))result.doorSwing=o.doorSwing;
   return result;
  });
  const now=new Date().toISOString();return {name:p.name.slice(0,50),w:p.w,d:p.d,accessories:Array.isArray(p.accessories)?p.accessories.filter(x=>roomAccessories.some(a=>a.id===x)):[],styles:p.styles.filter(x=>['내추럴','미니멀','모던','미드센추리','코지'].includes(x)),items,createdAt:now,updatedAt:now};
 };
 return {current:plan(data.current),plans:data.plans.map(plan),saved:data.saved.filter(id=>catalog.some(p=>p.id===id))};
}
function paintExportFurniture(ctx,o,x,y,w,h){
 if(!hasFurnitureArt(o))return;
 const angle=furnitureAngle(o),odd=angle%180!==0,bw=(odd?h:w)*.72,bh=(odd?w:h)*.72;
 ctx.save();ctx.translate(x+w/2,y+h/2);ctx.rotate(angle*Math.PI/180);ctx.translate(-bw/2,-bh/2);
 ctx.fillStyle='#d5b58c';ctx.strokeStyle='#a18463';ctx.lineWidth=2;ctx.fillRect(0,0,bw,bh);ctx.strokeRect(0,0,bw,bh);
 if(o.type==='bed'){ctx.fillStyle='#fdfbf5';ctx.fillRect(bw*.06,bh*.04,bw*.88,bh*.23);ctx.fillStyle='#d7cfc1';ctx.fillRect(bw*.04,bh*.3,bw*.92,bh*.66)}
 else if(['sofa','chair'].includes(o.type)){ctx.fillStyle='#b9b3a5';ctx.fillRect(bw*.08,bh*.15,bw*.84,bh*.78);ctx.strokeRect(bw*.08,bh*.15,bw*.84,bh*.78)}
 else if(o.type==='sink'){ctx.fillStyle='#b3c0bd';ctx.fillRect(bw*.12,bh*.15,bw*.76,bh*.7);ctx.strokeRect(bw*.12,bh*.15,bw*.76,bh*.7)}
 else if(o.type==='stove'){ctx.fillStyle='#49443d';for(const a of [.27,.73])for(const b of [.27,.73]){ctx.beginPath();ctx.arc(bw*a,bh*b,Math.min(bw,bh)*.12,0,Math.PI*2);ctx.fill()}}
 else if(o.type==='table'){ctx.fillStyle='#c9a77d';ctx.beginPath();ctx.ellipse(bw/2,bh/2,bw*.46,bh*.46,0,0,Math.PI*2);ctx.fill();ctx.stroke()}
 else{ctx.beginPath();ctx.moveTo(bw/2,0);ctx.lineTo(bw/2,bh);ctx.stroke()}
 ctx.restore();
}

// A short room-first questionnaire; existing work changes only on explicit apply.
const livingSets=[
 {id:'basic',name:'기본 생활',tag:'처음 자취한다면',desc:'잠자고, 수납하고, 간단히 식사하는 데 필요한 구성.',types:['bed','closet','desk','chair'],image:'bed'},
 {id:'study',name:'공부·작업',tag:'책상에서 보내는 시간이 길다면',desc:'넓은 작업 공간과 책 수납을 우선으로 준비해요.',types:['bed','desk','chair','closet','shelf'],image:'table'},
 {id:'rest',name:'휴식 중심',tag:'집에서 편히 쉬고 싶다면',desc:'침대와 작은 소파로 휴식할 자리를 나눠요.',types:['bed','closet','sofa','table'],image:'sofa'}
];
const livingFurniture={
 bed:{name:'싱글 침대',w:100,d:200,h:45,material:'원목 프레임 · 패브릭 침구',reason:'원룸의 잠자리를 먼저 확보해요.',image:'bed',small:[90,200]},
 closet:{name:'슬림 옷장',w:80,d:50,h:180,material:'우드 보드 · 무광 마감',reason:'벽면에 붙여 의류 수납을 모아요.',image:'cabinet',small:[60,45]},
 desk:{name:'멀티 책상',w:100,d:50,h:74,material:'우드 상판 · 스틸 다리',reason:'작업과 1인 식사를 한 자리에서 해결해요.',image:'table',small:[80,45]},
 chair:{name:'컴팩트 의자',w:45,d:45,h:80,material:'원목 · 패브릭 좌판',reason:'책상과 함께 사용할 의자를 준비해요.',image:'chair',small:[40,40]},
 shelf:{name:'얕은 책장',w:60,d:30,h:150,material:'우드 보드',reason:'바닥을 적게 쓰면서 책과 생활용품을 정리해요.',image:'shelf',small:[45,25]},
 sofa:{name:'소형 소파',w:120,d:70,h:75,material:'패브릭 · 원목 다리',reason:'침대와 구분되는 작은 휴식 공간을 만들어요.',image:'sofa',small:[100,65]},
 table:{name:'낮은 테이블',w:60,d:45,h:35,material:'원목 상판',reason:'소파 앞에 음료와 작은 물건을 둘 수 있어요.',image:'table',small:[45,40]},
 storage:{name:'틈새 수납함',w:40,d:35,h:70,material:'우드 보드',reason:'작은 생활용품을 한곳에 모아요.',image:'cabinet',small:[30,30]}
};
const accessoryGroups=[{id:'fabric',name:'패브릭·침구'},{id:'mood',name:'조명·장식'},{id:'organize',name:'생활·정리'}];
const roomAccessories=[
 {id:'rug',group:'fabric',name:'러그',desc:'침대 옆 바닥에 부드러운 질감',material:'관리하기 쉬운 낮은 파일의 면 혼방'},
 {id:'curtain',group:'fabric',name:'커튼',desc:'빛과 시선을 가려주는 창가 옵션',material:'채광을 살리는 린넨 혼방 · 암막 안감 선택'},
 {id:'bedding',group:'fabric',name:'침구',desc:'침대의 색감과 촉감 정리',material:'사계절 쓰기 좋은 면·모달 혼방'},
 {id:'cushion',group:'fabric',name:'쿠션·블랭킷',desc:'침대나 소파에 작은 포인트',material:'면 커버 · 울 혼방 블랭킷'},
 {id:'light',group:'mood',name:'조명',desc:'책상 위나 벽면에 따뜻한 빛',material:'무광 금속 · 따뜻한 색 조명'},
 {id:'mirror',group:'mood',name:'벽걸이 거울',desc:'바닥 공간을 차지하지 않는 선택',material:'가벼운 프레임 · 벽 고정형'},
 {id:'plant',group:'mood',name:'작은 식물',desc:'책상이나 선반 위에 초록 한 점',material:'작은 화분 · 받침 포함'},
 {id:'frame',group:'mood',name:'포스터·액자',desc:'빈 벽면에 취향을 더하는 장식',material:'가벼운 우드 프레임 · 종이 포스터'},
 {id:'basket',group:'organize',name:'수납 바구니',desc:'선반과 옷장 안의 소품 정리',material:'패브릭 또는 라탄 바구니'},
 {id:'clock',group:'organize',name:'벽시계',desc:'자리 차지 없이 시간 확인',material:'무소음 무브먼트 · 무광 프레임'},
 {id:'mat',group:'organize',name:'현관·욕실 매트',desc:'출입구와 욕실 앞의 물기 관리',material:'미끄럼 방지 바닥 · 세탁 가능한 소재'},
 {id:'cable',group:'organize',name:'케이블 정리함',desc:'책상 주변의 전선을 한곳에',material:'통풍 가능한 정리함 · 케이블 클립'}
];
let fitStep=0,fitDraft=null,fitResult=null;
function startFitFlow(){
 fitDraft={w:state.w,d:state.d,set:'basic',types:[...livingSets[0].types],accessories:[],keepStructure:true};
 fitStep=0;fitResult=null;go('fit');
}
function fitQuestion(){
 if(!fitDraft){startFitFlow();return}
 const questions=['방 크기가 어떻게 되나요?','어떤 원룸 생활을 원하세요?','추가로 필요한 것이 있나요?'];
 const hints=['가장 비슷한 크기만 고르세요. 정확한 치수는 직접 입력할 수도 있어요.','생활 방식 하나를 고르면 필요한 가구를 함께 추천해요.','기본 구성만으로도 충분해요. 악세사리는 원할 때만 더하세요.'];
 const chosenSet=livingSets.find(x=>x.id===fitDraft.set);
 let body='';
 if(fitStep===0)body=`<div class="fit-room-choices">${roomPresets.map((p,i)=>`<button type="button" class="fit-choice ${fitDraft.w===p.w&&fitDraft.d===p.d?'selected':''}" data-fit-room="${i}" aria-pressed="${fitDraft.w===p.w&&fitDraft.d===p.d}"><strong>${p.label}</strong><span>${p.w} × ${p.d} cm</span><small>${(p.w*p.d/10000).toFixed(1)}m² · 약 ${(p.w*p.d/33058).toFixed(1)}평</small></button>`).join('')}</div><details class="fit-custom"><summary>직접 치수 입력 · 고정 구조</summary><div class="row"><label class="field">가로 (cm)<input type="number" id="fit-w" value="${fitDraft.w}" min="200" max="1000" inputmode="numeric"></label><label class="field">세로 (cm)<input type="number" id="fit-d" value="${fitDraft.d}" min="200" max="1000" inputmode="numeric"></label></div><label class="fit-check"><input type="checkbox" id="fit-structure" ${fitDraft.keepStructure?'checked':''}>이미 표시한 문·창문·고정 구조 유지</label><p>처음이라면 기본 문과 창문을 기준으로 추천해요. 실제 위치는 결과를 확인한 뒤 바꿀 수 있어요.</p></details>`;
 if(fitStep===1)body=`<div class="fit-set-choices">${livingSets.map(set=>`<button type="button" class="fit-choice fit-set ${fitDraft.set===set.id?'selected':''}" data-fit-set="${set.id}" aria-pressed="${fitDraft.set===set.id}"><img src="assets/${set.image}-hd.webp" alt=""><span class="fit-set-copy"><small>${set.tag}</small><strong>${set.name}</strong><span>${set.desc}</span><em>${set.types.map(t=>livingFurniture[t].name).join(' · ')}</em></span></button>`).join('')}</div>`;
 if(fitStep===2)body=`<div class="fit-summary"><span>선택한 기본 구성</span><h2>${chosenSet.name}</h2><p id="fit-selected-types">${fitDraft.types.map(t=>livingFurniture[t].name).join(' · ')||'선택한 가구 없음'}</p><details><summary>필요한 가구만 남기기</summary><div class="fit-furniture-options">${Object.entries(livingFurniture).map(([id,p])=>`<label class="fit-check"><input type="checkbox" data-fit-type="${id}" ${fitDraft.types.includes(id)?'checked':''}>${p.name}</label>`).join('')}</div></details></div><h2 class="fit-options-title">악세사리 <small>선택하지 않아도 돼요</small></h2><p class="accessory-intro">필요한 것만 골라주세요. 고르지 않고 바로 결과를 봐도 괜찮아요.</p><div class="accessory-groups">${accessoryGroups.map((group,i)=>`<details class="accessory-group" ${i===0||roomAccessories.some(a=>a.group===group.id&&fitDraft.accessories.includes(a.id))?'open':''}><summary>${group.name}<span data-accessory-count="${group.id}">${roomAccessories.filter(a=>a.group===group.id&&fitDraft.accessories.includes(a.id)).length}개 선택</span></summary><div class="fit-accessories">${roomAccessories.filter(a=>a.group===group.id).map(a=>`<button type="button" class="fit-choice ${fitDraft.accessories.includes(a.id)?'selected':''}" data-fit-accessory="${a.id}" aria-pressed="${fitDraft.accessories.includes(a.id)}"><strong>${a.name}</strong><span>${a.desc}</span></button>`).join('')}</div></details>`).join('')}</div>`;
 main.innerHTML=`<section class="section fit-page"><div class="fit-progress" aria-label="추천 진행 단계">${['방 크기','생활 방식','추가 옵션'].map((label,i)=>`<span ${i===fitStep?'aria-current="step"':''} class="${i<=fitStep?'active':''}">${i+1}. ${label}</span>`).join('')}</div><div class="fit-question-head"><span class="eyebrow">FIND YOUR ROOMFIT</span><h1>${questions[fitStep]}</h1><p>${hints[fitStep]}</p></div>${body}<p id="fit-error" role="alert"></p><div class="fit-question-actions">${fitStep?'<button type="button" class="outline" id="fit-back">이전</button>':'<button type="button" class="text-button" id="fit-cancel">홈으로</button>'}<button type="button" class="primary" id="fit-next">${fitStep===2?'내 방 추천 결과 보기':'다음'}</button></div><p class="fit-step-note">${fitDraft.w} × ${fitDraft.d}cm${fitStep>0?' · '+chosenSet.name:''} · 기존 설계는 유지돼요</p></section>`;
 main.querySelectorAll('[data-fit-room]').forEach(b=>b.onclick=()=>{const p=roomPresets[+b.dataset.fitRoom];fitDraft.w=p.w;fitDraft.d=p.d;fitQuestion()});
 main.querySelectorAll('[data-fit-set]').forEach(b=>b.onclick=()=>{const set=livingSets.find(x=>x.id===b.dataset.fitSet);fitDraft.set=set.id;fitDraft.types=[...set.types];fitQuestion()});
 main.querySelectorAll('[data-fit-type]').forEach(input=>input.onchange=()=>{const t=input.dataset.fitType;fitDraft.types=input.checked?[...fitDraft.types,t]:fitDraft.types.filter(x=>x!==t);$('#fit-next').disabled=fitDraft.types.length===0;$('#fit-selected-types').textContent=fitDraft.types.map(t=>livingFurniture[t].name).join(' · ')||'선택한 가구 없음'});
 main.querySelectorAll('[data-fit-accessory]').forEach(b=>b.onclick=()=>{const id=b.dataset.fitAccessory;fitDraft.accessories=fitDraft.accessories.includes(id)?fitDraft.accessories.filter(x=>x!==id):[...fitDraft.accessories,id];b.classList.toggle('selected',fitDraft.accessories.includes(id));b.setAttribute('aria-pressed',String(fitDraft.accessories.includes(id)));accessoryGroups.forEach(g=>{const count=$('[data-accessory-count="'+g.id+'"]');if(count)count.textContent=roomAccessories.filter(a=>a.group===g.id&&fitDraft.accessories.includes(a.id)).length+'개 선택'})});
 $('#fit-back')?.addEventListener('click',()=>{fitStep--;fitQuestion();window.scrollTo(0,0)});
 $('#fit-cancel')?.addEventListener('click',()=>go('home'));
 $('#fit-next').disabled=fitStep===2&&!fitDraft.types.length;
 $('#fit-next').onclick=()=>{
  if(fitStep===0){const w=Number($('#fit-w').value),d=Number($('#fit-d').value);if(w<200||d<200||w>1000||d>1000||!Number.isFinite(w)||!Number.isFinite(d)){$('#fit-error').textContent='가로·세로를 200~1000cm로 입력해주세요.';return}fitDraft.w=w;fitDraft.d=d;fitDraft.keepStructure=$('#fit-structure').checked}
  if(fitStep<2){fitStep++;fitQuestion();window.scrollTo(0,0);return}
  if(!fitDraft.types.length){$('#fit-error').textContent='가구를 하나 이상 선택해주세요.';return}
  fitResult=buildLivingRecommendation(fitDraft,state.items);
  go('recommend');
 };
}
function buildLivingRecommendation(answers,existing=[]){
 const w=answers.w,d=answers.d;
 const structuralTypes=['window','door','stove','builtin','sink','blocked','column'];
 const raw=answers.keepStructure?existing.filter(o=>structuralTypes.includes(o.type)||o.locked):[
  {key:1,type:'window',name:'창문',w:100,d:10,x:Math.max(0,w-130),y:0},
  {key:2,type:'door',name:'출입문',w:80,d:20,x:Math.max(0,w-90),y:d-20}
 ];
 const fixed=raw.map(o=>({...o}));
 if(fixed.some(o=>o.w>w||o.d>d))return {answers:structuredClone(answers),error:'현재 고정 구조가 선택한 방보다 커요. 방 크기를 바꾸거나 고정 구조 유지 옵션을 해제해주세요.'};
 fixed.forEach(o=>{o.x=clamp(o.x,0,w-o.w);o.y=clamp(o.y,0,d-o.d)});
 const doorAreas=fixed.filter(o=>o.type==='door').map(o=>doorClearance(o,{w,d}));
 const fixedFloor=fixed.filter(o=>o.type!=='window');
 if(fixedFloor.some((o,i)=>fixedFloor.some((p,j)=>i<j&&overlap(o,p))))return {answers:structuredClone(answers),error:'고정 구조끼리 겹쳐요. 방 크기를 바꾸거나 고정 구조 유지 옵션을 해제해주세요.'};
 const types=[...new Set(answers.types)].filter(t=>livingFurniture[t]);
 const orders=[types,[...types].sort((a,b)=>livingFurniture[b].w*livingFurniture[b].d-livingFurniture[a].w*livingFurniture[a].d),[...types].sort((a,b)=>Number(b==='bed')-Number(a==='bed'))];
 let best=null;
 for(const order of orders){
  const placed=[],missing=[];
  for(const type of order){
   if(fixed.some(o=>o.type===type)){continue}
   const p=livingFurniture[type],sizes=[[p.w,p.d,false],...(p.small?[[...p.small,true]]:[])];
   let found=null;
   for(const [baseW,baseD,compact] of sizes){
    const candidates=[];
    for(const [cw,cd,angle] of [[baseW,baseD,0],[baseD,baseW,90]]){
     if(cw>w||cd>d)continue;
     const occupied=[...fixedFloor,...doorAreas,...placed];
     const xs=new Set([0,w-cw]),ys=new Set([0,d-cd]);
     for(const o of occupied){xs.add(o.x+o.w+10);xs.add(o.x-cw-10);ys.add(o.y+o.d+10);ys.add(o.y-cd-10)}
     for(let x=0;x<=w-cw;x+=25)xs.add(x);for(let y=0;y<=d-cd;y+=25)ys.add(y);
     for(const x of xs)for(const y of ys){
      if(x<0||y<0||x+cw>w||y+cd>d)continue;
      const item={key:Math.max(0,...fixed.map(o=>Number(o.key)||0))+100+types.indexOf(type),type,name:p.name+(compact?' (슬림형)':''),x,y,w:cw,d:cd,h:p.h,angle};
      if(occupied.some(o=>overlap(item,o)))continue;
      const wall=Math.min(x,y,w-x-cw,d-y-cd),desk=placed.find(o=>o.type==='desk');
      const chairDistance=type==='chair'&&desk?Math.hypot(x+cw/2-desk.x-desk.w/2,y+cd/2-desk.y-desk.d/2):0;
      candidates.push({item,score:wall*5+chairDistance*.6+y*.025+x*.005});
     }
    }
    candidates.sort((a,b)=>a.score-b.score);if(candidates.length){found={...candidates[0].item,compact};break}
   }
   if(found)placed.push(found);else missing.push(type);
  }
  const candidate={placed,missing};
  if(!best||missing.length<best.missing.length||(missing.length===best.missing.length&&placed.filter(o=>o.compact).length<best.placed.filter(o=>o.compact).length))best=candidate;
 }
 const items=[...fixed,...best.placed];
 return {answers:structuredClone(answers),placed:best.placed,missing:best.missing,plan:{id:'fit-preview',name:livingSets.find(x=>x.id===answers.set)?.name||'원룸 추천 설계',w,d,styles:['내추럴'],items},accessories:roomAccessories.filter(a=>answers.accessories.includes(a.id))};
}
function renderFitResult(){
 if(!fitResult){startFitFlow();return}
 const r=fitResult,a=r.answers;
 if(r.error){main.innerHTML=`<section class="section fit-page">${head('ROOMFIT RESULT','방 조건을 한 번만 확인해주세요.',r.error)}<button type="button" class="primary" id="fit-retry">방 조건 수정하기</button></section>`;$('#fit-retry').onclick=()=>{fitStep=0;go('fit')};return}
 const existingTypes=r.plan.items.filter(o=>!r.placed.includes(o)).map(o=>o.type);
 const matched=a.types.filter(t=>r.placed.some(o=>o.type===t)||existingTypes.includes(t));
 const summary=matched.map(t=>livingFurniture[t].name).join(', ');
 const last=summary.charCodeAt(summary.length-1),particle=last>=44032&&last<=55203&&(last-44032)%28?'을':'를';
 main.innerHTML=`<section class="section fit-result"><div class="fit-result-head"><span class="eyebrow">YOUR ROOMFIT</span><h1>${matched.length?'당신의 방에는<br>'+escapeHtml(summary)+particle+' 넣을 수 있어요.':'현재 고정 구조를 유지하면<br>추가할 빈자리가 부족해요.'}</h1><p>${a.w} × ${a.d}cm · ${(a.w*a.d/10000).toFixed(1)}m² · ${livingSets.find(s=>s.id===a.set).name}</p></div><div class="fit-result-layout"><div class="fit-preview"><span class="eyebrow">공간에 들어가는 구성 미리보기</span>${miniPlan(r.plan)}<p>가구 크기와 문 열림 참고 공간을 고려한 배치 예시예요. 실제 문·창문 위치는 설계보드에서 맞춰주세요.</p></div><div class="fit-result-summary"><h2>꼭 필요한 가구부터 준비했어요.</h2><p>${matched.length}종류 배치 가능 · 선택한 가구 ${a.types.length}종류${r.placed.some(o=>o.compact)?' · 공간에 맞춰 슬림형 포함':''}</p><ul>${matched.map(t=>{const item=r.plan.items.find(o=>o.type===t),p=livingFurniture[t];return `<li><strong>${escapeHtml(item.name)}</strong><span>${item.w} × ${item.d}cm</span><p>${p.reason}</p></li>`}).join('')}</ul>${r.missing.length?`<div class="fit-unavailable"><strong>이번 구성에서 제외했어요.</strong><p>${r.missing.map(t=>livingFurniture[t].name).join(' · ')}는 현재 빈 공간에 함께 넣기 어려워요.</p></div>`:''}<button type="button" class="primary" id="fit-apply">${matched.length?'이 구성으로 내 방 꾸미기':'현재 구조 확인하기'}</button><button type="button" class="outline" id="fit-edit">선택한 조건 수정</button><p class="fit-preserve-note">적용하면 기존 미저장 작업은 자동 보관돼요.</p></div></div><section class="fit-recommendations"><h2>내 방에 맞는 가구 구성</h2><div class="fit-product-grid">${r.placed.map(o=>{const p=livingFurniture[o.type];return `<article><img src="assets/${p.image}-hd.webp" alt="${p.name}" loading="lazy"><span class="fit-product-tag">내 방에 배치 가능</span><h3>${escapeHtml(o.name)}</h3><p>${o.w} × ${o.d} × ${o.h}cm</p><p>${p.material}</p></article>`}).join('')}</div></section>${r.accessories.length?`<section class="fit-accessory-result"><h2>함께 고른 악세사리</h2><p>기본 가구와 분리한 추가 제안이에요. 배치보드의 바닥 가구에는 포함하지 않아요.</p><div>${r.accessories.map(x=>`<article><h3>${x.name}</h3><p>${x.material}</p><p>${x.desc}</p></article>`).join('')}</div></section>`:''}<div class="fit-browse"><p>다른 가구도 비교하고 싶다면</p><button type="button" class="outline" id="fit-browse">전체 가구 둘러보기</button></div></section>`;
 $('#fit-edit').onclick=()=>{fitDraft=structuredClone(a);fitStep=0;go('fit')};
 $('#fit-browse').onclick=()=>go('catalog');
 $('#fit-apply').onclick=()=>{
  archiveWorkingDraft();state.w=r.plan.w;state.d=r.plan.d;state.styles=[...r.plan.styles];state.items=structuredClone(r.plan.items);state.accessories=r.accessories.map(x=>x.id);state.planName=r.plan.name;state.activePlanId=null;selected=null;resizeKey=null;setupOpen=false;plannerGuideSeen=true;
  resetLayoutHistory();persist();go('studio');toast('추천 구성을 불러왔어요. 가구를 선택해 원하는 위치로 바꿔보세요.');
 };
}
