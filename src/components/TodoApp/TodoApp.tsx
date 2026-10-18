"use client";

import { useSyncExternalStore } from "react";

import { TodoForm } from "@/components/TodoForm/TodoForm";
import { TodoItem } from "@/components/TodoItem/TodoItem";
import {
  addTodo,
  getServerSnapshot,
  getSnapshot,
  subscribe,
  toggleTodo,
} from "@/lib/todo-store";

import styles from "./TodoApp.module.css";

const handleAdd = (text: string, date: string | null) =>
  addTodo(text, date) !== null;

export function TodoApp() {
  // null until stored todos are read on the client, so the empty message never
  // flashes before saved todos appear.
  const todos = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  return (
    <section className={styles.app} aria-label="Todos">
      <TodoForm onAdd={handleAdd} />
      {todos !== null &&
        (todos.length === 0 ? (
          <p className={styles.empty}>No todos yet</p>
        ) : (
          <ul className={styles.list}>
            {todos.map((todo) => (
              <TodoItem key={todo.id} todo={todo} onToggle={toggleTodo} />
            ))}
          </ul>
        ))}
    </section>
  );
}
