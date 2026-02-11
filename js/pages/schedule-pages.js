import { scheduleItems } from "../data/schedule.js";

// Schedule page controller

const DAY_START_HOUR = 9;
const DAY_END_HOUR = 18;
const SLOT_MIN = 30;

const MOBILE_BP = 900;

const ICON_BASE = "../../assets/icons/schedule";
const ICON_LOCATION = `${ICON_BASE}/location.png`;
const ICON_CLOCK = `${ICON_BASE}/clock.png`;

const STORAGE_DATE = "schedSelectedDate"; // YYYY-MM-DD
const STORAGE_MODE_DESKTOP = "schedDesktopMode"; // "day" | "week" | "month"

// DOM
const $layer = document.getElementById("eventsLayer");
const $monthEl = document.getElementById("schedMonth");
const $rangeEl = document.getElementById("schedRange");

const $weekGrid = document.getElementById("weekGrid");
const $weekHead = document.getElementById("weekHead");
const $weekBody = document.getElementById("weekBody");

const $dayView = document.getElementById("dayView");
const $dayList = document.getElementById("dayList");
const $dayTimeCol = document.getElementById("dayTimeCol");

const $monthView = document.getElementById("monthView");
const $monthGrid = document.getElementById("monthGrid");

// Mobile UI
const $mDayTop = document.getElementById("mDayTop");
const $mMonthTitle = document.getElementById("mMonthTitle");
const $mPrevWeek = document.getElementById("mPrevWeek");
const $mNextWeek = document.getElementById("mNextWeek");
const $mDayStrip = document.getElementById("mDayStrip");

function isMobile() {
  return window.matchMedia(`(max-width: ${MOBILE_BP}px)`).matches;
}

function setGridVars() {
  const slots = ((DAY_END_HOUR - DAY_START_HOUR) * 60) / SLOT_MIN;
  document.documentElement.style.setProperty("--slots", String(slots));
}

