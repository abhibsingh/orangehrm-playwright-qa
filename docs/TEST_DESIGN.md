# Test Design: OrangeHRM Employee Lifecycle

**Author:** Abhishek Singh, Senior QA Automation Engineer
**Application under test:** OrangeHRM Open Source 5.9 public demo, https://opensource-demo.orangehrmlive.com
**Automation stack:** Playwright Test with TypeScript, Page Object Model, API assisted test data
**Repository:** this repo. Automated cases live in `tests/`, page objects in `src/pages/`.

---

## 1. Why this application

OrangeHRM is an open source HR management system: employee master data, leave, time, recruitment and role based administration. That makes it a realistic stand in for the HR and payroll side of an ERP. In an ERP, the employee record is a **master data record**. Payroll runs, leave balances, approvals, timesheets and reports all hang off it. If an employee is saved with the wrong identifier, duplicated, or silently dropped, every downstream process inherits the error.

So rather than spreading thin across every menu, this design goes deep on the **employee lifecycle** (create, find, update, remove) and the rules that protect master data integrity. It then covers authentication, leave and access control at a lighter, risk weighted level.

---

## 2. Test Case Description: features in scope

| Area | Features under test | Business use case |
| :--- | :--- | :--- |
| **Authentication** | Login, invalid credentials, required fields, logout, protected URL access without a session | Only authorised staff reach HR data |
| **PIM: Add Employee** | Create employee with first, middle, last name and Employee Id; required field validation; field length limits; unique Employee Id rule | HR onboards a new hire |
| **PIM: Employee List** | Search by Employee Id and by name; result counts; no records state | HR or a manager finds an employee record |
| **PIM: Edit and Delete** | Update personal details; delete with confirmation; deleted record no longer searchable | Corrections and offboarding |
| **Leave** | Apply for leave, balance check, approve or reject as admin | Employee self service and manager approval |
| **Admin: Users and roles** | Create ESS user linked to employee; ESS user cannot reach Admin module | Segregation of duties |

**Out of scope for this exercise:** recruitment, performance, buzz, theming and branding, file uploads beyond basic checks, localisation, and load testing. Section 5 explains why.

---

## 3. Test Strategy

### 3.1 Approach

1. **Risk based prioritisation.** Every case is scored on business impact and likelihood of failure, giving P1 (must pass for release), P2 (core regression) and P3 (extended regression).
2. **Layered testing.** The UI is used for what a user actually does and sees. The application's own REST API (`/web/index.php/api/v2/...`) is used for setup and cleanup, which is faster and less flaky than clicking through screens that are not under test.
3. **Positive, negative and edge cases for every feature.** Happy paths prove the feature works; negative and boundary cases prove the business rules hold.
4. **Independent, isolated tests.** Each test creates its own data with a unique run identifier and removes it afterwards. No test depends on another test or on data someone else created.
5. **Verify outcomes, not just actions.** A save is not proven by a green toast. Tests confirm the record persisted by reading it back from a different screen (profile page and employee list search).

### 3.2 Constraints of the target environment and how the design handles them

The public demo is **shared and periodically reset**. Other people create, edit and delete data at the same time.

| Constraint | Mitigation |
| :--- | :--- |
| Other users change data concurrently | Never assert on global counts. Search only for data this run created, using unique Employee Ids. |
| Demo can be slow | Rely on Playwright web first assertions with auto waiting; no fixed sleeps. Generous but bounded timeouts in config. |
| Data is reset without notice | Tests seed their own preconditions through the API instead of relying on existing records. |
| Leftover data pollutes the shared demo | Fixture tracks every employee a test creates and deletes it in teardown, even when the test fails. |

### 3.3 Tooling and framework design

| Choice | Rationale |
| :--- | :--- |
| **Playwright Test + TypeScript** | Auto waiting removes most timing flakiness; built in tracing, screenshots and video on failure; typed page objects catch mistakes at compile time; parallel workers out of the box. |
| **Page Object Model** | Locators and page actions live in one place, so a UI change is a one file fix. Tests read like the written test steps. |
| **Custom fixtures** | Page objects and an `employeeApi` client are injected into tests. A `trackEmployee` fixture guarantees cleanup. |
| **Authenticated storage state** | Login runs once in a setup project and the session is reused, so the suite does not spend time logging in for every test. Login itself is still tested separately. |
| **Accessible and label based locators** | Locators target labels, roles and stable names (`name="firstName"`, the "Employee Id" label) rather than brittle CSS chains or positions. |
| **Test data factory** | Generates unique, valid employee data per run, with values sized to the field limits. |
| **Tags (`@smoke`, `@regression`, `@P1`)** | Lets CI run a quick smoke subset on every commit and the full regression nightly. |
| **GitHub Actions** | Runs the suite on push and pull request and publishes the HTML report as an artifact. |

