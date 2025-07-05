'use client'
import React, { useState, useEffect } from 'react';
import { motion, useAnimation, useInView } from 'framer-motion';

const AnimatedCounter = ({ end, duration = 2 }) => {
  const [count, setCount] = useState(0);
  const controls = useAnimation();
  const ref = React.useRef(null);
  const inView = useInView(ref);

  useEffect(() => {
    if (inView) {
      const timer = setInterval(() => {
        setCount(prev => {
          if (prev < end) return prev + Math.ceil(end / (duration * 30));
          return end;
        });
      }, 1000 / 30);

      return () => clearInterval(timer);
    }
  }, [inView, end, duration]);

  return <span ref={ref}>{count > end ? end : count}</span>;
};

const FeatureCard = ({ icon, title, description, delay = 0 }) => {
  const ref = React.useRef(null);
  const inView = useInView(ref, { once: true });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 50, scale: 0.9 }}
      animate={inView ? { opacity: 1, y: 0, scale: 1 } : {}}
      transition={{ duration: 0.6, delay }}
      whileHover={{ scale: 1.05, y: -10 }}
      className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100"
    >
      <motion.div
        whileHover={{ rotate: 360 }}
        transition={{ duration: 0.6 }}
        className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6"
        style={{ background: 'linear-gradient(135deg, #25C8B1, #20B2AA)' }}
      >
        {icon}
      </motion.div>
      <h3 className="text-xl font-bold mb-4 text-secondary">{title}</h3>
      <p className="text-gray-600 leading-relaxed">{description}</p>
    </motion.div>
  );
};

const FloatingElement = ({ children, delay = 0 }) => (
  <motion.div
    animate={{ y: [-10, 10, -10] }}
    transition={{ duration: 4, repeat: Infinity, delay }}
    className="absolute"
  >
    {children}
  </motion.div>
);

