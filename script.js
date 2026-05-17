/**
 * SpendWise Ultimate - Core Logic
 */

// --- State Management ---
let state = {
    user: null,
    transactions: [],
    budgetLimit: 0,
    savingsGoal: { name: "General Savings", target: 0 },
    currency: "USD",
    theme: "light",
    categories: {
        Food: { icon: "fa-utensils", color: "#f39c12" },
        Transport: { icon: "fa-car", color: "#3498db" },
        Entertainment: { icon: "fa-film", color: "#9b59b6" },
        Education: { icon: "fa-graduation-cap", color: "#1abc9c" },
        Shopping: { icon: "fa-shopping-bag", color: "#e67e22" },
        Salary: { icon: "fa-money-bill-wave", color: "#2ecc71" },
        Health: { icon: "fa-heartbeat", color: "#e74c3c" },
        Bills: { icon: "fa-file-invoice-dollar", color: "#34495e" },
        Freelance: { icon: "fa-laptop-code", color: "#8e44ad" },
        Investments: { icon: "fa-chart-line", color: "#27ae60" },
        Bonus: { icon: "fa-gift", color: "#e91e63" },
        "Other Income": { icon: "fa-hand-holding-usd", color: "#7f8c8d" },
        "Other Expense": { icon: "fa-receipt", color: "#95a5a6" },
        Other: { icon: "fa-ellipsis-h", color: "#95a5a6" }
    }
};

// --- Selectors ---
const elements = {
    sidebarLinks: document.querySelectorAll('.sidebar-nav .nav-link'),
    sections: document.querySelectorAll('.content-section'),
    sidebarToggle: document.getElementById('sidebarToggle'),
    sidebar: document.getElementById('sidebar'),
    themeToggle: document.getElementById('themeToggle'),
    darkModeSwitch: document.getElementById('darkModeSwitch'),
    currencySetting: document.getElementById('currencySetting'),
    transactionForm: document.getElementById('transactionForm'),
    budgetForm: document.getElementById('budgetForm'),
    profileForm: document.getElementById('profileForm'),
    savingsForm: document.getElementById('savingsForm'),
    totalBalanceDisplay: document.getElementById('totalBalanceDisplay'),
    totalIncomeDisplay: document.getElementById('totalIncomeDisplay'),
    totalExpensesDisplay: document.getElementById('totalExpensesDisplay'),
    recentTransactionsTable: document.getElementById('recentTransactionsTableBody'),
    allTransactionsTable: document.getElementById('allTransactionsTableBody'),
    emptyStateDashboard: document.getElementById('emptyStateDashboard'),
    emptyStateTransactions: document.getElementById('emptyStateTransactions'),
    transactionSearch: document.getElementById('transactionSearch'),
    categoryFilter: document.getElementById('categoryFilter'),
    currentDateDisplay: document.getElementById('currentDateDisplay'),
    clearAllDataBtn: document.getElementById('clearAllDataBtn'),
    exportBtn: document.getElementById('exportBtn'),
    loginForm: document.getElementById('loginForm'),
    passwordToggle: document.getElementById('passwordToggle'),
    landingPage: document.getElementById('landing-page'),
    loginPage: document.getElementById('login-page'),
    appWrapper: document.getElementById('app-wrapper')
};

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    loadFromLocalStorage();
    initApp();
    setupEventListeners();
});

function initApp() {
    if (!state.user) {
        showLanding();
    } else {
        showDashboard();
    }

    updateDateDisplay();
    renderDashboard();
    renderTransactions();
    applyTheme();
    updateCurrencySymbols();
    syncProfileModal();
    updateCategoryOptions();
}

function syncProfileModal() {
    // Sync settings modal
    elements.darkModeSwitch.checked = state.theme === 'dark';
    elements.currencySetting.value = state.currency;
    if (state.user) {
        document.getElementById('profileName').value = state.user.name || '';
        document.getElementById('profileBudget').value = state.budgetLimit || '';
        document.getElementById('profileModalAvatar').src = state.user.avatar;
    }
}

