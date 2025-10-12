const axios = require("axios");
const { handleApiError } = require("../utils/errorHandler");
class GitHubServices {
  constructor() {
    this.baseURL = "https://api.github.com";
    this.token = process.env.GITHUB_TOKEN;

    // Rate limiting tracking (dsa:HashMap for 0(1) acess)

    this.rateLimitCache = new Map();

    // API client with authentication
    this.client = axios.create({
      baseURL: this.baseURL,
      headers: {
        Authorization: `token ${this.token}`,
        Accept: "application/vnd.github.v3+json",
        "User-Agent": "DevInsights-SaaS",
      },
    });
  }

  async getUserRepositories(username, options = {}) {
    try {
      console.log(`📡 Fetching repositories for ${username}...`);

      const response = await this.client.get(`/users/${username}/repos`, {
        params: {
          sort: "updated",
          direction: "desc",
          per_page: options.limit || 30,
        },
      });

      // dsa : array filtering and mapping
      const repositories = response.data
        .filter((repo) => !repo.fork) //remove forks
        .map((repo) => ({
          id: repo.id,
          name: repo.name,
          full_name: repo.full_name,
          private: repo.private,
          language: repo.language,
          stars: repo.stargazers_count,
          forks: repo.forks_count,
          updated_at: repo.updated_at,
          created_at: repo.created_at,
        }))
        .slice(0, options.limit || 10); //dsa : array slicing

      console.log(`✅ Found ${repositories.length} repositories`);
      return repositories;
    } catch (error) {
      console.error(
        "❌ GitHub API Error:",
        error.response?.data || error.message
      );
      throw handleApiError(error, "FETCH_REPOS_ERROR");
    }
  }

  async getRepositoryCommits(owner, repo, options = {}) {
    try {
      console.log(`Fetching commits for ${owner}/${repo}...`);
      const response = await this.client.get(
        `/repos/${owner}/${repo}/commits`,
        {
          params: {
            since: options.since || this.getDateDaysAgo(30), //last 30 days
            per_page: options.limit || 100,
          },
        }
      );

      // // dsa: array transformation and analysis
      const commits = response.data.map((commit) => ({
        sha: commit.sha,
        message: commit.commit.message,
        author: {
          name: commit.commit.author.name,
          email: commit.commit.author.email,
          date: commit.commit.author.date,
        },
        stats: {
          additions: 0,
          deletions: 0,
          changes: 0,
        },
        url: commit.html_url,
      }));

      commits.sort((a, b) => new Date(b.author.date) - new Date(a.author.date));

      console.log(`✅ Found ${commits.length} commits`);
      return commits;
    } catch (error) {
      console.error(
        "❌ Commit fetch error:",
        error.response?.statusText || error.message
      );

      throw handleApiError(error, "FETCH_COMMITS_ERROR");
    }
  }

  async getRepositoryPullRequests(owner, repo, options = {}) {
    try {
      console.log(`📡 Fetching pull requests for ${owner}/${repo}...`);
      const response = await this.client.get(`/repos/${owner}/${repo}/pulls`, {
        params: {
          state: options.state || "all", //open,closed,all
          sort: "updated",
          direction: "desc",
          per_page: options.limit || 50,
        },
      });

      const pullRequests = response.data.map(pr =>({
        id:pr.id,
        number:pr.number,
        title:pr.title,
        state:pr.state,
        author:{
          login:pr.user.login,
          avatar:pr.user.avatar_url
        },
        created_at:pr.created_at,
        updated_at:pr.updated_at,
        closed_at:pr.closed_at,
        merged_at:pr.merged_at,

        // calculate time matrics (DSA:date calculation)
        time_to_close: pr.closed_at ? this.calculateTimeDIfference(pr.created_at,pr.closed_at):null,
        time_to_merge:pr.merged_at? this.calculateTimeDIfference(pr.created_at,pr.merged_at):null,
        reviewers:pr.requested_reviewers?.map(r=>r.login)||[],
        lables:pr.lables.map(l=>l.name),
        additions:pr.additions||0,
        deletions:pr.deletions||0,
        changed_files:pr.changed_files ||0
      }))

      console.log(`✅ Found ${pullRequests.length} pull requests`);
      return pullRequests;
    } catch (error) {
      console.error(
        "❌ Commit fetch error:",
        error.response?.statusText || error.message
      );
      throw handleApiError(error, "FETCH_PULL_ERROR");
    }
  }

  async getRepositoryIssues(owner, repo, options = {}) {
    try {
      console.log(`📡 Fetching issues for ${owner}/${repo}...`);
      const response = await this.client.get(`/repos/${owner}/${repo}/issues`, {
        params: {
          state: options.state || "all",
          sort: "updated",
          direction: "desc",
          per_page: options.limit || 50,
          // since: options.since,
        },
      });

      console.log(`Found ${response.data.length} issues`);
      return response;
    } catch (error) {
      console.error(
        "❌ Commit fetch error:",
        error.response?.statusText || error.message
      );
      throw handleApiError(error, "FETCH_ISSUE_ERROR");
    }
  }

  getDateDaysAgo(days) {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return date.toISOString();
  }

  calculateTimeDIfference(startDate,endDate){
    const start = new Date(startDate),
    const end = new Date(endDate);
    const diffMs = end-start;
    const diffHours = Math.floor(diffMs/(1000*60*60));
    const diffDays = Math.floor(diffHours/24);

    return {
      hours:diffHours,
      days:diffDays,
      formatted: diffDays > 0?`${diffDays}d ${diffHours%24}h`:`${diffHours}h`
    }
  }

  checkRateLimit() {
    return this.rateLimitCache;
  }
}

module.exports = GitHubServices;
