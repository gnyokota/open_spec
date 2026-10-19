import { render, screen } from "@testing-library/react";
import { expect, test } from "vitest";

import Home from "@/app/page";

test("renders the heading, the todo form, and the theme toggle", () => {
  render(<Home />);

  expect(
    screen.getByRole("heading", { level: 1, name: "Todo" }),
  ).toBeInTheDocument();
  expect(screen.getByLabelText("Todo")).toBeInTheDocument();
  expect(screen.getByLabelText("Date")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Add" })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /theme/i })).toBeInTheDocument();
});
