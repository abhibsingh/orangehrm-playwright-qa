import { Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';
import { EmployeeData } from '../data/employeeFactory';

/** PIM > Add Employee */
export class AddEmployeePage extends BasePage {
  protected readonly path = '/web/index.php/pim/addEmployee';

  readonly firstNameInput: Locator;
  readonly middleNameInput: Locator;
  readonly lastNameInput: Locator;
  readonly employeeIdInput: Locator;
  readonly saveButton: Locator;

  constructor(page: Page) {
    super(page);
    this.firstNameInput = page.locator('input[name="firstName"]');
    this.middleNameInput = page.locator('input[name="middleName"]');
    this.lastNameInput = page.locator('input[name="lastName"]');
    this.employeeIdInput = this.inputByLabel('Employee Id');
    this.saveButton = page.getByRole('button', { name: 'Save' });
  }

  /** URL pattern of this page, used to assert we did NOT navigate away. */
  static readonly urlPattern = /\/pim\/addEmployee/;

  /**
   * Fills the form. The Employee Id field is pre populated with a suggested
   * id; fill() clears it first, so our unique id replaces the suggestion.
   */
  async fillEmployee(employee: EmployeeData): Promise<void> {
    await this.firstNameInput.fill(employee.firstName);
    await this.middleNameInput.fill(employee.middleName);
    await this.lastNameInput.fill(employee.lastName);
    await this.employeeIdInput.fill(employee.employeeId);
  }

  async save(): Promise<void> {
    await this.saveButton.click();
  }
}
