"use strict";

const operationDisplay = document.getElementById("operationDisplay");
const resultDisplay = document.getElementById("resultDisplay");
const feedbackMessage = document.getElementById("feedbackMessage");
const historyList = document.getElementById("historyList");
const clearHistoryButton = document.getElementById("clearHistoryButton");
const themeToggleButton = document.getElementById("themeToggleButton");
const copyResultButton = document.getElementById("copyResultButton");
const memoryIndicator = document.getElementById("memoryIndicator");
const keypad = document.querySelector(".keypad");
const angleButtons = document.querySelectorAll('[data-setting="angle"]');
const precisionButtons = document.querySelectorAll('[data-setting="precision"]');

const STORAGE_KEYS = {
  history: "calculator-history",
  theme: "calculator-theme",
  memory: "calculator-memory",
  angleMode: "calculator-angle-mode",
  precision: "calculator-precision",
};

const MAX_HISTORY = 10;
const DEFAULT_THEME = "dark";
const DEFAULT_ANGLE_MODE = "deg";
const DEFAULT_PRECISION = 4;
const SUPPORTED_FUNCTIONS = new Set(["sin", "cos", "tan", "log", "ln", "sqrt", "sqr", "inv", "neg"]);
const PRETTY_REPLACEMENTS = [
  [/sqrt\(/g, "√("],
  [/sqr\(/g, "sqr("],
  [/inv\(/g, "1/("],
  [/neg\(/g, "−("],
  [/sin\(/g, "sin("],
  [/cos\(/g, "cos("],
  [/tan\(/g, "tan("],
  [/log\(/g, "log("],
  [/ln\(/g, "ln("],
  [/\bpi\b/g, "π"],
  [/\be\b/g, "e"],
  [/\*/g, "×"],
  [/\//g, "÷"],
];

let expression = "";
let lastResult = "0";
let lastAnswerValue = 0;
let history = loadHistory();
let memoryValue = loadNumber(STORAGE_KEYS.memory, 0);
let angleMode = loadString(STORAGE_KEYS.angleMode, DEFAULT_ANGLE_MODE, ["deg", "rad"]);
let precision = loadPrecision();
let currentTheme = loadString(STORAGE_KEYS.theme, DEFAULT_THEME, ["dark", "light"]);
let resultJustComputed = false;

function loadHistory() {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.history);
    const parsed = stored ? JSON.parse(stored) : [];

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .filter((entry) => typeof entry?.rawExpression === "string" && typeof entry?.result === "string")
      .slice(0, MAX_HISTORY);
  } catch {
    return [];
  }
}

function loadNumber(key, fallbackValue) {
  const storedValue = Number(localStorage.getItem(key));
  return Number.isFinite(storedValue) ? storedValue : fallbackValue;
}

function loadString(key, fallbackValue, allowedValues) {
  const storedValue = localStorage.getItem(key);
  return allowedValues.includes(storedValue) ? storedValue : fallbackValue;
}

function loadPrecision() {
  const storedValue = Number(localStorage.getItem(STORAGE_KEYS.precision));
  return [2, 4, 6].includes(storedValue) ? storedValue : DEFAULT_PRECISION;
}

function saveHistory() {
  localStorage.setItem(STORAGE_KEYS.history, JSON.stringify(history));
}

function saveMemory() {
  localStorage.setItem(STORAGE_KEYS.memory, String(memoryValue));
}

function setFeedback(message, type = "info") {
  feedbackMessage.textContent = message;
  feedbackMessage.classList.toggle("is-error", type === "error");
  feedbackMessage.classList.toggle("is-success", type === "success");
}

function setResult(text, isError = false) {
  resultDisplay.textContent = text;
  resultDisplay.classList.toggle("error", isError);
}

function formatExpressionForDisplay(value) {
  return PRETTY_REPLACEMENTS.reduce((formatted, [pattern, replacement]) => (
    formatted.replace(pattern, replacement)
  ), value || "0");
}

function updateDisplay() {
  operationDisplay.textContent = formatExpressionForDisplay(expression);
}

function formatNumber(value) {
  if (!Number.isFinite(value)) {
    throw new Error("Expression invalide");
  }

  if (Math.abs(value) >= 1e12 || (Math.abs(value) > 0 && Math.abs(value) < 1e-6)) {
    return value.toExponential(precision);
  }

  return Number.parseFloat(value.toFixed(precision)).toString();
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
    const button = document.createElement("button");
    const operation = document.createElement("p");
    const result = document.createElement("p");

    button.type = "button";
    button.className = "history-button";
    button.dataset.expression = entry.rawExpression;
    button.setAttribute("aria-label", `Réutiliser ${entry.displayExpression}`);

    operation.className = "history-entry";
    operation.textContent = `${entry.displayExpression} =`;

    result.className = "history-result";
    result.textContent = entry.result;

    button.append(operation, result);
    item.appendChild(button);
    historyList.appendChild(item);
  });
}

function addToHistory(rawExpression, result) {
  history.unshift({
    rawExpression,
    displayExpression: formatExpressionForDisplay(rawExpression),
    result,
  });

  history = history.slice(0, MAX_HISTORY);
  saveHistory();
  renderHistory();
}

function updateMemoryIndicator() {
  memoryIndicator.textContent = `M: ${formatNumber(memoryValue)}`;
}

function updateTheme() {
  document.body.dataset.theme = currentTheme;
  themeToggleButton.textContent = currentTheme === "dark" ? "Mode clair" : "Mode sombre";
  localStorage.setItem(STORAGE_KEYS.theme, currentTheme);
}

function updateModeButtons() {
  angleButtons.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.mode === angleMode);
  });

  precisionButtons.forEach((button) => {
    button.classList.toggle("is-active", Number(button.dataset.precision) === precision);
  });

  localStorage.setItem(STORAGE_KEYS.angleMode, angleMode);
  localStorage.setItem(STORAGE_KEYS.precision, String(precision));
}

function clearAll() {
  expression = "";
  resultJustComputed = false;
  updateDisplay();
  setResult("0");
  setFeedback("Expression effacée.");
}

function clearHistory() {
  history = [];
  saveHistory();
  renderHistory();
  setFeedback("Historique effacé.", "success");
}

function deleteLastCharacter() {
  if (!expression) {
    return;
  }

  expression = expression.slice(0, -1);
  resultJustComputed = false;
  updateDisplay();
  setFeedback("Dernier caractère supprimé.");
}

function countOpenParentheses(value) {
  let balance = 0;

  for (const char of value) {
    if (char === "(") {
      balance += 1;
    } else if (char === ")") {
      balance -= 1;
    }
  }

  return balance;
}

function getLastCharacter() {
  return expression.slice(-1);
}

function endsWithValue(value) {
  return /[\d)e%]/.test(value.slice(-1));
}

function getCurrentNumberSegment(value) {
  const match = value.match(/(\d+\.?\d*|\.\d+)$/);
  return match ? match[0] : "";
}

function prepareForNewValueInput() {
  if (resultJustComputed) {
    expression = "";
    resultJustComputed = false;
  }
}

function appendNumber(input) {
  prepareForNewValueInput();

  if (input === ".") {
    const currentNumber = getCurrentNumberSegment(expression);

    if (currentNumber.includes(".")) {
      return;
    }

    if (!expression || /[+\-*/^(]$/.test(expression)) {
      expression += "0";
    }
  }

  if (endsWithValue(expression)) {
    const lastChar = getLastCharacter();
    if (lastChar === ")" || lastChar === "e" || lastChar === "%") {
      expression += "*";
    }
  }

  expression += input;
  updateDisplay();
}

function appendConstant(constantName) {
  prepareForNewValueInput();

  if (endsWithValue(expression)) {
    expression += "*";
  }

  expression += constantName;
  updateDisplay();
}

function appendFunction(functionName) {
  resultJustComputed = false;

  if (expression && endsWithValue(expression)) {
    expression += "*";
  }

  expression += `${functionName}(`;
  updateDisplay();
}

function appendParenthesis(parenthesis) {
  if (parenthesis === "(") {
    if (resultJustComputed) {
      expression = "";
      resultJustComputed = false;
    }

    if (expression && endsWithValue(expression)) {
      expression += "*";
    }

    expression += "(";
    updateDisplay();
    return;
  }

  const openCount = countOpenParentheses(expression);

  if (openCount <= 0 || !expression || /[+\-*/^(]$/.test(expression)) {
    return;
  }

  expression += ")";
  updateDisplay();
}

function appendOperator(operator) {
  if (operator === "%") {
    if (!expression || !/[\d)e]$/.test(expression)) {
      return;
    }

    expression += "%";
    resultJustComputed = false;
    updateDisplay();
    return;
  }

  if (!expression) {
    if (operator === "-") {
      expression = "-";
      updateDisplay();
    }
    return;
  }

  resultJustComputed = false;
  const lastChar = getLastCharacter();

  if (/[+\-*/^]$/.test(lastChar)) {
    if (operator === "-" && lastChar !== "-") {
      expression += "-";
    } else {
      expression = `${expression.slice(0, -1)}${operator}`;
    }
  } else {
    expression += operator;
  }

  updateDisplay();
}

function wrapCurrentExpression(functionName) {
  const targetExpression = expression || lastResult;

  if (!targetExpression || /[+\-*/^(]$/.test(targetExpression)) {
    setFeedback("Aucune valeur valide à transformer.", "error");
    return;
  }

  expression = `${functionName}(${targetExpression})`;
  resultJustComputed = false;
  updateDisplay();
  setFeedback(`Transformation appliquée : ${functionName}.`, "success");
}

function toggleSign() {
  wrapCurrentExpression("neg");
}

function tokenize(value) {
  const tokens = [];
  let index = 0;

  while (index < value.length) {
    const char = value[index];

    if (/\s/.test(char)) {
      index += 1;
      continue;
    }

    if (/\d|\./.test(char)) {
      let number = char;
      index += 1;

      while (index < value.length && /[\d.]/.test(value[index])) {
        number += value[index];
        index += 1;
      }

      if ((number.match(/\./g) || []).length > 1) {
        throw new Error("Expression invalide");
      }

      tokens.push({ type: "number", value: Number(number) });
      continue;
    }

    if (/[a-z]/i.test(char)) {
      let identifier = char;
      index += 1;

      while (index < value.length && /[a-z]/i.test(value[index])) {
        identifier += value[index];
        index += 1;
      }

      if (identifier === "pi") {
        tokens.push({ type: "number", value: Math.PI });
        continue;
      }

      if (identifier === "e") {
        tokens.push({ type: "number", value: Math.E });
        continue;
      }

      if (!SUPPORTED_FUNCTIONS.has(identifier)) {
        throw new Error("Expression invalide");
      }

      tokens.push({ type: "function", value: identifier });
      continue;
    }

    if ("+-*/^()%".includes(char)) {
      if (char === "(" || char === ")") {
        tokens.push({ type: "parenthesis", value: char });
      } else {
        tokens.push({ type: "operator", value: char });
      }

      index += 1;
      continue;
    }

    throw new Error("Expression invalide");
  }

  return tokens;
}

function toRpn(tokens) {
  const output = [];
  const operators = [];
  const precedence = { "+": 1, "-": 1, "*": 2, "/": 2, "^": 3, "u-": 4, "%": 5 };
  const rightAssociative = new Set(["^", "u-"]);

  for (let index = 0; index < tokens.length; index += 1) {
    const token = tokens[index];
    const previousToken = tokens[index - 1];

    if (token.type === "number") {
      output.push(token);
      continue;
    }

    if (token.type === "function") {
      operators.push(token);
      continue;
    }

    if (token.type === "operator") {
      let operatorValue = token.value;

      if (operatorValue === "-" && (!previousToken || (previousToken.type === "operator" && previousToken.value !== "%") || (previousToken.type === "parenthesis" && previousToken.value === "("))) {
        operatorValue = "u-";
      }

      if (operatorValue === "%" && (!previousToken || (previousToken.type !== "number" && !(previousToken.type === "parenthesis" && previousToken.value === ")")))) {
        throw new Error("Expression invalide");
      }

      while (operators.length > 0) {
        const top = operators[operators.length - 1];

        if (top.type === "parenthesis" && top.value === "(") {
          break;
        }

        if (top.type === "function") {
          output.push(operators.pop());
          continue;
        }

        const topPrecedence = precedence[top.value];
        const currentPrecedence = precedence[operatorValue];

        if (
          top.type === "operator" &&
          (
            topPrecedence > currentPrecedence ||
            (topPrecedence === currentPrecedence && !rightAssociative.has(operatorValue))
          )
        ) {
          output.push(operators.pop());
          continue;
        }

        break;
      }

      operators.push({ type: "operator", value: operatorValue });
      continue;
    }

    if (token.type === "parenthesis" && token.value === "(") {
      operators.push(token);
      continue;
    }

    if (token.type === "parenthesis" && token.value === ")") {
      let openingParenthesisFound = false;

      while (operators.length > 0) {
        const top = operators.pop();

        if (top.type === "parenthesis" && top.value === "(") {
          openingParenthesisFound = true;
          break;
        }

        output.push(top);
      }

      if (!openingParenthesisFound) {
        throw new Error("Expression invalide");
      }

      if (operators.length > 0 && operators[operators.length - 1].type === "function") {
        output.push(operators.pop());
      }
    }
  }

  while (operators.length > 0) {
    const top = operators.pop();

    if (top.type === "parenthesis") {
      throw new Error("Expression invalide");
    }

    output.push(top);
  }

  return output;
}

function convertAngle(value) {
  return angleMode === "deg" ? value * (Math.PI / 180) : value;
}

function applyFunction(functionName, value) {
  switch (functionName) {
    case "sin":
      return Math.sin(convertAngle(value));
    case "cos":
      return Math.cos(convertAngle(value));
    case "tan":
      return Math.tan(convertAngle(value));
    case "log":
      if (value <= 0) {
        throw new Error("Expression invalide");
      }
      return Math.log10(value);
    case "ln":
      if (value <= 0) {
        throw new Error("Expression invalide");
      }
      return Math.log(value);
    case "sqrt":
      if (value < 0) {
        throw new Error("Expression invalide");
      }
      return Math.sqrt(value);
    case "sqr":
      return value ** 2;
    case "inv":
      if (value === 0) {
        throw new Error("Division par zéro");
      }
      return 1 / value;
    case "neg":
      return -value;
    default:
      throw new Error("Expression invalide");
  }
}

function evaluateRpn(rpnTokens) {
  const stack = [];

  for (const token of rpnTokens) {
    if (token.type === "number") {
      stack.push(token.value);
      continue;
    }

    if (token.type === "function") {
      const operand = stack.pop();

      if (!Number.isFinite(operand)) {
        throw new Error("Expression invalide");
      }

      stack.push(applyFunction(token.value, operand));
      continue;
    }

    if (token.type === "operator") {
      if (token.value === "u-") {
        const operand = stack.pop();

        if (!Number.isFinite(operand)) {
          throw new Error("Expression invalide");
        }

        stack.push(-operand);
        continue;
      }

      if (token.value === "%") {
        const operand = stack.pop();

        if (!Number.isFinite(operand)) {
          throw new Error("Expression invalide");
        }

        stack.push(operand / 100);
        continue;
      }

      const right = stack.pop();
      const left = stack.pop();

      if (!Number.isFinite(left) || !Number.isFinite(right)) {
        throw new Error("Expression invalide");
      }

      switch (token.value) {
        case "+":
          stack.push(left + right);
          break;
        case "-":
          stack.push(left - right);
          break;
        case "*":
          stack.push(left * right);
          break;
        case "/":
          if (right === 0) {
            throw new Error("Division par zéro");
          }
          stack.push(left / right);
          break;
        case "^":
          stack.push(left ** right);
          break;
        default:
          throw new Error("Expression invalide");
      }
    }
  }

  if (stack.length !== 1 || !Number.isFinite(stack[0])) {
    throw new Error("Expression invalide");
  }

  return stack[0];
}

function computeExpression(value) {
  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return 0;
  }

  const tokens = tokenize(trimmedValue);
  const rpn = toRpn(tokens);
  return evaluateRpn(rpn);
}

function evaluateExpression() {
  if (!expression) {
    setResult(lastResult);
    setFeedback("Aucune nouvelle expression à calculer.");
    return;
  }

  try {
    const rawExpression = expression;
    const numericResult = computeExpression(rawExpression);
    const formattedResult = formatNumber(numericResult);

    lastAnswerValue = numericResult;
    lastResult = formattedResult;
    setResult(formattedResult);
    setFeedback("Calcul effectué.", "success");
    addToHistory(rawExpression, formattedResult);
    expression = formattedResult;
    resultJustComputed = true;
    updateDisplay();
  } catch (error) {
    setResult(error.message, true);
    setFeedback(error.message, "error");
    resultJustComputed = false;
  }
}

function getReusableNumericValue() {
  try {
    if (expression) {
      return computeExpression(expression);
    }

    return Number(lastResult);
  } catch {
    return Number(lastResult);
  }
}

function setExpressionFromHistory(savedExpression) {
  expression = savedExpression;
  resultJustComputed = false;
  updateDisplay();
  setFeedback("Expression restaurée depuis l'historique.", "success");
}

function handleMemoryAction(action) {
  if (action === "memory-clear") {
    memoryValue = 0;
    saveMemory();
    updateMemoryIndicator();
    setFeedback("Mémoire effacée.", "success");
    return;
  }

  if (action === "memory-recall") {
    expression = formatNumber(memoryValue);
    resultJustComputed = false;
    updateDisplay();
    setFeedback("Valeur mémoire rappelée.", "success");
    return;
  }

  const value = getReusableNumericValue();

  if (!Number.isFinite(value)) {
    setFeedback("Aucune valeur valide pour la mémoire.", "error");
    return;
  }

  if (action === "memory-add") {
    memoryValue += value;
    setFeedback("Résultat ajouté à la mémoire.", "success");
  } else if (action === "memory-subtract") {
    memoryValue -= value;
    setFeedback("Résultat soustrait de la mémoire.", "success");
  }

  saveMemory();
  updateMemoryIndicator();
}

function copyResult() {
  const textToCopy = resultDisplay.textContent;

  if (!textToCopy) {
    setFeedback("Aucun résultat à copier.", "error");
    return;
  }

  if (navigator.clipboard?.writeText) {
    navigator.clipboard.writeText(textToCopy)
      .then(() => setFeedback("Résultat copié dans le presse-papiers.", "success"))
      .catch(() => setFeedback("Copie impossible depuis ce navigateur.", "error"));
    return;
  }

  const fallbackField = document.createElement("textarea");
  fallbackField.value = textToCopy;
  document.body.appendChild(fallbackField);
  fallbackField.select();

  try {
    document.execCommand("copy");
    setFeedback("Résultat copié dans le presse-papiers.", "success");
  } catch {
    setFeedback("Copie impossible depuis ce navigateur.", "error");
  }

  document.body.removeChild(fallbackField);
}

function handleValueInput(value) {
  if (/\d/.test(value) || value === ".") {
    appendNumber(value);
    return;
  }

  if (value === "(" || value === ")") {
    appendParenthesis(value);
    return;
  }

  appendOperator(value);
}

function handleKeypadClick(event) {
  const target = event.target.closest("button");

  if (!target) {
    return;
  }

  const { value, action, function: functionName, constant } = target.dataset;

  if (value) {
    handleValueInput(value);
    return;
  }

  if (constant) {
    appendConstant(constant);
    return;
  }

  if (functionName) {
    if (["sqrt", "sqr", "inv"].includes(functionName)) {
      wrapCurrentExpression(functionName);
    } else {
      appendFunction(functionName);
    }
    return;
  }

  handleAction(action);
}

function handleAction(action) {
  switch (action) {
    case "clear":
      clearAll();
      break;
    case "delete":
      deleteLastCharacter();
      break;
    case "equals":
      evaluateExpression();
      break;
    case "toggle-sign":
      toggleSign();
      break;
    case "memory-clear":
    case "memory-recall":
    case "memory-add":
    case "memory-subtract":
      handleMemoryAction(action);
      break;
    case "copy":
      copyResult();
      break;
    case "clear-history":
      clearHistory();
      break;
    default:
      break;
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

function handleKeyboardInput(event) {
  const { key } = event;

  if ((event.ctrlKey || event.metaKey) && ["c", "l", "r"].includes(key.toLowerCase())) {
    return;
  }

  if (/\d/.test(key) || [".", "+", "-", "*", "/", "^", "%", "(", ")"].includes(key)) {
    event.preventDefault();
    handleValueInput(key);
    pressVisualButton(`[data-value="${CSS.escape(key)}"]`);
    return;
  }

  if (key === "Enter" || key === "=") {
    event.preventDefault();
    evaluateExpression();
    pressVisualButton('[data-action="equals"]');
    return;
  }

  if (key === "Backspace") {
    event.preventDefault();
    deleteLastCharacter();
    pressVisualButton('[data-action="delete"]');
    return;
  }

  if (key === "Escape") {
    event.preventDefault();
    clearAll();
    pressVisualButton('[data-action="clear"]');
    return;
  }

  const lowerKey = key.toLowerCase();
  const functionShortcuts = {
    s: "sin",
    c: "cos",
    t: "tan",
    l: "log",
    n: "ln",
    r: "sqrt",
    q: "sqr",
    i: "inv",
    p: "pi",
  };

  if (functionShortcuts[lowerKey]) {
    event.preventDefault();

    if (functionShortcuts[lowerKey] === "pi") {
      appendConstant("pi");
      pressVisualButton('[data-constant="pi"]');
      return;
    }

    if (["sqrt", "sqr", "inv"].includes(functionShortcuts[lowerKey])) {
      wrapCurrentExpression(functionShortcuts[lowerKey]);
      pressVisualButton(`[data-function="${functionShortcuts[lowerKey]}"]`);
      return;
    }

    appendFunction(functionShortcuts[lowerKey]);
    pressVisualButton(`[data-function="${functionShortcuts[lowerKey]}"]`);
    return;
  }

  if (lowerKey === "e") {
    event.preventDefault();
    appendConstant("e");
    pressVisualButton('[data-constant="e"]');
  }
}

function applyAngleMode(mode) {
  angleMode = mode;
  updateModeButtons();
  setFeedback(`Mode ${mode.toUpperCase()} activé.`, "success");
}

function applyPrecision(nextPrecision) {
  precision = nextPrecision;
  updateModeButtons();
  updateMemoryIndicator();

  if (Number.isFinite(lastAnswerValue)) {
    lastResult = formatNumber(lastAnswerValue);
    setResult(lastResult);
  }

  setFeedback(`Arrondi réglé sur ${nextPrecision} décimales.`, "success");
}

function initializeEvents() {
  keypad.addEventListener("click", handleKeypadClick);
  clearHistoryButton.addEventListener("click", clearHistory);

  historyList.addEventListener("click", (event) => {
    const historyButton = event.target.closest(".history-button");

    if (!historyButton) {
      return;
    }

    setExpressionFromHistory(historyButton.dataset.expression);
  });

  themeToggleButton.addEventListener("click", () => {
    currentTheme = currentTheme === "dark" ? "light" : "dark";
    updateTheme();
  });

  copyResultButton.addEventListener("click", copyResult);

  angleButtons.forEach((button) => {
    button.addEventListener("click", () => applyAngleMode(button.dataset.mode));
  });

  precisionButtons.forEach((button) => {
    button.addEventListener("click", () => applyPrecision(Number(button.dataset.precision)));
  });

  window.addEventListener("keydown", handleKeyboardInput);
}

function initialize() {
  updateTheme();
  updateModeButtons();
  updateDisplay();
  renderHistory();
  updateMemoryIndicator();
  setResult(lastResult);
  setFeedback("Prêt.");
  initializeEvents();
}

initialize();
