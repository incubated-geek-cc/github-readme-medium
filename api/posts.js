require("dotenv").config();

const nodeEnv=process.env.NODE_ENV;
const devOrigin=process.env.DEV_ORIGIN;
const prodOrigin=process.env.PROD_ORIGIN;

const request = require("request");
const path = require('path');
const fs = require('fs');
const { parse } = require("rss-to-json");

const express = require('express');
const router = express.Router();
router.use(express.json({ extended: false }));

const month = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const formatPubDate = ((d) => `${(d.getDate() < 10) ? ("0"+d.getDate()) : d.getDate()} ${month[d.getMonth()]} ${d.getFullYear()}, ${(d.getHours() < 10) ? ("0"+d.getHours()) : d.getHours()}:${(d.getMinutes() < 10) ? ("0"+d.getMinutes()) : d.getMinutes()}`);

function convertDataURIToBinary(dataURI) {
    let BASE64_MARKER = ';base64,';

    let base64Index = dataURI.indexOf(BASE64_MARKER) + BASE64_MARKER.length;
    let base64 = dataURI.substring(base64Index);
    let raw = atob(base64);
    let rawLength = raw.length;
    let array = new Uint8Array(new ArrayBuffer(rawLength));

    for(let i = 0; i < rawLength; i++) {
      array[i] = raw.charCodeAt(i);
    }
    return array;
}
const emptyImageUrl='data:image/png;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==';
const emptyBinaryArray=convertDataURIToBinary(emptyImageUrl);

async function getArticle(post,articleIndex) {
  	let title=post["title"];

    let pubDate=post["published"];
    const d = new Date(pubDate);
    let displayPubDate=formatPubDate(d);

    let link=post["link"];
    let author=post["author"];
    let content=post["description"];
    // content=content.replace(/(\r\n|\n|\r)/gm,"");
	let startMarker='<p class="medium-feed-snippet">';
	let startPos=content.indexOf(startMarker)+startMarker.length;
	let endMarker=`</p><p class="medium-feed-link">`;
	let endPos=content.indexOf(endMarker);
    const subtitle=content.slice(startPos,endPos);

    startMarker='<img src="';
	startPos=content.indexOf(startMarker)+startMarker.length;
	endMarker='" width="';
	endPos=content.indexOf(endMarker);
	const thumbnail=content.slice(startPos,endPos);

	
  	const thumbnailResponse = ((reqOptions) => {
  		return new Promise((resolve, reject) => {
	  		request(reqOptions, (_err, _res, _body) => {
		  		if (_err) {
		  			console.log(_err);
		  			reject(_err);
		  		}
		  		resolve(_res);
		 	});
		});
  	}); 
  	let reqOptions={
      	url: thumbnail,
      	method: "GET"
  	};
  	var resizedThumbnail=await thumbnailResponse(reqOptions);
  	resizedThumbnail=resizedThumbnail.request.href;
  	console.log(resizedThumbnail);

  	
  	const resizedResponse = (() => {
	  	return new Promise((resolve, reject) => {
	  		var localFilepath=path.join(__dirname, "../resource", `temp-${articleIndex}.png`);
	  		var writeStream = fs.createWriteStream(localFilepath);
	  		request.get(resizedThumbnail)
	  		.on('error', function(_err) {
		    	console.error(_err);
		    	reject(_err);
		  	})
	  		.pipe(writeStream);
  			resolve(localFilepath);
		});
	});
	const savedFilePath=await resizedResponse();
	console.log('saved',savedFilePath);

	const data = fs.readFileSync(savedFilePath);
	const resizedThumbnailData = data.toString('base64');
	// console.log(resizedThumbnailData);

    let svgStr=`<svg fill="none" width="800" height="180" xmlns="http://www.w3.org/2000/svg">
					<foreignObject width="100%" height="100%">
						<div xmlns="http://www.w3.org/1999/xhtml">
							<style>*{margin:0;padding:0;box-sizing:border-box;font-family:sans-serif}@keyframes gradientBackground{0%{background-position-x:0%}100%{background-position-x:100%}}.flex{display:flex;align-items:center}.outer-container{height:180px}.container{height:178px;border:1px solid rgb(0 0 0 / .2);padding:20px 30px;margin:20px;border-radius:10px;background:#fff;background:linear-gradient(60deg,rgb(255 255 255) 0%,rgb(255 255 255) 47%,rgb(246 246 246) 50%,rgb(255 255 255) 53%,rgb(255 255 255) 100%);background-size:600% 400%;animation:gradientBackground 3s ease infinite;overflow:hidden;text-overflow:ellipsis}img{margin-right:10px;width:225px;height:100%;object-fit:cover}.right{flex:1}a{text-decoration:none;color:inherit}p{line-height:1.5;color:#555}h3{color:#333}small{color:#888;display:block;margin-top:5px;margin-bottom:8px}</style>
							<div class="outer-container flex">
								<a class="container flex" href="${link}" target="__blank">
									<img src="data:image/png;base64,${resizedThumbnailData}"/>
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
		console.log(_err);
		res.status(500).json({
	    	type: "error", 
	    	message: (_err !== null && typeof _err.message !== "undefined") ? _err.message : "Error. Unable to retrieve data."
	  	});
	}
});

router.get("/medium/@:username/:index", async(req, res) => {
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
	    // console.log(svgStr);
	    res.set("Content-Type", "image/svg+xml");
	    res.status(200).send(svgStr);
	} catch(_err) {
		console.log(_err);
		res.status(500).json({
	    	type: "error", 
	    	message: (_err !== null && typeof _err.message !== "undefined") ? _err.message : "Error. Unable to retrieve data."
	  	});
	}
});



router.get("/medium/@:username/:index/_image", (req, res) => {
	let params=req.params;

	let articleIndex=parseInt(params["index"]);
	let username=params["username"];
	let svgURL=`${((nodeEnv=='development') ? devOrigin : prodOrigin)}/api/medium/@${username}/${articleIndex}`;
	console.log(svgURL);

	const x = request(svgURL);
	req.pipe(x)
	x.pipe(res);

	// request({ 
	//     url: svgURL
	// }, (_err, _res, _body) => {
	// 	if (_err) {
	//     	console.log(_err);
	//     	res.status(500).json({
	//         	type: "error", 
	//         	message: (_err !== null && typeof _err.message !== "undefined") ? _err.message : "Error. Unable to retrieve data."
	//       	});
	//     }
	//     let svgStr=_body;
	//     res.set("Content-Type", "image/svg+xml");
	//     res.status(200).send(svgStr);
	// });
});

module.exports = router;