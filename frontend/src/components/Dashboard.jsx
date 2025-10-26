import React, { useState } from "react";
import {
  GitBranch,
  Users,
  Activity,
  GitPullRequest,
  AlertCircle,
  TrendingUp,
  Search,
  Loader,
  AlertTriangle,
  CheckCircle,
  Clock,
  Star,
  RefreshCw,
} from "lucide-react";
import axios from "axios";

import api from "../services/api"

// Real API Configuration
const API_BASE_URL =
  process.env.REACT_APP_API_URL || "http://localhost:5000/api";

// const api = {
//   getUserAnalytics: async (username, options = {}) => {
//     try {
//       const response = await axios.get(`/github/analytics/${username}`, {
//         params: {
//           days: options.days || 30,
//           repos_limit: options.repos_limit || 5,
//         },
//         timeout: 30000,
//       });

//       if (response.data.success) {
//         return response.data;
//       } else {
//         throw new Error(response.data.error || "Failed to fetch analytics");
//       }
//     } catch (error) {
//       if (error.response) {
//         throw new Error(
//           error.response.data?.error || `Server error: ${error.response.status}`
//         );
//       } else if (error.request) {
//         throw new Error(
//           "Cannot connect to server. Please ensure backend is running on http://localhost:5000"
//         );
//       } else {
//         throw new Error(error.message || "An unexpected error occurred");
//       }
//     }
//   },
// };

// Metric Card Component
const MetricCard = ({ title, value, subtitle, icon: Icon, color = "blue" }) => {
  const colorClasses = {
    blue: "bg-blue-50 text-blue-600",
    green: "bg-green-50 text-green-600",
    purple: "bg-purple-50 text-purple-600",
    orange: "bg-orange-50 text-orange-600",
    red: "bg-red-50 text-red-600",
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <h3 className="text-3xl font-bold text-gray-900 mb-2">{value}</h3>
          {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
        </div>
        {Icon && (
          <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
            <Icon className="w-6 h-6" />
          </div>
        )}
      </div>
    </div>
  );
};

// Simple Chart Component
const SimpleChart = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          📈 Commit Activity
        </h3>
        <div className="flex items-center justify-center h-48 text-gray-400">
          No commit data available
        </div>
      </div>
    );
  }

  const maxCount = Math.max(...data.map((d) => d.count));

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        📈 Commit Activity
      </h3>
      <div className="flex items-end justify-between h-48 gap-2">
        {data.slice(-14).map((item, idx) => {
          const height = (item.count / maxCount) * 100;
          return (
            <div key={idx} className="flex flex-col items-center flex-1 group">
              <div className="relative w-full flex items-end h-full">
                <div
                  className="bg-blue-500 rounded-t hover:bg-blue-600 transition-all cursor-pointer w-full"
                  style={{
                    height: `${Math.max(height, 10)}%`,
                    minHeight: "20px",
                  }}
                  title={`${item.count} commits`}
                >
                  <span className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs font-semibold text-gray-700 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    {item.count}
                  </span>
                </div>
              </div>
              <span className="text-xs text-gray-500 mt-2">
                {new Date(item.date).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })}
              </span>
            </div>
          );
        })}
      </div>
      <div className="mt-4 text-center">
        <p className="text-sm text-gray-600">
          Total:{" "}
          <strong>
            {data.reduce((sum, item) => sum + item.count, 0)} commits
          </strong>
        </p>
      </div>
    </div>
  );
};

