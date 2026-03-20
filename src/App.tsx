/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, 
  Share2, 
  Target, 
  PenTool, 
  BarChart, 
  Mail, 
  Layout, 
  CheckCircle2, 
  ExternalLink,
  Instagram,
  Facebook,
  Globe,
  Award,
  Zap,
  Send,
  Loader2,
  Quote,
  ArrowRight,
  ArrowUp,
  TrendingUp,
  LogIn,
  LogOut,
  ShieldCheck,
  AlertCircle,
  MessageSquare,
  Sparkles,
  X,
  Bot,
  BrainCircuit,
  Lightbulb
} from 'lucide-react';
import { 
  db, 
  auth, 
  googleProvider, 
  collection, 
  addDoc, 
  query, 
  orderBy, 
  onSnapshot, 
  signInWithPopup, 
  signOut 
} from './firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { Timestamp } from 'firebase/firestore';
import { GoogleGenAI } from "@google/genai";

// Initialize Gemini
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

// Error handling helper
enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Error Boundary Component
function ErrorDisplay({ error }: { error: string }) {
  try {
    const parsed = JSON.parse(error);
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
        <div>
          <p className="font-bold">Database Error</p>
          <p className="text-sm opacity-90">We encountered an issue while processing your request. Please try again later.</p>
          {process.env.NODE_ENV !== 'production' && (
            <pre className="mt-2 text-[10px] overflow-auto max-w-full bg-red-100 p-2 rounded">
              {JSON.stringify(parsed, null, 2)}
            </pre>
          )}
        </div>
      </div>
    );
  } catch {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
        <p className="font-medium">{error}</p>
      </div>
    );
  }
}

const fadeIn = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6 }
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

