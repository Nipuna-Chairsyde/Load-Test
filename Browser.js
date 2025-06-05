import { browser } from 'k6/browser';
import { check, sleep } from 'k6';
import { Trend, Counter } from 'k6/metrics';
import { SharedArray } from 'k6/data';
import papaparse from 'https://jslib.k6.io/papaparse/5.1.1/index.js';

// Load users from CSV
const users = new SharedArray('users', function () {
    const csvData = open('./users.csv');
    return papaparse.parse(csvData, { header: true }).data;
});

// Custom metrics for page load times and counters
const pageMetrics = {
    loginPageLoad: new Trend('login_page_load'),
    voiceNotePageLoad: new Trend('voice_note_page_load'),
    landingPageLoad: new Trend('landing_page_load'),
    videoPlaybackPageLoad: new Trend('video_playback_page_load')
};

export const options = {
    scenarios: {
        ui: {
            executor: 'per-vu-iterations',
            vus: 5,
            iterations: 1, // each VU runs once
            maxDuration: '5m',
            options: {
                browser: {
                    type: 'chromium',
                    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
                    headless: false,
                    debug: true,
                    args: [
                        '--window-position=100,100',  
                        '--window-size=1280,720',
                        '--no-sandbox',
                        '--disable-setuid-sandbox',
                        '--disable-dev-shm-usage',
                        '--disable-gpu',
                        '--no-first-run',
                        '--no-zygote',
                        '--start-maximized',
                        '--auto-open-devtools-for-tabs',
                        '--disable-background-networking',
                        '--disable-background-timer-throttling',
                        '--disable-backgrounding-occluded-windows',
                        '--disable-breakpad',
                        '--disable-client-side-phishing-detection',
                        '--disable-default-apps',
                        '--disable-extensions',
                        '--disable-features=site-per-process',
                        '--disable-hang-monitor',
                        '--disable-ipc-flooding-protection',
                        '--disable-popup-blocking',
                        '--disable-prompt-on-repost',
                        '--disable-renderer-backgrounding',
                        '--disable-sync',
                        '--force-color-profile=srgb',
                        '--metrics-recording-only',
                        '--no-default-browser-check',
                        '--password-store=basic',
                        '--enable-precise-memory-info',
                        '--disable-notifications',
                        '--disable-file-system'
                    ],
                    ignoreDefaultArgs: ['--enable-automation', '--hide-scrollbars'],
                    timeout: '90s',
                    launchTimeout: '90s'
                },
            },
        },
    },
    thresholds: {
        checks: ['rate>0.9'], // Allow 10% of checks to fail
    },
};

// Helper function to retry operations
async function retry(fn, options = { maxAttempts: 3, delay: 1000 }) {
    let lastError;
    for (let attempt = 1; attempt <= options.maxAttempts; attempt++) {
        try {
            return await fn();
        } catch (error) {
            lastError = error;
            if (attempt < options.maxAttempts) {
                console.log(`Attempt ${attempt} failed, retrying in ${options.delay}ms...`);
                sleep(options.delay / 1000); // Convert ms to seconds for k6 sleep
            }
        }
    }
    throw lastError;
}

// HTML report handler
export function handleSummary(data) {
    // Get iteration count directly from k6's built-in iterations metric
    const iterationCount = data.metrics['iterations']?.values?.count || 0;
    
    console.log(`Total iterations completed: ${iterationCount}`);
    
    return {
        "browser_summary.html": generateHTML(data, iterationCount)
    };
}

