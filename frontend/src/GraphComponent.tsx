import React, { useState, useEffect } from 'react';
import { Bar } from 'react-chartjs-2';
import Chart from 'chart.js/auto'; // Automatically registers all necessary components

const GraphComponent: React.FC<{ data: any }> = ({ data }) => {
  return (
    <div>
      <h3>Graph</h3>
      {/* <Bar data={data} /> */}
    </div>
  );
};

export default GraphComponent;
