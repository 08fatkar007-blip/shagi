/* ==========================================================
   «Шаги» — логика приложения

   1. Встроенные сценарии
   2. Состояние и хранение (localStorage)
   3. Вспомогательные функции
   4. Работа с процессами
   5. Отрисовка (включая «Следующий шаг» и календарь)
   6. Действия пользователя и горячие клавиши
   7. Диалог, резервная копия, импорт по ссылке
   8. Запуск
   ========================================================== */

"use strict";


/* ==========================================================
   1. ВСТРОЕННЫЕ СЦЕНАРИИ
   Шаг записывается как [текст, минуты].
   ========================================================== */

const TEMPLATES = [
  {
    title: "Переезд в новую квартиру",
    description: "От упаковки до первой ночи на новом месте.",
    steps: [
      ["Составить список вещей и решить, что оставить", 60],
      ["Заказать коробки и упаковочные материалы", 20],
      ["Договориться с перевозчиком", 30],
      ["Упаковать вещи по комнатам", 240],
      ["Передать показания счётчиков и закрыть счета", 30],
      ["Сообщить новый адрес банку и на работе", 25],
      ["Принять квартиру и сфотографировать состояние", 30],
    ],
  },
  {
    title: "Сборы в поездку",
    description: "Ничего не забыть и не бегать в последний день.",
    steps: [
      ["Проверить документы и срок действия паспорта", 10],
      ["Забронировать жильё и билеты", 45],
      ["Оформить страховку", 20],
      ["Скачать карты и билеты офлайн", 15],
      ["Собрать аптечку и зарядки", 25],
      ["Упаковать чемодан по списку", 40],
      ["Выключить технику и закрыть дом", 10],
    ],
  },
  {
    title: "Онбординг сотрудника",
    description: "Чтобы новичок вышел на результат быстрее.",
    steps: [
      ["Подготовить рабочее место и доступы", 45],
      ["Отправить план первой недели", 20],
      ["Представить команду", 30],
      ["Назначить наставника", 15],
      ["Поставить первую небольшую задачу", 30],
      ["Встреча по итогам первой недели", 30],
    ],
  },
  {
    title: "Подготовка к собеседованию",
    description: "Спокойно прийти и показать лучшее.",
    steps: [
      ["Изучить компанию и вакансию", 45],
      ["Обновить резюме под вакансию", 40],
      ["Подготовить 3 рассказа о своих результатах", 60],
      ["Продумать вопросы работодателю", 20],
      ["Прогнать ответы вслух", 30],
      ["Проверить связь или маршрут", 10],
    ],
  },
  {
    title: "Покупка авто с пробегом",
    description: "Защита от скрытых проблем и переплаты.",
    steps: [
      ["Определить бюджет и 3 модели", 60],
      ["Проверить историю по VIN", 20],
      ["Осмотреть кузов и салон при дневном свете", 45],
      ["Сделать диагностику у независимого мастера", 90],
      ["Проверить документы и владельцев", 30],
      ["Торговаться и оформить сделку", 90],
    ],
  },
  {
    title: "Запуск нового продукта",
    description: "Минимальный путь от идеи до первых клиентов.",
    steps: [
      ["Сформулировать проблему и целевого клиента", 60],
      ["Поговорить с 5 потенциальными клиентами", 240],
      ["Собрать минимальную версию", 480],
      ["Подготовить страницу с описанием", 120],
      ["Запустить для первых 10 пользователей", 60],
      ["Собрать отзывы и выписать доработки", 90],
    ],
  },
  {
    title: "Ремонт квартиры",
    description: "Порядок работ, чтобы не переделывать.",
    steps: [
      ["Определить бюджет с запасом 15%", 45],
      ["Сделать обмеры и план", 90],
      ["Выбрать подрядчика и подписать смету", 120],
      ["Закупить черновые материалы", 120],
      ["Электрика, сантехника, стяжка", 0],
      ["Чистовая отделка", 0],
      ["Приёмка работ по списку недочётов", 60],
    ],
  },
  {
    title: "Подготовка к экзамену",
    description: "План, который выдерживает реальный график.",
    steps: [
      ["Собрать программу и список тем", 30],
      ["Оценить каждую тему по 5-балльной шкале", 30],
      ["Составить расписание на оставшиеся дни", 30],
      ["Разобрать слабые темы", 240],
      ["Решить 2 пробных варианта", 180],
      ["Повторить конспекты за день до экзамена", 120],
    ],
  },
  {
    title: "Организация мероприятия",
    description: "От списка гостей до уборки после.",
    steps: [
      ["Определить цель, дату и бюджет", 30],
      ["Забронировать площадку", 45],
      ["Составить список гостей и разослать приглашения", 40],
      ["Договориться с подрядчиками (еда, звук)", 60],
      ["Подготовить программу по минутам", 45],
      ["Проверить площадку за день до события", 60],
      ["Собрать обратную связь после", 20],
    ],
  },
];


/** Варианты повторения процесса. */
const REPEAT_LABELS = {
  "": "Не повторять",
  daily: "Каждый день",
  weekly: "Каждую неделю",
  monthly: "Каждый месяц",
};

/* ==========================================================
   2. СОСТОЯНИЕ И ХРАНЕНИЕ

   Форма данных:
   state = {
     processes:   [{ id, title, due, repeat, restartOn, started, after, project, color, note, archived, archivedAt, steps: [{ text, minutes, done, note }] }],
     myTemplates: [{ title, description, steps: [[текст, минуты]] }],
     openId:      id раскрытого процесса или null,
     streak:      { last: "ГГГГ-ММ-ДД", count: число },
     notified:    { idПроцесса: дата последнего напоминания о сроке },
     aiEngine:    "claude" | "gemini" — какой ИИ выбран в окне «План по цели»,
     view:        "list" | "board" — как показывать процессы,
     theme:       "" | "light" | "dark"
   }
   ========================================================== */

const STORAGE_KEY = "shagi-data";
const OLD_STORAGE_KEY = "shagi2"; // прошлая версия приложения

function emptyState() {
  return {
    processes: [],
    myTemplates: [],
    openId: null,
    streak: { last: "", count: 0 },
    notified: {},
    aiEngine: "claude",
    view: "list",
    theme: "",
  };
}

/** Дополняет данные значениями по умолчанию (в том числе из старых версий). */
function normalizeState(data) {
  return { ...emptyState(), ...data };
}

/** Переводит данные прежней версии в текущий формат. */
function migrateOldData(old) {
  return {
    ...emptyState(),
    openId: old.open || null,
    theme: old.theme || "",
    streak: { last: old.streak?.last || "", count: old.streak?.n || 0 },
    processes: (old.p || []).map((p) => ({
      id: p.id,
      title: p.t,
      due: p.due || "",
      steps: p.s.map((s) => ({ text: s.t, minutes: s.m, done: s.d })),
    })),
    myTemplates: (old.mine || []).map((t) => ({
      title: t.n,
      description: t.d,
      steps: t.s,
    })),
  };
}

function loadState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return normalizeState(JSON.parse(saved));

    const old = localStorage.getItem(OLD_STORAGE_KEY);
    if (old) return migrateOldData(JSON.parse(old));
  } catch (error) {
    // Хранилище недоступно или данные повреждены — начинаем с чистого листа
  }
  return emptyState();
}

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    showSaveWarning(false);
  } catch (error) {
    // Хранилище недоступно или заполнено: приложение работает дальше, но человек должен об этом знать
    showSaveWarning(true);
  }
}

/** Плашка «не удаётся сохранить»; создаётся при первой ошибке. */
let saveBanner = null;

/** Заметная плашка вверху страницы, пока данные не удаётся сохранить. */
function showSaveWarning(visible) {
  if (!saveBanner) {
    if (!visible) return;
    const banner = document.createElement("div");
    banner.id = "save-warning";
    banner.className = "save-warning no-print";
    banner.setAttribute("role", "alert");
    banner.innerHTML = `<span>Не удаётся сохранить данные в этом браузере (возможно, включён приватный режим или нет места). После закрытия вкладки изменения пропадут.</span>
      <button class="pri sm" data-action="warnBackup">Скачать резервную копию</button>`;
    document.querySelector("main")?.prepend(banner);
    saveBanner = banner;
  }
  saveBanner.hidden = !visible;
}

/** Просим браузер хранить данные надёжно: без этого он может очистить их при нехватке места. */
function requestPersistentStorage() {
  try {
    navigator.storage?.persist?.()?.catch?.(() => {});
  } catch (error) {
    // не поддерживается — ничего страшного
  }
}

let state = loadState();


/* ==========================================================
   3. ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
   ========================================================== */

