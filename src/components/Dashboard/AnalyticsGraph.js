// To Show Graph on Dashboard
import React, { useEffect, useState } from "react";
import { Bar } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from "chart.js";
import { db } from "../firebase"; // Your Firebase configuration
import { collection, getDocs } from "firebase/firestore";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const AnalyticsGraph = () => {
  const [analyticsData, setAnalyticsData] = useState({
    dates: [],
    views: [],
    subscribers: [],
  });

  useEffect(() => {
    const fetchAnalytics = async () => {
      const analyticsRef = collection(db, "analytics");
      const snapshot = await getDocs(analyticsRef);
      const data = snapshot.docs.map(doc => doc.data());

      // Format data for the chart
      const dates = data.map(item => item.date);
      const views = data.map(item => item.views);
      const subscribers = data.map(item => item.subscribers);

      setAnalyticsData({ dates, views, subscribers });
    };

    fetchAnalytics();
  }, []);

  const data = {
    labels: analyticsData.dates,
    datasets: [
      {
        label: "Views",
        data: analyticsData.views,
        backgroundColor: "rgba(54, 162, 235, 0.6)", // Blue for views
      },
      {
        label: "Subscribers",
        data: analyticsData.subscribers,
        backgroundColor: "rgba(255, 99, 132, 0.6)", // Red for subscribers
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: "top",
      },
      title: {
        display: true,
        text: "Channel Analytics",
      },
    },
  };

  return (
    <div className="analytics-graph">
      <h3>Channel Analytics</h3>
      <Bar data={data} options={options} />
    </div>
  );
};

export default AnalyticsGraph;
