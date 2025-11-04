import Layout from "./components/Layout/Layout";
import { BrowserRouter, Routes, Route } from 'react-router-dom';

function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default App;
