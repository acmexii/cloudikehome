(() => {
  'use strict';
  const KEY = 'cloudike-demo-file-requests-v1';
  const $ = id => document.getElementById(id);
  let requests = [], currentId = null, persistent = true;
  const uid = () => crypto.randomUUID();
  const localDate = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  };
  const validDate = v => /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(v));
  function clean(value) {
    if (!Array.isArray(value)) throw new Error('Invalid requests');
    return value.filter(r => r && typeof r.id === 'string' && typeof r.title === 'string' && validDate(r.due) && Array.isArray(r.files)).map(r => ({
      id:r.id,title:r.title.slice(0,80),description:typeof r.description==='string'?r.description.slice(0,600):'',due:r.due,
      createdAt:typeof r.createdAt==='string'?r.createdAt:'',files:r.files.filter(f => f && typeof f.name==='string' && typeof f.submitter==='string' && typeof f.submittedAt==='string' && Number.isFinite(f.size) && f.size>=0).map(f => ({id:typeof f.id==='string'?f.id:uid(),name:f.name.slice(0,255),size:f.size,submitter:f.submitter.slice(0,40),submittedAt:f.submittedAt}))
    }));
  }
  function read() {
    try { requests=clean(JSON.parse(localStorage.getItem(KEY)||'[]')); }
    catch { persistent=false; $('storage-warning').hidden=false; }
  }
  function save() {
    try { if(!persistent) throw new Error('Unavailable'); localStorage.setItem(KEY,JSON.stringify(requests)); }
    catch { persistent=false; $('storage-warning').hidden=false; }
  }
  function notify(message,error=false) {
    $('fr-status').textContent=message;
    $('fr-status').classList.toggle('fr-error',error);
  }
  function node(tag,text,className) {
    const el=document.createElement(tag); if(text!==undefined) el.textContent=text; if(className) el.className=className; return el;
  }
  const closed = r => r.due < localDate();
  const current = () => requests.find(r=>r.id===currentId);
  function bytes(size) { return size<1024?`${size} B`:size<1024*1024?`${(size/1024).toFixed(1)} KB`:`${(size/(1024*1024)).toFixed(1)} MB`; }
  function stamp(value) { const d=new Date(value);return Number.isNaN(d.getTime())?'-':d.toLocaleString('ko-KR'); }
  function render() {
    $('request-count').textContent=requests.length;
    $('open-count').textContent=requests.filter(r=>!closed(r)).length;
    $('file-count').textContent=requests.reduce((n,r)=>n+r.files.length,0);
    const body=$('request-rows');body.replaceChildren();
    $('request-empty').hidden=!!requests.length;$('request-table').hidden=!requests.length;
    for(const r of requests) {
      const row=node('tr'), title=node('td'), button=node('button',r.title,'fr-title-button');button.type='button';button.addEventListener('click',()=>open(r.id));title.append(button);row.append(title,node('td',r.due),node('td',`${r.files.length}개`));
      const status=node('td');status.append(node('span',closed(r)?'기한 마감':'접수 중',`fr-tag${closed(r)?' fr-tag-closed':''}`));row.append(status);body.append(row);
    }
    if(currentId) renderDetail();
  }
  function renderDetail() {
    const r=current(); if(!r) { currentId=null;$('request-detail').hidden=true;return; }
    $('detail-title').textContent=r.title;$('detail-description').textContent=r.description||'별도의 요청 설명이 없습니다.';
    $('detail-due').textContent=`제출 기한 ${r.due}`;$('detail-total').textContent=`제출 파일 ${r.files.length}개`;
    $('detail-state').textContent=closed(r)?'기한 마감':'접수 중';
    $('submit-files').disabled=closed(r);$('submission-name').disabled=closed(r);$('submission-files').disabled=closed(r);$('sample-files').disabled=closed(r);
    $('submission-help').textContent=closed(r)?'제출 기한이 지나 파일을 제출할 수 없습니다.':'파일 본문은 읽거나 전송하지 않고 이름·크기만 기록합니다.';
    const body=$('submission-rows');body.replaceChildren();
    $('submission-empty').hidden=!!r.files.length;$('submission-table').hidden=!r.files.length;
    for(const f of r.files) {
      const tr=node('tr');tr.append(node('td',f.name,'fr-file-name'),node('td',f.submitter),node('td',bytes(f.size)),node('td',stamp(f.submittedAt)));body.append(tr);
    }
  }
  function open(id,updateHash=true) {
    currentId=id;if(!current()) { notify('이 브라우저에 해당 요청이 없습니다. 새 요청을 먼저 생성해 주세요.',true);currentId=null;return; }
    $('request-detail').hidden=false;$('submission-form').reset();renderDetail();
    if(updateHash) history.replaceState(null,'',`#request=${encodeURIComponent(id)}`);
    $('detail-title').focus();
  }
  $('new-request').addEventListener('click',()=>{
    $('request-form').reset();$('request-due').min=localDate();$('request-due').value=localDate();$('request-title').setCustomValidity('');$('create-dialog').showModal();
  });
  for(const button of document.querySelectorAll('[data-close-dialog]')) button.addEventListener('click',()=>$('create-dialog').close());
  $('request-title').addEventListener('input',()=>$('request-title').setCustomValidity(''));
  $('request-form').addEventListener('submit',event=>{
    event.preventDefault();const title=$('request-title').value.trim();
    if(!title) { $('request-title').setCustomValidity('공백 외의 요청 제목을 입력해 주세요.');$('request-title').reportValidity();return; }
    if(!$('request-form').reportValidity()) return;
    const r={id:uid(),title,description:$('request-description').value.trim(),due:$('request-due').value,createdAt:new Date().toISOString(),files:[]};
    requests.unshift(r);save();$('create-dialog').close();render();open(r.id);notify('요청이 생성되었습니다. 아래에서 예시 파일을 제출해 보세요.');
  });
  $('submission-name').addEventListener('input',()=>$('submission-name').setCustomValidity(''));
  $('sample-files').addEventListener('click',()=>{
    const r=current();if(!r||closed(r)) return;
    const transfer=new DataTransfer();
    transfer.items.add(new File(['Cloudike practice deliverable\n'],'프로젝트_산출물_예시.txt',{type:'text/plain'}));
    transfer.items.add(new File(['Cloudike practice review notes\n'],'검토_메모_예시.txt',{type:'text/plain'}));
    $('submission-files').files=transfer.files;
    notify('실습용 예시 파일 2개를 선택했습니다. 제출자 이름을 입력하고 파일 제출을 눌러 주세요.');
  });
  $('submission-form').addEventListener('submit',event=>{
    event.preventDefault();const r=current();if(!r) return;
    if(closed(r)) {renderDetail();notify('제출 기한이 지난 요청입니다.',true);return;}
    const name=$('submission-name').value.trim();
    if(!name) { $('submission-name').setCustomValidity('공백 외의 제출자 이름을 입력해 주세요.');$('submission-name').reportValidity();return; }
    if(!$('submission-form').reportValidity()) return;
    const files=Array.from($('submission-files').files);
    if(!files.length) return;
    if(files.length>10) {notify('한 번에 파일을 10개까지 선택해 주세요.',true);return;}
    const now=new Date().toISOString();
    r.files.push(...files.map(f=>({id:uid(),name:f.name,size:f.size,submitter:name,submittedAt:now})));
    save();$('submission-form').reset();render();notify(`접수 완료: 파일 ${files.length}개가 제출 결과에 추가되었습니다.`);$('submission-results').focus();
  });
  $('close-detail').addEventListener('click',()=>{currentId=null;$('request-detail').hidden=true;history.replaceState(null,'',location.pathname);$('new-request').focus();});
  window.addEventListener('storage',event=>{if(event.key===KEY){read();render();}});
  read();render();
  const match=location.hash.match(/^#request=(.+)$/);
  if(match) {try{open(decodeURIComponent(match[1]),false);}catch{notify('요청 주소를 확인해 주세요.',true);}}
})();
