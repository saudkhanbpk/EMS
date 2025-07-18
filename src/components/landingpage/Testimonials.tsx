import { Star, Quote } from 'lucide-react';
import { motion } from 'framer-motion';

const Testimonials = () => {
  return (
    <section className="py-20 bg-gradient-to-br from-blue-600 to-purple-700 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20"></div>
      <motion.div
        className="absolute top-10 right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"
        animate={{
          x: [0, -30, 0],
          y: [0, 20, 0],
          scale: [1, 1.1, 1],
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
            className="text-3xl md:text-4xl font-bold text-white mb-4"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            viewport={{ once: true }}
          >
            What Our Users Say
          </motion.h2>
          <motion.p
            className="text-xl text-blue-100 max-w-3xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            viewport={{ once: true }}
          >
            Real teams. Real results. See why WhisprWork is the new favorite for project management.
          </motion.p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Testimonial 1 */}
          <motion.div
            className="bg-white/95 backdrop-blur-sm rounded-2xl p-8 shadow-2xl border border-white/20"
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            viewport={{ once: true }}
            whileHover={{ y: -5, transition: { duration: 0.3 } }}
          >
            <div className="flex items-center gap-4 mb-6">
              <motion.img
                src="https://images.pexels.com/photos/614810/pexels-photo-614810.jpeg?auto=compress&fit=crop&w=150&q=80"
                alt="Adeel R."
                className="w-16 h-16 rounded-full object-cover shadow-lg"
                whileHover={{ scale: 1.1 }}
                transition={{ duration: 0.3 }}
              />
              <div>
                <h4 className="text-lg font-semibold text-gray-900">Adeel R.</h4>
                <p className="text-gray-600">Product Lead</p>
                <div className="flex gap-1 mt-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                  ))}
                </div>
              </div>
            </div>
            <Quote className="w-8 h-8 text-blue-600 mb-4" />
            <p className="text-gray-700 leading-relaxed">
              “We’ve tried Trello, Asana, and ClickUp—WhisprWork just feels simpler and more focused. It’s become our daily go-to.”
            </p>
          </motion.div>

          {/* Testimonial 2 */}
          <motion.div
            className="bg-white/95 backdrop-blur-sm rounded-2xl p-8 shadow-2xl border border-white/20"
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
            whileHover={{ y: -5, transition: { duration: 0.3 } }}
          >
            <div className="flex items-center gap-4 mb-6">
              <motion.img
                src="https://images.pexels.com/photos/1130626/pexels-photo-1130626.jpeg?auto=compress&fit=crop&w=150&q=80"
                alt="Sana M."
                className="w-16 h-16 rounded-full object-cover shadow-lg"
                whileHover={{ scale: 1.1 }}
                transition={{ duration: 0.3 }}
              />
              <div>
                <h4 className="text-lg font-semibold text-gray-900">Sana M.</h4>
                <p className="text-gray-600">Project Manager</p>
                <div className="flex gap-1 mt-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                  ))}
                </div>
              </div>
            </div>
            <Quote className="w-8 h-8 text-blue-600 mb-4" />
            <p className="text-gray-700 leading-relaxed">
              “Managing tasks across 3 teams used to be chaotic. Now we can track everything from one clean dashboard.”
            </p>
          </motion.div>

          {/* Testimonial 3 */}
          <motion.div
            className="bg-white/95 backdrop-blur-sm rounded-2xl p-8 shadow-2xl border border-white/20"
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            viewport={{ once: true }}
            whileHover={{ y: -5, transition: { duration: 0.3 } }}
          >
            <div className="flex items-center gap-4 mb-6">
              <motion.img
                src="https://images.pexels.com/photos/91227/pexels-photo-91227.jpeg?auto=compress&fit=crop&w=150&q=80"
                alt="Liam T."
                className="w-16 h-16 rounded-full object-cover shadow-lg"
                whileHover={{ scale: 1.1 }}
                transition={{ duration: 0.3 }}
              />
              <div>
                <h4 className="text-lg font-semibold text-gray-900">Liam T.</h4>
                <p className="text-gray-600">Operations Lead</p>
                <div className="flex gap-1 mt-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                  ))}
                </div>
              </div>
            </div>
            <Quote className="w-8 h-8 text-blue-600 mb-4" />
            <p className="text-gray-700 leading-relaxed">
              “WhisprWork’s real-time collaboration has made our remote team feel truly connected. The learning curve was almost zero.”
            </p>
          </motion.div>

          {/* Testimonial 4 */}
          <motion.div
            className="bg-white/95 backdrop-blur-sm rounded-2xl p-8 shadow-2xl border border-white/20"
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            viewport={{ once: true }}
            whileHover={{ y: -5, transition: { duration: 0.3 } }}
          >
            <div className="flex items-center gap-4 mb-6">
              <motion.img
                src="https://images.pexels.com/photos/1181696/pexels-photo-1181696.jpeg?auto=compress&fit=crop&w=150&q=80"
                alt="Priya S."
                className="w-16 h-16 rounded-full object-cover shadow-lg"
                whileHover={{ scale: 1.1 }}
                transition={{ duration: 0.3 }}
              />
              <div>
                <h4 className="text-lg font-semibold text-gray-900">Priya S.</h4>
                <p className="text-gray-600">Client Success Manager</p>
                <div className="flex gap-1 mt-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                  ))}
                </div>
              </div>
            </div>
            <Quote className="w-8 h-8 text-blue-600 mb-4" />
            <p className="text-gray-700 leading-relaxed">
              “Inviting clients to specific projects is a game-changer. Feedback is instant, and everyone’s always in sync.”
            </p>
          </motion.div>
        </div>

        <div className="mt-12 text-center">
          <div className="inline-flex items-center gap-8 text-blue-100">
            <div className="text-center">
              <div className="text-2xl font-bold text-white">10,000+</div>
              <div className="text-sm">Projects Managed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-white">35%</div>
              <div className="text-sm">Productivity Increase</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-white">99.9%</div>
              <div className="text-sm">System Uptime</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Testimonials;