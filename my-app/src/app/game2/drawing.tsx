"use client";
import React, { useRef, useState } from "react";
import styles from "./drawing.module.css";

interface DrawingProps {
  role: string;  // Для примера предполагаем, что роль передается как строка
}

export default function Drawing({ role }: DrawingProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isErasing, setIsErasing] = useState(false);
  const [lineWidth, setLineWidth] = useState(10);

  // Функция начала рисования
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Если нажата правая кнопка мыши — стираем
    if (e.button === 2) {
      setIsErasing(true);
      ctx.globalCompositeOperation = "destination-out"; // Стираем
    } else {
      setIsErasing(false);
      ctx.globalCompositeOperation = "source-over"; // Рисуем
      ctx.strokeStyle = "black"; // Цвет линии для рисования
    }

    ctx.lineWidth = lineWidth;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);

    // Если рисуем точку (для первого клика)
    if (e.button === 0 && !isErasing) {
      ctx.lineTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
      ctx.stroke();
    }

    setIsDrawing(true);
  };

  // Функция рисования или стирания в процессе движения мыши
  const drawOrErase = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.lineTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
    ctx.stroke();
  };

  // Остановка рисования или стирания
  const stopDrawing = () => {
    setIsDrawing(false);
    setIsErasing(false);
  };

  // Функция очистки холста
  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  // Отключение контекстного меню при правом клике
  const preventContextMenu = (e: React.MouseEvent<HTMLCanvasElement>) => {
    e.preventDefault();
  };

  return (
    <div className={styles.drawingContainer}>
      <div className={styles.controls}>
        <label className={styles.label}>
          Толщина кисти:
          <input
            type="range"
            min="1"
            max="50"
            value={lineWidth}
            onChange={(e) => setLineWidth(Number(e.target.value))}
          />
          <span>{lineWidth}px</span>
        </label>
        <button className={styles.button} onClick={clearCanvas}>
          Стереть всё
        </button>
      </div>
      <canvas
        ref={canvasRef}
        className={styles.canvas}
        width={800}
        height={600}
        onMouseDown={startDrawing}
        onMouseMove={drawOrErase}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        onContextMenu={preventContextMenu}
      ></canvas>
    </div>
  );
}
