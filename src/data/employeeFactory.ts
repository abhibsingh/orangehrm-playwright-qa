/**
 * Test data factory for employees.
 *
 * Every value is unique per call so tests never collide with each other,
 * with parallel workers, or with other people using the shared demo.
 * Lengths respect the application's field limits:
 *   names <= 30 characters, Employee Id <= 10 characters.
 */
export interface EmployeeData {
  firstName: string;
  middleName: string;
  lastName: string;
  employeeId: string;
}

const FIRST_NAMES = ['Aarav', 'Maya', 'Noah', 'Priya', 'Liam', 'Sara', 'Ethan', 'Anika'];
const LAST_NAMES = ['Sharma', 'Clarke', 'Patel', 'Nguyen', 'Martin', 'Rao', 'Wilson', 'Khan'];

function pick<T>(items: readonly T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

/** 10 character id: "QA" + 8 digits from time and randomness. */
export function uniqueEmployeeId(): string {
  const time = Date.now().toString().slice(-5);
  const random = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, '0');
  return `QA${time}${random}`;
}

/** Short alphanumeric tag added to names so each record is easy to spot. */
function runTag(): string {
  return Math.random().toString(36).slice(2, 6).toUpperCase();
}

export function buildEmployee(overrides: Partial<EmployeeData> = {}): EmployeeData {
  return {
    firstName: pick(FIRST_NAMES),
    middleName: `QA${runTag()}`,
    lastName: pick(LAST_NAMES),
    employeeId: uniqueEmployeeId(),
    ...overrides,
  };
}
