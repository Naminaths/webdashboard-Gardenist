/*
 * Gardenist - ESP32 Smart Garden Controller
 * 
 * Hardware:
 * - ESP32 DevKit V1
 * - DHT22 (Temperature & Air Humidity)
 * - Soil Moisture Sensor (Capacitive/Resistive)
 * - LDR Photoresistor (Ambient Light)
 * - MQ-135 (Air Quality Sensor)
 * - HC-SR04 Ultrasonic (Water Tank Level)
 * - 4-Channel 5V Relay (Pump, Mist, UV, Buzzer)
 */

#include <WiFi.h>
#include <FirebaseESP32.h>
#include <DHT.h>

// WiFi Credentials
#define WIFI_SSID     "YOUR_WIFI_SSID"
#define WIFI_PASSWORD "YOUR_WIFI_PASSWORD"

// Firebase Credentials
#define FIREBASE_HOST "webdashboard-gardenist-default-rtdb.firebaseio.com"
#define FIREBASE_AUTH "YOUR_FIREBASE_DATABASE_SECRET_OR_TOKEN"

// Pin Definitions - Sensors
#define PIN_DHT           4
#define PIN_SOIL          34  // ADC1
#define PIN_LDR           35  // ADC1
#define PIN_MQ135         32  // ADC1
#define PIN_TRIG          5
#define PIN_ECHO          18

// Pin Definitions - Actuators (Relays active LOW)
#define RELAY_PUMP        19
#define RELAY_MIST        21
#define RELAY_UV          22
#define RELAY_BUZZER      23

#define DHTTYPE DHT22
DHT dht(PIN_DHT, DHTTYPE);

FirebaseData fbdo;
FirebaseAuth auth;
FirebaseConfig config;

unsigned long lastSensorPublish = 0;
const unsigned long PUBLISH_INTERVAL = 5000; // 5 seconds

void setup() {
  Serial.begin(115200);
  Serial.println("\n[Gardenist] Initializing Smart Garden Controller...");

  // Relay Setup
  pinMode(RELAY_PUMP, OUTPUT);
  pinMode(RELAY_MIST, OUTPUT);
  pinMode(RELAY_UV, OUTPUT);
  pinMode(RELAY_BUZZER, OUTPUT);
  digitalWrite(RELAY_PUMP, HIGH);
  digitalWrite(RELAY_MIST, HIGH);
  digitalWrite(RELAY_UV, HIGH);
  digitalWrite(RELAY_BUZZER, HIGH);

  // Ultrasonic Setup
  pinMode(PIN_TRIG, OUTPUT);
  pinMode(PIN_ECHO, INPUT);

  // Initialize Sensors
  dht.begin();

  // Connect to WiFi
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  Serial.print("[Gardenist] Connecting to WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\n[Gardenist] WiFi Connected! IP: " + WiFi.localIP().toString());

  // Initialize Firebase
  config.host = FIREBASE_HOST;
  config.signer.tokens.legacy_token = FIREBASE_AUTH;
  Firebase.begin(&config, &auth);
  Firebase.reconnectWiFi(true);

  Serial.println("[Gardenist] System ready.");
}

float readTankLevel() {
  digitalWrite(PIN_TRIG, LOW);
  delayMicroseconds(2);
  digitalWrite(PIN_TRIG, HIGH);
  delayMicroseconds(10);
  digitalWrite(PIN_TRIG, LOW);
  long duration = pulseIn(PIN_ECHO, HIGH, 30000);
  if (duration == 0) return 0;
  float distanceCm = duration * 0.034 / 2;
  // Tank height assumed 50cm, map to percentage (0 - 100%)
  float levelPercent = (1.0 - (distanceCm / 50.0)) * 100.0;
  return constrain(levelPercent, 0, 100);
}

void loop() {
  unsigned long currentMillis = millis();

  // 1. Read & Publish Sensor Data
  if (currentMillis - lastSensorPublish >= PUBLISH_INTERVAL) {
    lastSensorPublish = currentMillis;

    float humidity = dht.readHumidity();
    float temp = dht.readTemperature();
    int soilRaw = analogRead(PIN_SOIL);
    int ldrRaw = analogRead(PIN_LDR);
    int mqRaw = analogRead(PIN_MQ135);
    float tankLevel = readTankLevel();

    float soilPercent = map(soilRaw, 4095, 1200, 0, 100);
    soilPercent = constrain(soilPercent, 0, 100);

    FirebaseJson json;
    json.set("humidity", isnan(humidity) ? 0 : humidity);
    json.set("temp", isnan(temp) ? 0 : temp);
    json.set("soil", soilPercent);
    json.set("light", ldrRaw);
    json.set("mq135", mqRaw);
    json.set("tank", tankLevel);
    json.set("timestamp", currentMillis / 1000);

    if (Firebase.updateNode(fbdo, "/sensors", json)) {
      Serial.println("[Gardenist] Sensors updated successfully.");
    } else {
      Serial.println("[Gardenist] Update failed: " + fbdo.errorReason());
    }
  }

  // 2. Read Controls state from Firebase
  if (Firebase.getJSON(fbdo, "/controls")) {
    FirebaseJson &json = fbdo.jsonObject();
    FirebaseJsonData data;

    if (json.get(data, "pump")) digitalWrite(RELAY_PUMP, data.boolValue ? LOW : HIGH);
    if (json.get(data, "mist")) digitalWrite(RELAY_MIST, data.boolValue ? LOW : HIGH);
    if (json.get(data, "uv"))   digitalWrite(RELAY_UV, data.boolValue ? LOW : HIGH);
    if (json.get(data, "buzzer")) digitalWrite(RELAY_BUZZER, data.boolValue ? LOW : HIGH);
  }

  delay(200);
}
