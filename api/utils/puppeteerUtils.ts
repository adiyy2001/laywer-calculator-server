import puppeteer, { Browser, Page } from 'puppeteer';
import { WIBOR_URL } from '../config';

export interface Rates {
  date: string;
  wibor3m: string;
  wibor6m: string;
}

const protocolTimeout = 30000; // Ustal timeout protokołu na 300 sekund (5 minut)

export const fetchWiborRates = async (startDate: Date): Promise<Rates[]> => {
  let browser: Browser | null = null;
  try {
    console.log('Launching browser...', process.env.NODE_ENV);
    browser = await puppeteer.launch({
      args: [
        '--disable-setuid-sandbox',
        '--no-sandbox',
        '--single-process',
        '--no-zygote',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu'
      ],
      headless: true,
      timeout: protocolTimeout,
      defaultViewport: null
    });

    
    if (startDate.getDay() === 5) {
      startDate = getNextBusinessDay(startDate);
    }

    const endDate = new Date();
    const ratesList: Rates[] = [];
    const datesToFetch = getBusinessDates(startDate, endDate);

    const page = await browser.newPage();

    await page.goto(WIBOR_URL, { waitUntil: 'networkidle2', timeout: 30000 });

    for (const date of datesToFetch) {
      try {
        const rates = await getRatesForDate(page, date);
        if (rates && rates.wibor3m && rates.wibor6m) {
          ratesList.push(rates);
        }
      } catch (error) {
        console.error(`Error fetching rates for date ${date}:`, error);
      }
    }

    await page.close();
    return ratesList;
  } catch (error) {
    console.error('Error fetching WIBOR rates:', error);
    throw error;
  } finally {
    if (browser) {
      console.log('Closing browser...');
      await browser.close();
      console.log('Closed browser...');
    }
  }
};

const getNextBusinessDay = (date: Date): Date => {
  const nextDay = new Date(date);
  nextDay.setDate(date.getDate() + (date.getDay() === 5 ? 3 : 1));
  return nextDay;
};

const getRatesForDate = async (page: Page, date: string): Promise<Rates | null> => {
  try {
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

    console.log(`Waiting for results...`);
    await page.waitForSelector('.summaryTable', { timeout: 10000 });

    const rates = await page.evaluate((date: string): Rates | null => {
      const summaryTable = document.querySelector('.summaryTable');
      if (!summaryTable) {
        console.log(`No summary table found for date: ${date}`);
        return null;
      }

      const rows = summaryTable.querySelectorAll('tr');
      let wibor3m = '';
      let wibor6m = '';

      rows.forEach((row) => {
        const cells = row.querySelectorAll('td');
        if (cells.length > 1) {
          const label = cells[0].textContent?.trim() || '';
          let value = cells[1].textContent?.trim() || '';

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
  } catch (error: any) {
    if (error.message.includes('Timeout')) {
      console.warn(`Timeout error occurred but skipped for date: ${date}`);
      return null;
    }
    console.error(`Error fetching rates for date ${date}:`, error);
    return null;
  }
};

const getBusinessDates = (startDate: Date, endDate: Date): string[] => {
  const dates: string[] = [];
  const currentDate = new Date(startDate);

  while (currentDate <= endDate) {
    const day = currentDate.getDay();
    if (day !== 0 && day !== 6) { 
      dates.push(currentDate.toISOString().split('T')[0]);
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return dates;
};
