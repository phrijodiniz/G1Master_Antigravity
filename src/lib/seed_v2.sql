-- Clear existing data if you want a fresh start (optional, but recommended to avoid dupes if re-running)
TRUNCATE TABLE public.questions;

-- Insert 25 'Rules of the Road' Questions
INSERT INTO public.questions (text, options, correct_index, category, chapter, explanation)
VALUES
(
  'What does a flashing red light mean?',
  '["Stop", "Slow down", "Yield", "Go"]'::jsonb,
  0, 'Rules of the Road', 'Traffic Lights',
  'A flashing red light means you must come to a complete stop.'
),
(
  'When are you allowed to pass other vehicles on the right?',
  '["One-way street", "Vehicle turning left", "Both of the above", "Never"]'::jsonb,
  2, 'Rules of the Road', 'Passing',
  'Pass on the right on one-way streets or when a vehicle is turning left.'
),
(
  'A school bus with red lights flashing is stopped. What must you do?',
  '["Slow down", "Stop 20m away", "Honk", "Pass quickly"]'::jsonb,
  1, 'Rules of the Road', 'Sharing the Road',
  'You must stop at least 20 meters away if approaching from either direction.'
),
(
  'When getting out of your car on a highway, you should:',
  '["Driver side", "Passenger side", "Any side", "Jump"]'::jsonb,
  1, 'Rules of the Road', 'Parking',
  'Exit from the passenger side to avoid traffic.'
),
(
  'Accident with injury must be reported:',
  '["Immediately", "24 hours", "48 hours", "Never"]'::jsonb,
  0, 'Rules of the Road', 'Accidents',
  'Report injuries immediately.'
),
(
  'Level I (G1) drivers must have blood alcohol level of:',
  '["0.00%", "0.05%", "0.08%", "0.02%"]'::jsonb,
  0, 'Rules of the Road', 'Alcohol and Drugs',
  'G1 drivers must have zero blood alcohol.'
),
(
  'If a tire blows out, you should:',
  '["Brake hard", "Take foot off gas", "Turn left", "Turn right"]'::jsonb,
  1, 'Rules of the Road', 'Emergency',
  'Ease off the gas and steer straight.'
),
(
  'If you skid on a slippery road:',
  '["Steer in direction of skid", "Brake hard", "Accelerate", "Steer opposite to skid"]'::jsonb,
  0, 'Rules of the Road', 'Weather',
  'Steer into the skid (the direction you want to go).'
),
(
  'Cyclists are entitled to:',
  '["Sidewalks", "Full lane", "Left curb", "Against traffic"]'::jsonb,
  1, 'Rules of the Road', 'Sharing the Road',
  'Cyclists are vehicles and can use the full lane if needed.'
),
(
  'High beams should be dimmed within ___ meters of oncoming traffic:',
  '["60m", "150m", "300m", "50m"]'::jsonb,
  1, 'Rules of the Road', 'Lights',
  'Dim high beams within 150m of oncoming vehicles.'
),
(
  'When parking uphill with a curb:',
  '["Turn wheels right", "Turn wheels left", "Straight", "None"]'::jsonb,
  1, 'Rules of the Road', 'Parking',
  'Turn wheels to the left so if it rolls, it hits the curb.'
),
(
  'When parking downhill with a curb:',
  '["Turn wheels right", "Turn wheels left", "Straight", "None"]'::jsonb,
  0, 'Rules of the Road', 'Parking',
  'Turn wheels to the right (towards curb).'
),
(
  'Minimum following distance on highway:',
  '["1 second", "2 seconds", "3 seconds", "5 seconds"]'::jsonb,
  1, 'Rules of the Road', 'Safe Driving',
  'Use the 2-second rule.'
),
(
  'Blind spots are:',
  '["Areas you cant see with mirrors", "Dark tunnels", "Tinted windows", "Night driving"]'::jsonb,
  0, 'Rules of the Road', 'Safe Driving',
  'Areas not visible in your rear or side mirrors.'
),
(
  'If you fail to stop for a police officer, you can lose your license for:',
  '["1 year", "2 years", "5 years", "Forever"]'::jsonb,
  2, 'Rules of the Road', 'Points and Suspensions',
  'Minimum 5 years suspension for flight from police.'
),
(
  'New drivers caught drinking and driving will be suspended for:',
  '["24 hours", "30 days", "90 days", "1 year"]'::jsonb,
  1, 'Rules of the Road', 'Alcohol and Drugs',
  'Immediate 30-day suspension is common for novice violations.'
),
(
  'Using a cellphone while driving results in:',
  '["$1000 fine + 3 points", "$50 fine", "Warning", "Car impound"]'::jsonb,
  0, 'Rules of the Road', 'Distracted Driving',
  'Distracted driving carries heavy fines and demerit points.'
),
(
  'When approaching a streetcar stopping to let off passengers:',
  '["Pass on left", "Stop 2m behind", "Honk", "Go slow"]'::jsonb,
  1, 'Rules of the Road', 'Sharing the Road',
  'Stop 2 meters behind the rear doors where passengers are alighting.'
),
(
  'Snow removal vehicles with flashing blue lights should be:',
  '["Passed", "Avoided", "Given right of way", "Honked at"]'::jsonb,
  2, 'Rules of the Road', 'Sharing the Road',
  'Stay back and yield to snow plows.'
),
(
  'If you change your address, notify the Ministry within:',
  '["6 days", "1 week", "2 weeks", "1 month"]'::jsonb,
  0, 'Rules of the Road', 'License',
  'Notify within 6 days.'
),
(
  'Demerit points for speeding 50km/h over limit:',
  '["3 points", "4 points", "6 points", "10 points"]'::jsonb,
  2, 'Rules of the Road', 'Points and Suspensions',
  'Street racing/stunt driving carries 6 points.'
),
(
  'G1 Drivers cannot drive between:',
  '["Midnight and 5am", "1am and 4am", "10pm and 6am", "They can drive anytime"]'::jsonb,
  0, 'Rules of the Road', 'G1 Restrictions',
  'G1 holders are restricted from midnight to 5am.'
),
(
  'G1 Drivers must be accompanied by limited driver with:',
  '["1 year experience", "4 years experience", "No experience", "G2 license"]'::jsonb,
  1, 'Rules of the Road', 'G1 Restrictions',
  'Accompanying driver needs 4 years experience.'
),
(
  'When 2 cars arrive at 4-way stop together:',
  '["Car on left goes", "Car on right goes", "Bigger car goes", "Faster car goes"]'::jsonb,
  1, 'Rules of the Road', 'Right of Way',
  'Yield to the vehicle on the right.'
),
(
  'Right turn on red is permitted:',
  '["Always", "Never", "After stop unless signed", "Without stopping"]'::jsonb,
  2, 'Rules of the Road', 'Turns',
  'Stop first, then turn if safe and not prohibited.'
);

