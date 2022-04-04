const puppeteer = require("puppeteer");
const qrcode = require("qrcode-terminal");
const { from, merge } = require('rxjs');
const { take } = require('rxjs/operators');
const path = require('path');
var rimraf = require("rimraf");

let browser = null;
let page = null;
let counter = { fails: 0, success: 0 }
const tmpPath = path.resolve(__dirname, '../tmp');

const SELECTORS = {
    LOADING: "progress",
    INSIDE_CHAT: "document.getElementsByClassName('two')[0]",
    QRCODE_PAGE: "body > div > div > .landing-wrapper",
    QRCODE_DATA: "div[data-ref]",
    QRCODE_DATA_ATTR: "data-ref",
    SEND_BUTTON: 'div:nth-child(2) > button > span[data-icon="send"]'
};

/**
 * Initialize browser, page and setup page desktop mode
 */
async function start({ showBrowser = false, qrCodeData = false, session = true } = {}) {
    if (!session) {
        deleteSession(tmpPath);
    }

    const args = {
        headless: !showBrowser,
        userDataDir: tmpPath,
        args: ["--no-sandbox",
            // "--blink-settings=imagesEnabled=false"]
        ]
    }
    try {
        browser = await puppeteer.launch(args);
        page = await browser.newPage();
        // prevent dialog blocking page and just accept it(necessary when a message is sent too fast)
        page.on("dialog", async dialog => { await dialog.accept(); });
        // fix the chrome headless mode true issues
        // https://gitmemory.com/issue/GoogleChrome/puppeteer/1766/482797370
        await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/61.0.3163.100 Safari/537.36");
        page.setDefaultTimeout(60000);

        await page.goto("https://web.whatsapp.com");
        if (session && await isAuthenticated()) {
            return;
        }
        else {
            if (qrCodeData) {
                console.log('Getting QRCode data...');
                console.log('Note: You should use wbm.waitQRCode() inside wbm.start() to avoid errors.');
                return await getQRCodeData();
            } else {
                await generateQRCode();
            }
        }

    } catch (err) {
        deleteSession(tmpPath);
        throw err;
    }
}

/**
 * Check if needs to scan qr code or already is is inside the chat
 */
function isAuthenticated() {
    console.log('Authenticating...');
    return merge(needsToScan(page), isInsideChat(page))
        .pipe(take(1))
        .toPromise();
}

function needsToScan() {
    return from(
        page
            .waitForSelector(SELECTORS.QRCODE_PAGE, {
                timeout: 0,
            }).then(() => false)
    );
}

function isInsideChat() {
    return from(
        page
            .waitForFunction(SELECTORS.INSIDE_CHAT,
                {
                    timeout: 0,
                }).then(() => true)
    );
}

function deleteSession() {
    rimraf.sync(tmpPath);
}
/**
 * return the data used to create the QR Code
 */
async function getQRCodeData() {
    await page.waitForSelector(SELECTORS.QRCODE_DATA, { timeout: 60000 });
    const qrcodeData = await page.evaluate((SELECTORS) => {
        let qrcodeDiv = document.querySelector(SELECTORS.QRCODE_DATA);
        return qrcodeDiv.getAttribute(SELECTORS.QRCODE_DATA_ATTR);
    }, SELECTORS);
    // console.log(qrcodeData);
    return await qrcodeData;
    
}

/**
 * Access whatsapp web page, get QR Code data and generate it on terminal
 */
async function generateQRCode() {
    try {
        console.log("generating QRCode...");
        const qrcodeData = await getQRCodeData();
        qrcode.generate(qrcodeData, { small: true });
        console.log("QRCode generated! Scan it using Whatsapp App.");
    } catch (err) {
        throw await QRCodeExeption("QR Code can't be generated(maybe your connection is too slow).");
    }
    await waitQRCode();
}

/**
 * Wait 30s to the qrCode be hidden on page
 */
async function waitQRCode() {
    // if user scan QR Code it will be hidden
    try {
        await page.waitForSelector(SELECTORS.QRCODE_PAGE, { timeout: 30000, hidden: true });
    } catch (err) {
        throw await QRCodeExeption("Dont't be late to scan the QR Code.");
    }
}