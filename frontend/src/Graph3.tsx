import React, { useState, useEffect } from "react";
import "./style/GraphPage.css";
import GraphComponent from "./GraphComponent";

const Graph3: React.FC<{ datasetId: string }> = ({ datasetId }) => {
    const [departmentOptions, setDepartmentOptions] = useState<string[]>([]);
    const [selectedDepartment, setSelectedDepartment] = useState<string>("");

    const [instructorOptions, setInstructorOptions] = useState<string[]>([]);
    const [selectedInstructors, setSelectedInstructors] = useState<string[]>([]);

    const [data, setData] = useState<any>(null);

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
                const departmentOptions = [];
                setDepartmentOptions(departmentOptions);
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
                const instructorOptions = [];
                setInstructorOptions(instructorOptions);
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

    const generateGraph = async () => {
        try{
            const result = await getDataForGraph();
            //TODO: GENERATE GRAPH

        } catch (error) {
            console.error("Error fetching data:", error);
        }
    };

    const getDataForGraph = async () => {
        const query = {
            "WHERE": {
                // "OR": [
                // {
                //     "IS": {
                //     [`${datasetId}_instructor`]: selectedInstructors[0]
                //     }
                // },
                // {
                //     "IS": {
                //         [`${datasetId}_instructor`]: selectedInstructors[1]
                //     }
                // }
                // ]
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
            // TODO: fetch instructor and set to instructor
            const result = {
                instructor:"",
                fail:"",
                pass:"",
                percentageFail: function() {
                    return (this.fail * 100) / (this.pass + this.fail);
                }            
            };
            setData({
                instructor: result.instructor,
                percentage: result.percentageFail()
            })
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

        <button className="generateGraphBtn btn" onClick={generateGraph}>See Failing</button>

        {data !== null && <GraphComponent data={data} />}


      </div>
    );
  };


export default Graph3;
