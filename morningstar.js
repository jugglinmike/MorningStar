var MORNINGSTAR = {
            steps_array : ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12", "13", "14", "15", "16"],
            sequenceStep : -1,
            sequenceStepGroup: 0,
            status: {
                steps: [],
                numberOfPatterns : 1,
                currentEditPattern : 0,
                res: 100/127,
                vol: 100/127,
                cut: 50/127,
                rel: 100/127,
                env: 64/127,
                dist: 0,
                rev: 0,
                tempo: 0.5
            },
            STEPS_NUM : 64,
            NOTES_NUM : 24,
            VELOCITY_DEFAULT : 0.5,
            PATTERN_NUM: 4,
            STEPS_PER_PATTERN: 16,
            keys : [],
            playKeys : [],
            highlights : [],
            instrKnobs : [],
            globalKnobs : [],
            pianoRollKeys : [],
            bpButtons : {},
            greenLeds : [],
            redLeds : [],
            currentStep : 0,
            currentHLStep : 0,
            audioOk : false,
            errState : false,
            currentPlayPattern: 0,
            restartLoop : true
        };

        MORNINGSTAR.QueryString = function () {
        // This function is anonymous, is executed immediately and
        // the return value is assigned to QueryString!
            var query_string = {};
            var query = window.location.search.substring(1);
            var vars = query.split("&");
            for (var i=0;i<vars.length;i++) {
                var pair = vars[i].split("=");
                // If first entry with this name
                if (typeof query_string[pair[0]] === "undefined") {
                    query_string[pair[0]] = pair[1];
                    // If second entry with this name
                } else if (typeof query_string[pair[0]] === "string") {
                    var arr = [ query_string[pair[0]], pair[1] ];
                    query_string[pair[0]] = arr;
                // If third or later entry with this name
                } else {
                    query_string[pair[0]].push(pair[1]);
                }
            }
            return query_string;
        } ();

        MORNINGSTAR.supportsLocalStorage = function() {
            try {
                return 'localStorage' in window && window['localStorage'] !== null;
            } catch (e) {
                return false;
            }
        }

        MORNINGSTAR.saveStatePartial = function (attribute, value) {
            console.log ("Saving local status for attribute " + attribute);
            if (!this.supportsLocalStorage()) {
                return false;
            }
            localStorage[attribute] = value;
        }

        MORNINGSTAR.saveState = function () {
            console.log ("Saving local status");
            if (!this.supportsLocalStorage()) {
                return false;
            }
            for (var i = 0; i < this.STEPS_NUM; i++) {
                localStorage["MS.note." + i] = this.status.steps[i].note;
                localStorage["MS.velocity." + i] = this.status.steps[i].velocity;
                localStorage["MS.active." + i] = this.status.steps[i].active;
            }
            localStorage["MS.numberOfPatterns"] = this.status.numberOfPatterns;
            localStorage["MS.Resonance"] = this.status.res;
            localStorage["MS.vol"] = this.status.vol;
            localStorage["MS.Cutoff"] = this.status.cut;
            localStorage["MS.Release"] = this.status.rel;
            localStorage["MS.Envelope"] = this.status.env;
            localStorage["MS.dist"] = this.status.dist;
            localStorage["MS.rev"] = this.status.rev;
            localStorage["MS.tempo"] = this.status.tempo;
            return true;
        }

        MORNINGSTAR.resumeState = function () {
            console.log ("Restoring local status");
            if (!this.supportsLocalStorage()) {return false;}

            for (var i = 0; i < this.STEPS_NUM; i++) {
                this.status.steps[i] = {};
                this.status.steps[i].note = parseInt(localStorage["MS.note." + i], 10);
                this.status.steps[i].velocity = parseFloat(localStorage["MS.velocity." + i], 10);
                this.status.steps[i].active = parseInt(localStorage["MS.active." + i], 10);
                // If they are not there, localStorage is null and parseInt gives back NaN
                if (isNaN(this.status.steps[i].note) || isNaN(this.status.steps[i].velocity) || isNaN(this.status.steps[i].active)) {
                    // Saved status is (partially?) empty: return false.
                    console.log ("Saved status is (partially?) empty: this can happen when there is no localStorage");
                    return false;
                }
            }
            this.status.numberOfPatterns = parseInt(localStorage["MS.numberOfPatterns"], 10);
            if (isNaN(this.status.numberOfPatterns)) {
                // Saved status is partially empty: return false.
                console.log ("Saved status is partially empty: this shouldn't happen");
                return false;
            }

            if (isNaN(this.status.res = parseFloat(localStorage["MS.Resonance"], 10))) return false;
            if (isNaN(this.status.vol = parseFloat(localStorage["MS.vol"], 10))) return false;
            if (isNaN(this.status.cut = parseFloat(localStorage["MS.Cutoff"], 10))) return false;
            if (isNaN(this.status.rel = parseFloat(localStorage["MS.Release"], 10))) return false;
            if (isNaN(this.status.env = parseFloat(localStorage["MS.Envelope"], 10))) return false;
            if (isNaN(this.status.dist = parseFloat(localStorage["MS.dist"], 10))) return false;
            if (isNaN(this.status.rev = parseFloat(localStorage["MS.rev"], 10))) return false;
            if (isNaN(this.status.tempo = parseFloat(localStorage["MS.tempo"], 10))) return false;

            console.log ("Restoring local status returned OK");
            return true;
        }

        MORNINGSTAR.restoreDefaultState = function () {
            for (var i = 0; i < this.STEPS_NUM; i+=1) {
                this.status.steps[i] = {};
                // Not active, by default
                this.status.steps[i].active = 0;
                // Note = -1 means that there is no note associated with the step
                this.status.steps[i].note = -1;
                // This depends on the initial velocity value
                this.status.steps[i].velocity = this.VELOCITY_DEFAULT;
            }
        }
        
        MORNINGSTAR.exportParameters = function() {
            var string = "?";
            for (var i = 0; i < this.STEPS_NUM; i += 1) {
                if (i !== 0) string += "&";
                string += "n" + i + "=" + this.status.steps[i].note + "&";
                string += "a" + i + "=" + this.status.steps[i].active + "&";
                string += "v" + i + "=" + this.status.steps[i].velocity;
            }
            string += "&res=" + this.status.res;
            string += "&vol=" + this.status.vol;
            string += "&cut=" + this.status.cut;
            string += "&rel=" + this.status.rel;
            string += "&env=" + this.status.env;
            string += "&dist=" + this.status.dist;
            string += "&rev=" + this.status.rev;
            string += "&tempo=" + this.status.tempo;
            
            return string;
        }

        // CALLBACKS
        
        // SPLASHSCREEN CALLBACKS
        MORNINGSTAR.imageLoaded = function (loaderStatus) {
            if (this.errState !== true) {
                var ls = loaderStatus;
                this.message.innerHTML =  " Resource " + ls.status.id  + " loaded image " + ls.status.loaded + " of " + ls.status.total;
            }
        }

        MORNINGSTAR.imageError = function (loaderStatus) {
            var ls = loaderStatus;
            this.errState = true;
            this.message.innerHTML =  ls.status.id  + ": ERROR loading images " /* + ls.obj.src */;
        }

        MORNINGSTAR.singleLoaded = function (loaderStatus) {
            /*if (this.errState !== true) {
                var ls = loaderStatus;
                this.message.innerHTML = ls.status.id + " loaded...";
            }*/
        }

        // PLAY / STOP BUTTON
        MORNINGSTAR.uiPlayStartStop = function (state) {

            // Sequencer is starting, set the unclickable controls.

            // Keys
            for (var i = 0, len = this.steps_array.length; i < len; i+=1) {
                this.ui.setClickable(this.keys[i].ID, state);
            }

            // Highlights
            for (var i = 0, len = this.steps_array.length; i < len; i+=1) {
                this.ui.setClickable(this.highlights[i].ID, state);
            }

            // Piano Roll
            for (var i = 0; i < this.pianoRollKeys.length; i+=1) {
                this.pianoRollKeys[i].setClickable (state);
            }

            // Plus / minus buttons
            this.ui.setClickable("minus_button", state);
            this.ui.setClickable("plus_button", state);

            // Velocity. Note that velocity does its thing when in play mode
            // (change the highlighted button's velocity correctly), but it can
            // generate confusion when the play pattern visualization changes.
            this.ui.setClickable("Velocity", state);

            if ((state === true) && (this.sequenceStep !== -1)) {
                // Set the last play key as invisible
                this.ui.setVisible(this.playKeys[this.sequenceStep % this.STEPS_PER_PATTERN].ID, false);
                // Set the last real key as visible
                this.ui.setVisible(this.keys[this.sequenceStep % this.STEPS_PER_PATTERN].ID, true);
                // Play and stop reset the position; don't do this if you wanna simply pause the sequencer
                // Reset the current sequence step
                this.sequenceStep = -1;
            }
        }


        MORNINGSTAR.sequencerRoutine = function () {

            console.log ("*** sequenceStep + 1 (" + (this.sequenceStep + 1) + ") === this.status.numberOfPatterns (" + this.status.numberOfPatterns +") * " + this.STEPS_PER_PATTERN );

            // Stop if loop mode is not set
            if (this.restartLoop === false && ((this.sequenceStep + 1) === (this.status.numberOfPatterns * this.STEPS_PER_PATTERN))) {
                console.log ("Stopping the show");
                this.ui.setValue({elementID: "StopButton", value: 1});
                return;
            }

            var nextStep = (this.sequenceStep + 1) % (this.STEPS_PER_PATTERN * this.status.numberOfPatterns);
            // Graphical step, the actual key to light.
            var nextGrStep = nextStep % this.STEPS_PER_PATTERN;

            if ((nextGrStep === 0) /*&& (nextGrStep !== nextStep)*/) {
                //Time to change pattern
                //Last play key becomes invisible
                this.ui.setVisible(this.playKeys[this.STEPS_PER_PATTERN - 1].ID, false);
                //Last I/O key becomes visible
                this.ui.setVisible(this.keys[this.STEPS_PER_PATTERN - 1].ID, true);
                //and unclickable, again
                this.ui.setClickable(this.keys[this.STEPS_PER_PATTERN - 1].ID, false);
                //Actually change pattern
                this.switchPattern (nextStep / this.STEPS_PER_PATTERN);
                //See if we need to refresh the play LED
                if ((nextStep / this.STEPS_PER_PATTERN) !== this.currentPlayPattern) {
                    //Light the right green led
                    this.ui.setValue({elementID: "greenled_" + (nextStep / this.STEPS_PER_PATTERN), value: 1});
                    // Turn the previous green led off
                    this.ui.setValue({elementID: "greenled_" + this.currentPlayPattern, value: 0});
                    //Same for the red led
                    this.ui.setValue({elementID: "redled_" + (nextStep / this.STEPS_PER_PATTERN), value: 1});
                    // Turn the previous red led off
                    this.ui.setValue({elementID: "redled_" + this.currentPlayPattern, value: 0});
                }
                // Update the current play pattern
                this.currentPlayPattern = nextStep / this.STEPS_PER_PATTERN;

            }

            // Play note
            if (this.status.steps[nextStep].active === 1) {
                if (this.audioOk === true) {
                    // If the next step is active, turn the playing note off.
                    this.audioManager.noteOff();
                    // If there really is a note (not a pause), play it.
                    if (this.status.steps[nextStep].note !== -1) {
                        this.audioManager.noteOn(this.status.steps[nextStep].note - 33, Math.round(this.status.steps[nextStep].velocity * 127));
                    }
                }

            }

            // If we're not at the first step
            if (nextGrStep !== 0) {
                //Restore previous key
                //play key becomes invisible
                this.ui.setVisible(this.playKeys[nextGrStep - 1].ID, false);
                //i/o key becomes visible
                this.ui.setVisible(this.keys[nextGrStep - 1].ID, true);
                //and unclickable, again
                this.ui.setClickable(this.keys[nextGrStep - 1].ID, false);
            }

            //i/o key is invisible
            this.ui.setVisible(this.keys[nextGrStep].ID, false);
            //play key becomes visible
            this.ui.setVisible(this.playKeys[nextGrStep].ID, true);
            //increment position
            this.sequenceStep = nextStep;
            // This could be conditional, if refresh() takes too much time.
            this.ui.refresh();

        }

        MORNINGSTAR.sequencerTimerStart = function () {
            // Calculate intervals given the BPM
            var interval = 60000 / this.tempo_value / 4;
            console.log ("Setting the timer to ", interval, " seconds");
            // Create the timer
            this.sequencerTimer = setInterval(this.sequencerRoutine.bind(MORNINGSTAR), interval);

        }

        MORNINGSTAR.sequencerTimerStop = function () {
            clearInterval(this.sequencerTimer);
        }

        MORNINGSTAR.stCallback = function (slot, value, elName)  {
            if (value === 1) {
                // Pepare UI for play mode
                console.log ("Starting the sequencer");
                this.uiPlayStartStop.call(this, false);

                // Start the timer
                console.log ("Starting the timer");
                this.sequencerTimerStart.call(this);

                // Set stop  button value as 0. Don't refresh: invoking the bpCallback will do that.
                this.ui.setValue({elementID: "StopButton", value: 0});
                // Set stop button as clickable
                this.ui.setClickable("StopButton", true);
                
            }
            else if (value === 0) {
                // Set stop value as 1. Don't refresh: invoking the bpCallback will do that.
                this.ui.setValue({elementID: "StopButton", value: 1});
            }
            else {
                throw ("Shouldn't be here!!");
            }

        }

        MORNINGSTAR.bpCallback = function (slot, value, elName)  {

            if (value === 1) {
                // Stop the timer
                console.log ("Stopping the timer");
                this.sequencerTimerStop.call(this);

                // Pepare UI for i/o mode
                console.log ("Stopping the sequencer");
                this.uiPlayStartStop.call(this, true);
                // Set stop  button as unclickable
                this.ui.setClickable("StopButton", false);
                // Finally, set play button as 0, without calling back to avoid infinite loops.
                this.ui.setValue({elementID: "PlayButton", value: 0, fireCallback: false});
            }
            else if (value === 0) {
                console.log ("Value 0, do nothing");
            }
            else {
                // throw
                throw ("Shouldn't be here!!");
            }
            this.ui.refresh();
        }

        // RESTART BUTTON
        MORNINGSTAR.rsCallback = function (slot, value, elName)  {

            if (value === 1) {
                console.log ("Restart is ON");
                this.restartLoop = true;
            }
            else if (value === 0) {
                console.log ("Restart is OFF");
                this.restartLoop = false;
            }
            else {
                // throw
                console.log ("Shouldn't be here!!");
            }
            this.ui.refresh();

        }

        MORNINGSTAR.pianoSetUnique = function (toSet) {
            this.pianoUnsetAll.call(this, toSet);
            this.pianoSetNote.call(this, toSet);
        }

        MORNINGSTAR.pianoSetNote = function (toSet) {

            // Turn it on on the UI. Do not invoke callbacks.
            this.ui.setValue({elementID: toSet, value: 1, fireCallback: false});

        }

        MORNINGSTAR.pianoUnsetAll = function (dontUnset) {
            for (var i = 0; i < this.pianoRollKeys.length; i+=1) {
                // Unset all the notes, except the one called dontUnset
                if (this.pianoRollKeys[i].ID !== dontUnset) {
                    if (this.pianoRollKeys[i].getValue ("buttonvalue") === 1) {
                        // Turn it off on the UI. Do not invoke callbacks.
                        this.ui.setValue({elementID: this.pianoRollKeys[i].ID, value: 0, fireCallback: false});
                    }
                }
            }
        }

        MORNINGSTAR.pianoCallback = function (slot, value, elName)  {

            var noteNumber = parseInt(elName.split('_')[0], 10);

            if (this.audioOk === true) {
                // Piano keys are exclusive, so turn off the current note playing
                this.audioManager.noteOff();
            }

            if (value === 1) {
                // Set a new key in the status
                this.status.steps[this.currentStep].note = noteNumber;
                var velocity = Math.round(this.status.steps[this.currentStep].velocity * 127);

                // Set the others to off.
                this.pianoSetUnique.call(this,elName);

                if (this.audioOk === true) {
                    // Play the note in the synth
                    this.audioManager.noteOn(noteNumber - 33, velocity);
                }

                console.log ("Note ", elName, " number ", noteNumber, " for key ", this.currentStep, " is ON!");
            }
            else if (value === 0) {

                // Unset the key in the status
                this.status.steps[this.currentStep].note = -1;

                console.log ("Note ", elName, " number ", noteNumber, " for key ", this.currentStep, " is OFF!");
            }
            else {
                // throw
                console.log ("Shouldn't be here!!");
            }
            // Note changed, save the local state.
            this.saveState();
            this.ui.refresh();
        }

        MORNINGSTAR.pianoKeyChange = function (newStep, force) {

            if ((this.currentStep !== newStep) || (force === true)) {
                if (this.audioOk === true) {
                        // currentStep will change. Send a noteOff to truncate playing.
                        this.audioManager.noteOff();
                     }
                // Display the correct note if there is one (aka not -1)
                if (this.status.steps[newStep].note !== -1) {
                    this.pianoSetUnique.call(this, this.status.steps[newStep].note + '_pr');
                }
                // Else, erase every note on the piano roll.
                else {
                    this.pianoUnsetAll.call(this, null);
                }
                // Display the correct velocity, do not trigger the callback
                this.ui.setValue({elementID: 'Velocity', value: this.status.steps[newStep].velocity, fireCallback: false});
            }
        }

        MORNINGSTAR.hlChange = function (newStep, force) {
        if ((this.currentHLStep !== newStep) || (force === true)){
                // Set current highlight as invisible
                this.ui.setVisible(this.currentHLStep + '_hl', false);
                // setVisible = false makes it unclickable. Make it clickable again.
                this.ui.setClickable(this.currentHLStep + '_hl', true);
                // Set new highlight as visible, and update currentHLStep
                this.ui.setVisible(newStep + '_hl', true);
                this.currentHLStep = newStep;               
            }
        }

        MORNINGSTAR.setStep = function (newStep, newRealStep, force) {
            // Change the highlighted slot
            this.hlChange (newStep, newRealStep, force);
            // Trigger a new note in the piano, if needed
            this.pianoKeyChange (newRealStep, force);
            // Set the new current step
            this.currentStep = newRealStep;
        }

        MORNINGSTAR.hlCallback = function (slot, value, ID) {

            var newStep = parseInt(ID.split('_')[0], 10);
            var newRealStep = newStep + this.STEPS_PER_PATTERN * this.status.currentEditPattern;

            this.setStep (newStep, newRealStep);
            
            this.ui.refresh();
        }

        MORNINGSTAR.keyCallback = function (slot, value, ID) {

            var newRealStep = parseInt(ID,10) + this.STEPS_PER_PATTERN * this.status.currentEditPattern;
            
            if (value === 0) {
                this.status.steps[newRealStep].active = 0;
                console.log ("Unset step number " + newRealStep);
            }
            else if (value === 1) {
                this.status.steps[newRealStep].active = 1;
                console.log ("Set step number " + newRealStep);
            }
            else {
                //throw!
            }

            // Change the highlight
            this.hlChange (parseInt(ID,10), newRealStep);
            // Trigger a new note in the piano, if needed
            this.pianoKeyChange (newRealStep);

            // Set the new current step
            this.currentStep = newRealStep;
            
            // Step changed, save the local state.
            this.saveState();
            this.ui.refresh();

        };

        MORNINGSTAR.plusCallback = function (slot, value, ID) {
            console.log ("Calling plus callback");

            // Set current LED to off
            console.log ("Setting off LED #", this.status.currentEditPattern);
            this.ui.setValue({elementID: "redled_" + this.status.currentEditPattern, value: 0});

            var ledToGo = (this.status.currentEditPattern + 1) % this.status.numberOfPatterns;
            // Set current LED + 1 to on
            console.log ("Setting on LED #", ledToGo, " of ", this.status.numberOfPatterns);
            this.ui.setValue({elementID: "redled_" + ledToGo, value: 1});
            
            this.switchPattern(ledToGo);

            this.ui.setValue({elementID: "statusLabel", value: "Edit pattern: " + (parseInt(ledToGo,10)+ 1)});

            // Current pattern changed, save the local state.
            this.saveState();
            this.ui.refresh();
        }

        MORNINGSTAR.minusCallback = function (slot, value, ID) {
            console.log ("Calling minus callback");

            // Set current LED to off
            console.log ("Setting off LED #", this.status.currentEditPattern);
            this.ui.setValue({elementID: "redled_" + this.status.currentEditPattern, value: 0});

            // Set current LED - 1 to on
            var ledToGo = this.status.currentEditPattern - 1;
            if (ledToGo < 0) {
                ledToGo = this.status.numberOfPatterns - 1;
            }
            console.log ("Setting on LED #", ledToGo, " of ", this.status.numberOfPatterns);
            this.ui.setValue({elementID: "redled_" + ledToGo, value: 1});

            this.switchPattern(ledToGo);

            this.ui.setValue({elementID: "statusLabel", value: "Edit pattern: " + (parseInt(ledToGo,10)+ 1)});

            // Current pattern changed, save the local state.
            this.saveState();
            this.ui.refresh();
        }

        MORNINGSTAR.switchSteps = function () {
            // Change the highlighted slot
            for (var i = 0; i < this.STEPS_PER_PATTERN; i+=1) {
                var stepNum = this.STEPS_PER_PATTERN * this.status.currentEditPattern + i;
                this.ui.setValue ({elementID: i.toString(), value: this.status.steps[stepNum].active, fireCallback: false});
            }
            return;
        }

        MORNINGSTAR.switchPattern = function (newpattern, force) {
            if ((this.status.currentEditPattern === newpattern) && (force !== true)){
                console.log ("Pattern is the same, not switching");
                return;
            }
            console.log("Switching pattern to", newpattern);
            this.status.currentEditPattern = newpattern;

            this.switchSteps();

            // Current step is changed to where the highlight was
            var newStep = this.STEPS_PER_PATTERN * this.status.currentEditPattern + this.currentHLStep;
            console.log("Switching currentStep to", this.newStep);
            // Trigger a new note in the piano, if needed
            this.pianoKeyChange (newStep, force);

            this.currentStep = newStep;

            return;
        }

        MORNINGSTAR.switchCallback = function (slot, value, ID) {
            console.log ("Calling switch callback with value ", value);

            this.status.numberOfPatterns = value + 1;

            if (this.status.currentEditPattern >= this.status.numberOfPatterns) {
                this.ui.setValue({elementID: "redled_" + this.status.currentEditPattern, value: 0});
                this.status.currentEditPattern = this.status.numberOfPatterns - 1;
                this.ui.setValue({elementID: "redled_" + this.status.currentEditPattern, value: 1});
                this.switchPattern(this.status.currentEditPattern, true);
            }

            this.ui.setValue({elementID: "statusLabel", value: "N. of patterns: " + this.status.numberOfPatterns});

            // Total patterns changed, save the local state.
            this.saveState();
            this.ui.refresh();
        }

        MORNINGSTAR.instrKnobCallback = function (slot, value, ID) {

            // Interpolate the instrKnobs value in the integer range [0,127]
            var interpolated_value = Math.round(value * 127);

             if (this.audioOk === true) {
                
                // Call the corresponding function in the audio manager
                var functionName = "set" + ID;
                console.log ("Calling audioManager[" + functionName + "] with value " + value + "-->" + interpolated_value);
                this.audioManager[functionName](interpolated_value);
            }
            
            if (ID === "Resonance") {
                // Save the uninterpolated value in the status object
                this.status.res = value
            }
            
            else if (ID === "Cutoff") {
                // Save the uninterpolated value in the status object
                this.status.cut = value;
            }
            
            else if (ID === "Envelope") {
                // Save the uninterpolated value in the status object
                this.status.env = value;
            }
            
            else if (ID === "Release") {
                // Save the uninterpolated value in the status object
                this.status.rel = value;
            }
            
            else throw "Unknown ID " + ID + " in instrKnobCallback, this shouldn't happen";

            // Save uninterpolated value in the local storage
            this.saveStatePartial ("MS." + ID, value);

            this.ui.setValue({elementID: "statusLabel", value: ID + ": " + interpolated_value});
            this.ui.refresh();
        };

        MORNINGSTAR.globalKnobCallback = function (slot, value, ID) {
            if (ID === "Tempo") {
                // Interpolate the Tempo value in the integer range [60,180]
                // tempo_value is the interpolated value, to simplify calculations
                this.tempo_value = Math.round(value *  120 + 60);
                console.log ("TEMPO set to ", this.tempo_value);
                
                // Save the uninterpolated value in the status object
                this.status.tempo = value;
                // Save the uninterpolated value in the local storage
                this.saveStatePartial("MS.tempo", value);

                // Display the interpolated value on the label
                this.ui.setValue({elementID: "statusLabel", value: "BPM: " + this.tempo_value});
            }
            else if (ID === "Reverb") {

                if (this.audioOk === true) {
                    this.audioManager.setReverb(value);
                }

                // Save the uninterpolated value in the status object
                this.status.rev = value;
                // Save the uninterpolated value in the local storage
                this.saveStatePartial("MS.rev", value);

                // Display the interpolated value on the label
                this.ui.setValue({elementID: "statusLabel", value: "Reverb: " + Math.round(value * 127)});
            }
            else if (ID === "Distortion") {

                if (this.audioOk === true) {
                    // Tell audio manager we want to change distortion
                    this.audioManager.setDistortion(value);
                }

                // Save the uninterpolated value in the status object
                this.status.dist = value;
                // Save the uninterpolated value in the local storage
                this.saveStatePartial("MS.dist", value);

                // Display the interpolated value on the label, 0 is off and 1 is max value.
                if (value === 0) {
                    this.ui.setValue({elementID: "statusLabel", value: "Dist: Off"});
                }
                else if (value === 1) {
                    this.ui.setValue({elementID: "statusLabel", value: "Dist: Max"});
                }
                else {
                    this.ui.setValue({elementID: "statusLabel", value: "Dist: " + Math.round(value * 127)});
                }
            }
            else if (ID === "Velocity") {
                // Save the velocity for the highlighted step
                this.status.steps[this.currentStep].velocity = value;

                // Save uninterpolated velocity in the local storage
                this.saveStatePartial ("MS.velocity." + this.currentStep, value);

                // Display the interpolated value on the label
                this.ui.setValue({elementID: "statusLabel", value: "Vel: " + Math.round(value * 127)});
            }
            else if (ID === "Volume") {

                if (this.audioOk === true) {
                    // Tell audio manager we want to change volume
                    this.audioManager.setVolume(Math.round(value * 127));
                }

                // Save the uninterpolated value in the status object
                this.status.vol = value;
                // Save uninterpolated velocity in the local storage
                this.saveStatePartial ("MS.vol", value);

                // Display the interpolated value on the label
                this.ui.setValue({elementID: "statusLabel", value: "Vol: " + Math.round(value * 127)});
            }
            
            else throw "Unknown ID " + ID + " in globalKnobCallback, this shouldn't happen";
            
            this.ui.refresh();
        };

        MORNINGSTAR.buttonTimeout = function (ID, val) {
            console.log ("Clear callback called with ID " +  ID + "value "+ val);
            // Set the button back to 0
                this.ui.setValue ({elementID: ID, value: val});
        }
        MORNINGSTAR.clearCallback = function(slot, value, ID) {
            console.log ("Clear callback called with value " +  value);
            if (value === 1) {
                this.restoreDefaultState();
                this.saveState();
                this.switchPattern (0, true);
                this.ui.setValue({elementID: "statusLabel", value: "Song Cleared"});
                this.ui.refresh();
                // Set the button to unclickable
                this.ui.setClickable(ID, false);
                // Set the button back to 0 in a few milliseconds. God bless bind()
                setTimeout ( this.buttonTimeout.bind(MORNINGSTAR, ID, 0), 150 );
            }
            else {
                this.ui.setClickable(ID, true);
                this.ui.refresh();
            }
        }
        
        MORNINGSTAR.exportCallback = function (slot, value, ID) {
            if (value === 1) {
                var string = this.exportParameters();
                console.log ("Export string: " + string);

                window.prompt ("URL for your exported song:", document.URL + string);

                //this.message.innerHTML = "Parameters exported to clipboard";
                //this.d_message.style.zIndex = 100;

                this.ui.setValue({elementID: "statusLabel", value: "Song URL Exported"});
                this.ui.refresh();
                // Set the button to unclickable
                this.ui.setClickable(ID, false);
                // Set the button back to 0 in a few milliseconds.
                setTimeout ( this.buttonTimeout.bind(MORNINGSTAR, ID, 0), 150 );
            }
            else {
                this.ui.setClickable(ID, true);
                this.ui.refresh();
            }
            
        }

        MORNINGSTAR.afterLoading = function (loaders) {
            
            this.message.innerHTML = "Resources loaded, initializing...";

            var key_initial_offset = 67 - 43,
                key_distance = 55;

            /* LABEL INIT */

            // Every element calls label's setValue in the callback, so let's make sure
            // that label is declared first.
            this.label = new Label({
                ID: 'statusLabel',
                width : 320,
                height : 29,
                top : 69,
                left : 42,
                objParms: {
                    font: "28px embedded_font",
                    textColor: "#000",
                    textBaseline: "top",
                    textAlignment: "left"
                }
            });
            this.ui.addElement(this.label, {zIndex: 3});

            /* BACKGROUND */

            var backgroundArgs = {
                ID: 'background',
                top: 0,
                left: 0,
                image: loaders["background_loader"].images[0]
                }

            this.background = new Background (backgroundArgs);
            this.ui.addElement(this.background, {zIndex: 1});

            /* KEYS */

            var highlightArgs = {
                left: 0,
                top: 445,
                image: loaders["highlight_loader"].images[0],
                onValueSet: this.hlCallback.bind(MORNINGSTAR)
            };

            var keyArgs = {
                /*ID: "note",*/
                left:  0,
                top: 447
            };

            keyArgs.onValueSet = this.keyCallback.bind(MORNINGSTAR);

            for (var i = 0; i < this.steps_array.length; i += 1) {
                keyArgs.ID = i;
                keyArgs.imagesArray = loaders[this.steps_array[i] + "_loader"].images;
                keyArgs.left = key_initial_offset + i * key_distance;

                // Highlights on the keys
                highlightArgs.ID = i + '_hl';
                highlightArgs.left = keyArgs.left + 1;
                highlightArgs.ROITop = keyArgs.top - 23;
                highlightArgs.ROIHeight = 20;

                // Create the key
                this.keys[i] = new Button(keyArgs);
                // Create the highlight
                this.highlights[i] = new Background(highlightArgs);

                // Parameters for the play keys, we hijack the key ones
                keyArgs.imagesArray = loaders[this.steps_array[i] + "_pl_loader"].images;
                keyArgs.ID = keyArgs.ID + "_pl";

                // Create the play key
                this.playKeys[i] = new Button(keyArgs);

                // Add the created elements
                this.ui.addElement(this.keys[i], {zIndex: 5});
                this.ui.addElement(this.playKeys[i], {zIndex: 5});
                this.ui.addElement(this.highlights[i], {zIndex: 10});

                // Display the highlight for the current key.
                if (i !== this.currentStep) {
                    this.ui.setVisible(highlightArgs.ID, false);
                }
                this.ui.setClickable(highlightArgs.ID, true);

                // Play keys are invisible by default. They become visible in
                // sequencer mode.
                this.ui.setVisible (keyArgs.ID, false);
            }

            // BYPASS / PLAY / REPEAT BUTTONS

            var bpArgs = {
                top: 153
            };

            bpArgs.ID = "PlayButton";
            bpArgs.left = 260 - 43;
            bpArgs.imagesArray = loaders["play_loader"].images;
            // Elements without callback won't refresh themselves.
            // bpArgs.onValueSet = function () {this.ui.refresh()}.bind(MORNINGSTAR);
            bpArgs.onValueSet = this.stCallback.bind(MORNINGSTAR);
            this.bpButtons['play'] = new Button(bpArgs);
            bpArgs.ID = "StopButton";
            bpArgs.left = 179 - 43;
            bpArgs.imagesArray = loaders["stop_loader"].images;
            bpArgs.onValueSet = this.bpCallback.bind(MORNINGSTAR);
            this.bpButtons['stop'] = new Button(bpArgs);
            bpArgs.ID = "RestartButton";
            bpArgs.left = 343 - 43;
            bpArgs.imagesArray = loaders["restart_loader"].images;
            bpArgs.onValueSet = this.rsCallback.bind(MORNINGSTAR);
            this.bpButtons['restart'] = new Button(bpArgs);

            this.ui.addElement(this.bpButtons['play'], {zIndex: 3});
            this.ui.addElement(this.bpButtons['stop'], {zIndex: 3});
            this.ui.addElement(this.bpButtons['restart'], {zIndex: 3});

            /* KNOBS */

            // INSTRUMENT (WHITE) KNOBS

            var  instr_knob_names = [{ID: "Resonance", top: 255, left: 820 - 43},
                                     {ID: "Release", top: 61, left: 820 - 43},
                                     {ID: "Cutoff",  top: 255, left: 641 - 43},
                                     {ID: "Envelope", top: 61, left: 641 - 43}];

            var instrKnobArgs = {
                image : loaders["white_knob_loader"].images[0],
                sensitivity : 5000,
                initAngValue: 270,
                angSteps : 127,
                startAngValue: 218,
                stopAngValue : 501
            };

            instrKnobArgs.onValueSet = this.instrKnobCallback.bind(MORNINGSTAR);

            for (var i = 0; i < instr_knob_names.length; i ++) {
                instrKnobArgs.ID = instr_knob_names[i].ID;
                instrKnobArgs.top = instr_knob_names[i].top;
                instrKnobArgs.left = instr_knob_names[i].left;
                this.instrKnobs[i] = new RotKnob(instrKnobArgs);
                this.ui.addElement(this.instrKnobs[i],  {zIndex: 10});
            }

            // GLOBAL (BLACK) KNOBS

            var  global_knob_names = [{ID: "Distortion", top: 238, left: 448 - 43},
                                      {ID: "Reverb", top: 240, left: 530 - 43},
                                      {ID: "Tempo", top: 327, left: 449 - 43},
                                      {ID: "Volume", top: 327, left: 527 - 43},
                                      {ID: "Velocity", top: 155, left: 78 - 43}
                                      ];

            var globalKnobArgs = {
                image : loaders["black_knob_loader"].images[0],
                sensitivity : 5000,
                initAngValue: 270,
                angSteps : 120,
                startAngValue: 218,
                stopAngValue : 501
            };

            globalKnobArgs.onValueSet = this.globalKnobCallback.bind(MORNINGSTAR);

            for (var i = 0; i < global_knob_names.length; i ++) {
                globalKnobArgs.ID = global_knob_names[i].ID;
                globalKnobArgs.top = global_knob_names[i].top;
                globalKnobArgs.left = global_knob_names[i].left;
                this.globalKnobs[i] = new RotKnob(globalKnobArgs);
                this.ui.addElement(this.globalKnobs[i],  {zIndex: 10});
            }

            // SWITCH
            var swArgs = {
                ID : "switch",
                top: 69,
                left: 414,
                imagesArray : loaders["switch_loader"].images,
                onValueSet : this.switchCallback.bind(MORNINGSTAR)
            };

            this.switchButton = new Button(swArgs);
            this.ui.addElement(this.switchButton,  {zIndex: 10});

            // PLUSMINUS
            var pmArgs = {
                ID:"minus_button",
                top: 140,
                left: 416,
                imagesArray : loaders["minus_loader"].images,
                onValueSet : this.minusCallback.bind(MORNINGSTAR)
            };

            this.minusButton = new Button(pmArgs);
            this.ui.addElement(this.minusButton,  {zIndex: 10});

            pmArgs.ID = "plus_button";
            pmArgs.left = 503;
            pmArgs.imagesArray = loaders["plus_loader"].images;
            pmArgs.onValueSet = this.plusCallback.bind(MORNINGSTAR);

            this.plusButton = new Button(pmArgs);
            this.ui.addElement(this.plusButton,  {zIndex: 10});

            // LEDS
            var ledArgs = {
                isClickable: false
            };

            for (var i = 0; i < 4; i += 1) {
                // Both
                ledArgs.left = 420 + i * 29;

                // Red
                ledArgs.imagesArray = loaders["redled_loader"].images;
                ledArgs.top = 189;
                ledArgs.ID = "redled_" + i;
                this.redLeds[i] = new Button(ledArgs);
                this.ui.addElement(this.redLeds[i],  {zIndex: 10});

                // Green
                ledArgs.imagesArray = loaders["greenled_loader"].images;
                ledArgs.top = 166;
                ledArgs.ID = "greenled_" + i;
                this.greenLeds[i] = new Button(ledArgs);
                this.ui.addElement(this.greenLeds[i],  {zIndex: 10});

            }

            // CLEAR PATTERN BUTTON (TODO GRAPHICS)
            var clearArgs = {
                top: 8,
                left: 786,
                ID: "clear",
                imagesArray : loaders["littlebutton_loader"].images,
                onValueSet : this.clearCallback.bind(MORNINGSTAR)
            };

            this.clear = new Button (clearArgs);
            this.ui.addElement(this.clear,  {zIndex: 10});
            
            // EXPORT SONG BUTTON (TODO GRAPHICS)
            var exportArgs = {
                top: 8,
                left: 888,
                ID: "export",
                imagesArray : loaders["littlebutton_loader"].images,
                onValueSet : this.exportCallback.bind(MORNINGSTAR)
            };

            this.exportButton = new Button (exportArgs);
            this.ui.addElement(this.exportButton,  {zIndex: 10});


            // AUDIO ON / OFF
            var onoffArgs = {
                isClickable: false
            };

            onoffArgs.imagesArray = loaders["onoff_loader"].images;
            onoffArgs.top = 6;
            onoffArgs.left = 65;
            onoffArgs.ID = "onoff";
            this.onoff = new Button(onoffArgs);
            this.ui.addElement(this.onoff,  {zIndex: 10});

            // AUDIO SUBSYSTEM BUTTON
            var subsArgs = {
                isClickable: false,
                isVisible: false
            };

            subsArgs.imagesArray = loaders["subsys_loader"].images;
            subsArgs.top = 6;
            subsArgs.left = 92;
            subsArgs.ID = "subsys";
            this.subsys = new Button(subsArgs);
            this.ui.addElement(this.subsys,  {zIndex: 10});

            // PIANO ROLL

            var  pianoKeyData = [
                {ID: "0_pr",   image_ld: "tone_right_loader", left: 73 - 43},
                {ID: "1_pr",  image_ld: "semitone_loader", left: 91 - 43},
                {ID: "2_pr",   image_ld: "tone_both_loader", left: 97  - 43},
                {ID: "3_pr",  image_ld: "semitone_loader",  left: 115 - 43},
                {ID: "4_pr",   image_ld: "tone_left_loader", left: 121 - 43},
                {ID: "5_pr",   image_ld: "tone_right_loader", left: 144 - 43},
                {ID: "6_pr",  image_ld: "semitone_loader", left: 162 - 43},
                {ID: "7_pr",   image_ld: "tone_both_loader", left: 168 - 43},
                {ID: "8_pr",  image_ld: "semitone_loader", left: 186 - 43},
                {ID: "9_pr",   image_ld: "tone_both_loader", left: 192 - 43},
                {ID: "10_pr", image_ld: "semitone_loader", left: 210 - 43},
                {ID: "11_pr",  image_ld: "tone_left_loader", left: 216 - 43},
                {ID: "12_pr",  image_ld: "tone_right_loader", left: 239 - 43},
                {ID: "13_pr", image_ld: "semitone_loader", left: 257 - 43},
                {ID: "14_pr",  image_ld: "tone_both_loader", left: 263 - 43},
                {ID: "15_pr", image_ld: "semitone_loader", left: 280 - 43},
                {ID: "16_pr",  image_ld: "tone_left_loader", left: 286 - 43},
                {ID: "17_pr",  image_ld: "tone_right_loader", left: 310 - 43},
                {ID: "18_pr", image_ld: "semitone_loader", left: 328 - 43},
                {ID: "19_pr",  image_ld: "tone_both_loader", left: 334 - 43},
                {ID: "20_pr", image_ld: "semitone_loader", left: 352 - 43},
                {ID: "21_pr",  image_ld: "tone_both_loader", left: 358 - 43},
                {ID: "22_pr", image_ld: "semitone_loader", left: 376 - 43},
                {ID: "23_pr",  image_ld: "tone_left_loader", left: 382 - 43},
            ];

            var pianoKeyArgs = {
                top: 276,
                onValueSet: this.pianoCallback.bind(MORNINGSTAR)
            };

            var pianoZIndex;

            for (var i = 0; i < pianoKeyData.length; i += 1) {
                pianoZIndex = 11;
                pianoKeyArgs.ID = pianoKeyData[i].ID;
                pianoKeyArgs.left = pianoKeyData[i].left;
                pianoKeyArgs.imagesArray = loaders[pianoKeyData[i].image_ld].images;
                if (pianoKeyData[i].image_ld === "semitone_loader") {
                    pianoZIndex = 12;
                }

                this.pianoRollKeys.push(new Button(pianoKeyArgs));
                this.ui.addElement(this.pianoRollKeys[i], {zIndex: pianoZIndex});
            }
            
            // AUDIO INIT

            this.message.innerHTML = "Initializing audio...";
            this.audioOk = true;

            this.is_chrome = navigator.userAgent.toLowerCase().indexOf('chrome') > -1;
            
            if (this.is_chrome) {
                this.WAAMS = new WAAMorningStar();
                this.audioManager = this.WAAMS;

                // Display the audio subsystem button
                this.ui.setVisible("subsys", true);
                this.ui.setValue ({elementID: "subsys", value: 1});

                this.request = new XMLHttpRequest();
                this.request.open("GET", "impulse-responses/matrix-reverb1.wav", true);
                this.request.responseType = "arraybuffer";

                var convoOnload = function() {
                    console.log ("convoOnload");
                    this.WAAMS.setConvoBuffer (this.request.response);
                    this.afterAudio();
                }
                
                this.message.innerHTML = "Loading impulse response waveform...";
                this.request.onload = convoOnload.bind(MORNINGSTAR);
                this.request.send();

            }

            else {
                try {
                    this.ADNonDescript = new AudioDataNonDescript();
                    this.ADNonDescript.init({sampleRate: 44100});
                    this.ADNonDescript.setBypass (false);
                    this.audioManager = this.ADNonDescript;
                }
                catch (err) {
                    console.log ("Catched an exception trying to load Mozilla Audio API: ", err, " Audio could be not loaded: ", err.description);
                    this.audioOk = false;
                }

                if (this.audioOk === true) {
                    // Display the audio subsystem button
                    this.ui.setVisible("subsys", true);
                    this.ui.setValue ({elementID: "subsys", value: 0});
                }
                
                this.afterAudio();
            }
        }

        MORNINGSTAR.afterAudio = function () {

            if (this.is_chrome) {
            try {
                    this.WAAMS.init();
                    this.WAAMS.setBypass (false);   
                }
                catch (err) {
                    console.log ("Catched an exception trying to load Web Audio API: ", err, " Audio could be not loaded: ", err.description);
                    this.audioOk = false;
                }
            }

            if (this.audioOk === true) {
                this.ui.setValue({elementID: 'onoff', value: 1});
                this.message.innerHTML = "Audio is OK";
            }
            else {
                this.ui.setValue({elementID:'onoff', value: 0});
                this.message.innerHTML = "Audio not available, starting interface in mute mode";
            }
            
            var temp_parm;

            // DEFAULTS AND PARAMETERS
            
            // THESE FUNCTION PARSE THE QUERY STRING
            this.parseFloatParam = function (param) {
                var tmp;
                if (typeof(this.QueryString[param]) !== 'undefined') {

                    tmp = parseFloat(this.QueryString[param], 10);

                    if (isNaN(tmp) || (tmp < 0) || (tmp > 1)) {
                        console.log ("Invalid parameter ", param, ": ", this.QueryString[param]);
                        return false;
                    }
                    else  return tmp;
                }
                return false;
            }
            
            this.parseNoteParameters = function () {
                var tmp;
                for (var i = 0; i < this.STEPS_NUM; i += 1) {
                    if (typeof(this.QueryString["n"+i]) !== 'undefined') {
                        
                        tmp = parseInt(this.QueryString["n"+i], 10);

                        if (isNaN(tmp) || (tmp < -1) || (tmp >= this.NOTES_NUM)) {
                            console.log ("Invalid note ", i, ": ", this.QueryString["n"+i]);
                        }
                        else  {
                            console.log ("Valid note ", i, ": ", tmp);
                            // Set it in the status
                            this.status.steps[i].note = tmp;
                        }
                    }
                }
            }
            
            this.parseActiveParameters = function () {
                var tmp;
                for (var i = 0; i < this.STEPS_NUM; i += 1) {
                    if (typeof(this.QueryString["a"+i]) !== 'undefined') {
                        
                        tmp = parseInt(this.QueryString["a"+i], 10);

                        if (isNaN(tmp) || ((tmp !== 0) && (tmp !== 1))) {
                            console.log ("Invalid activeness for note ", i, ": ", this.QueryString["a"+i]);
                        }
                        else  {
                            console.log ("Valid activeness for note ", i, ": ", tmp);
                            // Set it in the status
                            this.status.steps[i].active = tmp;
                        }
                    }
                }
            }
            
            this.parseVelocityParameters = function () {
                var tmp;
                for (var i = 0; i < this.STEPS_NUM; i += 1) {
                    if (typeof(this.QueryString["v"+i]) !== 'undefined') {
                        
                        tmp = parseFloat(this.QueryString["v"+i], 10);

                        if (isNaN(tmp) || (tmp < 0) || (tmp > 1)) {
                            console.log ("Invalid velocity for note ", i, ": ", this.QueryString["v"+i]);
                        }
                        else  {
                            console.log ("Valid velocity for note ", i, ": ", tmp);
                            // Set it in the status
                            this.status.steps[i].velocity = tmp;
                        }
                    }
                }
            }

            this.ui.refresh();

            // DO THE PARSING AND CHANGE THE STATUS, IF NEEDED.
            this.parseNoteParameters();
            this.parseActiveParameters();
            this.parseVelocityParameters();

            if ((temp_parm = this.parseFloatParam ('tempo')) !== false) {
                this.status.tempo = temp_parm;
                this.saveStatePartial ("MS.tempo",this.status.tempo);
            }
            this.ui.setValue({elementID: 'Tempo', value: this.status.tempo});


            if ((temp_parm = this.parseFloatParam ('rel')) !== false) {
                this.status.rel = temp_parm;
                this.saveStatePartial ("MS.Release",this.status.rel);
            }
            this.ui.setValue({elementID: 'Release', value: this.status.rel});
            
            if ((temp_parm = this.parseFloatParam ('cut')) !== false) {
                this.status.cut = temp_parm;
                this.saveStatePartial ("MS.Cutoff",this.status.cut);
            }
            this.ui.setValue({elementID: 'Cutoff', value: this.status.cut});

            if ((temp_parm = this.parseFloatParam ('res')) !== false) {
                this.status.res = temp_parm;
                this.saveStatePartial ("MS.Resonance",this.status.res);
            }
            this.ui.setValue({elementID: 'Resonance', value: this.status.res});

            if ((temp_parm = this.parseFloatParam ('vol')) !== false) {
                this.status.vol = temp_parm;
                this.saveStatePartial ("MS.vol",this.status.vol);
            }
            this.ui.setValue({elementID: 'Volume', value: this.status.vol});

            if ((temp_parm = this.parseFloatParam ('env')) !== false) {
                this.status.env = temp_parm;
                this.saveStatePartial ("MS.Envelope",this.status.env);
            }
            this.ui.setValue({elementID: 'Envelope', value: this.status.env});

            if ((temp_parm = this.parseFloatParam ('rev')) !== false) {
                this.status.rev = temp_parm;
                this.saveStatePartial ("MS.rev",this.status.rev);
            }
            this.ui.setValue({elementID: 'Reverb', value: this.status.rev});

            if ((temp_parm = this.parseFloatParam ('dist')) !== false) {
                this.status.dist = temp_parm;
                this.saveStatePartial ("MS.dist",this.status.dist);
            }
            this.ui.setValue({elementID: 'Distortion', value: this.status.dist});

            this.ui.setValue({elementID: 'PlayButton', value: 0});
            this.ui.setValue({elementID: 'RestartButton', value: 1});
            this.ui.setValue({elementID: 'switch', value: this.status.numberOfPatterns - 1});
            this.ui.setValue({elementID: 'greenled_0', value: 1});
            this.ui.setValue({elementID: 'redled_0', value: 1});
            this.ui.setValue({elementID: 'Velocity', value: this.status.steps[0].velocity});
            // Set the initial step (0)
            this.ui.setValue({elementID: '0', value: this.status.steps[0].active});
            // set the initial piano roll
            if (this.status.steps[0].note >= 0) {
                this.ui.setValue({elementID: (this.status.steps[0].note + "_pr"), value: 1, fireCallback: false});
            }
            
            // We still need to display the first pattern, in case we restored
            // the saved state.
            this.switchPattern (0, true);
            
            this.message.innerHTML = "Done.";
            // Add the shadow to the canvas at the end, otherwise it will show
            // up even if the canvas is hidden.
            // http://stackoverflow.com/questions/195951/change-an-elements-css-class-with-javascript
            this.plugin_canvas.className += " shadow";

            this.ui.setValue({elementID: "statusLabel", value: ""});

            this.d_message.parentNode.removeChild(this.d_message);
            
            this.ui.refresh();
        }

        MORNINGSTAR.init = function () {
            /* INIT */
            this.plugin_canvas = document.getElementById("plugin");
            var CWrapper = K2WRAPPER.createWrapper("CANVAS_WRAPPER",
                                                        {canvas: this.plugin_canvas}
                                                        );

            this.ui = new UI (this.plugin_canvas, CWrapper, {breakOnFirstEvent: true});

            var imageResources = [];
            var mulArgs = {multipleImages: [],
                            onComplete: this.afterLoading.bind(MORNINGSTAR)
            }

            // Build the status array.
            // Try to resume saved state.
            if (this.resumeState() === false) {
                // No state? Fall back to default parameters.
                this.restoreDefaultState();
            }
            
            // Get the splash screen
            this.message = document.getElementById("message");
            this.d_message = document.getElementById("div-message");
            this.message.innerHTML = "Loading resources...";

            // Load keys

            // input / output keys
            for (var i = 0; i < this.steps_array.length; i += 1) {
                imageResources = ["Keys/" + this.steps_array[i] + "_inactive.png", "Keys/" + this.steps_array[i] + "_active.png"];
                mulArgs.multipleImages.push ({ID: this.steps_array[i] + "_loader", imageNames : imageResources});
            }
            // play keys
            for (var i = 0; i < this.steps_array.length; i += 1) {
                imageResources = ["Keys/" + this.steps_array[i] + "_playing.png"];
                mulArgs.multipleImages.push ({ID: this.steps_array[i] + "_pl_loader", imageNames : imageResources});
            }

            // Load key highlight
            imageResources = ["Keys/key_highlight.png"];
            mulArgs.multipleImages.push ({ID: "highlight_loader", imageNames : imageResources});


            // Load bypass / play button
            imageResources = ["PlaybackControls/play_inactive.png", "PlaybackControls/play_active.png"];
            mulArgs.multipleImages.push ({ID: "play_loader", imageNames : imageResources});
            imageResources = ["PlaybackControls/stop_inactive.png", "PlaybackControls/stop_active.png"];
            mulArgs.multipleImages.push ({ID: "stop_loader", imageNames : imageResources});
            imageResources = ["PlaybackControls/repeat_inactive.png", "PlaybackControls/repeat_active.png"];
            mulArgs.multipleImages.push ({ID: "restart_loader", imageNames : imageResources});

            // Load piano roll parts
            // Semitone button
            imageResources = ["PianoRoll/semitone_inactive.png", "PianoRoll/semitone_active.png"];
            mulArgs.multipleImages.push ({ID: "semitone_loader", imageNames : imageResources});
            // Tone with two semitones
            imageResources = ["PianoRoll/tone_both_inactive.png", "PianoRoll/tone_both_active.png"];
            mulArgs.multipleImages.push ({ID: "tone_both_loader", imageNames : imageResources});
            // Tone with a left semitone
            imageResources = ["PianoRoll/tone_left_inactive.png", "PianoRoll/tone_left_active.png"];
            mulArgs.multipleImages.push ({ID: "tone_left_loader", imageNames : imageResources});
            // Tone with a right semitone
            imageResources = ["PianoRoll/tone_right_inactive.png", "PianoRoll/tone_right_active.png"];
            mulArgs.multipleImages.push ({ID: "tone_right_loader", imageNames : imageResources});

            // Load instrKnobs rotary part
            mulArgs.multipleImages.push ({ID: "black_knob_loader", imageNames : ["Knobs/Black_small.png"]});
            mulArgs.multipleImages.push ({ID: "white_knob_loader", imageNames : ["Knobs/White_big.png"]});

            // Load switch
            mulArgs.multipleImages.push ({ID: "switch_loader", imageNames : ["Switch/switch_0.png","Switch/switch_1.png","Switch/switch_2.png","Switch/switch_3.png"]});

            // Plus and minus button
            mulArgs.multipleImages.push ({ID: "plus_loader", imageNames : ["PlusMinusButtons/button_plus.png"]});
            mulArgs.multipleImages.push ({ID: "minus_loader", imageNames : ["PlusMinusButtons/button_minus.png"]});

            // Led buttons
            mulArgs.multipleImages.push ({ID: "redled_loader", imageNames : ["Led/LedRed_off.png", "Led/LedRed_on.png"]});
            mulArgs.multipleImages.push ({ID: "greenled_loader", imageNames : ["Led/LedGreen_off.png", "Led/LedGreen_on.png"]});

            // Little buttons
            mulArgs.multipleImages.push ({ID: "littlebutton_loader", imageNames : ["LittleButtons/button_off.png", "LittleButtons/button_on.png"]});

            // Audio on / off
            mulArgs.multipleImages.push ({ID: "onoff_loader", imageNames : ["Audioonoff/off.png", "Audioonoff/on.png"]});
            
            // Audio subsystem tags
            mulArgs.multipleImages.push ({ID: "subsys_loader", imageNames : ["AudioSys/mozAudio.png", "AudioSys/webAudio.png"]});

            // Load bg
            mulArgs.multipleImages.push ({ID: "background_loader", imageNames : ["MS_deck.png"]});
            
            mulArgs.onError =  this.imageError.bind(MORNINGSTAR);
            mulArgs.onSingle = this.imageLoaded.bind(MORNINGSTAR);
            mulArgs.onSingleArray = this.singleLoaded.bind(MORNINGSTAR);

            var mImageLoader = new loadMultipleImages (mulArgs);

        }