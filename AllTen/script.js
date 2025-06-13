const background = document.querySelector('.background');
const bubbles = [];
const bubbleCount = 60;

function randomRange(min, max) {
  return Math.random() * (max - min) + min;
}

for (let i = 0; i < bubbleCount; i++) {
  const bubble = document.createElement('div');
  bubble.className = 'circle';
  const size = randomRange(15, 50);
  bubble.style.width = `${size}px`;
  bubble.style.height = `${size}px`;
  bubble.style.left = `${randomRange(0, window.innerWidth)}px`;
  bubble.style.top = `${randomRange(0, window.innerHeight + 100)}px`;
  background.appendChild(bubble);
  bubbles.push({ el: bubble, size, x: bubble.offsetLeft, y: bubble.offsetTop, speed: randomRange(20, 60) });
}

let lastTimestamp = null;

function animate(time) {
  if (!lastTimestamp) lastTimestamp = time;
  const delta = (time - lastTimestamp) / 1000;
  lastTimestamp = time;

  for (const b of bubbles) {
    b.y -= b.speed * delta;
    if (b.y + b.size < 0) {
      b.y = window.innerHeight + randomRange(20, 100);
      b.x = randomRange(0, window.innerWidth);
      b.size = randomRange(15, 50);
      b.el.style.width = `${b.size}px`;
      b.el.style.height = `${b.size}px`;
    }
    b.el.style.top = `${b.y}px`;
    b.el.style.left = `${b.x}px`;
  }
  requestAnimationFrame(animate);
}
requestAnimationFrame(animate);

window.addEventListener('resize', () => {
  for (const b of bubbles) {
    b.x = randomRange(0, window.innerWidth);
    b.el.style.left = `${b.x}px`;
  }
});

async function typeWriter(element, text, speed = 20) {
  element.textContent = '';
  for (let i = 0; i < text.length; i++) {
    element.textContent += text[i];
    await new Promise(r => setTimeout(r, speed + Math.random() * speed * 1.5));
  }
}

async function compute() {
  const input = document.getElementById("digits").value;
  const digits = input.split(',').map(s => s.trim()).filter(Boolean).map(Number);
  if (digits.some(d => isNaN(d))) {
    alert("Please enter only valid numbers separated by commas.");
    return;
  }

  const targets = Array.from({ length: 10 }, (_, i) => i + 1);
  const ops = ['+', '-', '*', '/'];
  const resultsMap = Object.fromEntries(targets.map(t => [t, null]));
  const seen = new Set();

  function* permute(nums) {
    nums.sort((a, b) => a - b);
    const used = Array(nums.length).fill(false);
    const path = [];

    function* backtrack() {
      if (path.length === nums.length) {
        yield path.slice();
        return;
      }
      for (let i = 0; i < nums.length; i++) {
        if (used[i] || (i > 0 && nums[i] === nums[i - 1] && !used[i - 1])) continue;
        used[i] = true;
        path.push(nums[i]);
        yield* backtrack();
        path.pop();
        used[i] = false;
      }
    }
    yield* backtrack();
  }

  function getConcatenations(nums) {
    const res = [];
    const n = nums.length;
    const max = 1 << (n - 1);
    for (let mask = 0; mask < max; mask++) {
      let group = [];
      let current = '' + nums[0];
      for (let i = 1; i < n; i++) {
        if (mask & (1 << (i - 1))) {
          group.push(+current);
          current = '' + nums[i];
        } else {
          current += nums[i];
        }
      }
      group.push(+current);
      res.push(group);
    }
    res.sort((a, b) => a.length - b.length);
    return res;
  }

  function* opCombos(n) {
    if (n === 0) yield [];
    else {
      for (const op of ops) {
        for (const rest of opCombos(n - 1)) {
          yield [op, ...rest];
        }
      }
    }
  }

  function buildExpr(nums, opset) {
    const precedence = { '+': 1, '-': 1, '*': 2, '/': 2 };

    function helper(i, j) {
      if (i === j) return [{ expr: nums[i].toString(), op: null, opsCount: 0 }];
      const results = [];
      for (let k = i; k < j; k++) {
        const lefts = helper(i, k);
        const rights = helper(k + 1, j);
        const op = opset[k];
        for (const left of lefts) {
          for (const right of rights) {
            const l = (left.op && precedence[left.op] < precedence[op]) ? `(${left.expr})` : left.expr;
            const r = (right.op && precedence[right.op] <= precedence[op]) ? `(${right.expr})` : right.expr;
            results.push({ expr: `${l}${op}${r}`, op, opsCount: left.opsCount + right.opsCount + 1 });
          }
        }
      }
      return results;
    }
    return helper(0, nums.length - 1);
  }

  for (const perm of permute(digits)) {
    for (const group of getConcatenations(perm)) {
      for (const opSet of opCombos(group.length - 1)) {
        for (const { expr, opsCount } of buildExpr(group, opSet)) {
          if (seen.has(expr)) continue;
          seen.add(expr);
          let val;
          try {
            val = eval(expr);
          } catch {
            continue;
          }
          if (Math.abs(val - Math.round(val)) > 1e-9) continue;
          const intVal = Math.round(val);
          if (!targets.includes(intVal)) continue;
          const prev = resultsMap[intVal];
          if (!prev || expr.length < prev.length) {
            resultsMap[intVal] = expr;
          }
        }
      }
    }
  }

  const resultDiv = document.getElementById("results");
  resultDiv.innerHTML = '<h3>Results:</h3><div class="results-grid"></div>';
  const grid = resultDiv.querySelector('.results-grid');

  for (let i = 1; i <= 5; i++) {
    const leftExpr = resultsMap[i] ? resultsMap[i].replace(/\*/g, 'x').replace(/\//g, '÷') : 'No solution';
    const rightExpr = resultsMap[i + 5] ? resultsMap[i + 5].replace(/\*/g, 'x').replace(/\//g, '÷') : 'No solution';

    const row = document.createElement('div');
    row.className = 'row';

    const leftDiv = document.createElement('div');
    leftDiv.className = 'expr';
    row.appendChild(leftDiv);

    const rightDiv = document.createElement('div');
    rightDiv.className = 'expr';
    row.appendChild(rightDiv);

    grid.appendChild(row);

    const delay = i * 200;
    setTimeout(() => {
      leftDiv.classList.add('pop');
      rightDiv.classList.add('pop');
      typeWriter(leftDiv, `${i}: ${leftExpr}`);
      typeWriter(rightDiv, `${i + 5}: ${rightExpr}`);
    }, delay);
  }
}