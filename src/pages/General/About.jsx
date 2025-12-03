import { useEffect, useRef, useState } from 'react';
import { 
  FlaskConical, 
  Microscope, 
  Users, 
  Award,
  Target,
  Eye,
  Heart,
  TrendingUp,
  Calendar,
  Building2,
  Globe,
  CheckCircle2,
  ArrowRight,
  Quote
} from 'lucide-react';

export default function About() {
  const [isVisible, setIsVisible] = useState({});
  const [scrollY, setScrollY] = useState(0);
  const [isScrolled, setIsScrolled] = useState(false);
  const sectionsRef = useRef({});

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
      rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
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

  const milestones = [
    { year: '2015', title: 'Founded', description: 'Laboratory established with vision for excellence' },
    { year: '2017', title: 'ISO Certified', description: 'Achieved international quality standards' },
    { year: '2019', title: 'Expansion', description: 'Opened 5 new facilities across the region' },
    { year: '2021', title: 'AI Integration', description: 'Implemented cutting-edge AI technology' },
    { year: '2023', title: 'Global Recognition', description: 'Awarded best laboratory services internationally' },
    { year: '2024', title: '10K+ Clients', description: 'Serving communities with excellence' }
  ];

  const values = [
    {
      icon: Target,
      title: 'Precision',
      description: 'We deliver accurate results through rigorous testing protocols and quality control.'
    },
    {
      icon: Heart,
      title: 'Care',
      description: 'Patient wellbeing is at the heart of everything we do, ensuring compassionate service.'
    },
    {
      icon: Award,
      title: 'Excellence',
      description: 'We maintain the highest standards in laboratory services and continuous improvement.'
    },
    {
      icon: Users,
      title: 'Collaboration',
      description: 'Working together with healthcare providers to deliver optimal patient outcomes.'
    }
  ];

  const stats = [
    { number: '50K+', label: 'Tests Completed', icon: FlaskConical },
    { number: '10K+', label: 'Happy Clients', icon: Users },
    { number: '99.9%', label: 'Accuracy Rate', icon: Target },
    { number: '24/7', label: 'Support Available', icon: TrendingUp }
  ];

  const team = [
    { 
      name: 'Dr. Sarah Johnson', 
      role: 'Chief Laboratory Director', 
      specialty: 'Clinical Pathology',
      description: '15+ years experience in clinical laboratory management'
    },
    { 
      name: 'Dr. Michael Chen', 
      role: 'Senior Biochemist', 
      specialty: 'Molecular Biology',
      description: 'Expert in advanced molecular diagnostic techniques'
    },
    { 
      name: 'Dr. Emily Williams', 
      role: 'Lead Immunologist', 
      specialty: 'Immunology Research',
      description: 'Pioneering research in immunological diagnostics'
    },
    { 
      name: 'Dr. David Martinez', 
      role: 'Research Director', 
      specialty: 'Medical Research',
      description: 'Leading innovation in laboratory technologies'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header */}
      <header 
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled 
            ? 'bg-white/95 backdrop-blur-md shadow-lg py-3' 
            : 'bg-transparent py-6'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FlaskConical className="w-8 h-8 text-blue-600" />
              <span className="text-xl font-bold text-gray-900">Lab Management</span>
            </div>
            <nav className="hidden md:flex items-center gap-6">
              <a href="/" className="text-gray-600 hover:text-blue-600 font-medium transition-colors">Home</a>
              <a href="/about" className="text-blue-600 font-medium">About</a>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 via-indigo-600/5 to-purple-600/10"></div>
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 rounded-full mb-6 animate-fade-in">
              <Building2 className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-semibold text-blue-600">About Us</span>
            </div>
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Pioneering Excellence in Laboratory Services
            </h1>
            <p className="text-xl text-gray-600 leading-relaxed mb-8">
              Since 2015, we've been at the forefront of laboratory innovation, delivering accurate, reliable, and timely diagnostic services that healthcare providers and patients trust.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <a href="#mission" className="px-8 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105">
                Our Mission
              </a>
              <a href="#team" className="px-8 py-3 bg-white text-blue-600 border-2 border-blue-600 rounded-xl font-semibold hover:bg-blue-50 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105">
                Meet Our Team
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section 
        id="stats"
        ref={(el) => (sectionsRef.current.stats = el)}
        className="py-16 px-4 sm:px-6 lg:px-8 bg-white"
      >
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div
                  key={index}
                  className={`text-center transition-all duration-1000 ${
                    isVisible.stats ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
                  }`}
                  style={{ transitionDelay: `${index * 100}ms` }}
                >
                  <div className="inline-flex p-4 bg-blue-100 rounded-2xl mb-4">
                    <Icon className="w-8 h-8 text-blue-600" />
                  </div>
                  <div className="text-4xl font-bold text-gray-900 mb-2">{stat.number}</div>
                  <div className="text-gray-600 font-medium">{stat.label}</div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section 
        id="mission"
        ref={(el) => (sectionsRef.current.mission = el)}
        className="py-24 px-4 sm:px-6 lg:px-8"
      >
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Mission */}
            <div className={`transition-all duration-1000 ${
              isVisible.mission ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-10'
            }`}>
              <div className="bg-gradient-to-br from-blue-600 to-indigo-600 rounded-3xl p-8 text-white shadow-2xl">
                <div className="inline-flex p-3 bg-white/20 rounded-xl mb-6">
                  <Target className="w-8 h-8" />
                </div>
                <h2 className="text-3xl font-bold mb-4">Our Mission</h2>
                <p className="text-blue-100 text-lg leading-relaxed mb-6">
                  To provide accurate, reliable, and accessible laboratory services that empower healthcare providers and improve patient outcomes through cutting-edge technology and unwavering commitment to quality.
                </p>
                <div className="space-y-3">
                  {['Advanced Technology', 'Quality Assurance', 'Patient-Centered Care'].map((item, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <CheckCircle2 className="w-5 h-5 text-blue-200" />
                      <span className="text-blue-100">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Vision */}
            <div className={`transition-all duration-1000 ${
              isVisible.mission ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-10'
            }`}>
              <div className="bg-white rounded-3xl p-8 shadow-2xl border-2 border-gray-100">
                <div className="inline-flex p-3 bg-indigo-100 rounded-xl mb-6">
                  <Eye className="w-8 h-8 text-indigo-600" />
                </div>
                <h2 className="text-3xl font-bold text-gray-900 mb-4">Our Vision</h2>
                <p className="text-gray-600 text-lg leading-relaxed mb-6">
                  To be the most trusted and innovative laboratory service provider globally, setting new standards in diagnostic excellence and contributing to a healthier world through scientific advancement.
                </p>
                <div className="space-y-3">
                  {['Global Leadership', 'Innovation Excellence', 'Community Impact'].map((item, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <CheckCircle2 className="w-5 h-5 text-indigo-600" />
                      <span className="text-gray-700">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Core Values */}
      <section 
        id="values"
        ref={(el) => (sectionsRef.current.values = el)}
        className="py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-blue-50 to-indigo-50"
      >
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Our Core Values
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              The principles that guide everything we do
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => {
              const Icon = value.icon;
              return (
                <div
                  key={index}
                  className={`bg-white rounded-2xl p-8 shadow-lg transition-all duration-1000 ${
                    isVisible.values ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
                  }`}
                  style={{ transitionDelay: `${index * 100}ms` }}
                >
                  <div className="inline-flex p-4 bg-blue-100 rounded-xl mb-4">
                    <Icon className="w-8 h-8 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">{value.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{value.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section 
        id="timeline"
        ref={(el) => (sectionsRef.current.timeline = el)}
        className="py-24 px-4 sm:px-6 lg:px-8"
      >
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Our Journey
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              A decade of growth, innovation, and excellence
            </p>
          </div>

          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-1/2 transform -translate-x-1/2 h-full w-1 bg-gradient-to-b from-blue-600 to-indigo-600 hidden lg:block"></div>

            <div className="space-y-12">
              {milestones.map((milestone, index) => (
                <div
                  key={index}
                  className={`relative transition-all duration-1000 ${
                    isVisible.timeline ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
                  }`}
                  style={{ transitionDelay: `${index * 150}ms` }}
                >
                  <div className={`flex flex-col lg:flex-row gap-8 items-center ${
                    index % 2 === 0 ? 'lg:flex-row' : 'lg:flex-row-reverse'
                  }`}>
                    {/* Content */}
                    <div className="flex-1 lg:text-right lg:pr-12">
                      <div className={`bg-white rounded-2xl p-6 shadow-lg ${
                        index % 2 === 0 ? 'lg:ml-auto' : 'lg:mr-auto'
                      } max-w-md`}>
                        <div className="text-3xl font-bold text-blue-600 mb-2">{milestone.year}</div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">{milestone.title}</h3>
                        <p className="text-gray-600">{milestone.description}</p>
                      </div>
                    </div>

                    {/* Timeline dot */}
                    <div className="hidden lg:block">
                      <div className="w-4 h-4 bg-blue-600 rounded-full border-4 border-white shadow-lg"></div>
                    </div>

                    {/* Spacer */}
                    <div className="flex-1 hidden lg:block"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section 
        id="team"
        ref={(el) => (sectionsRef.current.team = el)}
        className="py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-blue-50 to-indigo-50"
      >
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Meet Our Expert Team
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Leading professionals dedicated to excellence in laboratory services
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {team.map((member, index) => (
              <div
                key={index}
                className={`bg-white rounded-2xl p-6 shadow-lg transition-all duration-1000 ${
                  isVisible.team ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
                }`}
                style={{ transitionDelay: `${index * 100}ms` }}
              >
                <div className="relative w-32 h-32 mx-auto mb-4">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-indigo-600 rounded-full"></div>
                  <div className="relative w-full h-full flex items-center justify-center">
                    <Users className="w-16 h-16 text-white" />
                  </div>
                </div>
                <div className="text-center">
                  <h3 className="text-xl font-bold text-gray-900 mb-1">{member.name}</h3>
                  <p className="text-sm font-semibold text-blue-600 mb-2">{member.role}</p>
                  <p className="text-sm text-gray-600 mb-3">{member.specialty}</p>
                  <p className="text-xs text-gray-500 leading-relaxed">{member.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-blue-600 to-indigo-600">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Join Us on Our Mission
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Whether you're a healthcare provider or a patient, experience the difference that excellence makes.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="/" className="px-8 py-4 bg-white text-blue-600 rounded-xl font-semibold hover:bg-gray-100 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105">
              Back to Home
            </a>
            <a href="#contact" className="px-8 py-4 bg-transparent border-2 border-white text-white rounded-xl font-semibold transition-all duration-300 shadow-lg transform">
              Contact Us
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <FlaskConical className="w-8 h-8 text-blue-400" />
            <span className="text-xl font-bold">Lab Management</span>
          </div>
          <p className="text-gray-400 mb-4">
            Advanced laboratory solutions with cutting-edge technology
          </p>
          <div className="text-gray-500 text-sm">
            © This is a mock project created solely for educational purposes.
          </div>
        </div>
      </footer>
    </div>
  );
}