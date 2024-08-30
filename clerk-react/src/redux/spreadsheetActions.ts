export const UPDATE_CELL = 'UPDATE_CELL';
export const FORMAT_CELL = 'FORMAT_CELL';

export const updateCell = (row: number, col: number, value: string) => ({
  type: UPDATE_CELL,
  payload: { row, col, value },
});

export const formatCell = (formatType: string) => ({
  type: FORMAT_CELL,
  payload: { formatType },
});
