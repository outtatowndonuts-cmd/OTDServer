/* global $, document */
/* eslint-disable no-alert */
/* Orders Dashboard SPA – mirrors recipes-dashboard.js pattern */
(function () {
  var currentSection = 'all';

  // ─── Section Loading ────────────────────────────────────────────────────────
  function loadSection(section) {
    currentSection = section;
    var $main = $('#main-content');
    $main.html('<div class="d-flex justify-content-center align-items-center py-5"><div class="spinner-border text-secondary" role="status"><span class="visually-hidden">Loading...</span></div></div>');

    // Highlight sidebar
    $('.sidebar-link').removeClass('active');
    $(`.sidebar-link[data-section="${section}"]`).addClass('active');

    $.get(`/orders/fragments/${section}`)
      .done(function (html) {
        $main.html(html);
        attachHandlers();
      })
      .fail(function () {
        $main.html('<div class="alert alert-danger">Failed to load section.</div>');
      });
  }

  function loadDetail(id) {
    var $main = $('#main-content');
    $main.html('<div class="d-flex justify-content-center align-items-center py-5"><div class="spinner-border text-secondary" role="status"><span class="visually-hidden">Loading...</span></div></div>');

    $.get(`/orders/fragments/${id}/detail`)
      .done(function (html) {
        $main.html(html);
        attachHandlers();
      })
      .fail(function () {
        $main.html('<div class="alert alert-danger">Failed to load order details.</div>');
      });
  }

  // ─── Event Handlers ────────────────────────────────────────────────────────
  function attachHandlers() {
    var $main = $('#main-content');

    // Toggle sale-specific fields based on order type
    var $type = $main.find('#order-type');
    if ($type.length) {
      toggleTypeFields($type.val());
      $type.off('change').on('change', function () {
        toggleTypeFields($(this).val());
      });
    }

    // Add item row
    $main
      .find('[data-action="add-row"]')
      .off('click')
      .on('click', function () {
        var $container = $('#items-container');
        var $lastRow = $container.find('.item-row').last();
        var $newRow = $lastRow.clone();
        $newRow.find('input').val('');
        $newRow.find('select').prop('selectedIndex', 0);
        $newRow.find('input[type="hidden"]').val('');
        $container.append($newRow);
        reindexRows();
        populateItemSelects();
        attachRowHandlers();
      });

    attachRowHandlers();

    // Recalc on qty, price, or tax rate changes
    $main
      .find('#items-container')
      .off('input.calc')
      .on('input.calc', 'input[name$="[quantity]"], .item-price', function () {
        recalcTotals();
      });
    $main
      .find('#calc-tax-rate')
      .off('input.calc')
      .on('input.calc', function () {
        recalcTotals();
      });

    // Apply defaults from settings when form loads
    applySettingsDefaults();

    // Form submission
    $main
      .find('#order-form')
      .off('submit')
      .on('submit', function (e) {
        e.preventDefault();
        submitOrder($(this));
      });

    // Settings form submission
    $main
      .find('#settings-form')
      .off('submit')
      .on('submit', function (e) {
        e.preventDefault();
        submitSettings($(this));
      });

    // Complete order
    $main
      .find('[data-action="complete-order"]')
      .off('click')
      .on('click', function () {
        var id = $(this).data('id');
        completeOrder(id);
      });

    // View detail
    $main
      .find('[data-action="view-detail"]')
      .off('click')
      .on('click', function () {
        var id = $(this).data('id');
        loadDetail(id);
      });

    // Detail link
    $main
      .find('.order-detail-link')
      .off('click')
      .on('click', function (e) {
        e.preventDefault();
        var id = $(this).data('id');
        loadDetail(id);
      });

    // Back to list
    $main
      .find('[data-action="back-to-list"]')
      .off('click')
      .on('click', function () {
        loadSection(currentSection);
      });

    // Cancel
    $main
      .find('[data-action="cancel"]')
      .off('click')
      .on('click', function () {
        loadSection('all');
      });

    // New form from list
    $main
      .find('[data-action="new-form"]')
      .off('click')
      .on('click', function () {
        loadSection('new');
      });
  }

  function attachRowHandlers() {
    $('#items-container')
      .find('[data-action="remove-row"]')
      .off('click')
      .on('click', function () {
        var $container = $('#items-container');
        if ($container.find('.item-row').length > 1) {
          $(this).closest('.item-row').remove();
          reindexRows();
        }
      });
  }

  function reindexRows() {
    $('#items-container .item-row').each(function (idx) {
      $(this)
        .find('select, input')
        .each(function () {
          var name = $(this).attr('name');
          if (name) {
            $(this).attr('name', name.replace(/items\[\d+\]/, `items[${idx}]`));
          }
        });
    });
  }

  function toggleTypeFields(type) {
    var isSale = type === 'sale';

    // Sale-only fields
    $('#totals-section').toggle(isSale);
    $('#payment-method-group').toggle(isSale);
    $('.price-col').toggle(isSale);

    // Source: only visible for sales; production always defaults to internal via hidden field
    $('#source-group').toggle(isSale);
    var $hiddenSource = $('#order-source-hidden');
    if (isSale) {
      // Sync hidden source from the visible select
      $hiddenSource.val($('#order-source').val());
      $('#order-source')
        .off('change.source')
        .on('change.source', function () {
          $hiddenSource.val($(this).val());
        });
    } else {
      $hiddenSource.val('internal');
    }

    // Populate item dropdowns based on type
    populateItemSelects();
  }

  function getCatalog() {
    var $form = $('#order-form');
    return {
      products: $form.length ? JSON.parse($form.attr('data-products') || '[]') : [],
      recipes: $form.length ? JSON.parse($form.attr('data-recipes') || '[]') : [],
    };
  }

  function populateItemSelects() {
    var type = $('#order-type').val();
    var catalog = getCatalog();
    var items, kind;

    if (type === 'sale') {
      items = catalog.products;
      kind = 'product';
    } else if (type === 'production') {
      items = catalog.recipes;
      kind = 'recipe';
    } else if (type === 'assembly') {
      items = catalog.products;
      kind = 'product';
    } else {
      items = [];
      kind = '';
    }

    $('#items-container .item-row').each(function () {
      var $row = $(this);
      var $select = $row.find('.item-ref-select');
      var currentVal = $select.val();

      var html = `<option value="">— Select ${kind === 'product' ? 'Product' : kind === 'recipe' ? 'Recipe' : 'type first'} —</option>`;
      items.forEach(function (item) {
        var selected = item._id === currentVal ? ' selected' : '';
        var label = item.name;
        if (kind === 'product' && type === 'sale' && item.price) label += ` ($${item.price.toFixed(2)})`;
        if (type === 'assembly' && item.kitchenQty != null) label += ` (${item.kitchenQty} in kitchen)`;
        html += `<option value="${item._id}" data-name="${item.name.replace(/"/g, '&quot;')}"${item.price != null ? ` data-price="${item.price}"` : ''}${selected}>${label}</option>`;
      });
      $select.html(html);

      // Set hidden kind field
      $row.find('input[name$="[kind]"]').val(kind);

      // Attach change handler to sync nameSnapshot, price, and recalc
      $select.off('change.catalog').on('change.catalog', function () {
        var $opt = $(this).find('option:selected');
        $row.find('input[name$="[nameSnapshot]"]').val($opt.data('name') || '');
        if (kind === 'product' && type === 'sale') {
          $row.find('.item-price').val($opt.data('price') || '');
        }
        recalcTotals();
      });
    });
  }

  // ─── Auto-Calculation ──────────────────────────────────────────────────────
  function recalcTotals() {
    if ($('#order-type').val() !== 'sale') return;

    var subtotal = 0;
    $('#items-container .item-row').each(function () {
      var $row = $(this);
      var qty = parseFloat($row.find('input[name$="[quantity]"]').val()) || 0;
      var price = parseFloat($row.find('.item-price').val()) || 0;
      var lineTotal = qty * price;
      $row.find('.item-line-total').val(lineTotal > 0 ? `$${lineTotal.toFixed(2)}` : '\u2014');
      subtotal += lineTotal;
    });

    var taxRate = parseFloat($('#calc-tax-rate').val()) || 0;
    var taxAmount = subtotal * (taxRate / 100);
    var total = subtotal + taxAmount;

    $('#calc-subtotal').val(`$${subtotal.toFixed(2)}`);
    $('input[name="subtotal"]').val(subtotal.toFixed(2));
    $('#calc-tax').val(`$${taxAmount.toFixed(2)}`);
    $('input[name="tax"]').val(taxAmount.toFixed(2));
    $('#calc-total').val(`$${total.toFixed(2)}`);
    $('input[name="total"]').val(total.toFixed(2));
  }

  // ─── Settings Defaults ──────────────────────────────────────────────────────
  function applySettingsDefaults() {
    var $form = $('#order-form');
    if (!$form.length) return;

    var defaultPayment = $form.attr('data-default-payment');
    var defaultSource = $form.attr('data-default-source');

    if (defaultPayment) {
      $form.find('#payment-method').val(defaultPayment);
    }
    if (defaultSource) {
      $form.find('#order-source').val(defaultSource);
      $('#order-source-hidden').val(defaultSource);
    }
  }

  // ─── API Calls ──────────────────────────────────────────────────────────────
  function submitOrder($form) {
    // Sync hidden fields from current select values before serializing
    $('#items-container .item-row').each(function () {
      var $row = $(this);
      var $opt = $row.find('.item-ref-select option:selected');
      $row.find('input[name$="[nameSnapshot]"]').val($opt.data('name') || '');
      $row.find('input[name$="[kind]"]').val($('#order-type').val() === 'sale' || $('#order-type').val() === 'assembly' ? 'product' : 'recipe');
      if ($('#order-type').val() === 'sale') {
        var price = $opt.data('price');
        if (price != null && !$row.find('.item-price').val()) {
          $row.find('.item-price').val(price);
        }
      }
    });

    var formData = {};
    var arr = $form.serializeArray();
    var items = [];

    arr.forEach(function (field) {
      var match = field.name.match(/^items\[(\d+)\]\[(.+)\]$/);
      if (match) {
        var idx = parseInt(match[1], 10);
        var key = match[2];
        if (!items[idx]) items[idx] = {};
        items[idx][key] = field.value;
      } else if (field.name !== '_csrf') {
        formData[field.name] = field.value;
      }
    });

    // Parse numeric fields, strip empty strings
    items = items.filter(function (i) {
      return i && i.refId;
    });
    items.forEach(function (item) {
      if (item.quantity) item.quantity = parseFloat(item.quantity);
      if (item.priceSnapshot && item.priceSnapshot !== '') {
        item.priceSnapshot = parseFloat(item.priceSnapshot);
      } else {
        delete item.priceSnapshot;
      }
    });

    formData.items = items;
    if (formData.subtotal && formData.subtotal !== '') formData.subtotal = parseFloat(formData.subtotal);
    else delete formData.subtotal;
    if (formData.tax && formData.tax !== '') formData.tax = parseFloat(formData.tax);
    else delete formData.tax;
    if (formData.total && formData.total !== '') formData.total = parseFloat(formData.total);
    else delete formData.total;

    // Production orders: force source=internal, clear payment
    if (formData.type === 'production') {
      formData.source = 'internal';
      formData.paymentMethod = 'none';
      delete formData.subtotal;
      delete formData.tax;
      delete formData.total;
    }

    // Assembly orders: force source=internal, clear payment
    if (formData.type === 'assembly') {
      formData.source = 'internal';
      formData.paymentMethod = 'none';
      delete formData.subtotal;
      delete formData.tax;
      delete formData.total;
    }

    var csrfToken = $form.find('input[name="_csrf"]').val() || $('meta[name="csrf-token"]').attr('content');

    $.ajax({
      url: '/orders',
      method: 'POST',
      contentType: 'application/json',
      headers: { 'X-CSRF-Token': csrfToken },
      data: JSON.stringify(formData),
      success: function () {
        loadSection('all');
      },
      error: function (xhr) {
        var msg = 'Failed to create order';
        try {
          msg = JSON.parse(xhr.responseText).error || msg;
        } catch {
          /* ignore */
        }
        alert(msg);
      },
    });
  }

  function submitSettings($form) {
    var csrfToken = $form.find('input[name="_csrf"]').val() || $('meta[name="csrf-token"]').attr('content');

    var data = {};
    $form.serializeArray().forEach(function (field) {
      if (field.name !== '_csrf') data[field.name] = field.value;
    });
    if (data.taxRate) data.taxRate = parseFloat(data.taxRate);

    $.ajax({
      url: '/orders/settings',
      method: 'POST',
      contentType: 'application/json',
      headers: { 'X-CSRF-Token': csrfToken },
      data: JSON.stringify(data),
      success: function () {
        alert('Settings saved.');
      },
      error: function (xhr) {
        var msg = 'Failed to save settings';
        try {
          msg = JSON.parse(xhr.responseText).error || msg;
        } catch {
          /* ignore */
        }
        alert(msg);
      },
    });
  }

  function completeOrder(id) {
    var csrfToken = $('meta[name="csrf-token"]').attr('content') || $('#order-form input[name="_csrf"]').val();

    $.ajax({
      url: `/orders/${id}/complete`,
      method: 'POST',
      contentType: 'application/json',
      headers: { 'X-CSRF-Token': csrfToken },
      data: '{}',
      success: function () {
        loadSection(currentSection);
      },
      error: function (xhr) {
        var msg = 'Failed to complete order';
        try {
          msg = JSON.parse(xhr.responseText).error || msg;
        } catch {
          /* ignore */
        }
        alert(msg);
      },
    });
  }

  // ─── Sidebar Navigation ────────────────────────────────────────────────────
  $(document).on('click', '.sidebar-link', function (e) {
    e.preventDefault();
    var section = $(this).data('section');
    if (section) loadSection(section);
  });

  // ─── Initial Load ──────────────────────────────────────────────────────────
  $(function () {
    loadSection('all');
  });
})();