const $ = (id) => document.getElementById(id);

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** Экранирует текст пользователя перед вставкой в HTML. */
function escapeHtml(text) {
  const map = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" };
  return String(text).replace(/[&<>"]/g, (char) => map[char]);
}

/** Экранирует текст и превращает ссылки http(s) в кликабельные. */
function linkify(text) {
  return escapeHtml(text).replace(
    /(https?:\/\/[^\s<]+)/g,
    '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>'
  );
}

/** 135 → «2 ч 15 мин». */
function formatMinutes(total) {
  if (total < 60) return `${total} мин`;
  const hours = Math.floor(total / 60);
  const minutes = total % 60;
  return minutes ? `${hours} ч ${minutes} мин` : `${hours} ч`;
}

function makeId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

/** Дата в формате ГГГГ-ММ-ДД по местному времени. */
function dateKey(date) {
  const pad = (n) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** Дата на n дней раньше сегодняшней. */
function daysAgo(n) {
  const date = new Date();
  date.setDate(date.getDate() - n);
  return date;
}

function today() {
  return dateKey(new Date());
}

function yesterday() {
  return dateKey(daysAgo(1));
}

function clock(seconds) {
  const pad = (n) => String(n).padStart(2, "0");
  return `${pad(Math.floor(seconds / 60))}:${pad(seconds % 60)}`;
}

/** После перерисовки возвращает фокус на ту же кнопку (чтобы стрелками можно было двигать дальше с клавиатуры). */
function keepFocus(action, id) {
  setTimeout(() => {
    const button = document.querySelector(`[data-action="${action}"][data-id="${id}"]`);
    if (button && !button.disabled) button.focus();
    else document.getElementById(`proc-${id}`)?.scrollIntoView({ block: "nearest" });
  }, 0);
}

/**
 * Показывает короткое сообщение внизу экрана.
 * Если передан undo, рядом с сообщением появляется кнопка (по умолчанию «Отменить»,
 * можно задать другую подпись, например «В архив»),
 * а сообщение остаётся дольше — этим приложение заменяет часть окон подтверждения.
 */
function toast(message, undo, label = "Отменить") {
  const box = $("toast");
  const button = $("toast-undo");

  $("toast-text").textContent = message;
  box.className = "on";
  clearTimeout(toast.timer);

  button.hidden = !undo;
  button.textContent = label;
  button.onclick = undo
    ? () => {
        clearTimeout(toast.timer);
        box.className = "";
        undo();
      }
    : null;

  toast.timer = setTimeout(() => (box.className = ""), undo ? 6000 : 2200);
}

/** Сохраняет текст в файл на компьютере пользователя. */
function downloadFile(name, content, type) {
  const link = document.createElement("a");
  link.href = URL.createObjectURL(new Blob([content], { type }));
  link.download = name;
  link.click();
}

function copyToClipboard(text, successMessage) {
  const fail = () => toast("Не удалось скопировать");
  try {
    navigator.clipboard.writeText(text).then(() => toast(successMessage), fail);
  } catch (error) {
    fail();
  }
}

/** Строка → base64 с поддержкой кириллицы (для ссылок). */
function toBase64(text) {
  const bytes = new TextEncoder().encode(text);
  return btoa(String.fromCharCode(...bytes));
}

function fromBase64(base64) {
  const bytes = Uint8Array.from(atob(base64), (char) => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}


/* ==========================================================
   4. РАБОТА С ПРОЦЕССАМИ
   ========================================================== */

function allTemplates() {
  return [...TEMPLATES, ...state.myTemplates];
}

/** Шаг задаётся как [текст, минуты, выполнен?, заметка?]. */
function addProcess(title, steps, due = "") {
  const process = {
    id: makeId(),
    title,
    due,
    steps: steps.map(([text, minutes, done, note]) => ({
      text,
      minutes: minutes || 0,
      done: Boolean(done),
      note: note || "",
    })),
  };
  state.processes.unshift(process);
  state.openId = process.id;
  saveState();
  render();
}

/** Считает прогресс одного процесса. */
function getProgress(process) {
  const total = process.steps.length;
  const done = process.steps.filter((step) => step.done).length;
  const minutesLeft = process.steps
    .filter((step) => !step.done)
    .reduce((sum, step) => sum + step.minutes, 0);

  return {
    total,
    done,
    minutesLeft,
    percent: total ? Math.round((done / total) * 100) : 0,
    isComplete: total > 0 && done === total,
  };
}

/** Полоса прогресса «по ступенькам»: по одной ступеньке на шаг (для очень длинных процессов — сплошная). */
function barSteps(progress) {
  return progress.total >= 2 && progress.total <= 24 ? ` style="--n:${progress.total}"` : "";
}

/** Сколько дней до срока (отрицательное — просрочено). */
function daysUntil(dueDate) {
  const due = new Date(`${dueDate}T00:00:00`);
  const now = new Date(`${today()}T00:00:00`);
  return Math.round((due - now) / MS_PER_DAY);
}

function moveStep(process, from, to) {
  if (to < 0 || to >= process.steps.length) return;
  const [step] = process.steps.splice(from, 1);
  process.steps.splice(to, 0, step);
}

/** Запоминает, что сегодня был отмечен шаг (для серии дней подряд). */
function markActivityToday() {
  if (state.streak.last === today()) return;
  state.streak.count = state.streak.last === yesterday() ? state.streak.count + 1 : 1;
  state.streak.last = today();
}

/** Прибавляет к дате интервал повтора («daily», «weekly», «monthly»). */
function addInterval(date, repeat) {
  const result = new Date(`${date}T00:00:00`);
  if (repeat === "daily") result.setDate(result.getDate() + 1);
  if (repeat === "weekly") result.setDate(result.getDate() + 7);
  if (repeat === "monthly") result.setMonth(result.getMonth() + 1);
  return dateKey(result);
}

/** Запускает заново процессы, у которых наступила дата повтора. */
function restartDueProcesses() {
  let changed = false;

  for (const process of state.processes) {
    if (process.restartOn && process.restartOn <= today()) {
      process.steps.forEach((step) => (step.done = false));
      process.started = false;
      process.restartOn = "";
      process.due = "";
      changed = true;
    }
  }
  return changed;
}

/** Отмечает или снимает шаг: статистика, серия, завершение процесса, повтор. */
function setStepDone(process, step, done) {
  const wasComplete = getProgress(process).isComplete;
  step.done = done;
  if (done) markActivityToday();

  const isComplete = getProgress(process).isComplete;
  const events = [];

  if (!wasComplete && isComplete) {
    events.push("Процесс завершён");
    if (process.repeat) {
      process.restartOn = addInterval(today(), process.repeat);
      events.push(`заново ${process.restartOn}`);
    }
  } else if (wasComplete && !isComplete) {
    process.restartOn = "";
  }
  if (events.length) {
    // Завершённый процесс можно убрать в архив одним нажатием (повторяющиеся вернутся сами)
    const canArchive = !wasComplete && isComplete && !process.repeat;
    toast(events.join(" · "), canArchive ? () => archiveFromToast(process) : undefined, "В архив");
  }
}

function archiveFromToast(process) {
  ACTIONS.archive({ process });
  saveState();
  render();
}

/* ---------- Календарь ---------- */

/** Цвета меток процессов и подготовленный кружок-точка для каждого. */
const TAG_COLORS = ["red", "orange", "yellow", "green", "blue", "purple"];

/** Кружок-метка перед названием процесса, если у него выбран цвет. */
function tagDot(process) {
  return TAG_COLORS.includes(process.color) ? `<span class="tag tag-${process.color}"></span>` : "";
}

/** Активный фильтр по проекту в списке процессов (пусто — показаны все). */
let projectFilter = "";

/** Порядок отображения списка и доски: «manual» — как добавлено, иначе по due/title/progress. */
let sortMode = "manual";

const SORTERS = {
  due: (a, b) => (a.due || "9999").localeCompare(b.due || "9999"),
  title: (a, b) => a.title.localeCompare(b.title, "ru"),
  progress: (a, b) => getProgress(a).percent - getProgress(b).percent,
};

/** Применяет выбранную сортировку, не трогая порядок хранения процессов в данных. */
function sortProcesses(list) {
  const sorter = SORTERS[sortMode];
  const sorted = sorter ? [...list].sort(sorter) : list;
  // Закреплённые всегда выше остальных; порядок внутри каждой группы сохраняется
  return [...sorted.filter((process) => process.pinned), ...sorted.filter((process) => !process.pinned)];
}

/** Развёрнут ли список архива (сбрасывается при перезагрузке страницы). */
let archiveOpen = false;

/** Что показывает календарь сейчас: выбранный месяц и день. */
const calendar = {
  year: new Date().getFullYear(),
  month: new Date().getMonth(),
  selected: today(),
};

const WEEKDAYS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

const EVENT_LABELS = {
  due: "срок",
  late: "просрочено",
  restart: "запуск заново",
};

/** События по датам: { "ГГГГ-ММ-ДД": [{ process, kind }] }. */
function calendarEvents() {
  const events = {};
  const add = (date, event) => (events[date] = [...(events[date] || []), event]);

  for (const process of state.processes) {
    if (process.archived) continue;
    if (process.due) {
      const isLate = process.due < today() && !getProgress(process).isComplete;
      add(process.due, { process, kind: isLate ? "late" : "due" });
    }
    if (process.restartOn) add(process.restartOn, { process, kind: "restart" });
  }
  return events;
}

/** Ячейки месяца: пустые (null) перед первым числом и даты дальше. Неделя с понедельника. */
function monthGrid(year, month) {
  const offset = (new Date(year, month, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = Array(offset).fill(null);

  for (let day = 1; day <= daysInMonth; day++) {
    cells.push(dateKey(new Date(year, month, day)));
  }
  return cells;
}

function shiftMonth(delta) {
  const date = new Date(calendar.year, calendar.month + delta, 1);
  calendar.year = date.getFullYear();
  calendar.month = date.getMonth();
}

/** Режет строку файла .ics на части по правилу «не больше 75 байт». */
function foldLine(line) {
  const encoder = new TextEncoder();
  const parts = [];
  let chunk = "";
  let bytes = 0;

  for (const char of line) {
    const size = encoder.encode(char).length;
    if (bytes + size > 73) {
      parts.push(chunk);
      chunk = " ";
      bytes = 1;
    }
    chunk += char;
    bytes += size;
  }
  parts.push(chunk);
  return parts.join("\r\n");
}

/**
 * Файл календаря (.ics) для Google Calendar, Apple Calendar, Outlook.
 * Событие на весь день, повтор передаётся правилом RRULE,
 * напоминание приходит накануне в 9:00. Возвращает null, если сроков нет.
 */
function buildIcs() {
  const stamp = new Date().toISOString().replace(/[-:]/g, "").slice(0, 15) + "Z";
  const frequency = { daily: "DAILY", weekly: "WEEKLY", monthly: "MONTHLY" };
  const compact = (date) => date.replace(/-/g, "");
  const escapeIcs = (text) =>
    String(text).replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");

  const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Shagi//RU", "CALSCALE:GREGORIAN"];
  let count = 0;

  for (const process of state.processes) {
    const start = process.due || process.restartOn;
    if (!start) continue;

    const steps = process.steps.map((step) => `${step.done ? "[x]" : "[ ]"} ${step.text}`).join("\n");
    lines.push(
      "BEGIN:VEVENT",
      `UID:${process.id}@shagi`,
      `DTSTAMP:${stamp}`,
      `DTSTART;VALUE=DATE:${compact(start)}`,
      `DTEND;VALUE=DATE:${compact(addInterval(start, "daily"))}`,
      `SUMMARY:${escapeIcs(process.title)}`,
      `DESCRIPTION:${escapeIcs(steps)}`
    );
    if (process.repeat) lines.push(`RRULE:FREQ=${frequency[process.repeat]}`);
    lines.push("BEGIN:VALARM", "ACTION:DISPLAY", "DESCRIPTION:Напоминание", "TRIGGER:-PT15H", "END:VALARM", "END:VEVENT");
    count += 1;
  }

  if (!count) return null;
  lines.push("END:VCALENDAR");
  return lines.map(foldLine).join("\r\n") + "\r\n";
}

/* ---------- Доска ---------- */

const BOARD_COLUMNS = [
  { id: "todo", title: "Не начато" },
  { id: "doing", title: "В работе" },
  { id: "done", title: "Готово" },
];

/** Статус процесса: все шаги сделаны → «Готово», есть прогресс или нажали «в работе» → «В работе». */
function processStatus(process) {
  const progress = getProgress(process);
  if (progress.isComplete) return "done";
  return progress.done > 0 || process.started ? "doing" : "todo";
}

/**
 * Переносит процесс в другую колонку доски.
 * «Готово» — отмечает все шаги, «Не начато» — сбрасывает прогресс,
 * «В работе» — если процесс был завершён, снимает последний шаг.
 * Возвращает false, если перенос отменён или не нужен.
 */
function moveProcess(process, target) {
  const current = processStatus(process);
  if (current === target) return false;

  if (target === "done") {
    if (!confirm(`Отметить все шаги процесса «${process.title}» выполненными?`)) return false;
    process.steps.filter((step) => !step.done).forEach((step) => setStepDone(process, step, true));
  } else if (target === "todo") {
    if (process.steps.some((step) => step.done) && !confirm(`Сбросить прогресс процесса «${process.title}»?`)) return false;
    process.steps.forEach((step) => (step.done = false));
    process.started = false;
    process.restartOn = "";
  } else {
    if (current === "done") {
      const lastDone = [...process.steps].reverse().find((step) => step.done);
      if (lastDone) setStepDone(process, lastDone, false);
    }
    process.started = true;
  }
  return true;
}

/** Сдвигает процесс на колонку влево (-1) или вправо (+1). */
function shiftStatus(process, delta) {
  const order = BOARD_COLUMNS.map((column) => column.id);
  const target = order[order.indexOf(processStatus(process)) + delta];
  return target ? moveProcess(process, target) : false;
}


/** Замкнётся ли круг, если процесс будет ждать процесс с id targetId (A ждёт B, B ждёт A). */
function wouldCreateCycle(process, targetId) {
  const seen = new Set();
  let id = targetId;

  while (id && !seen.has(id)) {
    if (id === process.id) return true;
    seen.add(id);
    id = state.processes.find((p) => p.id === id)?.after;
  }
  return false;
}

/** Незавершённые процессы не из архива: сначала с ближайшим сроком. */
function activeProcesses() {
  return state.processes
    .filter((process) => !process.archived && !getProgress(process).isComplete)
    .sort((a, b) => (a.due || "9999").localeCompare(b.due || "9999"));
}

/**
 * Подборка шагов под свободное время: идём по процессам от самого срочного
 * и берём шаги, пока они помещаются. В процессе «по очереди» останавливаемся
 * на первом шаге, который не помещается, чтобы не нарушить порядок.
 */
function planForMinutes(budget) {
  const items = [];
  let left = budget;

  for (const process of activeProcesses()) {
    for (let index = 0; index < process.steps.length; index++) {
      const step = process.steps[index];
      if (step.done) continue;
      if (step.minutes > 0 && step.minutes <= left) {
        items.push({ process, index, step });
        left -= step.minutes;
      } else if (process.ordered) break;
    }
    if (left <= 0 || items.length >= 8) break;
  }
  return { items, used: budget - left };
}

/** Выбранное время в блоке «Есть время» (только в памяти страницы). */
let fitMinutes = 0;

function renderFit() {
  const chips = [15, 30, 60]
    .map((n) => `<button class="${fitMinutes === n ? "pri" : "ghost"} sm" data-action="fitSet" data-minutes="${n}" aria-pressed="${fitMinutes === n}">${n === 60 ? "1 час" : n + " мин"}</button>`)
    .join("");

  let list = "";
  if (fitMinutes) {
    const { items, used } = planForMinutes(fitMinutes);
    list = items.length
      ? `<div class="fit-list"><div class="fit-title">Успеете за ${formatMinutes(used)}:</div>${items
          .map(({ process, index, step }) => `<div class="fit-row"><span>${escapeHtml(step.text)} <i>${escapeHtml(process.title)} · ${formatMinutes(step.minutes)}</i></span><button class="ghost sm" data-action="fitDone" data-id="${process.id}" data-index="${index}">Готово</button></div>`)
          .join("")}</div>`
      : '<div class="fit-list">Ничего не помещается: у оставшихся шагов не задано время или они длиннее.</div>';
  }
  return `<div class="fit"><span>Есть время:</span>${chips}${list}</div>`;
}

/** Ближайший невыполненный шаг: сначала процессы с ближайшим сроком. */
function findNextStep() {
  for (const process of activeProcesses()) {
    const index = process.steps.findIndex((step) => !step.done);
    if (index >= 0) return { process, index, step: process.steps[index] };
  }
  return null;
}

/** Только что добавленный шаг («idПроцесса:номер»): на секунду подсвечивается. Сбрасывается после отрисовки. */
let freshStep = "";

/** Ключи шагов, у которых сейчас открыто поле заметки («idПроцесса:номер»). */
const openNotes = new Set();

/** Серия «жива», если последний шаг отмечен сегодня или вчера. */
function currentStreak() {
  const alive = state.streak.last === today() || state.streak.last === yesterday();
  return alive ? state.streak.count : 0;
}

/** Процесс в виде текстового чек-листа. */
function processToText(process) {
  let header = process.title + (process.due ? ` (до ${process.due})` : "");
  if (process.note) header += `\n${process.note}`;
  const lines = process.steps.map((step) => {
    const mark = step.done ? "[x]" : "[ ]";
    const time = step.minutes ? ` — ${formatMinutes(step.minutes)}` : "";
    const note = step.note ? `\n    ${step.note}` : "";
    return `${mark} ${step.text}${time}${note}`;
  });
  return [header, ...lines].join("\n");
}

/** Ссылка, по которой другой человек получит копию процесса. */
function processToLink(process) {
  const payload = {
    title: process.title,
    steps: process.steps.map((step) => [step.text, step.minutes]),
  };
  const base = location.href.split("#")[0];
  return `${base}#p=${encodeURIComponent(toBase64(JSON.stringify(payload)))}`;
}

/** Разбирает текст «шаг; минуты» построчно. */
function parseStepLines(text) {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const cut = line.lastIndexOf(";");
      const tail = line.slice(cut + 1).trim();
      if (cut > 0 && /^\d+$/.test(tail)) return [line.slice(0, cut).trim(), Number(tail)]; // прежняя запись «шаг; 30»

      // Обычная запись: маркеры и номера убираем, время вроде «30 мин» или «1,5 ч» распознаём
      const { minutes, text: clean } = extractMinutes(line.replace(ITEM_MARK, ""));
      return [clean || line, minutes];
    });
}


/* ---------- Импорт из текста ---------- */

/** Маркер списка в начале строки: «-», «•», «1.», «2)», «[ ]», «[x]». */
const ITEM_MARK = /^\s*(?:[-*•–—]|\d+[.)]|\[[ xXхХ]?\])\s+/;

/** Время в тексте: «30 мин», «2 ч», «1,5 часа», «15 min». */
const TIME_PATTERN = /(\d+(?:[.,]\d+)?)\s*(часов|часа|час|ч|минуты|минут|минута|мин|hours|hour|hrs|hr|h|minutes|min)(?![\p{L}])/giu;

/** Числа, которые распознавание речи может написать словами. */
const SPOKEN_NUMBERS = {
  один: 1, одну: 1, одна: 1, два: 2, две: 2, три: 3, четыре: 4, пять: 5, шесть: 6, семь: 7, восемь: 8,
  девять: 9, десять: 10, одиннадцать: 11, двенадцать: 12, пятнадцать: 15, двадцать: 20, тридцать: 30,
  сорок: 40, пятьдесят: 50, шестьдесят: 60, девяносто: 90,
};

/** «двадцать пять минут» → «25 минут», «полчаса» → «30 мин», «полтора часа» → «90 мин». */
function normalizeSpokenTime(text) {
  const spoken = /(^|[^\p{L}])((?:двадцать|тридцать|сорок|пятьдесят)\s+(?:один|два|три|четыре|пять|шесть|семь|восемь|девять)|[а-яё]+)(?=\s+(?:минут|мин|час))/giu;

  return text
    .replace(/полтора\s+часа/giu, "90 мин")
    .replace(/пол\s*часа/giu, "30 мин")
    .replace(spoken, (match, prefix, words) => {
      const parts = words.toLowerCase().split(/\s+/);
      if (!parts.every((part) => SPOKEN_NUMBERS[part])) return match;
      return prefix + parts.reduce((sum, part) => sum + SPOKEN_NUMBERS[part], 0);
    });
}

/** Достаёт время из строки: «Позвонить (15 мин)» → { minutes: 15, text: "Позвонить" }. */
function extractMinutes(line) {
  let minutes = 0;

  const rest = normalizeSpokenTime(line).replace(TIME_PATTERN, (match, amount, unit) => {
    const value = parseFloat(amount.replace(",", "."));
    minutes += /^(ч|h)/i.test(unit) ? value * 60 : value;
    return "";
  });

  const text = rest
    .replace(/\(\s*\)/g, "")
    .replace(/\s{2,}/g, " ")
    .replace(/\s*(?:около|примерно|~)\s*$/i, "")
    .replace(/[\s\-–—,;:~(]+$/, "")
    .replace(/^[\s,;:)]+/, "")
    .trim();

  return { minutes: Math.round(minutes), text };
}

/**
 * Превращает вставленный текст в процесс.
 * Понимает маркеры и номера, время в строке, готовые отметки «[x]»,
 * заголовок первой строкой («Название:» или «Название (до 2026-10-05)»)
 * и заметки — строки с отступом под шагом. Формат «Копировать текстом» читается обратно.
 */
function parseTextToProcess(raw) {
  const lines = raw.replace(/\r/g, "").split("\n").filter((line) => line.trim());
  const isItem = (line) => ITEM_MARK.test(line);
  let title = "";
  let due = "";

  const first = lines[0];
  const looksLikeTitle =
    first && !isItem(first) && !/^\s/.test(first) &&
    (first.trim().endsWith(":") || lines.slice(1).some(isItem));

  if (looksLikeTitle) {
    const header = lines.shift().trim();
    const dueMatch = header.match(/\(до (\d{4}-\d{2}-\d{2})\)/);
    due = dueMatch ? dueMatch[1] : "";
    title = header.replace(/\(до \d{4}-\d{2}-\d{2}\)/, "").replace(/:$/, "").trim();
  }

  const steps = [];
  for (const line of lines) {
    const isNote = steps.length > 0 && !isItem(line) && /^(\s{2,}|\t)/.test(line);

    if (isNote) {
      const step = steps[steps.length - 1];
      step[3] = step[3] ? `${step[3]}\n${line.trim()}` : line.trim();
      continue;
    }

    const done = /^\s*\[[xXхХ]\]/.test(line);
    const { minutes, text } = extractMinutes(line.replace(ITEM_MARK, ""));
    if (text) steps.push([text, minutes, done, ""]);
  }

  return { title, due, steps };
}


/* ---------- План по цели (ИИ) ---------- */

const AI_TIMEOUT_MS = 30000;

/** Проверяет и чистит ответ сервера: { title, steps: [[текст, минуты]] }. */
function normalizePlan(data) {
  const steps = (Array.isArray(data?.steps) ? data.steps : [])
    .slice(0, 15)
    .map((step) => [
      String(step?.text ?? "").trim().slice(0, 200),
      Math.min(600, Math.max(0, Math.round(Number(step?.minutes) || 0))),
    ])
    .filter(([text]) => text);

  if (!steps.length) throw new Error("ИИ не вернул шаги. Попробуйте переформулировать цель.");

  const title = String(data?.title ?? "").trim().slice(0, 120) || "План";
  return { title, steps };
}

/** Адрес функции для выбранного движка ИИ. */
function planEndpoint() {
  return state.aiEngine === "gemini" ? AI_ENDPOINT_GEMINI : AI_ENDPOINT;
}

/** Просит сервер составить план по цели через выбранный движок (Claude или Gemini). */
async function requestPlan(goal) {
  const endpoint = planEndpoint();
  if (!endpoint) throw new Error("Этот ИИ-помощник не подключён. Инструкция — в README.md.");

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), AI_TIMEOUT_MS);

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ goal }),
      signal: controller.signal,
    });
    const data = await response.json().catch(() => ({}));

    if (!response.ok) throw new Error(data.error || `Ошибка сервера (${response.status})`);
    return normalizePlan(data);
  } finally {
    clearTimeout(timer);
  }
}


