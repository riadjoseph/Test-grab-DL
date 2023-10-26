const puppeteer = require('puppeteer');
const fs = require('fs');
const Papa = require('papaparse');

(async () => {
  // Read URLs from urls.txt
  const urls = fs.readFileSync('urls.txt', 'utf-8').split('\n').filter(Boolean);

  // Initialize an array to store results
  const results = [];

  // Launch the browser
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  // Block images and CSS
  await page.setRequestInterception(true);
  page.on('request', (req) => {
    if (req.resourceType() === 'image' || req.resourceType() === 'stylesheet') {
      req.abort();
    } else {
      req.continue();
    }
  });

  // Loop through each URL
  for (const url of urls) {
    console.log(`Scraping: ${url}`);
    await page.goto(url, { waitUntil: 'domcontentloaded' });

    // Wait for Google Tag Manager to load
    await page.waitForFunction("typeof window.dataLayer !== 'undefined'", { timeout: 5000 });

    // Retrieve the dataLayer content
    const dataLayerContent = await page.evaluate(() => {
      return window.dataLayer || 'No dataLayer found';
    });

    if (dataLayerContent !== 'No dataLayer found') {
      results.push({ url, dataLayer: JSON.stringify(dataLayerContent) });
    } else {
      results.push({ url, dataLayer: 'No dataLayer found' });
    }
  }

  // Close the browser
  await browser.close();

  // Save results to CSV
  const csv = Papa.unparse(results);
  fs.writeFileSync('results.csv', csv);
  console.log('Results saved to results.csv');
})();
