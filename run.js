/**
 * Copyright 2017 IBM Corp. All Rights Reserved.
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

const watson = require('watson-developer-cloud');
const TextToSpeechV1 = require('watson-developer-cloud/text-to-speech/v1');
const FS = require('fs');
const MIC = require('mic');
const PLAYER = require('play-sound')(opts = {});
const PROBE = require('node-ffprobe');
const REQUEST = require('request-promise');
const PROMISE = require('promise');
var context = {};
var debug = false;
var botIsActive = false;
var startTime = new Date();
var secsToSleep = 60 * 1000;

/**
 * Create Watson Services.
 */
const conversation = new watson.AssistantV1({
  version: '2018-02-16'
});

const speech_to_text = new watson.SpeechToTextV1({
});

const text_to_speech = new TextToSpeechV1({
});

/**
 * Create and configure the microphone.
 */
const MIC_PARAMS = {
  rate: 44100,
  channels: 2,
  debug: false,
  exitOnSilence: 6
};
const MIC_INSTANCE = MIC(MIC_PARAMS);
const MIC_INPUT_STREAM = MIC_INSTANCE.getAudioStream();

let pauseDuration = 0;
MIC_INPUT_STREAM.on('pauseComplete', ()=> {
  console.log('Microphone paused for', pauseDuration, 'seconds.');
  // Stop listening when speaker is talking.
  setTimeout(function() {
      MIC_INSTANCE.resume();
      console.log('Microphone resumed.');
  }, Math.round(pauseDuration * 1000));
});

/**
 * Convert speech to text.
 */
const textStream = MIC_INPUT_STREAM.pipe(
  speech_to_text.recognizeUsingWebSocket({
    'content_type': 'audio/l16; rate=44100; channels=2',
    interim_results: true,
    inactivity_timeout: -1
  })).setEncoding('utf8');


/**
 * Convert text to speech.
 */
const speakResponse = (text) => {
  
  var params = {
    text: text,
    accept: 'audio/wav',
    voice: 'en-US_AllisonVoice'
  };

  console.log('text: ' + text);
  
  // Pipe the synthesized text to a file.
  text_to_speech.synthesize(params, function(error, audio) {
    if (error) {
      console.log('synthesize error: ' + error);
    } else {
      var writeStream = FS.createWriteStream('output.wav');
      writeStream.on('finish', function() {
        // determine how long message is and then pause mic for that long
        PROBE('output.wav', function(err, probeData) {
          if (probeData) {
            pauseDuration = probeData.format.duration;
            MIC_INSTANCE.pause();
            // play message to user
            PLAYER.play('output.wav');
          }
        });
      });  
      writeStream.on('error', function(err) {
        console.log('Text-to-speech streaming error: ' + err);
      });
      writeStream.write(audio);
      writeStream.end();
    }
  });
};

/**
 * Log Watson Conversation context values..
 *
 * @param {String} header
 *   First line of log message.
 */
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

/**
 * Send significant responses from Watson to the console.
 */
function watsonSays(response) {
  if (typeof(response) !== 'undefined') {
    console.log('Watson says:', response);
  }
}

/**
 * Determine if we are ready to talk, or need a wake up command
 */
function isActive(text) {
  var elapsedTime = new Date() - startTime;
  
  if (elapsedTime > secsToSleep) {
    startTime = new Date();
    botIsActive = false;
  }

  if (botIsActive) {
    startTime = new Date();
    return true;
  } else {
    if (text.toLowerCase().indexOf('hello') > -1) {
      botIsActive = true;
    } else {
      console.log("TJBot needs the wake up command");
    }
    return botIsActive;
  }
}

/**
 * Watson conversation with user.
 */
function theConversation() {
  console.log('TJBot is listening, you may speak now.');
  //speakResponse('TJ Bot is alive');

  textStream.on('data', (user_speech_text) => {
    userSpeechText = user_speech_text.toLowerCase();
    console.log('\n\nWatson hears: ', user_speech_text);
    printContext('before call 1:');
    if (isActive(user_speech_text)) {
      conversation.message({
        workspace_id: process.env.CONVERSATION_WORKSPACE_ID,
        input: {'text': user_speech_text},
        context: context
      }, (err, response) => {
        context = response.context;
        printContext('after call 1:');

        watson_response =  response.output.text[0];
        if (watson_response) {
          speakResponse(watson_response);
        }
        watsonSays(watson_response);
      });
    }
  });
}

/**
 * Start the conversation once all MLB data is loaded.
 */
function startConversation() {
    // Initialize microphone
    MIC_INSTANCE.start();

    // Begin watson conversation.
    theConversation();
}

startConversation();
