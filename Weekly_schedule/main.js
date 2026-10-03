const DAY_NAMES = [
    "日",
    "月",
    "火",
    "水",
    "木",
    "金",
    "土"
];

const HOUR_HEIGHT = 60;

let currentWeek = getMonday(new Date());

let events = JSON.parse(
    localStorage.getItem("weeklyScheduleEvents") || "[]"
);

let editingEventId = null;
let selectedColor = "#6C8EF5";

const dayHeader = document.getElementById("dayHeader");
const timeColumn = document.getElementById("timeColumn");
const calendarGrid = document.getElementById("calendarGrid");
const eventsLayer = document.getElementById("eventsLayer");

const weekLabel = document.getElementById("weekLabel");

const modal = document.getElementById("modal");
const modalTitle = document.getElementById("modalTitle");

const eventTitle = document.getElementById("eventTitle");
const eventDate = document.getElementById("eventDate");

const startTime = document.getElementById("startTime");
const endTime = document.getElementById("endTime");

const saveButton = document.getElementById("saveButton");
const cancelButton = document.getElementById("cancelButton");
const deleteButton = document.getElementById("deleteButton");

const prevWeek = document.getElementById("prevWeek");
const nextWeek = document.getElementById("nextWeek");
const todayButton = document.getElementById("todayButton");


// ==============================
// 初期化
// ==============================

render();


// ==============================
// 週間表示
// ==============================

function render() {

    renderWeekLabel();
    renderDays();
    renderTimes();
    renderGrid();
    renderEvents();
}


// ==============================
// 週タイトル
// ==============================

function renderWeekLabel() {

    const start = new Date(currentWeek);

    const end = new Date(currentWeek);
    end.setDate(end.getDate() + 6);

    const startText =
        `${start.getFullYear()}/${start.getMonth() + 1}/${start.getDate()}`;

    const endText =
        `${end.getFullYear()}/${end.getMonth() + 1}/${end.getDate()}`;

    weekLabel.textContent =
        `${startText} ～ ${endText}`;
}


// ==============================
// 曜日
// ==============================

function renderDays() {

    dayHeader.innerHTML = "";

    for (let i = 0; i < 7; i++) {

        const date = new Date(currentWeek);

        date.setDate(date.getDate() + i);

        const day = document.createElement("div");

        day.className = "day";

        if (isToday(date)) {
            day.classList.add("today");
        }

        day.innerHTML = `
            <div>${DAY_NAMES[date.getDay()]}</div>
            <div class="date">${date.getDate()}</div>
        `;

        dayHeader.appendChild(day);
    }
}


// ==============================
// 時間
// ==============================

function renderTimes() {

    timeColumn.innerHTML = "";

    for (let hour = 0; hour < 24; hour++) {

        const time = document.createElement("div");

        time.className = "time";

        time.innerHTML =
            `<span>${String(hour).padStart(2, "0")}:00</span>`;

        timeColumn.appendChild(time);
    }
}


// ==============================
// グリッド
// ==============================

function renderGrid() {

    calendarGrid.innerHTML = "";

    for (let i = 0; i < 7; i++) {

        const column = document.createElement("div");

        column.className = "day-column";

        column.dataset.day = i;

        column.addEventListener(
            "dblclick",
            handleGridDoubleClick
        );

        calendarGrid.appendChild(column);
    }
}


// ==============================
// 予定表示
// ==============================

