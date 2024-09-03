require("dotenv").config();
const request = require("request");

const express = require('express');
const router = express.Router();
router.use(express.json({ extended: false }));

const month = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function getArticle(post) {
  	let title=post["title"];

    let pubDate=post["pubDate"];
    const d = new Date(pubDate);
    let displayPubDate=`${(d.getDate() < 10) ? ("0"+d.getDate()) : d.getDate()} ${month[d.getMonth()]} ${d.getFullYear()}, ${(d.getHours() < 10) ? ("0"+d.getHours()) : d.getHours()}:${(d.getMinutes() < 10) ? ("0"+d.getMinutes()) : d.getMinutes()} `;

    let link=post["link"];
    let author=post["author"];
    let content=post["content"];

    let arr=content.split("\n");
	let cleanArr=[];
	for(let s of arr) {
	    s=s.trim();
	    cleanArr.push(s);
	}
	content=cleanArr.join("");
    /*
    <div class="medium-feed-item">
        <p class="medium-feed-image"><a href="https://javascript.plainenglish.io/export-font-emoji-as-image-with-custom-os-design-using-css-and-client-side-javascript-78fe4b32d9ce?source=rss-cb6d1dd5887a------2"><img src="https://cdn-images-1.medium.com/max/2600/1*q1YoYEH6ryW_kVqmBqlrRg.png" width="3610"></a></p>
        <p class="medium-feed-snippet">Save any smiley or icon as a PNG file independent of platform or device designs in-browser. Include full code implementation.</p>
        <p class="medium-feed-link"><a href="https://javascript.plainenglish.io/export-font-emoji-as-image-with-custom-os-design-using-css-and-client-side-javascript-78fe4b32d9ce?source=rss-cb6d1dd5887a------2">Continue reading on JavaScript in Plain English »</a></p>
      </div>
	*/
	let startMarker='<img src="';
	let startPos=content.indexOf(startMarker)+startMarker.length;
	let endMarker='" width="';
	let endPos=content.indexOf(endMarker);

    const thumbnail=content.slice(startPos,endPos);

    startMarker='<p class="medium-feed-snippet">';
	startPos=content.indexOf(startMarker)+startMarker.length;

	endMarker=`</p><p class="medium-feed-link">`;
	endPos=content.indexOf(endMarker);

	const subtitle=content.slice(startPos,endPos);

    let htmlStr=`<svg fill="none" width="800" height="180" xmlns="http://www.w3.org/2000/svg">
					<foreignObject width="100%" height="100%">
						<div xmlns="http://www.w3.org/1999/xhtml">
							<style>*{margin:0;padding:0;box-sizing:border-box;font-family:sans-serif}@keyframes gradientBackground{0%{background-position-x:0%}100%{background-position-x:100%}}.flex{display:flex;align-items:center}.outer-container{height:180px}.container{height:178px;border:1px solid rgb(0 0 0 / .2);padding:20px 30px;margin:20px;border-radius:10px;background:#fff;background:linear-gradient(60deg,rgb(255 255 255) 0%,rgb(255 255 255) 47%,rgb(246 246 246) 50%,rgb(255 255 255) 53%,rgb(255 255 255) 100%);background-size:600% 400%;animation:gradientBackground 3s ease infinite;overflow:hidden;text-overflow:ellipsis}img{margin-right:10px;width:225px;height:100%;object-fit:cover}.right{flex:1}a{text-decoration:none;color:inherit}p{line-height:1.5;color:#555}h3{color:#333}small{color:#888;display:block;margin-top:5px;margin-bottom:8px}</style>
							<div class="outer-container flex">
								<a class="container flex" href="${link}" target="__blank">
									<img src="${thumbnail}"/>
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

	return htmlStr;
}

router.get("/medium", (req, res) => {
	let username="MediumStaff";
	let RSSUrl=`https://medium.com/feed/@${username}`;

	request({ 
		url: `https://api.rss2json.com/v1/api.json?rss_url=${RSSUrl}` 
	}, ( _err, _res, _body) => {
	    if (_err) {
	    	console.log(_err);
	    	res.status(500).json({
	        	type: "error", 
	        	message: (_err !== null && typeof _err.message !== "undefined") ? _err.message : "Error. Unable to retrieve data."
	      	});
	    }
	    // console.log(_body);getArticle(post)
	    const data=JSON.parse(_body);
	    const posts=data["items"];

	    var result=[];
	    for(var post of posts) {
	    	var obj={
	    		"title": post["title"],
				"pubDate": post["pubDate"],
				"link": post["link"],
				"guid": post["guid"],
				"author": post["author"],
				"categories": post["categories"]
	    	};

	    	result.push(obj);
	    }
	    res.status(200).json(result);
	});
});

router.get("/medium/@:username/:index", (req, res) => {
	let params=req.params;

	let articleIndex=parseInt(params["index"]);
	let username=params["username"];
	let RSSUrl=`https://medium.com/feed/@${username}`;
  	// console.log(`https://api.rss2json.com/v1/api.json?rss_url=${RSSUrl}`);
  	// https://api.rss2json.com/v1/api.json?rss_url=https://medium.com/feed/@MediumStaff
	request({ 
		url: `https://api.rss2json.com/v1/api.json?rss_url=${RSSUrl}` 
	}, ( _err, _res, _body) => {
	    if (_err) {
	    	console.log(_err);
	    	res.status(500).json({
	        	type: "error", 
	        	message: (_err !== null && typeof _err.message !== "undefined") ? _err.message : "Error. Unable to retrieve data."
	      	});
	    }
	    // console.log(_body);getArticle(post)
	    const data=JSON.parse(_body);
	    const posts=data["items"];
	    const post=posts[articleIndex];
	    
	    var htmlStr=getArticle(post);
	    res.set("Content-Type", "application/xhtml+xml");
	    res.status(200).send(htmlStr);
	});
});

module.exports = router;