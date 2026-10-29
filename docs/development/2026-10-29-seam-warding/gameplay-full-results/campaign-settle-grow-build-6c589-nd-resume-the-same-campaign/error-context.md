# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: campaign.spec.ts >> settle, grow, build, recruit, explore and resume the same campaign
- Location: tests/gameplay/campaign.spec.ts:21:1

# Error details

```
Error: locator.click: Target page, context or browser has been closed
Call log:
  - waiting for getByText('Campaign & settings', { exact: true })
    - locator resolved to <summary>Campaign & settings</summary>
  - attempting click action
    - waiting for element to be visible, enabled and stable
    - element is visible, enabled and stable
    - scrolling into view if needed

```

```
Error: write EPIPE
```

```
Error: browserContext.close: Target page, context or browser has been closed
```