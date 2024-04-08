import React, { useEffect, useState } from 'react';
import { Text, Alert, Button, StyleSheet, TextInput, View, Modal } from 'react-native';
import MapView, { Marker, Callout } from 'react-native-maps';
import * as Location from 'expo-location';
import { APIKEY } from './salaisuuksia';

export default function App() {
  const [address, setAddress] = useState('');
  const [coords, setCoords] = useState(null);
  const [mapRegion, setMapRegion] = useState(null);
  const [location, setLocation] = useState(null);
  const [savedMarkers, setSavedMarkers] = useState([]);
  const [markerName, setMarkerName] = useState('');
  const [isModalVisible, setIsModalVisible] = useState(false);

  async function getLocation() {
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('No permission to get location');
      return;
    }

    let location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
    setLocation(location);
    console.log('Location:', location);
    const { latitude, longitude } = location.coords;
    const newRegion = {
      latitude,
      longitude,
      latitudeDelta: 0.0322,
      longitudeDelta: 0.0221,
    };
    setMapRegion(newRegion);
  }

  useEffect(() => {
    getLocation();
  }, []);

  const showLocation = async () => {
    if (!address) {
      Alert.alert('Set address or coordinates');
      return;
    }

    let lat, lon;
    if (address.includes(',')) {
      const [latitude, longitude] = address.split(',');
      lat = parseFloat(latitude.trim());
      lon = parseFloat(longitude.trim());
    } else {
      const response = await fetch(`https://geocode.maps.co/search?q=${address}&api_key=${APIKEY}`);
      const data = await response.json();
      if (data && data.length > 0) {
        lat = parseFloat(data[0].lat);
        lon = parseFloat(data[0].lon);
      } else {
        Alert.alert('Error, address not found');
        return;
      }
    }

    const newRegion = {
      latitude: lat,
      longitude: lon,
      latitudeDelta: 0.0322,
      longitudeDelta: 0.0221,
    };
    setCoords({ latitude: lat, longitude: lon });
    setMapRegion(newRegion);
  };

  const handleMapPress = (event) => {
    const { coordinate } = event.nativeEvent;
    setCoords(coordinate);
    setAddress(`${coordinate.latitude}, ${coordinate.longitude}`);
  };

  const saveMarker = () => {
    if (coords) {
      setIsModalVisible(true);
    } else {
      Alert.alert('Select a location on the map');
    }
  };

  const saveMarkerWithPopup = () => {
    const roundedCoords = {
      latitude: parseFloat(coords.latitude.toFixed(3)),
      longitude: parseFloat(coords.longitude.toFixed(3)),
      name: markerName
    };
    
    setSavedMarkers([...savedMarkers, roundedCoords]);
    setMarkerName(''); 
    setIsModalVisible(false);
    Alert.alert('Marker saved successfully');
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder="Address or coordinates (latitude, longitude)"
        value={address}
        onChangeText={setAddress}
      />
      <Button title="Show" onPress={showLocation} />
      <Button title="Save" onPress={saveMarker} />
      {mapRegion && (
        <MapView
        style={styles.map}
        initialRegion={mapRegion}
        region={mapRegion}
        onRegionChange={setMapRegion}
        showsUserLocation={true}
        onPress={handleMapPress}
      >
        {savedMarkers.map((marker, index) => (
          <Marker
            key={index}
            coordinate={marker}
            title={marker.name || 'Unknown marker'}
          >
            <Callout>
              <View>
                <Text>{marker.name || 'Unknown marker'}</Text>
              </View>
            </Callout>
          </Marker>
        ))}
        {coords && (
          <Marker
            coordinate={coords}
            title="Selected Location"
          />
        )}
      </MapView>
      )}

      <View style={styles.savedMarkersContainer}>
        <Text style={styles.savedMarkersHeader}>Saved Markers:</Text>
        {savedMarkers.map((marker, index) => (
          <Text key={index} style={styles.savedMarker}>
            {`Marker ${index + 1}: ${marker.name || 'Unnamed'} - Latitude ${marker.latitude}, Longitude ${marker.longitude}`}
          </Text>
        ))}
      </View>

      <Modal // Lähde : https://reactnative.dev/docs/modal
        visible={isModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <TextInput
            style={styles.modalInput}
            placeholder="Enter marker name"
            value={markerName}
            onChangeText={setMarkerName}
          />
          <Button title="Save Marker" onPress={saveMarkerWithPopup} />
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    width: '80%',
    marginBottom: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
  },
  map: {
    width: '100%',
    height: 300,
    marginTop: 20,
  },
  savedMarkersContainer: {
    marginTop: 20,
  },
  savedMarkersHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  savedMarker: {
    fontSize: 16,
    marginBottom: 3,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalInput: {
    width: '80%',
    marginBottom: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    backgroundColor: '#fff',
  },
});
