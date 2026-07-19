(function(){
  const resultEl = document.getElementById('result');
  const exprEl = document.getElementById('expression');

  // Calculator state
  let current = '0';        // value currently being typed / shown
  let previous = null;      // first operand, once an operator is chosen
  let operator = null;      // pending operator: + - * /
  let justEvaluated = false; // true right after "=" was pressed

  const OP_SYMBOLS = { add:'+', subtract:'−', multiply:'×', divide:'÷' };

  function formatNumber(numStr){
    if (numStr === 'Error') return numStr;
    const num = Number(numStr);
    if (!isFinite(num)) return 'Error';

    // Trim to a sane number of significant digits so it fits the display
    let str = num.toString();
    if (str.length > 12){
      str = num.toPrecision(10).toString();
      if (str.includes('.')) {
        str = str.replace(/0+$/,'').replace(/\.$/,'');
      }
      if (Number(str).toString().length <= 12) str = Number(str).toString();
    }
    return str;
  }

  function updateDisplay(){
    resultEl.textContent = formatNumber(current);

    if (operator && previous !== null){
      exprEl.textContent = `${formatNumber(previous)} ${OP_SYMBOLS[operator]}`;
    } else {
      exprEl.textContent = '\u00A0';
    }
  }

  function inputDigit(d){
    if (justEvaluated){
      current = d;
      justEvaluated = false;
      return;
    }
    if (current === '0'){
      current = d;
    } else if (current.replace('-','').length < 12) {
      current += d;
    }
  }

  function inputDecimal(){
    if (justEvaluated){
      current = '0.';
      justEvaluated = false;
      return;
    }
    if (!current.includes('.')) current += '.';
  }

  function clearAll(){
    current = '0';
    previous = null;
    operator = null;
    justEvaluated = false;
  }

  function negate(){
    if (current === '0') return;
    current = current.startsWith('-') ? current.slice(1) : '-' + current;
  }

  function percent(){
    current = (parseFloat(current) / 100).toString();
  }

  function compute(a, b, op){
    a = parseFloat(a);
    b = parseFloat(b);
    switch(op){
      case 'add': return a + b;
      case 'subtract': return a - b;
      case 'multiply': return a * b;
      case 'divide': return b === 0 ? NaN : a / b;
      default: return b;
    }
  }

  function chooseOperator(op){
    if (operator && !justEvaluated && previous !== null){
      const outcome = compute(previous, current, operator);
      previous = isFinite(outcome) ? outcome.toString() : 'Error';
      current = previous;
    } else {
      previous = current;
    }
    operator = op;
    justEvaluated = false;
    current = '0';
  }

  function equals(){
    if (operator === null || previous === null) return;
    const outcome = compute(previous, current, operator);
    current = isFinite(outcome) ? outcome.toString() : 'Error';
    previous = null;
    operator = null;
    justEvaluated = true;
  }

  function flashPing(button){
    button.classList.add('ping');
    setTimeout(() => button.classList.remove('ping'), 220);
  }

  function handleAction(button){
    const action = button.dataset.action;

    if (action === 'digit'){
      inputDigit(button.dataset.value);
    } else if (action === 'decimal'){
      inputDecimal();
    } else if (action === 'clear'){
      clearAll();
    } else if (action === 'negate'){
      negate();
    } else if (action === 'percent'){
      percent();
    } else if (['add','subtract','multiply','divide'].indexOf(action) !== -1){
      chooseOperator(action);
    } else if (action === 'equals'){
      equals();
    }

    if (current === 'Error'){
      previous = null;
      operator = null;
    }

    updateDisplay();
    flashPing(button);
  }

  // Wire up every button — both touch and click, since touchstart fires faster on Android
  const buttons = document.querySelectorAll('.keys button');
  for (let i = 0; i < buttons.length; i++){
    const btn = buttons[i];
    let touched = false;

    btn.addEventListener('touchstart', function(e){
      touched = true;
      handleAction(btn);
    }, { passive:true });

    btn.addEventListener('click', function(){
      if (touched){ touched = false; return; } // avoid double-fire after touchstart
      handleAction(btn);
    });
  }

  // Keyboard support (useful if a bluetooth keyboard is attached)
  const KEY_MAP = {
    '+':'add', '-':'subtract', '*':'multiply', '/':'divide',
    'Enter':'equals', '=':'equals', 'Escape':'clear', '%':'percent'
  };

  document.addEventListener('keydown', (e) => {
    let matchedButton = null;

    if (/^[0-9]$/.test(e.key)){
      matchedButton = document.querySelector(`button[data-value="${e.key}"]`);
    } else if (e.key === '.'){
      matchedButton = document.querySelector('button[data-action="decimal"]');
    } else if (KEY_MAP[e.key]){
      matchedButton = document.querySelector(`button[data-action="${KEY_MAP[e.key]}"]`);
    }

    if (matchedButton){
      e.preventDefault();
      handleAction(matchedButton);
    }
  });

  updateDisplay();
})();
