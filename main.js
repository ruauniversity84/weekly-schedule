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

const modal = document.getElementById("modal");

const modalTitle = document.getElementById("modalTitle");

const eventTitle = document.getElementById("eventTitle");

const eventDate = document.getElementById("eventDate");

const startTime = document.getElementById("startTime");

const endTime = document.getElementById("endTime");

const repeatType = document.getElementById("repeatType");

const weeklyOptions =
    document.getElementById("weeklyOptions");

const repeatUntil =
    document.getElementById("repeatUntil");

const deleteButton =
    document.getElementById("deleteButton");

const saveButton =
    document.getElementById("saveButton");

const cancelButton =
    document.getElementById("cancelButton");

const dayHeader =
    document.getElementById("dayHeader");

const timeColumn =
    document.getElementById("timeColumn");

const calendarGrid =
    document.getElementById("calendarGrid");

const eventsLayer =
    document.getElementById("eventsLayer");

const weekLabel =
    document.getElementById("weekLabel");


function render() {

    renderWeekLabel();

    renderDays();

    renderTimes();

    renderGrid();

    renderEvents();
}


function renderWeekLabel() {

    const monday = new Date(currentWeek);

    const sunday = new Date(currentWeek);

    sunday.setDate(sunday.getDate() + 6);

    weekLabel.textContent =
        `${formatDate(monday)} ～ ${formatDate(sunday)}`;
}


function renderDays() {

    dayHeader.innerHTML = "";

    for (let i = 0; i < 7; i++) {

        const date = new Date(currentWeek);

        date.setDate(
            currentWeek.getDate() + i
        );

        const day = document.createElement("div");

        day.className = "day";

        if (isToday(date)) {
            day.classList.add("today");
        }

        day.innerHTML = `
            <div>${DAY_NAMES[date.getDay()]}曜日</div>
            <div class="day-number">
                ${date.getDate()}
            </div>
        `;

        dayHeader.appendChild(day);
    }
}


function renderTimes() {

    timeColumn.innerHTML = "";

    for (let hour = 0; hour < 24; hour++) {

        const time = document.createElement("div");

        time.className = "time-label";

        time.textContent =
            `${String(hour).padStart(2, "0")}:00`;

        timeColumn.appendChild(time);
    }
}


function renderGrid() {

    calendarGrid.innerHTML = "";

    for (let i = 0; i < 7; i++) {

        const dayColumn =
            document.createElement("div");

        dayColumn.className = "day-column";

        dayColumn.dataset.dayIndex = i;

        dayColumn.addEventListener(
            "dblclick",
            handleGridDoubleClick
        );

        calendarGrid.appendChild(dayColumn);
    }
}


function renderEvents() {

    eventsLayer.innerHTML = "";

    const visibleEvents =
        getVisibleEvents();

    visibleEvents.forEach(item => {

        const event = item.event;

        const date = item.date;

        const dayIndex =
            getDayIndex(date);

        if (dayIndex === -1) {
            return;
        }

        const startMinutes =
            timeToMinutes(event.start);

        const endMinutes =
            timeToMinutes(event.end);

        const top = startMinutes;

        const height = Math.max(
            endMinutes - startMinutes,
            30
        );

        const left =
            `calc(${dayIndex} * (100% / 7) + 4px)`;

        const width =
            `calc(100% / 7 - 8px)`;

        const element =
            document.createElement("div");

        element.className = "event";

        element.style.top =
            `${top}px`;

        element.style.height =
            `${height}px`;

        element.style.left =
            left;

        element.style.width =
            width;

        element.style.background =
            event.color;

        const repeatText =
            event.repeat === "weekly"
                ? "↻ 毎週"
                : "";

        element.innerHTML = `
            <div class="event-title">
                ${escapeHtml(event.title)}
            </div>

            <div class="event-time">
                ${event.start} ～ ${event.end}
            </div>

            ${
                repeatText
                    ? `<div class="event-repeat">
                        ${repeatText}
                       </div>`
                    : ""
            }
        `;

        element.addEventListener(
            "click",
            () => openEditModal(event.id)
        );

        eventsLayer.appendChild(element);
    });
}


function getVisibleEvents() {

    const result = [];

    for (let i = 0; i < 7; i++) {

        const date = new Date(currentWeek);

        date.setDate(
            currentWeek.getDate() + i
        );

        const dateString =
            toDateInputValue(date);

        events.forEach(event => {

            if (event.repeat === "weekly") {

                if (!isRepeatEventVisible(
                    event,
                    date
                )) {
                    return;
                }

                result.push({
                    event: event,
                    date: dateString
                });

            } else {

                if (event.date === dateString) {

                    result.push({
                        event: event,
                        date: dateString
                    });
                }
            }
        });
    }

    return result;
}


