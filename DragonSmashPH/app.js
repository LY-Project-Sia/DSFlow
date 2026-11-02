const CONFIG={
  rates:{Badminton:350,Pickleball:500},
  entrance:85,
  courts:{Badminton:Array.from({length:12},(_,i)=>`Badminton Court ${i+1}`),Pickleball:Array.from({length:6},(_,i)=>`Pickleball Court ${i+1}`)},
  open:6*60,
  close:26*60,
  contactEmail:"info@dragonsmashph.com"
};
const SETTINGS_KEY="dragonsmashph_settings_v1";
function loadSettings(){try{return JSON.parse(localStorage.getItem(SETTINGS_KEY)||"{}")}catch{return{}}}
const ADMIN_SETTINGS=loadSettings();
CONFIG.rates={...CONFIG.rates,...(ADMIN_SETTINGS.rates||{})};
CONFIG.entrance=ADMIN_SETTINGS.entrance??CONFIG.entrance;
CONFIG.open=ADMIN_SETTINGS.open??CONFIG.open;
CONFIG.close=ADMIN_SETTINGS.close??CONFIG.close;
if(ADMIN_SETTINGS.courtStatus){Object.keys(CONFIG.courts).forEach(s=>{CONFIG.courts[s]=CONFIG.courts[s].filter(c=>ADMIN_SETTINGS.courtStatus[c]!==false)})}
const KEY="dragonsmashph_elite_bookings_v1";
const $=id=>document.getElementById(id);
const money=n=>"₱"+Number(n).toLocaleString("en-PH",{minimumFractionDigits:0,maximumFractionDigits:2});
const pad=n=>String(n).padStart(2,"0");
let selectedTime=null;

