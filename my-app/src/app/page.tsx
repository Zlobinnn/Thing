"use client";
import React, { useState } from "react";
import styles from "./page.module.css";
import Area from "@/app/components/area";
import DrawingCanvas from "@/app/components/DrawingCanvas";

export default function Home() {
  const [isDrawing, setIsDrawing] = useState(false); // Состояние режима рисования
  const [receivedDrawing, setReceivedDrawing] = useState<string | null>(null); // Полученное изображение
  const [ws, setWs] = useState<WebSocket | null>(null); // Подключение WebSocket

  React.useEffect(() => {
    // Инициализация WebSocket подключения
    // const socket = new WebSocket("ws://localhost:8080");
    const socket = new WebSocket("ws://thing-6zo27y0l7-caxesi2501chansdcoms-projects-de5e4f32.vercel.app");

    socket.onopen = () => {
      console.log("WebSocket подключен");
      setWs(socket);
    };

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === "drawing") {
        setReceivedDrawing(data.drawing); // Устанавливаем полученное изображение
      }
    };

    return () => {
      socket.close();
    };
  }, []);

  const handleDrawingComplete = (drawingData: string) => {
    setIsDrawing(false); // Закрываем окно рисования
    ws?.send(
      JSON.stringify({
        type: "drawing",
        drawing: drawingData,
      })
    );
  };

  return (
    <div className={styles.page}>
      {!isDrawing && (
        <>
          {/* Кнопка "Рисовать" */}
          <button
            className={styles.drawButton}
            onClick={() => setIsDrawing(true)}
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
      {isDrawing && <DrawingCanvas onComplete={handleDrawingComplete} />}

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
