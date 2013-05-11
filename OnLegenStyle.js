var stylePanel;

Ext.require([
  'GeoExt.FeatureRenderer'
]);

var highlightStyle = new OpenLayers.Style({
            strokeColor:'#000000',
  		strokeWidth: 3,
            strokeOpacity:0.4
        });
  	
  // Set up a model to use in histogram store
  Ext.define('Histogram', {
  	extend: 'Ext.data.Model',
  	fields: [
         {name: 'state', type: 'string'},
         {name: 'value',  type: 'float', defaultValue: -9999}
     ]
  });

  histogramStore = Ext.create('Ext.data.Store', {
  	model: 'Histogram'
      });  
    
  


  histogramChart = Ext.create('Ext.chart.Chart', {
  		renderTo: Ext.getBody(),
  		width: 400,
  		height: 200,
  		store: histogramStore,
  		theme: 'Blue',
  		axes: [
  			{
  			title: 'Value',
  			type: 'Numeric',
  			position: 'left',
  			fields: ['value'],
  			minimum: 0,
  			maximum: 100
  			},
  			{
  			type: 'Category',
  			label: {
  				renderer: function(v){
  					return '';
  				}
  			},
  			position: 'bottom',
  			fields: ['state']
  			}
  		],
  		series: [
  			{
  			type: 'column',
  			axis: 'left',
  			gutter: 0,
  			highlight: false,
  			constrain: true,
  			tips: {
  			trackMouse: true,
  			width: 120,
  			height: 40,
  			renderer: function(storeItem, item) {
  				this.setTitle(storeItem.get('state') + ':<br/>' + storeItem.get('value') );
  			}},
  			xField: 'state',
  			yField: 'value',
  			listeners: {
  				'itemclick': function(item) {
  					console.log(item);
  				}
  			}
  			}]
  });

  function updateHistogram() {
  	// Update Histogram 
  		console.log("Update Histogram");
  		var histogramData = new Array();
  		var min = 0;
  		var max = 0;
  		for (i = 0; i < staaten.features.length; i++) {
  			
  			var name = staaten.features[i].data['SOVEREIGNT'];
  			if ( Object.keys(staaten.features[i].data).length > 1) {
  				var value = parseFloat(staaten.features[i].data[indComboBox.value][yearComboBox.value]);
  				// Check for missing Data
  				if (!value) {
  					value = -9999;
  					}
  				//console.log(name+" "+value);
  				if (min>value) { min = value };
  				if (max<value) { max = value };
  				histogramData.push(	[
  									name,
  									value
  									]);
  				}
  			else {
  				histogramData.push(	[
  									staaten.features[i].data['SOVEREIGNT'],
  									-9999
  									]);
  				}
  			}
  		
  		
  		// Update chart
  		histogramChart.store.loadData(histogramData);
  		histogramChart.store.sort('value','ASC');
  		histogramChart.axes.items[0].maximum = max;
  		
  		
  		histogramChart.redraw();
  					
  
  
  }
  
  // Create task for delayed execution of histogram update
  histogramTask = new Ext.util.DelayedTask(function(){
  		updateHistogram();
  });
  
  // Function as eventhandler of loadend-event
        function applyThematicStyle(newRanges) {
            //console.log("applyThematicStyle: initiated");
            
            mapLoadMask.hide();
            
            // Create StyleMap-Object for the thematic layer
            thematicStyleMap = new OpenLayers.StyleMap({
                'default': getThematicStyle("Staaten thematisch",newRanges),
  			'temporary': highlightStyle
            });
            staaten.addOptions({
                styleMap: thematicStyleMap
            });
            // Redraw staaten layer
            staaten.redraw();
           

            // Update vectorLegend
            vectorLegend.legendTitle = getActiveLegendTitle();
            vectorLegend.setRules();
            vectorLegend.update();
  		
        }

        // Set up a store for all indicator metadata
        Ext.define('indicatorModel', {
            extend: 'Ext.data.Model',
            fields: ['key', 'displayName', 'indicatorName', 'category', 'subcategory', 'dataprovider', 'dataprovider_link', 'scale_function']
        });

        var indicatorStore = Ext.create('Ext.data.Store', {
            model: 'indicatorModel',
            proxy: {
                type: 'ajax',
                url : 'data/indicators.json',
                reader: {
                    type: 'json'
                }
            },
            autoLoad: true,
            sorters: [{
               property: 'indicatorName',
               direction: 'ASC'
           }]
       });

        // ComboBox to choose the indicator for the classification
        indComboBox = Ext.create('Ext.form.ComboBox', {
            width: 180,
            editable: false,
            emptyText: 'Indikator wählen',
            labelWidth: 65,
            store: indicatorStore,
            queryMode: 'local',
            displayField: 'displayName',
            valueField: 'indicatorName',
            triggerAction: 'all',
            multiSelect: false,
  		renderTo: Ext.getBody(),
            listeners: {
                select: function(combobox, records, options) {
                    var keystring = ""
                    for (i = 0; i < records.length; i++) {
                        keystring = keystring + records[i].data.key;
                        if (i != records.length-1) {
                            keystring += ',';
                        }
                    }
                    reloadGapminderLayer("Staaten thematisch", keystring);
  				staaten.removeAllFeatures();
  				
  				
                }
            }
        });

