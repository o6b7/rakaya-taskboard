import Layout from "./components/Layout/Layout";
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import TaskModal from "./components/Tasks/TaskModal";
import ProjectPage from "./components/Projects/ProjectPage";

function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/projects/:projectId" element={<ProjectPage />} />
          <Route path="/" element={<div>Home Page - Add your content here</div>} />
        </Routes>
        <TaskModal />
      </Layout>
    </BrowserRouter>
  );
}

export default App;