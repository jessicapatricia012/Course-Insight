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

    const getDataForGraph = async () => {
        const query = {
            "WHERE": {
                "OR": selectedInstructors.map((instructor) => ({
                    "IS": {
                        [`${datasetId}_instructor`]: instructor
                    }
                }))
            },
            "OPTIONS": {
                "COLUMNS": [
                    `${datasetId}_instructor`,
                    "totalFail",
                    "totalPass"
                ]
            },
            "TRANSFORMATIONS": {
                "GROUP": [
                    `${datasetId}_instructor`
                ],
                "APPLY": [
                {
                    "totalFail": {
                    "SUM": `${datasetId}_fail`
                    }
                },
                {
                    "totalPass": {
                    "SUM": `${datasetId}_pass`
                    }
                }
                ]
            }

        };
        try {
            // TODO: fetch data set to result
            const result = [
                { instructor: "Instructor A", fail: 3, pass: 70 },
                { instructor: "Instructor B", fail: 1, pass: 90 }
            ];  
                   
            const data = result.map(item => ({
                instructor: item.instructor,
                percentageFail: (item.fail * 100) / (item.pass + item.fail)  // Calculate percentage of failure
            }));
            setData(data);
        } catch (error) {
            console.error("Error fetching data:", error);
        }
    }

  
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

            <button className="generateGraphBtn btn" onClick={getDataForGraph}>See Average</button>
        
            {data !== null && <GraphComponent data={data} />}
        
        </div>
    );
  };


export default Graph2;
