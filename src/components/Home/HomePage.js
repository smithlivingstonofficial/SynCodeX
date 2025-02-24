import React, { useEffect, useState } from "react";
import { collection, getDocs, getDoc, doc } from "firebase/firestore"; // Import necessary functions from Firestore
import { db } from "../../firebase/config"; // Ensure that this points to your Firebase config
import ProjectCard from "../Projects/ProjectCard"; // Component to display the card
import "./HomePage.css"; // Your styles

const HomePage = () => {
  const [projects, setProjects] = useState([]);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        // Fetch all projects from the Firestore collection "projects"
        const querySnapshot = await getDocs(collection(db, "projects"));
        
        // Log the fetched project data
        console.log("Fetched Projects:", querySnapshot.docs);

        const projectsData = await Promise.all(
          querySnapshot.docs.map(async (docSnapshot) => {
            const project = docSnapshot.data();
            let channelData = { channelName: "Unknown", profilePicture: "/default-profile.png" };

            // Fetch channel data based on ownerId in project document
            if (project.ownerId) {
              try {
                const channelDoc = await getDoc(doc(db, "channels", project.ownerId));
                if (channelDoc.exists()) {
                  channelData = channelDoc.data(); // Set channel data
                } else {
                  console.warn("Channel data not found for ownerId:", project.ownerId);
                }
              } catch (error) {
                console.error("Error fetching channel data:", error);
              }
            }

            // Log the merged project and channel data
            console.log("Merged Project and Channel Data:", { ...project, ...channelData });

            // Return the merged project and channel data
            return {
              id: docSnapshot.id,
              ...project,
              ...channelData, // Merged data with channel details
            };
          })
        );

        // Set the fetched projects data with channel details
        setProjects(projectsData);

      } catch (error) {
        console.error("Error fetching projects:", error);
      }
    };

    fetchProjects();
  }, []);

  return (
    <div className="project-grid">
      {projects.map((project) => (
        <ProjectCard key={project.id} project={project} /> // Pass the project data with channel details to ProjectCard
      ))}
    </div>
  );
};

export default HomePage;
