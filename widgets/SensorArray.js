/* jshint forin:false, noarg:true, noempty:true, eqeqeq:true, bitwise:true, strict:true, loopfunc:true,
	undef:true, unused:true, curly:true, browser:true, indent:false, maxerr:50, jquery:true, node:true */

"use strict";

var A = A || {};

if(typeof window === "undefined") {
  A = require('../Archonia.js');
  A.SignalSmoother = require('./SignalSmoother.js');
}

(function(A) {

A.SensorArray = function(howManyMeasurementPoints, measurementDepth, decayRate, valuesRangeLo, valuesRangeHi) {
  this.id = A.archoniaUniqueObjectId++;

  this.empty = true;
  this.howManyMeasurementPoints = howManyMeasurementPoints;
  
  this.signalSmoothers = [];
  
  for(var i = 0; i < howManyMeasurementPoints; i++) {
    this.signalSmoothers.push(new A.SignalSmoother(measurementDepth, decayRate, valuesRangeLo, valuesRangeHi));
  }
  
  this.averagesRounder = new A.Cbuffer(howManyMeasurementPoints, 0, 0, howManyMeasurementPoints);
  
};

A.SensorArray.prototype = {
  getAverage: function(index, spread) {
    var e = this.averagesRounder.getSpreadAt(index, spread);
    
    var t = 0;
    for(var i = 0; i < spread; i++) { t += e[i]; }
    
    return t / spread;
  },
  
  getBestSignal: function(spread) {
    if(spread === undefined) { spread = 1; }
    
    var i = null;
    
    // The signalSmoothers are in a cicle around us, so we
    // need a wheel to get the spread averages and
    // identify the index of the best one
    for(i = 0; i < this.howManyMeasurementPoints; i++) {
      this.averagesRounder.store(this.signalSmoothers[i].getSignalStrength());
    }
  
    var result = { direction: null, weight: null };
    
    for(i = 0; i < this.howManyMeasurementPoints; i++) {
      var r = this.getAverage(i, spread);

      if(result.weight === null || r > result.weight) { result.direction = i; result.weight = r; }
    }
  
    return result;
  },
  
  isEmpty: function() { return this.empty; },
  
  reset: function() {
    for(var i = 0; i < this.howManyMeasurementPoints; i++) { this.signalSmoothers[i].reset(); }

    this.empty = true;
  },

  store: function(where, value) {
    this.empty = false;
    this.signalSmoothers[where].store(value);
  }
};

})(A);

if(typeof window === "undefined") {
  module.exports = A.SensorArray;
}
