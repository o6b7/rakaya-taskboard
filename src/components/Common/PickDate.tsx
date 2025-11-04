import React, { useState } from "react";
import DatePicker from "react-datepicker";
import { Calendar } from "lucide-react";
import { format } from "date-fns";

interface PickDateProps {
  value: Date | null;
  onChange: (date: Date | null) => void;
  label?: string;
  minDate?: Date;
  maxDate?: Date;
}

const PickDate: React.FC<PickDateProps> = ({
  value,
  onChange,
  label,
  minDate,
  maxDate,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="flex flex-col w-full">
      {label && (
        <label className="text-sm font-medium text-gray-700 mb-1">{label}</label>
      )}
      <div
        className={`relative flex items-center justify-between px-3 py-2 border rounded-lg cursor-pointer transition-all ${
          isOpen ? "ring-2 ring-blue-400 border-blue-400" : "hover:border-gray-400"
        }`}
        onClick={() => setIsOpen((prev) => !prev)}
      >
        <span className="text-sm text-gray-700">
          {value ? format(value, "dd MMM yyyy") : "Select date"}
        </span>
        <Calendar className="text-gray-500" size={18} />
      </div>

      {isOpen && (
        <div className="absolute z-50 mt-2 bg-white shadow-lg border rounded-lg">
          <DatePicker
            inline
            selected={value}
            onChange={(date) => {
              onChange(date);
              setIsOpen(false);
            }}
            minDate={minDate}
            maxDate={maxDate}
          />
        </div>
      )}
    </div>
  );
};

export default PickDate;