/* ---------- Карточка для соцсетей ---------- */

const CARD_SIZE = 1080;

/** Адрес сайта без служебной части после «#». */
function siteUrl() {
  return location.href.split("#")[0];
}

/** Разбивает текст на строки, которые помещаются в maxWidth (не больше maxLines). */
function wrapText(ctx, text, maxWidth, maxLines) {
  const lines = [];
  let line = "";

  for (const word of text.split(/\s+/).filter(Boolean)) {
    const attempt = line ? `${line} ${word}` : word;
    if (line && ctx.measureText(attempt).width > maxWidth) {
      lines.push(line);
      line = word;
    } else {
      line = attempt;
    }
  }
  if (line) lines.push(line);

  if (lines.length > maxLines) {
    lines.length = maxLines;
    lines[maxLines - 1] += "…";
  }
  return lines;
}

/** Рисует квадратную картинку с прогрессом процесса. Возвращает PNG (Blob). */
async function renderShareCard(process) {
  try {
    await document.fonts.load("800 68px Manrope");
  } catch (error) {
    // Шрифт не загрузился — будет системный
  }

  const canvas = document.createElement("canvas");
  canvas.width = CARD_SIZE;
  canvas.height = CARD_SIZE;
  const ctx = canvas.getContext("2d");

  const progress = getProgress(process);
  const doneMinutes = process.steps.filter((step) => step.done).reduce((sum, step) => sum + step.minutes, 0);
  const font = (weight, size) => `${weight} ${size}px Manrope, system-ui, "Segoe UI", sans-serif`;

  // Фон
  const background = ctx.createLinearGradient(0, 0, CARD_SIZE, CARD_SIZE);
  background.addColorStop(0, "#2F5BFF");
  background.addColorStop(1, "#14213D");
  ctx.fillStyle = background;
  ctx.fillRect(0, 0, CARD_SIZE, CARD_SIZE);

  // Название процесса
  ctx.fillStyle = "#FFFFFF";
  ctx.textAlign = "left";
  ctx.font = font(800, 68);
  wrapText(ctx, process.title, 900, 3).forEach((line, i) => ctx.fillText(line, 90, 170 + i * 84));

  // Кольцо прогресса
  const centerX = CARD_SIZE / 2;
  const centerY = 600;
  const radius = 210;
  const start = -Math.PI / 2;

  ctx.lineWidth = 36;
  ctx.lineCap = "round";
  ctx.strokeStyle = "rgba(255, 255, 255, 0.22)";
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
  ctx.stroke();

  if (progress.percent > 0) {
    ctx.strokeStyle = "#FFFFFF";
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, start, start + (Math.PI * 2 * progress.percent) / 100);
    ctx.stroke();
  }

  ctx.textAlign = "center";
  ctx.font = font(800, 150);
  ctx.fillText(`${progress.percent}%`, centerX, centerY + 52);

  // Подписи под кольцом
  ctx.font = font(600, 44);
  ctx.fillText(`Готово ${progress.done} из ${progress.total} шагов`, centerX, 890);
  if (doneMinutes) {
    ctx.font = font(400, 36);
    ctx.fillText(`Выполнено работы на ${formatMinutes(doneMinutes)}`, centerX, 942);
  }

  // Подвал: название приложения и адрес сайта
  ctx.textAlign = "left";
  ctx.font = font(800, 42);
  ctx.fillText("Шаги", 90, 1030);
  ctx.textAlign = "right";
  ctx.font = font(600, 34);
  ctx.fillText(location.host || "Сложное в понятные шаги", CARD_SIZE - 90, 1030);

  return new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
}

/** Открывает меню «Поделиться» с картинкой, а если оно недоступно — скачивает файл. */
async function shareProcessCard(process) {
  try {
    const blob = await renderShareCard(process);
    if (!blob) throw new Error("Не удалось создать картинку");

    const file = new File([blob], "shagi-progress.png", { type: "image/png" });
    if (navigator.canShare?.({ files: [file] })) {
      await navigator.share({ files: [file], title: process.title, text: "Мой прогресс в приложении «Шаги»" });
    } else {
      downloadFile("shagi-progress.png", blob, "image/png");
      toast("Картинка сохранена. Выложите её в соцсети");
    }
  } catch (error) {
    if (error.name !== "AbortError") toast("Не удалось создать картинку");
  }
}


/* ==========================================================
   5. ОТРИСОВКА
   ========================================================== */

/** Собирает процессы в проекты: общий прогресс и число процессов на каждый. */
function getProjects() {
  const byName = new Map();

  for (const process of state.processes) {
    if (process.archived) continue;
    const name = (process.project || "").trim();
    if (!name) continue;

    const progress = getProgress(process);
    const entry = byName.get(name) || { name, count: 0, done: 0, total: 0 };
    entry.count += 1;
    entry.done += progress.done;
    entry.total += progress.total;
    byName.set(name, entry);
  }
  return [...byName.values()].sort((a, b) => a.name.localeCompare(b.name, "ru"));
}

/** Строка фильтров-чипов по проектам и список подсказок для поля «Проект». */
function renderProjects() {
  const projects = getProjects();

  // Проекта, по которому фильтруем, больше нет — сбрасываем фильтр
  if (projectFilter && !projects.some((project) => project.name === projectFilter)) projectFilter = "";

  $("project-list").innerHTML = projects.map((project) => `<option value="${escapeHtml(project.name)}">`).join("");

  if (!projects.length) {
    $("projects").innerHTML = "";
    return;
  }

  const chip = (name, label, active) =>
    `<button class="${active ? "pri" : "ghost"} sm" data-action="setProjectFilter" data-project="${escapeHtml(name)}">${label}</button>`;

  const chips = projects
    .map((project) => {
      const percent = project.total ? Math.round((project.done / project.total) * 100) : 0;
      const filterBtn = chip(project.name, `${escapeHtml(project.name)} — ${percent}% (${project.count})`, projectFilter === project.name);
      const renameBtn = `<button class="ghost sm ren" data-action="renameProject" data-project="${escapeHtml(
        project.name
      )}" aria-label="Переименовать проект «${escapeHtml(project.name)}»">✎</button>`;
      return `<span class="chip-group">${filterBtn}${renameBtn}</span>`;
    })
    .join("");

  $("projects").innerHTML = `<div class="chips">${chip("", "Все", !projectFilter)}${chips}</div>`;
}

