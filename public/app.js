const authSection = document.getElementById('auth-section');
const appSection = document.getElementById('app-section');
const authMessage = document.getElementById('authMessage');
const statusMessage = document.getElementById('statusMessage');

const tokenKey = 'hospital_app_token';

const getToken = () => localStorage.getItem(tokenKey);
const setToken = (t) => localStorage.setItem(tokenKey, t);
const removeToken = () => localStorage.removeItem(tokenKey);

let editPatientId = null;

const apiFetch = async (url, options = {}) => {
  const token = getToken();
  options.headers = {
    ...options.headers, 
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
  const response = await fetch(url, options);
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || response.statusText);
  }
  return response.json();
};

const safeSetStatus = (text, isError = false) => {
  if (statusMessage) {
    statusMessage.textContent = text;
    statusMessage.style.color = isError ? 'red' : 'green';
    setTimeout(() => (statusMessage.textContent = ''), 5000);
  }
};

const isAuthPage = () => window.location.pathname === '/';
const isPatientPage = () => window.location.pathname === '/patient-form';
const isBillingPage = () => window.location.pathname === '/billing-form';
const isPharmacyPage = () => window.location.pathname === '/pharmacy-form';
const isDashboardPage = () => window.location.pathname === '/dashboard';
const isDataPage = () => window.location.pathname === '/data';

const checkAuth = () => {
  const token = getToken();

  if (isAuthPage()) {
    if (token) {
      window.location.href = '/patient-form';
      return;
    }
    if (authSection) authSection.classList.remove('hidden');
    if (appSection) appSection.classList.add('hidden');
    return;
  }

  // For form pages, require login
  if (!token) {
    window.location.href = '/';
    return;
  }
  if (authSection) authSection.classList.add('hidden');
  if (appSection) appSection.classList.remove('hidden');
  loadData();
};

const loadData = () => {
  if (isPatientPage()) {
    loadPatients();
    return;
  }
  if (isBillingPage()) {
    loadBilling();
    return;
  }
  if (isPharmacyPage()) {
    loadPharmacy();
    return;
  }
  if (isDashboardPage()) {
    loadDashboard();
    return;
  }
};

const registerUser = async () => {
  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value.trim();
  if (!username || !password) return (authMessage.textContent = 'Enter both username and password.');
  try {
    await apiFetch('/auth/register', { method: 'POST', body: JSON.stringify({ username, password }) });
    authMessage.textContent = 'Registered successfully. Please login.';
  } catch (err) {
    authMessage.textContent = 'Error: ' + err.message;
  }
};

