document.addEventListener('submit',e=>e.preventDefault());document.addEventListener('click',e=>{const b=e.target.closest('button,[role="button"],a[href="#"]');if(!b)return;if(b.dataset.demoRoute){location.href=b.dataset.demoRoute;return;}if(b.closest('[role="checkbox"]')||b.querySelector('input[type="checkbox"]'))return;e.preventDefault();let t=document.getElementById('demo-toast');if(!t){t=document.createElement('div');t.id='demo-toast';t.setAttribute('role','status');document.body.append(t);}t.textContent='실습용 정적 화면입니다. 실제 서비스 작업은 실행되지 않습니다.';clearTimeout(window.demoToast);window.demoToast=setTimeout(()=>t.remove(),2600);});// Expose file requests in the existing app sidebars.
document.querySelectorAll('a[href="/cloudikehome/app/company-folder/"]').forEach(anchor => {
  const link = anchor.cloneNode(true);
  link.href = '/cloudikehome/app/file-requests/';
  link.removeAttribute('aria-current');
  const walker = document.createTreeWalker(link, NodeFilter.SHOW_TEXT);
  while (walker.nextNode()) {
    if (walker.currentNode.textContent.includes('기업 문서함')) walker.currentNode.textContent = '파일 요청함';
  }
  anchor.after(link);
});
