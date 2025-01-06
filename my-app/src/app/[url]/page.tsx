"use client";
import React, { useState, useEffect } from "react";
import styles from "./page.module.css";
import Area from "@/app/components/area";
import DrawingCanvas from "@/app/components/DrawingCanvas";
import AnswerWindow from "@/app/components/AnswerWindow";
import Header from "@/app/components/header";

interface PlayerTimer {
  [key: string]: number; // Объект, где ключ — имя игрока, а значение — оставшееся время
}

interface Props {
  params: Promise<{ url: string }>;
}

const gameTypes: Record<number, string> = {
  2: "Штука",
  3: "Фоторобот",
  4: "Рисунок",
  5: "Очевидец",
  6: "Данетка",
}

const gameTitles: Record<number, string> = {
  2: "Ведущий объясняет картинку, заменяя существительные на 'штука' или 'существо'",
  3: "Ведущий запоминает картинку, затем рисует её",
  4: "Ведущий рисует картинку по какой-то фразе",
  5: "Ведущий запоминает картинку, затем описывает её вслух",
  6: "Ведущему задаются вопросы, на которые он может ответить 'да', 'нет' или 'не имеет значение'",
}

export default function Home({ params }: Props) {
  const [isDrawing, setIsDrawing] = useState(false); // Состояние режима рисования
  const [receivedDrawing, setReceivedDrawing] = useState<string | null>(null); // Полученное изображение
  const [ws, setWs] = useState<WebSocket | null>(null); // Подключение WebSocket
  const [role, setRole] = useState("Игрок"); // Роль игрока
  const [isLeaderPresent, setIsLeaderPresent] = useState(false); // Есть ли ведущий
  const [players, setPlayers] = useState<string[]>([]); // Список игроков
  const [leader, setLeader] = useState<string | null>(null); // Имя текущего ведущего
  const [ansplayer, setAnsplayer] = useState<string | null>(null);
  const [isAnsplayer, setIsAnsplayer] = useState(false); // Есть ли ведущий
  const [playerTimers, setPlayerTimers] = useState<PlayerTimer>({}); // Таймеры для игроков
  const [answerModalData, setAnswerModalData] = useState<{ ansplayer: string; ans: string } | null>(null); // Данные для модального окна
  const [score, setScore] = useState<PlayerTimer>({});
  const [isAnswerButtonActive, setIsAnswerButtonActive] = useState(false);
  const [winner, setWinner] = useState<string | null>(null);
  const [url, setUrl] = useState<string | null>(null);
  const [gameTitle, setGameTitle] = useState("Игрок"); // Роль игрока

  useEffect(() => {
    // Извлечение параметров из `params` (асинхронный объект)
    params.then((resolvedParams) => {
      setUrl(resolvedParams.url);
    });
  }, [params]);

  useEffect(() => {
    if (url){
    // const socket = new WebSocket(`ws://localhost:${url}`);
    const socket = new WebSocket(`https://${url}.ngrok-free.app`);

    socket.onopen = () => {
      console.log("WebSocket подключен");
      setWs(socket);

      // Уведомляем сервер о новом подключении
      

      // Устанавливаем начальную роль
      // setRole("Игрок");
    };

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.type === "newImage"){
        setIsDrawing(true);
      } else if (data.type === "drawing") {
        setReceivedDrawing(data.drawing); // Устанавливаем полученное изображение
      } else if (data.type === "updateRole") {
        setIsLeaderPresent(data.isLeaderPresent); // Обновляем наличие ведущего
        setLeader(data.leader); // Устанавливаем текущего ведущего
        setIsAnsplayer(data.isAnsplayer);
        setAnsplayer(data.ansplayer);
      } else if (data.type === "updatePlayers") {
        setPlayers(data.players); // Обновляем список игроков
        setScore(data.score);
        setRole(data.folder);
      } else if (data.type === "updateTimer") {
        // Обновляем таймер для игрока
        setPlayerTimers((prevTimers) => ({
          ...prevTimers,
          [data.player]: data.timer,
        }));
      } else if (data.type === "answer"){
        setAnswerModalData({ ansplayer: data.ansplayer, ans: data.ans });
      } else if (data.type === "answerPlayer"){
        setAnsplayer(data.ansplayer);
      } else if (data.type === "guessing"){
        setIsAnswerButtonActive(data.isGuessing);
        playSound("start");
      } else if (data.type === "gameType"){
        setRole(gameTypes[data.gameType]);
        setGameTitle(gameTitles[data.gameType]);
        setReceivedDrawing(null);
        setPlayerTimers({});
        playSound("reveal");
      } else if (data.type === "winner"){
        // console.log(data);
        setWinner(data.winner);
        alert(`Победитель: ${data.winner}!`); 
      } else if (data.type === "join"){
        const playerName = prompt("Введите своё имя:") || `Игрок-${Math.floor(Math.random() * 1000)}`;
        socket.send(
          JSON.stringify({
            type: "join",
            name: playerName,
          })
        );
      }
      
    };

    return () => {
      socket.close();
    };
  }
  }, [url]);

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
    ws?.send(
      JSON.stringify({
        type: "answer yes",
      })
    );
    closeAnswerWindow();
    setIsDrawing(false);
  };

  const handleNo = () => {
    ws?.send(
      JSON.stringify({
        type: "answer no",
      })
    );
    closeAnswerWindow();
  };

  const playSound = (sound: string) => {
    const audio = new Audio(`/sounds/${sound}.mp3`); // Укажите путь к файлу
    audio.play().catch((err) => {
      console.error("Не удалось воспроизвести звук:", err);
    });
  };

  return (
    <div className={styles.page}>
      <Header ws={ws}/>
      {/* Отображение роли */}
      <div className={styles.roleDisplay} title={gameTitle}>
        Тип игры: {role}
      </div>

      {/* Список игроков */}
      {/* Список игроков */}
      <div className="playerList">
        {players.map((player) => (
          <div
            key={player}
            className={`${styles.player} ${
              leader === player ? styles.leader : ""
            } ${
              ansplayer === player ? styles.ansplayer : ""
            } ${
              winner === player ? styles.winner : ""
            }
            `}
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
          {/* <button
            className={styles.drawButton}
            onClick={handleDrawingStart}
            disabled={isLeaderPresent}
          >
            Рисовать
          </button> */}
          {/* Основное игровое поле */}
          <Area />
          {/* Кнопка "Ответить" */}
          {isAnswerButtonActive && <button
            className={styles.answerButton}
            onClick={ansOnClick}
            disabled={isAnsplayer}
          >
            Ответить
          </button>}
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
