import React, { useState, useEffect } from "react";
import "./style/GraphPage.css";


const Graph3: React.FC<{ datasetId: string }> = ({ datasetId }) => {
    const [departments, setDepartments] = useState<string[]>([]);
    const [selectedDepartment, setSelectedDepartment] = useState<string>("");

    const [instructors, setInstructors] = useState<string[]>([]);
    const [selectedInstructors, setSelectedInstructors] = useState<string[]>([]);
    
    useEffect(() => {
        // Fetch departments based on datasetId
        const fetchDepartments = async () => {
            const query = {
                "WHERE": {},
                "OPTIONS": {
                    "COLUMNS": [`${datasetId}_dept`]
                },
                "TRANSFORMATIONS": {
                    "GROUP": [`${datasetId}_dept`],
                    "APPLY": []
                }
            };

            try {
                // TODO: fetch department
            } catch (error) {
                console.error("Error fetching departments:", error);
            }
        };
        fetchDepartments();
    }, [datasetId]);

    useEffect(() => {
        // Fetch departments based on datasetId
        const fetchInstructors = async () => {
            const query = {
                "WHERE": {
                    "IS": {
                        [`${datasetId}_dept`]: selectedDepartment
                    }
                },
                "OPTIONS": {
                    "COLUMNS": [`${datasetId}_instructor`]
                },
                "TRANSFORMATIONS": {
                    "GROUP": [`${datasetId}_instructor`],
                    "APPLY": []
                }
            };

            try {
                // TODO: fetch department
            } catch (error) {
                console.error("Error fetching departments:", error);
            }
        };
        fetchInstructors();
    }, [selectedDepartment]);

   

    const handleSelectDepartment = (event: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedDepartment(event.target.value);
    };
    
    const handleSelectInstructors = (event: React.ChangeEvent<HTMLSelectElement>) => {
        const options = event.target.options;
        const selectedValues: string[] = [];
        for (let i = 0; i < options.length; i++) {
            if (options[i].selected) {
                selectedValues.push(options[i].value);
            }
        }
        setSelectedInstructors(selectedValues);
    };

    const generateGraph = async () => {
        const query = {
            WHERE: {},
            OPTIONS: {
                COLUMNS: ["sections_dept"]
            },
            TRANSFORMATIONS: {
                GROUP: ["sections_dept"],
                APPLY: []
            }
        };
         try {
            // TODO: FETCH AVERAGE
        } catch (error) {
            console.error("Error fetching average:", error);
        }
        //TODO: GENERATE GRAPH
    };

  
    return (
      <div className="inputsWrapper">

        <div className="inputWrapper">
            <label htmlFor="departmentSelect">Department:</label>
            <select className="dropdown departmentSelect" value={selectedDepartment} onChange={handleSelectDepartment}>
            <option value="" disabled>Select a department</option>
                {departments.length > 0 ? (
                    departments.map((dept, index) => (
                        <option key={index} value={dept}>
                        {dept}
                        </option>
                    ))
                ) : (
                    <option disabled>Loading departments...</option>
                )}
            </select>
        </div>

        <div className="inputWrapper">
            <label htmlFor="instructorSelect">Instructors:</label>
            <select multiple className="dropdown instructorSelect" value={selectedInstructors} onChange={handleSelectInstructors}>
            <option value="" disabled>Select instructors</option>
                {instructors.length > 0 ? (
                instructors.map((instructor, index) => (
                    <option key={index} value={instructor}>
                        {instructor}
                    </option>
                ))
                ) : (
                    <option disabled>Loading instructors...</option>
                )}
            </select>
        </div>

        <button className="generateGraphBtn" onClick={generateGraph}>See Failing</button>
      </div>
    );
  };


export default Graph3;
