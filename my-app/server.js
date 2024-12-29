const WebSocket = require("ws");

const PORT = 8080;
const server = new WebSocket.Server({ port: PORT });

let clients = [];
let leader = null; // Текущий ведущий

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
