import React from "react";
import "./style/SidePanel.css";

const SidePanel: React.FC<{ setActivePage: (page: string) => void }> = ({ setActivePage }) => {


  return (
        <div>
      <ul className="clickable-list">
        <li className="clickable-item home" onClick={() => setActivePage("Home")}>Home</li>
        <li className="clickable-item" onClick={() => setActivePage("Graph1")}>Average by Department</li>
        <li className="clickable-item" onClick={() => setActivePage("Graph2")}>Course Average throughout the Year</li>
        <li className="clickable-item" onClick={() => setActivePage("Graph3")}>Percentage Failing by Instructor</li>
      </ul>
    </div>
  );
};

export default SidePanel;
