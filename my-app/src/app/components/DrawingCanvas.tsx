"use client";
import React, { useRef, useState, useEffect } from "react";
import styles from "./DrawingCanvas.module.css";
import HelpButton from "@/app/components/HelpButton";

interface DrawingCanvasProps {
  onComplete: (drawingData: string) => void;
}

const imageFolders: Record<number, string> = {
  2: "/2_shtuka",
  3: "/3_fotorobot",
  4: "/4_risunok",
  5: "/5_ochevidets",
  6: "/6_danet",
};

const instructions: Record<number, string> = {
  2: "Объясни картинку, заменяя существительные на 'Штука' или 'Существо'",
  3: "Нарисуй по памяти",
  4: "Вообрази и нарисуй",
  5: "Запомни и расскажи, что видел",
  6: "Объясни, отвечая только да, нет, не имеет значение",
};

export default function DrawingCanvas({ onComplete }: DrawingCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isErasing, setIsErasing] = useState(false);
  const [randomImage, setRandomImage] = useState<string | null>(null);
  const [timer, setTimer] = useState<number>(0);
  const [instruction, setInstruction] = useState<string>("");
  const [imageFolder, setImageFolder] = useState<number>(0);
  const [imageTimer, setImageTimer] = useState<NodeJS.Timeout | null>(null);
  const [isDrawingVisible, setIsDrawingVisible] = useState<boolean>(false); // для показа/скрытия канваса

  // Получаем изображения из папки
  const getImagesFromFolder = (folder: string) => {
    return [
      `${folder}/Screenshot_1.png`,
      `${folder}/Screenshot_2.png`,
      // Добавьте больше изображений, если нужно
    ];
  };

  // Получаем случайное изображение из одной из папок
  const getRandomImage = () => {
    const folderKeys = Object.keys(imageFolders).map(Number);
    const randomFolder = folderKeys[Math.floor(Math.random() * folderKeys.length)];
    const folderPath = imageFolders[randomFolder];
    const images = getImagesFromFolder(folderPath);
    const randomImage = images[Math.floor(Math.random() * images.length)];
    return { randomImage, folder: randomFolder };
  };

  useEffect(() => {
    const { randomImage, folder } = getRandomImage();
    setRandomImage(randomImage);
    setImageFolder(folder);
    setInstruction(instructions[folder]);

    let countdown = 0;
    switch (folder) {
      case 2:
      case 5:
      case 6:
        countdown = 30; // Таймер на 30 секунд
        setIsDrawingVisible(false); // Не показывать канвас
        break;
      case 3:
        countdown = 10; // Таймер на 10 секунд
        setIsDrawingVisible(false); // Канвас пока не показываем
        break;
      case 4:
        countdown = 30; // Таймер на 30 секунд
        setIsDrawingVisible(true); // Показываем канвас сразу
        break;
      default:
        countdown = 30;
        setIsDrawingVisible(true); // По умолчанию показываем канвас
    }

    setTimer(countdown);

    // Запуск таймера
    if (imageTimer) clearInterval(imageTimer);
    const interval = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setRandomImage(null);
          if (folder === 3) {
            setIsDrawingVisible(true); // Показываем канвас после окончания таймера
          }
        }
        return prev - 1;
      });
    }, 1000);
    setImageTimer(interval);

    // Очистка таймера при размонтировании компонента
    return () => clearInterval(interval);
  }, [imageFolder]);

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

    // Рисуем точку при одиночном клике
    ctx.lineTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
    ctx.stroke();

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
    if (!isDrawingVisible) {
      onComplete(""); // Если канвас не виден, закрываем компонент, передав пустую строку
      return;
    }
  
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
        {randomImage && (
          <>
            <img src={randomImage} alt="Random" className={styles.randomImage} />
            <div className={styles.timer}>{timer}s</div>
          </>
        )}
      </div>
      <div className={styles.instructionContainer}>
        {instruction && <p>{instruction}</p>}
        <HelpButton params={{ type: imageFolder }} />
      </div>
      <div className={styles.canvasContainer}>
        {isDrawingVisible && (
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
        )}
        <button className={styles.completeButton} onClick={handleComplete}>
          Готово
        </button>
      </div>
    </div>
  );
}
