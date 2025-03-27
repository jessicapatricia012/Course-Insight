"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("react");
require("./style/GraphPage.css");
var GraphComponent_1 = require("./GraphComponent");
var Graph1 = function (_a) {
    var datasetId = _a.datasetId;
    var _b = (0, react_1.useState)([]), departmentOptions = _b[0], setDepartmentOptions = _b[1];
    var _c = (0, react_1.useState)([]), selectedDepartments = _c[0], setSelectedDepartments = _c[1];
    var _d = (0, react_1.useState)(""), selectedYear = _d[0], setSelectedYear = _d[1];
    var _e = (0, react_1.useState)(null), data = _e[0], setData = _e[1];
    var years = [];
    for (var year = 1990; year <= 2024; year++) {
        years.push(year.toString());
    }
    (0, react_1.useEffect)(function () {
        var fetchDepartmentOptions = function () { return __awaiter(void 0, void 0, void 0, function () {
            var query, url, res, error, result, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        query = {
                            "WHERE": {},
                            "OPTIONS": {
                                "COLUMNS": ["".concat(datasetId, "_dept")]
                            },
                            "TRANSFORMATIONS": {
                                "GROUP": ["".concat(datasetId, "_dept")],
                                "APPLY": []
                            }
                        };
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 6, , 7]);
                        url = "http://localhost:4321/query";
                        return [4 /*yield*/, fetch(url, {
                                headers: { "Content-Type": "application/json" },
                                method: "POST",
                                body: JSON.stringify(query)
                            })];
                    case 2:
                        res = _a.sent();
                        if (!!res.ok) return [3 /*break*/, 4];
                        return [4 /*yield*/, res.json()];
                    case 3:
                        error = (_a.sent()).error;
                        throw new Error("".concat(res.status, ": ").concat(error));
                    case 4: return [4 /*yield*/, res.json()];
                    case 5:
                        result = (_a.sent()).result;
                        setDepartmentOptions(result);
                        return [3 /*break*/, 7];
                    case 6:
                        error_1 = _a.sent();
                        console.error("Error fetching departments:", error_1);
                        return [3 /*break*/, 7];
                    case 7: return [2 /*return*/];
                }
            });
        }); };
        fetchDepartmentOptions();
    }, [datasetId]);
    var handleSelectDepartments = function (event) {
        var options = event.target.options;
        var selectedValues = [];
        for (var i = 0; i < options.length; i++) {
            if (options[i].selected) {
                selectedValues.push(options[i].value);
            }
        }
        setSelectedDepartments(selectedValues);
    };
    var getDataForGraph = function () { return __awaiter(void 0, void 0, void 0, function () {
        var query, url, res, error, result, data_1, error_2;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    query = {
                        "WHERE": {
                            "AND": [
                                {
                                    "OR": selectedDepartments.map(function (dept) {
                                        var _a;
                                        return ({
                                            "IS": (_a = {},
                                                _a["".concat(datasetId, "_dept")] = dept,
                                                _a)
                                        });
                                    })
                                },
                                {
                                    "EQ": (_a = {},
                                        _a["".concat(datasetId, "_year")] = selectedYear,
                                        _a)
                                }
                            ]
                        },
                        "OPTIONS": {
                            "COLUMNS": [
                                "".concat(datasetId, "_dept"),
                                "average"
                            ]
                        },
                        "TRANSFORMATIONS": {
                            "GROUP": [
                                "".concat(datasetId, "_dept")
                            ],
                            "APPLY": [
                                {
                                    "average": {
                                        "AVG": "".concat(datasetId, "_avg")
                                    }
                                }
                            ]
                        }
                    };
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 6, , 7]);
                    url = "http://localhost:4321/query";
                    return [4 /*yield*/, fetch(url, {
                            headers: { "Content-Type": "application/json" },
                            method: "POST",
                            body: JSON.stringify(query)
                        })];
                case 2:
                    res = _b.sent();
                    if (!!res.ok) return [3 /*break*/, 4];
                    return [4 /*yield*/, res.json()];
                case 3:
                    error = (_b.sent()).error;
                    throw new Error("".concat(res.status, ": ").concat(error));
                case 4: return [4 /*yield*/, res.json()];
                case 5:
                    result = (_b.sent()).result;
                    data_1 = {
                        labels: result.map(function (item) { return item["".concat(datasetId, "_dept")]; }),
                        datasets: [
                            {
                                label: 'Department Average',
                                data: result.map(function (item) { return item["average"]; }),
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
                    setData(data_1);
                    return [3 /*break*/, 7];
                case 6:
                    error_2 = _b.sent();
                    console.error("Error fetching data:", error_2);
                    return [3 /*break*/, 7];
                case 7: return [2 /*return*/];
            }
        });
    }); };
    return (<div>
            <div className="inputsWrapper">

                <div className="inputWrapper">
                    <label htmlFor="departmentSelect">Department:</label>
                    <select className="dropdown departmentSelect" multiple value={selectedDepartments} onChange={handleSelectDepartments}>
                    <option value="" disabled>Select a department</option>
                        {departmentOptions.length > 0 ? (departmentOptions.map(function (dept, index) { return (<option key={index} value={dept}>
                                    {dept}
                                </option>); })) : (<option disabled>Loading...</option>)}
                    </select>
                </div>

                <div className="inputWrapper">
                    <label htmlFor="yearSelect">Year:</label>
                    <select className="dropdown yearSelect" value={selectedYear} onChange={function (e) { return setSelectedYear(e.target.value); }}>
                        <option value="" disabled>Select a year</option>
                        {years.map(function (year) { return (<option key={year} value={year}>
                                {year}
                            </option>); })}
                </select>
                </div>

            </div>
            <button className={"generateGraphBtn ".concat(!selectedYear || selectedDepartments.length === 0 ? "disabledBtn" : "btn")} 
    // Commented out to allow for generating graph with mock data
    // disabled={!selectedYear || selectedDepartments.length === 0}
    onClick={getDataForGraph}>
                    See Average
            </button>

            <div className="chartDiv">
                  {data !== null && <GraphComponent_1.default data={data} isBar={true}/>}
            </div>
        </div>);
};
exports.default = Graph1;
