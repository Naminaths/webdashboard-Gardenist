# Firebase Realtime Database Schemas & Rules

Paket ini mengelola definisi aturan keamanan (*security rules*), indeks, dan struktur skema data untuk Firebase Realtime Database pada sistem **Gardenist**.

## Struktur Data JSON

```json
{
  "sensors": {
    "soil": 65,
    "temp": 28.5,
    "humidity": 70,
    "light": 1200,
    "mq135": 180,
    "tank": 85,
    "timestamp": 1784522815
  },
  "controls": {
    "pump": false,
    "mist": false,
    "uv": false,
    "buzzer": false
  },
  "automation": {
    "auto_pump": true,
    "auto_mist": false,
    "auto_uv": true,
    "thresholds": {
      "soil_min": 40,
      "temp_max": 33
    }
  },
  "logs": {
    "-O12345abc": {
      "message": "Water pump turned ON automatically",
      "type": "info",
      "timestamp": 1784522815
    }
  },
  "nodes": {
    "node_01": {
      "name": "Greenhouse Zone A",
      "status": "online",
      "ip": "192.168.1.50",
      "last_seen": 1784522815
    }
  }
}
```

## Deployment Rules

Untuk men-deploy rules ke Firebase:
```bash
firebase deploy --only database
```
Atau melalui Firebase Console dengan menyalin isi `database.rules.json`.
