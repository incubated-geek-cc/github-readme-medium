require("dotenv").config();

const nodeEnv=process.env.NODE_ENV;
const devOrigin=process.env.DEV_ORIGIN;
const prodOrigin=process.env.PROD_ORIGIN;

const request = require("request").defaults({ encoding: null });
const path = require("path");
const fs = require("fs");
const { parse } = require("rss-to-json");

const express = require('express');
const router = express.Router();
router.use(express.json({ extended: false }));

const month = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const formatPubDate = ((d) => `${(d.getDate() < 10) ? ("0"+d.getDate()) : d.getDate()} ${month[d.getMonth()]} ${d.getFullYear()}, ${(d.getHours() < 10) ? ("0"+d.getHours()) : d.getHours()}:${(d.getMinutes() < 10) ? ("0"+d.getMinutes()) : d.getMinutes()}`);

/*
let data = 'stackabuse.com';
let buff = new Buffer(data);
let base64data = buff.toString('base64');

console.log('"' + data + '" converted to Base64 is "' + base64data + '"');
// "stackabuse.com" converted to Base64 is "c3RhY2thYnVzZS5jb20="

let data = 'c3RhY2thYnVzZS5jb20=';
let buff = new Buffer(data, 'base64');
let text = buff.toString('utf8');

console.log('"' + data + '" converted from Base64 to UTF-8 is "' + text + '"');
*/
// console.log(['utf8',Buffer.from(_body, 'utf8').toString('base64')]);
// console.log(['hex',Buffer.from(_body, 'hex').toString('base64')]);
// console.log(['utf16le',Buffer.from(_body, 'utf16le').toString('base64')]);
// console.log(['ucs2',Buffer.from(_body, 'ucs2').toString('base64')]);
// console.log(['base64',Buffer.from(_body, 'base64').toString('base64')]);
// console.log(['ascii',Buffer.from(_body, 'ascii').toString('base64')]);
// console.log(['latin1',Buffer.from(_body, 'latin1').toString('base64')]);
// console.log(['binary',Buffer.from(_body, 'binary').toString('base64')]);

async function getArticle(post,articleIndex) {
  	let title=post["title"];

    let pubDate=post["published"];
    let d = new Date(pubDate);
    let displayPubDate=formatPubDate(d);

    let link=post["link"];
    let author=post["author"];
    let content=post["description"];
    // content=content.replace(/(\r\n|\n|\r)/gm,"");
	let startMarker='<p class="medium-feed-snippet">';
	let startPos=content.indexOf(startMarker)+startMarker.length;
	let endMarker=`</p><p class="medium-feed-link">`;
	let endPos=content.indexOf(endMarker);
    let subtitle=content.slice(startPos,endPos);

    startMarker='<img src="';
	startPos=content.indexOf(startMarker)+startMarker.length;
	endMarker='" width="';
	endPos=content.indexOf(endMarker);
	let thumbnail=content.slice(startPos,endPos);

	const getThumbnailResponse = ((thumbnailSrc) => {
		return new Promise((resolve, reject) => {
			request.get(thumbnailSrc, (_err, _res, _body) => {
				if (_err) {
		  			console.error(_err);
		  			reject(_err);
		  		}
				let _href=_res.request.uri.href;
				resolve(_href);
			});
		});
	});
	let resizedThumnailHref=await getThumbnailResponse(thumbnail);
	// console.log(["resizedThumnailHref",resizedThumnailHref]);

	const getResizedThumbnailResponse = ((_href) => {
		return new Promise((resolve, reject) => {
			request.get(_href, (_err, _res, _body) => {
				if (_err) {
		  			console.error(_err);
		  			reject(_err);
		  		}
		        let data = `data:${_res.headers["content-type"]};base64,${Buffer.from(_body).toString("base64")}`;
		        resolve(data);
			});
		});
	});
	let resizedThumbnailData = await getResizedThumbnailResponse(resizedThumnailHref);
	// console.log(['resizedThumbnailResp', resizedThumbnailData]);

    let svgStr=`<svg fill="none" width="800" height="180" xmlns="http://www.w3.org/2000/svg">
					<foreignObject width="100%" height="100%">
						<div xmlns="http://www.w3.org/1999/xhtml">
							<style>*{margin:0;padding:0;box-sizing:border-box;font-family:sans-serif}@keyframes gradientBackground{0%{background-position-x:0%}100%{background-position-x:100%}}.flex{display:flex;align-items:center}.outer-container{height:180px}.container{height:178px;border:1px solid rgb(0 0 0 / .2);padding:20px 30px;margin:20px;border-radius:10px;background:#fff;background:linear-gradient(60deg,rgb(255 255 255) 0%,rgb(255 255 255) 47%,rgb(246 246 246) 50%,rgb(255 255 255) 53%,rgb(255 255 255) 100%);background-size:600% 400%;animation:gradientBackground 3s ease infinite;overflow:hidden;text-overflow:ellipsis}img{margin-right:10px;width:225px;height:100%;object-fit:cover}.right{flex:1}a{text-decoration:none;color:inherit}p{line-height:1.5;color:#555}h3{color:#333}small{color:#888;display:block;margin-top:5px;margin-bottom:8px}</style>
							<div class="outer-container flex">
								<a class="container flex" href="${link}" target="__blank">
									<img src="${resizedThumbnailData}"/>
				                  	<div class="right">
				                    	<h3>${title}</h3>
				                    	<small>${displayPubDate}</small>
				                    	<p>${subtitle}</p>
				                  	</div>
				              	</a>
				          	</div>
				      	</div>
					</foreignObject>
				</svg>`;

	return new Promise(resolve => {
      	resolve(svgStr);
    });
} 

