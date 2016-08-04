// requires moment.js
// formatString argument should be comprised of format tokens described here:
// http://momentjs.com/docs/#/displaying/format/
function dateStringFromEpoch (epoch, formatString) {

  var momentFromEpoch = moment(epoch);
  return momentFromEpoch.format(formatString);
}

function iso8601StringToEpoch (dateString) {

  // conversion from string without a defined format is deprecated
  //var momentFromString = moment(dateString);
  var formatString = "YYYY-MM-DD HH:mm:ss.SSSZ";
  var momentFromString = moment(dateString, formatString);
  if (momentFromString.isValid()) {
    return momentFromString.valueOf();
  } else {
    console.log('ERROR: Invalid date string: ' + dateString);
    return 0;
  }
}

L.Control.RangeSliderControl = L.Control.extend({

    options: {
        position: 'topright',

        minProperty: null, // required
        maxProperty: null, // required. Must be the same type as minProperty, can be the same property as minProperty.
        propertyType: 'iso8601', // or: epoch, integer, float
        rangeType: 'contained', // or: startsIn, endsIn
        showOngoing: false,

        rangeDescriptionFormat: '', // float, integer, shortDate, mediumDate, longDate
        descriptionPrefix: 'Range:', // a space will be appended before range values

        // these values must of the type specified by propertyType
        sliderMin: null,
        sliderMax: null,
        filterMin: null, // must be >= sliderMin
        filterMax: null, // must be <= sliderMax

        controlWidth: '250px',

        // should be init'd before adding control
        // will be preserved for access to the full, unfiltered set of features
        layers: null,
        layerStyle: {
          opacity: 0.5,
          fillOpacity: 0.3
        },
    },

    initialize: function (options) {

        if (this.validateOptions(options)) {
          L.Util.setOptions(this, options);

          this._layer = this.options.layer;
        } else {
          console.log('ERROR: Invalid options for Leaflet Range Slider');
        }
    },

    validateOptions: function (options) {
      if (options['minProperty'] == undefined) {
        console.log('ERROR: minProperty must be defined in the options object.');
        return false;
      }

      if (options['maxProperty'] == undefined) {
        console.log('ERROR: maxProperty must be defined in the options object.');
        return false;
      }

      var propertyTypes = ['iso8601', 'epoch', 'integer', 'float'];
      if ($.inArray(options['propertyType'], propertyTypes) < 0) {
        console.log('ERROR: propertyType must be: \'iso8601\', \'epoch\', \'integer\', or \'float\'');
        return false;
      }

      var rangeDescriptionFormats = ['float', 'integer', 'shortDate', 'mediumDate', 'longDate'];
      if ($.inArray(options['rangeDescriptionFormat'], rangeDescriptionFormats) < 0) {
        console.log('ERROR: rangeDescriptionFormat must be: \'float\', \'integer\', \'shortDate\', \'mediumDate\', \'longDate\'');
        return false;
      }

      return true;
    },

    onAdd: function (map) {

      options = this.options;
      options.map = map;

      // Create a control sliderContainer with a jquery ui slider
      var rangeContainer = L.DomUtil.create('div', 'leaflet-range-slider', this._container);
      $(rangeContainer).append('<div id="lrs-range-display" style="width:'+ options.controlWidth + '; margin-bottom:13px; text-align:center; border-radius:5px;"></div>');
      $(rangeContainer).append('<div id="lrs-slider" style="width:' + options.controlWidth + ';">');
      $(rangeContainer).append('<div class="ui-slider-handle"></div>');
      $(rangeContainer).append('</div>');

      // Deconflict map and slider events
      L.DomEvent.disableClickPropagation(rangeContainer);

      // this must be run across the *entire* dataset, not the filtered version
      if (this.options.layer) {
        this.calculateMinMaxValuesForLayer(this.options.layer);
      } else {
        console.log('Error: No layer specified in options.');
      }

      return rangeContainer;
    },

    onRemove: function (map) {
      // Optional, should contain all clean up code (e.g. removes control's event listeners). Called on map.removeControl(control) or control.removeFrom(map). The control's DOM container is removed automatically.
    },

    calculateMinMaxValuesForLayer: function (featureLayer) {

      var minFieldValue, maxFieldValue;
      minFieldValue = Number.MAX_VALUE;
      maxFieldValue = Number.MIN_VALUE;

      featureLayer.eachLayer(function (layer) {

        var minFeatureValue, maxFeatureValue;

        if (this.options.propertyType === 'iso8601') {

          // convert to epoch
          var minDateValue = layer.feature.properties[this.options.minProperty];
          var minDate = new Date(minDateValue);
          minFeatureValue = minDate.getTime();

          var maxDateValue = layer.feature.properties[this.options.maxProperty];
          var maxDate = new Date(maxDateValue);
          maxFeatureValue = maxDate.getTime();

        } else {
          minFeatureValue = layer.feature.properties[this.options.minProperty];
          maxFeatureValue = layer.feature.properties[this.options.maxProperty];
        }

        if (minFeatureValue > maxFeatureValue) {
          console.error('ERROR: min > max for feature with properties: ' + JSON.stringify(layer.feature.properties));
        }

        if (minFeatureValue < minFieldValue) {
          minFieldValue = minFeatureValue;
        }

        if (maxFeatureValue > maxFieldValue) {
          maxFieldValue = maxFeatureValue;
        }

      });

      if (this.options.propertyType === 'iso8601') {

        var minDate = new Date(minFieldValue);
        var maxDate = new Date(maxFieldValue);

        console.log('Range would be ' + minDate + ' to ' + maxDate);
      } else {
        console.log('Range would be ' + minFieldValue + ' to ' + maxFieldValue);
      }

      self.calculatedMinValue = minFieldValue;
      self.calculatedMaxValue = maxFieldValue;
    },

    sliderMinimumValue: function () {

      if (options.sliderMin) {

        var specifiedMinValue;
        if (this.options.propertyType === 'iso8601') {
          specifiedMinValue = iso8601StringToEpoch(options.sliderMin);
        } else {
          specifiedMinValue = options.sliderMin;
        }

        if (specifiedMinValue >= self.calculatedMinValue) {
          return specifiedMinValue;
        } else {
          return calculatedMinValue;
        }
      } else {
        return calculatedMinValue;
      }
    },

    sliderMaximumValue: function () {

      if (options.sliderMax) {

        var specifiedMaxValue;
        if (this.options.propertyType === 'iso8601') {
          specifiedMaxValue = iso8601StringToEpoch(options.sliderMax);
        } else {
          specifiedMaxValue = options.sliderMax;
        }

        if (specifiedMaxValue <= self.calculatedMaxValue) {
          return specifiedMaxValue;
        } else {
          return self.calculatedMaxValue;
        }
      } else {
        return self.calculatedMaxValue;
      }
    },

    initialSliderValues: function () {

      var sliderMin = this.sliderMinimumValue();
      var sliderMax = this.sliderMaximumValue();

      var initialMin, InitialMax;

      var specifiedInitialMinValue, specifiedInitialMaxValue;
      if (this.options.propertyType === 'iso8601') {
        specifiedInitialMinValue = iso8601StringToEpoch(options.filterMin);
        specifiedInitialMaxValue = iso8601StringToEpoch(options.filterMax);
      } else {
        specifiedInitialMinValue = options.filterMin;
        specifiedInitialMaxValue = options.filterMax;
      }

      if (specifiedInitialMinValue >= sliderMin && specifiedInitialMaxValue <= sliderMax) {
        initialMin = specifiedInitialMinValue;
        initialMax = specifiedInitialMaxValue;
      } else {

        console.log('ERROR: Filter range ' + specifiedInitialMinValue + ' to ' + specifiedInitialMaxValue + ' is out of range of the slider values.');

        // fallback to defaults
        var rangeMinPosition = 0.15;
        var rangeMaxPosition = 0.85;

        initialMin = ((sliderMax - sliderMin) * rangeMinPosition) + sliderMin;
        initialMax = ((sliderMax - sliderMin) * rangeMaxPosition) + sliderMin;
      }

      return [initialMin, initialMax];
    },

    // this must be called after adding the control to the map...
    configureRangeSlider: function () {

      options = this.options;

      var sliderMin = this.sliderMinimumValue();
      var sliderMax = this.sliderMaximumValue();
      var sliderInitialValues = this.initialSliderValues();

      // preserve these values before the first filtering operation
      self.originalStyle = this.options.layerStyle;
      console.log('Original style: ' + JSON.stringify(self.originalStyle));

      // make a clone of originalStyle, set opacity and fillOpacity to 0.0
      var styleCopy = $.extend(true, {}, this.options.layerStyle)
      styleCopy.opacity = 0.0;
      styleCopy.fillOpacity = 0.0;
      console.log('Hidden style: ' + JSON.stringify(styleCopy));
      self.hiddenStyle = styleCopy;

      var rsc = this;

      $("#lrs-slider").slider({
            range: true,
            min: sliderMin,
            max: sliderMax,
            values: sliderInitialValues,
            step: 1,
            slide: function (e, ui) { // change does not have ui.values
                rsc.displayFilteredFeatures();
                rsc.updateRangeDisplay();
            },
      });

      // filter and set range description
      this.displayFilteredFeatures();
      this.updateRangeDisplay();
    },

    displayFilteredFeatures: function () {
      // Instead of recreating the layer to trigger re-evaluation of filter,
      // iterate through _layers and change opacity via self.hiddenStyle

      var map = self.options.map;
      if (map.hasLayer(self.options.layer)) {

        var dataLayer = self.options.layer;
        for(var key in dataLayer._layers){

          if(!this.rangeFeatureFilter(dataLayer._layers[key].feature, dataLayer._layers[key])){
            dataLayer._layers[key].setStyle(self.hiddenStyle);
          } else {
            dataLayer._layers[key].setStyle(self.originalStyle);
          }
        }
      } else {

        self.options.layer.addTo(map);
      }
    },

    rangeFeatureFilter: function (feature, featureLayer) {

      var rawMinValue = $( "#lrs-slider" ).slider( "values", 0 );
      var rawMaxValue = $( "#lrs-slider" ).slider( "values", 1 );

      var minPropertyValue, maxPropertyValue, currentRange;

      if (self.options.propertyType === 'iso8601') {
        // convert date strings to epoch values for comparison
        minPropertyValue = iso8601StringToEpoch(feature.properties[self.options.minProperty]);
        maxPropertyValue = iso8601StringToEpoch(feature.properties[self.options.maxProperty]);
        currentRange = [new Date(rawMinValue), new Date(rawMaxValue)];
      } else {
        minPropertyValue = feature.properties[self.options.minProperty];
        maxPropertyValue = feature.properties[self.options.maxProperty];
        currentRange = [rawMinValue, rawMaxValue];
      }

      var inRange = false;
      var startsWithinRange = (minPropertyValue >= currentRange[0]) && (minPropertyValue <= currentRange[1]);;
      var endsWithinRange = (maxPropertyValue >= currentRange[0]) && (maxPropertyValue <= currentRange[1]);

      switch (self.options.rangeType) {
        case 'contained': {
          var gteMinimum = minPropertyValue >= currentRange[0];
          var lteMaximum = maxPropertyValue <= currentRange[1];
          inRange = gteMinimum && lteMaximum;
          break;
        }

        case 'startsIn': {
          inRange = startsWithinRange;
          break;
        }

        case 'endsIn': {
          inRange = endsWithinRange;
          break;
        }

        default: {
          console.log('ERROR: ' + self.options.rangeType + ' is not a valid rangeType.');
          break;
        }
      }

      var ongoing = false;

      if (self.options.showOngoing) {

        var filterWithinPropertyRange = (currentRange[0] >= minPropertyValue) && (currentRange[1] <= maxPropertyValue);
        ongoing = filterWithinPropertyRange || startsWithinRange || endsWithinRange;
      }

      if (inRange || ongoing) {
        //console.log('Will show: ' + feature.properties[self.options.minProperty], feature.properties[self.options.maxProperty]);
        return true;
      } else {
        //console.log('Will not show: ' + feature.properties[self.options.minProperty], feature.properties[self.options.maxProperty]);
        return false;
      }
    },

    updateRangeDisplay: function () {
      var rawMinValue = $( "#lrs-slider" ).slider( "values", 0 );
      var rawMaxValue = $( "#lrs-slider" ).slider( "values", 1 );

      var minFilterValue, maxFilterValue;
      switch (options.rangeDescriptionFormat) {
        case 'float': {
          minFilterValue = Number(rawMinValue).toFixed(4);
          maxFilterValue = Number(rawMaxValue).toFixed(4);
          break;
        }

        case 'integer': {
          minFilterValue = rawMinValue;
          maxFilterValue = rawMaxValue;
          break;
        }

        case 'shortDate': {
          //var formatString = 'MM/DD/YY';
          var formatString = 'l';

          minFilterValue = dateStringFromEpoch(rawMinValue, formatString);
          maxFilterValue = dateStringFromEpoch(rawMaxValue, formatString);
          break;
        }

        case 'mediumDate': {
          //var formatString = 'MMM D, YYYY';
          var formatString = 'LLL';
          minFilterValue = dateStringFromEpoch(rawMinValue, formatString);
          maxFilterValue = dateStringFromEpoch(rawMaxValue, formatString);
          break;
        }

        case 'longDate': {
          //var formatString = 'dddd, MMMM Do, YYYY [at] h:mm:ss';
          var formatString = 'LLLL';
          minFilterValue = dateStringFromEpoch(rawMinValue, formatString);
          maxFilterValue = dateStringFromEpoch(rawMaxValue, formatString);
          break;
        }

        default: {
          console.log('ERROR: Invalid rangeDescriptionFormat value in options: ' + options.rangeDescriptionFormat);
          console.log('Valid values are: float, integer, shortDate, mediumDate, longDate');
          // default handling will show raw value from slider
          break;
        }
      }

      $("#lrs-range-display").html(options.descriptionPrefix + ' ' + minFilterValue + ' to ' + maxFilterValue);
    },
});

L.control.rangeSliderControl = function (options) {
    return new L.Control.RangeSliderControl(options);
};
