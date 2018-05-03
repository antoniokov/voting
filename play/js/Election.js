/****************************

SINGLETON CLASS on how to COUNT UP THE BALLOTS
and RENDER IT INTO THE CAPTION

*****************************/
var Election = {};

Election.score = function(model, options){

	// Tally the approvals & get winner!
	var tally = _tally(model, function(tally, ballot){
		for(var candidate in ballot){
			tally[candidate] += ballot[candidate];
		}
	});
	for(var candidate in tally){
		tally[candidate] /= model.getTotalVoters();
	}
	var winner = _countWinner(tally);
	var color = _colorWinner(model, winner);

	// NO WINNER?! OR TIE?!?!
	if(!winner){

		var text = "<b>Победителя нет</b>";
		model.caption.innerHTML = text;

	}else{

		// Caption
		var text = "";
		text += "<span class='small'>";
		text += "<b>У кого оценка выше?</b><br>";

		const sortedTally = _getSortedTally(tally);
        sortedTally.forEach(function (st) {
            text += _icon(st.id)+ ": "+ (st.result.toFixed(2)) + "<br>";
		});
		text += "<br>";

		text += _icon(winner)+" получил самую высокую оценку, поэтому...<br>";
		text += "</span>";
		text += "<br>";
		text += "побеждает "+ "<b style='color:"+color+"'>"+candidates[winner].label + "</b>";
		model.caption.innerHTML = text;

	}

};

Election.approval = function(model, options){

	// Tally the approvals & get winner!
	var tally = _tally(model, function(tally, ballot){
		var approved = ballot.approved;
		for(var i=0; i<approved.length; i++) tally[approved[i]]++;
	});
	var winner = _countWinner(tally);
	var color = _colorWinner(model, winner);

	// NO WINNER?! OR TIE?!?!
	if(!winner){

		var text = "<b>Победителя нет</b>";
		model.caption.innerHTML = text;

	}else{

		// Caption
		var text = "";
		text += "<span class='small'>";
		text += "<b>У кого больше одобрений?</b><br>";

		const sortedTally = _getSortedTally(tally);
		text = _printSortedTally(sortedTally, text);
		text += "<br><br>";

		text += _icon(winner)+" подходит наибольшему числу избирателей, поэтому...<br>";
		text += "</span>";
		text += "<br>";
		text += "побеждает "+ "<b style='color:"+color+"'>"+ candidates[winner].label + "</b>";
		model.caption.innerHTML = text;

	}

};

Election.condorcet = function(model, options){

	var text = "";
	text += "<span class='small'>";
	text += "<b>Кто выиграл все &laquo;микровыборы&raquo;?</b><br>";

	var ballots = model.getBallots();

	// Create the WIN tally
	var tally = {};
	for(var candidateID in model.candidatesById) tally[candidateID] = 0;

	// For each combination... who's the better ranking?
	for(var i=0; i<model.candidates.length-1; i++){
		var a = model.candidates[i];
		for(var j=i+1; j<model.candidates.length; j++){
			var b = model.candidates[j];

			// Actually figure out who won.
			var aWins = 0;
			var bWins = 0;
			for(var k=0; k<ballots.length; k++){
				var rank = ballots[k].rank;
				if(rank.indexOf(a.id)<rank.indexOf(b.id)){
					aWins++; // a wins!
				}else{
					bWins++; // b wins!
				}
			}

			// WINNER?
			var winner = (aWins>bWins) ? a : b;
			tally[winner.id]++;

			// Text.
			var by,to;
			if(winner==a){
				by = aWins;
				to = bWins;
			}else{
				by = bWins;
				to = aWins;
			}
			text += _icon(a.id)+"-"+_icon(b.id)+ " " + aWins+":"+bWins+"<br>";

		}
	}

	// Was there one who won all????
	var topWinner = null;
	for(var id in tally){
		if(tally[id]==model.candidates.length-1){
			topWinner = id;
		}
	}

	// Winner... or NOT!!!!
	text += "<br>";
	if(topWinner){
		var color = _colorWinner(model, topWinner);
		text += _icon(topWinner)+" одолел остальных в схватках один-на-один, поэтому...<br>";
		text += "</span>";
		text += "<br>";
		text += "побеждает " + "<b style='color:"+color+"'>"+ candidates[topWinner].label +"</b>";
	}else{
		model.canvas.style.borderColor = "#000"; // BLACK.
		text += "НИКТО не победил в &laquo;микровыборах&raquo;.<br>";
		text += "</span>";
		text += "<br>";
		text += "ПОБЕДИТЕЛЯ НЕТ.<br>";
		text += "<b id='ohno'>О БОЖЕ.</b>";
	}

	// what's the loop?

	model.caption.innerHTML = text;

};

Election.borda = function(model, options){

	// Tally the approvals & get winner!
	var tally = _tally(model, function(tally, ballot){
		for(var i=0; i<ballot.rank.length; i++){
			var candidate = ballot.rank[i];
			tally[candidate] += i; // the rank!
		}
	});
	var winner = _countLoser(tally); // LOWER score is best!
	var color = _colorWinner(model, winner);

	// NO WINNER?! OR TIE?!?!
	if(!winner){

		var text = "<b>Победителя нет</b>";
		model.caption.innerHTML = text;

	}else{

		// Caption
		var text = "";
		text += "<span class='small'>";
		text += "<b>У кого сумма позиций меньше?</b><br>";

		const sortedTally = _getSortedTally(tally, function (a, b) { return a.result - b.result });
		text = _printSortedTally(sortedTally, text);
		text += "<br><br>";

		text += _icon(winner)+" набрал <i>меньше</i> всех, поэтому...<br>";
		text += "</span>";
		text += "<br>";
		text += "побеждает "+ "<b style='color:"+color+"'>"+ candidates[winner].label + "</b>";
		model.caption.innerHTML = text;

	}

};

