import React, { useState, useEffect } from "react";
import "./style/GraphPage.css";


const Graph1: React.FC<{ datasetId: string }> = ({ datasetId }) => {
    const [departments, setDepartments] = useState<string[]>([]);
    const [selectedDepartments, setSelectedDepartments] = useState<string[]>([]);
    const [selectedYear, setSelectedYear] = useState<string>("");

    const years: string[] = [];
    for (let year = 1990; year <= 2024; year++) {
      years.push(year.toString());
    }

    const handleYearSelect = (event: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedYear(event.target.value);
    };

    useEffect(() => {
        const fetchDepartments = async () => {
            const query = {
                WHERE: {},
                OPTIONS: {
                  COLUMNS: [`${datasetId}_dept`]
                },
                TRANSFORMATIONS: {
                  GROUP: [`${datasetId}_dept`],
                  APPLY: []
                }
              };
            try {
               // TODO: FETCH DEPARTMENT
            } catch (error) {
                console.error("Error fetching departments:", error);
            }
            //TODO: SET DEPARTMENT LIST HERE
            // setDepartments(departmentList);
        };

        fetchDepartments();
    }, []); 

    const handleSelectChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        const options = event.target.options;
        const selectedValues: string[] = [];
        for (let i = 0; i < options.length; i++) {
        if (options[i].selected) {
            selectedValues.push(options[i].value);
        }
        }
        setSelectedDepartments(selectedValues);
    };

    const doQuery = async () => {
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
                <select className="dropdown departmentSelect" multiple value={selectedDepartments} onChange={handleSelectChange}>
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
                <label htmlFor="yearSelect">Year:</label>
                <select className="dropdown yearSelect" value={selectedYear} onChange={handleYearSelect}>
                    <option value="" disabled>Select a year</option>
                    {years.map((year) => (
                        <option key={year} value={year}>
                            {year}
                        </option>
                    ))}
            </select>
            </div>


            <button className="generateGraphBtn" onClick={doQuery}>See Average</button>
      </div>
    );
  };


export default Graph1;