const loginUser = async () => {
  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value.trim();
  if (!username || !password) return (authMessage.textContent = 'Enter both username and password.');
  try {
    const data = await apiFetch('/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) });
    setToken(data.token);
    authMessage.textContent = 'Login successful';
    window.location.href = '/patient-form';
  } catch (err) {
    authMessage.textContent = 'Login failed: ' + err.message;
  }
};

const addPatient = async () => {
  const name = document.getElementById('patientName').value.trim();
  const age = Number(document.getElementById('patientAge').value);
  const phone = document.getElementById('patientPhone').value.trim();
  const problem = document.getElementById('patientProblem').value.trim();
  const notes = document.getElementById('patientNotes').value.trim();
  if (!name || !age || !phone || !problem) return safeSetStatus('Complete all patient fields', true);
  try {
    if (editPatientId) {
      console.log('Updating patient id:', editPatientId, 'with data:', { name, age, phone, problem, notes });
      // Update
      await apiFetch(`/patients/${editPatientId}`, { method: 'PUT', body: JSON.stringify({ name, age, phone, problem, notes }) });
      safeSetStatus('Patient updated');
      editPatientId = null;
      document.getElementById('addPatientBtn').textContent = 'Add Patient';
    } else {
      // Add
      await apiFetch('/patients', { method: 'POST', body: JSON.stringify({ name, age, phone, problem, notes }) });
      safeSetStatus('Patient added');
    }
    // Clear form
    document.getElementById('patientName').value = '';
    document.getElementById('patientAge').value = '';
    document.getElementById('patientPhone').value = '';
    document.getElementById('patientProblem').value = '';
    document.getElementById('patientNotes').value = '';
    if (isPatientPage()) {
      window.location.href = '/billing-form';
      return;
    }
    loadPatients();
  } catch (err) {
    console.error('Patient save failed:', err.message);
    safeSetStatus('Patient save failed: ' + err.message, true);
  }
};

const loadSampleData = async () => {
  try {
    await apiFetch('/sample-data', { method: 'POST' });
    safeSetStatus('Sample patients added');
    loadPatients();
  } catch (err) {
    safeSetStatus('Load sample failed: ' + err.message, true);
  }
};

const loadPatients = async () => {
  console.log('Loading patients...');
  const token = getToken();
  if (!token) {
    console.log('No token found, please login');
    safeSetStatus('Please login first', true);
    return;
  }
  try {
    const patients = await apiFetch('/patients', { method: 'GET' });
    console.log('Patients loaded:', patients);
    const tbody = document.querySelector('#patientsTable tbody');
    tbody.innerHTML = '';
    patients.forEach((p) => {
      const tr = document.createElement('tr');
      if (isDataPage()) {
        tr.innerHTML = `<td>${p.name}</td><td>${p.age}</td><td>${p.phone}</td><td>${p.problem}</td><td>${p.doctorType || ''}</td><td>${p.feeType || ''}</td><td>${p.fees || ''}</td>`;
      } else {
        tr.innerHTML = `<td>${p.name}</td><td>${p.age}</td><td>${p.phone}</td><td>${p.problem}</td><td>${p.doctorType || ''}</td><td>${p.feeType || ''}</td><td>${p.fees || ''}</td><td><button data-id="${p._id}" class="editPatientBtn">Edit</button> <button data-id="${p._id}" class="deletePatientBtn">Delete</button></td>`;
      }
      tbody.appendChild(tr);
    });
    if (!isDataPage()) {
      document.querySelectorAll('.deletePatientBtn').forEach((btn) => {
        btn.addEventListener('click', async () => {
          console.log('Delete button clicked for id:', btn.dataset.id);
          const id = btn.dataset.id;
          try {
            await apiFetch(`/patients/${id}`, { method: 'DELETE' });
            safeSetStatus('Patient deleted');
            loadPatients();
          } catch (err) {
            console.error('Delete failed:', err.message);
            safeSetStatus('Delete failed: ' + err.message, true);
          }
        });
      });
      document.querySelectorAll('.editPatientBtn').forEach((btn) => {
        btn.addEventListener('click', () => {
          const id = btn.dataset.id;
          const patient = patients.find(p => p._id === id);
          if (patient) {
            document.getElementById('patientName').value = patient.name;
            document.getElementById('patientAge').value = patient.age;
            document.getElementById('patientPhone').value = patient.phone;
            document.getElementById('patientProblem').value = patient.problem;
            document.getElementById('patientNotes').value = patient.notes || '';
            editPatientId = id;
            document.getElementById('addPatientBtn').textContent = 'Update Patient';
          }
        });
      });
    }
  } catch (err) {
    console.error('Fetch patients failed:', err.message);
    safeSetStatus('Fetch patients failed: ' + err.message, true);
  }
};

const addBilling = async () => {
  const patientId = document.getElementById('billingPatientId').value.trim();
  const amount = Number(document.getElementById('billingAmount').value);
  const description = document.getElementById('billingDescription').value.trim();
  if (!patientId || !amount) return safeSetStatus('PatientId and amount required', true);
  try {
    await apiFetch('/billing', { method: 'POST', body: JSON.stringify({ patientId, amount, description }) });
    safeSetStatus('Billing saved');
    loadBilling();
  } catch (err) {
    safeSetStatus('Billing failed: ' + err.message, true);
    return;
  }
  if (isBillingPage()) {
    window.location.href = '/pharmacy-form';
    return;
  }
};

const loadBilling = async () => {
  console.log('Loading billing...');
  const token = getToken();
  if (!token) {
    console.log('No token found, please login');
    safeSetStatus('Please login first', true);
    return;
  }
  try {
    const bills = await apiFetch('/billing', { method: 'GET' });
    console.log('Billing loaded:', bills);
    const list = document.getElementById('billingList');
    list.innerHTML = '';
    bills.forEach((b) => {
      const li = document.createElement('li');
      li.textContent = `${b.patientId?.name || 'Unknown'}: ${b.amount} (${b.description || 'no desc'})`;
      const del = document.createElement('button');
      del.textContent = 'Delete';
      del.addEventListener('click', async () => {
        console.log('Delete billing clicked for id:', b._id);
        try {
          await apiFetch(`/billing/${b._id}`, { method: 'DELETE' });
          loadBilling();
        } catch (err) {
          console.error('Delete billing failed:', err.message);
          safeSetStatus('Delete billing failed: ' + err.message, true);
        }
      });
      li.appendChild(del);
      list.appendChild(li);
    });
  } catch (err) {
    console.error('Load billing failed:', err.message);
    safeSetStatus('Load billing failed: ' + err.message, true);
  }
};

const addPharmacy = async () => {
  const patientId = document.getElementById('pharmacyPatientId').value.trim();
  const medicine = document.getElementById('pharmacyMedicine').value.trim();
  const dose = document.getElementById('pharmacyDose').value.trim();
  const instructions = document.getElementById('pharmacyInstructions').value.trim();
  if (!patientId || !medicine || !dose) return safeSetStatus('PatientId, medicine and dose required', true);
  try {
    await apiFetch('/pharmacy', { method: 'POST', body: JSON.stringify({ patientId, medicine, dose, instructions }) });
    safeSetStatus('Pharmacy record saved');
    loadPharmacy();
  } catch (err) {
    safeSetStatus('Pharmacy failed: ' + err.message, true);
    return;
  }
  if (isPharmacyPage()) {
    window.location.href = '/data';
    return;
  }
};

const loadPharmacy = async () => {
  console.log('Loading pharmacy...');
  const token = getToken();
  if (!token) {
    console.log('No token found, please login');
    safeSetStatus('Please login first', true);
    return;
  }
  try {
    const data = await apiFetch('/pharmacy', { method: 'GET' });
    console.log('Pharmacy loaded:', data);
    const list = document.getElementById('pharmacyList');
    list.innerHTML = '';
    data.forEach((row) => {
      const li = document.createElement('li');
      li.textContent = `${row.patientId?.name || 'Unknown'}: ${row.medicine} (${row.dose})`;
      const del = document.createElement('button');
      del.textContent = 'Delete';
      del.addEventListener('click', async () => {
        console.log('Delete pharmacy clicked for id:', row._id);
        try {
          await apiFetch(`/pharmacy/${row._id}`, { method: 'DELETE' });
          loadPharmacy();
        } catch (err) {
          console.error('Delete pharmacy failed:', err.message);
          safeSetStatus('Delete pharmacy failed: ' + err.message, true);
        }
      });
      li.appendChild(del);
      list.appendChild(li);
    });
  } catch (err) {
    console.error('Load pharmacy failed:', err.message);
    safeSetStatus('Load pharmacy failed: ' + err.message, true);
  }
};

const loadDashboard = async () => {
  try {
    const [patients, bills, pharmacy] = await Promise.all([
      apiFetch('/patients', { method: 'GET' }),
      apiFetch('/billing', { method: 'GET' }),
      apiFetch('/pharmacy', { method: 'GET' }),
    ]);

    const safeNumber = (arr) => (Array.isArray(arr) ? arr.length : 0);
    const patientsCount = safeNumber(patients);
    const billingCount = safeNumber(bills);
    const pharmacyCount = safeNumber(pharmacy);

    const totalPatientsEl = document.getElementById('totalPatients');
    const totalBillingEl = document.getElementById('totalBilling');
    const totalPharmacyEl = document.getElementById('totalPharmacy');

    if (totalPatientsEl) totalPatientsEl.textContent = patientsCount;
    if (totalBillingEl) totalBillingEl.textContent = billingCount;
    if (totalPharmacyEl) totalPharmacyEl.textContent = pharmacyCount;

    safeSetStatus('Dashboard metrics updated.');
  } catch (err) {
    console.error('Load dashboard failed:', err.message);
    safeSetStatus('Load dashboard failed: ' + err.message, true);
  }
};

const logout = () => {
  removeToken();
  checkAuth();
};

if (document.getElementById('registerBtn')) document.getElementById('registerBtn').addEventListener('click', registerUser);
if (document.getElementById('loginBtn')) document.getElementById('loginBtn').addEventListener('click', loginUser);
if (document.getElementById('addPatientBtn')) document.getElementById('addPatientBtn').addEventListener('click', addPatient);
if (document.getElementById('refreshPatientsBtn')) document.getElementById('refreshPatientsBtn').addEventListener('click', loadPatients);
if (document.getElementById('loadSampleBtn')) document.getElementById('loadSampleBtn').addEventListener('click', loadSampleData);
if (document.getElementById('addBillingBtn')) document.getElementById('addBillingBtn').addEventListener('click', addBilling);
if (document.getElementById('refreshBillingBtn')) document.getElementById('refreshBillingBtn').addEventListener('click', loadBilling);
if (document.getElementById('addPharmacyBtn')) document.getElementById('addPharmacyBtn').addEventListener('click', addPharmacy);
if (document.getElementById('refreshPharmacyBtn')) document.getElementById('refreshPharmacyBtn').addEventListener('click', loadPharmacy);
if (document.getElementById('refreshDashboardBtn')) document.getElementById('refreshDashboardBtn').addEventListener('click', loadDashboard);
if (document.getElementById('tabPatients')) document.getElementById('tabPatients').addEventListener('click', () => showDataPanel('patients'));
if (document.getElementById('tabBilling')) document.getElementById('tabBilling').addEventListener('click', () => showDataPanel('billing'));
if (document.getElementById('tabPharmacy')) document.getElementById('tabPharmacy').addEventListener('click', () => showDataPanel('pharmacy'));
if (document.getElementById('logoutBtn')) document.getElementById('logoutBtn').addEventListener('click', logout);

checkAuth();

checkAuth();