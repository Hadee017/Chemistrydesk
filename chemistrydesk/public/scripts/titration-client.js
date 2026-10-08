// public/scripts/titration-client.js

(async function () {
  const KW = 1.0e-14;
  let userScatterPoints = [];

  // Fetch presets and indicators from JSON endpoints or default array
  const PRESETS = [
    {
      id: "ch3cooh-naoh",
      name: "Acetic Acid vs. Sodium Hydroxide",
      systemType: "weak_acid_strong_base",
      analyteName: "Acetic Acid (CH₃COOH)",
      analyteFormula: "CH3COOH",
      defaultAnalyteConc: 0.1,
      defaultAnalyteVol: 25.0,
      defaultTitrantConc: 0.1,
      titrantName: "Sodium Hydroxide (NaOH)",
      pKa: 4.76,
      recommendedIndicator: "Phenolphthalein",
      ghsAlert: "Corrosive / Irritant: Wear safety goggles. Acetic acid vapors cause respiratory irritation."
    },
    {
      id: "hcl-naoh",
      name: "Hydrochloric Acid vs. Sodium Hydroxide",
      systemType: "strong_acid_strong_base",
      analyteName: "Hydrochloric Acid (HCl)",
      analyteFormula: "HCl",
      defaultAnalyteConc: 0.1,
      defaultAnalyteVol: 25.0,
      defaultTitrantConc: 0.1,
      titrantName: "Sodium Hydroxide (NaOH)",
      recommendedIndicator: "Bromothymol Blue",
      ghsAlert: "Corrosive: Concentrated HCl produces acidic fumes. NaOH causes severe chemical eye and skin burns."
    },
    {
      id: "nh3-hcl",
      name: "Ammonia vs. Hydrochloric Acid",
      systemType: "weak_base_strong_acid",
      analyteName: "Ammonia Aqueous (NH₃)",
      analyteFormula: "NH3",
      defaultAnalyteConc: 0.1,
      defaultAnalyteVol: 25.0,
      defaultTitrantConc: 0.1,
      titrantName: "Hydrochloric Acid (HCl)",
      pKb: 4.75,
      recommendedIndicator: "Methyl Orange",
      ghsAlert: "Toxic / Corrosive: Prepare ammonia stock solutions inside a certified chemical fume hood."
    },
    {
      id: "formic-naoh",
      name: "Formic Acid vs. Sodium Hydroxide",
      systemType: "weak_acid_strong_base",
      analyteName: "Formic Acid (HCOOH)",
      analyteFormula: "HCOOH",
      defaultAnalyteConc: 0.1,
      defaultAnalyteVol: 25.0,
      defaultTitrantConc: 0.1,
      titrantName: "Sodium Hydroxide (NaOH)",
      pKa: 3.75,
      recommendedIndicator: "Phenolphthalein",
      ghsAlert: "Corrosive / Flammable: Causes severe skin burns and eye damage."
    }
  ];

  const INDICATORS = [
    { name: 'Phenolphthalein', pHRange: [8.2, 10.0], colorChange: 'Colorless to Vivid Pink' },
    { name: 'Bromothymol Blue', pHRange: [6.0, 7.6], colorChange: 'Yellow to Blue' },
    { name: 'Methyl Orange', pHRange: [3.1, 4.4], colorChange: 'Red to Orange-Yellow' },
    { name: 'Methyl Red', pHRange: [4.4, 6.2], colorChange: 'Red to Yellow' }
  ];

  function parseSafe(val, fallback) {
    if (typeof val === 'number') return isNaN(val) ? fallback : val;
    if (!val) return fallback;
    const clean = val.toString().trim().replace(',', '.');
    const num = parseFloat(clean);
    return isNaN(num) ? fallback : num;
  }

  function runSimulation(systemType, Ca, Va_mL, Cb, pK) {
    const Va_L = Va_mL / 1000.0;
    const molesAnalyte = Ca * Va_L;
    const Veq_mL = (molesAnalyte / Cb) * 1000.0;
    const maxV_mL = Veq_mL * 2.0;
    const steps = 160;
    const dV = maxV_mL / steps;

    const points = [];

    function solvePH(V_mL) {
      const V_L = V_mL / 1000.0;
      const totalVol_L = Va_L + V_L;
      const molesTitrant = Cb * V_L;

      if (systemType === 'strong_acid_strong_base') {
        if (V_mL < Veq_mL - 1e-5) {
          const h = (molesAnalyte - molesTitrant) / totalVol_L;
          return -Math.log10(Math.max(1e-14, h));
        } else if (Math.abs(V_mL - Veq_mL) <= 1e-5) {
          return 7.00;
        } else {
          const oh = (molesTitrant - molesAnalyte) / totalVol_L;
          return 14.0 + Math.log10(Math.max(1e-14, oh));
        }
      }

      if (systemType === 'weak_acid_strong_base') {
        const Ka = Math.pow(10, -pK);
        if (V_mL <= 0.001) {
          return -Math.log10(Math.max(1e-14, Math.sqrt(Ka * Ca)));
        } else if (V_mL < Veq_mL - 1e-5) {
          const ratio = Math.max(1e-6, molesTitrant / (molesAnalyte - molesTitrant));
          return Math.max(0, Math.min(14, pK + Math.log10(ratio)));
        } else if (Math.abs(V_mL - Veq_mL) <= 1e-5) {
          const cA = molesAnalyte / totalVol_L;
          const oh = Math.sqrt((KW / Ka) * cA);
          return 14.0 + Math.log10(Math.max(1e-14, oh));
        } else {
          const oh = (molesTitrant - molesAnalyte) / totalVol_L;
          return 14.0 + Math.log10(Math.max(1e-14, oh));
        }
      }

      if (systemType === 'weak_base_strong_acid') {
        const Kb = Math.pow(10, -pK);
        const pKa = 14.0 - pK;
        if (V_mL <= 0.001) {
          const oh = Math.sqrt(Kb * Ca);
          return 14.0 + Math.log10(Math.max(1e-14, oh));
        } else if (V_mL < Veq_mL - 1e-5) {
          const ratio = Math.max(1e-6, (molesAnalyte - molesTitrant) / molesTitrant);
          return Math.max(0, Math.min(14, pKa + Math.log10(ratio)));
        } else if (Math.abs(V_mL - Veq_mL) <= 1e-5) {
          const cBH = molesAnalyte / totalVol_L;
          const h = Math.sqrt((KW / Kb) * cBH);
          return -Math.log10(Math.max(1e-14, h));
        } else {
          const h = (molesTitrant - molesAnalyte) / totalVol_L;
          return -Math.log10(Math.max(1e-14, h));
        }
      }

      return 7.00;
    }

    for (let i = 0; i <= steps; i++) {
      const v = i * dV;
      points.push({ volumeAdded: Number(v.toFixed(3)), pH: solvePH(v), derivative: 0 });
    }

    let maxDerivVal = -1;
    let maxDerivVol = Veq_mL;

    for (let i = 1; i < points.length - 1; i++) {
      const deltaV = points[i + 1].volumeAdded - points[i - 1].volumeAdded;
      const deltaPH = Math.abs(points[i + 1].pH - points[i - 1].pH);
      const deriv = deltaV > 0 ? deltaPH / deltaV : 0;
      points[i].derivative = Number(deriv.toFixed(3));
      if (deriv > maxDerivVal) {
        maxDerivVal = deriv;
        maxDerivVol = points[i].volumeAdded;
      }
    }

    if (points.length > 1) {
      points[0].derivative = points[1].derivative;
      points[points.length - 1].derivative = points[points.length - 2].derivative;
    }

    const eqPH = solvePH(Veq_mL);
    const halfV = Veq_mL / 2;
    const halfPH = solvePH(halfV);

    return {
      Veq: Number(Veq_mL.toFixed(2)),
      eqPH: Number(eqPH.toFixed(2)),
      halfV: Number(halfV.toFixed(2)),
      halfPH: Number(halfPH.toFixed(2)),
      points,
      maxDerivVal: Number(maxDerivVal.toFixed(2)),
      maxDerivVol: Number(maxDerivVol.toFixed(2)),
      maxV: maxV_mL
    };
  }

  // DOM Handles
  const selPreset = document.getElementById('select-preset');
  const selSystem = document.getElementById('select-system-type');
  const inAnalyteName = document.getElementById('input-analyte-name');
  const inTitrantName = document.getElementById('input-titrant-name');
  const inCa = document.getElementById('input-ca');
  const inVa = document.getElementById('input-va');
  const inCb = document.getElementById('input-cb');
  const inPk = document.getElementById('input-pk');
  const wrapPk = document.getElementById('wrap-pk');
  const labelPk = document.getElementById('label-pk');
  const selIndicator = document.getElementById('select-indicator');
  const tagIndicatorRange = document.getElementById('indicator-range-tag');
  const msgIndicatorStatus = document.getElementById('indicator-status-msg');

  const flaskDot = document.getElementById('flask-preview-dot');
  const flaskDesc = document.getElementById('flask-color-desc');

  const outVeq = document.getElementById('metric-veq');
  const outEqPH = document.getElementById('metric-eqph');
  const outHalfV = document.getElementById('metric-halfv');
  const outHalfPH = document.getElementById('metric-halfph');
  const outMaxDeriv = document.getElementById('metric-max-deriv');
  const outBufferNote = document.getElementById('metric-buffer-range-note');
  const svgContainer = document.getElementById('svg-chart-container');

  const ghsAlertText = document.getElementById('ghs-alert-text');
  const tabSop = document.getElementById('tab-btn-sop');
  const tabLatex = document.getElementById('tab-btn-latex');
  const tabBibtex = document.getElementById('tab-btn-bibtex');
  const exportDisplay = document.getElementById('export-text-display');

  let currentTab = 'sop';
  let cachedOutputs = {};

  function getIndicatorColor(indicatorName, currentPH) {
    const name = indicatorName.toLowerCase();
    if (name.indexOf('phenolphthalein') !== -1) {
      if (currentPH < 8.2) return { bg: '#334155', border: '#64748b', text: 'Colorless (Acidic/Neutral)', color: '#94a3b8' };
      if (currentPH >= 8.2 && currentPH <= 10.0) return { bg: '#f472b6', border: '#ec4899', text: 'Pink Transition Endpoint', color: '#831843' };
      return { bg: '#db2777', border: '#be185d', text: 'Deep Magenta (Excess Base)', color: '#ffffff' };
    }
    if (name.indexOf('bromothymol') !== -1) {
      if (currentPH < 6.0) return { bg: '#eab308', border: '#ca8a04', text: 'Yellow (Acidic)', color: '#713f12' };
      if (currentPH >= 6.0 && currentPH <= 7.6) return { bg: '#22c55e', border: '#16a34a', text: 'Green Transition (Neutral)', color: '#14532d' };
      return { bg: '#3b82f6', border: '#2563eb', text: 'Deep Blue (Alkaline)', color: '#ffffff' };
    }
    if (name.indexOf('methyl orange') !== -1) {
      if (currentPH < 3.1) return { bg: '#ef4444', border: '#dc2626', text: 'Red (Acidic)', color: '#ffffff' };
      if (currentPH >= 3.1 && currentPH <= 4.4) return { bg: '#f97316', border: '#ea580c', text: 'Orange Transition', color: '#ffffff' };
      return { bg: '#eab308', border: '#ca8a04', text: 'Yellow (Neutral/Alkaline)', color: '#713f12' };
    }
    if (name.indexOf('methyl red') !== -1) {
      if (currentPH < 4.4) return { bg: '#ef4444', border: '#dc2626', text: 'Red (Acidic)', color: '#ffffff' };
      if (currentPH >= 4.4 && currentPH <= 6.2) return { bg: '#f97316', border: '#ea580c', text: 'Orange Transition', color: '#ffffff' };
      return { bg: '#eab308', border: '#ca8a04', text: 'Yellow (Alkaline)', color: '#713f12' };
    }
    return { bg: '#334155', border: '#64748b', text: 'Standard Solution', color: '#94a3b8' };
  }

  function updateView() {
    if (!selSystem) return;
    const sys = selSystem.value;
    const Ca = Math.max(1e-5, parseSafe(inCa.value, 0.1));
    const Va = Math.max(0.1, parseSafe(inVa.value, 25));
    const Cb = Math.max(1e-5, parseSafe(inCb.value, 0.1));
    const pK = parseSafe(inPk.value, 4.76);
    const analyteName = inAnalyteName.value.trim() || 'Analyte';
    const titrantName = inTitrantName.value.trim() || 'Titrant';
    const indName = selIndicator.value;

    if (sys === 'strong_acid_strong_base') {
      wrapPk.classList.add('opacity-40', 'pointer-events-none');
      labelPk.textContent = 'Dissociation (N/A)';
    } else if (sys === 'weak_base_strong_acid') {
      wrapPk.classList.remove('opacity-40', 'pointer-events-none');
      labelPk.textContent = 'Dissociation (pKb)';
    } else {
      wrapPk.classList.remove('opacity-40', 'pointer-events-none');
      labelPk.textContent = 'Dissociation (pKa)';
    }

    const indObj = INDICATORS.find(i => i.name === indName) || INDICATORS[0];
    tagIndicatorRange.textContent = 'pH ' + indObj.pHRange[0] + ' - ' + indObj.pHRange[1];

    const res = runSimulation(sys, Ca, Va, Cb, pK);

    const isIndSuitable = res.eqPH >= (indObj.pHRange[0] - 0.5) && res.eqPH <= (indObj.pHRange[1] + 0.5);
    msgIndicatorStatus.textContent = isIndSuitable
      ? 'Indicator transition (' + indObj.pHRange[0] + ' to ' + indObj.pHRange[1] + ') brackets the inflection pH (' + res.eqPH + ').'
      : 'Caution: Transition range (' + indObj.pHRange[0] + ' to ' + indObj.pHRange[1] + ') departs from inflection pH (' + res.eqPH + ').';
    msgIndicatorStatus.className = isIndSuitable ? 'text-[11px] text-emerald-400 leading-relaxed pt-1' : 'text-[11px] text-amber-400 leading-relaxed pt-1';

    const colState = getIndicatorColor(indName, res.eqPH);
    flaskDot.style.backgroundColor = colState.bg;
    flaskDot.style.borderColor = colState.border;
    flaskDot.style.color = colState.color;
    flaskDesc.textContent = colState.text + ' (pH ' + res.eqPH + ')';

    outVeq.textContent = res.Veq.toFixed(2);
    outEqPH.textContent = res.eqPH.toFixed(2);
    outHalfV.textContent = res.halfV.toFixed(2);
    outHalfPH.textContent = res.halfPH.toFixed(2);
    outMaxDeriv.textContent = res.maxDerivVal.toFixed(2);

    if (sys === 'strong_acid_strong_base') {
      outBufferNote.textContent = 'No buffer plateau (Strong Electrolyte)';
    } else if (sys === 'weak_acid_strong_base') {
      outBufferNote.textContent = 'Buffer Zone: [' + (pK - 1).toFixed(2) + ' - ' + (pK + 1).toFixed(2) + ']';
    } else {
      const effPka = 14.0 - pK;
      outBufferNote.textContent = 'Buffer Zone: [' + (effPka - 1).toFixed(2) + ' - ' + (effPka + 1).toFixed(2) + ']';
    }

    renderSVG(res, indObj, sys, pK);

    const latex = '% Titration Run: ' + analyteName + ' vs ' + titrantName + '\n' +
      '\\begin{align}\n' +
      '  V_{\\text{eq}} &= \\frac{' + Ca.toFixed(4) + ' \\times ' + Va.toFixed(2) + '}{' + Cb.toFixed(4) + '} = ' + res.Veq.toFixed(2) + '\\text{ mL} \\\\[6pt]\n' +
      '  \\text{pH}_{\\text{eq}} &= ' + res.eqPH.toFixed(2) + ', \\quad \\text{pH}_{\\text{half}} = ' + res.halfPH.toFixed(2) + '\n' +
      '\\end{align}';

    const sop = 'Benchtop Protocol: Pipette ' + Va.toFixed(2) + ' mL of ' + analyteName + ' (' + Ca.toFixed(4) + ' M) into an Erlenmeyer flask. Add ' + indObj.name + ' indicator. Titrate with ' + titrantName + ' (' + Cb.toFixed(4) + ' M) to inflection endpoint at ' + res.Veq.toFixed(2) + ' mL (pH: ' + res.eqPH.toFixed(2) + ').';

    const bibtex = '@software{ChemistryCal_Titration_2026,\n' +
      '  author = {Khan, Bilal},\n' +
      '  title = {Acid-Base Dynamic Inflection & Derivative Engine},\n' +
      '  year = {2026},\n' +
      '  url = {https://chemistrycal.com/titration}\n' +
      '}';

    cachedOutputs = { sop, latex, bibtex, points: res.points, Veq: res.Veq };
    renderTab();
  }

  function renderSVG(res, indObj, sys, pK) {
    const width = 640;
    const height = 380;
    const pad = { top: 30, right: 30, bottom: 50, left: 55 };
    const cW = width - pad.left - pad.right;
    const cH = height - pad.top - pad.bottom;

    const scaleX = v => pad.left + (v / res.maxV) * cW;
    const scaleY = ph => pad.top + cH - (ph / 14) * cH;
    const maxD = Math.max(1, ...res.points.map(p => p.derivative));
    const scaleYD = d => pad.top + cH - (d / maxD) * cH;

    let pathPH = '';
    let pathDeriv = '';

    res.points.forEach((p, idx) => {
      const x = scaleX(p.volumeAdded).toFixed(1);
      const y = scaleY(p.pH).toFixed(1);
      const yD = scaleYD(p.derivative).toFixed(1);
      pathPH += (idx === 0 ? 'M ' : ' L ') + x + ' ' + y;
      pathDeriv += (idx === 0 ? 'M ' : ' L ') + x + ' ' + yD;
    });

    const eqX = scaleX(res.Veq);
    const eqY = scaleY(res.eqPH);
    const halfX = scaleX(res.halfV);
    const halfY = scaleY(res.halfPH);

    const indTopY = scaleY(indObj.pHRange[1]);
    const indBottomY = scaleY(indObj.pHRange[0]);
    const indH = Math.abs(indBottomY - indTopY);

    let bufferRect = '';
    if (sys !== 'strong_acid_strong_base') {
      const bTop = sys === 'weak_acid_strong_base' ? scaleY(pK + 1) : scaleY((14 - pK) + 1);
      const bBot = sys === 'weak_acid_strong_base' ? scaleY(pK - 1) : scaleY((14 - pK) - 1);
      const bH = Math.abs(bBot - bTop);
      bufferRect = '<rect x="' + pad.left + '" y="' + bTop + '" width="' + cW + '" height="' + bH + '" fill="#f59e0b" fill-opacity="0.08" stroke="#f59e0b" stroke-dasharray="2 3" stroke-width="0.8"/>';
    }

    const xTicks = [0, 0.25, 0.5, 0.75, 1.0].map(r => (res.maxV * r).toFixed(1));
    const yTicks = [0, 2, 4, 6, 8, 10, 12, 14];

    const scatterSVG = userScatterPoints.map(pt => {
      const cx = scaleX(pt.v);
      const cy = scaleY(pt.ph);
      if (cx >= pad.left && cx <= (pad.left + cW)) {
        return '<circle cx="' + cx.toFixed(1) + '" cy="' + cy.toFixed(1) + '" r="4" fill="#facc15" stroke="#020617" stroke-width="1.5"><title>V: ' + pt.v + ' mL, pH: ' + pt.ph + '</title></circle>';
      }
      return '';
    }).join('');

    const svgHTML = '<svg viewBox="0 0 ' + width + ' ' + height + '" class="w-full h-auto select-none font-sans" role="img">' +
      '<rect x="' + pad.left + '" y="' + pad.top + '" width="' + cW + '" height="' + cH + '" fill="#0b1120" stroke="#1e293b" stroke-width="1"/>' +
      bufferRect +
      '<rect x="' + pad.left + '" y="' + indTopY + '" width="' + cW + '" height="' + indH + '" fill="#ec4899" fill-opacity="0.12" stroke="#ec4899" stroke-dasharray="3 3" stroke-width="0.8"/>' +
      '<line x1="' + pad.left + '" y1="' + (pad.top + cH) + '" x2="' + (pad.left + cW) + '" y2="' + (pad.top + cH) + '" stroke="#475569" stroke-width="1.2"/>' +
      '<line x1="' + pad.left + '" y1="' + pad.top + '" x2="' + pad.left + '" y2="' + (pad.top + cH) + '" stroke="#475569" stroke-width="1.2"/>' +
      yTicks.map(t => '<line x1="' + (pad.left - 4) + '" y1="' + scaleY(t) + '" x2="' + pad.left + '" y2="' + scaleY(t) + '" stroke="#64748b" stroke-width="1"/><text x="' + (pad.left - 8) + '" y="' + (scaleY(t) + 3) + '" fill="#94a3b8" font-size="10" text-anchor="end" font-family="monospace">' + t + '</text>').join('') +
      xTicks.map(val => '<line x1="' + scaleX(parseFloat(val)) + '" y1="' + (pad.top + cH) + '" x2="' + scaleX(parseFloat(val)) + '" y2="' + (pad.top + cH + 4) + '" stroke="#64748b" stroke-width="1"/><text x="' + scaleX(parseFloat(val)) + '" y="' + (pad.top + cH + 16) + '" fill="#94a3b8" font-size="10" text-anchor="middle" font-family="monospace">' + val + '</text>').join('') +
      '<text x="' + (pad.left + cW / 2) + '" y="' + (height - 10) + '" fill="#94a3b8" font-size="11" font-weight="600" text-anchor="middle">Titrant Volume Added (mL)</text>' +
      '<text transform="rotate(-90)" x="' + (-(pad.top + cH / 2)) + '" y="16" fill="#94a3b8" font-size="11" font-weight="600" text-anchor="middle">pH</text>' +
      '<path d="' + pathDeriv + '" fill="none" stroke="#a78bfa" stroke-width="1.5" stroke-dasharray="3 3" stroke-opacity="0.8"/>' +
      '<path d="' + pathPH + '" fill="none" stroke="#22d3ee" stroke-width="2.6" stroke-linecap="round"/>' +
      (sys !== 'strong_acid_strong_base' ? '<circle cx="' + halfX + '" cy="' + halfY + '" r="4.5" fill="#f59e0b" stroke="#0f172a" stroke-width="1.5"/><text x="' + (halfX + 6) + '" y="' + (halfY - 4) + '" fill="#fbbf24" font-size="10" font-weight="700" font-family="monospace">V½ (' + res.halfV + ' mL, pH ' + res.halfPH + ')</text>' : '') +
      '<line x1="' + eqX + '" y1="' + (pad.top + cH) + '" x2="' + eqX + '" y2="' + eqY + '" stroke="#ef4444" stroke-dasharray="2 2" stroke-width="1"/>' +
      '<circle cx="' + eqX + '" cy="' + eqY + '" r="5.5" fill="#ef4444" stroke="#ffffff" stroke-width="1.5"/>' +
      '<text x="' + (eqX + 7) + '" y="' + (eqY - 6) + '" fill="#fca5a5" font-size="11" font-weight="800" font-family="monospace">Veq (' + res.Veq + ' mL, pH ' + res.eqPH + ')</text>' +
      scatterSVG +
      '</svg>';

    svgContainer.innerHTML = svgHTML;
  }

  function renderTab() {
    if (currentTab === 'sop') exportDisplay.textContent = cachedOutputs.sop || '';
    if (currentTab === 'latex') exportDisplay.textContent = cachedOutputs.latex || '';
    if (currentTab === 'bibtex') exportDisplay.textContent = cachedOutputs.bibtex || '';
  }

  // Bind Event Listeners
  if (tabSop) {
    tabSop.addEventListener('click', () => {
      currentTab = 'sop';
      tabSop.className = 'pb-2 font-bold text-cyan-400 border-b-2 border-cyan-400 transition';
      tabLatex.className = 'pb-2 font-medium text-slate-400 hover:text-slate-200 transition';
      tabBibtex.className = 'pb-2 font-medium text-slate-400 hover:text-slate-200 transition';
      renderTab();
    });
  }

  if (tabLatex) {
    tabLatex.addEventListener('click', () => {
      currentTab = 'latex';
      tabLatex.className = 'pb-2 font-bold text-cyan-400 border-b-2 border-cyan-400 transition';
      tabSop.className = 'pb-2 font-medium text-slate-400 hover:text-slate-200 transition';
      tabBibtex.className = 'pb-2 font-medium text-slate-400 hover:text-slate-200 transition';
      renderTab();
    });
  }

  if (tabBibtex) {
    tabBibtex.addEventListener('click', () => {
      currentTab = 'bibtex';
      tabBibtex.className = 'pb-2 font-bold text-cyan-400 border-b-2 border-cyan-400 transition';
      tabSop.className = 'pb-2 font-medium text-slate-400 hover:text-slate-200 transition';
      tabLatex.className = 'pb-2 font-medium text-slate-400 hover:text-slate-200 transition';
      renderTab();
    });
  }

  if (selPreset) {
    selPreset.addEventListener('change', () => {
      const pid = selPreset.value;
      if (pid === 'custom') return;
      const found = PRESETS.find(p => p.id === pid);
      if (found) {
        selSystem.value = found.systemType;
        inAnalyteName.value = found.analyteName;
        inTitrantName.value = found.titrantName;
        inCa.value = found.defaultAnalyteConc;
        inVa.value = found.defaultAnalyteVol;
        inCb.value = found.defaultTitrantConc;
        inPk.value = found.pKa || found.pKb || '4.76';
        selIndicator.value = found.recommendedIndicator || 'Phenolphthalein';
        ghsAlertText.textContent = found.ghsAlert;
        updateView();
      }
    });
  }

  [inCa, inVa, inCb, inPk, inAnalyteName, inTitrantName].forEach(el => {
    if (el) {
      el.addEventListener('input', () => {
        if (selPreset) selPreset.value = 'custom';
        updateView();
      });
    }
  });

  [selSystem, selIndicator].forEach(el => {
    if (el) {
      el.addEventListener('change', () => {
        if (selPreset) selPreset.value = 'custom';
        updateView();
      });
    }
  });

  document.getElementById('btn-copy-tab-content')?.addEventListener('click', () => {
    navigator.clipboard.writeText(exportDisplay.textContent).then(() => {
      const btn = document.getElementById('btn-copy-tab-content');
      btn.textContent = 'Copied!';
      setTimeout(() => (btn.textContent = 'Copy Content'), 1800);
    });
  });

  document.getElementById('btn-copy-sop')?.addEventListener('click', () => {
    navigator.clipboard.writeText(cachedOutputs.sop).then(() => {
      const btn = document.getElementById('btn-copy-sop');
      btn.textContent = 'SOP Copied to Clipboard!';
      setTimeout(() => (btn.textContent = 'Copy Lab SOP'), 2000);
    });
  });

  document.getElementById('btn-export-csv')?.addEventListener('click', () => {
    if (!cachedOutputs.points) return;
    let csv = 'VolumeAdded_mL,pH,FirstDerivative_dpH_dV\n';
    cachedOutputs.points.forEach(p => {
      csv += p.volumeAdded + ',' + p.pH + ',' + p.derivative + '\n';
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'titration_curve_' + Date.now() + '.csv';
    a.click();
    URL.revokeObjectURL(url);
  });

  document.getElementById('btn-download-svg')?.addEventListener('click', () => {
    const svgEl = document.querySelector('#svg-chart-container svg');
    if (!svgEl) return;
    const serializer = new XMLSerializer();
    const svgStr = serializer.serializeToString(svgEl);
    const blob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'titration_plot_' + Date.now() + '.svg';
    a.click();
    URL.revokeObjectURL(url);
  });

  const labDrawer = document.getElementById('drawer-lab-mode');
  document.getElementById('btn-toggle-lab-mode')?.addEventListener('click', () => {
    labDrawer?.classList.toggle('hidden');
  });

  document.getElementById('btn-apply-lab-data')?.addEventListener('click', () => {
    const rawText = document.getElementById('input-raw-lab-data').value.trim();
    userScatterPoints = [];
    if (rawText) {
      const lines = rawText.split('\n');
      lines.forEach(line => {
        const parts = line.trim().split(/\s+/);
        if (parts.length >= 2) {
          const v = parseSafe(parts[0], -1);
          const ph = parseSafe(parts[1], -1);
          if (v >= 0 && ph >= 0 && ph <= 14) {
            userScatterPoints.push({ v, ph });
          }
        }
      });
    }
    updateView();
  });

  document.getElementById('btn-clear-lab-data')?.addEventListener('click', () => {
    document.getElementById('input-raw-lab-data').value = '';
    userScatterPoints = [];
    updateView();
  });

  document.getElementById('btn-print-titration-label')?.addEventListener('click', () => {
    const analyte = inAnalyteName.value.trim() || 'Analyte';
    const conc = inCa.value.trim();
    const titrant = inTitrantName.value.trim() || 'Titrant';
    const eqVol = outVeq.textContent;
    const eqPH = outEqPH.textContent;
    const safetyNote = ghsAlertText.textContent;

    const printWin = window.open('', '', 'width=460,height=340');
    if (!printWin) return;
    printWin.document.write(
      '<html><head><title>Benchtop Titration Label</title>' +
      '<style>body{font-family:monospace;padding:14px;border:2px dashed #000;width:340px;margin:auto;}h2{margin:0 0 6px 0;font-size:14px;border-bottom:1px solid #000;padding-bottom:4px;}p{margin:3px 0;font-size:11px;}.hazard{font-size:9px;margin-top:6px;padding:4px;border:1px solid #666;background:#f5f5f5;}.footer{margin-top:8px;border-top:1px solid #000;padding-top:4px;font-size:8px;display:flex;justify-content:space-between;}</style>' +
      '</head><body>' +
      '<h2>SECONDARY TITRATION VESSEL</h2>' +
      '<p><strong>Solution:</strong> ' + analyte + ' (' + conc + ' M)</p>' +
      '<p><strong>Titrant System:</strong> ' + titrant + '</p>' +
      '<p><strong>Predicted Veq:</strong> ' + eqVol + ' mL (pH ' + eqPH + ')</p>' +
      '<p><strong>Prepared:</strong> ' + (new Date().toLocaleDateString()) + ' | <strong>By:</strong> ___________</p>' +
      '<div class="hazard"><strong>SAFETY NOTE:</strong> ' + safetyNote + '</div>' +
      '<div class="footer"><span>ChemistryCal Lab Suite</span><span>Class-A Analytical</span></div>' +
      '<script>window.print();window.close();<\/script></body></html>'
    );
    printWin.document.close();
  });

  document.getElementById('btn-share-link')?.addEventListener('click', () => {
    const params = new URLSearchParams({
      sys: selSystem.value,
      ca: inCa.value,
      va: inVa.value,
      cb: inCb.value,
      pk: inPk.value,
      ind: selIndicator.value
    });
    const shareUrl = window.location.origin + window.location.pathname + '?' + params.toString();
    navigator.clipboard.writeText(shareUrl).then(() => {
      const btn = document.getElementById('btn-share-link');
      btn.textContent = 'Link Copied!';
      setTimeout(() => (btn.textContent = 'Share URL State'), 2000);
    });
  });

  document.getElementById('btn-reset-defaults')?.addEventListener('click', () => {
    window.location.href = window.location.pathname;
  });

  // Handle URL query parameters on load
  const q = new URLSearchParams(window.location.search);
  if (q.has('sys')) selSystem.value = q.get('sys');
  if (q.has('ca')) inCa.value = q.get('ca');
  if (q.has('va')) inVa.value = q.get('va');
  if (q.has('cb')) inCb.value = q.get('cb');
  if (q.has('pk')) inPk.value = q.get('pk');
  if (q.has('ind')) selIndicator.value = q.get('ind');

  updateView();
})();