function isRepeatEventVisible(event, date) {

    const eventDate =
        new Date(event.date + "T00:00:00");

    const targetDate =
        new Date(date);

    eventDate.setHours(0, 0, 0, 0);
    targetDate.setHours(0, 0, 0, 0);

    if (targetDate < eventDate) {
        return false;
    }

    if (
        event.repeatUntil &&
        targetDate >
        new Date(event.repeatUntil + "T00:00:00")
    ) {
        return false;
    }

    const targetDay =
        targetDate.getDay();

    if (
        Array.isArray(event.repeatDays) &&
        event.repeatDays.length > 0
    ) {

        return event.repeatDays.includes(
            targetDay
        );
    }

    return targetDay === eventDate.getDay();
}


function handleGridDoubleClick(e) {

    const dayColumn =
        e.currentTarget;

    const rect =
        dayColumn.getBoundingClientRect();

    let y =
        e.clientY - rect.top;

    y = Math.max(0, Math.min(y, 1439));

    let minutes =
        Math.floor(y / 30) * 30;

    const hours =
        Math.floor(minutes / 60);

    const mins =
        minutes % 60;

    const time =
        `${String(hours).padStart(2, "0")}:` +
        `${String(mins).padStart(2, "0")}`;

    const dayIndex =
        Number(dayColumn.dataset.dayIndex);

    const date =
        new Date(currentWeek);

    date.setDate(
        currentWeek.getDate() + dayIndex
    );

    openAddModal(
        toDateInputValue(date),
        time
    );
}


function openAddModal(date, time) {

    editingEventId = null;

    modalTitle.textContent =
        "予定を追加";

    eventTitle.value = "";

    eventDate.value = date;

    startTime.value = time;

    endTime.value =
        addMinutesToTime(time, 60);

    repeatType.value = "none";

    repeatUntil.value = "";

    clearWeekdaySelection();

    weeklyOptions.classList.add("hidden");

    deleteButton.classList.add("hidden");

    selectedColor = "#6C8EF5";

    updateColorSelection();

    modal.classList.remove("hidden");

    eventTitle.focus();
}


function openEditModal(id) {

    const event =
        events.find(item => item.id === id);

    if (!event) {
        return;
    }

    editingEventId = id;

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

    repeatType.value =
        event.repeat || "none";

    repeatUntil.value =
        event.repeatUntil || "";

    clearWeekdaySelection();

    if (event.repeat === "weekly") {

        weeklyOptions.classList.remove(
            "hidden"
        );

        const days =
            event.repeatDays || [];

        document.querySelectorAll(
            ".weekday-option input"
        ).forEach(input => {

            input.checked =
                days.includes(
                    Number(input.value)
                );
        });

    } else {

        weeklyOptions.classList.add(
            "hidden"
        );
    }

    selectedColor =
        event.color || "#6C8EF5";

    updateColorSelection();

    deleteButton.classList.remove(
        "hidden"
    );

    modal.classList.remove("hidden");
}


function closeModal() {

    modal.classList.add("hidden");

    editingEventId = null;
}


repeatType.addEventListener(
    "change",
    () => {

        if (repeatType.value === "weekly") {

            weeklyOptions.classList.remove(
                "hidden"
            );

            setDefaultRepeatDays();

        } else {

            weeklyOptions.classList.add(
                "hidden"
            );
        }
    }
);


function setDefaultRepeatDays() {

    const date =
        new Date(eventDate.value + "T00:00:00");

    const day =
        date.getDay();

    document.querySelectorAll(
        ".weekday-option input"
    ).forEach(input => {

        input.checked =
            Number(input.value) === day;
    });
}


function clearWeekdaySelection() {

    document.querySelectorAll(
        ".weekday-option input"
    ).forEach(input => {

        input.checked = false;
    });
}


saveButton.addEventListener(
    "click",
    saveEvent
);


