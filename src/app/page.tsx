"use client";

import { navItems } from "@/src/data";

import Hero from "@/src/components/Hero";
import Grid from "@/src/components/Grid";
import Footer from "@/src/components/Footer";
import Clients from "@/src/components/Clients";
import Approach from "@/src/components/Approach";
import Experience from "@/src/components/Experience";
import RecentProjects from "@/src/components/RecentProjects";
import { FloatingNav } from "@/src/components/ui/FloatingNavbar";

const Home = () => {
  return (
    <main className="relative bg-black-100 flex justify-center items-center flex-col overflow-hidden mx-auto sm:px-10 px-5">
      <div className="max-w-7xl w-full">
        <FloatingNav navItems={navItems} />
        <Hero />
        <Grid />
        <RecentProjects />
        <Clients />
        <Experience />
        <Approach />
        <Footer />
      </div>
    </main>
  );
};

export default Home;