function renderStats() {
  const processes = state.processes;
  const progress = processes.map(getProgress);

  // «Сделано из»: только процессы в работе, иначе архив искажает картину. Достижения считаем по всем.
  const active = processes.filter((p) => !p.archived).map(getProgress);
  const doneSteps = active.reduce((sum, p) => sum + p.done, 0);
  const totalSteps = active.reduce((sum, p) => sum + p.total, 0);
  const finished = progress.filter((p) => p.isComplete).length;
  const doneMinutes = processes
    .flatMap((p) => p.steps)
    .filter((step) => step.done)
    .reduce((sum, step) => sum + step.minutes, 0);

  // Одна тихая строка вместо четырёх плиток; нулевые показатели не показываем
  const streak = currentStreak();
  const parts = [];
  if (totalSteps) parts.push(`<span><b>${doneSteps} из ${totalSteps}</b> шагов сделано</span>`);
  if (doneMinutes) parts.push(`<span><b>${formatMinutes(doneMinutes)}</b> работы выполнено</span>`);
  if (finished) parts.push(`<span>процессов закрыто: <b>${finished}</b></span>`);
  if (streak) parts.push(`<span>серия: <b>${streak} дн.</b></span>`);

  $("stats").innerHTML = parts.join("");
}

/** Подпись срока рядом с прогрессом. */
function renderDueBadge(process, progress) {
  if (!process.due || progress.isComplete) return "";

  const days = daysUntil(process.due);
  if (days < 0) return ` · <span class="badge late">просрочено на ${-days} дн.</span>`;
  if (days <= 2) return ` · <span class="badge soon">осталось ${days} дн.</span>${renderDailyLoad(process, days)}`;
  return ` · до ${process.due}${renderDailyLoad(process, days)}`;
}

/** Сколько времени в день нужно, чтобы успеть к сроку (считаем сегодняшний день). */
function renderDailyLoad(process, days) {
  const remaining = process.steps.reduce((sum, step) => sum + (step.done ? 0 : step.minutes || 0), 0);
  if (!remaining) return "";

  if (days === 0) return ` · сегодня нужно ≈ ${formatMinutes(remaining)}`;

  const perDay = Math.ceil(remaining / (days + 1));
  const text = `≈ ${formatMinutes(perDay)} в день`;
  return perDay > 480
    ? ` · <span class="badge late">${text} — вряд ли успеть</span>`
    : ` · ${text}`;
}

/** В процессе «по очереди» шаг закрыт, пока не выполнены все шаги перед ним. */
function isStepLocked(process, index) {
  if (!process.ordered || process.steps[index].done) return false;
  return index > process.steps.findIndex((step) => !step.done);
}

function renderStep(process, step, index) {
  const locked = isStepLocked(process, index);
  const checkboxId = `step-${process.id}-${index}`;
  const attrs = `data-id="${process.id}" data-index="${index}"`;
  const noteKey = `${process.id}:${index}`;

  let noteHtml = "";
  if (openNotes.has(noteKey)) {
    // Панель «Изменить шаг»: заметка и подписанные действия вместо трёх мелких кнопок в каждой строке
    const last = index === process.steps.length - 1;
    noteHtml = `<textarea class="note-edit" rows="2" placeholder="Заметка или ссылка"
      data-action="saveNote" ${attrs} data-note="${noteKey}">${escapeHtml(step.note || "")}</textarea>
      <div class="step-tools">
        <button class="ghost sm" data-action="up" ${attrs} ${index === 0 ? "disabled" : ""}>▲ Выше</button>
        <button class="ghost sm" data-action="down" ${attrs} ${last ? "disabled" : ""}>▼ Ниже</button>
        <button class="ghost sm" data-action="deleteStep" ${attrs}>Удалить шаг</button>
      </div>`;
  } else if (step.note) {
    noteHtml = `<div class="note">${linkify(step.note)}</div>`;
  }

  return `
    <div class="step${step.done ? " on" : ""}${locked ? " locked" : ""}${freshStep === `${process.id}:${index}` ? " fresh" : ""}"${locked ? ' title="Сначала выполните предыдущий шаг"' : ""}>
      <input type="checkbox" id="${checkboxId}" data-action="toggle" ${attrs} ${step.done ? "checked" : ""} ${locked ? "disabled" : ""}>
      <label for="${checkboxId}">${escapeHtml(step.text)}</label>
      ${step.minutes ? `<small>${formatMinutes(step.minutes)}</small>` : ""}
      <button class="x" data-action="toggleNote" ${attrs} aria-label="Изменить шаг" aria-expanded="${openNotes.has(noteKey)}" title="Заметка, порядок, удаление">✎</button>
      ${noteHtml ? `<div class="step-note">${noteHtml}</div>` : ""}
    </div>`;
}

/** Раскрытая часть процесса: шаги, добавление, срок, инструменты. */
/** Мелкие настройки вида (не данные): хранятся отдельно, чтобы не менять формат резервной копии. */
function readUiValue(key) {
  try {
    return localStorage.getItem(key) || "";
  } catch (error) {
    return "";
  }
}

function writeUiValue(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch (error) {
    // без хранилища настройка просто не запомнится
  }
}

const readUiFlag = (key) => readUiValue(key) === "1";
const writeUiFlag = (key, value) => writeUiValue(key, value ? "1" : "0");

/** Подпись у резервной копии: когда была последняя, и подсветка кнопки, если давно или ни разу. */
function renderBackupNote() {
  const last = readUiValue("shagi-last-backup");
  const age = last ? -daysUntil(last) : null;
  const stale = state.processes.length > 0 && (age === null || age > 14);

  let text = "Резервная копия всех данных:";
  if (state.processes.length) {
    if (age === null) text = "Резервная копия ещё не создавалась:";
    else if (age <= 0) text = "Последняя копия: сегодня.";
    else if (age === 1) text = "Последняя копия: вчера.";
    else text = `Последней копии ${age} дн.${stale ? " Пора обновить:" : ""}`;
  }
  $("backup-note").textContent = text;
  $("export-btn").className = stale ? "pri sm" : "ghost sm";
}

/** Сдвигает дату вида ГГГГ-ММ-ДД на заданное число дней. */
function shiftDate(isoDate, days) {
  const date = new Date(`${isoDate}T00:00:00`);
  date.setDate(date.getDate() + days);
  return dateKey(date);
}

/** Быстрые кнопки срока: без срока — «поставить», со сроком — «сдвинуть» или «убрать». */
function renderQuickDue(process) {
  const id = `data-id="${process.id}"`;
  const chip = (label, mode, days = 0) =>
    `<button class="ghost sm" data-action="dueQuick" ${id} data-mode="${mode}" data-days="${days}">${label}</button>`;

  const chips = process.due
    ? chip("+1 день", "shift", 1) + chip("+1 неделя", "shift", 7) + chip("Убрать срок", "clear")
    : chip("Сегодня", "set", 0) + chip("Завтра", "set", 1) + chip("Через неделю", "set", 7);

  return `<div class="add quick-due"><span>Быстро:</span>${chips}</div>`;
}

/** Состояние раскрытых блоков «Дополнительно» (по id процесса), чтобы перерисовка их не закрывала. */
const openMore = new Set();

/** Краткая подпись у «Дополнительно»: что там уже заполнено (или что внутри). */
function extraSummary(process) {
  const set = [];
  if (process.project) set.push(`проект «${escapeHtml(process.project)}»`);
  if (process.note) set.push("заметка");
  if (process.color) set.push("метка");
  if (process.after) set.push("после другого");
  return set.length ? set.join(" · ") : "заметка, проект, метка";
}

function renderProcessBody(process, progress) {
  const id = `data-id="${process.id}"`;
  const tool = (action, label) => `<button class="ghost sm" data-action="${action}" ${id}>${label}</button>`;

  const noteValue = escapeHtml(process.note || "");

  return `
    <div class="body">
      ${process.steps.map((step, index) => renderStep(process, step, index)).join("")}

      ${progress.isComplete ? `<div class="add"><span class="win">Процесс завершён.</span><button class="pri sm" data-action="shareCard" ${id}>Поделиться результатом</button></div>` : ""}

      <div class="add">
        <input type="text" placeholder="Новый шаг, можно со временем: «15 мин»" data-new-step="${process.id}">
        <input type="number" min="0" placeholder="мин" data-new-minutes="${process.id}" aria-label="Минуты">
        <button class="pri" data-action="addStep" ${id}>Добавить шаг</button>
      </div>

      <div class="add">
        <label for="due-${process.id}">Срок:</label>
        <input type="date" id="due-${process.id}" value="${process.due}" data-action="due" ${id}>

        <label for="repeat-${process.id}">Повтор:</label>
        <select id="repeat-${process.id}" data-action="repeat" ${id}>
          ${Object.entries(REPEAT_LABELS)
            .map(([value, label]) => `<option value="${value}"${process.repeat === value || (!process.repeat && !value) ? " selected" : ""}>${label}</option>`)
            .join("")}
        </select>
      </div>
      ${renderQuickDue(process)}

      <details class="extra" data-id="${process.id}"${openMore.has(process.id) ? " open" : ""}>
        <summary>Дополнительно <span>${extraSummary(process)}</span></summary>
        <div class="add">
          <label for="note-${process.id}">Заметка:</label>
        </div>
        <textarea id="note-${process.id}" class="note-edit" rows="2"
          placeholder="Например: адрес, контакты, пароль от Wi-Fi…"
          data-action="processNote" ${id}>${noteValue}</textarea>

      <div class="add">
        <label for="project-${process.id}">Проект:</label>
        <input type="text" id="project-${process.id}" list="project-list" maxlength="60"
          placeholder="Например: Ремонт квартиры" value="${escapeHtml(process.project || "")}" data-action="project" ${id}>
      </div>

      <div class="add">
        <label>Метка:</label>
        <div class="tag-picker">
          <button class="tag-swatch none${process.color ? "" : " sel"}" data-action="setColor" data-color="" ${id} aria-label="Без метки">×</button>
          ${TAG_COLORS.map(
            (color) =>
              `<button class="tag-swatch tag-${color}${process.color === color ? " sel" : ""}" data-action="setColor" data-color="${color}" ${id} aria-label="${color}"></button>`
          ).join("")}
        </div>
      </div>

      <div class="add">
        <label for="after-${process.id}">Начать после:</label>
        <select id="after-${process.id}" data-action="after" ${id}>
          <option value="">Без ожидания</option>
          ${state.processes
            .filter((other) => other.id !== process.id && (!getProgress(other).isComplete || other.id === process.after))
            .map((other) => `<option value="${other.id}"${other.id === process.after ? " selected" : ""}>${escapeHtml(other.title)}</option>`)
            .join("")}
        </select>
      </div>

      </details>

      <div class="add">
        ${tool("toggleOrder", process.ordered ? "Шаги по очереди: вкл" : "Шаги по очереди")}
        ${tool("duplicate", "Дублировать")}
        ${tool("archive", "В архив")}
        ${tool("reset", "Начать заново")}
        ${tool("deleteProcess", "Удалить")}
        <details class="more">
          <summary class="ghost sm">Поделиться и сохранить</summary>
          <div class="more-list">
            ${tool("copyText", "Копировать текстом")}
            ${tool("copyLink", "Ссылка для друга")}
            ${tool("shareCard", "Карточка для соцсетей")}
            ${tool("print", "Печать")}
            ${tool("saveTemplate", "Сохранить как шаблон")}
          </div>
        </details>
      </div>
    </div>`;
}

function renderProcess(process, position = {}) {
  const progress = getProgress(process);
  const isOpen = state.openId === process.id;

  let summary = progress.isComplete
    ? "Всё сделано"
    : `Осталось: ${formatMinutes(progress.minutesLeft)} · шагов: ${progress.total - progress.done}`;
  if (progress.isComplete && process.restartOn) summary += ` · заново ${process.restartOn}`;
  if (process.repeat) summary += ` · ${(REPEAT_LABELS[process.repeat] || "повтор").toLowerCase()}`;

  const waitsFor = state.processes.find((p) => p.id === process.after && !getProgress(p).isComplete);
  if (waitsFor && !progress.isComplete) summary += ` · после «${escapeHtml(waitsFor.title)}»`;

  const canReorder = canReorderList();
  const idAttr = `data-id="${process.id}"`;

  const moveButtons = canReorder
    ? `<div class="mv">
        <button class="x" data-action="moveUp" ${idAttr} aria-label="Поднять выше"${position.first ? " disabled" : ""}>▲</button>
        <button class="x" data-action="moveDown" ${idAttr} aria-label="Опустить ниже"${position.last ? " disabled" : ""}>▼</button>
      </div>`
    : "";

  return `
    <div class="proc${progress.isComplete ? " done" : ""}" id="proc-${process.id}" ${idAttr}>
      <div class="proc-head">
        <button class="ph" data-action="toggleOpen" ${idAttr} aria-expanded="${isOpen}">
          <div class="t">
            <b>${tagDot(process)}${escapeHtml(process.title)}</b>
            <span>${summary}${renderDueBadge(process, progress)}</span>
            <div class="bar"${barSteps(progress)}><i style="width:${progress.percent}%"></i></div>
          </div>
          <span class="pct">${progress.percent}%</span>
        </button>
        <button class="pin${process.pinned ? " on" : ""}" data-action="togglePin" ${idAttr} aria-pressed="${Boolean(process.pinned)}"
          aria-label="${process.pinned ? "Открепить" : "Закрепить наверху"}" title="${process.pinned ? "Открепить" : "Закрепить наверху"}">${process.pinned ? "★" : "☆"}</button>
        ${moveButtons}
      </div>
      ${isOpen ? renderProcessBody(process, progress) : ""}
    </div>`;
}

