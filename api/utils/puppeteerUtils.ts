import puppeteer, { Browser, Page } from 'puppeteer';
import { WIBOR_URL } from '../config';
import pLimit from 'p-limit';

export interface Rates {
  date: string;
  wibor3m: string;
  wibor6m: string;
}

export const fetchWiborRates = async (startDateString: string): Promise<Rates[]> => {
  let browser: Browser | null = null;
  try {
    console.log('Launching browser...');
    browser =  process.env.NODE_ENV  === "production" ? await puppeteer.launch({
      args: [
        '--disable-setuid-sandbox',
        '--no-sandbox',
        // '--single-process',
        // '--no-zygote',
        // '--disable-dev-shm-usage',
        // '--disable-accelerated-2d-canvas',
        '--disable-gpu'
      ],
      headless: true 
    }) : await puppeteer.launch({
      headless: true
    });

    const startDate = new Date(startDateString);
    const endDate = new Date();
    const ratesList: Rates[] = [];
    const datesToFetch = getBusinessDates(startDate, endDate);

    const limit = pLimit(10); // Ustal limit równoczesnych zapytań

    const ratePromises = datesToFetch.map((date) => limit(async () => {
      const page = await browser!.newPage();
      try {
        const rates = await getRatesForDate(page, date);
        if (rates) {
          ratesList.push(rates);
        }
      } catch (error) {
        console.error(`Error fetching rates for date ${date}:`, error);
      } finally {
        await page.close();
      }
    }));

    await Promise.all(ratePromises);

    return ratesList;
  } catch (error) {
    console.error('Error fetching WIBOR rates:', error);
    throw error;
  } finally {
    if (browser) {
      console.log('Closing browser...');
      await browser.close();
    }
  }
};

const getRatesForDate = async (page: Page, date: string): Promise<Rates | null> => {
  try {
    console.log(`Navigating to WIBOR page for date: ${date}...`);
    await page.goto(WIBOR_URL, { waitUntil: 'networkidle2', timeout: 60000 });

    console.log(`Setting date: ${date}...`);
    await page.evaluate((date: string) => {
      const dateInput: HTMLInputElement | null = document.querySelector('#rateDate');
      const submitButton: HTMLInputElement | null = document.querySelector('#rateDatePickerSubmit');

      if (dateInput && submitButton) {
        dateInput.value = date;
        submitButton.click();
      } else {
        console.error('Date input or submit button not found on the page');
      }
    }, date);

    console.log(`Waiting for navigation...`);
    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 60000 });

    console.log('Waiting for summary table...');
    await page.waitForSelector('.summaryTable', { timeout: 60000 });

    console.log('Extracting rates...');
    const rates = await page.evaluate((date: string): Rates | null => {
      const rows = document.querySelectorAll('.summaryTable tr');
      let wibor3m = '';
      let wibor6m = '';

      rows.forEach((row) => {
        const cells = row.querySelectorAll('td');
        if (cells.length > 1) {
          const label = cells[0].textContent?.trim() || '';
          let value = cells[1].textContent?.trim() || '';

          // Usunięcie zmian wartości
          value = value.split('\n')[0].trim();

          if (label.includes('WIBOR 3M')) {
            wibor3m = value;
          }
          if (label.includes('WIBOR 6M')) {
            wibor6m = value;
          }
        }
      });

      return wibor3m && wibor6m ? { date, wibor3m, wibor6m } : null;
    }, date);

    console.log(`Fetched rates for date: ${date} - 3M: ${rates?.wibor3m}, 6M: ${rates?.wibor6m}`);
    return rates;
  } catch (error) {
    console.error(`Error fetching rates for date ${date}:`, error);
    return null;
  }
};

const getBusinessDates = (startDate: Date, endDate: Date): string[] => {
  const dates: string[] = [];
  const currentDate = new Date(startDate);

  while (currentDate <= endDate) {
    const day = currentDate.getDay();
    if (day !== 0 && day !== 6) { // Pomijanie weekendów
      dates.push(currentDate.toISOString().split('T')[0]);
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return dates;
};
