(() => {
  'use strict';
  const KEY = 'cloudike.file-requests.v1';
  const samples = [
    {name: '10월_프로젝트_최종보고서.pdf', size: '2.4 MB'},
    {name: '디자인_산출물.zip', size: '8.1 MB'},
    {name: '프로젝트_정산내역.xlsx', size: '156 KB'}
  ];
  const $ = id => document.getElementById(id);
  const escape = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const today = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; };
  const valid = r => r && typeof r.id === 'string' && /^[a-zA-Z0-9-]{1,80}$/.test(r.id) && typeof r.title === 'string' && r.title.trim() && r.title.length <= 100 && typeof r.description === 'string' && r.description.length <= 2000 && /^\d{4}-\d{2}-\d{2}$/.test(r.deadline) && !Number.isNaN(Date.parse(r.deadline));
  const closed = r => r.deadline < today();
  let selected = null;
  function load() {
    const raw = JSON.parse(localStorage.getItem(KEY) || '[]');
    if (!Array.isArray(raw) || !raw.every(r => valid(r) && Array.isArray(r.files) && r.files.every(f => f && typeof f.name === 'string' && typeof f.size === 'string' && typeof f.at === 'string'))) throw new Error('저장된 요청 데이터를 읽을 수 없습니다.');
    return raw;
  }
  function save(rows) { localStorage.setItem(KEY, JSON.stringify(rows)); }
  function notify(text) { $('feedback').textContent = text; }
  function linkFor(r) {
    const url = new URL(location.pathname, location.origin);
    url.searchParams.set('request', r.id);
    // Carry only the request description; submissions remain local to this browser.
    url.hash = encodeURIComponent(JSON.stringify({id:r.id,title:r.title,description:r.description,deadline:r.deadline}));
    return url.href;
  }
  function badge(r) { return `<span class="badge ${closed(r)?'closed':''}">${closed(r)?'마감':'진행 중'}</span>`; }
  function renderManager() {
    const rows = load();
    $('total').textContent = rows.length;
    $('active').textContent = rows.filter(r => !closed(r)).length;
    $('submitted').textContent = rows.reduce((sum,r) => sum+r.files.length,0);
    $('empty').hidden = rows.length > 0;
    $('requests').innerHTML = rows.map(r => `<tr><td><button class="title-button" data-detail="${escape(r.id)}">${escape(r.title)}</button></td><td>${escape(r.deadline)}</td><td>${r.files.length}건</td><td>${badge(r)}</td><td><button data-copy="${escape(r.id)}">링크 복사</button> <a class="button" href="${escape(linkFor(r))}">제출 화면</a></td></tr>`).join('');
    const r = rows.find(r => r.id === selected);
    $('detail').hidden = !r;
    if (r) $('detail').innerHTML = `<div class="panel-heading"><h2>${escape(r.title)}</h2><span>제출 파일 ${r.files.length}건</span></div><div class="detail-body">${escape(r.description)}</div><div class="table-wrap"><table><thead><tr><th>파일명</th><th>크기</th><th>제출 시각</th></tr></thead><tbody>${r.files.map(f => `<tr><td>${escape(f.name)}</td><td>${escape(f.size)}</td><td>${escape(new Date(f.at).toLocaleString('ko-KR'))}</td></tr>`).join('')}</tbody></table></div>${r.files.length?'':'<p class="empty">아직 제출된 파일이 없습니다.</p>'}`;
  }
  const requestId = new URLSearchParams(location.search).get('request');
  function renderSubmission() {
    const r = load().find(r => r.id === requestId);
    $('manager').hidden = true;
    $('submission').hidden = false;
    if (!r) { $('submission').innerHTML = '<h1>요청을 찾을 수 없습니다</h1><p>요청 링크가 올바른지 확인해 주세요.</p><a class="button" href="./">요청 목록으로</a>'; return; }
    $('submission').innerHTML = `<p class="eyebrow">CLOUDIKE FILE REQUEST</p><h1>${escape(r.title)}</h1>${badge(r)}<p>${escape(r.description)}</p><p>제출 기한 <strong>${escape(r.deadline)} 23:59</strong> · 현재 ${r.files.length}건 제출</p><form id="submit-form"><fieldset class="samples" ${closed(r)?'disabled':''}><legend>제출할 예시 파일 선택</legend>${samples.map((f,i) => `<label><input type="checkbox" name="sample" value="${i}"><span>${escape(f.name)}<br><small>${escape(f.size)}</small></span></label>`).join('')}</fieldset><p id="submit-error" role="alert"></p><div class="actions"><a class="button" href="./">요청 목록으로</a><button class="primary" ${closed(r)?'disabled':''}>${closed(r)?'제출 기한이 지났습니다':'선택한 파일 제출'}</button></div></form>`;
    $('submit-form').addEventListener('submit', e => {
      e.preventDefault();
      const chosen = Array.from(new FormData(e.target).getAll('sample')).map(Number).filter(i => Number.isInteger(i) && samples[i]);
      if (!chosen.length) { $('submit-error').textContent = '제출할 예시 파일을 선택해 주세요.'; return; }
      try {
        const rows = load(), current = rows.find(x => x.id === requestId);
        if (!current || closed(current)) throw new Error('제출 기한이 지났거나 요청이 없습니다.');
        current.files.push(...chosen.map(i => ({...samples[i],at:new Date().toISOString()})));
        save(rows); renderSubmission(); notify(`${chosen.length}개 파일이 제출되었습니다. 요청 목록에서 결과를 확인할 수 있습니다.`);
      } catch (err) { $('submit-error').textContent = `제출하지 못했습니다. ${err.message}`; }
    });
  }
  function refresh() { try { requestId ? renderSubmission() : renderManager(); } catch (err) { notify(`요청을 불러오지 못했습니다. ${err.message} 브라우저 저장 공간 설정을 확인해 주세요.`); } }
  $('new-request').addEventListener('click', () => { $('create-form').reset(); $('create-form').elements.deadline.min = today(); $('create-error').textContent = ''; $('create-dialog').showModal(); });
  ['close-dialog','cancel-dialog'].forEach(id => $(id).addEventListener('click', () => $('create-dialog').close()));
  $('create-form').addEventListener('submit', e => {
    e.preventDefault();
    const data = new FormData(e.target);
    const r = {id:crypto.randomUUID(),title:data.get('title').trim(),description:data.get('description').trim(),deadline:data.get('deadline'),files:[]};
    if (!valid(r) || !r.description || closed(r)) { $('create-error').textContent = '제목·설명과 오늘 이후의 제출 기한을 입력해 주세요.'; return; }
    try { const rows = load(); rows.unshift(r); save(rows); selected = r.id; renderManager(); $('create-dialog').close(); notify('요청이 생성되었습니다. 제출 링크를 복사해 전달하세요.'); }
    catch (err) { $('create-error').textContent = `저장하지 못했습니다. 브라우저 저장 공간을 확인해 주세요. ${err.message}`; }
  });
  $('requests').addEventListener('click', async e => {
    const detail = e.target.closest('[data-detail]'), copy = e.target.closest('[data-copy]');
    if (detail) { selected = detail.dataset.detail; refresh(); }
    if (copy) {
      try { const r = load().find(r => r.id === copy.dataset.copy); await navigator.clipboard.writeText(linkFor(r)); notify('제출 링크가 복사되었습니다.'); }
      catch { notify('링크를 복사하지 못했습니다. 제출 화면을 열어 주소창의 링크를 복사해 주세요.'); }
    }
  });
  try {
    if (requestId && !load().some(r => r.id === requestId) && location.hash) {
      const r = JSON.parse(decodeURIComponent(location.hash.slice(1)));
      if (!valid(r) || r.id !== requestId) throw new Error('요청 링크가 올바르지 않습니다.');
      const rows = load(); rows.push({id:r.id,title:r.title,description:r.description,deadline:r.deadline,files:[]}); save(rows);
    }
    refresh();
  } catch { $('manager').hidden = true; $('submission').hidden = false; $('submission').textContent = '요청을 불러오지 못했습니다. 링크 또는 브라우저 저장 공간을 확인해 주세요.'; }
  window.addEventListener('storage', e => { if (e.key === KEY) refresh(); });
  window.addEventListener('focus', refresh);
})();
