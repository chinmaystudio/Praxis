const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
document.getElementById('btn-explore-event')?.addEventListener('click', () => document.getElementById('overview')?.scrollIntoView({behavior:reduced?'auto':'smooth'}));
document.getElementById('btn-open-rulebook')?.addEventListener('click', () => { window.location.href='/researchx/PRAXIS_ResearchX_Enhanced_Creative_Rulebook.pdf'; });
const links=document.querySelectorAll('.nav-link');
const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting) links.forEach(link=>link.classList.toggle('active',link.getAttribute('href')==='#'+entry.target.id));}),{rootMargin:'-15% 0px -60% 0px'});
document.querySelectorAll('section[id]').forEach(section=>observer.observe(section));
