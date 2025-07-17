
import { Check, Star, Zap, Crown, Shield } from 'lucide-react';
import { motion } from 'framer-motion';
import { useState } from 'react';

const Pricing = () => {
  const [hoveredPlan, setHoveredPlan] = useState<number | null>(null);

  const plans = [
    {
      name: "3-Month Plan",
      price: "$29.99",
      period: "for 3 months",
      features: "Full",
      support: "Standard",
      description: "Perfect for small teams getting started",
      popular: false,
      icon: Shield,
      gradient: "from-blue-600 to-purple-700",
      savings: "Save 10%"
    },
    {
      name: "6-Month Plan",
      price: "$49.99",
      period: "for 6 months",
      features: "Full",
      support: "Priority",
      description: "Great for growing businesses",
      popular: true,
      icon: Zap,
      gradient: "from-blue-600 to-purple-700",
      savings: "Save 25%"
    },
    {
      name: "1-Year Plan",
      price: "$79.99",
      period: "for 12 months",
      features: "Full",
      support: "Premium",
      description: "Best value for established companies",
      popular: false,
      icon: Crown,
      gradient: "from-blue-600 to-purple-700",
      savings: "Save 40%"
    }
  ];

  const allFeatures = [
    "Location-based check-in/out system",
    "AI-powered daily log ratings",
    "Project management tools",
    "Leave request management",
    "Overtime tracking",
    "Salary breakdown viewer",
    "24/7 system availability",
    "Software complaint system",
    "Real-time analytics",
    "Mobile app access",
    "Data export capabilities",
    "Security compliance",
    "KPI Performance"
  ];

  return (
    <section id="pricing" className="py-20 bg-gradient-to-b from-gray-50 to-white relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-50/30 to-purple-50/30"></div>
      <motion.div
        className="absolute top-20 right-10 w-32 h-32 bg-blue-200/20 rounded-full blur-3xl"
        animate={{
          x: [0, -50, 0],
          y: [0, 30, 0],
          scale: [1, 1.2, 1],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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
            Simple, Transparent Pricing
          </motion.h2>
          <motion.p
            className="text-xl text-gray-600 max-w-3xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            viewport={{ once: true }}
          >
            Choose the plan that fits your needs. All plans include full feature access with different support levels.
          </motion.p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {plans.map((plan, index) => (
            <motion.div
              key={index}
              className={`relative bg-white rounded-2xl shadow-xl p-8 border-2 transition-all duration-500 ${plan.popular
                  ? 'border-blue-500 scale-105'
                  : 'border-gray-100 hover:border-blue-200'
                }`}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
              whileHover={{
                y: -10,
                transition: { duration: 0.3 }
              }}
              onHoverStart={() => setHoveredPlan(index)}
              onHoverEnd={() => setHoveredPlan(null)}
            >
              {/* Gradient background on hover */}
              <motion.div
                className={`absolute inset-0 bg-gradient-to-br ${plan.gradient} opacity-0 rounded-2xl`}
                animate={{
                  opacity: hoveredPlan === index ? 0.05 : 0
                }}
                transition={{ duration: 0.3 }}
              />

              {plan.popular && (
                <motion.div
                  className="absolute -top-4 left-1/2 transform -translate-x-1/2"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.5, type: "spring", stiffness: 500 }}
                >
                  <div className={`bg-gradient-to-r ${plan.gradient} text-white px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-1 shadow-lg`}>
                    <motion.div
                      animate={{ rotate: [0, 360] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    >
                      <Star size={16} />
                    </motion.div>
                    Most Popular
                  </div>
                </motion.div>
              )}

              {/* Savings badge */}
              <motion.div
                className={`absolute -top-2 -right-2 bg-gradient-to-r ${plan.gradient} text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg`}
                initial={{ scale: 0, rotate: -45 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.3 + index * 0.1, type: "spring" }}
              >
                {plan.savings}
              </motion.div>

              {/* Plan icon */}
              <motion.div
                className="flex justify-center mb-6"
                whileHover={{ scale: 1.1, rotate: 5 }}
                transition={{ duration: 0.3 }}
              >
                <div className={`w-16 h-16 bg-gradient-to-br ${plan.gradient} rounded-2xl flex items-center justify-center shadow-lg`}>
                  <plan.icon className="w-8 h-8 text-white" />
                </div>
              </motion.div>

              <div className="text-center mb-8 relative z-10">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                <p className="text-gray-600 mb-4">{plan.description}</p>
                <motion.div
                  className="mb-4"
                  whileHover={{ scale: 1.05 }}
                  transition={{ duration: 0.2 }}
                >
                  <span className={`text-4xl font-bold bg-gradient-to-r ${plan.gradient} bg-clip-text text-transparent`}>
                    {plan.price}
                  </span>
                  <span className="text-gray-600 ml-2">{plan.period}</span>
                </motion.div>
                <div className="flex justify-center gap-4 text-sm">
                  <div className="text-center">
                    <div className="font-semibold text-gray-900">Feature Access</div>
                    <div className="text-gray-600">{plan.features}</div>
                  </div>
                  <div className="text-center">
                    <div className="font-semibold text-gray-900">Support</div>
                    <div className="text-gray-600">{plan.support}</div>
                  </div>
                </div>
              </div>

              <motion.button
                className={`relative w-full py-4 px-6 rounded-xl font-semibold transition-all duration-300 overflow-hidden ${plan.popular
                    ? `bg-gradient-to-r ${plan.gradient} text-white shadow-lg hover:shadow-xl`
                    : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                  }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <motion.div
                  className="absolute inset-0 bg-white/20"
                  initial={{ x: "-100%" }}
                  whileHover={{ x: "100%" }}
                  transition={{ duration: 0.6 }}
                />
                <span className="relative z-10">Get Started</span>
              </motion.button>
            </motion.div>
          ))}
        </div>

        <motion.div
          className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-2xl p-8 border border-white/20"
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <motion.h3
            className="text-2xl font-bold text-gray-900 mb-6 text-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
          >
            What's Included in All Plans
          </motion.h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {allFeatures.map((feature, index) => (
              <motion.div
                key={index}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-green-50 transition-colors duration-200"
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: index * 0.05 }}
                viewport={{ once: true }}
                whileHover={{ x: 5 }}
              >
                <motion.div
                  whileHover={{ scale: 1.2, rotate: 360 }}
                  transition={{ duration: 0.3 }}
                >
                  <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                </motion.div>
                <span className="text-gray-700">{feature}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default Pricing;