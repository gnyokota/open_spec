import { ThemeToggle } from "@/components/ThemeToggle/ThemeToggle";
import { TodoApp } from "@/components/TodoApp/TodoApp";

import styles from "./page.module.css";

export default function Home() {
  return (
    <main className={styles.main}>
      <header className={styles.header}>
        <h1 className={styles.title}>Todo</h1>
        <ThemeToggle />
      </header>
      <TodoApp />
    </main>
  );
}
