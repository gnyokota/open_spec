"use client";

import { formatDate } from "@/lib/format-date";
import type { Todo } from "@/lib/todo-store";

import styles from "./TodoItem.module.css";

type Props = {
  todo: Todo;
  onToggle: (id: string) => void;
};

export function TodoItem({ todo, onToggle }: Props) {
  return (
    <li className={styles.item}>
      <label className={styles.label}>
        <input
          className={styles.checkbox}
          type="checkbox"
          checked={todo.done}
          onChange={() => onToggle(todo.id)}
          aria-label={`Mark ${todo.text} as done`}
        />
        <span
          className={todo.done ? `${styles.text} ${styles.done}` : styles.text}
        >
          {todo.text}
        </span>
      </label>
      {todo.date && (
        <time className={styles.date} dateTime={todo.date}>
          {formatDate(todo.date)}
        </time>
      )}
    </li>
  );
}
