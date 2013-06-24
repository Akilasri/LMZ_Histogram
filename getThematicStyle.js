var theme = new Array('#FF00FF', '#FFFF00', '#00FFFF', '#0000FF', '#000000', '#FFFFFF');
function getThematicStyle(layername,newRanges) {
    
    var matchingLayers;
    var vectorLayer;
    var colors = new Array();
    var items = new Array();
    var serie;
    var rules = new Array();
    var filter_x;
    var styleMapObject;
    var thematicStyle;
    
    // defines default values of the thematic style
     thematicStyle = new OpenLayers.Style({
        strokeColor:'#ffffff',
        strokeOpacity:1,
        fillColor: '#BDBDBD',
        fillOpacity: 1
    }); 

    var colors_pool = new Array('#FFC6A5', '#FF9473', '#FF6342', '#FF3118', '#FF0000', '#AD0000');
    
    if (typeof indComboBox == 'undefined' || typeof yearComboBox == 'undefined' || typeof clTypeComboBox == 'undefined' || typeof clComboBox == 'undefined') 
    {
        //console.log("getThematicStyle: ComboBoxen sind noch nicht verfügbar, return default Style");
        return thematicStyle;
    }
    else {
        //var indicatorX = indComboBox.getValue();
        //var indicator = indicatorX[0];
        var indicator = indComboBox.getValue();
        var year = yearComboBox.getValue();
        var classificationType = clTypeComboBox.getValue();
        var numClasses = parseFloat(clComboBox.getValue());
        var mapcolors = farbComboBox.getValue();
        
        switch (mapcolors ){
        case 'rot':
            colors_pool = new Array('#FFC6A5', '#FF9473', '#FF6342', '#FF3118', '#FF0000', '#AD0000');
        break;
        case 'grün':
           colors_pool = new Array('#EDF8FB', '#CCECE6', '#99D8C9', '#66C2A4', '#2CA25F', '#006D2C');
        break;
        case 'blau':
           colors_pool = new Array('#D0D1E6', '#A6BDDB', '#74A9CF', '#3690C0', '#0570B0', '#034E7B');
        break;
        case 'lila':
           colors_pool = new Array('#DADAEB', '#BCBDDC', '#9E9AC8', '#807DBA', '#6A51A3', '#4A1486');
        break;
        case 'orange':
           colors_pool = new Array('#FDD0A2', '#FDAE6B', '#FD8D3C', '#F16913', '#D94801', '#8C2D04'); 
        break;
  	case 'custom...':
			 			colors_pool = theme; 
        break;
        }
        
        // populate colors array depending on the number of classes
        for (var i = 0; i < numClasses; i++) {
            colors.push(colors_pool[i]);
        }
    }
    
    //check whether numClasses and colors fit together
    if (numClasses != colors.length) {
        //console.log("getThematicStyle: Warning, the numbers of classes and the number of colors do not fit");
        return;
    }
    
    //get vector layer by the given layername
    matchingLayers = map.getLayersByName(layername);
    if (matchingLayers.length == 1) {
        vectorLayer = matchingLayers[0];
    }
    else {
        //console.log("getThematicStyleMap: Warning, " + matchingLayers.length + " layers found!");
        return;
    }
    
    // extract necessary data items
    for (var i=0;i < vectorLayer.features.length;i++) {
        if (vectorLayer.features[i]['data'][indicator]) {
            if ((vectorLayer.features[i]['data'][indicator][year] != "") && (vectorLayer.features[i]['data'][indicator][year] != "-")){
                items.push(parseFloat(vectorLayer.features[i]['data'][indicator][year]));
            }
        }
    }
    
    // check if any data is available
    if (items.length != 0 && items.length >= numClasses) {
        //console.log("getThematicStyle: Style für " + items.length + " Items wird berechnet");
        //console.log("getThematicStyle: Parameter: " + indicator + "; " + year + "; " + classificationType + "; " + numClasses);
        // create geostats serie
        serie = new geostats(items);
        // get ranges according to the given classification type
        switch (classificationType) {
            case "eqinterval": ranges = serie.getEqInterval(numClasses); break;
            case "quantiles": ranges = serie.getQuantile(numClasses); break;
            case "jenks": ranges = serie.getJenks(numClasses); break;
        }
        
		// DEBUG --> classBreakSlider
		if (newRanges) {console.log(newRanges);
						ranges = newRanges;}
		
		
		// create Filter Rule for "no data"
		var filter_nodata = new OpenLayers.Filter.Function({
                    evaluate: function(attributes) {
                            if (attributes[indicator]) {
                                if ((attributes[indicator][year] < parseFloat(ranges[0])) || (attributes[indicator][year] == "-") ) {
                                    return true;
                                }
                                else {
                                    return false;
                                }
                            }
                            else {
                                return true;
                            }
                    }
                })
            var rule_nodata = new OpenLayers.Rule({
                name: "keine Daten",
                filter: filter_nodata,
                symbolizer: { fillColor: '#BDBDBD',
                            fillOpacity: 1, strokeColor: "white"}
            });
            rules.push(rule_nodata);  
		
        // loop through numClasses and create filter & rule for each thematic class
        for (var i = 0; i < numClasses; i++) (function (i) {
            // for debugging
            //console.log("Klasse" + (i+1) + ": " + parseFloat(ranges[i]) + "-" + ranges[i+1] + ", Farbe: " + colors[i]);
            filter_x = new OpenLayers.Filter.Function({
                    evaluate: function(attributes) {
                            if (attributes[indicator]) {
                                if ((attributes[indicator][year] >= parseFloat(ranges[i]) && attributes[indicator][year] < parseFloat(ranges[i+1]) || attributes[indicator][year] == parseFloat(ranges[numClasses]))) {
                                    return true;
                                }
                                else {
                                    return false;
                                }
                            }
                            else {
                                return false;
                            }
                    }
                })
            var rule_x = new OpenLayers.Rule({
                name: (Math.floor(ranges[i]*100)/100) + " - <" + (Math.floor(ranges[i+1]*100)/100),
                filter: filter_x,
                symbolizer: { fillColor: colors[i],
                            fillOpacity: 1, strokeColor: "white"}
            });
            rules.push(rule_x);    
        })(i);
        thematicStyle.addRules(rules);
    }
    //console.log("getThematicStyle: Style wurde erstellt");
    return thematicStyle;
}

