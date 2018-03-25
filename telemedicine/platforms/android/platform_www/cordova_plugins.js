cordova.define('cordova/plugin_list', function(require, exports, module) {
module.exports = [
  {
    "id": "es6-promise-plugin.Promise",
    "file": "plugins/es6-promise-plugin/www/promise.js",
    "pluginId": "es6-promise-plugin",
    "runs": true
  },
  {
    "id": "phonegap-plugin-media-stream.MediaDevices",
    "file": "plugins/phonegap-plugin-media-stream/www/android/MediaDevices.js",
    "pluginId": "phonegap-plugin-media-stream",
    "clobbers": [
      "navigator.mediaDevices"
    ]
  }
];
module.exports.metadata = 
// TOP OF METADATA
{
  "cordova-plugin-whitelist": "1.3.3",
  "es6-promise-plugin": "4.2.2",
  "phonegap-plugin-media-stream": "1.2.1"
};
// BOTTOM OF METADATA
});