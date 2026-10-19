import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { TodoItem } from "@/components/TodoItem/TodoItem";
import styles from "@/components/TodoItem/TodoItem.module.css";
import { formatDate } from "@/lib/format-date";
import type { Todo } from "@/lib/todo-store";

const milk: Todo = {
  id: "milk",
  text: "Buy milk",
  date: "2026-10-20",
  done: false,
};

function renderItem(todo: Todo, onToggle = vi.fn()) {
  render(
    <ul>
      <TodoItem todo={todo} onToggle={onToggle} />
    </ul>,
  );
  return onToggle;
}

describe("TodoItem", () => {
  it("shows the text and the formatted date", () => {
    renderItem(milk);

    expect(screen.getByText("Buy milk")).toBeInTheDocument();
    // formatDate's own tests cover the format; here, check it's used.
    const date = screen.getByText(formatDate("2026-10-20"));
    expect(date.tagName).toBe("TIME");
    expect(date).toHaveAttribute("dateTime", "2026-10-20");
  });

  it("shows only the text when there is no date", () => {
    const { container } = render(
      <ul>
        <TodoItem todo={{ ...milk, date: null }} onToggle={vi.fn()} />
      </ul>,
    );
    expect(container.querySelector("time")).toBeNull();
  });

  it("has a checkbox named after the todo that reflects done", () => {
    renderItem(milk);
    const checkbox = screen.getByRole("checkbox", {
      name: "Mark Buy milk as done",
    });
    expect(checkbox).not.toBeChecked();
    expect(screen.getByText("Buy milk")).not.toHaveClass(styles.done);
  });

  it("strikes through a done todo", () => {
    renderItem({ ...milk, done: true });
    expect(
      screen.getByRole("checkbox", { name: "Mark Buy milk as done" }),
    ).toBeChecked();
    expect(screen.getByText("Buy milk")).toHaveClass(styles.done);
  });

  it("calls onToggle with the todo's id when clicked", () => {
    const onToggle = renderItem(milk);
    fireEvent.click(screen.getByRole("checkbox"));
    expect(onToggle).toHaveBeenCalledExactlyOnceWith("milk");
  });
});
