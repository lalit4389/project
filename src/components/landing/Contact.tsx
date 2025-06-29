import React from 'react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { Mail, Phone, MapPin, Send } from 'lucide-react';

interface ContactForm {
  name: string;
  email: string;
  subject: string;
  message: string;
}

const Contact: React.FC = () => {
  const { register, handleSubmit, reset, formState: { errors } } = useForm<ContactForm>();

  const onSubmit = (data: ContactForm) => {
    console.log('Contact form submitted:', data);
    // Here you would typically send the data to your backend
    alert('Thank you for your message! We\'ll get back to you soon.');
    reset();
  };

  return (
    <section className="py-20 bg-dark-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Get In 
            <span className="bg-gradient-to-r from-olive-400 to-olive-600 bg-clip-text text-transparent"> Touch</span>
          </h2>
          <p className="text-xl text-olive-200/70 max-w-3xl mx-auto">
            Have questions about AutoTraderHub? We're here to help you get started with automated trading.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Contact Information */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="space-y-8"
          >
            <div>
              <h3 className="text-2xl font-bold text-white mb-6">
                Contact Information
              </h3>
              <p className="text-olive-200/70 mb-8">
                Reach out to our team for support, partnership opportunities, or any questions about our platform.
              </p>
            </div>

            <div className="space-y-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gradient-to-r from-olive-500 to-olive-600 rounded-lg flex items-center justify-center">
                  <Mail className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="font-semibold text-white">Email</div>
                  <div className="text-olive-200/70">support@autotraderhub.com</div>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gradient-to-r from-olive-600 to-olive-700 rounded-lg flex items-center justify-center">
                  <Phone className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="font-semibold text-white">Phone</div>
                  <div className="text-olive-200/70">+91 9876543210</div>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gradient-to-r from-dark-600 to-olive-600 rounded-lg flex items-center justify-center">
                  <MapPin className="w-6 h-6 text-olive-300" />
                </div>
                <div>
                  <div className="font-semibold text-white">Address</div>
                  <div className="text-olive-200/70">Mumbai, Maharashtra, India</div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-olive-800/30 to-dark-800/50 backdrop-blur-xl rounded-2xl p-6 border border-olive-500/20">
              <h4 className="font-bold text-white mb-3">Business Hours</h4>
              <div className="space-y-2 text-olive-200/70">
                <div className="flex justify-between">
                  <span>Monday - Friday</span>
                  <span>9:00 AM - 6:00 PM IST</span>
                </div>
                <div className="flex justify-between">
                  <span>Saturday</span>
                  <span>10:00 AM - 4:00 PM IST</span>
                </div>
                <div className="flex justify-between">
                  <span>Sunday</span>
                  <span>Closed</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Contact Form */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="bg-dark-800/50 backdrop-blur-xl rounded-2xl p-8 shadow-xl border border-olive-500/20"
          >
            <h3 className="text-2xl font-bold text-white mb-6">
              Send us a Message
            </h3>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-olive-200 mb-2">
                  Name
                </label>
                <input
                  {...register('name', { required: 'Name is required' })}
                  className="w-full px-4 py-3 bg-dark-800/50 border border-olive-500/20 rounded-lg text-white placeholder-olive-300/50 focus:ring-2 focus:ring-olive-500 focus:border-transparent transition-all"
                  placeholder="Your full name"
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-400">{errors.name.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-olive-200 mb-2">
                  Email
                </label>
                <input
                  {...register('email', { 
                    required: 'Email is required',
                    pattern: {
                      value: /^\S+@\S+$/i,
                      message: 'Please enter a valid email'
                    }
                  })}
                  type="email"
                  className="w-full px-4 py-3 bg-dark-800/50 border border-olive-500/20 rounded-lg text-white placeholder-olive-300/50 focus:ring-2 focus:ring-olive-500 focus:border-transparent transition-all"
                  placeholder="your.email@example.com"
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-400">{errors.email.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-olive-200 mb-2">
                  Subject
                </label>
                <input
                  {...register('subject', { required: 'Subject is required' })}
                  className="w-full px-4 py-3 bg-dark-800/50 border border-olive-500/20 rounded-lg text-white placeholder-olive-300/50 focus:ring-2 focus:ring-olive-500 focus:border-transparent transition-all"
                  placeholder="What is this about?"
                />
                {errors.subject && (
                  <p className="mt-1 text-sm text-red-400">{errors.subject.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-olive-200 mb-2">
                  Message
                </label>
                <textarea
                  {...register('message', { required: 'Message is required' })}
                  rows={5}
                  className="w-full px-4 py-3 bg-dark-800/50 border border-olive-500/20 rounded-lg text-white placeholder-olive-300/50 focus:ring-2 focus:ring-olive-500 focus:border-transparent transition-all resize-none"
                  placeholder="Tell us more about your inquiry..."
                />
                {errors.message && (
                  <p className="mt-1 text-sm text-red-400">{errors.message.message}</p>
                )}
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                className="w-full bg-gradient-to-r from-olive-600 to-olive-700 text-white py-4 rounded-lg font-semibold flex items-center justify-center space-x-2 hover:shadow-lg transition-all"
              >
                <Send className="w-5 h-5" />
                <span>Send Message</span>
              </motion.button>
            </form>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default Contact;