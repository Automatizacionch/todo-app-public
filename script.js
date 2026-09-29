(function () {
  "use strict";

  var STORAGE_KEY = "todo-app-tasks-v1";

  var form = document.getElementById("task-form");
  var input = document.getElementById("task-input");
  var list = document.getElementById("task-list");
  var emptyMessage = document.getElementById("empty-message");
  var countPending = document.getElementById("count-pending");
  var countCompleted = document.getElementById("count-completed");
  var tabs = document.querySelectorAll(".tab");
  var itemTemplate = document.getElementById("task-item-template");

  var currentFilter = "pending";

  function loadTasks() {
    var raw;
    try {
      raw = window.localStorage.getItem(STORAGE_KEY);
    } catch (err) {
      return [];
    }
    if (!raw) {
      return [];
    }
    try {
      var parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.filter(function (t) {
          return t && typeof t.id === "string" && typeof t.text === "string";
        });
      }
    } catch (err) {
      /* corrupted storage, start fresh */
    }
    return [];
  }

  function saveTasks(tasks) {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    } catch (err) {
      /* storage unavailable or full; state stays in memory for this session */
    }
  }

  function makeId() {
    return "t-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 8);
  }

  var tasks = loadTasks();

  function setFilter(filter) {
    currentFilter = filter;
    tabs.forEach(function (tab) {
      var isActive = tab.dataset.filter === filter;
      tab.classList.toggle("active", isActive);
      tab.setAttribute("aria-selected", isActive ? "true" : "false");
    });
    render();
  }

  function render() {
    list.innerHTML = "";

    var visible = tasks.filter(function (t) {
      return currentFilter === "completed" ? t.completed : !t.completed;
    });

    visible.forEach(function (task) {
      var node = itemTemplate.content.firstElementChild.cloneNode(true);
      node.dataset.id = task.id;
      node.classList.toggle("completed", task.completed);

      var toggle = node.querySelector(".task-toggle");
      toggle.checked = task.completed;
      toggle.addEventListener("change", function () {
        toggleTask(task.id);
      });

      var textEl = node.querySelector(".task-text");
      textEl.textContent = task.text;

      node.querySelector(".delete-btn").addEventListener("click", function () {
        deleteTask(task.id);
      });

      node.querySelector(".edit-btn").addEventListener("click", function () {
        startEdit(node, task);
      });

      list.appendChild(node);
    });

    countPending.textContent = String(tasks.filter(function (t) { return !t.completed; }).length);
    countCompleted.textContent = String(tasks.filter(function (t) { return t.completed; }).length);

    emptyMessage.hidden = visible.length !== 0;
  }

  function startEdit(node, task) {
    node.classList.add("editing");
    var checkLabel = node.querySelector(".task-check");
    var actions = node.querySelector(".task-actions");

    var editForm = document.createElement("div");
    editForm.className = "edit-form";

    var editInput = document.createElement("input");
    editInput.type = "text";
    editInput.value = task.text;
    editInput.maxLength = 200;

    var saveBtn = document.createElement("button");
    saveBtn.type = "button";
    saveBtn.className = "save-btn";
    saveBtn.textContent = "Guardar";

    var cancelBtn = document.createElement("button");
    cancelBtn.type = "button";
    cancelBtn.className = "cancel-btn";
    cancelBtn.textContent = "Cancelar";

    editForm.appendChild(editInput);
    editForm.appendChild(saveBtn);
    editForm.appendChild(cancelBtn);
    node.insertBefore(editForm, checkLabel);

    editInput.focus();
    editInput.setSelectionRange(editInput.value.length, editInput.value.length);

    function finishEdit() {
      editForm.remove();
      node.classList.remove("editing");
    }

    function commit() {
      var value = editInput.value.trim();
      if (value.length === 0) {
        finishEdit();
        render();
        return;
      }
      editTask(task.id, value);
    }

    saveBtn.addEventListener("click", commit);
    cancelBtn.addEventListener("click", function () {
      finishEdit();
      render();
    });
    editInput.addEventListener("keydown", function (e) {
      if (e.key === "Enter") {
        e.preventDefault();
        commit();
      } else if (e.key === "Escape") {
        finishEdit();
        render();
      }
    });
  }

  function addTask(text) {
    var trimmed = text.trim();
    if (trimmed.length === 0) {
      return;
    }
    tasks.push({ id: makeId(), text: trimmed, completed: false, createdAt: Date.now() });
    saveTasks(tasks);
    render();
  }

  function editTask(id, newText) {
    var task = tasks.find(function (t) { return t.id === id; });
    if (!task) {
      return;
    }
    task.text = newText;
    saveTasks(tasks);
    render();
  }

  function toggleTask(id) {
    var task = tasks.find(function (t) { return t.id === id; });
    if (!task) {
      return;
    }
    task.completed = !task.completed;
    saveTasks(tasks);
    render();
  }

  function deleteTask(id) {
    tasks = tasks.filter(function (t) { return t.id !== id; });
    saveTasks(tasks);
    render();
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    addTask(input.value);
    input.value = "";
    input.focus();
  });

  tabs.forEach(function (tab) {
    tab.addEventListener("click", function () {
      setFilter(tab.dataset.filter);
    });
  });

  render();
})();
