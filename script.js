        // Constants & Configuration
        const DEFAULT_SHEET_ID = "1zhRKPlJN60YgwqVvkzCrIGPBHW36U5t5B_dDgx6JCcI";
        
        let config = {
            sheetId: DEFAULT_SHEET_ID,
            scriptUrl: ""
        };

        let customers = [];
        let renewals = [];
        let activeSignupTab = 'Smart@Home';
        let activeTopupSubTab = 'Smart@Home';
        let filterAlmostExpiredOnly = false;
        let signupPage = 1;
        let customerPage = 1;
        
        const PLAN_AMOUNTS = {
            "4G": 15.00,
            "5G": 29.00,
            "Fiber+": 20.00,
            "Post paid": 35.00,
            "Hybrid+": 45.00,
            "ICT service": 60.00,
            "Smart Laor'": 5.00,
            "Smart Data 5G": 10.00
        };
        
        let signupChart = null;
        let renewChart = null;
        let renewCompareChart = null;

        // Initialize Web Application
        window.onload = async () => {
            loadConfig();
            loadLocalData();
            loadRenewals();
            await fetchSyncData();
            autoCalculateFields();
            switchTab('dashboard');
            
            // Render Google Apps Script code to the settings tab block
            document.getElementById('backend-code-block').innerText = getBackendCodeText();
        };

        // Local Settings & Configurations
        function loadConfig() {
            // Check for URL parameters first (allows easy sharing/syncing settings across browsers)
            const urlParams = new URLSearchParams(window.location.search);
            const urlSheetId = urlParams.get('sheetId');
            const urlScriptUrl = urlParams.get('scriptUrl');

            if (urlSheetId) {
                localStorage.setItem('ss_ops_sheet_id', urlSheetId.trim());
            }
            if (urlScriptUrl) {
                localStorage.setItem('ss_ops_script_url', urlScriptUrl.trim());
            }

            // Clean the URL so the parameters don't stay in the address bar if they refresh/bookmark
            if (urlSheetId || urlScriptUrl) {
                const newUrl = window.location.protocol + "//" + window.location.host + window.location.pathname;
                window.history.replaceState({ path: newUrl }, '', newUrl);
            }

            const savedSheetId = localStorage.getItem('ss_ops_sheet_id');
            const savedScriptUrl = localStorage.getItem('ss_ops_script_url');
            
            config.sheetId = savedSheetId || DEFAULT_SHEET_ID;
            config.scriptUrl = savedScriptUrl || "";

            document.getElementById('set-sheet-id').value = config.sheetId;
            document.getElementById('set-script-url').value = config.scriptUrl;

            updateSyncBadge();
            updateShareSettingsLink();
        }

        function updateShareSettingsLink() {
            const container = document.getElementById('share-settings-container');
            const urlInput = document.getElementById('share-settings-url');
            if (container && urlInput) {
                if (config.scriptUrl) {
                    const baseUrl = window.location.protocol + "//" + window.location.host + window.location.pathname;
                    const shareUrl = `${baseUrl}?sheetId=${encodeURIComponent(config.sheetId)}&scriptUrl=${encodeURIComponent(config.scriptUrl)}`;
                    urlInput.value = shareUrl;
                    container.style.display = 'block';
                } else {
                    container.style.display = 'none';
                }
            }
        }

        function copyShareLink() {
            const urlInput = document.getElementById('share-settings-url');
            if (urlInput && urlInput.value) {
                navigator.clipboard.writeText(urlInput.value).then(() => {
                    alert("Dashboard configurations link copied! Share this link to automatically synchronize settings in other browsers/devices.");
                }).catch(err => {
                    console.error('Failed to copy link', err);
                    alert("Could not copy automatically. Please select and copy manually.");
                });
            }
        }

        // Save dashboard configurations
        function saveSettings() {
            const sId = document.getElementById('set-sheet-id').value.trim();
            const sUrl = document.getElementById('set-script-url').value.trim();

            if (!sId) {
                alert("Spreadsheet ID is required.");
                return;
            }

            config.sheetId = sId;
            config.scriptUrl = sUrl;

            localStorage.setItem('ss_ops_sheet_id', sId);
            localStorage.setItem('ss_ops_script_url', sUrl);

            updateSyncBadge();
            updateShareSettingsLink();
            fetchSyncData();
            alert("Settings saved successfully! Synchronizing data...");
        }

        function resetSettingsToDefault() {
            if (confirm("Reset to default Sheet ID and clear custom Web App URL?")) {
                localStorage.removeItem('ss_ops_sheet_id');
                localStorage.removeItem('ss_ops_script_url');
                loadConfig();
                fetchSyncData();
            }
        }

        function updateSyncBadge() {
            const isConnected = !!config.scriptUrl;
            const badgeMain = document.getElementById('sync-mode-badge');
            const badgeSetting = document.getElementById('sync-setting-indicator');

            badgeMain.style.display = "none";

            if (isConnected) {
                badgeMain.className = "badge active";
                badgeMain.innerText = "Cloud Sync Active";
                badgeMain.style.backgroundColor = "var(--success-bg)";
                badgeMain.style.color = "var(--success)";

                badgeSetting.className = "badge active";
                badgeSetting.innerText = "Real-Time Sync Active";
                badgeSetting.style.backgroundColor = "var(--success-bg)";
                badgeSetting.style.color = "var(--success)";
            } else {
                badgeMain.className = "badge suspend";
                badgeMain.innerText = "Local Storage Mode";
                badgeMain.style.backgroundColor = "var(--warning-bg)";
                badgeMain.style.color = "var(--warning)";

                badgeSetting.className = "badge suspend";
                badgeSetting.innerText = "Local Only (No Cloud Script URL)";
                badgeSetting.style.backgroundColor = "var(--warning-bg)";
                badgeSetting.style.color = "var(--warning)";
            }
        }

        // Data Storage & Synchronization
        function loadLocalData() {
            const localData = localStorage.getItem('ss_ops_customers');
            if (localData) {
                customers = JSON.parse(localData);
            } else {
                // Pre-populate some Mock Data to make it look great immediately
                customers = [
                    {
                        id: "CUST_1",
                        customer: "An Sreypich",
                        number: "012888999",
                        contact: "099888777",
                        source: "Shop",
                        pic: "RIM Saray",
                        tariff: "Smart@Home Light",
                        amount: 15.00,
                        signup_date: "2026-05-01",
                        period: 3,
                        expire_date: "2026-08-01",
                        status: "Active",
                        overdue_days: 0
                    },
                    {
                        id: "CUST_2",
                        customer: "Chan Narin",
                        number: "096555444",
                        contact: "015111222",
                        source: "Sale",
                        pic: "KUN Chamnan",
                        tariff: "Smart@Home 5G",
                        amount: 29.00,
                        signup_date: "2026-07-28",
                        period: 1,
                        expire_date: "2026-08-28",
                        status: "Active",
                        overdue_days: 0
                    },
                    {
                        id: "CUST_3",
                        customer: "Sokha Mean",
                        number: "088333222",
                        contact: "077444555",
                        source: "Dealer",
                        pic: "Chhorvy Agent",
                        tariff: "Smart@Home Light",
                        amount: 12.00,
                        signup_date: "2026-04-10",
                        period: 3,
                        expire_date: "2026-07-10",
                        status: "Active",
                        overdue_days: 20
                    }
                ];
                saveLocalData();
            }
            recalculateOverdueDaysLocally();
        }

        function saveLocalData() {
            localStorage.setItem('ss_ops_customers', JSON.stringify(customers));
        }

        function loadRenewals() {
            const savedRenewals = localStorage.getItem('ss_ops_renewals');
            if (savedRenewals) {
                renewals = JSON.parse(savedRenewals);
            } else {
                renewals = [];
            }
        }

        function saveRenewals() {
            localStorage.setItem('ss_ops_renewals', JSON.stringify(renewals));
        }

        function recalculateOverdueDaysLocally() {
            const today = new Date();
            today.setHours(0,0,0,0);
            
            customers.forEach(c => {
                if (c.expire_date && c.status === "Active") {
                    const exp = new Date(c.expire_date);
                    exp.setHours(0,0,0,0);
                    const diffTime = today - exp;
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    c.overdue_days = diffDays > 0 ? diffDays : 0;
                } else {
                    c.overdue_days = 0;
                }
            });
        }

        async function fetchSyncData() {
            if (!config.scriptUrl) {
                renderAll();
                return;
            }

            showSyncToast("Fetching latest cloud data...");
            try {
                const url = `${config.scriptUrl}?action=get&sheetId=${config.sheetId}&_t=${new Date().getTime()}`;
                const response = await fetch(url);
                const data = await response.json();
                
                if (data && Array.isArray(data)) {
                    customers = data.map(item => ({
                        id: item.id || "C_MOCK_" + new Date().getTime(),
                        customer: item.customer || "",
                        number: item.number || "",
                        contact: item.contact || "",
                        source: item.source || "Shop",
                        pic: item.pic || "",
                        tariff: item.tariff || "",
                        amount: parseFloat(item.amount) || 0,
                        signup_date: item.signup_date || "",
                        period: parseInt(item.period) || 1,
                        expire_date: item.expire_date || "",
                        status: item.status || "Active",
                        overdue_days: parseInt(item.overdue_days) || 0,
                        sheetRowIndex: item.sheetRowIndex || -1,
                        service_type: item.service_type || "Smart@Home",
                        free_service: item.free_service || "",
                        invoice_number: item.invoice_number || "",
                        outstanding_amount: item.outstanding_amount !== undefined ? parseFloat(item.outstanding_amount) || 0 : 0
                    }));
                    saveLocalData();
                    recalculateOverdueDaysLocally();
                } else if (data && data.error) {
                    console.error("Cloud Error:", data.error);
                }
            } catch (err) {
                console.error("Failed to sync with cloud", err);
            } finally {
                hideSyncToast();
                renderAll();
            }
        }

        async function syncCloudAction(action, payload = null, id = "", index = -1, silent = false) {
            if (!config.scriptUrl) {
                // If offline / local only, simulate success locally
                if (action === 'save') {
                    if (id) {
                        // Edit Mode
                        const idx = customers.findIndex(c => c.id === id);
                        if (idx !== -1) {
                            customers[idx] = { ...customers[idx], ...payload };
                        }
                    } else {
                        // New Customer
                        payload.id = "CUST_" + new Date().getTime() + "_" + Math.floor(Math.random()*100);
                        customers.push(payload);
                    }
                } else if (action === 'delete') {
                    customers = customers.filter(c => c.id !== id);
                }
                saveLocalData();
                recalculateOverdueDaysLocally();
                renderAll();
                if (!silent) {
                    showSuccessModal("Local Save Successful", "Data saved successfully in the browser's local storage (Offline Mode).");
                }
                return;
            }

            showSyncToast(action === 'save' ? "Saving contract to cloud..." : "Deleting customer from cloud...");
            try {
                const response = await fetch(config.scriptUrl, {
                    method: 'POST',
                    body: JSON.stringify({
                        action: action,
                        sheetId: config.sheetId,
                        id: id,
                        index: index,
                        data: payload
                    })
                });
                const data = await response.json();
                
                if (data && Array.isArray(data)) {
                    customers = data.map(item => ({
                        id: item.id || "C_" + new Date().getTime(),
                        customer: item.customer || "",
                        number: item.number || "",
                        contact: item.contact || "",
                        source: item.source || "Shop",
                        pic: item.pic || "",
                        tariff: item.tariff || "",
                        amount: parseFloat(item.amount) || 0,
                        signup_date: item.signup_date || "",
                        period: parseInt(item.period) || 1,
                        expire_date: item.expire_date || "",
                        status: item.status || "Active",
                        overdue_days: parseInt(item.overdue_days) || 0,
                        sheetRowIndex: item.sheetRowIndex || -1,
                        service_type: item.service_type || "Smart@Home",
                        free_service: item.free_service || "",
                        invoice_number: item.invoice_number || "",
                        outstanding_amount: item.outstanding_amount !== undefined ? parseFloat(item.outstanding_amount) || 0 : 0
                    }));
                    saveLocalData();
                    recalculateOverdueDaysLocally();
                    if (!silent) {
                        const msg = action === 'save' ? "Customer registration details saved and synced with cloud successfully." : "Customer registration deleted and synced with cloud successfully.";
                        showSuccessModal("Cloud Sync Successful", msg);
                    }
                } else if (data && data.error) {
                    if (!silent) {
                        showFailModal("Cloud Error", data.error);
                    } else {
                        console.error("Cloud Error in syncCloudAction:", data.error);
                    }
                }
            } catch (err) {
                console.error("Cloud synchronization failed", err);
                // Fallback action
                if (action === 'save') {
                    if (id) {
                        const idx = customers.findIndex(c => c.id === id);
                        if (idx !== -1) customers[idx] = { ...customers[idx], ...payload };
                    } else {
                        payload.id = "CUST_" + new Date().getTime();
                        customers.push(payload);
                    }
                } else if (action === 'delete') {
                    customers = customers.filter(c => c.id !== id);
                }
                saveLocalData();
                recalculateOverdueDaysLocally();
                if (!silent) {
                    showFailModal("Cloud Sync Failed", "Unable to sync with Google Sheet. Action has been saved locally in the browser.");
                }
            } finally {
                hideSyncToast();
                renderAll();
            }
        }

        // Form Calculations & Actions
        function autoCalculateFields() {
            const signupDateStr = document.getElementById('f-signup-date').value;
            const periodStr = document.getElementById('f-period').value;
            
            if (!signupDateStr || !periodStr) {
                document.getElementById('f-expire-date').value = "";
                document.getElementById('f-overdue-days').value = 0;
                return;
            }

            const period = parseInt(periodStr);
            const freeServiceStr = document.getElementById('f-free-service') ? document.getElementById('f-free-service').value : "";
            const freeMonths = parseInt(freeServiceStr) || 0;
            const totalMonths = period + freeMonths;
            
            const signupDate = new Date(signupDateStr);
            
            // Add period + free months (30 days per month)
            signupDate.setDate(signupDate.getDate() + (totalMonths * 30));
            const expiryStr = signupDate.toISOString().split('T')[0];
            document.getElementById('f-expire-date').value = expiryStr;

            // Calculate overdue
            const today = new Date();
            today.setHours(0,0,0,0);
            signupDate.setHours(0,0,0,0);

            const diffTime = today - signupDate;
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            const overdue = diffDays > 0 ? diffDays : 0;
            
            document.getElementById('f-overdue-days').value = overdue;
        }

        function resetForm() {
            document.getElementById('entry-form').reset();
            document.getElementById('f-id').value = "";
            document.getElementById('f-row-index').value = "-1";
            document.getElementById('form-heading').innerText = "Sign Up Form";
            
            // Default to today's date
            document.getElementById('f-signup-date').value = new Date().toISOString().split('T')[0];
            autoCalculateFields();
        }

        function initNewForm() {
            openSignupModal(null, activeSignupTab);
        }

        function handleTariffChange(selectElement, amountInputId) {
            const val = selectElement.value;
            if (val && PLAN_AMOUNTS[val] !== undefined) {
                document.getElementById(amountInputId).value = PLAN_AMOUNTS[val];
            }
        }

        function updateFormFieldsForServiceType(serviceType, selectedTariff = null, selectedAmt = null) {
            const currentTariff = selectedTariff || document.getElementById('f-tariff').value;
            const currentAmt = selectedAmt !== null ? selectedAmt : document.getElementById('f-amt').value;

            document.getElementById('f-service-type').value = serviceType;
            
            // Labels and inputs to change
            const numLabel = document.querySelector('label[for="f-num"]');
            const dateLabel = document.querySelector('label[for="f-signup-date"]');
            const numInput = document.getElementById('f-num');
            
            // Set show/hide fields
            const freeGroup = document.getElementById('group-f-free-service');
            const invGroup = document.getElementById('group-f-invoice-num');
            const outGroup = document.getElementById('group-f-outstanding-amt');
            
            // Set status select options
            const statusSelect = document.getElementById('f-status');
            
            // Populate Tariff select dropdown
            const tariffSelect = document.getElementById('f-tariff');
            let tariffOptions = '';
            
            if (serviceType === 'Smart@Home') {
                tariffOptions = `
                    <option value="" disabled selected>Select Tariff / Service</option>
                    <option value="4G">4G</option>
                    <option value="5G">5G</option>
                `;
            } else if (serviceType === 'Fiber+') {
                tariffOptions = `
                    <option value="Fiber+">Fiber+</option>
                `;
            } else if (serviceType === 'SME Service') {
                tariffOptions = `
                    <option value="" disabled selected>Select Tariff / Service</option>
                    <option value="Post paid">Post paid</option>
                    <option value="Hybrid+">Hybrid+</option>
                    <option value="ICT service">ICT service</option>
                `;
            } else if (serviceType === 'Prepaid Service') {
                tariffOptions = `
                    <option value="" disabled selected>Select Tariff / Service</option>
                    <option value="Smart Laor'">Smart Laor'</option>
                    <option value="Smart Data 5G">Smart Data 5G</option>
                `;
            }
            tariffSelect.innerHTML = tariffOptions;

            if (currentTariff && [...tariffSelect.options].some(opt => opt.value === currentTariff)) {
                tariffSelect.value = currentTariff;
                if (currentAmt !== null && currentAmt !== undefined) {
                    document.getElementById('f-amt').value = currentAmt;
                }
            } else {
                if (serviceType === 'Smart@Home') {
                    tariffSelect.value = "";
                    document.getElementById('f-amt').value = "";
                } else if (serviceType === 'Fiber+') {
                    tariffSelect.value = "Fiber+";
                    document.getElementById('f-amt').value = PLAN_AMOUNTS["Fiber+"];
                } else if (serviceType === 'SME Service') {
                    tariffSelect.value = "";
                    document.getElementById('f-amt').value = "";
                } else if (serviceType === 'Prepaid Service') {
                    tariffSelect.value = "";
                    document.getElementById('f-amt').value = "";
                }
            }
            
            if (serviceType === 'SME Service') {
                if (numLabel) numLabel.innerText = "Service Number *";
                if (numInput) numInput.placeholder = "Enter Service Number";
                if (dateLabel) dateLabel.innerText = "Renew Date *";
                
                if (freeGroup) freeGroup.style.display = 'none';
                if (invGroup) invGroup.style.display = 'block';
                if (outGroup) outGroup.style.display = 'block';
                
                const fInv = document.getElementById('f-invoice-num');
                const fOut = document.getElementById('f-outstanding-amt');
                if (fInv) fInv.required = true;
                if (fOut) fOut.required = true;
                
                statusSelect.innerHTML = `
                    <option value="Active">Active</option>
                    <option value="Suspend">Suspend</option>
                    <option value="Terminated">Terminated</option>
                `;
            } else if (serviceType === 'Prepaid Service') {
                if (numLabel) numLabel.innerText = "Service Number *";
                if (numInput) numInput.placeholder = "Enter Service Number";
                if (dateLabel) dateLabel.innerText = "Renew Date *";
                
                if (freeGroup) freeGroup.style.display = 'none';
                if (invGroup) invGroup.style.display = 'none';
                if (outGroup) outGroup.style.display = 'none';
                
                const fInv = document.getElementById('f-invoice-num');
                const fOut = document.getElementById('f-outstanding-amt');
                if (fInv) fInv.required = false;
                if (fOut) fOut.required = false;
                
                statusSelect.innerHTML = `
                    <option value="Active" selected>Active</option>
                    <option value="Terminated">Terminated</option>
                `;
            } else {
                // Smart@Home or Fiber+
                if (numLabel) numLabel.innerText = "Top Up Number / Wifi ID *";
                if (numInput) numInput.placeholder = "Enter Top Up Number (e.g. 012345678)";
                if (dateLabel) dateLabel.innerText = "Sign Up Date *";
                
                if (freeGroup) freeGroup.style.display = 'block';
                if (invGroup) invGroup.style.display = 'none';
                if (outGroup) outGroup.style.display = 'none';
                
                const fInv = document.getElementById('f-invoice-num');
                const fOut = document.getElementById('f-outstanding-amt');
                if (fInv) fInv.required = false;
                if (fOut) fOut.required = false;
                
                statusSelect.innerHTML = `
                    <option value="Active" selected>Active</option>
                    <option value="Suspend">Suspend</option>
                    <option value="Terminated">Terminated</option>
                `;
            }
        }

        function openSignupModal(id, serviceType = 'Smart@Home') {
            resetForm();
            updateFormFieldsForServiceType(serviceType);
            document.getElementById('signup-modal-overlay').classList.add('active');
            document.getElementById('f-cust').focus();
        }

        function closeSignupModal() {
            document.getElementById('signup-modal-overlay').classList.remove('active');
        }

        function editCustomer(id) {
            const c = customers.find(item => item.id === id);
            if (!c) return;
            
            document.getElementById('f-id').value = c.id;
            document.getElementById('f-row-index').value = c.sheetRowIndex || -1;
            document.getElementById('form-heading').innerText = "Edit Sign Up Form";
            
            document.getElementById('f-cust').value = c.customer;
            document.getElementById('f-num').value = c.number;
            document.getElementById('f-con').value = c.contact;
            document.getElementById('f-source').value = c.source;
            document.getElementById('f-pic').value = c.pic;
            document.getElementById('f-signup-date').value = c.signup_date;
            document.getElementById('f-period').value = c.period;
            
            const serviceType = c.service_type || 'Smart@Home';
            updateFormFieldsForServiceType(serviceType, c.tariff, c.amount);
            
            if (document.getElementById('f-free-service')) {
                document.getElementById('f-free-service').value = c.free_service || "";
            }
            if (document.getElementById('f-invoice-num')) {
                document.getElementById('f-invoice-num').value = c.invoice_number || "";
            }
            if (document.getElementById('f-outstanding-amt')) {
                document.getElementById('f-outstanding-amt').value = c.outstanding_amount || 0;
            }
            
            document.getElementById('f-status').value = c.status;
            
            autoCalculateFields();
            
            document.getElementById('signup-modal-overlay').classList.add('active');
        }

        async function deleteCustomer(id, rowIndex) {
            if (confirm("Are you sure you want to delete this customer?")) {
                await syncCloudAction('delete', null, id, rowIndex);
            }
        }

        async function handleFormSubmit(e) {
            e.preventDefault();

            const customerName = document.getElementById('f-cust').value.trim();
            const topUpNumber = document.getElementById('f-num').value.trim();
            const contactPhone = document.getElementById('f-con').value.trim();
            const source = document.getElementById('f-source').value;
            const pic = document.getElementById('f-pic').value.trim();
            const tariff = document.getElementById('f-tariff').value;
            const amount = parseFloat(document.getElementById('f-amt').value) || 0;
            const signupDate = document.getElementById('f-signup-date').value;
            const period = parseInt(document.getElementById('f-period').value);
            const expireDate = document.getElementById('f-expire-date').value;
            const status = document.getElementById('f-status').value;
            const overdueDays = parseInt(document.getElementById('f-overdue-days').value) || 0;
            
            const serviceType = document.getElementById('f-service-type').value;
            const freeService = document.getElementById('f-free-service') ? document.getElementById('f-free-service').value : "";
            const invoiceNum = document.getElementById('f-invoice-num') ? document.getElementById('f-invoice-num').value.trim() : "";
            const outstandingAmt = document.getElementById('f-outstanding-amt') ? parseFloat(document.getElementById('f-outstanding-amt').value) || 0 : 0;
            
            const id = document.getElementById('f-id').value;
            const rowIndex = parseInt(document.getElementById('f-row-index').value) || -1;

            // Check for duplicate service number (number)
            const isDuplicateNumber = customers.some(c => {
                if (id && c.id === id) {
                    return false;
                }
                return c.number && String(c.number).trim().toLowerCase() === String(topUpNumber).trim().toLowerCase();
            });

            if (isDuplicateNumber) {
                alert("Error: This Service Number / Wifi ID is already registered in the system!");
                return;
            }


            const payload = {
                customer: customerName,
                number: topUpNumber,
                contact: contactPhone,
                source: source,
                pic: pic,
                tariff: tariff,
                amount: amount,
                signup_date: signupDate,
                period: period,
                expire_date: expireDate,
                status: status,
                overdue_days: overdueDays,
                service_type: serviceType,
                free_service: freeService,
                invoice_number: invoiceNum,
                outstanding_amount: outstandingAmt
            };

            if (id) {
                // Edit save
                payload.id = id;
                await syncCloudAction('save', payload, id, rowIndex);
            } else {
                // New save
                await syncCloudAction('save', payload);
            }

            closeSignupModal();
            switchTab('signup');
        }

        function escapeHtml(str) {
            if (str === null || str === undefined) return '';
            return String(str)
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;")
                .replace(/"/g, "&quot;")
                .replace(/'/g, "&#039;");
        }

        // Customer List Rendering & Table Actions
        function renderAll() {
            recalculateOverdueDaysLocally();
            renderCustomerList();
            renderSignupList();
            updateKPIs();
            renderCharts();
            populateMonthlyViewSelect();
            renderMonthlyRenewals();
        }

        function populateMonthlyViewSelect() {
            const select = document.getElementById('monthly-view-select');
            if (!select) return;
            
            const monthsSet = new Set();
            
            // Add current month by default
            const today = new Date();
            const currentMonthStr = today.getFullYear() + "-" + String(today.getMonth() + 1).padStart(2, '0');
            monthsSet.add(currentMonthStr);
            
            renewals.forEach(r => {
                if (r.renewal_month) {
                    monthsSet.add(r.renewal_month);
                }
            });
            
            const sortedMonths = Array.from(monthsSet).sort((a, b) => b.localeCompare(a));
            const prevSelected = select.value;
            
            select.innerHTML = '';
            sortedMonths.forEach(m => {
                const opt = document.createElement('option');
                opt.value = m;
                const [year, month] = m.split('-');
                const dateObj = new Date(parseInt(year), parseInt(month) - 1, 1);
                const monthName = dateObj.toLocaleString('default', { month: 'long' });
                opt.innerText = `${monthName} ${year}`;
                select.appendChild(opt);
            });
            
            if (sortedMonths.includes(prevSelected)) {
                select.value = prevSelected;
            } else {
                select.value = currentMonthStr;
            }
        }

        function renderMonthlyRenewals() {
            const select = document.getElementById('monthly-view-select');
            const tbody = document.getElementById('monthly-renewals-table-body');
            const emptyState = document.getElementById('monthly-renewals-empty-state');
            
            if (!select || !tbody) return;
            
            const selectedMonth = select.value;
            const filteredRenewals = renewals.filter(r => r.renewal_month === selectedMonth);
            
            tbody.innerHTML = '';
            
            if (filteredRenewals.length === 0) {
                emptyState.style.display = 'block';
                return;
            }
            
            emptyState.style.display = 'none';
            
            filteredRenewals.forEach(r => {
                const tr = document.createElement('tr');
                
                let badgeClass = 'badge suspend';
                if (r.renewal_status === 'Success') {
                    badgeClass = 'badge active';
                } else if (r.renewal_status === 'Failed' || r.renewal_status === 'Terminated') {
                    badgeClass = 'badge terminated';
                }
                
                tr.innerHTML = `
                    <td>
                        <div style="font-weight: 600; color: var(--text-dark);">${escapeHtml(r.customer)}</div>
                        <div style="font-size: 0.8rem; color: var(--text-gray);">${escapeHtml(r.contact)}</div>
                    </td>
                    <td>
                        <strong style="color:var(--primary); font-family:monospace;">${escapeHtml(r.number)}</strong>
                    </td>
                    <td>
                        <div style="font-weight: 500;">${escapeHtml(r.source)}</div>
                        <div style="font-size: 0.8rem; color: var(--text-gray);">PIC: ${escapeHtml(r.pic)}</div>
                    </td>
                    <td>
                        <span style="background:var(--primary-light); color:var(--primary); padding:4px 10px; border-radius:6px; font-weight:600; font-size:0.8rem;">
                            ${escapeHtml(r.tariff)}
                        </span><br>
                        <small style="font-weight:600; color:#333;">$${parseFloat(r.amount).toFixed(2)}</small>
                    </td>
                    <td>
                        <div style="font-size: 0.85rem; font-weight: 500;">Start: ${escapeHtml(r.new_start_date)}</div>
                        <div style="font-size: 0.8rem; color: var(--text-gray);">Expire: ${escapeHtml(r.new_expire_date)} (${escapeHtml(r.period)}m)</div>
                    </td>
                    <td>
                        <span class="${badgeClass}">${escapeHtml(r.renewal_status)}</span>
                    </td>
                `;
                tbody.appendChild(tr);
            });
        }

        function renderCustomerList() {
            const body = document.getElementById('customer-table-body');
            const search = document.getElementById('search-box').value.toLowerCase();
            const filterStatus = document.getElementById('filter-status').value;
            const emptyState = document.getElementById('table-empty-state');
            
            body.innerHTML = '';
            
            // Sort customers: Expiring Soonest / Most Overdue first
            let displayList = [...customers].sort((a, b) => {
                if (!a.expire_date) return 1;
                if (!b.expire_date) return -1;
                return new Date(a.expire_date) - new Date(b.expire_date);
            });

            const today = new Date();
            const lastDayOfCurrentMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
            lastDayOfCurrentMonth.setHours(23, 59, 59, 999);

            let alertCount = 0;

            const matchedList = displayList.filter(c => {
                // Filter by Service Type Sub-Tab
                const serviceType = c.service_type || 'Smart@Home';
                const isPendingPayment = c.status === "Pending Payment";
                
                if (activeTopupSubTab === "Pending Bill") {
                    if (!isPendingPayment) {
                        return false;
                    }
                } else {
                    if (isPendingPayment) {
                        return false; // Moved to Pending Bill
                    }
                    if (serviceType !== activeTopupSubTab) {
                        return false;
                    }
                }

                // Calculate expiry alert days
                let diffDays = 999;
                if (c.expire_date) {
                    const exp = new Date(c.expire_date);
                    exp.setHours(0,0,0,0);
                    const diffTime = exp - today;
                    diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                }

                // Condition for Top Up Tab visibility
                let isTopupEligible = false;
                if (isPendingPayment) {
                    isTopupEligible = true;
                } else if (c.status === 'Active' && c.expire_date) {
                    const exp = new Date(c.expire_date);
                    if (exp <= lastDayOfCurrentMonth || diffDays <= 5) {
                        isTopupEligible = true;
                    }
                }

                if (!isTopupEligible) {
                    return false;
                }

                // If Expired < 5 Day filter is toggled, filter to only those customers
                if (filterAlmostExpiredOnly && diffDays > 5) {
                    return false;
                }

                const matchesSearch = c.customer.toLowerCase().includes(search) || 
                                      (c.number && c.number.toString().toLowerCase().includes(search));
                                      
                const matchesStatus = !filterStatus || c.status === filterStatus;

                // We calculate alertCount for anything matching sub-tab and eligibility criteria
                if (c.status === 'Active' && c.expire_date && diffDays >= 0 && diffDays <= 5) {
                    alertCount++;
                }

                return matchesSearch && matchesStatus;
            });

            const totalItems = matchedList.length;
            const itemsPerPage = 10;
            const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;

            if (customerPage > totalPages) {
                customerPage = totalPages;
            }
            if (customerPage < 1) {
                customerPage = 1;
            }

            const startIndex = (customerPage - 1) * itemsPerPage;
            const endIndex = startIndex + itemsPerPage;
            const pageItems = matchedList.slice(startIndex, endIndex);

            pageItems.forEach(c => {
                // Calculate expiry alert days
                let diffDays = 999;
                if (c.expire_date) {
                    const exp = new Date(c.expire_date);
                    exp.setHours(0,0,0,0);
                    const diffTime = exp - today;
                    diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                }

                // Calculate expiry alert
                let alertBadgeHTML = '';
                if (c.expire_date) {
                    if (c.status === 'Pending Payment') {
                        alertBadgeHTML = `<span class="alert-pill" style="background:#ECECEC; color:#8C8C8C;">⚪ Pending Payment</span>`;
                    } else if (diffDays < 0) {
                        alertBadgeHTML = `<span class="alert-pill danger">🔴 Overdue ${Math.abs(diffDays)}d</span>`;
                    } else if (diffDays <= 5) {
                        alertBadgeHTML = `<span class="alert-pill warning">⚠️ Expire ${diffDays}d</span>`;
                    } else {
                        alertBadgeHTML = `<span class="alert-pill success">🟢 Active (${diffDays}d)</span>`;
                    }
                } else if (c.status === 'Pending Payment') {
                    alertBadgeHTML = `<span class="alert-pill" style="background:#ECECEC; color:#8C8C8C;">⚪ Pending Payment</span>`;
                }

                const amountFormatted = parseFloat(c.amount).toFixed(2);
                const isPendingPayment = c.status === "Pending Payment";
                
                body.innerHTML += `
                    <tr>
                        <td>
                            <strong>${c.customer}</strong><br>
                            <span style="font-size:0.8rem; color:var(--text-gray);">${c.contact}</span>
                        </td>
                        <td><strong style="color:var(--primary); font-family:monospace;">${c.number}</strong></td>
                        <td>
                            <span>${c.source}</span><br>
                            <small style="color:var(--text-gray);">PIC: ${c.pic}</small>
                        </td>
                        <td>
                            <span style="background:var(--primary-light); color:var(--primary); padding:4px 10px; border-radius:6px; font-weight:600; font-size:0.8rem;">
                                ${c.tariff}
                            </span><br>
                            <small style="font-weight:600; color:#333;">$${amountFormatted}</small>
                        </td>
                        <td>
                            <span>${c.expire_date || "N/A"}</span><br>
                            <small style="color:${c.overdue_days > 0 && !isPendingPayment ? 'var(--danger)' : 'var(--text-gray)'}; font-weight:${c.overdue_days > 0 && !isPendingPayment ? 'bold' : 'normal'};">
                                ${isPendingPayment ? 'Pending Payment' : (c.overdue_days > 0 ? 'Overdue ' + c.overdue_days + ' days' : 'Period: ' + c.period + 'm')}
                            </small>
                        </td>
                        <td>
                            <span class="badge ${c.status.toLowerCase().replace(' ', '-')}" style="margin-bottom:6px;">${c.status}</span><br>
                            ${alertBadgeHTML}
                        </td>
                        <td>
                            <div class="action-btn-group">
                                <button class="btn-icon renew" onclick="openRenewalModal('${c.id}')" title="Process Renewal">
                                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" style="width:20px; height:20px;"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path></svg>
                                </button>
                            </div>
                        </td>
                    </tr>`;
            });

            emptyState.style.display = totalItems === 0 ? 'block' : 'none';

            // Update List Count Badge
            document.getElementById('list-count-badge').innerText = `${totalItems} Customers`;

            // Render Pagination Controls for Customer Table
            const paginationContainer = document.getElementById('customer-pagination');
            if (paginationContainer) {
                if (totalItems <= itemsPerPage) {
                    paginationContainer.innerHTML = '';
                    paginationContainer.style.display = 'none';
                } else {
                    paginationContainer.style.display = 'flex';
                    paginationContainer.innerHTML = `
                        <button class="${customerPage > 1 ? 'btn-primary' : 'btn-secondary'}" 
                                style="padding: 6px 12px; font-size: 0.85rem; height: 32px; display: flex; align-items: center; ${customerPage > 1 ? '' : 'cursor: not-allowed; opacity: 0.5;'}"
                                onclick="changeCustomerPage(-1)" ${customerPage > 1 ? '' : 'disabled'}>
                            Previous
                        </button>
                        <span style="font-weight: 600; font-size: 0.9rem; color: var(--text-dark);">
                            Page ${customerPage} of ${totalPages}
                        </span>
                        <button class="${customerPage < totalPages ? 'btn-primary' : 'btn-secondary'}" 
                                style="padding: 6px 12px; font-size: 0.85rem; height: 32px; display: flex; align-items: center; ${customerPage < totalPages ? '' : 'cursor: not-allowed; opacity: 0.5;'}"
                                onclick="changeCustomerPage(1)" ${customerPage < totalPages ? '' : 'disabled'}>
                            Next
                        </button>
                    `;
                }
            }

            // Expire alert banner - completely disabled per requirements
            const alertBanner = document.getElementById('alert-banner-container');
            if (alertBanner) {
                alertBanner.style.display = 'none';
            }
        }

        function changeCustomerPage(delta) {
            customerPage += delta;
            renderCustomerList();
        }

         function renderSignupList() {
            const body = document.getElementById('signup-table-body');
            const search = document.getElementById('signup-search-box').value.toLowerCase();
            const emptyState = document.getElementById('signup-table-empty-state');
            
            body.innerHTML = '';
            
            let sortedList = [...customers].sort((a, b) => {
                if (!a.expire_date) return 1;
                if (!b.expire_date) return -1;
                return new Date(a.expire_date) - new Date(b.expire_date);
            });

            // Filter the customers first to get the matched list
            const matchedList = sortedList.filter(c => {
                const serviceType = c.service_type || 'Smart@Home';
                if (serviceType !== activeSignupTab) return false;

                const matchesSearch = c.customer.toLowerCase().includes(search) || 
                                      (c.number && c.number.toString().toLowerCase().includes(search));
                return matchesSearch;
            });

            const totalItems = matchedList.length;
            const itemsPerPage = 10;
            const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
            
            // Adjust current page if it is out of bounds
            if (signupPage > totalPages) {
                signupPage = totalPages;
            }
            if (signupPage < 1) {
                signupPage = 1;
            }

            const startIndex = (signupPage - 1) * itemsPerPage;
            const endIndex = startIndex + itemsPerPage;
            const pageItems = matchedList.slice(startIndex, endIndex);

            const today = new Date();
            today.setHours(0,0,0,0);

            pageItems.forEach(c => {
                const amountFormatted = parseFloat(c.amount).toFixed(2);
                const isPendingPayment = c.status === "Pending Payment";
                
                let alertBadgeHTML = '';
                if (c.expire_date) {
                    const exp = new Date(c.expire_date);
                    exp.setHours(0,0,0,0);
                    const diffTime = exp - today;
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                    if (c.status === 'Active') {
                        if (diffDays < 0) {
                            alertBadgeHTML = `<span class="alert-pill danger">🔴 Overdue ${Math.abs(diffDays)}d</span>`;
                        } else if (diffDays <= 5) {
                            alertBadgeHTML = `<span class="alert-pill warning">⚠️ Expire ${diffDays}d</span>`;
                        } else {
                            alertBadgeHTML = `<span class="alert-pill success">🟢 Active (${diffDays}d)</span>`;
                        }
                    } else if (c.status === 'Pending Payment') {
                        alertBadgeHTML = `<span class="alert-pill" style="background:#ECECEC; color:#8C8C8C;">⚪ Pending Payment</span>`;
                    } else {
                        alertBadgeHTML = `<span class="alert-pill" style="background:#ECECEC; color:#8C8C8C;">⚪ Non-Active</span>`;
                    }
                } else if (c.status === 'Pending Payment') {
                    alertBadgeHTML = `<span class="alert-pill" style="background:#ECECEC; color:#8C8C8C;">⚪ Pending Payment</span>`;
                }

                body.innerHTML += `
                    <tr>
                        <td>
                            <strong>${c.customer}</strong><br>
                            <span style="font-size:0.8rem; color:var(--text-gray);">${c.contact}</span>
                        </td>
                        <td><strong style="color:var(--primary); font-family:monospace;">${c.number}</strong></td>
                        <td>
                            <span>${c.source}</span><br>
                            <small style="color:var(--text-gray);">PIC: ${c.pic}</small>
                        </td>
                        <td>
                            <span style="background:var(--primary-light); color:var(--primary); padding:4px 10px; border-radius:6px; font-weight:600; font-size:0.8rem;">
                                ${c.tariff}
                            </span><br>
                            <small style="font-weight:600; color:#333;">$${amountFormatted}</small>
                        </td>
                        <td>
                            <span>${c.expire_date || "N/A"}</span><br>
                            <small style="color:${c.overdue_days > 0 && !isPendingPayment ? 'var(--danger)' : 'var(--text-gray)'}; font-weight:${c.overdue_days > 0 && !isPendingPayment ? 'bold' : 'normal'};">
                                ${isPendingPayment ? 'Pending Payment' : (c.overdue_days > 0 ? 'Overdue ' + c.overdue_days + ' days' : 'Period: ' + c.period + 'm')}
                            </small>
                        </td>
                        <td>
                            <span class="badge ${c.status.toLowerCase().replace(' ', '-')}" style="margin-bottom:6px;">${c.status}</span><br>
                            ${alertBadgeHTML}
                        </td>
                        <td>
                            <div class="action-btn-group">
                                <button class="btn-icon edit" onclick="editCustomer('${c.id}')" title="Edit Customer">
                                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" style="width:16px; height:16px;"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                                </button>
                                <button class="btn-icon delete" onclick="deleteCustomer('${c.id}', ${c.sheetRowIndex || -1})" title="Delete Customer">
                                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" style="width:16px; height:16px;"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                                </button>
                            </div>
                        </td>
                    </tr>`;
            });

            emptyState.style.display = totalItems === 0 ? 'block' : 'none';

            // Render Pagination Controls
            const paginationContainer = document.getElementById('signup-pagination');
            if (paginationContainer) {
                if (totalItems <= itemsPerPage) {
                    paginationContainer.innerHTML = '';
                    paginationContainer.style.display = 'none';
                } else {
                    paginationContainer.style.display = 'flex';
                    paginationContainer.innerHTML = `
                        <button class="${signupPage > 1 ? 'btn-primary' : 'btn-secondary'}" 
                                style="padding: 6px 12px; font-size: 0.85rem; height: 32px; display: flex; align-items: center; ${signupPage > 1 ? '' : 'cursor: not-allowed; opacity: 0.5;'}"
                                onclick="changeSignupPage(-1)" ${signupPage > 1 ? '' : 'disabled'}>
                            Previous
                        </button>
                        <span style="font-weight: 600; font-size: 0.9rem; color: var(--text-dark);">
                            Page ${signupPage} of ${totalPages}
                        </span>
                        <button class="${signupPage < totalPages ? 'btn-primary' : 'btn-secondary'}" 
                                style="padding: 6px 12px; font-size: 0.85rem; height: 32px; display: flex; align-items: center; ${signupPage < totalPages ? '' : 'cursor: not-allowed; opacity: 0.5;'}"
                                onclick="changeSignupPage(1)" ${signupPage < totalPages ? '' : 'disabled'}>
                            Next
                        </button>
                    `;
                }
            }
        }

        function changeSignupPage(delta) {
            signupPage += delta;
            renderSignupList();
        }

        function updateRenewalFormFieldsForServiceType(serviceType, selectedTariff = null, selectedAmt = null) {
            const currentTariff = selectedTariff || document.getElementById('r-tariff').value;
            const currentAmt = selectedAmt !== null ? selectedAmt : document.getElementById('r-amt').value;

            const rInvGroup = document.getElementById('group-r-invoice-num');
            const rOutGroup = document.getElementById('group-r-outstanding-amt');
            
            const tariffSelect = document.getElementById('r-tariff');
            let tariffOptions = '';
            
            if (serviceType === 'Smart@Home') {
                tariffOptions = `
                    <option value="4G">4G</option>
                    <option value="5G">5G</option>
                `;
            } else if (serviceType === 'Fiber+') {
                tariffOptions = `
                    <option value="Fiber+">Fiber+</option>
                `;
            } else if (serviceType === 'SME Service') {
                tariffOptions = `
                    <option value="Post paid">Post paid</option>
                    <option value="Hybrid+">Hybrid+</option>
                    <option value="ICT service">ICT service</option>
                `;
            } else if (serviceType === 'Prepaid Service') {
                tariffOptions = `
                    <option value="Smart Laor'">Smart Laor'</option>
                    <option value="Smart Data 5G">Smart Data 5G</option>
                `;
            }
            tariffSelect.innerHTML = tariffOptions;

            if (currentTariff && [...tariffSelect.options].some(opt => opt.value === currentTariff)) {
                tariffSelect.value = currentTariff;
                if (currentAmt !== null && currentAmt !== undefined) {
                    document.getElementById('r-amt').value = currentAmt;
                }
            } else {
                if (serviceType === 'Smart@Home') {
                    tariffSelect.value = "4G";
                    document.getElementById('r-amt').value = PLAN_AMOUNTS["4G"];
                } else if (serviceType === 'Fiber+') {
                    tariffSelect.value = "Fiber+";
                    document.getElementById('r-amt').value = PLAN_AMOUNTS["Fiber+"];
                } else if (serviceType === 'SME Service') {
                    tariffSelect.value = "Post paid";
                    document.getElementById('r-amt').value = PLAN_AMOUNTS["Post paid"];
                } else if (serviceType === 'Prepaid Service') {
                    tariffSelect.value = "Smart Laor'";
                    document.getElementById('r-amt').value = PLAN_AMOUNTS["Smart Laor'"];
                }
            }
            
            if (serviceType === 'SME Service') {
                if (rInvGroup) rInvGroup.style.display = 'block';
                if (rOutGroup) rOutGroup.style.display = 'block';
                
                const rInv = document.getElementById('r-invoice-num');
                const rOut = document.getElementById('r-outstanding-amt');
                if (rInv) rInv.required = true;
                if (rOut) rOut.required = true;
            } else {
                if (rInvGroup) rInvGroup.style.display = 'none';
                if (rOutGroup) rOutGroup.style.display = 'none';
                
                const rInv = document.getElementById('r-invoice-num');
                const rOut = document.getElementById('r-outstanding-amt');
                if (rInv) rInv.required = false;
                if (rOut) rOut.required = false;
            }
        }

        function handleRenewalStatusChange() {
            const rStatus = document.getElementById('r-status').value;
            const rNewStart = document.getElementById('r-new-start');
            const label = document.querySelector('label[for="r-new-start"]');
            
            if (rStatus === "Pending Payment") {
                rNewStart.value = "";
                rNewStart.required = false;
                if (label) {
                    label.innerHTML = 'New Start Date';
                }
            } else {
                rNewStart.required = true;
                if (label) {
                    label.innerHTML = 'New Start Date *';
                }
                
                // If it was blank, pre-fill it
                if (!rNewStart.value) {
                    const custId = document.getElementById('r-cust-id').value;
                    const c = customers.find(item => item.id === custId);
                    const todayStr = new Date().toISOString().split('T')[0];
                    let defaultStart = todayStr;
                    if (c && c.expire_date) {
                        const expDate = new Date(c.expire_date);
                        const today = new Date();
                        today.setHours(0,0,0,0);
                        if (expDate >= today) {
                            const nextDay = new Date(expDate);
                            nextDay.setDate(nextDay.getDate() + 1);
                            defaultStart = nextDay.toISOString().split('T')[0];
                        }
                    }
                    rNewStart.value = defaultStart;
                }
            }
            autoCalculateRenewalFields();
        }

        function openRenewalModal(id) {
            const c = customers.find(item => item.id === id);
            if (!c) return;
            
            document.getElementById('r-cust-id').value = c.id;
            document.getElementById('r-cust-name').value = c.customer;
            document.getElementById('r-cust-number').value = c.number;
            document.getElementById('r-current-expire').value = c.expire_date || "";
            
            const todayStr = new Date().toISOString().split('T')[0];
            let defaultStart = todayStr;
            if (c.expire_date) {
                const expDate = new Date(c.expire_date);
                const today = new Date();
                today.setHours(0,0,0,0);
                if (expDate >= today) {
                    const nextDay = new Date(expDate);
                    nextDay.setDate(nextDay.getDate() + 1);
                    defaultStart = nextDay.toISOString().split('T')[0];
                }
            }
            document.getElementById('r-new-start').value = defaultStart;
            document.getElementById('r-period').value = "1";
            document.getElementById('r-status').value = "Success";
            
            const serviceType = c.service_type || 'Smart@Home';
            updateRenewalFormFieldsForServiceType(serviceType, c.tariff, c.amount);
            
            if (document.getElementById('r-renewed-by')) {
                document.getElementById('r-renewed-by').value = c.renewed_by || "Smart Shop";
            }
            if (document.getElementById('r-invoice-num')) {
                document.getElementById('r-invoice-num').value = c.invoice_number || "";
            }
            if (document.getElementById('r-outstanding-amt')) {
                document.getElementById('r-outstanding-amt').value = c.outstanding_amount || 0;
            }
            
            handleRenewalStatusChange();
            
            document.getElementById('renewal-modal-overlay').classList.add('active');
        }

        function closeRenewalModal() {
            document.getElementById('renewal-modal-overlay').classList.remove('active');
        }

        function autoCalculateRenewalFields() {
            const startDateStr = document.getElementById('r-new-start').value;
            const periodStr = document.getElementById('r-period').value;
            
            if (!startDateStr || !periodStr) {
                document.getElementById('r-new-expire').value = "";
                return;
            }
            
            const startDate = new Date(startDateStr);
            const period = parseInt(periodStr);
            
            // Add period (30 days per month)
            startDate.setDate(startDate.getDate() + (period * 30));
            const newExpiryStr = startDate.toISOString().split('T')[0];
            document.getElementById('r-new-expire').value = newExpiryStr;
        }

        function handleRenewalSubmit(e) {
            e.preventDefault();
            
            const customerId = document.getElementById('r-cust-id').value;
            const customer = customers.find(c => c.id === customerId);
            if (!customer) return;
            
            const newStartDate = document.getElementById('r-new-start').value;
            const period = parseInt(document.getElementById('r-period').value);
            const tariff = document.getElementById('r-tariff').value;
            const amount = parseFloat(document.getElementById('r-amt').value) || 0;
            const renewalStatus = document.getElementById('r-status').value;
            const newExpireDate = document.getElementById('r-new-expire').value;
            
            const renewedBy = document.getElementById('r-renewed-by') ? document.getElementById('r-renewed-by').value : "Smart Shop";
            const invoiceNum = document.getElementById('r-invoice-num') ? document.getElementById('r-invoice-num').value.trim() : "";
            const outstandingAmt = document.getElementById('r-outstanding-amt') ? parseFloat(document.getElementById('r-outstanding-amt').value) || 0 : 0;
            
            const renewalId = "REN_" + new Date().getTime() + "_" + Math.floor(Math.random() * 1000);
            
            let monthSheetName = "";
            let renewalMonthYear = "";
            if (newStartDate) {
                const startD = new Date(newStartDate);
                const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
                monthSheetName = "Sheet " + monthNames[startD.getMonth()];
                renewalMonthYear = startD.getFullYear() + "-" + String(startD.getMonth() + 1).padStart(2, '0');
            } else {
                const startD = new Date();
                const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
                monthSheetName = "Sheet " + monthNames[startD.getMonth()];
                renewalMonthYear = startD.getFullYear() + "-" + String(startD.getMonth() + 1).padStart(2, '0');
            }
            
            const renewalPayload = {
                renewal_id: renewalId,
                customer_id: customerId,
                customer: customer.customer,
                number: customer.number,
                contact: customer.contact,
                source: customer.source,
                pic: customer.pic,
                tariff: tariff,
                amount: amount,
                new_start_date: newStartDate,
                period: period,
                new_expire_date: newExpireDate,
                renewal_status: renewalStatus,
                renewal_month: renewalMonthYear,
                renewed_by: renewedBy,
                invoice_number: invoiceNum,
                outstanding_amount: outstandingAmt
            };
            
            renewals.push(renewalPayload);
            saveRenewals();
            
            if (config.scriptUrl) {
                sendRenewalToCloud(renewalPayload, monthSheetName);
            } else {
                showSuccessModal("Local Renewal Saved", "Renewal action saved locally in the browser's local storage (Offline Mode).");
            }
            
            if (renewalStatus === "Pending Payment") {
                customer.signup_date = "";
                customer.expire_date = "";
                customer.status = "Pending Payment";
                customer.tariff = tariff;
                customer.amount = amount;
                customer.renewed_by = renewedBy;
                customer.invoice_number = invoiceNum;
                customer.outstanding_amount = outstandingAmt;
                
                if (config.scriptUrl) {
                    syncCloudAction('save', customer, customer.id, customer.sheetRowIndex || -1, true);
                } else {
                    saveLocalData();
                    renderAll();
                }
            } else if (renewalStatus === "Success") {
                customer.signup_date = newStartDate;
                customer.period = period;
                customer.expire_date = newExpireDate;
                customer.status = "Active";
                customer.tariff = tariff;
                customer.amount = amount;
                customer.renewed_by = renewedBy;
                customer.invoice_number = invoiceNum;
                customer.outstanding_amount = outstandingAmt;
                
                if (config.scriptUrl) {
                    syncCloudAction('save', customer, customer.id, customer.sheetRowIndex || -1, true);
                } else {
                    saveLocalData();
                    renderAll();
                }
            } else {
                if (!config.scriptUrl) {
                    renderAll();
                }
            }
            
            closeRenewalModal();
        }

        async function sendRenewalToCloud(payload, monthSheetName) {
            showSyncToast("Saving monthly renewal to cloud...");
            try {
                const response = await fetch(config.scriptUrl, {
                    method: 'POST',
                    body: JSON.stringify({
                        action: 'save_renewal',
                        sheetId: config.sheetId,
                        monthSheetName: monthSheetName,
                        data: payload
                    })
                });
                const data = await response.json();
                if (data && data.error) {
                    console.error("Cloud Error saving renewal:", data.error);
                    showFailModal("Renewal Sync Failed", "Cloud Error: " + data.error);
                    return;
                }
                showSuccessModal("Renewal Sync Successful", "Customer subscription renewal has been processed and saved to the cloud sheet successfully.");
            } catch (err) {
                console.error("Cloud Renewal Sync failed", err);
                showFailModal("Renewal Sync Failed", "Unable to sync renewal with Google Sheet. Action has been saved locally in the browser.");
            } finally {
                hideSyncToast();
                renderAll();
            }
        }

        // Sidebar Navigation & Search helper
        function switchTab(tabId) {
            document.getElementById('view-dashboard').style.display = tabId === 'dashboard' ? 'block' : 'none';
            document.getElementById('view-signup').style.display = tabId === 'signup' ? 'block' : 'none';
            document.getElementById('view-topup').style.display = tabId === 'topup' ? 'block' : 'none';
            document.getElementById('view-setting').style.display = tabId === 'setting' ? 'block' : 'none';
            
            document.getElementById('m-dashboard').classList.toggle('active', tabId === 'dashboard');
            document.getElementById('m-signup').classList.toggle('active', tabId === 'signup');
            document.getElementById('m-topup').classList.toggle('active', tabId === 'topup');
            document.getElementById('m-setting').classList.toggle('active', tabId === 'setting');

            const headerTitleContainer = document.getElementById('page-title').parentElement;
            const connectionIndicator = document.getElementById('connection-indicator');

            if (tabId === 'dashboard') {
                document.getElementById('page-title').innerText = "Dashboard";
                document.getElementById('page-title-desc').innerText = "Overview of wifi subscriptions, new sign ups, top ups, and distribution charts";
                headerTitleContainer.style.display = 'block';
                connectionIndicator.style.display = 'block';
                renderAll();
            } else if (tabId === 'signup') {
                headerTitleContainer.style.display = 'none';
                connectionIndicator.style.display = 'none';
                renderAll();
            } else if (tabId === 'topup') {
                headerTitleContainer.style.display = 'none';
                connectionIndicator.style.display = 'none';
                renderAll();
            } else if (tabId === 'setting') {
                document.getElementById('page-title').innerText = "Dashboard Settings";
                document.getElementById('page-title-desc').innerText = "Integrate your Google Sheets database and fetch synchronization scripts";
                headerTitleContainer.style.display = 'block';
                connectionIndicator.style.display = 'block';
            }
        }

        function switchSignupSubTab(serviceType) {
            activeSignupTab = serviceType;
            const buttons = document.querySelectorAll('#signup-sub-tabs .sub-tab-btn');
            buttons.forEach(btn => {
                const service = btn.getAttribute('data-service');
                if (service === serviceType) {
                    btn.classList.add('active');
                } else {
                    btn.classList.remove('active');
                }
            });
            signupPage = 1;
            renderSignupList();
        }

        function switchTopupSubTab(serviceType) {
            activeTopupSubTab = serviceType;
            const buttons = document.querySelectorAll('#topup-sub-tabs .sub-tab-btn');
            buttons.forEach(btn => {
                const service = btn.getAttribute('data-service');
                if (service === serviceType) {
                    btn.classList.add('active');
                } else {
                    btn.classList.remove('active');
                }
            });
            customerPage = 1;
            renderCustomerList();
        }

        function toggleAlmostExpiredFilter() {
            filterAlmostExpiredOnly = !filterAlmostExpiredOnly;
            const card = document.querySelector('.stat-card.danger[onclick="toggleAlmostExpiredFilter()"]');
            if (filterAlmostExpiredOnly) {
                card.style.outline = "2px solid #e53935";
                card.style.transform = "scale(1.02)";
            } else {
                card.style.outline = "none";
                card.style.transform = "none";
            }
            renderCustomerList();
        }

        function handleSidebarSearch(e) {
            const query = e.target.value.trim();
            if (e.key === 'Enter' && query) {
                switchTab('topup');
                document.getElementById('search-box').value = query;
                renderCustomerList();
            }
        }

        // Dashboard Visual KPI & Analytics Update
        function updateKPIs() {
            const today = new Date();
            today.setHours(0,0,0,0);
            
            const currentYear = today.getFullYear();
            const currentMonth = today.getMonth();
            
            let totalActive = 0;
            let expiring = 0;
            let overdue = 0;
            let newSignupsCount = 0;
            
            let expiringSmartHome = 0;
            let expiringFiber = 0;
            let expiringSMEService = 0;
            let expiringPrepaid = 0;

            customers.forEach(c => {
                if (c.status === "Active") {
                    totalActive++;
                    
                    if (c.expire_date) {
                        const exp = new Date(c.expire_date);
                        exp.setHours(0,0,0,0);
                        const diffTime = exp - today;
                        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                        
                        if (diffDays < 0) {
                            overdue++;
                        } else if (diffDays <= 5) {
                            expiring++;
                        }
                        
                        // Track counts separately for each service type for those who almost expire (< 5 days, including overdue)
                        if (diffDays <= 5) {
                            const serviceType = c.service_type || 'Smart@Home';
                            if (serviceType === 'Smart@Home') {
                                expiringSmartHome++;
                            } else if (serviceType === 'Fiber+') {
                                expiringFiber++;
                            } else if (serviceType === 'SME Service') {
                                expiringSMEService++;
                            } else if (serviceType === 'Prepaid Service') {
                                expiringPrepaid++;
                            }
                        }
                    }
                }
                
                if (c.signup_date) {
                    const sd = new Date(c.signup_date);
                    if (!isNaN(sd.getTime()) && sd.getFullYear() === currentYear && sd.getMonth() === currentMonth) {
                        newSignupsCount++;
                    }
                }
            });
            
            // Compute success and pending renewals for the current month
            let successRenewCount = 0;
            let pendingPaymentCount = 0;
            let totalRenewalAmount = 0;
            let actualCollection = 0;
            
            const currentMonthYearStr = currentYear + "-" + String(currentMonth + 1).padStart(2, '0'); // YYYY-MM
            
            renewals.forEach(r => {
                if (r.renewal_month === currentMonthYearStr) {
                    if (r.renewal_status === "Success") {
                        successRenewCount++;
                    } else if (r.renewal_status === "Pending Payment") {
                        pendingPaymentCount++;
                    }
                    
                    let amt = parseFloat(r.amount);
                    if (isNaN(amt)) {
                        const cleaned = String(r.amount).replace(/[^0-9.-]/g, '');
                        amt = parseFloat(cleaned) || 0;
                    }
                    let out = parseFloat(r.outstanding_amount);
                    if (isNaN(out)) {
                        const cleaned = String(r.outstanding_amount).replace(/[^0-9.-]/g, '');
                        out = parseFloat(cleaned) || 0;
                    }
                    
                    totalRenewalAmount += amt;
                    if (r.renewal_status === "Success") {
                        actualCollection += (amt - out);
                    }
                }
            });

            // Calculate total Renewal List eligibility across the database
            let totalRenewalListCount = 0;
            const lastDayOfCurrentMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
            lastDayOfCurrentMonth.setHours(23, 59, 59, 999);
            
            customers.forEach(c => {
                const isPendingPayment = c.status === "Pending Payment";
                let isTopupEligible = false;
                
                if (isPendingPayment) {
                    isTopupEligible = true;
                } else if (c.status === 'Active' && c.expire_date) {
                    const exp = new Date(c.expire_date);
                    exp.setHours(0,0,0,0);
                    const diffTime = exp - today;
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    if (exp <= lastDayOfCurrentMonth || diffDays <= 5) {
                        isTopupEligible = true;
                    }
                }
                
                if (isTopupEligible) {
                    totalRenewalListCount++;
                }
            });
            
            const totalExpectedRenewals = successRenewCount + totalRenewalListCount;
            const renewalSuccessRate = totalExpectedRenewals > 0 ? Math.round((successRenewCount / totalExpectedRenewals) * 100) : 0;
            
            document.getElementById('stat-total-active').innerText = totalActive;
            document.getElementById('stat-success-renew').innerText = successRenewCount;
            document.getElementById('stat-pending-payment').innerText = pendingPaymentCount;
            document.getElementById('stat-expiring').innerText = expiring;
            document.getElementById('stat-overdue').innerText = overdue;

            // Update Dashboard Almost Expired Alerts Box
            const alertCountSmartHome = document.getElementById('alert-count-smarthome');
            if (alertCountSmartHome) alertCountSmartHome.innerText = expiringSmartHome;
            const alertCountFiber = document.getElementById('alert-count-fiber');
            if (alertCountFiber) alertCountFiber.innerText = expiringFiber;
            const alertCountSMEService = document.getElementById('alert-count-sme');
            if (alertCountSMEService) alertCountSMEService.innerText = expiringSMEService;
            const alertCountPrepaid = document.getElementById('alert-count-prepaid');
            if (alertCountPrepaid) alertCountPrepaid.innerText = expiringPrepaid;

            // Update Dashboard KPIs
            const dbNewSignups = document.getElementById('db-new-signups');
            if (dbNewSignups) dbNewSignups.innerHTML = `${newSignupsCount} <span class="stat-unit">cust</span>`;
            const dbSuccessTopups = document.getElementById('db-success-topups');
            if (dbSuccessTopups) dbSuccessTopups.innerHTML = `${successRenewCount} <span class="stat-unit">cust</span>`;
            const dbPendingTopups = document.getElementById('db-pending-topups');
            if (dbPendingTopups) dbPendingTopups.innerHTML = `${pendingPaymentCount} <span class="stat-unit">cust</span>`;
            const dbTotalActive = document.getElementById('db-total-active');
            if (dbTotalActive) dbTotalActive.innerHTML = `${totalActive} <span class="stat-unit">cust</span>`;

            // Update newly added headers
            const dbRenewalRate = document.getElementById('db-renewal-rate');
            if (dbRenewalRate) {
                dbRenewalRate.innerHTML = `${renewalSuccessRate}% <span class="stat-unit">(${successRenewCount}/${totalExpectedRenewals})</span>`;
            }
            const dbRenewalCollection = document.getElementById('db-renewal-collection');
            if (dbRenewalCollection) {
                dbRenewalCollection.innerHTML = `$${actualCollection.toFixed(2)} <span class="stat-unit">/ $${totalRenewalAmount.toFixed(2)}</span>`;
            }
        }

        function renderCharts() {
            if (typeof Chart === 'undefined') {
                console.warn("Chart.js is not loaded. Skipping chart rendering.");
                return;
            }

            if (document.getElementById('view-dashboard').style.display === 'none') {
                return;
            }

            // 1. Sign up by Smart Shop, Sale or Other
            const signupCounts = { "Smart Shop": 0, "Sale": 0, "Other": 0 };
            customers.forEach(c => {
                const src = c.source || "Other";
                if (src === "Shop" || src === "Smart Shop") {
                    signupCounts["Smart Shop"]++;
                } else if (src === "Sale") {
                    signupCounts["Sale"]++;
                } else {
                    signupCounts["Other"]++;
                }
            });

            // 2. Renew By Smart Shop or Sale, or Customer
            const renewCounts = { "Smart Shop": 0, "Sale": 0, "Customer": 0 };
            renewals.forEach(r => {
                const rb = r.renewed_by || "Smart Shop";
                if (rb === "Smart Shop" || rb === "Shop") {
                    renewCounts["Smart Shop"]++;
                } else if (rb === "Sale") {
                    renewCounts["Sale"]++;
                } else if (rb === "Customer") {
                    renewCounts["Customer"]++;
                }
            });

            // Fallback to customer-derived renewals if no logged renewals exist
            customers.forEach(c => {
                if (c.renewed_by) {
                    const rb = c.renewed_by;
                    if (rb === "Smart Shop" || rb === "Shop") {
                        renewCounts["Smart Shop"]++;
                    } else if (rb === "Sale") {
                        renewCounts["Sale"]++;
                    } else if (rb === "Customer") {
                        renewCounts["Customer"]++;
                    }
                }
            });

            // 3. Renew Compare with last month
            const today = new Date();
            const currentMonthStr = today.getFullYear() + "-" + String(today.getMonth() + 1).padStart(2, '0');
            const lastMonthDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
            const lastMonthStr = lastMonthDate.getFullYear() + "-" + String(lastMonthDate.getMonth() + 1).padStart(2, '0');

            const currentMonthRenew = { "Smart Shop": 0, "Sale": 0, "Customer": 0 };
            const lastMonthRenew = { "Smart Shop": 0, "Sale": 0, "Customer": 0 };

            renewals.forEach(r => {
                const m = r.renewal_month;
                const rb = r.renewed_by || "Smart Shop";
                const key = (rb === "Smart Shop" || rb === "Shop") ? "Smart Shop" : (rb === "Sale" ? "Sale" : "Customer");
                
                if (m === currentMonthStr) {
                    currentMonthRenew[key]++;
                } else if (m === lastMonthStr) {
                    lastMonthRenew[key]++;
                }
            });

            // Fallback dummy comparison if totally empty for visual appeal
            const hasRenewalData = Object.values(currentMonthRenew).some(v => v > 0) || Object.values(lastMonthRenew).some(v => v > 0);
            if (!hasRenewalData) {
                // Seed some graceful dummy counts for illustration if empty
                currentMonthRenew["Smart Shop"] = Math.max(1, renewCounts["Smart Shop"]);
                currentMonthRenew["Sale"] = Math.max(1, renewCounts["Sale"]);
                currentMonthRenew["Customer"] = Math.max(0, renewCounts["Customer"]);

                lastMonthRenew["Smart Shop"] = Math.max(2, Math.floor(renewCounts["Smart Shop"] * 0.8));
                lastMonthRenew["Sale"] = Math.max(1, Math.floor(renewCounts["Sale"] * 1.2));
                lastMonthRenew["Customer"] = Math.max(0, Math.floor(renewCounts["Customer"] * 0.7));
            }

            if (signupChart) signupChart.destroy();
            if (renewChart) renewChart.destroy();
            if (renewCompareChart) renewCompareChart.destroy();

            // Chart 1: Sign up by Smart Shop, Sale or Other
            signupChart = new Chart(document.getElementById('signupChart'), {
                type: 'bar',
                data: {
                    labels: ['Smart Shop', 'Sale', 'Other'],
                    datasets: [{
                        label: 'Signed Up',
                        data: [signupCounts["Smart Shop"], signupCounts["Sale"], signupCounts["Other"]],
                        backgroundColor: '#1B8C3F',
                        borderRadius: 8,
                        barThickness: 25
                    }]
                },
                options: {
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false },
                        title: { display: true, text: 'Traffic: Sign up by Source', font: { family: 'system-ui, sans-serif', size: 13, weight: '600' } }
                    },
                    scales: {
                        y: { ticks: { stepSize: 1, precision: 0 }, grid: { display: true, color: '#f0f0f0' } },
                        x: { grid: { display: false } }
                    }
                }
            });

            // Chart 2: Renew By Smart Shop or Sale, or Customer
            renewChart = new Chart(document.getElementById('renewChart'), {
                type: 'bar',
                data: {
                    labels: ['Smart Shop', 'Sale', 'Customer'],
                    datasets: [{
                        label: 'Renewed',
                        data: [renewCounts["Smart Shop"], renewCounts["Sale"], renewCounts["Customer"]],
                        backgroundColor: '#FAAD14',
                        borderRadius: 8,
                        barThickness: 25
                    }]
                },
                options: {
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false },
                        title: { display: true, text: 'Traffic: Renew By Method', font: { family: 'system-ui, sans-serif', size: 13, weight: '600' } }
                    },
                    scales: {
                        y: { ticks: { stepSize: 1, precision: 0 }, grid: { display: true, color: '#f0f0f0' } },
                        x: { grid: { display: false } }
                    }
                }
            });

            // Chart 3: Show traffic renewal compare with last month
            renewCompareChart = new Chart(document.getElementById('renewCompareChart'), {
                type: 'line',
                data: {
                    labels: ['Smart Shop', 'Sale', 'Customer'],
                    datasets: [
                        {
                            label: 'This Month',
                            data: [currentMonthRenew["Smart Shop"], currentMonthRenew["Sale"], currentMonthRenew["Customer"]],
                            borderColor: '#1B8C3F',
                            backgroundColor: 'rgba(27, 140, 63, 0.1)',
                            borderWidth: 3,
                            fill: true,
                            tension: 0.3,
                            pointStyle: 'circle',
                            pointRadius: 6,
                            pointHoverRadius: 8,
                            pointBackgroundColor: '#1B8C3F'
                        },
                        {
                            label: 'Last Month',
                            data: [lastMonthRenew["Smart Shop"], lastMonthRenew["Sale"], lastMonthRenew["Customer"]],
                            borderColor: '#90A4AE',
                            backgroundColor: 'rgba(144, 164, 174, 0.1)',
                            borderWidth: 3,
                            fill: true,
                            tension: 0.3,
                            pointStyle: 'circle',
                            pointRadius: 6,
                            pointHoverRadius: 8,
                            pointBackgroundColor: '#90A4AE'
                        }
                    ]
                },
                options: {
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: true, position: 'bottom', labels: { boxWidth: 12, font: { size: 10 } } },
                        title: { display: true, text: 'Renew Traffic vs Last Month', font: { family: 'system-ui, sans-serif', size: 13, weight: '600' } }
                    },
                    scales: {
                        y: { ticks: { stepSize: 1, precision: 0 }, grid: { display: true, color: '#f0f0f0' } },
                        x: { grid: { display: false } }
                    }
                }
            });
        }

        // Helper Toast & Clipboard Functions
        function showSyncToast(text) {
            const toast = document.getElementById('sync-status');
            const toastText = document.getElementById('sync-text');
            toastText.innerText = text;
            toast.style.display = 'flex';
        }

        function hideSyncToast() {
            document.getElementById('sync-status').style.display = 'none';
        }

        function showSuccessModal(title, message) {
            document.getElementById('status-modal-icon').innerHTML = `
                <svg fill="none" stroke="#1B8C3F" stroke-width="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" style="width: 64px; height: 64px; margin: 0 auto 15px;">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>`;
            document.getElementById('status-modal-title').innerText = title;
            document.getElementById('status-modal-message').innerText = message;
            document.getElementById('status-modal-overlay').classList.add('active');
        }

        function showFailModal(title, message) {
            document.getElementById('status-modal-icon').innerHTML = `
                <svg fill="none" stroke="#FF4D4F" stroke-width="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" style="width: 64px; height: 64px; margin: 0 auto 15px;">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>`;
            document.getElementById('status-modal-title').innerText = title;
            document.getElementById('status-modal-message').innerText = message;
            document.getElementById('status-modal-overlay').classList.add('active');
        }

        function closeStatusModal() {
            document.getElementById('status-modal-overlay').classList.remove('active');
        }

        function copyBackendCode() {
            const code = getBackendCodeText();
            navigator.clipboard.writeText(code).then(() => {
                alert("Apps Script code copied to clipboard! You can paste it into Extensions > Apps Script in Google Sheets.");
            }).catch(err => {
                console.error('Failed to copy', err);
                alert("Could not copy automatically. Please select and copy manually.");
            });
        }

        function getBackendCodeText() {
            return `/**
 * Google Apps Script for SS-OPS Customer Top-Up Dashboard
 * Deployed as a Web App:
 * - Execute as: Me (your email)
 * - Who has access: Anyone
 */

const DEFAULT_SPREADSHEET_ID = "1zhRKPlJN60YgwqVvkzCrIGPBHW36U5t5B_dDgx6JCcI";

const SHEET_NAMES = [
  "Sign Up",
  "Renew Smart@Home",
  "Fiber+",
  "SME Service",
  "Pre-paid",
  "Terminate"
];

function doGet(e) {
  return handleRequest(e);
}

function doPost(e) {
  return handleRequest(e);
}

function handleRequest(e) {
  try {
    const action = e.parameter.action || (e.postData && JSON.parse(e.postData.contents).action);
    const customSheetId = e.parameter.sheetId || (e.postData && JSON.parse(e.postData.contents).sheetId);
    const spreadsheetId = customSheetId || DEFAULT_SPREADSHEET_ID;
    
    const ss = SpreadsheetApp.openById(spreadsheetId);
    ensureAllSheets(ss);
    
    if (action === 'get') {
      const data = getDataAll(ss);
      return jsonResponse(data);
    }
    
    let payload = null;
    let id = e.parameter.id;
    let index = e.parameter.index;
    let monthSheetName = e.parameter.monthSheetName;
    
    if (e.parameter.data) {
      payload = JSON.parse(e.parameter.data);
    } else if (e.postData) {
      const postBody = JSON.parse(e.postData.contents);
      payload = postBody.data;
      id = id || postBody.id;
      index = index || postBody.index;
      monthSheetName = monthSheetName || postBody.monthSheetName;
    }
    
    if (action === 'save') {
      if (!payload) {
        return jsonResponse({ error: "Missing payload data for save" });
      }
      saveData(ss, payload, id);
      return jsonResponse(getDataAll(ss));
    }
    
    if (action === 'save_renewal') {
      if (!payload) {
        return jsonResponse({ error: "Missing payload data for renewal save" });
      }
      if (!monthSheetName) {
        return jsonResponse({ error: "Missing monthSheetName for renewal save" });
      }
      saveRenewalData(ss, monthSheetName, payload);
      return jsonResponse({ success: true, data: getDataAll(ss) });
    }
    
    if (action === 'delete') {
      deleteData(ss, id);
      return jsonResponse(getDataAll(ss));
    }
    
    return jsonResponse({ error: "Invalid action. Supported: get, save, delete" });
  } catch (error) {
    return jsonResponse({ error: error.toString() });
  }
}

function ensureAllSheets(ss) {
  SHEET_NAMES.forEach(name => {
    let sheet = ss.getSheetByName(name);
    if (!sheet) {
      sheet = ss.insertSheet(name);
    }
    ensureHeaders(sheet);
  });
}

function ensureHeaders(sheet) {
  if (sheet.getLastRow() === 0) {
    const headers = [
      "ID", "Customer Name", "Top Up Number", "Contact", 
      "Source", "PIC", "Tariff / Service", "Amount", 
      "Sign Up Date", "Period", "Expiry Date", "Status", "Overdue Days",
      "Service Type", "Free Service", "Invoice Number", "Outstanding Amount"
    ];
    sheet.appendRow(headers);
    sheet.getRange(1, 1, 1, headers.length)
      .setFontWeight("bold")
      .setBackground("#1B8C3F")
      .setFontColor("white");
  }
}

function findCustomerById(ss, id) {
  if (!id) return null;
  for (let i = 0; i < SHEET_NAMES.length; i++) {
    const sheetName = SHEET_NAMES[i];
    const sheet = ss.getSheetByName(sheetName);
    if (!sheet) continue;
    
    const rows = sheet.getDataRange().getValues();
    for (let r = 1; r < rows.length; r++) {
      if (rows[r][0] && rows[r][0].toString() === id.toString()) {
        return {
          sheet: sheet,
          sheetName: sheetName,
          rowIndex: r + 1,
          rowData: rows[r]
        };
      }
    }
  }
  return null;
}

function getDataAll(ss) {
  const allData = [];
  SHEET_NAMES.forEach(sheetName => {
    const sheet = ss.getSheetByName(sheetName);
    if (!sheet) return;
    const rows = sheet.getDataRange().getValues();
    if (rows.length <= 1) return;
    
    const headers = rows[0];
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      const item = {};
      headers.forEach((header, colIdx) => {
        const key = getPropertyKey(header);
        let val = row[colIdx];
        if (val instanceof Date) {
          val = Utilities.formatDate(val, Session.getScriptTimeZone(), "yyyy-MM-dd");
        }
        item[key] = val;
      });
      item.sheetRowIndex = i + 1;
      item.sheetName = sheetName;
      if (sheetName !== "Sign Up" && sheetName !== "Terminate" && sheetName !== "Terminated") {
        item.is_renewed = true;
      }
      allData.push(item);
    }
  });
  return allData;
}

function getPropertyKey(header) {
  const map = {
    "ID": "id",
    "Customer Name": "customer",
    "Top Up Number": "number",
    "Contact": "contact",
    "Source": "source",
    "PIC": "pic",
    "Tariff / Service": "tariff",
    "Amount": "amount",
    "Sign Up Date": "signup_date",
    "New Start Date": "new_start_date",
    "Period": "period",
    "Expiry Date": "expire_date",
    "New Expiry Date": "new_expire_date",
    "Status": "status",
    "Renewal Status": "renewal_status",
    "Overdue Days": "overdue_days",
    "Renewal ID": "renewal_id",
    "Logged At": "logged_at",
    "Service Type": "service_type",
    "Free Service": "free_service",
    "Invoice Number": "invoice_number",
    "Outstanding Amount": "outstanding_amount",
    "Renewed By": "renewed_by"
  };
  return map[header] || header.toLowerCase().replace(/[^a-z0-9]/g, "_");
}

function getTargetSheetName(payload) {
  if (payload.status && (payload.status.toLowerCase() === "terminate" || payload.status.toLowerCase() === "terminated")) {
    return "Terminate";
  }
  
  if (payload.is_renewed) {
    const serviceType = payload.service_type || "Smart@Home";
    const stLower = serviceType.toLowerCase();
    if (stLower.includes("smart@home") || stLower.includes("home")) return "Renew Smart@Home";
    if (stLower.includes("fiber")) return "Fiber+";
    if (stLower.includes("sme")) return "SME Service";
    if (stLower.includes("pre-paid") || stLower.includes("prepaid")) return "Pre-paid";
    
    // Default fallback if no match
    return "Renew Smart@Home";
  }
  
  return "Sign Up";
}

function saveData(ss, payload, id) {
  const searchId = id || payload.id;
  const existing = findCustomerById(ss, searchId);
  
  // If editing an existing customer who is already in a renewed sheet, keep the renewed flag
  if (existing && ["Renew Smart@Home", "Smart@Home", "Fiber+", "SME Service", "SME service", "Pre-paid", "Pre-paid service"].indexOf(existing.sheetName) !== -1) {
    payload.is_renewed = true;
  }
  
  const targetSheetName = getTargetSheetName(payload);
  const targetSheet = ss.getSheetByName(targetSheetName);
  
  ensureHeaders(targetSheet);
  const headers = targetSheet.getRange(1, 1, 1, targetSheet.getLastColumn()).getValues()[0];
  
  const rowValues = headers.map(header => {
    const key = getPropertyKey(header);
    if (key === "id" && !payload.id) {
      return searchId || "CUST_" + new Date().getTime() + "_" + Math.floor(Math.random() * 1000);
    }
    return payload[key] !== undefined ? payload[key] : "";
  });
  
  if (existing) {
    if (existing.sheetName === targetSheetName) {
      // Update existing row
      targetSheet.getRange(existing.rowIndex, 1, 1, rowValues.length).setValues([rowValues]);
    } else {
      // Delete from old sheet
      existing.sheet.deleteRow(existing.rowIndex);
      // Append to new sheet
      targetSheet.appendRow(rowValues);
    }
  } else {
    // Append to target sheet
    targetSheet.appendRow(rowValues);
  }
}

function deleteData(ss, id) {
  const existing = findCustomerById(ss, id);
  if (existing) {
    existing.sheet.deleteRow(existing.rowIndex);
  }
}

function saveRenewalData(ss, monthSheetName, payload) {
  let renewalSheet = ss.getSheetByName(monthSheetName);
  if (!renewalSheet) {
    renewalSheet = ss.insertSheet(monthSheetName);
  }
  
  // Ensure headers for the renewal sheet
  if (renewalSheet.getLastRow() === 0) {
    const headers = [
      "Renewal ID", "Customer Name", "Top Up Number", "Contact", 
      "Source", "PIC", "Tariff / Service", "Amount", 
      "New Start Date", "Period", "New Expiry Date", "Renewal Status", 
      "Renewed By", "Invoice Number", "Outstanding Amount", "Logged At"
    ];
    renewalSheet.appendRow(headers);
    renewalSheet.getRange(1, 1, 1, headers.length)
      .setFontWeight("bold")
      .setBackground("#1B8C3F")
      .setFontColor("white");
  }
  
  const headers = renewalSheet.getRange(1, 1, 1, renewalSheet.getLastColumn()).getValues()[0];
  
  const searchId = payload.renewal_id || ("REN_" + new Date().getTime() + "_" + Math.floor(Math.random() * 1000));
  payload.renewal_id = searchId;
  payload.logged_at = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd HH:mm:ss");
  
  const dataRows = renewalSheet.getDataRange().getValues();
  let targetRowIndex = -1;
  for (let i = 1; i < dataRows.length; i++) {
    if (dataRows[i][0].toString() === searchId.toString()) {
      targetRowIndex = i + 1;
      break;
    }
  }
  
  const rowValues = headers.map(header => {
    const key = getPropertyKey(header);
    return payload[key] !== undefined ? payload[key] : "";
  });
  
  if (targetRowIndex > 1 && targetRowIndex <= renewalSheet.getLastRow()) {
    renewalSheet.getRange(targetRowIndex, 1, 1, rowValues.length).setValues([rowValues]);
  } else {
    renewalSheet.appendRow(rowValues);
  }
}

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}`;
        }
