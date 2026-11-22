# OrangeHRM Employee Lifecycle: Playwright + TypeScript

This is my submission for the Sparkrock Senior QA Engineer assessment. I designed and automated UI tests for **OrangeHRM Open Source**, an HR management system, using Playwright and TypeScript.

* **My test design:** [`docs/TEST_DESIGN.md`](docs/TEST_DESIGN.md) has the test case description, strategy, rationale and all 27 test cases I wrote.
* **What I automated:** TC-PIM-01 (add an employee and verify it persists) and TC-PIM-05 (a duplicate Employee Id is rejected).
* **Application under test:** https://opensource-demo.orangehrmlive.com (public demo, OrangeHRM OS 5.9)

## Why I chose OrangeHRM

I wanted an application close to the kind of software Sparkrock builds. OrangeHRM is an HR system, the same family as the HR and payroll side of an ERP. In that world the employee record is master data: payroll, leave and reporting all depend on it. So I focused my design on the rules that protect that data: mandatory fields, field limits and a unique Employee Id.

## Running the tests

```bash
npm ci
npx playwright install chromium
npx playwright test            # run everything (headless)
npm run test:headed            # watch it run in a browser
npm run test:smoke             # only @smoke tests
npm run report                 # open the HTML report
```

You need Node 18 or newer. No configuration is required: the demo URL and the credentials published on the demo login page are the defaults. To point the suite at another environment, copy `.env.example` to `.env`.

## How I structured the project

```
├── docs/TEST_DESIGN.md          Test design: cases, strategy, rationale
├── playwright.config.ts         Projects, timeouts, reporters, tracing
├── src/
│   ├── config/env.ts            Environment settings
│   ├── data/employeeFactory.ts  Unique test data per run
│   ├── api/EmployeeApi.ts       OrangeHRM REST API client (setup and cleanup only)
│   ├── fixtures/test.ts         Page object and API fixtures, automatic cleanup
│   └── pages/                   Page Object Model
│       ├── BasePage.ts          Label based field, error and toast helpers
│       ├── LoginPage.ts
│       ├── AddEmployeePage.ts
│       ├── EmployeeProfilePage.ts
│       └── EmployeeListPage.ts
├── tests/
│   ├── auth.setup.ts            Logs in once, saves the session
│   └── pim/
│       ├── add-employee.spec.ts           TC-PIM-01
│       └── duplicate-employee-id.spec.ts  TC-PIM-05
└── .github/workflows/playwright.yml       CI: typecheck, lint, test, report
```

## Design decisions I made

| Decision | Why I made it |
| :--- | :--- |
| Page Object Model with label based locators | A UI change becomes a one file fix, and my tests read like the written steps |
| Log in once in a setup project and reuse the session | The suite runs faster; login still has its own test cases in the design |
| API for preconditions and cleanup, UI for assertions | Setup takes under a second, but I still verify behaviour the way a user sees it |
| A `trackEmployee` fixture | Every record a test creates is deleted afterwards, even if the test fails |
| Unique data per run | Tests stay safe on a shared demo and with parallel workers |
| `test.step()` names that match my design document | The HTML report reads like the test case itself |
| Web first assertions, no fixed waits | Stable results on a slow shared demo |
| Traces, screenshots and video kept on failure | Any failure can be diagnosed quickly |
| Tags (`@smoke`, `@regression`, `@P1`) | Quick smoke runs on every commit, full regression nightly |

## A stability problem I found and fixed

When I ran the suite repeatedly, the employee search occasionally showed the full list instead of the filtered result. The Employee List page fires background loads when it opens, and on the busy shared demo a late unfiltered response could overwrite the filtered table.

I fixed it in the page object rather than weakening the tests. `EmployeeListPage` now waits for the page's network activity to settle before searching, waits for the filtered API response after clicking Search, and confirms every row on screen belongs to the searched Id before returning. I also limited local runs to 3 workers to keep load on the demo reasonable. The suite then passed five repeated runs in a row (`npx playwright test --repeat-each=5`).

## Notes on the shared demo

The public demo is used by many people at once and is reset from time to time. My tests never assert on global counts and only search for the data they created. If the demo itself is down or very slow, rerunning later is the fix.
