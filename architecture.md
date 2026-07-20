# Arsitektur IoT: Gardenist Smart Garden

Diagram di bawah ini menggambarkan arsitektur dari sistem *Smart Garden* (Gardenist). Diagram ini menggunakan format PlantUML dengan stensil ikon standar industri.

```plantuml
@startuml
left to right direction
skinparam BackgroundColor transparent

package "Smart Garden Zone (Greenhouse)" {
  ' Sensors
  mxgraph.aws4.iot_thing_temperature_humidity_sensor "Sensor DHT22\n(Suhu & Udara)" as dht
  mxgraph.aws4.sensor "Soil Moisture\n(Tanah)" as soil
  mxgraph.aws4.sensor "LDR\n(Cahaya)" as ldr
  mxgraph.aws4.sensor "MQ-135\n(Kualitas Udara)" as mq
  mxgraph.aws4.sensor "Ultrasonic\n(Level Tangki)" as usonic
  
  ' Actuators
  mxgraph.aws4.actuator "Water Pump" as pump
  mxgraph.aws4.actuator "Mist Maker" as mist
  mxgraph.aws4.iot_thing_relay "UV Light" as uv
  mxgraph.aws4.iot_thing_stacklight "Buzzer Alarm" as buzzer

  ' Edge Device / Controller
  mxgraph.aws4.freertos "ESP32 Controller\n(Edge Gateway)" as esp32
}

package "Cloud Services" {
  mxgraph.aws4.iot_core "Firebase\nRealtime Database" as firebase
}

package "Client Applications" {
  mxgraph.aws4.iot_analytics "Web Dashboard\n(Gardenist App)" as webapp
}

' Data Flow: Sensors -> ESP32
dht --> esp32 : Data
soil --> esp32 : Data
ldr --> esp32 : Data
mq --> esp32 : Data
usonic --> esp32 : Data

' Control Flow: ESP32 -> Actuators
esp32 --> pump : Control
esp32 --> mist : Control
esp32 --> uv : Control
esp32 --> buzzer : Control

' Network Flow: ESP32 <-> Firebase <-> Web App
esp32 ..> firebase : WiFi (MQTT/REST)
firebase ..> webapp : WebSockets/Realtime Sync
@enduml
```

### Keterangan Komponen:
1. **Sensors**: Berfungsi untuk membaca kondisi lingkungan secara real-time.
2. **Actuators**: Berfungsi untuk melakukan aksi fisik di kebun berdasarkan perintah.
3. **ESP32 Controller**: Otak lokal (Edge) yang membaca sensor, mengeksekusi aturan otomatis (*automation rules*), dan menghubungkan sistem ke internet.
4. **Firebase Realtime Database**: Penyimpanan cloud pusat tempat sinkronisasi data terjadi.
5. **Web Dashboard**: Antarmuka *premium* (Gardenist) tempat pengguna memantau dan mengontrol kebun dari mana saja.
