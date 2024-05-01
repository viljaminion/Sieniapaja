import * as SQLite from 'expo-sqlite';

const db = SQLite.openDatabase('markers.db');

const DatabaseHavainnot = {
  init() {
    return new Promise((resolve, reject) => {
      db.transaction(tx => {
        tx.executeSql(
          'CREATE TABLE IF NOT EXISTS markers (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, latitude REAL, longitude REAL)',
          [],
          (_, result) => {
            console.log('Result:', result);
            resolve();
          },
          (_, error) => {
            console.error('Error making database: ', error);
            reject(error);
          }
        );
      });
    });
  },

  saveMarker(marker) {
    return new Promise((resolve, reject) => {
      db.transaction(tx => {
        tx.executeSql(
          'INSERT INTO markers (name, latitude, longitude) VALUES (?, ?, ?)',
          [marker.name, marker.latitude, marker.longitude],
          (_, result) => {
            resolve(result);
          },
          (_, error) => {
            console.error('Error saving marker: ', error);
            reject(error);
          }
        );
      });
    });
  },

  getMarkers() {
    return new Promise((resolve, reject) => {
      db.transaction(tx => {
        tx.executeSql(
          'SELECT * FROM markers',
          [],
          (_, { rows }) => {
            const markers = [];
            for (let i = 0; i < rows.length; i++) {
              markers.push(rows.item(i));
            }
            resolve(markers);
          },
          (_, error) => {
            console.error('Error fetching markers: ', error);
            reject(error);
          }
        );
      });
    });
  },

  deleteMarker(id) {
    return new Promise((resolve, reject) => {
      db.transaction(tx => {
        tx.executeSql(
          'DELETE FROM markers WHERE id = ?',
          [id],
          (_, result) => {
            resolve(result);
          },
          (_, error) => {
            console.error('Error deleting marker: ', error);
            reject(error);
          }
        );
      });
    });
  },
};

export default DatabaseHavainnot;