/** Карточка процесса на доске. */
function renderCard(process, columnIndex) {
  const progress = getProgress(process);
  const next = process.steps.find((step) => !step.done);
  const id = `data-id="${process.id}"`;

  const back = columnIndex > 0
    ? `<button class="ghost sm" data-action="moveLeft" ${id} aria-label="Переместить назад">←</button>`
    : "";
  // В последней колонке «вперёд» некуда: вместо стрелки — убрать готовый процесс в архив
  const forward = columnIndex < BOARD_COLUMNS.length - 1
    ? `<button class="ghost sm" data-action="moveRight" ${id} aria-label="Переместить вперёд">→</button>`
    : `<button class="ghost sm" data-action="archive" ${id}>В архив</button>`;

  return `
    <div class="kcard" draggable="true" ${id}>
      <b>${tagDot(process)}${escapeHtml(process.title)}</b>
      <div class="bar"${barSteps(progress)}><i style="width:${progress.percent}%"></i></div>
      <small>${progress.done}/${progress.total} шагов${progress.minutesLeft ? ` · осталось ${formatMinutes(progress.minutesLeft)}` : ""}${renderDueBadge(process, progress)}</small>
      ${next ? `<small>Дальше: ${escapeHtml(next.text)}</small>` : ""}
      <div class="kbtns">${back}<button class="ghost sm grow" data-action="openProcess" ${id}>Открыть</button>${forward}</div>
    </div>`;
}

/** Доска: три колонки со статусами. */
function renderBoard(processes) {
  const columns = BOARD_COLUMNS.map((column, columnIndex) => {
    const inColumn = processes.filter((process) => processStatus(process) === column.id);
    const cards = inColumn.map((process) => renderCard(process, columnIndex)).join("");

    return `
      <div class="kcol" data-status="${column.id}">
        <h3>${column.title}<span>${inColumn.length}</span></h3>
        ${cards || '<p class="col-empty">Пусто</p>'}
      </div>`;
  });

  return `<div class="board">${columns.join("")}</div>
    <p class="hint">Перетаскивайте карточки между колонками или используйте стрелки.</p>`;
}

/** Подсвечивает выбранный вид: «Список», «Доска» или «Сегодня». */
function renderViewSwitch() {
  for (const view of ["list", "board", "today"]) {
    const button = $(`view-${view}`);
    button.className = state.view === view ? "pri sm" : "ghost sm";
    button.setAttribute("aria-pressed", String(state.view === view));
  }
}

/**
 * Вид «Сегодня»: ближайший невыполненный шаг каждого процесса одним списком,
 * сгруппированным по срочности — просрочено, сегодня, дальше без даты или с запасом.
 * В отличие от «Следующего шага» показывает сразу все процессы, а не только самый срочный.
 */
function renderToday(processes) {
  const rows = processes
    .map((process) => {
      const index = process.steps.findIndex((step) => !step.done);
      return index === -1 ? null : { process, index, step: process.steps[index] };
    })
    .filter(Boolean)
    .sort((a, b) => (a.process.due || "9999").localeCompare(b.process.due || "9999"));

  if (!rows.length) return '<div class="empty">Все ближайшие шаги выполнены. Отличная работа!</div>';

  const groups = [
    { title: "Просрочено", className: "late", test: (row) => row.process.due && row.process.due < today() },
    { title: "Сегодня", className: "", test: (row) => row.process.due === today() },
    { title: "Дальше", className: "", test: () => true },
  ];

  let rest = rows;
  const sections = groups
    .map((group) => {
      const items = rest.filter(group.test);
      rest = rest.filter((row) => !group.test(row));
      if (!items.length) return "";

      const list = items
        .map(({ process, index, step }) => {
          const checkboxId = `today-${process.id}-${index}`;
          const attrs = `data-id="${process.id}" data-index="${index}"`;

          // Справа: время шага и срок процесса (у просроченного — насколько просрочено)
          const days = process.due ? daysUntil(process.due) : 0;
          const dueText = !process.due || group.title === "Сегодня"
            ? ""
            : days < 0
              ? `<span class="badge late">просрочено на ${-days} дн.</span>`
              : `до ${process.due}`;
          const meta = [step.minutes ? formatMinutes(step.minutes) : "", dueText].filter(Boolean).join(" · ");

          return `
            <div class="step">
              <input type="checkbox" id="${checkboxId}" data-action="toggle" ${attrs}>
              <label for="${checkboxId}"><b>${tagDot(process)}${escapeHtml(process.title)}</b> — ${escapeHtml(step.text)}</label>
              ${meta ? `<small>${meta}</small>` : ""}
            </div>`;
        })
        .join("");

      const minutes = items.reduce((sum, row) => sum + (row.step.minutes || 0), 0);
      return `
        <div class="card-box">
          <div class="group-head ${group.className}"><span>${group.title}</span><span>${items.length}${minutes ? ` · ${formatMinutes(minutes)}` : ""}</span></div>
          ${list}
        </div>`;
    })
    .join("");

  return sections;
}

/** Список архивных процессов: свёрнутый заголовок или раскрытый перечень с восстановлением. */
function renderArchive() {
  const archived = state.processes.filter((process) => process.archived);

  if (!archived.length) {
    $("archive").innerHTML = "";
    return;
  }

  const rows = archiveOpen
    ? archived
        .map(
          (process) => `
      <div class="archive-row">
        <div class="grow">
          <b>${tagDot(process)}${escapeHtml(process.title)}</b>
          <small>${getProgress(process).done} из ${process.steps.length} шагов${process.archivedAt ? ` · в архиве с ${process.archivedAt}` : ""}</small>
        </div>
        <button class="ghost sm" data-action="unarchive" data-id="${process.id}">Восстановить</button>
        <button class="ghost sm" data-action="deleteProcess" data-id="${process.id}">Удалить</button>
      </div>`
        )
        .join("")
    : "";

  $("archive").innerHTML = `
    <button class="archive-head" data-action="toggleArchiveList" aria-expanded="${archiveOpen}">
      ${archiveOpen ? "▾" : "▸"} Архив (${archived.length})
    </button>
    ${rows}`;
}

/** Процессы, которые сейчас видны в списке: без архива, с учётом поиска, проекта и сортировки. */
function getVisibleProcesses() {
  const query = $("search").value.trim().toLowerCase();
  const matches = (process) => {
    if (process.archived) return false;
    if (projectFilter && (process.project || "").trim() !== projectFilter) return false;
    return (
      !query ||
      process.title.toLowerCase().includes(query) ||
      process.steps.some((step) => step.text.toLowerCase().includes(query))
    );
  };

  return sortProcesses(state.processes.filter(matches));
}

/** Ручной порядок доступен только в виде «Список» при сортировке «Как добавлено». */
function canReorderList() {
  return state.view === "list" && sortMode === "manual";
}

function renderProcessList() {
  const visible = getVisibleProcesses();
  let html;

  if (!state.processes.length) {
    html = '<div class="empty">Пока пусто. Нажмите «+ Новый процесс» или выберите готовый сценарий ниже, он появится здесь, и можно сразу отмечать шаги.</div>';
  } else if (!visible.length) {
    html = '<div class="empty">Ничего не найдено. Попробуйте другое слово.</div>';
  } else {
    if (state.view === "board") html = renderBoard(visible);
    else if (state.view === "today") html = renderToday(visible);
    else {
      html = visible
        .map((process, i) =>
          renderProcess(process, {
            // стрелки двигают только внутри группы: закреплённые отдельно от остальных
            first: i === 0 || Boolean(visible[i - 1].pinned) !== Boolean(process.pinned),
            last: i === visible.length - 1 || Boolean(visible[i + 1].pinned) !== Boolean(process.pinned),
          })
        )
        .join("");
    }
  }

  $("processes").innerHTML = html;
  freshStep = "";
}

function renderTemplates() {
  $("templates").innerHTML = allTemplates()
    .map((template, index) => {
      const isOwn = index >= TEMPLATES.length;
      const minutes = template.steps.reduce((sum, [, m]) => sum + m, 0);
      const meta = `${template.steps.length} шагов` + (minutes ? ` · около ${formatMinutes(minutes)}` : "");

      return `
        <div class="tpl">
          <h3>${escapeHtml(template.title)}</h3>
          <p>${escapeHtml(template.description || "Мой шаблон")}</p>
          <div class="meta">${meta}</div>
          <div class="btns">
            <button class="pri" data-action="useTemplate" data-index="${index}">Запустить</button>
            ${isOwn ? `<button class="ghost sm" data-action="deleteTemplate" data-index="${index - TEMPLATES.length}">Удалить</button>` : ""}
          </div>
        </div>`;
    })
    .join("");
}

/** Карточка «Следующий шаг» с таймером. */
/** Откладывать есть смысл, если в процессе есть другие невыполненные шаги и порядок не строгий. */
function canPostpone(process) {
  return !process.ordered && process.steps.filter((step) => !step.done).length > 1;
}

function renderFocus() {
  const next = findNextStep();

  if (!next) {
    $("focus").innerHTML = state.processes.length
      ? '<div class="focus-card calm"><b>Все шаги выполнены. Запустите новый сценарий ниже.</b></div>'
      : "";
    return;
  }

  const { process, index, step } = next;
  // Плановое время шага — подписью; сам отсчёт идёт в режиме «Начать»
  const planHtml = step.minutes ? `<div class="focus-clock" title="Плановое время шага">${formatMinutes(step.minutes)}</div>` : "";

  $("focus").innerHTML = `
    <h2>Следующий шаг</h2>
    <div class="focus-card">
      <div class="focus-text">
        <span>${escapeHtml(process.title)}</span>
        <b>${escapeHtml(step.text)}</b>
        ${canPostpone(process) ? `<button class="link-btn" data-action="postpone" data-id="${process.id}" data-index="${index}">Отложить на потом</button>` : ""}
      </div>
      <div class="focus-actions">
        ${planHtml}
        <button class="focus-btn" data-action="fmOpen" data-id="${process.id}" title="Шаг за шагом на весь экран, с секундомером">Начать</button>
        <button class="focus-btn main" data-action="focusDone" data-id="${process.id}" data-index="${index}">Готово</button>
      </div>
    </div>
    ${renderFit()}`;
}

