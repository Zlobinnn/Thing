"use client";
import React, { useState, useRef } from "react";
import Image from "next/image";
import styles from "./Area.module.css";

export default function Area() {
  const [isModalOpen, setIsModalOpen] = useState(false); // Управление модальным окном
  const [scale, setScale] = useState(1); // Масштаб изображения
  const [position, setPosition] = useState({ x: 0, y: 0 }); // Позиция изображения
  const isDragging = useRef(false); // Состояние перетаскивания
  const dragStart = useRef({ x: 0, y: 0 }); // Начальные координаты при перетаскивании

  const handleOpenModal = () => {
    setIsModalOpen(true);
    setScale(1); // Сброс масштаба при открытии
    setPosition({ x: 0, y: 0 }); // Сброс позиции при открытии
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    // Изменение масштаба (зумирование)
    e.preventDefault();
    const newScale = scale + e.deltaY * -0.001; // Увеличиваем или уменьшаем масштаб
    setScale(Math.min(Math.max(newScale, 0.5), 5)); // Ограничиваем масштаб от 0.5 до 5
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return; // Проверяем, что нажата именно левая кнопка мыши (button: 0)
    isDragging.current = true;
    dragStart.current = { x: e.clientX - position.x, y: e.clientY - position.y };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current) return; // Если не перетаскиваем, ничего не делаем
    setPosition({
      x: e.clientX - dragStart.current.x,
      y: e.clientY - dragStart.current.y,
    });
  };

  const handleMouseUp = () => {
    isDragging.current = false; // Останавливаем перетаскивание
  };

  const handleDragStart = (e: React.DragEvent) => {
    e.preventDefault(); // Останавливаем стандартное поведение перетаскивания
  };

  return (
    <div className={styles.area}>
      {/* Основное изображение */}
      <Image
        src="/board.png"  // Путь к картинке
        alt="Board"
        width={1000}
        height={1000}
        className={styles.image}
        onClick={handleOpenModal}
        draggable={false}  // Запрещаем стандартное поведение перетаскивания
      />

      {/* Модальное окно */}
      {isModalOpen && (
        <div
          className={styles.modal}
          onWheel={handleWheel}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}  // Останавливаем перетаскивание, если курсор покидает модальное окно
        >
          <div
            className={styles.modalContent}
            style={{
              transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
            }}
            onMouseDown={handleMouseDown}  // Старт перетаскивания
            onDragStart={handleDragStart}  // Запрещаем стандартное поведение перетаскивания
          >
            <Image src="/board.png" alt="Board" width={2200} height={2200} />
          </div>
          <button className={styles.closeButton} onClick={handleCloseModal}>
            Закрыть
          </button>
        </div>
      )}
    </div>
  );
}
