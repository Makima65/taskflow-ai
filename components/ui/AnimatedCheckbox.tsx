// components/ui/AnimatedCheckbox.tsx
import React from "react";

export function AnimatedCheckbox({ id, checked, onChange, label }: { id: string; checked: boolean; onChange: () => void; label: string }) {
  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        .animated-checkbox-wrapper {
          --text: #3f3f46; 
          --check: #9333ea; 
          --disabled: #a1a1aa; 
          display: grid;
          grid-template-columns: 30px auto;
          align-items: center;
        }
        
        .dark .animated-checkbox-wrapper {
          --text: #d4d4d8; 
          --check: #c084fc; 
          --disabled: #52525b; 
        }

        .animated-checkbox-wrapper label {
          color: var(--text);
          position: relative;
          cursor: pointer;
          display: grid;
          align-items: center;
          width: fit-content;
          transition: color 0.3s ease;
          font-size: 0.875rem; 
        }

        .animated-checkbox-wrapper label::before, 
        .animated-checkbox-wrapper label::after {
          content: "";
          position: absolute;
        }

        .animated-checkbox-wrapper label::before {
          height: 2px;
          width: 8px;
          left: -27px;
          background: var(--check);
          border-radius: 2px;
          transition: background 0.3s ease;
        }

        .animated-checkbox-wrapper label:after {
          height: 4px;
          width: 4px;
          top: 8px;
          left: -25px;
          border-radius: 50%;
        }

        .animated-checkbox-wrapper input[type="checkbox"] {
          -webkit-appearance: none;
          -moz-appearance: none;
          appearance: none;
          position: relative;
          height: 15px;
          width: 15px;
          outline: none;
          border: 0;
          margin: 0 15px 0 0;
          cursor: pointer;
          background: transparent;
          display: grid;
          align-items: center;
        }

        .animated-checkbox-wrapper input[type="checkbox"]::before, 
        .animated-checkbox-wrapper input[type="checkbox"]::after {
          content: "";
          position: absolute;
          height: 2px;
          top: auto;
          background: var(--check);
          border-radius: 2px;
        }

        .animated-checkbox-wrapper input[type="checkbox"]::before {
          width: 0px;
          right: 60%;
          transform-origin: right bottom;
        }

        .animated-checkbox-wrapper input[type="checkbox"]::after {
          width: 0px;
          left: 40%;
          transform-origin: left bottom;
        }

        .animated-checkbox-wrapper input[type="checkbox"]:checked::before {
          animation: check-01 0.4s ease forwards;
        }

        .animated-checkbox-wrapper input[type="checkbox"]:checked::after {
          animation: check-02 0.4s ease forwards;
        }

        .animated-checkbox-wrapper input[type="checkbox"]:checked + label {
          color: var(--disabled);
          animation: move 0.3s ease 0.1s forwards;
        }

        .animated-checkbox-wrapper input[type="checkbox"]:checked + label::before {
          background: var(--disabled);
          animation: slice 0.4s ease forwards;
        }

        .animated-checkbox-wrapper input[type="checkbox"]:checked + label::after {
          animation: firework 0.5s ease forwards 0.1s;
        }

        @keyframes move {
          50% { padding-left: 8px; padding-right: 0px; }
          100% { padding-right: 4px; }
        }

        @keyframes slice {
          60% { width: 100%; left: 4px; }
          100% { width: 100%; left: -2px; padding-left: 0; }
        }

        @keyframes check-01 {
          0% { width: 4px; top: auto; transform: rotate(0); }
          50% { width: 0px; top: auto; transform: rotate(0); }
          51% { width: 0px; top: 8px; transform: rotate(45deg); }
          100% { width: 5px; top: 8px; transform: rotate(45deg); }
        }

        @keyframes check-02 {
          0% { width: 4px; top: auto; transform: rotate(0); }
          50% { width: 0px; top: auto; transform: rotate(0); }
          51% { width: 0px; top: 8px; transform: rotate(-45deg); }
          100% { width: 10px; top: 8px; transform: rotate(-45deg); }
        }

        @keyframes firework {
          0% { opacity: 1; box-shadow: 0 0 0 -2px var(--check), 0 0 0 -2px var(--check), 0 0 0 -2px var(--check), 0 0 0 -2px var(--check), 0 0 0 -2px var(--check), 0 0 0 -2px var(--check); }
          30% { opacity: 1; }
          100% { opacity: 0; box-shadow: 0 -15px 0 0px var(--check), 14px -8px 0 0px var(--check), 14px 8px 0 0px var(--check), 0 15px 0 0px var(--check), -14px 8px 0 0px var(--check), -14px -8px 0 0px var(--check); }
        }
      `}} />
      <div className="animated-checkbox-wrapper">
        <input type="checkbox" id={`checkbox-${id}`} checked={checked} onChange={onChange} />
        <label htmlFor={`checkbox-${id}`}>{label}</label>
      </div>
    </>
  );
}