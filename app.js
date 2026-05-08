"use strict";

const operationDisplay = document.getElementById("operationDisplay");
const resultDisplay = document.getElementById("resultDisplay");
const historyList = document.getElementById("historyList");
const clearHistoryButton = document.getElementById("clearHistoryButton");
const keypad = document.querySelector(".keypad");

const MAX_HISTORY = 10;
const operators = new Set(["+", "-", "*", "/", "%"]);

let expression = "";
let lastResult = null;
let history = [];

function updateDisplay() {
  operationDisplay.textContent = expression || "0";
}

function setResult(text, isError = false) {
  resultDisplay.textContent = text;
  resultDisplay.classList.toggle("error", isError);
}

function renderHistory() {
  historyList.innerHTML = "";

  if (history.length === 0) {
    const emptyItem = document.createElement("li");
    emptyItem.className = "history-empty";
    emptyItem.textContent = "Aucun calcul pour le moment.";
    historyList.appendChild(emptyItem);
    return;
  }

  history.forEach((entry) => {
    const item = document.createElement("li");
    item.className = "history-item";

    const operation = document.createElement("p");
    operation.className = "history-entry";
    operation.textContent = entry.expression;

    const result = document.createElement("p");
    result.className = "history-result";
    result.textContent = entry.result;

    item.append(operation, result);
    historyList.appendChild(item);
  });
}

function addToHistory(sourceExpression, result) {
  history.unshift({
    expression: `${formatForDisplay(sourceExpression)} =`,
    result: String(result),
  });

  if (history.length > MAX_HISTORY) {
    history = history.slice(0, MAX_HISTORY);
  }

  renderHistory();
}

function clearAll() {
  expression = "";
  lastResult = null;
  updateDisplay();
  setResult("0");
}

function clearHistory() {
  history = [];
  renderHistory();
}

function formatForDisplay(value) {
  return value
    .replace(/\*/g, "×")
    .replace(/\//g, "÷")
    .replace(/-/g, "−");
}

function normalizeExpression(value) {
  return value.replace(/\s+/g, "");
}

function isOperator(char) {
  return operators.has(char);
}

function getLastNumberSegment(value) {
  const segments = value.split(/[+\-*/%]/);
  return segments[segments.length - 1] || "";
}

function appendDigitOrDecimal(input) {
  if (input === ".") {
    const currentSegment = getLastNumberSegment(expression);
    if (currentSegment.includes(".")) {
      return;
    }

    if (expression === "" || isOperator(expression.slice(-1))) {
      expression += "0";
    }
  }

  if (lastResult !== null && expression === String(lastResult)) {
    expression = input === "." ? "0." : "";
  }

  expression += input;
  updateDisplay();
}

function appendOperator(input) {
  if (expression === "") {
    if (input === "-") {
      expression = "-";
      updateDisplay();
    }
    return;
  }

  const lastChar = expression.slice(-1);

  if (isOperator(lastChar)) {
    expression = `${expression.slice(0, -1)}${input}`;
  } else {
    expression += input;
  }

  lastResult = null;
  updateDisplay();
}

function deleteLastCharacter() {
  if (!expression) {
    return;
  }

  expression = expression.slice(0, -1);
  updateDisplay();
}

function validateExpression(value) {
  const normalized = normalizeExpression(value);

  if (!normalized || /[+\-*/%.]$/.test(normalized)) {
    throw new Error("Expression invalide");
  }

  if (!/^[-\d+*/%.]+$/.test(normalized)) {
    throw new Error("Expression invalide");
  }

  if (/[*\/%]{2,}|[+\-]{3,}|[+\-][*\/%]|[*\/%][+\-*/%]/.test(normalized)) {
    throw new Error("Expression invalide");
  }

  return normalized;
}

function computeExpression(value) {
  const normalized = validateExpression(value);

  if (/\/0(?!\d|\.)/.test(normalized)) {
    throw new Error("Division par zéro");
  }

  let result;

  try {
    // L'expression est validée en amont pour limiter les caractères autorisés.
    result = Function(`"use strict"; return (${normalized});`)();
  } catch {
    throw new Error("Expression invalide");
  }

  if (!Number.isFinite(result)) {
    throw new Error("Division par zéro");
  }

  return Number.parseFloat(result.toFixed(10)).toString();
}

function evaluateExpression() {
  if (!expression) {
    setResult("0");
    return;
  }

  try {
    const sourceExpression = expression;
    const computed = computeExpression(sourceExpression);

    setResult(computed);
    addToHistory(sourceExpression, computed);

    expression = computed;
    lastResult = computed;
    updateDisplay();
  } catch (error) {
    setResult(error.message, true);
  }
}

function handleInput(input) {
  if (/\d/.test(input) || input === ".") {
    appendDigitOrDecimal(input);
    return;
  }

  if (isOperator(input)) {
    appendOperator(input);
  }
}

function pressVisualButton(selector) {
  const button = document.querySelector(selector);

  if (!button) {
    return;
  }

  button.classList.add("is-pressed");
  window.setTimeout(() => button.classList.remove("is-pressed"), 120);
}

keypad.addEventListener("click", (event) => {
  const target = event.target.closest("button");

  if (!target) {
    return;
  }

  const { value, action } = target.dataset;

  if (value) {
    handleInput(value);
  }

  if (action === "clear") {
    clearAll();
  } else if (action === "delete") {
    deleteLastCharacter();
  } else if (action === "equals") {
    evaluateExpression();
  }
});

clearHistoryButton.addEventListener("click", clearHistory);

window.addEventListener("keydown", (event) => {
  const { key } = event;

  if ((event.ctrlKey || event.metaKey) && key.toLowerCase() === "l") {
    return;
  }

  if (/\d/.test(key) || key === ".") {
    handleInput(key);
    pressVisualButton(`[data-value="${key}"]`);
    return;
  }

  if (["+", "-", "*", "/", "%"].includes(key)) {
    handleInput(key);
    pressVisualButton(`[data-value="${key}"]`);
    return;
  }

  if (key === "Enter" || key === "=") {
    event.preventDefault();
    evaluateExpression();
    pressVisualButton('[data-action="equals"]');
    return;
  }

  if (key === "Backspace") {
    deleteLastCharacter();
    pressVisualButton('[data-action="delete"]');
    return;
  }

  if (key === "Delete" || key.toLowerCase() === "c" || key === "Escape") {
    clearAll();
    pressVisualButton('[data-action="clear"]');
  }
});

updateDisplay();
renderHistory();
setResult("0");
