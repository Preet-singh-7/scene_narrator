import { StatusBar } from 'expo-status-bar';
import { useState, useRef, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  TextInput,
  ScrollView,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Speech from 'expo-speech';

// CHANGE THIS to your Mac's local IP address (see README for how to find it)
// Example: 'http://192.168.1.42:3000'
const DEFAULT_SERVER_URL = 'https://humbling-plausibly-jester.ngrok-free.dev';

export default function App() {
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [description, setDescription] = useState('');
  const [serverUrl, setServerUrl] = useState(DEFAULT_SERVER_URL);
  const [showSettings, setShowSettings] = useState(false);
  const [facing, setFacing] = useState('back');

  const speak = useCallback((text) => {
    Speech.stop();
    Speech.speak(text, { rate: 0.95, pitch: 1.0 });
  }, []);

  const captureAndDescribe = useCallback(async () => {
    if (!cameraRef.current || loading) return;
    setLoading(true);
    setDescription('');
    try {
      const photo = await cameraRef.current.takePictureAsync({
        base64: true,
        quality: 0.5,
        skipProcessing: true,
      });

      const response = await fetch(`${serverUrl}/describe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: photo.base64 }),
      });

      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}`);
      }

      const data = await response.json();
      const text = data.description || 'No description received.';
      setDescription(text);
      speak(text);
    } catch (err) {
      const msg = `Could not reach the server. Check the IP address and that the backend is running. (${err.message})`;
      setDescription(msg);
      speak('Sorry, I could not reach the server. Please check the connection.');
    } finally {
      setLoading(false);
    }
  }, [serverUrl, loading, speak]);

  if (!permission) {
    return <View style={styles.container} />;
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.permissionText}>
          This app needs camera access to describe your surroundings.
        </Text>
        <TouchableOpacity style={styles.button} onPress={requestPermission}>
          <Text style={styles.buttonText}>Grant Camera Permission</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />

      {showSettings ? (
        <View style={styles.settingsPanel}>
          <Text style={styles.settingsLabel}>Backend Server URL</Text>
          <TextInput
            style={styles.input}
            value={serverUrl}
            onChangeText={setServerUrl}
            placeholder="http://192.168.1.42:3000"
            placeholderTextColor="#888"
            autoCapitalize="none"
            autoCorrect={false}
          />
          <TouchableOpacity style={styles.button} onPress={() => setShowSettings(false)}>
            <Text style={styles.buttonText}>Save & Close</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <CameraView style={styles.camera} facing={facing} ref={cameraRef}>
            <View style={styles.topBar}>
              <TouchableOpacity
                style={styles.iconButton}
                onPress={() => setShowSettings(true)}
              >
                <Text style={styles.iconButtonText}>⚙</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.iconButton}
                onPress={() => setFacing((f) => (f === 'back' ? 'front' : 'back'))}
              >
                <Text style={styles.iconButtonText}>⟲</Text>
              </TouchableOpacity>
            </View>
          </CameraView>

          <View style={styles.bottomPanel}>
            <ScrollView style={styles.descriptionBox}>
              <Text style={styles.descriptionText}>
                {loading
                  ? 'Looking at the scene...'
                  : description || 'Tap the button to describe what the camera sees.'}
              </Text>
            </ScrollView>

            <TouchableOpacity
              style={[styles.captureButton, loading && styles.captureButtonDisabled]}
              onPress={captureAndDescribe}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.captureButtonText}>Describe Scene</Text>
              )}
            </TouchableOpacity>

            {description && !loading ? (
              <TouchableOpacity
                style={styles.repeatButton}
                onPress={() => speak(description)}
              >
                <Text style={styles.repeatButtonText}>🔊 Repeat Aloud</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  permissionText: {
    color: '#fff',
    textAlign: 'center',
    margin: 24,
    fontSize: 16,
  },
  camera: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  iconButton: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconButtonText: {
    color: '#fff',
    fontSize: 20,
  },
  bottomPanel: {
    backgroundColor: '#111',
    padding: 16,
    paddingBottom: 28,
  },
  descriptionBox: {
    maxHeight: 100,
    marginBottom: 14,
  },
  descriptionText: {
    color: '#eee',
    fontSize: 16,
    lineHeight: 22,
  },
  captureButton: {
    backgroundColor: '#2e7dff',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  captureButtonDisabled: {
    backgroundColor: '#1a4a99',
  },
  captureButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
  },
  repeatButton: {
    marginTop: 10,
    alignItems: 'center',
    paddingVertical: 8,
  },
  repeatButtonText: {
    color: '#aaa',
    fontSize: 14,
  },
  settingsPanel: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  settingsLabel: {
    color: '#fff',
    fontSize: 15,
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#222',
    color: '#fff',
    padding: 14,
    borderRadius: 10,
    fontSize: 15,
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#2e7dff',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
