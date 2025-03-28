import React, { useState, useEffect } from "react";
import "./style/GraphPage.css";
import GraphComponent from "./GraphComponent";
import Select, { MultiValue } from "react-select"; // Import MultiValue here

const Graph3: React.FC<{ datasetId: string }> = ({ datasetId }) => {
    const [departmentOptions, setDepartmentOptions] = useState<string[]>([]);
    const [selectedDepartment, setSelectedDepartment] = useState<string>("");

    const [instructorOptions, setInstructorOptions] = useState<{ label: string, value: string }[]>([]);
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
				const url = "http://localhost:4321/query";
				const res = await fetch(url, {
					headers:{ "Content-Type": "application/json"},
					method: "POST",
					body: JSON.stringify(query)
				})

				if(!res.ok){
					const {error} = await res.json();
					throw new Error (`${res.status}: ${error}`);
				}

				const {result} = await res.json();//result is an array of {datasetId_dept: val }
				const depts =  result.map(item => item[`${datasetId}_dept`]);
				setDepartmentOptions(depts);
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
				const url = "http://localhost:4321/query";
				const res = await fetch(url, {
					headers:{ "Content-Type": "application/json"},
					method: "POST",
					body: JSON.stringify(query)
				})

				if(!res.ok){
					const {error} = await res.json();
					throw new Error (`${res.status}: ${error}`);
				}

				const {result} = await res.json();
                const instructors = result.map((item) => item[`${datasetId}_instructor`]);
                setInstructorOptions(instructors.map((instructor) => ({ label: instructor, value: instructor })));
            } catch (error) {
                console.error("Error fetching instructors:", error);
            }
        };
        fetchInstructorOptions();
    }, [selectedDepartment,datasetId]);

   const handleInstructorChange = (newValue: MultiValue<{ label: string; value: string }>) => {
           setSelectedInstructors(newValue.map((item) => item.value));
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
			const url = "http://localhost:4321/query";
			const res = await fetch(url, {
				headers:{ "Content-Type": "application/json"},
				method: "POST",
				body: JSON.stringify(query)
			})

			if(!res.ok){
				const {error} = await res.json();
				throw new Error (`${res.status}: ${error}`);
			}

			const {result} = await res.json();
            const data = {
                labels: result.map(item => item[`${datasetId}_instructor`]),
                datasets: [
                  {
                    label: 'Percentage Failure',
                    data: result.map(item => (item["totalFail"] * 100) / (item["totalPass"] + item["totalFail"])),
                    backgroundColor: [
                        'rgba(255, 99, 132, 1)',
                      ],
                    }
                ],
            };
            setData(data);
        } catch (error) {
            console.error("Error fetching data:", error);
        }
    }
    const selectStyles = {
        container: (provided: any) => ({
          ...provided,
          width: "545px", 
          height: "40px",
        }),
        option: (provided: any, state: any) => ({
          ...provided,
          fontSize: "16px",
          backgroundColor: state.isSelected ? "#67eaf1" : state.isFocused ? "#f0f0f0" : "transparent",
          color: state.isSelected ? "white" : "black",
        }),
        multiValue: (provided: any) => ({
            ...provided,
            backgroundColor: "#b6b6b6", 
            color: "#ffff",
            borderRadius: "5px",
            margin: "2px",
          }),
        multiValueLabel: (provided: any) => ({
          ...provided,
          fontSize: "14px", 
          color: "white",
        }),
        multiValueRemove: (provided: any) => ({
          ...provided,
          color: "white", 
          cursor: "pointer",
        }),
        multiValueRemoveHover: (provided: any) => ({
          ...provided,
          backgroundColor: "red", 
        }),
      };

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
                    <Select
                      id="instructorSelect"
                      options={instructorOptions}
                      isMulti
                      value={selectedInstructors.map((instructor) => ({
                        label: instructor,
                        value: instructor
                      }))}
                      onChange={handleInstructorChange}
                      placeholder="Select instructors"
                      styles={selectStyles}
                    />
                </div>
            </div>

            <button
                className={`generateGraphBtn ${selectedInstructors.length === 0 || !selectedDepartment? "disabledBtn" : "btn"}`}
                disabled={selectedInstructors.length === 0 || !selectedDepartment}
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
