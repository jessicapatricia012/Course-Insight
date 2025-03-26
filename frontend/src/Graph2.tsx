import React, { useState, useEffect } from "react";
import "./style/GraphPage.css";
import GraphComponent from "./GraphComponent";


const Graph2: React.FC<{ datasetId: string }> = ({ datasetId }) => {
    const [courses, setCourses] = useState<string[]>([]);
    const [selectedCourses, setSelectedCourses] = useState<string[]>([]);
    const [selectedYear, setSelectedYear] = useState<string>("");

    const [data, setData] = useState<any>(null);
    

    const years: string[] = [];
    for (let year = 1990; year <= 2024; year++) {
      years.push(year.toString());
    }

    const handleYearSelect = (event: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedYear(event.target.value);
    };

    useEffect(() => {
        const fetchCourses = async () => {
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
               // TODO: FETCH COURSES
            } catch (error) {
                console.error("Error fetching departments:", error);
            }
            //TODO: SET DEPARTMENT LIST HERE
            // setDepartments(departmentList);
        };

        fetchCourses();
    }, []); 

    const handleSelectChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        const options = event.target.options;
        const selectedValues: string[] = [];
        for (let i = 0; i < options.length; i++) {
        if (options[i].selected) {
            selectedValues.push(options[i].value);
        }
        }
        setSelectedCourses(selectedValues);
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
                <label htmlFor="instructorSelect">Courses:</label>      
                <select className="dropdown instructorSelect" multiple value={selectedCourses} onChange={handleSelectChange}>
                    {courses.length > 0 ? (
                    courses.map((dept, index) => (
                        <option key={index} value={dept}>
                        {dept}
                        </option>
                    ))
                    ) : (
                    <option disabled>Loading...</option>
                    )}
                </select>
            </div>

            <div className="inputWrapper">    
                <label htmlFor="yearSelect">Year:</label>           
                <select className="dropdown yearselect" value={selectedYear} onChange={handleYearSelect}>
                    <option value="" disabled>Select a year</option>
                    {years.map((year) => (
                    <option key={year} value={year}>
                        {year}
                    </option>
                    ))}
                </select>
            </div>

            <button className="generateGraphBtn btn" onClick={generateGraph}>See Average</button>
        
            {data !== null && <GraphComponent data={data} />}
        
        </div>
    );
  };


export default Graph2;
