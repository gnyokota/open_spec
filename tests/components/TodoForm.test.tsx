import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { TodoForm } from "@/components/TodoForm/TodoForm";

function renderForm(onAdd = vi.fn(() => true)) {
  render(<TodoForm onAdd={onAdd} />);
  const text = screen.getByLabelText("Todo");
  const date = screen.getByLabelText("Date");
  const form = text.closest("form")!;
  return { onAdd, text, date, form };
}

describe("TodoForm", () => {
  it("adds with the button, then clears the inputs and focuses the text", () => {
    const { onAdd, text, date } = renderForm();

    fireEvent.change(text, { target: { value: "Buy milk" } });
    fireEvent.change(date, { target: { value: "2026-10-20" } });
    fireEvent.click(screen.getByRole("button", { name: "Add" }));

    expect(onAdd).toHaveBeenCalledExactlyOnceWith("Buy milk", "2026-10-20");
    expect(text).toHaveValue("");
    expect(date).toHaveValue("");
    expect(text).toHaveFocus();
  });

  it("passes null when no date is selected", () => {
    const { onAdd, text, form } = renderForm();

    fireEvent.change(text, { target: { value: "Call mom" } });
    fireEvent.submit(form);

    expect(onAdd).toHaveBeenCalledExactlyOnceWith("Call mom", null);
  });

  it("submits while the date input has focus", () => {
    const { onAdd, text, date, form } = renderForm();

    fireEvent.change(text, { target: { value: "Pay rent" } });
    fireEvent.change(date, { target: { value: "2026-11-01" } });
    date.focus();
    fireEvent.submit(form);

    expect(onAdd).toHaveBeenCalledExactlyOnceWith("Pay rent", "2026-11-01");
  });

  it("rejects whitespace-only text and keeps the inputs", () => {
    const { onAdd, text, date, form } = renderForm();

    fireEvent.change(text, { target: { value: "   " } });
    fireEvent.change(date, { target: { value: "2026-10-20" } });
    fireEvent.submit(form);

    expect(onAdd).not.toHaveBeenCalled();
    expect(text).toHaveValue("   ");
    expect(date).toHaveValue("2026-10-20");
    expect(text).toHaveAttribute("aria-invalid", "true");
    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent("Enter a todo");
    expect(text).toHaveAccessibleDescription("Enter a todo");
    expect(text).toHaveFocus();
  });

  it("clears the error when the user types", () => {
    const { text, form } = renderForm();

    fireEvent.submit(form);
    expect(screen.getByRole("alert")).toBeInTheDocument();

    fireEvent.change(text, { target: { value: "B" } });
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(text).toHaveAttribute("aria-invalid", "false");
    expect(text).not.toHaveAttribute("aria-describedby");
  });

  it("shows the error when onAdd rejects the todo", () => {
    const { text, form } = renderForm(vi.fn(() => false));

    fireEvent.change(text, { target: { value: "Buy milk" } });
    fireEvent.submit(form);

    expect(screen.getByRole("alert")).toHaveTextContent("Enter a todo");
    expect(text).toHaveValue("Buy milk");
  });
});
