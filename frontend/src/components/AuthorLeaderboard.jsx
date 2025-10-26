import React from 'react';
import { User, Award, Activity } from 'lucide-react';

const AuthorLeaderboard = ({ authors }) => {
  if (!authors || authors.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">👥 Top Contributors</h3>
        <div className="text-center text-gray-400 py-8">
          No contributor data available
        </div>
      </div>
    );
  }

  const getMedalEmoji = (index) => {
    if (index === 0) return '🥇';
    if (index === 1) return '🥈';
    if (index === 2) return '🥉';
    return `#${index + 1}`;
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">👥 Top Contributors</h3>
          <p className="text-sm text-gray-500 mt-1">Most active developers</p>
        </div>
        <Award className="w-5 h-5 text-yellow-500" />
      </div>

      <div className="space-y-3">
        {authors.slice(0, 10).map((author, index) => (
          <div
            key={index}
            className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <div className="flex items-center space-x-4 flex-1">
              <div className="text-2xl font-bold w-10 text-center">
                {getMedalEmoji(index)}
              </div>
              
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <User className="w-4 h-4 text-gray-400" />
                  <p className="font-semibold text-gray-900">{author.name}</p>
                </div>
                <p className="text-sm text-gray-500 mt-1">{author.email}</p>
              </div>
            </div>

            <div className="flex items-center space-x-6 text-right">
              <div>
                <p className="text-2xl font-bold text-blue-600">{author.commits}</p>
                <p className="text-xs text-gray-500">commits</p>
              </div>
              
              <div>
                <p className="text-lg font-semibold text-green-600">{author.active_days}</p>
                <p className="text-xs text-gray-500">active days</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {authors.length > 10 && (
        <div className="mt-4 text-center">
          <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
            View all {authors.length} contributors →
          </button>
        </div>
      )}
    </div>
  );
};

export default AuthorLeaderboard;