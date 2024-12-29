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
    // Если все изображения использованы
    console.log("Все изображения использованы.");
    // Отправляем клиенту сообщение о завершении выбора
    return { allImagesSelected: true };
  }
  const randomImage = availableImages[Math.floor(Math.random() * availableImages.length)];
  usedImages.add(randomImage.path);

  // Выводим в консоль список использованных изображений
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
        // Добавляем нового игрока
        ws.name = data.name;
        clients.push(ws);

        // Рассылаем обновлённый список игроков
        broadcastPlayers();
      } else if (data.type === "setRole") {
        if (data.role === "Ведущий") {
          leader = ws; // Устанавливаем текущего ведущего
        } else if (data.role === "Игрок" && leader === ws) {
          leader = null; // Сбрасываем ведущего
        }

        // Рассылаем обновление роли всем клиентам
        broadcastRole();
      } else if (data.type === "requestImage") {
        // Отправляем случайное изображение
        const { image, allImagesSelected } = getRandomImage();
        
        if (allImagesSelected) {
          ws.send(
            JSON.stringify({
              type: "allImagesSelected",
              message: "Все изображения были выбраны.",
            })
          );
        } else {
          ws.send(
            JSON.stringify({
              type: "newImage",
              image: image.path, // Отправляем путь без "public"
              folder: image.folder,
            })
          );
        }
      } else if (data.type === "drawing") {
        console.log("Получен рисунок от клиента");

        // Рассылаем рисунок всем клиентам
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

  // Обработка отключения клиента
  ws.on("close", () => {
    console.log("Клиент отключился");
    clients = clients.filter((client) => client !== ws);
    if (leader === ws) {
      leader = null; // Сбрасываем ведущего, если он отключился
    }

    // Уведомляем всех клиентов об обновлении
    broadcastPlayers();
    broadcastRole();
  });

  ws.on("error", (error) => {
    console.error("Ошибка соединения:", error);
  });
  

  ws.on("message", (message) => {
    try {
      const decodedMessage = message.toString(); // Преобразуем буфер в строку
      console.log("Получено сообщение от клиента:", decodedMessage); // Логируем строку
  
      const data = JSON.parse(decodedMessage); // Парсим JSON
      // (остальная обработка сообщений)
    } catch (err) {
      console.error("Ошибка обработки сообщения:", err);
    }
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

console.log(`WebSocket сервер запущен на порту ${PORT}`);