function openColorPicker()
{	
		
	var sprite1 = Ext.create('Ext.draw.Sprite', {
					type: 'rect',
					width: 300,
					height: 20,
					x: 0, y:0,
					stroke: '#000000',
					'stroke-width': 1,
					listeners: {
						'click' :  function(){ 
								theme = new Array('#F0F9E8', '##CCEBC5', '#A8DDB5', '#7BCCC4', '#43A2CA', '#0868AC');
								console.log('click sprite 2');
								applyThematicStyle();
								}
					}
					});	
					
	var sprite2 = Ext.create('Ext.draw.Sprite', {
					type: 'rect',
					width: 300,
					height: 20,
					x: 0, y:30,
					stroke: '#000000',
					'stroke-width': 1,
					listeners: {
						'click' :  function(){ console.log("clicked sprite 2");
						}
						}
					});
	var drawComp = Ext.create('Ext.draw.Component', {
					renderTo: Ext.getBody(),
					width: 300,
					height: 400,
					viewBox: true,
					items: [sprite1, sprite2],
					gradients: [{
							'id': 'gradientId',
							angle: 0,
							stops: {
								0: {
									color: '#F0F9E8'
								},
								10: {
									color: '#CCEBC5'
								},
								30: {
									color: '#A8DDB5'
								},
								50: {
									color: '#7BCCC4'
								},
								70: {
									color: '#43A2CA'
								},
								100: {
									color: '#0868AC'
								}
							}}, {
							'id': 'gradientId2',
							angle: 0,
							stops: {
								0: {
									color: '#B2182B'
								},
								10: {
									color: '#EF8A62'
								},
								30: {
									color: '#FDDBC7'
								},
								50: {
									color: '#D1E5F0'
								},
								70: {
									color: '#67A9CF'
								},
								100: {
									color: '#2166AC'
								}
							}
						}],
				});
					
	sprite1.setAttributes({ fill: 'url(#gradientId)'}, true);
	sprite2.setAttributes({ fill: 'url(#gradientId2)'},true);			
	var temp =Ext.create("Ext.panel.Panel",{
							title: 'choose the theme',
							width: 400,
							height: 400,
							draggable:true,
							closable: true,
							id : 'colorWdw',
							renderTo: Ext.getBody(),
							items :[drawComp]						
						});
				
	temp.show();					
}
