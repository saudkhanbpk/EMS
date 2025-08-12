import React from 'react';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import {
  MapPin,
  Clock,
  FolderOpen,
  Brain,
  Calendar,
  DollarSign,
  Shield,
  MessageSquare,
  CheckCircle,
  BarChart3
} from 'lucide-react';

interface Feature {
  icon: React.ReactNode;
  title: string;
  description: string;
}

const Features = () => {
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  const features: Feature[] = [
    {
      icon: <MapPin className="w-8 h-8 text-blue-600" />,
      title: "Location-Based Check-in/Out",
      description: "Auto-detects office or remote work with GPS tracking. Seamless remote work check-in when working from home."
    },
    {
      icon: <FolderOpen className="w-8 h-8 text-blue-600" />,
      title: "Project Management",
      description: "Employees can log daily tasks under assigned projects with real-time progress tracking and collaboration."
    },
    {
      icon: <Brain className="w-8 h-8 text-blue-600" />,
      title: "AI-Powered Daily Logs",
      description: "Advanced AI reviews and rates submitted daily logs for quality, productivity, and performance insights."
    },
    {
      icon: <Calendar className="w-8 h-8 text-blue-600" />,
      title: "Leave Request Management",
      description: "Streamlined leave application process with automated approval workflows and balance tracking."
    },
    {
      icon: <Clock className="w-8 h-8 text-blue-600" />,
      title: "Overtime Management",
      description: "Track and manage overtime hours with automatic calculations and compliance monitoring."
    },
    {
      icon: <DollarSign className="w-8 h-8 text-blue-600" />,
      title: "Salary Breakdown Viewer",
      description: "Transparent salary breakdowns with detailed components, deductions, and earning statements."
    },
    {
      icon: <Shield className="w-8 h-8 text-blue-600" />,
      title: "24/7 System Availability",
      description: "Round-the-clock system access with 99.9% uptime guarantee and robust security measures."
    },
    {
      icon: <MessageSquare className="w-8 h-8 text-blue-600" />,
      title: "Software Complaint System",
      description: "Easy-to-use complaint submission with tracking, resolution updates, and feedback collection."
    },
    {
      icon: <BarChart3 className="w-8 h-8 text-blue-600" />,
      title: "KPI Performance ",
      description: "Real-time KPI tracking with AI-powered performance ratings, trend analysis, and actionable insights for continuous improvement."
    }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: {
      opacity: 0,
      y: 50,
      scale: 0.9
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.6
      }
    }
  };

  return (
    <section id="features" className="py-10 bg-gradient-to-b from-white to-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <motion.h2
            className="text-3xl md:text-4xl font-bold text-gray-900 mb-4"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            viewport={{ once: true }}
          >
            Powerful Features for Modern Workplaces
          </motion.h2>
          <motion.p
            className="text-xl text-gray-600 max-w-3xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            viewport={{ once: true }}
          >
            Everything you need to manage your workforce efficiently with cutting-edge technology and intelligent automation.
          </motion.p>
        </motion.div>

        <motion.div
          ref={ref}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          variants={containerVariants}
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
        >
          {features.map((feature, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              className="group bg-white rounded-xl p-8 shadow-lg hover:shadow-2xl transition-all duration-500 border border-gray-100 hover:border-blue-200 relative overflow-hidden"
              whileHover={{
                y: -8,
                transition: { duration: 0.3 }
              }}
            >
              {/* Gradient overlay on hover */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-purple-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

              <motion.div
                className="relative z-10 mb-6"
                whileHover={{
                  scale: 1.1,
                  rotate: 5,
                  transition: { duration: 0.3 }
                }}
              >
                <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-700 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow duration-300">
                  <div className="text-white">
                    {React.cloneElement(feature.icon as React.ReactElement, {
                      className: "w-8 h-8 text-white"
                    })}
                  </div>
                </div>
              </motion.div>

              <div className="relative z-10">
                <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors duration-300">
                  {feature.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>

              {/* Animated border */}
              <div className="absolute inset-0 rounded-xl border-2 border-transparent group-hover:border-blue-200 transition-colors duration-300"></div>
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          className="mt-16 text-center"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          viewport={{ once: true }}
        >
          <motion.div
            className="inline-flex items-center gap-2 text-blue-600 font-semibold bg-blue-50 px-6 py-3 rounded-full"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <motion.div
              animate={{
                scale: [1, 1.2, 1],
                rotate: [0, 360, 0]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              <CheckCircle size={20} />
            </motion.div>
            <span>All features included in every plan</span>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default Features;