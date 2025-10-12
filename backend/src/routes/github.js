const express = require("express")
const router = express.Router();
const {getUserRepositories,getRepositoriesCommits,getRepositoriesPullRequest,getRepositoryIssues} = require("../controllers/getAllrepoController")

router.get('/repos/:username',getUserRepositories);
router.get('/repos/:owner/:repo/commits',getRepositoriesCommits);
router.get('/repos/:owner/:repo/pulls',getRepositoriesPullRequest);
router.get('/repos/:owner/:repo/issues',getRepositoryIssues);

module.exports = router;