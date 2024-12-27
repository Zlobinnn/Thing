import React from 'react';

type CellProps = {
    id: number;
    onClick: (id: number) => void;
    value: string | null; // X, O или null
  };
  
  function Cell({ id, onClick, value }: CellProps) {
    return (
      <div className='cell'>
      <button
        onClick={() => onClick(id)}
        className="cell"
        style={{
          width: "100px",
          height: "100px",
          fontSize: "24px",
          border: "1px solid #000",
        }}
      >
        {value}
      </button>
      </div>
    );
  }
  
  export default Cell;