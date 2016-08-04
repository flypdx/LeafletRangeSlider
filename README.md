# Leaflet.RangeSlider

Leaflet.RangeSlider is a Leaflet plug in that adds a two-handled slider control to a map. This control dynamically filters GeoJSON features based on whether each feature's properties are within the range currently selected on the slider.

The filtered properties may be ISO 8601 Dates, Epochs, integers, or floats.

The control can filter on a single property, or two distinct properties of each feature, as long as both properties are of the same type.

The plug in also:

* Introspects the property field(s) to determine the minimum and maximum values of the specified field(s)
* Can be configured to include features with property ranges which start in, or end in, or are a superset of the selected range
* Displays a text description of the current range used to filter features

## Requirements
This plug in has been created using Leaflet 0.7.7, and has also been tested with Leaflet 1.0.0 Release Candidate 1.

### Other Dependencies

* [jQuery](https://jquery.com/)
* [jQueryUI](https://jqueryui.com/)
* [Moment.js](http://momentjs.com/)

## Demo

Coming soon...

## Integration

A web page using this plug in needs the following CSS links:

	<link rel="stylesheet" href="http://code.jquery.com/ui/1.9.2/themes/base/jquery-ui.css" type="text/css" />
	
	<link rel="stylesheet" href="http://cdn.leafletjs.com/leaflet/v0.7.7/leaflet.css" type="text/css" />

And the following script tags:

	<script src="http://cdn.leafletjs.com/leaflet/v0.7.7/leaflet.js"></script>
	<script src="https://code.jquery.com/jquery-1.10.2.js"></script>
	<script src="https://code.jquery.com/ui/1.11.4/jquery-ui.js"></script>
	<script src="https://cdnjs.cloudflare.com/ajax/libs/jqueryui-touch-punch/0.2.2/jquery.ui.touch-punch.min.js"></script>
	<script type="text/javascript" src="https://cdnjs.cloudflare.com/ajax/libs/moment.js/2.14.1/moment.min.js"></script>

(NOTE: this also needs a link to LeafletRangeSlider.js, the location of which will change after publishing the source.)

After adding the link and script tags for CSS and Javascript, create
the Leaflet map, add a GeoJSON layer, and configure the Leaflet.RangeSlider within a script tag inside the body of the page:

	// configure Leaflet map
	var demoMap = L.map('map').setView([45.58992, -122.59409], 17);

	// add map tiles
	var Roads = L.tileLayer('//{s}.tiles.mapbox.com/v4/mapbox.streets/{z}/{x}/{y}.png?access_token=<access_token>').addTo(demoMap);

	// Retrieve GeoJSON, and configure slider when it is received
	$.getJSON("demo.json", function(json) {
	
		// parse JSON
		var demoLayer = L.geoJson(json);
		
		// create options object used to configure range slider
		var rangeOptions = {

          layer: demoLayer,
          controlWidth: '400px',
          minProperty: 'project_st',
          maxProperty: 'project_en',
          sliderMin: '2014-01-01T08:00:00.000Z',
          sliderMax: '2019-12-31T08:00:00.000Z',
          filterMin: '2014-11-28T08:00:00.000Z',
          filterMax: '2016-01-01T08:00:00.000Z',
          propertyType: 'iso8601',
          rangeDescriptionFormat: 'shortDate',
          descriptionPrefix: 'Time:'
        }
        
        // initialize range slider with options object
        var rangeSlider = L.control.rangeSliderControl(rangeOptions);

		// add to map
        demoMap.addControl(rangeSlider);

		// call configure to set up range slider plugin
        rangeSlider.configureRangeSlider();
	});

## Options

The following properties can be specified in the options object used to initialize the range slider:

### Filtered Property

* **minProperty**: Name of the specific property of each GeoJSON feature object used for comparison with the minimum handle. For example, if this is "StartDate" then the comparison would be: value of feature's "StartDate" property is greater than or equal to the value of the minimum handle.
* **maxProperty**: Name of the specific property of a GeoJSON feature object used for comparison with the maximum handle. For example, if this is "EndDate" then the comparison would be: value of feature's "EndDate" property is less than or equal to the value of the maximum handle. When the range slider is used to filter against a single feature property, this would be the same as minProperty.
* **propertyType**: Used for casting the property before comparison. Possible values are: `iso8601`, `epoch`, `integer`, or `float`
* **rangeDescriptionFormat**: `float`, `integer`, `shortDate`, `mediumDate`, or `longDate`
* **descriptionPrefix**: A string added to the beginning of the text which displays the current range

### Filter Behavior

* **rangeType** can be one of three string values:
   * **contained**: the feature.min and feature.max properties are both within slider's selected range. This is the default.
   * **startsIn**: the feature.min is within the slider's selected range, but feature.max might be greater than slider's selected max.
   * **endsIn**: the feature.max is within slider's selected range, but feature.min might be less than slider's selected minimum.
* **showOngoing**: Boolean, defaults to false. Shows feature if the selected range is between feature.min and feature.max, i.e. the values in the slider's selected range are a subset of those between the feature's min and max.

Note: When showOngoing is set to true, the control will also show features if they start in or end in the selected range. As we tested the plug in, this seemed like the most intuitive behavior, but it also means it might not make sense to allow showOngoing to be true and rangeType to be 'contained', because showOngoing overrides that particular rangeType value.

### Slider Values

* **sliderMin**: By default, the slider's minimum value will be set to the minimum value of the minProperty in the data. A value specified for sliderMin would override the introspected value.
* **sliderMax**: Similar to sliderMin, this can be used to override the default introspected value, which would be the maximum value found in the maxProperty of the data.
* **filterMin**: Initial value of the minimum handle on page load. (Defaults to 15 % of max - min.)
* **filterMax**: Initial value of the maximum handle on page load. (Defaults to 85% of max - min.)


## Styling the Control

Use the following CSS selectors to style the control:

* `#map` The map div's id should be used to specify the size of the map.
* `.leaflet-range-slider` Styles the entire control area.
* `#lrs-slider` Specifies the color of the slider, seen to the left of the minimum handle and/or the right of the maximum handle when the range is less than 100% of the slider.
* `#lrs-slider .ui-slider-range` Specifies the color of the area between minimum and maximum handles.
* `#lrs-slider .ui-slider-handle` Specifiesthe color of the draggable handles.
* `#lrs-range-display` Styles the text description of the current range.

Note that changing the color for several slider elements requires overriding the `background-image` (because of the jQuery UI default images for the slider) in addition to specifying a `background-color`.

To see these CSS selectors in action, see the CSS Customization Demo, which uses the custom.css file.
