import { expect, Locator, Page, Response } from '@playwright/test';
import { BasePage } from './BasePage';

const EMPLOYEES_API = '/api/v2/pim/employees';

/** PIM > Employee List */
export class EmployeeListPage extends BasePage {
  protected readonly path = '/web/index.php/pim/viewEmployeeList';

  readonly employeeIdFilter: Locator;
  readonly searchButton: Locator;
  readonly resultRows: Locator;
  readonly recordCount: Locator;

  constructor(page: Page) {
    super(page);
    this.employeeIdFilter = this.inputByLabel('Employee Id');
    this.searchButton = page.getByRole('button', { name: 'Search' });
    this.resultRows = page.locator('.oxd-table-body .oxd-table-card');
    // Text such as "(1) Record Found" or "No Records Found"
    this.recordCount = page.locator('.orangehrm-horizontal-padding .oxd-text--span');
  }

  /** True for a GET to the employee list API, optionally containing some text. */
  private isEmployeeListResponse(response: Response, contains?: string): boolean {
    const url = response.url();
    return (
      response.request().method() === 'GET' &&
      url.includes(EMPLOYEES_API) &&
      (contains === undefined || url.includes(encodeURIComponent(contains)))
    );
  }

  /**
   * Opens the list and waits for its initial (unfiltered) load to finish.
   * Without this wait, a search can be sent before the initial load returns,
   * and the late unfiltered response overwrites the filtered results.
   */
  override async open(): Promise<void> {
    await Promise.all([
      this.page.waitForResponse((r) => this.isEmployeeListResponse(r)),
      super.open(),
    ]);
    // The page can fire more than one initial load; let them all settle.
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Searches by Employee Id and makes sure the table really shows filtered
   * results before returning.
   *
   * On the shared demo the page can fire more than one background load when
   * it opens; under load, a late unfiltered response can still overwrite the
   * filtered table. So after each search we check that every row on screen
   * belongs to the searched Id (or that no rows are shown). If not, we search
   * again. The assertions in the test stay unchanged and strict.
   */
  async searchByEmployeeId(employeeId: string): Promise<void> {
    await this.employeeIdFilter.fill(employeeId);

    await expect(async () => {
      await Promise.all([
        this.page.waitForResponse((r) => this.isEmployeeListResponse(r, employeeId)),
        this.searchButton.click(),
      ]);
      const shownRows = await this.resultRows.count();
      const matchingRows = await this.rowFor(employeeId).count();
      expect(shownRows, 'table should only contain the searched Employee Id').toBe(matchingRows);
    }).toPass({ timeout: 30_000, intervals: [1_000, 2_000, 3_000] });
  }

  /** The result row for an Employee Id (matches the exact Id cell text). */
  rowFor(employeeId: string): Locator {
    return this.resultRows.filter({
      has: this.page.locator('.oxd-table-cell', { hasText: new RegExp(`^${employeeId}$`) }),
    });
  }
}
