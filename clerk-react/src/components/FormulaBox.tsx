import React, { useState } from 'react';

interface FormulaBoxProps {
  onCompute: (formula: string) => void;
}

const FormulaBox: React.FC<FormulaBoxProps> = ({ onCompute }) => {
  const [formula, setFormula] = useState<string>('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormula(e.target.value);
  };

  const handleCompute = () => {
    onCompute(formula);
  };

  return (
    <div className="formula-box">
      <input
        type="text"
        value={formula}
        onChange={handleChange}
        placeholder="Enter formula"
      />
      <button onClick={handleCompute}>Compute</button>
    </div>
  );
};

export default FormulaBox;
