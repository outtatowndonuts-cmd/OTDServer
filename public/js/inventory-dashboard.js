/* global $, document */
/* Inventory Dashboard SPA – mirrors orders-dashboard.js pattern */
(function () {
  var currentSection = 'all';

  function csrfToken() {
    return $('meta[name="csrf-token"]').attr('content');
  }

  function loadSection(section) {
    currentSection = section;
    var $main = $('#main-content');
    $main.html('<div class="d-flex justify-content-center align-items-center py-5"><div class="spinner-border text-secondary" role="status"><span class="visually-hidden">Loading...</span></div></div>');

    $('.sidebar-link').removeClass('active');
    $(`.sidebar-link[data-section="${section}"]`).addClass('active');

    $.get(`/inventory/fragments/${section}`)
      .done(function (html) {
        $main.html(html);
        attachHandlers();
      })
      .fail(function () {
        $main.html('<div class="alert alert-danger">Failed to load section.</div>');
      });
  }

  function loadPODetail(id) {
    var $main = $('#main-content');
    $main.html('<div class="d-flex justify-content-center align-items-center py-5"><div class="spinner-border text-secondary" role="status"><span class="visually-hidden">Loading...</span></div></div>');

    $.get(`/inventory/fragments/purchase-orders/${id}/detail`)
      .done(function (html) {
        $main.html(html);
        attachHandlers();
      })
      .fail(function () {
        $main.html('<div class="alert alert-danger">Failed to load purchase order.</div>');
      });
  }

  function attachHandlers() {
    var $main = $('#main-content');

    // Cull a single batch
    $main
      .find('[data-action="cull-batch"]')
      .off('click')
      .on('click', function () {
        var id = $(this).data('id');
        if (!confirm('Cull this batch? Remaining stock will be written off.')) return;
        $.ajax({
          url: `/inventory/batches/${id}/cull`,
          method: 'POST',
          contentType: 'application/json',
          headers: { 'X-CSRF-Token': csrfToken() },
          data: '{}',
        })
          .done(function () {
            loadSection(currentSection);
          })
          .fail(function (xhr) {
            var msg = xhr.responseJSON ? xhr.responseJSON.error : 'Failed to cull batch.';
            alert(msg);
          });
      });

    // Cull all expired batches
    $main
      .find('[data-action="cull-expired"]')
      .off('click')
      .on('click', function () {
        if (!confirm('Cull ALL expired batches? This cannot be undone.')) return;
        $.ajax({
          url: '/inventory/cull-expired',
          method: 'POST',
          contentType: 'application/json',
          headers: { 'X-CSRF-Token': csrfToken() },
          data: '{}',
        })
          .done(function (data) {
            alert(`Culled ${data.culled} expired batch(es).`);
            loadSection(currentSection);
          })
          .fail(function () {
            alert('Failed to cull expired batches.');
          });
      });

    // ─── Purchase Order Handlers ────────────────────────────────────────────

    // New PO button (from list empty state or list header)
    $main
      .find('[data-action="new-po"]')
      .off('click')
      .on('click', function () {
        loadSection('purchase-orders/new');
      });

    // PO detail link
    $main
      .find('.po-detail-link')
      .off('click')
      .on('click', function (e) {
        e.preventDefault();
        loadPODetail($(this).data('id'));
      });

    // PO detail button
    $main
      .find('[data-action="po-detail"]')
      .off('click')
      .on('click', function () {
        loadPODetail($(this).data('id'));
      });

    // Back to PO list
    $main
      .find('[data-action="back-to-po-list"]')
      .off('click')
      .on('click', function () {
        loadSection('purchase-orders');
      });

    // Cancel back to PO list
    $main
      .find('[data-action="cancel-po"]')
      .off('click')
      .on('click', function () {
        loadSection('purchase-orders');
      });

    // PO status change (ordered / received / cancelled)
    $main
      .find('[data-action="po-status"]')
      .off('click')
      .on('click', function () {
        var id = $(this).data('id');
        var status = $(this).data('status');
        var labels = { ordered: 'Mark as Ordered', received: 'Mark as Received — this will add items to inventory', cancelled: 'Cancel this PO' };
        if (!confirm(labels[status] || `Update status to ${status}?`)) return;
        $.ajax({
          url: `/inventory/purchase-orders/${id}/status`,
          method: 'POST',
          contentType: 'application/json',
          headers: { 'X-CSRF-Token': csrfToken() },
          data: JSON.stringify({ status: status }),
        })
          .done(function () {
            if (currentSection.indexOf('purchase-orders') === 0) {
              loadSection(currentSection);
            } else {
              loadPODetail(id);
            }
          })
          .fail(function (xhr) {
            var msg = xhr.responseJSON ? xhr.responseJSON.error : 'Failed to update status.';
            alert(msg);
          });
      });

    // ─── PO Form Logic ─────────────────────────────────────────────────────

    var $poForm = $main.find('#po-form');
    if ($poForm.length) {
      initPOForm($poForm);
    }
  }

  // ─── PO Form ────────────────────────────────────────────────────────────────

  function initPOForm($form) {
    var suppliersData = JSON.parse($form.attr('data-suppliers') || '[]');
    var suppliesData = JSON.parse($form.attr('data-supplies') || '[]');
    var ingredientsData = JSON.parse($form.attr('data-ingredients') || '[]');

    // Populate supplier dropdown
    var $sup = $form.find('#po-supplier');
    suppliersData.forEach(function (s) {
      $sup.append(`<option value="${s._id}" data-name="${s.name.replace(/"/g, '&quot;')}">${s.name}</option>`);
    });
    $sup.on('change', function () {
      var name = $(this).find('option:selected').data('name') || '';
      $form.find('input[name="supplierName"]').val(name);
    });

    // Kind change → populate item select
    $form.on('change', '.po-item-kind', function () {
      var $row = $(this).closest('.po-item-row');
      populatePOItemSelect($row, $(this).val(), suppliesData, ingredientsData);
    });

    // Item select change → fill unit cost
    $form.on('change', '.po-item-ref', function () {
      var $row = $(this).closest('.po-item-row');
      var $opt = $(this).find('option:selected');
      $row.find('input[name$="[name]"]').val($opt.data('name') || '');
      $row.find('.po-item-cost').val($opt.data('cost') || '');
      recalcPO();
    });

    // Qty / cost input → recalc
    $form.on('input', '.po-item-qty, .po-item-cost', function () {
      recalcPO();
    });

    // Add row
    $form
      .find('[data-action="add-po-row"]')
      .off('click')
      .on('click', function () {
        var $container = $('#po-items-container');
        var $last = $container.find('.po-item-row').last();
        var $new = $last.clone();
        $new.find('input').val('');
        $new.find('select').prop('selectedIndex', 0);
        $new.find('.po-item-ref').html('<option value="">— Select kind first —</option>');
        $new.find('.po-item-total').val('—');
        $container.append($new);
        reindexPORows();
      });

    // Remove row
    $form.on('click', '[data-action="remove-po-row"]', function () {
      if ($('#po-items-container .po-item-row').length > 1) {
        $(this).closest('.po-item-row').remove();
        reindexPORows();
        recalcPO();
      }
    });

    // Submit
    $form.off('submit').on('submit', function (e) {
      e.preventDefault();
      submitPO($form);
    });
  }

  function populatePOItemSelect($row, kind, suppliesData, ingredientsData) {
    var $select = $row.find('.po-item-ref');
    var items = kind === 'supply' ? suppliesData : kind === 'ingredient' ? ingredientsData : [];
    var label = kind === 'supply' ? 'Supply' : kind === 'ingredient' ? 'Ingredient' : 'item';

    var html = `<option value="">— Select ${label} —</option>`;
    items.forEach(function (item) {
      var cost = kind === 'supply' ? item.costPerUnit || 0 : item.purchaseCost || 0;
      var unit = kind === 'supply' ? item.unit || '' : item.purchaseUnit || '';
      var lbl = item.name;
      if (unit) lbl += ` (${unit})`;
      html += `<option value="${item._id}" data-name="${item.name.replace(/"/g, '&quot;')}" data-cost="${cost}">${lbl}</option>`;
    });
    $select.html(html);
    $row.find('input[name$="[name]"]').val('');
    $row.find('.po-item-cost').val('');
    recalcPO();
  }

  function reindexPORows() {
    $('#po-items-container .po-item-row').each(function (idx) {
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

  function recalcPO() {
    var subtotal = 0;
    $('#po-items-container .po-item-row').each(function () {
      var qty = parseFloat($(this).find('.po-item-qty').val()) || 0;
      var cost = parseFloat($(this).find('.po-item-cost').val()) || 0;
      var lineTotal = qty * cost;
      $(this)
        .find('.po-item-total')
        .val(lineTotal > 0 ? `$${lineTotal.toFixed(2)}` : '—');
      subtotal += lineTotal;
    });
    $('#po-subtotal').val(`$${subtotal.toFixed(2)}`);
  }

  function submitPO($form) {
    // Sync supplier name
    var $sup = $form.find('#po-supplier option:selected');
    $form.find('input[name="supplierName"]').val($sup.data('name') || '');

    // Sync item names
    $form.find('.po-item-row').each(function () {
      var $opt = $(this).find('.po-item-ref option:selected');
      $(this)
        .find('input[name$="[name]"]')
        .val($opt.data('name') || '');
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

    items = items.filter(function (i) {
      return i && i.refId;
    });
    items.forEach(function (item) {
      if (item.quantity) item.quantity = parseFloat(item.quantity);
      if (item.unitCost) item.unitCost = parseFloat(item.unitCost);
    });

    formData.items = items;

    var csrf = $form.find('input[name="_csrf"]').val() || csrfToken();

    $.ajax({
      url: '/inventory/purchase-orders',
      method: 'POST',
      contentType: 'application/json',
      headers: { 'X-CSRF-Token': csrf },
      data: JSON.stringify(formData),
      success: function () {
        loadSection('purchase-orders');
      },
      error: function (xhr) {
        var msg = 'Failed to create purchase order';
        try {
          msg = JSON.parse(xhr.responseText).error || msg;
        } catch {
          /* ignore */
        }
        alert(msg);
      },
    });
  }

  // ─── Sidebar & Init ─────────────────────────────────────────────────────────

  $(document).ready(function () {
    loadSection('all');

    $(document).on('click', '.sidebar-link', function (e) {
      e.preventDefault();
      var action = $(this).data('action');
      if (action === 'sync') {
        syncFromOrders();
        return;
      }
      if (action === 'new-po') {
        loadSection('purchase-orders/new');
        return;
      }
      var section = $(this).data('section');
      if (section) loadSection(section);
    });
  });

  function syncFromOrders() {
    var $main = $('#main-content');
    $main.html('<div class="d-flex justify-content-center align-items-center py-5"><div class="spinner-border text-secondary" role="status"><span class="visually-hidden">Syncing...</span></div></div>');

    $.ajax({
      url: '/inventory/sync',
      method: 'POST',
      contentType: 'application/json',
      headers: { 'X-CSRF-Token': csrfToken() },
      data: '{}',
    })
      .done(function (data) {
        $main.html(`<div class="alert alert-success">Synced inventory from <strong>${data.ordersProcessed}</strong> completed order(s).</div>`);
        setTimeout(function () {
          loadSection(currentSection);
        }, 1500);
      })
      .fail(function () {
        $main.html('<div class="alert alert-danger">Failed to sync inventory.</div>');
      });
  }
})();
