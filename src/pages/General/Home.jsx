import { useEffect, useRef, useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { User, LogOut } from 'lucide-react';
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
import AnimatedGradient from '../../components/Background/AnimatedGradient';

export default function Home() {
  const [isVisible, setIsVisible] = useState({});
  const [scrollY, setScrollY] = useState(0);
  const [isScrolled, setIsScrolled] = useState(false);
  const sectionsRef = useRef({});
  const heroRef = useRef(null);
  const { isAuthenticated, user, logout } = useAuthStore();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [displayName, setDisplayName] = useState('User');
  const [userPrivileges, setUserPrivileges] = useState([]);


// Thêm useEffect để decode và lưu tên:
// Thêm useEffect để decode và lưu tên + privileges:
useEffect(() => {
  if (isAuthenticated) {
    const token = localStorage.getItem('accessToken');
    if (token) {
      try {
        const parts = token.split('.');
        if (parts.length === 3) {
          const payload = parts[1];
          const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
          const decoded = JSON.parse(
            decodeURIComponent(
              atob(base64)
                .split('')
                .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                .join('')
            )
          );
          
          // Lấy tên từ các trường có thể có trong JWT
          const name = decoded['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'] ||
                      decoded.name || 
                      decoded.userName || 
                      decoded.username || 
                      decoded.given_name || 
                      decoded.unique_name ||
                      user?.userName ||
                      user?.email?.split('@')[0] ||
                      'User';
          
          setDisplayName(name);

          // Lấy privileges từ JWT
          const privileges = decoded.privilege || 
                           decoded.privileges || 
                           decoded.Privilege || 
                           decoded.Privileges || 
                           [];
          
          // Ensure it's an array
          const privArray = Array.isArray(privileges) ? privileges : 
                           typeof privileges === 'string' ? [privileges] : [];
          
          setUserPrivileges(privArray);
        }
      } catch (error) {
        console.error('Error decoding token:', error);
        setDisplayName('User');
        setUserPrivileges([]);
      }
    }
  }
}, [isAuthenticated, user]);

  useEffect(() => {
    let ticking = false;
    
    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
      const currentScrollY = window.scrollY;
      setScrollY(currentScrollY);
      setIsScrolled(currentScrollY > 50);
          ticking = false;
        });
        ticking = true;
      }
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px' // Reduced margin for better performance
    };

    const observer = new IntersectionObserver((entries) => {
      // Batch updates to reduce re-renders
      const updates = {};
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          updates[entry.target.id] = true;
        }
      });
      
      if (Object.keys(updates).length > 0) {
          setIsVisible((prev) => ({
            ...prev,
          ...updates
          }));
        }
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

  useEffect(() => {
  const handleClickOutside = (event) => {
    if (showUserMenu && !event.target.closest('.user-menu-container')) {
      setShowUserMenu(false);
    }
  };

  document.addEventListener('mousedown', handleClickOutside);
  return () => document.removeEventListener('mousedown', handleClickOutside);
}, [showUserMenu]);

