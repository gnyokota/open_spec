import { fireEvent, render, screen, within } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { TodoApp } from "@/components/TodoApp/TodoApp";
import { TODOS_STORAGE_KEY } from "@/lib/todo-store";

function add(text: string) {
  fireEvent.change(screen.getByLabelText("Todo"), { target: { value: text } });
  fireEvent.click(screen.getByRole("button", { name: "Add" }));
}

const listedTexts = () =>
  within(screen.getByRole("list"))
    .getAllByRole("listitem")
    .map((item) => item.textContent);

describe("TodoApp", () => {
  it("shows the empty message when there are no todos", () => {
    render(<TodoApp />);
    expect(screen.getByText("No todos yet")).toBeInTheDocument();
    expect(screen.queryByRole("list")).not.toBeInTheDocument();
  });

  it("lists added todos in order", () => {
    render(<TodoApp />);
    add("First");
    add("Second");

    expect(listedTexts()).toEqual(["First", "Second"]);
    expect(screen.queryByText("No todos yet")).not.toBeInTheDocument();
  });

  it("checks a todo and saves it", () => {
    render(<TodoApp />);
    add("Buy milk");

    const checkbox = screen.getByRole("checkbox", {
      name: "Mark Buy milk as done",
    });
    fireEvent.click(checkbox);

    expect(checkbox).toBeChecked();
    const saved = JSON.parse(localStorage.getItem(TODOS_STORAGE_KEY)!);
    expect(saved.todos[0]).toMatchObject({ text: "Buy milk", done: true });
  });

  it("shows stored todos straight away, with their checked state", () => {
    localStorage.setItem(
      TODOS_STORAGE_KEY,
      JSON.stringify({
        version: 1,
        todos: [
          { id: "a", text: "Buy milk", date: null, done: true },
          { id: "b", text: "Call mom", date: null, done: false },
        ],
      }),
    );
    render(<TodoApp />);

    expect(listedTexts()).toEqual(["Buy milk", "Call mom"]);
    expect(
      screen.getByRole("checkbox", { name: "Mark Buy milk as done" }),
    ).toBeChecked();
    expect(
      screen.getByRole("checkbox", { name: "Mark Call mom as done" }),
    ).not.toBeChecked();
  });

  it("recovers from corrupted storage", () => {
    localStorage.setItem(TODOS_STORAGE_KEY, "{not json");
    render(<TodoApp />);

    expect(screen.getByText("No todos yet")).toBeInTheDocument();
    add("Buy milk");
    expect(listedTexts()).toEqual(["Buy milk"]);
  });

  it("doesn't add a blank todo", () => {
    render(<TodoApp />);
    add("   ");

    expect(screen.getByText("No todos yet")).toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent("Enter a todo");
  });

  it("doesn't render the empty message on the server", () => {
    const html = renderToString(<TodoApp />);

    expect(html).toContain("Add");
    expect(html).not.toContain("No todos yet");
  });
});
