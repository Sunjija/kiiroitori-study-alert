/* Stage selection changes weekly rows only. Workload never increases automatically. */
(function (global) {
  'use strict';
  const C=global.StudyCore, original=C.copy(global.DEFAULT_WEEK);
  const levels=[{name:'현재 분량',extra:0},{name:'첫 증량',extra:220},{name:'두 번째 증량',extra:460},{name:'세 번째 증량',extra:700}];
  const stages=[
    {id:'start',name:'기초 출발',period:'2026.09.28–10.11',goal:'현재 분량을 유지하며 영어 문장 구조와 전공 용어에 익숙해지기',tasks:['영어: 품사·문장 성분·기본 동사 구조. 단어는 복습부터 시작합니다.','전공: 기본 강의와 해설 예제를 연결합니다. 아직 배우지 않은 기출은 진도 평가에 넣지 않습니다.','국어는 정답 근거 찾기, 한능검은 시대 흐름부터 시작합니다.'],check:'2주 동안 계획한 공부 블록의 약 80% 이상을 소화하고, 다음 날 복습이 계속 밀리지 않으면 첫 증량을 검토합니다.'},
    {id:'basic',name:'기본 1회독',period:'2026.10.12–2027.01 말 목표',goal:'기본 강의 1회독과 단원별 기출을 함께 진행하기',tasks:['영어: 기초 문법 → 구문 → 짧은 지문으로 확장하고 단어를 계속 복습합니다.','전공: 각 과목 한 기본 강좌를 중심으로 진행하고, 회상·해설 예제·배운 범위의 기출을 연결합니다.','강의가 길면 기출 블록의 앞 20~30분을 다음 강의에 쓰고, 문제 적용 시간을 남깁니다.','한능검: 11월 28일을 첫 목표로 검토합니다. 준비가 부족하면 2027년 공고된 회차로 옮겨 재응시 기회를 남깁니다.'],check:'남은 강의 재생시간 ÷ 주간 강의 시간으로 완료일을 계산합니다. 1월 말은 목표이며 실제 강좌 분량에 따라 조정합니다.'},
    {id:'retrieve',name:'기출 반복',period:'2027.02–03월 초안',goal:'기출을 다시 풀며 틀린 이유와 개념의 차이를 설명하기',tasks:['영어: 독해·구문을 이어가며 막힌 문장과 오답을 재시험합니다.','전공: 전 범위 기출 1회독을 마무리하고 헷갈린 선지를 다시 풉니다. 기본 진도가 남았으면 개념 블록에서 마무리합니다.','국어: 정답·오답의 근거를 확인합니다. 익숙한 기출과 처음 보는 문제의 결과를 따로 기록합니다.'],check:'회독 횟수보다 답을 가리고 근거를 설명할 수 있는지 확인합니다. 처음 보는 문제의 정확도도 따로 봅니다.'},
    {id:'timed',name:'시간 연습',period:'2027.04월–필기 8주 전 초안',goal:'25문항 세트로 정확도와 시간 배분을 조정하기',tasks:['과목별 25문항에 시간을 재고 정답률·미응답 문항·소요시간을 함께 기록합니다.','전 범위 실전 연습 주 1회를 시도하되 기존 문제 풀이 블록을 대체합니다.','한능검 취득 뒤의 시간은 영어와 전공 약점 보완에 사용합니다.'],check:'처음 보는 세트의 정확도와 시간을 함께 비교합니다. 최종 두 단계의 날짜는 실제 필기일에 맞춰 조정합니다.'},
    {id:'final',name:'실전·마무리',period:'필기 8주 전–시험일',goal:'화·목 실전 모의와 오답 분석으로 시험 운영을 안정시키기',tasks:['화·목 10:00에 4과목 × 25문항, 총 100문항을 110분 동안 풉니다. 실제 시험 시작 시각은 지원 지역 공고를 따릅니다.','모의와 분석은 기존 블록을 대체합니다. 지식 부족·독해 착오·시간 부족을 나누어 약점 시간에 반영합니다.','마지막 2주는 표시한 오답·단어와 최신 교재의 정정 사항을 확인하고, 공부량을 더 늘리지 않습니다.'],check:'처음 보는 모의 결과 3회 정도로 약점과 풀이 순서를 조정합니다. 지원 지역이 정해지기 전에는 합격 목표 점수를 임의로 확정하지 않습니다.'}
  ];
  const mins=t=>Number(t.slice(0,2))*60+Number(t.slice(3));
  const stamp=n=>`${String(Math.floor(n/60)).padStart(2,'0')}:${String(n%60).padStart(2,'0')}`;
  const isStudy=r=>!/알바|휴식|점심|식사|귀가|정리|정산|준비/.test(r[2])||r[2]==='한능검 준비';
  const minutes=rows=>rows.filter(isStudy).reduce((sum,r)=>sum+mins(r[1])-mins(r[0]),0);
  const label=n=>`${Math.floor(n/60)}시간${n%60?' '+n%60+'분':''}`;
  function makeWeek(stage='start',level=0,cycle='A',qualified=false) {
    if(!stages.some(s=>s.id===stage)||!Number.isInteger(level)||!levels[level]||!['A','B'].includes(cycle)||typeof qualified!=='boolean') throw Error('학습 계획 선택을 확인해 주세요.');
    const week=C.copy(original);
    // Evening study is added after dinner. The final level reaches late evening
    // on Tue/Thu; 23:30–01:00 remains an optional light-review window.
    const evening=[[0,0,0,0,0,0,0],[55,55,55,55,0,0,0],[90,90,90,90,60,40,0],[120,240,100,240,0,0,0]][level];
    for(let d=0;d<7;d++) {
      const baseMajor=['행정법','행정법','행정학','행정법','행정학'][d], major=cycle==='A'?baseMajor:baseMajor==='행정법'?'행정학':'행정법';
      week[d]=week[d].map(r=>{
        const title=r[2];
        if(title==='영어 기초') {
          r[2]=['start','basic'].includes(stage)?'영어 기초':stage==='retrieve'?'영어 독해·구문':stage==='timed'?'영어 시간 연습':'영어 실전·오답';
          r[3]=['start','basic'].includes(stage)?'단어 복습 20분 + 기초 문법·문장 구조 + 짧은 문장·지문 적용. 새 단어는 우선 10~20개에서 다음 날 기억 정도에 맞춰 조절한다. 강의를 멈춘 뒤 주어·동사와 수식 관계를 직접 찾는다.':'단어 복습 20분 + 독해·구문 적용. 처음 보는 문제의 정답 근거와 소요시간을 기록하고, 틀린 문장 구조를 다시 설명한다.';
        } else if(title==='전공 개념 입력') {
          r[2]=['start','basic'].includes(stage)?title:'전공 개념·약점 보완';
          r[3]=`${major}. `+(['start','basic'].includes(stage)?'한 기본 강좌를 중심으로 진행하고 끝 10~15분에는 예시를 확인한다. 처음에는 용어의 뜻과 한 가지 사례부터 잡는다. 모르는 부분은 표시하고 마감에 영상 정지.':'기출·모의에서 설명하지 못한 개념만 교재와 필요한 강의 구간으로 보완한다. 아직 기본 진도가 남았다면 그 범위를 진행한다.');
        } else if(title==='전공 백지 복습·키워드 추출') {
          r[3]=`${major}. 책을 덮고 핵심 3~5개를 10분 동안 떠올린 뒤 교재와 대조·수정한다. 행정법은 요건·효과·예시, 행정학은 정의·비교 기준을 쓴다. 노트를 꾸미며 시간을 늘리지 않는다.`;
        } else if(title==='전공 당일 기출') {
          r[3]=`${major}. `+(['start','basic'].includes(stage)?'오늘 배운 범위의 해설 예제와 기출을 연결한다. 기본 강의가 길면 앞 20~30분만 다음 강의에 쓰고, 나머지는 회상·예제·문제 적용에 남긴다. 첫 학습에서는 문제 수와 풀이 속도를 강제하지 않는다. 마지막에는 헷갈린 선지 3개를 설명한다.':stage==='retrieve'?'단원별 기출과 표시한 선지를 다시 풀고 정답·오답의 근거를 설명한다. 처음 보는 문제의 결과는 이미 풀었던 기출과 따로 기록한다.':'25문항 세트 또는 전공 약점 문제를 시간 안에 풀고 분석한다. 틀린 이유를 지식 부족·판단 착오·시간 부족으로 나눈다.');
        } else if(title==='누적 전공 복습') {
          r[3]=`${major}와 반대 전공의 최근 약점을 다시 떠올린다. 전날·며칠 전·지난주 표시한 개념과 선지를 답을 가리고 설명한 뒤 확인한다. 정답 번호 암기와 개념 이해를 구분한다.`;
        } else if(title==='영어 적용') {
          r[3]=['start','basic'].includes(stage)?'오전 구문·문법을 짧은 지문 1~2개에 적용한다. 아직 지문이 어렵다면 문장 3~5개의 구조와 의미를 확인한다.':'처음 보는 독해·문법 문제를 풀고 근거를 확인한다. 실전 단계에서는 모의에서 드러난 영어 약점을 우선한다.';
        } else if(title.includes('한능검')) {
          if(qualified) {
            r[2]=d===0||d===4?'전공 이전 오답':d===5?'영어·전공 약점':'영어 약점 복습';
            r[3]=d===0||d===4?`${major}의 이전 오답을 답을 가리고 다시 설명한다.`:d===5?'이번 주 영어 또는 전공의 가장 약한 범위를 재시험한다.':'기억나지 않은 영어 단어·구문과 독해 오답을 다시 풀고 설명한다.';
          } else r[3]='한능검 심화: 시대 흐름 → 관련 기출 → 오답 확인. 2026년 11월 28일을 첫 목표로 검토하되 토요일 알바 조정과 준비 상태를 확인한다. 실제 3급 기준은 60점 이상. 학습상 여유 목표는 처음 보는 기출 3회 연속 70점 이상이다.';
        } else if(title.includes('국어')) {
          r[3]='독해·추론과 필요한 어휘·문법 문제를 풀고 정답 근거와 오답 이유를 설명한다. 기초 단계에서는 문제 수보다 근거 확인에 집중하고, 이후 처음 보는 문제의 시간도 기록한다.';
        } else if(title==='전공 주간 백지 복습') {
          r[3]='행정법 25분 + 행정학 25분: 핵심과 헷갈리는 차이를 책 없이 설명하고 확인한다. 마지막 10분은 다시 볼 약점을 고른다.';
        } else if(title==='평일 미완료 보충') {
          r[3]='우선순위가 높은 미완료 최대 2개만 처리한다. 모두 끝났으면 가장 약한 전공을 재시험한다. 밀린 분량 전체를 일요일에 몰아넣지 않는다.';
        } else if(title==='주간 정산·다음 주 조정') {
          r[3]='예정 블록과 실제 수행 시간을 구분해 기록한다. 다음 날 기억 정도·남은 강의 재생시간을 확인한다. 2주 안정적으로 수행한 뒤 다음 공부량을 선택한다. 필요하면 다음 주 A/B 전공 배치를 맞바꾼다.';
        }
        if(isStudy(r)) r[4]=`${r[0]}에 첫 문장·문제부터 시작! ${r[1]}에 마감하고 미완료는 표시만.`;
        else if(/정리|정산/.test(r[2])) r[4]=`${r[1]}에 종료! 다음 첫 페이지를 준비해.`;
        else r[4]=`${r[1]}에 다음 블록으로 이동할 준비!`;
        return r;
      });
      if(stage==='final'&&(d===1||d===3)) {
        const end=18*60+10;
        week[d]=[
          ['09:30','09:55','영어 단어 재시험','전날 틀린 단어·구문을 재시험한다. 09:55부터 5분은 시험지와 답안지를 준비한다.','25분 확인 뒤 모의 준비!'],
          ['10:00','11:50','실전 모의 100문항','국어·영어·행정법·행정학 각 25문항. 총 110분에 답안 표시까지 마친다. 처음 보는 모의 세트를 쓴다. 실제 시험 시각은 지역 공고를 따른다.','11시 50분에 답안지까지 마감!'],
          ['11:50','12:10','휴식','자리에서 일어나 잠깐 쉬고 채점할 준비를 한다.','12시 10분 채점 시작.'],
          ['12:10','12:50','모의 오답 분석 1','과목별 점수·소요시간·못 푼 문제·오답 유형을 기록한다.','점수와 시간부터 기록해.'],
          ['12:50','13:40','점심·휴식','식사하고 잠깐 움직인다. 오후에는 표시한 오답을 분석한다.','13시 40분에 오답 확인.'],
          ['13:40','15:10','모의 오답 분석 2','정답 근거를 교재·해설로 확인한다. 설명하지 못한 개념과 문장 구조를 고르고 재시험 항목을 표시한다.','오답을 줄일 근거 한 줄!'],
          ['15:10','15:25','휴식','잠깐 움직이고 영어 약점 문제를 준비한다.','15시 25분 복귀.'],
          ['15:25','16:25','영어 약점 복습','모의·이전 오답의 단어·구문·독해를 다시 설명한다. 한능검 미취득 시 이 시간 일부를 한능검에 배분한다.','단어와 문장 구조부터 확인!'],
          ['16:25','17:20','전공 약점 복습','행정법·행정학 오답 중 근거를 설명하지 못한 범위를 다시 확인한다.','답을 가리고 이유를 말해.'],
          ['17:20','18:10','국어 약점 복습','독해·추론 오답의 정답 근거와 선택지의 오류를 찾아 설명한다.','지문 속 근거를 찾아.'],
          [stamp(end),stamp(end+10),'책상 정리·내일 준비','다음 공부일 첫 페이지를 펼치고 마친다. 밤늦게 밀린 분량을 채우지 않는다.','다음 첫 행동 한 줄만 적고 종료!']
        ];
      }
      if(evening[d]) {
        const last=week[d].at(-1), start=Math.max(mins(last[1]),19*60+30), finish=start+evening[d];
        const night=['야간 복습·적용',`${d===1||d===3?'전공·기출 오답':'영어·전공 누적 복습'}을 답을 가리고 설명한 뒤 확인한다. ${finish>=23*60+30?'23시 30분 이후에는 새 강의 대신 FSRS/Anki, 단어·구문, 표시한 오답처럼 가벼운 복습만 선택한다.':'저녁 복습은 오늘 배운 범위와 표시한 오답부터 처리한다.'}`,`${stamp(finish)}에 마감하고 밤늦게 새 진도를 추가하지 않는다.`];
        const row=[stamp(start),stamp(finish),night[0],night[1],night[2]];
        if(week[d].length>=12) week[d][week[d].length-1]=row; else week[d].push(row);
      }
      C.validateRows(week[d]);
    }
    return week;
  }
  function mount(api) {
    const $=id=>document.getElementById(id), esc=api.esc; let previousWeek=null,previousChoice=null;
    $('plan-stage').innerHTML=stages.map(s=>`<option value="${s.id}">${esc(s.name)} · ${esc(s.period)}</option>`).join('');
    $('plan-level').innerHTML=levels.map((l,i)=>`<option value="${i}">${esc(l.name)} · 주 ${label(2180+l.extra)}</option>`).join('');
    const initial=api.getData().preferences.studyPlan;
    if(initial){$('plan-stage').value=initial.stage;$('plan-level').value=String(initial.level);$('plan-cycle').value=initial.cycle;$('plan-qualified').checked=initial.qualified;}
    function choice(){return {stage:$('plan-stage').value,level:Number($('plan-level').value),cycle:$('plan-cycle').value,qualified:$('plan-qualified').checked};}
    function preview(){
      const p=choice(),s=stages.find(s=>s.id===p.stage),week=makeWeek(p.stage,p.level,p.cycle,p.qualified),current=api.getData();
      $('plan-goal').textContent=s.goal; $('plan-tasks').innerHTML=s.tasks.map(t=>`<li>${esc(t)}</li>`).join(''); $('plan-check').textContent=s.check;
      $('plan-total').textContent=`선택한 계획 · 주 ${label(Object.values(week).reduce((sum,r)=>sum+minutes(r),0))}`;
      $('plan-preview-body').innerHTML=Object.entries(week).map(([d,r])=>{const a=r.filter(isStudy),m=['행정법','행정법','행정학','행정법','행정학'][d];return `<tr><th scope="row">${['월','화','수','목','금','토','일'][d]}</th><td>${a[0][0]}–${a.at(-1)[1]}</td><td>${label(minutes(r))}</td><td>${d<5?(p.stage==='final'&&(d==='1'||d==='3')?'4과목 실전':p.cycle==='A'?m:m==='행정법'?'행정학':'행정법'):'주간 복습'}</td></tr>`;}).join('');
      $('plan-current').textContent=`현재 주간 계획: ${label(Array.from({length:7},(_,d)=>minutes(current.week[d]||global.DEFAULT_WEEK[d])).reduce((a,b)=>a+b,0))}. 날짜별 변경 ${Object.keys(current.days).length}개는 적용 후에도 우선합니다.`;
      $('plan-undo').disabled=previousWeek===null;
    }
    $('plan-open').addEventListener('click',()=>{preview();api.dialog('plan-dialog');});
    ['plan-stage','plan-level','plan-cycle','plan-qualified'].forEach(id=>$(id).addEventListener('change',preview));
    $('plan-apply').addEventListener('click',()=>{try{const p=choice(),next=C.copy(api.getData()),before=C.copy(next.week),beforeChoice=next.preferences.studyPlan?C.copy(next.preferences.studyPlan):null;next.week=makeWeek(p.stage,p.level,p.cycle,p.qualified);next.preferences.studyPlan=p;if(api.commit(C.validateData(next))){previousWeek=before;previousChoice=beforeChoice;preview();api.message('선택한 주간 계획을 적용했어요. 날짜별 변경과 꾸미기 설정은 유지됩니다.');}}catch(e){api.message(e.message);}});
    $('plan-undo').addEventListener('click',()=>{if(previousWeek===null)return;const next=C.copy(api.getData());next.week=C.copy(previousWeek);if(previousChoice)next.preferences.studyPlan=C.copy(previousChoice);else delete next.preferences.studyPlan;if(api.commit(next)){previousWeek=null;preview();api.message('적용 직전의 주간 시간표를 복원했어요.');}});
  }
  global.StudyPlan={stages,levels,makeWeek,minutes,label,mount};
  global.DEFAULT_WEEK=makeWeek('start',0,'A',false);
})(window);
