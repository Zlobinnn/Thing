"use client";
import React, { useState, useEffect } from "react";
import styles from "./page.module.css";
import Area from "@/app/components/area";
import DrawingCanvas from "@/app/components/DrawingCanvas";

export default function Home() {
  const [isDrawing, setIsDrawing] = useState(false); // Состояние режима рисования
  const [receivedDrawing, setReceivedDrawing] = useState<string | null>(null); // Полученное изображение
  const [ws, setWs] = useState<WebSocket | null>(null); // Подключение WebSocket
  const [role, setRole] = useState("Игрок"); // Роль игрока
  const [isLeaderPresent, setIsLeaderPresent] = useState(false); // Есть ли ведущий
  const [players, setPlayers] = useState<string[]>([]); // Список игроков
  const [leader, setLeader] = useState<string | null>(null); // Имя текущего ведущего

  useEffect(() => {
    //const socket = new WebSocket("https://392a-94-19-242-214.ngrok-free.app");
    const socket = new WebSocket("ws://localhost:8080");

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
        setPlayers(data.players); // Обновляем список игроков
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
    setIsDrawing(false);
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

  return (
    <div className={styles.page}>
      {/* Отображение роли */}
      <div className={styles.roleDisplay}>
        <strong>Роль:</strong> {role}
      </div>

      {/* Список игроков */}
      <div className={styles.playerList}>
        {players.map((player) => (
          <div
            key={player}
            className={`${styles.player} ${
              leader === player ? styles.leader : ""
            }`}
          >
            {player}
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
            onClick={() => alert("Вы нажали на 'Ответить'!")}
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
    </div>
  );
}
