import App from './App.html';
let nonce = 0;
let game = {
    'passtoplayer':false,
    'nonce':0,
    'displayinfo':{
        'selectionzone':'',
        'showoptiontoskip':false,
        'allowformultipleselections':false,
        'center_or_planets':true, //true = center, false = planets
    },
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
    'gamephases':[
        {'start':[
            {'set active player':()=>{
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
                    app.send({'game':game});
                    document.dispatchEvent(new Event('pass_turn'));
                    
                }
                app.phasefinishfunction();
            }}
        ]},
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