/** Месячный календарь со сроками, повторами и списком событий выбранного дня. */
function renderCalendar() {
  if (!state.processes.length) {
    $("calendar").innerHTML = "";
    return;
  }

  const events = calendarEvents();
  const monthName = new Date(calendar.year, calendar.month, 1).toLocaleDateString("ru-RU", { month: "long" });

  const weekdays = WEEKDAYS.map((name) => `<div class="cal-wd">${name}</div>`).join("");
  const days = monthGrid(calendar.year, calendar.month)
    .map((date) => {
      if (!date) return "<div></div>";

      const kinds = [...new Set((events[date] || []).map((event) => event.kind))];
      const dots = kinds.map((kind) => `<i class="dot${kind === "due" ? "" : " " + kind}"></i>`).join("");
      const classes = ["cal-day", date === today() ? "today" : "", date === calendar.selected ? "sel" : ""].join(" ");

      return `<button class="${classes}" data-action="calDay" data-date="${date}">
        <span>${Number(date.slice(8))}</span><span class="dots">${dots}</span>
      </button>`;
    })
    .join("");

  const selectedTitle = new Date(`${calendar.selected}T00:00:00`).toLocaleDateString("ru-RU", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  const items = (events[calendar.selected] || [])
    .map(({ process, kind }) => `
      <div class="cal-item">
        <i class="dot${kind === "due" ? "" : " " + kind}"></i>
        <span class="grow"><b>${escapeHtml(process.title)}</b> — ${EVENT_LABELS[kind]}</span>
        <button class="ghost sm" data-action="openProcess" data-id="${process.id}">Открыть</button>
      </div>`)
    .join("");

  $("calendar").innerHTML = `
    <div class="card-box">
      <div class="cal-head">
        <button class="ghost sm" data-action="calPrev" aria-label="Предыдущий месяц">‹</button>
        <b>${monthName} ${calendar.year}</b>
        <button class="ghost sm" data-action="calNext" aria-label="Следующий месяц">›</button>
        <button class="ghost sm" data-action="calToday">Сегодня</button>
      </div>
      <div class="cal-grid">${weekdays}${days}</div>
      <div class="cal-legend">
        <span><i class="dot"></i> срок</span>
        <span><i class="dot late"></i> просрочено</span>
        <span><i class="dot restart"></i> запуск заново</span>
      </div>
      <div class="cal-list">
        <p>${selectedTitle}</p>
        ${items || "<p>Ничего не запланировано. Срок и повтор задаются внутри процесса.</p>"}
      </div>
      <div class="add">
        <button class="ghost" data-action="exportIcs">Добавить в мой календарь (.ics)</button>
      </div>
    </div>`;
}

function applyTheme() {
  if (state.theme) document.documentElement.setAttribute("data-theme", state.theme);
  else document.documentElement.removeAttribute("data-theme");

  // Цвет верхней полосы браузера и установленного приложения — под текущую тему
  const dark = state.theme ? state.theme === "dark" : Boolean(window.matchMedia?.("(prefers-color-scheme: dark)").matches);
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.content = dark ? "#0F1524" : "#F2F5FA";
}

function render() {
  renderStats();
  $("lead").hidden = state.processes.length > 0; // пояснение нужно только новичку
  renderFocus();
  renderViewSwitch();
  renderProjects();
  renderProcessList();
  renderArchive();
  renderBackupNote();
  renderCalendar();
  $("calendar-box").hidden = !state.processes.length; // пустой календарь не показываем
  renderTemplates();
  applyTheme();
}


/* ---------- Режим фокуса: один процесс на весь экран, секундомер по каждому шагу ---------- */

const fm = { active: false, id: "", queue: [], pos: 0, results: [], elapsed: 0, running: false, handle: null, lock: null, root: null };

function fmRoot() {
  if (!fm.root) {
    fm.root = document.createElement("div");
    fm.root.id = "fm";
    fm.root.className = "fm";
    fm.root.setAttribute("role", "dialog");
    fm.root.setAttribute("aria-modal", "true");
    fm.root.setAttribute("aria-label", "Режим фокуса");
    document.body.appendChild(fm.root);
  }
  return fm.root;
}

function fmProcess() {
  return state.processes.find((p) => p.id === fm.id);
}

function fmStart() {
  clearInterval(fm.handle);
  fm.running = true;
  fm.handle = setInterval(() => {
    fm.elapsed += 1;
    const display = $("fm-time");
    if (display) {
      display.textContent = clock(fm.elapsed);
      const planned = fm.plannedSeconds;
      display.classList.toggle("over", planned > 0 && fm.elapsed > planned);
    }
    if (fm.plannedSeconds > 0 && fm.elapsed === fm.plannedSeconds) {
      toast("Время на шаг вышло"); // один раз, когда секундомер дошёл до планового времени
    }
  }, 1000);
}

function fmStop() {
  clearInterval(fm.handle);
  fm.handle = null;
  fm.running = false;
}

function fmOpen(process) {
  const queue = process.steps.map((step, i) => i).filter((i) => !process.steps[i].done);
  if (!queue.length) {
    toast("В этом процессе нет невыполненных шагов");
    return;
  }
  Object.assign(fm, { active: true, id: process.id, queue, pos: 0, results: [], elapsed: 0 });
  document.body.classList.add("fm-open");
  fmRoot().hidden = false;
  fmStart();
  renderFm();

  try {
    navigator.wakeLock?.request("screen").then((lock) => {
      if (fm.active) fm.lock = lock;
      else lock.release();
    }).catch(() => {});
  } catch (error) {
    // экран может гаснуть — режим от этого не ломается
  }
}

function fmClose() {
  fmStop();
  fm.active = false;
  fm.lock?.release?.();
  fm.lock = null;
  if (fm.root) fm.root.hidden = true;
  document.body.classList.remove("fm-open");
  render();
}

function fmTogglePause() {
  if (fm.running) fmStop();
  else fmStart();
  const button = $("fm-pause");
  if (button) button.textContent = fm.running ? "Пауза" : "Продолжить";
}

/** Завершает текущий шаг: status = "done" (отметить выполненным) или "skipped". */
function fmFinish(status) {
  const process = fmProcess();
  if (!process) return fmClose();
  if (status === "skipped" && process.ordered) return; // по очереди шаги не пропускают

  const index = fm.queue[fm.pos];
  const step = process.steps[index];
  if (status === "done" && step) {
    setStepDone(process, step, true);
    saveState();
  }
  fm.results.push({ index, status, seconds: fm.elapsed });
  fm.pos += 1;
  fm.elapsed = 0;

  if (fm.pos >= fm.queue.length) fmStop();
  else fmStart();
  renderFm();
}

function renderFm() {
  const process = fmProcess();
  if (!process) return fmClose();

  const root = fmRoot();
  if (fm.pos >= fm.queue.length) {
    root.innerHTML = renderFmSummary(process);
    root.querySelector("[data-action=fmClose]:not(.fm-close)")?.focus();
    return;
  }

  const index = fm.queue[fm.pos];
  const step = process.steps[index];
  fm.plannedSeconds = (step.minutes || 0) * 60;
  const percent = Math.round((fm.pos / fm.queue.length) * 100);
  const plan = step.minutes ? `План: ${formatMinutes(step.minutes)}` : "Время на шаг не задано";

  root.innerHTML = `
    <div class="fm-box">
      <button class="fm-close ghost sm" data-action="fmClose" aria-label="Выйти из режима фокуса">✕</button>
      <div class="fm-meta">${escapeHtml(process.title)} · шаг ${fm.pos + 1} из ${fm.queue.length}</div>
      <div class="fm-bar"${fm.queue.length >= 2 && fm.queue.length <= 24 ? ` style="--n:${fm.queue.length}"` : ""}><i style="width:${percent}%"></i></div>
      <div class="fm-step">${escapeHtml(step.text)}</div>
      ${step.note ? `<div class="fm-note">${escapeHtml(step.note)}</div>` : ""}
      <div class="fm-clock${fm.plannedSeconds && fm.elapsed > fm.plannedSeconds ? " over" : ""}" id="fm-time">${clock(fm.elapsed)}</div>
      <div class="fm-plan">${plan}</div>
      ${renderFmNext(process)}
      <div class="fm-actions">
        <button class="ghost" id="fm-pause" data-action="fmPause">${fm.running ? "Пауза" : "Продолжить"}</button>
        ${process.ordered ? "" : '<button class="ghost" data-action="fmSkip">Пропустить</button>'}
        <button class="pri" id="fm-done" data-action="fmDone">Готово</button>
      </div>
      <div class="fm-hint">Esc — выйти. Выполненные шаги уже сохранены.</div>
    </div>`;
  $("fm-done")?.focus();
}

/** Что будет после текущего шага, чтобы в сессии не было неизвестности. */
function renderFmNext(process) {
  const nextStep = process.steps[fm.queue[fm.pos + 1]];
  if (!nextStep) return "";
  const time = nextStep.minutes ? ` · ${formatMinutes(nextStep.minutes)}` : "";
  return `<div class="fm-next">Дальше: ${escapeHtml(nextStep.text)}${time}</div>`;
}

/** Итог сессии: сколько времени заняли шаги против плана. */
function renderFmSummary(process) {
  const done = fm.results.filter((r) => r.status === "done");
  const total = fm.results.reduce((sum, r) => sum + r.seconds, 0);

  let planSeconds = 0;
  let factSeconds = 0;
  const rows = fm.results.map((r) => {
    const step = process.steps[r.index];
    const planned = (step?.minutes || 0) * 60;
    if (r.status === "done" && planned) {
      planSeconds += planned;
      factSeconds += r.seconds;
    }
    const verdict = r.status === "skipped" ? "пропущен" : planned && r.seconds > planned ? "дольше плана" : "✓";
    return `<tr>
      <td>${escapeHtml(step?.text || "")}</td>
      <td>${planned ? clock(planned) : "—"}</td>
      <td>${clock(r.seconds)}</td>
      <td>${verdict}</td></tr>`;
  });

  const diff = factSeconds - planSeconds;
  const compare = planSeconds
    ? `По шагам с планом: план ${clock(planSeconds)}, факт ${clock(factSeconds)} (${diff > 0 ? "+" : diff < 0 ? "−" : ""}${clock(Math.abs(diff))}).`
    : "У выполненных шагов не было планового времени.";

  return `
    <div class="fm-box">
      <div class="fm-meta">${escapeHtml(process.title)}</div>
      <div class="fm-step">Сессия завершена: выполнено ${done.length} из ${fm.results.length}</div>
      <div class="fm-plan">Всего времени: ${clock(total)}. ${compare}</div>
      <div class="fm-table"><table>
        <thead><tr><th>Шаг</th><th>План</th><th>Факт</th><th></th></tr></thead>
        <tbody>${rows.join("")}</tbody>
      </table></div>
      <div class="fm-actions"><button class="pri" data-action="fmClose">Закрыть</button></div>
    </div>`;
}

/* ==========================================================
   6. ДЕЙСТВИЯ ПОЛЬЗОВАТЕЛЯ

   Каждое действие получает { el, process, index }.
   Если действие вернуло false — сохранение и перерисовка не нужны.
   ========================================================== */

const ACTIONS = {
  // Раскрыть или свернуть процесс
  toggleOpen({ process }) {
    state.openId = state.openId === process.id ? null : process.id;
  },

  // Отметить или снять шаг
  toggle({ el, process, index }) {
    if (isStepLocked(process, index)) {
      el.checked = false;
      return false;
    }
    setStepDone(process, process.steps[index], el.checked);
  },

  // Кнопка «Готово» в карточке «Следующий шаг»
  focusDone({ process, index }) {
    setStepDone(process, process.steps[index], true);
  },

  // Шаг уходит в конец процесса; следующим предлагается другой
  postpone({ process, index }) {
    const [step] = process.steps.splice(index, 1);
    process.steps.push(step);
    for (const key of [...openNotes]) if (key.startsWith(process.id + ":")) openNotes.delete(key);

    toast("Шаг отложен в конец процесса", () => {
      process.steps.splice(process.steps.indexOf(step), 1);
      process.steps.splice(index, 0, step);
      saveState();
      render();
    });
  },

  // «Есть время»: повторное нажатие на выбранное время закрывает подборку
  fitSet({ el }) {
    const minutes = Number(el.dataset.minutes);
    fitMinutes = fitMinutes === minutes ? 0 : minutes;
    renderFocus();
    return false;
  },
  fitDone({ process, index }) {
    setStepDone(process, process.steps[index], true);
  },

  // Режим фокуса
  fmOpen({ process }) {
    if (process) fmOpen(process);
    return false;
  },
  fmDone() {
    fmFinish("done");
    return false;
  },
  fmSkip() {
    fmFinish("skipped");
    return false;
  },
  fmPause() {
    fmTogglePause();
    return false;
  },
  fmClose() {
    fmClose();
    return false;
  },

  // Панель «Изменить шаг» остаётся открытой на том же шаге, чтобы его можно было сдвинуть дальше
  up({ process, index }) {
    openNotes.clear();
    moveStep(process, index, index - 1);
    if (index > 0) openNotes.add(`${process.id}:${index - 1}`);
  },

  down({ process, index }) {
    openNotes.clear();
    moveStep(process, index, index + 1);
    if (index < process.steps.length - 1) openNotes.add(`${process.id}:${index + 1}`);
  },

  deleteStep({ process, index }) {
    openNotes.clear();
    const [removed] = process.steps.splice(index, 1);

    toast(`Шаг «${removed.text}» удалён`, () => {
      process.steps.splice(index, 0, removed);
      saveState();
      render();
    });
  },

  addStep({ process }) {
    const textInput = document.querySelector(`[data-new-step="${process.id}"]`);
    const minutesInput = document.querySelector(`[data-new-minutes="${process.id}"]`);
    let text = textInput.value.trim();

    if (!text) {
      textInput.focus();
      return false;
    }

    // Время можно написать прямо в шаге («Позвонить, 15 мин»); поле «мин», если заполнено, главнее
    let minutes = Math.max(0, Number(minutesInput.value) || 0);
    if (!minutes) {
      const parsed = extractMinutes(text);
      if (parsed.minutes) {
        text = parsed.text || text;
        minutes = parsed.minutes;
      }
    }

    process.steps.push({ text, minutes, done: false });
    freshStep = `${process.id}:${process.steps.length - 1}`;

    // После перерисовки возвращаем курсор в поле, чтобы сразу вводить следующий шаг
    setTimeout(() => document.querySelector(`[data-new-step="${process.id}"]`)?.focus(), 0);
  },

  // Переключение вида: список или доска
  setView({ el }) {
    state.view = el.dataset.view;
  },

  // Кнопки-стрелки на карточке доски (то же, что перетаскивание)
  moveLeft({ process }) {
    if (!shiftStatus(process, -1)) return false;
  },

  moveRight({ process }) {
    if (!shiftStatus(process, 1)) return false;
  },

  // Переносит завершённый процесс в архив (действие можно отменить в течение 6 секунд)
  archive({ process }) {
    const hadRepeat = process.repeat;
    const hadRestartOn = process.restartOn;

    process.archived = true;
    process.archivedAt = today();
    process.repeat = "";
    process.restartOn = "";
    if (state.openId === process.id) state.openId = null;

    const note = hadRepeat ? " Повтор остановлен." : "";
    toast(`Процесс «${process.title}» в архиве.${note}`, () => {
      process.archived = false;
      delete process.archivedAt;
      process.repeat = hadRepeat;
      process.restartOn = hadRestartOn;
      saveState();
      render();
    });
  },

  // Возвращает процесс из архива в общий список
  unarchive({ process }) {
    process.archived = false;
    delete process.archivedAt;
    toast(`Процесс «${process.title}» восстановлен из архива`);
  },

  // Разворачивает или сворачивает список архива
  toggleArchiveList() {
    archiveOpen = !archiveOpen;
    renderArchive();
    return false; // список архива не хранится в данных, полный render() не нужен
  },

  // Стрелки ▲▼ в шапке процесса — то же, что перетаскивание, но работает и на телефоне
  moveUp({ process }) {
    if (!moveVisible(process, -1)) return false;
    keepFocus("moveUp", process.id);
  },

  moveDown({ process }) {
    if (!moveVisible(process, 1)) return false;
    keepFocus("moveDown", process.id);
  },

  // Быстрый срок: поставить от сегодня, сдвинуть (у просроченного — от сегодня) или убрать
  dueQuick({ el, process }) {
    const { mode, days } = el.dataset;
    if (mode === "clear") process.due = "";
    else if (mode === "shift") process.due = shiftDate(process.due < today() ? today() : process.due, Number(days));
    else process.due = shiftDate(today(), Number(days));
  },

  // Кнопка в плашке «не удаётся сохранить»: сразу скачать резервную копию
  warnBackup() {
    $("export-btn").click();
    return false;
  },

  // Закрепить процесс наверху списка (и открепить)
  togglePin({ process }) {
    process.pinned = !process.pinned;
  },

  // Строгий порядок: шаг открывается, только когда сделаны все предыдущие
  toggleOrder({ process }) {
    process.ordered = !process.ordered;
    toast(process.ordered ? "Шаги теперь выполняются по очереди" : "Порядок шагов снова свободный");
  },

  // Независимая копия процесса: свежие шаги, без срока, повтора и связей
  duplicate({ process }) {
    const clone = {
      id: makeId(),
      title: `${process.title} (копия)`,
      due: "",
      repeat: "",
      restartOn: "",
      started: false,
      after: "",
      project: process.project || "",
      note: process.note || "",
      ordered: !!process.ordered,
      steps: process.steps.map((step) => ({
        text: step.text,
        minutes: step.minutes,
        done: false,
        note: step.note || "",
      })),
    };

    state.processes.unshift(clone);
    state.openId = clone.id;
    toast(`Процесс «${process.title}» скопирован`);
  },

  // Картинка с прогрессом для соцсетей
  shareCard({ process }) {
    shareProcessCard(process);
    return false;
  },

  // Открыть или закрыть поле заметки у шага
  toggleNote({ process, index }) {
    const key = `${process.id}:${index}`;

    if (openNotes.has(key)) {
      openNotes.delete(key);
    } else {
      openNotes.add(key);
      // На телефоне не вызываем клавиатуру сразу: человек мог открыть панель, чтобы переместить или удалить шаг
      if (!window.matchMedia?.("(pointer: coarse)").matches) {
        setTimeout(() => document.querySelector(`[data-note="${key}"]`)?.focus(), 0);
      }
    }
  },

  // --- Календарь ---
  calPrev() {
    shiftMonth(-1);
    renderCalendar();
    return false;
  },

  calNext() {
    shiftMonth(1);
    renderCalendar();
    return false;
  },

  calToday() {
    calendar.year = new Date().getFullYear();
    calendar.month = new Date().getMonth();
    calendar.selected = today();
    renderCalendar();
    return false;
  },

  calDay({ el }) {
    calendar.selected = el.dataset.date;
    renderCalendar();
    return false;
  },

  // Перейти из календаря к процессу в списке
  openProcess({ process }) {
    state.view = "list";
    state.openId = process.id;
    setTimeout(() => $(`proc-${process.id}`)?.scrollIntoView({ behavior: "smooth" }), 0);
  },

  exportIcs() {
    const ics = buildIcs();
    if (ics) downloadFile("shagi-calendar.ics", ics, "text/calendar");
    else toast("Сначала задайте срок хотя бы одному процессу");
    return false;
  },

  // Цветная метка процесса
  setColor({ el, process }) {
    process.color = el.dataset.color;
  },

  // Переключает фильтр по проекту (повторный клик по тому же чипу снимает фильтр)
  setProjectFilter({ el }) {
    projectFilter = projectFilter === el.dataset.project ? "" : el.dataset.project;
    renderProjects();
    renderProcessList();
    return false; // фильтр не сохраняется в данных, полный saveState()+render() не нужен
  },

  // Переименовывает проект сразу у всех его процессов
  renameProject({ el }) {
    const oldName = el.dataset.project;
    const input = prompt(`Новое название проекта «${oldName}»`, oldName);
    if (input === null) return false; // отмена

    const newName = input.trim().slice(0, 60);
    if (!newName || newName === oldName) return false;

    state.processes.forEach((process) => {
      if ((process.project || "").trim() === oldName) process.project = newName;
    });
    if (projectFilter === oldName) projectFilter = newName;
    toast(`Проект переименован в «${newName}»`);
  },

  // Выбор движка ИИ для плана по цели (Claude или Gemini)
  setEngine({ el }) {
    state.aiEngine = el.dataset.engine;
    updateEngineButtons();
  },

  // Подставить пример цели в поле ИИ-помощника
  aiExample({ el }) {
    $("ai-goal").value = el.textContent.trim();
    $("ai-goal").focus();
    return false;
  },

  reset({ process }) {
    process.steps.forEach((step) => (step.done = false));
    process.started = false;
  },

  deleteProcess({ process }) {
    const index = state.processes.indexOf(process);
    state.processes.splice(index, 1);
    delete state.notified[process.id];
    if (state.openId === process.id) state.openId = null;

    toast(`Процесс «${process.title}» удалён`, () => {
      state.processes.splice(index, 0, process);
      saveState();
      render();
    });
  },

  saveTemplate({ process }) {
    state.myTemplates.push({
      title: process.title,
      description: "Мой шаблон",
      steps: process.steps.map((step) => [step.text, step.minutes]),
    });
    toast("Шаблон сохранён");
  },

  copyText({ process }) {
    copyToClipboard(processToText(process), "Скопировано");
    return false;
  },

  copyLink({ process }) {
    copyToClipboard(processToLink(process), "Ссылка скопирована");
    return false;
  },

  print() {
    window.print();
    return false;
  },

  // Запустить сценарий из каталога
  useTemplate({ index }) {
    const template = allTemplates()[index];
    addProcess(template.title, template.steps);
    toast("Процесс добавлен");
    return false; // addProcess уже сохранил и перерисовал
  },

  deleteTemplate({ index }) {
    const [removed] = state.myTemplates.splice(index, 1);

    toast(`Шаблон «${removed.title}» удалён`, () => {
      state.myTemplates.splice(index, 0, removed);
      saveState();
      render();
    });
  },
};

document.addEventListener("click", (event) => {
  const el = event.target.closest("[data-action]");
  if (!el) return;

  const action = ACTIONS[el.dataset.action];
  if (!action) return; // например, поле даты — оно обрабатывается в "change"

  const process = state.processes.find((p) => p.id === el.dataset.id);
  const index = Number(el.dataset.index);

  if (action({ el, process, index }) === false) return;
  saveState();
  render();
});

/* Действия при изменении полей: срок, повтор, заметка. */
const CHANGE_ACTIONS = {
  due({ el, process }) {
    process.due = el.value;
    // Поле даты срабатывает на каждую цифру года («0002», «0020», …). Перерисовка на каждом таком шаге
    // сбрасывала ввод, поэтому, пока поле в фокусе, сохраняем и перерисовываем только при выходе из него.
    if (document.activeElement === el) return false;
  },

  repeat({ el, process }) {
    process.repeat = el.value;
    process.restartOn = "";
    // Процесс уже завершён — сразу назначаем дату следующего запуска
    if (el.value && getProgress(process).isComplete) {
      process.restartOn = addInterval(today(), el.value);
    }
  },

  // Зависимость: «Начать после» другого процесса
  after({ el, process }) {
    if (el.value && wouldCreateCycle(process, el.value)) {
      toast("Так процессы будут ждать друг друга. Выберите другой");
      return; // перерисовка вернёт прежнее значение
    }
    process.after = el.value;
  },

  // Название проекта, к которому относится процесс
  project({ el, process }) {
    process.project = el.value.trim().slice(0, 60);
  },

  // Порядок списка и доски
  sort({ el }) {
    sortMode = el.value;
  },

  // Заметку сохраняем без перерисовки, чтобы не сбивать ввод
  saveNote({ el, process, index }) {
    process.steps[index].note = el.value.trim();
    saveState();
    return false;
  },

  // Заметка о процессе целиком — так же без перерисовки
  processNote({ el, process }) {
    process.note = el.value.trim().slice(0, 500);
    saveState();
    return false;
  },
};

document.addEventListener("change", (event) => {
  const el = event.target;
  const action = CHANGE_ACTIONS[el.dataset.action];
  if (!action) return;

  const process = state.processes.find((p) => p.id === el.dataset.id);
  if (action({ el, process, index: Number(el.dataset.index) }) === false) return;
  saveState();
  render();
});

// Enter в поле «Новый шаг» добавляет шаг, Enter в поле срока завершает ввод даты
document.addEventListener("keydown", (event) => {
  const id = event.target.dataset.newStep;
  if (event.key === "Enter" && id) {
    document.querySelector(`[data-action="addStep"][data-id="${id}"]`).click();
  }
  if (event.key === "Enter" && event.target.dataset.action === "due") event.target.blur();
});

// Дата срока применяется, когда человек закончил ввод и вышел из поля
document.addEventListener("focusout", (event) => {
  if (event.target.dataset?.action !== "due") return;
  saveState();
  render();
});

/* Перетаскивание карточек на доске (на телефоне работают стрелки на карточках). */
let dragOverColumn = null;

function clearDragHighlight() {
  dragOverColumn?.classList.remove("over");
  dragOverColumn = null;
}

document.addEventListener("dragstart", (event) => {
  const card = event.target.closest?.(".kcard");
  if (!card) return;

  event.dataTransfer.setData("text/plain", card.dataset.id);
  event.dataTransfer.effectAllowed = "move";
  card.classList.add("dragging");
});

document.addEventListener("dragover", (event) => {
  const column = event.target.closest?.(".kcol");
  if (!column) return;

  event.preventDefault(); // разрешаем «бросить» карточку сюда
  if (dragOverColumn !== column) {
    clearDragHighlight();
    column.classList.add("over");
    dragOverColumn = column;
  }
});

document.addEventListener("dragend", (event) => {
  event.target.classList?.remove("dragging");
  clearDragHighlight();
});

document.addEventListener("drop", (event) => {
  const column = event.target.closest?.(".kcol");
  if (!column) return;

  event.preventDefault();
  clearDragHighlight();

  const process = state.processes.find((p) => p.id === event.dataTransfer.getData("text/plain"));
  if (process && moveProcess(process, column.dataset.status)) {
    saveState();
    render();
  }
});

/**
 * Переставляет процесс рядом с другим: перед ним или (after = true) после него.
 * Возвращает true, только если порядок действительно изменился.
 */
function reorderProcess(draggedId, targetId, after = false) {
  if (draggedId === targetId) return false;

  const dragged = state.processes.find((p) => p.id === draggedId);
  const target = state.processes.find((p) => p.id === targetId);
  if (!dragged || !target) return false;

  const before = state.processes.map((p) => p.id).join();
  state.processes.splice(state.processes.indexOf(dragged), 1);
  const index = state.processes.indexOf(target);
  state.processes.splice(after ? index + 1 : index, 0, dragged);

  return state.processes.map((p) => p.id).join() !== before;
}

/** Сдвигает процесс на одну позицию среди видимых: delta = -1 (выше) или +1 (ниже). */
function moveVisible(process, delta) {
  const list = getVisibleProcesses();
  const neighbour = list[list.indexOf(process) + delta];
  return neighbour ? reorderProcess(process.id, neighbour.id, delta > 0) : false;
}

// Горячие клавиши: «/» — поиск, «N» — новый процесс (не срабатывают при вводе текста)
document.addEventListener("keydown", (event) => {
  if (fm.active) {
    if (event.key === "Escape") fmClose();
    return; // в режиме фокуса остальные горячие клавиши отключены
  }
  const isTyping = /^(INPUT|TEXTAREA)$/.test(event.target.tagName);
  if (isTyping || event.ctrlKey || event.metaKey || event.altKey) return;

  if (event.key === "/") {
    event.preventDefault();
    $("search").focus();
  } else if (event.key.toLowerCase() === "n") {
    event.preventDefault();
    $("new-btn").click();
  }
});

$("search").addEventListener("input", renderProcessList);

$("theme-btn").addEventListener("click", () => {
  const isDark =
    document.documentElement.getAttribute("data-theme") === "dark" ||
    (!state.theme && matchMedia("(prefers-color-scheme: dark)").matches);

  state.theme = isDark ? "light" : "dark";
  saveState();
  render();
});


/* ==========================================================
   7. ДИАЛОГ, РЕЗЕРВНАЯ КОПИЯ, ИМПОРТ ПО ССЫЛКЕ
   ========================================================== */

// --- Создание своего процесса ---

const dialog = $("dialog");

$("new-btn").addEventListener("click", () => {
  $("new-form").reset();
  dialog.showModal();
  $("new-title").focus();
});

$("cancel-btn").addEventListener("click", () => dialog.close());

$("new-form").addEventListener("submit", () => {
  const title = $("new-title").value.trim();
  if (title) addProcess(title, parseStepLines($("new-steps").value));
});

// --- Напоминания о сроках ---

const NOTIFY_CHECK_MINUTES = 5;
let notifyTimer = null;

function notificationsSupported() {
  return typeof Notification !== "undefined";
}

/** Текст напоминания: просрочен срок или наступил сегодня. */
function reminderText(process) {
  return process.due < today() ? `Просрочено: ${process.title}` : `Сегодня срок: ${process.title}`;
}

/** Показывает системное уведомление о процессе (если разрешение уже получено). */
function notifyProcess(process) {
  try {
    new Notification("Шаги", { body: reminderText(process), tag: `shagi-${process.id}`, icon: "icon.svg" });
  } catch (error) {
    // Уведомления недоступны в этом браузере — молча пропускаем
  }
}

/**
 * Раз в день напоминает о процессах с сегодняшним или просроченным сроком.
 * Каждый процесс получает не больше одного напоминания в день.
 */
function checkReminders() {
  if (!notificationsSupported() || Notification.permission !== "granted") return;

  let changed = false;
  for (const process of state.processes) {
    if (!process.due || process.due > today() || getProgress(process).isComplete) continue;
    if (state.notified[process.id] === today()) continue;

    notifyProcess(process);
    state.notified[process.id] = today();
    changed = true;
  }
  if (changed) saveState();
}

function startReminders() {
  checkReminders();
  clearInterval(notifyTimer);
  notifyTimer = setInterval(checkReminders, NOTIFY_CHECK_MINUTES * 60 * 1000);
}

/** Подписывает кнопку под текущее состояние разрешения. */
function updateNotifyButton() {
  const button = $("notify-btn");
  if (!notificationsSupported()) {
    button.hidden = true;
    return;
  }
  button.hidden = false;
  button.disabled = Notification.permission === "granted";
  button.textContent = Notification.permission === "granted" ? "Напоминания: вкл" : "Напоминания";
}

$("notify-btn").addEventListener("click", async () => {
  if (Notification.permission === "denied") {
    toast("Уведомления заблокированы в настройках браузера");
    return;
  }

  const permission = await Notification.requestPermission();
  updateNotifyButton();
  if (permission === "granted") {
    toast("Готово. Буду напоминать о сроках, пока сайт открыт");
    startReminders();
  }
});

if (notificationsSupported()) {
  updateNotifyButton();
  if (Notification.permission === "granted") startReminders();
}

// --- Продвижение: поделиться сайтом и установка как приложения ---

$("share-site").addEventListener("click", async () => {
  if (location.protocol === "file:") {
    toast("Сначала разместите сайт в интернете, тогда им можно делиться");
    return;
  }

  const data = {
    title: "Шаги",
    text: "Превращает сложные дела в понятные шаги: сценарии, таймер, календарь.",
    url: siteUrl(),
  };

  try {
    if (navigator.share) await navigator.share(data);
    else copyToClipboard(data.url, "Ссылка на сайт скопирована");
  } catch (error) {
    // Человек закрыл меню «Поделиться» — ничего делать не нужно
  }
});

// Браузер сам сообщает, что сайт можно установить; тогда показываем кнопку
let installPrompt = null;

window.addEventListener("beforeinstallprompt", (event) => {
  event.preventDefault();
  installPrompt = event;
  $("install-btn").hidden = false;
});

window.addEventListener("appinstalled", () => {
  installPrompt = null;
  $("install-btn").hidden = true;
});

/** iPhone и iPad: у Safari нет события установки, поэтому подсказываем вручную. */
function isIos() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent || "") || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}

