import React from "react";

// Code 39 character pattern mapping (1 = bar, 0 = space)
const CODE39_MAP = {
  '0': '101001101101', '1': '110100101011', '2': '101100101011', '3': '110110010101',
  '4': '101001101011', '5': '110100110101', '6': '101100110101', '7': '101001011011',
  '8': '110100101101', '9': '101100101101', 'A': '110101001011', 'B': '101101001011',
  'C': '110110100101', 'D': '101011001011', 'E': '110101100101', 'F': '101101100101',
  'G': '101010011011', 'H': '110101001101', 'I': '101101001101', 'J': '101011001101',
  'K': '110101010011', 'L': '101101010011', 'M': '110110101001', 'N': '101011010011',
  'O': '110101101001', 'P': '101101101001', 'Q': '101010110011', 'R': '110101011001',
  'S': '101101011001', 'T': '101011011001', 'U': '110010101011', 'V': '100110101011',
  'W': '110011010101', 'X': '100101101011', 'Y': '110010110101', 'Z': '100110110101',
  '-': '100101011011', '.': '110010101101', ' ': '100110101101', '*': '100101101101'
};

export default function BarcodeGenerator({ value = "MALAABIS", height = 40, widthScale = 1.8, className = "" }) {
  // Sanitize the input value to uppercase, keep only valid Code39 characters
  const rawVal = value.toUpperCase();
  let cleanVal = "";
  for (let char of rawVal) {
    if (CODE39_MAP[char]) {
      cleanVal += char;
    }
  }

  // Code39 starts and ends with "*"
  const fullString = `*${cleanVal}*`;
  
  // Build the binary string of bars and spaces
  let binaryString = "";
  for (let i = 0; i < fullString.length; i++) {
    const pattern = CODE39_MAP[fullString[i]];
    binaryString += pattern;
    if (i < fullString.length - 1) {
      binaryString += "0"; // gap between characters
    }
  }

  const barWidth = widthScale;
  const totalWidth = binaryString.length * barWidth;

  return (
    <div className={`flex flex-col items-center p-2 bg-white rounded-lg ${className}`}>
      <svg
        width={totalWidth}
        height={height}
        viewBox={`0 0 ${totalWidth} ${height}`}
        className="w-full h-auto"
      >
        {binaryString.split("").map((bit, idx) => {
          if (bit === "1") {
            return (
              <rect
                key={idx}
                x={idx * barWidth}
                y={0}
                width={barWidth}
                height={height}
                fill="#000000"
              />
            );
          }
          return null;
        })}
      </svg>
      <span className="text-[#353535] font-sans text-[10px] font-bold tracking-widest mt-1">
        {cleanVal}
      </span>
    </div>
  );
}