Election.irv = function(model, options){

	var text = "";
	text += "<span class='small'>";

	var finalWinner = null;
	var roundNum = 1;

	var candidatesIRV = [];
	for(var i=0; i<model.candidates.length; i++){
		candidatesIRV.push(model.candidates[i].id);
	}

	while(!finalWinner){

		text += "<b>Раунд "+roundNum+"</b><br>";
		text += "Кто первый в бюллетене?<br>";

		// Tally the approvals & get winner!
		var pre_tally = _tally(model, function(tally, ballot){
			var first = ballot.rank[0]; // just count #1
			tally[first]++;
		});

		// ONLY tally the remaining candidates...
		var tally = {};
		for(var i=0; i<candidatesIRV.length; i++){
			var cID = candidatesIRV[i];
			tally[cID] = pre_tally[cID];
		}

		// Say 'em...
		const sortedTally = _getSortedTally(tally);
		text = _printSortedTally(sortedTally, text);
		text += "<br>";

		// Do they have more than 50%?
		var winner = _countWinner(tally);
		var ratio = tally[winner]/model.getTotalVoters();
		if(ratio>=0.5){
			finalWinner = winner;
			text += _icon(winner)+" набрал больше 50%<br>";
			break;
		}

		// Otherwise... runoff...
		var loser = _countLoser(tally);
		text += "никто не набрал 50%<br>";
		text += _icon(loser)+" выбывает.<br><br>";

		// ACTUALLY ELIMINATE
		candidatesIRV.splice(candidatesIRV.indexOf(loser), 1); // remove from candidates...
		var ballots = model.getBallots();
		for(var i=0; i<ballots.length; i++){
			var rank = ballots[i].rank;
			rank.splice(rank.indexOf(loser), 1); // REMOVE THE LOSER
		}

		// And repeat!
		roundNum++;

	}

	// END!
	var color = _colorWinner(model, finalWinner);
	text += "</span>";
	text += "<br>";
	text += "побеждает "+ "<b style='color:"+color+"'>"+ candidates[winner].label + "</b>";
	model.caption.innerHTML = text;


};

Election.plurality = function(model, options){

	options = options || {};

	// Tally the approvals & get winner!
	var tally = _tally(model, function(tally, ballot){
		tally[ballot.vote]++;
	});
	var winner = _countWinner(tally);
	var color = _colorWinner(model, winner);

	// Caption
	var text = "";
	text += "<span class='small'>";
	if(options.sidebar){
		text += "<b>У кого больше голосов?</b><br>";
	}

    const sortedTally = _getSortedTally(tally);
	if (options.sidebar) {
		text = _printSortedTally(sortedTally, text);
	} else {
        sortedTally.forEach(function (st, i) {
            text += candidates[st.id].label + ": " + st.result;
            if(i < sortedTally.length - 1) {
                text+=", ";
            }
        });
	}

	if(options.sidebar){
		text += "<br><br>";
		text += "У " + _icon(winner)+" больше всего голосов, поэтому...<br>";
	}
	text += "</span>";
	text += "<br>";
	text += "побеждает "+ "<b style='color:"+color+"'>"+ candidates[winner].label + "</b>";
	model.caption.innerHTML = text;

};

var _tally = function(model, tallyFunc){

	// Create the tally
	var tally = {};
	for(var candidateID in model.candidatesById) tally[candidateID] = 0;

	// Count 'em up
	var ballots = model.getBallots();
	for(var i=0; i<ballots.length; i++){
		tallyFunc(tally, ballots[i]);
	}
	
	// Return it.
	return tally;

}

var _countWinner = function(tally){

	// TO DO: TIES as an array?!?!

	var highScore = -1;
	var winner = null;

	for(var candidate in tally){
		var score = tally[candidate];
		if(score>highScore){
			highScore = score;
			winner = candidate;
		}
	}

	return winner;

}

var _countLoser = function(tally){

	// TO DO: TIES as an array?!?!

	var lowScore = Infinity;
	var winner = null;

	for(var candidate in tally){
		var score = tally[candidate];
		if(score<lowScore){
			lowScore = score;
			winner = candidate;
		}
	}

	return winner;

}

var _colorWinner = function(model, winner){
	var color = (winner) ? candidates[winner].fill : "";
	model.canvas.style.borderColor = color;
	return color;
}

const _getSortedTally = function (tally, compareFunction) {
	const compare = compareFunction || function (a, b) { return b.result - a.result; };

    return Object.keys(tally).map(function (c) {
        return {
            id: c,
            result: tally[c]
        };
    }).sort(compare);
};

const _printSortedTally = function (sortedTally, preText) {
	var text = preText || '';

    sortedTally.forEach(function (st, i) {
        text += _icon(st.id)+ " " + st.result;
        if (i < sortedTally.length - 1) {
            text+=", ";
        }
	});

	return text;
};