function isInstalled() {
  return navigator.standalone === true || Boolean(window.matchMedia?.("(display-mode: standalone)").matches);
}

function setupInstallHint() {
  if (!isIos() || isInstalled() || !location.protocol?.startsWith("http")) return;
  $("install-btn").textContent = "Как установить";
  $("install-btn").hidden = false;
}

setupInstallHint();

$("install-btn").addEventListener("click", async () => {
  if (!installPrompt) {
    if (isIos()) toast("Нажмите «Поделиться» в Safari и выберите «На экран “Домой”»");
    return;
  }
  installPrompt.prompt();
  await installPrompt.userChoice;
  installPrompt = null;
  $("install-btn").hidden = true;
});

// Работа без интернета (только на настоящем сайте, не при открытии файла)
if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
  navigator.serviceWorker.register("sw.js").catch(() => {});
}

// --- План по цели (ИИ) ---

const aiDialog = $("ai-dialog");
let aiRequestId = 0; // чтобы отменённый запрос не создал процесс

/** Подсвечивает кнопку выбранного движка (Claude/Gemini) в окне «План по цели». */
function updateEngineButtons() {
  $("engine-claude").className = state.aiEngine === "gemini" ? "ghost sm" : "pri sm";
  $("engine-gemini").className = state.aiEngine === "gemini" ? "pri sm" : "ghost sm";
}

