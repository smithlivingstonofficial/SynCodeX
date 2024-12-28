// Main Dashboard Code
import React, { useEffect, useState } from "react";
import { getAuth } from "firebase/auth";
import { db } from "../../firebase/config";
import { collection, query, where, getDocs } from "firebase/firestore";
import { Bar } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from "chart.js";
import './Dashboard.css';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const Dashboard = () => {
  const auth = getAuth();
  const user = auth.currentUser;
  const [graphData, setGraphData] = useState({
    labels: [],
    projects: [],
    followers: [],
    likes: [],
  });
  const [mostViewedProjects, setMostViewedProjects] = useState([]);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      const userId = user.uid;

      // Fetch projects
      const projectsQuery = query(
        collection(db, "projects"),
        where("ownerId", "==", userId)
      );
      const projectsSnapshot = await getDocs(projectsQuery);

      // Fetch most viewed projects (mocked for now)
      const projectsData = projectsSnapshot.docs
        .map(doc => doc.data())
        .sort((a, b) => (b.views || 0) - (a.views || 0))
        .reverse()
        .slice(0, 5); // Top 5 projects

      // Mock graph data
      const labels = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
      const projectsGraph = [3, 4, 5, 6, 7, 8, 9];
      const followersGraph = [10, 15, 20, 25, 30, 35, 40];
      const likesGraph = [5, 10, 15, 20, 25, 30, 35];

      // Mock notifications
      const notificationsData = [
        "New follower subscribed to your channel.",
        "Your project 'Portfolio Website' got 50 views this week.",
        "You received 10 new likes on 'Weather App'.",
      ];

      setGraphData({ labels, projects: projectsGraph, followers: followersGraph, likes: likesGraph });
      setMostViewedProjects(projectsData);
      setNotifications(notificationsData);
    };

    fetchData();
  }, [user]);

  const chartData = {
    labels: graphData.labels,
    datasets: [
      {
        label: "Projects",
        data: graphData.projects,
        backgroundColor: "rgba(54, 162, 235, 0.6)", // Blue
      },
      {
        label: "Followers",
        data: graphData.followers,
        backgroundColor: "rgba(255, 99, 132, 0.6)", // Red
      },
      {
        label: "Likes",
        data: graphData.likes,
        backgroundColor: "rgba(75, 192, 192, 0.6)", // Green
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top",
      },
      title: {
        display: true,
        text: "Weekly Analytics Overview",
      },
    },
    scales: {
      x: {
        grid: {
          display: false, // Removes vertical grid lines
        },
        ticks: {
          display: false, // Removes labels on the x-axis
        },
      },
      y: {
        grid: {
          display: false, // Removes horizontal grid lines
        },
        ticks: {
          display: false, // Removes labels on the y-axis
        },
      },
    },
  };
  

  return (
    <div className="dashboard">
      <div className="dashboard-grid">
        {/* Chart Section */}
        <div className="chart-section">
          <Bar data={chartData} options={chartOptions} />
        </div>

        {/* Most Viewed Projects */}
        <div className="most-viewed-projects">
          <h2>Most Viewed Projects</h2>
          <ul>
            {mostViewedProjects.map((project, index) => (
              <li key={index}>
                {project.title} - {project.views || 0} views
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Notifications */}
      <div className="notifications">
        <h2>Notifications</h2>
        <ul>
          {notifications.map((notification, index) => (
            <li key={index}>{notification}</li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default Dashboard;
