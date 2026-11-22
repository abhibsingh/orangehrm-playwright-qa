import { Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';

/** PIM > Employee > Personal Details (shown right after a successful save). */
export class EmployeeProfilePage extends BasePage {
  protected readonly path = '/web/index.php/pim/viewPersonalDetails';

  static readonly urlPattern = /\/pim\/viewPersonalDetails\/empNumber\/(\d+)/;

  readonly employeeNameHeader: Locator;
  readonly firstNameInput: Locator;
  readonly middleNameInput: Locator;
  readonly lastNameInput: Locator;
  readonly employeeIdInput: Locator;

  constructor(page: Page) {
    super(page);
    this.employeeNameHeader = page.locator('.orangehrm-edit-employee-name h6');
    this.firstNameInput = page.locator('input[name="firstName"]');
    this.middleNameInput = page.locator('input[name="middleName"]');
    this.lastNameInput = page.locator('input[name="lastName"]');
    this.employeeIdInput = this.inputByLabel('Employee Id');
  }

  /** Reads the internal empNumber from the current URL (used for cleanup). */
  empNumberFromUrl(): number {
    const match = this.page.url().match(EmployeeProfilePage.urlPattern);
    if (!match) {
      throw new Error(`Not on an employee profile page: ${this.page.url()}`);
    }
    return Number(match[1]);
  }
}
