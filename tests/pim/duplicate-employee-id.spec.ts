import { test, expect } from '../../src/fixtures/test';
import { buildEmployee } from '../../src/data/employeeFactory';
import { AddEmployeePage } from '../../src/pages/AddEmployeePage';

/**
 * TC-PIM-05: Duplicate Employee Id is rejected.
 * See docs/TEST_DESIGN.md section 4.2.
 *
 * Why: a unique employee identifier is the key business rule protecting HR
 * and payroll master data. Duplicates lead to wrong payments and broken
 * reporting. The precondition is seeded through the API; the behaviour is
 * verified through the UI.
 */
test.describe('PIM: Add Employee validation', () => {
  test(
    'TC-PIM-05 duplicate Employee Id is rejected',
    { tag: ['@regression', '@P1'] },
    async ({ page, addEmployeePage, employeeListPage, employeeApi, trackEmployee }) => {
      const existing = buildEmployee();
      // Same Employee Id as the existing record, but a different person.
      const duplicate = buildEmployee({ employeeId: existing.employeeId });

      await test.step('Precondition: seed an employee with Id X through the API', async () => {
        const empNumber = await employeeApi.create(existing);
        trackEmployee(empNumber);
      });

      await test.step('1. Open Add Employee', async () => {
        await addEmployeePage.open();
        await expect(page).toHaveURL(AddEmployeePage.urlPattern);
      });

      await test.step('2-3. Enter a new name and the existing Employee Id X', async () => {
        await addEmployeePage.fillEmployee(duplicate);
      });

      await test.step('4. Click Save: duplicate error shown, nothing saved', async () => {
        await addEmployeePage.save();

        await expect(addEmployeePage.fieldError('Employee Id')).toHaveText(
          'Employee Id already exists',
        );
        await expect(addEmployeePage.toast('Successfully Saved')).toBeHidden();
        await expect(page).toHaveURL(AddEmployeePage.urlPattern);
      });

      await test.step('5. Employee List: still exactly one record with Id X, the original', async () => {
        await employeeListPage.open();
        await employeeListPage.searchByEmployeeId(existing.employeeId);

        await expect(employeeListPage.recordCount).toHaveText('(1) Record Found');
        await expect(employeeListPage.resultRows).toHaveCount(1);

        const row = employeeListPage.rowFor(existing.employeeId);
        await expect(row).toContainText(existing.lastName);
        await expect(row).toContainText(existing.middleName);
        await expect(row).not.toContainText(duplicate.middleName);
      });
    },
  );
});
