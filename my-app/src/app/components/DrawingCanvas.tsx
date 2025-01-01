"use client";
import React, { useRef, useState, useEffect } from "react";
import styles from "./DrawingCanvas.module.css";
import HelpButton from "@/app/components/HelpButton";
import { isArgumentsObject } from "util/types";

interface DrawingCanvasProps {
  onComplete: (drawingData: string) => void;
  ws: WebSocket | null; // Добавляем WebSocket в пропсы
}

const timersFolders = {
  2: [10],
  3: [5, 8, 10],
  4: [8, 10],
  5: [5, 10],
  6: [10],
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
  const hasRequestedImage = useRef(false); // Проверка на отправку запроса
  const [isDrawing, setIsDrawing] = useState(false);
  const [isErasing, setIsErasing] = useState(false);
  const [randomImage, setRandomImage] = useState<string | null>(null);
  const [timer, setTimer] = useState<number>(0);
  const [instruction, setInstruction] = useState<string>("");
  const [imageFolder, setImageFolder] = useState<number>(0);
  const [isDrawingVisible, setIsDrawingVisible] = useState<boolean>(false);
  const [isImgVisible, setIsImgVisible] = useState<boolean>(true);
  const [isAnsVis, setIsAnsVis] = useState<boolean>(false);
  const [ans, setAns] = useState<string>("");

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
      console.log(data);
      if (data.type === "newImage") {
        const fileName = data.image.split("\\").pop()?.split("/").pop()?.split(".")[0];
        setAns(fileName);
        setRandomImage(data.image);
        setImageFolder(data.folder);
        setInstruction(instructions[data.folder]);
        setTimer(data.timer); // Устанавливаем таймер с сервера
        if (data.folder === 4){
          setIsDrawingVisible(true);
          console.log("set", isDrawingVisible);
        }
        else
          setIsDrawingVisible(false); // Скрываем холст до завершения таймера

        if (data.folder === 2 || data.folder === 6){
          setIsAnsVis(true);
        }
      }

      if (data.type === "timerUpdate") {
        setTimer(data.timer);
      }
      console.log(data.type);
      if (data.type === "timerEnd") {
        if (data.folder === 3){
          setIsDrawingVisible(true);
        }
        setIsImgVisible(false);
      }

      if (data.type === "guess"){
        handleComplete();
        setIsDrawingVisible(false);
        setIsAnsVis(true);
      }
    };

    ws.addEventListener("message", handleMessage);

    return () => {
      ws.removeEventListener("message", handleMessage);
    };
  }, [ws, isDrawingVisible, isAnsVis, ans]);

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
        {randomImage && isImgVisible && (
          <>
            <img src={randomImage} alt="Random" className={styles.randomImage} />
            <div className={styles.timer}>{timer}s</div>
          </>
        )}
      </div>

      <div className={styles.ans}>
        {isAnsVis && (<>Ответ: {ans}</>)}
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
