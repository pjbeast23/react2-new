import { UPDATE_CELL, FORMAT_CELL } from './spreadsheetActions';

interface CellState {
  value: string;
  format: {
    bold: boolean;
    italic: boolean;
    underline: boolean;
    bgColor: string;
  };
}

const initialState: CellState[][] = Array.from({ length: 10 }, () =>
  Array(10).fill({ value: '', format: { bold: false, italic: false, underline: false, bgColor: '' } })
);

const spreadsheetReducer = (state = initialState, action: any) => {
  switch (action.type) {
    case UPDATE_CELL:
      const { row, col, value } = action.payload;
      return state.map((rowArr, rowIndex) =>
        rowIndex === row
          ? rowArr.map((cell, colIndex) =>
              colIndex === col ? { ...cell, value } : cell
            )
          : rowArr
      );
    case FORMAT_CELL:
      // Implement format handling here
      return state;
    default:
      return state;
  }
};

export default spreadsheetReducer;
