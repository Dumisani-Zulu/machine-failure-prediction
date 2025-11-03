Project setup:

#Backend ✔
- model trained ✔
- model ready ✔

#Frontend ✔
- connected to the backend ✔
- created dashboard ✔
- Auth page ✔

#Machines
- machines list page ✔
- machine details page ✔
- API simulating machine data
- simulated data passing through trained model
- Machines charts

#Auth
- sign up page ✔
- sign in page ✔
- signout function ✔

#Users
- admin
- technician
- managers

# others
- settings page 
- User profile page

# Database
- setup
- connection 
- data storage 
- logs

# Notifications
- Systems notifications
- Alert notifications
- Email notifications


# Sensor Data Simulation
- Define the normal working range of the machines
- define the "caution" range of the sensors
- Define the "Critical" range of the sensors


if the sensors are within the normal range, there should be no alerts to be sent
if the sensors are slightly above the normal range, there should be a warning to be sent
if the sensors are above the normal range by a lot, there should be an alert sent

** the data from the api should be increasing and decrease by small margins to make the machines working normally. i want a button to influence the vitals such that when clicked the vitals will spike up and change from working normally to the warning (Caution) condition and another button that when clicked the vitals go into critical condition and send alerts to an email.
