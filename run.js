/**
 * Copyright 2019 IBM Corp. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the 'License'); you may not
 * use this file except in compliance with the License. You may obtain a copy of
 * the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an 'AS IS' BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations under
 * the License.
 */

 /* jshint esversion: 6 */

require('dotenv').config({ silent: true });

const AssistantV1 = require('ibm-watson/assistant/v1');
const TextToSpeechV1 = require('ibm-watson/text-to-speech/v1');
const SpeechToTextV1 = require('ibm-watson/speech-to-text/v1');
const fs = require('fs');
const mic = require('mic');
const speaker = require('play-sound')(opts = {});
const ffprobe = require('node-ffprobe');
var context = {};
var debug = false;
var botIsActive = false;
var startTime = new Date();

const wakeWord = "hey watson";      // if asleep, phrases that will wake us up

const SLEEP_TIME = 10 * 1000;       // number of secs to wait before falling asleep

/**
 * Configuration and setup
 */

/* Create Watson Services. */
const conversation = new AssistantV1({
  version: '2019-02-28'
});

const speechToText = new SpeechToTextV1({
});

const textToSpeech = new TextToSpeechV1({
});

/* Create and configure the microphone */
const micParams = {
  rate: 44100,
  channels: 2,
  debug: false,
  exitOnSilence: 6
};
const microphone = mic(micParams);
const micInputStream = microphone.getAudioStream();

let pauseDuration = 0;
micInputStream.on('pauseComplete', ()=> {
  console.log('Microphone paused for', pauseDuration, 'seconds.');
  // Stop listening when Watson is talking.
  setTimeout(function() {
    microphone.resume();
      console.log('Microphone resumed.');
  }, Math.round(pauseDuration * 1000));
});

/**
 * Functions and main app
 */

/* Convert speech to text. */
const textStream = micInputStream.pipe(
  speechToText.recognizeUsingWebSocket({
    content_type: 'audio/l16; rate=44100; channels=2',
    interim_results: true,
    inactivity_timeout: -1
  })).setEncoding('utf8');

/* Convert text to speech. */
const speakResponse = (text) => {
  var params = {
    text: text,
    accept: 'audio/wav',
    voice: 'en-US_AllisonVoice'
    // en-US_AllisonVoice
    // en-US_LisaVoice
    // en-US_MichaelVoice
  };

  var writeStream = fs.createWriteStream('output.wav');
  textToSpeech.synthesize(params)
  .then(audio => {
    // write the audio version of the text to the wav file
    audio.pipe(writeStream);
  })
  .catch(err => {
    console.log('error:', err);
  });

  writeStream.on('finish', function() {
    // determine length of response to user
    ffprobe('output.wav', function(err, probeData) {
      if (probeData) {
        pauseDuration = probeData.format.duration;
        // pause microphone until response is delivered to user
        microphone.pause();
        // play message to user
        speaker.play('output.wav');
        // restart timer
        startTime = new Date();
      }
    });
  });  
  writeStream.on('error', function(err) {
    console.log('Text-to-speech streaming error: ' + err);
  });
};

/* Log Watson Assistant context values, so we can follow along with its logic. */
function printContext(header) {
  if (debug) {
    console.log(header);

    if (context.system) {
      if (context.system.dialog_stack) {
        const util = require('util');  
        console.log("     dialog_stack: ['" +
                    util.inspect(context.system.dialog_stack, false, null) + "']");
      }
    }
  }
}

/* Log significant responses from Watson to the console. */
function watsonSays(response) {
  if (typeof(response) !== 'undefined') {
    console.log('Watson says:', response);
  }
}

/* Determine if we are ready to talk, or need a wake up command */
function isActive(text) {
  var elapsedTime = new Date() - startTime;
  
  if (elapsedTime > SLEEP_TIME) {
    // go to sleep
    startTime = new Date();
    botIsActive = false;
  }

  if (botIsActive) {
    // in active conversation, so stay awake
    startTime = new Date();
    return true;
  } else {
    // we are asleep - did we get a wake up call?
    if (text.toLowerCase().indexOf(wakeWord) > -1) {
      // time to wake up
      console.log("App just woke up");
      botIsActive = true;
    } else {
      // false alarm, go back to sleep
      console.log("App needs the wake up command");
    }
    return botIsActive;
  }
}

/* Keep conversation with user alive until it breaks */
function performConversation() {
  console.log('App is listening, you may speak now.');

  textStream.on('data', (user_speech_text) => {
    userSpeechText = user_speech_text.toLowerCase();
    console.log('\n\nApp hears: ', user_speech_text);
    if (isActive(user_speech_text)) {
      conversation.message({
        workspace_id: process.env.ASSISTANT_WORKSPACE_ID,
        input: {'text': user_speech_text},
        context: context
      }, (err, response) => {
        context = response.context;

        watson_response =  response.output.text[0];
        if (watson_response) {
          speakResponse(watson_response);
        }
        watsonSays(watson_response);
      });
    }
  });
}

/* Start the app */
microphone.start();
performConversation();
