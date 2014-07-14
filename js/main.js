/**
 * main.js file
 * Created by Bade Iriabho
 * @desc: Created as a test exercise for a job interview process
 * 
 * Copyright (c) 2014
 */
String.prototype.trim = function() {
	return this.replace(/^\s+|\s+$/g,"");
};

$(function() {
	//on page load, grab the data and determine what to do with it.
	var mydata;
	$.ajax({
		url: "https://apps.mathbiol.org/sdata/",
	    jsonp: "callback",
	    dataType: "jsonp",
	    success: function( response ) {
	    	mydata = response;
	    	processData(mydata);
	    }
	});	
});

/**
 * function:processData
 * @desc: based on some parameters, determines how to handle the user's page request
 * @param: mydata - Data retrieved from remote URL
 *  
 */
processData = function(mydata) {
	var mytotal, myurl, myidx, mypage;
	mytotal = mydata.length;
	myurl = document.URL;
	myidx = myurl.search("answer[123]") + 6;
	if(myidx >= 0) {
		mypage = parseInt(myurl[myidx]);
		if(mypage == 1) {	//answer 1
			//total number of medals by country
			var mydata2 = mydata.map(function(data){
				//get a total count of all the medals for each data entry
				return {
					'country':data.country, 
					'mdlcnt':(parseInt(data.goldmedals)+parseInt(data.silvermedals)+parseInt(data.bronzemedals))
				};
			}).reduce(function(prev,curr){
				//add up the medals and sort them into specific countries
				var idx = indexOfArrayObject(prev, curr.country, "label");
				if( idx > -1){
					prev[idx].value += curr.mdlcnt; 
				} else {
					prev.push({"label":curr.country, "value":curr.mdlcnt});
				}
				return prev;
			},[]);
			
			var config = { w:1300, h:1300, r:200, title:"Total Number of Medals by Country"};
			createPie(config,mydata2,"chart");
		} else if(mypage == 2) {	//answer 2
			//type of sports based on the number of bronze medals
			var mydata2 = mydata.map(function(data){
				//get a count of all the bronze medals for each data entry
				return {
					'sport':data.sport, 
					'bronzemdl':parseInt(data.bronzemedals)
				};
			}).reduce(function(prev,curr){
				//add up the bronze medals and sort them into specific sports
				var idx = indexOfArrayObject(prev, curr.sport, "label");
				if( idx > -1){
					prev[idx].value += curr.bronzemdl; 
				} else {
					prev.push({"label":curr.sport, "value":curr.bronzemdl});
				}
				return prev;
			},[]);

			var config = {  w:960, h:500,
							margin:{
								top:20, 
								right:30,
								bottom:150,
								left:40
							},
							ylabel:"Number of Bronze Medals"};
			
			createBar(config,mydata2,"#chart");
		} else if(mypage == 3) {	//answer 3
			//list the type of sports in descending order for which there was an athlete 
			//between the age of 22 and 29 (inclusive) that had a medal
			var mydata2 = mydata.map(function(data){
				//get a total count of all the medals for each data entry
				return {
					'sport':data.sport,
					'gmedals':parseInt(data.goldmedals),
					'smedals':parseInt(data.silvermedals),
					'bmedals':parseInt(data.bronzemedals),
					'mdlcnt':(parseInt(data.goldmedals)+parseInt(data.silvermedals)+parseInt(data.bronzemedals)),
					'age':parseInt(data.age)
				};
			}).reduce(function(prev,curr){
				//If the atlhletes falls between 22 & 29, go ahead and add up the medals for that sport
				//give me an array of sports and total medal couts
				if(curr.age > 21 && curr.age < 30) {
					var idx = indexOfArrayObject(prev, curr.sport, "label");
					if( idx > -1){
						prev[idx].gold += curr.gmedals; 
						prev[idx].silver += curr.smedals; 
						prev[idx].bronze += curr.bmedals; 
						prev[idx].mdlcount += curr.mdlcnt; 
					} else {
						prev.push({"label":curr.sport,"gold":curr.gmedals,"silver":curr.smedals,"bronze":curr.bmedals,"mdlcount":curr.mdlcnt});
					}
				}
				return prev;
			},[]);
			var mydata3 = mydata2.sort(function(a,b){
				if(a.mdlcount > b.mdlcount) { return -1; }
				if(a.mdlcount < b.mdlcount) { return 1; }
				return 0;
			});
			var tblHeaders = ["Sport Name", "Gold Medals", "Silver Medals", "Bronze Medals", "Total Number of Medals"];
			var rowHtml='<thead><tr><th>'+tblHeaders.join('</th><th>')+'</th></tr></thead><tbody>';
			$.each(mydata3,function(){
			    rowHtml+='<tr><td>'+this.label+'</td><td>'+this.gold+'</td><td>'+this.silver+'</td><td>'+this.bronze+'</td><td>'+this.mdlcount+'</td></tr>';
			})
			rowHtml+='</tbody>';
			$('<table></table>')
				.attr("class", "table table-striped table-hover")
				.html(rowHtml)
				.appendTo("#dataview");
		}
	}
};