function renderEvents() {

    eventsLayer.innerHTML = "";

    const weekStart =
        new Date(currentWeek);

    for (const event of events) {

        const date = new Date(event.date);

        const dayIndex =
            getDayIndex(date, weekStart);

        if (dayIndex < 0 || dayIndex > 6) {
            continue;
        }

        const startMinutes =
            timeToMinutes(event.start);

        const endMinutes =
            timeToMinutes(event.end);

        const top =
            startMinutes;

        const height =
            Math.max(
                endMinutes - startMinutes,
                30
            );

        const eventElement =
            document.createElement("div");

        eventElement.className = "event";

        eventElement.style.left =
            `calc(${dayIndex} * (100% / 7) + 4px)`;

        eventElement.style.width =
            `calc(100% / 7 - 8px)`;

        eventElement.style.top =
            `${top}px`;

        eventElement.style.height =
            `${height}px`;

        eventElement.style.background =
            event.color;

        eventElement.innerHTML = `
            <div class="event-title">
                ${escapeHtml(event.title)}
            </div>

            <div class="event-time">
                ${event.start} ～ ${event.end}
            </div>
        `;

        eventElement.addEventListener(
            "click",
            function(e) {

                e.stopPropagation();

                openEditModal(event.id);
            }
        );

        eventsLayer.appendChild(eventElement);
    }
}


// ==============================
// グリッドをダブルクリック
// ==============================

function handleGridDoubleClick(e) {

    const column =
        e.currentTarget;

    const rect =
        column.getBoundingClientRect();

    const y =
        e.clientY - rect.top;

    let minutes =
        Math.floor(y / 30) * 30;

    if (minutes >= 1440) {
        minutes = 1410;
    }

    const hour =
        Math.floor(minutes / 60);

    const minute =
        minutes % 60;

    const date =
        new Date(currentWeek);

    date.setDate(
        date.getDate() +
        Number(column.dataset.day)
    );

    openAddModal(
        date,
        `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`
    );
}


// ==============================
// 追加モーダル
// ==============================

function openAddModal(date, time) {

    editingEventId = null;

    modalTitle.textContent =
        "予定を追加";

    eventTitle.value = "";

    eventDate.value =
        formatDate(date);

    startTime.value =
        time;

    const end =
        addMinutesToTime(time, 60);

    endTime.value =
        end;

    selectedColor =
        "#6C8EF5";

    updateColorSelection();

    deleteButton.classList.add("hidden");

    modal.classList.remove("hidden");

    eventTitle.focus();
}


// ==============================
// 編集モーダル
// ==============================

function openEditModal(id) {

    const event =
        events.find(
            e => e.id === id
        );

    if (!event) {
        return;
    }

    editingEventId =
        id;

    modalTitle.textContent =
        "予定を編集";

    eventTitle.value =
        event.title;

    eventDate.value =
        event.date;

    startTime.value =
        event.start;

    endTime.value =
        event.end;

    selectedColor =
        event.color;

    updateColorSelection();

    deleteButton.classList.remove(
        "hidden"
    );

    modal.classList.remove(
        "hidden"
    );
}


// ==============================
// 保存
// ==============================

saveButton.addEventListener(
    "click",
    saveEvent
);

function saveEvent() {

    const title =
        eventTitle.value.trim();

    if (!title) {

        alert("予定名を入力してください");

        return;
    }

    if (
        startTime.value >=
        endTime.value
    ) {

        alert("終了時間は開始時間より後にしてください");

        return;
    }

    const data = {

        title: title,

        date: eventDate.value,

        start: startTime.value,

        end: endTime.value,

        color: selectedColor
    };


    if (editingEventId) {

        const index =
            events.findIndex(
                e =>
                    e.id ===
                    editingEventId
            );

        if (index !== -1) {

            events[index] = {
                ...events[index],
                ...data
            };
        }

    } else {

        events.push({

            id:
                Date.now().toString(),

            ...data
        });
    }

    saveEvents();

    closeModal();

    render();
}


// ==============================
// 削除
// ==============================

deleteButton.addEventListener(
    "click",
    function() {

        if (!editingEventId) {
            return;
        }

        const ok =
            confirm(
                "この予定を削除しますか？"
            );

        if (!ok) {
            return;
        }

        events =
            events.filter(
                event =>
                    event.id !==
                    editingEventId
            );

        saveEvents();

        closeModal();

        render();
    }
);


