const GitHubServices = require("../services/githubService");
const githubService = new GitHubServices();

async function getUserRepositories(req, res) {
  try {
    const { username } = req.params;
    const { limit } = req.query;

    if (!username || username.length < 1) {
      return res.status(400).json({
        error: "Username is required and must be valid...",
      });
    }

    const repositories = await githubService.getUserRepositories(username, {
      limit: parseInt(limit) || 10,
    });

    res.json({
      success: true,
      username,
      count: repositories.length,
      data: repositories,
      fetched_at: new Date().toISOString(),
    });
  } catch (error) {
    console.log("get User Repo controller error", error.message);
    res.status(500).json({
      success: false,
      error: {
        type: error.type,
        message: error.message,
        details: error.details,
      },
    });
  }
}

async function getRepositoriesCommits(req, res) {
  try {
    const { owner, repo } = req.params;
    const { days, limit } = req.query;

    const commits = await githubService.getRepositoryCommits(owner, repo, {
      since: days ? githubService.getDateDaysAgo(parseInt(days)) : 0,
      limit: parseInt(limit) || 50,
    });

    // DSA:Basic analytics using array methods

    const analytics = {
      total_commits: commits.length,
      unique_authors: [...new Set(commits.map((c) => c.author.email))].length,
      date_range: {
        from: commits[commits.length - 1]?.author.date,
        to: commits[0]?.author.date,
      },

      // DSA : Frequency counting using map
      authors_frequency: commits.reduce((acc, commit) => {
        const author = commit.author.name;
        acc[author] = (acc[author] || 0) + 1;
        return acc;
      }, {}),
    };

    res.json({
      success: true,
      repository: `${owner}/${repo}`,
      analytics,
      commits,
      fetched_at: new Date().toISOString(),
    });
  } catch (error) {
    console.log("Commits route error:", error.message);
    res.status(500).json({
      success: false,
      error: {
        type: error.type,
        message: error.message,
        details: error.details,
      },
    });
  }
}

async function getRepositoriesPullRequest(req, res) {
  try {
    const { owner, repo } = req.params;
    const { state = "all", limit } = req.query;
    const pullRequests = await githubService.getRepositoryPullRequests(
      owner,
      repo,
      {
        state,
        limit: parseInt(limit) || 50,
      }
    );

    const prAnalytics = {
      total: pullRequests.length,
      open: pullRequests.filter((pr) => pr.state === "open").length,
      closed: pullRequests.filter((pr) => pr.state === "closed").length,
      merged: pullRequests.filter((pr) => pr.merged_at).length,

      avg_time_to_merge:
        pullRequests
          .filter((pr) => pr.time_to_merge)
          .reduce((sum, pr) => sum + pr.time_to_merge.hours, 0) /
          pullRequests.filter((pr) => pr.time_to_merge).length || 0,

      // Top contributors (DSA: frequency counting)
      top_contributors: Object.entries(
        pullRequests.reduce((acc, pr) => {
          acc[pr.author.login] = (acc[pr.author.length] || 0) + 1;
          return acc;
        }, {})
      )
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([author, count]) => ({ author, prs: count }))
    };

    res.status(200).json({
      success: true,
      repository: `${owner}/${repo}`,
        analytics: prAnalytics,
      pull_requests: pullRequests,
      fetched_at: new Date().toISOString(),
    });
    
  } catch (error) {
    console.log("Pull Request route error", error.message);
    res.status(500).json({
      success: false,
      error: {
        type: error.type,
        message: error.message,
        detailes: error.detailes,
      },
    });
  }
}

async function getRepositoryIssues(req, res) {
  try {
    const { owner, repo } = req.params;
    const { state = "all", limit, days } = req.query;

    const response = await githubService.getRepositoryIssues(owner, repo, {
      state,
      limit: parseInt(limit) || 50,
    });

    res.json({
      success: true,
      repository: `${owner}/${repo}`,
      //   analytics: issueAnalytics,
      issue: response.data,
      fetched_at: new Date().toISOString(),
    });
  } catch (error) {
    console.log("Issue route error", error.message);
    res.status(500).json({
      success: false,
      error: {
        type: error.type,
        message: error.message,
        detailes: error.detailes,
      },
    });
  }
}

module.exports = {
  getUserRepositories,
  getRepositoriesCommits,
  getRepositoriesPullRequest,
  getRepositoryIssues,
};