function generateHTML(data, iterationCount = 0) {
    // Helper function to format metrics
    function formatMetric(metric, metricName) {
        if (!metric || !metric.values) return { avg: 0, min: 0, max: 0, p95: 0, count: 0 };
        
        // Use the iteration count for samples since we collect one sample per iteration
        const count = iterationCount;
        
        return {
            avg: metric.values.avg ? metric.values.avg.toFixed(2) : 0,
            min: metric.values.min ? metric.values.min.toFixed(2) : 0,
            max: metric.values.max ? metric.values.max.toFixed(2) : 0,
            p95: metric.values["p(95)"] ? metric.values["p(95)"].toFixed(2) : 0,
            count: count
        };
    }

    // Get metrics with correct counts
    const loginMetrics = formatMetric(data.metrics.login_page_load, 'login_page_load');
    const voiceNoteMetrics = formatMetric(data.metrics.voice_note_page_load, 'voice_note_page_load');
    const landingMetrics = formatMetric(data.metrics.landing_page_load, 'landing_page_load');
    const videoPlaybackMetrics = formatMetric(data.metrics.video_playback_page_load, 'video_playback_page_load');
    
    // Calculate total samples
    const totalSamples = iterationCount;
    
    return `
    <!DOCTYPE html>
    <html>
        <head>
            <title>Performance Test Report</title>
            <style>
                body {
                    font-family: 'Segoe UI', Arial, sans-serif;
                    margin: 0;
                    padding: 20px;
                    background: #f5f7fa;
                    color: #2c3e50;
                }
                .container {
                    max-width: 1200px;
                    margin: 0 auto;
                    background: white;
                    padding: 30px;
                    border-radius: 10px;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                }
                table {
                    width: 100%;
                    border-collapse: collapse;
                    margin: 20px 0;
                    background: white;
                    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
                }
                th, td {
                    padding: 15px;
                    text-align: left;
                    border-bottom: 1px solid #eee;
                }
                th {
                    background-color: #34495e;
                    color: white;
                    font-weight: 600;
                }
                tr:hover {
                    background-color: #f8f9fa;
                }
                .metric-good {
                    color: #27ae60;
                    font-weight: 600;
                }
                .metric-warning {
                    color: #f39c12;
                    font-weight: 600;
                }
                .metric-bad {
                    color: #e74c3c;
                    font-weight: 600;
                }
                h1 {
                    color: #34495e;
                    margin-bottom: 30px;
                    padding-bottom: 10px;
                    border-bottom: 2px solid #eee;
                }
                h2 {
                    color: #2c3e50;
                    margin: 25px 0 15px;
                }
                .summary-box {
                    background: #f8f9fa;
                    padding: 25px;
                    border-radius: 8px;
                    margin: 20px 0;
                    border-left: 4px solid #3498db;
                }
                .metric-cell {
                    font-family: 'Consolas', monospace;
                }
                .page-name {
                    font-weight: 600;
                    color: #34495e;
                }
                .test-info {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                    gap: 20px;
                    margin-top: 20px;
                }
                .info-card {
                    background: white;
                    padding: 15px;
                    border-radius: 6px;
                    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
                }
                .info-card h3 {
                    margin: 0 0 10px;
                    color: #34495e;
                    font-size: 0.9em;
                    text-transform: uppercase;
                }
                .info-card p {
                    margin: 0;
                    font-size: 1.2em;
                    color: #2c3e50;
                }
                .metric-value {
                    font-family: 'Consolas', monospace;
                    padding: 2px 6px;
                    border-radius: 3px;
                    background: #f8f9fa;
                }
                .samples-cell {
                    font-weight: bold;
                    text-align: center;
                    background-color: #f8f9fa;
                }
                .video-playback-row {
                    background-color: #f8f9fa;
                }
                .video-playback-row td {
                    border-top: 2px solid #dee2e6;
                }
                .video-playback-details {
                    font-size: 0.9em;
                    color: #666;
                    padding: 5px 15px;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>Performance Test Report</h1>
                
                <div class="summary-box">
                    <h2>Response Time Summary</h2>
                    <table>
                        <tr>
                            <th>Page</th>
                            <th>Avg (ms)</th>
                            <th>Min (ms)</th>
                            <th>Max (ms)</th>
                            <th>p(95) (ms)</th>
                            <th>Samples</th>
                        </tr>
                        <tr>
                            <td class="page-name">Login Page</td>
                            <td class="metric-cell ${loginMetrics.avg < 1000 ? 'metric-good' : loginMetrics.avg < 2000 ? 'metric-warning' : 'metric-bad'}">
                                <span class="metric-value">${loginMetrics.avg}</span>
                            </td>
                            <td class="metric-cell"><span class="metric-value">${loginMetrics.min}</span></td>
                            <td class="metric-cell"><span class="metric-value">${loginMetrics.max}</span></td>
                            <td class="metric-cell"><span class="metric-value">${loginMetrics.p95}</span></td>
                            <td class="samples-cell">${loginMetrics.count}</td>
                        </tr>
                        <tr>
                            <td class="page-name">Voice Note Page</td>
                            <td class="metric-cell ${voiceNoteMetrics.avg < 1000 ? 'metric-good' : voiceNoteMetrics.avg < 2000 ? 'metric-warning' : 'metric-bad'}">
                                <span class="metric-value">${voiceNoteMetrics.avg}</span>
                            </td>
                            <td class="metric-cell"><span class="metric-value">${voiceNoteMetrics.min}</span></td>
                            <td class="metric-cell"><span class="metric-value">${voiceNoteMetrics.max}</span></td>
                            <td class="metric-cell"><span class="metric-value">${voiceNoteMetrics.p95}</span></td>
                            <td class="samples-cell">${voiceNoteMetrics.count}</td>
                        </tr>
                        <tr>
                            <td class="page-name">Landing Page</td>
                            <td class="metric-cell ${landingMetrics.avg < 1000 ? 'metric-good' : landingMetrics.avg < 2000 ? 'metric-warning' : 'metric-bad'}">
                                <span class="metric-value">${landingMetrics.avg}</span>
                            </td>
                            <td class="metric-cell"><span class="metric-value">${landingMetrics.min}</span></td>
                            <td class="metric-cell"><span class="metric-value">${landingMetrics.max}</span></td>
                            <td class="metric-cell"><span class="metric-value">${landingMetrics.p95}</span></td>
                            <td class="samples-cell">${landingMetrics.count}</td>
                        </tr>
                        <tr class="video-playback-row">
                            <td class="page-name">Video Playback Pages</td>
                            <td class="metric-cell ${videoPlaybackMetrics.avg < 1000 ? 'metric-good' : videoPlaybackMetrics.avg < 2000 ? 'metric-warning' : 'metric-bad'}">
                                <span class="metric-value">${videoPlaybackMetrics.avg}</span>
                            </td>
                            <td class="metric-cell"><span class="metric-value">${videoPlaybackMetrics.min}</span></td>
                            <td class="metric-cell"><span class="metric-value">${videoPlaybackMetrics.max}</span></td>
                            <td class="metric-cell"><span class="metric-value">${videoPlaybackMetrics.p95}</span></td>
                            <td class="samples-cell">${videoPlaybackMetrics.count * 3}</td>
                        </tr>
                        <tr>
                            <td colspan="6" class="video-playback-details">
                                Includes: Treatment 7, Treatment 1, and Treatment 15 pages
                            </td>
                        </tr>
                    </table>
                </div>

                <div class="summary-box">
                    <h2>Test Configuration</h2>
                    <div class="test-info">
                        <div class="info-card">
                            <h3>Duration</h3>
                            <p>${(data.state.testRunDurationMs / 1000).toFixed(2)} seconds</p>
                        </div>
                        <div class="info-card">
                            <h3>Total Iterations</h3>
                            <p>${totalSamples}</p>
                        </div>
                        <div class="info-card">
                            <h3>Peak VUs</h3>
                            <p>1</p>
                        </div>
                        <div class="info-card">
                            <h3>Test Time</h3>
                            <p>${new Date().toLocaleString()}</p>
                        </div>
                    </div>
                </div>
            </div>
        </body>
    </html>`;
}

