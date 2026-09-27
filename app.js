(function () {
  'use strict';
  const C=window.StudyCore, $=id=>document.getElementById(id), key='kiiroitori.study.web.v4';
  const esc=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const days=['월','화','수','목','금','토','일'], stateNames={study:'공부',rest:'휴식',finish:'마감'};
  const builtin={library:{id:'library',name:'도서관'},cafe:{id:'cafe',name:'카페'}};
  let data=C.fresh(), selected=new Date(), revision=0, tableSignature='', lastTick=new Date(), previewState='study';
  let customPacks={}, db=null, editor=null, pendingImport=null, queuedAlarm=null, toastTimer=null, audio=null;
  function message(text) {
    const modal=document.querySelector('dialog[open]');
    let target=$('toast');
    if(modal) {
      target=modal.querySelector('.dialog-notice');
      if(!target) { target=document.createElement('p'); target.className='dialog-notice error'; target.setAttribute('role','status'); modal.querySelector('.dialog-heading').after(target); }
    }
    target.textContent=text; target.hidden=false; clearTimeout(toastTimer);
    toastTimer=setTimeout(()=>{target.hidden=true;},5500);
  }
  function read() {
    try { const saved=localStorage.getItem(key); if(saved) data=C.validateData(JSON.parse(saved)); }
    catch(error) { $('storage-status').textContent='저장된 내용을 읽지 못했어요. 백업을 가져와 주세요.'; message('기존 브라우저 데이터는 보존하고 기본 시간표를 표시합니다.'); }
  }
  function commit(next) {
    try { localStorage.setItem(key,JSON.stringify(next)); }
    catch(error) { render(true); message('브라우저에 저장하지 못했어요. 저장 공간이나 파일 접근 권한을 확인해 주세요.'); return false; }
    data=next; revision++; $('storage-status').textContent='이 브라우저에 저장됨'; render(true); return true;
  }
  function preference(name,value) { const next=C.copy(data); next.preferences[name]=value; return commit(next); }
  const packs=()=>({...builtin,...customPacks});
  function pack(id=data.preferences.theme) { const available=packs(); return Object.hasOwn(available,id)?available[id]:builtin.library; }
  function asset(path) { return window.EMBEDDED_ASSETS?.[path]||path; }
  function imageSource(id,state) { const p=pack(id); return p.images?.[state]||asset(`assets/packs/${p.id}/${state}.png`); }
  function setArt(element,id,state) {
    const signature=id+':'+state;
    if(element.dataset.art===signature) return;
    element.dataset.art=signature; element.src=imageSource(id,state);
    element.onerror=()=>{element.onerror=null;element.src=asset('assets/kiiroitori_broom.png');};
  }
  function dialog(id) { if(!$(id).open) $(id).showModal(); }
  function duration(ms) { const sec=Math.max(0,Math.ceil(ms/1000)); return [Math.floor(sec/3600),Math.floor(sec/60)%60,sec%60].map(x=>String(x).padStart(2,'0')).join(':'); }
  function timeLabel(date) { return date.toLocaleTimeString('ko-KR',{hour:'2-digit',minute:'2-digit',hour12:false}); }
  function render(force=false) {
    const now=new Date(), todayRows=C.rowsOn(data,now), current=C.current(todayRows,now), upcoming=C.upcoming(data,now), theme=pack();
    document.body.classList.toggle('handwritten',data.preferences.font==='handwritten');
    document.body.classList.toggle('mini',data.preferences.mini);
    $('focus-toggle').setAttribute('aria-pressed',String(data.preferences.mini));
    $('focus-toggle').setAttribute('aria-label',data.preferences.mini?'전체보기':'집중 모드');
    $('focus-toggle').querySelector('span').textContent=data.preferences.mini?'전체보기':'집중 모드';
    $('current-title').textContent=current?current[2]:'잠깐 쉬어도 괜찮아요';
    $('current-meta').textContent=current?`${current[0]}–${current[1]} · 지금 진행 중인 블록`:`${now.toLocaleDateString('ko-KR',{month:'long',day:'numeric',weekday:'long'})} · 지금은 빈 시간`;
    $('current-tip').textContent=current?current[4]:'다음 시작 시각에 맞춰 첫 페이지를 준비해요.';
    $('deadline-label').textContent=current?'마감까지':'다음 시작까지';
    $('countdown').textContent=upcoming?duration(upcoming.when-now):'—';
    const nextRow=upcoming?.starts[0];
    $('next-block').textContent=upcoming?`다음 ${C.dateKey(upcoming.when)===C.dateKey(now)?'오늘':upcoming.when.toLocaleDateString('ko-KR',{month:'numeric',day:'numeric'})} ${timeLabel(upcoming.when)} · ${nextRow?nextRow[2]:'블록 마감 후 휴식'}`:'다음 일정이 없습니다.';
    const state=C.momentState(todayRows,now);
    setArt($('main-art'),theme.id,state); $('main-art').alt=`${stateNames[state]} 중인 키이로이토리`;
    $('main-art-caption').textContent=`${theme.name} · ${stateNames[state]}`;
    setArt(document.querySelector('.brand img'),theme.id,'study');
    $('core-toggle').textContent=Object.hasOwn(data.recovery,C.dateKey(now))?'원래 시간표':'오늘 핵심만';
    updateNotificationLabel();
    const signature=`${C.dateKey(selected)}:${revision}:${now.getHours()}:${now.getMinutes()}:${C.dateKey(now)}`;
    if(force||signature!==tableSignature) { tableSignature=signature; renderTable(now); }
    if($('theme-dialog').open&&force) renderThemes();
  }
  function renderTable(now=new Date()) {
    const rows=C.rowsOn(data,selected), isToday=C.dateKey(selected)===C.dateKey(now), past=selected<C.parseDay(C.dateKey(now));
    $('table-title').textContent=isToday?'오늘 시간표':`${days[C.weekday(selected)]}요일 시간표`;
    $('row-count').textContent=`${rows.length}개 일정`;
    $('schedule-date').value=C.dateKey(selected);
    $('day-kind').textContent=Object.hasOwn(data.days,C.dateKey(selected))?'이 날짜만 변경':'주간 시간표';
    $('schedule-body').innerHTML=rows.map((row,index)=>{
      const active=isToday&&C.at(selected,row[0])<=now&&now<C.at(selected,row[1]);
      const status=active?'진행':past||(isToday&&C.at(selected,row[1])<=now)?'지남':'예정';
      return `<tr class="${active?'active':''}" data-index="${index}"><td class="time-cell">${esc(row[0])}–${esc(row[1])}</td><td><button class="title-button" data-row="${index}" aria-label="${esc(row[2])}, 자세히 보기">${esc(row[2])}</button></td><td class="instruction-cell">${esc(row[3].split(/[.!?。]/)[0])}</td><td class="status-cell">${status}</td></tr>`;
    }).join('');
    requestAnimationFrame(fitTable);
  }
  function fitTable() {
    if(data.preferences.mini) return;
    const table=$('schedule-table'), count=$('schedule-body').children.length||1;
    const available=innerHeight-table.getBoundingClientRect().top-94;
    const row=Math.max(22,Math.min(46,Math.floor((available-30)/count)));
    document.documentElement.style.setProperty('--row-height',row+'px');
    document.documentElement.style.setProperty('--cell-y',Math.max(0,Math.floor((row-22)/2))+'px');
    document.documentElement.style.setProperty('--table-font',row>=40?'18px':'16px');
  }
  function showDetail(index) {
    const row=C.rowsOn(data,selected)[index]; if(!row) return;
    $('detail-title').textContent=row[2]; $('detail-time').textContent=`${selected.toLocaleDateString('ko-KR',{month:'long',day:'numeric',weekday:'long'})} · ${row[0]}–${row[1]}`;
    $('detail-tip').textContent=row[4]||'예정 시각에 맞춰 시작해요.'; $('detail-instruction').textContent=row[3]||'실행 지침이 없습니다.';
    setArt($('detail-art'),data.preferences.theme,C.artState(row[2])); dialog('detail-dialog');
  }
  function changeDate(date) { selected=date; render(true); }
  function startCore() {
    const now=new Date(), day=C.dateKey(now), next=C.copy(data);
    try {
      if(Object.hasOwn(next.recovery,day)) {
        if(next.recovery[day]===null) delete next.days[day]; else next.days[day]=next.recovery[day];
        delete next.recovery[day];
      } else { const rows=C.coreRows(C.rowsOn(data,now),now); next.recovery[day]=next.days[day]?C.copy(next.days[day]):null; next.days[day]=rows; }
      selected=now;
      if(commit(next)) message(Object.hasOwn(next.recovery,day)?'남은 핵심 공부를 원래 시각에 남겼어요.':'핵심 모드 이전 시간표로 복원했어요.');
    } catch(error) { message(error.message); }
  }
  function loadEditor(index=0) {
    editor.index=Math.max(0,Math.min(index,editor.rows.length-1));
    const row=editor.rows[editor.index];
    ['edit-start','edit-end','edit-title','edit-instruction','edit-tip'].forEach((id,i)=>$(id).value=row[i]);
    $('editor-list').innerHTML=editor.rows.map((r,i)=>`<button type="button" data-edit-row="${i}" class="${i===editor.index?'selected':''}" aria-pressed="${i===editor.index}"><small>${esc(r[0])}–${esc(r[1])}</small><span>${esc(r[2]||'새 일정')}</span></button>`).join('');
    $('add-row').disabled=editor.rows.length>=12; $('remove-row').disabled=editor.rows.length<=1;
    $('move-up').disabled=editor.index===0; $('move-down').disabled=editor.index===editor.rows.length-1;
  }
  function flushEditor() { if(editor) editor.rows[editor.index]=['edit-start','edit-end','edit-title','edit-instruction','edit-tip'].map(id=>$(id).value); }
  function openEditor() {
    editor={day:new Date(selected),rows:C.rowsOn(data,selected),index:0};
    $('scope-week-text').textContent=`매주 ${days[C.weekday(selected)]}요일`; $('scope-day-text').textContent=`${selected.getMonth()+1}월 ${selected.getDate()}일만`;
    document.querySelector(`input[name=scope][value=${Object.hasOwn(data.days,C.dateKey(selected))?'day':'week'}]`).checked=true;
    $('copy-weekday').innerHTML=days.map((name,index)=>`<option value="${index}">${name}요일</option>`).join('');
    $('copy-weekday').value=String(C.weekday(selected)); $('editor-error').textContent=''; loadEditor(); dialog('editor-dialog');
  }
  function saveEditor(event) {
    event.preventDefault(); flushEditor();
    try {
      const rows=C.validateRows(editor.rows), next=C.copy(data), scope=document.querySelector('input[name=scope]:checked').value;
      if(scope==='week') next.week[String(C.weekday(editor.day))]=rows;
      else { next.days[C.dateKey(editor.day)]=rows; delete next.recovery[C.dateKey(editor.day)]; }
      if(commit(next)) { $('editor-dialog').close(); message('시간표를 저장했어요.'); }
    } catch(error) { $('editor-error').textContent=error.message; }
  }
  function renderThemes() {
    const selectedPack=pack();
    $('theme-options').innerHTML=Object.values(packs()).map(p=>`<button data-theme="${esc(p.id)}" aria-pressed="${p.id===selectedPack.id}">${esc(p.name)}</button>`).join('');
    document.querySelector(`input[name=font][value=${data.preferences.font}]`).checked=true;
    $('sound-enabled').checked=data.preferences.sound;
    updatePreview();
  }
  function updatePreview() {
    const selectedPack=pack(); setArt($('theme-preview-art'),selectedPack.id,previewState);
    $('theme-preview-caption').textContent=`${selectedPack.name} · ${stateNames[previewState]}`;
    document.querySelectorAll('[data-state]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.state===previewState)));
  }
  function openDatabase() {
    return new Promise((resolve,reject)=>{
      if(!window.indexedDB) {reject(Error('이 브라우저는 추가 이미지 저장을 지원하지 않습니다.'));return;}
      const request=indexedDB.open('kiiroitori-art-v1',1);
      request.onupgradeneeded=()=>request.result.createObjectStore('packs',{keyPath:'id'});
      request.onsuccess=()=>resolve(request.result); request.onerror=()=>reject(request.error);
      request.onblocked=()=>reject(Error('다른 앱 탭을 닫고 새로고침해 주세요.'));
    });
  }
  function readPacks() { return new Promise((resolve,reject)=>{const request=db.transaction('packs').objectStore('packs').getAll(); request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);}); }
  function savePacks(next) {
    return new Promise((resolve,reject)=>{
      if(!db) {reject(Error('추가 이미지를 저장할 수 없습니다. 브라우저의 파일 접근·저장 권한을 확인해 주세요.'));return;}
      const transaction=db.transaction('packs','readwrite'), store=transaction.objectStore('packs'); store.clear(); Object.values(next).forEach(p=>store.put(p));
      transaction.oncomplete=resolve; transaction.onerror=()=>reject(transaction.error); transaction.onabort=()=>reject(transaction.error||Error('이미지 저장이 중단됐습니다.'));
    });
  }
  function validatePack(value) {
    if(!value||typeof value.id!=='string'||!/^[a-z0-9][a-z0-9_-]{0,63}$/.test(value.id)||typeof value.name!=='string'||!value.name.trim()||value.name.length>40) throw Error('팩 ID·이름을 확인해 주세요.');
    const images={};
    for(const state of ['study','rest','finish']) {
      const source=value.images?.[state];
      if(typeof source!=='string'||!/^data:image\/png;base64,[A-Za-z0-9+/]+=*$/.test(source)||source.length>7000000) throw Error('공부·휴식·마감에 각각 5MB 이하 PNG가 필요합니다.');
      images[state]=source;
    }
    return {id:value.id,name:value.name.trim(),images};
  }
  function readDataUrl(file) { return new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=()=>reject(Error('이미지 파일을 읽지 못했습니다.'));reader.readAsDataURL(file);}); }
  async function checkPng(source) {
    const header=atob(source.split(',')[1]).slice(0,8);
    if(header!=='\x89PNG\r\n\x1a\n') throw Error('PNG 형식의 이미지를 선택해 주세요.');
    await new Promise((resolve,reject)=>{const image=new Image();image.onload=()=>image.naturalWidth*image.naturalHeight<=16777216?resolve():reject(Error('이미지 크기는 4,096×4,096 이하로 준비해 주세요.'));image.onerror=()=>reject(Error('읽을 수 없는 PNG입니다.'));image.src=source;});
  }
  async function importPack(files) {
    try {
      const list=[...files], manifest=list.find(file=>file.name==='manifest.json');
      if(!manifest||manifest.size>65536) throw Error('manifest.json과 PNG 세 장이 있는 팩 폴더를 선택해 주세요.');
      const definition=JSON.parse(await manifest.text()), folder=manifest.webkitRelativePath.slice(0,-manifest.name.length), images={};
      for(const state of ['study','rest','finish']) {
        const filename=definition.images?.[state];
        if(typeof filename!=='string'||filename.includes('..')||filename.startsWith('/')||!filename.toLowerCase().endsWith('.png')) throw Error('manifest.json의 이미지 경로를 확인해 주세요.');
        const file=list.find(item=>item.webkitRelativePath===folder+filename);
        if(!file||file.size>5000000) throw Error(`${stateNames[state]} PNG를 찾지 못했거나 5MB를 넘습니다.`);
        // FileReader MIME is normalized after validating the PNG signature.
        images[state]=(await readDataUrl(file)).replace(/^data:[^;]*;/,'data:image/png;'); await checkPng(images[state]);
      }
      const p=validatePack({...definition,images}), next={...customPacks,[p.id]:p};
      if(Object.keys(next).length>12) throw Error('추가 팩은 최대 12개까지 저장할 수 있어요.');
      await savePacks(next); customPacks=next;
      document.querySelectorAll('img[data-art]').forEach(img=>delete img.dataset.art);
      preference('theme',p.id); renderThemes(); message(`${p.name} 팩을 추가했어요.`);
    } catch(error) { message(error.message||'팩을 읽지 못했습니다.'); }
    $('pack-file').value='';
  }
  function download(name,contents,type) {
    const href=URL.createObjectURL(new Blob([contents],{type})), link=document.createElement('a'); link.href=href; link.download=name; link.click(); setTimeout(()=>URL.revokeObjectURL(href),5000);
  }
  function exportJson() { download(`키이로이토리_백업_${C.dateKey(new Date())}.json`,JSON.stringify({...data,themes:Object.values(customPacks)},null,2),'application/json'); message('백업 파일을 저장했어요.'); }
  async function reviewImport(file) {
    if(!file) return;
    $('backup-error').textContent=''; $('import-review').hidden=true; pendingImport=null;
    try {
      if(file.size>50000000) throw Error('백업 파일은 50MB 이하로 선택해 주세요.');
      const raw=JSON.parse(await file.text()), next=C.validateData(raw), themes={};
      if(raw.themes!==undefined&&!Array.isArray(raw.themes)) throw Error('에셋 팩 목록을 확인해 주세요.');
      if((raw.themes||[]).length>12) throw Error('추가 팩은 최대 12개입니다.');
      for(const value of raw.themes||[]) { const p=validatePack(value); for(const source of Object.values(p.images)) await checkPng(source); themes[p.id]=p; }
      pendingImport={data:next,themes};
      $('import-summary').textContent=`변경한 요일 ${Object.keys(next.week).length}개 · 날짜별 시간표 ${Object.keys(next.days).length}개 · 추가 캐릭터 팩 ${Object.keys(themes).length}개. 현재 내용을 바꾸려면 아래 버튼을 누르세요.`;
      $('import-review').hidden=false;
    } catch(error) { $('backup-error').textContent=error.message; }
    $('backup-file').value='';
  }
  async function confirmImport() {
    if(!pendingImport) return;
    try {
      const oldPacks=customPacks, nextPacks={...customPacks,...pendingImport.themes};
      if(Object.keys(nextPacks).length>12) throw Error('기존 팩과 합치면 12개를 넘습니다.');
      if(Object.keys(pendingImport.themes).length) await savePacks(nextPacks);
      customPacks=nextPacks;
      if(!commit(pendingImport.data)) {customPacks=oldPacks; if(Object.keys(pendingImport.themes).length) await savePacks(oldPacks); return;}
      document.querySelectorAll('img[data-art]').forEach(img=>delete img.dataset.art);
      render(true); pendingImport=null; $('import-review').hidden=true; $('backup-dialog').close(); message('백업을 가져왔어요.');
    } catch(error) { $('backup-error').textContent=error.message; }
  }
  function exportMarkdown() {
    const pipe=x=>x.replace(/\|/g,'\\|').replace(/\n/g,'<br>');
    const section=(name,rows)=>`## ${name}\n\n| 시간 | 일정 | 실행 지침 | 정리 팁 |\n|---|---|---|---|\n`+rows.map(r=>`| ${r[0]}–${r[1]} | ${r.slice(2).map(pipe).join(' | ')} |`).join('\n');
    const text='# 키이로이토리 · 저장된 시간표\n\n'+days.map((day,index)=>section(`${day}요일`,data.week[index]||window.DEFAULT_WEEK[index])).concat(Object.entries(data.days).map(([day,rows])=>section(`${day} · 이 날짜만`,rows))).join('\n\n');
    download('키이로이토리_시간표.md',text,'text/markdown;charset=utf-8');
  }
  function updateNotificationLabel() { const enabled=data.preferences.notifications&&window.Notification?.permission==='granted'; $('notification-enable').querySelector('span').textContent=enabled?'시스템 알림 켜짐':'알림 켜기'; }
  async function enableNotifications() {
    try {
      if(!window.Notification||!window.isSecureContext) {message('이 환경에서는 화면 알림을 사용합니다. 시스템 알림은 브라우저 지원과 권한이 필요해요.');return;}
      if(Notification.permission==='granted'&&data.preferences.notifications) { preference('notifications',false); message('시스템 알림을 껐어요. 화면 알림은 유지됩니다.'); return; }
      const permission=await Notification.requestPermission();
      if(permission==='granted') {preference('notifications',true);message('시스템 알림을 켰어요. 앱을 열어 두세요.');}
      else message('시스템 알림이 허용되지 않았어요. 앱 안의 화면 알림은 계속 표시됩니다.');
    } catch(error) {message('이 브라우저에서는 화면 알림을 사용합니다.');}
  }
  function prepareAudio() {
    try { const Audio=window.AudioContext||window.webkitAudioContext; if(Audio&&!audio) audio=new Audio(); audio?.resume().catch(()=>{}); } catch(error) { /* Screen alarms remain available. */ }
  }
  function beep() {
    if(!data.preferences.sound||!audio||audio.state!=='running') return;
    for(const offset of [0,.25]) {const oscillator=audio.createOscillator(), gain=audio.createGain();oscillator.frequency.value=660;oscillator.connect(gain);gain.connect(audio.destination);gain.gain.setValueAtTime(.08,audio.currentTime+offset);gain.gain.exponentialRampToValueAtTime(.001,audio.currentTime+offset+.18);oscillator.start(audio.currentTime+offset);oscillator.stop(audio.currentTime+offset+.2);}
  }
  function showAlarm(title,text,state='study',sound=false) {
    $('alarm-title').textContent=title; $('alarm-message').textContent=text; setArt($('alarm-art'),data.preferences.theme,state);
    const another=document.querySelector('dialog[open]:not(#alarm-dialog)');
    if(another) { queuedAlarm={title,text,state};message(text); } else dialog('alarm-dialog');
    if(sound) beep();
  }
  function boundaryAlarm(event) {
    const next=event.starts[0], ended=event.ends[0];
    const title=next?`${next[2]} 시작`:'블록 마감';
    const text=[ended?`${ended[2]} 마감. 미완료는 표시만 남겨요.`:'',next?`${next[0]}–${next[1]} · ${next[4]}`:'다음 시작 시각까지 잠깐 쉬어요.'].filter(Boolean).join('\n\n');
    showAlarm(title,text,next?C.artState(next[2]):'finish',true);
    if(data.preferences.notifications&&window.Notification?.permission==='granted') {try{new Notification(title,{body:text,tag:'kiiroitori-boundary'});}catch(error){/* In-page alarm already shown. */}}
  }
  function tick() {const now=new Date(), event=C.latestCrossed(data,lastTick,now);lastTick=now;render();if(event) boundaryAlarm(event);}

  read();
  document.querySelectorAll('[data-close]').forEach(button=>button.addEventListener('click',()=>button.closest('dialog').close()));
  document.querySelectorAll('dialog').forEach(modal=>modal.addEventListener('close',()=>{
    modal.querySelectorAll('.dialog-notice').forEach(el=>el.remove());
    if(queuedAlarm&&!document.querySelector('dialog[open]')) {const alarm=queuedAlarm;queuedAlarm=null;showAlarm(alarm.title,alarm.text,alarm.state);}
  }));
  document.addEventListener('pointerdown',prepareAudio,{once:true}); document.addEventListener('keydown',prepareAudio,{once:true});
  $('home-link').addEventListener('click',event=>{event.preventDefault();selected=new Date();preference('mini',false);window.scrollTo({top:0,behavior:'auto'});});
  $('focus-toggle').addEventListener('click',()=>preference('mini',!data.preferences.mini));
  $('previous-day').addEventListener('click',()=>changeDate(C.shift(selected,-1))); $('next-day').addEventListener('click',()=>changeDate(C.shift(selected,1))); $('today').addEventListener('click',()=>changeDate(new Date()));
  $('schedule-date').addEventListener('change',()=>{try{changeDate(C.parseDay($('schedule-date').value));}catch(error){message(error.message);render(true);}});
  $('schedule-body').addEventListener('click',event=>{const row=event.target.closest('tr[data-index]');if(row)showDetail(Number(row.dataset.index));});
  $('start-now').addEventListener('click',()=>{const now=new Date(), row=C.current(C.rowsOn(data,now),now);showAlarm(row?'지금 할 첫 행동':'다음 공부를 준비해요',row?`${row[2]} · ${row[4]}\n\n${row[3]}`:$('next-block').textContent,row?C.artState(row[2]):'rest');});
  $('core-toggle').addEventListener('click',startCore);
  $('edit-open').addEventListener('click',openEditor); $('editor-form').addEventListener('submit',saveEditor);
  $('editor-list').addEventListener('click',event=>{const button=event.target.closest('[data-edit-row]');if(button){flushEditor();loadEditor(Number(button.dataset.editRow));}});
  $('add-row').addEventListener('click',()=>{flushEditor();if(editor.rows.length>=12)return;const end=editor.rows.at(-1)[1], total=Number(end.slice(0,2))*60+Number(end.slice(3))+30;editor.rows.push([end,total<1440?`${String(Math.floor(total/60)).padStart(2,'0')}:${String(total%60).padStart(2,'0')}`:'23:59','새 일정','','']);loadEditor(editor.rows.length-1);});
  $('remove-row').addEventListener('click',()=>{if(editor.rows.length<=1)return;editor.rows.splice(editor.index,1);loadEditor(editor.index);});
  function moveRow(amount) {flushEditor();const other=editor.index+amount;if(other<0||other>=editor.rows.length)return;[editor.rows[editor.index],editor.rows[other]]=[editor.rows[other],editor.rows[editor.index]];loadEditor(other);}
  $('move-up').addEventListener('click',()=>moveRow(-1)); $('move-down').addEventListener('click',()=>moveRow(1));
  $('copy-day').addEventListener('click',()=>{editor.rows=C.copy(data.week[$('copy-weekday').value]||window.DEFAULT_WEEK[$('copy-weekday').value]);loadEditor();});
  $('restore-default').addEventListener('click',()=>{editor.rows=C.copy(window.DEFAULT_WEEK[C.weekday(editor.day)]);loadEditor();});
  $('theme-open').addEventListener('click',()=>{renderThemes();dialog('theme-dialog');});
  $('theme-options').addEventListener('click',event=>{const button=event.target.closest('[data-theme]');if(button)preference('theme',button.dataset.theme);});
  document.querySelectorAll('[data-state]').forEach(button=>button.addEventListener('click',()=>{previewState=button.dataset.state;updatePreview();}));
  document.querySelectorAll('input[name=font]').forEach(input=>input.addEventListener('change',()=>preference('font',input.value)));
  $('sound-enabled').addEventListener('change',()=>preference('sound',$('sound-enabled').checked));
  $('pack-import').addEventListener('click',()=>$('pack-file').click()); $('pack-file').addEventListener('change',()=>importPack($('pack-file').files));
  $('backup-open').addEventListener('click',()=>{pendingImport=null;$('import-review').hidden=true;$('backup-error').textContent='';dialog('backup-dialog');});
  $('export-json').addEventListener('click',exportJson); $('export-markdown').addEventListener('click',exportMarkdown);
  $('import-json').addEventListener('click',()=>$('backup-file').click()); $('backup-file').addEventListener('change',()=>reviewImport($('backup-file').files[0]));
  $('import-confirm').addEventListener('click',confirmImport); $('import-cancel').addEventListener('click',()=>{pendingImport=null;$('import-review').hidden=true;});
  $('notification-enable').addEventListener('click',enableNotifications);
  $('credits-open').addEventListener('click',()=>{$('font-license').textContent=window.FONT_LICENSE||'프리텐다드: assets/fonts/OFL.txt\n박다현체: assets/FONT_LICENSE.txt';dialog('credits-dialog');});
  addEventListener('resize',fitTable); document.addEventListener('visibilitychange',()=>{if(!document.hidden)tick();}); addEventListener('pageshow',tick);
  document.addEventListener('keydown',event=>{if(!document.querySelector('dialog[open]')&&!['INPUT','TEXTAREA','SELECT'].includes(event.target.tagName)){if(event.key==='ArrowLeft')changeDate(C.shift(selected,-1));if(event.key==='ArrowRight')changeDate(C.shift(selected,1));if(event.ctrlKey&&event.key.toLowerCase()==='e'){event.preventDefault();openEditor();}}});
  window.StudyPlan.mount({getData:()=>data,commit,message,dialog,esc});
  render(true);setInterval(tick,1000);
  (async()=>{try{db=await openDatabase();for(const value of await readPacks()){const p=validatePack(value);customPacks[p.id]=p;}render(true);}catch(error){ /* Built-in themes do not require IndexedDB. */ }})();
})();
