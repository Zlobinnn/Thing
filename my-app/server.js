const WebSocket = require("ws");

const PORT = 8080;
const server = new WebSocket.Server({ port: PORT });

let clients = [];

server.on("connection", (ws) => {
  console.log("Новый клиент подключился!");

  // Добавляем клиента в список
  clients.push(ws);

  // Обработка сообщений от клиента
  ws.on("message", (message) => {
    try {
      const data = JSON.parse(message);

      if (data.type === "drawing") {
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
  });

  ws.on("error", (error) => {
    console.error("Ошибка соединения:", error);
  });
});

console.log(`WebSocket сервер запущен на порту ${PORT}`);
