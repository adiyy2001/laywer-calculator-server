import puppeteer, { Browser, Page } from 'puppeteer-core';
import chromium from 'chrome-aws-lambda';
import { WIBOR_URL } from '../config';

export interface Rates {
  date: string;
  wibor3m: string;
  wibor6m: string;
}

export const fetchWiborRates = async (startDateString: string): Promise<Rates[]> => {
  let browser: Browser | null = null;
  try {
    browser = await puppeteer.launch({
      args: chromium.args,
      executablePath: await chromium.executablePath,
      headless: chromium.headless,
    });
    const page: Page = await browser.newPage();
    await page.goto(WIBOR_URL, { waitUntil: 'networkidle2' });

    const startDate: Date = new Date(startDateString);
    const endDate: Date = new Date();
    const ratesList: Rates[] = [];

    const datesToFetch: string[] = getBusinessDates(startDate, endDate);

    const ratePromises: Promise<Rates | null>[] = datesToFetch.map((date) => getRatesForDate(page, date));
    const ratesResults: (Rates | null)[] = await Promise.all(ratePromises);

    ratesResults.forEach((rates) => {
      if (rates) {
        ratesList.push(rates);
      }
    });

    return ratesList;
  } catch (error) {
    console.error('Error fetching WIBOR rates:', error);
    throw error;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
};

const getRatesForDate = async (page: Page, date: string): Promise<Rates | null> => {
  console.log(`Fetching rates for date: ${date}`);

  try {
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

    await page.waitForNavigation({ waitUntil: 'networkidle2' });
    
    await page.waitForSelector('.summaryTable', { timeout: 10000 });

    const rates: Rates | null = await page.evaluate((date: string): Rates | null => {
      const rows: NodeListOf<HTMLTableRowElement> = document.querySelectorAll('.summaryTable tr');
      let wibor3m = '';
      let wibor6m = '';

      rows.forEach((row: HTMLTableRowElement) => {
        const cells: NodeListOf<HTMLTableCellElement> = row.querySelectorAll('td');
        if (cells.length > 1) {
          const label: string = cells[0].textContent?.trim() || '';
          const value: string = cells[1].textContent?.trim() || '';
          const cleanedValue: string = value.split('\n')[0].trim();
          if (label === 'WIBOR 3M') {
            wibor3m = cleanedValue;
          }
          if (label === 'WIBOR 6M') {
            wibor6m = cleanedValue;
          }
        }
      });

      return wibor3m && wibor6m ? { date, wibor3m, wibor6m } : null;
    }, date);

    console.log(`Fetched rates for date: ${date} - 3M: ${rates?.wibor3m}, 6M: ${rates?.wibor6m}`);
    return rates;
  } catch (error) {
    console.error(`Error fetching rates for date: ${date}`, error);
    return null;
  }
};

const getBusinessDates = (startDate: Date, endDate: Date): string[] => {
  const dates: string[] = [];
  const currentDate: Date = new Date(startDate);

  while (currentDate <= endDate) {
    const day: number = currentDate.getDay();
    if (day !== 0 && day !== 6) {
      dates.push(currentDate.toISOString().split('T')[0]);
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return dates;
};
