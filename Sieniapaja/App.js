import Ionicons from '@expo/vector-icons/Ionicons';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Etusivu from './Etusivu'
import Havainnot from './Havainnot'
import Sieniloki from './Sieniloki'
 

//Navigointi tehty Tab-navigaatiolla alapalkkiin.

const Tab = createBottomTabNavigator();


export default function App() {
  
//Ionicons-kirjastoa käytetty koristelemaan eri osioiden painikkeita
  return (
    <NavigationContainer>
    <Tab.Navigator
      screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
          let iconName;
        if (route.name === 'Home page') {
          iconName = 'home-sharp';
        } else if (route.name === 'Sightings') {
          iconName = 'compass';
        }
          else if (route.name === 'Collection Log') {
            iconName = 'book';
        }
          return <Ionicons name={iconName} size={size} color={color} />;
          },
          })}>
    <Tab.Screen name="Home page" component={Etusivu} />
    <Tab.Screen name="Sightings" component={Havainnot} />
    <Tab.Screen name="Collection Log" component={Sieniloki} />
    </Tab.Navigator>
    </NavigationContainer>
  );
}

