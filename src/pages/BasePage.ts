import { Locator, Page } from '@playwright/test';

/**
 * Shared helpers for every OrangeHRM page.
 *
 * OrangeHRM renders each form field as:
 *   <div class="oxd-input-group"> <label>Employee Id</label> ... <input> ... <span class="...error-message">
 * so fields are located by their visible label, which is far more stable
 * than positional or deep CSS selectors.
 */
export abstract class BasePage {
  protected constructor(protected readonly page: Page) {}

  /** Path relative to baseURL, e.g. "/web/index.php/pim/addEmployee". */
  protected abstract readonly path: string;

  async open(): Promise<void> {
    await this.page.goto(this.path);
  }

  /** The whole field group (label, input and validation message) for a label. */
  protected fieldGroup(label: string): Locator {
    return this.page
      .locator('.oxd-input-group')
      .filter({ has: this.page.locator('label', { hasText: new RegExp(`^\\s*${label}\\s*$`) }) });
  }

  /** The input inside a labelled field group. */
  protected inputByLabel(label: string): Locator {
    return this.fieldGroup(label).locator('input');
  }

  /** Inline validation message shown under a labelled field. */
  fieldError(label: string): Locator {
    return this.fieldGroup(label).locator('.oxd-input-field-error-message');
  }

  /** Toast notification containing the given text, e.g. "Successfully Saved". */
  toast(text: string): Locator {
    return this.page.locator('.oxd-toast').filter({ hasText: text });
  }
}
