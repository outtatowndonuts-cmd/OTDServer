(function () {
  var app = document.getElementById('recipes-app');
  if (!app) return;

  var mainContent = document.getElementById('main-content');
  var currentSection = 'ingredients';

  // --- Unit Converter (client-side, mirrors server units.js) -----------------

  var UC_WEIGHT = { g: 1, kg: 1000, oz: 28.3495, lb: 453.592 };
  var UC_VOLUME = { tsp: 4.92892, tbsp: 14.7868, cup: 236.588, 'fl oz': 29.5735, ml: 1, l: 1000 };
  var UC_COUNT = { each: 1, dozen: 12 };

  function ucFamily(u) {
    u = (u || '').toLowerCase().trim();
    if (UC_WEIGHT[u] !== undefined) return 'weight';
    if (UC_VOLUME[u] !== undefined) return 'volume';
    if (UC_COUNT[u] !== undefined) return 'count';
    return null;
  }
  function ucToBase(qty, u) {
    u = (u || '').toLowerCase().trim();
    return qty * (UC_WEIGHT[u] || UC_VOLUME[u] || UC_COUNT[u] || 1);
  }
  function ucFromBase(base, u) {
    u = (u || '').toLowerCase().trim();
    return base / (UC_WEIGHT[u] || UC_VOLUME[u] || UC_COUNT[u] || 1);
  }
  function convertUnits(qty, from, to) {
    if (ucFamily(from) !== ucFamily(to) || !ucFamily(from)) return null;
    return ucFromBase(ucToBase(qty, from), to);
  }

  // Wire the static unit converter widget in the sidebar
  var ucQty = document.getElementById('uc-qty');
  var ucFrom = document.getElementById('uc-from');
  var ucTo = document.getElementById('uc-to');
  var ucResult = document.getElementById('uc-result');

  function updateUC() {
    var qty = parseFloat(ucQty.value);
    var from = ucFrom.value;
    var to = ucTo.value;
    if (isNaN(qty) || !from || !to) {
      ucResult.textContent = '—';
      return;
    }
    if (from === to) {
      ucResult.textContent = `${qty} ${from}`;
      return;
    }
    var result = convertUnits(qty, from, to);
    if (result === null) {
      ucResult.textContent = 'Incompatible units';
    } else {
      // Trim trailing zeros but keep at least 2 decimal places
      var str = result.toFixed(6).replace(/\.?0+$/, '');
      if (str.indexOf('.') === -1) str = str;
      ucResult.textContent = `${qty}\u00a0${from}\u00a0=\u00a0${str}\u00a0${to}`;
    }
  }

  if (ucQty) ucQty.addEventListener('input', updateUC);
  if (ucFrom) ucFrom.addEventListener('change', updateUC);
  if (ucTo) ucTo.addEventListener('change', updateUC);

  // --- Helpers ---------------------------------------------------------------

  function getCsrf() {
    var m = document.querySelector('meta[name="csrf-token"]');
    return m ? m.getAttribute('content') : '';
  }

  function setActiveNav(section) {
    app.querySelectorAll('.sidebar-link').forEach(function (a) {
      var isActive = a.getAttribute('data-section') === section;
      a.classList.toggle('active', isActive);
    });
  }

  function showLoading() {
    mainContent.innerHTML = '<div class="d-flex justify-content-center align-items-center py-5"><div class="spinner-border text-secondary" role="status"><span class="visually-hidden">Loading...</span></div></div>';
  }

  function showError(msg) {
    mainContent.innerHTML = `<div class="alert alert-danger">${msg || 'Something went wrong.'}</div>`;
  }

  // --- Dynamic Row Management (recipes & products forms) ---------------------

  function reindexRows(container) {
    container.querySelectorAll('.item-row').forEach(function (row, idx) {
      row.querySelectorAll('[name]').forEach(function (el) {
        el.setAttribute('name', el.getAttribute('name').replace(/\[\d+\]/, `[${idx}]`));
      });
    });
  }

  function attachRowBtn(btn, container) {
    btn.addEventListener('click', function () {
      var row = btn.closest('.item-row');
      if (row) {
        row.remove();
        reindexRows(container);
        recalcCosting();
        recalcRecipe();
      }
    });
  }

  // Filter the ref <select> to only show options matching the chosen type
  function syncCompType(typeSelect) {
    var row = typeSelect.closest('.item-row');
    if (!row) return;
    var kind = typeSelect.value; // 'Recipe', 'Ingredient', or 'Supply'
    var refSelect = row.querySelector('[data-role="comp-ref"]');
    if (!refSelect) return;
    var opts = refSelect.querySelectorAll('option');
    var firstVisible = null;
    opts.forEach(function (opt) {
      var show = opt.getAttribute('data-kind') === kind;
      opt.hidden = !show;
      opt.disabled = !show;
      if (show && !firstVisible) firstVisible = opt;
    });
    // If current selection is hidden, move to first visible
    var current = refSelect.options[refSelect.selectedIndex];
    if (current && (current.hidden || current.disabled)) {
      refSelect.value = firstVisible ? firstVisible.value : '';
    }
    updateRowCost(row);
  }

  // Read the cost-per-unit map embedded by the server in a data attribute
  function getCompCosts() {
    var el = mainContent.querySelector('#comp-cost-data');
    if (!el) return null;
    try {
      return JSON.parse(el.getAttribute('data-costs'));
    } catch {
      return null;
    }
  }

  // Calculate and display per-row component cost using cost data embedded in form
  function updateRowCost(row) {
    var costs = getCompCosts();
    if (!costs) return;
    var typeSelect = row.querySelector('[data-role="comp-type"]');
    var refSelect = row.querySelector('[data-role="comp-ref"]');
    var qtyInput = row.querySelector('[name*="[quantity]"]');
    var costDisplay = row.querySelector('[data-role="comp-cost"]');
    if (!typeSelect || !refSelect || !qtyInput || !costDisplay) return;
    var type = typeSelect.value;
    var id = refSelect.value;
    var qty = parseFloat(qtyInput.value);
    if (!id || isNaN(qty) || qty <= 0) {
      costDisplay.value = '';
      return;
    }
    var key = `${type}:${id}`;
    var unitCost = costs[key];
    if (unitCost == null) {
      costDisplay.value = '?';
      return;
    }
    var total = unitCost * qty;
    costDisplay.value = `$${total
      .toFixed(4)
      .replace(/(\.[0-9]*[1-9])0+$/, '$1')
      .replace(/\.0+$/, '.00')}`;
  }

  // Recalculate the entire costing panel from current form state
  function recalcCosting() {
    var costs = getCompCosts();
    var form = mainContent.querySelector('#section-form');
    if (!form) return;

    // Sum component costs
    var ingredientCost = 0;
    form.querySelectorAll('.item-row').forEach(function (row) {
      var typeSelect = row.querySelector('[data-role="comp-type"]');
      var refSelect = row.querySelector('[data-role="comp-ref"]');
      var qtyInput = row.querySelector('[name*="[quantity]"]');
      if (!typeSelect || !refSelect || !qtyInput) return;
      if (!costs) return;
      var key = `${typeSelect.value}:${refSelect.value}`;
      var unitCost = costs[key];
      var qty = parseFloat(qtyInput.value) || 0;
      if (unitCost != null && qty > 0) ingredientCost += unitCost * qty;
    });

    var laborCost = parseFloat(form.querySelector('#pr-labor') && form.querySelector('#pr-labor').value) || 0;
    var overheadCost = parseFloat(form.querySelector('#pr-overhead') && form.querySelector('#pr-overhead').value) || 0;
    var targetMargin = parseFloat(form.querySelector('#pr-margin') && form.querySelector('#pr-margin').value) || 30;
    var priceVal = parseFloat(form.querySelector('#pr-price') && form.querySelector('#pr-price').value) || 0;

    var totalCOGS = ingredientCost + laborCost + overheadCost;
    var margin = priceVal > 0 ? ((priceVal - totalCOGS) / priceVal) * 100 : null;
    var suggestedPrice = totalCOGS > 0 && targetMargin < 100 ? totalCOGS / (1 - targetMargin / 100) : 0;

    function fmt(n) {
      return `$${n.toFixed(2)}`;
    }
    function setEl(id, text, cls) {
      var el = document.getElementById(id);
      if (!el) return;
      el.textContent = text;
      el.className = cls || '';
    }

    setEl('live-ingredient-cost', fmt(ingredientCost));
    setEl('live-labor-cost', fmt(laborCost));
    setEl('live-overhead-cost', fmt(overheadCost));
    setEl('live-total-cogs', fmt(totalCOGS));
    setEl('live-price', priceVal > 0 ? fmt(priceVal) : '—');
    setEl('live-target-pct', targetMargin.toFixed(0));
    setEl('live-suggested-price', suggestedPrice > 0 ? fmt(suggestedPrice) : '—');

    if (margin !== null) {
      var mClass = margin < 0 ? 'fw-bold text-danger' : margin < 20 ? 'fw-bold text-warning' : 'fw-bold text-success';
      setEl('live-margin', `${margin.toFixed(1)}%`, mClass);
    } else {
      setEl('live-margin', '—');
    }
  }

  // Live cost preview for the recipe form
  function recalcRecipe() {
    var dataEl = mainContent.querySelector('#ing-cost-data');
    var form = mainContent.querySelector('#section-form');
    if (!dataEl || !form) return;
    var ingCosts;
    try {
      ingCosts = JSON.parse(dataEl.getAttribute('data-costs'));
    } catch {
      return;
    }

    var totalCost = 0;
    form.querySelectorAll('.item-row').forEach(function (row) {
      var ingSelect = row.querySelector('select[name*="[ingredient]"]');
      var qtyInput = row.querySelector('[name*="[quantity]"]');
      var unitField = row.querySelector('[name*="[unit]"]');
      var costCell = row.querySelector('[data-role="ing-cost"]');
      if (costCell) costCell.value = '\u2014';
      if (!ingSelect || !qtyInput) return;
      var id = ingSelect.value;
      var qty = parseFloat(qtyInput.value) || 0;
      var unit = unitField ? unitField.value.trim() : '';
      if (!id || qty <= 0) return;
      var info = ingCosts[id];
      if (!info || info.cost == null) return;
      var cost = computeIngredientLineCost(qty, unit, info.cost, info.unit);
      if (cost != null) {
        totalCost += cost;
        if (costCell) costCell.value = `$${cost.toFixed(2)}`;
      }
    });

    var yieldEl = form.querySelector('#rc-yield');
    var yieldQty = parseFloat(yieldEl && yieldEl.value) || 1;

    var batchEl = document.getElementById('rc-live-batch');
    var unitEl = document.getElementById('rc-live-unit');
    var yldEl = document.getElementById('rc-live-yield');
    if (batchEl) batchEl.textContent = `$${totalCost.toFixed(2)}`;
    if (unitEl)
      unitEl.textContent = `$${(totalCost / yieldQty)
        .toFixed(4)
        .replace(/(\.[0-9]*[1-9])0+$/, '$1')
        .replace(/\.0+$/, '.00')}`;
    if (yldEl) yldEl.textContent = yieldQty;
  }

  // Client-side ingredient line cost (mirrors server units.js logic)
  function computeIngredientLineCost(qty, unit, purchaseCost, purchaseUnit) {
    if (!purchaseCost || !qty) return 0;
    var lineUnit = unit && unit.trim() ? unit.trim() : purchaseUnit;
    if (!lineUnit || !purchaseUnit) return null;
    var WEIGHT = { g: 1, kg: 1000, oz: 28.3495, lb: 453.592, lbs: 453.592 };
    var VOLUME = { ml: 1, l: 1000, tsp: 4.92892, tbsp: 14.7868, cup: 236.588, 'fl oz': 29.5735 };
    var COUNT = { each: 1, ea: 1, dozen: 12, doz: 12 };
    function fam(u) {
      u = (u || '').toLowerCase().trim();
      return WEIGHT[u] != null ? 'w' : VOLUME[u] != null ? 'v' : COUNT[u] != null ? 'c' : null;
    }
    function toBase(q, u) {
      u = (u || '').toLowerCase().trim();
      return q * (WEIGHT[u] || VOLUME[u] || COUNT[u] || 1);
    }
    function fromBase(b, u) {
      u = (u || '').toLowerCase().trim();
      return b / (WEIGHT[u] || VOLUME[u] || COUNT[u] || 1);
    }
    if (fam(lineUnit) !== fam(purchaseUnit) || !fam(lineUnit)) return null;
    return fromBase(toBase(1, purchaseUnit), lineUnit) > 0 ? (purchaseCost / toBase(1, purchaseUnit)) * toBase(qty, lineUnit) : null;
  }

  // --- Attach all handlers after fragment injection --------------------------

  function attachHandlers() {
    // Sidebar-style cancel / back button
    mainContent.querySelectorAll('[data-action="cancel"]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        loadSection(currentSection);
      });
    });

    // Add / Edit form buttons (in list views)
    mainContent.querySelectorAll('[data-action="new-form"]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        loadForm(btn.getAttribute('data-section'), null);
      });
    });

    mainContent.querySelectorAll('[data-action="edit-form"]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        loadForm(btn.getAttribute('data-section'), btn.getAttribute('data-id'));
      });
    });

    // Delete buttons (in list views)
    mainContent.querySelectorAll('[data-action="delete"]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        if (!window.confirm('Delete this item? This cannot be undone.')) return;
        var url = btn.getAttribute('data-url');
        fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: `_csrf=${encodeURIComponent(getCsrf())}`,
        })
          .then(function (res) {
            return res.json();
          })
          .then(function (data) {
            if (data.ok) {
              loadSection(currentSection);
            } else {
              alert(`Error: ${data.error || 'Delete failed.'}`);
            }
          })
          .catch(function () {
            alert('Network error during delete.');
          });
      });
    });

    // Dynamic row: Add Row button (used in recipe/product forms)
    mainContent.querySelectorAll('[data-action="add-row"]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var targetId = btn.getAttribute('data-target');
        var container = document.getElementById(targetId);
        if (!container) return;
        var rows = container.querySelectorAll('.item-row');
        if (!rows.length) return;
        var clone = rows[rows.length - 1].cloneNode(true);
        // Clear values in clone
        clone.querySelectorAll('input').forEach(function (el) {
          el.value = '';
        });
        clone.querySelectorAll('select').forEach(function (el) {
          el.selectedIndex = 0;
        });
        container.appendChild(clone);
        reindexRows(container);
        // Attach remove handler for the new row's button
        var removeBtn = clone.querySelector('[data-action="remove-row"]');
        if (removeBtn) attachRowBtn(removeBtn, container);
        // Attach type filter and sync initial state
        var typeSelect = clone.querySelector('[data-role="comp-type"]');
        if (typeSelect) {
          syncCompType(typeSelect);
          typeSelect.addEventListener('change', function () {
            syncCompType(typeSelect);
          });
        }
        // Wire cost display for cloned row
        var refSelect = clone.querySelector('[data-role="comp-ref"]');
        var ingSelect2 = clone.querySelector('select[name*="[ingredient]"]');
        var qtyInput = clone.querySelector('[name*="[quantity]"]');
        var unitInput = clone.querySelector('[name*="[unit]"]');
        if (refSelect)
          refSelect.addEventListener('change', function () {
            updateRowCost(clone);
            recalcCosting();
            recalcRecipe();
          });
        if (ingSelect2 && !refSelect) ingSelect2.addEventListener('change', recalcRecipe);
        if (qtyInput)
          qtyInput.addEventListener('input', function () {
            updateRowCost(clone);
            recalcCosting();
            recalcRecipe();
          });
        if (unitInput) unitInput.addEventListener('change', recalcRecipe);
      });
    });

    // Dynamic row: Remove Row buttons
    mainContent.querySelectorAll('[data-action="remove-row"]').forEach(function (btn) {
      var container = btn.closest('#ingredient-rows, #component-rows');
      if (container) attachRowBtn(btn, container);
    });

    // Component type filter: wire all existing type selects
    mainContent.querySelectorAll('[data-role="comp-type"]').forEach(function (typeSelect) {
      syncCompType(typeSelect); // apply on load
      typeSelect.addEventListener('change', function () {
        syncCompType(typeSelect);
      });
    });

    // Component cost display: wire qty + ref changes for all existing rows
    mainContent.querySelectorAll('.item-row').forEach(function (row) {
      updateRowCost(row);
      var refSelect = row.querySelector('[data-role="comp-ref"]');
      var ingSelect = row.querySelector('select[name*="[ingredient]"]');
      var qtyInput = row.querySelector('[name*="[quantity]"]');
      var unitInput = row.querySelector('[name*="[unit]"]');
      if (refSelect)
        refSelect.addEventListener('change', function () {
          updateRowCost(row);
          recalcCosting();
          recalcRecipe();
        });
      if (ingSelect && !refSelect) ingSelect.addEventListener('change', recalcRecipe);
      if (qtyInput)
        qtyInput.addEventListener('input', function () {
          updateRowCost(row);
          recalcCosting();
          recalcRecipe();
        });
      if (unitInput) unitInput.addEventListener('change', recalcRecipe);
    });

    // Costing panel inputs: labor, overhead, margin, price
    ['#pr-labor', '#pr-overhead', '#pr-margin', '#pr-price'].forEach(function (sel) {
      var el = mainContent.querySelector(sel);
      if (el) el.addEventListener('input', recalcCosting);
    });

    // Recipe yield input for per-unit cost
    var yieldInput = mainContent.querySelector('#rc-yield');
    if (yieldInput) yieldInput.addEventListener('input', recalcRecipe);

    // Initial render of the live costing panel
    recalcCosting();

    // Recipe form live cost preview
    recalcRecipe();

    // Form submit ? POST ? JSON response ? reload section
    mainContent.querySelectorAll('#section-form').forEach(function (form) {
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        var fd = new FormData(form);
        if (!fd.get('_csrf')) fd.append('_csrf', getCsrf());
        var params = new URLSearchParams(fd);
        var submitBtn = form.querySelector('[type="submit"]');
        if (submitBtn) submitBtn.disabled = true;
        fetch(form.getAttribute('action'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: params,
        })
          .then(function (res) {
            return res.json();
          })
          .then(function (data) {
            if (data.ok) {
              loadSection(currentSection);
            } else {
              if (submitBtn) submitBtn.disabled = false;
              alert(`Error: ${data.error || 'Could not save.'}`);
            }
          })
          .catch(function () {
            if (submitBtn) submitBtn.disabled = false;
            alert('Network error. Please try again.');
          });
      });
    });
  }

  // --- Load a list section ---------------------------------------------------

  function loadSection(section) {
    currentSection = section;
    setActiveNav(section);
    showLoading();
    fetch(`/recipes/fragments/${section}`)
      .then(function (res) {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.text();
      })
      .then(function (html) {
        mainContent.innerHTML = html;
        attachHandlers();
      })
      .catch(function () {
        showError(`Failed to load ${section}.`);
      });
  }

  // --- Load add or edit form -------------------------------------------------

  function loadForm(section, id) {
    showLoading();
    var url = id ? `/recipes/fragments/${section}/${id}/edit` : `/recipes/fragments/${section}/new`;
    fetch(url)
      .then(function (res) {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.text();
      })
      .then(function (html) {
        mainContent.innerHTML = html;
        attachHandlers();
      })
      .catch(function () {
        showError('Failed to load form.');
      });
  }

  // --- Sidebar navigation ----------------------------------------------------

  app.querySelectorAll('.sidebar-link').forEach(function (link) {
    link.addEventListener('click', function (e) {
      e.preventDefault();
      loadSection(link.getAttribute('data-section'));
    });
  });

  // --- Initial load ----------------------------------------------------------
  loadSection('ingredients');
})();
