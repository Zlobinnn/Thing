const WebSocket = require("ws");
const fs = require("fs");
const path = require("path");

const PORT = 8080;
const server = new WebSocket.Server({ port: PORT });

let clients = [];
let leader = null; // Текущий ведущий

// Таймеры для каждого клиента
let clientTimers = new Map(); // Хранит интервалы для таймеров
let clientCountdowns = new Map(); // Хранит оставшееся время для клиентов
let ansplayer = null;
let currentLeaderIndex = -1;

// Папки с изображениями (указаны относительно public)
const imageFolders = {
  2: "/2_shtuka",
  3: "/3_fotorobot",
  4: "/4_risunok",
  5: "/5_ochevidets",
  6: "/6_danet",
};

const timersFolders = {
  2: [10],
  3: [5, 8, 10],
  4: [8, 10],
  5: [5, 10],
  6: [10],
}

// Загружаем изображения
let images = [];
let usedImages = new Set(); // Храним пути использованных изображений

for (const folder in imageFolders) {
  const folderPath = path.join(__dirname, "public", imageFolders[folder]); // Указываем путь с "public"
  const folderImages = fs
    .readdirSync(folderPath)
    .filter((file) => file.endsWith(".png"))
    .map((file) => ({
      path: path.join(imageFolders[folder], file), // Сохраняем путь без "public"
      folder: parseInt(folder, 10),
    }));
  images.push(...folderImages);
}

// Функция для получения случайного изображения
function getRandomImage() {
  const availableImages = images.filter(
    (image) => !usedImages.has(image.path)
  );
  if (availableImages.length === 0) {
    console.log("Все изображения использованы.");
    return { allImagesSelected: true };
  }
  const randomImage = availableImages[Math.floor(Math.random() * availableImages.length)];
  usedImages.add(randomImage.path);

  console.log("Обновлённый список использованных изображений:", [...usedImages]);

  return { image: randomImage, allImagesSelected: false };
}

server.on("connection", (ws) => {
  console.log("Новый клиент подключился!");

  // Обработка сообщений от клиента
  ws.on("message", (message) => {
    try {
      const data = JSON.parse(message);

      if (data.type === "join") {
        ws.name = data.name;
        ws.score = 0;
        clients.push(ws);
        broadcastPlayers();
      } else if (data.type === "setRole") {
        if (data.role === "Ведущий") {
          leader = ws;
        } else if (data.role === "Игрок" && leader === ws) {
          leader = null;
        }
        broadcastRole();
      } else if (data.type === "requestImage") {
        const { image, allImagesSelected } = getRandomImage();

        if (allImagesSelected) {
          ws.send(
            JSON.stringify({
              type: "allImagesSelected",
              message: "Все изображения были выбраны.",
            })
          );
        } else {
          //const countdown = getCountdown(image.folder);

          ws.send(
            JSON.stringify({
              type: "newImage",
              image: image.path,
              folder: image.folder,
              timer: timersFolders[image.folder],
            })
          );

          clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
              client.send(
                JSON.stringify({
                  type: "gameType",
                  gameType: image.folder,
                })
              );
            }
          });

          // Запуск таймера для этого игрока
          setClientTimer(ws, timersFolders[image.folder]);
        }
      } else if (data.type === "drawing") {
        console.log("Получен рисунок от клиента");
        clients.forEach((client) => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(
              JSON.stringify({
                type: "drawing",
                drawing: data.drawing,
              })
            );
          }
        });
      } else if (data.type === "answer") {
        console.log("Ответ от пользователя");
      
        const playerName = ws.name || "Без имени";
        const fileName = Array.from(usedImages).at(-1).split("\\").pop()?.split("/").pop()?.split(".")[0];
      
        ansplayer = ws;
      
        // Приостановить таймер игрока
        if (clientTimers.has(leader)) {
          clearInterval(clientTimers.get(leader));
          clientTimers.delete(leader);
        }
      
        if (leader && leader.readyState === WebSocket.OPEN) {
          leader.send(
            JSON.stringify({
              type: "answer",
              ansplayer: playerName,
              ans: fileName,
            })
          );
        }
        // clients.forEach((client) => {
        //   if (client.readyState === WebSocket.OPEN) {
        //     client.send(
        //       JSON.stringify({
        //         type: "answerPlayer",
        //         ansplayer: playerName,
        //       })
        //     );
        //   }
        // });
        broadcastRole();
      } else if (data.type === "answer yes") {
        console.log(clientTimers,clientCountdowns);
        if (clientTimers.has(leader)) {
          clearInterval(clientTimers.get(leader));
          clientTimers.delete(leader);
          clientCountdowns.delete(leader);
        }

        ansplayer.score += 2;
        leader.score += 1;
        ansplayer = null;

        broadcastPlayers();
        switchLeader();
        broadcastRole();
      } else if (data.type === "answer no") {
        // Продолжить таймер для игрока
        if (clientCountdowns.has(leader)) {
          const remainingTime = clientCountdowns.get(leader);
          setClientTimer(leader, [remainingTime]);
        }
      
        ansplayer.score -= 1;
        ansplayer = null;
        broadcastPlayers();
        broadcastRole();
      }
      
    } catch (err) {
      console.error("Ошибка обработки сообщения:", err);
    }
  });

  ws.on("close", () => {
    console.log("Клиент отключился");
    clients = clients.filter((client) => client !== ws);
    if (leader === ws) {
      leader = null;
    }

    if (clientTimers.has(ws)) {
      clearInterval(clientTimers.get(ws));
      clientTimers.delete(ws);
      clientCountdowns.delete(ws);
    }

    broadcastPlayers();
    broadcastRole();
  });

  ws.on("error", (error) => {
    console.error("Ошибка соединения:", error);
  });
});

