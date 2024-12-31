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
  clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(
        JSON.stringify({
          type: "updatePlayers",
          players: playerNames,
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
        const newCountdown = countdown.slice(1);
        setClientTimer(client, newCountdown);
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

console.log(`WebSocket сервер запущен на порту ${PORT}`);
