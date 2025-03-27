import React, { useEffect, useRef } from 'react';
import { Bar, Line } from 'react-chartjs-2';
import 'chart.js/auto';

const GraphComponent: React.FC<{ data: any; isBar: boolean }> = ({ data, isBar }) => {
  const ref = useRef(null);

  const options = {
    responsive: true,
    plugins: {
      legend: {
        display: false, 
      },
    },
    scales: {
      x: {
        ticks: {
          color: '#fff',
          font: {
            size: 14,
          },
        },
        grid: {
          color: '#27293b', 
        },
      },
      y: {
        ticks: {
          color: '#fff',
          font: {
            size: 14,
          },
        },
        grid: {
          color: '#3d3f55', 
        },
      },
    },
  };

  return (
    <div>
      {isBar ? <Bar ref={ref} options={options} data={data} /> : <Line ref={ref} options={options} data={data} />}
    </div>
  );
};

export default GraphComponent;