// Author Leaderboard Component
const AuthorLeaderboard = ({ authors }) => {
  if (!authors || authors.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          👥 Top Contributors
        </h3>
        <div className="text-center text-gray-400 py-8">
          No contributor data
        </div>
      </div>
    );
  }

  const getMedal = (idx) =>
    ["🥇", "🥈", "🥉", "4️⃣", "5️⃣"][idx] || `#${idx + 1}`;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        👥 Top Contributors
      </h3>
      <div className="space-y-3">
        {authors.slice(0, 5).map((author, idx) => (
          <div
            key={idx}
            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <span className="text-2xl flex-shrink-0">{getMedal(idx)}</span>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 truncate">
                  {author.name}
                </p>
                <p className="text-xs text-gray-500 truncate">{author.email}</p>
              </div>
            </div>
            <div className="text-right flex-shrink-0 ml-4">
              <p className="text-xl font-bold text-blue-600">
                {author.commits}
              </p>
              <p className="text-xs text-gray-500">{author.active_days} days</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Main Dashboard Component
const Dashboard = () => {
  const [username, setUsername] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchInput.trim()) {
      setError("Please enter a GitHub username");
      return;
    }

    setLoading(true);
    setError("");
    setAnalytics(null);

    try {
      console.log(`🔍 Fetching analytics for: ${searchInput}`);
      const result = await api.getUserAnalytics(searchInput.trim(), {
        days: 30,
        repos_limit: 5,
      });

      console.log("✅ Analytics received:", result);
      setAnalytics(result.analytics);
      setUsername(searchInput);
    } catch (err) {
      console.error("❌ Error:", err);
      setError(err.message || "Failed to fetch analytics. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Activity className="w-8 h-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  DevInsights
                </h1>
                <p className="text-xs text-gray-500">
                  Real-time GitHub Analytics
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-gray-600">Backend Connected</span>
            </div>
          </div>
        </div>
      </header>

      {/* Search Section */}
      <div className="bg-gradient-to-br from-blue-500 to-blue-700 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h2 className="text-4xl font-bold mb-3">
              Analyze GitHub Productivity
            </h2>
            <p className="text-blue-100 text-lg">
              Get real-time insights into development patterns
            </p>
          </div>

          <form onSubmit={handleSearch} className="max-w-2xl mx-auto">
            <div className="flex gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Enter GitHub username (e.g., torvalds, facebook)..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 rounded-lg text-gray-900 text-lg focus:outline-none focus:ring-4 focus:ring-blue-300"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="px-8 py-4 bg-white text-blue-600 font-semibold rounded-lg hover:bg-blue-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  "Analyze"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader className="w-12 h-12 text-blue-600 animate-spin mb-4" />
            <p className="text-gray-600 text-lg font-semibold">
              Analyzing GitHub data...
            </p>
            <p className="text-gray-400 text-sm mt-2">
              Fetching repositories, commits, PRs, and issues
            </p>
            <div className="mt-6 w-64 bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full animate-pulse"
                style={{ width: "60%" }}
              ></div>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 flex items-start gap-3 max-w-2xl mx-auto">
            <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold text-red-900 text-lg mb-1">Error</p>
              <p className="text-red-700">{error}</p>
              <p className="text-red-600 text-sm mt-2">
                💡 Tip: Make sure your backend is running on
                http://localhost:5000
              </p>
            </div>
          </div>
        )}

        {/* Analytics Dashboard */}
        {analytics && !loading && (
          <div className="space-y-6">
            {/* Success Banner */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <div className="flex-1">
                <p className="font-semibold text-green-900">
                  Successfully analyzed <strong>{username}</strong>'s GitHub
                  profile
                </p>
                <p className="text-green-700 text-sm">
                  Analyzed {analytics.overview?.total_repositories || 0}{" "}
                  repositories with {analytics.overview?.total_commits || 0}{" "}
                  commits
                </p>
              </div>
            </div>

            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <MetricCard
                title="Total Commits"
                value={analytics.overview?.total_commits || 0}
                subtitle={`${analytics.overview?.commits_per_day || 0} per day`}
                icon={GitBranch}
                color="blue"
              />
              <MetricCard
                title="Contributors"
                value={analytics.overview?.unique_contributors || 0}
                subtitle={`${
                  analytics.overview?.total_repositories || 0
                } repositories`}
                icon={Users}
                color="green"
              />
              <MetricCard
                title="Activity Score"
                value={`${analytics.overview?.activity_score || 0}/10`}
                subtitle="Overall health"
                icon={TrendingUp}
                color="purple"
              />
              <MetricCard
                title="PR Merge Rate"
                value={`${analytics.overview?.pr_merge_rate || 0}%`}
                subtitle={`${analytics.overview?.merged_prs || 0} merged`}
                icon={CheckCircle}
                color="green"
              />
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <SimpleChart data={analytics.commit_trends} />
              </div>
              <div>
                <AuthorLeaderboard authors={analytics.author_productivity} />
              </div>
            </div>

            {/* PR & Issues Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Pull Requests
                  </h3>
                  <GitPullRequest className="w-5 h-5 text-blue-600" />
                </div>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-600">Merge Rate</span>
                      <span className="font-semibold">
                        {analytics.pull_request_metrics?.merged || 0}/
                        {analytics.pull_request_metrics?.total || 0}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-500 h-2 rounded-full transition-all"
                        style={{
                          width: `${
                            analytics.pull_request_metrics?.merge_rate || 0
                          }%`,
                        }}
                      ></div>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                    <div>
                      <p className="text-2xl font-bold text-green-600">
                        {analytics.pull_request_metrics?.merged || 0}
                      </p>
                      <p className="text-xs text-gray-500">Merged</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-blue-600">
                        {analytics.pull_request_metrics?.open || 0}
                      </p>
                      <p className="text-xs text-gray-500">Open</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-600">
                        {analytics.pull_request_metrics?.closed || 0}
                      </p>
                      <p className="text-xs text-gray-500">Closed</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600 pt-2">
                    <Clock className="w-4 h-4" />
                    <span>
                      Avg merge time:{" "}
                      <strong>
                        {analytics.pull_request_metrics
                          ?.avg_time_to_merge_hours || 0}
                        h
                      </strong>
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Issues
                  </h3>
                  <AlertCircle className="w-5 h-5 text-orange-600" />
                </div>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-red-50 rounded-lg p-4">
                      <p className="text-3xl font-bold text-red-600">
                        {analytics.issue_metrics?.bugs || 0}
                      </p>
                      <p className="text-sm text-gray-600 mt-1">🐛 Bugs</p>
                    </div>
                    <div className="bg-blue-50 rounded-lg p-4">
                      <p className="text-3xl font-bold text-blue-600">
                        {analytics.issue_metrics?.features || 0}
                      </p>
                      <p className="text-sm text-gray-600 mt-1">✨ Features</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                    <div>
                      <p className="text-2xl font-bold text-green-600">
                        {analytics.issue_metrics?.closed || 0}
                      </p>
                      <p className="text-xs text-gray-500">Closed</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-orange-600">
                        {analytics.issue_metrics?.open || 0}
                      </p>
                      <p className="text-xs text-gray-500">Open</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-red-600">
                        {analytics.issue_metrics?.stale || 0}
                      </p>
                      <p className="text-xs text-gray-500">Stale</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600 pt-2">
                    <Clock className="w-4 h-4" />
                    <span>
                      Avg resolution:{" "}
                      <strong>
                        {analytics.issue_metrics?.avg_resolution_hours || 0}h
                      </strong>
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Repository Breakdown */}
            {analytics.repository_breakdown &&
              analytics.repository_breakdown.length > 0 && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    📦 Top Repositories
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {analytics.repository_breakdown.map((repo, idx) => (
                      <div
                        key={idx}
                        className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-semibold text-gray-900 text-sm truncate pr-2">
                            {repo.name}
                          </h4>
                          <div className="flex items-center gap-1 text-xs text-gray-500 flex-shrink-0">
                            <Star className="w-3 h-3" />
                            {repo.stars}
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-gray-500">Language</span>
                            <span className="font-medium text-gray-700">
                              {repo.language || "N/A"}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-gray-500">Commits</span>
                            <span className="font-bold text-blue-600">
                              {repo.commits}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-center text-gray-500 text-sm">
            Built with ❤️ for developers • DevInsights Analytics Platform •
            Connected to Real Backend
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Dashboard;
