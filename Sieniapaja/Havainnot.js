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


//Tietokannan alustus

  useEffect(() => {
    DatabaseHavainnot.init()
      .then(() => {
        console.log('Database set successfully');
        setIsDatabaseInitialized(true);
      })
      .catch(error => {
        console.error('Error setting database: ', error);
      });
  }, []);

//Jo tallennettujen sienipaikka-markerien haku tietokannasta

  const fetchMarkersFromDatabase = () => {
    DatabaseHavainnot.getMarkers()
      .then(markers => {
        setSavedMarkers(markers);
      })
      .catch(error => {
        console.error('Error fetching markers from database: ', error);
      });
  };

  useEffect(() => {
    if (isDatabaseInitialized) {
      fetchMarkersFromDatabase();
    }
  }, [isDatabaseInitialized]);

//Sijaintipalveluiden käytön lupapyyntö

  async function getLocation() {
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('No permission to get location');
      return;
    }

//Kartan aloitussijainnin haku käyttäjän tämänhetkisestä sijainnista

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

//Sijainnin haku kartalta käyttäjän syötteen perusteella

  const showLocation = async () => {
    if (!address) {
      Alert.alert('Set address or coordinates');
      return;
    }

//Koordinaattien alustus

    let lat, lon;
    
//Mikäli syötteessä pilkku,
//sovellus olettaa syötteen olevan koordinaattimuotoinen

    if (address.includes(',')) { 
      const [latitude, longitude] = address.split(',');
      lat = parseFloat(latitude.trim());
      lon = parseFloat(longitude.trim());

//Jos ei pilkkua, sovellus tulkitsee syötteen olevan osoite

//Sovellus käyttää APIa, pyynnön mukana lähtee API-avain ja osoite.
//API palauttaa JSON-dataa, josta sovellus poimii koordinaatit ja sijoittaa
//ne alustettuihin 'lat' ja 'lon' variaabeleihin

    } else { 
      const response = await fetch(`https://geocode.maps.co/search?q=${address}&api_key=${APIKEY}`);
      const data = await response.json();
      if (data && data.length > 0) {
        lat = parseFloat(data[0].lat);
        lon = parseFloat(data[0].lon);
      } else {
        Alert.alert('Error, address not found'); //Virheilmoitus jos osoitetta ei löydy
        return;
      }
    }

//Karttakuva päivittyy syötteen perustella uuteen sijaintiin
    const newRegion = {
      latitude: lat,
      longitude: lon,
      latitudeDelta: 0.0322,
      longitudeDelta: 0.0221,
    };
    setCoords({ latitude: lat, longitude: lon });
    setMapRegion(newRegion);
  };

//Karttaa täpätessä sovellus poimii syötekenttään koordinaatit
  const handleMapPress = (event) => {
    const { coordinate } = event.nativeEvent;
    setCoords(coordinate);
    setAddress(`${coordinate.latitude}, ${coordinate.longitude}`);
  };

//Markerin tallennus: Avaa Modal-popup ikkunan painettaessa 'Save'
//Lähde:  "https://reactnative.dev/docs/modal"

  const saveMarker = () => {
    if (coords) {
      setIsModalVisible(true);
    } else {
      Alert.alert('Select a location on the map');
    }
  };

//Modalissa tekstikenttä jossa voi nimetä Markerin
//Modalissa painike "Save marker", joka käynnistää seuraavan funktion;

  const saveMarkerWithPopup = () => {
    if (coords) {
      console.log('Saving marker:', coords);
      const roundedCoords = {
//Koordinaatit supistetaan kolmen desimaalin tarkkuuteen,
//normaali pyöristys esimerkiksi geokätköilypiireissä
        latitude: parseFloat(coords.latitude.toFixed(3)),
        longitude: parseFloat(coords.longitude.toFixed(3)),
        name: markerName //Markerin nimi
      };
      
//Markerin tallennus tietokantaan
      DatabaseHavainnot.saveMarker(roundedCoords)
        .then(() => {
          console.log('Marker saved successfully:', roundedCoords);
//Sen onnistuttua, päivitetään lisätty tieto myös savedMarkers arrayyn
//lokaalisti

          setSavedMarkers([...savedMarkers, roundedCoords]);
          setMarkerName('');
          setIsModalVisible(false);
          Alert.alert('Marker saved successfully');
        })
        .catch(error => {
//Mikäli jotain menee vikaan, ilmoitus tulee sekä konsoliin että
//sovellusnäkymään
          console.error('Error saving marker: ', error);
          Alert.alert('Failed to save marker');
        });
//Mikäli yritetään tallentaa tyhjää tietoa;
    } else {
      Alert.alert('Select a location on the map');
    }
  };

//Tallennetuissa markereissa 'Look' painike, joka vie kartan
//markerin osoittamaan paikkaan. 'Look' laukaisee seuraavan funktion;

  const showMarkerOnMap = (marker) => {
    const newRegion = {
      latitude: marker.latitude,
      longitude: marker.longitude,
      latitudeDelta: 0.0322,
      longitudeDelta: 0.0221,
    };
    setMapRegion(newRegion);
  };

//Markerin poisto tietokannasta 'Delete'-nappia painettaessa

  const deleteMarker = (id) => {
    DatabaseHavainnot.deleteMarker(id)
      .then(() => {
        console.log('Marker deleted successfully');

//Tämän jälkeen vielä markerin poisto listalta
//Päivitetty markerlista, josta on filter-funktion avulla
//suodatettu haluttu marker pois ID:n perusteella


    const updatedMarkers = savedMarkers.filter(marker => marker.id !== id);
      setSavedMarkers(updatedMarkers);
      })
      .catch(error => {
        console.error('Error deleting marker: ', error);
      });
  };


//Sovellusnäkymä

return (
  <ImageBackground source={require('./images/expobackground.png')} style={styles.background}>
    
    {/*Näppäimistön esiin tuominen vei muut komponentit sovelluksesta
    ylöspäin ja teksti-input katosi kokonaan. Löysin siihen seuraavanlaisen
    KeyboardAvoidingView-metodin StackOverFlowsta, jolla onnistuin estämään
    muiden komponenttien liikkumisen.
    
    app.json-tiedostoon lisätty "android":{"softwareKeyboardLayoutMode": "pan"},"

    Lähde: https://stackoverflow.com/questions/39344140/react-native-how-to-control-what-keyboard-pushes-up */}
    
    <KeyboardAvoidingView style={styles.container} behavior="padding" enabled>
      
   {/*ScrollView mahdollistaa sovelluksen rullaamisen alaspäin, mikäli
   markereita tallennetaan senverran etteivät ne mahdu oletusnäkymään*/}

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

/*Map liikkui nykien ja verkkaisesti eteenpäin, löysin tähän avun;
Lähde: https://stackoverflow.com/questions/53181556/react-native-maps-onregionchange-stutters-the-map */

           onRegionChangeComplete={setMapRegion}
           showsUserLocation={true}
           onPress={handleMapPress}
          >
            {savedMarkers.map((marker, index) => (
              <Marker
                key={index}
                coordinate={marker}
                title={marker.name || 'Unnamed marker'}
              >
                <Callout>
                  <View>
                    <Text>{marker.name || 'Unnamed marker'}</Text>
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
       <Text style={styles.savedMarkersHeader}
       >Saved Markers:
       </Text>
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

{/*Modal-popup ikkuna */}

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


//Tyylit

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
    backgroundColor: '#fff',
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