**Innovation and efficiency.** The two biggest efficiency gains are API assisted setup (a precondition that would take 10 to 15 seconds of clicking takes under one second) and session reuse. I also use AI assisted tooling in Cursor and GitHub Copilot to speed up scaffolding and locator review, while I write and review the test design and assertions myself.

### 3.4 Entry and exit criteria

* **Entry:** demo reachable, login with the published demo credentials succeeds.
* **Exit for this exercise:** all P1 cases designed; automated cases pass three consecutive runs locally with no retries.

---

## 4. Test Cases

Legend: **Type** P = positive, N = negative, E = edge or boundary. **Auto** marks the cases automated in this repository and demonstrated in the video.

### 4.1 Authentication

| ID | Title | Pri | Type | Preconditions | Steps | Expected result |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| TC-AUTH-01 | Login with valid admin credentials | P1 | P | User is logged out | 1. Open login page 2. Enter valid username and password 3. Click Login | Dashboard opens; header shows "Dashboard"; user dropdown visible |
| TC-AUTH-02 | Login with wrong password | P1 | N | Logged out | 1. Enter valid username and wrong password 2. Click Login | "Invalid credentials" alert shown; user stays on login page |
| TC-AUTH-03 | Login with empty fields | P2 | N | Logged out | 1. Leave both fields empty 2. Click Login | "Required" shown under both fields; no request succeeds |
| TC-AUTH-04 | Access protected page without session | P1 | N | Logged out | 1. Open `/pim/viewEmployeeList` directly | Redirected to login page |
| TC-AUTH-05 | Logout ends the session | P2 | P | Logged in | 1. Open user dropdown 2. Click Logout 3. Press browser Back | Login page shown; Back does not restore the protected page |

### 4.2 PIM: Add Employee

| ID | Title | Pri | Type | Preconditions | Steps | Expected result |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **TC-PIM-01** | **Add employee with valid details and verify it persists** (**Auto**) | P1 | P | Logged in as Admin; unique Employee Id generated for this run | 1. Go to PIM > Add Employee 2. Enter First, Middle and Last Name 3. Replace the suggested Employee Id with the unique Id 4. Click Save 5. On the profile page check name and Employee Id 6. Go to Employee List, search by the Employee Id | Step 4: "Successfully Saved" toast; redirected to Personal Details. Step 5: header shows "First Last"; First, Middle, Last Name and Employee Id fields hold the entered values. Step 6: exactly one record found, showing the same Id, first and middle name, and last name |
| TC-PIM-02 | Required field validation | P1 | N | Logged in | 1. Open Add Employee 2. Leave First Name and Last Name empty 3. Click Save | "Required" under First Name and Last Name; no save; URL remains Add Employee |
| TC-PIM-03 | Add employee with only mandatory fields | P2 | P | Logged in | 1. Enter First and Last Name only 2. Keep suggested Id 3. Save | Saved; Middle Name empty on profile |
| TC-PIM-04 | Name field maximum length (30) | P2 | E | Logged in | 1. Enter 30 characters in First Name 2. Enter 31 characters in Last Name 3. Save | 30 accepted; "Should not exceed 30 characters" under Last Name; no save |
| **TC-PIM-05** | **Duplicate Employee Id is rejected** (**Auto**) | P1 | N | Logged in; an employee with Id X exists (seeded through API) | 1. Open Add Employee 2. Enter a new First and Last Name 3. Enter existing Id X 4. Click Save 5. Go to Employee List and search by Id X | Step 4: "Employee Id already exists" shown under Employee Id; no success toast; user stays on Add Employee. Step 5: exactly one record with Id X, still belonging to the original employee |
| TC-PIM-06 | Employee Id maximum length (10) | P3 | E | Logged in | 1. Enter an 11 character Employee Id 2. Save | "Should not exceed 10 characters"; no save |
| TC-PIM-07 | Names with apostrophes, hyphens and accents | P2 | E | Logged in | 1. Enter First "Zoë", Last "O'Brien" 2. Save 3. Search by name | Saved and displayed exactly as entered; searchable |
| TC-PIM-08 | Whitespace only name | P3 | N | Logged in | 1. Enter spaces in First and Last Name 2. Save | Treated as empty; "Required" shown; no save |

### 4.3 PIM: Employee List, Edit, Delete

| ID | Title | Pri | Type | Preconditions | Steps | Expected result |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| TC-PIM-09 | Search by Employee Id | P1 | P | Employee seeded | 1. Enter Id in Employee Id filter 2. Search | One matching row with correct Id and name |
| TC-PIM-10 | Search by partial name with autocomplete | P2 | P | Employee seeded | 1. Type first 3 letters of seeded name 2. Pick suggestion 3. Search | Row for seeded employee shown |
| TC-PIM-11 | Search with no match | P2 | N | Logged in | 1. Enter an Id that does not exist 2. Search | "No Records Found" |
| TC-PIM-12 | Reset clears filters | P3 | P | Filters applied | 1. Click Reset | All filters cleared; unfiltered list shown |
| TC-PIM-13 | Edit employee name | P1 | P | Employee seeded | 1. Open profile 2. Change Last Name 3. Save 4. Search in list | "Successfully Updated"; list shows new name |
| TC-PIM-14 | Delete employee with confirmation | P1 | P | Employee seeded | 1. Search by Id 2. Click delete 3. Confirm "Yes, Delete" 4. Search again | "Successfully Deleted"; second search returns No Records Found |
| TC-PIM-15 | Cancel delete keeps record | P2 | N | Employee seeded | 1. Click delete 2. Click "No, Cancel" | Record still listed |

