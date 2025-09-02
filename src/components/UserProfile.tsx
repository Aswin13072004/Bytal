import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';

export const UserProfile: React.FC = () => {
  const { userProfile, loading, refreshUserProfile } = useAuth();

  if (loading) {
    return <div className="flex justify-center p-4">Loading...</div>;
  }

  if (!userProfile) {
    return <div className="flex justify-center p-4">No user profile found</div>;
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-center">User Profile</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-between items-center">
          <span className="font-medium">Name:</span>
          <span>{userProfile.name}</span>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="font-medium">Email:</span>
          <span>{userProfile.email}</span>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="font-medium">Current Streak:</span>
          <Badge variant="secondary">
            {userProfile.streak_count} days
          </Badge>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="font-medium">Member Since:</span>
          <span>{new Date(userProfile.created_at).toLocaleDateString()}</span>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="font-medium">Last Updated:</span>
          <span>{new Date(userProfile.updated_at).toLocaleDateString()}</span>
        </div>
        
        <button
          onClick={refreshUserProfile}
          className="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 transition-colors"
        >
          Refresh Profile
        </button>
      </CardContent>
    </Card>
  );
};
