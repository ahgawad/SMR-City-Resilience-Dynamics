/* Begin blockUI initialisation */
$.blockUI.defaults.css = {
	"display": "block",
	"position": "absolute",
	"text-align": "center",
	"background-color": "#B8A9A9",
	"color": "#FFF",
	"line-height": "1.3em",
	"font-size": "150%",
	"width": "10em",
	"left": "50%",
	"top": "25%",
	"margin-left": "-5em",
	"margin-top": "-.7em",
	"border-radius": "5px",
	"padding": "7px",
	"box-shadow": "3px 3px 3px rgba(0, 0, 0, .5)"
	};
$.blockUI.defaults.message = "Loading...";
//$(document).ajaxStart($.blockUI).ajaxStop($.unblockUI);
/* End blockUI initialisation */

/* Begin global variables initialisation */
var currencyVector=["Euros","Norwegian kroner","Pounds sterling"];
var currencyClassVector=["glyphicon-eur","glyphicon-nok","glyphicon-gbp"];
var defaultCurrencyID=0;
var selectedCurrencyID=0;
var sentResults=[];
var startTime;
var timeStep;
var time;
var finalTime;
var initialTime;
var step;
var maxSeriesDisplay = 3;
var selectedScenario = "Scenario-1";

var singleScenarioChartsArray={};
var singleScenarioTablesArray={};
var powerGaugesArray={};
var contourPiesArray={};
var contoursArray={};

// Array for runs
//var runsNamesArray=["Historical-Data", "Scenario-1"];
var runsNamesArray=[{"name": "Historical-Data", "display": true, "color": "#000000", "comment": "Historical Data"},{"name": "Scenario-1", "display": true, "color": "#2477b3", "comment": "Scenario 1"}];

// Objects for runs data
var runsSourceArray={};
var runsCategoriesArray={};
/* End global variables initialisation */

'use strict';
$( document ).ready(function() {
	resetModel(0);
	$('[data-toggle="tooltip"]').tooltip({
		placement : 'auto top',
		delay: {show: 500, hide: 100},
		container: 'body'
	});

	$('#scenariosSelectorModalShow').click(function () {
		$('#scenarios_div').empty();
		for (var i = 1, tot = runsNamesArray.length; i < tot; i++) { 
			$('#scenarios_div').append("<div class='input-group colorpicker-component colorpicker'><span class='input-group-addon input-group-addon_CP'><i></i></span><input type='text' class='form-control' value='"+runsNamesArray[i]["comment"]+"' onchange='(function(tx) {runsNamesArray["+i+"][\"comment\"]=tx.value;})(this);'><input type='text' class='form-control form-control_CP' style='display:none;' value='"+runsNamesArray[i]["color"]+"' data-run-index='"+i+"'><span class='input-group-addon'><input type='checkbox' class='scenarioCB' "+(runsNamesArray[i]["display"]?"checked":"")+" onclick='(function(cb) {controlCheckboxGroup(cb); runsNamesArray["+i+"][\"display\"]=cb.checked;})(this);'></span></div>");
		}

		$('.colorpicker').colorpicker().on('changeColor.colorpicker', function(event) {
			runsNamesArray[parseInt(event.target.childNodes[2].attributes["data-run-index"].value)]["color"] = event.color.toHex();
		});
		$('#scenariosSelectorModal').on('hidden.bs.modal', function () {
			renderContours();
		});
		$('#scenariosSelectorModal').modal('show');
	});
	
	'use strict';
	/*if ($('body').data('mode') !== 'builder') {
		Flow.initialize({
			channel: {
				strategy: 'always-new',
				run: {
					variables: { 
						silent: true
					},
					transport: {
						beforeSend: function () {
							$.blockUI();
						},
						complete: function () {
							$.unblockUI();
						}
					}
				}
			}
		});
	}*/

});

function controlCheckboxGroup(cb) {
	if ($('.scenarioCB:not(:checked)').length == $('.scenarioCB').length) {
		 $(cb).prop('checked', true);
	}
	if ($('.scenarioCB:checked').length > maxSeriesDisplay) {
		 $(cb).prop('checked', false);
	}
}

/*
function addTimeControls() {
	(function() {
		var scripts= document.getElementsByTagName('script');
		var script= scripts[scripts.length-1];
		var div= document.createElement('div');
		div.innerHTML= "<input id=\"varTime\" type=\"hidden\" class=\"form-control\" data-f-bind=\"Time\"><input id=\"varFINAL_TIME\" type=\"hidden\" class=\"form-control\" data-f-bind=\"FINAL TIME\"><input id=\"varINITIAL_TIME\" type=\"hidden\" class=\"form-control\" data-f-bind=\"INITIAL TIME\">";
		script.parentNode.insertBefore(div, script);
	})();
}
*/