router.get("/medium", async(req, res) => {
	let username="MediumStaff";
	let RSSUrl=`https://medium.com/feed/@${username}`;

	try {
		const data = await parse(RSSUrl);
		const posts=data["items"];

	    var result=[];
	    for(var post of posts) {
	    	let pubDate = post["published"];
	    	const d = new Date(pubDate);
    		let displayPubDate=formatPubDate(d);
	    	var obj={
	    		"title": post["title"],
				"pubDate": displayPubDate,
				"link": post["link"],
				"guid": post["id"],
				"author": post["author"],
				"categories": post["category"]
	    	};
	    	result.push(obj);
	    }
	    res.status(200).json(result);
	} catch(_err) {
		console.error(_err);
		res.status(500).json({
	    	type: "error", 
	    	message: (_err !== null && typeof _err.message !== "undefined") ? _err.message : "Error. Unable to retrieve data."
	  	});
	}
});

router.get("/medium/@:username/:index/_image", async(req, res) => {
	let params=req.params;

	let articleIndex=parseInt(params["index"]);
	let username=params["username"];
	let RSSUrl=`https://medium.com/feed/@${username}`;
  	// console.log(`https://api.rss2json.com/v1/api.json?rss_url=${RSSUrl}`);
  	// https://api.rss2json.com/v1/api.json?rss_url=https://medium.com/feed/@MediumStaff
  	// {"type":"error","message":"getaddrinfo ENOTFOUND api.rss2json.com"}
  	// {"type":"error","message":"Client network socket disconnected before secure TLS connection was established"}
  	try {
		const data = await parse(RSSUrl);
		// console.log(data);
		const posts=data["items"];
	    const post=posts[articleIndex];
	    
	    const svgStr=await getArticle(post,articleIndex);
	    res.set("Content-Type", "image/svg+xml");
	    res.status(200).send(svgStr);
	} catch(_err) {
		console.error(_err);
		res.status(500).json({
	    	type: "error", 
	    	message: (_err !== null && typeof _err.message !== "undefined") ? _err.message : "Error. Unable to retrieve data."
	  	});
	}
});

router.get("/medium/@:username/:index", (req, res) => {
	let params=req.params;

	let articleIndex=parseInt(params["index"]);
	let username=params["username"];
	let svgURL=`${((nodeEnv=='development') ? devOrigin : prodOrigin)}/api/medium/@${username}/${articleIndex}/_image`;

	request.get({url: svgURL}, (_err, _res, _body) => {
		if (_err) {
			console.error(_err);
	    	res.status(500).json({
		    	type: "error", 
		    	message: (_err !== null && typeof _err.message !== "undefined") ? _err.message : "Error. Unable to retrieve data."
		  	});
		}
	}).pipe(res);
});

module.exports = router;