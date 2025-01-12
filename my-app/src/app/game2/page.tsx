"use client";
import React, { useState, useEffect } from "react";
import styles from "./page.module.css";
import Header from "../components/header";
import Task from "./task";
import Drawing from "./drawing";

interface ServerData{
    type: string;
    players: string[];
    answers: string[];
}

export default function Game(){
    // const [squares, setSquares] = useState([{}]);
    const [task, setTask] = useState("Задание");
    const [isTextRound, setIsTextRound] = useState(false);
    const [isGuessing, setIsGuessing] = useState(true);
    const [playersData, setPlayersData] = useState<{ player: String; answer: String}[]>([]);
    const [selectedPlayer, setSelectedPlayer] = useState(-1);

    useEffect(() => {
        // !!! Сделать логику получения запроса
        const data = {
            "task": "Тестовое задание",
            "players": ["Савок", "Мешок", "ДенДен", "Данёк"],
            "answers": ["Хуй", "Пизда"]
          };
          const combinedData = data.players.map((player, index) => ({
            player,
            answer: data.answers[index],
          }));
          setPlayersData(combinedData);
          setTask(data.task);
    }, []);

    const squareClick = (index: number) => {
        setSelectedPlayer(index);
    }

    const changeClick = () => {
        setIsGuessing(!isGuessing);
        setIsTextRound(!isTextRound);
    }

    return(
    <div>
        <div className={styles.timer}>timer</div>
        <Header ws={null}/>
        <div className={styles.noselect}>
            <h3 onClick={changeClick}>{task}</h3>
            {isGuessing && (<div className={styles.squaresContainer}>
            {playersData.map(({player, answer}, index) => (
                <div onClick={() => squareClick(index)} key={index} className={styles.square}>
                    <div className={`${styles.squareBox} ${index === selectedPlayer ? styles.selected : ""}`}>
                        <p className={styles.squareInnerText}>{answer}</p>
                    </div>
                    <p className={styles.squareName}>{player}</p>
                </div>
            ))}
            </div>)}

            {isTextRound&&(<Task role="Жулик"/>)}

            <Drawing role="Жулик"/>
        </div>
    </div>
    )
}