// ==============================
// モーダルを閉じる
// ==============================

cancelButton.addEventListener(
    "click",
    closeModal
);

modal.addEventListener(
    "click",
    function(e) {

        if (
            e.target === modal
        ) {
            closeModal();
        }
    }
);

function closeModal() {

    modal.classList.add(
        "hidden"
    );

    editingEventId =
        null;
}


// ==============================
// 色
// ==============================

document
    .querySelectorAll(".color-option")
    .forEach(button => {

        button.style.background =
            button.dataset.color;

        button.addEventListener(
            "click",
            function() {

                selectedColor =
                    this.dataset.color;

                updateColorSelection();
            }
        );
    });

function updateColorSelection() {

    document
        .querySelectorAll(".color-option")
        .forEach(button => {

            button.classList.toggle(
                "selected",
                button.dataset.color ===
                selectedColor
            );
        });
}


// ==============================
// 週移動
// ==============================

prevWeek.addEventListener(
    "click",
    function() {

        currentWeek.setDate(
            currentWeek.getDate() - 7
        );

        render();
    }
);

nextWeek.addEventListener(
    "click",
    function() {

        currentWeek.setDate(
            currentWeek.getDate() + 7
        );

        render();
    }
);

todayButton.addEventListener(
    "click",
    function() {

        currentWeek =
            getMonday(
                new Date()
            );

        render();
    }
);


// ==============================
// 保存
// ==============================

function saveEvents() {

    localStorage.setItem(
        "weeklyScheduleEvents",
        JSON.stringify(events)
    );
}


// ==============================
// 月曜日を取得
// ==============================

function getMonday(date) {

    const result =
        new Date(date);

    const day =
        result.getDay();

    const diff =
        day === 0
            ? -6
            : 1 - day;

    result.setDate(
        result.getDate() + diff
    );

    result.setHours(
        0,
        0,
        0,
        0
    );

    return result;
}


// ==============================
// 日付比較
// ==============================

function isToday(date) {

    const today =
        new Date();

    return (
        date.getFullYear() ===
        today.getFullYear() &&

        date.getMonth() ===
        today.getMonth() &&

        date.getDate() ===
        today.getDate()
    );
}


// ==============================
// 週内の日付位置
// ==============================

function getDayIndex(
    date,
    weekStart
) {

    const oneDay =
        24 * 60 * 60 * 1000;

    const diff =
        Math.floor(
            (
                new Date(
                    date.getFullYear(),
                    date.getMonth(),
                    date.getDate()
                ) -

                new Date(
                    weekStart.getFullYear(),
                    weekStart.getMonth(),
                    weekStart.getDate()
                )
            ) / oneDay
        );

    return diff;
}


// ==============================
// 時間 → 分
// ==============================

function timeToMinutes(time) {

    const parts =
        time.split(":");

    return (
        Number(parts[0]) * 60 +
        Number(parts[1])
    );
}


// ==============================
// 時間を加算
// ==============================

function addMinutesToTime(
    time,
    minutes
) {

    let total =
        timeToMinutes(time) +
        minutes;

    if (total >= 1440) {
        total = 1439;
    }

    const hour =
        Math.floor(
            total / 60
        );

    const minute =
        total % 60;

    return (
        String(hour).padStart(2, "0") +
        ":" +
        String(minute).padStart(2, "0")
    );
}


// ==============================
// Date → YYYY-MM-DD
// ==============================

function formatDate(date) {

    return (
        date.getFullYear() +
        "-" +
        String(
            date.getMonth() + 1
        ).padStart(2, "0") +
        "-" +
        String(
            date.getDate()
        ).padStart(2, "0")
    );
}


// ==============================
// HTMLエスケープ
// ==============================

function escapeHtml(text) {

    const div =
        document.createElement("div");

    div.textContent =
        text;

    return div.innerHTML;
}