import { useEffect, useRef, useState } from 'react';
import { 
  FlaskConical, 
  Microscope, 
  TestTube, 
  Shield, 
  Zap, 
  Users, 
  CheckCircle2,
  ArrowRight,
  Beaker,
  Activity,
  Award,
  TrendingUp,
  Menu,
  X,
  LogIn,
  Mail,
  Phone,
  MapPin,
  Facebook,
  Twitter,
  Instagram,
  Linkedin
} from 'lucide-react';
import heroImage from '../../assets/images/hero.png';
import logoImg from '../../assets/icons/logo.png';
import equipmentImage from '../../assets/images/laboratory_equipment.png';
import roomImage from '../../assets/images/laboratory_room.png';
import teamImage from '../../assets/images/team.png';
import user1Image from '../../assets/images/user1.png';
import user2Image from '../../assets/images/user2.png';
import user3Image from '../../assets/images/user3.png';

export default function Home() {
  const [isVisible, setIsVisible] = useState({});
  const [scrollY, setScrollY] = useState(0);
  const [isScrolled, setIsScrolled] = useState(false);
  const sectionsRef = useRef({});
  const heroRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      setScrollY(currentScrollY);
      setIsScrolled(currentScrollY > 50);
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -100px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setIsVisible((prev) => ({
            ...prev,
            [entry.target.id]: true
          }));
        }
      });
    }, observerOptions);

    Object.values(sectionsRef.current).forEach((el) => {
      if (el) observer.observe(el);
    });

    return () => {
      Object.values(sectionsRef.current).forEach((el) => {
        if (el) observer.unobserve(el);
      });
    };
  }, []);

  const features = [
    {
      icon: FlaskConical,
      title: 'Accuracy of Results',
      description: '99% accuracy rate with advanced analytical technology',
      value: '99%',
      number: '01'
    },
    {
      icon: Microscope,
      title: 'Technological Innovation',
      description: 'Cutting-edge equipment and state-of-the-art facilities',
      value: 'Tech',
      number: '02'
    },
    {
      icon: Shield,
      title: 'Safety & Security',
      description: 'Strict compliance with international safety standards',
      value: '100%',
      number: '03'
    },
    {
      icon: Zap,
      title: 'Fast Results',
      description: 'Optimized processes deliver results within 24 hours',
      value: '24h',
      number: '04'
    },
    {
      icon: Users,
      title: 'Professional Team',
      description: 'Team of experienced and certified laboratory experts',
      value: '500+',
      number: '05'
    },
    {
      icon: Award,
      title: 'International Certification',
      description: 'ISO certified and internationally recognized standards',
      value: 'ISO',
      number: '06'
    }
  ];

  const services = [
    {
      icon: TestTube,
      title: 'Blood Testing',
      description: 'Comprehensive blood testing with high accuracy',
      stats: '1000+'
    },
    {
      icon: Beaker,
      title: 'Biochemical Analysis',
      description: 'Analysis of important biochemical indicators',
      stats: '500+'
    },
    {
      icon: Activity,
      title: 'Immunology Testing',
      description: 'In-depth immunology testing',
      stats: '800+'
    },
    {
      icon: TrendingUp,
      title: 'Research & Development',
      description: 'Research and development of new methods',
      stats: '200+'
    }
  ];

  // Animated background particles
  const particles = Array.from({ length: 30 }, (_, i) => ({
    id: i,
    size: Math.random() * 4 + 2,
    left: Math.random() * 100,
    top: Math.random() * 100,
    delay: Math.random() * 5,
    duration: Math.random() * 3 + 5
  }));

  return (
    <div className="min-h-screen bg-gradient-to-br from-pastel-blue-lighter via-pastel-blue-light to-white overflow-hidden relative">
      {/* Animated Background with Particles */}
      <div className="fixed inset-0 z-0 overflow-hidden">
        {/* Gradient Background Animation */}
        <div 
          className="absolute inset-0 animate-gradient"
          style={{
            background: 'linear-gradient(-45deg, #99EBFF, #33D6FF, #00CCFF, #99EBFF)',
            backgroundSize: '400% 400%'
          }}
        ></div>
        
        {/* Animated Particles */}
        <div className="absolute inset-0">
          {particles.map((particle) => (
            <div
              key={particle.id}
              className="absolute rounded-full bg-pastel-blue/30 animate-particle"
              style={{
                width: `${particle.size}px`,
                height: `${particle.size}px`,
                left: `${particle.left}%`,
                top: `${particle.top}%`,
                animationDelay: `${particle.delay}s`,
                animationDuration: `${particle.duration}s`
              }}
            ></div>
          ))}
        </div>

        {/* Floating Blobs */}
        <div className="absolute top-20 left-10 w-96 h-96 bg-pastel-blue/20 rounded-full blur-3xl animate-blob"></div>
        <div className="absolute top-40 right-10 w-96 h-96 bg-pastel-blue-light/20 rounded-full blur-3xl animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-1/2 w-96 h-96 bg-pastel-blue/15 rounded-full blur-3xl animate-blob animation-delay-4000"></div>
        <div className="absolute bottom-20 right-1/4 w-72 h-72 bg-pastel-blue-dark/10 rounded-full blur-3xl animate-blob animation-delay-3000"></div>
      </div>

      {/* Floating Header */}
      <header 
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled 
            ? 'glass-enhanced shadow-lg py-3' 
            : 'bg-transparent py-6'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <img src={logoImg} alt="Lab Management" className="w-10 h-10 object-contain" />
              <span className="text-xl font-bold text-gray-900">Lab Management</span>
            </div>

            {/* Navigation - Hidden on mobile */}
            <nav className="hidden md:flex items-center gap-2">
              <a href="#features" className={`relative px-4 py-2 text-base font-medium transition-all duration-300 rounded-lg group backdrop-blur-sm ${
                isScrolled ? 'text-gray-900' : 'text-white/90'
              }`}>
                <span className={`relative z-10 transition-colors duration-300 ${
                  isScrolled ? 'group-hover:text-gray-700' : 'group-hover:text-gray-700'
                }`}>Features</span>
                <span className="absolute inset-0 bg-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 shadow-md"></span>
              </a>
              <a href="#services" className={`relative px-4 py-2 text-base font-medium transition-all duration-300 rounded-lg group backdrop-blur-sm ${
                isScrolled ? 'text-gray-900' : 'text-white/90'
              }`}>
                <span className={`relative z-10 transition-colors duration-300 ${
                  isScrolled ? 'group-hover:text-gray-700' : 'group-hover:text-gray-700'
                }`}>Services</span>
                <span className="absolute inset-0 bg-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 shadow-md"></span>
              </a>
              <a href="#stats" className={`relative px-4 py-2 text-base font-medium transition-all duration-300 rounded-lg group backdrop-blur-sm ${
                isScrolled ? 'text-gray-900' : 'text-white/90'
              }`}>
                <span className={`relative z-10 transition-colors duration-300 ${
                  isScrolled ? 'group-hover:text-gray-700' : 'group-hover:text-gray-700'
                }`}>About</span>
                <span className="absolute inset-0 bg-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 shadow-md"></span>
              </a>
              <a href="#cta" className={`relative px-4 py-2 text-base font-medium transition-all duration-300 rounded-lg group backdrop-blur-sm ${
                isScrolled ? 'text-gray-900' : 'text-white/90'
              }`}>
                <span className={`relative z-10 transition-colors duration-300 ${
                  isScrolled ? 'group-hover:text-gray-700' : 'group-hover:text-gray-700'
                }`}>Contact</span>
                <span className="absolute inset-0 bg-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 shadow-md"></span>
              </a>
            </nav>

            {/* Login Button */}
        <a 
          href="/login" 
              className="group relative flex items-center gap-2 px-6 py-2.5 text-gray-700 rounded-xl font-medium transition-all duration-300 border border-transparent hover:bg-white hover:shadow-lg hover:scale-105 hover:border-dashed hover:border-black focus:border-dashed focus:!border-black focus:bg-white focus:text-black outline-none"
            >
              <LogIn className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
              <span>Login</span>
            </a>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section 
        ref={heroRef}
        className="relative min-h-screen flex items-center justify-center overflow-hidden z-10 pt-20"
      >
        {/* Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left: Text Content */}
            <div className="space-y-8 animate-slide-in-left">
              <div className="inline-flex items-center gap-2 px-4 py-2 glass-enhanced rounded-full border border-pastel-blue/30 hover-glow animate-scale-in">
                <div className="flex -space-x-2">
                  {[user1Image, user2Image, user3Image].map((userImg, i) => (
                    <img
                      key={i}
                      src={userImg}
                      alt={`Client ${i + 1}`}
                      className="w-8 h-8 rounded-full border-2 border-white shadow-md animate-scale-in object-cover"
                      style={{ animationDelay: `${i * 0.1}s` }}
                      onError={(e) => {
                        e.target.style.display = 'none';
                        const fallback = document.createElement('div');
                        fallback.className = 'w-8 h-8 rounded-full bg-pastel-blue border-2 border-white shadow-md';
                        e.target.parentNode.appendChild(fallback);
                      }}
                    />
                  ))}
                </div>
                <span className="text-sm font-medium text-gray-700">+10K Clients</span>
              </div>
              
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold leading-tight">
                <span className="text-gradient-animate inline-block py-1 rounded-lg bg-white/20 backdrop-blur-sm">Next-Gen</span>
                <br />
                <span className="text-gray-900">Laboratory</span>
                <br />
                <span className="text-blue-700">Solutions</span>
              </h1>
              
              <p className="text-xl text-gray-800 max-w-xl leading-relaxed animate-fade-in-delay">
                Advanced laboratory services with AI-powered precision and comprehensive analytical solutions for modern healthcare.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 animate-fade-in-delay-2">
                <button className="group relative px-8 py-4 bg-gradient-to-br from-gray-900 to-gray-800 text-white rounded-xl font-semibold text-lg shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:scale-105 border-2 border-gray-700 hover:border-gray-600 overflow-hidden">
                  <span className="relative z-10 flex items-center gap-2">
                    See Dashboard
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-pastel-blue/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </button>
                <button className="group relative px-8 py-4 bg-white text-gray-900 rounded-xl font-semibold text-lg border-2 border-gray-200 hover:border-gray-300 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 overflow-hidden">
                  <span className="relative z-10">Learn More</span>
                  <div className="absolute inset-0 bg-gray-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </button>
              </div>
            </div>

            {/* Right: Hero Image with Floating Stats */}
            <div className="relative animate-slide-in-right">
              {/* Main Image Container */}
              <div className="relative w-full aspect-square md:aspect-[4/3] rounded-3xl overflow-hidden shadow-2xl transform hover:scale-105 transition-all duration-700 group">
                {/* Hero Image */}
                <img
                  src={heroImage}
                  alt="Modern Laboratory"
                  className="w-full h-full object-cover transform hover:scale-110 transition-transform duration-700"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextElementSibling.style.display = 'block';
                  }}
                />
                
                {/* Fallback if image not found */}
                <div className="absolute inset-0 bg-gradient-to-br from-pastel-blue via-pastel-blue-light to-pastel-blue-lighter hidden">
                  <div className="absolute inset-0 opacity-20">
                    <Microscope className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-48 h-48 text-white/20" />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent"></div>
                </div>
                
                {/* Image overlay on hover */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
              </div>
              
              {/* Floating Stats Card 1 - Bottom Left */}
              <div 
                className="absolute -bottom-6 -left-6 bg-white/95 backdrop-blur-md p-5 rounded-2xl shadow-2xl transform hover:scale-110 transition-all duration-300 border-2 border-pastel-blue/30 animate-scale-in"
                style={{ animationDelay: '0.8s' }}
              >
                <div className="flex items-center gap-3">
                  <div>
                    <div className="text-2xl font-black text-gray-900">
                      99.9%
                    </div>
                    <div className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Accuracy Rate</div>
                  </div>
                </div>
              </div>
              
              {/* Floating Stats Card 2 - Top Right */}
              <div 
                className="absolute -top-6 -right-6 bg-white/95 backdrop-blur-md p-5 rounded-2xl shadow-2xl transform hover:scale-110 transition-all duration-300 border-2 border-pastel-blue/30 animate-scale-in"
                style={{ animationDelay: '1s' }}
              >
                <div className="flex items-center gap-3">
                  <div>
                    <div className="text-2xl font-black text-gray-900">
                      24/7
                    </div>
                    <div className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Support</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Image Gallery Section - Placeholders for Equipment, Doctors, Staff */}
      <section 
        id="gallery"
        ref={(el) => (sectionsRef.current.gallery = el)}
        className="relative py-24 px-4 sm:px-6 lg:px-8 bg-white z-10 overflow-hidden"
      >
        {/* Background Pattern - Dots */}
        <div className="absolute inset-0 opacity-[0.03]">
          <div 
            className="absolute top-0 left-0 w-full h-full"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%2300CCFF' fill-opacity='0.4'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
              backgroundSize: '60px 60px'
            }}
          ></div>
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          <div className={`text-center mb-16 transition-all duration-1000 ${isVisible.gallery ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Our Facilities
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              State-of-the-art equipment and professional team
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Equipment Image */}
            <div className={`group relative overflow-hidden rounded-2xl aspect-[4/3] hover:shadow-xl transition-all duration-500 transform hover:scale-105 ${
              isVisible.gallery ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
            }`}>
              <img
                src={equipmentImage}
                alt="Advanced Laboratory Equipment"
                className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextElementSibling.style.display = 'block';
                }}
              />
              {/* Fallback gradient */}
              <div className="absolute inset-0 bg-gradient-to-br from-pastel-blue-light to-pastel-blue hidden">
                <div className="absolute inset-0 flex items-center justify-center">
                  <Microscope className="w-24 h-24 text-white/50" />
                </div>
              </div>
              <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/70 via-black/40 to-transparent">
                <h3 className="text-white text-xl font-bold mb-2">Advanced Equipment</h3>
                <p className="text-white/90 text-sm">Modern laboratory instruments</p>
              </div>
            </div>

            {/* Team Image */}
            <div className={`group relative overflow-hidden rounded-2xl aspect-[4/3] hover:shadow-xl transition-all duration-500 transform hover:scale-105 ${
              isVisible.gallery ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
            }`} style={{ transitionDelay: '100ms' }}>
              <img
                src={teamImage}
                alt="Expert Laboratory Team"
                className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextElementSibling.style.display = 'block';
                }}
              />
              {/* Fallback gradient */}
              <div className="absolute inset-0 bg-gradient-to-br from-pastel-blue to-pastel-blue-dark hidden">
                <div className="absolute inset-0 flex items-center justify-center">
                  <Users className="w-24 h-24 text-white/50" />
                </div>
              </div>
              <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/70 via-black/40 to-transparent">
                <h3 className="text-white text-xl font-bold mb-2">Expert Team</h3>
                <p className="text-white/90 text-sm">Certified professionals</p>
              </div>
            </div>

            {/* Laboratory Room Image */}
            <div className={`group relative overflow-hidden rounded-2xl aspect-[4/3] hover:shadow-xl transition-all duration-500 transform hover:scale-105 ${
              isVisible.gallery ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
            }`} style={{ transitionDelay: '200ms' }}>
              <img
                src={roomImage}
                alt="Modern Laboratory Room"
                className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextElementSibling.style.display = 'block';
                }}
              />
              {/* Fallback gradient */}
              <div className="absolute inset-0 bg-gradient-to-br from-pastel-blue-dark to-pastel-blue-darker hidden">
                <div className="absolute inset-0 flex items-center justify-center">
                  <FlaskConical className="w-24 h-24 text-white/50" />
                </div>
              </div>
              <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/70 via-black/40 to-transparent">
                <h3 className="text-white text-xl font-bold mb-2">Modern Laboratory</h3>
                <p className="text-white/90 text-sm">Clean and sterile environment</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section 
        id="features"
        ref={(el) => (sectionsRef.current.features = el)}
        className="relative py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-gray-900 to-gray-800 z-10"
      >
        <div className="max-w-7xl mx-auto">
          <div className={`text-center mb-16 transition-all duration-1000 ${isVisible.features ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Our Primary Features
            </h2>
            <p className="text-lg text-white/90 max-w-2xl mx-auto">
              Advanced technology and professional processes for modern laboratory solutions
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div
                  key={index}
                  className={`group relative p-6 bg-white/95 backdrop-blur-md rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 ${
                    isVisible.features 
                      ? 'opacity-100 translate-y-0' 
                      : 'opacity-0 translate-y-10'
                  }`}
                  style={{ transitionDelay: `${index * 100}ms` }}
                >
                  {/* Icon - Simple and clean */}
                  <div className="mb-4">
                    <div className="inline-flex p-3 bg-pastel-blue/10 rounded-xl">
                      <Icon className="w-6 h-6 text-pastel-blue-dark" />
                    </div>
                  </div>
                  
                  {/* Title */}
                  <h3 className="text-xl font-bold text-gray-900 mb-3 leading-tight">
                    {feature.title}
                  </h3>
                  
                  {/* Description */}
                  <p className="text-gray-600 text-sm leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section 
        id="services"
        ref={(el) => (sectionsRef.current.services = el)}
        className="relative py-24 px-4 sm:px-6 lg:px-8 bg-white z-10 overflow-hidden"
      >
        {/* Background Pattern - Dots like Login page */}
        <div className="absolute inset-0 opacity-[0.03]">
          <div 
            className="absolute top-0 left-0 w-full h-full"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%2300CCFF' fill-opacity='0.4'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
              backgroundSize: '60px 60px'
            }}
          ></div>
        </div>

        {/* Subtle gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-pastel-blue-lighter/10 via-transparent to-transparent pointer-events-none"></div>

        <div className="max-w-7xl mx-auto relative z-10">
          <div className={`text-center mb-16 transition-all duration-1000 ${isVisible.services ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Professional Services
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Diverse range of testing and analysis services
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {services.map((service, index) => {
              const Icon = service.icon;
              const serviceVariants = [
                'bg-white/95',
                'bg-white/90',
                'bg-white/95',
                'bg-white/90'
              ];
              return (
                <div
                  key={index}
                  className={`group relative p-6 ${serviceVariants[index % serviceVariants.length]} backdrop-blur-md rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:scale-105 hover:-translate-y-4 border-2 border-pastel-blue/50 hover:border-pastel-blue/70 overflow-hidden ${
                    isVisible.services 
                      ? 'opacity-100 translate-y-0' 
                      : 'opacity-0 translate-y-10'
                  }`}
                  style={{ transitionDelay: `${index * 100}ms` }}
                >
                  {/* Decorative element */}
                  <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-pastel-blue/25 to-transparent rounded-bl-full opacity-60 group-hover:opacity-80 transition-opacity"></div>
                  
                  {/* Header with Icon and Stats */}
                  <div className="flex items-start justify-between mb-5 relative z-10">
                    <div className="p-4 bg-gray-100 rounded-2xl border-2 border-gray-200 group-hover:bg-gray-200 group-hover:border-gray-300 transition-all duration-300 group-hover:rotate-12 transform shadow-xl">
                      <Icon className="w-6 h-6 text-gray-900" />
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-black bg-gradient-to-r from-pastel-blue-dark via-blue-600 to-pastel-blue-dark bg-clip-text text-transparent group-hover:scale-110 transform duration-300 leading-none">
                        {service.stats}
                      </div>
                      <div className="text-xs font-medium text-gray-500 mt-1">Tests</div>
                    </div>
                  </div>
                  
                  {/* Title */}
                  <h3 className="text-lg font-bold text-gray-900 mb-3 group-hover:text-blue-700 transition-colors leading-tight">
                    {service.title}
                  </h3>
                  
                  {/* Description */}
                  <p className="text-gray-600 text-sm leading-relaxed mb-5 min-h-[3rem]">
                    {service.description}
                  </p>
                  
                  {/* CTA Link */}
                  <div className="pt-4 border-t-2 border-pastel-blue/30">
                    <a href="#" className="text-xs font-semibold text-pastel-blue-dark hover:text-blue-600 transition-colors inline-flex items-center gap-2 group/link">
                      <span>View details</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover/link:translate-x-1 transition-transform" />
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>


      {/* CTA Section */}
      <section 
        id="cta"
        ref={(el) => (sectionsRef.current.cta = el)}
        className="relative py-24 px-4 sm:px-6 lg:px-8 overflow-hidden bg-white z-10"
      >
        {/* Background Pattern - Dots */}
        <div className="absolute inset-0 opacity-[0.03]">
          <div 
            className="absolute top-0 left-0 w-full h-full"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%2300CCFF' fill-opacity='0.4'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
              backgroundSize: '60px 60px'
            }}
          ></div>
        </div>
        
        <div className={`max-w-4xl mx-auto text-center relative z-10 transition-all duration-1000 ${isVisible.cta ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Ready to Get Started?
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Contact us today for the best consultation and support
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="group relative px-8 py-4 bg-gradient-to-br from-gray-900 to-gray-800 text-white rounded-xl font-semibold text-lg hover:shadow-xl transition-all duration-300 transform hover:scale-110 shadow-lg overflow-hidden">
              <span className="relative z-10">Contact Now</span>
              <div className="absolute inset-0 bg-gradient-to-r from-pastel-blue/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </button>
            <button className="px-8 py-4 bg-white text-gray-900 border-2 border-gray-300 rounded-xl font-semibold text-lg hover:bg-gray-50 hover:border-gray-400 transition-all duration-300 transform hover:scale-110 shadow-lg hover:shadow-xl">
              View More Services
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative bg-gradient-to-br from-gray-900 to-gray-800 text-white z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Company Info */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <img src={logoImg} alt="Lab Management" className="w-10 h-10 object-contain" />
                <span className="text-xl font-bold">Lab Management</span>
              </div>
              <p className="text-gray-400 text-sm">
                Advanced laboratory solutions with cutting-edge technology and professional expertise.
              </p>
              <div className="flex gap-4">
                <a href="#" className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-pastel-blue transition-colors">
                  <Facebook className="w-5 h-5" />
                </a>
                <a href="#" className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-pastel-blue transition-colors">
                  <Twitter className="w-5 h-5" />
                </a>
                <a href="#" className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-pastel-blue transition-colors">
                  <Instagram className="w-5 h-5" />
                </a>
                <a href="#" className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-pastel-blue transition-colors">
                  <Linkedin className="w-5 h-5" />
        </a>
      </div>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
              <ul className="space-y-2">
                <li><a href="#features" className="text-gray-400 hover:text-pastel-blue transition-colors">Features</a></li>
                <li><a href="#services" className="text-gray-400 hover:text-pastel-blue transition-colors">Services</a></li>
                <li><a href="#gallery" className="text-gray-400 hover:text-pastel-blue transition-colors">Gallery</a></li>
                <li><a href="#stats" className="text-gray-400 hover:text-pastel-blue transition-colors">About Us</a></li>
              </ul>
            </div>

            {/* Services */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Services</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-400 hover:text-pastel-blue transition-colors">Blood Testing</a></li>
                <li><a href="#" className="text-gray-400 hover:text-pastel-blue transition-colors">Biochemical Analysis</a></li>
                <li><a href="#" className="text-gray-400 hover:text-pastel-blue transition-colors">Immunology Testing</a></li>
                <li><a href="#" className="text-gray-400 hover:text-pastel-blue transition-colors">Research & Development</a></li>
              </ul>
            </div>

            {/* Contact Info */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Contact</h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-pastel-blue mt-0.5" />
                  <span className="text-gray-400 text-sm">123 Laboratory St, Science City, SC 12345</span>
                </li>
                <li className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-pastel-blue" />
                  <span className="text-gray-400 text-sm">+1 (555) 123-4567</span>
                </li>
                <li className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-pastel-blue" />
                  <span className="text-gray-400 text-sm">info@labsystem.com</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-700 mt-8 pt-8 text-center text-gray-400 text-sm">
            <p>&copy; 2024 Lab Management. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