function load(){try{return JSON.parse(localStorage.getItem(KEY)||"[]")}catch{return[]}}
function save(v){localStorage.setItem(KEY,JSON.stringify(v))}
function toast(m){const t=$("toast");t.textContent=m;t.classList.add("show");setTimeout(()=>t.classList.remove("show"),3600)}
function formatTime(v){let [h,m]=v.split(":").map(Number);let ap=h>=12?"PM":"AM";h=h%12||12;return `${h}:${pad(m)} ${ap}`}
function minutes(v){let [h,m]=v.split(":").map(Number);return h*60+m+(h<6?1440:0)}
function dateLabel(d){return d?new Date(d+"T00:00:00").toLocaleDateString("en-PH",{month:"short",day:"numeric",year:"numeric"}):"—"}
function overlaps(date,time,dur,b){let a=minutes(time),a2=a+dur*60,c=minutes(b.time),c2=c+(+b.duration*60);return date===b.date&&a<c2&&c<a2}
function buildTimes(){
  const g=$("timeGrid");g.innerHTML="";
  for(let x=CONFIG.open;x<CONFIG.close;x+=60){
    let y=x%(24*60),v=pad(Math.floor(y/60))+":"+pad(y%60);
    const b=document.createElement("button");b.className="time-slot";b.textContent=formatTime(v);
    const booked=load().some(r=>r.date===$("date").value&&r.court===$("court").value&&overlaps($("date").value,v,+$("duration").value,r));
    if(booked){b.classList.add("busy");b.disabled=true}
    else{b.classList.add("open");b.onclick=()=>chooseTime(v,b)}
    if(selectedTime===v&&!booked)b.classList.add("selected");
    g.appendChild(b);
  }
  $("slotHint").textContent=$("date").value?dateLabel($("date").value):"SELECT A DATE";
}
function chooseTime(v,btn){
  document.querySelectorAll(".time-slot.selected").forEach(x=>x.classList.remove("selected"));
  btn.classList.add("selected");selectedTime=v;$("selectedTime").textContent=`${formatTime(v)} • ${$("duration").value} HR`;
  checkAvailability();
}
function populateCourts(){
  const s=$("court"),old=s.value;s.innerHTML="";
  CONFIG.courts[$("sport").value].forEach(c=>{const o=document.createElement("option");o.value=c;o.textContent=c;s.appendChild(o)});
  if([...s.options].some(o=>o.value===old))s.value=old;
  selectedTime=null;$("selectedTime").textContent="Choose a time";buildTimes();updateSummary();checkAvailability();renderBoard();
}
function calc(){
  const sport=$("sport").value,p=+$("players").value||1,dur=+$("duration").value||1;
  return {sport,players:p,dur,courtFee:CONFIG.rates[sport]*dur,entrance:CONFIG.entrance*p,total:CONFIG.rates[sport]*dur+CONFIG.entrance*p};
}
function updateSummary(){
  const c=calc();$("courtFee").textContent=money(c.courtFee);$("entranceFee").textContent=money(c.entrance);$("total").textContent=money(c.total);
}
function isAvailable(){
  if(!selectedTime||!$("date").value||!$("court").value)return false;
  const dur=+$("duration").value;
  const start=minutes(selectedTime);
  if(start+dur*60>CONFIG.close)return false;
  return !load().some(r=>r.court===$("court").value&&overlaps($("date").value,selectedTime,dur,r));
}
function checkAvailability(){
  const box=$("availability"),ok=isAvailable();
  box.className="availability "+(selectedTime?(ok?"available":"busy"):"");
  box.innerHTML=selectedTime
    ? `<span class="status-dot"></span><strong>${ok?"AVAILABLE":"NOT AVAILABLE"}</strong><small>${ok?"Ready to reserve "+$("court").value+".":"That court overlaps an existing reservation or exceeds operating hours."}</small>`
    : `<span class="status-dot"></span><strong>SELECT A TIME</strong><small>We will check the selected court before confirmation.</small>`;
  updateSummary();buildTimes();
}
function submitBooking(){
  if(!isAvailable()){toast("Choose an available time first.");checkAvailability();return}
  const name=$("name").value.trim(),phone=$("phone").value.trim();
  if(!name||!phone){toast("Please enter your name and mobile number.");return}
  const c=calc(),b={id:crypto.randomUUID?crypto.randomUUID():String(Date.now()),confirmation:"DS-"+Math.random().toString(36).slice(2,8).toUpperCase(),name,phone,email:$("email").value.trim(),notes:$("notes").value.trim(),sport:c.sport,date:$("date").value,time:selectedTime,duration:c.dur,court:$("court").value,players:c.players,total:c.total,status:"confirmed",createdAt:new Date().toISOString()};
  const all=load();all.push(b);save(all);renderBookings();buildTimes();renderBoard();
  toast(`Booking confirmed • ${b.confirmation}`);
  $("name").value="";$("phone").value="";$("email").value="";$("notes").value="";
  selectedTime=null;$("selectedTime").textContent="Choose a time";checkAvailability();
}
function renderBookings(){
  const wrap=$("bookingList"),all=load().sort((a,b)=>a.date.localeCompare(b.date)||a.time.localeCompare(b.time));
  if(!all.length){wrap.innerHTML='<div class="booking-item"><strong>No bookings yet.</strong><small>Your confirmed reservations will appear here.</small></div>';return}
  wrap.innerHTML=all.map(b=>`<div class="booking-item"><div><strong>${b.confirmation}</strong><small>${b.name} • ${b.phone}</small></div><div><strong>${b.sport} • ${b.court}</strong><small>${dateLabel(b.date)} • ${formatTime(b.time)} • ${b.duration} hr</small></div><button class="cancel" data-id="${b.id}">CANCEL</button></div>`).join("");
  wrap.querySelectorAll(".cancel").forEach(btn=>btn.onclick=()=>{if(confirm("Cancel this local booking?")){save(load().filter(x=>x.id!==btn.dataset.id));renderBookings();buildTimes();renderBoard();toast("Booking cancelled.")}});
}
function renderBoard(){
  const date=$("boardDate").value,sport=$("boardSport").value, courts=CONFIG.courts[sport],board=$("board");
  const times=[];for(let x=CONFIG.open;x<CONFIG.close;x+=60){let y=x%(24*60);times.push(pad(Math.floor(y/60))+":"+pad(y%60))}
  let html='<div class="board-grid"><div class="board-cell head">COURT / TIME</div>'+times.map(t=>`<div class="board-cell head">${formatTime(t)}</div>`).join("");
  courts.forEach(c=>{html+=`<div class="board-cell court">${c}</div>`;times.forEach(t=>{const busy=load().some(r=>r.date===date&&r.court===c&&overlaps(date,t,1,r));html+=`<div class="board-cell ${busy?"busy":"open"}">${busy?"BOOKED":"OPEN"}</div>`})});
  html+="</div>";board.innerHTML=html;
  $("boardSummary").textContent=`${courts.length} ${sport.toUpperCase()} COURTS • ${dateLabel(date)}`;
}
function setupDate(){
  const today=new Date();today.setMinutes(today.getMinutes()-today.getTimezoneOffset());const v=today.toISOString().slice(0,10);
  $("date").min=v;$("date").value=v;$("boardDate").min=v;$("boardDate").value=v;
}
function openSport(sport){
  $("sport").value=sport;populateCourts();document.querySelectorAll('[data-tab]').forEach(x=>x.classList.toggle("active",x.dataset.tab==="book"));$("bookPane").style.display="block";$("managePane").style.display="none";$("booking").scrollIntoView({behavior:"smooth"});
}
document.querySelectorAll(".court-info a").forEach(a=>a.onclick=e=>{e.preventDefault();openSport(a.dataset.sport)});
$("sport").onchange=populateCourts;$("court").onchange=()=>{selectedTime=null;$("selectedTime").textContent="Choose a time";buildTimes();checkAvailability();renderBoard()};$("date").onchange=()=>{selectedTime=null;$("selectedTime").textContent="Choose a time";buildTimes();checkAvailability();renderBoard()};$("duration").onchange=()=>{buildTimes();checkAvailability()};$("players").oninput=updateSummary;
$("confirm").onclick=submitBooking;
$("boardDate").onchange=renderBoard;$("boardSport").onchange=renderBoard;
document.querySelectorAll("[data-tab]").forEach(btn=>btn.onclick=()=>{document.querySelectorAll("[data-tab]").forEach(x=>x.classList.remove("active"));btn.classList.add("active");const manage=btn.dataset.tab==="manage";$("bookPane").style.display=manage?"none":"block";$("managePane").style.display=manage?"block":"none";if(manage)renderBookings()});
$("menu").onclick=()=>$("nav").classList.toggle("open");document.querySelectorAll("#nav a").forEach(a=>a.onclick=()=>$("nav").classList.remove("open"));
$("contactForm").onsubmit=e=>{e.preventDefault();const body=encodeURIComponent(`Name: ${$("contactName").value}\nEmail: ${$("contactEmail").value}\nPhone: ${$("contactPhone").value}\n\n${$("contactMessage").value}`);location.href=`mailto:${CONFIG.contactEmail}?subject=DragonSmashPH%20Inquiry&body=${body}`};
$("year").textContent=new Date().getFullYear();setupDate();populateCourts();renderBookings();renderBoard();

