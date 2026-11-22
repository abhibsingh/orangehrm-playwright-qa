import { test as base } from '@playwright/test';
import { AddEmployeePage } from '../pages/AddEmployeePage';
import { EmployeeListPage } from '../pages/EmployeeListPage';
import { EmployeeProfilePage } from '../pages/EmployeeProfilePage';
import { EmployeeApi } from '../api/EmployeeApi';

/**
 * Custom fixtures.
 *
 * Tests ask for what they need (page objects, the API client) and receive
 * ready to use instances. trackEmployee records every employee a test creates;
 * after the test finishes, pass or fail, those employees are deleted so the
 * shared demo is left clean.
 */
type Fixtures = {
  addEmployeePage: AddEmployeePage;
  employeeListPage: EmployeeListPage;
  employeeProfilePage: EmployeeProfilePage;
  employeeApi: EmployeeApi;
  trackEmployee: (empNumber: number) => void;
};

export const test = base.extend<Fixtures>({
  addEmployeePage: async ({ page }, use) => {
    await use(new AddEmployeePage(page));
  },

  employeeListPage: async ({ page }, use) => {
    await use(new EmployeeListPage(page));
  },

  employeeProfilePage: async ({ page }, use) => {
    await use(new EmployeeProfilePage(page));
  },

  // page.request shares the logged in session cookies with the browser.
  employeeApi: async ({ page }, use) => {
    await use(new EmployeeApi(page.request));
  },

  trackEmployee: async ({ employeeApi }, use) => {
    const created: number[] = [];
    await use((empNumber: number) => {
      created.push(empNumber);
    });
    // Teardown: runs after the test body, even when the test failed.
    await employeeApi.delete(created);
  },
});

export { expect } from '@playwright/test';
