import { useState } from "react";

export default function HelpButton({ params }: { params: { type: number } }) {
  const instructions: Record<number, string> = {
    2: "Опиши изображение, но ты не можешь говорить существительные. Вместо них используй слова 'Штука' (для предметов) или 'Существо' (для живых существ)",
    3: "Посмотри на изображение, постарайся запомнить его детали, а затем нарисуй его по памяти",
    4: "Используй своё воображение, придумай что-то необычное или интересное, а затем нарисуй это так, как ты это представляешь",
    5: "Посмотри внимательно на изображение, постарайся запомнить все детали, а затем расскажи максимально подробно, что именно ты видел",
    6: "Тебе будут задавать вопросы. Попытайся объяснить изображение, но отвечай только короткими фразами: 'да', 'нет' или 'не имеет значения'. Избегай других слов или пояснений",
  };

  const [isModalVisible, setModalVisible] = useState(false);

  const handleClick = () => {
    setModalVisible(!isModalVisible);
  };

  return (
    <div>
      {/* Круглая кнопка */}
      <button
        onClick={handleClick}
        style={{
          width: "40px",
          height: "40px",
          borderRadius: "50%",
          backgroundColor: "#0070f3",
          color: "#fff",
          border: "none",
          fontSize: "20px",
          cursor: "pointer",
        }}
      >
        ?
      </button>

      {/* Модальное окно с пояснением */}
      {isModalVisible && (
        <div
          style={{
            position: "absolute",
            top: "60px",
            left: "50%",
            transform: "translateX(-50%)",
            backgroundColor: "#fff",
            border: "1px solid #ccc",
            borderRadius: "8px",
            padding: "10px",
            boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
            zIndex: 1000,
          }}
        >
          <p style={{ margin: 0, fontSize: "20px" }}>{instructions[params.type]}</p>
          <button
            onClick={handleClick}
            style={{
              marginTop: "10px",
              padding: "5px 10px",
              backgroundColor: "#0070f3",
              color: "#fff",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            Закрыть
          </button>
        </div>
      )}
    </div>
  );
}