// --- DragonSmashPH Pro court map / booking views ---
let workspaceView="court";
function safe(id){return $(id)}
function workspaceSync(){
  if(!$('workspaceDate')) return;
  $('workspaceDate').value=$('date').value;
  $('summarySport').textContent=$('sport').value;
  $('summaryDate').textContent=dateLabel($('date').value);
  $('summaryCourt').textContent=$('court').value||"—";
  $('summaryTime').textContent=selectedTime?formatTime(selectedTime):"—";
  $('summaryDuration').textContent=`${$('duration').value} HOUR${+$('duration').value>1?'S':''}`;
  $('summaryPlayers').textContent=$('players').value||"1";
  $('workspaceTotal').textContent=$('total').textContent;
  renderCourtMap();renderCalendarView();renderTableView();renderAvailabilityList();renderBreakdown();
}
function renderCourtMap(){
  const map=$('courtMap');if(!map)return;
  const sport=$('sport').value,courts=CONFIG.courts[sport];
  $('mapSportTitle').textContent=`${sport.toUpperCase()} COURTS`;
  map.innerHTML=courts.map(c=>{
    const busy=selectedTime && load().some(r=>r.court===c&&overlaps($('date').value,selectedTime,+$('duration').value,r));
    const active=$('court').value===c;
    return `<button type="button" class="map-court ${active?'active ':''}${busy?'busy':''}" ${busy?'disabled':''} data-map-court="${c}"><strong>${c.replace('Badminton Court ','COURT ').replace('Pickleball Court ','PICKLEBALL ')}</strong><span>${busy?'RESERVED':active?'SELECTED':'AVAILABLE'}</span></button>`;
  }).join('');
  map.querySelectorAll('[data-map-court]').forEach(b=>b.onclick=()=>{
    $('court').value=b.dataset.mapCourt;selectedTime=null;$('selectedTime').textContent='Choose a time';buildTimes();checkAvailability();workspaceSync();
  });
  $('mapStatus').textContent=$('court').value?`${$('court').value.toUpperCase()} SELECTED`:'NONE SELECTED';
}
function renderBreakdown(){
  const b=$('breakdown');if(!b)return;
  if(!selectedTime){b.innerHTML='<div class="breakdown-empty">Select a court and time.</div>';return}
  const end=minutes(selectedTime)+$durationMinutes();const eh=(end%(24*60));
  const endLabel=formatTime(pad(Math.floor(eh/60))+':'+pad(eh%60));
  b.innerHTML=`<div class="selected-chip"><span>${$('court').value}</span><strong>${formatTime(selectedTime)} – ${endLabel}</strong><button type="button" id="clearSlot">×</button></div>`;
  $('clearSlot').onclick=()=>{selectedTime=null;$('selectedTime').textContent='Choose a time';buildTimes();checkAvailability();workspaceSync()};
}
function $durationMinutes(){return (+$('duration').value||1)*60}
function renderTableView(){
  const grid=$('tableGrid');if(!grid)return;
  const times=[];for(let x=CONFIG.open;x<CONFIG.close;x+=60){let y=x%(24*60);times.push(pad(Math.floor(y/60))+':'+pad(y%60))}
  let h='<div class="calendar-cell head">COURT</div>'+times.map(t=>`<div class="calendar-cell head">${formatTime(t)}</div>`).join('');
  CONFIG.courts[$('sport').value].forEach(c=>{
    h+=`<div class="calendar-cell head">${c}</div>`;
    times.forEach(t=>{const busy=load().some(r=>r.date===$('date').value&&r.court===c&&overlaps($('date').value,t,1,r));const sel=selectedTime===t&&$('court').value===c;h+=`<button type="button" class="calendar-cell ${busy?'busy':'open'} ${sel?'selected':''}" ${busy?'disabled':''} data-table-time="${t}" data-table-court="${c}">${busy?'BOOKED':'OPEN'}</button>`});
  });
  grid.innerHTML=h;$('tableMeta').textContent=`${dateLabel($('date').value)} • ${$('sport').value}`;
  grid.querySelectorAll('[data-table-time]').forEach(b=>b.onclick=()=>{$('court').value=b.dataset.tableCourt;selectedTime=b.dataset.tableTime;$('selectedTime').textContent=`${formatTime(selectedTime)} • ${$('duration').value} HR`;buildTimes();checkAvailability();workspaceSync()});
}
function renderCalendarView(){
  const grid=$('calendarGrid');if(!grid)return;
  const times=[];for(let x=CONFIG.open;x<CONFIG.close;x+=60){let y=x%(24*60);times.push(pad(Math.floor(y/60))+':'+pad(y%60))}
  let h='<div class="calendar-cell head">COURT / TIME</div>'+times.map(t=>`<div class="calendar-cell head">${formatTime(t)}</div>`).join('');
  CONFIG.courts[$('sport').value].forEach(c=>{
    h+=`<div class="calendar-cell head">${c}</div>`;
    times.forEach(t=>{const busy=load().some(r=>r.date===$('date').value&&r.court===c&&overlaps($('date').value,t,1,r));const sel=selectedTime===t&&$('court').value===c;h+=`<button type="button" class="calendar-cell ${busy?'busy':'open'} ${sel?'selected':''}" ${busy?'disabled':''} data-cal-time="${t}" data-cal-court="${c}">${busy?'BOOKED':'OPEN'}</button>`});
  });
  grid.innerHTML=h;$('calendarMeta').textContent=`${dateLabel($('date').value)} • ${$('sport').value}`;
  grid.querySelectorAll('[data-cal-time]').forEach(b=>b.onclick=()=>{$('court').value=b.dataset.calCourt;selectedTime=b.dataset.calTime;$('selectedTime').textContent=`${formatTime(selectedTime)} • ${$('duration').value} HR`;buildTimes();checkAvailability();workspaceSync()});
}
function renderAvailabilityList(){
  const list=$('availabilityList');if(!list)return;const times=[];for(let x=CONFIG.open;x<CONFIG.close;x+=60){let y=x%(24*60);times.push(pad(Math.floor(y/60))+':'+pad(y%60))}
  list.innerHTML=CONFIG.courts[$('sport').value].flatMap(c=>times.map(t=>{const busy=load().some(r=>r.date===$('date').value&&r.court===c&&overlaps($('date').value,t,1,r));return `<div class="availability-item ${busy?'busy':'open'}"><span class="time">${formatTime(t)}</span><span class="courtname">${c} • ${busy?'RESERVED':'AVAILABLE'}</span><button type="button" data-list-time="${t}" data-list-court="${c}">BOOK</button></div>`})).join('');
  list.querySelectorAll('[data-list-time]').forEach(b=>b.onclick=()=>{$('court').value=b.dataset.listCourt;selectedTime=b.dataset.listTime;$('selectedTime').textContent=`${formatTime(selectedTime)} • ${$('duration').value} HR`;buildTimes();checkAvailability();workspaceSync()});
}
function switchWorkspaceView(v){workspaceView=v;document.querySelectorAll('.view-tabs-pro button').forEach(b=>b.classList.toggle('active',b.dataset.view===v));$('courtView').style.display=v==='court'?'grid':'none';$('calendarView').style.display=v==='calendar'?'block':'none';$('tableView').style.display=v==='table'?'block':'none';$('listView').style.display=v==='list'?'block':'none';renderCalendarView();renderTableView();renderAvailabilityList()}
document.querySelectorAll('.view-tabs-pro button').forEach(b=>b.onclick=()=>switchWorkspaceView(b.dataset.view));
document.querySelectorAll('[data-sport-switch]').forEach(b=>b.onclick=()=>{const s=b.dataset.sportSwitch;$('sport').value=s;document.querySelectorAll('[data-sport-switch]').forEach(x=>x.classList.toggle('active',x===b));populateCourts();workspaceSync()});
$('workspaceDate').onchange=()=>{$('date').value=$('workspaceDate').value;selectedTime=null;$('selectedTime').textContent='Choose a time';buildTimes();checkAvailability();workspaceSync()};
$('workspaceContinue').onclick=()=>{$('.booking-controls')?.scrollIntoView?.({behavior:'smooth',block:'center'});toast('Review your schedule, contact details and total below.')};
const _populateCourts=populateCourts;populateCourts=function(){_populateCourts();setTimeout(workspaceSync,0)};
const _chooseTime=chooseTime;chooseTime=function(v,btn){_chooseTime(v,btn);workspaceSync()};
const _renderBookings=renderBookings;renderBookings=function(){_renderBookings();workspaceSync()};
const _renderBoard=renderBoard;renderBoard=function(){_renderBoard();workspaceSync()};
const _updateSummary=updateSummary;updateSummary=function(){_updateSummary();workspaceSync()};
setTimeout(workspaceSync,100);
