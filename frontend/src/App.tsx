import React, { useState, useEffect, useRef } from "react";
import SidePanel from "./SidePanel.tsx";
import Graph1 from "./Graph1.tsx";
import Graph2 from "./Graph2.tsx";
import Graph3 from "./Graph3.tsx";
import Home from "./Home.tsx";
import "./style/App.css";

const App: React.FC = () => {
    const [selectedDatasetId, setSelectedDatasetId] = useState("");
    const [datasetIds, setDatasetIds] = useState<string[]>([]);
    const [isSidePanelOpen, setIsSidePanelOpen] = useState(false);
    const sidePanelRef = useRef<HTMLDivElement | null>(null);
    const [activePage, setActivePage] = useState("Graph2");

    const openSidePanel = () => {
        if (isSidePanelOpen)
            setIsSidePanelOpen(false); 
        else
            setIsSidePanelOpen(true); 
    };

    useEffect(() => {
        const handleClickOutside = (event) => {
          if (sidePanelRef.current && !sidePanelRef.current.contains(event.target)) {
            setIsSidePanelOpen(false);
          }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
          document.removeEventListener("mousedown", handleClickOutside);
        };
      }, []);

      const handleAddDataset = (id: string, file: File) => {
        // TODO: add dataset
        const newId = id;
        setDatasetIds([...datasetIds, newId]);
    };

    const handleRemoveDataset = (id: string) => {
      // TODO: remove dataset 
      setDatasetIds((prev) => prev.filter((datasetId) => datasetId !== id));
    };

  return (
    <div id="App">
        <i className={`fa-solid fa-chevron-down ${isSidePanelOpen ? "shifted" : ""}`} onClick={openSidePanel}></i>



        <div className={`slidePanel ${isSidePanelOpen ? "shifted" : ""}`} ref={sidePanelRef}>
          <SidePanel setActivePage={setActivePage} />
        </div>

        <div id="contentWrapper" className={isSidePanelOpen ? "shifted" : ""}>
            {activePage !== "Home" && (
              <div>
              {/* <label htmlFor="selectedDatasetDropdown">Dataset: </label> */}
              <select className="selectedDatasetDropdown" value={selectedDatasetId} onChange={(e) => setSelectedDatasetId(e.target.value)}>
                  <option value="" disabled>Dataset Selected</option>
                  {datasetIds.map((id) => (
                      <option key={id} value={id}>{id}</option>
                  ))}
              </select>
              </div>
            )}

            {activePage === "Home" && (
              <div className="page homePage">
                <div id="header">
                  <h1>Section Insights</h1>
                </div>
                <hr />
                <Home datasetIds={datasetIds} onAddDataset={handleAddDataset} onRemoveDataset={handleRemoveDataset}></Home>
              </div>
            )}

            {activePage === "Graph1" && (
              <div className="page graph1Page">
                <div id="header">
                  <h1>Graph 1</h1>
                </div>
                <hr /><br></br>
                <Graph1 datasetId={selectedDatasetId}></Graph1>
              </div>
            )}

            {activePage === "Graph2" && (
              <div className="page graph2Page">
                <div id="header">
                  <h1>Graph 2</h1>
                </div>
                <hr /><br></br>
                <Graph2 datasetId={selectedDatasetId}></Graph2>
              </div>
            )}

            {activePage === "Graph3" && (
              <div className="page graph3Page">
                <div id="header">
                  <h1>Graph 3</h1>
                </div>
                <hr /><br></br>
                <Graph3 datasetId={selectedDatasetId}></Graph3>
              </div>
            )}
          </div>
    </div>
  );
};

export default App;