// --- Event Listeners ---
function setupEventListeners() {
    // Navigation
    elements.sidebarLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            if (link.id === 'exportBtn') return;
            e.preventDefault();
            const sectionId = link.getAttribute('data-section');
            showSection(sectionId);
            
            // Mobile sidebar auto-close
            if (window.innerWidth < 992) {
                elements.sidebar.classList.remove('show');
            }
        });
    });

    elements.sidebarToggle.addEventListener('click', () => {
        elements.sidebar.classList.toggle('show');
    });

    // Theme Toggle
    elements.themeToggle.addEventListener('click', toggleTheme);
    elements.darkModeSwitch.addEventListener('change', toggleTheme);

    // Transaction CRUD
    elements.transactionForm.addEventListener('submit', handleTransactionSubmit);
    document.getElementById('transType').addEventListener('change', updateCategoryOptions);
    
    // Search and Filter
    elements.transactionSearch.addEventListener('input', renderTransactions);
    elements.categoryFilter.addEventListener('change', renderTransactions);

    // Budget & Savings
    elements.budgetForm.addEventListener('submit', (e) => {
        e.preventDefault();
        state.budgetLimit = parseFloat(document.getElementById('budgetLimitInput').value);
        saveToLocalStorage();
        showToast('Budget updated successfully!', 'success');
        renderDashboard();
    });

    elements.savingsForm.addEventListener('submit', (e) => {
        e.preventDefault();
        state.savingsGoal = {
            name: document.getElementById('savingsGoalName').value,
            target: parseFloat(document.getElementById('savingsTargetAmount').value)
        };
        saveToLocalStorage();
        showToast('Savings goal updated!', 'success');
        renderDashboard();
    });

    // Settings/Profile
    if (elements.profileForm) {
        elements.profileForm.addEventListener('submit', handleProfileUpdate);
    }

    const avatarUpload = document.getElementById('avatarUpload');
    if (avatarUpload) {
        avatarUpload.addEventListener('change', handleAvatarUpload);
    }

    const themeOptions = document.querySelectorAll('.theme-option');
    themeOptions.forEach(opt => {
        opt.addEventListener('click', () => {
            const color = opt.getAttribute('data-color');
            updateAvatarColor(color);
        });
    });

    elements.currencySetting.addEventListener('change', (e) => {
        state.currency = e.target.value;
        saveToLocalStorage();
        updateCurrencySymbols();
        renderDashboard();
        renderTransactions();
    });

    elements.clearAllDataBtn.addEventListener('click', () => {
        if (confirm('Are you absolutely sure you want to clear all data? This cannot be undone.')) {
            localStorage.clear();
            location.reload();
        }
    });

    // Export
    elements.exportBtn.addEventListener('click', exportCSV);

    // Login logic
    if (elements.loginForm) {
        elements.loginForm.addEventListener('submit', handleLogin);
    }
    if (elements.passwordToggle) {
        elements.passwordToggle.addEventListener('click', togglePasswordVisibility);
    }
}

// --- Core Functions ---

function handleProfileUpdate(e) {
    e.preventDefault();
    if (!state.user) return;

    state.user.name = document.getElementById('profileName').value;
    state.budgetLimit = parseFloat(document.getElementById('profileBudget').value) || 0;
    state.currency = elements.currencySetting.value;

    saveToLocalStorage();
    updateCurrencySymbols();
    renderDashboard();
    renderTransactions();
    showDashboard(); // Refresh profile icon in navbar

    bootstrap.Modal.getInstance(document.getElementById('settingsModal')).hide();
    showToast('Profile updated successfully!', 'success');
}

function handleAvatarUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
        const avatarUrl = event.target.result;
        state.user.avatar = avatarUrl;
        document.getElementById('profileModalAvatar').src = avatarUrl;
        saveToLocalStorage();
        showDashboard(); // Refresh profile icon in navbar
    };
    reader.readAsDataURL(file);
}

