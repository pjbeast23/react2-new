import React, { useEffect, useState } from 'react';
import io from 'socket.io-client';
import FormulaBox from './FormulaBox';
import '../css/spreadsheet.css'; // Assuming your CSS is in the same directory

interface SpreadsheetProps {}

interface CellUpdate {
  row: number;
  col: number;
  value: string;
  style?: React.CSSProperties;
}

const socket = io('http://localhost:4000');

const Spreadsheet: React.FC<SpreadsheetProps> = () => {
  const [grid, setGrid] = useState<{ value: string; style: React.CSSProperties }[][]>(
    Array.from({ length: 40 }, () =>
      Array(40).fill({ value: '', style: {} })
    )
  );
  const [currentStyle, setCurrentStyle] = useState<React.CSSProperties>({});
  const [searchTerm, setSearchTerm] = useState('');
const [replaceTerm, setReplaceTerm] = useState('');
const [selectedCell, setSelectedCell] = useState<{ row: number; col: number } | null>(null);
const [cellReference, setCellReference] = useState<string>('');


const handleFindReplace = () => {
  setGrid((prevGrid) => {
    const newGrid = prevGrid.map((row) => 
      row.map((cell) => 
        cell.value.includes(searchTerm) 
          ? { ...cell, value: cell.value.replace(searchTerm, replaceTerm) } 
          : cell
      )
    );
    return newGrid;
  });
};


  // Handlers for formatting
  const toggleBold = () => {
    setCurrentStyle((prevStyle) => {
      const newStyle = {
        ...prevStyle,
        fontWeight: prevStyle.fontWeight === 'bold' ? 'normal' : 'bold',
        fontStyle: prevStyle.fontStyle === 'bold' ? 'normal' : 'bold',
      };
      console.log('New style:', newStyle);
      return newStyle;
    });
  };
  

  const toggleItalic = () => {
    setCurrentStyle((prevStyle) => ({
      ...prevStyle,
      fontStyle: prevStyle.fontStyle === 'italic' ? 'normal' : 'italic',
    }));
  };

  const toggleUnderline = () => {
    setCurrentStyle((prevStyle) => ({
      ...prevStyle,
      textDecoration: prevStyle.textDecoration === 'underline' ? 'none' : 'underline',
    }));
  };

  const changeBackgroundColor = (color: string) => {
    setCurrentStyle((prevStyle) => ({
      ...prevStyle,
      backgroundColor: color,
    }));
  };
  const [pendingFormulas, setPendingFormulas] = useState<{ row: number; col: number }[]>([]);

  // Listening for events from the server
  useEffect(() => {
    socket.on('connect', () => {
      console.log('Connected to WebSocket server');
    });

    socket.on('loadSpreadsheet', (data: {  value: string; formula: string; style: React.CSSProperties}[][]) => {
      console.log('Spreadsheet data received:', data);
      setGrid(data);
    });
    socket.on('cellUpdated', ({ row, col, value, style }: CellUpdate) => {
      // Check if row, col, value, and style are valid
      if (typeof row !== 'number' || typeof col !== 'number' || typeof value !== 'string' || typeof style !== 'object') {
        console.error(`Invalid data received: row=${row}, col=${col}, value=${value}, style=${style}`);
        return; // Early exit if the data is not valid
      }
    
      console.log(`Cell updated at [${row}, ${col}] with value: ${value} and style: ${JSON.stringify(style)}`);
    
      // Use a functional update to ensure you are working with the latest state
      setGrid((prevGrid) => {
        // Copy the previous grid to avoid direct mutation
        const newGrid = prevGrid.map((rowArr, rowIndex) =>
          rowIndex === row
            ? rowArr.map((cell, colIndex) =>
                colIndex === col ? { value, style } : cell
              )
            : rowArr
        );
    
        return newGrid; // Return the updated grid
      });
    });

    return () => {
      socket.off('connect');
      socket.off('loadSpreadsheet');
      socket.off('cellUpdated');
    };
  }, []);
const handleCellClick = (row: number, col: number) => {
    setCellReference(`R${row + 1}C${col + 1}`);
  };
const handleClick = (row: number, col: number) => {
    setSelectedCell({ row, col });
  };
  
// Update cell value and style
const handleChange = (e: React.ChangeEvent<HTMLInputElement>, row: number, col: number) => {
  const inputValue = e.target.value;

  setGrid((prevGrid) => {
      const newGrid = [...prevGrid];
      newGrid[row] = [...newGrid[row]];
      newGrid[row][col] = { value: inputValue, style: currentStyle }; // store input directly
      return newGrid;
  });

  // Emit the raw input to the server (for syncing purposes)
  socket.emit('updateCell', { row, col, value: inputValue, style: currentStyle });
  setSelectedCell({ row, col });
};
const computeFormulas = () => {
  console.log('Computing formulas:', pendingFormulas);
  setGrid((prevGrid) => {
    const newGrid = [...prevGrid];
    pendingFormulas.forEach(({ row, col }) => {
      const cell = newGrid[row][col];
      const cellValue = cell.value.trim();

      // Check if the cell value ends with '='
      if (cellValue.endsWith('=')) {
        const formula = cellValue.slice(0, -1).trim(); // Remove trailing '='
        let computedValue = cellValue;

        // Simple validation: ensure the formula only contains numbers and operators
        const validFormula = /^[0-9+\-*/().\s]+$/.test(formula);

        if (validFormula) {
          try {
            // Evaluate the formula
            const evaluatedValue = eval(formula);
            if (evaluatedValue !== undefined && (typeof evaluatedValue === 'number' || typeof evaluatedValue === 'string')) {
              computedValue = evaluatedValue.toString();
            } else {
              computedValue = 'ERROR';
            }
          } catch (error) {
            console.error('Error evaluating formula:', error);
            computedValue = 'ERROR';
          }
        } else {
          computedValue = 'ERROR';
        }

        newGrid[row][col] = { ...cell, value: computedValue };
      } else {
        // If the cell does not end with '=', keep the cell value unchanged
        newGrid[row][col] = { ...cell };
      }
    });

    // Clear pending formulas after evaluation
    setPendingFormulas([]);
    return newGrid;
  });
};
const computeFormula = (formula: string) => {
  if (selectedCell) {
    const { row, col } = selectedCell;
    setGrid((prevGrid) => {
      const newGrid = [...prevGrid];
      let computedValue = '';

      try {
        // Evaluate the formula only if it ends with '='
        if (formula.trim().endsWith('=')) {
          const formulaWithoutEquals = formula.slice(0, -1).trim();
          computedValue = evalFormula(formulaWithoutEquals, prevGrid);
        }
      } catch (error) {
        computedValue = 'ERROR';
      }

      newGrid[row][col] = { ...newGrid[row][col], value: computedValue };
      return newGrid;
    });

    socket.emit('updateCell', { row: selectedCell.row, col: selectedCell.col, value: computedValue, style: currentStyle });
  }
};

const evalFormula = (formula: string, grid: { value: string; style: React.CSSProperties }[][]) => {
  // Replace cell references with actual values from the grid
  const replacedFormula = formula.replace(/[A-J][1-9]/g, (match) => {
    const col = match.charCodeAt(0) - 'A'.charCodeAt(0);
    const row = parseInt(match.slice(1), 10) - 1;
    return grid[row][col].value || '0'; // Default to '0' if value is empty
  });

  // Use eval to calculate the result
  try {
    return eval(replacedFormula).toString();
  } catch {
    return 'ERROR';
  }
};
const computeFormulaForCell = (row: number, col: number) => {
  setGrid((prevGrid) => {
    const newGrid = [...prevGrid];
    const cell = newGrid[row][col];
    const formula = cell.value.trim();

    // Check if formula ends with '='
    if (formula.endsWith('=')) {
      const expression = formula.slice(0, -1).trim(); // Remove the trailing '='
      let computedValue = cell.value;

      // Validate the formula
      const validFormula = /^[0-9+\-*/().\s]+$/.test(expression);

      if (validFormula) {
        try {
          const evaluatedValue = eval(expression);
          if (evaluatedValue !== undefined && (typeof evaluatedValue === 'number' || typeof evaluatedValue === 'string')) {
            computedValue = evaluatedValue.toString();
          } else {
            computedValue = 'ERROR';
          }
        } catch (error) {
          console.error('Error evaluating formula:', error);
          computedValue = 'ERROR';
        }
      } else {
        computedValue = 'ERROR';
      }

      newGrid[row][col] = { ...cell, value: computedValue };
    }

    return newGrid;
  });
};

// Call this function on button click if there's a selected cell
const handleComputeButtonClick = () => {
  if (selectedCell) {
    computeFormulaForCell(selectedCell.row, selectedCell.col);
  }
};


const columnToLetter = (column: number): string => {
  let letter = '';
  while (column >= 0) {
    letter = String.fromCharCode((column % 26) + 65) + letter;
    column = Math.floor(column / 26) - 1;
  }
  return letter;
};


  return (
    <div>
      <div className="toolbar">
      <div className="cell-reference">
        {cellReference} {/* Display cell reference */}
      </div>
        <button onClick={toggleBold}>Bold</button>
        <button onClick={toggleItalic}>Italic</button>
        <button onClick={toggleUnderline}>Underline</button>
        <button onClick={() => changeBackgroundColor('yellow')}>Yellow Background</button>
        <button onClick={() => changeBackgroundColor('white')}>Normal Background</button>
        {/* <FormulaBox onCompute={computeFormula} /> */}
        <button onClick={handleComputeButtonClick}>Compute Formula</button>
        <input 
        type="text" 
        placeholder="Find" 
        value={searchTerm} 
        onChange={(e) => setSearchTerm(e.target.value)} 
      />
      <input 
        type="text" 
        placeholder="Replace" 
        value={replaceTerm} 
        onChange={(e) => setReplaceTerm(e.target.value)} 
      />
      <button onClick={handleFindReplace}>Find & Replace</button>
      
        {/* Add more buttons for different colors or styles as needed */}
      </div>
      <table>
  <thead>
    <tr>
      {Array.from({ length: 40 }, (_, index) => (
        <th key={index}>{columnToLetter(index)}</th>
      ))}
    </tr>
  </thead>
  <tbody>
    {grid.map((row, rowIndex) => (
      <tr key={rowIndex}>
        {row.map((cell, colIndex) => (
          <td key={colIndex} style={{position : 'relative'}}>
            <input
              type="text"
              value={cell.value}
              style={cell.style}
              onChange={(e) => handleChange(e, rowIndex, colIndex)}
              onClick={() => setSelectedCell({ row: rowIndex, col: colIndex })}
            />
            {selectedCell?.row === rowIndex && selectedCell?.col === colIndex && (
              <div style={{ opacity: 0.4, position: 'absolute', top: 0, right: 0, padding: '2px', backgroundColor: '#f0f0f0', border: '1px solid #ddd', fontSize: '12px' }}>
                {`${columnToLetter(colIndex)}${rowIndex + 1}`}
              </div>
            )}
          </td>
        ))}
      </tr>
    ))}
  </tbody>
</table>


    </div>
  );
};

export default Spreadsheet;
