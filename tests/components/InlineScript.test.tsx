import { render } from "@testing-library/react";
import { expect, it } from "vitest";

import { InlineScript } from "@/components/InlineScript/InlineScript";

// The server branch (text/javascript) can't run here: jsdom always has window.
it("renders an inert script with the given content on the client", () => {
  const { container } = render(<InlineScript html="window.ran = true" />);

  const script = container.querySelector("script")!;
  expect(script).toHaveAttribute("type", "text/plain");
  expect(script.innerHTML).toBe("window.ran = true");
  expect((window as { ran?: boolean }).ran).toBeUndefined();
});
