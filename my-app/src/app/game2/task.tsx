"use client";
import React, { useState, useEffect } from "react";
import styles from "./task.module.css";

interface TaskProps {
  role: string;  // Для примера предполагаем, что роль передается как строка
}

export default function Task({ role }: TaskProps) {
  const [task, setTask] = useState<string>(""); // Для хранения задания
  const [answer, setAnswer] = useState<string>(""); // Для хранения введенного ответа
  const [isAnsBtn, setIsAnsBtn] = useState(true);

  useEffect(() => {
    // Задача может быть загружена по какому-то API или через WebSocket
    setTask("Опиши свой самый лучший день");
  }, []);

  const handleAnswerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAnswer(e.target.value);
  };

  const handleSubmit = () => {
    // Логика для отправки ответа
    console.log("Ответ отправлен:", answer);
    setIsAnsBtn(false);
  };

  return (
    <div className={styles.taskContainer}>
      {role === "Жулик" && (<div><h3>Ты жулик!</h3></div>)}
      <div className={styles.task}>
        <p>{task}</p>
      </div>
      <div className={styles.answerSection}>
          <input
            type="text"
            value={answer}
            onChange={handleAnswerChange}
            placeholder="Введите ваш ответ"
            className={styles.answerInput}
          />
          {isAnsBtn && (<button onClick={handleSubmit} className={styles.submitButton}>
            Отправить ответ
          </button>)}
          {!isAnsBtn && (<p className={styles.textParagraph}>Ответ отправлен!</p>)}
        </div>

    </div>
  );
}
