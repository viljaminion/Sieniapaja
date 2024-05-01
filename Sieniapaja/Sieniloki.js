import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, Button, Image, FlatList, Modal, TextInput, ScrollView } from 'react-native';
import { Camera } from 'expo-camera';
import * as MediaLibrary from 'expo-media-library';
import * as ImagePicker from 'expo-image-picker';
import placeholderPhoto from './images/CollectionLog.png';



export default function App() {
  const [hasPermission, setHasPermission] = useState(null);
  const [imageUris, setImageUris] = useState([]);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isNamingModalVisible, setIsNamingModalVisible] = useState(false);
  const [isConfirmationModalVisible, setIsConfirmationModalVisible] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [photoUri, setPhotoUri] = useState('');
  const [photoName, setPhotoName] = useState('');
  const cameraRef = useRef(null);


  const askForCameraPermission = async () => {
    const { status } = await Camera.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      console.log('Camera permission denied');
      return;
    }

    const mediaLibraryStatus = await MediaLibrary.requestPermissionsAsync();
    if (mediaLibraryStatus.status !== 'granted') {
      console.log('Media library permission denied');
      return;
    }

    setHasPermission(true);
  };

  const requestMediaLibraryPermissions = async () => {
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status === 'granted') {
        console.log('Media library permissions granted');
        // Proceed with deleting assets or other operations
      } else {
        console.log('Media library permissions denied');
        // Handle case where permissions are not granted
      }
    } catch (error) {
      console.error('Error requesting media library permissions:', error);
      // Handle any errors that occur during permission request
    }
  };

  const takePicture = async () => {
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync();
        setPhotoUri(photo.uri);
        setIsNamingModalVisible(true);
      } catch (error) {
        console.error('Could not take picture', error);
      }
    }
  };

  const pickImageFromGallery = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync();
      console.log('ImagePicker Result:', result);
      const { cancelled, uri } = result.assets[0]; // Directly access URI from the assets array
      console.log('Image URI:', uri);
      if (!cancelled && uri) {
        // Image selected successfully
        setPhotoUri(uri);
        setIsNamingModalVisible(true);
      } else {
        // Image selection cancelled or URI is undefined
        console.log('Image selection cancelled or URI undefined');
      }
    } catch (error) {
      console.error('Error picking image from gallery:', error);
    }
  };
  
  const savePhoto = async () => {
    console.log('Photo URI:', photoUri);
    console.log('Photo Name:', photoName);
  
    if (!photoUri || !photoName || photoUri.trim() === '' || photoName.trim() === '') {
      console.error('Photo URI or Name is invalid');
      return;
    }
    try {
      const asset = await MediaLibrary.createAssetAsync(photoUri);
      if (!asset) {
        console.error('Error creating asset:', photoUri);
        return;
      }
      setImageUris(prevImageUris => [...prevImageUris, { id: asset.id, uri: photoUri, name: photoName }]);
    } catch (error) {
      console.error('Error saving photo:', error);
    }
    setIsNamingModalVisible(false);
    setPhotoUri('');
    setPhotoName('');
  };
  

  const handleDelete = (item) => {
    setSelectedPhoto(item);
    setIsNamingModalVisible(false);
    setIsConfirmationModalVisible(true);
  };

  const deletePhoto = async () => {
    if (!selectedPhoto || !selectedPhoto.id) {
      console.error('Invalid photo data:', selectedPhoto);
      setIsConfirmationModalVisible(false);
      return;
    }
    const { id } = selectedPhoto;
    try {
      await MediaLibrary.deleteAssetsAsync([id]);
      setImageUris(imageUris.filter((item) => item.id !== id));
    } catch (error) {
      console.error('Error deleting photo:', error);
    }
    setIsConfirmationModalVisible(false); // Close the confirmation modal after deletion
  };

  const closeCamera = () => {
    setIsCameraOpen(false);
  };



  useEffect(() => {
    askForCameraPermission();
    requestMediaLibraryPermissions(); // Request media library permissions when the app starts
  }, []);

  if (hasPermission === null) {
    return <View />;
  }

  if (!hasPermission) {
    return <Text>No access to camera and media library</Text>;
  }

  return (
    
    <View style={styles.container}>
      <View style={styles.cameraContainer}>
        <Image source={placeholderPhoto} style={styles.placeholderPhoto} />
        {isCameraOpen && (
          <Camera
            style={styles.cameraPreview}
            type={Camera.Constants.Type.back}
            ref={cameraRef}
          />
        )}
        {isCameraOpen && ( // Render buttons only when camera is open
          <View style={styles.buttonContainer}>
            <Button
              title="Take Picture"
              onPress={takePicture}
            />
            <Button
              title="Close Camera"
              onPress={closeCamera}
            />
          </View>
        )}
        {!isCameraOpen && (
          <View style={styles.buttonContainer}>
            <Button
              title="Open Camera"
              onPress={() => setIsCameraOpen(true)}
            />
            <Button
              title="Choose from Gallery"
              onPress={pickImageFromGallery}
            />
          </View>
        )}
      </View>
      <FlatList
        style={styles.flatList}
        contentContainerStyle={styles.flatListContent}
        data={imageUris}
        numColumns={2}
        keyExtractor={(item, index) => index.toString()}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Image source={{ uri: item.uri }} style={styles.cardImage} />
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>{item.name}</Text>
              <Button title="Delete" onPress={() => handleDelete(item)} />
            </View>
          </View>
        )}
      />
      <Modal
        animationType="slide"
        transparent={true}
        visible={isNamingModalVisible}
        onRequestClose={() => setIsNamingModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <TextInput
              placeholder="Enter photo name"
              value={photoName}
              onChangeText={setPhotoName}
              style={styles.input}
            />
            <Button
              title="Save Photo"
              onPress={savePhoto}
            />
          </View>
        </View>
      </Modal>
      <Modal
        animationType="slide"
        transparent={true}
        visible={isConfirmationModalVisible}
        onRequestClose={() => setIsConfirmationModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text>Are you sure you want to delete this photo?</Text>
            <Button title="Yes, delete" onPress={deletePhoto} />
            <Button title="No" onPress={() => setIsConfirmationModalVisible(false)} />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5FCFF',
  },
  cameraContainer: {
    flex: 1,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    position: 'relative',
    justifyContent: 'flex-end'
  },
  flatList: {
    flex: 1,
  },
  flatListContent: {
    paddingTop: 10, // Adjust as needed
  },
  placeholderPhoto: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    justifyContent: 'center',
  },
  cameraPreview: {
    flex: 1,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    height: 50,
    marginVertical: 10,
  },
  bottomButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    height: 50,
    marginVertical: 10,
    marginLeft: 20
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    elevation: 3,
    shadowColor: '#000000',
    shadowOffset: { width: 1, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    marginHorizontal: 4,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    width: '45%',
  },
  cardImage: {
    width: '40%',
    height: 100,
    borderRadius: 5,
  },
  cardContent: {
    flex: 1,
    marginLeft: 10,
  },
  cardTitle: {
    fontSize: 16,
    flex: 1,
  },
  deleteButton: {
    marginLeft: 'auto',
    marginVertical: 10,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
  },
  input: {
    marginBottom: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
  },
});


