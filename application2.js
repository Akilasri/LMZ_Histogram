Ext.require([
    'Ext.window.MessageBox',
    'Ext.container.Viewport',
    'Ext.state.Manager',
    'Ext.state.CookieProvider',
    'Ext.data.ResultSet',
    'Ext.ux.form.MultiSelect',
    'GeoExt.panel.Map',
    'GeoExt.panel.Legend',
    'GeoExt.container.VectorLegend',
    'GeoExt.Action'
    ]);

Ext.application({
    name: 'Chart Map Application',
    launch: function() {
  	
  	
        Ext.state.Manager.setProvider(Ext.create('Ext.state.CookieProvider', {
            expires: new Date(new Date().getTime()+(1000*60*60*24*7)) //7 days from now
        }));

        map = new OpenLayers.Map({
            projection: new OpenLayers.Projection("EPSG:4326"),
            displayProjection: new OpenLayers.Projection("EPSG:4326"),
            controls: [
                new OpenLayers.Control.ScaleLine(),
                new OpenLayers.Control.Attribution(),
                new OpenLayers.Control.Navigation(),
                new OpenLayers.Control.Zoom()
            ]
        });

        // BackgroundLayer
  	
        staatenAll = new OpenLayers.Layer.Vector("Staaten alle", {
            strategies: [new OpenLayers.Strategy.BBOX()],    
            projection: new OpenLayers.Projection("EPSG:4326"),
            isBaseLayer: true,
  		//visibility: false,
            protocol: new OpenLayers.Protocol.HTTP({                
                url: "data/staaten.json",
                format: new OpenLayers.Format.GeoJSON()
            })
        });
  	

        // Thematic Layer
        staaten = new OpenLayers.Layer.Vector("Staaten thematisch", {
            strategies: [new OpenLayers.Strategy.BBOX()],       
            projection: new OpenLayers.Projection("EPSG:4326"),
            protocol: new OpenLayers.Protocol.HTTP({                
                url: "php/getJSON.php",
                format: new OpenLayers.Format.GeoJSON()
            }),
  		//isBaseLayer: true,
            eventListeners: {
                'loadend': function() {
                    // Update YearComboBox
                    yearComboBox.bindStore(getYearsByIndicator("Staaten thematisch", indComboBox.getValue()));
                    yearComboBox.select(yearComboBox.getStore().data.items[0])     
                   
  				// Apply thematic style
  				applyThematicStyle();
  				if (legendStyleWindow) {
  					histogramTask.delay(10);
  					}

  				// Make Background invisible
  				staatenAll.setVisibility(false);
                }
            }
        });
  
  	// Cartogram Layer
        staatenCartogram = new OpenLayers.Layer.Vector("Staaten Kartogramm", {
            strategies: [new OpenLayers.Strategy.BBOX()],       
            projection: new OpenLayers.Projection("EPSG:4326"),
            protocol: new OpenLayers.Protocol.HTTP({                
                url: "php/getJSONCartogram.php?keys=tyadrylIpQ1K_iHP407374Q",
                format: new OpenLayers.Format.GeoJSON()
            }),
  		//isBaseLayer: true,
            eventListeners: {
                'loadend': function() {
  				//console.log("Cartogram loaded");
                    /*
  				// Update YearComboBox
                    yearComboBox.bindStore(getYearsByIndicator("Staaten thematisch", indComboBox.getValue()));
                    yearComboBox.select(yearComboBox.getStore().data.items[0])     
                   
  			   /*
  				// Apply thematic style
  				applyThematicStyleCartogram();
  				if (legendStyleWindow) {
  					histogramTask.delay(10);
  					}

  				// Make Background invisible
  				staatenAll.setVisibility(false);
  				*/
                }
            }
        });
  

        //Add Layers to map
        //map.addLayers([staaten]);
        
        /* START STYLING */
        // create Style Object for the background layer
        var backgroundStyle = new OpenLayers.Style({
            strokeColor:'#ffffff',
            strokeOpacity:1,
            fillColor: '#BDBDBD',
            fillOpacity: 1
        });
  	
  	var highlightStyle = new OpenLayers.Style({
            strokeColor:'#000000',
  		strokeWidth: 3,
            strokeOpacity:0.4
        });
  

  

        // create StyleMap-Object for the background layer
        var backgroundStyleMap = new OpenLayers.StyleMap({
            'default': backgroundStyle
        });



        
  staatenAll.addOptions({
            styleMap: backgroundStyleMap
        });


  	
 
        /* END STYLING */

        /* START GUI */
        // START toolbar items
        var ctrl, toolbarItems = [], action, actions = {};


        /* Actions for toolbar */
        // ZoomToMaxExtent control, a "button" control
        extentaction = Ext.create('GeoExt.Action', {
            control: new OpenLayers.Control.ZoomToMaxExtent(),
            map: map,
            text: "",
            iconCls: 'mapbutton',
            scale: 'large',
            tooltip: "Zoom to maximum extent"
        });
        actions["max_extent"] = extentaction;

        toolbarItems.push(Ext.create('Ext.button.Button', extentaction));
        toolbarItems.push("-");

        // SelectFeature control, a "button" control
        action = Ext.create('GeoExt.Action', {
            text: "",
            iconCls: 'select',
            scale: 'large',
            control: new OpenLayers.Control.SelectFeature(staaten, {
                type: OpenLayers.Control.TYPE_TOGGLE,
                clickout: true,
                toggle:true,
                multiple: true,
                box: false,
                onSelect: featureSelected,
                onUnselect: featureUnselected
            }),
            map: map,
            // button options
            enableToggle: true,          
            //listeners: {"featurehighlighted": new function(){alert("test2")}},
            tooltip: "Land auswählen"
        });

        /* featureSelected        
        * pushed a selected feature to the selectedFeatures array
        */
        function featureSelected(feature){ 
            selectedFeatures.push(feature);
        }

        /* featureUnselected
        * removed a unselected feature from the selectedFeatures array
        */
        function featureUnselected(feature){
            for (var i = 0; i < selectedFeatures.length; i++) {
                if (selectedFeatures[i].data.SOVEREIGNT == feature.data.SOVEREIGNT) {
                    selectedFeatures.splice(i, 1);
                }
                else {
                    console.log("featureUnselected: Unselected feature '" + feature.data.SOVEREIGNT + "' not found!");
                }
            }
        }

        //Popup and Mouseovereffect
        staaten.events.on({
            "featurehighlighted": function(e) {
  	         
  	onFeatureSelect(e.feature);
  	
            }
        });

        function onFeatureSelect(feature) {
        
  	var indicatorName, displayName;
  	var data = 'keine Daten';
  	
  	// ToolTips checked?
  	if (this.dataToolTips) {
  		if (!indComboBox.lastSelection[0]) { indicatorName = false;} else { indicatorName = indComboBox.lastSelection[0].data.indicatorName;}
  			if (!indicatorName) { displayName = false;} else {displayName = indComboBox.lastSelection[0].data.displayName;}
  	
  			if (indicatorName) {
  		
  				if (Object.keys(feature.data).length>1) {
  					if (feature.data[indicatorName][yearComboBox.value]) { 
  						data = parseFloat(feature.data[indicatorName][yearComboBox.value]).toFixed(2);
  					}
  				}
  			}
  		var dataString = '';
  	
  		if (indicatorName) {dataString = '</br><b>' + displayName + '</b></br><b>' + yearComboBox.value + ':</b>&nbsp;'+data;}
  	
  		popup = Ext.create("Ext.tip.ToolTip",{
  			html: '<b>Land:</b>&nbsp;'+$countries["de"][($countries["en"].indexOf(feature.data.SOVEREIGNT))]+dataString,
  		});
  		var pixel = map.getPixelFromLonLat(feature.geometry.getBounds().getCenterLonLat());
  
  		popup.showAt([pixel.x+100,pixel.y]);
  		}
  	}

        function onPopupClose(e) {
            selectControl.unselect(selectedFeature);
        }

        function onFeatureUnselect(feature) {
  		
        }

        var selectControl = new OpenLayers.Control.SelectFeature(staaten,{
            hover: true,
            overFeature:onFeatureSelect,
            outFeature:onFeatureUnselect,
            onUnselect:onFeatureUnselect
        }); 
        map.addControl(selectControl);
        selectControl.activate();

        //Mouseover
        var hoverControl = new OpenLayers.Control.SelectFeature(staaten,{
            hover: true,
            highlightOnly: true,
            renderIntent: "temporary",
        }); 
        map.addControl(hoverControl);
        hoverControl.activate();       
        // End popup and Mouseovereffect      

        actions["select"] = action;
        toolbarItems.push(Ext.create('Ext.button.Button', action));
        toolbarItems.push("-");

  	// Define the HistogramButton with handler
  	
  	legendButton = Ext.create('Ext.button.Button', {
  		text: '',
  		handler: onLegendStyle,
        iconCls : 'histo',
        tooltip : 'Histogram',
        scale :'large'
  		});
  	toolbarItems.push(legendButton);
  	
  	
  	
  	
        var chartButton = new Ext.Button({
            xtype: 'button',
            text: '',
            iconCls: 'spider',
            scale: 'large',
            tooltip: "Zeige Radar-Diagramm",
            handler: function(){
                /* INDICATOR */
                var g_keys = [];
                var g_indicators = {};

                var indicats = indComboBox.getValue();

                indicatorStore.queryBy(function(record, id) {
                    //console.log(record.get("indicatorName")+"   "+indicats.indexOf(record.get("indicatorName")));
                    return indicats.indexOf(record.get("indicatorName")) != -1;
                }).each(function(record) { 
                    g_keys.push(record.get("key")); 
                    g_indicators[record.get("indicatorName")]=scale_funs[record.get("scale_function")];
                });

                if (indicats === null) {
                    alert("Bitte zuerst Indikator wählen");
                    return;
                }

                var g_year = yearComboBox.getValue();

                var g_countries = [];
                var selFeatures = staaten.selectedFeatures;
                for (var i=0; i<selFeatures.length; i++) {
                    var country = selFeatures[i].attributes.SOVEREIGNT
                    if (country.indexOf(".") != -1) {
                        alert("Die ExtJS Chart Legende scheint ein Problem zu haben, wenn ein Punkt im Namen auftaucht. Daher kann '"+country+"' nicht verwendet werden.");
                    } else {
                        g_countries.push(country);
                    }
                }
                console.log("selected countries: " + g_countries);

                if (g_countries.length < 1 || g_countries.length > 5) {
                    alert("Bitte wählen Sie mindestens 1, aber maximal 5 Länder aus!");
                    return;
                }

                showRadarChart(g_keys, g_indicators, g_countries, g_year);
            }
        });

 //       toolbarItems.push(chartButton);


  	
  	
  	
        // END toolbar items
        
        /* START panels */
        // MapPanel
        var mappanel = Ext.create('GeoExt.panel.Map', {
            region: 'center',
            id: "mappanel",
            xtype: "gx_mappanel", // TabPanel itself has no title
            layers: [staatenAll,staaten,staatenCartogram],
            map: map,
            center: '0,0',
            extent: '5.19,46.85,15.47,55.63',
            zoom: 3,
            activeTab: 0,      // First tab active by default
            dockedItems: [{
                xtype: 'toolbar',
                //dock: 'top',
                items: toolbarItems
            }]
        });
        
        mapLoadMask = new Ext.LoadMask(mappanel, {msg:"Bitte warten..."});
        
  // define the vectorLegend and legend Panel as parts of the menuPanel


//VECTOR LEGEND
		vectorLegend = Ext.create('GeoExt.container.VectorLegend', {
            untitledPrefix: 'keine Daten',
            legendTitle: 'Kein Thema', 
            clickableTitle: true,
	    clickableSymbol: true,
            layer: staaten,
			clickableTitle: true,
			listeners: {
					'titleclick': function(comp, rule, evt) {
						console.log(rule);
						var labeltext1=rule.name.split("-")[0];
						var labeltext2=rule.name.split("-")[1];
						var ruleaddPanel=Ext.create('Ext.panel.Panel', {
						width : 100, 
						height : 70,
						layout: {
							type: 'vbox',
							align: 'left'
						},
						renderTo: document.body,
						items :[
							{xtype: 'text',
							 text : labeltext1 ,
							 flex: 2					
							},
							{flex: 2,
							xtype: 'textfield',
							 value : labeltext2 ,
							 enableKeyEvents: true,
							 //vtype: 'alphanum',
							 validateonchange: true,
							 //vtext: 'Only pass alphanumeric values !',
							 validator: function(value) {
								
								if (isNaN(value)){
								//if (value>5) {
									//value=rule.name.split("-")[1];
									//console.log(value); 
									//return false;
									return "Invalid input!";
								}
								else return true;
							 
							 },
							 listeners: {
								'keypress': function ( myfield, e, eOpts ) {
									
									if (e.getKey() == e.ENTER) {
										console.log("Ready changed value");
										var rulenum = staaten.styleMap.styles.default.rules.length-1;
										for (i = 0; i< rulenum-1; i++) {
										if(staaten.styleMap.styles.default.rules[i].name == rule.name) 
											{
											// Validate the input value against the next class-break
											var value = parseFloat(myfield.getValue());
											if (isNaN(value)){
												value=rule.name.split("-")[1];
												myfield.setValue(ranges[i]);
												}
											else if (value >= Math.floor(ranges[i+1]*100)/100) {
												value = ranges[i];
												myfield.setValue(ranges[i]);
												}
											else if (value <= Math.floor(ranges[i-1]*100)/100) {
												value = ranges[i];
												myfield.setValue(ranges[i]);
												}
										
											else {												
												// Create a copy of the ranges array
												var newRanges = ranges;
												newRanges[i]=parseFloat(myfield.getValue());
												applyThematicStyle(newRanges); 
												if (Ext.getCmp("legendDialog")) {
													Ext.getCmp("legendDialog").hide();
													}
												}
										
											}
										}
											
									}
								
								}
							 }
													
							}
							]
							
						});
						var dumbWindow = Ext.create("Ext.window.Window",{
							width: 120,
							height: 100,
							renderTo: Ext.getBody(),
							items: [ruleaddPanel]					
						
						}).show();
					},
					'symbolclick': function(comp, rule,evt){
						//set the selected color from color picker to the main theme of the map and refresh
							theme[this.rules.lastIndexOf(rule)-1]='#'+cpick.getValue();
							farbComboBox.setValue('custom...');
							//console.log('symbol clicked'+cpick.getValue() +"index ="+this.rules.lastIndexOf(rule));
							applyThematicStyle();
							histogramChart.redraw();
						},
					//'ruleselected': function(comp, rule,evt){
					//	'rule.enableDD':true; 
					//},
					'rulemoved': function(comp, rule, evt) {
						console.log(rule);
					}
					
			
			}
            
        });
		
		
// add a permanent color picker under the legend panel
var cpick = Ext.create('Ext.picker.Color', {
		id:'cpick',
		value: '993300', // initial selected color
		renderTo: Ext.getBody(),
		hideMode:'visibility',
		hidden:false,
		listeners: {
			select: function(picker, selColor) {
			//alert(this.getValue());
			}
		}
	});
		
		
  	        // LegendPanel
        var legendPanel = Ext.create('Ext.Panel', {
            title: "Legende",
            defaults: {
                labelCls: 'mylabel',
                style: 'padding:5px; background-color: #EAEAEA;',
            },
            collapsible: true,
            collapsed: true,
            autoScroll: true,
            items: [vectorLegend]
        });  

        var impressumPanel = Ext.create('Ext.Panel', {
            title: 'Impressum',
            collapsible: true,
            collapsed: true,
            html:'<br><h2>&nbsp;Hochschule Karlsruhe</h2><br><b>&nbsp;GIS-Projekt</b><br> &nbsp;Akila Sriramulu<br> &nbsp;Christoph Hofmann<br> &nbsp;Gregg Hakoma<br> &nbsp;Piyush Jalan<br><br><img src="img/lmz.gif"><br><br>'
        });
        
        var hilfePanel = Ext.create('Ext.Panel', {
            title: 'Hilfe',
            collapsible: true,
            collapsed: true,
            html:'<br>Wähle das Thema (Indikator) deiner Karte, die Jahreszahl sowie die Klassifizierungsart und Anzahl der Klassen in den obigen Auswahlmenüs aus. Sobald deine Wahl abgeschlossen is, wird automatisch die Karte angezeigt.<br><br><b>Bedeutung der Buttons</b><br><br><img src="img/mapbutton.png"> Kartenübersicht <br><br><img src="img/select.png">&nbsp;Länderwahl <br><br><img src="img/spider.png">&nbsp;Diagramm<br><br>'
        });



        var menuPanel = Ext.create('Ext.Panel', {
            id :'menuPanel',
            title: "",
            region: 'west',
            defaults: {
                labelCls: 'mylabel',
                style: 'padding:5px; background-color: #EAEAEA;',   
            },
            collapsible: false,
            collapsed: false,
            split: true,
            width: 200,
            autoScroll: true,
            items: [hilfePanel,impressumPanel,legendPanel,cpick]
        });

        // Viewport
        Ext.create('Ext.container.Viewport', {
            layout: 'border',
            renderTo: Ext.getBody(), 
            items: [
                menuPanel,
                mappanel
            ]
        });
        //END panels
        /* END GUI */
    }
});