export default async function () {
    const user = users[__VU - 1 % users.length];
    let context;
    let page;

    try {
        console.log(`Starting iteration for VU ${__VU}`);
        context = await browser.newContext({
            viewport: { width: 1280, height: 720 },
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        });

        page = await context.newPage();

        // Login page with retry
        await retry(async () => {
            const loginPageStartTime = new Date();
            await page.goto('https://demo.chairsyde.com/', { timeout: 30000 });
            await page.waitForLoadState('networkidle');
            const loginPageLoadTime = new Date() - loginPageStartTime;
            console.log(`Login page load time: ${loginPageLoadTime} ms`);
            pageMetrics.loginPageLoad.add(loginPageLoadTime);

            // Ensure login form is visible
            await page.waitForSelector('#inp_email', { state: 'visible', timeout: 10000 });
            await page.waitForSelector('#inp_password', { state: 'visible', timeout: 10000 });
            await page.waitForSelector('#btn_login', { state: 'visible', timeout: 10000 });
        });

        // Login process with retry
        await retry(async () => {
            await page.locator('#inp_email').type(user.email);
            await page.locator('#inp_password').type(user.password);
            
            const voiceNotePageStartTime = new Date();
            await Promise.all([
                page.waitForNavigation({ waitUntil: 'networkidle', timeout: 30000 }),
                page.locator('#btn_login').click()
            ]);
            
            const voiceNotePageLoadTime = new Date() - voiceNotePageStartTime;
            console.log(`Voice note page load time: ${voiceNotePageLoadTime} ms`);
            pageMetrics.voiceNotePageLoad.add(voiceNotePageLoadTime);
        });

        // Verify voice-note page with retry
        await retry(async () => {
            await page.waitForLoadState('networkidle');
            const voiceNoteUrl = await page.url();
            const voiceNoteChecks = check(page, {
                'Voice note page URL is correct': () => voiceNoteUrl.replace(/\/$/, '') === 'https://demo.chairsyde.com/voice-note'
            });
            
            if (!voiceNoteChecks) {
                throw new Error('Voice note page checks failed');
            }
            console.log('✓ Voice note page checks passed');
        });

        // Small wait to ensure application state is stable
        sleep(1);

        // Navigate to landing page with retry
        await retry(async () => {
            const landingPageStartTime = new Date();
            await page.goto('https://demo.chairsyde.com/landing', { timeout: 30000 });
            await page.waitForLoadState('networkidle');
            const landingPageLoadTime = new Date() - landingPageStartTime;
            console.log(`Landing page load time: ${landingPageLoadTime} ms`);
            pageMetrics.landingPageLoad.add(landingPageLoadTime);

            console.log('Landing page loaded, waiting for content...');

            // Wait for landing page content with detailed logging
            try {
                await page.waitForSelector('.intro-headings', { state: 'visible', timeout: 20000 });
                console.log('✓ Found intro-headings container');
                
                await page.waitForSelector('h4.intro-subtxt', { state: 'visible', timeout: 20000 });
                console.log('✓ Found intro-subtxt element');
            } catch (error) {
                console.error(`Failed to find landing page elements: ${error.message}`);
                throw error;
            }
        });

        // Verify landing page with retry and detailed logging
        await retry(async () => {
            console.log('Starting landing page verification...');

            // Get the text content with error handling
            let introText, isIntroVisible, currentUrl;
            
            try {
                const introElement = page.locator('h4.intro-subtxt');
                isIntroVisible = await introElement.isVisible();
                console.log(`Element visibility: ${isIntroVisible}`);

                if (!isIntroVisible) {
                    console.error('Landing page text element is not visible');
                    throw new Error('Landing page text element is not visible');
                }

                introText = await introElement.textContent();
                console.log(`Found text content: "${introText.trim()}"`);

                currentUrl = await page.url();
                console.log(`Current URL: ${currentUrl}`);

            } catch (error) {
                console.error(`Error during content verification: ${error.message}`);
                throw error;
            }

            // Perform checks with detailed feedback
            const landingPageChecks = check(page, {
                'Landing page text is present': () => {
                    const expectedText = 'What condition are we treating today?';
                    const textMatches = introText.trim() === expectedText;
                    if (!textMatches) {
                        console.error(`Text mismatch. Expected: "${expectedText}", Got: "${introText.trim()}"`);
                    }
                    return isIntroVisible && textMatches;
                },
                'Landing page URL is correct': () => {
                    const expectedUrl = 'https://demo.chairsyde.com/landing';
                    const normalizedCurrentUrl = currentUrl.replace(/\/$/, '');
                    const normalizedExpectedUrl = expectedUrl.replace(/\/$/, '');
                    const urlMatches = normalizedCurrentUrl === normalizedExpectedUrl;
                    if (!urlMatches) {
                        console.error(`URL mismatch after normalization. Expected: ${normalizedExpectedUrl}, Got: ${normalizedCurrentUrl}`);
                    }
                    return urlMatches;
                }
            });

            if (!landingPageChecks) {
                throw new Error('Landing page checks failed - see above logs for details');
            }

            console.log('✓ Landing page checks passed');
            console.log(`  - Text verified: "${introText.trim()}"`);
            console.log(`  - URL verified: ${currentUrl}`);
        }, { maxAttempts: 3, delay: 2000 }); // Increased delay between retries for landing page

        // Video Playback Pages
        console.log('Starting video playback page visits...');

        const videoPages = [
            {
                url: 'https://demo.chairsyde.com/content/?treatment-category=2&treatment=7',
                name: 'Treatment 7',
                check: (url) => url.includes('treatment-category=2&treatment=7')
            },
            {
                url: 'https://demo.chairsyde.com/content/?treatment-category=3&treatment=1',
                name: 'Treatment 1',
                check: (url) => url.includes('treatment-category=3&treatment=1')
            },
            {
                url: 'https://demo.chairsyde.com/content/?treatment-category=4&treatment=15',
                name: 'Treatment 15',
                check: (url) => url.includes('treatment-category=4&treatment=15')
            }
        ];

        // Visit each video page
        for (const videoPage of videoPages) {
            await retry(async () => {
                const pageStartTime = new Date();
                await page.goto(videoPage.url, { timeout: 30000 });
                await page.waitForLoadState('networkidle');
                const pageLoadTime = new Date() - pageStartTime;
                console.log(`${videoPage.name} page load time: ${pageLoadTime} ms`);
                pageMetrics.videoPlaybackPageLoad.add(pageLoadTime);

                // Verify page load
                const currentUrl = await page.url();
                check(page, {
                    [`${videoPage.name} page loaded correctly`]: () => videoPage.check(currentUrl)
                });
            });

            if (videoPage !== videoPages[videoPages.length - 1]) {
                console.log(`Waiting 10 seconds before next page... (VU ${__VU})`);
                sleep(10);
            }
        }

        console.log(`Iteration completed successfully for VU ${__VU}`);

    } catch (error) {
        console.error(`Test iteration failed for VU ${__VU}: ${error.message}`);
        throw error;
    } finally {
        try {
            if (page) {
                await page.close();
            }
            if (context) {
                await context.close();
            }
        } catch (error) {
            console.log(`Warning: Error during cleanup for VU ${__VU}: ${error.message}`);
        }
    }
}