// Date & formatting
function isoFromDate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function parseISODate(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function formatMonth(d) {
  return d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

function formatMonthOnly(d) {
  return d.toLocaleDateString("en-US", { month: "long" });
}

function formatRange(startDate, endDate) {
  const opts = { day: "2-digit", month: "short" };
  const s = startDate.toLocaleDateString("en-GB", opts).replace(",", "");
  const e = endDate.toLocaleDateString("en-GB", opts).replace(",", "");
  return `${s} - ${e} ${endDate.getFullYear()}`;
}

function formatDayTitle(d) {
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function formatMonthPill(d) {
  return d.toLocaleDateString("en-GB", { month: "short", year: "numeric" });
}

function toMinutes(hhmm) {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function minutesToRow(mins) {
  const startMins = DAY_START_HOUR * 60;
  const offset = mins - startMins;
  return Math.floor(offset / SLOT_MIN) + 1;
}

function durationToSpan(startMins, endMins) {
  const dur = endMins - startMins;
  return Math.max(1, Math.round(dur / SLOT_MIN));
}

// 1..7 (Mon..Sun)
function dayToColIndex(dateObj) {
  const d = dateObj.getDay();
  return d === 0 ? 7 : d;
}

// Mode
function getDesktopMode() {
  return sessionStorage.getItem(STORAGE_MODE_DESKTOP) || "week";
}

function setDesktopMode(mode) {
  sessionStorage.setItem(STORAGE_MODE_DESKTOP, mode);
}

function getEffectiveMode() {
  return isMobile() ? "day" : getDesktopMode();
}

// Selected date
function getSelectedDate() {
  const iso = sessionStorage.getItem(STORAGE_DATE);
  if (iso) return parseISODate(iso);

  const now = new Date();
  sessionStorage.setItem(STORAGE_DATE, isoFromDate(now));
  return now;
}

function setSelectedDate(d) {
  sessionStorage.setItem(STORAGE_DATE, isoFromDate(d));
}

// Monday start
function getWeekStart(d) {
  const date = new Date(d);
  date.setHours(0, 0, 0, 0);
  const dow = date.getDay();
  const diff = dow === 0 ? -6 : 1 - dow;
  date.setDate(date.getDate() + diff);
  return date;
}

// Time labels
function formatHourLabel(h) {
  const ampm = h >= 12 ? "PM" : "AM";
  const hr12 = ((h + 11) % 12) + 1;
  return `${hr12} ${ampm}`;
}

function renderTimeColumn() {
  const timeCol = document.getElementById("timeCol");
  if (!timeCol) return;

  timeCol.innerHTML = "";
  for (let h = DAY_START_HOUR; h <= DAY_END_HOUR; h++) {
    const el = document.createElement("div");
    el.className = "timeLabel";
    el.textContent = formatHourLabel(h);
    el.style.setProperty("--i", String(h - DAY_START_HOUR));
    if (h === DAY_START_HOUR) el.classList.add("isStart");
    if (h === DAY_END_HOUR) el.classList.add("isEnd");
    timeCol.appendChild(el);
  }
}

function renderDayTimeColumn() {
  if (!$dayTimeCol) return;

  $dayTimeCol.innerHTML = "";
  for (let h = DAY_START_HOUR; h <= DAY_END_HOUR; h++) {
    const el = document.createElement("div");
    el.className = "timeLabel";
    el.textContent = formatHourLabel(h);
    el.style.setProperty("--i", String(h - DAY_START_HOUR));
    if (h === DAY_START_HOUR) el.classList.add("isStart");
    if (h === DAY_END_HOUR) el.classList.add("isEnd");
    $dayTimeCol.appendChild(el);
  }
}

// Week header (desktop)
function renderWeekHeader(weekStart, selectedDate) {
  if (!$weekHead) return;

  $weekHead.innerHTML = "";
  const spacer = document.createElement("div");
  spacer.className = "weekHeadSpacer";
  $weekHead.appendChild(spacer);

  const dows = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  for (let i = 0; i < 7; i++) {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);

    const dayHead = document.createElement("div");
    dayHead.className = "dayHead";
    if (isoFromDate(d) === isoFromDate(selectedDate)) dayHead.classList.add("isActive");

    const dow = document.createElement("div");
    dow.className = "dayDow";
    dow.textContent = dows[i];

    const num = document.createElement("button");
    num.type = "button";
    num.className = "dayNum";
    num.textContent = String(d.getDate());

    num.addEventListener("click", () => {
      setSelectedDate(d);
      setDesktopMode("day");
      render();
    });

    dayHead.appendChild(dow);
    dayHead.appendChild(num);
    $weekHead.appendChild(dayHead);
  }
}

// Mobile header + strip (Mon–Fri)
function showMobileUi(show) {
  if ($mDayTop) $mDayTop.style.display = show ? "flex" : "none";
  if ($mDayStrip) $mDayStrip.style.display = show ? "flex" : "none";
}

function renderMobileTopAndStrip(selectedDate) {
  if (!isMobile()) {
    showMobileUi(false);
    return;
  }

  showMobileUi(true);

  if ($mMonthTitle) $mMonthTitle.textContent = formatMonthOnly(selectedDate);
  if (!$mDayStrip) return;

  $mDayStrip.innerHTML = "";

  const weekStart = getWeekStart(selectedDate);
  const dows = ["Mon", "Tue", "Wed", "Thu", "Fri"];

  for (let i = 0; i < 5; i++) {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);

    const item = document.createElement("button");
    item.type = "button";
    item.className = "mDayItem";
    if (isoFromDate(d) === isoFromDate(selectedDate)) item.classList.add("isActive");

    const dow = document.createElement("div");
    dow.className = "mDayDow";
    dow.textContent = dows[i];

    const num = document.createElement("div");
    num.className = "mDayNum";
    num.textContent = String(d.getDate());

    item.appendChild(dow);
    item.appendChild(num);

    item.addEventListener("click", () => {
      setSelectedDate(d);
      render();
    });

    $mDayStrip.appendChild(item);
  }
}

function wireMobileJumpToToday() {
  if (!$mMonthTitle) return;
  $mMonthTitle.addEventListener("click", () => {
    setSelectedDate(new Date());
    render();
  });
}

// Cards
function buildEventCard(it, col, row, span) {
  const card = document.createElement("article");
  card.className = "eventCard";
  if (it.cancelled) card.classList.add("isCancelled");

  card.style.setProperty("--col", col);
  card.style.setProperty("--row", row);
  card.style.setProperty("--span", span);

  const showDuration = !it.cancelled && (it.duration ?? "").trim().length > 0;

  card.innerHTML = `
    <div class="eventTop">
      <div class="eventTitleWrap">
        <div class="eventTitle">${it.course ?? ""}</div>
        ${it.cancelled ? `<span class="eventBadge">Cancelled</span>` : ""}
      </div>
      ${showDuration ? `<div class="eventDur">${it.duration}</div>` : ""}
    </div>

    <div class="eventMeta">
      <span class="eventChip">
        <img class="eventIcon" src="${ICON_LOCATION}" alt="" />
        ${it.location ?? ""}
      </span>
      <span class="eventChip">${it.room ?? ""}</span>
    </div>

    <div class="eventTime">
      <img class="eventIcon" src="${ICON_CLOCK}" alt="" />
      <span>${it.start ?? ""} → ${it.end ?? ""}</span>
    </div>
  `;
  return card;
}

function buildDayCard(it, row, span) {
  const card = document.createElement("article");
  card.className = "dayCard";
  if (it.cancelled) card.classList.add("isCancelled");

  card.style.setProperty("--row", row);
  card.style.setProperty("--span", span);

  const showDuration = !it.cancelled && (it.duration ?? "").trim().length > 0;

  card.innerHTML = `
    <div class="eventTop">
      <div class="eventTitleWrap">
        <div class="eventTitle">${it.course ?? ""}</div>
        ${it.cancelled ? `<span class="eventBadge">Cancelled</span>` : ""}
      </div>
      ${showDuration ? `<div class="eventDur">${it.duration}</div>` : ""}
    </div>

    <div class="eventMeta">
      <span class="eventChip">
        <img class="eventIcon" src="${ICON_LOCATION}" alt="" />
        ${it.location ?? ""}
      </span>
      <span class="eventChip">${it.room ?? ""}</span>
    </div>

    <div class="eventTime">
      <img class="eventIcon" src="${ICON_CLOCK}" alt="" />
      <span>${it.start ?? ""} → ${it.end ?? ""}</span>
    </div>
  `;
  return card;
}

// Now line (week view)
function getNowMinutes() {
  const now = new Date();
  return now.getHours() * 60 + now.getMinutes();
}

function ensureNowLine() {
  if (!$layer) return null;
  let line = document.getElementById("nowLine");
  if (!line) {
    line = document.createElement("div");
    line.id = "nowLine";
    line.className = "nowLine";
    const dot = document.createElement("span");
    dot.className = "nowDot";
    line.appendChild(dot);
    $layer.appendChild(line);
  }
  return line;
}

function updateNowLinePosition() {
  if (getEffectiveMode() !== "week") return;

  const line = ensureNowLine();
  if (!line) return;

  const nowMins = getNowMinutes();
  const gridStart = DAY_START_HOUR * 60;
  const gridEnd = DAY_END_HOUR * 60;

  if (nowMins < gridStart || nowMins > gridEnd) {
    line.style.display = "none";
    return;
  }
  line.style.display = "block";

  const slotH = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--slotH"));
  const offsetMins = nowMins - gridStart;
  const y = (offsetMins / SLOT_MIN) * slotH;
  line.style.top = `${y}px`;
}

// Views
function setViewVisibility(mode) {
  if (isMobile()) {
    if ($weekGrid) $weekGrid.style.display = "none";
    if ($weekBody) $weekBody.style.display = "none";
    if ($monthView) $monthView.style.display = "none";
    if ($dayView) $dayView.style.display = "block";
    return;
  }

  showMobileUi(false);

  if ($weekGrid) $weekGrid.style.display = mode === "month" ? "none" : "block";
  if ($weekBody) $weekBody.style.display = mode === "week" ? "grid" : "none";
  if ($dayView) $dayView.style.display = mode === "day" ? "block" : "none";
  if ($monthView) $monthView.style.display = mode === "month" ? "block" : "none";
}

// Render: week
function renderWeek(selectedDate) {
  if (!$layer) return;

  const weekStart = getWeekStart(selectedDate);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);

  if ($monthEl) $monthEl.textContent = formatMonth(weekStart);
  if ($rangeEl) $rangeEl.textContent = formatRange(weekStart, weekEnd);

  renderWeekHeader(weekStart, selectedDate);

  $layer.innerHTML = "";
  ensureNowLine();

  const startISO = isoFromDate(weekStart);
  const endISO = isoFromDate(weekEnd);

  const items = scheduleItems.filter((it) => it.date >= startISO && it.date <= endISO);

  const gridStart = DAY_START_HOUR * 60;
  const gridEnd = DAY_END_HOUR * 60;

  items.forEach((it) => {
    const dateObj = parseISODate(it.date);
    const col = dayToColIndex(dateObj);

    const startM = toMinutes(it.start);
    const endM = toMinutes(it.end);

    const s = clamp(startM, gridStart, gridEnd);
    const e = clamp(endM, gridStart, gridEnd);
    if (e <= gridStart || s >= gridEnd) return;

    const row = minutesToRow(s);
    const span = durationToSpan(s, e);
    $layer.appendChild(buildEventCard(it, col, row, span));
  });

  updateNowLinePosition();
}

// Render: day
function renderDay(selectedDate) {
  if (!$dayList) return;

  const weekStart = getWeekStart(selectedDate);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);

  if (!isMobile()) {
    if ($monthEl) $monthEl.textContent = formatMonth(selectedDate);
    if ($rangeEl) $rangeEl.textContent = formatDayTitle(selectedDate);
    renderWeekHeader(weekStart, selectedDate);
  } else {
    renderMobileTopAndStrip(selectedDate);
  }

  renderDayTimeColumn();

  const iso = isoFromDate(selectedDate);
  const items = scheduleItems
    .filter((it) => it.date === iso)
    .sort((a, b) => toMinutes(a.start) - toMinutes(b.start));

  $dayList.innerHTML = "";

  if (!items.length) {
    const empty = document.createElement("div");
    empty.className = "dayEmpty";
    empty.textContent = "No events for this day.";
    $dayList.appendChild(empty);
    return;
  }

  const gridStart = DAY_START_HOUR * 60;
  const gridEnd = DAY_END_HOUR * 60;

  items.forEach((it) => {
    const startM = toMinutes(it.start);
    const endM = toMinutes(it.end);

    const s = clamp(startM, gridStart, gridEnd);
    const e = clamp(endM, gridStart, gridEnd);
    if (e <= gridStart || s >= gridEnd) return;

    const row = minutesToRow(s);
    const span = durationToSpan(s, e);
    $dayList.appendChild(buildDayCard(it, row, span));
  });
}