function updateAvatarColor(color) {
    if (!state.user) return;
    const name = state.user.name || 'User';
    const avatarUrl = `https://ui-avatars.com/api/?name=${name}&background=${color}&color=fff`;
    state.user.avatar = avatarUrl;
    document.getElementById('profileModalAvatar').src = avatarUrl;
    saveToLocalStorage();
    showDashboard(); // Refresh profile icon in navbar
}

function handleLogin(e) {
    e.preventDefault();
    const form = e.target;

    const emailInput = document.getElementById('loginEmail');
    const passwordInput = document.getElementById('loginPassword');

    const email = emailInput.value.trim();
    const password = passwordInput.value;

    // Custom validation for whitespace-only
    if (email.length === 0) {
        emailInput.setCustomValidity('Email cannot be empty or just whitespace');
    } else {
        emailInput.setCustomValidity('');
    }

    if (!form.checkValidity()) {
        e.stopPropagation();
        form.classList.add('was-validated');
        return;
    }

    // Simulate login
    state.user = {
        email: email,
        name: email.split('@')[0],
        avatar: `https://ui-avatars.com/api/?name=${email.split('@')[0]}&background=4f46e5&color=fff`
    };

    saveToLocalStorage();
    showDashboard();
    showToast(`Welcome back, ${state.user.name}!`, 'success');
}

function logout() {
    state.user = null;
    saveToLocalStorage();
    location.reload();
}

function continueAsGuest() {
    state.user = {
        email: 'guest@example.com',
        name: 'Guest',
        avatar: 'https://ui-avatars.com/api/?name=Guest&background=64748b&color=fff'
    };
    saveToLocalStorage();
    showDashboard();
    showToast('Continuing as Guest', 'primary');
}

function togglePasswordVisibility() {
    const passInput = document.getElementById('loginPassword');
    const icon = elements.passwordToggle.querySelector('i');
    if (passInput.type === 'password') {
        passInput.type = 'text';
        icon.className = 'fas fa-eye-slash text-muted';
    } else {
        passInput.type = 'password';
        icon.className = 'fas fa-eye text-muted';
    }
}

function updateCategoryOptions() {
    const type = document.getElementById('transType').value;
    const categorySelect = document.getElementById('transCategory');
    const incomeCategories = ['Salary', 'Freelance', 'Investments', 'Bonus', 'Other Income'];
    const expenseCategories = ['Food', 'Transport', 'Entertainment', 'Education', 'Shopping', 'Health', 'Bills', 'Other Expense'];

    const categories = type === 'income' ? incomeCategories : expenseCategories;

    categorySelect.innerHTML = categories.map(cat => `<option value="${cat}">${cat}</option>`).join('');
}

function handleTransactionSubmit(e) {
    e.preventDefault();

    const dateInput = document.getElementById('transDate');
    const selectedDate = new Date(dateInput.value);
    const selectedYear = selectedDate.getFullYear();
    const currentYear = new Date().getFullYear();

    // Validation: Year between 2020 and current year + 1
    if (selectedYear < 2020 || selectedYear > currentYear + 1) {
        dateInput.setCustomValidity(`Please select a year between 2020 and ${currentYear + 1}`);
        dateInput.reportValidity();
        return;
    } else {
        dateInput.setCustomValidity('');
    }

    const id = document.getElementById('transactionId').value;
    const transaction = {
        id: id || Date.now().toString(),
        name: document.getElementById('transName').value,
        amount: parseFloat(document.getElementById('transAmount').value),
        type: document.getElementById('transType').value,
        category: document.getElementById('transCategory').value,
        date: document.getElementById('transDate').value,
        note: document.getElementById('transNote').value,
        timestamp: new Date().toISOString()
    };

    if (id) {
        const index = state.transactions.findIndex(t => t.id === id);
        state.transactions[index] = transaction;
        showToast('Transaction updated!', 'success');
    } else {
        state.transactions.unshift(transaction);
        showToast('Transaction added!', 'success');
    }

    saveToLocalStorage();
    elements.transactionForm.reset();
    bootstrap.Modal.getInstance(document.getElementById('addTransactionModal')).hide();
    
    renderDashboard();
    renderTransactions();
}

