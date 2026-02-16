// PIN pad component for secure PIN entry

import { useState } from 'react';
import { Delete } from 'lucide-react';
import Button from './Button';

interface PinPadProps {
  onComplete: (pin: string) => void;
  maxLength?: number;
}

export default function PinPad({ onComplete, maxLength = 4 }: PinPadProps) {
  const [pin, setPin] = useState('');

  const handleNumberClick = (num: string) => {
    if (pin.length < maxLength) {
      const newPin = pin + num;
      setPin(newPin);
      if (newPin.length === maxLength) {
        onComplete(newPin);
      }
    }
  };

  const handleDelete = () => {
    setPin(pin.slice(0, -1));
  };

  const handleClear = () => {
    setPin('');
  };

  const numbers = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'delete'];

  return (
    <div className="w-full max-w-sm mx-auto">
      {/* PIN display */}
      <div className="mb-6 flex justify-center gap-3">
        {Array.from({ length: maxLength }).map((_, index) => (
          <div
            key={index}
            className="w-14 h-14 rounded-lg border-2 border-primark-grey/30 flex items-center justify-center bg-white"
          >
            {pin[index] && (
              <div className="w-3 h-3 rounded-full bg-primark-navy" />
            )}
          </div>
        ))}
      </div>

      {/* Number pad */}
      <div className="grid grid-cols-3 gap-3">
        {numbers.map((num, index) => {
          if (num === '') {
            return <div key={index} />;
          }

          if (num === 'delete') {
            return (
              <button
                key={index}
                onClick={handleDelete}
                disabled={pin.length === 0}
                className="h-16 bg-primark-light-grey rounded-lg flex items-center justify-center hover:bg-primark-grey/20 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
              >
                <Delete size={24} className="text-primark-navy" />
              </button>
            );
          }

          return (
            <button
              key={num}
              onClick={() => handleNumberClick(num)}
              disabled={pin.length >= maxLength}
              className="h-16 bg-white border-2 border-primark-grey/30 rounded-lg text-2xl font-semibold text-primark-navy hover:bg-primark-light-blue hover:border-primark-blue active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
            >
              {num}
            </button>
          );
        })}
      </div>

      {/* Clear button */}
      {pin.length > 0 && (
        <Button
          variant="outline"
          onClick={handleClear}
          className="w-full mt-4"
        >
          Clear
        </Button>
      )}
    </div>
  );
}
