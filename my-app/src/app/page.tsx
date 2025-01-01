"use client";
import React, { useState, useEffect } from "react";
import styles from "./page.module.css";
import Area from "@/app/components/area";
import DrawingCanvas from "@/app/components/DrawingCanvas";
import AnswerWindow from "@/app/components/AnswerWindow";

interface PlayerTimer {
  [key: string]: number; // Объект, где ключ — имя игрока, а значение — оставшееся время
}

export default function Home() {
  const [isDrawing, setIsDrawing] = useState(false); // Состояние режима рисования
  const [receivedDrawing, setReceivedDrawing] = useState<string | null>(null); // Полученное изображение
  const [ws, setWs] = useState<WebSocket | null>(null); // Подключение WebSocket
  const [role, setRole] = useState("Игрок"); // Роль игрока
  const [isLeaderPresent, setIsLeaderPresent] = useState(false); // Есть ли ведущий
  const [players, setPlayers] = useState<string[]>([]); // Список игроков
  const [leader, setLeader] = useState<string | null>(null); // Имя текущего ведущего
  const [playerTimers, setPlayerTimers] = useState<PlayerTimer>({}); // Таймеры для игроков
  const [answerModalData, setAnswerModalData] = useState<{ ansplayer: string; ans: string } | null>(null); // Данные для модального окна
  const [score, setScore] = useState<PlayerTimer>({});

  useEffect(() => {
    const socket = new WebSocket("ws://localhost:8080");
    //const socket = new WebSocket("https://0802-94-19-242-214.ngrok-free.app");

    socket.onopen = () => {
      console.log("WebSocket подключен");
      setWs(socket);

      // Уведомляем сервер о новом подключении
      const playerName = prompt("Введите своё имя:") || `Игрок-${Math.floor(Math.random() * 1000)}`;
      socket.send(
        JSON.stringify({
          type: "join",
          name: playerName,
        })
      );

      // Устанавливаем начальную роль
      setRole("Игрок");
    };

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.type === "drawing") {
        setReceivedDrawing(data.drawing); // Устанавливаем полученное изображение
      } else if (data.type === "updateRole") {
        setIsLeaderPresent(data.isLeaderPresent); // Обновляем наличие ведущего
        setLeader(data.leader); // Устанавливаем текущего ведущего
      } else if (data.type === "updatePlayers") {
        console.log(data);
        setPlayers(data.players); // Обновляем список игроков
        setScore(data.score);
      } else if (data.type === "updateTimer") {
        // Обновляем таймер для игрока
        setPlayerTimers((prevTimers) => ({
          ...prevTimers,
          [data.player]: data.timer,
        }));
      } else if (data.type === "answer"){
        setAnswerModalData({ ansplayer: data.ansplayer, ans: data.ans });
      }
      
    };

    return () => {
      socket.close();
    };
  }, []);

  const handleDrawingStart = () => {
    if (role !== "Игрок" || isLeaderPresent) return;

    setRole("Ведущий");
    setIsDrawing(true);

    ws?.send(
      JSON.stringify({
        type: "setRole",
        role: "Ведущий",
      })
    );
  };

  const handleDrawingComplete = (drawingData: string) => {
    // setIsDrawing(false);
    setRole("Игрок");

    ws?.send(
      JSON.stringify({
        type: "drawing",
        drawing: drawingData,
      })
    );

    ws?.send(
      JSON.stringify({
        type: "setRole",
        role: "Игрок",
      })
    );
  };

  const ansOnClick = () => {
    ws?.send(
      JSON.stringify({
        type: "answer",
      })
    );
  };



  const closeAnswerWindow = () => {
    setAnswerModalData(null);
  };

  const handleYes = () => {
    alert("Ответ принят!");
    closeAnswerWindow();
  };

  const handleNo = () => {
    alert("Ответ отклонён!");
    closeAnswerWindow();
  };





  return (
    <div className={styles.page}>
      {/* Отображение роли */}
      <div className={styles.roleDisplay}>
        <strong>Роль:</strong> {role}
      </div>

      {/* Список игроков */}
      {/* Список игроков */}
      <div className={styles.playerList}>
        {players.map((player) => (
          <div
            key={player}
            className={`${styles.player} ${
              leader === player ? styles.leader : ""
            }`}
          >
            <div className={styles.playerInfo}>
              <span className={styles.score}>{score[player]}</span>
              <span className={styles.name}>{player}</span>
              {playerTimers[player] > 0 && (
                <span className={styles.timer}> {playerTimers[player]}s</span>
              )}
            </div>
          </div>
        ))}
      </div>



      {!isDrawing && (
        <>
          {/* Кнопка "Рисовать" */}
          <button
            className={styles.drawButton}
            onClick={handleDrawingStart}
            disabled={isLeaderPresent}
          >
            Рисовать
          </button>
          {/* Основное игровое поле */}
          <Area />
          {/* Кнопка "Ответить" */}
          <button
            className={styles.answerButton}
            onClick={ansOnClick}
          >
            Ответить
          </button>
        </>
      )}

      {/* Окно рисования */}
      {isDrawing && ws && <DrawingCanvas ws={ws} onComplete={handleDrawingComplete} />}

      {/* Отображение полученного рисунка */}
      {receivedDrawing && (
        <img
          src={receivedDrawing}
          alt="Полученный рисунок"
          className={styles.receivedDrawing}
        />
      )}

      {answerModalData && (
        <AnswerWindow
          ansplayer={answerModalData.ansplayer}
          ans={answerModalData.ans}
          onClose={closeAnswerWindow}
          onYes={handleYes}
          onNo={handleNo}
        />
      )}
    </div>
  );
}
