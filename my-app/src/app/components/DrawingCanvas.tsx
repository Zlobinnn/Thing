"use client";
import React, { useRef, useState, useEffect } from "react";
import styles from "./DrawingCanvas.module.css";
import HelpButton from "@/app/components/HelpButton";

interface DrawingCanvasProps {
  onComplete: (drawingData: string) => void;
  ws: WebSocket | null; // Добавляем WebSocket в пропсы
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

export default function DrawingCanvas({ onComplete, ws }: DrawingCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const hasRequestedImage = useRef(false); // Перенесли на верхний уровень компонента
  const [isDrawing, setIsDrawing] = useState(false);
  const [isErasing, setIsErasing] = useState(false);
  const [randomImage, setRandomImage] = useState<string | null>(null);
  const [timer, setTimer] = useState<number>(0);
  const [instruction, setInstruction] = useState<string>("");
  const [imageFolder, setImageFolder] = useState<number>(0);
  const [imageTimer, setImageTimer] = useState<NodeJS.Timeout | null>(null);
  const [isDrawingVisible, setIsDrawingVisible] = useState<boolean>(false);

  useEffect(() => {
    if (!ws) return;

    if (!hasRequestedImage.current) {
      hasRequestedImage.current = true;

      // Отправляем запрос на изображение
      ws.send(
        JSON.stringify({
          type: "requestImage",
        })
      );
    }

    const handleMessage = (event: MessageEvent) => {
      const data = JSON.parse(event.data);

      if (data.type === "newImage") {
        setRandomImage(data.image);
        setImageFolder(data.folder);
        setInstruction(instructions[data.folder]);

        let countdown = 0;
        switch (data.folder) {
          case 2:
          case 5:
          case 6:
            countdown = 30;
            setIsDrawingVisible(false);
            break;
          case 3:
            countdown = 10;
            setIsDrawingVisible(false);
            break;
          case 4:
            countdown = 30;
            setIsDrawingVisible(true);
            break;
          default:
            countdown = 30;
            setIsDrawingVisible(true);
        }

        setTimer(countdown);

        // Очищаем предыдущий таймер
        if (imageTimer) clearInterval(imageTimer);
        const interval = setInterval(() => {
          setTimer((prev) => {
            if (prev <= 1) {
              clearInterval(interval);
              setRandomImage(null);
              if (data.folder === 3) {
                setIsDrawingVisible(true);
              }
            }
            return prev - 1;
          });
        }, 1000);
        setImageTimer(interval);
      }
    };

    ws.addEventListener("message", handleMessage);

    return () => {
      ws.removeEventListener("message", handleMessage);
      if (imageTimer) clearInterval(imageTimer);
    };
  }, [ws, imageTimer]);
  
  

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    if (e.button === 2) {
      ctx.globalCompositeOperation = "destination-out";
      ctx.lineWidth = 20;
    } else {
      ctx.globalCompositeOperation = "source-over";
      ctx.lineWidth = 10;
      ctx.strokeStyle = "black";
    }

    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);

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
      onComplete("");
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
