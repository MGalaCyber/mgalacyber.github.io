const UrlEncodeParser = require("body-parser").urlencoded({ extended: false });
const CookieParser = require("cookie-parser");
const mongoose = require("mongoose");
const fetch = require("node-fetch");
const Express = require("express");
require("dotenv").config();
const app = Express();

app.enable("trust proxy");
app.set("etag", false);
app.use(Express.static(__dirname + "/public"));
app.set("views", __dirname);
app.set("view engine", "ejs");
app.use(CookieParser());
app.use(UrlEncodeParser);

// mongoose.set("strictQuery", false);
// mongoose.connect(process.env.MONGO_URI, {
//     keepAlive: true,
//     autoIndex: true,
//     useNewUrlParser: true,
//     useUnifiedTopology: true,
//     connectTimeoutMS: 10000,
// });

// mongoose.connection.on("connected", () => {
//     console.log("Successfully connected to database!")
// });

app.get("/", async (req, res) => {
    const username = process.env.USERNAME;
    let githubStats = await fetch(`https://api.github.com/users/${username}`).then((res) => res.json());
    const access_token = process.env.GITHB_ACCESS_TOKEN;
    
    let totalContributors = 0;
    
    fetch(`https://api.github.com/users/${username}/repos?per_page=100`, {
        headers: {
            'Authorization': `Bearer ${access_token}`
        }
    }).then(response => response.json()).then(repos => {
        const promises = repos.map(repo => fetch(`https://api.github.com/repos/${username}/${repo.name}/contributors`, {
            headers: {
                'Authorization': `Bearer ${access_token}`
            }
        }).then(response => response.json()));
        return Promise.all(promises);

    }).then(contributors => {
        contributors.forEach(contributorsArr => {
            totalContributors += contributorsArr.length;
        });

        function calculateAge() {
            const birthDate = new Date(process.env.DATE_OF_BIRTH);
            const today = new Date();
            
            const ageInMilliseconds = today - birthDate;
            const ageInYears = ageInMilliseconds / (1000 * 60 * 60 * 24 * 365.25);
            
            res.render(__dirname + "/public/views/index.ejs", {
                age: Math.floor(ageInYears),
                projects: githubStats.public_repos,
                github_followers: githubStats.followers,
                github_contributors: totalContributors,
            });
        };
        calculateAge();
    });
});

app.get("*", (req, res) => {
    res.status(404);
    res.render(__dirname + "/public/views/404.ejs");
});

app.listen(process.env.PORT, () => {
    console.log("App on port " + process.env.PORT);
});