const handleLogout = () => {
  logout();
  window.location.href = '/login';
};

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
    <div className="min-h-screen overflow-hidden relative" style={{ transform: 'translateZ(0)' }}>
      {/* Animated Gradient Background for entire page */}
      <AnimatedGradient className="fixed inset-0 z-0 will-change-transform" />

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
              <a href="/about" className={`relative px-4 py-2 text-base font-medium transition-all duration-300 rounded-lg group backdrop-blur-sm ${
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

            {/* User Menu hoặc Login Button */}
      {isAuthenticated && user ? (
        <div className="relative user-menu-container">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="group relative flex items-center gap-2 px-6 py-2.5 text-gray-700 rounded-xl font-medium transition-all duration-300 border border-transparent hover:bg-white hover:shadow-lg hover:scale-105 focus:bg-white focus:text-black outline-none"
          >
            <User className="w-4 h-4" />
            <span>Hi, {displayName}</span>
          </button>
          
          {showUserMenu && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-200 py-2 z-50">

          <a
          href={userPrivileges.length === 1 && userPrivileges.includes('READ_ONLY') ? '/medical-records' : '/dashboard'}
          className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <User className="w-4 h-4" />
          <span>{userPrivileges.length === 1 && userPrivileges.includes('READ_ONLY') ? 'My Records' : 'Dashboard'}</span>
        </a>

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 transition-colors text-left"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </button>
        </div>
      )}

      </div>
    ) : (
      <a 
        href="/login" 
        className="group relative flex items-center gap-2 px-6 py-2.5 text-gray-700 rounded-xl font-medium transition-all duration-300 border border-transparent hover:bg-white hover:shadow-lg hover:scale-105 hover:border-dashed hover:border-black focus:border-dashed focus:!border-black focus:bg-white focus:text-black outline-none"
      >
        <LogIn className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
        <span>Login</span>
      </a>
    )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section 
        ref={heroRef}
        className="relative min-h-screen flex items-center justify-center overflow-hidden z-10 pt-20 will-change-transform"
      >
        
        {/* Content */}
        <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left: Text Content */}
            <div className="space-y-8 animate-slide-in-left">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-md rounded-full border border-white/30 shadow-lg animate-scale-in">
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
                        fallback.className = 'w-8 h-8 rounded-full bg-white/50 border-2 border-white shadow-md';
                        e.target.parentNode.appendChild(fallback);
                      }}
                    />
                  ))}
                </div>
                <span className="text-sm font-medium text-white drop-shadow-sm">+10K Clients</span>
              </div>
              
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold leading-tight">
              <span className="text-gradient-animate inline-block bg-transparent">Next-Gen</span>
                <br />
                <span className="text-white drop-shadow-lg">Laboratory</span>
                <br />
                <span className="text-white/90 drop-shadow-lg">Solutions</span>
              </h1>
              
              <p className="text-xl text-white/90 max-w-xl leading-relaxed animate-fade-in-delay backdrop-blur-sm p-4">
                Advanced laboratory services with AI-powered precision and comprehensive analytical solutions for modern healthcare.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 animate-fade-in-delay-2">
                <a 
                  href={isAuthenticated && userPrivileges.length === 1 && userPrivileges.includes('READ_ONLY') ? '/medical-records' : '/dashboard'}
                  className="group relative px-8 py-4 bg-gradient-to-br from-gray-900 to-gray-800 text-white rounded-xl font-semibold text-lg shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:scale-105 border-2 border-gray-700 hover:border-gray-600 overflow-hidden"
                >
                  <span className="relative z-10 flex items-center gap-2">
                    {isAuthenticated && userPrivileges.length === 1 && userPrivileges.includes('READ_ONLY') ? 'View My Records' : 'See Dashboard'}
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-pastel-blue/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </a>
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
        className="relative py-24 px-4 sm:px-6 lg:px-8 z-10 overflow-hidden will-change-transform"
      >
        {/* Glass panel effect - transparent edges, color only in center */}
        <div className="absolute inset-0 backdrop-blur-md" 
            style={{
               background: `
                 radial-gradient(ellipse at center, rgba(255,255,255,0.25) 20%, rgba(255,255,255,0.15) 40%, rgba(255,255,255,0.08) 60%, transparent 80%)
               `
             }}>
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          <div className={`text-center mb-16 transition-all duration-1000 ${isVisible.gallery ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4 drop-shadow-lg">
              Our Facilities
            </h2>
            <p className="text-lg text-white/90 max-w-2xl mx-auto drop-shadow-md">
              State-of-the-art equipment and professional team
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Equipment Image */}
            <div className={`relative overflow-hidden rounded-2xl aspect-[4/3] shadow-xl transition-all duration-500 ${
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
            <div className={`relative overflow-hidden rounded-2xl aspect-[4/3] shadow-xl transition-all duration-500 ${
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
            <div className={`relative overflow-hidden rounded-2xl aspect-[4/3] shadow-xl transition-all duration-500 ${
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
        className="relative py-24 px-4 sm:px-6 lg:px-8 z-10 will-change-transform"
      >
        {/* Dark glass panel effect - transparent edges, dark color only in center */}
        <div className="absolute inset-0 backdrop-blur-md" 
             style={{
               background: `
                 radial-gradient(ellipse at center, rgba(0,0,0,0.4) 20%, rgba(0,0,0,0.25) 40%, rgba(0,0,0,0.15) 60%, transparent 80%)
               `
             }}>
        </div>
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
        className="relative py-24 px-4 sm:px-6 lg:px-8 z-10 overflow-hidden will-change-transform"
      >
        {/* Glass panel effect - transparent edges, color only in center */}
        <div className="absolute inset-0 backdrop-blur-md" 
            style={{
               background: `
                 radial-gradient(ellipse at center, rgba(255,255,255,0.3) 20%, rgba(255,255,255,0.18) 40%, rgba(255,255,255,0.1) 60%, transparent 80%)
               `
             }}>
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          <div className={`text-center mb-16 transition-all duration-1000 ${isVisible.services ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4 drop-shadow-lg">
              Professional Services
            </h2>
            <p className="text-lg text-white/90 max-w-2xl mx-auto drop-shadow-md">
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
                  className={`relative p-6 ${serviceVariants[index % serviceVariants.length]} backdrop-blur-md rounded-3xl shadow-xl border-2 border-pastel-blue/50 overflow-hidden ${
                    isVisible.services 
                      ? 'opacity-100 translate-y-0' 
                      : 'opacity-0 translate-y-10'
                  }`}
                  style={{ transitionDelay: `${index * 100}ms` }}
                >
                  {/* Decorative element */}
                  <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-pastel-blue/25 to-transparent rounded-bl-full opacity-60"></div>
                  
                  {/* Header with Icon and Stats */}
                    <div className="flex items-start justify-between mb-5 relative z-10">
                      <div className="p-4 bg-gray-100 rounded-2xl border-2 border-gray-200 shadow-xl">
                        <Icon className="w-6 h-6 text-gray-900" />
                      </div>
                      <div className="text-right">
                        <div className="text-3xl font-black bg-gradient-to-r from-pastel-blue-dark via-blue-600 to-pastel-blue-dark bg-clip-text text-transparent leading-none">
                          {service.stats}
                        </div>
                        <div className="text-xs font-medium text-gray-500 mt-1">Tests</div>
                      </div>
                    </div>
                    
                    {/* Title */}
                    <h3 className="text-lg font-bold text-gray-900 mb-3 leading-tight">
                      {service.title}
                    </h3>
                    
                    {/* Description */}
                    <p className="text-gray-600 text-sm leading-relaxed min-h-[3rem]">
                      {service.description}
                    </p>
                  
                  {/* CTA Link */}
                  <div className="pt-4 border-t-2 border-pastel-blue/30">
                    <a href="#" className="text-xs font-semibold text-pastel-blue-dark hover:text-blue-600 transition-colors inline-flex items-center gap-2 group/link">
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
        className="relative py-24 px-4 sm:px-6 lg:px-8 overflow-hidden z-10"
      >
        {/* Glass panel effect - transparent edges, color only in center */}
        <div className="absolute inset-0 backdrop-blur-md" 
            style={{
               background: `
                 radial-gradient(ellipse at center, rgba(255,255,255,0.25) 20%, rgba(255,255,255,0.15) 40%, rgba(255,255,255,0.08) 60%, transparent 80%)
               `
             }}>
        </div>
        
        <div className={`max-w-4xl mx-auto text-center relative z-10 transition-all duration-1000 ${isVisible.cta ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 drop-shadow-lg">
            Ready to Get Started?
          </h2>
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto drop-shadow-md">
            Contact us today for the best consultation and support
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="group relative px-8 py-4 bg-gradient-to-br from-gray-900 to-gray-800 text-white rounded-xl font-semibold text-lg transition-all duration-300 transform shadow-lg overflow-hidden">
              <span className="relative z-10">Contact Now</span>
              <div className="absolute inset-0 bg-gradient-to-r from-pastel-blue/20 via-transparent to-transparent opacity-0  transition-opacity duration-300"></div>
            </button>
            <button className="px-8 py-4 bg-white text-gray-900 border-2 border-gray-300 rounded-xl font-semibold text-lg hover:bg-gray-50 transition-all duration-300 transform  shadow-lg">
              View More Services
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative text-white z-10">
        {/* Dark glass panel effect - transparent edges, dark color only in center */}
        <div className="absolute inset-0 backdrop-blur-md" 
             style={{
               background: `
                 radial-gradient(ellipse at center, rgba(0,0,0,0.5) 20%, rgba(0,0,0,0.3) 40%, rgba(0,0,0,0.2) 60%, transparent 80%)
               `
             }}>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10">
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
                <a href="#" className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center ">
                  <Facebook className="w-5 h-5" />
                </a>
                <a href="#" className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center ">
                  <Twitter className="w-5 h-5" />
                </a>
                <a href="#" className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center ">
                  <Instagram className="w-5 h-5" />
                </a>
                <a href="#" className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center ">
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
                <li><a href="#stats" className="text-gray-400">About Us</a></li>
              </ul>
            </div>

            {/* Services */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Services</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-400 ">Blood Testing</a></li>
                <li><a href="#" className="text-gray-400 ">Biochemical Analysis</a></li>
                <li><a href="#" className="text-gray-400 ">Immunology Testing</a></li>
                <li><a href="#" className="text-gray-400 ">Research & Development</a></li>
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
            <h1>&copy; This is a mock project created solely for educational purposes.</h1>
          </div>
        </div>
      </footer>
    </div>
  );
}
