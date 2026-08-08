"use client";

import { ChevronLeft, ChevronRight, Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import type { Translation } from "@/src/i18n/translations";
import { categoryForIndex } from "@/src/lib/calendar";
import {
  atLocalNoon,
  fromLocalDateKey,
  toLocalDateKey,
} from "@/src/lib/date";
import type { CalendarTask, Locale } from "@/src/types";

interface ProjectCalendarProps {
  locale: Locale;
  t: Translation;
  tasks: CalendarTask[];
  onAddTask: (task: CalendarTask) => void;
  onDeleteTask: (taskId: string) => void;
  onToggleTask: (taskId: string) => void;
}

function monthStart(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1, 12);
}

function sameDate(first: Date, second: Date): boolean {
  return toLocalDateKey(first) === toLocalDateKey(second);
}

function createCalendarDays(visibleMonth: Date): Date[] {
  const first = monthStart(visibleMonth);
  const mondayOffset = (first.getDay() + 6) % 7;
  const start = new Date(first);
  start.setDate(first.getDate() - mondayOffset);

  return Array.from({ length: 42 }, (_, index) => {
    const day = new Date(start);
    day.setDate(start.getDate() + index);
    return day;
  });
}

function randomTaskId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `task-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function ProjectCalendar({
  locale,
  t,
  tasks,
  onAddTask,
  onDeleteTask,
  onToggleTask,
}: ProjectCalendarProps) {
  const [today] = useState(() => atLocalNoon(new Date()));
  const [visibleMonth, setVisibleMonth] = useState(() => monthStart(today));
  const [selectedDate, setSelectedDate] = useState(() => new Date(today));
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDeadline, setTaskDeadline] = useState(() => toLocalDateKey(today));
  const languageTag = locale === "vi" ? "vi-VN" : "en-US";
  const calendarDays = useMemo(
    () => createCalendarDays(visibleMonth),
    [visibleMonth],
  );
  const selectedKey = toLocalDateKey(selectedDate);
  const selectedTasks = tasks.filter((task) => task.deadline === selectedKey);
  const completedCount = selectedTasks.filter((task) => task.done).length;
  const weekdayNames =
    locale === "vi"
      ? ["T2", "T3", "T4", "T5", "T6", "T7", "CN"]
      : ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  const selectDate = (date: Date) => {
    const next = atLocalNoon(date);
    setSelectedDate(next);
    setTaskDeadline(toLocalDateKey(next));
    if (
      next.getMonth() !== visibleMonth.getMonth() ||
      next.getFullYear() !== visibleMonth.getFullYear()
    ) {
      setVisibleMonth(monthStart(next));
    }
  };

  const addTask = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const title = taskTitle.trim();
    const parsedDeadline = fromLocalDateKey(taskDeadline);
    if (!title || !parsedDeadline) return;

    const manualTaskCount = tasks.filter((task) => task.source === "manual").length;
    onAddTask({
      id: randomTaskId(),
      title,
      deadline: toLocalDateKey(parsedDeadline),
      category: categoryForIndex(manualTaskCount),
      source: "manual",
      done: false,
      createdAt: new Date().toISOString(),
    });
    setTaskTitle("");
    setSelectedDate(parsedDeadline);
    setVisibleMonth(monthStart(parsedDeadline));
  };

  return (
    <section
      aria-labelledby="calendar-title"
      className="calendar-section"
      data-testid="project-calendar"
      id="calendar"
    >
      <div className="calendar-heading">
        <div>
          <p className="eyebrow">{t.calendar.eyebrow}</p>
          <h2 id="calendar-title">{t.calendar.title}</h2>
        </div>
        <p>{t.calendar.intro}</p>
      </div>

      <div className="calendar-stage">
        <div className="calendar-app">
          <section aria-label={t.calendar.ariaLabel} className="calendar-card">
            <div className="calendar-toolbar">
              <div>
                <p className="today-label">
                  {t.calendar.today} ·{" "}
                  {new Intl.DateTimeFormat(languageTag, {
                    weekday: "short",
                    day: "numeric",
                    month: "short",
                  }).format(today)}
                </p>
                <h3>
                  {new Intl.DateTimeFormat(languageTag, {
                    month: "long",
                    year: "numeric",
                  }).format(visibleMonth)}
                </h3>
              </div>
              <div aria-label={t.calendar.controlsLabel} className="calendar-controls">
                <button
                  aria-label={t.calendar.previousMonth}
                  onClick={() =>
                    setVisibleMonth(
                      new Date(
                        visibleMonth.getFullYear(),
                        visibleMonth.getMonth() - 1,
                        1,
                        12,
                      ),
                    )
                  }
                  type="button"
                >
                  <ChevronLeft aria-hidden="true" size={18} />
                </button>
                <button onClick={() => selectDate(today)} type="button">
                  {t.calendar.today}
                </button>
                <button
                  aria-label={t.calendar.nextMonth}
                  onClick={() =>
                    setVisibleMonth(
                      new Date(
                        visibleMonth.getFullYear(),
                        visibleMonth.getMonth() + 1,
                        1,
                        12,
                      ),
                    )
                  }
                  type="button"
                >
                  <ChevronRight aria-hidden="true" size={18} />
                </button>
              </div>
            </div>

            <div aria-hidden="true" className="weekday-row">
              {weekdayNames.map((name) => <span key={name}>{name}</span>)}
            </div>
            <div
              aria-labelledby="calendar-title"
              className="calendar-grid"
              role="grid"
            >
              {calendarDays.map((day) => {
                const key = toLocalDateKey(day);
                const dayTasks = tasks.filter((task) => task.deadline === key);
                const taskCountLabel =
                  dayTasks.length === 1
                    ? t.calendar.taskSingular
                    : t.calendar.taskPlural;
                const classes = ["calendar-day"];
                if (day.getMonth() !== visibleMonth.getMonth()) {
                  classes.push("is-outside");
                }
                if (sameDate(day, today)) classes.push("is-today");
                if (sameDate(day, selectedDate)) classes.push("is-selected");

                return (
                  <button
                    aria-current={sameDate(day, today) ? "date" : undefined}
                    aria-label={`${new Intl.DateTimeFormat(languageTag, {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    }).format(day)}${
                      dayTasks.length
                        ? `, ${dayTasks.length} ${taskCountLabel}`
                        : ""
                    }`}
                    className={classes.join(" ")}
                    data-date={key}
                    data-testid="calendar-day"
                    key={key}
                    onClick={() => selectDate(day)}
                    role="gridcell"
                    type="button"
                  >
                    <span className="day-number">{day.getDate()}</span>
                    {dayTasks.length > 0 && (
                      <span className="day-tasks">
                        {dayTasks.slice(0, 2).map((task) => (
                          <span
                            className={`day-task task-color-${task.category}${
                              task.done ? " is-done" : ""
                            }`}
                            key={task.id}
                          >
                            {task.title}
                          </span>
                        ))}
                        {dayTasks.length > 2 && (
                          <span className="more-tasks">+{dayTasks.length - 2}</span>
                        )}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
            <div className="calendar-legend">
              <span><i className="legend-dot today-dot" />{t.calendar.today}</span>
              <span><i className="legend-dot task-dot" />{t.calendar.deadlineLegend}</span>
            </div>
          </section>

          <aside aria-labelledby="task-panel-title" className="task-panel">
            <div className="task-panel-head">
              <p className="eyebrow">{t.calendar.dayPlan}</p>
              <h3 id="task-panel-title">
                {new Intl.DateTimeFormat(languageTag, {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                }).format(selectedDate)}
              </h3>
              <p>
                {selectedTasks.length
                  ? `${completedCount} ${t.calendar.of} ${selectedTasks.length} ${t.calendar.complete}`
                  : t.calendar.clearDay}
              </p>
            </div>

            <form className="task-form" onSubmit={addTask}>
              <label>
                <span>{t.calendar.task}</span>
                <input
                  autoComplete="off"
                  maxLength={90}
                  onChange={(event) => setTaskTitle(event.target.value)}
                  placeholder={t.calendar.taskPlaceholder}
                  required
                  value={taskTitle}
                />
              </label>
              <label>
                <span>{t.calendar.deadline}</span>
                <input
                  onChange={(event) => setTaskDeadline(event.target.value)}
                  required
                  type="date"
                  value={taskDeadline}
                />
              </label>
              <button
                className="button button-green"
                data-testid="calendar-add-task"
                type="submit"
              >
                {t.calendar.add}<Plus aria-hidden="true" size={17} />
              </button>
            </form>

            <div className="task-list-panel">
              {selectedTasks.length === 0 ? (
                <p className="empty-tasks">{t.calendar.emptyTasks}</p>
              ) : (
                selectedTasks.map((task) => (
                  <article
                    className={`task-item task-color-${task.category}${
                      task.done ? " is-done" : ""
                    }`}
                    data-source={task.source}
                    data-testid="calendar-task"
                    key={task.id}
                  >
                    <input
                      aria-label={`${task.title}: ${t.calendar.complete}`}
                      checked={task.done}
                      onChange={() => onToggleTask(task.id)}
                      type="checkbox"
                    />
                    <div className="task-copy">
                      <strong>{task.title}</strong>
                      <small>
                        {t.calendar.deadline}: {new Intl.DateTimeFormat(languageTag, {
                          day: "numeric",
                          month: "short",
                        }).format(fromLocalDateKey(task.deadline) ?? selectedDate)}
                      </small>
                    </div>
                    <button
                      aria-label={`${t.calendar.deleteTask}: ${task.title}`}
                      className="delete-task"
                      onClick={() => onDeleteTask(task.id)}
                      type="button"
                    >
                      <Trash2 aria-hidden="true" size={15} />
                    </button>
                  </article>
                ))
              )}
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}
