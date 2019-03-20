import App from './App.html';
let nonce = 0;
let game = {
    'passtoplayer':false,
    'nonce':0,
    'nextphase':()=>{},
    'displayinfo':{
        'selectionzone':'',
        'dragged':null,
        'showoptiontoskip':false,
        'allowformultipleselections':false,
        'center_or_planets':true, //true = center, false = planets
        'choicelabel':'choices',
        'callback':()=>{app.phasefinishfunction}
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
    'currentphase':-1,
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
                                app.send({'game':game});
                                game = app.get().game;
                                game.leading_player_index = (game.leading_player_index+1)%game.number_of_players;
                                game.acting_player_index=game.leading_player_index;
                                game.leadingplayer = game.players[game.leading_player_index];
                                game.acting_player = game.players[game.leading_player_index];
                                app.send({'game':game});
                                app.openFullscreen();
                                document.dispatchEvent(new Event('pass_turn'));
                                
                            }
                            app.phasefinishfunction();
                        }
                }
            ]
        },

        // action : 2
        //      choose from hand an action to play or skip
        //      -> set as activeaction
        {
            'action':
            [
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

                                player.activeaction=card.type;
                                // limbo = limbo.filter(
                                //     (el)=>{return card.identifier != el.identifier;}
                                // );
                                limbo.push(
                                    {'final_destination_label':'discard', 
                                    ...hand.filter(
                                            (el)=>{return card.identifier == el.identifier;}
                                        )[0]
                                    }
                                );
                                 hand = hand.filter(
                                    (el)=>{return card.identifier != el.identifier}
                                );
                                // player.limbo = limbo;
                                player.hand=hand;
                                app.send({'game':game});
                                app.phasefinishfunction();
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
                            if (app.get().game.acting_player.activeaction!='colonize'){
                                app.phasefinishfunction();
                            } else {    
                                app.offer(
                                    false /*option to skip | sets game.displayinfo.showoptiontoskip=boolean */,
                                    false /*allows multiple choices | sets game.displayinfo.allowformultipleselections=boolean */, 
                                    ['options', [{name:'colonize'}, {name:'settle_colonies'}]] /* available cards to choose from | game.displayinfo.selectionzone={'hand|discard|options|planets|research|rolecards'}, sets choices=array if specified*/, 
                                    'choices' /* label for where the choice is stored | set with game[label]=*/,
                                    app.phasefinishfunction /*callback that handles the choice or finishes the phase*/, 
                                );
                            }
                        }
                },
                {
                    'Choose an Unsettled Planet to Settle':
                        ()=>{        
                            if (app.get().game.acting_player.activeaction != 'colonize' || app.get().game.choices[0].name != 'settle_colonies'){
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
                            if (app.get().game.acting_player.activeaction != 'colonize' || app.get().game.choices[0].name != 'settle_colonies'){
                                app.phasefinishfunction();
                            } else {   
								app.settle_colonies(app.get().game.subchoices[0], app.get().game.acting_player);
                                app.phasefinishfunction();
                            }
                        }
                },
                {
                    'Choose an Unsettled Planet to Colonize':
                        ()=>{        
                            if (app.get().game.acting_player.activeaction != 'colonize' || app.get().game.choices[0].name != 'colonize'){
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
                            if (app.get().game.acting_player.activeaction != 'colonize' || app.get().game.choices[0].name != 'colonize'){
                                app.phasefinishfunction();
                            } else {
                                app.colonize(app.get().game.subchoices[0], app.get().game.acting_player.limbo , app.get().game.acting_player.limbo.filter((el)=>{ return el.type == 'colonize'})[0]);
                                app.phasefinishfunction();
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
                            if (app.get().game.acting_player.activeaction!='producetrade'){
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
                            if (app.get().game.acting_player.activeaction != 'producetrade' || app.get().game.choices[0].name != 'produce'){
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
                            if (app.get().game.acting_player.activeaction != 'producetrade' || app.get().game.choices[0].name != 'produce'){
                                app.phasefinishfunction();
                            } else {    
                                app.produce(app.get().game.subchoices);
                                app.phasefinishfunction();
                            }
                        }
                },
                {
                    'Choose a Planet to Trade Resources from':
                        ()=>{        
                            if (app.get().game.acting_player.activeaction != 'producetrade' || app.get().game.choices[0].name != 'trade'){
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
                            if (app.get().game.acting_player.activeaction != 'producetrade' || app.get().game.choices[0].name != 'trade'){
                                app.phasefinishfunction();
                            } else {    
                                app.trade(app.get().game.subchoices,app.get().game.acting_player);
                                app.phasefinishfunction();
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
                            if (app.get().game.acting_player.activeaction != 'politics' ){
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
                        if (app.get().game.acting_player.activeaction != 'politics' ){
                            app.phasefinishfunction();
                        } else {    
                            app.politics(app.get().game.acting_player.limbo.filter((el)=>{ return el.type == 'politics'})[0], app.get().game.choices[0], app.get().game.acting_player);
                            app.phasefinishfunction();
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
                            if (app.get().game.acting_player.activeaction != 'research' ){
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
                        if (app.get().game.acting_player.activeaction != 'research' ){
                            app.phasefinishfunction();
                        } else {    
                            app.research(app.get().game.choices, app.get().game.acting_player);
                           app.phasefinishfunction();
                        }
                    }
                },
                // #######################################################################################################################################################################################
                // survey : 1
                //      -> survey
                {
                    'Surveying your Empire':
                        ()=>{        
                            if (app.get().game.acting_player.activeaction != 'survey' ){
                               app.phasefinishfunction();
                            } else {    
                                app.survey(app.get().game.acting_player);
                                app.phasefinishfunction();
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
                            if (app.get().game.acting_player.activeaction != 'warfare' ){
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
                        if (app.get().game.acting_player.activeaction != 'warfare' || app.get().game.choices[0].name!='Collect a Starfighter'){
                            app.phasefinishfunction();
                        } else {    
                            app.warfare(app.get().game.acting_player);
                            app.phasefinishfunction();
                        }
                    }
                },
                {
                    'Choose a Planet to Conquer':
                    ()=>{        
                        if (app.get().game.acting_player.activeaction != 'warfare' || app.get().game.choices[0].name!='Conquer a Planet'){
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
                        if (app.get().game.acting_player.activeaction != 'warfare' || app.get().game.choices[0].name!='Conquer a Planet'){
                            app.phasefinishfunction();
                        } else {    
                            app.conquer(app.get().game.subchoices[0], app.get().game.acting_player);
                            app.phasefinishfunction();
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
                        if (app.get().game.acting_player.activeaction != 'improved_colonize' || app.get().game.choices[0].name!='settle'){
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
                        if (app.get().game.acting_player.activeaction != 'improved_colonize' || app.get().game.choices[0].name!='settle'){
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
                        if (app.get().game.acting_player.activeaction != 'improved_colonize' || app.get().game.choices[0].name!='settle'){
                            app.phasefinishfunction();
                        } else {    
                            app.settle_colonies(app.get().game.subchoices[0], app.get().game.acting_player);
                            app.phasefinishfunction();
                        }
                    }
                },
                {
                    'Choose between Settling or Colonizing a Planet':
                        ()=>{   
                            if (app.get().game.acting_player.activeaction!='improved_colonize'){
                                app.phasefinishfunction();
                            } else {    
                                app.offer(
                                    false /*option to skip | sets game.displayinfo.showoptiontoskip=boolean */,
                                    false /*allows multiple choices | sets game.displayinfo.allowformultipleselections=boolean */, 
                                    ['options', [{name:'colonize'}, {name:'settle_colonies'}]] /* available cards to choose from | game.displayinfo.selectionzone={'hand|discard|options|planets|research|rolecards'}, sets choices=array if specified*/, 
                                    'choices' /* label for where the choice is stored | set with game[label]=*/,
                                    app.phasefinishfunction /*callback that handles the choice or finishes the phase*/, 
                                );
                            }
                        }
                },
                {
                    'Choose an Unsettled Planet to Settle':
                        ()=>{        
                            if (app.get().game.acting_player.activeaction != 'improved_colonize' || app.get().game.choices[0].name != 'settle_colonies'){
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
                            if (app.get().game.acting_player.activeaction != 'improved_colonize' || app.get().game.choices[0].name != 'settle_colonies'){
                                app.phasefinishfunction();
                            } else {
								app.settle_colonies(app.get().game.subchoices[0], app.get().game.acting_player);
                                app.phasefinishfunction();
                            }
                        }
                },
                {
                    'Choose an Unsettled Planet to Colonize':
                        ()=>{        
                            if (app.get().game.acting_player.activeaction != 'improved_colonize' || app.get().game.choices[0].name != 'colonize'){
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
                            if (app.get().game.acting_player.activeaction != 'improved_colonize' || app.get().game.choices[0].name != 'colonize'){
                                app.phasefinishfunction();
                            } else {    
                                app.colonize(app.get().game.subchoices[0], app.get().game.acting_player.limbo , app.get().game.acting_player.limbo.filter((el)=>{ return el.type == 'improved_colonize'})[0]);
                                app.phasefinishfunction();
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
                            if (app.get().game.acting_player.activeaction != 'improved_production' ){
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
                            if (app.get().game.acting_player.activeaction != 'improved_production' || app.get().game.choices[0].name=='Skip' ){
                                app.phasefinishfunction();
                            } else {   
                                app.produce(app.get().game.choices);
                                app.phasefinishfunction();
                            }
                        }
                },
                {
                    'Choose an empty Production Zone to Produce in':
                        ()=>{        
                            if (app.get().game.acting_player.activeaction != 'improved_production' ){
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
                            if (app.get().game.acting_player.activeaction != 'improved_production'|| app.get().game.choices[0].name=='Skip' ){
                                app.phasefinishfunction();
                            } else {   
                                app.produce(app.get().game.choices);
                                app.phasefinishfunction();
                            }
                        }
                },
                // #######################################################################################################################################################################################
                // improved_trade : 1
                //      -> improved_trade
                {
                    'Trading your Stocks and Bonds':
                        ()=>{
                            if (app.get().game.acting_player.activeaction != 'improved_trade' ){
                                app.phasefinishfunction();
                            } else {   
                                let game = app.get().game;
                                game.acting_player.influence.push(game.influence.pop());
                                app.send({'game':game});
                                app.phasefinishfunction();
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
                            if (app.get().game.acting_player.activeaction != 'improved_research' ){
                                app.phasefinishfunction();
                            } else {    
                                app.draw(app.get().game.acting_player);
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
                        if (app.get().game.acting_player.activeaction != 'improved_research' ){
                            app.phasefinishfunction();
                        } else {    
							research(app.get().game.choices, app.get().game.acting_player, 3);
                            app.phasefinishfunction();
                        }
                    }
                },
                // #######################################################################################################################################################################################
                // improved_survey : 1
                //      -> improved_survey
                {
                    'Drawing your Cards':
                    ()=>{        
                        if (app.get().game.acting_player.activeaction != 'improved_survey' ){
                            app.phasefinishfunction();
                        } else {    
            				app.draw(app.get().game.acting_player);
            				app.draw(app.get().game.acting_player);
            				app.draw(app.get().game.acting_player);
                            app.phasefinishfunction();
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
                            if (app.get().game.acting_player.activeaction != 'improved_warfare' ){
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
                        if (app.get().game.acting_player.activeaction != 'improved_warfare' || app.get().game.choices[0].name!='Collect a Starfighter'){
                            app.phasefinishfunction();
                        } else {    
                            app.warfare(app.get().game.acting_player);
                            app.warfare(app.get().game.acting_player);
                            app.phasefinishfunction();
                        }
                    }
                },
                {
                    'Choose a Planet to Conquer':
                    ()=>{        
                        if (app.get().game.acting_player.activeaction != 'improved_warfare' || app.get().game.choices[0].name!='Conquer a Planet'){
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
                        if (app.get().game.acting_player.activeaction != 'improved_warfare' || app.get().game.choices[0].name!='Conquer a Planet'){
                            app.phasefinishfunction();
                        } else {    
                            app.conquer(app.get().game.subchoices[0], app.get().game.acting_player);
                            app.phasefinishfunction();
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
                        if (app.get().game.acting_player.activeaction != 'mobilization'){
                            app.phasefinishfunction();
                        } else {    
                            app.warfare(app.get().game.acting_player);
                            app.warfare(app.get().game.acting_player);
                            app.phasefinishfunction();
                        }
                    }
                },
               
                // #######################################################################################################################################################################################
                // survey_team : 1
                //      -> survey_team
                {
                    'Adding Top Card of the Planet deck to your Empire':
                        ()=>{
                            if (app.get().game.acting_player.activeaction != 'survey_team'){
                                app.phasefinishfunction();
                            } else {    
                                let {game:game, game:{acting_player:player,planet_deck:planet_deck}} = app.get();
                                let planet = planet_deck.pop();
                                player.unsettled_planets.push(planet);
                                app.send({'game':game});
                                app.phasefinishfunction();
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
                        if (app.get().game.acting_player.activeaction != 'war_path' ){
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
                        if (app.get().game.acting_player.activeaction != 'war_path' || app.get().game.choices[0].name!='Skip'){
                            app.phasefinishfunction();
                        } else {    
                            app.conquer(app.get().game.choices[0], app.get().game.acting_player);
                            app.phasefinishfunction();
                        }
                    }
                },
                {
                    'Choose a Planet to Conquer':
                    ()=>{        
                        if (app.get().game.acting_player.activeaction != 'war_path' ){
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
                        if (app.get().game.acting_player.activeaction != 'war_path' || app.get().game.choices[0].name!='Skip'){
                            app.phasefinishfunction();
                        } else {    
                            app.conquer(app.get().game.choices[0], app.get().game.acting_player);
                            app.phasefinishfunction();
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
                            if (app.get().game.acting_player.activeaction != 'terraforming'){
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
                            if (app.get().game.acting_player.activeaction != 'terraforming' || app.get().game.choices[0].name != 'colonize'){
                                app.phasefinishfunction();
                            } else {    
                                app.colonize(app.get().game.choices[0], app.get().game.acting_player.limbo , app.get().game.acting_player.limbo.filter((el)=>{ return el.type == 'terraforming'})[0]);
                                if (app.get().game.choices[0].hosted_colonies.length > 0){
                                    let c = app.get().game.choices[0].hosted_colonies.reduce((acc, cur)=>{acc+cur.icons.colonize});
                                    if (c >= app.get().game.choices[0].settle_cost){
                                        app.settle_colonies(app.get().game.choices[0], app.get().game.acting_player);
                                    }
                                }
                                app.phasefinishfunction();
                            }
                        }
                },
                // #######################################################################################################################################################################################
                // genetic_engineering :1
                //      -> genetic_engineering
                {
                    'Engineering Genetics':
                    ()=>{
                        if (app.get().game.acting_player.activeaction != 'genetic_engineering'){
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
                            if (app.get().game.acting_player.activeaction != 'artificial_intelligence'){
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
                            if (app.get().game.acting_player.activeaction != 'artificial_intelligence'){
                                app.phasefinishfunction();
                            } else {    
                                let {game:game,game:{acting_player:player}}=app.get();
                                if (game.stacks.pilecount[game.choices[0].type] >= 1){
                                    player.hand.push(Object.assign({'identifier':app.generate_unique_identifier()}, game.stacks.rolecards[game.stacks[game.choices[0].type]]));
                                    game.stacks.pilecount[game.choices[0].type]--;
                                }
                                app.send({'game':game});
                                app.phasefinishfunction();
                            }
                        }
                },
                {
                    'Select a Role Card to take into your Hand':
                        ()=>{
                            if (app.get().game.acting_player.activeaction != 'artificial_intelligence'){
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
                            if (app.get().game.acting_player.activeaction != 'artificial_intelligence'){
                                app.phasefinishfunction();
                            } else {    
                                let {game:game,game:{acting_player:player}}=app.get();
                                if (game.stacks.pilecount[game.choices[0].type] >= 1){
                                    player.hand.push(Object.assign({'identifier':app.generate_unique_identifier()}, game.stacks.rolecards[game.stacks[game.choices[0].type]]));
                                    game.stacks.pilecount[selected_center_card.type]--;
                                }
                                app.send({'game':game});
                                app.phasefinishfunction();
                            }
                        }
                },
                // #######################################################################################################################################################################################
                // diverse_markets : 1
                //      -> diverse_markets
                {
                    'Diversifying Markets':
                    ()=>{
                        if (app.get().game.acting_player.activeaction != 'diverse_markets'){
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
                            if (app.get().game.acting_player.activeaction != 'specialization'){
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
                            if (app.get().game.acting_player.activeaction != 'specialization'){
                                app.phasefinishfunction();
                            } else {    
                                let game = app.get().game;
                                game.acting_player.specialization = game.choices[0].name;
                                app.phasefinishfunction();
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
                            if (app.get().game.acting_player.activeaction != 'data_network'){
                                app.phasefinishfunction();
                            } else {    
                                app.draw(app.get().game.acting_player);
                                app.draw(app.get().game.acting_player);
                                app.phasefinishfunction();
                            }
                        }
                },
                {
                    'Choose any number of Cards from your Hand to Remove from the Game':
                        ()=>{
                            if (app.get().game.acting_player.activeaction != 'data_network'){
                                app.phasefinishfunction();
                            } else {    
                                app.offer(
                                    true /*option to skip | sets game.displayinfo.showoptiontoskip=boolean */,
                                    true /*allows multiple choices | sets game.displayinfo.allowformultipleselections=boolean */, 
                                    ['hand'] /* available cards to choose from | game.displayinfo.selectionzone={'hand|discard|options|planets|research|rolecards'}, sets choices=array if specified*/, 
                                    'choices' /* label for where the choice is stored | set with game[label]=*/,
                                    app.phasefinishfunction /*callback that handles the choice or finishes the phase*/, 
                                );
                                app.phasefinishfunction();
                            }
                        }
                },
                {
                    'Removing the Selected Cards from the Game':
                        ()=>{
                            if (app.get().game.acting_player.activeaction != 'data_network' || app.get().game.choices[0].name == 'Skip'){
                                app.phasefinishfunction();
                            } else {    
                                let { game:game, game: { choices:choices, acting_player:player } } = app.get();
                                app.research(choices,player,choices.length);
                                app.phasefinishfunction();
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
                            game.acting_player.boostingicons[card.type]++;
                            let newcard = Object.assign({'identifier':app.generate_unique_identifier(), 'final_destination_label':'discard'},game.stacks.rolecards[game.stacks[card.type]]);
                            game.acting_player.limbo.push(newcard);
                            game.stacks.pilecount[card.type]--;
                        } else if (card.type!='colonize'){
                            game.acting_player.boostingicons[card.type]++;
                        }
                        game.acting_player.activerole = card.type;
                        app.send({'game':game});
                        app.phasefinishfunction();
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
                        if (cards[0].name=='Skip'){
                            app.phasefinishfunction();
                        } else {
                            for (let i in cards){
                                player.boostingicons[cards[i].type]++;
                                limbo.push(
                                    {'final_destination_label':'discard', 
                                    ...hand.filter(
                                        (el)=>{return cards[i].identifier == el.identifier;}
                                    )[0]
                                    }
                                );
                                hand = hand.filter(
                                    (el)=>{return cards[i].identifier != el.identifier}
                                );
                            }
                            player.hand=hand;
                            //TODO: tally up icons on planets
                            //TODO: tally up icons on technologies
                            app.send({'game':game});
                            app.phasefinishfunction();
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
                            if (app.get().game.acting_player.activerole!='colonize'){
                                app.phasefinishfunction();
                            } else {    
                                app.offer(
                                    false /*option to skip | sets game.displayinfo.showoptiontoskip=boolean */,
                                    false /*allows multiple choices | sets game.displayinfo.allowformultipleselections=boolean */, 
                                    ['options', [{name:'colonize'}, {name:'settle_colonies'}]] /* available cards to choose from | game.displayinfo.selectionzone={'hand|discard|options|planets|research|rolecards'}, sets choices=array if specified*/, 
                                    'choices' /* label for where the choice is stored | set with game[label]=*/,
                                    app.phasefinishfunction /*callback that handles the choice or finishes the phase*/, 
                                );
                            }
                        }
                },
                {
                    'Choose an Unsettled Planet to Settle':
                        ()=>{        
                            if (app.get().game.acting_player.activerole != 'colonize' || app.get().game.choices[0].name != 'settle_colonies'){
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
                            if (app.get().game.acting_player.activerole != 'colonize' || app.get().game.choices[0].name != 'settle_colonies'){
                                app.phasefinishfunction();
                            } else {   
								app.settle_colonies(app.get().game.subchoices[0], app.get().game.acting_player);
                                app.phasefinishfunction();
                            }
                        }
                },
                {
                    'Choose an Unsettled Planet to Colonize':
                        ()=>{        
                            if (app.get().game.acting_player.activerole != 'colonize' || app.get().game.choices[0].name != 'colonize'){
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
                            if (app.get().game.acting_player.activerole != 'colonize' || app.get().game.choices[0].name != 'colonize'){
                                app.phasefinishfunction();
                            } else {   
                                let j = 0; 
                                let planet = app.get().game.subchoices[j];
                                for (let i = 0; i < app.get().game.acting_player.boostingicons.colonize; i++ ){
                                    
                                    if (planet.hosted_colonies.length > 0 ){
                                        if(planet.hosted_colonies.reduce((acc, cur)=>{return acc+cur.icons.colonize}) >= planet.settle_cost && j < app.get().game.subchoices.length-1 ){
                                            j++
                                            planet = app.get().game.subchoices[j];
                                        };
                                    }
                                    app.colonize(planet, app.get().game.acting_player.limbo , app.get().game.acting_player.limbo.filter((el)=>{ return el.type == 'colonize'})[0]);
                                }
                                app.phasefinishfunction();
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
                            if (app.get().game.acting_player.activerole!='producetrade'){
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
                            if (app.get().game.acting_player.activerole != 'producetrade' || app.get().game.choices[0].name != 'produce'){
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
                            if (app.get().game.acting_player.activerole != 'producetrade' || app.get().game.choices[0].name != 'produce'){
                                app.phasefinishfunction();
                            } else {
                                ///app.send( {'game': { 'acting_player':{ 'activerole':'produce' } , ...app.get().game} } )    
                                let game = app.get().game;
                                game.acting_player.activerole='produce';
                                app.send({'game':game});
                                let prd = app.produce(game.subchoices,game.acting_player.boostingicons.produce);
                                if (app.get().game.acting_player.activeaction='genetic_engineering'){
                                    for (let i in prd){
                                        if (prd[i] > 1){
                                            players[j].influence.push(game.influence.pop());
                                        }
                                    }
                                }
                                app.phasefinishfunction();
                            }
                        }
                },
                {
                    'Choose a Planet to Trade Resources from':
                        ()=>{        
                            if (app.get().game.acting_player.activerole != 'producetrade' || app.get().game.choices[0].name != 'trade'){
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
                            if (app.get().game.acting_player.activerole != 'producetrade' || app.get().game.choices[0].name != 'trade'){
                                app.phasefinishfunction();
                            } else {   
                                let game = app.get().game;
                                game.acting_player.activerole='trade';
                                app.send({'game':game}); 
                                let prd = app.trade(game.subchoices,game.acting_player, game.acting_player.boostingicons.trade);
                                if (app.get().game.acting_player.activeaction='diverse_markets'){
                                    for (let i in prd){
                                        if (prd[i] > 1){
                                            app.get().game.acting_player.influence.push(app.get().game.influence.pop());
                                        }
                                    }
                                }
                                if (app.get().game.acting_player.activeaction='specialization'){
                                    for ( let i in Array.from( prd[app.get.game.acting_player.specialization] ) ) {
                                        app.get().game.acting_player.influence.push(app.get().game.influence.pop());
                                    }
                                }
                                app.phasefinishfunction();
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
                            if (app.get().game.acting_player.activerole != 'research' ){
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
                        if (app.get().game.acting_player.activerole != 'research' ){
                        app.phasefinishfunction();
                        } else {    
                            let game = app.get().game;
                            if (game.choices[0].name!="Skip"){
                                //TODO check research card requirements
                                //check for number of planets and type of planets
                                let p = {'advanced':0,'metallic':0,'fertile':0};
                                [...game.acting_player.settled_planets, ...game.acting_player.conquered_planets].map(
                                    (el)=>{
                                        p[el.type]++;
                                    }
                                )
                                let condition = true;
                                for (let i in game.choices[0].planet_requirements){
                                    if (game.choices[0].planet_requirements[i] > p[i]){
                                        condition = false;
                                    }
                                }
                                if (condition && game.acting_player.boostingicons.research >= game.choices[0].research_cost){
                                    app.play(game.research_deck, game.acting_player.limbo, 'discard', game.choices[0].identifier);
                                }
                            }
                            app.phasefinishfunction();
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
                        if (app.get().game.acting_player.activerole != 'survey' ){
                            app.phasefinishfunction();
                        } else {    
                            let game = app.get().game;
                            //survey_role purchase, offer_to_boost explore_planet, present_as_choice, choose, catalog_planet, discard
                            for (let i = 0; i < game.acting_player.boostingicons.survey; i++){
                                app.explore_planet(game.acting_player); 
                            }
                            app.send({'game':game});
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
                            if (app.get().game.acting_player.activerole != 'survey' || app.get().game.choices[0].name=='Skip'){
                                app.phasefinishfunction();
                            } else {    
                                app.catalog_planet(app.get().game.acting_player);
                                app.phasefinishfunction();
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
                            if (app.get().game.acting_player.activerole != 'warfare' ){
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
                        if (app.get().game.acting_player.activerole != 'warfare' || app.get().game.choices[0].name!='Collect Starfighters'){
                            app.phasefinishfunction();
                        } else {    
                            for (let i = 0; i < game.acting_player.boostingicons.warfare; i++){
                                app.warfare(game.acting_player);
                            }
                            app.phasefinishfunction();
                        }
                    }
                },
                {
                    'Choose a Planet to Conquer':
                    ()=>{        
                        if (app.get().game.acting_player.activerole != 'warfare' || app.get().game.choices[0].name!='Conquer a Planet'){
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
                        if (app.get().game.acting_player.activerole != 'warfare' || app.get().game.choices[0].name!='Conquer a Planet'){
                            app.phasefinishfunction();
                        } else {    
                            app.conquer(app.get().game.subchoices[0], app.get().game.acting_player);
                            app.phasefinishfunction();
                        }
                    }
                },
                {
                    'Pass the device to the Next Player':
                    ()=>{
                        let game = app.get().game;
                        game.displayinfo.selectionzone='';
                        game.passp=true;
                        app.send({'game':game});
                    }
                },
                {
                    'You passed Priority':
                    ()=>{
                        let game = app.get().game;
                        app.togglepasstoplayer();
                        game.passp=false;
                        app.send({'game':game});
                        app.phasefinishfunction();
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
                            ['options', [{name:'dissent'}, {name:app.get().game.leadingplayer.activerole}]] /* available cards to choose from | game.displayinfo.selectionzone={'hand|discard|options|planets|research|rolecards'}, sets choices=array if specified*/, 
                            'choices' /* label for where the choice is stored | set with game[label]=*/,
                            app.phasefinishfunction /*callback that handles the choice or finishes the phase*/, 
                        );
                    }
                },
                {
                    'Dissenting':
                    ()=>{ 
                        let game = app.get().game;
                        game.acting_player.activerole=game.choices[0].name;
                        app.send({'game':game});
                        if (app.get().game.acting_player.activerole!='dissent'){
                            app.phasefinishfunction();
                        } else {    
                            app.draw(app.get().game.acting_player);
                            app.phasefinishfunction();
                        }
                    }
                }, //will auto pass to next phase if follow has been selected
                {
                    'Choose cards from your hand to Boost the effectiveness of your Role' :
                    ()=>{
                        if (app.get().game.acting_player.activerole=='dissent'){
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
                        if (app.get().game.acting_player.activerole=='dissent'){
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
                            if (cards[0].name=='Skip'){
                                app.phasefinishfunction();
                            } else {
                                for (let i in cards){
                                    player.boostingicons[cards[i].type]++;
                                    limbo.push(
                                        {'final_destination_label':'discard', 
                                        ...hand.filter(
                                            (el)=>{return cards[i].identifier == el.identifier;}
                                        )[0]
                                        }
                                    );
                                    hand = hand.filter(
                                        (el)=>{return cards[i].identifier != el.identifier}
                                    );
                                }
                                player.hand=hand;
                                //TODO: tally up icons on planets
                                //TODO: tally up icons on technologies
                                app.send({'game':game});
                                app.phasefinishfunction();
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
                            if (app.get().game.acting_player.activerole!='colonize'){
                               app.phasefinishfunction();
                            } else if ( game.acting_player.permanents.filter( (el)=>{return el.type=='bureaucracy'} ).length == 0){
                                let game = app.get().game;
                                game.choices=['colonize'];
                                app.phasefinishfunction();
                            } else {    
                                app.offer(
                                    false /*option to skip | sets game.displayinfo.showoptiontoskip=boolean */,
                                    false /*allows multiple choices | sets game.displayinfo.allowformultipleselections=boolean */, 
                                    ['options', [{name:'colonize'}, {name:'settle_colonies'}]] /* available cards to choose from | game.displayinfo.selectionzone={'hand|discard|options|planets|research|rolecards'}, sets choices=array if specified*/, 
                                    'choices' /* label for where the choice is stored | set with game[label]=*/,
                                    app.phasefinishfunction /*callback that handles the choice or finishes the phase*/, 
                                );
                            }
                        }
                },
                {
                    'Choose an Unsettled Planet to Settle':
                        ()=>{        
                            if (app.get().game.acting_player.activerole != 'colonize' || app.get().game.choices[0].name != 'settle_colonies'){
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
                            if (app.get().game.acting_player.activerole != 'colonize' || app.get().game.choices[0].name != 'settle_colonies'){
                                app.phasefinishfunction();
                            } else {   
								app.settle_colonies(app.get().game.subchoices[0], app.get().game.acting_player);
                                app.phasefinishfunction();
                            }
                        }
                },
                {
                    'Choose an Unsettled Planet to Colonize':
                        ()=>{        
                            if (app.get().game.acting_player.activerole != 'colonize' || app.get().game.choices[0].name != 'colonize'){
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
                            if (app.get().game.acting_player.activerole != 'colonize' || app.get().game.choices[0].name != 'colonize'){
                                app.phasefinishfunction();
                            } else {   
                                let j = 0; 
                                let planet = app.get().game.subchoices[j];
                                for (let i = 0; i < app.get().game.acting_player.boostingicons.colonize; i++ ){
                                    if (planet.hosted_colonies.length > 0 ) {
                                        if(planet.hosted_colonies.reduce((acc, cur)=>{acc+cur.icons.colonize}) >= planet.settle_cost && j < app.get().game.subchoices.length-1 ){
                                            j++
                                            planet = app.get().game.subchoices[j];
                                        };
                                    }
                                    app.colonize(planet, app.get().game.acting_player.limbo , app.get().game.acting_player.limbo.filter((el)=>{ return el.type == 'colonize'})[0]);
                                }
                                app.phasefinishfunction();
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
                        if (app.get().game.acting_player.activerole != 'produce'){
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
                        if (app.get().game.acting_player.activerole != 'produce'){
                            app.phasefinishfunction();
                        } else {
                            ///app.send( {'game': { 'acting_player':{ 'activerole':'produce' } , ...app.get().game} } )    
                            let game = app.get().game;
                            game.acting_player.activerole='produce';
                            app.send({'game':game});
                            app.produce(game.subchoices,game.acting_player.boostingicons.produce);
                            app.phasefinishfunction();
                        }
                    }
                },
                {
                    'Choose a Planet to Trade Resources from':
                        ()=>{        
                            if (app.get().game.acting_player.activerole != 'trade'){
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
                            if (app.get().game.acting_player.activerole != 'trade'){
                                app.phasefinishfunction();
                            } else {   
                                let game = app.get().game;
                                game.acting_player.activerole='trade';
                                app.send({'game':game}); 
                                app.trade(game.subchoices,game.acting_player, game.acting_player.boostingicons.trade);
                                app.phasefinishfunction();
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
                            if (app.get().game.acting_player.activerole != 'research' ){
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
                        if (app.get().game.acting_player.activerole != 'survey' ){
                        app.phasefinishfunction();
                        } else {    
                            let game = app.get().game;
                            if (game.choices[0].name!="Skip"){
                                //TODO check research card requirements
                                //check for number of planets and type of planets
                                let p = {'advanced':0,'metallic':0,'fertile':0};
                                [...game.acting_player.settled_planets, ...game.acting_player.conquered_planets].map(
                                    (el)=>{
                                        p[el.type]++;
                                    }
                                )
                                let condition = true;
                                for (let i in game.choices[0].planet_requirements){
                                    if (game.choices[0].planet_requirements[i] > p[i]){
                                        condition = false;
                                    }
                                }
                                if (condition && game.acting_player.boostingicons.research >= game.choices[0].research_cost){
                                    app.play(game.research_deck, game.acting_player.limbo, 'discard', game.choices[0].identifier);
                                }
                            }
                            app.phasefinishfunction();
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
                        if (app.get().game.acting_player.activerole != 'survey' ){
                            app.phasefinishfunction();
                        } else {    
                            let game = app.get().game;
                            //survey_role purchase, offer_to_boost explore_planet, present_as_choice, choose, catalog_planet, discard
                            for (let i = 0; i < game.acting_player.boostingicons.survey-1; i++){
                                app.explore_planet(game.acting_player); 
                            }
                            app.send({'game':game});
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
                            if (app.get().game.acting_player.activerole != 'survey' || app.get().game.choices[0].name=='Skip'){
                                app.phasefinishfunction();
                            } else {    
                                app.catalog_planet(app.get().game.acting_player);
                                app.phasefinishfunction();
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
                            if (app.get().game.acting_player.activerole != 'warfare' ){
                                app.phasefinishfunction();
                            } else if ( game.acting_player.permanents.filter( (el)=>{return el.type=='bureaucracy'} ).length == 0){
                                let game = app.get().game;
                                game.choices=['Collect Starfighters'];
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
                        if (app.get().game.acting_player.activerole != 'warfare' || app.get().game.choices[0].name!='Collect Starfighters'){
                            app.phasefinishfunction();
                        } else {    
                            for (let i = 0; i < game.acting_player.boostingicons.warfare; i++){
                                app.warfare(game.acting_player);
                            }
                            app.phasefinishfunction();
                        }
                    }
                },
                {
                    'Choose a Planet to Conquer':
                    ()=>{        
                        if (app.get().game.acting_player.activerole != 'warfare' || app.get().game.choices[0].name!='Conquer a Planet'){
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
                        if (app.get().game.acting_player.activerole != 'warfare' || app.get().game.choices[0].name!='Conquer a Planet'){
                            app.phasefinishfunction();
                        } else {    
                            app.conquer(app.get().game.subchoices[0], app.get().game.acting_player);
                            app.phasefinishfunction();
                        }
                    }
                },
                {
                    'Pass the device to the Next Player':
                    ()=>{
                        let game = app.get().game;
                        game.displayinfo.selectionzone='';
                        game.passp=true;
                        app.send({'game':game});
                    }
                },
                {
                    'You passed Priority':
                    ()=>{
                        let game = app.get().game;
                        game.passp=false;
                        app.send({'game':game});
                        app.phasefinishfunction();
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
                        if (app.get().game.acting_player.activeaction != 'mobilization'){
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
                        if (app.get().game.acting_player.activeaction != 'mobilization' || app.get().game.choices[0].name != 'mobilize'){
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
                        if (app.get().game.acting_player.activeaction != 'mobilization'){
                            app.phasefinishfunction();
                        } else {   
                            app.conquer(app.get().game.subchoices[0], app.get().game.acting_player); 
                            app.phasefinishfunction();
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
                                // obsolete after drag and dop additions game.acting_player.hand = game.acting_player.hand.filter((el)=>{return el.identifier != game.choices[i].identifier});
                                game.acting_player.discard.push(game.choices[i]);
                            }
                            app.send({'game':game});
                            app.phasefinishfunction();
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
                    }
                },
                {
                    'Pass the device to the Next Player':
                    ()=>{
                        let game = app.get().game;
                        game.displayinfo.selectionzone='';
                        game.passp=false;
                        game.passt=true;
                        app.send({'game':game});
                    }
                },
                {
                    'You passed the Turn':
                    ()=>{
                        let game = app.get().game;
                        app.togglepasstoplayer();
                        game.passt=false;
                        app.send({'game':game});
                        app.phasefinishfunction();
                    }
                },
            ]
        },
    ],
    'players':[],
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
                //warfare_role purchase, offer_to_boost present_as_choice, choose, conquer/warfare, discard
                //survey_role purchase, offer_to_boost explore_planet, present_as_choice, choose, catalog_planet, discard
                //research_role purchase, offer_to_boost present_as_choice, choose, purchase, discard
                //colonize_role purchase, offer_to_boost present_as_choice, choose, settle/colonize, discard
                //produce_role purchase, offer_to_boost present_as_choice, choose, produce, discard
                //trade_role purchase, offer_to_boost present_as_choice, choose, trade, discard
                //produce/trade_role present_as_choice, choose, produce_role/trade_role
                //produce/trade present_as_choice, choose, produce/trade
                'type' : 'survey',
                'selected':false,
                'action' : (callback)=>{
                    let game=app.get().game;
                    app.survey(game.acting_player);
                    app.send({'game':game});
                    callback();
                },
                'role' : {
                    'follower':(callback)=>{
						let game = app.get().game;
                        game.acting_player.boostingicons.survey--;
                        app.send({'game':game});
                        if (game.acting_player.boostingicons.survey>0){
                            game.acting_player.activerole.role.role.leader(callback);
                        }
                        else {
                            callback();
                        }
                    },
                    'leader':(callback)=>{
						let game = app.get().game;
                        //survey_role purchase, offer_to_boost explore_planet, present_as_choice, choose, catalog_planet, discard
                        for (let i = 0; i < game.acting_player.boostingicons.survey; i++){
                            app.explore_planet(game.acting_player); 
						}
						app.send({'game':game});
                        let callbackwrapper = ()=>{
							document.removeEventListener('choicemade',callbackwrapper);
							let game=app.get().game;
							app.catalog_planet(game.acting_player);
							app.send({'game':game});
                            callback();
						};
                        document.addEventListener('choicemade',callbackwrapper);
                        game.displayinfo.selectionzone='options';
                        game.displayinfo.allowformultipleselections = false;
                        game.displayinfo.showoptiontoskip = false;
                        app.send({'game':game});
                        app.present_as_choice(game.options);
                        
                    }
                },
                'icons' : {'survey':1,'warfare':0,'colonize':0,'produce':0,'trade':0,'research':0},
                'name' : 'Survey',
                'image' : null
            },{
                'type' : 'warfare',
                'selected':false,
                'action' : (callback)=>{
                    let game = app.get().game;
                    let callbackwrapper = ()=>{
                        document.removeEventListener('choicemade', callbackwrapper);
                        let game = app.get().game;
                        if(game.choices[0].name=='Collect a Starfighter'){
                            let game=app.get().game;
                            app.warfare(game.acting_player);
                            game = app.get().game;
                            app.send({'game':game});
                            callback();
                        }
                        else if(game.choices[0].name=='Conquer Planet'){
                            let callbackwrapper = ()=>{
                                document.removeEventListener('choicemade', callbackwrapper);
                                let game = app.get().game;
                                app.conquer(game.choices[0], game.acting_player);
                                app.send({'game':game});
                                callback();
                            };
                            document.addEventListener('choicemade', callbackwrapper);
                            game = app.get().game;
                            game.displayinfo.center_or_planets=false;
                            game.displayinfo.selectionzone='unsettled_planets';
                            game.displayinfo.allowformultipleselections=false;
                            game.displayinfo.showoptiontoskip=false;
                            app.send({'game':game});
                            app.present_as_choice(game.acting_player.unsettled_planets);
                        }
                    };
                    document.addEventListener('choicemade', callbackwrapper);
                    game = app.get().game;
                    game.displayinfo.selectionzone='options';
                    game.displayinfo.allowformultipleselections=false;
                    game.displayinfo.showoptiontoskip=false;
                    app.send({'game':game});
                    app.present_as_choice([{name:'Conquer Planet'}, {name:'Collect a Starfighter'}]);
                },
                'role' : {
                    'follower':(callback)=>{
                        let game=app.get().game;
                        for (let i = 0; i < game.acting_player.boostingicons.warfare; i++){
                            app.warfare(game.acting_player);
                        }
                        app.send({'game':game});
                        callback();},
                    'leader':(callback)=>{
                        let game = app.get().game;
                        let callbackwrapper = ()=>{
                            document.removeEventListener('choicemade', callbackwrapper);
                            let game = app.get().game;
                            if(game.choices[0].name=='Collect a Starfighter'){
                                let game=app.get().game;
                                for (let i = 0; i < game.acting_player.boostingicons.warfare; i++){
                                    app.warfare(game.acting_player);
                                }
                                game = app.get().game;
                                app.send({'game':game});
                                callback();
                            }
                            else if(game.choices[0].name=='Conquer Planet'){
                                let callbackwrapper = ()=>{
                                    document.removeEventListener('choicemade', callbackwrapper);
                                    let game = app.get().game;
                                    app.conquer(game.choices[0], game.acting_player);
                                    app.send({'game':game});
                                    callback();
                                };
                                document.addEventListener('choicemade', callbackwrapper);
                                game = app.get().game;
                                game.displayinfo.center_or_planets=false;
                                game.displayinfo.selectionzone='unsettled_planets';
                                game.displayinfo.allowformultipleselections=false;
                                game.displayinfo.showoptiontoskip=false;
                                app.send({'game':game});
                                app.present_as_choice(game.acting_player.unsettled_planets);
                            }
                        };
                        document.addEventListener('choicemade', callbackwrapper);
                        game = app.get().game;
                        game.displayinfo.selectionzone='options';
                        game.displayinfo.allowformultipleselections=false;
                        game.displayinfo.showoptiontoskip=false;
                        app.send({'game':game});
                        app.present_as_choice([{name:'Conquer Planet'}, {name:'Collect a Starfighter'}]);
                    },
                },
                'icons' : {'survey':0,'warfare':1,'colonize':0,'produce':0,'trade':0,'research':0},
                'name' : 'Warfare',
                'image' : null
            },{
                'type' : 'colonize',
                'selected':false,
                'action' : (callback)=>{
                    let game = app.get().game;
                    let callbackwrapper = ()=>{
                        document.removeEventListener('choicemade', callbackwrapper);
                        let game = app.get().game;
                        if(game.choices[0].name=='colonize'){
                            let callbackwrapper = ()=>{
                                document.removeEventListener('choicemade', callbackwrapper);
                                let game=app.get().game;
                                app.colonize(game.choices[0], game.acting_player.limbo ,game.acting_player.activeaction);
								app.send({'game':game});
								callback();
                            };
                            document.addEventListener('choicemade', callbackwrapper);
                        }
                        else if(game.choices[0].name=='settle_colonies'){
                            let callbackwrapper = ()=>{
                                document.removeEventListener('choicemade', callbackwrapper);
								let game = app.get().game;
								app.settle_colonies(game.choices[0], game.acting_player);
								app.send({'game':game});
								callback();
                            };
                            document.addEventListener('choicemade', callbackwrapper);
                        }
                        game = app.get().game;
                        game.displayinfo.center_or_planets=false;
                        game.displayinfo.selectionzone='unsettled_planets';
                        game.displayinfo.allowformultipleselections = false;
                        game.displayinfo.showoptiontoskip = false;
                        app.send({'game':game});
                        app.present_as_choice(game.acting_player.unsettled_planets);
                    };
                    document.addEventListener('choicemade', callbackwrapper);
                    game = app.get().game;
                    game.displayinfo.selectionzone='options';
                    game.displayinfo.allowformultipleselections = false;
                    game.displayinfo.showoptiontoskip = false;
                    app.send({'game':game});
                    app.present_as_choice([{name:'colonize'}, {name:'settle_colonies'}]);
                },
                'role' : {
                    'follower': (callback)=>{
                        let game = app.get().game;
                        let callbackwrapper = ()=>{
                            document.removeEventListener('choicemade', callbackwrapper);
                            let game=app.get().game;
                            app.colonize(game.choices[0], game.acting_player.limbo ,game.acting_player.activerole.role, true);
                            app.send({'game':game});
                            callback();
                        };
                        document.addEventListener('choicemade', callbackwrapper);
                    
                        game = app.get().game;
                        game.displayinfo.center_or_planets=false;
                        game.displayinfo.selectionzone='unsettled_planets';
                        game.displayinfo.allowformultipleselections = false;
                        game.displayinfo.showoptiontoskip = false;
                        app.send({'game':game});
                        app.present_as_choice(game.acting_player.unsettled_planets);
                    },
                    'leader': (callback)=>{
                        let game = app.get().game;
                        let callbackwrapper = ()=>{
                            document.removeEventListener('choicemade', callbackwrapper);
                            let game = app.get().game;
                            if(game.choices[0].name=='colonize'){
                                let callbackwrapper = ()=>{
                                    document.removeEventListener('choicemade', callbackwrapper);
                                    let game=app.get().game;
                                    app.colonize(game.choices[0], game.acting_player.limbo, game.acting_player.activerole.role, true);
                                    app.send({'game':game});
                                    callback();
                                };
                                document.addEventListener('choicemade', callbackwrapper);
                            }
                            else if(game.choices[0].name=='settle_colonies'){
                                let callbackwrapper = ()=>{
                                    document.removeEventListener('choicemade', callbackwrapper);
                                    let game = app.get().game;
                                    app.settle_colonies(game.choices[0], game.acting_player);
                                    app.send({'game':game});
                                    callback();
                                };
                                document.addEventListener('choicemade', callbackwrapper);
                            }
                            game = app.get().game;
                            game.displayinfo.center_or_planets=false;
                            game.displayinfo.selectionzone='unsettled_planets';
                            game.displayinfo.allowformultipleselections = false;
                            game.displayinfo.showoptiontoskip = false;
                            app.send({'game':game});
                            app.present_as_choice(game.acting_player.unsettled_planets);
                        };
                        document.addEventListener('choicemade', callbackwrapper);
                        game = app.get().game;
                        game.displayinfo.selectionzone='options';
                        game.displayinfo.allowformultipleselections = false;
                        game.displayinfo.showoptiontoskip = false;
                        app.send({'game':game});
                        app.present_as_choice([{name:'colonize'}, {name:'settle_colonies'}]);
                    },
                },
                'icons' : {'survey':0,'warfare':0,'colonize':1,'produce':0,'trade':0,'research':0},
                'name' : 'Colonize',
                'image' : null
            },{
                'type' : 'producetrade',
                'selected':false,
                'action' : (callback)=>{
                    let callbackwrapper = ()=>{
						let game = app.get().game;
                        document.removeEventListener('choicemade', callbackwrapper);
                        if(game.choices[0].name=='produce'){
                            let callbackwrapper = ()=>{
                                document.removeEventListener('choicemade', callbackwrapper);
                                app.produce(game.choices);
                                callback();
                            }
                            document.addEventListener('choicemade', callbackwrapper);
                        }
                        else if(game.choices[0].name=='trade'){
                            let callbackwrapper = ()=>{
                                document.removeEventListener('choicemade', callbackwrapper);
                                app.trade(game.choices,game.acting_player);
                                callback();
                            }
                            document.addEventListener('choicemade', callbackwrapper);
                        }
                        game.displayinfo.center_or_planets=false;
                        game.displayinfo.selectionzone='settled_&_conquered_planets';
                        game.displayinfo.allowformultipleselections=false;
                        game.displayinfo.showoptiontoskip=false;
                        app.present_as_choice([...game.acting_player.settled_planets, ...game.acting_player.conquered_planets]);
                    }
                    game.displayinfo.selectionzone='options';
                    game.displayinfo.allowformultipleselections=false;
                    game.displayinfo.showoptiontoskip=false;
                    document.addEventListener('choicemade', callbackwrapper);
                    app.present_as_choice([{name:'produce'}, {name:'trade'}]);
                },
                'role' : {
                    'follower':()=>{
						let game = app.get().game;
                        game.acting_player.activerole.role.role.leader(callback);
                        app.choose(game.tradeorproduce);
                    },
                    'leader': (callback)=>{
                        let callbackwrapper = ()=>{
                            let game = app.get().game;
                            document.removeEventListener('choicemade', callbackwrapper);
                            if(game.choices[0].name=='produce'){
                                let callbackwrapper = ()=>{
                                    document.removeEventListener('choicemade', callbackwrapper);
                                    app.produce(game.choices,game.acting_player.boostingicons.produce);
                                    callback();
                                }
                                game.tradeorproduce={name:'produce'};
                                document.addEventListener('choicemade', callbackwrapper);
                            }
                            else if(game.choices[0].name=='trade'){
                                let callbackwrapper = ()=>{
                                    document.removeEventListener('choicemade', callbackwrapper);
                                    app.trade(game.choices,game.acting_player, game.acting_player.boostingicons.trade);
                                    callback();
                                };
                                game.tradeorproduce={name:'trade'};
                                document.addEventListener('choicemade', callbackwrapper);
                            }
                            game.displayinfo.center_or_planets=false;
                            game.displayinfo.selectionzone='settled_&_conquered_planets';
                            game.displayinfo.allowformultipleselections=true;
                            game.displayinfo.showoptiontoskip=false;
                            app.present_as_choice([...game.acting_player.settled_planets, ...game.acting_player.conquered_planets]);
                        }
                        game.displayinfo.selectionzone='options';
                        game.displayinfo.allowformultipleselections=false;
                        game.displayinfo.showoptiontoskip=false;
                        document.addEventListener('choicemade', callbackwrapper);
                        app.present_as_choice([{name:'produce'}, {name:'trade'}]);
                    },
                },
                'icons' : {'survey':0,'warfare':0,'colonize':0,'produce':1,'trade':1,'research':0},
                'name' : 'Produce / Trade',
                'image' : null,
            },{
                'type' : 'research',
                'selected':false,
                'action' : (callback)=>{  
					let game = app.get().game;
					let callbackwrapper = ()=>{
						document.removeEventListener('choicemade',callbackwrapper);
						app.research(game.choices, game.acting_player);
						callback();
					}
                    game.displayinfo.selectionzone='hand';
                    game.displayinfo.allowformultipleselections=false;
                    game.displayinfo.showoptiontoskip=false;
                    document.addEventListener('choicemade',callbackwrapper);
                    app.present_as_choice(game.acting_player.hand);
                },
                'role' : {
                    'follower':(callback)=>{
                        app.get().game.acting_player.activerole.role.role.leader(callback);
                    },
                    'leader':(callback)=>{  
                        let game = app.get().game;
                        let callbackwrapper = ()=>{
                            document.removeEventListener('choicemade',callbackwrapper);
                            game.displayinfo.showoptiontoskip=false;
                            if (game.choices[0].name!="Skip"){
                                //TODO check research card requirements
                                //check for number of planets and type of planets
                                let p = {'advanced':0,'metallic':0,'fertile':0};
                                for (let i in game.acting_player.settled_planets){
                                    p[game.acting_player.settled_planets[i].type]++;
                                }
                                for (let i in game.acting_player.conquered_planets){
                                    p[game.acting_player.settled_planets[i].type]++;
                                }
                                let condition = true;
                                for (let i in game.choices[0].planet_requirements){
                                    if (game.choices[0].planet_requirements[i] > p[i]){
                                        condition = false;
                                    }
                                }
                                if (condition && game.acting_player.boostingicons.research >= game.choices[0].research_cost){
                                    app.play(game.research_deck, game.acting_player.limbo, 'discard', game.choices[0].identifier);
                                }
                            }
                            callback();
                        }
                        game.displayinfo.selectionzone='research';
                        game.displayinfo.allowformultipleselections=false;
                        game.displayinfo.showoptiontoskip=true;
                        document.addEventListener('choicemade',callbackwrapper);
                        app.present_as_choice(game.research_deck);
                    },
                },
                'icons' : {'survey':0,'warfare':0,'colonize':0,'produce':0,'trade':0,'research':1},
                'name' : 'Research',
                'image' : null,
                'research_deck':[]
            }
        ],
    },
    
};
game.nonce=nonce;
const app = new App({
	target: document.body,
	data: {
		game: game,
	}
});
export default app;