-- Insert 25 'Road Signs' Questions
INSERT INTO public.questions (text, options, correct_index, category, chapter, explanation)
VALUES
(
  'Stop Sign?',
  '["Stop", "Yield", "Go", "Slow"]'::jsonb,
  0, 'Road Signs', 'Regulatory Signs',
  'Red octagon means Stop.'
),
(
  'Yield Sign?',
  '["Stop", "Yield", "Merge", "Go"]'::jsonb,
  1, 'Road Signs', 'Regulatory Signs',
  'Triangle means Yield.'
),
(
  'Max Speed 50?',
  '["Min 50", "Max 50", "Route 50", "Rec 50"]'::jsonb,
  1, 'Road Signs', 'Regulatory Signs',
  'Maximum legal speed.'
),
(
  'No Left Turn?',
  '["No U Turn", "No Left", "No Right", "No Parking"]'::jsonb,
  1, 'Road Signs', 'Regulatory Signs',
  'Prohibits left turns.'
),
(
  'Do Not Enter?',
  '["Stop", "Wrong Way", "Do Not Enter", "Yield"]'::jsonb,
  2, 'Road Signs', 'Regulatory Signs',
  'Prohibits entry.'
),
(
  'School Zone?',
  '["Playground", "School Zone", "Crosswalk", "Library"]'::jsonb,
  1, 'Road Signs', 'Warning Signs',
  'Watch for children.'
),
(
  'Railway Crossing?',
  '["X Sign", "Stop Sign", "Yield", "Bump"]'::jsonb,
  0, 'Road Signs', 'Warning Signs',
  'Crossbuck means railway.'
),
(
  'Slippery When Wet?',
  '["Winding Road", "Slippery", "River", "Paint"]'::jsonb,
  1, 'Road Signs', 'Warning Signs',
  'Road grip reduces when wet.'
),
(
  'Merge?',
  '["Lane ends", "Merge", "Turn", "Split"]'::jsonb,
  1, 'Road Signs', 'Warning Signs',
  'Two lanes becoming one.'
),
(
  'Traffic Light Ahead?',
  '["Stop", "Signals Ahead", "City", "Electric"]'::jsonb,
  1, 'Road Signs', 'Warning Signs',
  'Prepare to stop.'
),
(
  'Deer Crossing?',
  '["Zoo", "Hunting", "Deer", "Forest"]'::jsonb,
  2, 'Road Signs', 'Warning Signs',
  'Watch for animals.'
),
(
  'Hospital?',
  '["H sign", "Ambulance", "Doctor", "Pharmacy"]'::jsonb,
  0, 'Road Signs', 'Information Signs',
  'Blue H indicates hospital.'
),
(
  'Construction Zone?',
  '["Orange sign", "Red sign", "Green sign", "Blue sign"]'::jsonb,
  0, 'Road Signs', 'Temporary Signs',
  'Orange diamonds are for construction.'
),
(
  'Flagperson?',
  '["Human with flag", "Stop", "Yield", "Police"]'::jsonb,
  0, 'Road Signs', 'Temporary Signs',
  'Obey the flagperson.'
),
(
  'No U-Turn?',
  '["No Left", "No Right", "No U-Turn", "No Parking"]'::jsonb,
  2, 'Road Signs', 'Regulatory Signs',
  'U-turns prohibited.'
),
(
  'No Parking?',
  '["P with slash", "No Stopping", "Tow zone", "Loading"]'::jsonb,
  0, 'Road Signs', 'Regulatory Signs',
  'Parking prohibited.'
),
(
  'Keep Right?',
  '["Keep Left", "Keep Right", "Pass", "Turn"]'::jsonb,
  1, 'Road Signs', 'Regulatory Signs',
  'Obstacle ahead, stay right.'
),
(
  'Two Way Traffic?',
  '["Divided", "Two Way", "One Way", "Merge"]'::jsonb,
  1, 'Road Signs', 'Warning Signs',
  'Road carries traffic in both directions.'
),
(
  'Steep Hill?',
  '["Truck", "Hill", "Bump", "Dip"]'::jsonb,
  1, 'Road Signs', 'Warning Signs',
  'Use lower gear.'
),
(
  'Pavement Ends?',
  '["Gravel ahead", "Stop", "Dead End", "Bridge"]'::jsonb,
  0, 'Road Signs', 'Warning Signs',
  'Road surface changes.'
),
(
  'Trans-Canada Highway?',
  '["Maple Leaf", "Shield", "Circle", "Square"]'::jsonb,
  0, 'Road Signs', 'Information Signs',
  'Green sign with white maple leaf.'
),
(
  'Airport?',
  '["Plane", "Bus", "Train", "Taxi"]'::jsonb,
  0, 'Road Signs', 'Information Signs',
  'Icon of an airplane.'
),
(
  'Accessible Parking?',
  '["Wheelchair", "P", "Car", "Blue"]'::jsonb,
  0, 'Road Signs', 'Regulatory Signs',
  'Permit required.'
),
(
  'No Heavy Trucks?',
  '["Truck slash", "No Cars", "Weigh Station", "Route"]'::jsonb,
  0, 'Road Signs', 'Regulatory Signs',
  'Trucks prohibited.'
),
(
  'Passing Lane?',
  '["Dashed line", "Solid line", "Double line", "Yellow line"]'::jsonb,
  0, 'Road Signs', 'Pavement Markings',
  'Broken line permits passing.'
);
