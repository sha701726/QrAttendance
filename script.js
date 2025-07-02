

// Configuration
const MATCH_QR_STRING = "ABCDEF1234567890ABCDEF1234567890";
const SUBMIT_URL = "https://script.google.com/macros/library/d/1OtS6uOg7zSpyGURr-7CJvOhYurBfeXC7Zf3hugirE94RQeyvrgADefwf/1";
// const SUBMIT_URL = "https://jsonplaceholder.typicode.com/posts"; 
// State
let data = {};
let scannerStopped = false;
let qrScanner = null;

// Check localStorage immediately on page load
const storedData = localStorage.getItem('tempVirusData');
if (storedData) {
    try {
        data = JSON.parse(storedData);
        if (data.fullName) {
            console.log('Data found in localStorage:', data);
        }
    } catch (e) {
        console.error('Error parsing stored data:', e);
    }
}

// DOM Elements - Initialize after DOM loads
let form, formCard, userInfoDisplay, savedInfo, editInfoBtn, successModal, closeModal;
let statusDot, statusText, formStatusBadge, scannerStatusBadge, submissionStatusBadge, scannerStatus;

// Initialize DOM elements
function initDOMElements() {
    form = document.getElementById('virus-form');
    formCard = document.getElementById('form-card');
    userInfoDisplay = document.getElementById('user-info-display');
    savedInfo = document.getElementById('saved-info');
    editInfoBtn = document.getElementById('edit-info-btn');
    successModal = document.getElementById('success-modal');
    closeModal = document.getElementById('close-modal');

    // Status elements
    statusDot = document.getElementById('status-dot');
    statusText = document.getElementById('status-text');
    formStatusBadge = document.getElementById('form-status-badge');
    scannerStatusBadge = document.getElementById('scanner-status-badge');
    submissionStatusBadge = document.getElementById('submission-status-badge');
    scannerStatus = document.getElementById('scanner-status');
}

// Initialize application
function init() {
    // Initialize DOM elements first
    initDOMElements();
    
    // Data is already loaded at script start, just use it
    if (data.fullName) {
        form.style.display = 'none';
        userInfoDisplay.style.display = 'block';

        if (data.submitted) {
            updateStatus('submitted');
        } else {
            updateStatus('form-complete');
            startQRScanner();
        }
    }
    updateStatusIndicators();
    
    // Add event listeners
    addEventListeners();
}

// Add event listeners
function addEventListeners() {
    form.addEventListener('submit', handleFormSubmit);
    editInfoBtn.addEventListener('click', handleEditInfo);
    closeModal.addEventListener('click', handleCloseModal);
}

// Update status indicators
function updateStatus(status) {
    switch (status) {
        case 'form-complete':
            statusDot.className = 'w-3 h-3 bg-blue-400 rounded-full animate-pulse';
            statusText.textContent = 'Scanner Active';
            formStatusBadge.textContent = 'Complete';
            formStatusBadge.className = 'px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full';
            scannerStatusBadge.textContent = 'Active';
            scannerStatusBadge.className = 'px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full';
            break;
        case 'scanning':
            scannerStatus.innerHTML = '<div class="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div><span class="text-sm text-blue-600">Scanning...</span>';
            break;
        case 'submitted':
            statusDot.className = 'w-3 h-3 bg-green-500 rounded-full';
            statusText.textContent = 'Attendance Submitted';
            submissionStatusBadge.textContent = 'Submitted';
            submissionStatusBadge.className = 'px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full';
            scannerStatusBadge.textContent = 'Stopped';
            scannerStatusBadge.className = 'px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full';
            scannerStatus.innerHTML = '<div class="w-2 h-2 bg-green-500 rounded-full"></div><span class="text-sm text-green-600">Complete</span>';
            break;
        default:
            statusDot.className = 'w-3 h-3 bg-yellow-400 rounded-full animate-pulse';
            statusText.textContent = 'Waiting for Information';
    }
}

function updateStatusIndicators() {
    if (data.submitted) {
        updateStatus('submitted');
    } else if (data.fullName) {
        updateStatus('form-complete');
    }
}

// Show user information
function showUserInfo() {
    form.style.display = 'none';
    userInfoDisplay.style.display = 'block';
    // Don't show saved data for privacy - just show confirmation
}

