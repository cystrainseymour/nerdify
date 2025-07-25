class Affix{
	
	constructor(lemma, lexes, checkConditions, apply){
		this.lemma = lemma.toLowerCase(); // more of a name than anything
		this.lexes = lexes; // lexical categories the affix can attach to
		this.checkConditions = checkConditions; // check if an affix has been applied to a word
		this.apply = apply; // apply the affix to a word
	}
	
	getLemma(){
		return this.lemma;
	}
	
	appliesTo(word){
		return this.checkConditions(word);
	}
	
	getLexes(){
		return this.lexes;
	}
}

class Word{
	constructor(lemma, lex, affixes){
		this.form = this.lemma = lemma.toLowerCase();
		this.lex = lex;
		if (typeof affixes !== 'undefined'){
			this.affixes = affixes;
			this.updateForm();
		} else{
			this.affixes = [];
		}
	}
	
	getLex(){
		return this.lex;
	}
	
	getForm(){
		return this.form;
	}
	
	getLemma(){
		return this.lemma;
	}
	
	getAffixes(){
		return this.affixes.slice();
	}
	
	updateForm(){
		this.form = this.lemma;
		for(let affix of this.affixes){
			this.form = affix.apply(this.form);
		}
	}
	
	addAffix(affix){
		this.affixes.push(affix);
		this.updateForm();
	}
}

class Translator{
	constructor(dict, affixes){
		this.dict = dict;
		this.affixes = affixes;
		this.patterns = []; // patterns to search for

		for (let key in this.dict) {
			if (this.dict.hasOwnProperty(key)) {
				this.patterns.push(new Word(key, dict[key].getLex()));
			}
		}
		
		this.patterns = this.getPossibleForms(this.patterns);
	}
	
	getPossibleForms(keys){
		let poss = keys; // possible combos of words/phrases and affixes
		for(let affix of this.affixes){
			for(let key of poss){
				if(affix.appliesTo(key) && !(key.getAffixes().includes(affix))){
					let newAffixes = key.getAffixes();
					newAffixes.push(affix);
					let word = new Word(key.getLemma(), key.getLex(), newAffixes);
					poss.push(word);
				}
			}
		}
		
		// some entries should be searched for first 
		// - e.g. "there be not" should be applied before "there be"
		this.patterns.sort((a, b) => {return b.getForm().length - a.getForm().length;});
		return poss;
	}
	
	getEmojis(){
		let emojis = [];
		if(Math.floor(Math.random()*2 % 2)){
			emojis.push("🤓");
		}
		if(Math.floor(Math.random()*2 % 2)){
			emojis.push("👆");
		}
		if(Math.floor(Math.random()*2 % 2)){
			emojis.push("💻");
		}
		
		return emojis.join("");
	}
	
	translate(text){
		
		for(let pattern of this.patterns){
			let translation = new Word(this.dict[pattern.getLemma()].getLemma(), pattern.getLex(), pattern.getAffixes());
			
			let reg_add = "(\\b|$)";
			
			let reg = new RegExp(pattern.getForm() + reg_add, "g");
			text = text.replace(reg, translation.getForm());
			
			// replace, when the first letter is capitalized
			let upperP = pattern.getForm();
			let firstP = upperP.charAt(0).toUpperCase();
			upperP = firstP + upperP.slice(1);
			reg = new RegExp(upperP + reg_add, "g");
			
			
			let upperW = translation.getForm();
			let firstW = upperW.charAt(0).toUpperCase();
			upperW = firstW + upperW.slice(1);
			
			text = text.replace(reg, upperW);
			
			// replace, when the whole word is capitalized
			upperP = upperP.toUpperCase();
			upperW = upperW.toUpperCase();
			reg = new RegExp(upperP + reg_add, "g");
			
			text = text.replace(reg, upperW);
			
			// replace ignoring case (translation will be lower case)
			reg = new RegExp(upperP + reg_add, "ig");
			text = text.replace(reg, upperW.toLowerCase());
		}
		
		text = [text,this.getEmojis()].join(" ");
		
		return text;
	}
}

