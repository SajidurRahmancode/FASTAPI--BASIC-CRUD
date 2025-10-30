import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { LogIn, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';

// Interface for login form data
interface LoginFormData {
  email: string;
  password: string;
}

const LoginForm: React.FC = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // React Hook Form setup with validation
  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormData>();

  // Handle form submission
  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    try {
      // Call login API
      const response = await api.login(data);
      
      // Store authentication data in localStorage
      localStorage.setItem('token', response.access_token);
      localStorage.setItem('user', JSON.stringify({
        user_id: response.user_id,
        email: response.email
      }));
      
      // Show success message
      toast.success('Login successful!');
      
      // Redirect to users list
      navigate('/users');
      
    } catch (error: any) {
      // Handle login errors
      const errorMessage = error.response?.data?.detail || 'Login failed. Please try again.';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Navigate to registration page
  const goToRegister = () => {
    navigate('/register');
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        {/* Header */}
        <div className="auth-header">
          <LogIn size={32} className="auth-icon" />
          <h1>Welcome Back</h1>
          <p>Please sign in to your account</p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="auth-form">
          {/* Email Field */}
          <div className="form-group">
            <label htmlFor="email" className="form-label">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              className={`form-input ${errors.email ? 'error' : ''}`}
              placeholder="Enter your email"
              {...register('email', { 
                required: 'Email is required',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Please enter a valid email address'
                }
              })}
            />
            {errors.email && (
              <div className="error-message">
                {errors.email.message}
              </div>
            )}
          </div>

          {/* Password Field */}
          <div className="form-group">
            <label htmlFor="password" className="form-label">
              Password
            </label>
            <div className="password-input-container">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                className={`form-input ${errors.password ? 'error' : ''}`}
                placeholder="Enter your password"
                {...register('password', { 
                  required: 'Password is required',
                  minLength: { 
                    value: 6, 
                    message: 'Password must be at least 6 characters' 
                  }
                })}
              />
              {/* Toggle password visibility */}
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.password && (
              <div className="error-message">
                {errors.password.message}
              </div>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="btn btn-primary auth-submit"
          >
            {isLoading ? (
              <>
                <div className="spinner"></div>
                Signing In...
              </>
            ) : (
              <>
                <LogIn size={16} />
                Sign In
              </>
            )}
          </button>
        </form>

        {/* Register Link */}
        <div className="auth-footer">
          <p>Don't have an account?</p>
          <button
            type="button" 
            onClick={goToRegister}
            className="link-button"
          >
            Create an account
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;