// Start QR Scanner
function startQRScanner() {
    if (qrScanner) return;

    updateStatus('scanning');
    
    // Show loading state first
    document.getElementById('qr-reader').innerHTML = `
        <div class="text-center text-blue-600 p-8">
            <div class="animate-spin w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full mx-auto mb-4"></div>
            <p class="font-medium">Starting camera...</p>
            <p class="text-sm mt-1">Please allow camera access when prompted</p>
        </div>
    `;

    qrScanner = new Html5Qrcode("qr-reader");

    qrScanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        async (decodedText) => {
            if (decodedText === MATCH_QR_STRING && data.fullName && !data.submitted && !scannerStopped) {
                await handleSuccessfulScan();
            }
        },
        (error) => {
            // Silently ignore scan errors
        }
    ).catch(err => {
        console.error("Failed to start QR scanner:", err);
        
        let errorTitle = "Camera Access Needed";
        let errorMessage = "To scan QR codes, please allow camera access in your browser.";
        let troubleshooting = "If you're having trouble, check browser settings or try refreshing the page.";
        
        // Detect common issues
        if (err.message.includes("NotAllowedError") || err.message.includes("Permission denied")) {
            errorTitle = "Camera Permission Denied";
            errorMessage = "Click the camera icon in your browser's address bar and select 'Allow'.";
            troubleshooting = "After allowing permission, click 'Try Again' below.";
        } else if (window.location.protocol === 'http:' && window.location.hostname !== 'localhost') {
            errorTitle = "HTTPS Required";
            errorMessage = "Camera access requires a secure connection (HTTPS).";
            troubleshooting = "Try opening this page in Replit's preview instead of VS Code Live Server.";
        } else if (window.location.hostname === '127.0.0.1' || window.location.hostname === 'localhost') {
            errorTitle = "Local Testing Limitation";
            errorMessage = "Camera access may not work on localhost in some browsers.";
            troubleshooting = "For testing: Use Replit preview, or create a test QR code manually.";
        }
        
        // Show user-friendly error with retry option
        document.getElementById('qr-reader').innerHTML = `
            <div class="text-center p-8">
                <svg class="w-12 h-12 mx-auto mb-3 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
                </svg>
                <h3 class="font-medium text-gray-900 mb-2">${errorTitle}</h3>
                <p class="text-sm text-gray-600 mb-4">${errorMessage}</p>
                <div class="space-y-2">
                    <button onclick="startQRScanner()" class="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                        Try Again
                    </button>
                    <button onclick="simulateQRScan()" class="block mx-auto bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                        Test Without Camera
                    </button>
                </div>
                <p class="text-xs text-gray-500 mt-3">${troubleshooting}</p>
            </div>
        `;
        
        // Reset scanner status
        scannerStatusBadge.textContent = 'Permission Needed';
        scannerStatusBadge.className = 'px-2 py-1 text-xs font-medium bg-orange-100 text-orange-800 rounded-full';
    });
}

// Handle successful QR scan
async function handleSuccessfulScan() {
    data.submitted = true;
    localStorage.setItem('tempVirusData', JSON.stringify(data));
    scannerStopped = true;

    // Step 1: Get current location
    navigator.geolocation.getCurrentPosition(async (position) => {
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;

        try {
            // Step 2: Send data + location to backend
            const response = await fetch(SUBMIT_URL, {
                method: 'POST',
                mode: 'cors',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    fullName: data.fullName,
                    mobile: data.mobile,
                    employeeId: data.employeeId,
                    department: data.department,
                    timestamp: new Date().toISOString(),
                    location: {
                        lat: latitude,
                        lng: longitude
                    }
                })
            });

            // Check if request was successful
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const result = await response.json();
            console.log('Server response:', result);

            // Stop QR scanner
            if (qrScanner) {
                await qrScanner.stop();
                qrScanner = null;
            }

            document.getElementById("qr-reader").innerHTML = `
                    <div class="text-center text-green-600 p-8 success-glow">
                        <svg class="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                        <p class="font-semibold text-lg mb-2">Attendance Recorded!</p>
                        <p class="text-sm">${result.message || 'Your attendance has been successfully submitted.'}</p>
                    </div>
                `;

            updateStatus('submitted');
            successModal.classList.remove('hidden');
            successModal.classList.add('flex');

        } catch (err) {
            console.error("Error submitting data:", err);
            
            let errorMsg = "Error submitting attendance. Please try again.";
            if (err.message.includes('CORS') || err.message.includes('fetch')) {
                errorMsg = "Network error. For local testing";
            } else if (err.message.includes('HTTP')) {
                errorMsg = `Server error: ${err.message}`;
            }
            
            alert(err);
            
            // Reset submission state for retry
            data.submitted = false;
            scannerStopped = false;
            localStorage.setItem('tempVirusData', JSON.stringify(data));
        }

    }, (error) => {
        alert("Please allow location access to complete your attendance.");
        console.error("Location error:", error);
        
        // Reset submission state for retry
        data.submitted = false;
        scannerStopped = false;
        localStorage.setItem('tempVirusData', JSON.stringify(data));
    });
}

// Test function for when camera isn't available
function simulateQRScan() {
    if (data.fullName && !data.submitted) {
        const userConfirm = confirm(
            `Test Mode: Simulate QR scan for ${data.fullName}?\n\n` +
            "This will attempt to submit your attendance without actually scanning a QR code."
        );
        
        if (userConfirm) {
            handleSuccessfulScan();
        }
    } else if (data.submitted) {
        alert("Attendance already submitted for today!");
    } else {
        alert("Please fill in your information first.");
    }
}


// Event Handler Functions
function handleFormSubmit(e) {
    e.preventDefault();

    data = {
        fullName: document.getElementById('fullName').value.trim(),
        mobile: document.getElementById('mobile').value.trim(),
        employeeId: document.getElementById('employeeId').value.trim(),
        department: document.getElementById('department').value.trim(),
        submitted: false
    };

    localStorage.setItem('tempVirusData', JSON.stringify(data));
    showUserInfo();
    updateStatus('form-complete');
    startQRScanner();
}

function handleEditInfo() {
    form.style.display = 'block';
    userInfoDisplay.style.display = 'none';

    // Pre-fill form with existing data
    document.getElementById('fullName').value = data.fullName || '';
    document.getElementById('mobile').value = data.mobile || '';
    document.getElementById('employeeId').value = data.employeeId || '';
    document.getElementById('department').value = data.department || '';
}

function handleCloseModal() {
    successModal.classList.add('hidden');
    successModal.classList.remove('flex');
}

// Initialize app when DOM is fully loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

function doGet(e) {
  return ContentService.createTextOutput("This endpoint accepts POST requests.");
}
