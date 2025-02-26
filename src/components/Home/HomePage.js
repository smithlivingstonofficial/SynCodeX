import React, { useEffect, useState } from "react";
import { collection, getDocs, getDoc, doc } from "firebase/firestore";
import { db } from "../../firebase/config";
import ProjectCard from "../Projects/ProjectCard";
import { Grid, Container, useMediaQuery } from "@mui/material"; // Import useMediaQuery
import "./HomePage.css";

const HomePage = ({ isSidebarOpen }) => { // Add isSidebarOpen prop
  const [projects, setProjects] = useState([]);
  const isDesktop = useMediaQuery('(min-width:1200px)'); // Media query for desktop

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "projects"));
        console.log("Fetched Projects:", querySnapshot.docs);

        const projectsData = await Promise.all(
          querySnapshot.docs.map(async (docSnapshot) => {
            const project = docSnapshot.data();
            let channelData = { channelName: "Unknown", profilePicture: "/default-profile.png" };

            if (project.ownerId) {
              try {
                const channelDoc = await getDoc(doc(db, "channels", project.ownerId));
                if (channelDoc.exists()) {
                  channelData = channelDoc.data();
                } else {
                  console.warn("Channel data not found for ownerId:", project.ownerId);
                }
              } catch (error) {
                console.error("Error fetching channel data:", error);
              }
            }

            console.log("Merged Project and Channel Data:", { ...project, ...channelData });

            return {
              id: docSnapshot.id,
              ...project,
              ...channelData,
            };
          })
        );

        setProjects(projectsData);

      } catch (error) {
        console.error("Error fetching projects:", error);
      }
    };

    fetchProjects();
  }, []);

  return (
    <Container style={{ padding: 20, marginTop: 60, marginLeft: isSidebarOpen ? 0 : -100 }}> {/* Adjust margin to move cards near sidebar and add top margin */}
      <Grid container spacing={0} justifyContent="center">
        {projects.map((project) => (
          <Grid item key={project.id} xs={12} sm={6} md={isSidebarOpen ? 6 : 4} lg={isSidebarOpen ? 4 : 3} sx={{ display: 'flex', justifyContent: 'center' }}>
            <div style={{ width: 350, height: 230, margin: 5 }}> {/* Increase width */}
              <ProjectCard project={project} />
            </div>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
};

export default HomePage;