indexOfArrayObject = function(myArray, searchTerm, property) {
    for(var i = 0, len = myArray.length; i < len; i++) {
        if(myArray[i][property] === searchTerm){ return i; }
    }
    return -1;
};

midAngle = function(d){
	return d.startAngle + (d.endAngle - d.startAngle)/2;
};


/**
 * function:createPie
 * @desc: creates a D3 pie chart based on input parameters
 * @param: cfg - object with configuration values
 * 		   cfg.w 		- chart width 
 * 		   cfg.h 		- chart height
 * 		   cfg.r 		- pie radius
 * 		   cfg.title 	- chart title
 * @param: data - Data to be displayed on chart
 * 		   data[].label - label name
 * 		   data[].value - label value
 * @param: elem - DOM element that chart is to be attached to
 *  
 */
createPie = function(cfg, data, elem) {
	var pie = new d3pie(elem, {
		"header": {
			"title": {
				"text": cfg.title,
				"fontSize": 24,
				"font": "open sans"
			},
			"titleSubtitlePadding": 9
		},
		"size": {
			"canvasWidth": cfg.w,
			"canvasHeight": cfg.h,
			"pieInnerRadius": 0,
			"pieOuterRadius": cfg.r
		},
		"data": {
			"content": data
		},
		"labels": {
			"outer": {
				"format": "label-value1",
				"pieDistance": 40
			},
			"inner": {
				"format": "none"
			},
			"mainLabel": {
				"fontSize": 10
			},
			"percentage": {
				"color": "#ffffff",
				"decimalPlaces": 0
			},
			"value": {
				"color": "#adadad",
				"fontSize": 11
			},
			"lines": {
				"enabled": true
			}
		},
		"effects": {
			"pullOutSegmentOnClick": {
				"effect": "linear",
				"speed": 400,
				"size": 8
			}
		},
		"misc": {
			"gradient": {
				"enabled": true,
				"percentage": 100
			},
			"pieCenterOffset": {
				"x": (parseInt((cfg.w/2)-(150+cfg.r))>0)?parseInt((cfg.w/2)-(150+cfg.r)):0,
				"y": (parseInt((cfg.h/2)-(150+cfg.r))>0)?(-1*parseInt((cfg.h/2)-(150+cfg.r))):0
			}
		}
	});
}

/**
 * function:createBar
 * @desc: creates a D3 bar graph based on input parameters
 * @param: cfg - object with configuration values
 * 		   cfg.w 				- chart width 
 * 		   cfg.h 				- chart height
 * 		   cfg.margin.top 		- chart top margin
 * 		   cfg.margin.bottom 	- chart bottom margin
 * 		   cfg.margin.left	 	- chart left margin
 * 		   cfg.margin.right 	- chart right margin
 * 		   cfg.ylabel		 	- label for y axis
 * @param: data - Data to be displayed on chart
 * 		   data[].label - label name
 * 		   data[].value - label value
 * @param: elem - DOM element that chart is to be attached to
 *  
 */
createBar = function(cfg, data, elem) {
	cfg.w = cfg.w - cfg.margin.left - cfg.margin.right;
    cfg.h = cfg.h - cfg.margin.top - cfg.margin.bottom;
    
    var x = d3.scale.ordinal().rangeRoundBands([0, cfg.w], .1);
	var y = d3.scale.linear().range([cfg.h, 0]);
	var xAxis = d3.svg.axis().scale(x).orient("bottom");
	var yAxis = d3.svg.axis().scale(y).orient("left");
	
	var chart = d3.select(elem)
					.attr("width", cfg.w + cfg.margin.left + cfg.margin.right)
					.attr("height", cfg.h + cfg.margin.top + cfg.margin.bottom)
					.append("g")
					.attr("transform", "translate(" + cfg.margin.left + "," + cfg.margin.top + ")");

	x.domain(data.map(function(d) { return d.label; }));
	y.domain([0, d3.max(data, function(d) { return d.value; })]);
	
	chart.append("g")
			.attr("class", "x axis")
			.attr("transform", "translate(0," + cfg.h + ")")
			.call(xAxis)
			.selectAll("text")  
				.style("text-anchor", "end")
				.attr("dx", "-.8em")
				.attr("dy", ".15em")
				.attr("transform", function(d) {
					return "rotate(-90)" 
				});
	chart.append("g")
			.attr("class", "y axis")
			.call(yAxis)
			.append("text")
			.attr("transform", "rotate(-90)")
			.attr("y", 6)
			.attr("dy", ".71em")
			.style("text-anchor", "end")
			.text(cfg.ylabel);
	chart.selectAll(".bar")
			.data(data)
			.enter()
			.append("text")
			.style("font-size",".65em")
			.attr("x", function(d) { return x(d.label)+3; })
			.attr("y", function(d) { return y(d.value)-1; })
			.text(function(d) { return d.value});
	chart.selectAll(".bar")
			.data(data)
			.enter().append("rect")
			.attr("class", "bar")
			.attr("x", function(d) { return x(d.label); })
			.attr("y", function(d) { return y(d.value); })
			.attr("height", function(d) { return cfg.h - y(d.value); })
			.attr("width", x.rangeBand());
};