function broadcastPlayers() {
  const playerNames = clients.map((client) => client.name || "Без имени");
  const scores = clients.map((client) => client.score);

  const scoreObject = {};
  playerNames.forEach((name, index) => {
    scoreObject[name] = scores[index];
  });

  clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(
        JSON.stringify({
          type: "updatePlayers",
          players: playerNames,
          score: scoreObject,
        })
      );
    }
  });
}

function broadcastRole() {
  clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(
        JSON.stringify({
          type: "updateRole",
          isLeaderPresent: leader !== null,
          leader: leader ? leader.name : null,
          isAnsplayer: ansplayer !== null,
          ansplayer: ansplayer ? ansplayer.name : null,
        })
      );
    }
  });
}

function setClientTimer(client, countdown) {
  if (clientTimers.has(client)) {
    clearInterval(clientTimers.get(client));
  }

  clientCountdowns.set(client, countdown[0]);

  if (countdown.length === 1){
    clients.forEach((client) => {
      client.send(
        JSON.stringify({
          type: "guessing",
          isGuessing: true,
        })
      );
    });
  }

  const interval = setInterval(() => {
    let timeLeft = clientCountdowns.get(client) || 0;
    console.log(timeLeft, countdown);
    if (timeLeft <= 0) {
      clearInterval(interval);
      clientTimers.delete(client);
      clientCountdowns.delete(client);

      client.send(
        JSON.stringify({
          type: "timerEnd",
        })
      );
      if (countdown.length>1){
        if (countdown.length===2){
          client.send(
            JSON.stringify({
              type: "guess",
            })
          );
        }

        const newCountdown = countdown.slice(1);
        setClientTimer(client, newCountdown);
      }
      if (countdown.length===1){
        client.send(
          JSON.stringify({
            type: "timeOver",
          })
        );
        leader.score-=1;
        broadcastPlayers();
        switchLeader();
      }

    } else {
      timeLeft -= 1;
      clientCountdowns.set(client, timeLeft);

      client.send(
        JSON.stringify({
          type: "timerUpdate",
          timer: timeLeft,
        })
      );
      // Также передаём обновление другим клиентам
      broadcastTimerUpdate(client.name, timeLeft);
    }
  }, 1000);

  clientTimers.set(client, interval);
}

function broadcastTimerUpdate(playerName, timer) {
  const message = JSON.stringify({
    type: "updateTimer",
    player: playerName,
    timer,
  });

  clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

function switchLeader() {
  if (clients.length === 0) {
    leader = null;
    currentLeaderIndex = 0;
    broadcastRole();
    return;
  }

  // Увеличиваем индекс текущего ведущего
  currentLeaderIndex = (currentLeaderIndex + 1) % clients.length;
  leader = clients[currentLeaderIndex];

  broadcastRole();
  leader.send(
        JSON.stringify({
          type: "newImage",
        })
      );

      clients.forEach((client) => {
        client.send(
          JSON.stringify({
            type: "guessing",
            isGuessing: false,
          })
        );
      });
  // const { image, allImagesSelected } = getRandomImage();

  // if (allImagesSelected) {
  //   leader.send(
  //     JSON.stringify({
  //       type: "allImagesSelected",
  //       message: "Все изображения были выбраны.",
  //     })
  //   );
  // } else {
  //   //const countdown = getCountdown(image.folder);

  //   leader.send(
  //     JSON.stringify({
  //       type: "newImage",
  //       image: image.path,
  //       folder: image.folder,
  //       timer: timersFolders[image.folder],
  //     })
  //   );

  //   // Запуск таймера для этого игрока
  //   setClientTimer(leader, timersFolders[image.folder]);}
}

console.log("Введите 'start' для начала игры.");
process.stdin.on("data", (data) => {
  const command = data.toString().trim();
  if (command === "start") {
    gameStarted = true;
    console.log("Игра началась!");
    if (clients.length > 0) {
      leader = clients[0];
      broadcastRole();
      
      switchLeader();

      


    }
  } else {
    console.log(`Неизвестная команда: ${command}`);
  }
});

console.log(`WebSocket сервер запущен на порту ${PORT}`);