let transactionToDelete = null;

function deleteTransaction(id) {
    transactionToDelete = id;
    const modal = new bootstrap.Modal(document.getElementById('deleteConfirmModal'));
    modal.show();
}

document.getElementById('confirmDeleteBtn').addEventListener('click', () => {
    if (transactionToDelete) {
        state.transactions = state.transactions.filter(t => t.id !== transactionToDelete);
        saveToLocalStorage();
        renderDashboard();
        renderTransactions();
        showToast('Transaction deleted', 'danger');
        transactionToDelete = null;
        bootstrap.Modal.getInstance(document.getElementById('deleteConfirmModal')).hide();
    }
});

function editTransaction(id) {
    const t = state.transactions.find(t => t.id === id);
    if (!t) return;

    document.getElementById('transactionId').value = t.id;
    document.getElementById('transName').value = t.name;
    document.getElementById('transAmount').value = t.amount;
    document.getElementById('transType').value = t.type;
    document.getElementById('transCategory').value = t.category;
    document.getElementById('transDate').value = t.date;
    document.getElementById('transNote').value = t.note;
    document.getElementById('modalTitle').innerText = 'Edit Transaction';

    const modal = new bootstrap.Modal(document.getElementById('addTransactionModal'));
    modal.show();
}

// --- Rendering Functions ---

function renderDashboard() {
    const totals = calculateTotals();
    
    animateNumber('totalBalanceDisplay', totals.balance);
    animateNumber('totalIncomeDisplay', totals.income);
    animateNumber('totalExpensesDisplay', totals.expenses);
    
    renderRecentTransactions();
    updateBudgetProgress();
    updateSavingsGoal();
    updateHealthScore();
    updateSmartInsights();
    if (typeof updateCharts === 'function') updateCharts();
}

