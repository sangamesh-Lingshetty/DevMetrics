const GitHubServices = require("../services/githubService");
const AnalyticServices = require("../services/analyticsService");
const githubService = new GitHubServices();
const analyticService = new AnalyticServices();
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
        .map(([author, count]) => ({ author, prs: count })),
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

    const issues = await githubService.getRepositoryIssues(owner, repo, {
      state,
      limit: parseInt(limit) || 50,
    });
    const issueAnalytics = {
      total: issues.length,
      open: issues.filter((i) => i.state === "open").length,
      closed: issues.filter((i) => i.state === "closed").length,

      bugs: {
        total: issues.filter((i) => i.is_bug).length,
        open: issues.filter((i) => i.state === "open").length,
      },

      features: {
        total: issues.filter((i) => i.is_feature).length,
        open: issues.filter((i) => i.is_feature && i.state === "open").length,
      },

      avg_time_to_close_hours:
        issues
          .filter((i) => i.time_to_close)
          .reduce((sum, i) => sum + i.time_to_close.hours, 0) /
          issues.filter((i) => i.time_to_close).length || 0,

      by_priority: {
        high: issues.filter((i) => i.priority === "high").length,
        medium: issues.filter((i) => i.priority === "medium").length,
        low: issues.filter((i) => i.priority === "low").length,
      },

      stale_issues: issues.filter((i) => i.state === "open" && i.age.days > 30)
        .length,

      // Most active contributors
      top_reporters: Object.entries(
        issues.reduce((acc, issue) => {
          acc[issue.author.login] = (acc[issue.author.login] || 0) + 1;
          return acc;
        }, {})
      )
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([author, count]) => ({ author, issues: count })),
    };

    res.json({
      success: true,
      repository: `${owner}/${repo}`,
      analytics: issueAnalytics,
      issues,
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

async function getDashBoardAnalytics(req, res) {
  try {
    const { username } = req.params;
    const { days = 30, repos_limit = 5 } = req.query;
    console.log(`Generating complete analytics for ${username}...`);

    // fetch repositories
    const repositories = await githubService.getUserRepositories(username, {
      limit: 10,
    });

    // aggregate data from all sources
    let allCommits = [];
    let allPullRequests = [];
    let allIssues = [];

    const reposToAnalyze = repositories.slice(0, parseInt(repos_limit));
    for (const repo of reposToAnalyze) {
      try {
        const commits = await githubService.getRepositoryCommits(
          username,
          repo.name,
          { since: githubService.getDateDaysAgo(parseInt(days)) }
        );
        commits.forEach((c) => (c.repositories = repo.name));
        allCommits = allCommits.concat(commits);

        // Pull Requests
        const prs = await githubService.getRepositoryPullRequests(
          username,
          repo.name,
          { state: "all", limit: 30 }
        );
        prs.forEach((pr) => (pr.repository = repo.name));
        allPullRequests = allPullRequests.concat(prs);

        //issues
        const issues = await githubService.getRepositoryIssues(
          username,
          repo.name,
          { state: "all", limit: 30 }
        );
        issues.forEach((i) => (i.repository = repo.name));
        allIssues = allIssues.concat(issues);
      } catch (error) {
        console.warn(`⚠️ Skipping ${repo.name}: ${error.message}`);
      }
    }

    const repoMetrics = analyticService.calculateRepositoryMetrics(
      repositories,
      allCommits
    );

    const commitTrends = analyticService.analyzeCommitTrends(allCommits);
    const authorProductivity =
      analyticService.analyzeAuthorProductivity(allCommits);
    const prMetrics =
      analyticService.analyzePullRequestMetrics(allPullRequests);
    const issueMetrics = analyticService.analyzeIssueMetrics(allIssues);

    // generate comprehensive analytics
    const analytics = {
      overview: {
        total_repositories: repoMetrics.total_repositories,
        total_commits: repoMetrics.total_commits,
        unique_contributors: repoMetrics.unique_contributors,
        commits_per_day: repoMetrics.commits_per_day,
        activity_score: repoMetrics.activity_score,
        most_active_repo: repoMetrics.most_active_repo,

        // PR summary
        total_pull_requests: prMetrics.total,
        merged_prs: prMetrics.merged,
        pr_merge_rate: prMetrics.merge_rate,

        // Issue summary
        total_issues: issueMetrics.total,
        open_issues: issueMetrics.open,
        bugs_reported: issueMetrics.bugs,
      },

      // Time-series data for charts
      commit_trends: commitTrends,

      // Contributor leaderboard
      author_productivity: authorProductivity.slice(0, 10), // Top 10

      // Detailed PR metrics
      pull_request_metrics: {
        total: prMetrics.total,
        merged: prMetrics.merged,
        open: prMetrics.open,
        closed: prMetrics.closed,
        avg_time_to_merge_hours: prMetrics.avg_time_to_merge_hours,
        merge_rate: prMetrics.merge_rate,
      },

      // Detailed issue metrics
      issue_metrics: {
        total: issueMetrics.total,
        open: issueMetrics.open,
        closed: issueMetrics.closed,
        bugs: issueMetrics.bugs,
        features: issueMetrics.features,
        stale: issueMetrics.stale,
        avg_resolution_hours: issueMetrics.avg_resolution_hours,
      },

      // Repository breakdown
      repository_breakdown: repositories.slice(0, 5).map((repo) => ({
        name: repo.name,
        language: repo.language,
        stars: repo.stars,
        commits: allCommits.filter((c) => c.repository === repo.name).length,
        last_updated: repo.updated_at,
      })),

      time_period: {
        days: parseInt(days),
        from: githubService.getDateDaysAgo(parseInt(days)),
        to: new Date().toISOString(),
      },
    };

    console.log(`✅ Analytics generated successfully!`);

    res.json({
      success: true,
      username,
      analytics,
      raw_data: {
        repositories: repositories.length,
        commits: allCommits.length,
        pull_requests: allPullRequests.length,
        issues: allIssues.length,
        analyzed_repos: reposToAnalyze.length,
      },
      generated_at: new Date().toISOString(),
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
  getDashBoardAnalytics,
};
