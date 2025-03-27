import React, { useState, useEffect } from "react";
import "./style/GraphPage.css";
import GraphComponent from "./GraphComponent";

const Graph3: React.FC<{ datasetId: string }> = ({ datasetId }) => {
    const [departmentOptions, setDepartmentOptions] = useState<string[]>([]);
    const [selectedDepartment, setSelectedDepartment] = useState<string>("");

    const [instructorOptions, setInstructorOptions] = useState<string[]>([]);
    const [selectedInstructors, setSelectedInstructors] = useState<string[]>([]);

    const [data, setData] = useState<any>(null)

    console.log(datasetId);
    
    useEffect(() => {
        console.log("called");
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
        const fetchInstructorOptions = async () => {
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
                // TODO: fetch instructor and set to instructor
                const results = [];
                setInstructorOptions(results);
            } catch (error) {
                console.error("Error fetching instructors:", error);
            }
        };
        fetchInstructorOptions();
    }, [selectedDepartment,datasetId]);
    
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
                   
            const data = {
                labels: result.map(item => item.instructor),
                datasets: [
                  {
                    label: 'Percentage Failure',
                    data: result.map(item => (item.fail * 100) / (item.pass + item.fail)),
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
                    <label htmlFor="instructorSelect">Instructors:</label>
                    <select multiple className="dropdown instructorSelect" value={selectedInstructors} onChange={handleSelectInstructors}>
                    <option value="" disabled>Select instructors</option>
                        {instructorOptions.length > 0 ? (
                        instructorOptions.map((instructor, index) => (
                            <option key={index} value={instructor}>
                                {instructor}
                            </option>
                        ))
                        ) : (
                            <option disabled>Loading...</option>
                        )}
                    </select>
                </div>
            </div>

            <button 
                className={`generateGraphBtn ${selectedInstructors.length === 0 || !selectedDepartment? "disabledBtn" : "btn"}`} 
                // Commented out to allow for generating graph with mock data
                // disabled={selectedInstructors.length === 0 || !selectedDepartment}
                onClick={getDataForGraph}>
                    See Failing
            </button>

            <div className="chartDiv">
                {data && data.labels && data.datasets && <GraphComponent data={data} isBar = {true} />}
            </div>

        </div>
    );
  };


export default Graph3;
