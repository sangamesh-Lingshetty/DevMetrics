const express = require("express")
const router = express.Router();
const {getUserRepositories,getRepositoriesCommits,getRepositoriesPullRequest,getRepositoryIssues,getDashBoardAnalytics} = require("../controllers/getAllrepoController")

router.get('/repos/:username',getUserRepositories);
router.get('/repos/:owner/:repo/commits',getRepositoriesCommits);
router.get('/repos/:owner/:repo/pulls',getRepositoriesPullRequest);
router.get('/repos/:owner/:repo/issues',getRepositoryIssues);
router.get("/analytics/:username",getDashBoardAnalytics);
module.exports = router;