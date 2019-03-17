           function choosewrapper(c){
                if (app.get().game.displayinfo.allowformultipleselections){
                    app.multiplechoose(c);
                }
                else{
                    app.choose([c]);
                }
            };
            function multiplechoose(choice){
				let game = app.get().game;
				if ( !game.choices.includes(choice) ) {
					game.choices.push(choice);
					choice.selected=true;
				}
				else{
					let i = game.choices.indexOf(choice);
					choice.selected=false;
					game.choices.splice(i,1);
				}
				app.send({
					'game':game
				});
			};
            function choose(choices){
				let game = app.get().game;
                game.options=[];
                for (let i in choices){
					choices[i].selected=false;
				}
				game[game.displayinfo.choice_label]=choices;
				app.send({
					'game':game
                });
                game.displayinfo.callback();
				//document.dispatchEvent(new Event('choicemade'));
			};
           function  offer (
                skippable /*option to skip | sets game.displayinfo.showoptiontoskip=boolean */,
                multiple /*allows multiple choices | sets game.displayinfo.allowformultipleselections=boolean */, 
                [field_label, choices] /* available cards to choose from | game.displayinfo.selectionzone={'hand|discard|options|planets|research|rolecards'}, sets choices=array if specified*/, 
                choice_label='choices' /* label for where the choice is stored | set with game[label]=*/,
                callback=app.phasefinishfunction /*callback that handles the choice or finishes the phase*/, 
            ) {
                let {game:game} = app.get();
                game.displayinfo.selectionzone=field_label;
                game.displayinfo.allowformultipleselections=multiple;
                game.displayinfo.showoptiontoskip=skippable;
                game.displayinfo.choicelabel=choice_label;
                game.displayinfo.callback=callback;
                if (field_label == 'hand'){
                    choices = app.get().game.acting_player.hand;
                } else if (field_label == 'research') {
                    choices = app.get().game.research_deck;
                } else if (field_label == 'discard'){
                    choices = app.get().game.acting_player.discard;
                } else if (field_label == 'planets') {
                    choices = app.get().game.planet_deck
                } else if (field_label == 'rolecards'){
                    choices = app.get().game.stacks.rolecards;
                } else if (field_label == 'unsettled_planets') {
                    choices = app.get().game.acting_player.unsettled_planets
                } else if (field_label == 'settled_planets'){
                    choices = app.get().game.acting_player.settled_planets;
                } else if (field_label == 'conquered_planets'){
                    choices = app.get().game.acting_player.conquered_planets;
                } else if (field_label == 'settled_&_conquered_planets'){
                    choices = [...app.get().game.acting_player.settled_planets, ...app.get().game.acting_player.conquered_planets];

                } else if (field_label == 'options') {
                }
				if (skippable) {choices.push({'name':"Skip"})};
				if (multiplechoice) {choices.push({'name':"Choose All Selected"})};
				app.present_as_choice(choices);

            };
			function offer (skippable, multiplechoice, _choices, callback){
				let choices = [..._choices];
				let game = app.get().game;
				let [,,,,...arr] = arguments;
				let callbackwrapper = (e)=> { 
					let condition1 = game.choices.length == 0;
					let condition2 = game.choices.length > 1;
					if (game.choices[0].name=='Skip') {callback=app.phasefinishfunction;}
					if (condition1&&skippable) {callback('skipped')}
					else if (condition1&&!skippable) {app.present_as_choice(choices);}
					else if (condition2&&!multiplechoice) {app.present_as_choice(choices);}
					else {
						document.removeEventListener('choicemade',callbackwrapper);
						callback(game.choices,...arr);
					}
				};
				if (skippable) {choices.push({'name':"Skip"})};
				if (multiplechoice) {choices.push({'name':"choose selected items"})};
				app.present_as_choice(choices);
				document.addEventListener('choicemade', callbackwrapper);
			};