### 4.4 Leave

| ID | Title | Pri | Type | Preconditions | Steps | Expected result |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| TC-LV-01 | Assign leave to employee within entitlement | P1 | P | Employee with leave entitlement | 1. Leave > Assign Leave 2. Pick employee, type, dates within balance 3. Assign | "Successfully Saved"; leave listed as Scheduled; balance reduced |
| TC-LV-02 | Assign leave exceeding balance | P1 | N | Entitlement lower than requested days | 1. Request more days than balance 2. Assign | Insufficient balance warning; no deduction without confirmation |
| TC-LV-03 | End date before start date | P2 | E | Logged in | 1. Set To Date earlier than From Date | "To date should be after from date"; cannot submit |
| TC-LV-04 | Approve pending leave request | P1 | P | Pending request exists | 1. Leave List > Approve | Status changes to Scheduled |

### 4.5 Admin: users and roles

| ID | Title | Pri | Type | Preconditions | Steps | Expected result |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| TC-ADM-01 | Create ESS user linked to employee | P2 | P | Employee seeded | 1. Admin > User Management > Add 2. Role ESS, link employee, set username and password 3. Save | User listed with role ESS |
| TC-ADM-02 | ESS user cannot reach Admin module | P1 | N | ESS user exists | 1. Log in as ESS user 2. Open `/admin/viewSystemUsers` directly | Admin menu absent; direct URL shows access denied or redirects |
| TC-ADM-03 | Duplicate username rejected | P2 | N | User exists | 1. Create user with same username | "Already exists"; no save |

---

## 5. Rationale

### 5.1 Why the employee lifecycle gets the most depth

* **Highest business impact.** The employee record is the root of HR and payroll. Every other module (leave, time, payroll, reporting) references it. A defect here multiplies downstream, so it carries the most P1 cases.
* **Most business rules.** Mandatory names, length limits and the **unique Employee Id** are exactly the rules that protect data integrity in an ERP. They are where defects hide and where regressions hurt most.
* **Highest frequency.** Onboarding, searching and updating employees are the most common HR actions, so failures here are seen by the most users.

### 5.2 Why these two cases were automated first

| Case | Why it was chosen |
| :--- | :--- |
| **TC-PIM-01 Add employee and verify it persists** | The core happy path and the best smoke test for the whole PIM module. It crosses three screens (Add, Profile, List), so one test proves create, read back and search all work together. It is P1, stable and runs on every build. |
| **TC-PIM-05 Duplicate Employee Id is rejected** | The most important negative rule for master data. Duplicate identifiers in HR or payroll lead to wrong payments and broken reporting. It also shows the API seeding pattern: the precondition is created in under a second, and the test still verifies through the UI that no second record was created. |

Together they cover one positive and one negative path, a cross screen verification, API assisted setup and guaranteed cleanup. Those are the patterns the rest of the regression pack would reuse.

### 5.3 Why some areas were deprioritised

* **Leave and Admin** are designed at P1 and P2 but not automated here. They depend on entitlements and extra users that are less stable on a shared, frequently reset demo. In a real project they would follow next, using the same API seeding approach.
* **Recruitment, performance and buzz** are lower risk for an ERP HR core and are left for extended regression.
* **Performance and security testing** need a controlled environment. Load testing a shared public demo would be inaccurate and inconsiderate to other users.

### 5.4 Traceability

| Business requirement | Cases |
| :--- | :--- |
| Only authorised users access HR data | TC-AUTH-01 to 05, TC-ADM-02 |
| Every employee has complete mandatory data | TC-PIM-01 to 04, TC-PIM-08 |
| Employee identifiers are unique | TC-PIM-05, TC-PIM-06 |
| Records can be found, corrected and removed | TC-PIM-09 to 15 |
| Leave respects entitlement rules | TC-LV-01 to 04 |
| Duties are segregated by role | TC-ADM-01 to 03 |

---

## 6. Automation mapping

| Test case | Spec file | Tags |
| :--- | :--- | :--- |
| TC-PIM-01 | `tests/pim/add-employee.spec.ts` | `@smoke @regression @P1` |
| TC-PIM-05 | `tests/pim/duplicate-employee-id.spec.ts` | `@regression @P1` |

Each test step in code is wrapped in `test.step()` with the same wording as the steps above, so the HTML report reads like this document.
