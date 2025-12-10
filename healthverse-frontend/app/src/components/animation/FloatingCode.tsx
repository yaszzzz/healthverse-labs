"use client";
import { useEffect, useState, useRef } from "react";

const solidityCode = `
pragma solidity ^0.8.20;

contract HealthVerse {
    struct Record {
        uint256 id;
        string dataHash;
        uint256 timestamp;
    }

    mapping(address => Record[]) private records;

    event RecordAdded(address indexed user, uint256 recordId);

    function addRecord(string memory _dataHash) public {
        uint256 newId = records[msg.sender].length + 1;

        records[msg.sender].push(
            Record({
                id: newId,
                dataHash: _dataHash,
                timestamp: block.timestamp
            })
        );

        emit RecordAdded(msg.sender, newId);
    }

    function getRecords(address _user) public view returns (Record[] memory) {
        return records[_user];
    }
}
`;

interface AutoTypeSolidityProps {
  containerRef?: React.RefObject<HTMLElement | null>;
}

export default function AutoTypeSolidity({ containerRef }: AutoTypeSolidityProps) {
  const [text, setText] = useState("");
  const [i, setI] = useState(0);
  const [restart, setRestart] = useState(false);
  const preRef = useRef<HTMLPreElement>(null);

  // Auto-type effect
  useEffect(() => {
    const typeSpeed = 40;

    if (restart) {
      const timeout = setTimeout(() => {
        setText("");
        setI(0);
        setRestart(false);
      }, 800);
      return () => clearTimeout(timeout);
    }

    const interval = setInterval(() => {
      setText(solidityCode.slice(0, i));
      setI(i + 1);

      if (i >= solidityCode.length) {
        setRestart(true);
      }
    }, typeSpeed);

    return () => clearInterval(interval);
  }, [i, restart]);

  // Adjust font size based on container height
  useEffect(() => {
    const adjustFontSize = () => {
      if (!preRef.current) return;
      
      let containerHeight;
      
      if (containerRef?.current) {
        // Jika ada containerRef, gunakan tinggi container
        containerHeight = containerRef.current.clientHeight;
      } else {
        // Fallback ke viewport height
        containerHeight = window.innerHeight;
      }
      
      // Calculate font size based on container height
      const baseFontSize = Math.max(8, Math.min(14, containerHeight / 70));
      const lineHeight = baseFontSize * 1.4;
      
      preRef.current.style.fontSize = `${baseFontSize}px`;
      preRef.current.style.lineHeight = `${lineHeight}px`;
    };

    adjustFontSize();
    window.addEventListener('resize', adjustFontSize);
    
    return () => window.removeEventListener('resize', adjustFontSize);
  }, [containerRef]);

  return (
    <div className="w-full h-full flex items-center justify-center p-2">
      <pre 
        ref={preRef}
        className="
          whitespace-pre-wrap 
          text-[#E8E3EE]
          font-mono 
          transition-all 
          duration-300
          max-w-full
          max-h-full
          overflow-hidden
        "
        style={{
          fontSize: '12px',
          lineHeight: '16px'
        }}
      >
        {text}
        <span className="animate-pulse">|</span>
      </pre>
    </div>
  );
}