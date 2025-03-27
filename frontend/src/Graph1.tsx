import React, { useState, useEffect } from "react";
import "./style/GraphPage.css";
import GraphComponent from "./GraphComponent";


const Graph1: React.FC<{ datasetId: string }> = ({ datasetId }) => {
    const [departmentOptions, setDepartmentOptions] = useState<string[]>([]);
    const [selectedDepartments, setSelectedDepartments] = useState<string[]>([]);
    const [selectedYear, setSelectedYear] = useState<string>("");

    const [data, setData] = useState<any>(null);

    const years: string[] = [];
    for (let year = 1990; year <= 2024; year++) {
      years.push(year.toString());
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

    const handleSelectDepartments = (event: React.ChangeEvent<HTMLSelectElement>) => {
        const options = event.target.options;
        const selectedValues: string[] = [];
        for (let i = 0; i < options.length; i++) {
        if (options[i].selected) {
            selectedValues.push(options[i].value);
        }
        }
        setSelectedDepartments(selectedValues);
    };

    const getDataForGraph = async () => {
        const query = {
            "WHERE": {
              "AND": [
                {
                  "OR": selectedDepartments.map((dept) => ({
                    "IS": {
                        [`${datasetId}_dept`]: dept
                    }
                }))
                },
                {
                  "EQ": {
                    [`${datasetId}_year`]: selectedYear
                  }
                }
              ]
            },
            "OPTIONS": {
              "COLUMNS": [
                `${datasetId}_dept`,
                "average"
              ]
            },
            "TRANSFORMATIONS": {
              "GROUP": [
                `${datasetId}_dept`
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
                { dept: "Dept A", avg: 80 },
                { dept: "Dept B", avg: 90 }
            ];  

            const data = {
              labels: result.map(item => item.dept),
              datasets: [
                {
                  label: 'Department Average',
                  data: result.map(item => item.avg),
                  backgroundColor: [
                      'rgba(255, 99, 132, 1)',
                      'rgba(54, 162, 235, 1)',
                      'rgba(255, 206, 86, 1)',
                      'rgba(75, 192, 192, 1)',
                      'rgba(153, 102, 255, 1)',
                    ],
                  }
              ],
          };
                   
            setData(data);
        } catch (error) {
            console.error("Error fetching data:", error);
        }
    }
  
    return (
        <div>
            <div className="inputsWrapper">

                <div className="inputWrapper">        
                    <label htmlFor="departmentSelect">Department:</label>
                    <select className="dropdown departmentSelect" multiple value={selectedDepartments} onChange={handleSelectDepartments}>
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
                    <label htmlFor="yearSelect">Year:</label>
                    <select className="dropdown yearSelect" value={selectedYear} onChange={(e)=> setSelectedYear(e.target.value)}>
                        <option value="" disabled>Select a year</option>
                        {years.map((year) => (
                            <option key={year} value={year}>
                                {year}
                            </option>
                        ))}
                </select>
                </div>
            
            </div>
            <button 
                className={`generateGraphBtn ${!selectedYear || selectedDepartments.length === 0? "disabledBtn" : "btn"}`} 
                // Commented out to allow for generating graph with mock data
                // disabled={!selectedYear || selectedDepartments.length === 0} 
                onClick={getDataForGraph}>
                    See Average
            </button>
      
            <div className="chartDiv">
                  {data !== null && <GraphComponent data={data} isBar={true} />}
            </div>
        </div>
    );
  };


export default Graph1;
