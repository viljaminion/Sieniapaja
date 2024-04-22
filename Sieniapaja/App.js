import Ionicons from '@expo/vector-icons/Ionicons';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Etusivu from './Etusivu'
import Havainnot from './Havainnot'
 
const Tab = createBottomTabNavigator();


export default function App() {

  return (
    <NavigationContainer>
    <Tab.Navigator
      screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
          let iconName;
        if (route.name === 'Etusivu') {
          iconName = 'home-sharp';
        } else if (route.name === 'Havainnot') {
          iconName = 'compass';
        }
          return <Ionicons name={iconName} size={size} color={color} />;
          },
          })}>
    <Tab.Screen name="Etusivu" component={Etusivu} />
    <Tab.Screen name="Havainnot" component={Havainnot} />
    </Tab.Navigator>
    </NavigationContainer>
  );
}

