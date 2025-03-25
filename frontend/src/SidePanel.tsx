import React from "react";
import "./style/SidePanel.css";

const SidePanel: React.FC<{ setActivePage: (page: string) => void }> = ({ setActivePage }) => {


  return (
        <div>
      <ul className="clickable-list">
        <li className="clickable-item" onClick={() => setActivePage("Home")}>Home</li>
        <li className="clickable-item" onClick={() => setActivePage("Graph1")}>Graph 1</li>
        <li className="clickable-item" onClick={() => setActivePage("Graph2")}>Graph 2</li>
        <li className="clickable-item" onClick={() => setActivePage("Graph3")}>Graph 3</li>
      </ul>
    </div>
  );
};

export default SidePanel;