// Render: month (desktop)
function renderMonth(selectedDate) {
  if (!$monthGrid) return;

  const year = selectedDate.getFullYear();
  const month = selectedDate.getMonth();

  if ($monthEl) $monthEl.textContent = formatMonth(selectedDate);
  if ($rangeEl) $rangeEl.textContent = formatMonthPill(selectedDate);

  $monthGrid.innerHTML = "";

  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);

  const startDow = (first.getDay() + 6) % 7; // Mon=0
  const daysInMonth = last.getDate();

  const header = document.createElement("div");
  header.className = "monthHeader";
  ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].forEach((t) => {
    const h = document.createElement("div");
    h.className = "monthDow";
    h.textContent = t;
    header.appendChild(h);
  });

  const grid = document.createElement("div");
  grid.className = "monthCells";

  for (let i = 0; i < startDow; i++) {
    const blank = document.createElement("div");
    blank.className = "monthBlank";
    grid.appendChild(blank);
  }

  const selectedISO = isoFromDate(getSelectedDate());

  for (let day = 1; day <= daysInMonth; day++) {
    const d = new Date(year, month, day);
    const iso = isoFromDate(d);

    const cell = document.createElement("button");
    cell.type = "button";
    cell.className = "monthCell";
    if (iso === selectedISO) cell.classList.add("isSelected");

    const badge = document.createElement("div");
    badge.className = "monthDayBadge";
    badge.textContent = String(day);

    const list = document.createElement("div");
    list.className = "monthEventList";

    const items = scheduleItems
      .filter((it) => it.date === iso)
      .sort((a, b) => toMinutes(a.start) - toMinutes(b.start));

    const maxShow = 2;
    items.slice(0, maxShow).forEach((it) => {
      const row = document.createElement("div");
      row.className = "monthEventRow";
      row.innerHTML = `
        <div class="monthEventTime">${it.start}–${it.end}</div>
        <div class="monthEventTitle">${it.course ?? ""}</div>
      `;
      if (it.cancelled) row.classList.add("isCancelled");
      list.appendChild(row);
    });

    if (items.length > maxShow) {
      const dots = document.createElement("div");
      dots.className = "monthDots";
      dots.innerHTML = `<span></span><span></span><span></span>`;
      list.appendChild(dots);
    }

    cell.appendChild(badge);
    cell.appendChild(list);

    cell.addEventListener("click", () => {
      setSelectedDate(d);
      setDesktopMode("day");
      render();
    });

    grid.appendChild(cell);
  }

  $monthGrid.appendChild(header);
  $monthGrid.appendChild(grid);
}