// Extract the variables sent to this page via it is address https://forio.com/.../index.html?SID=123&SAVEDID=4567&DBSRVURL=https://www.example.com/forioepicenter.php
function getQueryVariable(variable) {
	var query = window.location.search.substring(1);
	var vars = query.split("&");
	var tot = (typeof (vars) === "undefined")?0:(vars.length);
	for (var i = 0; i < tot; i++) {
		var pair = vars[i].split("=");
		if (pair[0] == variable) {
			return pair[1];
		}
	}
	return -1; //not found
}

function sendDecisions(steps) {
	time = $('#div_time').find("span").text();
	console.log("sending decisions, model time is: "+time);
	//beforeSend:
	var SID = getQueryVariable("SID");
	var SAVEDID = 0;//getQueryVariable("SAVEDID");
	var DBSRVURL = "forioepicenter.php";//getQueryVariable("DBSRVURL");

	if (DBSRVURL!=-1 && SID!=-1 && SAVEDID!=-1) {
		var modelURL = window.location.href;
		var modelName = document.getElementsByTagName("body")[0].getAttribute("data-f-model");
		var runName = runsNamesArray[runsNamesArray.length-1]["name"];
		var tableName = "decisions";
		var userIdentity = "";
		var decision = document.getElementsByTagName("input");
		var tot = (typeof (decision)) === "undefined"?0:(decision.length);
		for (var i = 0; i < tot; i++) { 
			/*if( typeof ( decision[i].getAttribute("data-f-bind")) !== "undefined" ) {*/
			if( decision[i].getAttribute("data-f-bind") !== null ) {
			if( ( ( decision[i].getAttribute("class") == "form-radio" ) && decision[i].checked ) || !( decision[i].getAttribute("class") == "form-radio" ) ) {
				var varName=decision[i].getAttribute("data-f-bind").split("|")[0];
				var varValue=decision[i].value;
				if(varValue==null || varValue=="" || varValue==0) {varValue="0";} else {varValue=String(varValue);}

				$.ajax({
					url: DBSRVURL,
					type: "POST",
					data: { 'tableName': tableName, 'userIdentity': userIdentity, 'SID': SID, 'SAVEDID': SAVEDID, 'modelURL': modelURL, 'modelName': modelName, 'runName': runName, 'modelTime': time ,'varName': varName, 'varValue': varValue },
					success: function()     {
						console.log("Sending decisions, ok!");
					}
				});
			}
			}
		}
	}
	advanceModel(steps);
}

function resetSimulation(setTime) {
	var countSeriesDisplay = maxSeriesDisplay ;
	for (var i = runsNamesArray.length-1; i > 0; i--) { 
		if ( runsNamesArray[i]["display"] ) countSeriesDisplay--;
		if ( countSeriesDisplay <= 0 ) runsNamesArray[i]["display"] = false;
	}
	runsNamesArray.push({"name": "Scenario-"+(parseInt(runsNamesArray[runsNamesArray.length-1]["name"].match(/[0-9]+/)[0])+1), "display": true, "color": makeRandomColor(), "comment": "Scenario "+(parseInt(runsNamesArray[runsNamesArray.length-1]["name"].match(/[0-9]+/)[0])+1)});
	sentResults=[];
	resetModel(setTime);
}

function makeRandomColor() {
	//http://www.paulirish.com/2009/random-hex-color-code-snippets/
	return '#'+Math.floor(Math.random()*16777215).toString(16);
}

function sendRecentResults() {
	console.log("sending recent results, model time is: "+time);
	//beforeSend:
	var SID = getQueryVariable("SID");
	var SAVEDID = 0;//getQueryVariable("SAVEDID");
	var DBSRVURL = "forioepicenter.php";//getQueryVariable("DBSRVURL");
	
	if (DBSRVURL!=-1 && SID!=-1 && SAVEDID!=-1) {
		var modelURL = window.location.href;
		var modelName = document.getElementsByTagName("body")[0].getAttribute("data-f-model");
		var runName = runsNamesArray[runsNamesArray.length-1]["name"];
		var tableName = "results";
		var userIdentity = "";
		for (var key in runsSourceArray) {
			if (runsSourceArray.hasOwnProperty(key) && runsCategoriesArray.hasOwnProperty(key)) {
				var i=(typeof (runsSourceArray[key][runsNamesArray[runsNamesArray.length-1]["name"]]) === "undefined")?0:(runsSourceArray[key][runsNamesArray[runsNamesArray.length-1]["name"]].length);
				if (i > 0 ) {
					var varName=$(document.getElementById(key)).attr("data-f-c-source");
					var varValue=runsSourceArray[key][runsNamesArray[runsNamesArray.length-1]["name"]][i-1];
					var varValTime=runsCategoriesArray[key][i-1];

					if(varValue==null || varValue=="" || varValue==0) {varValue="0";} else {varValue=String(varValue);}

					$.ajax({
						url: DBSRVURL,
						type: "POST",
						data: { 'tableName': tableName, 'userIdentity': userIdentity, 'SID': SID, 'SAVEDID': SAVEDID, 'modelURL': modelURL, 'modelName': modelName, 'runName': runName, 'modelTime': varValTime ,'varName': varName, 'varValue': varValue },
						success: function() {
							console.log("Sending "+varName+" at "+time+", ok!");
						}
					});

				}
			}
		}
	}
}

