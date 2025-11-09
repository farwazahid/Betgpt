import Layout from "./Layout.jsx";

import Dashboard from "./Dashboard";

import Markets from "./Markets";

import Opportunities from "./Opportunities";

import Portfolio from "./Portfolio";

import Backtest from "./Backtest";

import Settings from "./Settings";

import Analytics from "./Analytics";

import AlphaHunter from "./AlphaHunter";

import News from "./News";

import TestingGuide from "./TestingGuide";

import Pricing from "./Pricing";

import Subscription from "./Subscription";

import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';

const PAGES = {
    
    Dashboard: Dashboard,
    
    Markets: Markets,
    
    Opportunities: Opportunities,
    
    Portfolio: Portfolio,
    
    Backtest: Backtest,
    
    Settings: Settings,
    
    Analytics: Analytics,
    
    AlphaHunter: AlphaHunter,
    
    News: News,
    
    TestingGuide: TestingGuide,
    
    Pricing: Pricing,
    
    Subscription: Subscription,
    
}

function _getCurrentPage(url) {
    if (url.endsWith('/')) {
        url = url.slice(0, -1);
    }
    let urlLastPart = url.split('/').pop();
    if (urlLastPart.includes('?')) {
        urlLastPart = urlLastPart.split('?')[0];
    }

    const pageName = Object.keys(PAGES).find(page => page.toLowerCase() === urlLastPart.toLowerCase());
    return pageName || Object.keys(PAGES)[0];
}

// Create a wrapper component that uses useLocation inside the Router context
function PagesContent() {
    const location = useLocation();
    const currentPage = _getCurrentPage(location.pathname);
    
    return (
        <Layout currentPageName={currentPage}>
            <Routes>            
                
                    <Route path="/" element={<Dashboard />} />
                
                
                <Route path="/Dashboard" element={<Dashboard />} />
                
                <Route path="/Markets" element={<Markets />} />
                
                <Route path="/Opportunities" element={<Opportunities />} />
                
                <Route path="/Portfolio" element={<Portfolio />} />
                
                <Route path="/Backtest" element={<Backtest />} />
                
                <Route path="/Settings" element={<Settings />} />
                
                <Route path="/Analytics" element={<Analytics />} />
                
                <Route path="/AlphaHunter" element={<AlphaHunter />} />
                
                <Route path="/News" element={<News />} />
                
                <Route path="/TestingGuide" element={<TestingGuide />} />
                
                <Route path="/Pricing" element={<Pricing />} />
                
                <Route path="/Subscription" element={<Subscription />} />
                
            </Routes>
        </Layout>
    );
}

export default function Pages() {
    return (
        <Router>
            <PagesContent />
        </Router>
    );
}