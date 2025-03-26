import React, { useState, useEffect } from "react";
import "./style/GraphPage.css";
import GraphComponent from "./GraphComponent";


const Graph2: React.FC<{ datasetId: string }> = ({ datasetId }) => {
    const [departmentOptions, setDepartmentOptions] = useState<string[]>([]);
    const [selectedDepartment, setSelectedDepartment] = useState<string>("");

    const [courseOptions, setCourseOptions] = useState<{ id: string; title: string }[]>([]);
    const [selectedCourse, setSelectedCourse] = useState<string>("");
    const [selectedYear1, setSelectedYear1] = useState<string>("");
    const [selectedYear2, setSelectedYear2] = useState<string>("");

    const [data, setData] = useState<any>(null);
    

    const years1: string[] = [];
    for (let year = 1990; year <= 2023; year++) {
      years1.push(year.toString());
    }

    const years2: string[] = [];
    for (let year = parseInt(selectedYear1)+1; year <= Math.min(parseInt(selectedYear1)+10,2024); year++) {
      years2.push(year.toString());
    }


    useEffect(() => {
               const fetchDepartmentOptions = async () => {
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
                       // TODO: fetch department and set to departmentOptions
                       const results = [];
                       setDepartmentOptions(results);
                   } catch (error) {
                       console.error("Error fetching departments:", error);
                   }
               };
               fetchDepartmentOptions();
    
           }, [datasetId]);



    useEffect(() => {
        const fetchCoursesOptions = async () => {
            const query ={
                "WHERE": {
                  "IS": {
                    [`${datasetId}_dept`]: selectedDepartment
                  }
                },
                "OPTIONS": {
                  "COLUMNS": [
                    `${datasetId}_id`,
                    `${datasetId}_title`
                  ]
                },
                "TRANSFORMATIONS": {
                  "GROUP": [
                    `${datasetId}_id`,
                    `${datasetId}_title`
                  ],
                  "APPLY": []
                }
              };
            try {
               // TODO: FETCH COURSES
            } catch (error) {
                console.error("Error fetching courses:", error);
            }
            //TODO: SET COURSE LIST HERE
            const results =  [
                { id: "210", title: "a" },
                { id: "310", title: "b" }
            ];

            setCourseOptions(results);
        };

        fetchCoursesOptions();
    }, [selectedDepartment,datasetId]);



    const getDataForGraph = async () => {
        const query = {
            "WHERE": {
              "AND": [
                {
                  "AND": [
                    {
                      "GT": {
                        [`${datasetId}_year`]: selectedYear1
                      }
                    },
                    {
                      "LT": {
                        [`${datasetId}_year`]: selectedYear2
                      }
                    }
                  ]
                },
                {
                  "IS": {
                    [`${datasetId}_dept`]: selectedDepartment
                  }
                },
                {
                  "IS": {
                    [`${datasetId}_id`]: selectedCourse
                  }
                }
              ]
            },
            "OPTIONS": {
              "COLUMNS": [
                `${datasetId}_year`,
                "average"
              ],
              "ORDER": `${datasetId}_year`
            },
            "TRANSFORMATIONS": {
              "GROUP": [
                `${datasetId}_year`
              ],
              "APPLY": [
                {
                  "average": {
                    "AVG": `${datasetId}_avg`
                  }
                }
              ]
            }
          };
        try {
            // TODO: fetch data set to result
            const result = [
                { year: 2000 , avg: 76 },
                { year: 1001 , avg: 88 }
            ];  
     
            setData(result);
        } catch (error) {
            console.error("Error fetching data:", error);
        }
    }

    return (
        <div className="inputsWrapper">

            <div className="inputWrapper">
                <label htmlFor="departmentOptionSelect">Department:</label>
                <select className="dropdown departmentOptionSelect" value={selectedDepartment} onChange={(e)=> setSelectedDepartment(e.target.value)}>
                <option value="" disabled>Select a department</option>
                    {departmentOptions.length > 0 ? (
                        departmentOptions.map((dept, index) => (
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
                <label htmlFor="instructorSelect">Course:</label>      
                <select className="dropdown instructorSelect" value={selectedCourse} onChange={(e)=> setSelectedCourse(e.target.value)}>
                <option value="" disabled>Select a course</option>
                {courseOptions.length > 0 ? (
                        courseOptions.map((course) => (
                            <option key={course.id} value={course.id}>
                                {course.id}-{course.title}
                            </option>
                        ))
                    ) : (
                        <option disabled>Loading...</option>
                    )}
                </select>
            </div>

            <div className="inputWrapper">    
                <label htmlFor="yearSelect">Year:</label>      
                <div className="years">   
                <select className="dropdown yearselect" value={selectedYear1} onChange={(e)=> setSelectedYear1(e.target.value)}>
                    <option value="" disabled>Start year</option>
                    {years1.map((year) => (
                    <option key={year} value={year}>
                        {year}
                    </option>
                    ))}
                </select>
                <p>to</p>
                <select className="dropdown yearselect" value={selectedYear2} onChange={(e)=> setSelectedYear2(e.target.value)}>
                    <option value="" disabled>End Year</option>
                    {years2.map((year) => (
                    <option key={year} value={year}>
                        {year}
                    </option>
                    ))}
                </select>
                </div>  
            </div>

            <button className="generateGraphBtn btn" onClick={getDataForGraph}>See Average</button>
        
            {data !== null && <GraphComponent data={data} />}
        
        </div>
    );
  };


export default Graph2;
