import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Trash2, Edit, User as UserIcon, Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import api, { User } from '../services/api';

const UserList: React.FC = () => {
  const queryClient = useQueryClient();

  const { data: users, isLoading, error } = useQuery({
    queryKey: ['users'],
    queryFn: api.getUsers,
  });

  const deleteMutation = useMutation({
    mutationFn: api.deleteUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('User deleted successfully!');
    },
    onError: (error: any) => {
      toast.error(`Failed to delete user: ${error.message}`);
    },
  });

  const handleDelete = (user_id: number) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      deleteMutation.mutate(user_id);
    }
  };

  if (isLoading) {
    return (
      <div className="loading">
        <UserIcon size={48} />
        <p>Loading users...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error">
        <p>Error loading users: {(error as Error).message}</p>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 className="page-title">Users</h1>
        <Link to="/add-user" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Plus size={16} />
          Add User
        </Link>
      </div>

      {!users || users.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
          <UserIcon size={48} style={{ color: '#ccc', marginBottom: '16px' }} />
          <p style={{ color: '#666', marginBottom: '16px' }}>No users found</p>
          <Link to="/add-user" className="btn btn-primary">
            Add Your First User
          </Link>
        </div>
      ) : (
        <div className="user-grid">
          {users.map((user: User) => (
            <div key={user.user_id} className="user-card">
              <div className="user-header">
                <div>
                  <h3 className="user-email">{user.email || 'No Email'}</h3>
                  <p className="user-password" style={{ fontSize: '12px', color: '#666' }}>
                    Password: {'*'.repeat(user.password.length)}
                  </p>
                  <p className="user-id">ID: {user.user_id}</p>
                </div>
                <div className="actions">
                  <Link
                    to={`/edit-user/${user.user_id}`}
                    className="btn btn-secondary"
                    style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
                  >
                    <Edit size={14} />
                    Edit
                  </Link>
                  <button
                    onClick={() => handleDelete(user.user_id)}
                    className="btn btn-danger"
                    disabled={deleteMutation.isPending}
                    style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
                  >
                    <Trash2 size={14} />
                    {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default UserList;