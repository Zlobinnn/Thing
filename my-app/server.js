const WebSocket = require("ws");
const fs = require("fs");
const path = require("path");

const PORT = 8080;
const server = new WebSocket.Server({ port: PORT });

let clients = [];
let leader = null; // Текущий ведущий

// Папки с изображениями (указаны относительно public)
const imageFolders = {
  2: "/2_shtuka",
  3: "/3_fotorobot",
  4: "/4_risunok",
  5: "/5_ochevidets",
  6: "/6_danet",
};

// Загружаем все изображения
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
  images.push(...folderImages); // Добавляем изображения из папки
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

// Таймеры для каждого клиента
let clientTimers = new Map();

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
          const countdown = getCountdown(image.folder);

          broadcastTimerUpdate(countdown);
          
          ws.send(
            JSON.stringify({
              type: "newImage",
              image: image.path,
              folder: image.folder,
              timer: countdown,
            })
          );

          // Запуск таймера на сервере
          if (clientTimers.has(ws)) {
            clearInterval(clientTimers.get(ws));
          }

          let timer = countdown;
          const interval = setInterval(() => {
            timer -= 1;
            if (timer <= 0) {
              clearInterval(interval);
              ws.send(
                JSON.stringify({
                  type: "timerEnd",
                })
              );
            } else {
              ws.send(
                JSON.stringify({
                  type: "timerUpdate",
                  timer: timer,
                })
              );
            }
          }, 1000);

          clientTimers.set(ws, interval);
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

// Возвращает длительность таймера в зависимости от папки
function getCountdown(folder) {
  switch (folder) {
    case 2:
    case 5:
    case 6:
      return 30;
    case 3:
      return 10;
    case 4:
    default:
      return 30;
  }
}

function broadcastTimerUpdate(timer) {
  const message = JSON.stringify({
    type: "timerUpdate",
    timer,
  });

  clients.forEach((client) => {
    client.send(message);
  });
}


console.log(`WebSocket сервер запущен на порту ${PORT}`);
