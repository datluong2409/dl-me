/**
 * Matcher for getByText / getAllByText: the innermost element whose whole text is `expected`.
 * Typed text is split into one span per word, so the default matcher (own text nodes only) cannot find it.
 */
export const fullText = (expected: string) => (_content: string, element: Element | null) =>
  !!element &&
  element.textContent === expected &&
  ![...element.children].some((child) => child.textContent === expected)
