import React, { useState, useEffect } from "react";
import "./style/Home.css";


const Home: React.FC<{ datasetIds: string[]; onAddDataset: (id: string, file: File) => void; onRemoveDataset: (id: string) => void }> = ({ datasetIds, onAddDataset, onRemoveDataset }) => {
    const [datasetId, setDatasetId] = useState<string>("");
    const [file, setFile] = useState<File | null>(null);
    const [feedback, setFeedback] = useState<string>("");

    const handleAdd = () => {
        if (!datasetId || !file) {
            setFeedback("Please provide an ID and select a file.");
            return;
        }

        try {
            onAddDataset(datasetId, file);
            setFeedback("Dataset added successfully!");
        } catch (error){
            setFeedback("Fail adding dataset: " + error);
        }

        setDatasetId("");
        setFile(null);
        const fileInput = document.querySelector(".fileInput") as HTMLInputElement;
        if (fileInput) fileInput.value = "";
    };

    return (
        <div className="homePage">
            <h2>My datasets</h2>

            <div className="inputsWrapper">
                <input className="textInput" type="text" value={datasetId} onChange={(e) => setDatasetId(e.target.value)} placeholder="Enter dataset ID" />
                <input className="fileInput" type="file"onChange={(e) => e.target.files? setFile(e.target.files[0]) : setFile(null)} />
                <div  className="buttonDiv">                
                    <button 
                        className={`${!datasetId || !file? "disabledBtn" : "btn"}`} 
                        disabled={!datasetId || !file} 
                        onClick={handleAdd}>
                            Add Dataset
                    </button>
                    {feedback && <div className="feedback">{feedback}</div>}
                </div>
            </div>


            <div className="datasetsWrapper">
                {datasetIds.map((id) => (
                    <div key={id} className="datasetDiv">
                        <p><strong>ID:</strong> {id}</p>
                        <p className="dateAdded"><strong>Date Added:</strong> {new Date().toLocaleString()}</p>
                        <button className="removeBtn" onClick={() => onRemoveDataset(id)}>
                            <i className ="fa-solid fa-trash-can"></i>
                        </button>
                    </div>
                ))}
            </div>


        </div>
    );
  };


export default Home;
