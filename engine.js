/* Schedule rules, independent of browser rendering. Monday is weekday 0. */
(function (global) {
  'use strict';
  const copy = value => JSON.parse(JSON.stringify(value));
  const dateKey = date => `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
  const weekday = date => (date.getDay()+6)%7;
  const at = (date, time) => { const [h,m]=time.split(':').map(Number); return new Date(date.getFullYear(), date.getMonth(), date.getDate(), h,m); };
  const shift = (date, amount) => new Date(date.getFullYear(),date.getMonth(),date.getDate()+amount,12);
  function parseDay(key) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(key)) throw Error('날짜 형식이 올바르지 않습니다.');
    const [y,m,d]=key.split('-').map(Number), value=new Date(y,m-1,d,12);
    if(dateKey(value)!==key) throw Error('존재하지 않는 날짜입니다.');
    return value;
  }
  function validateRows(rows) {
    if (!Array.isArray(rows)||!rows.length||rows.length>12) throw Error('일정은 1~12개로 작성해 주세요.');
    let previous='';
    return rows.map((row,index)=>{
      if(!Array.isArray(row)||row.length!==5||row.some(x=>typeof x!=='string')) throw Error(`${index+1}번째 일정의 항목을 확인해 주세요.`);
      const clean=row.map(x=>x.trim()), [start,end,title,instruction,tip]=clean;
      if(![start,end].every(x=>/^([01]\d|2[0-3]):[0-5]\d$/.test(x))) throw Error(`${index+1}번째 시간을 09:30 형식으로 입력해 주세요.`);
      if(start>=end) throw Error(`${index+1}번째 종료는 시작보다 늦어야 합니다.`);
      if(previous&&start<previous) throw Error(`${index+1}번째 일정이 앞 일정과 겹칩니다. 시작 순서로 정렬해 주세요.`);
      if(!title||title.length>50) throw Error(`${index+1}번째 일정 이름은 1~50자로 입력해 주세요.`);
      if(instruction.length>3000||tip.length>1000) throw Error('실행 지침은 3,000자, 팁은 1,000자 이내로 입력해 주세요.');
      previous=end; return clean;
    });
  }
  function fresh() { return {version:4,week:{},days:{},recovery:{},preferences:{font:'pretendard',theme:'library',sound:true,notifications:false,mini:false}}; }
  function validateData(input) {
    if(!input||![2,4].includes(input.version)) throw Error('이 앱의 백업 파일 또는 v2·v3의 settings.json을 선택해 주세요.');
    const data=fresh();
    for(const name of ['week','days','recovery']) {
      if(input[name]!==undefined&&(typeof input[name]!=='object'||input[name]===null||Array.isArray(input[name]))) throw Error('시간표 데이터 형식을 확인해 주세요.');
      for(const [key,value] of Object.entries(input[name]||{})) {
        if(name==='week') { if(!/^[0-6]$/.test(key)) throw Error('요일 데이터가 올바르지 않습니다.'); }
        else parseDay(key);
        data[name][key]=name==='recovery'&&value===null?null:validateRows(value);
      }
    }
    const prefs=input.preferences||{};
    if(prefs.font!==undefined) { if(!['pretendard','handwritten'].includes(prefs.font)) throw Error('글꼴 설정이 올바르지 않습니다.'); data.preferences.font=prefs.font; }
    if(prefs.theme!==undefined) { if(typeof prefs.theme!=='string'||!/^([a-z0-9][a-z0-9_-]{0,63})$/.test(prefs.theme)) throw Error('캐릭터 설정이 올바르지 않습니다.'); data.preferences.theme=prefs.theme; }
    for(const key of ['sound','notifications','mini']) if(prefs[key]!==undefined) { if(typeof prefs[key]!=='boolean') throw Error('설정 값이 올바르지 않습니다.'); data.preferences[key]=prefs[key]; }
    if(prefs.studyPlan!==undefined) {
      const p=prefs.studyPlan;
      if(!p||typeof p!=='object'||!['start','basic','retrieve','timed','final'].includes(p.stage)||!Number.isInteger(p.level)||p.level<0||p.level>3||!['A','B'].includes(p.cycle)||typeof p.qualified!=='boolean') throw Error('학습 계획 설정이 올바르지 않습니다.');
      data.preferences.studyPlan={stage:p.stage,level:p.level,cycle:p.cycle,qualified:p.qualified};
    }
    return data;
  }
  const rowsOn = (data,date) => copy(data.days[dateKey(date)]||data.week[String(weekday(date))]||global.DEFAULT_WEEK[String(weekday(date))]);
  const current = (rows,now) => rows.find(row=>at(now,row[0])<=now&&now<at(now,row[1]));
  const artState = title => /정리|정산|마감|종료/.test(title)?'finish':/휴식|점심|식사|알바|귀가/.test(title)?'rest':'study';
  const isLongStudySession = row => {
    if(!row||artState(row[2])!=='study') return false;
    const minutes = time => Number(time.slice(0,2))*60+Number(time.slice(3));
    return minutes(row[1])-minutes(row[0])>=60;
  };
  const momentState = (rows,now) => { const row=current(rows,now); return row?artState(row[2]):rows.length&&now>=at(now,rows.at(-1)[1])?'finish':'rest'; };
  function eventsOn(data,day) {
    const events=new Map();
    for(const row of rowsOn(data,day)) for(const [kind,time] of [['starts',row[0]],['ends',row[1]]]) {
      const when=at(day,time), key=+when;
      if(!events.has(key)) events.set(key,{when,starts:[],ends:[]});
      events.get(key)[kind].push(row);
    }
    return [...events.values()].sort((a,b)=>a.when-b.when);
  }
  function upcoming(data,now) {
    for(let offset=0;offset<8;offset++) { const found=eventsOn(data,shift(now,offset)).find(e=>e.when>now); if(found) return found; }
    return null;
  }
  function latestCrossed(data,last,now) {
    if(now<=last) return null;
    // Only the newest boundary is shown after resuming a suspended browser.
    let latest=null;
    for(const day of [shift(now,-1),now]) for(const event of eventsOn(data,day)) if(event.when>last&&event.when<=now) latest=event;
    return latest;
  }
  function coreRows(rows,now) {
    const names=['영어 기초','영어 독해','영어 시간','영어 실전','영어 단어','영어 약점','전공 개념','전공 백지 복습','전공 당일 기출','전공 이전 오답','전공 약점','실전 모의','모의 오답 분석','이전 오답 재시험','야간 복습','영어 주간 복습','전공 주간 백지 복습','평일 미완료 보충'];
    const result=rows.filter(row=>at(now,row[1])>now&&names.some(name=>row[2].includes(name)));
    if(!result.length) throw Error('오늘 남은 핵심 공부가 없어요. 내일 첫 공부를 준비해 주세요.');
    return result;
  }
  global.StudyCore={copy,dateKey,weekday,at,shift,parseDay,validateRows,validateData,fresh,rowsOn,current,artState,isLongStudySession,momentState,eventsOn,upcoming,latestCrossed,coreRows};
})(typeof window==='undefined'?globalThis:window);