// Desktop tabs + nav
function setActiveTab() {
  if (isMobile()) return;
  const mode = getDesktopMode();

  document.querySelectorAll(".viewToggle .viewTab").forEach((a) => {
    const m = a.getAttribute("data-mode");
    a.classList.remove("viewTab--active");
    a.removeAttribute("aria-current");
    if (m === mode) {
      a.classList.add("viewTab--active");
      a.setAttribute("aria-current", "page");
    }
  });
}

function wireTabs() {
  document.querySelectorAll(".viewToggle .viewTab").forEach((a) => {
    a.addEventListener("click", (e) => {
      e.preventDefault();
      if (isMobile()) return;

      const mode = a.getAttribute("data-mode");
      if (mode === "day" || mode === "week" || mode === "month") {
        setDesktopMode(mode);
        render();
      }
    });
  });
}

function wireNav() {
  document.getElementById("btnToday")?.addEventListener("click", () => {
    setSelectedDate(new Date());
    render();
  });

  document.getElementById("btnPrev")?.addEventListener("click", () => {
    if (isMobile()) return;

    const mode = getDesktopMode();
    const d = getSelectedDate();

    if (mode === "day") d.setDate(d.getDate() - 1);
    else if (mode === "week") d.setDate(d.getDate() - 7);
    else if (mode === "month") d.setMonth(d.getMonth() - 1);

    setSelectedDate(d);
    render();
  });

  document.getElementById("btnNext")?.addEventListener("click", () => {
    if (isMobile()) return;

    const mode = getDesktopMode();
    const d = getSelectedDate();

    if (mode === "day") d.setDate(d.getDate() + 1);
    else if (mode === "week") d.setDate(d.getDate() + 7);
    else if (mode === "month") d.setMonth(d.getMonth() + 1);

    setSelectedDate(d);
    render();
  });
}

// Mobile week nav
function wireMobileWeekNavOnce() {
  $mPrevWeek?.addEventListener("click", () => {
    const d = getSelectedDate();
    d.setDate(d.getDate() - 7);
    setSelectedDate(d);
    render();
  });

  $mNextWeek?.addEventListener("click", () => {
    const d = getSelectedDate();
    d.setDate(d.getDate() + 7);
    setSelectedDate(d);
    render();
  });
}

// Main render
function render() {
  const mode = getEffectiveMode();
  const selectedDate = getSelectedDate();

  setViewVisibility(mode);
  setActiveTab();

  renderTimeColumn();

  if (mode === "week") renderWeek(selectedDate);
  if (mode === "day") renderDay(selectedDate);
  if (mode === "month") renderMonth(selectedDate);
}

// Boot
setGridVars();
wireTabs();
wireNav();
wireMobileWeekNavOnce();
wireMobileJumpToToday();

setSelectedDate(new Date());

if (!sessionStorage.getItem(STORAGE_MODE_DESKTOP)) {
  setDesktopMode("day");
}

render();

setInterval(updateNowLinePosition, 30000);

window.addEventListener("resize", () => {
  render();
});