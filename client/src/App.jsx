import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';

// Pages should be imported and used in Routes
import HomePage from './pages/HomePage';

function App() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow">
        <Routes>
          <Route path="/" element={<HomePage />} />
          {/* Add more routes here */}
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

export default App;