phase = 
    {'gamephases':[
        //logic for detecting startofgame, endofgame, changeofpriority, and reseting the phasequeue
        {'start':[
            {'set active player':()=>{
                if (!app.get().game.started){
                    let game = app.get().game;
                    game.started = true;
                    game.passt=false;
                    app.set({'game':game});
                    app.pass_turn();
                    
                }
                app.phasefinishfunction();
            }}
        ]},
        //action selection
        //action execution
        //placeholder phase for action to push it's own phases to the queue
            // action name : total subphases
            // colonize : 5 (can conjoin to 4)
            //     settle or colonize
            //      -> choose planet
            //         -> settle
            //      -> choose planet
            //         -> colonize
            // producetrade : 5
            //      produce or trade
            //      -> select an empty productionzone
            //          -> produce
            //      -> select an occupied productionzone
            //          -> trade
            // politics : 3
            //      choose card from center row
            //          -> politics
            // research : 2
            //      choose card(s) from hand
            //      -> research
            // survey : 1
            //      -> survey
            // warfare : 4
            //      attack or collect
            //          -> collect
            //          -> choose planet
            //              -> conquer
            // improved_colonize : 8
            //      optional settle or no
            //      -> choose planet
            //         -> settle
            //      settle or colonize
            //      -> choose planet
            //         -> settle
            //      -> choose planet
            //         -> colonize
            // improved_produce : 4
            //      -> select an empty productionzone (optional)
            //          -> produce
            //              -> select an empty productionzone (optional)
            //                  -> produce
            // improved_trade : 1
            //      -> improved_trade
            // improved_research : 2
            //      choose card(s) from hand
            //      -> improved_research
            // improved_survey : 1
            //      -> improved_survey
            // improved_warfare : 4
            //      attack or collect
            //      -> collect 
            //      -> choose planet
            //           -> conquer
            // mobilization : 4
            //      -> mobilization
            //      choose wether to attack (post role phase)
            //      -> choose planet
            //          -> conquer
            // survey_team : 1
            //      -> survey_team
            // war_path : 4
            //      choose a planet (optional)
            //         -> conquer
            //              choose a planet (optional)
            //                  -> conquer
            // terraforming : 2
            //      choose planet
            //      -> terraforming
            // genetic_engineering :1
            //      -> genetic_engineering
            // artificial_intelligence : 4
            //      choose center row card
            //          -> artificial_intelligence
            //              choose center row card
            //                  -> artificial_intelligence
            // diverse_markets : 1
            //      -> diverser_markets
            // specialization : 2
            //      choose resource type
            //          ->specialization
            // data_network : 3
            //      -> data_network
            //      choose card(s) from hand
            //          -> research

        {'action':[
            {'offer selection of Actions or to move on':()=>{
                let game = app.get().game;
                game.displayinfo.selectionzone='hand';
                game.displayinfo.allowformultipleselections=false;
                game.displayinfo.showoptiontoskip=true;
                app.send({'game':game});
                app.offer(true/*option to skip*/, 
                    false/*allows multiple choices*/, 
                    app.get().game.acting_player.hand/* available cards to choose from*/, 
                    app.performcardaction/*callback that handles the choice*/, 
                    app.phasefinishfunction /*callback that notifies parent functions that the action has been finished*/);
            }}
        ]},
       
        // role selection (offers roles)
        // sets selected role as selected, 
        {'role':[
            {'offer selection of role':()=>{
                let game = app.get().game;
                game.displayinfo.center_or_planets=true;
                game.displayinfo.selectionzone='rolecards';
                game.displayinfo.allowformultipleselections=false;
                game.displayinfo.showoptiontoskip=false;
                app.send({'game':game});
                app.offer(false/*option to skip*/, 
                    false/*allows multiple choices*/, 
                    app.get().game.stacks.rolecards/* available cards to choose from*/, 
                    app.selectcentercardrole/*callback that handles the choice*/, 
                    app.phasefinishfunction /*callback that notifies parent functions that the action has been finished*/);
            }}
        ]},
        
        //boosting cards offer
        //boosting cards selection
        //role execution (
            // modifies game state in prep,
            // pushes new phases to the queue)
        //placeholder phase for role to push it's own phases to the queue
        //placeholder phase for role to push it's own phases to the queue
            // action name : total subphases
            // colonize : 5 (can conjoin to 4)
            //     settle or colonize
            //      -> choose planet
            //         -> settle
            //      -> choose planet
            //         -> colonize
            // producetrade : 5
            //      produce or trade
            //      -> select an empty productionzone
            //          -> produce
            //      -> select an occupied productionzone
            //          -> trade
            // research : 2
            //      choose card(s) from hand
            //      -> research
            // survey : 1
            //      -> survey
            // warfare : 4
            //      attack or collect
            //          -> collect
            //          -> choose planet
            //              -> conquer
        {'lead':[
            {'offer selection of card to boost' :()=>{
                let game = app.get().game;
                game.displayinfo.selectionzone='hand';
                game.displayinfo.allowformultipleselections=true;
                game.displayinfo.showoptiontoskip=true;
                app.send({'game':game});
                app.offer(true/*option to skip*/, 
                    true/*allows multiple choices*/, 
                    app.get().game.acting_player.hand/* available cards to choose from*/, 
                    app.boostrolewithcards/*callback that handles the choice*/, 
                    app.phasefinishfunction /*callback that notifies parent functions that the action has been finished*/);
            }},
            {'perform leader role':()=>{
                app.get().game.acting_player.activerole.
                performleaderrole(
                    app.phasefinishfunction /*callback that notifies parent functions that the action has been finished*/);
            }},
            {'pass role to next player':()=>{
                let callbackwrapper=()=>{
                    document.removeEventListener('pass_priority', callbackwrapper);
                    app.phasefinishfunction();
                    let game = app.get().game;
                    game.passp=false;
                    app.send({'game':game});
                }
                let game = app.get().game;
                game.displayinfo.selectionzone='';
                game.passp=true;
                app.send({'game':game});
                document.addEventListener('pass_priority', callbackwrapper);
            }},
        ]},
        //dissent offer
        //dissent or follow selection
        //boosting cards offer
        //boosting cards selection
        //role execution (
            // modifies game state in prep,
            // pushes new phases to the queue)
        //placeholder phase for role to push it's own phases to the queue
            // action name : total subphases
            // colonize : 5 (can conjoin to 4)
            //     settle or colonize
            //      -> choose planet
            //         -> settle
            //      -> choose planet
            //         -> colonize for each symbol
            // produce : 2
            //      -> select an empty productionzone for each symbol
            //          -> produce
            // trade : 2
            //      -> select an occupied productionzone for each symbol
            //          -> trade
            // research : 2
            //      choose card from research pile
            //      -> choose side (situational)
            //          -> research
            // survey : 1
            //      -> explore for each symbol
            //      choose planet
            //      -> survey
            // warfare : 4
            //      attack or collect
            //          -> collect fighter for each symbols
            //          -> choose planet
            //              -> conquer
        {'follow':[
            {'offer follow or dissent':()=>{
                let dissentofferable = {name:'Dissent'};
                let game = app.get().game;
                game.displayinfo.selectionzone='options';
                game.displayinfo.allowformultipleselections=false;
                game.displayinfo.showoptiontoskip=false;
                app.send({'game':game});
                app.offer(false/*option to skip*/, 
                    false/*allows multiple choices*/, 
                    [app.get().game.leadingplayer.activerole.role,
                        dissentofferable], 
                    app.followcentercardrole/*callback that handles the choice*/, 
                    app.phasefinishfunction /*callback that notifies parent functions that the action has been finished*/)
            }},
            {'offer boost':()=>{
                if (app.get().game.choices[0].name=='Dissent'){
                    app.phasefinishfunction();
                }
                else {
                    let game = app.get().game;
                    game.displayinfo.selectionzone='hand';
                    game.displayinfo.allowformultipleselections=true;
                    game.displayinfo.showoptiontoskip=true;
                    app.send({'game':game});
                    app.offer(true/*option to skip*/, 
                        true/*allows multiple choices*/, 
                        app.get().game.acting_player.hand/* available cards to choose from*/, 
                        app.boostrolewithcards/*callback that handles the choice*/, 
                        app.phasefinishfunction /*callback that notifies parent functions that the action has been finished*/);
                }
            }}, //will auto pass to next phase if dissent has been selected
            {'perform follower action':()=>{
                if (app.get().game.choices[0].name=='Dissent'){
                    app.phasefinishfunction();
                }
                else {
                    app.get().game.acting_player.activerole.
                    performfollowerrole(
                        app.phasefinishfunction /*callback that notifies parent functions that the action has been finished*/);
                }
            }}, //will auto pass to next phase if dissent has been selected
            {'dissent':()=>{
                if (app.get().game.choices[0].name=='Dissent'){
					let game = app.get().game;
					app.draw(game.acting_player);
					app.send({'game':game});
                }
				app.phasefinishfunction();
            }}, //will auto pass to next phase if follow has been selected
            {'pass role to next player':()=>{
                let callbackwrapper=()=>{
                    document.removeEventListener('pass_priority', callbackwrapper);
                    let game = app.get().game;
                    game.displayinfo.selectionzone='';
                    game.displayinfo.allowformultipleselections=false;
                    game.displayinfo.showoptiontoskip=false;
                    game.passp=false;
                    app.send({'game':game});
                    app.phasefinishfunction();
                    
                }
                let game = app.get().game;
                game.displayinfo.selectionzone='';
                game.passp=true;
                app.send({'game':game});
                document.addEventListener('pass_priority', callbackwrapper);
            }}, //will auto pass to the next phase if the next player has alread lead, followed, or dissented
        ]},

        //discard : 2
        //  select card(s) from hand
        //  -> discard
        {'discard':[
            {'offer discard selection':()=>{
                let game = app.get().game;
                game.displayinfo.selectionzone='hand';
                game.displayinfo.allowformultipleselections=true;
                game.displayinfo.showoptiontoskip=true;
                app.send({'game':game});
                app.offer(true/*option to skip*/, 
                    true/*allows multiple choices*/, 
                    app.get().game.acting_player.hand/* available cards to choose from*/, 
                    app.discardcardsfromhand/*callback that handles the choice*/, 
                    app.phasefinishfunction /*callback that notifies parent functions that the action has been finished*/);
            }}
        ]},
        //cleanup : 1
        //  -> cleanup
        {'cleanup':[
            {'draw up to hand size':()=>{
                let game = app.get().game;
                let handsize = game.acting_player.handsize;
                for (let index in game.acting_player.settled_planets){
                    handsize+=game.acting_player.settled_planets[index].handsize_modifier;
                }
                for (let index in game.acting_player.conquered_planets){
                    handsize+=game.acting_player.conquered_planets[index].handsize_modifier;
                }
                let l = game.acting_player.hand.length;
                if (l < handsize){
                    app.draw(game.acting_player, handsize-l );
                }
                app.cleanup(game.acting_player.limbo, game.acting_player);
                for (let i in game.players){
                    game.players[i].boostingicons = {'survey':0,'warfare':0,'colonize':0,'produce':0,'trade':0,'research':0};
                }
				app.send({'game':game});
                app.phasefinishfunction();
            }},
            {'pass turn to next player':()=>{
                let callbackwrapper=()=>{
                    document.removeEventListener('pass_turn', callbackwrapper);
                    app.togglepasstoplayer();
                    let game = app.get().game;
                    game.passt=false;
                    app.send({'game':game});
                    app.phasefinishfunction();
                }
                let game = app.get().game;
                game.displayinfo.selectionzone='';
                game.displayinfo.allowformultipleselections=false;
                game.displayinfo.showoptiontoskip=false;
                game.passp=false;
                game.passt=true;
                app.send({'game':game});
                document.addEventListener('pass_turn', callbackwrapper);
            }}
        ]},
    ]};