/*function advanceModel(steps) {
	Flow.channel.operations.publish("step", steps);
	$('[href=#tabs-3]').tab('show');
}

function resetModel(setTime) {
	if (setTime == initialTime) {
		$.when( $.when( Flow.channel.operations.publish("reset") ).then( Flow.channel.operations.publish("startGame") ) );
	} else {
		$.when( $.when( Flow.channel.operations.publish("reset") ).then( Flow.channel.operations.publish("startGame") ) ).then( Flow.channel.operations.publish("stepTo", setTime) );
	}
}

$( document ).ajaxStop(function () {
	time = document.getElementById("varTime").value;
	initialTime = document.getElementById("varINITIAL_TIME").value;
	finalTime = document.getElementById("varFINAL_TIME").value;
	console.log( "Triggered ajaxStop handler. Time now is: "+time+"/"+finalTime );
	if (sentResults[sentResults.length-1]!=time) {
		sendRecentResults();
		sentResults.push(time);
	}
	
	renderContours();
	updatePowerGauges();
});
*/

function renderContours() { 
	var tempRunsSourceArray={};
	
	for (var key in contoursArray) {
		tempRunsSourceArray[key]={};
		if (typeof runsSourceArray[key]["Historical-Data"]!=="undefined") tempRunsSourceArray[key]["Historical-Data"] = runsSourceArray[key]["Historical-Data"];

		for (var i = 1, tot = runsNamesArray.length ; i < tot ; i++) { 
			if (runsNamesArray[i]["display"]){
				tempRunsSourceArray[key][runsNamesArray[i]["name"]] = runsSourceArray[key][runsNamesArray[i]["name"]];
			}
		}
		contoursArray[key].setSource(tempRunsSourceArray[key]);
		contoursArray[key].setCategories(runsCategoriesArray[key]);
		contoursArray[key].renderChart();
	}
}

function updatePowerGauges(res) { 
	for (var key in powerGaugesArray) {
		var modelVarName=$(document.getElementById(key)).attr("data-f-g-source");
		powerGaugesArray[key].update(res.lastValue(findName(modelVarName))/100);
	}
}

function updatePieContours(res) { 
	for (var key in contourPiesArray) {
		var modelVarName=$(document.getElementById(key)).attr("data-f-p-source");
		contourPiesArray[key].setData(res.lastValue(findName(modelVarName))/100);
	}
}

function updateSingleScenarioChart(res) { 
	for (var key in singleScenarioChartsArray) {
		var modelVarName=$(document.getElementById(key)).attr("data-f-c-source");
		singleScenarioChartsArray[key].setSource(_.filter($.makeArray( res.value(findName(modelVarName)) ), function(num, key) { return key % 8 == 0; }));
		singleScenarioChartsArray[key].setCategories(_.filter($.makeArray( res.times ), function(num, key) { return key % 8 == 0; }));
		singleScenarioChartsArray[key].renderChart();
	}
}

function updateSingleScenarioTable(res) { 
	for (var key in singleScenarioTablesArray) {
		var modelVarName=$(document.getElementById(key)).attr("data-f-c-source");
		singleScenarioTablesArray[key].setSource(_.filter($.makeArray( res.value(findName(modelVarName)) ), function(num, key) { return key % 8 == 0; }));
		singleScenarioTablesArray[key].setCategories(_.filter($.makeArray( res.times ), function(num, key) { return key % 8 == 0; }));
		singleScenarioTablesArray[key].drawTable();
	}
}


/*
$( document ).ajaxComplete(function( event, xhr, settings ) {
	console.log( "Triggered ajaxComplete handler. The result is " + xhr.responseText );
	if (typeof (xhr.responseJSON)!=="undefined") {
		if (xhr.responseJSON.name == "step" || xhr.responseJSON.name == "stepTo" ) {
			console.log(xhr.responseJSON.result);
		}
	}
});
*/


