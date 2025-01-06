import React from "react";
import { WiMoonAltWaningCrescent5 } from "react-icons/wi";
import { TbPencil } from "react-icons/tb";
import { useEffect } from "react";

interface HeaderProps{
    ws: WebSocket | null;
}

export default function Header({ ws }: HeaderProps) {
    const getTheme = () => {
        const theme = localStorage.getItem("theme");
        if (theme){
            document.body.classList.toggle(theme);
            const playerListElements = document.getElementsByClassName("playerList");
            playerListElements[0].classList.toggle(theme);

            const playerListElements1 = document.getElementsByClassName("modalContent");
            if (playerListElements1[0]){
            playerListElements1[0].classList.toggle(theme);}
        }
    }
    const setName = () => {
        if (!ws) return;
        const playerName = prompt("Введите новое имя:") || `Игрок-${Math.floor(Math.random() * 1000)}`;
        ws.send(
          JSON.stringify({
            type: "rename",
            name: playerName,
          })
        );
    }
    const themeClick = () => {
        document.body.classList.toggle("night-theme");
        
        const playerListElements = document.getElementsByClassName("playerList");
        playerListElements[0].classList.toggle("night-theme");

        const playerListElements1 = document.getElementsByClassName("modalContent");
        if(playerListElements1[0])
        playerListElements1[0].classList.toggle("night-theme");

        const theme = localStorage.getItem("theme");

        if (theme==="night-theme"){
            localStorage.setItem("theme","");
        }
        else {localStorage.setItem("theme","night-theme");}
    }

    useEffect(() => {
        getTheme();
    }, []);

  return (
    <div className="header">
      <TbPencil className="editName-icon" onClick={setName}/>
      <WiMoonAltWaningCrescent5 className="theme-icon" onClick={themeClick}/>
    </div>
  );
}
