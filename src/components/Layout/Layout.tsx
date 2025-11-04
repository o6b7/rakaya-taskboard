import Sidebar from "./Sidebar";
import Navbar from "./Navbar";

const Layout = ({ children }: { children: React.ReactNode }) => (
  <div className="flex min-h-screen bg-gray-50 dark:bg-dark-bg">
    <Sidebar />
    <div className="flex-1 flex flex-col min-w-0"> 
      <Navbar />
      <main className="flex-1 p-6 overflow-auto"> 
        {children}
      </main>
    </div>
  </div>
);

export default Layout;