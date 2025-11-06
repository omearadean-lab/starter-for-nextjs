'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';
import { EyeIcon, EyeSlashIcon, ArrowRightIcon } from '@heroicons/react/24/outline';

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await login(formData.email, formData.password);
      router.push('/dashboard');
    } catch (error) {
      toast.error('Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-black flex">
      {/* Subtle Background Pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.15)_1px,transparent_0)] bg-[length:20px_20px] opacity-20"></div>
      
      {/* Left side - Login Form */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-20 xl:px-24 relative z-10">
        <div className="mx-auto w-full max-w-md">
          {/* Logo */}
          <div className="flex justify-center mb-12">
            <div className="relative">
              <img
                className="h-16 w-auto"
                src="https://fra.cloud.appwrite.io/v1/storage/buckets/faces/files/690c871d003cfffb38af/view?project=690c7785003337dac829&mode=admin"
                alt="UMA AEye Logo"
              />
            </div>
          </div>
          
          {/* Header */}
          <div className="text-center mb-10">
            <h1 className="text-3xl font-light text-white mb-3">
              Welcome back
            </h1>
            <p className="text-gray-400 text-sm font-light">
              Sign in to your UMA AEye account
            </p>
          </div>

          {/* Form */}
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="block w-full px-4 py-3 bg-white/5 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-transparent transition-all duration-200 backdrop-blur-sm"
                placeholder="Enter your email"
                value={formData.email}
                onChange={handleChange}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  className="block w-full px-4 py-3 pr-12 bg-white/5 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-transparent transition-all duration-200 backdrop-blur-sm"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleChange}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-300 transition-colors"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeSlashIcon className="h-5 w-5" />
                  ) : (
                    <EyeIcon className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-white focus:ring-white/20 border-gray-600 rounded bg-white/5"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-400">
                  Remember me
                </label>
              </div>

              <div className="text-sm">
                <a href="#" className="font-medium text-gray-300 hover:text-white transition-colors">
                  Forgot password?
                </a>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center items-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-black bg-white hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black mr-2"></div>
                  Signing in...
                </>
              ) : (
                <>
                  Sign in
                  <ArrowRightIcon className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform duration-200" />
                </>
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-8 text-center">
            <p className="text-xs text-gray-500">
              Protected by enterprise-grade security
            </p>
          </div>
        </div>
      </div>

      {/* Right side - Hero Section */}
      <div className="hidden lg:flex lg:flex-1 relative">
        {/* Subtle gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-800/50 to-transparent"></div>
        
        <div className="relative flex flex-col justify-center px-12 py-24 text-white">
          <div className="max-w-lg">
            <h1 className="text-4xl font-light mb-6 leading-tight">
              Enterprise Security
              <br />
              <span className="font-normal">Redefined</span>
            </h1>
            
            <p className="text-xl text-gray-300 mb-12 font-light leading-relaxed">
              Advanced AI-powered surveillance platform trusted by security professionals worldwide.
            </p>

            <div className="space-y-8">
              {[
                {
                  title: "Real-time Intelligence",
                  description: "Instant threat detection and automated response protocols"
                },
                {
                  title: "Advanced Analytics",
                  description: "Machine learning algorithms for predictive security insights"
                },
                {
                  title: "Enterprise Grade",
                  description: "Bank-level security with 99.9% uptime guarantee"
                }
              ].map((feature, index) => (
                <div key={index} className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-2 h-2 bg-white rounded-full mt-3"></div>
                  <div>
                    <h3 className="font-medium text-white mb-1">{feature.title}</h3>
                    <p className="text-sm text-gray-400 leading-relaxed">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-16 pt-8 border-t border-gray-700">
              <div className="flex items-center space-x-6 text-sm text-gray-400">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <span>99.9% Uptime</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                  <span>SOC 2 Compliant</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                  <span>ISO 27001</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
