import http from 'k6/http';
import { group, check, sleep } from 'k6';
import { SharedArray } from 'k6/data';
import papaparse from 'https://jslib.k6.io/papaparse/5.1.1/index.js';
import { Trend, Rate, Counter } from 'k6/metrics';
import { textSummary } from "https://jslib.k6.io/k6-summary/0.0.2/index.js";

// Environment configuration
const ENV = 'dev'; // enviornments available: demo, dev
const VU_COUNT = 100;

// Define metrics including both trends and rates
const metrics = {
    trends: {
        loginPageLoadTime: new Trend('login_page_load_time'),
        loginPageResourceAvgTime: new Trend('login_page_resource_avg_time'),
        loginPageResourceTotalTime: new Trend('login_page_resource_total_time'),
        landingPageLoadTime: new Trend('landing_page_load_time'),
        landingPageResourceAvgTime: new Trend('landing_page_resource_avg_time'),
        landingPageResourceTotalTime: new Trend('landing_page_resource_total_time'),
        voiceNotePageLoadTime: new Trend('voice_note_page_load_time'),
        voiceNotePageResourceAvgTime: new Trend('voice_note_page_resource_avg_time'),
        voiceNotePageResourceTotalTime: new Trend('voice_note_page_resource_total_time'),
        csrfTime: new Trend('csrf_time'),
        loginTime: new Trend('login_time'),
        getUserTime: new Trend('get_user_time'),
        broadcastAuthTime: new Trend('broadcast_auth_time'),
        educationContentTime: new Trend('education_content_time'),
        educationConditionsTime: new Trend('education_conditions_time'),
        educationTreatmentTime: new Trend('education_treatment_time'),
        educationRiskTime: new Trend('education_risk_time'),
        educationPlaylistTime: new Trend('education_playlist_time'),
        createSessionTime: new Trend('create_session_time'),
        createVoiceNoteTime: new Trend('create_voice_note_time'),
        totalUploadTime: new Trend('total_upload_time'),
        s3ResponseTime: new Trend('s3_response_time'),
        stop1Time: new Trend('stop1_time'),
        transcribeTime: new Trend('transcribe_time'),
        createTitleTime: new Trend('create_title_time'),
        totalPageReadyTime: new Trend('total_page_ready_time'),
        apiSequenceTime: new Trend('api_sequence_time'),
        videoPlaybackPageLoadTime: new Trend('video_playback_page_load_time'),
        contentViewTrackingTime: new Trend('content_view_tracking_time'),
        videoPlaybackTrackingTime: new Trend('video_playback_tracking_time'),
        // Add specific metrics for the three API calls
        educationContentViewTrackingTime: new Trend('education_content_view_tracking_time'),
        educationTrackingCreateTime: new Trend('education_tracking_create_time'),
        educationTrackingCreateUuidTime: new Trend('education_tracking_create_uuid_time')
    },
    rates: {
        loginPageLoadFailRate: new Rate('login_page_load_fail_rate'),
        loginPageResourceFailRate: new Rate('login_page_resource_fail_rate'),
        landingPageLoadFailRate: new Rate('landing_page_load_fail_rate'),
        landingPageResourceFailRate: new Rate('landing_page_resource_fail_rate'),
        voiceNotePageLoadFailRate: new Rate('voice_note_page_load_fail_rate'),
        voiceNotePageResourceFailRate: new Rate('voice_note_page_resource_fail_rate'),
        csrfFailRate: new Rate('csrf_fail_rate'),
        loginFailRate: new Rate('login_fail_rate'),
        getUserFailRate: new Rate('get_user_fail_rate'),
        broadcastAuthFailRate: new Rate('broadcast_auth_fail_rate'),
        educationConditionsFailRate: new Rate('education_conditions_fail_rate'),
        educationTreatmentFailRate: new Rate('education_treatment_fail_rate'),
        educationRiskFailRate: new Rate('education_risk_fail_rate'),
        educationPlaylistFailRate: new Rate('education_playlist_fail_rate'),
        createSessionFailRate: new Rate('create_session_fail_rate'),
        createVoiceNoteFailRate: new Rate('create_voice_note_fail_rate'),
        s3UploadFailRate: new Rate('s3_upload_fail_rate'),
        stop1FailRate: new Rate('stop1_fail_rate'),
        transcribeFailRate: new Rate('transcribe_fail_rate'),
        createTitleFailRate: new Rate('create_title_fail_rate'),
        videoPlaybackPageFailRate: new Rate('video_playback_page_fail_rate'),
        contentViewTrackingFailRate: new Rate('content_view_tracking_fail_rate'),
        videoPlaybackTrackingFailRate: new Rate('video_playback_tracking_fail_rate'),
        // Add specific failure rates for the three API calls
        educationContentViewTrackingFailRate: new Rate('education_content_view_tracking_fail_rate'),
        educationTrackingCreateFailRate: new Rate('education_tracking_create_fail_rate'),
        educationTrackingCreateUuidFailRate: new Rate('education_tracking_create_uuid_fail_rate')
    },
    counters: {
        loginPageTotalRequests: new Counter('login_page_total_requests'),
        loginPageResourceRequests: new Counter('login_page_resource_requests'),
        landingPageTotalRequests: new Counter('landing_page_total_requests'),
        landingPageResourceRequests: new Counter('landing_page_resource_requests'),
        voiceNotePageTotalRequests: new Counter('voice_note_page_total_requests'),
        voiceNotePageResourceRequests: new Counter('voice_note_page_resource_requests'),
        csrfRequests: new Counter('csrf_requests'),
        loginRequests: new Counter('login_requests'),
        getUserRequests: new Counter('get_user_requests'),
        broadcastAuthRequests: new Counter('broadcast_auth_requests'),
        educationConditionsRequests: new Counter('education_conditions_requests'),
        educationTreatmentRequests: new Counter('education_treatment_requests'),
        educationRiskRequests: new Counter('education_risk_requests'),
        educationPlaylistRequests: new Counter('education_playlist_requests'),
        createSessionRequests: new Counter('create_session_requests'),
        createVoiceNoteRequests: new Counter('create_voice_note_requests'),
        s3UploadRequests: new Counter('s3_upload_requests'),
        s3ResponseRequests: new Counter('s3_response_requests'),
        stop1Requests: new Counter('stop1_requests'),
        transcribeRequests: new Counter('transcribe_requests'),
        createTitleRequests: new Counter('create_title_requests'),
        videoPlaybackPageRequests: new Counter('video_playback_page_requests'),
        contentViewTrackingRequests: new Counter('content_view_tracking_requests'),
        videoPlaybackTrackingRequests: new Counter('video_playback_tracking_requests'),
        // Add specific counters for the three API calls
        educationContentViewTrackingRequests: new Counter('education_content_view_tracking_requests'),
        educationTrackingCreateRequests: new Counter('education_tracking_create_requests'),
        educationTrackingCreateUuidRequests: new Counter('education_tracking_create_uuid_requests')
    }
};

// Add these metrics for upload specifics
const uploadMetrics = {
    chunkSize: new Trend('chunk_size'),
    s3ResponseTime: new Trend('s3_response_time')
};

// Add resource types to track
const RESOURCE_EXTENSIONS = [
    '.js', '.css', '.png', '.jpg', '.jpeg', '.gif', '.svg', 
    '.woff', '.woff2', '.ttf', '.eot', '.ico'
];

// Helper function to check if URL is a resource
function isResource(url) {
    return RESOURCE_EXTENSIONS.some(ext => url.toLowerCase().endsWith(ext));
}

