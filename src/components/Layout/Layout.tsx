import Navbar from "../Navbar/Navbar";
import Sidebar from "../Sidebar/Sidebar";

const Layout = ({ children }: { children: React.ReactNode }) => (
  <div className="flex">
    <Sidebar />
    <div className="flex-1 flex flex-col">
      <Navbar />
      <main className="p-6 bg-gray-50 dark:bg-dark-bg min-h-screen">
        {children}
      </main>
    </div>
  </div>
);

export default Layout;
