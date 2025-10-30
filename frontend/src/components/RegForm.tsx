import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { UserPlus, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';

// Interface for registration form 
interface RegisterFormData {
  email: string;
  password: string;
  confirmPassword: string;
}

const RegForm: React.FC = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // React Hook Form setup 
  const { register, handleSubmit, watch, formState: { errors } } = useForm<RegisterFormData>();
  const password = watch('password');

  // Handle form submission
  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true);
    try {
      // Call register API
      const response = await api.register({
        email: data.email,
        password: data.password
      });
      
      // Store authentication data in localStorage
      localStorage.setItem('token', response.access_token);
      localStorage.setItem('user', JSON.stringify({
        user_id: response.user_id,
        email: response.email
      }));
      
      // Show success message
      toast.success('Registration successful! Welcome aboard!');
      
      // Redirect to users list
      navigate('/users');
      
    } catch (error: any) {
      // Handle registration errors
      const errorMessage = error.response?.data?.detail || 'Registration failed. Please try again.';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Navigate to login page
  const goToLogin = () => {
    navigate('/login');
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        {/* Back */}
        <button 
          onClick={goToLogin}
          className="back-button"
        >
          <ArrowLeft size={16} />
          Back to Login
        </button>

        {/* Header */}
        <div className="auth-header">
          <UserPlus size={32} className="auth-icon" />
          <h1>Create Account</h1>
          <p>Join us today and start managing users</p>
        </div>

        {/* Registration */}
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

          {/* Password */}
          <div className="form-group">
            <label htmlFor="password" className="form-label">
              Password
            </label>
            <div className="password-input-container">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                className={`form-input ${errors.password ? 'error' : ''}`}
                placeholder="Create a password"
                {...register('password', { 
                  required: 'Password is required',
                  minLength: { 
                    value: 6, 
                    message: 'Password must be at least 6 characters' 
                  },
                  pattern: {
                    value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                    message: 'Password must contain at least one uppercase letter, one lowercase letter, and one number'
                  }
                })}
              />
              {/*  password visibility toggle*/}
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

          {/* Confirm Password */}
          <div className="form-group">
            <label htmlFor="confirmPassword" className="form-label">
              Confirm Password
            </label>
            <div className="password-input-container">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                id="confirmPassword"
                className={`form-input ${errors.confirmPassword ? 'error' : ''}`}
                placeholder="Confirm your password"
                {...register('confirmPassword', { 
                  required: 'Please confirm your password',
                  validate: value => 
                    value === password || 'Passwords do not match'
                })}
              />
              {/* Toggle confirm password visibility */}
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.confirmPassword && (
              <div className="error-message">
                {errors.confirmPassword.message}
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
                Creating Account...
              </>
            ) : (
              <>
                <UserPlus size={16} />
                Create Account
              </>
            )}
          </button>
        </form>

        {/* Login Link */}
        <div className="auth-footer">
          <p>Already have an account?</p>
          <button
            type="button" 
            onClick={goToLogin}
            className="link-button"
          >
            Sign in here
          </button>
        </div>
      </div>
    </div>
  );
};

export default RegForm;