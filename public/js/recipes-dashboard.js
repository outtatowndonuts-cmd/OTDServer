(function () {
  var app = document.getElementById('recipes-app');
  if (!app) return;

  var mainContent = document.getElementById('main-content');
  var currentSection = 'ingredients';

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
    mainContent.innerHTML = '<div class="d-flex justify-content-center align-items-center py-5">' + '<div class="spinner-border text-secondary" role="status">' + '<span class="visually-hidden">Loading...</span></div></div>';
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
      }
    });
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
      });
    });

    // Dynamic row: Remove Row buttons
    mainContent.querySelectorAll('[data-action="remove-row"]').forEach(function (btn) {
      var container = btn.closest('#ingredient-rows, #component-rows');
      if (container) attachRowBtn(btn, container);
    });

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
