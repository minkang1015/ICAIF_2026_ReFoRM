'use strict';

(() => {
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
  const MINUS = '−';

  /* ------------------------------------------------------------------
     Interactive example: September 2024 FOMC decision.
     A hand-built teaching example from public Federal Reserve sources,
     not a model-run trace.
     ------------------------------------------------------------------ */
  const SPEECH_2024 = 'https://www.federalreserve.gov/newsevents/speech/powell20240823a.htm';
  const FACTORS = {
    inflation: {
      name: 'Inflation trend',
      pastSign: '+', sign: '+', state: 'preserved',
      pastSignal: 'Moderating, still elevated',
      currentSignal: 'Progress toward 2% resumes',
      past: 'In September 2023, Powell described moderating inflation, but policy remained restrictive and inflation was still above the goal.',
      current: 'By 23 August 2024, Powell reported renewed progress on inflation and greater confidence in a sustainable return to 2%.',
      assessment: 'Preserved. Inflation progress still supports easing.',
      pastUrl: 'https://www.federalreserve.gov/mediacenter/files/FOMCpresconf20230920.pdf#page=2',
      pastLink: 'FOMC press conference, 20 Sep 2023',
      currentUrl: SPEECH_2024,
      currentLink: 'Powell speech, 23 Aug 2024'
    },
    labor: {
      name: 'Labor conditions',
      pastSign: MINUS, sign: '+', state: 'reversed',
      pastSignal: 'Tight, jobs remain strong',
      currentSignal: 'Cooling, July unemployment 4.3%',
      past: 'The 2023 press conference described a tight labor market. August unemployment was 3.8%, and labor demand still exceeded available workers.',
      current: 'Powell reported July unemployment of 4.3% and considerable cooling, and he emphasized protecting the labor market from further cooling.',
      assessment: 'Reversed. The labor signal now supports easing instead of restraining it.',
      pastUrl: 'https://www.federalreserve.gov/mediacenter/files/FOMCpresconf20230920.pdf#page=2',
      pastLink: 'FOMC press conference, 20 Sep 2023',
      currentUrl: SPEECH_2024,
      currentLink: 'Powell speech, 23 Aug 2024'
    },
    credit: {
      name: 'Credit conditions',
      pastSign: '+', sign: '?', state: 'unverified',
      pastSignal: 'Tighter credit conditions',
      currentSignal: 'Not addressed in the current source',
      past: 'The September 2023 statement expected tighter credit conditions to weigh on activity, hiring, and inflation, with an uncertain impact.',
      current: 'The selected August 2024 source does not establish whether credit conditions still support easing.',
      assessment: 'Unverified. The path stays visible but is excluded from current support.',
      pastUrl: 'https://www.federalreserve.gov/newsevents/pressreleases/monetary20230920a.htm',
      pastLink: 'FOMC statement, 20 Sep 2023',
      currentUrl: SPEECH_2024,
      currentLink: 'Powell speech, 23 Aug 2024'
    }
  };
  const FACTOR_KEYS = Object.keys(FACTORS);

  const STEPS = [
    {
      desc: 'The resolved September 2023 meeting provides three paths into the case for easing: inflation, labor, and credit conditions. The paths keep their factors and historical signs. The 2023 decision and its probabilities are removed before the structure is reused.',
      caseNote: 'Three historical paths',
      targetNote: 'New occurrence'
    },
    {
      desc: 'The three factors guide retrieval of sources published before the target meeting. In his 23 August 2024 speech, Powell reports renewed progress on inflation and a labor market that has cooled considerably. The selected source does not address the credit channel.',
      caseNote: 'Paths not yet tested',
      targetNote: 'New occurrence'
    },
    {
      desc: 'Each relation is tested against the 2024 evidence. Inflation progress still supports easing, so that relation is preserved. Labor now supports easing instead of restraining it, so its contribution is reversed. Credit support cannot be checked and is marked unverified.',
      caseNote: 'Two relations supported, one unverified',
      targetNote: 'New occurrence'
    },
    {
      desc: 'Only supported relations enter the forecast. The preserved inflation path and the reversed labor path both favor a cut, and the unverified credit path is set aside. The evidence does not settle the size of the cut, so the forecast keeps that uncertainty.',
      caseNote: 'Supported by inflation and labor',
      targetNote: 'Supported paths favor a cut. The size of the cut is unresolved.'
    }
  ];

  const graph = $('#graph');
  const svg = $('#graph-edges');
  let step = 0;
  let focus = 'inflation';
  let edges = null;
  let edgeHits = null;

  function relation(key, s) {
    const f = FACTORS[key];
    if (s === 0) return { state: 'historical', sign: f.pastSign, label: f.pastSign === '+' ? 'Supports easing' : 'Restrains easing' };
    if (s === 1) return { state: 'untested', sign: f.pastSign, label: 'To be tested' };
    if (s === 3 && f.state === 'unverified') return { state: 'excluded', sign: '?', label: 'Set aside' };
    const labels = { preserved: 'Preserved', reversed: 'Reversed, was ' + f.pastSign, unverified: 'Unverified', contradicted: 'Contradicted' };
    return { state: f.state, sign: f.sign, label: labels[f.state] };
  }

  function buildEdges() {
    if (!svg) return;
    const ns = 'http://www.w3.org/2000/svg';
    const states = ['historical', 'untested', 'preserved', 'reversed', 'contradicted', 'unverified', 'excluded', 'idle', 'active'];
    const defs = document.createElementNS(ns, 'defs');
    states.forEach(state => {
      const marker = document.createElementNS(ns, 'marker');
      marker.setAttribute('id', 'arrow-' + state);
      marker.setAttribute('viewBox', '0 0 10 10');
      marker.setAttribute('refX', '9');
      marker.setAttribute('refY', '5');
      marker.setAttribute('markerWidth', '7');
      marker.setAttribute('markerHeight', '7');
      marker.setAttribute('markerUnits', 'userSpaceOnUse');
      marker.setAttribute('orient', 'auto');
      const tip = document.createElementNS(ns, 'path');
      tip.setAttribute('d', 'M0 1 L9 5 L0 9 Z');
      tip.setAttribute('class', 'arrow-' + state);
      marker.appendChild(tip);
      defs.appendChild(marker);
    });
    svg.appendChild(defs);
    edges = {};
    edgeHits = {};
    FACTOR_KEYS.concat('out').forEach((key, i) => {
      const path = document.createElementNS(ns, 'path');
      path.setAttribute('class', 'edge');
      if (key !== 'out') path.dataset.factorEdge = key;
      path.style.setProperty('--i', key === 'out' ? 3 : i);
      svg.appendChild(path);
      edges[key] = path;
    });
    FACTOR_KEYS.forEach(key => {
      const hit = document.createElementNS(ns, 'path');
      hit.setAttribute('class', 'edge-hit');
      hit.dataset.factorEdge = key;
      hit.setAttribute('fill', 'none');
      hit.setAttribute('stroke', 'transparent');
      hit.setAttribute('stroke-width', '22');
      hit.setAttribute('pointer-events', 'stroke');
      svg.appendChild(hit);
      edgeHits[key] = hit;
    });
  }

  function drawEdges() {
    if (!edges || getComputedStyle(svg).display === 'none') return;
    const g = graph.getBoundingClientRect();
    if (!g.width) return;
    svg.setAttribute('viewBox', `0 0 ${g.width} ${g.height}`);
    const caseBox = $('#node-case').getBoundingClientRect();
    const targetBox = $('#node-target').getBoundingClientRect();
    const caseMid = caseBox.top + caseBox.height / 2 - g.top;
    const x2 = caseBox.left - g.left - 1;
    FACTOR_KEYS.forEach((key, i) => {
      const box = $(`[data-factor="${key}"]`).getBoundingClientRect();
      const x1 = box.right - g.left;
      const y1 = box.top + box.height / 2 - g.top;
      const y2 = caseMid + (i - 1) * 12;
      const dx = (x2 - x1) * 0.55;
      const state = relation(key, step).state;
      edges[key].setAttribute('d', `M${x1.toFixed(1)} ${y1.toFixed(1)} C${(x1 + dx).toFixed(1)} ${y1.toFixed(1)} ${(x2 - dx).toFixed(1)} ${y2.toFixed(1)} ${x2.toFixed(1)} ${y2.toFixed(1)}`);
      edgeHits[key].setAttribute('d', edges[key].getAttribute('d'));
      edges[key].classList.toggle('is-focused', focus === key);
      edges[key].dataset.state = state;
      edges[key].setAttribute('marker-end', `url(#arrow-${state})`);
    });
    const outState = step === 3 ? 'active' : 'idle';
    const ox1 = caseBox.right - g.left;
    const ox2 = targetBox.left - g.left - 1;
    edges.out.setAttribute('d', `M${ox1.toFixed(1)} ${caseMid.toFixed(1)} H${ox2.toFixed(1)}`);
    edges.out.dataset.state = outState;
    edges.out.setAttribute('marker-end', `url(#arrow-${outState})`);
  }

  function renderExample() {
    if (!graph) return;
    graph.dataset.step = String(step);
    graph.dataset.focus = focus;
    FACTOR_KEYS.forEach(key => {
      const f = FACTORS[key];
      const r = relation(key, step);
      const button = $(`[data-factor="${key}"]`);
      button.dataset.state = r.state;
      button.setAttribute('aria-pressed', String(focus === key));
      button.setAttribute('aria-label', `${f.name}. ${step === 0 ? f.pastSignal : f.currentSignal}. ${r.label}.`);
      $(`[data-signal="${key}"]`).textContent = step === 0 ? f.pastSignal : f.currentSignal;
      const chip = $(`[data-relation="${key}"]`);
      chip.dataset.state = r.state;
      $('.relation-sign', chip).textContent = r.sign;
      $('.relation-label', chip).textContent = r.label;
    });
    $('#case-note').textContent = STEPS[step].caseNote;
    $('#target-note').textContent = STEPS[step].targetNote;
    $('#node-case').toggleAttribute('data-active', step === 3);
    $('#node-target').toggleAttribute('data-active', step === 3);
    $('#step-desc').textContent = STEPS[step].desc;
    $$('button[data-step]').forEach(button => {
      const i = Number(button.dataset.step);
      button.setAttribute('aria-pressed', String(i === step));
      button.toggleAttribute('data-done', i < step);
    });
    $('#step-prev').disabled = step === 0;
    $('#step-next').textContent = step === 3 ? 'Start again' : 'Next step';

    const f = FACTORS[focus];
    $('#evidence-title').textContent = f.name;
    const before = $('#relation-before');
    const after = $('#relation-after');
    const change = $('#relation-change');
    if (before) before.textContent = `${f.pastSign} ${f.pastSign === '+' ? 'Supports easing' : 'Restrains easing'}`;
    if (after) {
      after.textContent = step < 2 ? 'Not yet tested' : f.state === 'unverified' ? 'No active support' : `${f.sign} ${f.sign === '+' ? 'Supports easing' : 'Restrains easing'}`;
      after.dataset.state = step < 2 ? 'untested' : f.state;
    }
    if (change) {
      change.textContent = step < 2 ? 'Awaiting assessment' : f.state === 'unverified' ? 'Unverified · excluded from active support' : f.state === 'reversed' ? 'Reversed contribution' : 'Preserved contribution';
      change.dataset.state = step < 2 ? 'untested' : f.state;
    }
    const assessment = $('#evidence-assessment');
    if (step < 2) {
      assessment.dataset.state = 'historical';
      assessment.textContent = `In 2023 this factor ${f.pastSign === '+' ? 'supported' : 'restrained'} easing. It is assessed in step 3.`;
    } else {
      assessment.dataset.state = f.state;
      assessment.textContent = f.assessment;
    }
    $('#evidence-past').textContent = f.past;
    $('#evidence-current').textContent = f.current;
    const pastSource = $('#evidence-past-source');
    pastSource.href = f.pastUrl;
    pastSource.textContent = f.pastLink;
    const currentSource = $('#evidence-current-source');
    currentSource.href = f.currentUrl;
    currentSource.textContent = f.currentLink;

    drawEdges();
  }

  function setStep(next) {
    step = Math.max(0, Math.min(STEPS.length - 1, next));
    renderExample();
  }

  if (graph) {
    buildEdges();
    $$('button[data-step]').forEach(button => button.addEventListener('click', () => setStep(Number(button.dataset.step))));
    $('#step-prev').addEventListener('click', () => setStep(step - 1));
    $('#step-next').addEventListener('click', () => setStep(step === 3 ? 0 : step + 1));
    const selectFactor = key => {
      if (!FACTORS[key] || focus === key) return;
      focus = key;
      renderExample();
    };
    graph.addEventListener('pointermove', event => {
      if (event.pointerType !== 'mouse' && event.pointerType !== 'pen') return;
      const target = event.target.closest('[data-factor], [data-factor-edge]');
      if (target && graph.contains(target)) selectFactor(target.dataset.factor || target.dataset.factorEdge);
    });
    graph.addEventListener('click', event => {
      const target = event.target.closest('[data-factor-edge]');
      if (target) selectFactor(target.dataset.factorEdge);
    });
    $$('[data-factor]').forEach(button => {
      button.addEventListener('click', () => selectFactor(button.dataset.factor));
      button.addEventListener('focus', () => selectFactor(button.dataset.factor));
    });
    if ('ResizeObserver' in window) new ResizeObserver(drawEdges).observe(graph);
    window.addEventListener('resize', drawEdges, { passive: true });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(drawEdges);
    renderExample();
  }

  /* ------------------------------------------------------------------
     Results. Table 3 of the paper: per method,
     [accuracy, sd, Brier, sd, NLL, sd], means over three runs.
     ------------------------------------------------------------------ */
  const METHODS = ['Direct Forecast', 'Structured Reasoning', 'Factor Memory', 'Principle Memory', 'Case Memory', 'Structure Memory', 'ReFoRM'];
  const RESULTS = {
    average:  [[.497,.012,.231,.004,.991,.021],[.440,.006,.250,.001,1.046,.005],[.509,.008,.232,.003,.995,.011],[.486,.018,.237,.005,1.011,.020],[.490,.012,.241,.002,1.037,.012],[.492,.008,.236,.001,1.012,.007],[.550,.003,.217,.002,.922,.009]],
    gemini:   [[.523,.021,.235,.008,1.040,.034],[.387,.031,.285,.015,1.210,.055],[.523,.012,.235,.005,1.001,.018],[.460,.035,.260,.015,1.116,.067],[.453,.042,.262,.008,1.160,.049],[.483,.012,.250,.005,1.094,.003],[.530,.000,.212,.000,.914,.000]],
    gpt:      [[.490,.010,.229,.008,.976,.040],[.477,.051,.237,.013,1.006,.043],[.520,.036,.227,.010,.969,.033],[.513,.021,.226,.006,.956,.016],[.520,.020,.229,.008,.981,.027],[.493,.023,.228,.006,.966,.015],[.513,.015,.217,.008,.928,.030]],
    deepseek: [[.517,.025,.229,.009,.981,.041],[.463,.035,.238,.007,.999,.022],[.520,.026,.226,.002,.987,.011],[.520,.026,.225,.008,.962,.022],[.520,.020,.233,.011,.993,.026],[.500,.000,.227,.003,.969,.024],[.583,.025,.213,.006,.886,.019]],
    llama:    [[.433,.025,.238,.006,.976,.028],[.433,.012,.246,.005,.996,.010],[.453,.023,.239,.013,1.000,.041],[.427,.040,.241,.006,.994,.013],[.440,.026,.242,.008,1.002,.023],[.450,.026,.245,.008,1.004,.021],[.527,.025,.227,.003,.946,.014]],
    qwen:     [[.523,.021,.228,.005,.984,.035],[.440,.000,.244,.003,1.019,.013],[.530,.017,.233,.008,1.017,.054],[.507,.015,.234,.006,1.024,.059],[.517,.032,.237,.005,1.050,.029],[.533,.040,.232,.004,1.025,.027],[.597,.015,.217,.006,.936,.036]]
  };
  const MODELS = [
    { key: 'average', label: 'Five-model average' },
    { key: 'gemini', label: 'Gemini 2.5 Flash Lite' },
    { key: 'gpt', label: 'GPT-5 mini' },
    { key: 'deepseek', label: 'DeepSeek V3.2' },
    { key: 'llama', label: 'Llama 4 Maverick' },
    { key: 'qwen', label: 'Qwen Plus' }
  ];
  const METRICS = {
    accuracy: { index: 0, label: 'Accuracy', higher: true, scale: 1, help: 'Share of targets assigned the correct answer. Higher is better.' },
    brier: { index: 2, label: 'Brier score', higher: false, scale: .30, help: 'Measures the gap between forecast probabilities and outcomes. Lower is better.' },
    nll: { index: 4, label: 'Log loss (NLL)', higher: false, scale: 1.25, help: 'Penalizes low probabilities assigned to the outcome that occurs. Lower is better.' }
  };
  let selectedModel = 'average';
  let selectedMetric = 'accuracy';
  let comparison = 0;
  const formatResult = (value, key) => key === 'accuracy' ? `${(value * 100).toFixed(1)}%` : value.toFixed(3);

  function renderResultCards(rows) {
    Object.entries(METRICS).forEach(([key, metric]) => {
      const card = $(`[data-result-card="${key}"]`);
      if (!card) return;
      const baseline = rows[comparison][metric.index];
      const ours = rows[6][metric.index];
      const difference = metric.higher ? ours - baseline : baseline - ours;
      const state = Math.abs(difference) < 1e-9 ? 'equal' : difference > 0 ? 'better' : 'worse';
      $('[data-comparison-name]', card).textContent = METHODS[comparison];
      $('[data-comparison-value]', card).textContent = formatResult(baseline, key);
      $('[data-reform-value]', card).textContent = formatResult(ours, key);
      $('[data-baseline-bar]', card).style.width = `${baseline / metric.scale * 100}%`;
      $('[data-reform-bar]', card).style.width = `${ours / metric.scale * 100}%`;
      card.dataset.state = state;
      card.classList.toggle('is-selected', key === selectedMetric);
      const gain = $('.result-gain', card);
      gain.dataset.state = state;
      if (key === 'accuracy') {
        const sign = state === 'equal' ? '' : ours > baseline ? '+' : '−';
        gain.textContent = `${sign}${(Math.abs(ours - baseline) * 100).toFixed(1)} percentage points`;
      } else if (state === 'equal') {
        gain.textContent = `Same ${key === 'brier' ? 'Brier score' : 'log loss'}`;
      } else {
        const percentage = Math.abs((baseline - ours) / baseline * 100).toFixed(1);
        gain.textContent = `${percentage}% ${state === 'better' ? 'lower' : 'higher'} ${key === 'brier' ? 'error' : 'log loss'}`;
      }
    });
  }

  function chartCeiling(value) {
    const power = Math.pow(10, Math.floor(Math.log10(value)));
    return [1, 1.25, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10].find(unit => unit * power >= value - 1e-9) * power;
  }

  function renderMethodChart(rows, modelLabel) {
    const chart = $('#method-chart');
    if (!chart) return;
    const metric = METRICS[selectedMetric];
    const direction = metric.higher ? 'Higher is better.' : 'Lower is better.';
    const maximum = metric.higher ? 1 : chartCeiling(Math.max(...rows.map(row => row[metric.index])));
    const order = [6, comparison, ...METHODS.map((_, index) => index).filter(index => index !== 6 && index !== comparison)];
    chart.setAttribute('role', 'list');
    chart.setAttribute('aria-label', `${metric.label}, ${modelLabel}, 100 forecast targets, means over three runs. ${direction} Comparison baseline: ${METHODS[comparison]}.`);
    chart.innerHTML = order.map(index => {
      const value = rows[index][metric.index];
      const cls = index === 6 ? ' is-ours' : index === comparison ? ' is-comparison' : '';
      return `<div class="method-bar-row${cls}" role="listitem"><span class="method-bar-label">${METHODS[index]}</span><div class="method-bar-track" aria-hidden="true"><span class="method-bar-fill" style="width:${value / maximum * 100}%"></span></div><strong class="method-bar-value">${formatResult(value, selectedMetric)}</strong></div>`;
    }).join('') + `<div class="method-chart-axis" aria-hidden="true"><span>0</span><span>${selectedMetric === 'accuracy' ? '100%' : maximum.toFixed(2)}</span></div>`;
    $('#method-chart-title').textContent = `${metric.label} · ${modelLabel}`;
    $('#metric-help').textContent = metric.help;
    $('#method-chart-caption').textContent = `${modelLabel} · Means over three runs. All bars start at zero. ReFoRM and the selected baseline are highlighted.`;
  }

  function renderResultsTable(rows, modelLabel) {
    const body = $('#results-table tbody');
    if (!body) return;
    const metrics = Object.entries(METRICS);
    const marks = metrics.map(([key, metric]) => {
      const unique = [...new Set(rows.map(row => row[metric.index]))].sort((a, b) => metric.higher ? b - a : a - b);
      return { key, ...metric, best: unique[0], second: unique[1] };
    });
    const cell = (row, mark) => {
      const value = row[mark.index];
      let text = formatResult(value, mark.key);
      if (value === mark.best) text = `<b>${text}</b>`;
      else if (value === mark.second) text = `<u>${text}</u>`;
      const sd = mark.key === 'accuracy' ? `${(row[mark.index + 1] * 100).toFixed(1)} pp` : row[mark.index + 1].toFixed(3);
      return `<td${mark.key === selectedMetric ? ' class="is-selected-metric"' : ''}>${text}<span class="sd">±${sd}</span></td>`;
    };
    body.innerHTML = rows.map((row, index) => {
      const group = index === 0 ? '<tr class="group-row"><th scope="rowgroup" colspan="4">No-memory baselines</th></tr>' : index === 2 ? '<tr class="group-row"><th scope="rowgroup" colspan="4">Resolved-event memory</th></tr>' : '';
      const cls = index === 6 ? 'is-ours' : index === comparison ? 'is-comparison' : '';
      return `${group}<tr${cls ? ` class="${cls}"` : ''}><th scope="row">${METHODS[index]}</th>${marks.map(mark => cell(row, mark)).join('')}</tr>`;
    }).join('');
    $$('#results-table thead th').forEach((th, index) => th.classList.toggle('is-selected-metric', index === marks.findIndex(mark => mark.key === selectedMetric) + 1));
    $('#results-table-caption').textContent = `${modelLabel} · 100 forecast targets · Mean ± standard deviation over three runs. Accuracy is a percentage; its standard deviation is in percentage points (pp). Best and second-best per metric are in bold and underlined.`;
  }

  function renderResults() {
    const rows = RESULTS[selectedModel];
    const modelLabel = MODELS.find(model => model.key === selectedModel).label;
    $$('button[data-model]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.model === selectedModel)));
    $$('button[data-metric]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.metric === selectedMetric)));
    const selector = $('#comparison-method');
    if (selector) selector.value = String(comparison);
    $('#result-scope').textContent = `${modelLabel} · 100 forecast targets · Means over three runs`;
    const definition = $$('.baselines div').find(item => $('dt', item).textContent.trim() === METHODS[comparison]);
    const context = $('#comparison-context');
    if (context) context.textContent = definition ? `${METHODS[comparison]}: ${$('dd', definition).textContent.trim()}` : `Comparing ReFoRM with ${METHODS[comparison]}.`;
    renderResultCards(rows);
    renderMethodChart(rows, modelLabel);
    renderResultsTable(rows, modelLabel);
  }

  if ($('#method-chart')) {
    $$('button[data-model]').forEach(button => button.addEventListener('click', () => {
      selectedModel = button.dataset.model;
      renderResults();
    }));
    $$('button[data-metric]').forEach(button => button.addEventListener('click', () => {
      selectedMetric = button.dataset.metric;
      renderResults();
    }));
    $('#comparison-method').addEventListener('change', event => {
      const next = Number(event.target.value);
      if (Number.isInteger(next) && next >= 0 && next < 6) {
        comparison = next;
        renderResults();
      }
    });
    renderResults();
  }

  /* ------------------------------------------------------------------
     Case study tabs
     ------------------------------------------------------------------ */
  const caseTabs = $$('.case-tabs [role="tab"]');
  function selectCase(index, moveFocus) {
    caseTabs.forEach((tab, i) => {
      const selected = i === index;
      tab.setAttribute('aria-selected', String(selected));
      tab.tabIndex = selected ? 0 : -1;
      document.getElementById(tab.getAttribute('aria-controls')).hidden = !selected;
    });
    if (moveFocus) caseTabs[index].focus();
  }
  caseTabs.forEach((tab, i) => {
    tab.addEventListener('click', () => selectCase(i, false));
    tab.addEventListener('keydown', event => {
      let next = null;
      if (event.key === 'ArrowRight') next = (i + 1) % caseTabs.length;
      if (event.key === 'ArrowLeft') next = (i - 1 + caseTabs.length) % caseTabs.length;
      if (event.key === 'Home') next = 0;
      if (event.key === 'End') next = caseTabs.length - 1;
      if (next !== null) { event.preventDefault(); selectCase(next, true); }
    });
  });

  /* ------------------------------------------------------------------
     Copy BibTeX
     ------------------------------------------------------------------ */
  const copyButton = $('#copy-bibtex');
  if (copyButton) {
    copyButton.addEventListener('click', async () => {
      const pre = $('#bibtex');
      const status = $('#copy-status');
      try {
        await navigator.clipboard.writeText(pre.textContent);
        copyButton.textContent = 'Copied';
        status.textContent = 'BibTeX copied to the clipboard.';
        setTimeout(() => { copyButton.textContent = 'Copy BibTeX'; }, 2000);
      } catch (error) {
        const range = document.createRange();
        range.selectNodeContents(pre);
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
        status.textContent = 'The citation is selected. Press Ctrl+C or Cmd+C to copy it.';
      }
    });
  }

  /* ------------------------------------------------------------------
     Header state and section highlighting
     ------------------------------------------------------------------ */
  const header = $('.site-header');
  const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 4);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  const navLinks = $$('.site-nav a');
  if ('IntersectionObserver' in window && navLinks.length) {
    const byId = new Map(navLinks.map(a => [a.getAttribute('href').slice(1), a]));
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        navLinks.forEach(a => a.classList.remove('is-active'));
        const link = byId.get(entry.target.id);
        if (link) link.classList.add('is-active');
      });
    }, { rootMargin: '-35% 0px -60% 0px' });
    byId.forEach((link, id) => { const section = document.getElementById(id); if (section) observer.observe(section); });
  }
})();
