import { useEffect } from 'react';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { wakeRenderServer } from './api/renderKeepAlive';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import About from './components/About';
import Projects from './components/Projects';
import Testimonials from './components/Testimonials';
import Quiz from './components/Quiz';
import Contact from './components/Contact';
import Footer from './components/Footer';
import DiamondCursor from './components/DiamondCursor';


function Portfolio() {
  const { theme, themeName } = useTheme();

  return (
    <div key={themeName} style={{ background: theme.bg, color: theme.text, fontFamily: "'Inter', 'Poppins', sans-serif", minHeight: '100vh' }}>
      <Navbar />
      <DiamondCursor />
      <Hero />
      <About />
      <Projects />
      <Testimonials />
      <Quiz />
      <Contact />
      <Footer />
    </div>
  );
}

export default function App() {
  useEffect(() => {
    wakeRenderServer();
    const id = setInterval(wakeRenderServer, 14 * 60 * 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <ThemeProvider>
      <Portfolio />
    </ThemeProvider>
  );
}
