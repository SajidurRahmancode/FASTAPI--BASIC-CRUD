import React, { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Save, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import api, { UserFormData} from '../services/api';

const UserForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const isEditing = Boolean(id);

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<UserFormData>();

  const { data: user } = useQuery({
    queryKey: ['user', id],
    queryFn: () => api.getUser(Number(id)),
    enabled: isEditing,
  });

  const createMutation = useMutation({
    mutationFn: api.createUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('User created successfully!');
      navigate('/users');
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.detail || 'Failed to create user';
      toast.error(errorMessage);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ user_id, data }: { user_id: number; data: UserFormData }) => api.updateUser(user_id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['user', id] });
      toast.success('User updated successfully!');
      navigate('/users');
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.detail || 'Failed to update user';
      toast.error(errorMessage);
    },
  });

  useEffect(() => {
    if (user) {
      setValue('email', user.email || '');
      // Don't set password for editing - let user enter new password
      if (!isEditing) {
        setValue('password', '');
      }
    }
  }, [user, setValue, isEditing]);

  const onSubmit = (data: UserFormData) => {
    if (isEditing) {
      updateMutation.mutate({ user_id: Number(id), data });
    } else {
      createMutation.mutate(data);
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
        <button 
          onClick={() => navigate('/users')}
          className="btn btn-secondary"
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <ArrowLeft size={16} />
          Back
        </button>
        <h1 className="page-title" style={{ margin: 0 }}>
          {isEditing ? 'Edit User' : 'Add New User'}
        </h1>
      </div>

      <div className="card">
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="form-group">
            <label htmlFor="email" className="form-label">
              Email *
            </label>
            <input
              type="email"
              id="email"
              className="form-input"
              {...register('email', { 
                required: 'Email is required',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Invalid email address'
                }
              })}
            />
            {errors.email && (
              <div className="error-message" style={{ marginTop: '4px' }}>
                {errors.email.message}
              </div>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="password" className="form-label">
              {isEditing ? 'New Password *' : 'Password *'}
            </label>
            <input
              type="password"
              id="password"
              className="form-input"
              placeholder={isEditing ? 'Enter new password' : 'Enter password'}
              {...register('password', { 
                required: 'Password is required',
                minLength: { value: 6, message: 'Password must be at least 6 characters' }
              })}
            />
            {isEditing && (
              <div style={{ fontSize: '12px', color: '#6c757d', marginTop: '4px' }}>
                Leave empty to keep current password (for demonstration - in production, handle this properly)
              </div>
            )}
            {errors.password && (
              <div className="error-message" style={{ marginTop: '4px' }}>
                {errors.password.message}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
            <button
              type="submit"
              disabled={isLoading}
              className="btn btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <Save size={16} />
              {isLoading ? 'Saving...' : isEditing ? 'Update User' : 'Create User'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/users')}
              className="btn btn-secondary"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserForm;