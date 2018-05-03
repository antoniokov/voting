window.FULL_SANDBOX = window.FULL_SANDBOX || false;
window.HACK_BIG_RANGE = true;

window.ONLY_ONCE = false;

function main(config){

	// ONCE.
	if(ONLY_ONCE) return;
	ONLY_ONCE=true;

	///////////////////////////////////////////////////////////////
	// ACTUALLY... IF THERE'S DATA IN THE QUERY STRING, OVERRIDE //
	///////////////////////////////////////////////////////////////

	var _getParameterByName = function(name, url){
		var url = window.top.location.href;
		name = name.replace(/[\[\]]/g, "\\$&");
		var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
		results = regex.exec(url);
		if (!results) return null;
		if (!results[2]) return '';
		return decodeURIComponent(results[2].replace(/\+/g, " "));
	};
	var modelData = _getParameterByName("m");
	if(modelData){

		// Parse!
		var data = JSON.parse(modelData);

		// Turn into initial config
		config = {
			features: 4,
			system: data.s,
			candidates: data.c,
			voters: data.v.length,
			voterPositions: data.v,
			description: data.d
		};

	}

	// Defaults...
	config = config || {};
	config.system = config.system || "FPTP";
	config.candidates = config.candidates|| metadataToArray(candidates).slice(0, 2);
	config.voters = config.voters || 1;
	config.features = config.features || 1; // 1-basic, 2-voters, 3-candidates, 4-save
	var initialConfig = JSON.parse(JSON.stringify(config));

	Loader.onload = function(){

		////////////////////////
		// THE FRIGGIN' MODEL //
		////////////////////////

		window.model = new Model();
		document.querySelector("#center").appendChild(model.dom);
		model.dom.removeChild(model.caption);
		document.querySelector("#right").appendChild(model.caption);
		model.caption.style.width = "";

		// INIT!
		model.onInit = function(){

			// Based on config... what should be what?
			model.numOfCandidates = config.candidates.length;
			model.numOfVoters = config.voters;
			model.system = config.system;
			var votingSystem = systems[model.system];
			model.voterType = votingSystem.voter;
			model.election = votingSystem.election;

			// Voters
			const defaultVoterPositions = {
				1: [[150,150]],
				2: [[150,100],[150,200]],
				3: [[150,115],[115,180],[185,180]]
			};
			const voterPositions = defaultVoterPositions[model.numOfVoters];

            voterPositions.forEach(function (p) {
                model.addVoters({
                    dist: GaussianVoters,
                    type: model.voterType,
                    num:(4 - model.numOfVoters),
                    x: p[0], y: p[1]
                });
			});

			// Candidates, in a circle around the center.
			const startingAngles = {
				2: 0,
                3: Math.TAU/12,
                4: Math.TAU/8,
                5: Math.TAU/6.6
			};

			var startingAngle = startingAngles[model.numOfCandidates];
			config.candidates.forEach(function (c, i) {
                const r = 100;
                const angle = startingAngle + i*Math.TAU/model.numOfCandidates;
                const x = 150 - r*Math.cos(angle);
                const y = 150 - r*Math.sin(angle);
                model.addCandidate(c.id, x, y);
			});

		};
		model.election = Election.plurality;
		model.onUpdate = function(){
			model.election(model, {sidebar:true});
		};

		// In Position!
		var setInPosition = function(){

			model.candidates.forEach(function (c) {
				const position = config.candidates.filter(function (cc) {
					return c.id === cc.id;
				})[0].position;

				if (position) {
                    c.x = position[0];
                    c.y = position[1];
				}
			});

			// VOTER POSITION
			if (config.voterPositions) {
                config.voterPositions.forEach(function (p, i) {
                	const voter = model.voters[i];
                    voter.x = p[0];
                    voter.y = p[1];
				});
			}

			// update!
			model.update();
		};


		//////////////////////////////////
		// BUTTONS - WHAT VOTING SYSTEM //
		//////////////////////////////////

		// Which voting system?
		var onChooseSystem = function(data){

			// update config...
			config.system = data.id;

			// no reset...
			model.voterType = data.voter;
			for(var i=0;i<model.voters.length;i++){
				model.voters[i].setType(data.voter);
			}
			model.election = data.election;
			model.update();

		};


		const votingSystems = config.systemsAvailable
			? metadataToArray(systems).filter(function (s) { return config.systemsAvailable.indexOf(s.id) >= 0 })
			: metadataToArray(systems);

		window.chooseSystem = new ButtonGroup({
			label: "Cистема",
			width: 108,
			data: votingSystems,
			onChoose: onChooseSystem
		});

		if (initialConfig.features > 0) {
            document.querySelector("#left").appendChild(chooseSystem.dom);
		}

		// How many voters?
		if(initialConfig.features>=2){ // CANDIDATES as feature.

			var voters = [
				{name:"one", label: 'одна', num:1, buttonMargin:5},
				{name:"two", label: 'две', num:2, buttonMargin:5},
				{name:"three", label: 'три', num:3}
			];
			var onChooseVoters = function(data){

				// update config...
				config.voters = data.num;

				// save candidates before switching!
				config.candidatePositions = save().candidatePositions;

				// reset!
				config.voterPositions = null;
				model.reset();
				setInPosition();

			};
			window.chooseVoters = new ButtonGroup({
				label: "Групп избирателей",
				width: 70,
				data: voters,
				onChoose: onChooseVoters
			});
			document.querySelector("#left").appendChild(chooseVoters.dom);

		}

		// How many candidates?
		if(initialConfig.features>=3){ // VOTERS as feature.

			var candidates = [
				{name:"two", label: '2', num:2, buttonMargin:4},
				{name:"three", label: '3', num:3, buttonMargin:4},
				{name:"four", label: '4', num:4, buttonMargin:4},
				{name:"five", label: '5', num:5}
			];
			var onChooseCandidates = function(data){

				// update config...
				config.candidates = initialConfig.candidates.slice(0, data.num);

				// save voters before switching!
				config.voterPositions = save().voterPositions;

				// reset!
				config.candidatePositions = null;
				model.reset();
				setInPosition();

			};
			window.chooseCandidates = new ButtonGroup({
				label: "Кандидатов",
				width: 52,
				data: candidates,
				onChoose: onChooseCandidates
			});
			document.querySelector("#left").appendChild(chooseCandidates.dom);

		}


		///////////////////////
		//////// INIT! ////////
		///////////////////////

		model.onInit(); // NOT init, coz don't update yet...
		setInPosition();

		// Select the UI!
		var selectUI = function(){
			if(window.chooseSystem) chooseSystem.highlight("id", model.system);
			if(window.chooseCandidates) chooseCandidates.highlight("num", model.numOfCandidates);
			if(window.chooseVoters) chooseVoters.highlight("num", model.numOfVoters);
		};
		selectUI();


		//////////////////////////
		//////// RESET... ////////
		//////////////////////////

		// CREATE A RESET BUTTON
		if (initialConfig.features > 0) {
            var resetDOM = document.createElement("div");
            resetDOM.id = "reset";
            resetDOM.innerHTML = "сбросить";
            resetDOM.style.top = "340px";
            resetDOM.style.left = "350px";
            resetDOM.onclick = function(){

                config = JSON.parse(JSON.stringify(initialConfig)); // RESTORE IT!

                // Reset manually, coz update LATER.
                model.reset(true);
                model.onInit();
                setInPosition();

                // Back to ol' UI
                selectUI();

            };
            document.body.appendChild(resetDOM);
		}

		///////////////////////////
		////// SAVE POSITION //////
		///////////////////////////

		window.save = function(log){

			// Candidate positions
			var positions = [];
			for(var i=0; i<model.candidates.length; i++){
				var candidate = model.candidates[i];
				positions.push([
					Math.round(candidate.x),
					Math.round(candidate.y)
				]);
			}
			if(log) console.log("candidatePositions: "+JSON.stringify(positions));
			var candidatePositions = positions;

			// Voter positions
			positions = [];
			for(var i=0; i<model.voters.length; i++){
				var voter = model.voters[i];
				positions.push([
					Math.round(voter.x),
					Math.round(voter.y)
				]);
			}
			if(log) console.log("voterPositions: "+JSON.stringify(positions));
			var voterPositions = positions;

			// positions!
			return {
				candidatePositions: candidatePositions,
				voterPositions: voterPositions
			};

		};



		//////////////////////////////////
		/////// SAVE & SHARE, YO! ////////
		//////////////////////////////////

		var descText, linkText;
		if(initialConfig.features>=4){ // SAVE & SHARE as feature.

			// Create a description up top
			var descDOM = document.createElement("div");
			descDOM.id = "description_container";
			var refNode = document.getElementById("left");
			document.body.insertBefore(descDOM, refNode);
			descText = document.createElement("textarea");
			descText.id = "description_text";
			descDOM.appendChild(descText);

			// yay.
			descText.value = initialConfig.description;

			// Move that reset button
			resetDOM.style.top = "470px";
			resetDOM.style.left = "0px";

			// Create a "save" button
			var saveDOM = document.createElement("div");
			saveDOM.id = "save";
			saveDOM.innerHTML = "сохранить";
			saveDOM.style.top = "470px";
			saveDOM.style.left = "115px";
			saveDOM.onclick = function(){
				_saveModel();
			};
			document.body.appendChild(saveDOM);

			// The share link textbox
			linkText = document.createElement("input");
			linkText.id = "savelink";
			linkText.placeholder = "[when you save your model, a link you can copy will show up here]";
			linkText.setAttribute("readonly", true);
			linkText.onclick = function(){
				linkText.select();
			};
			document.body.appendChild(linkText);

			// Create a URL... (later, PARSE!)
			// save... ?d={s:[system], v:[voterPositions], c:[candidatePositions], d:[description]}

		}
		

	};

	const candidateImages = config.candidates.map(function (c) {
		return candidates[c.id].img;
	});

	Loader.load(candidateImages.concat("img/voter_face.png"));

	// SAVE & PARSE
	// ?m={s:[system], v:[voterPositions], c:[candidatePositions], d:[description]}
	var _saveModel = function(){

		// Data!
		var data = {};

		// System?
		data.s = config.system;
		console.log("voting system: "+data.s);

		// Positions...
		var positions = save(true);
		data.v = positions.voterPositions;
		data.c = positions.candidatePositions; 

		// Description
		var description = document.getElementById("description_text");
		data.d = description.value;
		console.log("description: "+data.d);

		// URI ENCODE!
		var uri = encodeURIComponent(JSON.stringify(data));

		// ALSO TURN IT INTO INITIAL CONFIG. _parseModel
		initialConfig = {
			features: 4,
			system: data.s,
			candidates: data.c.length,
			candidatePositions: data.c,
			voters: data.v.length,
			voterPositions: data.v
		};

		// Put it in the save link box!
		var link = "http://antoniokov.github.io/voting/sandbox?m="+uri;
		var savelink = document.getElementById("savelink");
		savelink.value = "сохраняем...";
		setTimeout(function(){
			savelink.value = link;
		},750);

	};

	// FUNNY HACK.
	setInterval(function(){
		var ohno = document.getElementById("ohno");
		if(!ohno) return;
		var x = Math.round(Math.random()*10-5);
		var y = Math.round(Math.random()*10)+10;
		ohno.style.top = y+"px";
		ohno.style.left = x+"px";
	},10);

};