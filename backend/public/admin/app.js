(() => {
  "use strict";

  const TOKEN_KEY = "quanda:admin-analytics-token";
  const REFRESH_INTERVAL_MS = 60_000;
  let refreshTimer = null;

  const elements = {
    loginPanel: document.querySelector("#login-panel"),
    loginForm: document.querySelector("#login-form"),
    token: document.querySelector("#admin-token"),
    loginError: document.querySelector("#login-error"),
    dashboard: document.querySelector("#dashboard"),
    dashboardError: document.querySelector("#dashboard-error"),
    filterForm: document.querySelector("#filter-form"),
    startDate: document.querySelector("#start-date"),
    endDate: document.querySelector("#end-date"),
    refreshButton: document.querySelector("#refresh-button"),
    autoRefresh: document.querySelector("#auto-refresh"),
    signOut: document.querySelector("#sign-out"),
    updatedAt: document.querySelector("#updated-at"),
    eventsBody: document.querySelector("#events-body"),
    eventsEmpty: document.querySelector("#events-empty"),
  };

  const numberFormatter = new Intl.NumberFormat("en");
  const decimalFormatter = new Intl.NumberFormat("en", {
    maximumFractionDigits: 2,
  });
  const percentFormatter = new Intl.NumberFormat("en", {
    style: "percent",
    maximumFractionDigits: 1,
  });

  function dateInputValue(date) {
    return date.toISOString().slice(0, 10);
  }

  function setDefaultDates() {
    const end = new Date();
    const start = new Date(end);
    start.setUTCDate(start.getUTCDate() - 29);
    elements.startDate.value = dateInputValue(start);
    elements.endDate.value = dateInputValue(end);
  }

  function text(id, value) {
    const element = document.querySelector(`#${id}`);
    if (element) element.textContent = value;
  }

  function count(value) {
    return numberFormatter.format(Number(value || 0));
  }

  function percent(value) {
    return percentFormatter.format(Number(value || 0));
  }

  function showError(element, message) {
    element.textContent = message;
    element.hidden = !message;
  }

  function currentToken() {
    return sessionStorage.getItem(TOKEN_KEY) || "";
  }

  function lockDashboard(message = "") {
    sessionStorage.removeItem(TOKEN_KEY);
    elements.dashboard.hidden = true;
    elements.loginPanel.hidden = false;
    elements.token.value = "";
    showError(elements.loginError, message);
    if (refreshTimer) window.clearInterval(refreshTimer);
    refreshTimer = null;
    elements.token.focus();
  }

  function openDashboard() {
    elements.loginPanel.hidden = true;
    elements.dashboard.hidden = false;
    showError(elements.loginError, "");
  }

  function queryString() {
    return new URLSearchParams({
      start: elements.startDate.value,
      end: elements.endDate.value,
      source: "real",
    }).toString();
  }

  async function fetchAnalytics(report) {
    const response = await fetch(`/api/v1/admin/analytics/${report}?${queryString()}`, {
      headers: { Authorization: `Bearer ${currentToken()}` },
      cache: "no-store",
    });
    if (response.status === 403) {
      const error = new Error("The admin token was not accepted.");
      error.code = "forbidden";
      throw error;
    }
    if (!response.ok) throw new Error(`Analytics request failed (${response.status}).`);
    return response.json();
  }

  function renderOverview(data) {
    text("active-users", count(data.users.active));
    text("total-sessions", count(data.sessions.total));
    text(
      "sessions-per-user",
      `${decimalFormatter.format(Number(data.sessions.averagePerActiveUser || 0))} per active identity`,
    );
    text("dau", count(data.activity.dau));
    text(
      "wau-mau",
      `${count(data.activity.wau)} last 7 days · ${count(data.activity.mau)} last 30 days`,
    );
    text("new-users", count(data.users.new));
    text("returning-users", `${count(data.users.returning)} returned for another session`);
    text("briefs", count(data.product.briefsSubmitted));
    text("roadmaps", count(data.product.roadmapsGenerated));
    text("roadmap-conversion", `${percent(data.product.briefToRoadmapConversion)} conversion`);
    text("tutorial-rate", percent(data.product.tutorialOpenRate));
    text("calendar-adoption", percent(data.product.calendarAdoption));
    text("stages-completed", count(data.product.stagesCompleted));
    text("projects-completed", count(data.product.projectsCompleted));
  }

  function renderRetention(data) {
    for (const day of [1, 7, 30]) {
      const value = data.retention[`d${day}`];
      text(`retention-d${day}`, percent(value.rate));
      text(`retention-d${day}-detail`, `${count(value.retained)} of ${count(value.eligible)} eligible users`);
    }
  }

  function renderEvents(data) {
    elements.eventsBody.replaceChildren();
    elements.eventsEmpty.hidden = data.events.length > 0;
    for (const event of data.events) {
      const row = document.createElement("tr");
      for (const value of [event.name, count(event.count), count(event.uniqueUsers)]) {
        const cell = document.createElement("td");
        cell.textContent = value;
        row.appendChild(cell);
      }
      elements.eventsBody.appendChild(row);
    }
  }

  function updateAutoRefresh() {
    if (refreshTimer) window.clearInterval(refreshTimer);
    refreshTimer = null;
    if (elements.autoRefresh.checked && currentToken()) {
      refreshTimer = window.setInterval(() => void loadDashboard(), REFRESH_INTERVAL_MS);
    }
  }

  async function loadDashboard() {
    elements.refreshButton.disabled = true;
    elements.refreshButton.textContent = "Refreshing…";
    showError(elements.dashboardError, "");
    try {
      const [overview, retention, events] = await Promise.all([
        fetchAnalytics("overview"),
        fetchAnalytics("retention"),
        fetchAnalytics("events"),
      ]);
      renderOverview(overview);
      renderRetention(retention);
      renderEvents(events);
      elements.updatedAt.textContent = `Live data updated ${new Date().toLocaleString()}`;
      openDashboard();
      updateAutoRefresh();
    } catch (error) {
      if (error.code === "forbidden") {
        lockDashboard("That admin token was not accepted. Check it in the Node application settings and try again.");
        return;
      }
      showError(elements.dashboardError, error.message || "The analytics service could not be reached.");
    } finally {
      elements.refreshButton.disabled = false;
      elements.refreshButton.textContent = "Refresh now";
    }
  }

  elements.loginForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const token = elements.token.value.trim();
    if (!token) return;
    sessionStorage.setItem(TOKEN_KEY, token);
    void loadDashboard();
  });

  elements.filterForm.addEventListener("submit", (event) => {
    event.preventDefault();
    void loadDashboard();
  });
  elements.autoRefresh.addEventListener("change", updateAutoRefresh);
  elements.signOut.addEventListener("click", () => lockDashboard());

  setDefaultDates();
  if (currentToken()) {
    void loadDashboard();
  } else {
    elements.token.focus();
  }
})();
