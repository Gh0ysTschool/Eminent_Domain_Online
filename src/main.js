import App from './App.html';
let nonce = 0;
let game = {
    'passtoplayer':false,
    'nonce':0,
    'displayinfo':{
        'selectionzone':'',
        'dragged':null,
        'showoptiontoskip':false,
        'allowformultipleselections':false,
        'center_or_planets':true, //true = center, false = planets
        'choicelabel':'choices'
    },
    'subchoices':[],
    'influence':[1,1,1,1,1,
        1,1,1,1,1,
        1,1,1,1,1,
        1,1,1,1,1,
        1,1,1,1,1,
        1,1,1,1,1],
    'messagetoplayer':[],
    'options':[],
    'planet_deck':[],
    'currentphase':-4,
    'leading_player_index':0,
    'acting_player_index':0,
    'number_of_players':2,
    'started':false,
    'gamephases':
    [
        //logic for detecting startofgame, endofgame, changeofpriority, and reseting the phasequeue
        {
            'start':
            [
                {
                    'set active player':
                        ()=>{ 
                            if (!app.get().game.started){
                                let game = app.get().game;
                                game.started = true;
                                game.passt=false;
                                app.set({'game':game});
                                game = app.get().game;
                                game.leading_player_index = (game.leading_player_index+1)%game.number_of_players;
                                game.acting_player_index=game.leading_player_index;
                                game.leadingplayer = game.players[game.leading_player_index];
                                game.acting_player = game.players[game.leading_player_index];
                                app.set({'game':game});
                                app.openFullscreen();
                            }
                            let game = app.get().game;
                            if (game.leadingplayer.rounds!==undefined){
                                game.players[game.leading_player_index].rounds++;
                            }
                            let planets = [...game.players[game.leading_player_index].settled_planets,...game.players[game.leading_player_index].conquered_planets];
                            for (let p in planets){
                                game.players[game.leading_player_index].icons.survey+= planets[p].icons.survey;
                                game.players[game.leading_player_index].icons.warfare+= planets[p].icons.warfare;
                                game.players[game.leading_player_index].icons.trade+= planets[p].icons.trade;
                                game.players[game.leading_player_index].icons.produce+= planets[p].icons.produce;
                                game.players[game.leading_player_index].icons.research+= planets[p].icons.research;
                            }
                            for (let p in game.players[game.leading_player_index].permanents){
                                game.players[game.leading_player_index].icons.survey+= permanents[p].icons.survey;
                                game.players[game.leading_player_index].icons.warfare+= permanents[p].icons.warfare;
                                game.players[game.leading_player_index].icons.trade+= permanents[p].icons.trade;
                                game.players[game.leading_player_index].icons.produce+= permanents[p].icons.produce;
                                game.players[game.leading_player_index].icons.research+= permanents[p].icons.research;
                            }
                            app.set({'game':game});
                            app.phasefinishfunction(true);
                        }
                },
                {
                    'Productivity':()=>{
                        if (app.get().game.players[app.get().game.acting_player_index].permanents.filter( (el)=>{return el.type=='productivity'} ).length != 0){
                            let game = app.get().game;
                            game.players[app.get().game.acting_player_index].actionrolesequence = 'aar';
                            app.set({'game':game});
                        }
                        app.phasefinishfunction();
                    }
                },
                {
                    'Choose an Order to Perform Your Action and Role Phases':()=>{
                        if (app.get().game.players[app.get().game.acting_player_index].permanents.filter( (el)=>{return el.type=='logistics'} ).length != 0){
                            let options = [{name:'Action Phase then Role Phase'}, {name:'Role Phase then Action Phase'}];
                            if (app.get().game.players[app.get().game.acting_player_index].permanents.filter( (el)=>{return el.type=='productivity'} ).length != 0){
                                //add aar,ara,and raa as options
                                options.push({name:'Action Phase then another Action Phase then Role Phase'});
                                options.push({name:'Action Phase then Role Phase then another Action Phase'});
                                options.push({name:'Role Phase then Action Phase then another Action Phase'});
                            }
                            //offer ar or ra
                            app.offer(
                                false /*option to skip | sets game.displayinfo.showoptiontoskip=boolean */,
                                false /*allows multiple choices | sets game.displayinfo.allowformultipleselections=boolean */, 
                                ['options', options] /* available cards to choose from | game.displayinfo.selectionzone={'hand|discard|options|planets|research|rolecards'}, sets choices=array if specified*/, 
                                'choices' /* label for where the choice is stored | set with game[label]=*/,
                                app.phasefinishfunction /*callback that handles the choice or finishes the phase*/, 
                            );
                        } else {
                            app.phasefinishfunction();
                        }
                    }
                },
                {
                    'Logistics':()=>{
                        if (app.get().game.players[app.get().game.acting_player_index].permanents.filter( (el)=>{return el.type=='logistics'} ).length != 0){
                            let game = app.get().game;
                            if (app.get().game.choices[0].name == 'Action Phase then Role Phase'){game.players[app.get().game.acting_player_index].actionrolesequence='ar';}
                            else if (app.get().game.choices[0].name == 'Role Phase then Action Phase'){game.players[app.get().game.acting_player_index].actionrolesequence='ra';}
                            else if (app.get().game.choices[0].name == 'Action Phase then another Action Phase then Role Phase'){game.players[app.get().game.acting_player_index].actionrolesequence='aar';}
                            else if (app.get().game.choices[0].name == 'Action Phase then Role Phase then another Action Phase'){game.players[app.get().game.acting_player_index].actionrolesequence='ara';}
                            else if (app.get().game.choices[0].name == 'Role Phase then Action Phase then another Action Phase'){game.players[app.get().game.acting_player_index].actionrolesequence='raa';}
                            app.set({'game':game});
                            app.phasefinishfunction(true);
                        } else {
                            app.phasefinishfunction();
                        }
                    }
                }
            ]
        },
        //check for permanent tech logistics
        //offer wether to perform the role or the action phases first
        //simply add an extra action phase that occurs if the role was choosen first, set all action phase one's to cancel if role was choosen first

        // action : 2
        //      choose from hand an action to play or skip
        //      -> set as activeaction
        {
            'action':
            [
                //check for permanent tech productivity
                //add an extra action
                {
                    'Choose an Action to Play':
                        ()=>{
                            app.offer(
                                true /*option to skip | sets game.displayinfo.showoptiontoskip=boolean */,
                                false /*allows multiple choices | sets game.displayinfo.allowformultipleselections=boolean */, 
                                ['hand'] /* available cards to choose from | game.displayinfo.selectionzone={'hand|discard|options|planets|research|rolecards'}, sets choices=array if specified*/, 
                                'choices' /* label for where the choice is stored | set with game[label]=*/,
                                app.phasefinishfunction /*callback that handles the choice or finishes the phase*/, 
                            );
                         }
                },
                {
                    'Playing your Action':
                        ()=>{
                            if (app.get().game.choices[0].name == 'Skip'){
                                app.phasefinishfunction();
                            } else { 
                                let { game:game, 
                                    game:{
                                        acting_player:player,
                                        acting_player:{
                                            limbo:limbo,
                                            hand:hand
                                        },
                                        choices:[card]
                                    }
                                } = app.get();
                                player = game.players[game.acting_player_index];
                                limbo = player.limbo;
                                hand = player.hand;
                                player.activeaction=card.type;
                                limbo = limbo.filter(
                                    (el)=>{return card.identifier != el.identifier;}
                                );
                                limbo.push(
                                    {'final_destination_label':'discard', 
                                    ...card
                                    }
                                );
                                 hand = hand.filter(
                                    (el)=>{return card.identifier != el.identifier}
                                );
                                player.limbo = limbo;
                                player.hand=hand;
                                game.players[app.get().game.acting_player_index] = player;
                                app.set({'game':game});
                                app.phasefinishfunction(true);

                            }
                        }
                },
                // #######################################################################################################################################################################################
                // colonize : 5 (can conjoin to 4)
                //     settle or colonize
                //      -> choose planet
                //         -> settle
                //      -> choose planet
                //         -> colonize
                {
                    'Choose between Settling or Colonizing a Planet':
                        ()=>{   
                            if (app.get().game.players[app.get().game.acting_player_index].activeaction!='colonize'){
                                app.phasefinishfunction();
                            } else {    
                                app.offer(
                                    false /*option to skip | sets game.displayinfo.showoptiontoskip=boolean */,
                                    false /*allows multiple choices | sets game.displayinfo.allowformultipleselections=boolean */, 
                                    ['options', [{name:'Colonize'}, {name:'Settle Colonies'}]] /* available cards to choose from | game.displayinfo.selectionzone={'hand|discard|options|planets|research|rolecards'}, sets choices=array if specified*/, 
                                    'choices' /* label for where the choice is stored | set with game[label]=*/,
                                    app.phasefinishfunction /*callback that handles the choice or finishes the phase*/, 
                                );
                            }
                        }
                },
                {
                    'Choose an Unsettled Planet to Settle':
                        ()=>{        
                            if (app.get().game.players[app.get().game.acting_player_index].activeaction != 'colonize' || app.get().game.choices[0].name != 'Settle Colonies'){
                                app.phasefinishfunction();
                            } else {    
                                app.offer(
                                    false /*option to skip | sets game.displayinfo.showoptiontoskip=boolean */,
                                    false /*allows multiple choices | sets game.displayinfo.allowformultipleselections=boolean */, 
                                    ['unsettled_planets'] /* available cards to choose from | game.displayinfo.selectionzone={'hand|discard|options|planets|research|rolecards'}, sets choices=array if specified*/, 
                                    'subchoices' /* label for where the choice is stored | set with game[label]=*/,
                                    app.phasefinishfunction /*callback that handles the choice or finishes the phase*/, 
                                );
                            }
                        }
                },
                {
                    'Settling your Planet':
                        ()=>{        
                            if (app.get().game.players[app.get().game.acting_player_index].activeaction != 'colonize' || app.get().game.choices[0].name != 'Settle Colonies'){
                                app.phasefinishfunction();
                            } else {   
                                app.settle_colonies(app.get().game.subchoices[0], app.get().game.players[app.get().game.acting_player_index]);
                                app.phasefinishfunction(true);
                            }
                        }
                },
                {
                    'Choose an Unsettled Planet to Colonize':
                        ()=>{        
                            if (app.get().game.players[app.get().game.acting_player_index].activeaction != 'colonize' || app.get().game.choices[0].name != 'Colonize'){
                                app.phasefinishfunction();
                            } else {    
                                app.offer(
                                    false /*option to skip | sets game.displayinfo.showoptiontoskip=boolean */,
                                    false /*allows multiple choices | sets game.displayinfo.allowformultipleselections=boolean */, 
                                    ['unsettled_planets'] /* available cards to choose from | game.displayinfo.selectionzone={'hand|discard|options|planets|research|rolecards'}, sets choices=array if specified*/, 
                                    'subchoices' /* label for where the choice is stored | set with game[label]=*/,
                                    app.phasefinishfunction /*callback that handles the choice or finishes the phase*/, 
                                );
                            }
                        }
                },
                {
                    'Colonizing your Planet':
                        ()=>{        
                            if (app.get().game.players[app.get().game.acting_player_index].activeaction != 'colonize' || app.get().game.choices[0].name != 'Colonize'){
                                app.phasefinishfunction();
                            } else {
                                app.colonize(app.get().game.subchoices[0], app.get().game.players[app.get().game.acting_player_index].limbo , app.get().game.players[app.get().game.acting_player_index].limbo.filter((el)=>{ return el.type == 'colonize'})[0]);
                                app.phasefinishfunction(true);
                            }
                        }
                },
                // #######################################################################################################################################################################################
                // producetrade : 5
                //      produce or trade
                //      -> select an empty productionzone
                //          -> produce
                //      -> select an occupied productionzone
                //          -> trade
                {
                    'Choose between Producing or Trading Resources':
                        ()=>{
                            if (app.get().game.players[app.get().game.acting_player_index].activeaction!='producetrade'){
                                app.phasefinishfunction();
                            } else {    
                                app.offer(
                                    false /*option to skip | sets game.displayinfo.showoptiontoskip=boolean */,
                                    false /*allows multiple choices | sets game.displayinfo.allowformultipleselections=boolean */, 
                                    ['options', [{name:'produce'}, {name:'trade'}]] /* available cards to choose from | game.displayinfo.selectionzone={'hand|discard|options|planets|research|rolecards'}, sets choices=array if specified*/, 
                                    'choices' /* label for where the choice is stored | set with game[label]=*/,
                                    app.phasefinishfunction /*callback that handles the choice or finishes the phase*/, 
                                );
                            }
                        }
                },
                {
                    'Choose a Planet to Produce Resources on':
                        ()=>{        
                            if (app.get().game.players[app.get().game.acting_player_index].activeaction != 'producetrade' || app.get().game.choices[0].name != 'produce'){
                                app.phasefinishfunction();
                            } else {    
                                app.offer(
                                    false /*option to skip | sets game.displayinfo.showoptiontoskip=boolean */,
                                    false /*allows multiple choices | sets game.displayinfo.allowformultipleselections=boolean */, 
                                    ['settled_&_conquered_planets'] /* available cards to choose from | game.displayinfo.selectionzone={'hand|discard|options|planets|research|rolecards'}, sets choices=array if specified*/, 
                                    'subchoices' /* label for where the choice is stored | set with game[label]=*/,
                                    app.phasefinishfunction /*callback that handles the choice or finishes the phase*/, 
                                );
                            }
                        }
                },
                {
                    'Producing a Resource':
                        ()=>{        
                            if (app.get().game.players[app.get().game.acting_player_index].activeaction != 'producetrade' || app.get().game.choices[0].name != 'produce'){
                                app.phasefinishfunction();
                            } else {    
                                app.produce(app.get().game.subchoices);
                                app.phasefinishfunction(true);
                            }
                        }
                },
                {
                    'Choose a Planet to Trade Resources from':
                        ()=>{        
                            if (app.get().game.players[app.get().game.acting_player_index].activeaction != 'producetrade' || app.get().game.choices[0].name != 'trade'){
                                app.phasefinishfunction();
                            } else {    
                                app.offer(
                                    false /*option to skip | sets game.displayinfo.showoptiontoskip=boolean */,
                                    false /*allows multiple choices | sets game.displayinfo.allowformultipleselections=boolean */, 
                                    ['settled_&_conquered_planets'] /* available cards to choose from | game.displayinfo.selectionzone={'hand|discard|options|planets|research|rolecards'}, sets choices=array if specified*/, 
                                    'subchoices' /* label for where the choice is stored | set with game[label]=*/,
                                    app.phasefinishfunction /*callback that handles the choice or finishes the phase*/, 
                                );
                            }
                        }
                },
                {
                    'Trading a Resource':
                        ()=>{        
                            if (app.get().game.players[app.get().game.acting_player_index].activeaction != 'producetrade' || app.get().game.choices[0].name != 'trade'){
                                app.phasefinishfunction();
                            } else {    
                                app.trade(app.get().game.subchoices,app.get().game.players[app.get().game.acting_player_index]);
                                app.phasefinishfunction(true);
                            }
                        }
                },
                //#######################################################################################################################################################################################
                // politics : 2 
                //      choose card from center row
                //          -> politics
                {
                    'Choose a Role Card to Replace Politics with':
                        ()=>{        
                            if (app.get().game.players[app.get().game.acting_player_index].activeaction != 'politics' ){
                                app.phasefinishfunction();
                            } else {    
                                app.offer(
                                    false /*option to skip | sets game.displayinfo.showoptiontoskip=boolean */,
                                    false /*allows multiple choices | sets game.displayinfo.allowformultipleselections=boolean */, 
                                    ['rolecards'] /* available cards to choose from | game.displayinfo.selectionzone={'hand|discard|options|planets|research|rolecards'}, sets choices=array if specified*/, 
                                    'choices' /* label for where the choice is stored | set with game[label]=*/,
                                    app.phasefinishfunction /*callback that handles the choice or finishes the phase*/, 
                                );
                            }
                        }
                },
                {
                    'Swapping the Role Card for your Politics Card':
                    ()=>{        
                        if (app.get().game.players[app.get().game.acting_player_index].activeaction != 'politics' ){
                            app.phasefinishfunction();
                        } else {    
                            app.politics(app.get().game.players[app.get().game.acting_player_index].limbo.filter((el)=>{ return el.type == 'politics'})[0], app.get().game.choices[0], app.get().game.players[app.get().game.acting_player_index]);
                            app.phasefinishfunction(true);
                        }
                    }
                },
                // #######################################################################################################################################################################################
                // research : 2
                //      choose card(s) from hand
                //      -> research
                {
                    'Choose up to 2 Cards from your Hand to Remove from the Game':
                        ()=>{        
                            if (app.get().game.players[app.get().game.acting_player_index].activeaction != 'research' ){
                                app.phasefinishfunction();
                            } else {    
                                app.offer(
                                    false /*option to skip | sets game.displayinfo.showoptiontoskip=boolean */,
                                    true /*allows multiple choices | sets game.displayinfo.allowformultipleselections=boolean */, 
                                    ['hand'] /* available cards to choose from | game.displayinfo.selectionzone={'hand|discard|options|planets|research|rolecards'}, sets choices=array if specified*/, 
                                    'choices' /* label for where the choice is stored | set with game[label]=*/,
                                    app.phasefinishfunction /*callback that handles the choice or finishes the phase*/, 
                                );
                            }
                        }
                },
                {
                    'Removing your Cards from the Game':
                    ()=>{        
                        if (app.get().game.players[app.get().game.acting_player_index].activeaction != 'research' ){
                            app.phasefinishfunction();
                        } else {    
                            app.research(app.get().game.choices, app.get().game.players[app.get().game.acting_player_index]);
                           app.phasefinishfunction(true);
                        }
                    }
                },
                // #######################################################################################################################################################################################
                // survey : 1
                //      -> survey
                {
                    'Surveying your Empire':
                        ()=>{        
                            if (app.get().game.players[app.get().game.acting_player_index].activeaction != 'survey' ){
                               app.phasefinishfunction();
                            } else {    
                                app.survey(app.get().game.players[app.get().game.acting_player_index]);
                                app.phasefinishfunction(true);
                            }
                        }
                },
                // #######################################################################################################################################################################################
                // warfare : 4
                //      attack or collect
                //          -> collect
                //          -> choose planet
                //              -> conquer
                {
                    'Choose between Collecting a Starfighter or Conquering a Planet':
                        ()=>{        
                            if (app.get().game.players[app.get().game.acting_player_index].activeaction != 'warfare' ){
                                app.phasefinishfunction();
                            } else {    
                                app.offer(
                                    false /*option to skip | sets game.displayinfo.showoptiontoskip=boolean */,
                                    false /*allows multiple choices | sets game.displayinfo.allowformultipleselections=boolean */, 
                                    ['options', [{name:'Conquer a Planet'}, {name:'Collect a Starfighter'}]] /* available cards to choose from | game.displayinfo.selectionzone={'hand|discard|options|planets|research|rolecards'}, sets choices=array if specified*/, 
                                    'choices' /* label for where the choice is stored | set with game[label]=*/,
                                    app.phasefinishfunction /*callback that handles the choice or finishes the phase*/, 
                                );
                            }
                        }
                },
                {
                    'Adding a Starfighter to your Fleet':
                    ()=>{        
                        if (app.get().game.players[app.get().game.acting_player_index].activeaction != 'warfare' || app.get().game.choices[0].name!='Collect a Starfighter'){
                            app.phasefinishfunction();
                        } else {    
                            app.warfare(app.get().game.players[app.get().game.acting_player_index]);
                            app.phasefinishfunction(true);
                        }
                    }
                },
                {
                    'Choose a Planet to Conquer':
                    ()=>{        
                        if (app.get().game.players[app.get().game.acting_player_index].activeaction != 'warfare' || app.get().game.choices[0].name!='Conquer a Planet'){
                            app.phasefinishfunction();
                        } else {    
                            app.offer(
                                false /*option to skip | sets game.displayinfo.showoptiontoskip=boolean */,
                                false /*allows multiple choices | sets game.displayinfo.allowformultipleselections=boolean */, 
                                ['unsettled_planets'] /* available cards to choose from | game.displayinfo.selectionzone={'hand|discard|options|planets|research|rolecards'}, sets choices=array if specified*/, 
                                'subchoices' /* label for where the choice is stored | set with game[label]=*/,
                                app.phasefinishfunction /*callback that handles the choice or finishes the phase*/, 
                            );
                        }
                    }
                },
                {
                    'Conquering your planet':
                    ()=>{        
                        if (app.get().game.players[app.get().game.acting_player_index].activeaction != 'warfare' || app.get().game.choices[0].name!='Conquer a Planet'){
                            app.phasefinishfunction();
                        } else {    
                            app.conquer(app.get().game.subchoices[0], app.get().game.players[app.get().game.acting_player_index]);
                            //check for permanent tech scorched earth policy
                            //remove production zone from planet
                            app.phasefinishfunction(true);
                        }
                    }
                },
                // #######################################################################################################################################################################################
                // improved_colonize : 8
                //      optional settle or no
                //      -> choose planet
                //         -> settle
                //      settle or colonize
                //      -> choose planet
                //         -> settle
                //      -> choose planet
                //         -> colonize
                {
                    'Choose wether or not to Settle a Planet ':
                    ()=>{        
                        if (app.get().game.players[app.get().game.acting_player_index].activeaction != 'improved_colonize'){
                            app.phasefinishfunction();
                        } else {    
                            app.offer(
                                true /*option to skip | sets game.displayinfo.showoptiontoskip=boolean */,
                                false /*allows multiple choices | sets game.displayinfo.allowformultipleselections=boolean */, 
                                ['options',[{'name':'settle'},{'name':'Skip'}]] /* available cards to choose from | game.displayinfo.selectionzone={'hand|discard|options|planets|research|rolecards'}, sets choices=array if specified*/, 
                                'choices' /* label for where the choice is stored | set with game[label]=*/,
                                app.phasefinishfunction /*callback that handles the choice or finishes the phase*/, 
                            );
                        }
                    }
                },
                {
                    'Choose a Planet to Settle':
                    ()=>{        
                        if (app.get().game.players[app.get().game.acting_player_index].activeaction != 'improved_colonize' || app.get().game.choices[0].name!='settle'){
                            app.phasefinishfunction();
                        } else {    
                            app.offer(
                                false /*option to skip | sets game.displayinfo.showoptiontoskip=boolean */,
                                false /*allows multiple choices | sets game.displayinfo.allowformultipleselections=boolean */, 
                                ['unsettled_planets'] /* available cards to choose from | game.displayinfo.selectionzone={'hand|discard|options|planets|research|rolecards'}, sets choices=array if specified*/, 
                                'subchoices' /* label for where the choice is stored | set with game[label]=*/,
                                app.phasefinishfunction /*callback that handles the choice or finishes the phase*/, 
                            );
                        }
                    }
                },
                {
                    'Settling your Planet':
                    ()=>{        
                        if (app.get().game.players[app.get().game.acting_player_index].activeaction != 'improved_colonize' || app.get().game.choices[0].name!='settle'){
                            app.phasefinishfunction();
                        } else {    
                            app.settle_colonies(app.get().game.subchoices[0], app.get().game.players[app.get().game.acting_player_index]);
                            // check for permanent tech abundance
                            // change production slots to filled
                            app.phasefinishfunction(true);
                        }
                    }
                },
                {
                    'Choose between Settling or Colonizing a Planet':
                        ()=>{   
                            if (app.get().game.players[app.get().game.acting_player_index].activeaction!='improved_colonize'){
                                app.phasefinishfunction();
                            } else {    
                                app.offer(
                                    false /*option to skip | sets game.displayinfo.showoptiontoskip=boolean */,
                                    false /*allows multiple choices | sets game.displayinfo.allowformultipleselections=boolean */, 
                                    ['options', [{name:'Colonize'}, {name:'Settle Colonies'}]] /* available cards to choose from | game.displayinfo.selectionzone={'hand|discard|options|planets|research|rolecards'}, sets choices=array if specified*/, 
                                    'choices' /* label for where the choice is stored | set with game[label]=*/,
                                    app.phasefinishfunction /*callback that handles the choice or finishes the phase*/, 
                                );
                            }
                        }
                },
                {
                    'Choose an Unsettled Planet to Settle':
                        ()=>{        
                            if (app.get().game.players[app.get().game.acting_player_index].activeaction != 'improved_colonize' || app.get().game.choices[0].name != 'Settle Colonies'){
                                app.phasefinishfunction();
                            } else {    
                                app.offer(
                                    false /*option to skip | sets game.displayinfo.showoptiontoskip=boolean */,
                                    false /*allows multiple choices | sets game.displayinfo.allowformultipleselections=boolean */, 
                                    ['unsettled_planets'] /* available cards to choose from | game.displayinfo.selectionzone={'hand|discard|options|planets|research|rolecards'}, sets choices=array if specified*/, 
                                    'subchoices' /* label for where the choice is stored | set with game[label]=*/,
                                    app.phasefinishfunction /*callback that handles the choice or finishes the phase*/, 
                                );
                            }
                        }
                },
                {
                    'Settling your Planet':
                        ()=>{        
                            if (app.get().game.players[app.get().game.acting_player_index].activeaction != 'improved_colonize' || app.get().game.choices[0].name != 'Settle Colonies'){
                                app.phasefinishfunction();
                            } else {
                                app.settle_colonies(app.get().game.subchoices[0], app.get().game.players[app.get().game.acting_player_index]);
                                // check for permanent tech abundance
                                // change production slots to filled
                                app.phasefinishfunction(true);
                            }
                        }
                },
                {
                    'Choose an Unsettled Planet to Colonize':
                        ()=>{        
                            if (app.get().game.players[app.get().game.acting_player_index].activeaction != 'improved_colonize' || app.get().game.choices[0].name != 'Colonize'){
                                app.phasefinishfunction();
                            } else {    
                                app.offer(
                                    false /*option to skip | sets game.displayinfo.showoptiontoskip=boolean */,
                                    false /*allows multiple choices | sets game.displayinfo.allowformultipleselections=boolean */, 
                                    ['unsettled_planets'] /* available cards to choose from | game.displayinfo.selectionzone={'hand|discard|options|planets|research|rolecards'}, sets choices=array if specified*/, 
                                    'subchoices' /* label for where the choice is stored | set with game[label]=*/,
                                    app.phasefinishfunction /*callback that handles the choice or finishes the phase*/, 
                                );
                            }
                        }
                },
                {
                    'Colonizing your Planet':
                        ()=>{        
                            if (app.get().game.players[app.get().game.acting_player_index].activeaction != 'improved_colonize' || app.get().game.choices[0].name != 'Colonize'){
                                app.phasefinishfunction();
                            } else {    
                                app.colonize(app.get().game.subchoices[0], app.get().game.players[app.get().game.acting_player_index].limbo , app.get().game.players[app.get().game.acting_player_index].limbo.filter((el)=>{ return el.type == 'improved_colonize'})[0]);
                                app.phasefinishfunction(true);
                            }
                        }
                },
                // #######################################################################################################################################################################################
                // improved_produce : 4
                //      -> select an empty productionzone (optional)
                //          -> produce
                //              -> select an empty productionzone (optional)
                //                  -> produce
                {
                    'Choose an empty Production Zone to Produce in':
                        ()=>{        
                            if (app.get().game.players[app.get().game.acting_player_index].activeaction != 'improved_production' ){
                                app.phasefinishfunction();
                            } else {    
                                app.offer(
                                    true /*option to skip | sets game.displayinfo.showoptiontoskip=boolean */,
                                    false /*allows multiple choices | sets game.displayinfo.allowformultipleselections=boolean */, 
                                    ['settled_&_conquered_planets'] /* available cards to choose from | game.displayinfo.selectionzone={'hand|discard|options|planets|research|rolecards'}, sets choices=array if specified*/, 
                                    'choices' /* label for where the choice is stored | set with game[label]=*/,
                                    app.phasefinishfunction /*callback that handles the choice or finishes the phase*/, 
                                );
                            }
                        }
                },
                {
                    'Producing your Resource':
                        ()=>{        
                            if (app.get().game.players[app.get().game.acting_player_index].activeaction != 'improved_production' || app.get().game.choices[0].name=='Skip' ){
                                app.phasefinishfunction();
                            } else {   
                                app.produce(app.get().game.choices);
                                app.phasefinishfunction(true);
                            }
                        }
                },
                {
                    'Choose an empty Production Zone to Produce in':
                        ()=>{        
                            if (app.get().game.players[app.get().game.acting_player_index].activeaction != 'improved_production' ){
                                app.phasefinishfunction();
                            } else {    
                                app.offer(
                                    true /*option to skip | sets game.displayinfo.showoptiontoskip=boolean */,
                                    false /*allows multiple choices | sets game.displayinfo.allowformultipleselections=boolean */, 
                                    ['settled_&_conquered_planets'] /* available cards to choose from | game.displayinfo.selectionzone={'hand|discard|options|planets|research|rolecards'}, sets choices=array if specified*/, 
                                    'choices' /* label for where the choice is stored | set with game[label]=*/,
                                    app.phasefinishfunction /*callback that handles the choice or finishes the phase*/, 
                                );
                            }
                        }
                },
                {
                    'Producing your Resource':
                        ()=>{        
                            if (app.get().game.players[app.get().game.acting_player_index].activeaction != 'improved_production'|| app.get().game.choices[0].name=='Skip' ){
                                app.phasefinishfunction();
                            } else {   
                                app.produce(app.get().game.choices);
                                app.phasefinishfunction(true);
                            }
                        }
                },
                // #######################################################################################################################################################################################
                // improved_trade : 1
                //      -> improved_trade
                {
                    'Trading your Stocks and Bonds':
                        ()=>{
                            if (app.get().game.players[app.get().game.acting_player_index].activeaction != 'improved_trade' ){
                                app.phasefinishfunction();
                            } else {   
                                let game = app.get().game;
                                game.players[app.get().game.acting_player_index].influence.push(game.influence.pop());
                                app.set({'game':game});
                                app.phasefinishfunction(true);
                            }
                        }
                },
                // #######################################################################################################################################################################################
                // improved_research : 2
                //      choose card(s) from hand
                //      -> improved_research
                {
                    'Choose up to 3 Cards from your Hand to Remove from the Game':
                        ()=>{        
                            if (app.get().game.players[app.get().game.acting_player_index].activeaction != 'improved_research' ){
                                app.phasefinishfunction();
                            } else {    
                                app.draw(app.get().game.players[app.get().game.acting_player_index]);
                                app.offer(
                                    false /*option to skip | sets game.displayinfo.showoptiontoskip=boolean */,
                                    true /*allows multiple choices | sets game.displayinfo.allowformultipleselections=boolean */, 
                                    ['hand'] /* available cards to choose from | game.displayinfo.selectionzone={'hand|discard|options|planets|research|rolecards'}, sets choices=array if specified*/, 
                                    'choices' /* label for where the choice is stored | set with game[label]=*/,
                                    app.phasefinishfunction /*callback that handles the choice or finishes the phase*/, 
                                );
                            }
                        }
                },
                {
                    'Removing your Cards from the Game':
                    ()=>{        
                        if (app.get().game.players[app.get().game.acting_player_index].activeaction != 'improved_research' ){
                            app.phasefinishfunction();
                        } else {    
                            research(app.get().game.choices, app.get().game.players[app.get().game.acting_player_index], 3);
                            app.phasefinishfunction(true);
                        }
                    }
                },
                // #######################################################################################################################################################################################
                // improved_survey : 1
                //      -> improved_survey
                {
                    'Drawing your Cards':
                    ()=>{        
                        if (app.get().game.players[app.get().game.acting_player_index].activeaction != 'improved_survey' ){
                            app.phasefinishfunction();
                        } else {    
                            app.draw(app.get().game.players[app.get().game.acting_player_index]);
                            app.draw(app.get().game.players[app.get().game.acting_player_index]);
                            app.draw(app.get().game.players[app.get().game.acting_player_index]);
                            app.phasefinishfunction(true);
                        }
                    }
                },
                // #######################################################################################################################################################################################
                // improved_warfare : 4
                //      attack or collect
                //      -> collect 
                //      -> choose planet
                //           -> conquer
                {
                    'Choose between Collecting a Starfighter or Conquering a Planet':
                        ()=>{        
                            if (app.get().game.players[app.get().game.acting_player_index].activeaction != 'improved_warfare' ){
                                app.phasefinishfunction();
                            } else {    
                                app.offer(
                                    false /*option to skip | sets game.displayinfo.showoptiontoskip=boolean */,
                                    false /*allows multiple choices | sets game.displayinfo.allowformultipleselections=boolean */, 
                                    ['options', [{name:'Conquer a Planet'}, {name:'Collect a Starfighter'}]] /* available cards to choose from | game.displayinfo.selectionzone={'hand|discard|options|planets|research|rolecards'}, sets choices=array if specified*/, 
                                    'choices' /* label for where the choice is stored | set with game[label]=*/,
                                    app.phasefinishfunction /*callback that handles the choice or finishes the phase*/, 
                                );
                            }
                        }
                },
                {
                    'Adding a Starfighter to your Fleet':
                    ()=>{        
                        if (app.get().game.players[app.get().game.acting_player_index].activeaction != 'improved_warfare' || app.get().game.choices[0].name!='Collect a Starfighter'){
                            app.phasefinishfunction();
                        } else {    
                            app.warfare(app.get().game.players[app.get().game.acting_player_index]);
                            app.warfare(app.get().game.players[app.get().game.acting_player_index]);
                            app.phasefinishfunction(true);
                        }
                    }
                },
                {
                    'Choose a Planet to Conquer':
                    ()=>{        
                        if (app.get().game.players[app.get().game.acting_player_index].activeaction != 'improved_warfare' || app.get().game.choices[0].name!='Conquer a Planet'){
                            app.phasefinishfunction();
                        } else {    
                            app.offer(
                                false /*option to skip | sets game.displayinfo.showoptiontoskip=boolean */,
                                false /*allows multiple choices | sets game.displayinfo.allowformultipleselections=boolean */, 
                                ['unsettled_planets'] /* available cards to choose from | game.displayinfo.selectionzone={'hand|discard|options|planets|research|rolecards'}, sets choices=array if specified*/, 
                                'subchoices' /* label for where the choice is stored | set with game[label]=*/,
                                app.phasefinishfunction /*callback that handles the choice or finishes the phase*/, 
                            );
                        }
                    }
                },
                {
                    'Conquering your planet':
                    ()=>{        
                        if (app.get().game.players[app.get().game.acting_player_index].activeaction != 'improved_warfare' || app.get().game.choices[0].name!='Conquer a Planet'){
                            app.phasefinishfunction();
                        } else {    
                            app.conquer(app.get().game.subchoices[0], app.get().game.players[app.get().game.acting_player_index]);
                            app.phasefinishfunction(true);
                        }
                    }
                },
                // #######################################################################################################################################################################################
                // mobilization : 4
                //      -> mobilization
                //      choose wether to attack (post role phase)
                //      -> choose planet
                //          -> conquer
                {
                    'Collecting your Star Fighters':
                    ()=>{        
                        if (app.get().game.players[app.get().game.acting_player_index].activeaction != 'mobilization'){
                            app.phasefinishfunction();
                        } else {    
                            app.warfare(app.get().game.players[app.get().game.acting_player_index]);
                            app.warfare(app.get().game.players[app.get().game.acting_player_index]);
                            app.phasefinishfunction(true);
                        }
                    }
                },
               
                // #######################################################################################################################################################################################
                // survey_team : 1
                //      -> survey_team
                {
                    'Adding Top Card of the Planet deck to your Empire':
                        ()=>{
                            if (app.get().game.players[app.get().game.acting_player_index].activeaction != 'survey_team'){
                                app.phasefinishfunction();
                            } else {    
                                let {game:game, game:{acting_player:player,planet_deck:planet_deck}} = app.get();
                                player = game.players[game.acting_player_index];
                                let planet = planet_deck.pop();
                                player.unsettled_planets.push(planet);
                                app.set({'game':game});
                                app.phasefinishfunction(true);
                            }
                        }
                },
                // #######################################################################################################################################################################################
                // war_path : 4
                //      choose a planet (optional)
                //         -> conquer
                //              choose a planet (optional)
                //                  -> conquer
                {
                    'Choose a Planet to Conquer':
                    ()=>{        
                        if (app.get().game.players[app.get().game.acting_player_index].activeaction != 'war_path' ){
                            app.phasefinishfunction();
                        } else {    
                            app.offer(
                                true /*option to skip | sets game.displayinfo.showoptiontoskip=boolean */,
                                false /*allows multiple choices | sets game.displayinfo.allowformultipleselections=boolean */, 
                                ['unsettled_planets'] /* available cards to choose from | game.displayinfo.selectionzone={'hand|discard|options|planets|research|rolecards'}, sets choices=array if specified*/, 
                                'choices' /* label for where the choice is stored | set with game[label]=*/,
                                app.phasefinishfunction /*callback that handles the choice or finishes the phase*/, 
                            );
                        }
                    }
                },
                {
                    'Conquering your planet':
                    ()=>{        
                        if (app.get().game.players[app.get().game.acting_player_index].activeaction != 'war_path' || app.get().game.choices[0].name!='Skip'){
                            app.phasefinishfunction();
                        } else {    
                            app.conquer(app.get().game.choices[0], app.get().game.players[app.get().game.acting_player_index]);
                            app.phasefinishfunction(true);
                        }
                    }
                },
                {
                    'Choose a Planet to Conquer':
                    ()=>{        
                        if (app.get().game.players[app.get().game.acting_player_index].activeaction != 'war_path' ){
                            app.phasefinishfunction();
                        } else {    
                            app.offer(
                                false /*option to skip | sets game.displayinfo.showoptiontoskip=boolean */,
                                false /*allows multiple choices | sets game.displayinfo.allowformultipleselections=boolean */, 
                                ['unsettled_planets'] /* available cards to choose from | game.displayinfo.selectionzone={'hand|discard|options|planets|research|rolecards'}, sets choices=array if specified*/, 
                                'choices' /* label for where the choice is stored | set with game[label]=*/,
                                app.phasefinishfunction /*callback that handles the choice or finishes the phase*/, 
                            );
                        }
                    }
                },
                {
                    'Conquering your planet':
                    ()=>{        
                        if (app.get().game.players[app.get().game.acting_player_index].activeaction != 'war_path' || app.get().game.choices[0].name!='Skip'){
                            app.phasefinishfunction();
                        } else {    
                            app.conquer(app.get().game.choices[0], app.get().game.players[app.get().game.acting_player_index]);
                            app.phasefinishfunction(true);
                        }
                    }
                },
                // #######################################################################################################################################################################################
                // terraforming : 2
                //      choose planet
                //      -> terraforming
                {
                    'Choose an Unsettled Planet to Terraform':
                        ()=>{        
                            if (app.get().game.players[app.get().game.acting_player_index].activeaction != 'terraforming'){
                                app.phasefinishfunction();
                            } else {    
                                app.offer(
                                    false /*option to skip | sets game.displayinfo.showoptiontoskip=boolean */,
                                    false /*allows multiple choices | sets game.displayinfo.allowformultipleselections=boolean */, 
                                    ['unsettled_planets'] /* available cards to choose from | game.displayinfo.selectionzone={'hand|discard|options|planets|research|rolecards'}, sets choices=array if specified*/, 
                                    'choices' /* label for where the choice is stored | set with game[label]=*/,
                                    app.phasefinishfunction /*callback that handles the choice or finishes the phase*/, 
                                );
                            }
                        }
                },
                {
                    'Terraforming your Planet':
                        ()=>{        
                            if (app.get().game.players[app.get().game.acting_player_index].activeaction != 'terraforming' || app.get().game.choices[0].name != 'Colonize'){
                                app.phasefinishfunction();
                            } else {    
                                app.colonize(app.get().game.choices[0], app.get().game.players[app.get().game.acting_player_index].limbo , app.get().game.players[app.get().game.acting_player_index].limbo.filter((el)=>{ return el.type == 'terraforming'})[0]);
                                if (app.get().game.choices[0].hosted_colonies.length > 0){
                                    let c = app.get().game.choices[0].hosted_colonies.reduce((acc, cur)=>{acc+cur.icons.colonize;});
                                    if (c >= app.get().game.choices[0].settle_cost){
                                        app.settle_colonies(app.get().game.choices[0], app.get().game.players[app.get().game.acting_player_index]);
                                    }
                                }
                                app.phasefinishfunction(true);
                            }
                        }
                },
                // #######################################################################################################################################################################################
                // genetic_engineering :1
                //      -> genetic_engineering
                {
                    'Engineering Genetics':
                    ()=>{
                        if (app.get().game.players[app.get().game.acting_player_index].activeaction != 'genetic_engineering'){
                            app.phasefinishfunction();
                        } else {    
                            app.phasefinishfunction();
                        }
                    }
                },
                // #######################################################################################################################################################################################
                // artificial_intelligence : 4
                //      choose center row card
                //          -> artificial_intelligence
                //              choose center row card
                //                  -> artificial_intelligence
                {
                    'Select a Role Card to take into your Hand':
                        ()=>{
                            if (app.get().game.players[app.get().game.acting_player_index].activeaction != 'artificial_intelligence'){
                                app.phasefinishfunction();
                            } else {    
                                app.offer(
                                    false /*option to skip | sets game.displayinfo.showoptiontoskip=boolean */,
                                    false /*allows multiple choices | sets game.displayinfo.allowformultipleselections=boolean */, 
                                    ['rolecards'] /* available cards to choose from | game.displayinfo.selectionzone={'hand|discard|options|planets|research|rolecards'}, sets choices=array if specified*/, 
                                    'choices' /* label for where the choice is stored | set with game[label]=*/,
                                    app.phasefinishfunction /*callback that handles the choice or finishes the phase*/, 
                                );
                            }
                        }
                },
                {
                    'Adding Role Card to your Machine Learning Model':
                        ()=>{
                            if (app.get().game.players[app.get().game.acting_player_index].activeaction != 'artificial_intelligence'){
                                app.phasefinishfunction();
                            } else {    
                                let {game:game,game:{acting_player:player}}=app.get();
                                player = game.players[game.acting_player_index];
                                if (game.stacks.pilecount[game.choices[0].type] >= 1){
                                    player.hand.push(Object.assign({'identifier':app.generate_unique_identifier()}, game.stacks.rolecards[game.stacks[game.choices[0].type]]));
                                    game.stacks.pilecount[game.choices[0].type]--;
                                }
                                app.set({'game':game});
                                app.phasefinishfunction(true);
                            }
                        }
                },
                {
                    'Select a Role Card to take into your Hand':
                        ()=>{
                            if (app.get().game.players[app.get().game.acting_player_index].activeaction != 'artificial_intelligence'){
                                app.phasefinishfunction();
                            } else {    
                                app.offer(
                                    false /*option to skip | sets game.displayinfo.showoptiontoskip=boolean */,
                                    false /*allows multiple choices | sets game.displayinfo.allowformultipleselections=boolean */, 
                                    ['rolecards'] /* available cards to choose from | game.displayinfo.selectionzone={'hand|discard|options|planets|research|rolecards'}, sets choices=array if specified*/, 
                                    'choices' /* label for where the choice is stored | set with game[label]=*/,
                                    app.phasefinishfunction /*callback that handles the choice or finishes the phase*/, 
                                );
                            }
                        }
                },
                {
                    'Adding Role Card to your Machine Learning Model':
                        ()=>{
                            if (app.get().game.players[app.get().game.acting_player_index].activeaction != 'artificial_intelligence'){
                                app.phasefinishfunction();
                            } else {    
                                let {game:game,game:{acting_player:player}}=app.get();
                                player = game.players[game.acting_player_index];
                                if (game.stacks.pilecount[game.choices[0].type] >= 1){
                                    player.hand.push(Object.assign({'identifier':app.generate_unique_identifier()}, game.stacks.rolecards[game.stacks[game.choices[0].type]]));
                                    game.stacks.pilecount[selected_center_card.type]--;
                                }
                                app.set({'game':game});
                                app.phasefinishfunction(true);
                            }
                        }
                },
                // #######################################################################################################################################################################################
                // diverse_markets : 1
                //      -> diverse_markets
                {
                    'Diversifying Markets':
                    ()=>{
                        if (app.get().game.players[app.get().game.acting_player_index].activeaction != 'diverse_markets'){
                           app.phasefinishfunction();
                        } else {    
                            app.phasefinishfunction();
                        }
                    }
                },
                // #######################################################################################################################################################################################
                // specialization : 2
                //      choose resource type
                //          -> specialization
                {
                    'Choose a Resource to Specialize in':
                        ()=>{
                            if (app.get().game.players[app.get().game.acting_player_index].activeaction != 'specialization'){
                                app.phasefinishfunction();
                            } else {    
                                app.offer(
                                    false /*option to skip | sets game.displayinfo.showoptiontoskip=boolean */,
                                    false /*allows multiple choices | sets game.displayinfo.allowformultipleselections=boolean */, 
                                    ['options', [ {name:'red'}, {name:'blue'}, {name:'gren'}, {name:'purple'} ] ] /* available cards to choose from | game.displayinfo.selectionzone={'hand|discard|options|planets|research|rolecards'}, sets choices=array if specified*/, 
                                    'choices' /* label for where the choice is stored | set with game[label]=*/,
                                    app.phasefinishfunction /*callback that handles the choice or finishes the phase*/, 
                                );
                            }
                        }
                },
                {
                    'Specializaing in your Seleted Resource':
                        ()=>{
                            if (app.get().game.players[app.get().game.acting_player_index].activeaction != 'specialization'){
                                app.phasefinishfunction();
                            } else {    
                                let game = app.get().game;
                                game.players[app.get().game.acting_player_index].specialization = game.choices[0].name;
                                app.phasefinishfunction(true);
                            }
                        }
                },
                // #######################################################################################################################################################################################
                // data_network : 3
                //      -> data_network
                //      choose card(s) from hand
                //          -> research
                {
                    'Drawing Your Cards':
                        ()=>{
                            if (app.get().game.players[app.get().game.acting_player_index].activeaction != 'data_network'){
                                app.phasefinishfunction();
                            } else {    
                                app.draw(app.get().game.players[app.get().game.acting_player_index]);
                                app.draw(app.get().game.players[app.get().game.acting_player_index]);
                                app.phasefinishfunction(true);
                            }
                        }
                },
                {
                    'Choose any number of Cards from your Hand to Remove from the Game':
                        ()=>{
                            if (app.get().game.players[app.get().game.acting_player_index].activeaction != 'data_network'){
                                app.phasefinishfunction();
                            } else {    
                                app.offer(
                                    true /*option to skip | sets game.displayinfo.showoptiontoskip=boolean */,
                                    true /*allows multiple choices | sets game.displayinfo.allowformultipleselections=boolean */, 
                                    ['hand'] /* available cards to choose from | game.displayinfo.selectionzone={'hand|discard|options|planets|research|rolecards'}, sets choices=array if specified*/, 
                                    'choices' /* label for where the choice is stored | set with game[label]=*/,
                                    app.phasefinishfunction /*callback that handles the choice or finishes the phase*/, 
                                );
                                app.phasefinishfunction(true);
                            }
                        }
                },
                {
                    'Removing the Selected Cards from the Game':
                        ()=>{
                            if (app.get().game.players[app.get().game.acting_player_index].activeaction != 'data_network' || app.get().game.choices[0].name == 'Skip'){
                                app.phasefinishfunction();
                            } else {    
                                let { game:game, game: { choices:choices, acting_player:player } } = app.get();
                                player = game.players[game.acting_player_index];
                                app.research(choices,player,choices.length);
                                app.phasefinishfunction(true);
                            }
                        }
                },

            ]
        },
       
        // choose role : 2
        //      choose between center rolecards to lead with
        //      -> lead with role
        // boosting cards :2 
        //      choose card(s) from hand to boost with
        //      -> boost role
        {
            'role':
            [
                {
                    'Choose a Role Card to Lead with':
                    ()=>{ 
                        app.offer(
                            false /*option to skip | sets game.displayinfo.showoptiontoskip=boolean */,
                            false /*allows multiple choices | sets game.displayinfo.allowformultipleselections=boolean */, 
                            ['rolecards'] /* available cards to choose from | game.displayinfo.selectionzone={'hand|discard|options|planets|research|rolecards'}, sets choices=array if specified*/, 
                            'choices' /* label for where the choice is stored | set with game[label]=*/,
                            app.phasefinishfunction /*callback that handles the choice or finishes the phase*/, 
                        );
                    }
                },
                {
                    'Performing your Role':
                    ()=>{ 
                        let {game:game,game:{choices:[card]}} = app.get();
                        if (game.stacks.pilecount[card.type] >= 1){
                            game.players[app.get().game.acting_player_index].boostingicons[card.type]++;
                            let newcard = Object.assign({'identifier':app.generate_unique_identifier(), 'final_destination_label':'discard','selected':true},game.stacks.rolecards[game.stacks[card.type]]);
                            game.players[app.get().game.acting_player_index].limbo.push(newcard);
                            game.stacks.pilecount[card.type]--;
                        } else if (card.type!='colonize'){
                            game.players[app.get().game.acting_player_index].boostingicons[card.type]++;
                        }
                        game.players[app.get().game.acting_player_index].activerole = card.type;
                        app.set({'game':game});
                        app.phasefinishfunction(true);
                    }
                },
            ]
        },
        
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
        {
            'lead':
            [
                {
                    'Choose cards from your hand to Boost the effectiveness of your Role' :
                    ()=>{
                        app.offer(
                            true /*option to skip | sets game.displayinfo.showoptiontoskip=boolean */,
                            true /*allows multiple choices | sets game.displayinfo.allowformultipleselections=boolean */, 
                            ['hand'] /* available cards to choose from | game.displayinfo.selectionzone={'hand|discard|options|planets|research|rolecards'}, sets choices=array if specified*/, 
                            'choices' /* label for where the choice is stored | set with game[label]=*/,
                            app.phasefinishfunction /*callback that handles the choice or finishes the phase*/, 
                        );
                    }
                },
                {
                    'Boosting your Role' :
                    ()=>{
                        let { game:game, 
                                game:{
                                    acting_player:player,
                                    acting_player:{
                                        limbo:limbo,
                                        hand:hand
                                    },
                                    choices:cards
                                }
                            } = app.get();
                        player = game.players[game.acting_player_index];
                        limbo = player.limbo;
                        hand = player.hand;
                        if (cards[0].name=='Skip'){
                            app.phasefinishfunction();
                        } else {
                            for (let i in cards){
                                player.boostingicons[cards[i].type]++;
                                // check for permanent tech adaptability
                                // add one of each other icon to the player
                                // also change so that it will simply merge the card's icons with the player's, cuz this way doesnt count technology card's icons

                            //     limbo.push(
                            //         {'final_destination_label':'discard', 
                            //         ...hand.filter(
                            //             (el)=>{return cards[i].identifier == el.identifier;}
                            //         )[0]
                            //         }
                            //     );
                            //     hand = hand.filter(
                            //         (el)=>{return cards[i].identifier != el.identifier}
                            //     );
                            }
                            player.hand=hand;
                            //TODO: tally up icons on planets
                            //TODO: tally up icons on technologies
                            app.set({'game':game});
                            app.phasefinishfunction(true);
                        }
                    }
                }, 
                
                // #######################################################################################################################################################################################
                // colonize : 5 (can conjoin to 4)
                //     settle or colonize
                //      -> choose planet
                //         -> settle
                //      -> choose planet
                //         -> colonize
                {
                    'Choose between Settling or Colonizing a Planet':
                        ()=>{   
                            if (app.get().game.players[app.get().game.acting_player_index].activerole!='colonize'){
                                app.phasefinishfunction();
                            } else {    
                                app.offer(
                                    false /*option to skip | sets game.displayinfo.showoptiontoskip=boolean */,
                                    false /*allows multiple choices | sets game.displayinfo.allowformultipleselections=boolean */, 
                                    ['options', [{name:'Colonize'}, {name:'Settle Colonies'}]] /* available cards to choose from | game.displayinfo.selectionzone={'hand|discard|options|planets|research|rolecards'}, sets choices=array if specified*/, 
                                    'choices' /* label for where the choice is stored | set with game[label]=*/,
                                    app.phasefinishfunction /*callback that handles the choice or finishes the phase*/, 
                                );
                            }
                        }
                },
                {
                    'Choose an Unsettled Planet to Settle':
                        ()=>{        
                            if (app.get().game.players[app.get().game.acting_player_index].activerole != 'colonize' || app.get().game.choices[0].name != 'Settle Colonies'){
                                app.phasefinishfunction();
                            } else {    
                                app.offer(
                                    false /*option to skip | sets game.displayinfo.showoptiontoskip=boolean */,
                                    false /*allows multiple choices | sets game.displayinfo.allowformultipleselections=boolean */, 
                                    ['unsettled_planets'] /* available cards to choose from | game.displayinfo.selectionzone={'hand|discard|options|planets|research|rolecards'}, sets choices=array if specified*/, 
                                    'subchoices' /* label for where the choice is stored | set with game[label]=*/,
                                    app.phasefinishfunction /*callback that handles the choice or finishes the phase*/, 
                                );
                            }
                        }
                },
                {
                    'Settling your Planet':
                        ()=>{        
                            if (app.get().game.players[app.get().game.acting_player_index].activerole != 'colonize' || app.get().game.choices[0].name != 'Settle Colonies'){
                                app.phasefinishfunction();
                            } else {   
                                app.settle_colonies(app.get().game.subchoices[0], app.get().game.players[app.get().game.acting_player_index]);
                                // check for permanent tech abundance
                                // change production slots to filled
                                app.phasefinishfunction(true);
                            }
                        }
                },
                {
                    'Choose an Unsettled Planet to Colonize':
                        ()=>{        
                            if (app.get().game.players[app.get().game.acting_player_index].activerole != 'colonize' || app.get().game.choices[0].name != 'Colonize'){
                                app.phasefinishfunction();
                            } else {    
                                app.offer(
                                    false /*option to skip | sets game.displayinfo.showoptiontoskip=boolean */,
                                    true /*allows multiple choices | sets game.displayinfo.allowformultipleselections=boolean */, 
                                    ['unsettled_planets'] /* available cards to choose from | game.displayinfo.selectionzone={'hand|discard|options|planets|research|rolecards'}, sets choices=array if specified*/, 
                                    'subchoices' /* label for where the choice is stored | set with game[label]=*/,
                                    app.phasefinishfunction /*callback that handles the choice or finishes the phase*/, 
                                );
                            }
                        }
                },
                {
                    'Colonizing your Planet':
                        ()=>{        
                            if (app.get().game.players[app.get().game.acting_player_index].activerole != 'colonize' || app.get().game.choices[0].name != 'Colonize'){
                                app.phasefinishfunction();
                            } else {   
                                let j = 0; 
                                let planet = app.get().game.subchoices[j];
                                for (let i = 0; i < app.get().game.players[app.get().game.acting_player_index].boostingicons.colonize; i++ ){
                                    
                                    if (planet.hosted_colonies.length > 0 ){
                                        if(planet.hosted_colonies.reduce((acc, cur)=>{return acc+cur.icons.colonize}) >= planet.settle_cost && j < app.get().game.subchoices.length-1 ){
                                            j++;
                                            planet = app.get().game.subchoices[j];
                                        }                                    }
                                    app.colonize(planet, app.get().game.players[app.get().game.acting_player_index].limbo , app.get().game.players[app.get().game.acting_player_index].limbo.filter((el)=>{ return el.type == 'colonize'})[0]);
                                }
                                app.phasefinishfunction(true);
                            }
                        }
                },
                // #######################################################################################################################################################################################
                // producetrade : 5
                //      produce or trade
                //      -> select an empty productionzone
                //          -> produce
                //      -> select an occupied productionzone
                //          -> trade
                {
                    'Choose between Producing or Trading Resources':
                        ()=>{
                            if (app.get().game.players[app.get().game.acting_player_index].activerole!='producetrade'){
                                app.phasefinishfunction();
                            } else {    
                                app.offer(
                                    false /*option to skip | sets game.displayinfo.showoptiontoskip=boolean */,
                                    false /*allows multiple choices | sets game.displayinfo.allowformultipleselections=boolean */, 
                                    ['options', [{name:'produce'}, {name:'trade'}]] /* available cards to choose from | game.displayinfo.selectionzone={'hand|discard|options|planets|research|rolecards'}, sets choices=array if specified*/, 
                                    'choices' /* label for where the choice is stored | set with game[label]=*/,
                                    app.phasefinishfunction /*callback that handles the choice or finishes the phase*/, 
                                );
                            }
                        }
                },
                {
                    'Choose a Planet to Produce Resources on':
                        ()=>{        
                            if (app.get().game.players[app.get().game.acting_player_index].activerole != 'producetrade' || app.get().game.choices[0].name != 'produce'){
                                app.phasefinishfunction();
                            } else {    
                                app.offer(
                                    true /*option to skip | sets game.displayinfo.showoptiontoskip=boolean */,
                                    true /*allows multiple choices | sets game.displayinfo.allowformultipleselections=boolean */, 
                                    ['settled_&_conquered_planets'] /* available cards to choose from | game.displayinfo.selectionzone={'hand|discard|options|planets|research|rolecards'}, sets choices=array if specified*/, 
                                    'subchoices' /* label for where the choice is stored | set with game[label]=*/,
                                    app.phasefinishfunction /*callback that handles the choice or finishes the phase*/, 
                                );
                            }
                        }
                },
                {
                    'Producing a Resource':
                        ()=>{        
                            if (app.get().game.players[app.get().game.acting_player_index].activerole != 'producetrade' || app.get().game.choices[0].name != 'produce'){
                                app.phasefinishfunction();
                            } else {
                                ///app.set( {'game': { 'acting_player':{ 'activerole':'produce' } , ...app.get().game} } )    
                                let game = app.get().game;
                                game.players[app.get().game.acting_player_index].activerole='produce';
                                app.set({'game':game});
                                let prd = app.produce(game.subchoices,game.players[app.get().game.acting_player_index].boostingicons.produce);
                                if (app.get().game.players[app.get().game.acting_player_index].activeaction='genetic_engineering'){
                                    for (let i in prd){
                                        if (prd[i] > 1){
                                            players[j].influence.push(game.influence.pop());
                                        }
                                    }
                                }
                                app.phasefinishfunction(true);
                            }
                        }
                },
                {
                    'Choose a Planet to Trade Resources from':
                        ()=>{        
                            if (app.get().game.players[app.get().game.acting_player_index].activerole != 'producetrade' || app.get().game.choices[0].name != 'trade'){
                                app.phasefinishfunction();
                            } else {    
                                app.offer(
                                    true /*option to skip | sets game.displayinfo.showoptiontoskip=boolean */,
                                    true /*allows multiple choices | sets game.displayinfo.allowformultipleselections=boolean */, 
                                    ['settled_&_conquered_planets'] /* available cards to choose from | game.displayinfo.selectionzone={'hand|discard|options|planets|research|rolecards'}, sets choices=array if specified*/, 
                                    'subchoices' /* label for where the choice is stored | set with game[label]=*/,
                                    app.phasefinishfunction /*callback that handles the choice or finishes the phase*/, 
                                );
                            }
                        }
                },
                {
                    'Trading a Resource':
                        ()=>{        
                            if (app.get().game.players[app.get().game.acting_player_index].activerole != 'producetrade' || app.get().game.choices[0].name != 'trade'){
                                app.phasefinishfunction();
                            } else {   
                                let game = app.get().game;
                                game.players[app.get().game.acting_player_index].activerole='trade';
                                app.set({'game':game}); 
                                let prd = app.trade(game.subchoices,game.players[app.get().game.acting_player_index], game.players[app.get().game.acting_player_index].boostingicons.trade);
                                if (app.get().game.players[app.get().game.acting_player_index].activeaction='diverse_markets'){
                                    for (let i in prd){
                                        if (prd[i] > 1){
                                            app.get().game.players[app.get().game.acting_player_index].influence.push(app.get().game.influence.pop());
                                        }
                                    }
                                }
                                if (app.get().game.players[app.get().game.acting_player_index].activeaction='specialization'){
                                    for ( let i in Array.from( prd[app.get().game.players[app.get().game.acting_player_index].specialization] ) ) {
                                        app.get().game.players[app.get().game.acting_player_index].influence.push(app.get().game.influence.pop());
                                    }
                                }
                                app.phasefinishfunction(true);
                            }
                        }
                },
                // #######################################################################################################################################################################################
                // research : 2
                //      choose technologies from market
                //      -> research
                {
                    'Choose a Technology to Research':
                        ()=>{        
                            if (app.get().game.players[app.get().game.acting_player_index].activerole != 'research' ){
                                app.phasefinishfunction();
                            } else {    
                                app.offer(
                                    true /*option to skip | sets game.displayinfo.showoptiontoskip=boolean */,
                                    false /*allows multiple choices | sets game.displayinfo.allowformultipleselections=boolean */, 
                                    ['research'] /* available cards to choose from | game.displayinfo.selectionzone={'hand|discard|options|planets|research|rolecards'}, sets choices=array if specified*/, 
                                    'choices' /* label for where the choice is stored | set with game[label]=*/,
                                    app.phasefinishfunction /*callback that handles the choice or finishes the phase*/, 
                                );
                            }
                        }
                },
                {
                    'Researching your Technology':
                    ()=>{        
                        if (app.get().game.players[app.get().game.acting_player_index].activerole != 'research' ){
                            app.phasefinishfunction();
                        } else {    
                            let game = app.get().game;
                            if (game.choices[0].name!="Skip"){
                                //TODO check research card requirements
                                //check for number of planets and type of planets
                                let p = {'advanced':0,'metallic':0,'fertile':0};
                                [...game.players[app.get().game.acting_player_index].settled_planets, ...game.players[app.get().game.acting_player_index].conquered_planets].map(
                                    (el)=>{
                                        p[el.type]++;
                                    }
                                );
                                let condition = true;
                                for (let i in game.choices[0].planet_requirements){
                                    if (game.choices[0].planet_requirements[i] > p[i]){
                                        condition = false;
                                    }
                                }
                                if (condition && game.players[app.get().game.acting_player_index].boostingicons.research >= game.choices[0].research_cost){
                                    if (game.choices[0].is_permanent){
                                        app.play(game.research_deck, game.players[app.get().game.acting_player_index].permanents, '', game.choices[0].identifier);
                                    } else {
                                        app.play(game.research_deck, game.players[app.get().game.acting_player_index].limbo, 'discard', game.choices[0].identifier);
                                    }
                                }
                            }
                            app.phasefinishfunction(true);
                        }
                    }
                },
                // #######################################################################################################################################################################################
                // survey : 2
                //      choose planet
                //      -> survey
                {
                    'Choose a Planet from your Galaxy to Explore':
                    ()=>{        
                        if (app.get().game.players[app.get().game.acting_player_index].activerole != 'survey' ){
                            app.phasefinishfunction();
                        } else {    
                            let game = app.get().game;
                            //survey_role purchase, offer_to_boost explore_planet, present_as_choice, choose, catalog_planet, discard
                            for (let i = 0; i < app.get().game.players[app.get().game.acting_player_index].boostingicons.survey; i++){
                                app.explore_planet(game.players[app.get().game.acting_player_index]); 
                            }
                            app.set({'game':game});
                            app.offer(
                                true /*option to skip | sets game.displayinfo.showoptiontoskip=boolean */,
                                false /*allows multiple choices | sets game.displayinfo.allowformultipleselections=boolean */, 
                                ['options', app.get().game.options] /* available cards to choose from | game.displayinfo.selectionzone={'hand|discard|options|planets|research|rolecards'}, sets choices=array if specified*/, 
                                'choices' /* label for where the choice is stored | set with game[label]=*/,
                                app.phasefinishfunction /*callback that handles the choice or finishes the phase*/, 
                            );
                        }
                    }
                },
                {
                    'Surveying your Empire':
                        ()=>{        
                            if (app.get().game.players[app.get().game.acting_player_index].activerole != 'survey' || app.get().game.choices[0].name=='Skip'){
                                app.phasefinishfunction();
                            } else {    
                                app.catalog_planet(app.get().game.players[app.get().game.acting_player_index]);
                                app.phasefinishfunction(true);
                            }
                        }
                },
                // #######################################################################################################################################################################################
                // warfare : 4
                //      attack or collect
                //          -> collect
                //          -> choose planet
                //              -> conquer
                {
                    'Choose between Collecting Starfighters or Conquering a Planet':
                        ()=>{        
                            if (app.get().game.players[app.get().game.acting_player_index].activerole != 'warfare' ){
                                app.phasefinishfunction();
                            } else {    
                                app.offer(
                                    false /*option to skip | sets game.displayinfo.showoptiontoskip=boolean */,
                                    false /*allows multiple choices | sets game.displayinfo.allowformultipleselections=boolean */, 
                                    ['options', [{name:'Conquer a Planet'}, {name:'Collect Starfighters'}]] /* available cards to choose from | game.displayinfo.selectionzone={'hand|discard|options|planets|research|rolecards'}, sets choices=array if specified*/, 
                                    'choices' /* label for where the choice is stored | set with game[label]=*/,
                                    app.phasefinishfunction /*callback that handles the choice or finishes the phase*/, 
                                );
                            }
                        }
                },
                {
                    'Adding Starfighters to your Fleet':
                    ()=>{        
                        if (app.get().game.players[app.get().game.acting_player_index].activerole != 'warfare' || app.get().game.choices[0].name!='Collect Starfighters'){
                            app.phasefinishfunction();
                        } else {    
                            for (let i = 0; i < app.get().game.players[app.get().game.acting_player_index].boostingicons.warfare; i++){
                                app.warfare(app.get().game.players[app.get().game.acting_player_index]);
                            }
                            app.phasefinishfunction(true);
                        }
                    }
                },
                {
                    'Choose a Planet to Conquer':
                    ()=>{        
                        if (app.get().game.players[app.get().game.acting_player_index].activerole != 'warfare' || app.get().game.choices[0].name!='Conquer a Planet'){
                            app.phasefinishfunction();
                        } else {    
                            app.offer(
                                false /*option to skip | sets game.displayinfo.showoptiontoskip=boolean */,
                                false /*allows multiple choices | sets game.displayinfo.allowformultipleselections=boolean */, 
                                ['unsettled_planets'] /* available cards to choose from | game.displayinfo.selectionzone={'hand|discard|options|planets|research|rolecards'}, sets choices=array if specified*/, 
                                'subchoices' /* label for where the choice is stored | set with game[label]=*/,
                                app.phasefinishfunction /*callback that handles the choice or finishes the phase*/, 
                            );
                        }
                    }
                },
                {
                    'Conquering your planet':
                    ()=>{        
                        if (app.get().game.players[app.get().game.acting_player_index].activerole != 'warfare' || app.get().game.choices[0].name!='Conquer a Planet'){
                            app.phasefinishfunction();
                        } else {    
                            app.conquer(app.get().game.subchoices[0], app.get().game.players[app.get().game.acting_player_index]);
                            app.phasefinishfunction(true);
                        }
                    }
                },
                {
                    'Pass the device to the Next Player':
                    ()=>{
                        let game = app.get().game;
                        game.displayinfo.selectionzone='';
                        game.passp=true;
                        app.set({'game':game});
                    }
                },
                {
                    'You passed Priority':
                    ()=>{
                        let game = app.get().game;
                        //app.togglepasstoplayer();
                        game.passp=false;
                        app.set({'game':game});
                        app.phasefinishfunction(true);
                    }
                },
            ]
        },
        
        // dissent : 2
        //      choose between dissent or follow
        //      -> dissent
        //      -> follow
        // boosting cards :2 
        //      choose card(s) from hand to boost with
        //      -> boost role
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
        {
            'follow':
            [
                {
                    'Choose between Fllowing or Dissent the Leading Role':
                    ()=>{  
                        app.offer(
                            false /*option to skip | sets game.displayinfo.showoptiontoskip=boolean */,
                            false /*allows multiple choices | sets game.displayinfo.allowformultipleselections=boolean */, 
                            ['options', [{name:'dissent'}, {name:app.get().game.players[app.get().game.leading_player_index].activerole}]] /* available cards to choose from | game.displayinfo.selectionzone={'hand|discard|options|planets|research|rolecards'}, sets choices=array if specified*/, 
                            'choices' /* label for where the choice is stored | set with game[label]=*/,
                            app.phasefinishfunction /*callback that handles the choice or finishes the phase*/, 
                        );
                    }
                },
                {
                    'Dissenting':
                    ()=>{ 
                        let game = app.get().game;
                        game.players[app.get().game.acting_player_index].activerole=game.choices[0].name;
                        app.set({'game':game});
                        if (app.get().game.players[app.get().game.acting_player_index].activerole!='dissent'){
                            let {game:game,game:{choices:[card]}} = app.get();
                            if (game.stacks.pilecount[card.name] >= 1){
                                game.players[app.get().game.acting_player_index].boostingicons[card.name]++;
                                let newcard = Object.assign({'identifier':app.generate_unique_identifier(), 'final_destination_label':'discard','selected':true},game.stacks.rolecards[game.stacks[card.name]]);
                                game.players[app.get().game.acting_player_index].limbo.push(newcard);
                                game.stacks.pilecount[card.name]--;
                            } else if (card.name!='colonize'){
                                game.players[app.get().game.acting_player_index].boostingicons[card.name]++;
                            }
                            app.set({'game':game});
                            app.phasefinishfunction(true);
                        } else {    
                            app.draw(app.get().game.players[app.get().game.acting_player_index]);
                            if (app.get().game.players[app.get().game.acting_player_index].permanents.filter( (el)=>{return el.type=='dissension'} ).length != 0){
                                app.draw(app.get().game.players[app.get().game.acting_player_index]);
                            }
                            app.phasefinishfunction(true);
                        }
                    }
                }, //will auto pass to next phase if follow has been selected
                {
                    'Choose cards from your hand to Boost the effectiveness of your Role' :
                    ()=>{
                        if (app.get().game.players[app.get().game.acting_player_index].activerole=='dissent'){
                            app.phasefinishfunction();
                        } else {   
                            app.offer(
                                true /*option to skip | sets game.displayinfo.showoptiontoskip=boolean */,
                                true /*allows multiple choices | sets game.displayinfo.allowformultipleselections=boolean */, 
                                ['hand'] /* available cards to choose from | game.displayinfo.selectionzone={'hand|discard|options|planets|research|rolecards'}, sets choices=array if specified*/, 
                                'choices' /* label for where the choice is stored | set with game[label]=*/,
                                app.phasefinishfunction /*callback that handles the choice or finishes the phase*/, 
                            );
                        }
                    }
                },
                {
                    'Boosting your Role' :
                    ()=>{
                        if (app.get().game.players[app.get().game.acting_player_index].activerole=='dissent'){
                            app.phasefinishfunction();
                        } else {  
                            let { game:game, 
                                    game:{
                                        acting_player:player,
                                        acting_player:{
                                            limbo:limbo,
                                            hand:hand
                                        },
                                        choices:cards
                                    }
                                } = app.get();
                            player = game.players[game.acting_player_index];
                            limbo = player.limbo;
                            hand = player.hand;
                            if (cards[0].name=='Skip'){
                                app.phasefinishfunction();
                            } else {
                                for (let i in cards){
                                    player.boostingicons[cards[i].type]++;
                                    // check for permanent tech adaptability
                                    // add one of each other icon to the player
                                    // also change so that it will simply merge the card's icons with the player's, cuz this way doesnt count technology card's icons

                                    // limbo.push(
                                    //     {'final_destination_label':'discard', 
                                    //     ...hand.filter(
                                    //         (el)=>{return cards[i].identifier == el.identifier;}
                                    //     )[0]
                                    //     }
                                    // );
                                    // hand = hand.filter(
                                    //     (el)=>{return cards[i].identifier != el.identifier}
                                    // );
                                }
                                player.hand=hand;
                                //TODO: tally up icons on planets
                                //TODO: tally up icons on technologies
                                app.set({'game':game});
                                app.phasefinishfunction(true);
                            }
                        }
                    }
                }, 
                
                // #######################################################################################################################################################################################
                // colonize : 5 (can conjoin to 4)
                //     settle or colonize
                //      -> choose planet
                //         -> settle
                //      -> choose planet
                //         -> colonize
                {
                    'Choose between Settling or Colonizing a Planet':
                        ()=>{   
                            if (app.get().game.players[app.get().game.acting_player_index].activerole!='colonize'){
                               app.phasefinishfunction();
                            } else if ( app.get().game.players[app.get().game.acting_player_index].permanents.filter( (el)=>{return el.type=='bureaucracy'} ).length == 0){
                                let game = app.get().game;
                                game.choices=[{name:'Colonize'}];
                                app.set({'game':game});
                                app.phasefinishfunction(true);
                            } else {    
                                app.offer(
                                    false /*option to skip | sets game.displayinfo.showoptiontoskip=boolean */,
                                    false /*allows multiple choices | sets game.displayinfo.allowformultipleselections=boolean */, 
                                    ['options', [{name:'Colonize'}, {name:'Settle Colonies'}]] /* available cards to choose from | game.displayinfo.selectionzone={'hand|discard|options|planets|research|rolecards'}, sets choices=array if specified*/, 
                                    'choices' /* label for where the choice is stored | set with game[label]=*/,
                                    app.phasefinishfunction /*callback that handles the choice or finishes the phase*/, 
                                );
                            }
                        }
                },
                {
                    'Choose an Unsettled Planet to Settle':
                        ()=>{        
                            if (app.get().game.players[app.get().game.acting_player_index].activerole != 'colonize' || app.get().game.choices[0].name != 'Settle Colonies'){
                                app.phasefinishfunction();
                            } else {    
                                app.offer(
                                    false /*option to skip | sets game.displayinfo.showoptiontoskip=boolean */,
                                    false /*allows multiple choices | sets game.displayinfo.allowformultipleselections=boolean */, 
                                    ['unsettled_planets'] /* available cards to choose from | game.displayinfo.selectionzone={'hand|discard|options|planets|research|rolecards'}, sets choices=array if specified*/, 
                                    'subchoices' /* label for where the choice is stored | set with game[label]=*/,
                                    app.phasefinishfunction /*callback that handles the choice or finishes the phase*/, 
                                );
                            }
                        }
                },
                {
                    'Settling your Planet':
                        ()=>{        
                            if (app.get().game.players[app.get().game.acting_player_index].activerole != 'colonize' || app.get().game.choices[0].name != 'Settle Colonies'){
                                app.phasefinishfunction();
                            } else {   
                                app.settle_colonies(app.get().game.subchoices[0], app.get().game.players[app.get().game.acting_player_index]);
                                // check for permanent tech abundance
                                // change production slots to filled
                                app.phasefinishfunction(true);
                            }
                        }
                },
                {
                    'Choose an Unsettled Planet to Colonize':
                        ()=>{        
                            if (app.get().game.players[app.get().game.acting_player_index].activerole != 'colonize' || app.get().game.choices[0].name != 'Colonize'){
                                app.phasefinishfunction();
                            } else {    
                                app.offer(
                                    false /*option to skip | sets game.displayinfo.showoptiontoskip=boolean */,
                                    true /*allows multiple choices | sets game.displayinfo.allowformultipleselections=boolean */, 
                                    ['unsettled_planets'] /* available cards to choose from | game.displayinfo.selectionzone={'hand|discard|options|planets|research|rolecards'}, sets choices=array if specified*/, 
                                    'subchoices' /* label for where the choice is stored | set with game[label]=*/,
                                    app.phasefinishfunction /*callback that handles the choice or finishes the phase*/, 
                                );
                            }
                        }
                },
                {
                    'Colonizing your Planet':
                        ()=>{        
                            if (app.get().game.players[app.get().game.acting_player_index].activerole != 'colonize' || app.get().game.choices[0].name != 'Colonize'){
                                app.phasefinishfunction();
                            } else {   
                                let j = 0; 
                                let planet = app.get().game.subchoices[j];
                                for (let i = 0; i < app.get().game.players[app.get().game.acting_player_index].boostingicons.colonize; i++ ){
                                    if (planet.hosted_colonies.length > 0 ) {
                                        if(planet.hosted_colonies.reduce((acc, cur)=>{acc+cur.icons.colonize;}) >= planet.settle_cost && j < app.get().game.subchoices.length-1 ){
                                            j++;
                                            planet = app.get().game.subchoices[j];
                                        }                                    }
                                    app.colonize(planet, app.get().game.players[app.get().game.acting_player_index].limbo , app.get().game.players[app.get().game.acting_player_index].limbo.filter((el)=>{ return el.type == 'colonize'})[0]);
                                }
                                app.phasefinishfunction(true);
                            }
                        }
                },
                // #######################################################################################################################################################################################
                // producetrade : 5
                //      produce or trade
                //      -> select an empty productionzone
                //          -> produce
                //      -> select an occupied productionzone
                //          -> trade
                {
                    'Choose a Planet to Produce Resources on':
                    ()=>{        
                        if (app.get().game.players[app.get().game.acting_player_index].activerole != 'produce'){
                            app.phasefinishfunction();
                        } else {    
                            app.offer(
                                true /*option to skip | sets game.displayinfo.showoptiontoskip=boolean */,
                                true /*allows multiple choices | sets game.displayinfo.allowformultipleselections=boolean */, 
                                ['settled_&_conquered_planets'] /* available cards to choose from | game.displayinfo.selectionzone={'hand|discard|options|planets|research|rolecards'}, sets choices=array if specified*/, 
                                'subchoices' /* label for where the choice is stored | set with game[label]=*/,
                                app.phasefinishfunction /*callback that handles the choice or finishes the phase*/, 
                            );
                        }
                    }
                },
                {
                    'Producing a Resource':
                    ()=>{        
                        if (app.get().game.players[app.get().game.acting_player_index].activerole != 'produce'){
                            app.phasefinishfunction();
                        } else {
                            ///app.set( {'game': { 'acting_player':{ 'activerole':'produce' } , ...app.get().game} } )    
                            let game = app.get().game;
                            game.players[app.get().game.acting_player_index].activerole='produce';
                            app.set({'game':game});
                            app.produce(game.subchoices,game.players[app.get().game.acting_player_index].boostingicons.produce);
                            app.phasefinishfunction(true);
                        }
                    }
                },
                {
                    'Choose a Planet to Trade Resources from':
                        ()=>{        
                            if (app.get().game.players[app.get().game.acting_player_index].activerole != 'trade'){
                                app.phasefinishfunction();
                            } else {    
                                app.offer(
                                    true /*option to skip | sets game.displayinfo.showoptiontoskip=boolean */,
                                    true /*allows multiple choices | sets game.displayinfo.allowformultipleselections=boolean */, 
                                    ['settled_&_conquered_planets'] /* available cards to choose from | game.displayinfo.selectionzone={'hand|discard|options|planets|research|rolecards'}, sets choices=array if specified*/, 
                                    'subchoices' /* label for where the choice is stored | set with game[label]=*/,
                                    app.phasefinishfunction /*callback that handles the choice or finishes the phase*/, 
                                );
                            }
                        }
                },
                {
                    'Trading a Resource':
                        ()=>{        
                            if (app.get().game.players[app.get().game.acting_player_index].activerole != 'trade'){
                                app.phasefinishfunction();
                            } else {   
                                let game = app.get().game;
                                game.players[app.get().game.acting_player_index].activerole='trade';
                                app.set({'game':game}); 
                                app.trade(game.subchoices,game.players[app.get().game.acting_player_index], game.players[app.get().game.acting_player_index].boostingicons.trade);
                                app.phasefinishfunction(true);
                            }
                        }
                },
                // #######################################################################################################################################################################################
                // research : 2
                //      choose technologies from market
                //      -> research
                {
                    'Choose a Technology to Research':
                        ()=>{        
                            if (app.get().game.players[app.get().game.acting_player_index].activerole != 'research' ){
                                app.phasefinishfunction();
                            } else {    
                                app.offer(
                                    true /*option to skip | sets game.displayinfo.showoptiontoskip=boolean */,
                                    false /*allows multiple choices | sets game.displayinfo.allowformultipleselections=boolean */, 
                                    ['research'] /* available cards to choose from | game.displayinfo.selectionzone={'hand|discard|options|planets|research|rolecards'}, sets choices=array if specified*/, 
                                    'choices' /* label for where the choice is stored | set with game[label]=*/,
                                    app.phasefinishfunction /*callback that handles the choice or finishes the phase*/, 
                                );
                            }
                        }
                },
                {
                    'Researching your Technology':
                    ()=>{        
                        if (app.get().game.players[app.get().game.acting_player_index].activerole != 'survey' ){
                            app.phasefinishfunction();
                        } else {    
                            let game = app.get().game;
                            if (game.choices[0].name!="Skip"){
                                let p = {'advanced':0,'metallic':0,'fertile':0};
                                [...game.players[app.get().game.acting_player_index].settled_planets, ...game.players[app.get().game.acting_player_index].conquered_planets].map(
                                    (el)=>{
                                        p[el.type]++;
                                    }
                                );
                                let condition = true;
                                for (let i in game.choices[0].planet_requirements){
                                    if (game.choices[0].planet_requirements[i] > p[i]){
                                        condition = false;
                                    }
                                }
                                if (condition && game.players[app.get().game.acting_player_index].boostingicons.research >= game.choices[0].research_cost){
                                    app.play(game.research_deck, game.players[app.get().game.acting_player_index].limbo, 'discard', game.choices[0].identifier);
                                }
                            }
                            app.phasefinishfunction(true);
                        }
                    }
                },
                // #######################################################################################################################################################################################
                // survey : 2
                //      choose planet
                //      -> survey
                {
                    'Choose a Planet from your Galaxy to Explore':
                    ()=>{        
                        if (app.get().game.players[app.get().game.acting_player_index].activerole != 'survey' ){
                            app.phasefinishfunction();
                        } else {    
                            let game = app.get().game;
                            //survey_role purchase, offer_to_boost explore_planet, present_as_choice, choose, catalog_planet, discard
                            for (let i = 0; i < game.players[app.get().game.acting_player_index].boostingicons.survey-1; i++){
                                app.explore_planet(game.players[app.get().game.acting_player_index]); 
                            }
                            app.set({'game':game});
                            app.offer(
                                true /*option to skip | sets game.displayinfo.showoptiontoskip=boolean */,
                                false /*allows multiple choices | sets game.displayinfo.allowformultipleselections=boolean */, 
                                ['options'] /* available cards to choose from | game.displayinfo.selectionzone={'hand|discard|options|planets|research|rolecards'}, sets choices=array if specified*/, 
                                'choices' /* label for where the choice is stored | set with game[label]=*/,
                                app.phasefinishfunction /*callback that handles the choice or finishes the phase*/, 
                            );
                        }
                    }
                },
                {
                    'Surveying your Empire':
                        ()=>{        
                            if (app.get().game.players[app.get().game.acting_player_index].activerole != 'survey' || app.get().game.choices[0].name=='Skip'){
                                app.phasefinishfunction();
                            } else {    
                                app.catalog_planet(app.get().game.players[app.get().game.acting_player_index]);
                                app.phasefinishfunction(true);
                            }
                        }
                },
                // #######################################################################################################################################################################################
                // warfare : 4
                //      attack or collect
                //          -> collect
                //          -> choose planet
                //              -> conquer
                {
                    'Choose between Collecting Starfighters or Conquering a Planet':
                        ()=>{        
                            if (app.get().game.players[app.get().game.acting_player_index].activerole != 'warfare' ){
                                app.phasefinishfunction();
                            } else if ( app.get().game.players[app.get().game.acting_player_index].permanents.filter( (el)=>{return el.type=='bureaucracy'} ).length == 0){
                                let game = app.get().game;
                                game.choices=[{name:'Collect Starfighters'}];
                                app.set({'game':game});
                                app.phasefinishfunction(true);
                            } else {    
                                app.offer(
                                    false /*option to skip | sets game.displayinfo.showoptiontoskip=boolean */,
                                    false /*allows multiple choices | sets game.displayinfo.allowformultipleselections=boolean */, 
                                    ['options', [{name:'Conquer a Planet'}, {name:'Collect Starfighters'}]] /* available cards to choose from | game.displayinfo.selectionzone={'hand|discard|options|planets|research|rolecards'}, sets choices=array if specified*/, 
                                    'choices' /* label for where the choice is stored | set with game[label]=*/,
                                    app.phasefinishfunction /*callback that handles the choice or finishes the phase*/, 
                                );
                            }
                        }
                },
                {
                    'Adding Starfighters to your Fleet':
                    ()=>{        
                        if (app.get().game.players[app.get().game.acting_player_index].activerole != 'warfare' || app.get().game.choices[0].name!='Collect Starfighters'){
                            app.phasefinishfunction();
                        } else {    
                            for (let i = 0; i < app.get().game.players[app.get().game.acting_player_index].boostingicons.warfare; i++){
                                app.warfare(app.get().game.players[app.get().game.acting_player_index]);
                            }
                            app.phasefinishfunction(true);
                        }
                    }
                },
                {
                    'Choose a Planet to Conquer':
                    ()=>{        
                        if (app.get().game.players[app.get().game.acting_player_index].activerole != 'warfare' || app.get().game.choices[0].name!='Conquer a Planet'){
                            app.phasefinishfunction();
                        } else {    
                            app.offer(
                                false /*option to skip | sets game.displayinfo.showoptiontoskip=boolean */,
                                false /*allows multiple choices | sets game.displayinfo.allowformultipleselections=boolean */, 
                                ['unsettled_planets'] /* available cards to choose from | game.displayinfo.selectionzone={'hand|discard|options|planets|research|rolecards'}, sets choices=array if specified*/, 
                                'subchoices' /* label for where the choice is stored | set with game[label]=*/,
                                app.phasefinishfunction /*callback that handles the choice or finishes the phase*/, 
                            );
                        }
                    }
                },
                {
                    'Conquering your planet':
                    ()=>{        
                        if (app.get().game.players[app.get().game.acting_player_index].activerole != 'warfare' || app.get().game.choices[0].name!='Conquer a Planet'){
                            app.phasefinishfunction();
                        } else {    
                            app.conquer(app.get().game.subchoices[0], app.get().game.players[app.get().game.acting_player_index]);
                            app.phasefinishfunction(true);
                        }
                    }
                },
                {
                    'Pass the device to the Next Player':
                    ()=>{
                        let game = app.get().game;
                        game.displayinfo.selectionzone='';
                        game.passp=true;
                        app.set({'game':game});
                    }
                },
                {
                    'You passed Priority':
                    ()=>{
                        let game = app.get().game;
                        game.passp=false;
                        app.set({'game':game});
                        app.phasefinishfunction(true);
                    }
                },
            ]
        },

        //discard : 2
        //  select card(s) from hand
        //  -> discard
        {
            'discard':
            [
                {
                    'Would you like to Mobilize against a Planet':
                    ()=>{        
                        if (app.get().game.players[app.get().game.acting_player_index].activeaction != 'mobilization'){
                            app.phasefinishfunction();
                        } else {    
                            app.offer(
                                true /*option to skip | sets game.displayinfo.showoptiontoskip=boolean */,
                                false /*allows multiple choices | sets game.displayinfo.allowformultipleselections=boolean */, 
                                ['options', [{name:'mobilize'}, {name:'skip'}]] /* available cards to choose from | game.displayinfo.selectionzone={'hand|discard|options|planets|research|rolecards'}, sets choices=array if specified*/, 
                                'choices' /* label for where the choice is stored | set with game[label]=*/,
                                app.phasefinishfunction /*callback that handles the choice or finishes the phase*/, 
                            );
                        }
                    }
                },
                {
                    'Choose a Planet to Mobilize Against':
                    ()=>{        
                        if (app.get().game.players[app.get().game.acting_player_index].activeaction != 'mobilization' || app.get().game.choices[0].name != 'mobilize'){
                            app.phasefinishfunction();
                        } else {    
                            app.offer(
                                false /*option to skip | sets game.displayinfo.showoptiontoskip=boolean */,
                                false /*allows multiple choices | sets game.displayinfo.allowformultipleselections=boolean */, 
                                ['unsettled_planets']/* available cards to choose from | game.displayinfo.selectionzone={'hand|discard|options|planets|research|rolecards'}, sets choices=array if specified*/, 
                                'subchoices' /* label for where the choice is stored | set with game[label]=*/,
                                app.phasefinishfunction /*callback that handles the choice or finishes the phase*/, 
                            );
                        }
                    }
                },
                {
                    'Mobalizing against your Planet':
                    ()=>{        
                        if (app.get().game.players[app.get().game.acting_player_index].activeaction != 'mobilization'){
                            app.phasefinishfunction();
                        } else {   
                            app.conquer(app.get().game.subchoices[0], app.get().game.players[app.get().game.acting_player_index]); 
                            app.phasefinishfunction(true);
                        }
                    }
                },
                {
                    'Mobalizing against your Planet':
                    ()=>{        
                        if (app.get().game.players[app.get().game.acting_player_index].activeaction != 'mobilization'){
                            app.phasefinishfunction();
                        } else {   
                            app.conquer(app.get().game.subchoices[0], app.get().game.players[app.get().game.acting_player_index]); 
                            app.phasefinishfunction(true);
                        }
                    }
                },
                {
                    'Would you like to Streamline Your Empire':
                    ()=>{        
                        if (app.get().game.players[app.get().game.acting_player_index].permanents.filter( (el)=>{return el.type=='streamlining'} ).length == 0){
                            app.phasefinishfunction();
                        } else {   
                            app.offer(
                                false /*option to skip | sets game.displayinfo.showoptiontoskip=boolean */,
                                false /*allows multiple choices | sets game.displayinfo.allowformultipleselections=boolean */, 
                                ['options', [{name:'Decline'}, {name:'Streamline Empire'}]] /* available cards to choose from | game.displayinfo.selectionzone={'hand|discard|options|planets|research|rolecards'}, sets choices=array if specified*/, 
                                'choices' /* label for where the choice is stored | set with game[label]=*/,
                                app.phasefinishfunction /*callback that handles the choice or finishes the phase*/, 
                            );
                        }
                    }
                },
                {
                    'Choose a Card from Your Hand to Remove from the Game':
                    ()=>{        
                        if (app.get().game.players[app.get().game.acting_player_index].permanents.filter( (el)=>{return el.type=='streamlining'} ).length == 0 || app.get().game.choices[0].name != 'Streamline Empire'){
                            app.phasefinishfunction();
                        } else {   
                            app.offer(
                                true /*option to skip | sets game.displayinfo.showoptiontoskip=boolean */,
                                false /*allows multiple choices | sets game.displayinfo.allowformultipleselections=boolean */, 
                                ['hand'] /* available cards to choose from | game.displayinfo.selectionzone={'hand|discard|options|planets|research|rolecards'}, sets choices=array if specified*/, 
                                'subchoices' /* label for where the choice is stored | set with game[label]=*/,
                                app.phasefinishfunction /*callback that handles the choice or finishes the phase*/, 
                            );
                        }
                    }
                },
                {
                    'Streamlining Your Empire':
                    ()=>{        
                        if (app.get().game.players[app.get().game.acting_player_index].permanents.filter( (el)=>{return el.type=='streamlining'} ).length == 0 || app.get().game.choices[0].name != 'Streamline Empire' || app.get().game.choices[0].name == 'Skip'){
                            app.phasefinishfunction();
                        } else {   
                            app.research(app.get().game.choices, app.get().game.players[app.get().game.acting_player_index], 1);
                        }
                    }
                },
                {
                    "Would you like to Utilize Your Empire's Hyperefficiency":
                    ()=>{        
                        if (app.get().game.players[app.get().game.acting_player_index].permanents.filter( (el)=>{return el.type=='hyperefficiency'} ).length == 0){
                            app.phasefinishfunction();
                        } else {   
                            app.offer(
                                false /*option to skip | sets game.displayinfo.showoptiontoskip=boolean */,
                                false /*allows multiple choices | sets game.displayinfo.allowformultipleselections=boolean */, 
                                ['options', [{name:'Decline'}, {name:'Utilize Hyperefficiency'}]] /* available cards to choose from | game.displayinfo.selectionzone={'hand|discard|options|planets|research|rolecards'}, sets choices=array if specified*/, 
                                'choices' /* label for where the choice is stored | set with game[label]=*/,
                                app.phasefinishfunction /*callback that handles the choice or finishes the phase*/, 
                            );
                        }
                    }
                },
                {
                    'Choose a Card from Your Hand to Remove from the Game':
                    ()=>{        
                        if (app.get().game.players[app.get().game.acting_player_index].permanents.filter( (el)=>{return el.type=='hyperefficiency'} ).length == 0 || app.get().game.choices[0].name != 'Utilize Hyperefficiency'){
                            app.phasefinishfunction();
                        } else {   
                            app.offer(
                                true /*option to skip | sets game.displayinfo.showoptiontoskip=boolean */,
                                true /*allows multiple choices | sets game.displayinfo.allowformultipleselections=boolean */, 
                                ['hand'] /* available cards to choose from | game.displayinfo.selectionzone={'hand|discard|options|planets|research|rolecards'}, sets choices=array if specified*/, 
                                'subchoices' /* label for where the choice is stored | set with game[label]=*/,
                                app.phasefinishfunction /*callback that handles the choice or finishes the phase*/, 
                            );
                        }
                    }
                },
                {
                    'Your Empire is Hyperefficient':
                    ()=>{        
                        if (app.get().game.players[app.get().game.acting_player_index].permanents.filter( (el)=>{return el.type=='hyperefficiency'} ).length == 0 || app.get().game.choices[0].name != 'Utilize Hyperefficiency' || app.get().game.choices[0].name == 'Skip'){
                            app.phasefinishfunction();
                        } else {   
                            app.research(app.get().game.choices, app.get().game.players[app.get().game.acting_player_index], app.get().game.choices.length);
                        }
                    }
                },
                {
                    'Choose any Cards you would like to Discard':
                    ()=>{ 
                        app.offer(
                            true /*option to skip | sets game.displayinfo.showoptiontoskip=boolean */,
                            true /*allows multiple choices | sets game.displayinfo.allowformultipleselections=boolean */, 
                            ['hand'] /* available cards to choose from | game.displayinfo.selectionzone={'hand|discard|options|planets|research|rolecards'}, sets choices=array if specified*/, 
                            'choices' /* label for where the choice is stored | set with game[label]=*/,
                            app.phasefinishfunction /*callback that handles the choice or finishes the phase*/, 
                        );
                    }
                },
                {
                    'Discarding your Selected Cards':
                    ()=>{ 
                        if(app.get().game.choices[0].name=="Skip"){
                            app.phasefinishfunction();
                        } else {
                            let game = app.get().game;
                            for (let i in game.choices){
                                // obsolete after drag and dop additions game.players[app.get().game.acting_player_index].hand = game.players[app.get().game.acting_player_index].hand.filter((el)=>{return el.identifier != game.choices[i].identifier});
                                game.players[app.get().game.acting_player_index].discard.push(game.choices[i]);
                            }
                            app.set({'game':game});
                            app.phasefinishfunction(true);
                        }
                    }
                }
            ]
        },
        //cleanup : 1
        //  -> cleanup
        {
            'cleanup':
            [
                {
                    'Drawing up to your Hand Size':
                    ()=>{ 
                        app.cleanup();
                        let game = app.get().game;
                        let handsize = game.players[app.get().game.acting_player_index].handsize;
                        for (let index in game.players[app.get().game.acting_player_index].settled_planets){
                            handsize+=game.players[app.get().game.acting_player_index].settled_planets[index].handsize_modifier;
                        }
                        for (let index in game.players[app.get().game.acting_player_index].conquered_planets){
                            handsize+=game.players[app.get().game.acting_player_index].conquered_planets[index].handsize_modifier;
                        }
                        let l = game.players[app.get().game.acting_player_index].hand.length;
                        if (l < handsize){
                            app.draw(game.players[app.get().game.acting_player_index], handsize-l );
                        }
                        for (let i in game.players){
                            game.players[i].boostingicons = {'survey':0,'warfare':0,'colonize':0,'produce':0,'trade':0,'research':0};
                        }
                        if (app.get().game.started && app.checkforendgame() && (game.players.reduce((t,p)=>{return t+p.rounds},0))%game.number_of_players == 0){
                            app.totalinfluence();
                            game.nextphase = app.endgame;
                        }
                        app.set({'game':game});
                        app.phasefinishfunction(true);
                    }
                },
                {
                    'Pass the device to the Next Player':
                    ()=>{
                        let game = app.get().game;
                        game.displayinfo.selectionzone='';
                        game.displayinfo.showoptiontoskip=false;
                        game.displayinfo.allowformultipleselections=false;
                        game.passp=false;
                        game.passt=true;
                        app.set({'game':game});
                    }
                },
                {
                    'You passed the Turn':
                    ()=>{
                        let game = app.get().game;
                        //app.togglepasstoplayer();
                        game.passt=false;
                        app.set({'game':game});
                        app.phasefinishfunction(true);
                    }
                },
            ]
        },
    ],
    'players':[],
    'winner':false,
    'stacks':{
        'pilecount':{
            'research':20,
            'producetrade':16,
            'colonize':20,
            'warfare':16,
            'survey':20
        },
        'survey':0,
        'warfare':1,
        'colonize':2,
        'producetrade':3,
        'research':4,
        'rolecards':[
            {
                'type' : 'survey',
                'selected':false,
                'icons' : {'survey':1,'warfare':0,'colonize':0,'produce':0,'trade':0,'research':0},
                'name' : 'Survey',
                'image' : null
            },{
                'type' : 'warfare',
                'selected':false,
                'icons' : {'survey':0,'warfare':1,'colonize':0,'produce':0,'trade':0,'research':0},
                'name' : 'Warfare',
                'image' : null
            },{
                'type' : 'colonize',
                'selected':false,
                'icons' : {'survey':0,'warfare':0,'colonize':1,'produce':0,'trade':0,'research':0},
                'name' : 'Colonize',
                'image' : null
            },{
                'type' : 'producetrade',
                'selected':false,
                'icons' : {'survey':0,'warfare':0,'colonize':0,'produce':1,'trade':1,'research':0},
                'name' : 'Produce / Trade',
                'image' : null,
            },{
                'type' : 'research',
                'selected':false,
                'icons' : {'survey':0,'warfare':0,'colonize':0,'produce':0,'trade':0,'research':1},
                'name' : 'Research',
                'image' : null,
                'research_deck':[]
            }
        ],
    },
    
};
//let url = 'ws://temperate-isle.herokuapp.com:3030';
let url = location.origin.replace(/^http/, 'ws');//'ws://192.168.1.6:3030';
let lobby =
{
    screenname:'',
    url:url,
    sets: ['Base Game'],
    number_of_players:[ 2, 3, 4],
    existinggames:[],
}
 
game.nonce=nonce;
const app = new App({
	target: document.body,
	data: {
        lobby: lobby,
        game: game,
        phases: game.gamephases,
	}
});
export default app;