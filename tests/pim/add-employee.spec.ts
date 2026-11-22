import { test, expect } from '../../src/fixtures/test';
import { buildEmployee } from '../../src/data/employeeFactory';
import { AddEmployeePage } from '../../src/pages/AddEmployeePage';
import { EmployeeProfilePage } from '../../src/pages/EmployeeProfilePage';

/**
 * TC-PIM-01: Add employee with valid details and verify it persists.
 * See docs/TEST_DESIGN.md section 4.2.
 *
 * Why: the employee record is master data that payroll, leave and reporting
 * depend on. This test proves create, read back and search work together
 * across three screens.
 */
test.describe('PIM: Add Employee', () => {
  test(
    'TC-PIM-01 add employee with valid details and verify it persists',
    { tag: ['@smoke', '@regression', '@P1'] },
    async ({ page, addEmployeePage, employeeProfilePage, employeeListPage, trackEmployee }) => {
      // Precondition: unique data for this run, so the test is independent.
      const employee = buildEmployee();

      await test.step('1. Go to PIM > Add Employee', async () => {
        await addEmployeePage.open();
        await expect(page).toHaveURL(AddEmployeePage.urlPattern);
      });

      await test.step('2-3. Enter First, Middle, Last Name and the unique Employee Id', async () => {
        await addEmployeePage.fillEmployee(employee);
        await expect(addEmployeePage.employeeIdInput).toHaveValue(employee.employeeId);
      });

      await test.step('4. Click Save: success toast and redirect to Personal Details', async () => {
        await addEmployeePage.save();
        await expect(addEmployeePage.toast('Successfully Saved')).toBeVisible();
        await expect(page).toHaveURL(EmployeeProfilePage.urlPattern);

        // Register for cleanup as soon as the record exists.
        trackEmployee(employeeProfilePage.empNumberFromUrl());
      });

      await test.step('5. Profile shows the entered name and Employee Id', async () => {
        await expect(employeeProfilePage.employeeNameHeader).toHaveText(
          `${employee.firstName} ${employee.lastName}`,
        );
        await expect(employeeProfilePage.firstNameInput).toHaveValue(employee.firstName);
        await expect(employeeProfilePage.middleNameInput).toHaveValue(employee.middleName);
        await expect(employeeProfilePage.lastNameInput).toHaveValue(employee.lastName);
        await expect(employeeProfilePage.employeeIdInput).toHaveValue(employee.employeeId);
      });

      await test.step('6. Employee List search by Id returns exactly this employee', async () => {
        await employeeListPage.open();
        await employeeListPage.searchByEmployeeId(employee.employeeId);

        await expect(employeeListPage.recordCount).toHaveText('(1) Record Found');
        await expect(employeeListPage.resultRows).toHaveCount(1);

        const row = employeeListPage.rowFor(employee.employeeId);
        await expect(row).toContainText(`${employee.firstName} ${employee.middleName}`);
        await expect(row).toContainText(employee.lastName);
      });
    },
  );
});
