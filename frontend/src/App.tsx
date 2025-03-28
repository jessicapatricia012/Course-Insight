import React, { useState, useEffect, useRef } from "react";
import SidePanel from "./SidePanel.tsx";
import Graph1 from "./Graph1.tsx";
import Graph2 from "./Graph2.tsx";
import Graph3 from "./Graph3.tsx";
import Home from "./Home.tsx";
import "./style/App.css";
import request from "supertest";
import {expect} from "chai";
import {StatusCodes} from "http-status-codes";

const App: React.FC = () => {
    const [selectedDatasetId, setSelectedDatasetId] = useState("");
    const [datasetIds, setDatasetIds] = useState<string[]>([]);
    const [isSidePanelOpen, setIsSidePanelOpen] = useState(false);
    const sidePanelRef = useRef<HTMLDivElement | null>(null);
    const [activePage, setActivePage] = useState("Home");

    const openSidePanel = () => {
        if (isSidePanelOpen)
            setIsSidePanelOpen(false);
        else
            setIsSidePanelOpen(true);
    };

    useEffect(() => {
        const fetchDataOnLoad = async () => {
          const url = `http://localhost:4321/datasets`;
          try {
              const res = await fetch(url, {
                  method: "GET"
              });
  
              if(!res.ok){
                  const {error} = await res.json();
                  throw new Error (`${res.status}: ${error}`);
              }
              const {result} = await res.json();
              const ids = result.map((dataset: any) => dataset.id); 
              setDatasetIds(ids);
          } catch (err){
              throw err;//display this error somehow
              //console.log(`Error adding dataset: ${err}`);
          }        
        }
        fetchDataOnLoad();

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

    const handleAddDataset = async (id: string, file: File) => {
        // TODO: add dataset with id and File
		const url = `http://localhost:4321/dataset/${id}/sections`;
		const buffer = await file.arrayBuffer()
		try {
			const res = await fetch(url, {
				headers: {"Content-Type": "application/x-zip-compressed"},
				method: "PUT",
				body: buffer
			});

			if(!res.ok){
				const {error} = await res.json();
				throw new Error (`${res.status}: ${error}`);
			}
			const {result} = await res.json();
        	setDatasetIds(result);//result is an array of strings of dataset ids
		} catch (err){
			throw err;//display this error somehow
			//console.log(`Error adding dataset: ${err}`);
		}
    };

    const handleRemoveDataset = async (id: string) => {
        // TODO: remove dataset with id
		const url = `http://localhost:4321/dataset/${id}`;
		try {
			const res = await fetch(url, {
				method: "DELETE",
			});

			if(!res.ok){
				const {error} = await res.json();
				throw new Error (`${res.status}: ${error}`);
			}
			const {result} = await res.json();//result is a string id of removed dataset
        setDatasetIds((prev: any) => prev.filter((datasetId: string) => datasetId !== result));
		} catch (err){
			throw err;//display this error somehow
			//throw new Error(`Error removing dataset: ${err}`);
		}
    };

  return (
      <div id="App">
          <i className={`fa-solid fa-chevron-down ${isSidePanelOpen ? "shifted" : ""}`} onClick={openSidePanel}></i>

          <div className={`slidePanel ${isSidePanelOpen ? "shifted" : ""}`} ref={sidePanelRef}>
            <SidePanel setActivePage={setActivePage} />
          </div>

          <div id="contentWrapper" className={isSidePanelOpen ? "shifted" : ""}>
              {activePage !== "Home" && (
                <select className="selectedDatasetDropdown" value={selectedDatasetId} onChange={(e) => setSelectedDatasetId(e.target.value)}>
                    <option value="" disabled>Dataset Selected</option>
                    {datasetIds.map((id) => (
                        <option key={id} value={id}>{id}</option>
                    ))}
                </select>
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
