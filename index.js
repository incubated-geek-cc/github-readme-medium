// import express from 'express';
// import cors from 'cors';
// import 'dotenv/config';
// import product from './api/news';

// const app = express();

// app.use(cors());
// app.use('/api', product);

// app.listen(port, () => console.log(`Listening on port ${port}`));
// ---
require("dotenv").config();
const port = process.env.PORT || 3000;

const express=require("express");
const app = express();
app.use(express.json({ extended: false }));

app.get("/", (req, res) => {
	res.set("Content-Type", "text/html; charset=utf-8");
	res.status(200).send(`<div>
					<style>body{margin:0;font-family:system-ui,-apple-system,"Segoe UI",Roboto,"Helvetica Neue","Noto Sans","Liberation Sans",Arial,sans-serif,"Apple Color Emoji","Segoe UI Emoji","Segoe UI Symbol","Noto Color Emoji";font-size:1rem;font-weight:400;color:#212529;-webkit-text-size-adjust:100%;-webkit-tap-highlight-color:transparent}code,kbd,pre,samp{font-family:SFMono-Regular,Menlo,Monaco,Consolas,"Liberation Mono","Courier New",monospace;font-size:1em}code{font-size:.875em;color:#d63384;word-wrap:break-word}kbd{padding:.1875rem .375rem;font-size:.875em;color:#fff;background-color:#212529;border-radius:.25rem}pre{display:block;margin-top:0;margin-bottom:1rem;overflow:auto;font-size:.875em;padding:1.5em 2.5em;unicode-bidi:isolate;white-space:pre;margin:1em 0;background:#f8f9fa}.lead{font-size:1.25rem;font-weight:300}mark{background-color:#fcf8e3;color:#000;padding:.2em}p{margin-top:1.2em;margin-bottom:1.2em;font-size:15px}p{display:block;margin-block-start:1em;margin-block-end:1em;margin-inline-start:0;margin-inline-end:0;unicode-bidi:isolate}@media (min-width:1400px){.container,.container-lg,.container-md,.container-sm,.container-xl,.container-xxl{max-width:1320px}}@media (min-width:1200px){.container,.container-lg,.container-md,.container-sm,.container-xl{max-width:1140px}}@media (min-width:992px){.container,.container-lg,.container-md,.container-sm{max-width:960px}}@media (min-width:768px){.container,.container-md,.container-sm{max-width:720px}}@media (min-width:576px){.container,.container-sm{max-width:540px}}.container,.container-fluid,.container-lg,.container-md,.container-sm,.container-xl,.container-xxl{width:100%;padding-right:calc(1.5rem * .5);padding-left:calc(1.5rem* .5);margin-right:auto;margin-left:auto}</style>

					<div class='container-md'>
				      <h2>Running Express on Vercel</h2> 
				      <h3>Usage: Retrieve latest Medium posts</h3>

				      <p class='lead'>Option 1: Specify <code>[username]</code> & <code>[index]</code></p>

				      <pre>https://github-readme-medium-viewposts.vercel.app/api/medium/@<code>[username]</code>/<code>[index]</code></pre>

				      <p>For instance, <a href='https://github-readme-medium-viewposts.vercel.app/api/medium/@geek-cc/1' target='_blank'>https://github-readme-medium.vercel.app/api/medium/@<mark>geek-cc</mark>/<mark>1</mark></a> shall retrieve the 2nd most recent post (since <code>0</code> refers most recent post so sequence of posts published follows ascending values of <code>index</code>).</p>

				      <p class='lead'>Option 2: Get featured Medium posts (based on staff picks)</p>

				      <pre><a href='https://github-readme-medium-viewposts.vercel.app/api/medium' target='_blank'>https://github-readme-medium-viewposts.vercel.app/api/medium</a></pre>
					</div>
			    </div>
			`);

});

const posts=require("./api/posts");

app.use("/api", posts); // all of the routes will be prefixed with /api
app.listen(port, () => console.log(`Listening on port ${port}`));