function saveEvent() {

    const title =
        eventTitle.value.trim();

    const date =
        eventDate.value;

    const start =
        startTime.value;

    const end =
        endTime.value;

    if (!title) {

        alert("予定名を入力してください。");

        return;
    }

    if (!date) {

        alert("日付を選択してください。");

        return;
    }

    if (
        timeToMinutes(start) >=
        timeToMinutes(end)
    ) {

        alert(
            "終了時間は開始時間より後にしてください。"
        );

        return;
    }

    const repeat =
        repeatType.value;

    let repeatDays = [];

    let repeatUntilValue =
        "";

    if (repeat === "weekly") {

        repeatDays =
            Array.from(
                document.querySelectorAll(
                    ".weekday-option input:checked"
                )
            ).map(
                input => Number(input.value)
            );

        if (repeatDays.length === 0) {

            alert(
                "繰り返す曜日を1つ以上選択してください。"
            );

            return;
        }

        repeatUntilValue =
            repeatUntil.value;

        if (repeatUntilValue) {

            if (
                repeatUntilValue < date
            ) {

                alert(
                    "繰り返し終了日は開始日以降にしてください。"
                );

                return;
            }
        }
    }

    if (editingEventId) {

        const event =
            events.find(
                item =>
                    item.id === editingEventId
            );

        if (event) {

            event.title = title;

            event.date = date;

            event.start = start;

            event.end = end;

            event.color =
                selectedColor;

            event.repeat =
                repeat;

            event.repeatDays =
                repeatDays;

            event.repeatUntil =
                repeatUntilValue;
        }

    } else {

        events.push({

            id:
                String(
                    Date.now() +
                    Math.random()
                ),

            title: title,

            date: date,

            start: start,

            end: end,

            color:
                selectedColor,

            repeat:
                repeat,

            repeatDays:
                repeatDays,

            repeatUntil:
                repeatUntilValue
        });
    }

    saveEvents();

    closeModal();

    render();
}


deleteButton.addEventListener(
    "click",
    deleteEvent
);


function deleteEvent() {

    if (!editingEventId) {
        return;
    }

    const event =
        events.find(
            item =>
                item.id === editingEventId
        );

    if (!event) {
        return;
    }

    let message =
        "この予定を削除しますか？";

    if (event.repeat === "weekly") {

        message =
            "この繰り返し予定をすべて削除しますか？";
    }

    if (!confirm(message)) {
        return;
    }

    events =
        events.filter(
            item =>
                item.id !== editingEventId
        );

    saveEvents();

    closeModal();

    render();
}


cancelButton.addEventListener(
    "click",
    closeModal
);


modal.addEventListener(
    "click",
    e => {

        if (e.target === modal) {
            closeModal();
        }
    }
);


document.querySelectorAll(
    ".color-option"
).forEach(button => {

    button.style.backgroundColor =
        button.dataset.color;

    button.addEventListener(
        "click",
        () => {

            selectedColor =
                button.dataset.color;

            updateColorSelection();
        }
    );
});


function updateColorSelection() {

    document.querySelectorAll(
        ".color-option"
    ).forEach(button => {

        button.classList.toggle(
            "selected",
            button.dataset.color ===
            selectedColor
        );
    });
}


document.getElementById(
    "prevWeek"
).addEventListener(
    "click",
    () => {

        currentWeek.setDate(
            currentWeek.getDate() - 7
        );

        render();
    }
);


document.getElementById(
    "nextWeek"
).addEventListener(
    "click",
    () => {

        currentWeek.setDate(
            currentWeek.getDate() + 7
        );

        render();
    }
);


document.getElementById(
    "todayButton"
).addEventListener(
    "click",
    () => {

        currentWeek =
            getMonday(new Date());

        render();
    }
);


function saveEvents() {

    localStorage.setItem(
        "weeklyScheduleEvents",
        JSON.stringify(events)
    );
}


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

    result.setHours(0, 0, 0, 0);

    return result;
}


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


function getDayIndex(dateString) {

    const date =
        new Date(
            dateString + "T00:00:00"
        );

    const monday =
        new Date(currentWeek);

    const diff =
        Math.round(
            (
                date - monday
            ) /
            (1000 * 60 * 60 * 24)
        );

    if (
        diff < 0 ||
        diff > 6
    ) {
        return -1;
    }

    return diff;
}


function timeToMinutes(time) {

    const parts =
        time.split(":");

    return (
        Number(parts[0]) * 60 +
        Number(parts[1])
    );
}


function addMinutesToTime(
    time,
    minutes
) {

    let total =
        timeToMinutes(time) +
        minutes;

    total =
        Math.min(total, 1439);

    const hour =
        Math.floor(total / 60);

    const minute =
        total % 60;

    return (
        String(hour).padStart(2, "0") +
        ":" +
        String(minute).padStart(2, "0")
    );
}


function formatDate(date) {

    return (
        `${date.getFullYear()}/` +
        `${String(
            date.getMonth() + 1
        ).padStart(2, "0")}/` +
        `${String(
            date.getDate()
        ).padStart(2, "0")}`
    );
}


function toDateInputValue(date) {

    return (
        `${date.getFullYear()}-` +
        `${String(
            date.getMonth() + 1
        ).padStart(2, "0")}-` +
        `${String(
            date.getDate()
        ).padStart(2, "0")}`
    );
}


function escapeHtml(text) {

    const div =
        document.createElement("div");

    div.textContent = text;

    return div.innerHTML;
}


render();