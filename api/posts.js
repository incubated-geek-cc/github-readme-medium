require("dotenv").config();

const nodeEnv=process.env.NODE_ENV;
const devOrigin=process.env.DEV_ORIGIN;
const prodOrigin=process.env.PROD_ORIGIN;

const month = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const formatDate = ((d) => `${(d.getDate() < 10) ? ("0"+d.getDate()) : d.getDate()} ${month[d.getMonth()]} ${d.getFullYear()}, ${(d.getHours() < 10) ? ("0"+d.getHours()) : d.getHours()}:${(d.getMinutes() < 10) ? ("0"+d.getMinutes()) : d.getMinutes()}`);

const request = require("request").defaults({ encoding: null });
const path = require("path");
const fs = require("fs");
const { parse } = require("rss-to-json");

const express = require('express');
const router = express.Router();
router.use(express.json()); // for parsing application/json
router.use(express.urlencoded({ extended: true })) // for parsing application/x-www-form-urlencoded

async function getArticle(post,articleIndex) {
  	let title=post["title"];

    let pubDate=post["published"];
    let d = new Date(pubDate);
    let displayPubDate=formatDate(d);

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
	// console.log(['resizedThumbnailData', resizedThumbnailData]);

    let svgStr=`<svg fill="none" width="800" height="180" xmlns="http://www.w3.org/2000/svg">
					<foreignObject width="100%" height="100%">
						<div xmlns="http://www.w3.org/1999/xhtml">
							<style type="text/css">*{margin:0;padding:0;box-sizing:border-box;font-family:sans-serif}@keyframes gradientBackground{0%{background-position-x:0%}100%{background-position-x:100%}}.flex{display:flex;align-items:center}.outer-container{height:180px}.container{height:178px;border:1px solid rgb(0 0 0 / .2);padding:20px 30px;margin:20px;border-radius:10px;background:#fff;background:linear-gradient(60deg,rgb(255 255 255) 0%,rgb(255 255 255) 47%,rgb(246 246 246) 50%,rgb(255 255 255) 53%,rgb(255 255 255) 100%);background-size:600% 400%;animation:gradientBackground 3s ease infinite;overflow:hidden;text-overflow:ellipsis}img{margin-right:10px;width:225px;height:100%;object-fit:cover}.right{flex:1}a{text-decoration:none;color:inherit}p{line-height:1.5;color:#555}h3{color:#333}small{color:#888;display:block;margin-top:5px;margin-bottom:8px}</style>
							<div class="outer-container flex">
								<a class="container flex" href="${link}" target="_blank">
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
      	resolve({
      		url: link,
      		svgData: svgStr
      	});
    });
} 

// a middleware function with no mount path.
// code is executed for every request to the router
router.use((req, res, next) => {
  console.log('Time:', formatDate(new Date(Date.now())));
  console.log('Request Type:', req.method);
  next();
});

// a middleware sub-stack shows request info for any type of HTTP request to the /medium/@:username/:index path
router.use('/medium/@:username/:index', async(req, res, next) => {
	let params=req.params;

    let articleIndex=parseInt(params["index"]);
	let username=params["username"];

	let RSSUrl=`https://medium.com/feed/@${username}`;
	const data = await parse(RSSUrl);
	const posts=data["items"];
	const post=posts[articleIndex];

    const svgData=await getArticle(post,articleIndex);
    // console.log(['svgData',svgData]);
    req.body.svgData = svgData;

    // pass control to the next middleware function in this stack
    next();
});

// a middleware sub-stack that handles GET requests to the /medium/@:username/:index path
router.get('/medium/@:username/:index', (req, res, next) => {
	let prevHeader="";
	let rawHeaders=req["rawHeaders"];
	// console.log(rawHeaders);
	let headersObj={};
	for(let i=0;i<rawHeaders.length;i++) {
		let rawHeader=rawHeaders[i].toLowerCase();
		if(i==0 || i%2==0) {
			headersObj[rawHeader]="";
			prevHeader=rawHeader;
		} else if(i%2!=0) {
			headersObj[prevHeader]=rawHeader;
		}
	}
	// console.log(headersObj);

	const dest = headersObj["sec-fetch-dest"];
  	const accept = headersObj["accept"];
  	const isImage = dest ? dest === "image" : !/text\/html/.test(accept);
    
    let svgData=req.body.svgData;

    if(isImage) { // if is image, end reponse here
    	let svgContent=svgData["svgData"];
    	// console.log(['isImage|svgContent',svgContent]);
    	res.set("Content-Type", "image/svg+xml");
		res.status(200).send(svgContent);
    } else { // pass control to the next middleware function in this stack
    	next();
    }
}, (req, res) => {
	let svgData=req.body.svgData;
	// console.log(['!isImage',svgData]);
	// Redirect to the URL if not an image request
  	let url=svgData["url"];
	res.redirect(301, url);
	res.end();
});

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
    		let displayPubDate=formatDate(d);
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

module.exports = router;