function setUpAffixes(){
	let affixes = [];
	
	// past -ed
	affixes.push(new Affix("ed", [2,3,4], (word) => {
			return [2,3,4].includes(word.getLex());
		
		},	(form) => {
			if(form.includes("be")){
				form = form.replace("be", "were");
			} else if(form.includes("split")){
				return form;
			} else if(form.split(" ").length > 1){
				let words = form.split(" ");
				if(words[0].endsWith("e")){
					words[0] += "d";
				} else if(words[0].endsWith("y")){
					words[0] = words[0].slice(0, words[0].length - 1) + "ied";
				} else {
					words[0] += "ed";
				}
				form = words.join(" ");
			} else{
				if(form.endsWith("e")){
					form += "d";
				} else if(form.endsWith("y")){
					form = form.slice(0, form.length - 1) + "ied";
				} else {
					form += "ed";
				}
			}
			return form;
		}
	));
	
	// 3rd person sing -s
	affixes.push(new Affix("s", [2,3,4], (word) => {
			return [2,3,4].includes(word.getLex()) && !(word.getAffixes().includes(affixes[0]));			
		},	(form) => {
			if(form.includes("be")){
				form = form.replace("be", "is");
			} else if(form.includes("were")){
				form = form.replace("were", "was");
			} else if(form.startsWith("there")){
				form += "s";
			} else if(form.split(" ").length > 1){
				let words = form.split(" ");
				if(words[0].endsWith("h") || words[0].endsWith("s")){
					words[0] += "e";
				}
				words[0] += "s";
				form = words.join(" ");
			} else{
				if(form.endsWith("h") || form.endsWith("s")){
					form += "e";
				}
				form += "s";
			}
			return form;
		}
	));
	
	// negative n't
	affixes.push(new Affix("n't", [2,3,4], (word) => {
			return [2,3,4].includes(word.getLex());
		},	(form) => {
			if(form.includes("is") || form.includes("are") || form.includes("was") || form.includes("were")){
				form = form.replace("is", "isn't");
				form = form.replace("are", "isn't");
				form = form.replace("was", "wasn't");
				form = form.replace("were", "weren't");
			} else if(form.split(" ").length > 1){
				let words = form.split(" ");
				words[0] += "n't";
				form = words.join(" ");
			} else{
				form += "n't";
			}
			return form;
		}
	));
	
	// -ing
	affixes.push(new Affix("ing", [2,3,4], (word) => {
			return [2,3,4].includes(word.getLex()) && !(word.getAffixes().includes(affixes[0]) || word.getAffixes().includes(affixes[1]) || word.getAffixes().includes(affixes[2]));
		}	,(form) => {
			if(form.includes("be")){
				form = form.replace("be", "being");
			} else if(form.split(" ").length > 1){
				let words = form.split(" ");
				if(words[0].endsWith("e")){
					words[0] = words[0].slice(0, words[0].length - 1);
				}
				words[0] += "ing";
				form = words.join(" ");
			} else{
				if(form.endsWith("e")){
					form = form.slice(0, form.length - 1);
				}
				
				form += "ing";
			}
			return form;
		}
	));
	
	// plural -s
	affixes.push(new Affix("s", [1], (word) => {
			return [1].includes(word.getLex());
		}	,(form) => {
			if(form.includes("person")){
				return form.replace("person", "people");
			}
			if(form.endsWith("h") || form.endsWith("s")){
				form += "e";
			}
			form += "s";
			return form;
		}
	));
	
	// it - only matters for phrasal verbs e.g. "split (it) up"
	affixes.push(new Affix("it", [4], (word) => {
			return [4].includes(word.getLex()) && word.getForm().split().length > 1;
		}	,(form) => {
			let words = form.split(" ");
			if(words.length == 1){
				return form;
			}
			words[0] += " it";
			form = words.join(" ");
			return form;
		}
	));
	
	// them - only matters for phrasal verbs e.g. "split (them) up"
	affixes.push(new Affix("them", [4], (word) => {
			return [4].includes(word.getLex()) && word.getForm().split().length > 1 && !(word.getAffixes().includes(affixes[5]));
		}	,(form) => {
			let words = form.split(" ");
			if(words.length == 1){
				return form;
			}
			words[0] += " them";
			form = words.join(" ");
			return form;
		}
	));
	
	// comparative -er
	affixes.push(new Affix("er", [0], (word) => {
			return [0].includes(word.getLex());
		}	,(form) => {
			if(form.split(" ").length > 1){
				return ["more", form].join(" ");
			}
			
			// roughly assuming if the word has lots of vowels/syllables e.g. "efficient" it uses "more"
			let sum_vowels = 0;
			let vowels = ['a', 'e', 'i', 'o', 'u', 'y'];
			for(let letter of form){
				if(vowels.includes(letter)){
					sum_vowels ++;
					if(sum_vowels > 2){
						return ["more", form].join(" ");
					}
				}
			}
			
			if(form.endsWith("y")){
				form = form.slice(0, form.length - 1);
			}
			form += "er";
			
			return form;
		}
	));
	
	// superlative -est
	affixes.push(new Affix("est", [0], (word) => {
			return [0].includes(word.getLex());
		},	(form) => {
			if(form.split(" ").length > 1){
				return ["most", form].join(" ");
			}
			
			// roughly assuming if the word has lots of vowels/syllables e.g. "efficient" it uses "most"
			let sum_vowels = 0;
			let vowels = ['a', 'e', 'i', 'o', 'u', 'y'];
			for(let letter of form){
				if(vowels.includes(letter)){
					sum_vowels ++;
					if(sum_vowels > 2){
						return ["most", form].join(" ");
					}
				}
			}
			
			if(form.endsWith("y")){
				form = form.slice(0, form.length - 1);
			}
			form += "est";
			
			return form;
		}
	));
	
	return affixes;
}

