#include <WiFi.h>
#include <WebServer.h>
#include <ArduinoJson.h>

// Configuration
struct Config {
  // Network settings (set these to your WiFi credentials)
  const char* ssid = "VOTRE_SSID";
  const char* password = "VOTRE_MDP";
  
  // Hardware pins
  const uint8_t ledGreen = 16;  // For ACCEPTED status
  const uint8_t ledRed = 17;    // For REJECTED status
  const uint8_t ledBlue = 18;   // For READY status
  const uint8_t ledYellow = 5;  // For WiFi connection indicator
  const uint8_t buzzer = 19;
  
  // Timing (milliseconds)
  const unsigned long buzzerDuration = 3000; // 3 seconds buzzer sound
  const unsigned long ledDuration = 10000;   // 10 seconds LED indication
  const unsigned int buzzerTone = 1000;      // 1kHz tone for general alerts
  const unsigned int readyTone = 1500;       // Higher tone for READY status
} config;

// Create web server on port 80
WebServer server(80);

// Status tracking
String currentStatus = "none";  // Possible values: "pending", "accepted", "rejected", "ready", "none"
unsigned long buzzerStartTime = 0;
unsigned long ledStartTime = 0;
bool buzzerActive = false;
bool ledActive = false;
bool wifiConnected = false;

void setup() {
  Serial.begin(115200);
  
  // Initialize pins
  pinMode(config.ledRed, OUTPUT);
  pinMode(config.ledGreen, OUTPUT);
  pinMode(config.ledBlue, OUTPUT);
  pinMode(config.ledYellow, OUTPUT);
  pinMode(config.buzzer, OUTPUT);
  
  // Turn all LEDs off initially
  digitalWrite(config.ledRed, LOW);
  digitalWrite(config.ledGreen, LOW);
  digitalWrite(config.ledBlue, LOW);
  digitalWrite(config.ledYellow, LOW);
  
  // Connect to WiFi
  connectWiFi();
  
  // Set up server routes
  setupServerRoutes();
  
  // Start server
  server.begin();
  Serial.println("HTTP server started");
}

void connectWiFi() {
  Serial.print("Connecting to WiFi: ");
  Serial.println(config.ssid);
  
  WiFi.begin(config.ssid, config.password);
  
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    attempts++;
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\nWiFi connected!");
    Serial.print("IP address: ");
    Serial.println(WiFi.localIP());
    digitalWrite(config.ledYellow, HIGH); // WiFi indicator ON
    wifiConnected = true;
  } else {
    Serial.println("\nWiFi connection failed!");
    digitalWrite(config.ledYellow, LOW); // WiFi indicator OFF
    wifiConnected = false;
  }
}

void setupServerRoutes() {
  // CORS Headers setup function
  auto setCorsHeaders = []() {
    server.sendHeader("Access-Control-Allow-Origin", "*");
    server.sendHeader("Access-Control-Allow-Methods", "GET, POST, PUT, OPTIONS");
    server.sendHeader("Access-Control-Allow-Headers", "Content-Type");
  };

  // Route to get device info and current status
  server.on("/info", HTTP_GET, [setCorsHeaders]() {
    setCorsHeaders();
    
    StaticJsonDocument<256> doc;
    doc["status"] = currentStatus;
    doc["wifi_connected"] = wifiConnected;
    doc["ip"] = WiFi.localIP().toString();
    doc["mac"] = WiFi.macAddress();
    
    String response;
    serializeJson(doc, response);
    
    server.send(200, "application/json", response);
  });
  
  // Route to update order status
  server.on("/update", HTTP_POST, [setCorsHeaders]() {
    setCorsHeaders();
    
    if (server.hasArg("plain")) {
      String body = server.arg("plain");
      
      StaticJsonDocument<256> doc;
      DeserializationError error = deserializeJson(doc, body);
      
      if (error) {
        server.send(400, "application/json", "{\"error\":\"Invalid JSON\"}");
        return;
      }
      
      if (!doc.containsKey("status")) {
        server.send(400, "application/json", "{\"error\":\"Missing status field\"}");
        return;
      }
      
      String newStatus = doc["status"].as<String>();
      updateStatusIndicators(newStatus);
      
      StaticJsonDocument<128> responseDoc;
      responseDoc["success"] = true;
      responseDoc["status"] = currentStatus;
      
      String response;
      serializeJson(responseDoc, response);
      
      server.send(200, "application/json", response);
    } else {
      server.send(400, "application/json", "{\"error\":\"No body sent\"}");
    }
  });
  
  // Route to test buzzer
  server.on("/test/buzzer", HTTP_POST, [setCorsHeaders]() {
    setCorsHeaders();
    
    tone(config.buzzer, config.buzzerTone);
    buzzerStartTime = millis();
    buzzerActive = true;
    
    server.send(200, "application/json", "{\"success\":true}");
  });
  
  // Handle CORS preflight requests
  server.on("/update", HTTP_OPTIONS, [setCorsHeaders]() {
    setCorsHeaders();
    server.send(204);
  });
  
  server.on("/test/buzzer", HTTP_OPTIONS, [setCorsHeaders]() {
    setCorsHeaders();
    server.send(204);
  });
  
  // Handle 404
  server.onNotFound([]() {
    server.send(404, "application/json", "{\"error\":\"Not found\"}");
  });
}

