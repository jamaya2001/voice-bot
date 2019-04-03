# Build a chatbot with voice activation

## Included components

* [Watson Assistant](https://www.ibm.com/watson/developercloud/conversation.html): Build, test and deploy a bot or virtual agent across mobile devices, messaging platforms, or even on a physical robot.
* [Watson Text to Speech](https://www.ibm.com/watson/developercloud/text-to-speech.html): Converts written text into natural sounding audio in a variety of languages and voices.
* [Watson Speech to Text](https://www.ibm.com/watson/developercloud/speech-to-text.html): A service that converts human voice into written text.

## Featured technologies

* [Node.js](https://nodejs.org/en/): An asynchronous event driven JavaScript runtime, designed to build scalable applications.

# Steps

1. [Clone the repo](#1-clone-the-repo)
1. [Create IBM Cloud services](#2-create-ibm-cloud-services)
1. [Configure Watson Assistant](#3-configure-watson-conversation)
1. [Enable Watson Speech to Text](#4-enable-watson-speech-to-text)
1. [Enable Watson Text to Speech](#5-enable-watson-text-to-speech)
1. [Run the application](#6-run-the-application)

## 1. Clone the repo

## 2. Create IBM Cloud services

Create the following services:

  * [**Watson Assistant**](https://console.ng.bluemix.net/catalog/services/conversation)
  * [**Watson Text to Speech**](https://console.ng.bluemix.net/catalog/services/text-to-speech/)
  * [**Watson Speech to Text**](https://console.ng.bluemix.net/catalog/services/speech-to-text/)

## 3. Configure Watson Assistant

Launch the **Watson Assistant** tool and create a skill using the default conversation.

## 4. Enable Watson Speech to Text

Select the **Watson Speech to Text** service. Select the **Service credentials** menu item.

![](doc/source/images/speech_to_text_ids.png)

Click **View Credentials** and save the **username** and **password** values.

## 5. Enable Watson Text to Speech

Select the **Watson Text to Speech** service. Select the **Service credentials** menu item.

![](doc/source/images/text_to_speech_ids.png)

Click **View Credentials** and save the **username** and **password** values.

## 6. Run the application

First, copy the [`env.sample`](env.sample) file to `.env` and then update the file with the credentials created in the previous steps:

```
cp env.sample .env
```

> Note: Depending on the region that you provision your Watson Services, you will either be given a user/password or IAM apikey values for your credentials. The .env file will accomodate both. Just remember to comment out or remove all of the key-value pair entry lines that you do not use.

Second, install dependencies by running the following command from the cloned repo location:

```
npm install
```

> **NOTE:** you may need to install other dependencies, refer to the [Troubleshooting](troubleshooting) section below.

Lastly, run the application:

```
npm start
```

Wake up the chatbot by saying "hello".

# Troubleshooting

### Help! My app is crashing

You may need to install a few audio related dependencies if you're seeing the following error:

```
events.js:163
  throw er; // Unhandled 'error' event
```

#### On OSX

Use `brew` to install:

* mplayer
* sox
* ffmpeg

```
brew install sox mplayer ffmpeg
```

And use NPM to install:

* node-ffprobe

```
npm install node-ffprobe
```

#### On Ubuntu

Use `apt-get` to install:

* ffmpeg

```
sudo apt-get install ffmpeg
```

And use NPM to install:

* node-ffprobe

```
npm install node-ffprobe
```

### When running on Mac OSX, microphone is not picking up any sound

Ensure that the basic microphone functionality is working:

```
sox -d test.wav        // speak into mic, then ctrl-c to exit
sox test.wav -d        // playback
```

# License

[Apache 2.0](LICENSE)
