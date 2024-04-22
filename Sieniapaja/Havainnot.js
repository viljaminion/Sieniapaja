import React, { useEffect, useState } from 'react';
import {ImageBackground, Text, Alert, Button, StyleSheet, TextInput, View, Modal, ScrollView, KeyboardAvoidingView } from 'react-native';
import MapView, { Marker, Callout } from 'react-native-maps';
import * as Location from 'expo-location';
import { APIKEY } from './salaisuuksia';
import DatabaseHavainnot from './DatabaseHavainnot';

export default function App() {
  const [address, setAddress] = useState('');
  const [coords, setCoords] = useState(null);
  const [mapRegion, setMapRegion] = useState(null);
  const [location, setLocation] = useState(null);
  const [savedMarkers, setSavedMarkers] = useState([]);
  const [markerName, setMarkerName] = useState('');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isDatabaseInitialized, setIsDatabaseInitialized] = useState(false);

  useEffect(() => {
    DatabaseHavainnot.init()
      .then(() => {
        console.log('Database initialized successfully');
        setIsDatabaseInitialized(true);
      })
      .catch(error => {
        console.error('Error initializing database: ', error);
      });
  }, []);

  useEffect(() => {
    if (isDatabaseInitialized) {
      fetchMarkersFromDatabase();
    }
  }, [isDatabaseInitialized]);

  const fetchMarkersFromDatabase = () => {
    DatabaseHavainnot.getMarkers()
      .then(markers => {
        setSavedMarkers(markers);
      })
      .catch(error => {
        console.error('Error fetching markers from database: ', error);
      });
  };

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
    if (coords) {
      console.log('Saving marker:', coords);
      const roundedCoords = {
        latitude: parseFloat(coords.latitude.toFixed(3)),
        longitude: parseFloat(coords.longitude.toFixed(3)),
        name: markerName
      };
      
      // Save marker to the database
      DatabaseHavainnot.saveMarker(roundedCoords)
        .then(() => {
          // If marker is saved successfully, update the savedMarkers state
          console.log('Marker saved successfully:', roundedCoords);
          setSavedMarkers([...savedMarkers, roundedCoords]);
          setMarkerName('');
          setIsModalVisible(false);
          Alert.alert('Marker saved successfully');
        })
        .catch(error => {
          // Handle error if marker couldn't be saved
          console.error('Error saving marker: ', error);
          Alert.alert('Failed to save marker');
        });
    } else {
      Alert.alert('Select a location on the map');
    }
  };

  const showMarkerOnMap = (marker) => {
    // Set the map region to the coordinates of the marker
    const newRegion = {
      latitude: marker.latitude,
      longitude: marker.longitude,
      latitudeDelta: 0.0322,
      longitudeDelta: 0.0221,
    };
    setMapRegion(newRegion);
  };

  const deleteMarker = (id) => {
    // Remove marker from the list
    const updatedMarkers = savedMarkers.filter(marker => marker.id !== id);
    setSavedMarkers(updatedMarkers);
    
    // Remove marker from the database
    DatabaseHavainnot.deleteMarker(id)
      .then(() => {
        console.log('Marker deleted successfully');
      })
      .catch(error => {
        console.error('Error deleting marker: ', error);
      });
  };

return (
  <ImageBackground source={require('./images/expobackground.png')} style={styles.background}>
    <KeyboardAvoidingView style={styles.container} behavior="padding" enabled>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <TextInput
          style={styles.input}
          placeholder="Address or coordinates (latitude, longitude)"
          value={address}
          onChangeText={setAddress}
        />
    <View style={styles.buttonContainer}>
        <Button title="Show" onPress={showLocation} />
        <Button title="Save" onPress={saveMarker} />
    </View>
      {mapRegion && (
         <MapView
           style={styles.map}
           initialRegion={mapRegion}
           region={mapRegion}
           onRegionChangeComplete={setMapRegion}
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
    <View key={index} style={styles.savedMarkerContainer}>
        <Text style={styles.savedMarkerText}>
          {`${index + 1}: ${marker.name || 'Unnamed'} - Lat ${marker.latitude}, Lon ${marker.longitude}`}
        </Text>
    <View style={styles.markerButtons}>
          <Button title="Look" onPress={() => showMarkerOnMap(marker)} />
          <Button title="Delete" onPress={() => deleteMarker(marker.id)} />
    </View>
    </View>
    ))}
  </View>

        <Modal
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
      </ScrollView>
    </KeyboardAvoidingView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    resizeMode: 'cover',
    justifyContent: 'center',
  },
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  input: {
    width: '80%',
    marginBottom: 10,
    padding: 10,
    borderWidth: 5,
    borderColor: '#ccc',
    borderRadius: 5,
    backgroundColor: '#fff', // Set background color to white
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '80%',
    marginBottom: 10,
  },
  map: {
    width: '90%',
    height: 300,
    marginTop: 20,
    borderWidth: 2,
    borderColor: '#ccc',
    borderRadius: 5,
  },
  savedMarkersContainer: {
    marginTop: 20,
    borderColor: '#ccc',
    borderWidth: 5,
    borderRadius: 5,
    backgroundColor: '#fff'
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
  markerButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '80%',
    marginBottom: 5,
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