void updateStatusIndicators(const String& status) {
  // Only process if status changed or is not empty
  if (status.length() == 0 || (status == currentStatus && !buzzerActive && !ledActive)) {
    return;
  }
  
  // Update stored status
  currentStatus = status.toLowerCase(); // Convert to lowercase for consistency
  
  // Turn off all indicator LEDs
  digitalWrite(config.ledRed, LOW);
  digitalWrite(config.ledGreen, LOW);
  digitalWrite(config.ledBlue, LOW);
  
  // Set appropriate LED
  if (currentStatus == "rejected") {
    digitalWrite(config.ledRed, HIGH);
    ledActive = true;
    // Use standard tone for rejected
    tone(config.buzzer, config.buzzerTone);
  } else if (currentStatus == "accepted") {
    digitalWrite(config.ledGreen, HIGH);
    ledActive = true;
    // Use standard tone for accepted
    tone(config.buzzer, config.buzzerTone);
  } else if (currentStatus == "ready") {
    digitalWrite(config.ledBlue, HIGH);
    ledActive = true;
    // Use higher tone for ready status
    tone(config.buzzer, config.readyTone);
  } else if (currentStatus == "pending") {
    // No LED for pending, but short beep
    tone(config.buzzer, config.buzzerTone, 500); // Short 500ms beep
    return; // Exit early as we don't need LED timing for pending
  } else {
    // Unknown status, no action
    return;
  }
  
  // Track when LEDs were turned on
  ledStartTime = millis();
  
  // Activate buzzer for status change
  buzzerStartTime = millis();
  buzzerActive = true;
  
  Serial.print("Status updated: ");
  Serial.println(currentStatus);
}

void manageBuzzerAndLeds() {
  unsigned long currentTime = millis();
  
  // Check if buzzer should be turned off
  if (buzzerActive && (currentTime - buzzerStartTime >= config.buzzerDuration)) {
    noTone(config.buzzer);
    buzzerActive = false;
    Serial.println("Buzzer turned off");
  }
  
  // Check if LEDs should be turned off
  if (ledActive && (currentTime - ledStartTime >= config.ledDuration)) {
    digitalWrite(config.ledRed, LOW);
    digitalWrite(config.ledGreen, LOW);
    digitalWrite(config.ledBlue, LOW);
    ledActive = false;
    Serial.println("LEDs turned off");
  }
  
  // Check WiFi connection periodically
  static unsigned long lastWifiCheck = 0;
  if (currentTime - lastWifiCheck >= 30000) { // Every 30 seconds
    lastWifiCheck = currentTime;
    
    if (WiFi.status() != WL_CONNECTED && wifiConnected) {
      // We were connected but lost connection
      Serial.println("WiFi connection lost!");
      digitalWrite(config.ledYellow, LOW); // WiFi indicator OFF
      wifiConnected = false;
      
      // Try to reconnect
      connectWiFi();
    } else if (WiFi.status() == WL_CONNECTED && !wifiConnected) {
      // We've reconnected
      Serial.println("WiFi reconnected!");
      digitalWrite(config.ledYellow, HIGH); // WiFi indicator ON
      wifiConnected = true;
    }
  }
}

void loop() {
  // Handle client requests
  server.handleClient();
  
  // Check and manage buzzer and LED timing
  manageBuzzerAndLeds();
}