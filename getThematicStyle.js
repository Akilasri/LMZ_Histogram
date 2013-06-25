var theme = new Array('#FFC6A5', '#FF9473', '#FF6342', '#FF3118', '#FF0000', '#AD0000');
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
                name: (Math.floor(ranges[i]*100)/100) + " - < " + (Math.floor(ranges[i+1]*100)/100),
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

// include all the themes here
var themes = {
		"name": ["Green-Blue"," Red-Blue",'Beige-Purple','Brown-Teal','Rainbow','Red-Green'],
		"cpool":[
		  		['#F0F9E8','#CCEBC5','#A8DDB5','#7BCCC4','#43A2CA','#0868AC'],
				['#B2182B','#EF8A62','#FDDBC7','#D1E5F0','#67A9CF','#2166AC'],
				['#B35806','#F1A340','#FEE0B6','#D8DAE8','#998EC3','#542788'],
				['#8C510A','#D8B365','#F6E8C3','#C7EAE5','#5AB4AC','#01665E'],
				['#D53E4F','#FC8D59','#FEE08B','#E6F598','#99D594','#3288BD'],
				['#D73027','#FC8D59','#FEE08B','#D9EF8B','#91CF60','#1A9850']
			]
														
	};
	
//opens on choosing the custom option from the combobox
function openColorPicker()
{	
	var sprites = new Array ();
	var gradients= new Array();
	var y = 0;
	
	for (i=0; i< themes.cpool.length ; i++)
	{
		//create sprites based on the number of themes
		sprites [i] = Ext.create('Ext.draw.Sprite', {
				type: 'rect',
				width: 300,
				height: 20,
				x: 0, y:y,
				stroke: '#000000',
				'stroke-width': 1,
				'temp_theme' : themes["cpool"][i],
				listeners: {
				'click' : function(){
						theme =  this.temp_theme;
						console.log(this.temp_theme);
						applyThematicStyle();
						histogramChart.redraw();
						}
				}
			});	
		y = y+30;
		//create gradients based on the number of themes
		gradients.push( {'id' : "grad"+i,	
						'angle' : 0,
						'stops': {
							0:{color:''},
							20:{color:''},
							40:{color:''},
							60:{color:''},
							80:{color:''},
							100:{color:''}}
						});
		//assign color stops to the gradient from the theme
		for (var j=0;j<=100;j=j+20) {
			gradients[i].stops[j].color = themes.cpool[i][j/20];
			}
	
	}

	// add the sprites to the drawing surface
	var drawComp = Ext.create('Ext.draw.Component', {
		renderTo: Ext.getBody(),
		width: 300,
		height: 400,
		items: sprites,
		gradients:  gradients
		});
	// set the gradients to each sprite
	for (i=0; i<sprites.length;i++)
		{sprites[i].setAttributes({ fill: 'url(#grad'+i+')'}, true);}			
		
	var temp = Ext.create("Ext.panel.Panel",{
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