//        toolbarItems.push(indComboBox);
//        toolbarItems.push({ xtype: 'tbspacer', width: 10 });
        
        
        var yearStore = new Ext.data.SimpleStore({
            fields:['year', 'yearVal'],
            data: [ ['2010', '2010'],
            ['2011', '2011'],
            ['2012', '2012']
            ]
        });
        
        // ComboBox to choose the year for the classification
        yearComboBox = Ext.create('Ext.form.ComboBox', {
            emptyText: 'Jahr wählen',
            editable: false,
            width: 75,
            labelWidth: 35,
            store: yearStore,
            queryMode: 'local',
            displayField: 'year',
            valueField: 'yearVal',
            triggerAction: 'all',
            listeners: {
                select: function() {
                    applyThematicStyle();
  				updateHistogram();
  				setSliderBreaks();
                }
            }
        });


        // ComboBox to choose the type of classification
        var clTypeStore = new Ext.data.SimpleStore({
            fields:['name', 'value'],
            data: [ ['Quantile', 'quantiles'],
            ['Gleiche Intervalle', 'eqinterval'],
            ['Natürliche Unterbrechungen','jenks']
            ]
        });

        clTypeComboBox = Ext.create('Ext.form.ComboBox', { 
            emptyText: 'Klassifizierung wählen',
            width: 180,
            labelWidth: 75,
            store: clTypeStore,
            editable: false,
            displayField: 'name',
            valueField: 'value',
            value: 'quantiles',
            queryMode: 'local',
            triggerAction: 'all',
            listeners: {
                select: function() {
                    applyThematicStyle();
  				setSliderBreaks();
  				}
            }
        });

        
        // ComboBox to choose the number of classes for the classification
        clComboBox = Ext.create('Ext.form.ComboBox', {
            width: 100,
            editable: false,
            fieldLabel: 'Klassen',
            labelWidth: 45,
            store: [3, 4, 5, 6],
            queryMode: 'local',
            value: '6',
            triggerAction: 'all',
            listeners: {
                select: function() {
                    applyThematicStyle();
  				setSliderBreaks();
  				
                }
            }
        });


        // ComboBox to choose the number of classes for the classification
        farbComboBox = Ext.create('Ext.form.ComboBox', {
            width: 100,
            editable: false,
            fieldLabel: 'Farbe',
            labelWidth: 45,
            store: ['rot', 'grün', 'blau', 'lila','orange'],
            queryMode: 'local',
            value: 'rot',
            triggerAction: 'all',
            listeners: {
                select: function() {
                    applyThematicStyle()
                }
            }
        });
  	
  	

  	
  	// MultiSlider 
  	
  				
  	classBreakSlider = Ext.create('Ext.slider.Multi', {
  		id: 'classBreakSlider',
  		width: 320,
  		style: {
  			'margin-left': 60
  			},
  		values: [30,60,90,120,150],
  		increment: 5,
  		minValue: 1,
  		maxValue: 179,
  		disabled: false,
  		// this defaults to true, setting to false allows the thumbs to pass each other
  		constrainThumbs: true,
  		renderTo: Ext.getBody()
  		
  	});

  	function setSliderBreaks() {
  			var values = [];
  			for (i=1;i<ranges.length-1;i++) {
  				var index = histogramChart.store.findBy(function(record, id) {if (record.data.value < ranges[i]) return false; else return true;});
  				values.push(index);
  			
  			}
  			classBreakSlider.destroy();
  			classBreakSlider = Ext.create('Ext.slider.Multi', {
  				id: 'classBreakSlider',
  				width: 300,
  				style: {
  					'margin-right': 5,
  					'position': 'relative',
  					'right': 5
  					},
  				values: values,
  				increment: 5,
  				minValue: 1,
  				maxValue: 179,
  				disabled: false,
  				// this defaults to true, setting to false allows the thumbs to pass each other
  				constrainThumbs: true,
  				renderTo: Ext.getBody(),
  				listeners: {
  					'changecomplete': function (slider, newValue, thumb, eOpts) {
  						console.log(slider.getValue());
  						console.log("Build ranges from slider");
  						var sliderRanges = slider.getValue();
  						var newRanges = [];
  						// Push first value of histogrammChart.store
  						var firstIndex = histogramChart.store.findBy(function(record, id) {if (record.data.value < -9998) return false; else return true;});
  						newRanges.push(histogramChart.store.getAt(firstIndex).data.value);
  						// push slider values
  						for (i=0;i<sliderRanges.length;i++) {
  							
  							newRanges.push(histogramChart.store.getAt(sliderRanges[i]).data.value);
  							 
  						}
  						// push last Value
  						newRanges.push(histogramChart.store.getAt(histogramChart.store.data.length-1).data.value);
  						applyThematicStyle(newRanges);
  						return true;
  					}
  					
  				},
  				tipText: function(thumb){
  								console.log(histogramChart.store.getAt(thumb.value).data.value);
  								return histogramChart.store.getAt(thumb.value).data.value;
  								}
  			});
  		stylePanel.add(classBreakSlider);
  	}


  	
  // StylePanel
  stylePanel = Ext.create("Ext.panel.Panel", {
  	id: 'stylePanel',
  	width: 	450,
  	height: 600,
  	layout: 'vbox',
  	align: 'right',
  	items: [
  		{
  			xtype: 'label',
  			text: 'Indicator'
  		},
  		indComboBox,
  		{
  			xtype: 'label',
  			text: 'Year'
  		},
  		yearComboBox,
  		{
  			xtype: 'label',
  			text: 'Classification method'
  		},
  		clTypeComboBox,
  		{
  			xtype: 'label',
  			text: 'Number of classes'
  		},
  		clComboBox,
  		{
  			xtype: 'label',
  			text: 'Color set'
  		},
  		farbComboBox,
  		histogramChart
  		
  	]
    
  });

function onLegendStyle(btn, evt) {
  
  // Brings up a configuration - window to style the legend of a vector layer
  if (!legendStyleWindow) {
  	legendStyleWindow = Ext.create('Ext.window.Window', {
  		title: 'Legend Styler',
  		height: 460,
  		width: 410,
  		closeAction: 'hide',
  		layout: 'fit',
  		items: [
  			stylePanel
  		]
  });
  }
  
  legendStyleWindow.show();
  
}
