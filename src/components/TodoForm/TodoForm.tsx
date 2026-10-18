"use client";

import { useId, useRef, useState, type FormEvent } from "react";

import styles from "./TodoForm.module.css";

type Props = {
  /** Adds a todo; returns false if it was rejected. */
  onAdd: (text: string, date: string | null) => boolean;
};

export function TodoForm({ onAdd }: Props) {
  const [text, setText] = useState("");
  const [date, setDate] = useState("");
  const [error, setError] = useState(false);
  const textRef = useRef<HTMLInputElement>(null);
  const id = useId();
  const textId = `${id}-text`;
  const dateId = `${id}-date`;
  const errorId = `${id}-error`;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (text.trim() === "" || !onAdd(text, date || null)) {
      setError(true);
      textRef.current?.focus();
      return;
    }
    setText("");
    setDate("");
    setError(false);
    textRef.current?.focus();
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      <div className={`${styles.field} ${styles.textField}`}>
        <label className={styles.label} htmlFor={textId}>
          Todo
        </label>
        <input
          ref={textRef}
          id={textId}
          className={styles.input}
          type="text"
          autoComplete="off"
          value={text}
          onChange={(event) => {
            setText(event.target.value);
            setError(false);
          }}
          aria-invalid={error}
          aria-describedby={error ? errorId : undefined}
        />
      </div>
      <div className={styles.field}>
        <label className={styles.label} htmlFor={dateId}>
          Date
        </label>
        <input
          id={dateId}
          className={styles.input}
          type="date"
          value={date}
          onChange={(event) => setDate(event.target.value)}
        />
      </div>
      <button className={styles.button} type="submit">
        Add
      </button>
      {error && (
        <p id={errorId} className={styles.error} role="alert">
          Enter a todo
        </p>
      )}
    </form>
  );
}
