import { useEffect } from "react";
import AOS from 'aos';
import 'aos/dist/aos.css';
import Header from "../components/landingpage/Header";
import Hero from "../components/landingpage/Hero";
import Features from "../components/landingpage/Features";
import Pricing from "../components/landingpage/Pricing";
import Testimonials from "../components/landingpage/Testimonials";
import FAQ from "../components/landingpage/FAQ";
import Contact from "../components/landingpage/Contact";
import Footer from "../components/landingpage/Footer";
import ImageWithText from "../components/landingpage/ImageWithText";
import ImageWithTextBlock from "../components/landingpage/ImageWithTextBlock";
const LandingPage: React.FC = () => {
    useEffect(() => {
        AOS.init({
            duration: 800,
            easing: 'ease-out-cubic',
            once: true,
            offset: 100,
        });
    }, []);

    return (
        <>
            <Header />
            <Hero />
            <Features />

            <Pricing />

            <Testimonials />
            <FAQ></FAQ>
            <Contact />
            <Footer />
        </>
    );
};


export default LandingPage;