// Helper function to make resource requests for a page
function loadPageResources(html, baseUrl, headers) {
    // Use a Set of strings for deduplication
    const resourceUrlSet = new Set();

    // CSS files
    const cssLinks = html.match(/<link[^>]+href=["']([^"']+\.css[^"']*)["'][^>]*>/gi) || [];
    cssLinks.forEach(link => {
        const match = link.match(/href=["']([^"']+)["']/i);
        if (match) {
            const url = match[1].startsWith('http') ? match[1] :
                        match[1].startsWith('/') ? `${baseUrl}${match[1]}` :
                        `${baseUrl}/${match[1]}`;
            resourceUrlSet.add(url);
        }
    });

    // JavaScript files
    const jsScripts = html.match(/<script[^>]+src=["']([^"']+\.js[^"']*)["'][^>]*>/gi) || [];
    jsScripts.forEach(script => {
        const match = script.match(/src=["']([^"']+)["']/i);
        if (match) {
            const url = match[1].startsWith('http') ? match[1] :
                        match[1].startsWith('/') ? `${baseUrl}${match[1]}` :
                        `${baseUrl}/${match[1]}`;
            resourceUrlSet.add(url);
        }
    });

    // Images
    const images = html.match(/<img[^>]+src=["']([^"']+)["'][^>]*>/gi) || [];
    images.forEach(img => {
        const match = img.match(/src=["']([^"']+)["']/i);
        if (match) {
            const url = match[1].startsWith('http') ? match[1] :
                        match[1].startsWith('/') ? `${baseUrl}${match[1]}` :
                        `${baseUrl}/${match[1]}`;
            resourceUrlSet.add(url);
        }
    });

    // Convert Set to Array
    const uniqueResourceUrls = Array.from(resourceUrlSet);

    // Prepare batch requests
    const batchRequests = uniqueResourceUrls.map(url => ({
        method: 'GET',
        url: url,
        params: { headers }
    }));

    // Fire all requests in parallel
    const responses = http.batch(batchRequests);

    // Map results
    return responses.map((response, i) => ({
        response,
        url: uniqueResourceUrls[i],
        duration: response.timings.duration,
        success: response.status < 400
    }));
}

export let options = {
    stages: [
        { duration: '5m', target: VU_COUNT },  
        { duration: '20m', target: VU_COUNT }, 
        { duration: '5m', target: 0 },    
    ],
    summaryTrendStats: ['avg', 'min', 'med', 'max', 'p(95)', 'p(99)', 'count'],
};

// Add a shared counter for tracking total requests across VUs
const sharedMetrics = {
    loginPageTotal: new Counter('login_page_total_per_vu'),
    landingPageTotal: new Counter('landing_page_total_per_vu'),
    voiceNotePageTotal: new Counter('voice_note_page_total_per_vu'),
    csrfTotal: new Counter('csrf_total_per_vu'),
    loginRequestTotal: new Counter('login_request_total_per_vu'),
};

// Helper function to track per-VU requests
function addRequestCount(counter, count = 1) {
    counter.add(count);
    // Log the current count for debugging
    console.log(`VU ${__VU}: Added ${count} requests. Current total: ${counter.name}`);
}

const BASE_URL = `https://${ENV}-v3-api.chairsyde.com`;
const DASHBOARD_ORIGIN = ENV === 'demo' ? 'https://demo.chairsyde.com' : 'https://dev-v3-dashboard.chairsyde.com';
const LOGIN_TIMEZONE = 'Europe/London';
const LOGIN_RECAPTCHA_TOKEN = '03AFcWeA4zNqUzKetoMr9753D1ckS';

// Cookie name based on environment
const SESSION_COOKIE_NAME = `${ENV}_chairsyde_session`;

const COMMON_HEADERS = {
    'Origin': DASHBOARD_ORIGIN,
    'Accept': '*/*',
    'Accept-Encoding': 'gzip, deflate, br, zstd',
    'Accept-Language': 'en-GB,en-US;q=0.9,en;q=0.8',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36',
};

// Load users from CSV
const users = new SharedArray('users', function () {
    const csvData = open('users.csv');
    if (!csvData) {
        throw new Error('users.csv file not found or is empty!');
    }
    const parsed = papaparse.parse(csvData, { header: true }).data;
    if (!parsed || parsed.length === 0 || !parsed[0].email) {
        throw new Error('users.csv is empty or missing required columns!');
    }
    return parsed;
});

const chunkFileNames = Array.from({length: 50}, (_, i) => `chunk${i}.webm`);

const chunkFiles = [];
for (let i = 0; i < chunkFileNames.length; i++) {
    const name = chunkFileNames[i];
    try {
        const data = open(`chunk/${name}`, 'b');
        if (!data) {
            continue;
        }
        // Get binary data size
        const size = data.byteLength || data.length || 0;
        chunkFiles.push({ 
            name, 
            data,
            size,
            type: 'audio/webm; codecs=opus'  // Back to webm codec
        });
    } catch (err) {
    }
}

// Improved S3 upload function
function uploadChunkToS3(voiceNoteId, chunk, index, totalChunks, authHeaders, existingSegmentKey, initialUploadData) {
    // Use the initial upload data and segment key for all uploads
    const s3Details = initialUploadData;
    
    // 2. Prepare for direct S3 upload with the correct key
    const fileIndex = parseInt(chunk.name.replace('chunk', '').replace('.webm', ''));
    const key = `${existingSegmentKey}/${fileIndex}`;
    
    // Create multipart form data with exact field ordering as seen in successful requests
    const boundary = '----WebKitFormBoundary' + Math.random().toString(36).substring(2);
    const formData = [];

    // Add fields in exact order from successful request with exact formatting
    formData.push(`--${boundary}\r\n`);
    formData.push('Content-Disposition: form-data; name="acl"\r\n\r\n');
    formData.push('private\r\n');

    formData.push(`--${boundary}\r\n`);
    formData.push('Content-Disposition: form-data; name="key"\r\n\r\n');
    formData.push(`${key}\r\n`);

    formData.push(`--${boundary}\r\n`);
    formData.push('Content-Disposition: form-data; name="X-Amz-Credential"\r\n\r\n');
    formData.push(`${s3Details.upload_fields['X-Amz-Credential']}\r\n`);

    formData.push(`--${boundary}\r\n`);
    formData.push('Content-Disposition: form-data; name="X-Amz-Algorithm"\r\n\r\n');
    formData.push(`${s3Details.upload_fields['X-Amz-Algorithm']}\r\n`);

    formData.push(`--${boundary}\r\n`);
    formData.push('Content-Disposition: form-data; name="X-Amz-Date"\r\n\r\n');
    formData.push(`${s3Details.upload_fields['X-Amz-Date']}\r\n`);

    formData.push(`--${boundary}\r\n`);
    formData.push('Content-Disposition: form-data; name="Policy"\r\n\r\n');
    formData.push(`${s3Details.upload_fields.Policy}\r\n`);

    formData.push(`--${boundary}\r\n`);
    formData.push('Content-Disposition: form-data; name="X-Amz-Signature"\r\n\r\n');
    formData.push(`${s3Details.upload_fields['X-Amz-Signature']}\r\n`);

    formData.push(`--${boundary}\r\n`);
    formData.push('Content-Disposition: form-data; name="Content-Type"\r\n\r\n');
    formData.push('audio/webm\r\n');

    // Add the file last with proper headers and exact content type
    formData.push(`--${boundary}\r\n`);
    formData.push(`Content-Disposition: form-data; name="file"; filename="${chunk.name}"\r\n`);
    formData.push(`Content-Type: ${chunk.type}\r\n\r\n`);

    // Handle binary data properly
    if (chunk.data instanceof ArrayBuffer) {
        formData.push(new Uint8Array(chunk.data));
    } else {
        formData.push(chunk.data);
    }
    formData.push(`\r\n--${boundary}--\r\n`);

    // Calculate content length for verification
    const formParts = [];
    formData.forEach(part => {
        if (typeof part === 'string') {
            const bytes = new Uint8Array(part.length);
            for (let i = 0; i < part.length; i++) {
                bytes[i] = part.charCodeAt(i);
            }
            formParts.push(bytes);
        } else {
            formParts.push(part);
        }
    });

    let totalLength = 0;
    formParts.forEach(part => {
        totalLength += part.byteLength || part.length || 0;
    });

    const finalData = [];
    formParts.forEach(part => {
        if (part instanceof Uint8Array) {
            finalData.push(...Array.from(part));
        } else {
            finalData.push(...Array.from(new Uint8Array(part)));
        }
    });

    let success = false;
    let s3Res;

    try {
        metrics.counters.s3ResponseRequests.add(1);
        s3Res = http.post(s3Details.upload_url, new Uint8Array(finalData), {
            timeout: '90s',
            headers: {
                'Accept': '*/*',
                'Accept-Language': 'en-US,en;q=0.5',
                'Accept-Encoding': 'gzip, deflate, br',
                'Content-Type': `multipart/form-data; boundary=${boundary}`,
                'Content-Length': totalLength.toString(),
                'Origin': DASHBOARD_ORIGIN,
                'Connection': 'keep-alive',
                'Sec-Fetch-Dest': 'empty',
                'Sec-Fetch-Mode': 'cors',
                'Sec-Fetch-Site': 'cross-site',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36'
            }
        });

        if (s3Res.status === 204 || s3Res.status === 200) {
            success = true;
            console.log(`[VU ${__VU}] Chunk ${index + 1}/${totalChunks} uploaded successfully (${s3Res.timings.duration}ms)`);
            uploadMetrics.s3ResponseTime.add(s3Res.timings.duration);
        } else {
            console.log(`[VU ${__VU}] Chunk ${index + 1}/${totalChunks} failed with status ${s3Res.status}`);
        }
    } catch (err) {
        console.log(`[VU ${__VU}] Chunk ${index + 1}/${totalChunks} failed with error: ${err.message}`);
    }

    metrics.rates.s3UploadFailRate.add(!success);
    return { success, uploadData: s3Details, usedKey: key };
}

// API endpoint paths
const ENDPOINTS = {
    csrfCookie: '/sanctum/csrf-cookie',
    login: '/login',
    user: '/api/user',
    broadcastingAuth: '/broadcasting/auth',
    educationConditions: '/api/education-content/data/conditions',
    educationTreatmentCategories: '/api/education-content/data/treatment-categories',
    educationRiskCategories: '/api/education-content/data/risk-categories',
    educationPlaylist: '/api/education-content/data/playlist?per_page=10',
    patientSessions: '/api/patient-sessions',
    voiceNotes: '/api/voice-notes',
    videoPlayback: '/api/education-content/content-flow',
    contentViewTracking: '/api/education-content/tracking/create',
    videoPlaybackTracking: '/api/education-content/tracking/update-video-playback'  // Reverted to original endpoint
};

// Add at the top of the file
let videoPageLoadFailures = [];
let apiTrackingCreateFailures = [];
let apiTrackingCreateUuidFailures = [];

// Add at the top of the file with other constants
const TREATMENT_OPTIONS = [
    {
        url: 'https://dev-v3-dashboard.chairsyde.com/content/?condition=1&sub-condition=3',
        id: 3,
        uuid: '76624939-964f-4766-b9ea-f1d2943eeaa1'
    },
    {
        url: 'https://dev-v3-dashboard.chairsyde.com/content/?condition=1&sub-condition=33',
        id: 33,
        uuid: '447e339c-01eb-471e-a36d-bd9dea8af101'
    },
    {
        url: 'https://dev-v3-dashboard.chairsyde.com/content/?condition=1&sub-condition=5',
        id: 5,
        uuid: 'cd007bbf-8c08-45df-a1a4-2b8ada326ca7'
    }
];

// Add response type tracking at the top
let responseTypes = {
    basic: { '200': 0, '422': 0, 'other': 0 },
    uuid: { '200': 0, '422': 0, 'other': 0 },
    view: { '200': 0, '422': 0, 'other': 0 }
};

// Helper function to validate response
function isValidResponse(response, type = 'basic') {
    try {
        // Ensure responseTypes is initialized
        if (!responseTypes[type]) {
            responseTypes[type] = { '200': 0, '422': 0, 'other': 0 };
        }

        // Track response status BEFORE any validation
        if (response.status === 200) {
            responseTypes[type]['200']++;
        } else if (response.status === 422) {
            responseTypes[type]['422']++;
        } else {
            responseTypes[type]['other']++;
        }

        // Log every response for debugging
        console.log(`[VU ${__VU}] ${type} Response Details:`, {
            status: response.status,
            type: type,
            bodyPreview: response.body.substring(0, 100),
            headers: response.headers
        });

        // Consider these cases as successful:
        // 1. Status 200-299 (Success)
        // 2. Status 422 (Validation error - expected in some cases)
        if ((response.status >= 200 && response.status < 300) || response.status === 422) {
            return true;
        }

        // Log unexpected status codes
        console.log(`[VU ${__VU}] Failure for ${type}:`, {
            status: response.status,
            body: response.body.substring(0, 200)
        });
        return false;
    } catch (e) {
        console.log(`[VU ${__VU}] Error in validation for ${type}:`, {
            error: e.message,
            status: response.status,
            body: response.body ? response.body.substring(0, 200) : 'No body'
        });
        return false;
    }
}

export default function () {
    // Determine if this VU is part of the 15% that will do mid-upload checks
    const IS_MID_UPLOAD_CHECK_VU = Math.random() < 0.15;

    // Move the helper function here:
    function randomSocketId() {
        const left = Math.floor(Math.random() * 900000 + 100000); // 6 digits
        const right = Array.from({length: 25}, () => Math.floor(Math.random() * 10)).join('');
        return `${left}.${right}`;
    }

    const user = users[(__VU - 1) % users.length];

    let csrfCookies, xsrfToken, sessionCookie, xsrfToken2, userId;

    group('Page Load Tests', function () {
        // Login Page Load Test (root URL /)
        group('Login Page Load', function () {
            const loginStartTime = new Date();
            let loginSuccess = false;
            let resourceRequests = [];
            try {
                let loginRes = http.get(DASHBOARD_ORIGIN, {
                    headers: {
                        ...COMMON_HEADERS,
                        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
                        'Accept-Language': 'en-GB,en-US;q=0.9,en;q=0.8',
                        'Cache-Control': 'no-cache',
                        'Pragma': 'no-cache',
                        'Sec-Fetch-Dest': 'document',
                        'Sec-Fetch-Mode': 'navigate',
                        'Sec-Fetch-Site': 'none',
                        'Sec-Fetch-User': '?1',
                        'Upgrade-Insecure-Requests': '1'
                    }
                });

                // Measure HTML load time
                const htmlLoadTime = new Date() - loginStartTime;
                metrics.trends.loginPageLoadTime.add(htmlLoadTime);
                // Count HTML request per VU
                addRequestCount(sharedMetrics.loginPageTotal);
                metrics.counters.loginPageTotalRequests.add(1);

                loginSuccess = check(loginRes, {
                    'Login page loaded successfully': (r) => r.status === 200,
                    'Login page contains expected content': (r) => r.body.includes('chairsyde')
                });

                if (loginSuccess) {
                    const resourceStartTime = new Date();
                    resourceRequests = loadPageResources(loginRes.body, DASHBOARD_ORIGIN, COMMON_HEADERS);
                    
                    // Count unique resources
                    const uniqueResourceCount = new Set(resourceRequests.map(r => r.url)).size;
                    metrics.counters.loginPageResourceRequests.add(uniqueResourceCount);
                    metrics.counters.loginPageTotalRequests.add(uniqueResourceCount);

                    // Calculate actual parallel load time
                    const resourceLoadTime = new Date() - resourceStartTime;
                    metrics.trends.loginPageResourceTotalTime.add(resourceLoadTime);

                    // Track success/failure for each unique resource
                    const resourceStats = resourceRequests.reduce((stats, res) => {
                        if (res.success) {
                            stats.successCount++;
                            stats.totalDuration += res.duration;
                        } else {
                            stats.failCount++;
                        }
                        return stats;
                    }, { successCount: 0, failCount: 0, totalDuration: 0 });

                    // Add resource failure rate
                    if (resourceRequests.length > 0) {
                        metrics.rates.loginPageResourceFailRate.add(resourceStats.failCount / resourceRequests.length);
                    }

                    // Add average resource time
                    if (resourceStats.successCount > 0) {
                        metrics.trends.loginPageResourceAvgTime.add(resourceStats.totalDuration / resourceStats.successCount);
                    }

                    // Log detailed timing information
                    console.log('Login Page Load Stats:', {
                        vu: __VU,
                        htmlLoadTime,
                        resourceLoadTime,
                        totalTime: htmlLoadTime + resourceLoadTime,
                        uniqueResources: uniqueResourceCount,
                        successfulResources: resourceStats.successCount,
                        failedResources: resourceStats.failCount,
                        avgResourceTime: resourceStats.successCount > 0 ? 
                            resourceStats.totalDuration / resourceStats.successCount : 0
                    });
                }
            } catch (err) {
                console.log('Login Page Load Exception:', err);
            }
            metrics.rates.loginPageLoadFailRate.add(!loginSuccess);
        });

        // Landing Page Load Test (/landing)
        group('Landing Page Load', function () {
            const landingStartTime = new Date();
            let landingSuccess = false;
            let resourceRequests = [];
            try {
                let landingRes = http.get(`${DASHBOARD_ORIGIN}/landing`, {
                    headers: {
                        ...COMMON_HEADERS,
                        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
                        'Accept-Language': 'en-GB,en-US;q=0.9,en;q=0.8',
                        'Cache-Control': 'no-cache',
                        'Pragma': 'no-cache',
                        'Sec-Fetch-Dest': 'document',
                        'Sec-Fetch-Mode': 'navigate',
                        'Sec-Fetch-Site': 'none',
                        'Sec-Fetch-User': '?1',
                        'Upgrade-Insecure-Requests': '1'
                    }
                });

                // Measure HTML load time
                const htmlLoadTime = new Date() - landingStartTime;
                metrics.trends.landingPageLoadTime.add(htmlLoadTime);

                // Count HTML request (only once)
                metrics.counters.landingPageTotalRequests.add(1);

                landingSuccess = check(landingRes, {
                    'Landing page loaded successfully': (r) => r.status === 200,
                    'Landing page contains expected content': (r) => r.body.includes('chairsyde')
                });

                if (landingSuccess) {
                    const resourceStartTime = new Date();
                    resourceRequests = loadPageResources(landingRes.body, DASHBOARD_ORIGIN, COMMON_HEADERS);
                    
                    // Count unique resources (only once)
                    const uniqueResourceCount = new Set(resourceRequests.map(r => r.url)).size;
                    
                    // Add resource requests to counters (only once)
                    metrics.counters.landingPageResourceRequests.add(uniqueResourceCount);
                    metrics.counters.landingPageTotalRequests.add(uniqueResourceCount);

                    // Calculate actual parallel load time
                    const resourceLoadTime = new Date() - resourceStartTime;
                    metrics.trends.landingPageResourceTotalTime.add(resourceLoadTime);

                    // Track success/failure for each unique resource
                    const resourceStats = resourceRequests.reduce((stats, res) => {
                        if (res.success) {
                            stats.successCount++;
                            stats.totalDuration += res.duration;
                        } else {
                            stats.failCount++;
                        }
                        return stats;
                    }, { successCount: 0, failCount: 0, totalDuration: 0 });

                    // Add resource failure rate
                    if (resourceRequests.length > 0) {
                        metrics.rates.landingPageResourceFailRate.add(resourceStats.failCount / resourceRequests.length);
                    }

                    // Add average resource time
                    if (resourceStats.successCount > 0) {
                        metrics.trends.landingPageResourceAvgTime.add(resourceStats.totalDuration / resourceStats.successCount);
                    }

                    // Log detailed timing information with VU identifier
                    console.log(`[VU ${__VU}] Landing Page Load Stats:`, {
                        htmlLoadTime,
                        resourceLoadTime,
                        totalTime: htmlLoadTime + resourceLoadTime,
                        uniqueResources: uniqueResourceCount,
                        successfulResources: resourceStats.successCount,
                        failedResources: resourceStats.failCount,
                        totalRequests: uniqueResourceCount + 1 // HTML request + resource requests
                    });
                }
            } catch (err) {
                console.log(`[VU ${__VU}] Landing Page Load Exception:`, err);
            }
            metrics.rates.landingPageLoadFailRate.add(!landingSuccess);
        });

        group('Login flow', function () {
            // --- CSRF Subgroup ---
            group('CSRF', function () {
                const csrfStartTime = new Date();
                let csrfSuccess = false;
                try {
                    // Count CSRF requests per VU
                    addRequestCount(sharedMetrics.csrfTotal);
                    metrics.counters.csrfRequests.add(1);
                    
                    let csrfOptionsRes = http.options(
                        `${BASE_URL}${ENDPOINTS.csrfCookie}`,
                        null,
                        {
                            headers: {
                                ...COMMON_HEADERS,
                                'Access-Control-Request-Method': 'GET',
                                'Access-Control-Request-Headers': 'x-requested-with,x-xsrf-token',
                            },
                        }
                    );
                    csrfSuccess = check(csrfOptionsRes, {
                        'CSRF OPTIONS status is 204': (r) => r.status === 204,
                    });
                    if (!csrfSuccess) {
                        console.log('CSRF OPTIONS HTTP Error:', {
                            url: `${BASE_URL}${ENDPOINTS.csrfCookie}`,
                            status: csrfOptionsRes.status,
                            body: csrfOptionsRes.body,
                            headers: csrfOptionsRes.headers,
                            timings: csrfOptionsRes.timings
                        });
                    }
                    let csrfRes = http.get(
                        `${BASE_URL}${ENDPOINTS.csrfCookie}`,
                        {
                            headers: {
                                ...COMMON_HEADERS,
                            },
                        }
                    );
                    csrfSuccess = check(csrfRes, {
                        'CSRF GET status is 204': (r) => r.status === 204,
                    });
                    if (!csrfSuccess) {
                        console.log('CSRF GET HTTP Error:', {
                            url: `${BASE_URL}${ENDPOINTS.csrfCookie}`,
                            status: csrfRes.status,
                            body: csrfRes.body,
                            headers: csrfRes.headers,
                            timings: csrfRes.timings
                        });
                    }
                    csrfCookies = csrfRes.cookies;
                    xsrfToken = csrfRes.cookies['XSRF-TOKEN'][0].value;
                } catch (err) {
                    console.log('CSRF Exception:', err);
                }
                metrics.rates.csrfFailRate.add(!csrfSuccess);
                metrics.trends.csrfTime.add(new Date() - csrfStartTime);
            });

            // --- Login Subgroup ---
            group('Login', function () {
                const loginStartTime = new Date();
                let loginSuccess = false;
                try {
                    // Count login requests per VU
                    addRequestCount(sharedMetrics.loginRequestTotal);
                    metrics.counters.loginRequests.add(1);
                    
                    let loginPayload = JSON.stringify({
                        email: user.email,
                        password: user.password,
                        timezone: LOGIN_TIMEZONE,
                        recaptchaToken: LOGIN_RECAPTCHA_TOKEN,
                    });
                    let loginHeaders = {
                        ...COMMON_HEADERS,
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                        'X-Requested-With': 'XMLHttpRequest',
                        'X-XSRF-TOKEN': decodeURIComponent(xsrfToken),
                        'Cookie': `XSRF-TOKEN=${xsrfToken}`,
                    };

                    console.log('Attempting login for user:', user.email);

                    let loginRes = http.post(
                        `${BASE_URL}${ENDPOINTS.login}`,
                        loginPayload,
                        { headers: loginHeaders }
                    );
                    loginSuccess = check(loginRes, {
                        'Login status is 200': (r) => r.status === 200,
                    });
                    if (!loginSuccess) {
                        console.log('Login HTTP Error:', {
                            url: `${BASE_URL}${ENDPOINTS.login}`,
                            status: loginRes.status,
                            body: loginRes.body,
                            headers: loginRes.headers,
                            timings: loginRes.timings,
                            cookies: loginRes.cookies,
                            user: user.email
                        });
                    }
                    let allCookies = Object.assign({}, csrfCookies, loginRes.cookies);
                    sessionCookie = allCookies[SESSION_COOKIE_NAME][0].value;
                    xsrfToken2 = allCookies['XSRF-TOKEN'][0].value;
                    console.log(`User logged in: ${user.email}`);
                } catch (err) {
                    console.log('Login Exception:', err);
                }
                metrics.rates.loginFailRate.add(!loginSuccess);
                metrics.trends.loginTime.add(new Date() - loginStartTime);
            });

            // --- Get User Subgroup ---
            group('Get User', function () {
                const getUserStartTime = new Date();
                let userSuccess = false;
                try {
                    let userHeaders = {
                        ...COMMON_HEADERS,
                        'Accept': 'application/json',
                        'X-Requested-With': 'XMLHttpRequest',
                        'X-XSRF-TOKEN': decodeURIComponent(xsrfToken2),
                        'Cookie': `${SESSION_COOKIE_NAME}=${sessionCookie}; XSRF-TOKEN=${xsrfToken2}`,
                    };
                    metrics.counters.getUserRequests.add(1);
                    let userRes = http.get(
                        `${BASE_URL}${ENDPOINTS.user}`,
                        { headers: userHeaders }
                    );
                    userSuccess = check(userRes, {
                        'Get user status is 200': (r) => r.status === 200,
                    });
                    if (!userSuccess) {
                        console.log('Get User HTTP Error:', {
                            url: `${BASE_URL}${ENDPOINTS.user}`,
                            status: userRes.status,
                            body: userRes.body,
                            headers: userRes.headers,
                            timings: userRes.timings
                        });
                    }
                    let userObj = null;
                    try {
                        userObj = JSON.parse(userRes.body);
                        userId = userObj.id;
                    } catch (e) {
                        userId = null;
                    }
                } catch (err) {
                    console.log('Get User Exception:', err);
                }
                metrics.rates.getUserFailRate.add(!userSuccess);
                metrics.trends.getUserTime.add(new Date() - getUserStartTime);
            });

            // --- Broadcasting Auth Subgroup ---
            group('Broadcasting Auth', function () {
                const broadcastStartTime = new Date();
                let broadcastSuccess = false;
                try {
                    let socket_id = randomSocketId();
                    let channel_name = `presence-UserClients.${userId}`;
                    let payload = `socket_id=${encodeURIComponent(socket_id)}&channel_name=${encodeURIComponent(channel_name)}`;
                    let broadcastHeaders = {
                        ...COMMON_HEADERS,
                        'Content-Type': 'application/x-www-form-urlencoded',
                        'Cookie': `${SESSION_COOKIE_NAME}=${sessionCookie}; XSRF-TOKEN=${xsrfToken2}`,
                    };
                    metrics.counters.broadcastAuthRequests.add(1);
                    let broadcastRes = http.post(
                        `${BASE_URL}${ENDPOINTS.broadcastingAuth}`,
                        payload,
                        { headers: broadcastHeaders }
                    );
                    broadcastSuccess = check(broadcastRes, {
                        'Broadcasting auth status is 200': (r) => r.status === 200,
                    });
                    if (!broadcastSuccess) {
                        console.log('Broadcast Auth HTTP Error:', {
                            url: `${BASE_URL}${ENDPOINTS.broadcastingAuth}`,
                            status: broadcastRes.status,
                            body: broadcastRes.body,
                            headers: broadcastRes.headers,
                            timings: broadcastRes.timings
                        });
                    }
                } catch (err) {
                    console.log('Broadcast Auth Exception:', err);
                }
                metrics.rates.broadcastAuthFailRate.add(!broadcastSuccess);
                metrics.trends.broadcastAuthTime.add(new Date() - broadcastStartTime);
            });

            // --- Education Content Groups ---
            group('Education Content', function () {
                const educationStartTime = new Date();
                let conditionsSuccess = false, treatmentSuccess = false, riskSuccess = false, playlistSuccess = false;
                try {
                    let apiHeaders = {
                        ...COMMON_HEADERS,
                        'Accept': 'application/json, text/plain, */*',
                        'X-XSRF-TOKEN': decodeURIComponent(xsrfToken2),
                        'Cookie': `${SESSION_COOKIE_NAME}=${sessionCookie}; XSRF-TOKEN=${xsrfToken2}`,
                    };
                    // Get conditions
                    const conditionsStartTime = new Date();
                    metrics.counters.educationConditionsRequests.add(1);
                    let conditionsRes = http.get(
                        `${BASE_URL}${ENDPOINTS.educationConditions}`,
                        { headers: apiHeaders }
                    );
                    conditionsSuccess = check(conditionsRes, {
                        'Education content conditions status is 200': (r) => r.status === 200,
                    });
                    if (!conditionsSuccess) {
                        console.log('Education Conditions HTTP Error:', {
                            url: `${BASE_URL}${ENDPOINTS.educationConditions}`,
                            status: conditionsRes.status,
                            body: conditionsRes.body,
                            headers: conditionsRes.headers,
                            timings: conditionsRes.timings
                        });
                    }
                    metrics.rates.educationConditionsFailRate.add(!conditionsSuccess);
                    metrics.trends.educationConditionsTime.add(new Date() - conditionsStartTime);
                    // Get treatment categories
                    const treatmentStartTime = new Date();
                    metrics.counters.educationTreatmentRequests.add(1);
                    let treatmentCategoriesRes = http.get(
                        `${BASE_URL}${ENDPOINTS.educationTreatmentCategories}`,
                        { headers: apiHeaders }
                    );
                    treatmentSuccess = check(treatmentCategoriesRes, {
                        'Education content treatment categories status is 200': (r) => r.status === 200,
                    });
                    if (!treatmentSuccess) {
                        console.log('Education Treatment HTTP Error:', {
                            url: `${BASE_URL}${ENDPOINTS.educationTreatmentCategories}`,
                            status: treatmentCategoriesRes.status,
                            body: treatmentCategoriesRes.body,
                            headers: treatmentCategoriesRes.headers,
                            timings: treatmentCategoriesRes.timings
                        });
                    }
                    metrics.rates.educationTreatmentFailRate.add(!treatmentSuccess);
                    metrics.trends.educationTreatmentTime.add(new Date() - treatmentStartTime);
                    // Get risk categories
                    const riskStartTime = new Date();
                    metrics.counters.educationRiskRequests.add(1);
                    let riskCategoriesRes = http.get(
                        `${BASE_URL}${ENDPOINTS.educationRiskCategories}`,
                        { headers: apiHeaders }
                    );
                    riskSuccess = check(riskCategoriesRes, {
                        'Education content risk categories status is 200': (r) => r.status === 200,
                    });
                    if (!riskSuccess) {
                        console.log('Education Risk HTTP Error:', {
                            url: `${BASE_URL}${ENDPOINTS.educationRiskCategories}`,
                            status: riskCategoriesRes.status,
                            body: riskCategoriesRes.body,
                            headers: riskCategoriesRes.headers,
                            timings: riskCategoriesRes.timings
                        });
                    }
                    metrics.rates.educationRiskFailRate.add(!riskSuccess);
                    metrics.trends.educationRiskTime.add(new Date() - riskStartTime);
                    // Get playlist
                    const playlistStartTime = new Date();
                    metrics.counters.educationPlaylistRequests.add(1);
                    let playlistRes = http.get(
                        `${BASE_URL}${ENDPOINTS.educationPlaylist}`,
                        { headers: apiHeaders }
                    );
                    playlistSuccess = check(playlistRes, {
                        'Education content playlist status is 200': (r) => r.status === 200,
                    });
                    if (!playlistSuccess) {
                        console.log('Education Playlist HTTP Error:', {
                            url: `${BASE_URL}${ENDPOINTS.educationPlaylist}`,
                            status: playlistRes.status,
                            body: playlistRes.body,
                            headers: playlistRes.headers,
                            timings: playlistRes.timings
                        });
                    }
                    metrics.rates.educationPlaylistFailRate.add(!playlistSuccess);
                    metrics.trends.educationPlaylistTime.add(new Date() - playlistStartTime);
                } catch (err) {
                    console.log('Education Content Exception:', err);
                    metrics.rates.educationConditionsFailRate.add(1);
                    metrics.rates.educationTreatmentFailRate.add(1);
                    metrics.rates.educationRiskFailRate.add(1);
                    metrics.rates.educationPlaylistFailRate.add(1);
                }
                metrics.trends.educationContentTime.add(new Date() - educationStartTime);
            });
        });

        // Voice Note Page Load Test
        group('Voice Note Page Load', function () {
            const pageStartTime = new Date();
            let voiceNoteSuccess = false;
            let resourceRequests = [];
            
            try {
                // First, ensure we have valid authentication
                if (!sessionCookie || !xsrfToken2) {
                    console.log(`[VU ${__VU}] Missing authentication tokens for voice note page:`, {
                        sessionCookie: !!sessionCookie,
                        xsrfToken2: !!xsrfToken2
                    });
                    metrics.rates.voiceNotePageLoadFailRate.add(1);
                    return;
                }

                // Set up proper headers for authenticated request
                const voiceNoteHeaders = {
                    ...COMMON_HEADERS,
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
                    'Accept-Language': 'en-GB,en-US;q=0.9,en;q=0.8',
                    'Cache-Control': 'no-cache',
                    'Cookie': `${SESSION_COOKIE_NAME}=${sessionCookie}; XSRF-TOKEN=${xsrfToken2}`,
                    'Pragma': 'no-cache',
                    'Sec-Fetch-Dest': 'document',
                    'Sec-Fetch-Mode': 'navigate',
                    'Sec-Fetch-Site': 'same-origin',
                    'Sec-Fetch-User': '?1',
                    'Upgrade-Insecure-Requests': '1',
                    'X-XSRF-TOKEN': decodeURIComponent(xsrfToken2)
                };

                console.log(`[VU ${__VU}] Attempting to load voice note page with auth:`, {
                    sessionCookie: sessionCookie ? sessionCookie.substring(0, 10) + '...' : null,
                    xsrfToken2: xsrfToken2 ? xsrfToken2.substring(0, 10) + '...' : null
                });

                let voiceNoteRes = http.get(`${DASHBOARD_ORIGIN}/voice-note/`, {
                    headers: voiceNoteHeaders,
                    redirects: 5
                });

                // Measure HTML load time
                const htmlLoadTime = new Date() - pageStartTime;
                metrics.trends.voiceNotePageLoadTime.add(htmlLoadTime);

                // Count HTML request per VU
                addRequestCount(sharedMetrics.voiceNotePageTotal);
                metrics.counters.voiceNotePageTotalRequests.add(1);

                voiceNoteSuccess = check(voiceNoteRes, {
                    'Voice note page loaded successfully': (r) => r.status === 200,
                    'Page contains expected content': (r) => 
                        r.body.includes('<div id="app"') || 
                        r.body.includes('<div id="root"') ||
                        r.body.includes('chairsyde')
                });

                console.log(`[VU ${__VU}] Voice note page load result:`, {
                    status: voiceNoteRes.status,
                    success: voiceNoteSuccess,
                    responseSize: voiceNoteRes.body.length,
                    htmlLoadTime
                });

                if (voiceNoteSuccess) {
                    const resourceStartTime = new Date();
                    resourceRequests = loadPageResources(voiceNoteRes.body, DASHBOARD_ORIGIN, {
                        ...COMMON_HEADERS,
                        'Cookie': `${SESSION_COOKIE_NAME}=${sessionCookie}; XSRF-TOKEN=${xsrfToken2}`,
                        'X-XSRF-TOKEN': decodeURIComponent(xsrfToken2)
                    });
                    
                    // Count unique resources
                    const uniqueResourceCount = new Set(resourceRequests.map(r => r.url)).size;
                    
                    // Count resource requests per VU
                    addRequestCount(sharedMetrics.voiceNotePageTotal, uniqueResourceCount);
                    metrics.counters.voiceNotePageResourceRequests.add(uniqueResourceCount);
                    metrics.counters.voiceNotePageTotalRequests.add(uniqueResourceCount);

                    // Calculate actual parallel load time
                    const resourceLoadTime = new Date() - resourceStartTime;
                    metrics.trends.voiceNotePageResourceTotalTime.add(resourceLoadTime);

                    // Track success/failure for each unique resource
                    const resourceStats = resourceRequests.reduce((stats, res) => {
                        if (res.success) {
                            stats.successCount++;
                            stats.totalDuration += res.duration;
                        } else {
                            stats.failCount++;
                        }
                        return stats;
                    }, { successCount: 0, failCount: 0, totalDuration: 0 });

                    // Add resource failure rate
                    if (resourceRequests.length > 0) {
                        metrics.rates.voiceNotePageResourceFailRate.add(resourceStats.failCount / resourceRequests.length);
                    }

                    // Add average resource time
                    if (resourceStats.successCount > 0) {
                        metrics.trends.voiceNotePageResourceAvgTime.add(resourceStats.totalDuration / resourceStats.successCount);
                    }

                    console.log(`[VU ${__VU}] Voice Note Page Resource Stats:`, {
                        uniqueResources: uniqueResourceCount,
                        successfulResources: resourceStats.successCount,
                        failedResources: resourceStats.failCount,
                        resourceLoadTime,
                        totalTime: htmlLoadTime + resourceLoadTime
                    });
                } else {
                    console.log(`[VU ${__VU}] Voice Note Page Load Failed:`, {
                        status: voiceNoteRes.status,
                        responseSize: voiceNoteRes.body.length,
                        error: voiceNoteRes.error,
                        body: voiceNoteRes.body.substring(0, 200) // First 200 chars for debugging
                    });
                }
            } catch (err) {
                console.log(`[VU ${__VU}] Voice Note Page Load Exception:`, err);
                voiceNoteSuccess = false;
            }
            
            metrics.rates.voiceNotePageLoadFailRate.add(!voiceNoteSuccess);
        });

        // Log waiting after login
        console.log('Waiting after login to mimic user think time...');
        sleep(5); // Fixed 5 seconds wait after login

        // --- Patient Session Group ---
        console.log('Starting patient session...');
        group('Patient Session', function () {
            // --- Create Patient Session Subgroup ---
            group('Create Patient Session', function () {
                let createSessionSuccess = false;
                let createSessionRes;
                let createSessionStartTime = new Date();
                try {
                    let apiHeaders = {
                        ...COMMON_HEADERS,
                        'Accept': 'application/json, text/plain, */*',
                        'Content-Type': 'application/json;charset=UTF-8',
                        'X-XSRF-TOKEN': decodeURIComponent(xsrfToken2),
                        'Cookie': `${SESSION_COOKIE_NAME}=${sessionCookie}; XSRF-TOKEN=${xsrfToken2}`,
                        'X-Requested-With': 'XMLHttpRequest',
                        'Authorization': `Bearer ${sessionCookie}`
                    };
                    let payload = JSON.stringify({
                        patient_name: "",
                        create_session: true,
                        transcript: "",
                        template_id: null
                    });
                    let optionsRes = http.options(
                        `${BASE_URL}${ENDPOINTS.patientSessions}`,
                        null,
                        {
                            headers: {
                                ...COMMON_HEADERS,
                                'Access-Control-Request-Method': 'POST',
                                'Access-Control-Request-Headers': 'content-type,x-requested-with,x-xsrf-token',
                                'Origin': DASHBOARD_ORIGIN
                            }
                        }
                    );
                    metrics.counters.createSessionRequests.add(1);
                    createSessionStartTime = new Date();
                    createSessionRes = http.post(
                        `${BASE_URL}${ENDPOINTS.patientSessions}`,
                        payload,
                        { headers: apiHeaders }
                    );
                    createSessionSuccess = check(createSessionRes, {
                        'Create patient session status is 200': (r) => r.status === 200,
                    });
                    metrics.trends.createSessionTime.add(new Date() - createSessionStartTime);
                    if (!createSessionSuccess) {
                        console.log('Create Session HTTP Error:', {
                            url: `${BASE_URL}${ENDPOINTS.patientSessions}`,
                            status: createSessionRes.status,
                            body: createSessionRes.body,
                            headers: createSessionRes.headers,
                            timings: createSessionRes.timings,
                            user: user.email
                        });
                    }
                    // Add debug logging for session creation response
                    let sessionId = null;
                    let voiceNoteId = null;
                    const voiceNoteStartTime = new Date();
                    try {
                        let body = JSON.parse(createSessionRes.body);
                        sessionId = body && body.data && body.data.patient_session && body.data.patient_session.id;
                        voiceNoteId = body && body.data && body.data.voice_note && body.data.voice_note.id;
                        if (voiceNoteId) {
                            metrics.trends.createVoiceNoteTime.add(new Date() - voiceNoteStartTime);
                        }
                    } catch (e) {
                        // Silent error handling
                    }
                    // --- Upload Voice Note Subgroup ---
                    if (sessionId && voiceNoteId) {
                        group('Upload Voice Note', function () {
                            console.log('Entering S3 upload group for session:', sessionId, 'voiceNoteId:', voiceNoteId);
                            let uploadHeaders = {
                                ...COMMON_HEADERS,
                                'Accept': 'application/json, text/plain, */*',
                                'Content-Type': 'application/json',
                                'X-XSRF-TOKEN': decodeURIComponent(xsrfToken2),
                                'Cookie': `${SESSION_COOKIE_NAME}=${sessionCookie}; XSRF-TOKEN=${xsrfToken2}`,
                            };

                            group('upload voice note chunks to S3', function () {
                                if (!voiceNoteId) {
                                    console.log('No voiceNoteId, skipping S3 upload');
                                    return;
                                }

                                console.log('Number of chunk files to upload:', chunkFiles.length);

                                const totalUploadStartTime = new Date();
                                let successCount = 0;
                                let failCount = 0;
                                let lastUploadData = null;
                                let baseSegmentKey = null;
                                let firstUploadData = null;
                                let uploadData = null;

                                // Create auth object once to be passed to upload function
                                const auth = {
                                    'X-XSRF-TOKEN': decodeURIComponent(xsrfToken2),
                                    'Cookie': `${SESSION_COOKIE_NAME}=${sessionCookie}; XSRF-TOKEN=${xsrfToken2}`,
                                };

                                // Get initial S3 details for the first chunk - ONLY ONCE
                                let initialS3DetailsRes = http.post(
                                    `${BASE_URL}${ENDPOINTS.voiceNotes}/${voiceNoteId}/upload`,
                                    null,
                                    {
                                        headers: {
                                            ...COMMON_HEADERS,
                                            ...auth,
                                            'Accept': 'application/json, text/plain, */*',
                                        }
                                    }
                                );

                                console.log('S3 details API status:', initialS3DetailsRes.status);

                                if (initialS3DetailsRes.status !== 200) {
                                    console.log('Failed to get S3 details, skipping upload');
                                    return;
                                }

                                try {
                                    const parsedResponse = JSON.parse(initialS3DetailsRes.body);
                                    if (!parsedResponse.data) {
                                        console.log('No data in S3 details response, skipping upload');
                                        return;
                                    }
                                    firstUploadData = parsedResponse.data;
                                    uploadData = firstUploadData;
                                    baseSegmentKey = firstUploadData.segment_key;
                                } catch (err) {
                                    console.log('Error parsing S3 details response:', err, initialS3DetailsRes.body);
                                    return;
                                }

                                for (let i = 0; i < chunkFiles.length; i++) {
                                    const chunk = chunkFiles[i];
                                    console.log('Preparing to upload chunk:', chunk.name);
                                    metrics.counters.s3UploadRequests.add(1);
                                    const result = uploadChunkToS3(voiceNoteId, chunk, i, chunkFiles.length, auth, baseSegmentKey, firstUploadData);
                                    if (result.success) {
                                        successCount++;
                                        lastUploadData = result.uploadData;
                                        console.log(`Chunk ${i + 1}/${chunkFiles.length} uploaded successfully`);
                                    } else {
                                        failCount++;
                                        metrics.rates.s3UploadFailRate.add(1);
                                        console.log(`Chunk ${i + 1}/${chunkFiles.length} upload failed`);
                                    }

                                    // Check if we're at the halfway point and if this VU is selected for mid-upload checks
                                    if (i === Math.floor(chunkFiles.length / 10) && IS_MID_UPLOAD_CHECK_VU) {
                                        console.log(`[VU ${__VU}] Selected for mid-upload checks, performing additional verifications...`);
                                        
                                        // Landing Page Load Test
                                        group('Mid-Upload Landing Page Check', function() {
                                            const landingStartTime = new Date();
                                            let landingSuccess = false;
                                            try {
                                                let landingRes = http.get(`${DASHBOARD_ORIGIN}/landing`, {
                                                    headers: {
                                                        ...COMMON_HEADERS,
                                                        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
                                                        'Accept-Language': 'en-GB,en-US;q=0.9,en;q=0.8',
                                                        'Cache-Control': 'no-cache',
                                                        'Pragma': 'no-cache',
                                                        'Sec-Fetch-Dest': 'document',
                                                        'Sec-Fetch-Mode': 'navigate',
                                                        'Sec-Fetch-Site': 'none',
                                                        'Sec-Fetch-User': '?1',
                                                        'Upgrade-Insecure-Requests': '1',
                                                        'Cookie': `${SESSION_COOKIE_NAME}=${sessionCookie}; XSRF-TOKEN=${xsrfToken2}`
                                                    }
                                                });

                                                // Measure HTML load time
                                                const htmlLoadTime = new Date() - landingStartTime;
                                                metrics.trends.landingPageLoadTime.add(htmlLoadTime);
                                                // Count HTML request (only once)
                                                metrics.counters.landingPageTotalRequests.add(1);

                                                landingSuccess = check(landingRes, {
                                                    'Mid-upload landing page loaded successfully': (r) => r.status === 200,
                                                    'Mid-upload landing page contains expected content': (r) => r.body.includes('chairsyde')
                                                });

                                                if (landingSuccess && sessionId) {
                                                    // --- New: Education Content APIs (consolidated metrics) ---
                                                    const apiHeaders = {
                                                        ...COMMON_HEADERS,
                                                        'Accept': 'application/json, text/plain, */*',
                                                        'X-XSRF-TOKEN': decodeURIComponent(xsrfToken2),
                                                        'Cookie': `${SESSION_COOKIE_NAME}=${sessionCookie}; XSRF-TOKEN=${xsrfToken2}`,
                                                    };
                                                    // Conditions
                                                    const conditionsStartTime = new Date();
                                                    metrics.counters.educationConditionsRequests.add(1);
                                                    let conditionsRes = http.get(`${BASE_URL}${ENDPOINTS.educationConditions}`, { headers: apiHeaders });
                                                    metrics.rates.educationConditionsFailRate.add(!(conditionsRes.status === 200));
                                                    metrics.trends.educationConditionsTime.add(new Date() - conditionsStartTime);
                                                    // Treatment categories
                                                    const treatmentStartTime = new Date();
                                                    metrics.counters.educationTreatmentRequests.add(1);
                                                    let treatmentCategoriesRes = http.get(`${BASE_URL}${ENDPOINTS.educationTreatmentCategories}`, { headers: apiHeaders });
                                                    metrics.rates.educationTreatmentFailRate.add(!(treatmentCategoriesRes.status === 200));
                                                    metrics.trends.educationTreatmentTime.add(new Date() - treatmentStartTime);
                                                    // Risk categories
                                                    const riskStartTime = new Date();
                                                    metrics.counters.educationRiskRequests.add(1);
                                                    let riskCategoriesRes = http.get(`${BASE_URL}${ENDPOINTS.educationRiskCategories}`, { headers: apiHeaders });
                                                    metrics.rates.educationRiskFailRate.add(!(riskCategoriesRes.status === 200));
                                                    metrics.trends.educationRiskTime.add(new Date() - riskStartTime);
                                                    // --- End new part ---
                                                    // Video Playback Flow during upload
                                                    group('Video Playback During Upload', function() {
                                                        // Randomly select a treatment
                                                        const selectedTreatment = TREATMENT_OPTIONS[Math.floor(Math.random() * TREATMENT_OPTIONS.length)];
                                                        
                                                        // Load the video playback page
                                                        metrics.counters.videoPlaybackPageRequests.add(1);
                                                        const videoPageStartTime = new Date();

                                                        let videoPageRes = http.get(
                                                            selectedTreatment.url,
                                                            {
                                                                headers: {
                                                                    ...COMMON_HEADERS,
                                                                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
                                                                    'Accept-Language': 'en-GB,en-US;q=0.9,en;q=0.8',
                                                                    'Cache-Control': 'no-cache',
                                                                    'Cookie': `${SESSION_COOKIE_NAME}=${sessionCookie}; XSRF-TOKEN=${xsrfToken2}`,
                                                                    'Pragma': 'no-cache',
                                                                    'Sec-Fetch-Dest': 'document',
                                                                    'Sec-Fetch-Mode': 'navigate',
                                                                    'Sec-Fetch-Site': 'same-origin',
                                                                    'Upgrade-Insecure-Requests': '1'
                                                                }
                                                            }
                                                        );

                                                        // Add video playback page timing metrics
                                                        const midUploadVideoPageLoadTime = new Date() - videoPageStartTime;
                                                        metrics.trends.videoPlaybackPageLoadTime.add(midUploadVideoPageLoadTime);

                                                        const midUploadVideoPageSuccess = check(videoPageRes, {
                                                            'Video playback page loaded successfully': (r) => r.status === 200,
                                                            'Page contains expected content': (r) => r.body.includes('chairsyde')
                                                        });
                                                        metrics.rates.videoPlaybackPageFailRate.add(!midUploadVideoPageSuccess);

                                                        // First API call - education-content-view-tracking
                                                        metrics.counters.contentViewTrackingRequests.add(1);
                                                        metrics.counters.educationContentViewTrackingRequests.add(1);
                                                        const trackingStartTime = new Date();
                                                        const viewTrackingStartTime = new Date();

                                                        let contentTrackingRes = http.post(
                                                            `${BASE_URL}/api/education-content-view-tracking`,
                                                            JSON.stringify({
                                                                contentable_id: selectedTreatment.id,
                                                                contentable_type: "sub-condition"
                                                            }),
                                                            {
                                                                headers: {
                                                                    ...COMMON_HEADERS,
                                                                    'Accept': 'application/json',
                                                                    'Content-Type': 'application/json',
                                                                    'X-XSRF-TOKEN': decodeURIComponent(xsrfToken2),
                                                                    'Cookie': `${SESSION_COOKIE_NAME}=${sessionCookie}; XSRF-TOKEN=${xsrfToken2}`,
                                                                    'X-Requested-With': 'XMLHttpRequest',
                                                                    'Origin': DASHBOARD_ORIGIN,
                                                                    'Referer': selectedTreatment.url
                                                                }
                                                            }
                                                        );
                                                        
                                                        const viewTrackingTime = new Date() - viewTrackingStartTime;
                                                        metrics.trends.educationContentViewTrackingTime.add(viewTrackingTime);
                                                        const viewTrackingSuccess = check(contentTrackingRes, {
                                                            'Education content view tracking successful': (r) => r.status === 200 || r.status === 201,
                                                        });
                                                        metrics.rates.educationContentViewTrackingFailRate.add(!viewTrackingSuccess);

                                                        if (!viewTrackingSuccess) {
                                                            console.log(`[VU ${__VU}] Mid-upload content view tracking failed:`, {
                                                                status: contentTrackingRes.status,
                                                                body: contentTrackingRes.body.substring(0, 300)
                                                            });
                                                        }

                                                        // Second API call - tracking/create
                                                        metrics.counters.educationTrackingCreateRequests.add(1);
                                                        const trackingCreateStartTime = new Date();
                                                        
                                                        // Modify tracking/create API calls
                                                        let trackingCreateRes = http.post(
                                                            `${BASE_URL}/api/education-content/tracking/create`,
                                                            JSON.stringify({
                                                                id: selectedTreatment.id,
                                                                type: "sub-condition"
                                                            }),
                                                            {
                                                                headers: {
                                                                    ...COMMON_HEADERS,
                                                                    'Accept': 'application/json',
                                                                    'Content-Type': 'application/json',
                                                                    'X-XSRF-TOKEN': decodeURIComponent(xsrfToken2),
                                                                    'Cookie': `${SESSION_COOKIE_NAME}=${sessionCookie}; XSRF-TOKEN=${xsrfToken2}`,
                                                                    'X-Requested-With': 'XMLHttpRequest',
                                                                    'Origin': DASHBOARD_ORIGIN,
                                                                    'Referer': selectedTreatment.url
                                                                }
                                                            }
                                                        );

                                                        // Add timing metrics for basic tracking
                                                        const trackingCreateTime = trackingCreateRes.timings.duration;
                                                        metrics.trends.educationTrackingCreateTime.add(trackingCreateTime, { test_id: TEST_ID });

                                                        // Validate response and add to metrics
                                                        const trackingCreateSuccess = isValidResponse(trackingCreateRes, 'basic');
                                                        metrics.rates.educationTrackingCreateFailRate.add(!trackingCreateSuccess, { test_id: TEST_ID });

                                                        // Only add to failure rate if it's not a success (not 200-299 and not 422)
                                                        if (!trackingCreateSuccess) {
                                                            apiTrackingCreateFailures.push({
                                                                vu: __VU,
                                                                status: trackingCreateRes.status,
                                                                body: trackingCreateRes.body,
                                                                url: `${BASE_URL}/api/education-content/tracking/create`,
                                                                headers: trackingCreateRes.request.headers,
                                                                timestamp: new Date().toISOString(),
                                                                duration: trackingCreateTime,
                                                                requestBody: {
                                                                    id: selectedTreatment.id,
                                                                    type: "treatment"
                                                                }
                                                            });
                                                        }
                                                        
                                                        // Third API call - tracking/create with uuid
                                                        metrics.counters.educationTrackingCreateUuidRequests.add(1, { test_id: TEST_ID });
                                                        const trackingCreateUuidStartTime = new Date();
                                                        
                                                        let trackingCreateWithUuidRes = http.post(
                                                            `${BASE_URL}/api/education-content/tracking/create`,
                                                            JSON.stringify({
                                                                id: selectedTreatment.id,
                                                                tracking_type: "media",
                                                                type: "treatment",
                                                                uuid: selectedTreatment.uuid
                                                            }),
                                                            {
                                                                headers: {
                                                                    ...COMMON_HEADERS,
                                                                    'Accept': 'application/json',
                                                                    'Content-Type': 'application/json',
                                                                    'X-XSRF-TOKEN': decodeURIComponent(xsrfToken2),
                                                                    'Cookie': `${SESSION_COOKIE_NAME}=${sessionCookie}; XSRF-TOKEN=${xsrfToken2}`,
                                                                    'X-Requested-With': 'XMLHttpRequest',
                                                                    'Origin': DASHBOARD_ORIGIN,
                                                                    'Referer': selectedTreatment.url
                                                                }
                                                            }
                                                        );

                                                        const trackingCreateUuidTime = new Date() - trackingCreateUuidStartTime;
                                                        metrics.trends.educationTrackingCreateUuidTime.add(trackingCreateUuidTime, { test_id: TEST_ID });
                                                        const trackingCreateUuidSuccess = check(trackingCreateWithUuidRes, {
                                                            'Education tracking create with UUID successful': (r) => r.status >= 200 && r.status < 300,
                                                        });
                                                        metrics.rates.educationTrackingCreateUuidFailRate.add(!trackingCreateUuidSuccess, { test_id: TEST_ID });

                                                        if (!trackingCreateUuidSuccess) {
                                                            apiTrackingCreateUuidFailures.push({
                                                                vu: __VU,
                                                                status: trackingCreateWithUuidRes.status,
                                                                body: trackingCreateWithUuidRes.body,
                                                                url: `${BASE_URL}/api/education-content/tracking/create`,
                                                                headers: trackingCreateWithUuidRes.request.headers,
                                                                timestamp: new Date().toISOString(),
                                                                requestBody: {
                                                                    id: selectedTreatment.id,
                                                                    tracking_type: "media",
                                                                    type: "treatment",
                                                                    uuid: selectedTreatment.uuid
                                                                }
                                                            });
                                                        }

                                                        const contentTrackingTime = new Date() - trackingStartTime;
                                                        metrics.trends.contentViewTrackingTime.add(contentTrackingTime);

                                                        const contentTrackingSuccess = check(trackingCreateRes, {
                                                            'Content view tracking successful': (r) => r.status >= 200 && r.status < 300,
                                                        });

                                                        metrics.rates.contentViewTrackingFailRate.add(!contentTrackingSuccess);

                                                        // Simulate time spent on video page
                                                        sleep(15);
                                                    });
                                                }
                                            } catch (err) {
                                                console.log(`[VU ${__VU}] Mid-Upload Landing Page Load Exception:`, err);
                                            }
                                            metrics.rates.landingPageLoadFailRate.add(!landingSuccess);
                                        });
                                    }

                                    if (i < chunkFiles.length - 1) {
                                        sleep(3);
                                    }
                                }

                                if (successCount > 0) {
                                    metrics.rates.s3UploadFailRate.add(0, { count: successCount });
                                }

                                if (uploadData && uploadData.segment_key && successCount > 0) {
                                    // --- Stop Endpoint ---
                                    group('Stop', function () {
                                        const stop1StartTime = new Date();
                                        let stop1Success = false;
                                        try {
                                            let stop1Headers = {
                                                ...COMMON_HEADERS,
                                                'Accept': 'application/json, text/plain, */*',
                                                'X-XSRF-TOKEN': decodeURIComponent(xsrfToken2),
                                                'Cookie': `${SESSION_COOKIE_NAME}=${sessionCookie}; XSRF-TOKEN=${xsrfToken2}`,
                                            };
                                            metrics.counters.stop1Requests.add(1);
                                            const stop1Url = `${BASE_URL}/api/patient-sessions/${sessionId}/stop1`;
                                            let stop1Res = http.post(
                                                stop1Url,
                                                null,
                                                { headers: stop1Headers }
                                            );
                                            if (stop1Res.status === 422) {                                               
                                                stop1Success = true; // treat as not a failure
                                            } else {
                                                stop1Success = check(stop1Res, {
                                                    'Stop1 status is 200': (r) => r.status === 200,
                                                });
                                                if (!stop1Success) {
                                                    console.log('Stop1 HTTP Error:', {
                                                        url: stop1Url,
                                                        status: stop1Res.status,
                                                        body: stop1Res.body,
                                                        sessionId: sessionId
                                                    });
                                                }
                                            }
                                        } catch (err) {
                                            console.log('Stop1 Exception:', err);
                                        }
                                        metrics.rates.stop1FailRate.add(!stop1Success);
                                        metrics.trends.stop1Time.add(new Date() - stop1StartTime);
                                        // --- Transcribe ---
                                        console.log('Starting transcription...');
                                        let transcribeSuccess = false;
                                        try {
                                            let transcribeHeaders = {
                                                ...COMMON_HEADERS,
                                                'Accept': 'application/json',
                                                'Content-Type': 'application/json',
                                                'X-XSRF-TOKEN': decodeURIComponent(xsrfToken2),
                                                'Cookie': `${SESSION_COOKIE_NAME}=${sessionCookie}; XSRF-TOKEN=${xsrfToken2}`,
                                            };
                                            const transcribePayload = JSON.stringify({
                                                segment_key: baseSegmentKey,
                                                new_note: false
                                            });
                                            const transcribeStartTime = new Date();
                                            metrics.counters.transcribeRequests.add(1);
                                            let transcribeRes = http.post(
                                                `${BASE_URL}/api/voice-notes/${voiceNoteId}/transcribe`,
                                                transcribePayload,
                                                { headers: transcribeHeaders }
                                            );
                                            transcribeSuccess = check(transcribeRes, {
                                                'Transcribe status is 200': (r) => r.status === 200,
                                            });
                                            if (!transcribeSuccess) {
                                                console.log('Transcribe HTTP Error:', {
                                                    url: `${BASE_URL}/api/voice-notes/${voiceNoteId}/transcribe`,
                                                    status: transcribeRes.status,
                                                    body: transcribeRes.body,
                                                    headers: transcribeRes.headers,
                                                    timings: transcribeRes.timings
                                                });
                                            }
                                            metrics.trends.transcribeTime.add(new Date() - transcribeStartTime);
                                        } catch (err) {
                                            console.log('Transcribe Exception:', err);
                                            metrics.rates.transcribeFailRate.add(1);
                                        }
                                        metrics.rates.transcribeFailRate.add(!transcribeSuccess);
                                        console.log('Transcription completed');
                                        // Wait for async processing
                                        sleep(60);
                                        // --- Create Title ---
                                        console.log('Creating voice note title...');
                                        let createTitleSuccess = false;
                                        try {
                                            let createTitleHeaders = {
                                                ...COMMON_HEADERS,
                                                'Accept': 'application/json, text/plain, */*',
                                                'Content-Length': '0',
                                                'X-XSRF-TOKEN': decodeURIComponent(xsrfToken2),
                                                'Cookie': `${SESSION_COOKIE_NAME}=${sessionCookie}; XSRF-TOKEN=${xsrfToken2}`,
                                            };
                                            const createTitleStartTime = new Date();
                                            metrics.counters.createTitleRequests.add(1);
                                            let createTitleRes = http.post(
                                                `${BASE_URL}/api/voice-notes/create-title-voice/${voiceNoteId}`,
                                                null,
                                                { headers: createTitleHeaders }
                                            );
                                            console.log('Create Title Response:', {
                                                status: createTitleRes.status,
                                                body: createTitleRes.body,
                                                headers: createTitleRes.headers,
                                                timings: createTitleRes.timings
                                            });
                                            createTitleSuccess = check(createTitleRes, {
                                                'Create title status is 200': (r) => r.status === 200,
                                            });                                           
                                            if (!createTitleSuccess) {
                                                console.log('Create Title HTTP Error:', {
                                                    url: `${BASE_URL}/api/voice-notes/create-title-voice/${voiceNoteId}`,
                                                    status: createTitleRes.status,
                                                    body: createTitleRes.body,
                                                    headers: createTitleRes.headers,
                                                    timings: createTitleRes.timings
                                                });
                                            }
                                            metrics.trends.createTitleTime.add(new Date() - createTitleStartTime);
                                        } catch (err) {
                                            console.log('Create Title Exception:', err);
                                            metrics.rates.createTitleFailRate.add(1);
                                        }
                                        metrics.rates.createTitleFailRate.add(!createTitleSuccess);
                                    });
                                }
                            });
                        });
                    }
                } catch (err) {
                    console.log('Create Session Exception:', err);
                    createSessionSuccess = false;
                }
                metrics.rates.createSessionFailRate.add(!createSessionSuccess);
            });
        });
    });
}

export function handleSummary(data) {
    let failureReport = '';
    
    failureReport += '============= VIDEO TRACKING FAILURES =============\n\n';
    
    // Add detailed response type information
    failureReport += '==== Response Type Distribution ====\n';
    failureReport += 'Basic tracking/create:\n';
    failureReport += `  200 OK: ${responseTypes.basic['200']}\n`;
    failureReport += `  422 Validation: ${responseTypes.basic['422']}\n`;
    failureReport += `  Other Status: ${responseTypes.basic['other']}\n`;
    failureReport += `  Total Requests: ${responseTypes.basic['200'] + responseTypes.basic['422'] + responseTypes.basic['other']}\n\n`;
    
    failureReport += 'UUID tracking/create:\n';
    failureReport += `  200 OK: ${responseTypes.uuid['200']}\n`;
    failureReport += `  422 Validation: ${responseTypes.uuid['422']}\n`;
    failureReport += `  Other Status: ${responseTypes.uuid['other']}\n`;
    failureReport += `  Total Requests: ${responseTypes.uuid['200'] + responseTypes.uuid['422'] + responseTypes.uuid['other']}\n\n`;
    
    // Add debug information
    failureReport += '==== Debug Information ====\n';
    failureReport += `Total Video Page Load Failures: ${videoPageLoadFailures.length}\n`;
    failureReport += `Total tracking/create (basic) Failures: ${apiTrackingCreateFailures.length}\n`;
    failureReport += `Total tracking/create (UUID) Failures: ${apiTrackingCreateUuidFailures.length}\n\n`;
    
    // Add failure rate summary
    failureReport += '==== Failure Rate Summary ====\n';
    failureReport += 'Note: Both 200 OK and 422 Validation responses are considered valid (not failures).\n\n';
    
    const trackingCreateFailRate = data.metrics.education_tracking_create_fail_rate?.values?.rate || 0;
    const trackingCreateUuidFailRate = data.metrics.education_tracking_create_uuid_fail_rate?.values?.rate || 0;
    const totalTrackingRequests = data.metrics.education_tracking_create_requests?.values?.count || 0;
    const totalTrackingUuidRequests = data.metrics.education_tracking_create_uuid_requests?.values?.count || 0;

    // If all responseTypes counts are zero, show 0% failure rate
    const basicRespTotal = responseTypes.basic['200'] + responseTypes.basic['422'] + responseTypes.basic['other'];
    const uuidRespTotal = responseTypes.uuid['200'] + responseTypes.uuid['422'] + responseTypes.uuid['other'];
    const basicFailRateStr = basicRespTotal === 0 ? '0.00% (' + Math.round(trackingCreateFailRate * totalTrackingRequests) + '/' + totalTrackingRequests + ' requests)' : `${(trackingCreateFailRate * 100).toFixed(2)}% (${Math.round(trackingCreateFailRate * totalTrackingRequests)}/${totalTrackingRequests} requests)`;
    const uuidFailRateStr = uuidRespTotal === 0 ? '0.00% (' + Math.round(trackingCreateUuidFailRate * totalTrackingUuidRequests) + '/' + totalTrackingUuidRequests + ' requests)' : `${(trackingCreateUuidFailRate * 100).toFixed(2)}% (${Math.round(trackingCreateUuidFailRate * totalTrackingUuidRequests)}/${totalTrackingUuidRequests} requests)`;

    failureReport += `tracking/create (basic) Failure Rate: ${basicFailRateStr}\n`;
    failureReport += `tracking/create (UUID) Failure Rate: ${uuidFailRateStr}\n\n`;

    if (videoPageLoadFailures.length === 0 && 
        apiTrackingCreateFailures.length === 0 && 
        apiTrackingCreateUuidFailures.length === 0) {
        failureReport += 'No failures detected (non-200 and non-422 responses).\n';
        
        if (responseTypes.basic['other'] > 0 || responseTypes.uuid['other'] > 0) {
            failureReport += '\nResponse Status Distribution:\n';
            failureReport += `Basic tracking: ${responseTypes.basic['200']} OK, ${responseTypes.basic['422']} Validation, ${responseTypes.basic['other']} Other\n`;
            failureReport += `UUID tracking: ${responseTypes.uuid['200']} OK, ${responseTypes.uuid['422']} Validation, ${responseTypes.uuid['other']} Other\n`;
        }
    } else {
        failureReport += 'Failures detected:\n';
        if (apiTrackingCreateFailures.length > 0) {
            failureReport += '\nBasic tracking failures:\n';
            apiTrackingCreateFailures.forEach((failure, index) => {
                failureReport += `  ${index + 1}. Status: ${failure.status}, VU: ${failure.vu}\n`;
            });
        }
        if (apiTrackingCreateUuidFailures.length > 0) {
            failureReport += '\nUUID tracking failures:\n';
            apiTrackingCreateUuidFailures.forEach((failure, index) => {
                failureReport += `  ${index + 1}. Status: ${failure.status}, VU: ${failure.vu}\n`;
            });
        }
    }

    failureReport += '===============================================\n';

    // Existing summary logic
    try {
        const reportHtml = htmlReport(data);
        const reportJson = JSON.stringify(data, null, 2);
        
        return {
            'summary.html': reportHtml,
            'summary.json': reportJson,
            'failures.txt': failureReport,
            stdout: textSummary(data, { indent: ' ', enableColors: true }),
        };
    } catch (error) {
        console.error('Error in handleSummary:', error);
        return {
            'summary.html': `
                <!DOCTYPE html>
                <html>
                <head><title>Error in Report Generation</title></head>
                <body>
                    <h1>Error Generating Report</h1>
                    <pre>${error.stack}</pre>
                </body>
                </html>
            `,
            'summary.json': JSON.stringify({ error: error.message, data: data }, null, 2),
            'failures.txt': failureReport,
            stdout: `Error generating report: ${error.message}`,
        };
    }
}

function htmlReport(data) {
    try {
        const sections = [
            getHeader(),                        // 1. Header
            getSummaryGrid(data),              // 2. Summary Grid
            getTestConfig(),                   // 3. Test Config
            getCustomMetrics(data),            // 5. Custom Metrics
            getVideoPlaybackMetrics(data),     // 6. Video Playback Metrics
            getHttpMetrics(data),              // 7. HTTP Metrics
            getResponseTimeDistribution(data)   // 8. Response Time Distribution
        ].filter(Boolean);

        return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>K6 Performance Test Results</title>
            <style>
                ${getStyles()}
            </style>
        </head>
        <body>
            <div class="container">
                ${sections.join('\n')}
            </div>
        </body>
        </html>`;
    } catch (error) {
        console.error('Error generating HTML report:', error);
        return `
        <!DOCTYPE html>
        <html>
        <head><title>Error Generating Report</title></head>
        <body>
            <h1>Error Generating Report</h1>
            <pre>${error.stack}</pre>
            <h2>Data received:</h2>
            <pre>${JSON.stringify(data, null, 2)}</pre>
        </body>
        </html>`;
    }
}

function getStyles() {
    return `
        :root {
            --primary-color: #4CAF50;
            --secondary-color: #2196F3;
            --warning-color: #ff9800;
            --danger-color: #f44336;
            --success-color: #4CAF50;
            --text-primary: #2c3e50;
            --text-secondary: #34495e;
            --bg-primary: #fff;
            --bg-secondary: #f8f9fa;
            --border-radius: 12px;
            --box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            --gradient-primary: linear-gradient(135deg, #4CAF50, #45a049);
            --gradient-secondary: linear-gradient(135deg, #2196F3, #1976D2);
        }

        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: var(--text-primary);
            background: #f0f2f5;
            padding: 2rem;
        }

        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: var(--bg-primary);
            border-radius: var(--border-radius);
            box-shadow: var(--box-shadow);
            padding: 2rem;
        }

        .header {
            text-align: center;
            margin-bottom: 2.5rem;
            padding-bottom: 1.5rem;
            border-bottom: 2px solid #eee;
            background: var(--gradient-primary);
            margin: -2rem -2rem 2rem -2rem;
            padding: 2rem;
            border-radius: var(--border-radius) var(--border-radius) 0 0;
            color: white;
        }

        .header h1 {
            font-size: 2.5rem;
            margin-bottom: 0.5rem;
            text-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        .header p {
            font-size: 1.1rem;
            opacity: 0.9;
        }

        .summary-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 1.5rem;
            margin-bottom: 2.5rem;
        }

        .metric-card {
            background: var(--bg-secondary);
            padding: 1.5rem;
            border-radius: var(--border-radius);
            box-shadow: var(--box-shadow);
            transition: all 0.3s ease;
            border: 1px solid rgba(0,0,0,0.05);
        }

        .metric-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 6px 12px rgba(0,0,0,0.1);
        }

        .metric-title {
            font-size: 1.1rem;
            color: var(--text-secondary);
            margin-bottom: 0.75rem;
            font-weight: 500;
        }

        .metric-value {
            font-size: 2rem;
            font-weight: bold;
            color: var(--primary-color);
            text-shadow: 0 1px 2px rgba(0,0,0,0.05);
        }

        .section {
            margin-bottom: 2.5rem;
            background: var(--bg-primary);
            border-radius: var(--border-radius);
            padding: 1.5rem;
            box-shadow: var(--box-shadow);
        }

        .section h2 {
            color: var(--text-primary);
            margin-bottom: 1.5rem;
            padding-bottom: 0.75rem;
            border-bottom: 2px solid #eee;
            font-size: 1.75rem;
        }

        .metrics-table {
            width: 100%;
            border-collapse: separate;
            border-spacing: 0;
            margin-top: 1rem;
            background: white;
            border-radius: var(--border-radius);
            overflow: hidden;
        }

        .metrics-table th,
        .metrics-table td {
            padding: 1.25rem 1rem;
            text-align: left;
            border-bottom: 1px solid #eee;
        }

        .metrics-table th {
            background: var(--gradient-secondary);
            color: white;
            font-weight: 600;
            text-transform: uppercase;
            font-size: 0.85rem;
            letter-spacing: 0.5px;
        }

        .metrics-table tr:hover {
            background: #f8f9fa;
        }

        .metrics-table tr:last-child td {
            border-bottom: none;
        }

        .status-badge {
            padding: 0.5rem 1rem;
            border-radius: 50px;
            font-size: 0.875rem;
            font-weight: 500;
            display: inline-block;
        }

        .status-success {
            background: #e8f5e9;
            color: var(--success-color);
        }

        .status-warning {
            background: #fff3e0;
            color: var(--warning-color);
        }

        .status-danger {
            background: #ffebee;
            color: var(--danger-color);
        }

        @media (max-width: 768px) {
            body {
                padding: 1rem;
            }

            .summary-grid {
                grid-template-columns: 1fr;
            }

            .metric-card {
                padding: 1.25rem;
            }

            .header {
                margin: -1rem -1rem 1.5rem -1rem;
                padding: 1.5rem;
            }
        }

        /* Add subtle animations */
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }

        .metric-card {
            animation: fadeIn 0.5s ease-out forwards;
        }

        .metric-card:nth-child(1) { animation-delay: 0.1s; }
        .metric-card:nth-child(2) { animation-delay: 0.2s; }
        .metric-card:nth-child(3) { animation-delay: 0.3s; }
        .metric-card:nth-child(4) { animation-delay: 0.4s; }

        .response-status {
            padding: 4px 8px;
            border-radius: 4px;
            font-weight: bold;
        }
        .status-good { background: #e8f5e9; color: #2e7d32; }
        .status-warning { background: #fff3e0; color: #f57c00; }
        .status-critical { background: #ffebee; color: #c62828; }

        @media print {
            .container {
                width: 100%;
                margin: 0;
                padding: 0;
            }
            
            .section {
                page-break-inside: avoid;
            }
        }

        @media (prefers-color-scheme: dark) {
            :root {
                --bg-primary: #1a1a1a;
                --bg-secondary: #2d2d2d;
                --text-primary: #ffffff;
                --text-secondary: #cccccc;
            }
            
            .metrics-table th {
                background: #333;
            }
            
            .metrics-table tr:hover {
                background: #2a2a2a;
            }
        }

        .progress-bar {
            width: 100%;
            height: 8px;
            background: #eee;
            border-radius: 4px;
            overflow: hidden;
        }

        .progress-fill {
            height: 100%;
            background: var(--primary-color);
            transition: width 0.3s ease;
        }

        .test-config-section {
            margin-bottom: 3rem;
            background: linear-gradient(145deg, #ffffff, #f5f7fa);
            border: 1px solid #e1e4e8;
        }

        .config-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);  /* Changed to always show 2 columns */
            gap: 2rem;
            padding: 2rem;
            max-width: 1000px;  /* Added max-width for better readability */
            margin: 0 auto;     /* Center the grid */
        }

        .config-card {
            display: flex;
            flex-direction: column;
            align-items: center;
            text-align: center;
            padding: 2rem;      /* Increased padding */
            background: white;
            border-radius: 12px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
            transition: transform 0.2s ease;
        }

        .config-card:hover {
            transform: translateY(-5px);
        }

        .config-icon {
            font-size: 2.5rem;  /* Increased icon size */
            margin-bottom: 1.5rem;
        }

        .config-title {
            color: #6c757d;
            font-size: 1rem;    /* Slightly increased font size */
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 0.75rem;
        }

        .config-value {
            font-size: 1.3rem;  /* Increased font size */
            font-weight: 600;
            color: #2c3e50;
            word-break: break-all;
        }

        .config-value.highlight {
            color: #2196F3;
            padding: 0.75rem 1.5rem;  /* Increased padding */
            border-radius: 8px;
            background: rgba(33, 150, 243, 0.1);
        }

        /* Responsive design for smaller screens */
        @media (max-width: 768px) {
            .config-grid {
                grid-template-columns: 1fr;  /* Stack cards on small screens */
                padding: 1rem;
            }
            
            .config-card {
                padding: 1.5rem;
            }
        }
    `;
}

function getHeader() {
    return `
        <div class="header">
            <h1>K6 Performance Test Results</h1>
            <p>Test completed at ${new Date().toLocaleString()}</p>
        </div>
    `;
}

function getSummaryGrid(data) {
    return `
        <div class="summary-grid">
            <div class="metric-card">
                <div class="metric-title">Total Duration</div>
                <div class="metric-value">${Math.round(data.state.testRunDurationMs / 1000)}s</div>
            </div>
            <div class="metric-card">
                <div class="metric-title">Virtual Users</div>
                <div class="metric-value">${VU_COUNT}</div>
            </div>
            <div class="metric-card">
                <div class="metric-title">Success Rate</div>
                <div class="metric-value ${data.metrics.http_req_failed.values.rate > 0 ? 'status-warning' : 'status-success'}">
                    ${((1 - data.metrics.http_req_failed.values.rate) * 100).toFixed(2)}%
                </div>
            </div>
            <div class="metric-card">
                <div class="metric-title">Avg Request Duration</div>
                <div class="metric-value">${(data.metrics.http_req_duration.values.avg).toFixed(2)}ms</div>
            </div>
        </div>
    `;
}

function getTestConfig() {
    return `
        <div class="section test-config-section">
            <h2>Test Overview</h2>
            <div class="config-grid">
                <div class="config-card">
                    <div class="config-icon">🌐</div>
                    <div class="config-title">Environment</div>
                    <div class="config-value highlight">${ENV}</div>
                </div>
                <div class="config-card">
                    <div class="config-icon">🔗</div>
                    <div class="config-title">Base URL</div>
                    <div class="config-value highlight">${BASE_URL}</div>
                </div>
            </div>
        </div>
    `;
}

function getCustomMetrics(data) {
    try {
        const customMetrics = [
            // Authentication
            { name: 'Csrf', time: 'csrf_time', requests: 'csrf_requests', failRate: 'csrf_fail_rate' },
            { name: 'Login', time: 'login_time', requests: 'login_requests', failRate: 'login_fail_rate' },
            { name: 'Get User', time: 'get_user_time', requests: 'get_user_requests', failRate: 'get_user_fail_rate' },
            { name: 'Broadcast Auth', time: 'broadcast_auth_time', requests: 'broadcast_auth_requests', failRate: 'broadcast_auth_fail_rate' },
            
            // Education Content APIs
            { name: 'Education Conditions', time: 'education_conditions_time', requests: 'education_conditions_requests', failRate: 'education_conditions_fail_rate' },
            { name: 'Education Treatment', time: 'education_treatment_time', requests: 'education_treatment_requests', failRate: 'education_treatment_fail_rate' },
            { name: 'Education Risk', time: 'education_risk_time', requests: 'education_risk_requests', failRate: 'education_risk_fail_rate' },
            { name: 'Education Playlist', time: 'education_playlist_time', requests: 'education_playlist_requests', failRate: 'education_playlist_fail_rate' },
            
            // Voice Note APIs
            { name: 'Create Session', time: 'create_session_time', requests: 'create_session_requests', failRate: 'create_session_fail_rate' },
            { name: 'S3 Response', time: 's3_response_time', requests: 's3_response_requests', failRate: 's3_upload_fail_rate' },
            { name: 'Stop1', time: 'stop1_time', requests: 'stop1_requests', failRate: 'stop1_fail_rate' },
            { name: 'Transcribe', time: 'transcribe_time', requests: 'transcribe_requests', failRate: 'transcribe_fail_rate' },
            { name: 'Create Title', time: 'create_title_time', requests: 'create_title_requests', failRate: 'create_title_fail_rate' }
        ];

        return `
            <div class="section">
                <h2>Custom Metrics</h2>
                <div class="metrics-table-container">
                    <table class="metrics-table">
                        <thead>
                            <tr>
                                <th>Metric</th>
                                <th>Total Requests</th>
                                <th>Avg (ms)</th>
                                <th>Min (ms)</th>
                                <th>Med (ms)</th>
                                <th>Max (ms)</th>
                                <th>p(95)</th>
                                <th>Failure Rate</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${customMetrics.map(metric => {
                                const timeMetric = data.metrics[metric.time];
                                const requestCount = data.metrics[metric.requests]?.values?.count || 0;
                                const failRate = data.metrics[metric.failRate]?.values?.rate || 0;

                                return `
                                    <tr>
                                        <td><strong>${metric.name}</strong></td>
                                        <td>${requestCount}</td>
                                        <td>${timeMetric?.values?.avg?.toFixed(2) || '0.00'}</td>
                                        <td>${timeMetric?.values?.min?.toFixed(2) || '0.00'}</td>
                                        <td>${timeMetric?.values?.med?.toFixed(2) || '0.00'}</td>
                                        <td>${timeMetric?.values?.max?.toFixed(2) || '0.00'}</td>
                                        <td>${timeMetric?.values?.['p(95)']?.toFixed(2) || '0.00'}</td>
                                        <td>${(failRate * 100).toFixed(2)}%</td>
                                    </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    } catch (error) {
        console.error('Error in getCustomMetrics:', error);
        return `
            <div class="section">
                <h2>Custom Metrics</h2>
                <p>Error generating custom metrics: ${error.message}</p>
            </div>
        `;
    }
}

function getHttpMetrics(data) {
    const httpMetrics = [
        { name: 'http_req_waiting', label: 'Wait Time', unit: 'ms' },
        { name: 'http_req_blocked', label: 'Blocked Time', unit: 'ms' },
        { name: 'http_req_receiving', label: 'Receiving Time', unit: 'ms' },
        { name: 'http_req_failed', label: 'Failed Rate', isRate: true },
        { name: 'http_req_sending', label: 'Send Time', unit: 'ms' },
        { name: 'http_req_connecting', label: 'Connect Time', unit: 'ms' },
        { name: 'http_req_tls_handshaking', label: 'TLS Time', unit: 'ms' },
        { name: 'http_req_duration', label: 'Total Duration', unit: 'ms' },
        { name: 'http_req_duration{expected_response:true}', label: 'Duration (2xx)', unit: 'ms' },
        { name: 'http_reqs', label: 'Total Requests', isRate: true }
    ];

    return `
        <div class="section">
            <h2>HTTP Metrics</h2>
            <div class="metrics-table-container">
                <table class="metrics-table">
                    <thead>
                        <tr>
                            <th>Metric</th>
                            <th>Value</th>
                            <th>Rate</th>
                            <th>Count</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${httpMetrics.map(metric => {
                            const metricData = data.metrics[metric.name];
                            let value = '-';
                            let rate = '-';
                            let count = '0';

                            if (metricData) {
                                if (metric.isRate) {
                                    rate = `${(metricData.values.rate * 100).toFixed(2)}%`;
                                    count = metricData.values.count || 0;
                                    value = '-';
                                } else {
                                    value = `${metricData.values.avg.toFixed(2)} ${metric.unit}`;
                                    rate = '-';
                                    count = '0';
                                }
                            }

                            return `
                                <tr>
                                    <td><strong>${metric.label}</strong></td>
                                    <td>${value}</td>
                                    <td>${rate}</td>
                                    <td>${count}</td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

function getResponseTimeDistribution(data) {
    return `
        <div class="section">
            <h2>Response Time Distribution</h2>
            <div class="metrics-table-container">
                <table class="metrics-table">
                    <thead>
                        <tr>
                            <th>Percentile</th>
                            <th>Response Time (ms)</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${['p(90)', 'p(95)', 'p(99)'].map(percentile => {
                            const value = data.metrics.http_req_duration?.values[percentile] || 0;
                            return `
                                <tr>
                                    <td><strong>${percentile}</strong></td>
                                    <td>${value.toFixed(2)}</td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}
function getVideoPlaybackMetrics(data) {
    // Add timing information to the report
    const basicTrackingTime = data.metrics.education_tracking_create_time?.values || { avg: 0, min: 0, max: 0 };
    const uuidTrackingTime = data.metrics.education_tracking_create_uuid_time?.values || { avg: 0, min: 0, max: 0 };
    const viewTrackingTime = data.metrics.education_content_view_tracking_time?.values || { avg: 0, min: 0, max: 0 };

    // Custom failure rate display logic for basic and uuid
    const basicFailRate = data.metrics.education_tracking_create_fail_rate?.values?.rate || 0;
    const uuidFailRate = data.metrics.education_tracking_create_uuid_fail_rate?.values?.rate || 0;
    const basicRespTotal = responseTypes.basic['200'] + responseTypes.basic['422'] + responseTypes.basic['other'];
    const uuidRespTotal = responseTypes.uuid['200'] + responseTypes.uuid['422'] + responseTypes.uuid['other'];
    const basicFailRateDisplay = basicRespTotal === 0 ? '0.00%' : `${(basicFailRate * 100).toFixed(2)}%`;
    const uuidFailRateDisplay = uuidRespTotal === 0 ? '0.00%' : `${(uuidFailRate * 100).toFixed(2)}%`;

    return `
        <div class="section">
            <h2>Video Playback Metrics</h2>
            <div class="metrics-table-container">
                <table class="metrics-table">
                    <thead>
                        <tr>
                            <th>Operation</th>
                            <th>Total Requests</th>
                            <th>Avg Time (ms)</th>
                            <th>Min Time (ms)</th>
                            <th>Max Time (ms)</th>
                            <th>Failure Rate</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td><strong>Video Page Load</strong></td>
                            <td>${data.metrics.video_playback_page_requests?.values?.count || 0}</td>
                            <td>${data.metrics.video_playback_page_load_time?.values?.avg?.toFixed(2) || '0.00'}</td>
                            <td>${data.metrics.video_playback_page_load_time?.values?.min?.toFixed(2) || '0.00'}</td>
                            <td>${data.metrics.video_playback_page_load_time?.values?.max?.toFixed(2) || '0.00'}</td>
                            <td>${((data.metrics.video_playback_page_fail_rate?.values?.rate || 0) * 100).toFixed(2)}%</td>
                        </tr>
                        <tr>
                            <td><strong>API: education-content-view-tracking</strong></td>
                            <td>${data.metrics.education_content_view_tracking_requests?.values?.count || 0}</td>
                            <td>${viewTrackingTime.avg?.toFixed(2) || '0.00'}</td>
                            <td>${viewTrackingTime.min?.toFixed(2) || '0.00'}</td>
                            <td>${viewTrackingTime.max?.toFixed(2) || '0.00'}</td>
                            <td>${((data.metrics.education_content_view_tracking_fail_rate?.values?.rate || 0) * 100).toFixed(2)}%</td>
                        </tr>
                        <tr>
                            <td><strong>API: tracking/create (basic)</strong></td>
                            <td>${data.metrics.education_tracking_create_requests?.values?.count || 0}</td>
                            <td>${basicTrackingTime.avg?.toFixed(2) || '0.00'}</td>
                            <td>${basicTrackingTime.min?.toFixed(2) || '0.00'}</td>
                            <td>${basicTrackingTime.max?.toFixed(2) || '0.00'}</td>
                            <td>${basicFailRateDisplay}</td>
                        </tr>
                        <tr>
                            <td><strong>API: tracking/create (with UUID)</strong></td>
                            <td>${data.metrics.education_tracking_create_uuid_requests?.values?.count || 0}</td>
                            <td>${uuidTrackingTime.avg?.toFixed(2) || '0.00'}</td>
                            <td>${uuidTrackingTime.min?.toFixed(2) || '0.00'}</td>
                            <td>${uuidTrackingTime.max?.toFixed(2) || '0.00'}</td>
                            <td>${uuidFailRateDisplay}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    `;
}
