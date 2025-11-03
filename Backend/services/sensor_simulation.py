# backend/services/sensor_simulation.py

import random
import time
import threading
import smtplib
import os
from datetime import datetime
from typing import Dict, List, Optional
from dataclasses import dataclass
from enum import Enum

# Email imports - fix for Python 3.13
try:
    from email.mime.text import MimeText
    from email.mime.multipart import MimeMultipart
    EMAIL_AVAILABLE = True
except ImportError:
    # Fallback for systems where email modules might not be available
    EMAIL_AVAILABLE = False
    print("Email functionality not available")

class SensorStatus(Enum):
    NORMAL = "normal"
    CAUTION = "caution"
    CRITICAL = "critical"

@dataclass
class SensorRange:
    """Define sensor operating ranges"""
    normal_min: float
    normal_max: float
    caution_min: float
    caution_max: float
    critical_min: float
    critical_max: float

@dataclass
class SensorReading:
    """Individual sensor reading"""
    value: float
    status: SensorStatus
    timestamp: datetime

class SensorSimulator:
    """Advanced sensor simulation with configurable ranges and alert system"""
    
    def __init__(self):
        # Define sensor ranges
        self.sensor_ranges = {
            'temperature': SensorRange(
                normal_min=20.0, normal_max=85.0,     # Normal operating range (°C)
                caution_min=85.1, caution_max=95.0,   # Caution range
                critical_min=95.1, critical_max=120.0  # Critical range
            ),
            'pressure': SensorRange(
                normal_min=50.0, normal_max=150.0,     # Normal operating range (PSI)
                caution_min=150.1, caution_max=180.0,  # Caution range
                critical_min=180.1, critical_max=220.0 # Critical range
            ),
            'vibration': SensorRange(
                normal_min=0.1, normal_max=2.0,        # Normal operating range (mm/s)
                caution_min=2.1, caution_max=4.0,      # Caution range
                critical_min=4.1, critical_max=8.0     # Critical range
            )
        }
        
        # Current sensor values
        self.current_values = {
            'temperature': 45.0,  # Start in normal range
            'pressure': 100.0,    # Start in normal range
            'vibration': 1.0      # Start in normal range
        }
        
        # Simulation control
        self.simulation_mode = "normal"  # normal, caution, critical
        self.forced_mode = None
        self.forced_mode_duration = 0
        self.forced_mode_start_time = None
        
        # Alert tracking
        self.last_alerts = {}
        self.alert_cooldown = 300  # 5 minutes between similar alerts
        
        # Email configuration
        self.email_config = {
            'smtp_server': 'smtp.gmail.com',
            'smtp_port': 587,
            'sender_email': os.getenv('ALERT_EMAIL', 'machine.monitor@company.com'),
            'sender_password': os.getenv('ALERT_EMAIL_PASSWORD', ''),
            'recipient_emails': [
                os.getenv('ADMIN_EMAIL', 'admin@company.com'),
                'maintenance@company.com'
            ]
        }
    
    def get_sensor_status(self, sensor_type: str, value: float) -> SensorStatus:
        """Determine sensor status based on value and ranges"""
        ranges = self.sensor_ranges[sensor_type]
        
        if ranges.normal_min <= value <= ranges.normal_max:
            return SensorStatus.NORMAL
        elif ranges.caution_min <= value <= ranges.caution_max:
            return SensorStatus.CAUTION
        elif value >= ranges.critical_min:
            return SensorStatus.CRITICAL
        else:
            # Below normal range is also considered critical
            return SensorStatus.CRITICAL
    
    def generate_normal_variation(self, current_value: float, sensor_type: str) -> float:
        """Generate small variations for normal operation"""
        # Small random variation (±1-3% of current value)
        variation_percent = random.uniform(-0.03, 0.03)
        new_value = current_value * (1 + variation_percent)
        
        # Ensure we stay within reasonable bounds
        ranges = self.sensor_ranges[sensor_type]
        if new_value < ranges.normal_min:
            new_value = ranges.normal_min + random.uniform(0, 5)
        elif new_value > ranges.normal_max:
            new_value = ranges.normal_max - random.uniform(0, 5)
            
        return round(new_value, 2)
    
    def generate_caution_spike(self, sensor_type: str) -> float:
        """Generate values in caution range"""
        ranges = self.sensor_ranges[sensor_type]
        return round(random.uniform(ranges.caution_min, ranges.caution_max), 2)
    
    def generate_critical_spike(self, sensor_type: str) -> float:
        """Generate values in critical range"""
        ranges = self.sensor_ranges[sensor_type]
        return round(random.uniform(ranges.critical_min, ranges.critical_max), 2)
    
    def force_caution_mode(self, duration_seconds: int = 300):
        """Force sensors into caution mode for specified duration"""
        self.forced_mode = "caution"
        self.forced_mode_duration = duration_seconds
        self.forced_mode_start_time = time.time()
        
        # Immediately spike values to caution range
        for sensor_type in self.current_values:
            self.current_values[sensor_type] = self.generate_caution_spike(sensor_type)
    
    def force_critical_mode(self, duration_seconds: int = 180):
        """Force sensors into critical mode for specified duration"""
        self.forced_mode = "critical"
        self.forced_mode_duration = duration_seconds
        self.forced_mode_start_time = time.time()
        
        # Immediately spike values to critical range
        for sensor_type in self.current_values:
            self.current_values[sensor_type] = self.generate_critical_spike(sensor_type)
    
    def check_forced_mode_expiry(self):
        """Check if forced mode should expire"""
        if self.forced_mode and self.forced_mode_start_time:
            elapsed = time.time() - self.forced_mode_start_time
            if elapsed >= self.forced_mode_duration:
                self.forced_mode = None
                self.forced_mode_start_time = None
                self.forced_mode_duration = 0
                # Gradually return to normal
                self.simulation_mode = "normal"
    
    def update_sensor_values(self):
        """Update all sensor values based on current mode"""
        self.check_forced_mode_expiry()
        
        current_mode = self.forced_mode or self.simulation_mode
        
        for sensor_type in self.current_values:
            if current_mode == "normal":
                self.current_values[sensor_type] = self.generate_normal_variation(
                    self.current_values[sensor_type], sensor_type
                )
            elif current_mode == "caution":
                # Gradually move towards caution range or maintain
                if self.get_sensor_status(sensor_type, self.current_values[sensor_type]) == SensorStatus.NORMAL:
                    self.current_values[sensor_type] = self.generate_caution_spike(sensor_type)
                else:
                    # Small variations within caution range
                    ranges = self.sensor_ranges[sensor_type]
                    variation = random.uniform(-5, 5)
                    new_value = self.current_values[sensor_type] + variation
                    self.current_values[sensor_type] = max(ranges.caution_min, 
                                                          min(ranges.caution_max, new_value))
            elif current_mode == "critical":
                # Gradually move towards critical range or maintain
                if self.get_sensor_status(sensor_type, self.current_values[sensor_type]) != SensorStatus.CRITICAL:
                    self.current_values[sensor_type] = self.generate_critical_spike(sensor_type)
                else:
                    # Small variations within critical range
                    ranges = self.sensor_ranges[sensor_type]
                    variation = random.uniform(-3, 8)
                    new_value = self.current_values[sensor_type] + variation
                    self.current_values[sensor_type] = max(ranges.critical_min,
                                                          min(ranges.critical_max, new_value))
    
    def get_current_readings(self) -> Dict:
        """Get current sensor readings with status"""
        self.update_sensor_values()
        
        readings = {}
        overall_status = SensorStatus.NORMAL
        
        for sensor_type, value in self.current_values.items():
            status = self.get_sensor_status(sensor_type, value)
            readings[sensor_type] = {
                'value': value,
                'status': status.value,
                'timestamp': datetime.now().isoformat()
            }
            
            # Determine overall status (worst case)
            if status == SensorStatus.CRITICAL:
                overall_status = SensorStatus.CRITICAL
            elif status == SensorStatus.CAUTION and overall_status != SensorStatus.CRITICAL:
                overall_status = SensorStatus.CAUTION
        
        readings['overall_status'] = overall_status.value
        readings['forced_mode'] = self.forced_mode
        readings['mode_remaining'] = (
            max(0, self.forced_mode_duration - (time.time() - self.forced_mode_start_time))
            if self.forced_mode_start_time else 0
        )
        
        # Check for alerts
        self.check_and_send_alerts(readings)
        
        return readings
    
    def should_send_alert(self, sensor_type: str, status: SensorStatus) -> bool:
        """Check if alert should be sent based on cooldown"""
        if status == SensorStatus.NORMAL:
            return False
            
        alert_key = f"{sensor_type}_{status.value}"
        current_time = time.time()
        
        if alert_key in self.last_alerts:
            time_since_last = current_time - self.last_alerts[alert_key]
            if time_since_last < self.alert_cooldown:
                return False
        
        self.last_alerts[alert_key] = current_time
        return True
    
    def send_email_alert(self, subject: str, body: str):
        """Send email alert"""
        try:
            if not EMAIL_AVAILABLE:
                print(f"Email alert (EMAIL_AVAILABLE=False): {subject}")
                print(f"Body: {body[:200]}...")
                return
                
            if not self.email_config['sender_password']:
                print(f"Email alert (no password configured): {subject}")
                print(f"Body: {body[:200]}...")
                return
            
            msg = MimeMultipart()
            msg['From'] = self.email_config['sender_email']
            msg['To'] = ', '.join(self.email_config['recipient_emails'])
            msg['Subject'] = subject
            
            msg.attach(MimeText(body, 'html'))
            
            server = smtplib.SMTP(self.email_config['smtp_server'], self.email_config['smtp_port'])
            server.starttls()
            server.login(self.email_config['sender_email'], self.email_config['sender_password'])
            
            text = msg.as_string()
            server.sendmail(self.email_config['sender_email'], self.email_config['recipient_emails'], text)
            server.quit()
            
            print(f"Alert email sent: {subject}")
            
        except Exception as e:
            print(f"Failed to send email alert: {e}")
    
    def check_and_send_alerts(self, readings: Dict):
        """Check sensor readings and send alerts if necessary"""
        caution_sensors = []
        critical_sensors = []
        
        for sensor_type in ['temperature', 'pressure', 'vibration']:
            sensor_data = readings[sensor_type]
            status = SensorStatus(sensor_data['status'])
            
            if self.should_send_alert(sensor_type, status):
                if status == SensorStatus.CAUTION:
                    caution_sensors.append((sensor_type, sensor_data['value']))
                elif status == SensorStatus.CRITICAL:
                    critical_sensors.append((sensor_type, sensor_data['value']))
        
        # Send caution alerts
        if caution_sensors:
            subject = "⚠️ Machine Monitor - Caution Alert"
            body = self.create_alert_email_body("CAUTION", caution_sensors, readings)
            self.send_email_alert(subject, body)
        
        # Send critical alerts
        if critical_sensors:
            subject = "🚨 Machine Monitor - CRITICAL Alert"
            body = self.create_alert_email_body("CRITICAL", critical_sensors, readings)
            self.send_email_alert(subject, body)
    
    def create_alert_email_body(self, alert_type: str, sensors: List, all_readings: Dict) -> str:
        """Create HTML email body for alerts"""
        color = "#ff6b35" if alert_type == "CRITICAL" else "#f39c12"
        
        html = f"""
        <html>
        <body style="font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f4f4f4;">
            <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                
                <div style="background-color: {color}; color: white; padding: 20px; text-align: center;">
                    <h1 style="margin: 0; font-size: 24px;">{alert_type} ALERT</h1>
                    <p style="margin: 5px 0 0 0; font-size: 16px;">Machine Monitoring System</p>
                </div>
                
                <div style="padding: 30px;">
                    <h2 style="color: #333; margin-top: 0;">Sensor Alert Details</h2>
                    <p style="color: #666; font-size: 16px; line-height: 1.5;">
                        The following sensors have exceeded their {alert_type.lower()} thresholds:
                    </p>
                    
                    <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
        """
        
        for sensor_type, value in sensors:
            ranges = self.sensor_ranges[sensor_type]
            unit = "°C" if sensor_type == "temperature" else ("PSI" if sensor_type == "pressure" else "mm/s")
            
            html += f"""
                        <div style="margin-bottom: 15px; padding: 10px; background-color: white; border-left: 4px solid {color}; border-radius: 3px;">
                            <strong style="color: #333; text-transform: capitalize;">{sensor_type}</strong><br>
                            <span style="color: {color}; font-size: 18px; font-weight: bold;">{value} {unit}</span><br>
                            <small style="color: #666;">Normal Range: {ranges.normal_min}-{ranges.normal_max} {unit}</small>
                        </div>
            """
        
        html += f"""
                    </div>
                    
                    <h3 style="color: #333;">All Current Readings</h3>
                    <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
                        <tr style="background-color: #f8f9fa;">
                            <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">Sensor</th>
                            <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">Value</th>
                            <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">Status</th>
                        </tr>
        """
        
        for sensor_type in ['temperature', 'pressure', 'vibration']:
            sensor_data = all_readings[sensor_type]
            unit = "°C" if sensor_type == "temperature" else ("PSI" if sensor_type == "pressure" else "mm/s")
            status_color = "#28a745" if sensor_data['status'] == "normal" else ("#f39c12" if sensor_data['status'] == "caution" else "#dc3545")
            
            html += f"""
                        <tr>
                            <td style="padding: 10px; border: 1px solid #ddd; text-transform: capitalize;">{sensor_type}</td>
                            <td style="padding: 10px; border: 1px solid #ddd;">{sensor_data['value']} {unit}</td>
                            <td style="padding: 10px; border: 1px solid #ddd;">
                                <span style="color: {status_color}; font-weight: bold; text-transform: uppercase;">
                                    {sensor_data['status']}
                                </span>
                            </td>
                        </tr>
            """
        
        html += f"""
                    </table>
                    
                    <div style="margin-top: 30px; padding: 15px; background-color: #e9ecef; border-radius: 5px;">
                        <p style="margin: 0; color: #666; font-size: 14px;">
                            <strong>Timestamp:</strong> {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}<br>
                            <strong>System:</strong> Machine Monitoring Dashboard<br>
                            <strong>Priority:</strong> {alert_type}
                        </p>
                    </div>
                    
                    <p style="color: #666; font-size: 14px; margin-top: 20px;">
                        Please check the machine immediately and take appropriate action.
                        This is an automated alert from the Machine Monitoring System.
                    </p>
                </div>
            </div>
        </body>
        </html>
        """
        
        return html

# Global simulator instance
simulator = SensorSimulator()
