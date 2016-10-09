/* jshint forin:false, noarg:true, noempty:true, eqeqeq:true, bitwise:true, strict:true, loopfunc:true,
	undef:true, unused:true, curly:true, browser:true, indent:false, maxerr:50, jquery:true, node:true */

"use strict";

var Archonia = Archonia || { Axioms: {}, Cosmos: {}, Engine: {}, Essence: {}, Form: {} };

if(typeof window === "undefined") {
  Archonia.Axioms = require('../Axioms.js');
  Archonia.Form.Cbuffer = require('./Cbuffer.js');
  Archonia.Form.XY = require('./XY.js').XY;
}

(function(Archonia) {

Archonia.Form.BrainStates = {
  BrainState: function(brain) { this.brain = brain; }
};

Archonia.Form.BrainStates.FindSafeTemp = function(brain) {
  Archonia.Form.BrainStates.BrainState.call(this, brain);
  this.tempCheck = new Archonia.Form.Cbuffer(this.brain.archon.genome.howLongBadTempToEncystment);
  this.active = false; this.startPending = false;
};

Archonia.Form.BrainStates.FindSafeTemp.prototype = Object.create(Archonia.Form.BrainStates.BrainState.prototype);
Archonia.Form.BrainStates.FindSafeTemp.prototype.constructor = Archonia.Form.BrainStates.FindSafeTemp;

Archonia.Form.BrainStates.FindSafeTemp.prototype.getInstruction = function() {
  var foundTolerableTemp = false, radius = this.brain.archon.genome.optimalTempRange / 2;
      
  this.tempCheck.forEach(function(ix, delta) {
    if(delta < radius) { foundTolerableTemp = true; return false; }
  });
  
  var action = (foundTolerableTemp || this.startPending) ? 'move' : 'encyst';
  
  return { action: action, dVelocity: null }; // Brain will decide the direction depending on sense input
};

Archonia.Form.BrainStates.FindSafeTemp.prototype.start = function() {
  this.active = true; this.startPending = true;
  for(var i = 0; i < this.brain.archon.genome.howLongBadTempToEncystment; i++) {
    this.tempCheck.store(this.brain.archon.genome.optimalTemp);
  }
};

Archonia.Form.BrainStates.FindSafeTemp.prototype.update = function(frameCount, onOff) {
  var startup = onOff && !this.active;
  var shutdown = !onOff && this.active;
  var continueRunning = onOff && this.active;

  if(startup) {
    this.start();
  } else if(shutdown) {
    this.active = false; 
  } else if(continueRunning) {
    this.startPending = false;
    var delta = Math.abs(this.brain.getTemperature(this.brain.position) - this.brain.archon.genome.optimalTemp);
    this.tempCheck.store(delta);
  }
};

Archonia.Form.BrainStates.SearchForFood = function(brain) {
  Archonia.Form.BrainStates.BrainState.call(this, brain);
  
  this.startPending = false;
  this.turnPending = false;
  this.active = false;
  
  this.timeToTurn = -1;
  this.turnDirection = -1;
};

Archonia.Form.BrainStates.SearchForFood.prototype = Object.create(Archonia.Form.BrainStates.BrainState.prototype);
Archonia.Form.BrainStates.SearchForFood.prototype.constructor = Archonia.Form.BrainStates.SearchForFood;

Archonia.Form.BrainStates.SearchForFood.prototype.getInstruction = function() {
  
  var robalizedAngle = null, computerizedAngle = null;

  if(this.startPending) {
    robalizedAngle = Archonia.Axioms.realInRange(0, 2 * Math.PI);
    computerizedAngle = Archonia.Axioms.computerizeAngle(robalizedAngle);
    
    return { action: 'setVelocity', dVelocity: computerizedAngle };
    
  } else if(this.turnPending) {

    var v = Archonia.Form.XY(this.brain.archon.velocity);

    computerizedAngle = v.getAngleFrom(0);
    robalizedAngle = Archonia.Axioms.robalizeAngle(computerizedAngle) + (7 * Math.PI / 6) * this.turnDirection;
    computerizedAngle = Archonia.Axioms.computerizeAngle(robalizedAngle);
    
    return({ action: 'turn', dVelocity: computerizedAngle });
    
  } else {
    return { action: 'continue' };
  }
};

Archonia.Form.BrainStates.SearchForFood.prototype.stop = function() {
  this.active = false; this.startPending = false; this.turnPending = false;
};

Archonia.Form.BrainStates.SearchForFood.prototype.setTurnTimer = function(frameCount) {
  this.timeToTurn = frameCount + this.brain.archon.genome.foodSearchTimeBetweenTurns;
};

Archonia.Form.BrainStates.SearchForFood.prototype.start = function(frameCount) {
  this.active = true; this.startPending = true; this.setTurnTimer(frameCount);
};

Archonia.Form.BrainStates.SearchForFood.prototype.update = function(frameCount, onOff) {
  var startup = onOff && !this.active;
  var shutdown = !onOff && this.active;
  var continueRunning = onOff && this.active;
  //var continueSleeping = !onOff && !this.active;  // If we're sleeping, then we can just ignore update calls
  
  if(startup) { this.start(frameCount); }
  else if(shutdown) { this.stop(); }
  else if(continueRunning) { this.startPending = false; this.updateTurnStatus(frameCount); }
};

Archonia.Form.BrainStates.SearchForFood.prototype.updateTurnStatus = function(frameCount) {
  if(frameCount > this.timeToTurn) { this.turnPending = true; this.turnDirection *= -1; this.setTurnTimer(frameCount); }
  else { this.turnPending = false; }
};
  
})(Archonia);

if(typeof window === "undefined") {
  module.exports = Archonia.Form.BrainStates;
}
