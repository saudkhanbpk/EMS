import { Mail, Phone, MapPin, Facebook, Twitter, Linkedin, Instagram } from 'lucide-react';

const Footer = () => {
  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <footer className="bg-gradient-to-r from-blue-600 to-purple-700 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div>
            {/* EstroWork heading in yellow */}
            <h3 className="text-2xl font-bold mb-4 text-yellow-400">EstroWork</h3>
            {/* Paragraph in white */}
            <p className="mb-4 leading-relaxed">
              Transform your workplace with intelligent employee management solutions powered by AI and modern technology.
            </p>
            <div className="flex space-x-4">
              {[Facebook, Twitter, Linkedin, Instagram].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="hover:text-yellow-400 transition-colors duration-200"
                >
                  {/* Icons in yellow */}
                  <Icon size={20} className="text-yellow-400" />
                </a>
              ))}
            </div>
          </div>

          <div>
            {/* Quick Links heading in yellow */}
            <h4 className="text-lg font-semibold mb-4 text-yellow-400">Quick Links</h4>
            <ul className="space-y-2">
              {['home', 'features', 'pricing', 'contact'].map((section) => (
                <li key={section}>
                  <button
                    onClick={() => scrollToSection(section)}
                    className="hover:text-yellow-400 transition-colors duration-200"
                  >
                    {/* Button text white */}
                    <span className="text-white">{section.charAt(0).toUpperCase() + section.slice(1)}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div>
            {/* Features heading in yellow */}
            <h4 className="text-lg font-semibold mb-4 text-yellow-400">Features</h4>
            <ul className="space-y-2">
              {['Location Tracking', 'AI Daily Logs', 'Project Management', 'Leave Management', 'Overtime Tracking', '24/7 Support'].map((feature) => (
                <li key={feature} className="text-white">{feature}</li>
              ))}
            </ul>
          </div>

          <div>
            {/* Contact Info heading in yellow */}
            <h4 className="text-lg font-semibold mb-4 text-yellow-400">Contact Info</h4>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Mail size={16} className="text-yellow-400" />
                <span className="text-white">contact@techcreator.co</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone size={16} className="text-yellow-400" />
                <span className="text-white">++1(321)364-6803</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin size={16} className="text-yellow-400" />
                <span className="text-white">123 Business Avenue</span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-yellow-400/30 mt-12 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-white text-sm">
              © {new Date().getFullYear()} EstroWork. All rights reserved.
            </p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              {['Privacy Policy', 'Terms of Service', 'Cookie Policy'].map((text, i) => (
                <a
                  key={i}
                  href="#"
                  className="hover:text-yellow-400 text-white text-sm transition-colors duration-200"
                >
                  {text}
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;


// import { Mail, Phone, MapPin, Facebook, Twitter, Linkedin, Instagram } from 'lucide-react';

// const Footer = () => {
//   const scrollToSection = (sectionId: string) => {
//     const element = document.getElementById(sectionId);
//     if (element) {
//       element.scrollIntoView({ behavior: 'smooth' });
//     }
//   };

//   return (
//     <footer className="bg-gray-900 text-white">
//       <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
//         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
//           <div>
//             <h3 className="text-2xl font-bold text-blue-400 mb-4">Estrowork</h3>
//             <p className="text-gray-300 mb-4 leading-relaxed">
//               Transform your workplace with intelligent employee management solutions powered by AI and modern technology.
//             </p>
//             <div className="flex space-x-4">
//               <a href="#" className="text-gray-400 hover:text-blue-400 transition-colors duration-200">
//                 <Facebook size={20} />
//               </a>
//               <a href="#" className="text-gray-400 hover:text-blue-400 transition-colors duration-200">
//                 <Twitter size={20} />
//               </a>
//               <a href="#" className="text-gray-400 hover:text-blue-400 transition-colors duration-200">
//                 <Linkedin size={20} />
//               </a>
//               <a href="#" className="text-gray-400 hover:text-blue-400 transition-colors duration-200">
//                 <Instagram size={20} />
//               </a>
//             </div>
//           </div>

//           <div>
//             <h4 className="text-lg font-semibold mb-4">Quick Links</h4>
//             <ul className="space-y-2">
//               <li>
//                 <button
//                   onClick={() => scrollToSection('home')}
//                   className="text-gray-300 hover:text-blue-400 transition-colors duration-200"
//                 >
//                   Home
//                 </button>
//               </li>
//               <li>
//                 <button
//                   onClick={() => scrollToSection('features')}
//                   className="text-gray-300 hover:text-blue-400 transition-colors duration-200"
//                 >
//                   Features
//                 </button>
//               </li>
//               <li>
//                 <button
//                   onClick={() => scrollToSection('pricing')}
//                   className="text-gray-300 hover:text-blue-400 transition-colors duration-200"
//                 >
//                   Pricing
//                 </button>
//               </li>
//               <li>
//                 <button
//                   onClick={() => scrollToSection('contact')}
//                   className="text-gray-300 hover:text-blue-400 transition-colors duration-200"
//                 >
//                   Contact
//                 </button>
//               </li>
//             </ul>
//           </div>

//           <div>
//             <h4 className="text-lg font-semibold mb-4">Features</h4>
//             <ul className="space-y-2 text-gray-300">
//               <li>Location Tracking</li>
//               <li>AI Daily Logs</li>
//               <li>Project Management</li>
//               <li>Leave Management</li>
//               <li>Overtime Tracking</li>
//               <li>24/7 Support</li>
//             </ul>
//           </div>

//           <div>
//             <h4 className="text-lg font-semibold mb-4">Contact Info</h4>
//             <div className="space-y-3">
//               <div className="flex items-center gap-2">
//                 <Mail size={16} className="text-blue-400" />
//                 <span className="text-gray-300">contact@techcreator.co</span>
//               </div>
//               <div className="flex items-center gap-2">
//                 <Phone size={16} className="text-blue-400" />
//                 <span className="text-gray-300">+92 311 9265290</span>
//               </div>
//               <div className="flex items-center gap-2">
//                 <MapPin size={16} className="text-blue-400" />
//                 <span className="text-gray-300">123 Business Avenue</span>
//               </div>
//             </div>
//           </div>
//         </div>

//         <div className="border-t border-gray-800 mt-12 pt-8">
//           <div className="flex flex-col md:flex-row justify-between items-center">
//             <p className="text-gray-400 text-sm">
//               © {new Date().getFullYear()} Estrowork. All rights reserved.
//             </p>
//             <div className="flex space-x-6 mt-4 md:mt-0">
//               <a href="#" className="text-gray-400 hover:text-blue-400 text-sm transition-colors duration-200">
//                 Privacy Policy
//               </a>
//               <a href="#" className="text-gray-400 hover:text-blue-400 text-sm transition-colors duration-200">
//                 Terms of Service
//               </a>
//               <a href="#" className="text-gray-400 hover:text-blue-400 text-sm transition-colors duration-200">
//                 Cookie Policy
//               </a>
//             </div>
//           </div>
//         </div>
//       </div>
//     </footer>
//   );
// };

// export default Footer;
