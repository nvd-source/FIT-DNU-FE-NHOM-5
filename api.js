/* ========== api.js — Fetch API + CRUD MockAPI ========== */
/* YC2: fetch() + Promise .then/.catch | CRUD GET/POST/PUT/DELETE */

const API = {
  drinks:       'https://69fd352130ad0a6fd1c09382.mockapi.io/api/v1/drinks',
  tables:       'https://69fd352130ad0a6fd1c09382.mockapi.io/api/v1/tables',
  reservations: 'https://69fd35bc30ad0a6fd1c0972c.mockapi.io/api/v1/reservations'
};

/* ---- Generic async/await wrapper (dùng nội bộ) ---- */
async function apiFetch(url, options = {}) {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
  return res.json();
}

/* ---- Promise .then/.catch wrapper (YC2 – bắt buộc) ---- */
function apiFetchPromise(url, options = {}) {
  return fetch(url, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options
  })
    .then(function(res) {
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return res.json();
    })
    .catch(function(err) {
      console.error('[API Error]', url, err.message);
      throw err;
    });
}

// ===== DRINKS (async/await) =====
async function getDrinks()           { return apiFetch(API.drinks); }
async function getDrinkById(id)      { return apiFetch(API.drinks + '/' + id); }
async function createDrink(data)     { return apiFetch(API.drinks, { method:'POST', body:JSON.stringify(data) }); }
async function updateDrink(id, data) { return apiFetch(API.drinks + '/' + id, { method:'PUT', body:JSON.stringify(data) }); }
async function deleteDrink(id)       { return apiFetch(API.drinks + '/' + id, { method:'DELETE' }); }

// ===== TABLES (async/await) =====
async function getTables()           { return apiFetch(API.tables); }
async function getTableById(id)      { return apiFetch(API.tables + '/' + id); }
async function createTable(data)     { return apiFetch(API.tables, { method:'POST', body:JSON.stringify(data) }); }
async function updateTable(id, data) { return apiFetch(API.tables + '/' + id, { method:'PUT', body:JSON.stringify(data) }); }
async function deleteTable(id)       { return apiFetch(API.tables + '/' + id, { method:'DELETE' }); }

// ===== RESERVATIONS – dùng .then/.catch (YC2) =====
function getReservations() {
  return apiFetchPromise(API.reservations);
}
function getReservationById(id) {
  return apiFetchPromise(API.reservations + '/' + id);
}
function createReservation(data) {
  return apiFetchPromise(API.reservations, { method:'POST', body:JSON.stringify(data) });
}
function updateReservation(id, data) {
  return apiFetchPromise(API.reservations + '/' + id, { method:'PUT', body:JSON.stringify(data) });
}
function deleteReservation(id) {
  return apiFetchPromise(API.reservations + '/' + id, { method:'DELETE' });
}

// ===== jQuery AJAX (YC4 – bắt buộc) =====
function jqGetReservations(onSuccess, onError) {
  $.ajax({
    url: API.reservations,
    method: 'GET',
    dataType: 'json',
    success: onSuccess,
    error: function(xhr) { if (onError) onError(xhr.responseText); }
  });
}
function jqUpdateReservationStatus(id, status, onSuccess, onError) {
  $.ajax({
    url: API.reservations + '/' + id,
    method: 'PUT',
    contentType: 'application/json',
    data: JSON.stringify({ status: status }),
    success: onSuccess,
    error: function(xhr) { if (onError) onError(xhr.responseText); }
  });
}
// jQuery GET drinks – YC4
function jqGetDrinks(onSuccess, onError) {
  $.get(API.drinks)
    .done(onSuccess)
    .fail(function(xhr) { if (onError) onError(xhr.responseText); });
}