$("ai-btn").addEventListener("click", () => {
  $("ai-form").reset();
  $("ai-status").textContent = "";
  updateEngineButtons();
  aiDialog.showModal();
  $("ai-goal").focus();
});

$("ai-cancel").addEventListener("click", () => aiDialog.close());
aiDialog.addEventListener("close", () => (aiRequestId += 1)); // закрытие (в том числе Esc) отменяет результат

$("ai-form").addEventListener("submit", async (event) => {
  event.preventDefault();

  const goal = $("ai-goal").value.trim();
  if (!goal) return;

  const requestId = ++aiRequestId;
  $("ai-submit").disabled = true;
  $("ai-status").textContent = "Составляю план… обычно это занимает несколько секунд.";

  try {
    const plan = await requestPlan(goal);
    if (requestId !== aiRequestId) return; // окно уже закрыли

    aiDialog.close();
    addProcess(plan.title, plan.steps);
    toast("План готов. Проверьте шаги и поправьте под себя");
  } catch (error) {
    if (requestId !== aiRequestId) return;

    if (error.name === "AbortError") {
      $("ai-status").textContent = "Ответ идёт слишком долго. Попробуйте ещё раз.";
    } else if (error instanceof TypeError) {
      $("ai-status").textContent = "Не удалось связаться с сервером. Проверьте подключение функции (README.md).";
    } else {
      $("ai-status").textContent = error.message;
    }
  } finally {
    $("ai-submit").disabled = false;
  }
});

// --- Импорт из текста ---

const textDialog = $("text-dialog");

/** Показывает, сколько шагов нашли, пока человек вставляет текст. */
function updateTextPreview() {
  const { steps } = parseTextToProcess($("text-input").value);
  const minutes = steps.reduce((sum, step) => sum + step[1], 0);

  $("text-preview").textContent = steps.length
    ? `Найдено шагов: ${steps.length}` + (minutes ? ` · время: ${formatMinutes(minutes)}` : "")
    : "Вставьте список — шаги появятся здесь.";
  $("text-create").disabled = !steps.length;
}

$("text-btn").addEventListener("click", () => {
  $("text-form").reset();
  updateTextPreview();
  textDialog.showModal();
  $("text-input").focus();
});

$("text-cancel").addEventListener("click", () => textDialog.close());
$("text-input").addEventListener("input", updateTextPreview);

$("text-form").addEventListener("submit", () => {
  const parsed = parseTextToProcess($("text-input").value);
  if (!parsed.steps.length) return;

  const title = $("text-title").value.trim() || parsed.title || "Новый процесс";
  addProcess(title, parsed.steps, parsed.due);
});

// --- Голосовой ввод ---

const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;

const VOICE_ERRORS = {
  "not-allowed": "Нет доступа к микрофону. Разрешите его в настройках браузера.",
  "service-not-allowed": "Нет доступа к микрофону. Разрешите его в настройках браузера.",
  "no-speech": "Ничего не слышно. Попробуйте ещё раз.",
  "audio-capture": "Микрофон не найден.",
  network: "Для распознавания речи нужен интернет.",
};

let recognition = null;
let isListening = false;
let voiceBase = ""; // текст в поле до начала диктовки
let voiceMessage = "";

/**
 * Собирает текст диктовки: каждая пауза — новая строка (новый шаг),
 * то же самое делают слова «следующий шаг», «новый шаг», «новая строка».
 */
function buildVoiceText(base, phrases) {
  const lines = phrases
    .join("\n")
    .replace(/\s*(?:следующий шаг|новый шаг|новая строка)[\s,.]*/gi, "\n")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  return [...(base ? [base] : []), ...lines].join("\n");
}

function setVoiceState(listening, message) {
  isListening = listening;
  $("voice-btn").textContent = listening ? "Остановить" : "Надиктовать";
  $("voice-btn").className = listening ? "pri" : "ghost";
  $("voice-status").textContent = message;
}

function startVoice() {
  voiceBase = $("text-input").value.trim();
  voiceMessage = "";

  recognition = new SpeechRecognitionAPI();
  recognition.lang = "ru-RU";
  recognition.continuous = true;
  recognition.interimResults = true;

  recognition.onresult = (event) => {
    const phrases = Array.from(event.results, (result) => result[0].transcript);
    $("text-input").value = buildVoiceText(voiceBase, phrases);
    updateTextPreview();
  };
  recognition.onerror = (event) => {
    voiceMessage = VOICE_ERRORS[event.error] || "Не удалось распознать речь.";
  };
  recognition.onend = () => {
    setVoiceState(false, voiceMessage || "Диктовка остановлена. Проверьте текст и создайте процесс.");
  };

  recognition.start();
  setVoiceState(true, "Слушаю… Каждая пауза — новый шаг. Можно сказать «следующий шаг». Например: «заказать коробки, двадцать минут».");
}

$("voice-btn").addEventListener("click", () => {
  if (isListening) recognition.stop();
  else startVoice();
});

textDialog.addEventListener("close", () => recognition?.stop());

if (SpeechRecognitionAPI) {
  $("voice-btn").hidden = false;
} else {
  $("voice-status").textContent = "Голосовой ввод недоступен в этом браузере. Попробуйте Chrome, Edge или Safari.";
}

// --- Резервная копия ---

$("export-btn").addEventListener("click", () => {
  downloadFile(`shagi-backup-${today()}.json`, JSON.stringify(state, null, 2), "application/json");
  writeUiValue("shagi-last-backup", today());
  renderBackupNote();
});

$("import-btn").addEventListener("click", () => $("import-file").click());

$("import-file").addEventListener("change", (event) => {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    try {
      const data = JSON.parse(reader.result);
      const restored = Array.isArray(data.p) ? migrateOldData(data) : data; // поддержка копий прежней версии
      if (!Array.isArray(restored.processes)) throw new Error("Неверный формат");
      if (!confirm("Заменить текущие данные копией?")) return;

      state = normalizeState(restored);
      saveState();
      render();
      toast("Данные восстановлены");
    } catch (error) {
      toast("Файл не подходит");
    }
  };
  reader.readAsText(file);
});

// --- Импорт процесса из ссылки вида #p=... ---

function importFromUrl() {
  if (!location.hash.startsWith("#p=")) return;

  try {
    const encoded = decodeURIComponent(location.hash.slice(3));
    const data = JSON.parse(fromBase64(encoded));

    if (data.title && Array.isArray(data.steps)) {
      const steps = data.steps
        .slice(0, 100)
        .map(([text, minutes]) => [String(text).slice(0, 200), Number(minutes) || 0]);
      addProcess(String(data.title).slice(0, 120), steps);
      toast("Процесс из ссылки добавлен");
    }
  } catch (error) {
    // Ссылка повреждена — просто игнорируем
  }
  history.replaceState(null, "", location.pathname + location.search);
}


/* ==========================================================
   8. ЗАПУСК
   ========================================================== */

importFromUrl();
if (restartDueProcesses()) saveState();
$("calendar-box").open = readUiFlag("shagi-calendar-open"); // календарь свёрнут, пока человек сам не раскроет
requestPersistentStorage();
$("catalog").open = state.processes.length < 3; // новичку каталог на виду, опытному — свёрнут
render();

// Вернулись на вкладку на следующий день — повторяющиеся процессы запускаются заново,
// и заодно проверяем, не пора ли напомнить о сроках
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState !== "visible") return;

  if (restartDueProcesses()) {
    saveState();
    render();
  }
  checkReminders();
});

// Запоминаем, какие блоки «Дополнительно» раскрыты (событие toggle не всплывает — ловим на перехвате)
document.addEventListener(
  "toggle",
  (event) => {
    const el = event.target;
    if (el.id === "calendar-box") writeUiFlag("shagi-calendar-open", el.open);
    if (!el.matches?.("details.extra")) return;
    if (el.open) openMore.add(el.dataset.id);
    else openMore.delete(el.dataset.id);
  },
  true
);

// Вставка списка в поле «Новый шаг»: каждая строка становится отдельным шагом (время вроде «30 мин» распознаётся)
document.addEventListener(
  "paste",
  (event) => {
    const id = event.target.dataset?.newStep;
    if (!id) return;
    const process = state.processes.find((p) => p.id === id);
    const steps = parseStepLines(event.clipboardData?.getData("text") || "");
    if (!process || steps.length < 2) return; // одна строка — обычная вставка

    event.preventDefault();
    for (const [text, minutes] of steps) process.steps.push({ text, minutes, done: false });
    saveState();
    render();
    document.querySelector(`[data-new-step="${id}"]`)?.focus();
    toast(`Добавлено шагов: ${steps.length}`);
  },
  true
);
