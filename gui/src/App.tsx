import { Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout';
import Dashboard from './pages/Dashboard';
import AddLyric from './pages/AddLyric';
import Browse from './pages/Browse';
import Search from './pages/Search';
import Suggest from './pages/Suggest';
import Settings from './pages/Settings';

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/add" element={<AddLyric />} />
        <Route path="/browse" element={<Browse />} />
        <Route path="/search" element={<Search />} />
        <Route path="/suggest" element={<Suggest />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </Layout>
  );
}
