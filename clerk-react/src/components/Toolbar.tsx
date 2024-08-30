import React from 'react';
import Button from '@mui/material/Button';
import { useDispatch } from 'react-redux';
import { formatCell } from '../redux/spreadsheetActions';

const Toolbar: React.FC = () => {
  const dispatch = useDispatch();

  const handleFormat = (formatType: string) => {
    dispatch(formatCell(formatType)); // Dispatch format action
  };

  return (
    <div className="toolbar">
      <Button onClick={() => handleFormat('bold')}>Bold</Button>
      <Button onClick={() => handleFormat('italic')}>Italic</Button>
      <Button onClick={() => handleFormat('underline')}>Underline</Button>
      <Button onClick={() => handleFormat('bgColor')}>Background Color</Button>
    </div>
  );
};

export default Toolbar;
