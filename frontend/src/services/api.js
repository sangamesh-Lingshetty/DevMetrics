import axios from "axios";

const API_BASE_URL = process.env.API_BASE_URL || "http://localhost:5000/api";

class GithubAnalyticsAPI {
  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 10000, //30 sec,
      headers: {
        "Content-Type": "application/json",
      },
    });

    this.client.interceptors.request.use(
      (config) => {
        console.log(
          `🚀 API Request: ${config.method.toUpperCase()} ${config.url}`
        );
        return config;
      },
      (error) => {
        console.error("❌ Request Error:", error);
        return Promise.reject(error);
      }
    );

    this.client.interceptors.response.use(
      (response) => {
        console.log(`✅ API Response: ${response.config.url}`, response.data);
        return response;
      },
      (error) => {
        console.error(
          "❌ Response Error:",
          error.response?.data || error.message
        );
        return Promise.reject(error);
      }
    );
  }

  // Get user repositories
  async getUserRepositories(username, limit = 10) {
    try {
      const response = await this.client.get(`/github/repos/${username}`, {
        params: { limit },
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Get repository commits
  async getRepositoryCommits(owner, repo, options = {}) {
    try {
      const response = await this.client.get(
        `/github/repos/${owner}/${repo}/commits`,
        {
          params: {
            days: options.days || 30,
            limit: options.limit || 50,
          },
        }
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Get complete user analytics (MAIN ENDPOINT)
  async getUserAnalytics(username, options = {}) {
    try {
      const response = await this.client.get(`/github/analytics/${username}`, {
        params: {
          days: options.days || 30,
          repos_limit: options.repos_limit || 5,
        },
      });

      // Handle successful response
      if (response.data.success) {
        return response.data;
      } else {
        throw new Error(response.data.error || "Failed to fetch analytics");
      }
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Get repository pull requests
  async getRepositoryPullRequests(owner, repo, options = {}) {
    try {
      const response = await this.client.get(
        `/github/repos/${owner}/${repo}/pulls`,
        {
          params: {
            state: options.state || "all",
            limit: options.limit || 50,
          },
        }
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getRepositoryIssues(owner, repo, options = {}) {
    try {
      const response = await this.client.get(
        `/github/repos/${owner}/${repo}/issues`,
        {
          params: {
            state: options.state || "all",
            limit: options.limit || 50,
          },
        }
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  handleError(error) {
    if (error.response) {
      // Server responded with error status
      const status = error.response.status;

      // Check if error.response.data.error is an object with a message
      let message;
      if (error.response.data?.error?.message) {
        message = error.response.data.error.message;
      } else if (error.response.data?.message) {
        message = error.response.data.message;
      } else if (error.response.data?.error) {
        message = error.response.data.error;
      } else {
        message =
          JSON.stringify(error.response.data) || "Server error occurred";
      }

      switch (status) {
        case 400:
          return new Error(`Bad Request: ${message}`);
        case 404:
          return new Error(`Not Found: ${message}`);
        case 429:
          return new Error("Rate limit exceeded. Please try again later.");
        case 500:
          return new Error(`Server Error: ${message}`);
        default:
          return new Error(message);
      }
    } else if (error.request) {
      // Request made but no response received
      return new Error(
        "No response from server. Please check if the backend is running and your connection."
      );
    } else {
      // Something else happened
      return new Error(error.message || "An unexpected error occurred");
    }
  }

  // Health check endpoint
  async healthCheck() {
    try {
      const response = await this.client.get("/health");
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }
}

export default new GithubAnalyticsAPI();