function renderRecentTransactions() {
    const recent = state.transactions.slice(0, 5);
    elements.recentTransactionsTable.innerHTML = '';
    
    if (recent.length === 0) {
        elements.emptyStateDashboard.classList.remove('d-none');
    } else {
        elements.emptyStateDashboard.classList.add('d-none');
        recent.forEach(t => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td class="px-4">
                    <div class="d-flex align-items-center">
                        <div class="icon-shape bg-light text-muted rounded-circle p-2 me-3">
                            <i class="fas ${state.categories[t.category].icon}"></i>
                        </div>
                        <span class="fw-500">${t.name}</span>
                    </div>
                </td>
                <td><span class="badge-category" style="background-color: ${state.categories[t.category].color}20; color: ${state.categories[t.category].color}">${t.category}</span></td>
                <td><small class="text-muted">${formatDateHuman(t.date)}</small></td>
                <td class="text-end px-4 fw-bold ${t.type === 'income' ? 'text-success' : 'text-danger'}">
                    ${t.type === 'income' ? '+' : '-'}${formatCurrency(t.amount)}
                </td>
            `;
            elements.recentTransactionsTable.appendChild(row);
        });
    }
}

function renderTransactions() {
    const searchTerm = elements.transactionSearch.value.toLowerCase();
    const categoryFilter = elements.categoryFilter.value;
    
    const filtered = state.transactions.filter(t => {
        const matchesSearch = t.name.toLowerCase().includes(searchTerm) || t.note.toLowerCase().includes(searchTerm);
        const matchesCategory = categoryFilter === 'all' || t.category === categoryFilter;
        return matchesSearch && matchesCategory;
    });

    elements.allTransactionsTable.innerHTML = '';
    
    if (filtered.length === 0) {
        elements.emptyStateTransactions.classList.remove('d-none');
    } else {
        elements.emptyStateTransactions.classList.add('d-none');
        filtered.forEach(t => {
            const row = document.createElement('tr');
            row.className = `transaction-${t.type}`;
            row.innerHTML = `
                <td class="px-4">
                    <div class="fw-600">${t.name}</div>
                    <small class="text-muted d-block">${t.note || ''}</small>
                </td>
                <td><span class="badge-category" style="background-color: ${state.categories[t.category].color}20; color: ${state.categories[t.category].color}">${t.category}</span></td>
                <td>${formatDateHuman(t.date)}</td>
                <td><span class="text-capitalize small fw-bold">${t.type}</span></td>
                <td class="text-end fw-bold ${t.type === 'income' ? 'text-success' : 'text-danger'}">
                    ${t.type === 'income' ? '+' : '-'}${formatCurrency(t.amount)}
                </td>
                <td class="text-center px-4">
                    <button class="btn btn-sm btn-light rounded-pill me-1" onclick="editTransaction('${t.id}')"><i class="fas fa-edit"></i></button>
                    <button class="btn btn-sm btn-light rounded-pill text-danger" onclick="deleteTransaction('${t.id}')"><i class="fas fa-trash"></i></button>
                </td>
            `;
            elements.allTransactionsTable.appendChild(row);
        });
    }
}

// --- Helper Functions ---

function calculateTotals() {
    return state.transactions.reduce((acc, t) => {
        if (t.type === 'income') {
            acc.income += t.amount;
            acc.balance += t.amount;
        } else {
            acc.expenses += t.amount;
            acc.balance -= t.amount;
        }
        return acc;
    }, { income: 0, expenses: 0, balance: 0 });
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: state.currency
    }).format(amount);
}

function formatDateHuman(dateStr) {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function updateDateDisplay() {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    elements.currentDateDisplay.innerText = new Date().toLocaleDateString('en-US', options);
}

function showSection(sectionId) {
    elements.sections.forEach(s => s.classList.add('d-none'));
    elements.sidebarLinks.forEach(l => l.classList.remove('active'));
    
    document.getElementById(`${sectionId}-section`).classList.remove('d-none');
    document.querySelector(`[data-section="${sectionId}"]`).classList.add('active');
    
    if (sectionId === 'analytics') renderAnalytics();
    if (sectionId === 'budget') renderBudgetSection();
}

function toggleTheme() {
    state.theme = state.theme === 'light' ? 'dark' : 'light';
    applyTheme();
    saveToLocalStorage();
    elements.darkModeSwitch.checked = state.theme === 'dark';
}

function applyTheme() {
    document.body.setAttribute('data-theme', state.theme);
    const moonIcon = elements.themeToggle.querySelector('i');
    if (moonIcon) {
        moonIcon.className = state.theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
    }

    // Update Chart.js defaults for dark mode
    if (typeof Chart !== 'undefined') {
        Chart.defaults.color = state.theme === 'dark' ? '#94a3b8' : '#666';
        Chart.defaults.scale.grid.color = state.theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
        updateCharts();
    }
}

function updateCurrencySymbols() {
    const symbol = state.currency === 'USD' ? '$' : state.currency === 'EUR' ? '€' : 'Br';
    document.querySelectorAll('.currency-symbol').forEach(el => el.innerText = symbol);
}

function saveToLocalStorage() {
    localStorage.setItem('spendwise_state', JSON.stringify(state));
}

function loadFromLocalStorage() {
    const saved = localStorage.getItem('spendwise_state');
    if (saved) {
        state = { ...state, ...JSON.parse(saved) };
    }
}

function animateNumber(id, endValue) {
    const obj = document.getElementById(id);
    const startValue = 0;
    const duration = 1000;
    let startTimestamp = null;
    
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        const current = progress * (endValue - startValue) + startValue;
        obj.innerHTML = formatCurrency(current);
        if (progress < 1) {
            window.requestAnimationFrame(step);
        }
    };
    window.requestAnimationFrame(step);
}

function showToast(message, type = 'primary') {
    const container = document.querySelector('.toast-container');
    const toastEl = document.createElement('div');
    toastEl.className = `toast align-items-center text-white bg-${type} border-0 show`;
    toastEl.innerHTML = `
        <div class="d-flex">
            <div class="toast-body">${message}</div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
        </div>
    `;
    container.appendChild(toastEl);
    setTimeout(() => {
        toastEl.classList.remove('show');
        setTimeout(() => toastEl.remove(), 500);
    }, 3000);
}

// Global exposure for onclick handlers
window.editTransaction = editTransaction;
window.deleteTransaction = deleteTransaction;
window.showSection = showSection;
window.showLogin = showLogin;
window.showLanding = showLanding;
window.logout = logout;
window.continueAsGuest = continueAsGuest;

function showLanding() {
    elements.landingPage.classList.remove('d-none');
    elements.loginPage.classList.add('d-none');
    elements.appWrapper.classList.add('d-none');
}

function showLogin() {
    elements.landingPage.classList.add('d-none');
    elements.loginPage.classList.remove('d-none');
    elements.appWrapper.classList.add('d-none');
}

function showDashboard() {
    elements.landingPage.classList.add('d-none');
    elements.loginPage.classList.add('d-none');
    elements.appWrapper.classList.remove('d-none');
    if (state.user) {
        const profileImg = document.querySelector('#userProfile img');
        if (profileImg) profileImg.src = state.user.avatar;
        const navName = document.getElementById('navbarUserName');
        if (navName) navName.innerText = state.user.name;
    }
}

// --- Dashboard, Charts & Goals Logic ---

let charts = {};

function updateCharts() {
    renderSpendingTrendsChart();
    renderCategoryChart();
    renderIncomeVsExpenseChart();
}

function renderSpendingTrendsChart() {
    const ctx = document.getElementById('spendingTrendsChart');
    if (!ctx) return;

    if (charts.trends) charts.trends.destroy();

    const last7Days = [...Array(7)].map((_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - i);
        return d.toISOString().split('T')[0];
    }).reverse();

    const data = last7Days.map(date => {
        return state.transactions
            .filter(t => t.date === date && t.type === 'expense')
            .reduce((sum, t) => sum + t.amount, 0);
    });

    charts.trends = new Chart(ctx, {
        type: 'line',
        data: {
            labels: last7Days.map(d => formatDateHuman(d)),
            datasets: [{
                label: 'Expenses',
                data: data,
                borderColor: '#4f46e5',
                backgroundColor: 'rgba(79, 70, 229, 0.1)',
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: { beginAtZero: true, grid: { display: false } },
                x: { grid: { display: false } }
            }
        }
    });
}

function renderCategoryChart() {
    const ctx = document.getElementById('categoryChart');
    if (!ctx) return;
    if (charts.category) charts.category.destroy();

    const categoryData = {};
    state.transactions.filter(t => t.type === 'expense').forEach(t => {
        categoryData[t.category] = (categoryData[t.category] || 0) + t.amount;
    });

    const labels = Object.keys(categoryData);
    const data = Object.values(categoryData);
    const colors = labels.map(l => state.categories[l].color);

    charts.category = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: colors,
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { position: 'bottom' } }
        }
    });
}

function renderIncomeVsExpenseChart() {
    const ctx = document.getElementById('incomeVsExpenseChart');
    if (!ctx) return;
    if (charts.comparison) charts.comparison.destroy();

    const totals = calculateTotals();

    charts.comparison = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Income', 'Expenses'],
            datasets: [{
                data: [totals.income, totals.expenses],
                backgroundColor: ['#2ecc71', '#e74c3c'],
                borderRadius: 10
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: { beginAtZero: true },
                x: { grid: { display: false } }
            }
        }
    });
}

function updateBudgetProgress() {
    const container = document.getElementById('budgetProgressContainer');
    if (!container) return;

    const totals = calculateTotals();
    const spent = totals.expenses;
    const limit = state.budgetLimit || 1; // Avoid division by zero
    const percent = Math.min((spent / limit) * 100, 100);
    
    let colorClass = 'bg-success';
    if (percent > 70) colorClass = 'bg-warning';
    if (percent > 90) colorClass = 'bg-danger';

    container.innerHTML = `
        <div class="d-flex justify-content-between mb-2">
            <span class="small fw-600">Monthly Budget</span>
            <span class="small text-muted">${formatCurrency(spent)} / ${formatCurrency(state.budgetLimit)}</span>
        </div>
        <div class="progress" style="height: 10px;">
            <div class="progress-bar ${colorClass}" role="progressbar" style="width: ${percent}%"></div>
        </div>
        <p class="small text-muted mt-2 mb-0">
            ${percent >= 100 ? '<span class="text-danger fw-bold">Budget Exceeded!</span>' : `${formatCurrency(state.budgetLimit - spent)} remaining`}
        </p>
    `;

    if (spent > state.budgetLimit && state.budgetLimit > 0) {
        showToast('Monthly budget exceeded!', 'danger');
    }
}

function updateSavingsGoal() {
    const circle = document.getElementById('savingsCircle');
    const text = document.getElementById('savingsPercentText');
    const title = document.getElementById('savingsGoalTitle');
    const status = document.getElementById('savingsGoalStatus');

    if (!circle) return;

    const totals = calculateTotals();
    const balance = Math.max(0, totals.balance);
    const target = state.savingsGoal.target || 1;
    const percent = Math.min((balance / target) * 100, 100);

    circle.style.background = `conic-gradient(var(--primary-color) ${percent}%, #e9ecef 0%)`;
    text.innerText = `${Math.round(percent)}%`;
    title.innerText = state.savingsGoal.name;
    status.innerText = `${formatCurrency(balance)} / ${formatCurrency(state.savingsGoal.target)} saved`;
}

function updateHealthScore() {
    const display = document.getElementById('healthScoreDisplay');
    if (!display) return;

    const totals = calculateTotals();
    let score = 0;

    // 1. Savings Ratio (40 points)
    const savingsRatio = totals.income > 0 ? (totals.balance / totals.income) : 0;
    score += Math.min(Math.max(savingsRatio * 100, 0), 40);

    // 2. Budget Discipline (30 points)
    if (state.budgetLimit > 0) {
        const budgetUsage = totals.expenses / state.budgetLimit;
        if (budgetUsage <= 0.8) score += 30;
        else if (budgetUsage <= 1) score += 15;
    } else {
        score += 15; // Neutral if no budget set
    }

    // 3. Expense/Income Ratio (30 points)
    const expIncRatio = totals.income > 0 ? (totals.expenses / totals.income) : 0;
    if (expIncRatio < 0.5) score += 30;
    else if (expIncRatio < 0.8) score += 15;

    score = Math.round(score);
    display.innerText = `${score}/100`;

    let color = 'text-danger';
    if (score > 70) color = 'text-success';
    else if (score > 50) color = 'text-warning';

    display.className = `mb-0 fw-bold ${color}`;
}

function updateSmartInsights() {
    const container = document.getElementById('smartInsightsContainer');
    if (!container) return;

    const totals = calculateTotals();
    const insights = [];

    if (totals.income === 0 && totals.expenses > 0) {
        insights.push("You haven't recorded any income yet. Start adding your earnings!");
    }
    
    if (state.budgetLimit > 0 && totals.expenses > state.budgetLimit * 0.9) {
        insights.push("Caution: You've used over 90% of your monthly budget.");
    }

    if (totals.balance > state.savingsGoal.target * 0.5 && state.savingsGoal.target > 0) {
        insights.push(`Great job! You're more than halfway to your ${state.savingsGoal.name} goal.`);
    }

    const foodExp = state.transactions
        .filter(t => t.category === 'Food' && t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);
    
    if (foodExp > totals.expenses * 0.4 && totals.expenses > 0) {
        insights.push("Food spending is over 40% of your total expenses. Consider dining out less.");
    }

    if (insights.length === 0) {
        insights.push("Keep tracking your daily transactions to get personalized financial advice.");
    }

    container.innerHTML = insights.map(i => `<p class="mb-2 small"><i class="fas fa-check-circle me-2 opacity-75"></i>${i}</p>`).join('');
}

function renderAnalytics() {
    updateCharts();
    const container = document.getElementById('monthlySummaryContainer');
    if (!container) return;

    const totals = calculateTotals();
    const categories = {};
    state.transactions.filter(t => t.type === 'expense').forEach(t => {
        categories[t.category] = (categories[t.category] || 0) + t.amount;
    });

    const mostUsedCat = Object.keys(categories).reduce((a, b) => categories[a] > categories[b] ? a : b, 'None');
    
    const summary = [
        { label: 'Avg. Transaction', value: state.transactions.length > 0 ? (totals.expenses + totals.income) / state.transactions.length : 0 },
        { label: 'Largest Expense', value: Math.max(...state.transactions.filter(t => t.type === 'expense').map(t => t.amount), 0) },
        { label: 'Most Used Category', value: mostUsedCat, isCurrency: false },
        { label: 'Transaction Count', value: state.transactions.length, isCurrency: false }
    ];

    container.innerHTML = summary.map(s => `
        <div class="col-md-3">
            <div class="p-3 border rounded-3 text-center">
                <h6 class="text-muted small mb-1">${s.label}</h6>
                <h5 class="mb-0 fw-bold">${s.isCurrency === false ? s.value : formatCurrency(s.value)}</h5>
            </div>
        </div>
    `).join('');
}

function renderBudgetSection() {
    document.getElementById('budgetLimitInput').value = state.budgetLimit;
    document.getElementById('savingsGoalName').value = state.savingsGoal.name;
    document.getElementById('savingsTargetAmount').value = state.savingsGoal.target;

    const details = document.getElementById('budgetDetailsList');
    const categoryExpenses = {};
    state.transactions.filter(t => t.type === 'expense').forEach(t => {
        categoryExpenses[t.category] = (categoryExpenses[t.category] || 0) + t.amount;
    });

    details.innerHTML = Object.keys(state.categories).map(cat => {
        const spent = categoryExpenses[cat] || 0;
        const totalSpent = calculateTotals().expenses || 1;
        const percent = (spent / totalSpent) * 100;
        return `
            <div class="mb-3">
                <div class="d-flex justify-content-between mb-1">
                    <span><i class="fas ${state.categories[cat].icon} me-2" style="color: ${state.categories[cat].color}"></i>${cat}</span>
                    <span class="small text-muted">${formatCurrency(spent)}</span>
                </div>
                <div class="progress" style="height: 6px;">
                    <div class="progress-bar" style="width: ${percent}%; background-color: ${state.categories[cat].color}"></div>
                </div>
            </div>
        `;
    }).join('');
}

// --- Search, Filter & Export Logic ---

function exportCSV() {
    if (state.transactions.length === 0) {
        showToast('No data to export', 'warning');
        return;
    }

    const headers = ['Name', 'Amount', 'Type', 'Category', 'Date', 'Note'];
    const rows = state.transactions.map(t => [
        t.name,
        t.amount,
        t.type,
        t.category,
        t.date,
        t.note || ''
    ]);

    let csvContent = "data:text/csv;charset=utf-8," 
        + headers.join(",") + "\n"
        + rows.map(e => e.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "spendwise-report.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showToast('Report exported as CSV', 'success');
}
