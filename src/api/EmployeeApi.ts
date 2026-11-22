import { APIRequestContext, expect } from '@playwright/test';
import { EmployeeData } from '../data/employeeFactory';

const EMPLOYEES_ENDPOINT = '/web/index.php/api/v2/pim/employees';

/**
 * Thin client for OrangeHRM's own REST API.
 *
 * Used only for test setup and cleanup: creating a precondition through the
 * API takes well under a second, versus 10+ seconds of clicking through
 * screens that are not the subject of the test. Assertions about behaviour
 * are always made through the UI.
 *
 * The request context must carry an authenticated session (page.request
 * shares cookies with the logged in browser context).
 */
export class EmployeeApi {
  constructor(private readonly request: APIRequestContext) {}

  /** Creates an employee and returns its internal empNumber. */
  async create(employee: EmployeeData): Promise<number> {
    const response = await this.request.post(EMPLOYEES_ENDPOINT, {
      data: {
        firstName: employee.firstName,
        middleName: employee.middleName,
        lastName: employee.lastName,
        employeeId: employee.employeeId,
        empPicture: null,
      },
    });
    expect(response.ok(), `Create employee API failed: ${response.status()}`).toBeTruthy();
    const body = await response.json();
    return body.data.empNumber as number;
  }

  /** Deletes employees by empNumber. Safe to call with an empty list. */
  async delete(empNumbers: number[]): Promise<void> {
    if (empNumbers.length === 0) return;
    const response = await this.request.delete(EMPLOYEES_ENDPOINT, {
      data: { ids: empNumbers },
    });
    // Cleanup should never mask the real test result, so log instead of failing.
    if (!response.ok()) {
      console.warn(`Cleanup failed for employees ${empNumbers.join(', ')}: ${response.status()}`);
    }
  }
}
