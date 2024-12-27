"use client";
import React, { useRef, useState, useEffect } from "react";
import styles from "./DrawingCanvas.module.css";

interface DrawingCanvasProps {
  onComplete: (drawingData: string) => void;
}

export default function DrawingCanvas({ onComplete }: DrawingCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isErasing, setIsErasing] = useState(false);
  const [randomImage, setRandomImage] = useState<string | null>(null);

  // Список доступных изображений в папке public/draw
  const images = [
    "/draw/Screenshot_1.png",
    "/draw/Screenshot_2.png",
  ];

  // Выбираем случайное изображение при загрузке компонента
  useEffect(() => {
    const randomIndex = Math.floor(Math.random() * images.length);
    setRandomImage(images[randomIndex]);
  }, []);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    if (e.button === 2) {
      // ПКМ (стираем)
      ctx.globalCompositeOperation = "destination-out";
      ctx.lineWidth = 20;
    } else {
      // ЛКМ (рисуем)
      ctx.globalCompositeOperation = "source-over";
      ctx.lineWidth = 10;
      ctx.strokeStyle = "black";
    }

    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);

    setIsDrawing(true);
    setIsErasing(e.button === 2);
  };

  const drawOrErase = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.lineTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
    ctx.stroke();
  };

  const stopDrawingOrErasing = () => {
    setIsDrawing(false);
    setIsErasing(false);
  };

  const handleComplete = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const finalCanvas = document.createElement("canvas");
    finalCanvas.width = canvas.width;
    finalCanvas.height = canvas.height;

    const finalCtx = finalCanvas.getContext("2d");
    if (!finalCtx) return;

    finalCtx.fillStyle = "white";
    finalCtx.fillRect(0, 0, finalCanvas.width, finalCanvas.height);
    finalCtx.drawImage(canvas, 0, 0);

    const drawingData = finalCanvas.toDataURL("image/png");
    onComplete(drawingData);
  };

  const preventContextMenu = (e: React.MouseEvent<HTMLCanvasElement>) => {
    e.preventDefault();
  };

  return (
    <div className={styles.drawingContainer}>
      <div className={styles.imageContainer}>
        {randomImage && <img src={randomImage} alt="Random" className={styles.randomImage} />}
      </div>
      <div className={styles.canvasContainer}>
        <canvas
          ref={canvasRef}
          className={styles.canvas}
          width={800}
          height={600}
          onMouseDown={startDrawing}
          onMouseMove={drawOrErase}
          onMouseUp={stopDrawingOrErasing}
          onMouseLeave={stopDrawingOrErasing}
          onContextMenu={preventContextMenu}
        ></canvas>
        <button className={styles.completeButton} onClick={handleComplete}>
          Готово
        </button>
      </div>
    </div>
  );
}
