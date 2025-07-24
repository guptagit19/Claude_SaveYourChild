/**
 * @format
 */

import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';
//import LockScreenOverlay from './src/components/LockScreenOverlay';

AppRegistry.registerComponent(appName, () => App);
// ✅ Register overlay component separately
//AppRegistry.registerComponent('LockScreenOverlay', () => LockScreenOverlay);
//AppRegistry.registerHeadlessTask('OverlayTask', () => require('./overlayTask'));