// AI Chatbot Component
function AIChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: 'user' | 'model'; text: string }[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    
    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsLoading(true);

    try {
      const response = await ai.models.generateContent({
        model: "gemini-3.1-pro-preview",
        contents: [...messages.map(m => ({ role: m.role, parts: [{ text: m.text }] })), { role: 'user', parts: [{ text: userMsg }] }],
        config: {
          systemInstruction: "You are an AI assistant for Skyreach Marketing's digital marketing portfolio. You help users understand our services (SEO, Social Media, Ads, Canva, Content Writing). Be professional, helpful, and concise. Our contact email is skyreachmarketing.11@gmail.com and our Instagram is @skyreachmarketing.11.",
        }
      });
      
      const botText = response.text || "I'm sorry, I couldn't process that.";
      setMessages(prev => [...prev, { role: 'model', text: botText }]);
    } catch (error) {
      console.error("Chat error:", error);
      setMessages(prev => [...prev, { role: 'model', text: "Oops! Something went wrong. Please try again." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-8 left-8 z-50">
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="glass-card w-[350px] h-[500px] mb-4 flex flex-col overflow-hidden shadow-2xl"
          >
            <div className="p-4 border-b border-white/10 flex items-center justify-between bg-emerald-500/10">
              <div className="flex items-center gap-2">
                <Bot className="w-5 h-5 text-emerald-400" />
                <span className="font-bold text-sm">Marketing Assistant</span>
              </div>
              <button onClick={() => setIsOpen(false)} className="hover:text-emerald-400 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div ref={scrollRef} className="flex-grow overflow-y-auto p-4 space-y-4 scrollbar-hide">
              {messages.length === 0 && (
                <div className="text-center text-slate-400 mt-10">
                  <Sparkles className="w-8 h-8 mx-auto mb-2 opacity-20" />
                  <p className="text-sm">Ask me about our services!</p>
                </div>
              )}
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${m.role === 'user' ? 'bg-emerald-500 text-black' : 'bg-white/10 text-white'}`}>
                    {m.text}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-white/10 p-3 rounded-2xl">
                    <Loader2 className="w-4 h-4 animate-spin" />
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-white/10">
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Type a message..."
                  className="flex-grow bg-white/5 border border-white/10 rounded-full px-4 py-2 text-sm focus:outline-none focus:border-emerald-500 transition-colors"
                />
                <button 
                  onClick={handleSend}
                  disabled={isLoading}
                  className="bg-emerald-500 text-black p-2 rounded-full hover:bg-emerald-400 transition-colors disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(!isOpen)}
        className="bg-emerald-500 text-black p-4 rounded-full shadow-2xl shadow-emerald-500/20 hover:bg-emerald-400 transition-colors"
      >
        <MessageSquare className="w-6 h-6" />
      </motion.button>
    </div>
  );
}

// Marketing Insights Component (Search Grounding)
function MarketingInsights() {
  const [insight, setInsight] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchInsight = async () => {
    setIsLoading(true);
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: "What are the top 3 digital marketing trends for 2024? Provide a very brief, punchy summary.",
        config: {
          tools: [{ googleSearch: {} }]
        }
      });
      setInsight(response.text || "Stay ahead with data-driven strategies.");
    } catch (error) {
      console.error("Insight error:", error);
      setInsight("Focus on personalized content and AI integration.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInsight();
  }, []);

  return (
    <div className="glass-card p-8 mt-12 relative overflow-hidden group">
      <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
        <BrainCircuit className="w-24 h-24" />
      </div>
      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-5 h-5 text-emerald-400" />
          <span className="text-xs font-bold uppercase tracking-widest text-emerald-400">Live Marketing Insights</span>
        </div>
        <h3 className="text-2xl font-bold mb-4">Market Trends Today</h3>
        {isLoading ? (
          <div className="flex items-center gap-2 text-slate-400">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm">Analyzing global trends...</span>
          </div>
        ) : (
          <p className="text-slate-300 leading-relaxed max-w-2xl">{insight}</p>
        )}
        <button 
          onClick={fetchInsight}
          className="mt-6 text-sm font-bold text-emerald-400 hover:text-emerald-300 transition-colors flex items-center gap-2"
        >
          Refresh Insights <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// Quick Tips Component (Flash Lite)
function QuickTips() {
  const [tip, setTip] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const getTip = async () => {
    setIsLoading(true);
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3.1-flash-lite-preview",
        contents: "Give me one quick, actionable digital marketing tip for a small business owner. Max 15 words.",
      });
      setTip(response.text || "Optimize your Google Business Profile.");
    } catch (error) {
      setTip("Focus on high-quality visual content.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    getTip();
  }, []);

  return (
    <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-6 flex items-start gap-4">
      <div className="bg-emerald-500 p-2 rounded-lg text-black">
        <Lightbulb className="w-5 h-5" />
      </div>
      <div>
        <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400 block mb-1">Quick Tip</span>
        {isLoading ? (
          <div className="h-4 w-32 bg-white/5 animate-pulse rounded"></div>
        ) : (
          <p className="text-sm font-medium text-slate-200">{tip}</p>
        )}
      </div>
    </div>
  );
}

export default function App() {
  const [formState, setFormState] = useState({
    name: '',
    email: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [dbProjects, setDbProjects] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 400) {
        setShowScrollTop(true);
      } else {
        setShowScrollTop(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser && currentUser.email === "sasidasariramesh@gmail.com") {
        setIsAdmin(true);
      } else {
        setIsAdmin(false);
      }
    });
    return () => unsubscribe();
  }, []);

  // Projects Listener
  useEffect(() => {
    const q = query(collection(db, 'projects'), orderBy('order', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const projectsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setDbProjects(projectsData);
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'projects');
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    setLoginError(null);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      if (err.code === 'auth/popup-closed-by-user') {
        setLoginError("The login popup was closed before completing. Please try again.");
      } else if (err.code === 'auth/cancelled-by-user') {
        setLoginError("Login was cancelled. Please try again.");
      } else if (err.code === 'auth/popup-blocked') {
        setLoginError("The login popup was blocked by your browser. Please allow popups for this site.");
      } else {
        setLoginError("An unexpected error occurred during login. Please try again.");
        console.error("Login failed:", err);
      }
      
      // Clear error after 5 seconds
      setTimeout(() => setLoginError(null), 5000);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormState(prev => ({ ...prev, [name]: value }));
    // Clear field error when user starts typing
    if (fieldErrors[name]) {
      setFieldErrors(prev => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    
    if (!formState.name.trim()) {
      errors.name = "Name is required.";
    } else if (formState.name.length > 100) {
      errors.name = "Name must be less than 100 characters.";
    }

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!formState.email.trim()) {
      errors.email = "Email is required.";
    } else if (!emailRegex.test(formState.email)) {
      errors.email = "Please enter a valid email address.";
    }

    if (!formState.message.trim()) {
      errors.message = "Message is required.";
    } else if (formState.message.length > 2000) {
      errors.message = "Message must be less than 2000 characters.";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    
    try {
      const path = 'contacts';
      await addDoc(collection(db, path), {
        ...formState,
        createdAt: Timestamp.now()
      });
      
      setIsSubmitting(false);
      setIsSubmitted(true);
      setFormState({ name: '', email: '', message: '' });
      
      // Reset success message after 5 seconds
      setTimeout(() => setIsSubmitted(false), 5000);
    } catch (err: any) {
      setIsSubmitting(false);
      if (err.message?.includes('permission-denied')) {
        setError("You don't have permission to send messages right now. Please try again later.");
      } else {
        setError(err instanceof Error ? err.message : String(err));
      }
    }
  };

  const services = [
    {
      title: "Search Engine Optimization (SEO)",
      description: "Keyword research, on-page optimization, improving Google rankings, and increasing organic website traffic.",
      icon: <Search className="w-6 h-6 text-emerald-500" />
    },
    {
      title: "Social Media Marketing",
      description: "Managing Instagram and Facebook pages, creating content strategies, and increasing audience engagement.",
      icon: <Share2 className="w-6 h-6 text-blue-500" />
    },
    {
      title: "Facebook & Instagram Ads",
      description: "Creating targeted ad campaigns to generate leads and increase product or service sales.",
      icon: <Target className="w-6 h-6 text-indigo-500" />
    },
    {
      title: "Google Ads Campaigns",
      description: "Running search advertising campaigns that target customers actively searching for products or services.",
      icon: <Globe className="w-6 h-6 text-red-500" />
    },
    {
      title: "Canva Graphic Design",
      description: "Designing social media posts, promotional banners, and advertising creatives.",
      icon: <Layout className="w-6 h-6 text-purple-500" />
    },
    {
      title: "Content Writing",
      description: "Writing SEO blogs, website content, and social media captions to attract customers.",
      icon: <PenTool className="w-6 h-6 text-amber-500" />
    }
  ];

  const projects = dbProjects.length > 0 ? dbProjects : [
    {
      title: "Restaurant Social Media Growth",
      description: "Implemented a 3-month content strategy focusing on high-quality food photography, behind-the-scenes storytelling, and targeted local influencer outreach. Managed a consistent content calendar and engaged with the community daily to build brand loyalty.",
      result: "Achieved a 45% increase in Instagram followers, a 30% rise in monthly table reservations via social media, and a 200% boost in organic reach.",
      strategies: ["Local Keyword Targeting", "On-Page Content Optimization", "Social-to-Web Link Building"]
    },
    {
      title: "Local Gym SEO Optimization",
      description: "Conducted a comprehensive SEO audit and keyword research targeting high-intent local terms. Optimized Google Business Profile, improved site speed, and created a series of SEO-optimized blog posts on fitness and nutrition to drive authority.",
      result: "Secured Top 3 rankings for 'gym near me' and 'fitness center' in the local area, resulting in a 60% increase in organic website traffic and a 25% growth in membership sign-ups.",
      strategies: ["High-Intent Local Keyword Research", "Google Business Profile Optimization", "Authority-Building Backlinks"]
    },
    {
      title: "Clothing Brand Facebook Ads",
      description: "Launched a multi-stage Facebook and Instagram ad campaign utilizing A/B testing for creatives and lookalike audiences. Implemented dynamic retargeting to re-engage previous website visitors and abandoned cart users with personalized offers.",
      result: "Delivered a 4.5x Return on Ad Spend (ROAS), reduced Cost Per Acquisition (CPA) by 35%, and generated over 500 new customer conversions within the first two months.",
      strategies: ["Ad Copy Keyword Optimization", "Landing Page SEO", "Social Signal Enhancement"]
    },
    {
      title: "E-commerce Product Promotion",
      description: "Developed a holistic digital marketing strategy integrating social media promotion, email marketing, and seasonal Google Ads campaigns. Focused on optimizing product descriptions and creating high-converting landing pages for key products.",
      result: "Generated a 70% increase in monthly online revenue, improved the website conversion rate by 1.5%, and expanded the brand's email subscriber list by 40%.",
      strategies: ["Product-Specific Keyword Research", "Metadata & Schema Optimization", "Internal Linking Strategy"]
    }
  ];

  const tools = [
    "Google Analytics", 
    "Google Search Console", 
    "Meta Ads Manager", 
    "Google Ads", 
    "Canva Design Platform", 
    "SEO Keyword Research Tools"
  ];

  const testimonials = [
    {
      quote: "Skyreach Marketing's social media strategy completely transformed our restaurant's online presence. We've seen a massive spike in bookings!",
      author: "Rajesh Kumar",
      company: "The Spice Garden"
    },
    {
      quote: "Our gym's visibility on Google skyrocketed thanks to Skyreach Marketing's SEO expertise. We're getting more sign-ups than ever before.",
      author: "Sarah Johnson",
      company: "Peak Fitness"
    },
    {
      quote: "The Facebook ad campaigns Skyreach Marketing ran for our clothing brand were incredibly effective. Our ROAS has never been higher.",
      author: "Michael Chen",
      company: "Urban Wear"
    }
  ];

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-emerald-500/30 selection:text-emerald-400">
      {/* Navbar */}
      <nav className="fixed top-0 w-full bg-black/50 backdrop-blur-xl border-b border-white/5 z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <span className="font-display text-2xl tracking-tight uppercase">Skyreach Marketing</span>
          <div className="hidden md:flex space-x-10 text-xs font-bold uppercase tracking-widest text-slate-400">
            <a href="#about" className="hover:text-emerald-400 transition-colors">About</a>
            <a href="#services" className="hover:text-emerald-400 transition-colors">Services</a>
            <a href="#projects" className="hover:text-emerald-400 transition-colors">Projects</a>
            <a href="#contact" className="hover:text-emerald-400 transition-colors">Contact</a>
          </div>
          <a 
            href="mailto:skyreachmarketing.11@gmail.com"
            className="bg-white text-black px-6 py-2.5 rounded-full text-xs font-bold uppercase tracking-widest hover:bg-emerald-400 transition-all"
          >
            Hire Me
          </a>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-40 pb-32 px-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_-20%,rgba(16,185,129,0.15),transparent_60%)]"></div>
        <div className="max-w-7xl mx-auto relative z-10">
          <motion.div 
            initial="initial"
            animate="animate"
            variants={staggerContainer}
          >
            <motion.div variants={fadeIn} className="flex items-center gap-3 mb-8">
              <span className="w-12 h-[1px] bg-emerald-500"></span>
              <span className="text-xs font-bold uppercase tracking-[0.3em] text-emerald-400">Digital Marketing Specialist</span>
            </motion.div>
            
            <motion.h1 
              variants={fadeIn}
              className="text-[15vw] md:text-[12vw] lg:text-[10vw] text-display mb-12"
            >
              Scale <span className="text-emerald-500">Bolder</span><br />
              Grow <span className="text-emerald-500 italic font-serif lowercase tracking-normal">Faster</span>
            </motion.h1>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-end">
              <motion.div variants={fadeIn} className="lg:col-span-6">
                <p className="text-xl md:text-2xl text-slate-400 leading-relaxed mb-12 font-light">
                  I architect digital strategies that transform brands. From high-rank SEO to high-conversion ads, I deliver measurable growth in the digital age.
                </p>
                <div className="flex flex-wrap gap-6">
                  <a href="#projects" className="btn-primary flex items-center gap-3">
                    View Portfolio <ArrowRight className="w-5 h-5" />
                  </a>
                  <a href="#contact" className="btn-secondary">
                    Start a Project
                  </a>
                </div>
              </motion.div>
              
              <motion.div variants={fadeIn} className="lg:col-span-6">
                <QuickTips />
              </motion.div>
            </div>

            <motion.div variants={fadeIn}>
              <MarketingInsights />
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-32 bg-white text-black rounded-[4rem] -mt-12 relative z-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-end mb-24 gap-8">
            <div className="max-w-2xl">
              <h2 className="text-6xl md:text-8xl font-display uppercase mb-8">Core<br />Expertise</h2>
              <p className="text-xl text-slate-600 font-light">Precision-engineered solutions for the modern digital landscape.</p>
            </div>
            <div className="text-right">
              <div className="text-8xl font-display text-slate-100">06</div>
              <div className="text-xs font-bold uppercase tracking-widest text-slate-400">Specialized Services</div>
            </div>
          </div>
          
          <motion.div 
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12"
          >
            {services.map((service, index) => (
              <motion.div 
                key={index}
                variants={fadeIn}
                className="group p-10 rounded-[2.5rem] border border-slate-100 bg-slate-50 hover:bg-black hover:text-white transition-all duration-500"
              >
                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mb-8 shadow-xl group-hover:scale-110 transition-transform duration-500">
                  {service.icon}
                </div>
                <h3 className="text-2xl font-bold mb-4 group-hover:text-emerald-400 transition-colors">{service.title}</h3>
                <p className="text-slate-500 group-hover:text-slate-400 leading-relaxed">{service.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Typical Work Section */}
      <section className="py-24 bg-slate-900 text-white overflow-hidden relative">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-emerald-600/10 blur-3xl rounded-full -translate-y-1/2 translate-x-1/2"></div>
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-8">Typical Work I Do For Businesses</h2>
              <div className="space-y-6">
                {[
                  "Create and manage social media marketing campaigns",
                  "Design professional social media graphics and advertising creatives",
                  "Run targeted Facebook and Instagram advertising campaigns",
                  "Optimize websites for better Google search rankings",
                  "Write SEO-friendly blog articles and marketing content",
                  "Analyze marketing performance and improve campaign results"
                ].map((item, index) => (
                  <motion.div 
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    viewport={{ once: true }}
                    className="flex items-start gap-4"
                  >
                    <div className="mt-1 bg-emerald-500/20 p-1 rounded-full">
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    </div>
                    <p className="text-slate-300">{item}</p>
                  </motion.div>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-4">
                <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
                  <BarChart className="w-8 h-8 text-emerald-400 mb-4" />
                  <div className="text-2xl font-bold">100%</div>
                  <div className="text-sm text-slate-400 uppercase tracking-wider font-semibold">Data Driven</div>
                </div>
                <div className="bg-emerald-600 p-6 rounded-2xl">
                  <Zap className="w-8 h-8 text-white mb-4" />
                  <div className="text-2xl font-bold">Fast</div>
                  <div className="text-sm text-emerald-100 uppercase tracking-wider font-semibold">Growth Focus</div>
                </div>
              </div>
              <div className="pt-8 space-y-4">
                <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
                  <Award className="w-8 h-8 text-emerald-400 mb-4" />
                  <div className="text-2xl font-bold">Expert</div>
                  <div className="text-sm text-slate-400 uppercase tracking-wider font-semibold">SEO & Ads</div>
                </div>
                <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
                  <Layout className="w-8 h-8 text-emerald-400 mb-4" />
                  <div className="text-2xl font-bold">Creative</div>
                  <div className="text-sm text-slate-400 uppercase tracking-wider font-semibold">Design & Copy</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Projects Section */}
      <section id="projects" className="py-32 bg-[#050505]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-end mb-24 gap-8">
            <div className="max-w-2xl">
              <h2 className="text-6xl md:text-8xl font-display uppercase mb-8">Selected<br />Works</h2>
              <p className="text-xl text-slate-400 font-light">A showcase of high-impact digital transformations.</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {projects.map((project, index) => (
              <motion.div 
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="group glass-card p-10 flex flex-col h-full hover:border-emerald-500/50 transition-all duration-500"
              >
                <div className="flex-grow">
                  <h3 className="text-3xl font-bold mb-6 group-hover:text-emerald-400 transition-colors">{project.title}</h3>
                  <p className="text-slate-400 mb-8 leading-relaxed text-lg font-light">{project.description}</p>
                  
                  <div className="mb-10">
                    <div className="text-[10px] font-bold text-emerald-500 uppercase tracking-[0.3em] mb-4">Strategies</div>
                    <div className="flex flex-wrap gap-3">
                      {project.strategies.map((strategy, sIndex) => (
                        <span key={sIndex} className="px-4 py-1.5 bg-white/5 text-slate-300 text-xs font-medium rounded-full border border-white/10">
                          {strategy}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                
                <div className="pt-10 mt-auto border-t border-white/10">
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.3em] mb-4">Impact</div>
                  <div className="bg-emerald-500/5 p-8 rounded-3xl border border-emerald-500/10">
                    <p className="text-emerald-400 font-medium leading-relaxed italic text-lg">"{project.result}"</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-24 bg-emerald-600 text-white relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.1),transparent)]"></div>
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight mb-4">What Clients Say</h2>
            <p className="text-emerald-100 max-w-2xl mx-auto">Don't just take my word for it. Here's what business owners have to say about our collaboration.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((t, index) => (
              <motion.div 
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                whileHover={{ y: -5 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true, margin: "-50px" }}
                className="bg-white/10 backdrop-blur-sm p-8 rounded-3xl border border-white/20 flex flex-col h-full hover:bg-white/15 transition-colors"
              >
                <Quote className="w-10 h-10 text-emerald-300 mb-6 opacity-50" />
                <p className="text-lg font-medium mb-8 flex-grow italic leading-relaxed">"{t.quote}"</p>
                <div>
                  <div className="font-bold text-white">{t.author}</div>
                  <div className="text-emerald-200 text-sm">{t.company}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Tools Section */}
      <section className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight mb-4">Marketing Tools I Use</h2>
            <p className="text-slate-600">Industry-standard tools for analysis, execution, and optimization.</p>
          </div>
          <div className="flex flex-wrap justify-center gap-4">
            {tools.map((tool, index) => (
              <motion.span 
                key={index}
                whileHover={{ scale: 1.05 }}
                className="px-6 py-3 bg-white border border-slate-200 rounded-full text-sm font-semibold text-slate-700 shadow-sm"
              >
                {tool}
              </motion.span>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section overhaul */}
      <section id="contact" className="py-32 bg-white text-black rounded-[4rem]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-24 items-start">
            <div>
              <h2 className="text-6xl md:text-8xl font-display uppercase mb-12">Let's<br />Talk</h2>
              <p className="text-2xl text-slate-600 font-light mb-16 leading-relaxed">
                Ready to elevate your digital presence? Let's discuss how we can scale your brand together.
              </p>
              
              <div className="space-y-10">
                <a href="mailto:skyreachmarketing.11@gmail.com" className="group flex items-center gap-6">
                  <div className="w-16 h-16 bg-black text-white rounded-2xl flex items-center justify-center group-hover:bg-emerald-500 group-hover:text-black transition-all duration-500">
                    <Mail className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">Email Me</div>
                    <div className="text-xl font-bold">skyreachmarketing.11@gmail.com</div>
                  </div>
                </a>
                
                <div className="flex gap-4">
                  {[
                    { Icon: Instagram, href: "https://www.instagram.com/skyreachmarketing.11/" },
                    { Icon: Facebook, href: "https://www.facebook.com/profile.php?id=61574345203399" },
                    { Icon: Globe, href: "https://skyreachmarketing.com" }
                  ].map(({ Icon, href }, i) => (
                    <a key={i} href={href} target="_blank" rel="noopener noreferrer" className="w-14 h-14 border border-slate-200 rounded-2xl flex items-center justify-center hover:bg-black hover:text-white transition-all duration-500">
                      <Icon className="w-5 h-5" />
                    </a>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-slate-50 p-12 rounded-[3rem] border border-slate-100">
              <form onSubmit={handleSubmit} className="space-y-8">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-slate-400 ml-1">Full Name</label>
                  <input 
                    required
                    type="text" 
                    name="name"
                    value={formState.name}
                    onChange={handleInputChange}
                    placeholder="Enter your name"
                    className="w-full bg-white border border-slate-200 rounded-2xl px-6 py-5 focus:outline-none focus:border-emerald-500 transition-all"
                  />
                  {fieldErrors.name && <p className="text-xs text-red-500 ml-1">{fieldErrors.name}</p>}
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-slate-400 ml-1">Email Address</label>
                  <input 
                    required
                    type="email" 
                    name="email"
                    value={formState.email}
                    onChange={handleInputChange}
                    placeholder="Enter your email"
                    className="w-full bg-white border border-slate-200 rounded-2xl px-6 py-5 focus:outline-none focus:border-emerald-500 transition-all"
                  />
                  {fieldErrors.email && <p className="text-xs text-red-500 ml-1">{fieldErrors.email}</p>}
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-slate-400 ml-1">Your Message</label>
                  <textarea 
                    required
                    name="message"
                    rows={4}
                    value={formState.message}
                    onChange={handleInputChange}
                    placeholder="Tell me about your goals"
                    className="w-full bg-white border border-slate-200 rounded-2xl px-6 py-5 focus:outline-none focus:border-emerald-500 transition-all resize-none"
                  ></textarea>
                  {fieldErrors.message && <p className="text-xs text-red-500 ml-1">{fieldErrors.message}</p>}
                </div>
                
                <button 
                  disabled={isSubmitting}
                  type="submit"
                  className="w-full bg-black text-white py-6 rounded-2xl font-bold text-lg hover:bg-emerald-500 hover:text-black transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                >
                  {isSubmitting ? <Loader2 className="w-6 h-6 animate-spin" /> : "Send Message"}
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      <AIChatbot />
      
      {/* Footer */}
      <footer className="py-12 border-t border-white/10 bg-black">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex flex-col gap-2">
            <div className="text-slate-500 text-sm">
              © {new Date().getFullYear()} Skyreach Marketing. All rights reserved.
            </div>
            {user ? (
              <div className="flex items-center gap-3">
                <button 
                  onClick={handleLogout}
                  className="text-xs text-slate-400 hover:text-red-500 flex items-center gap-1 transition-colors"
                >
                  <LogOut className="w-3 h-3" /> Logout
                </button>
                {isAdmin && (
                  <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" /> Admin
                  </span>
                )}
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <button 
                  onClick={handleLogin}
                  className="text-xs text-slate-400 hover:text-emerald-600 flex items-center gap-1 transition-colors"
                >
                  <LogIn className="w-3 h-3" /> Admin Login
                </button>
                <AnimatePresence>
                  {loginError && (
                    <motion.div 
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      className="text-[10px] text-red-500 flex items-center gap-1"
                    >
                      <AlertCircle className="w-3 h-3" /> {loginError}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>
          <div className="flex space-x-8 text-sm font-medium text-slate-400">
            <a href="#about" className="hover:text-emerald-400 transition-colors">About</a>
            <a href="#services" className="hover:text-emerald-400 transition-colors">Services</a>
            <a href="#projects" className="hover:text-emerald-400 transition-colors">Projects</a>
            <a href="#contact" className="hover:text-emerald-400 transition-colors">Contact</a>
          </div>
        </div>
      </footer>

      <AnimatePresence>
        {showScrollTop && (
          <motion.button
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            onClick={scrollToTop}
            className="fixed bottom-8 right-8 z-50 p-4 bg-white text-black rounded-full shadow-2xl hover:bg-emerald-500 transition-colors"
          >
            <ArrowUp className="w-6 h-6" />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