export default function TelehealthLanding() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.3
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.8, ease: "easeOut" }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-cyan-50 overflow-hidden">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 pointer-events-none">
        <FloatingElement delay={0}>
          <div className="w-32 h-32 bg-gradient-to-r from-teal-300/30 to-cyan-300/30 rounded-full blur-xl" style={{ top: '10%', left: '10%' }} />
        </FloatingElement>
        <FloatingElement delay={2}>
          <div className="w-48 h-48 bg-gradient-to-r from-cyan-200/20 to-teal-200/20 rounded-full blur-2xl" style={{ top: '60%', right: '10%' }} />
        </FloatingElement>
        <FloatingElement delay={1}>
          <div className="w-24 h-24 bg-gradient-to-r from-emerald-200/40 to-teal-300/40 rounded-full blur-lg" style={{ bottom: '20%', left: '20%' }} />
        </FloatingElement>
      </div>

      {/* Hero Section */}
      <motion.section
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative px-6 py-20"
      >
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <motion.div variants={itemVariants}>
                <motion.h1
                  className="text-5xl lg:text-7xl font-bold leading-tight"
                  initial={{ opacity: 0, x: -50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 1, ease: "easeOut" }}
                >
                  <span className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-700 bg-clip-text text-transparent">
                    Transform
                  </span>
                  <br />
                  <span className="bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent">
                    Healthcare
                  </span>
                  <br />
                  <span className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-700 bg-clip-text text-transparent">
                    Delivery
                  </span>
                </motion.h1>
              </motion.div>

              <motion.p
                variants={itemVariants}
                className="text-xl text-gray-600 leading-relaxed max-w-2xl"
              >
                Bridge the gap between patients and healthcare professionals with our comprehensive telehealth platform. 
                Seamless video consultations, intelligent appointment scheduling, secure patient data management, 
                and AI-powered assistance for both patients and providers.
              </motion.p>

              <motion.div
                variants={itemVariants}
                className="flex flex-col sm:flex-row gap-4"
              >
                <motion.button
                  whileHover={{ scale: 1.05, boxShadow: "0 20px 40px rgba(0,0,0,0.1)" }}
                  whileTap={{ scale: 0.95 }}
                  className="bg-gradient-to-r from-teal-500 to-cyan-500 text-white px-8 py-4 rounded-2xl font-semibold text-lg shadow-xl hover:shadow-2xl transition-all duration-300"
                  style={{ background: 'linear-gradient(to right, #25C8B1, #20B2AA)' }}
                >
                  Start Consultation
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="border-2 border-gray-300 text-gray-700 px-8 py-4 rounded-2xl font-semibold text-lg hover:text-white transition-all duration-300"
                  style={{ borderColor: '#25C8B1' }}
                  onMouseEnter={(e) => {e.target.style.background = '#25C8B1'; e.target.style.borderColor = '#25C8B1';}}
                  onMouseLeave={(e) => {e.target.style.background = 'transparent'; e.target.style.borderColor = '#25C8B1';}}
                >
                  Book Appointment
                </motion.button>
              </motion.div>

              {/* Stats */}
              <motion.div
                variants={itemVariants}
                className="grid grid-cols-3 gap-8 pt-8"
              >
                <div className="text-center">
                  <div className="text-3xl font-bold text-secondary">
                    <AnimatedCounter end={25000} />+
                  </div>
                  <div className="text-gray-600">Patients Served</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-secondary">
                    <AnimatedCounter end={850} />+
                  </div>
                  <div className="text-gray-600">Healthcare Providers</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-secondary">
                    <AnimatedCounter end={95} />%
                  </div>
                  <div className="text-gray-600">Satisfaction Rate</div>
                </div>
              </motion.div>
            </div>

            {/* Dashboard Preview */}
            <motion.div
              initial={{ opacity: 0, x: 100, rotateY: -15 }}
              animate={{ opacity: 1, x: 0, rotateY: 0 }}
              transition={{ duration: 1.2, ease: "easeOut" }}
              className="relative"
            >
              <motion.div
                whileHover={{ scale: 1.02, rotateY: 5 }}
                transition={{ duration: 0.4 }}
                className="relative z-10 bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100"
              >
                <div className="bg-gradient-to-r from-teal-500 to-cyan-500 p-4" style={{ background: 'linear-gradient(to right, #25C8B1, #20B2AA)' }}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-white/30 rounded-full"></div>
                      <div className="w-3 h-3 bg-white/30 rounded-full"></div>
                      <div className="w-3 h-3 bg-white/30 rounded-full"></div>
                    </div>
                    <div className="text-white text-sm font-medium">Live Consultation</div>
                  </div>
                </div>
                <div className="p-6">
                  {/* Video Call Interface */}
                  <div className="mb-6">
                    <div className="bg-gray-900 rounded-xl p-4 mb-4 relative overflow-hidden">
                      <div className="flex items-center justify-between mb-3">
                        <div className="text-white text-sm font-medium">Dr. Sarah Johnson</div>
                        <div className="flex space-x-2">
                          <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v8a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm1 1v6h12V5H4z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                            </svg>
                          </div>
                        </div>
                      </div>
                      <div className="bg-blue-500/20 rounded-lg p-3 text-white text-sm">
                        <div className="flex items-center space-x-2 mb-2">
                          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                          <span>Connected - High Quality</span>
                        </div>
                        <div className="text-xs opacity-80">Duration: 15:32</div>
                      </div>
                    </div>
                    
                    {/* AI Assistant Panel */}
                    <div className="rounded-xl p-4" style={{ background: 'linear-gradient(to right, rgba(37, 200, 177, 0.1), rgba(32, 178, 170, 0.1))' }}>
                      <div className="flex items-center space-x-2 mb-3">
                        <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: 'linear-gradient(to right, #25C8B1, #20B2AA)' }}>
                          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <span className="font-semibold text-secondary">AI Health Assistant</span>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="bg-white p-2 rounded-lg text-gray-700">
                          💡 Suggested: Check blood pressure history
                        </div>
                        <div className="bg-white p-2 rounded-lg text-gray-700">
                          📋 Recommend: Follow-up in 2 weeks
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Upcoming Appointments */}
                  <div className="space-y-3">
                    <h4 className="font-semibold text-secondary">Today&apos;s Schedule</h4>
                    <div className="flex items-center justify-between p-3 rounded-lg" style={{ backgroundColor: 'rgba(37, 200, 177, 0.1)' }}>
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: '#25C8B1' }}>JD</div>
                        <div>
                          <div className="font-medium">John Doe</div>
                          <div className="text-sm text-gray-600">2:00 PM - General Checkup</div>
                        </div>
                      </div>
                      <div className="font-semibold text-sm" style={{ color: '#25C8B1' }}>Join Call</div>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white text-xs font-bold">MS</div>
                        <div>
                          <div className="font-medium">Maria Smith</div>
                          <div className="text-sm text-gray-600">3:30 PM - Follow-up</div>
                        </div>
                      </div>
                      <div className="text-green-600 font-semibold text-sm">Scheduled</div>
                    </div>
                  </div>
                </div>
              </motion.div>
              
              {/* Floating elements around dashboard */}
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="absolute -top-4 -right-4 w-8 h-8 rounded-full opacity-80"
                style={{ background: 'linear-gradient(to right, #25C8B1, #20B2AA)' }}
              />
              <motion.div
                animate={{ rotate: -360 }}
                transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                className="absolute -bottom-6 -left-6 w-12 h-12 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full opacity-60"
              />
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* Features Section */}
      <motion.section
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        className="px-6 py-20 bg-white/50 backdrop-blur-sm"
      >
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl lg:text-5xl font-bold mb-6">
              <span className="bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                Complete Telehealth Solutions
              </span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Experience healthcare from the comfort of your home with our comprehensive telehealth platform
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard
              delay={0}
              icon={
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
                </svg>
              }
              title="HD Video Consultations"
              description="High-definition video calls with crystal clear audio for seamless doctor-patient interactions from anywhere."
            />
            
            <FeatureCard
              delay={0.2}
              icon={
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3a4 4 0 118 0v4m-4 12v-4m0 0h8m-8 0H4m16 0h-8m8 0v-8a4 4 0 00-4-4h-8a4 4 0 00-4 4v8"></path>
                </svg>
              }
              title="Smart Scheduling"
              description="AI-powered appointment scheduling that finds the perfect time for both patients and healthcare providers."
            />
            
            <FeatureCard
              delay={0.4}
              icon={
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
                </svg>
              }
              title="Secure Patient Records"
              description="HIPAA-compliant secure storage and management of patient data with end-to-end encryption."
            />
            
            <FeatureCard
              delay={0.6}
              icon={
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
                </svg>
              }
              title="AI Health Assistant"
              description="Intelligent AI assistant for both patients and providers offering health insights, reminders, and support."
            />
            
            <FeatureCard
              delay={0.8}
              icon={
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"></path>
                </svg>
              }
              title="Mobile App Access"
              description="Full-featured mobile applications for iOS and Android ensuring healthcare access on-the-go."
            />
            
            <FeatureCard
              delay={1.0}
              icon={
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                </svg>
              }
              title="Health Analytics"
              description="Comprehensive health tracking and analytics to monitor patient progress and treatment outcomes."
            />
          </div>
        </div>
      </motion.section>

      {/* CTA Section */}
      <motion.section
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="px-6 py-20"
      >
        <div className="max-w-4xl mx-auto text-center">
          <motion.h2
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            className="text-4xl lg:text-5xl font-bold mb-6"
          >
            <span className="bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
              Ready to Revolutionize
            </span>
            <br />
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Your Healthcare Experience?
            </span>
          </motion.h2>
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto"
          >
            Join thousands of patients and healthcare providers who trust our platform for convenient, secure, and effective telehealth services.
          </motion.p>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <motion.button
              whileHover={{ scale: 1.05, boxShadow: "0 20px 40px rgba(0,0,0,0.1)" }}
              whileTap={{ scale: 0.95 }}
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-10 py-4 rounded-2xl font-semibold text-lg shadow-xl hover:shadow-2xl transition-all duration-300"
            >
              Start Your Consultation
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="border-2 border-gray-300 text-gray-700 px-10 py-4 rounded-2xl font-semibold text-lg hover:border-blue-500 hover:text-blue-600 transition-all duration-300"
            >
              Learn More
            </motion.button>
          </motion.div>
        </div>
      </motion.section>
    </div>
  );
}