import React, { useState, useEffect } from "react";
import "./style/GraphPage.css";
import GraphComponent from "./GraphComponent";
import {expect} from "chai";
import {Log} from "@ubccpsc310/project-support";
import Select, { MultiValue } from "react-select"; // Import MultiValue here


const Graph1: React.FC<{ datasetId: string }> = ({ datasetId }) => {
    const [departmentOptions, setDepartmentOptions] = useState<{ label: string, value: string }[]>([]);
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
                  const depts = result.map((item) => item[`${datasetId}_dept`]);
                  setDepartmentOptions(depts.map((dept) => ({ label: dept, value: dept })));
               } catch (error) {
				          throw error; 
               }
           };
           fetchDepartmentOptions();

       }, [datasetId]);

       const handleDepartmentChange = (newValue: MultiValue<{ label: string; value: string }>) => {
        setSelectedDepartments(newValue.map((item) => item.value));
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
                    [`${datasetId}_year`]: parseInt(selectedYear)
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
            labels: result.map(item => item[`${datasetId}_dept`]),
            datasets: [
              {
                label: 'Department Average',
                data: result.map(item => item["average"]),
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
        width: "400px", 
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
                    <label htmlFor="departmentSelect">Department:</label>
                    <Select
                      id="departmentSelect"
                      options={departmentOptions}
                      isMulti
                      value={selectedDepartments.map((dept) => ({
                        label: dept,
                        value: dept
                      }))}
                      onChange={handleDepartmentChange}
                      placeholder="Select departments"
                      styles={selectStyles}
                    />
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
                disabled={!selectedYear || selectedDepartments.length === 0}
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
