// This is where I define the behavior for routes
var express = require('express');
var passport = require('passport');
var async = require('async');
var path = require('path');
var User = require('../models/userModel.js');
var querystring = require('querystring');
var request = require('request');
var githubHelper = require('../helpers/githubHelper.js');
var GithubApi = require('github-api');

var router = express.Router();

var authroutes = {};

var generateRandomString = function(length) {
	var text = '';
	var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

	for (var i = 0; i < length; i++) {
		text += possible.charAt(Math.floor(Math.random() * possible.length));
	}
	return text;
};

var stateKey = 'github_auth_state';
var apiKey = 'github_auth_api';

authroutes.getGithubAuth = function(req, res) {


	var state = generateRandomString(16);
	console.log('State: ' + state);
	res.cookie(stateKey, state);

	// your application requests authorization
	console.log(process.env.GITHUB_CLIENT_ID);
	var scope = 'user repo';
	res.redirect('https://github.com/login/oauth/authorize?' +
		querystring.stringify({
			client_id: process.env.GITHUB_CLIENT_ID,
			scope: scope,
			redirect_uri: process.env.GITHUB_CALLBACK_URL,
			state: state
		}));
};

authroutes.getGithubCallback = function(req, res) {
	var code = req.query.code || null;
	console.log('Code: ' + code);
	var state = req.query.state || null;
	var storedState = req.cookies ? req.cookies[stateKey] : null;

	//oh noes! states don't match! don't log in.
	if (state === null || state !== storedState) {
		res.redirect('/#' +
			querystring.stringify({
				error: 'state_mismatch'
			}));
	} else {
		console.log('In the callback!');
		res.clearCookie(stateKey);
		var authOptions = {
			url: 'https://github.com/login/oauth/access_token',
			form: {
				code: code,
				client_id: process.env.GITHUB_CLIENT_ID,
				client_secret: process.env.GITHUB_CLIENT_SECRET,
			    // redirect_uri: 'http://localhost:3000/auth/github/callback/token',
			    state: state
			},
			json: true
		};
	}

	request.post(authOptions, function(error, response, body) {
		if (!error && response.statusCode === 200) {

			var access_token = body.access_token;  

			console.log('Access token: ' + access_token);

			req.user[0].github.accessToken = access_token

		    //WHY NO WORK???
		    var githubApi = new GithubApi({
		    	token: access_token,
		    	auth: "oauth"
		    });

		    var user = githubApi.getUser();
		    user.show(null, function(err, user) {
		    	if(err) {console.log(err)}
		    	req.user[0].github.login = user.login
		    	req.user[0].github.id = user.id
		    	req.user[0].save(function(err) {
	                if (err)
	                    throw err;
	                console.log('saved user github details')
	            });
		    	githubHelper.createNewRepo(githubApi, 'spotifyHistory', function(err, response) {
		    		console.log('createRepoCallback')
		    		if (err) {
		    			console.log(err)
		    		}
		    		req.user[0].github.repoName = 'spotifyHistory'
		    		req.user[0].save(function(err) {
		                if (err)
		                    throw err;
		                console.log('saved user github repoName')
		                res.redirect('/');
		            });
	                	
	            })

		    })

		    


		} else {
			console.log('Authentication error!');
			res.redirect('/');
		}


});


}

module.exports = authroutes;