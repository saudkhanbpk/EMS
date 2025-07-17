import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

const FAQ = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const faqs = [
    {
      question: "How does the location-based check-in system work?",
      answer: "Our system uses GPS technology to automatically detect whether employees are working from the office or remotely. It includes geofencing for office locations and a simple remote work check-in option for home-based work."
    },
    {
      question: "What kind of insights does the AI provide for daily logs?",
      answer: "The AI analyzes daily logs for productivity patterns, task completion rates, quality of work descriptions, and time management. It provides ratings and suggestions to help employees improve their performance and managers make informed decisions."
    },
    {
      question: "Is my data secure with EMS ?",
      answer: "Yes, we use enterprise-grade security with end-to-end encryption, regular security audits, and compliance with GDPR and SOC 2 standards. Your data is stored securely and never shared with third parties."
    },
    {
      question: "Can I integrate EMS  with other software?",
      answer: "EMS  offers API integrations with popular tools like Slack, Microsoft Teams, Google Workspace, and various project management platforms. We also provide custom integration support for enterprise clients."
    },
    {
      question: "What's included in the different support tiers?",
      answer: "Standard support includes email support with 24-hour response time. Priority support adds live chat and phone support with 4-hour response time. Premium support includes dedicated account manager and 1-hour response time."
    },
    {
      question: "How does the overtime calculation work?",
      answer: "The system automatically tracks work hours and calculates overtime based on your company's policies. It considers different overtime rates, break times, and generates detailed reports for payroll processing."
    }
  ];

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="py-20 bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-xl text-gray-600">
            Get answers to common questions about EMS 
          </p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="bg-gray-50 rounded-lg border border-gray-200 overflow-hidden"
            >
              <button
                onClick={() => toggleFAQ(index)}
                className="w-full px-6 py-4 text-left flex justify-between items-center hover:bg-gray-100 transition-colors duration-200"
              >
                <span className="text-lg font-semibold text-gray-900">
                  {faq.question}
                </span>
                {openIndex === index ? (
                  <ChevronUp className="w-5 h-5 text-gray-500" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-500" />
                )}
              </button>
              {openIndex === index && (
                <div className="px-6 pb-4">
                  <p className="text-gray-700 leading-relaxed">
                    {faq.answer}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FAQ;