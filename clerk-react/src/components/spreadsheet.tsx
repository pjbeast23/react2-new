import React, { useEffect, useState } from 'react';
import io from 'socket.io-client';
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
    Array.from({ length: 10 }, () =>
      Array(10).fill({ value: '', style: {} })
    )
  );
  const [currentStyle, setCurrentStyle] = useState<React.CSSProperties>({});

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

  // Listening for events from the server
  useEffect(() => {
    socket.on('connect', () => {
      console.log('Connected to WebSocket server');
    });

    socket.on('loadSpreadsheet', (data: { value: string; style: React.CSSProperties }[][]) => {
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

  // Update cell value and style
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>, row: number, col: number) => {
    const value = e.target.value;

    setGrid((prevGrid) => {
      const newGrid = [...prevGrid];
      newGrid[row] = [...newGrid[row]];
      newGrid[row][col] = { value, style: currentStyle };
      return newGrid;
    });

    // Emit the change to the server
    socket.emit('updateCell', { row, col, value, style: currentStyle });
  };

  return (
    <div>
      <div className="toolbar">
        <button onClick={toggleBold}>Bold</button>
        <button onClick={toggleItalic}>Italic</button>
        <button onClick={toggleUnderline}>Underline</button>
        <button onClick={() => changeBackgroundColor('yellow')}>Yellow Background</button>
        <button onClick={() => changeBackgroundColor('white')}>Normal Background</button>
        {/* Add more buttons for different colors or styles as needed */}
      </div>
      <table>
        <tbody>
          {grid.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {row.map((cell, colIndex) => (
                <td key={colIndex}>
                  <input
                    type="text"
                    value={cell.value}
                    style={cell.style}
                    onChange={(e) => handleChange(e, rowIndex, colIndex)}
                  />
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
