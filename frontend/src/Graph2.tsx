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
					   const depts =  result.map(item => item[`${datasetId}_dept`]);
					   setDepartmentOptions(depts);
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
				//Rename keys
				result.forEach((section: any) => {
					Object.defineProperty(section, "id",
					Object.getOwnPropertyDescriptor(section, `${datasetId}_id`));
					delete section[`${datasetId}_id`];

					Object.defineProperty(section, "title",
					Object.getOwnPropertyDescriptor(section, `${datasetId}_title`));
					delete section[ `${datasetId}_title`];
				})
				setCourseOptions(result);
            } catch (error) {
                console.error("Error fetching courses:", error);
            }
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
              labels: result.map(item => item[`${datasetId}_year`]),
              datasets: [
                {
                  label: 'Course Average',
                  data: result.map(item => item["average"]),
                  backgroundColor: 'rgba(255, 99, 132, 1)',
                    borderColor: 'rgba(255, 99, 132, 1)',
                    borderWidth: 1,
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
            </div>

            <button
                className={`generateGraphBtn ${!selectedDepartment ||!selectedCourse ||!selectedYear1 || !selectedYear2? "disabledBtn" : "btn"}`}
                // Commented out to allow for generating graph with mock data
                // disabled={!selectedDepartment ||!selectedCourse ||!selectedYear1 || !selectedYear2}
                onClick={getDataForGraph}>
                    See Average
            </button>

            <div className="chartDiv">
                {data !== null && <GraphComponent data={data} isBar={false}/>}
            </div>
        </div>
    );
  };


export default Graph2;