function setup(){
	// 0 - adjective, 1 - noun, 2 - verb, 3 - phrase/adverb, 4 - phrasal verb, 5 - uninflected
	
	const to_dict = {};
	to_dict["unrelated"] = new Word("orthogonal", 0);
	to_dict["slight"] = new Word("nonzero", 0);
	to_dict["chance"] = new Word("probability", 1);
	to_dict["similar"] = new Word("isomorphic", 0);
	to_dict["alike"] = new Word("isomorphic", 0);
	to_dict["considerable"] = new Word("nontrivial", 0);
	to_dict["unimportant"] = new Word("trivial", 0);
	to_dict["very few"]= new Word("a negligible number of", 5);
	to_dict["there be"] = new Word("there exist", 2);
	to_dict["there be not"] = new Word("there do not exist", 2);
	to_dict["there are"] = new Word("there exist", 2);
	to_dict["there are not"] = new Word("there do not exist", 2);
	to_dict["there's"] = new Word("there's", 2);
	to_dict["group"] = new Word("subset", 1);
	to_dict["so that"] = new Word("such that", 3);
	to_dict["a bit"] = new Word("by epsilon", 3);
	to_dict["a little bit"] = new Word("by epsilon", 3);
	to_dict["mental energy"] = new Word("signal-to-noise ratio", 1);
	to_dict["size"] = new Word("magnitude", 1);
	to_dict["enough"] = new Word("a critical mass of", 5);
	to_dict["split up"] = new Word("parallelize", 4);
	to_dict["crossover"] = new Word("intersection", 1);
	to_dict["overlap"] = new Word("intersect", 2);
	to_dict["yes"] = new Word("this is a true statement", 5);
	to_dict["no"] = new Word("negative", 5);
	to_dict["effect"] = new Word("corollary", 1);
	to_dict["interact"] = new Word("interface", 2);
	to_dict["in other words"] = new Word("equivalently", 5);
	to_dict["everyone"] = new Word("for every x such that x is a person", 5);
	to_dict["fast"] = new Word("efficient", 0);
	to_dict["eventually"] = new Word("asymptotically", 3);
	to_dict["eventual"] = new Word("asymptotic", 3);
	to_dict["only so many"] = new Word("only up to n", 5);
	to_dict["hello"] = new Word("greetings", 5);
	to_dict["nerd"] = new Word("normal, respectable person", 1);
	to_dict["trend"] = new Word("trendline", 1);
	to_dict["association"] = new Word("correlation", 1);
	to_dict["associate"] = new Word("correlate", 0);
	to_dict["when"] = new Word("under which conditions", 0);
	to_dict["what is"] = new Word("find x such that x is", 0);
	
	let affixes = setUpAffixes();
	
	return [to_dict, affixes];
}

function main(){
	const [to_dict, affixes] = setup();
	
	let to_nerd_trans = new Translator(to_dict, affixes);
	
	let button = document.getElementById("translate");
	button.addEventListener("click",() => {
		let output = document.getElementById("output");
		let input = document.getElementById("input");
		output.value = to_nerd_trans.translate(input.value);
	});
	
	window.addEventListener("keydown", (e) => {
		if(e.which == 13 && !(e.shiftKey)){
			e.preventDefault();
			let output = document.getElementById("output");
			let input = document.getElementById("input");
			output.value = to_nerd_trans.translate(input.value);
		}
	});
}

main();