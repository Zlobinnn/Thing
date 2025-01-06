// components/AnswerWindow.tsx
import React from "react";
import styles from "./AnswerWindow.module.css";
import { useEffect, useState } from "react";

interface AnswerWindowProps {
  ansplayer: string;
  ans: string;
  onClose: () => void;
  onYes: () => void;
  onNo: () => void;
}

export default function AnswerWindow(props: AnswerWindowProps) {
  const { ansplayer, ans, onClose, onYes, onNo } = props;
  const [theme, setTheme] = useState<string>("modalContent");

  const getTheme = () => {
    const theme1 = localStorage.getItem("theme");
    const newTheme = `modalContent${theme1 ? "-" + theme1 : ""}`;
    setTheme(newTheme);
  }

  useEffect(() => {
      getTheme();
  }, []);

  return (
    <div className={styles.modal}>
      <div className={theme}>
        <h2>Отвечает {ansplayer}</h2>
        <p>Правильный ответ: {ans}</p>
        <div className={styles.buttonContainer}>
          <button className={styles.yesButton} onClick={onYes}>
            Да
          </button>
          <button className={styles.noButton} onClick={onNo}>
            Нет
          </button>
        </div>
        {/* <button className={styles.closeButton} onClick={onClose}>
          Закрыть
        </button> */}
      </div>
    </div>
  );
}
