#include <WiFi.h>
#include <WebServer.h>
#include <ArduinoJson.h>

// Configuration
const char* ssid = "qqq"; // your wifi name 
const char* password = "12345678"; // wifi password

// Hardware pins
const int ledGreen = 16;  // For ACCEPTED status
const int ledRed = 17;    // For REJECTED status
const int ledBlue = 18;   // For READY status
const int buzzer = 19;

// Timing (milliseconds)
const unsigned long buzzerDuration = 3000; // 3 seconds
const unsigned long ledDuration = 10000;   // 10 seconds
const unsigned long readyLedDuration = 3000; // 3 seconds for ready status
const unsigned int buzzerTone = 1000;      // 1kHz tone
const unsigned int readyTone = 1500;       // Higher tone for READY

// Create web server on port 80
WebServer server(80);

// Status tracking
String currentStatus = "none";
unsigned long buzzerStartTime = 0;
unsigned long ledStartTime = 0;
bool buzzerActive = false;
bool ledActive = false;

void setup() {
  Serial.begin(115200);
  
  // Initialize pins
  pinMode(ledRed, OUTPUT);
  pinMode(ledGreen, OUTPUT);
  pinMode(ledBlue, OUTPUT);
  pinMode(buzzer, OUTPUT);
  
  // Turn all LEDs off initially
  digitalWrite(ledRed, LOW);
  digitalWrite(ledGreen, LOW);
  digitalWrite(ledBlue, LOW);
  
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
  Serial.println(ssid);
  
  WiFi.begin(ssid, password);
  
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  
  Serial.println("\nWiFi connected!");
  Serial.print("IP address: ");
  Serial.println(WiFi.localIP());
}

void setCorsHeaders() {
  server.sendHeader("Access-Control-Allow-Origin", "*");
  server.sendHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  server.sendHeader("Access-Control-Allow-Headers", "Content-Type");
}

void setupServerRoutes() {
  // Get device info and current status
  server.on("/info", HTTP_GET, []() {
    setCorsHeaders();
    
    StaticJsonDocument<200> doc;
    doc["status"] = currentStatus;
    doc["ip"] = WiFi.localIP().toString();
    
    String response;
    serializeJson(doc, response);
    
    server.send(200, "application/json", response);
  });
  
  // Update order status
  server.on("/update", HTTP_POST, []() {
    setCorsHeaders();
    
    if (server.hasArg("plain")) {
      String body = server.arg("plain");
      
      StaticJsonDocument<200> doc;
      DeserializationError error = deserializeJson(doc, body);
      
      if (error || !doc.containsKey("status")) {
        server.send(400, "application/json", "{\"error\":\"Invalid request\"}");
        return;
      }
      
      String newStatus = doc["status"].as<String>();
      updateStatusIndicators(newStatus);
      
      server.send(200, "application/json", "{\"success\":true}");
    } else {
      server.send(400, "application/json", "{\"error\":\"No data\"}");
    }
  });
  
  // Test routes for individual components
  server.on("/red", HTTP_GET, []() {
    setCorsHeaders();
    stopAllComponents();
    digitalWrite(ledRed, HIGH);
    server.send(200, "application/json", "{\"message\":\"Red LED turned on\"}");
  });
  
  server.on("/green", HTTP_GET, []() {
    setCorsHeaders();
    stopAllComponents();
    digitalWrite(ledGreen, HIGH);
    server.send(200, "application/json", "{\"message\":\"Green LED turned on\"}");
  });
  
  server.on("/blue", HTTP_GET, []() {
    setCorsHeaders();
    stopAllComponents();
    digitalWrite(ledBlue, HIGH);
    server.send(200, "application/json", "{\"message\":\"Blue LED turned on\"}");
  });
  
  server.on("/buzz", HTTP_GET, []() {
    setCorsHeaders();
    stopAllComponents();
    tone(buzzer, buzzerTone, 2000); // 2 second buzz
    server.send(200, "application/json", "{\"message\":\"Buzzer activated\"}");
  });
  
  // Handle OPTIONS requests for CORS
  server.on("/info", HTTP_OPTIONS, []() {
    setCorsHeaders();
    server.send(204);
  });
  
  server.on("/update", HTTP_OPTIONS, []() {
    setCorsHeaders();
    server.send(204);
  });
  
  server.on("/red", HTTP_OPTIONS, []() {
    setCorsHeaders();
    server.send(204);
  });
  
  server.on("/green", HTTP_OPTIONS, []() {
    setCorsHeaders();
    server.send(204);
  });
  
  server.on("/blue", HTTP_OPTIONS, []() {
    setCorsHeaders();
    server.send(204);
  });
  
  server.on("/buzz", HTTP_OPTIONS, []() {
    setCorsHeaders();
    server.send(204);
  });
  
  // 404 handler
  server.onNotFound([]() {
    setCorsHeaders();
    server.send(404, "application/json", "{\"error\":\"Not found\"}");
  });
}

void stopAllComponents() {
  // Turn off all LEDs
  digitalWrite(ledRed, LOW);
  digitalWrite(ledGreen, LOW);
  digitalWrite(ledBlue, LOW);
  
  // Turn off buzzer
  noTone(buzzer);
  
  // Reset flags
  buzzerActive = false;
  ledActive = false;
}

void updateStatusIndicators(const String& status) {
  if (status.length() == 0) return;

  // FIRST: Stop any currently active components
  stopAllComponents();

  // Convert to lowercase and store
  String lowercaseStatus = status;
  lowercaseStatus.toLowerCase();
  currentStatus = lowercaseStatus;

  // Handle different statuses
  if (currentStatus == "rejected") {
    digitalWrite(ledRed, HIGH);
    ledActive = true;
    ledStartTime = millis();
  } 
  else if (currentStatus == "accepted") {
    digitalWrite(ledGreen, HIGH);
    ledActive = true;
    ledStartTime = millis();
  } 
  else if (currentStatus == "ready") {
    // For ready: Both LED and buzzer turn on simultaneously for 3 seconds
    digitalWrite(ledBlue, HIGH);
    tone(buzzer, readyTone);
    ledActive = true;
    buzzerActive = true;
    ledStartTime = millis();
    buzzerStartTime = millis();
  } 
  else {
    return; // Unknown status
  }

  Serial.print("Status: ");
  Serial.println(currentStatus);
}

void manageBuzzerAndLeds() {
  unsigned long currentTime = millis();
  
  // Special handling for "ready" status
  if (currentStatus == "ready") {
    // Turn off LED after 3 seconds
    if (ledActive && (currentTime - ledStartTime >= readyLedDuration)) {
      digitalWrite(ledBlue, LOW);
      ledActive = false;
    }
    
    // Turn off buzzer after 3 seconds
    if (buzzerActive && (currentTime - buzzerStartTime >= readyLedDuration)) {
      noTone(buzzer);
      buzzerActive = false;
    }
  } else {
    // Normal handling for other statuses
    // Turn off buzzer after duration
    if (buzzerActive && (currentTime - buzzerStartTime >= buzzerDuration)) {
      noTone(buzzer);
      buzzerActive = false;
    }
    
    // Turn off LEDs after duration - FIXED: Only turn off the specific LED
    if (ledActive && (currentTime - ledStartTime >= ledDuration)) {
      if (currentStatus == "rejected") {
        digitalWrite(ledRed, LOW);
      } else if (currentStatus == "accepted") {
        digitalWrite(ledGreen, LOW);
      }
      // Note: Blue LED for "ready" is handled in the special case above
      ledActive = false;
    }
  }
}

void loop() {
  server.handleClient();
  manageBuzzerAndLeds();
}