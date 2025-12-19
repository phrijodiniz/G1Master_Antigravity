-- Insert sample questions for 'Rules of the Road'
INSERT INTO public.questions (text, options, correct_index, category, chapter, explanation)
VALUES
(
  'What does a flashing red light mean?',
  '["Stop", "Slow down", "Yield", "Go"]'::jsonb,
  0,
  'Rules of the Road',
  'Traffic Lights',
  'A flashing red light means you must come to a complete stop. Move through the intersection only when it is safe to do so.'
),
(
  'When are you allowed to pass other vehicles on the right?',
  '["When the street is one-way", "When the vehicle turning left", "Both of the above", "Never"]'::jsonb,
  2,
  'Rules of the Road',
  'Passing',
  'You may pass on the right on multi-lane or one-way roads and when overtaking a vehicle making a left turn, provided there is room.'
),
(
  'A school bus with red signal lights flashing is stopped on a highway with no median strip. What does the law require you to do?',
  '["Slow down and pass with caution", "Stop at least 20 m away if approaching from behind", "Stop at least 20 m away, irrespective of direction", "Honk and pass"]'::jsonb,
  2,
  'Rules of the Road',
  'Sharing the Road',
  'You must stop at least 20 meters away if approaching from either direction on a road without a median.'
),
(
  'When getting out of your car on a highway, you should:',
  '["Exit from the driver side", "Exit from the passenger side", "Wait for traffic to clear", "Turn on 4-way flushers"]'::jsonb,
  1,
  'Rules of the Road',
  'Parking',
  'You should exit from the passenger side to avoid stepping into traffic.'
),
(
  'If you are involved in an accident in which someone is injured, you must:',
  '["Report the accident to the police immediately", "Report the accident within 24 hours", "Report only if damage exceeds $2000", "Exchange info and leave"]'::jsonb,
  0,
  'Rules of the Road',
  'Accidents',
  'All accidents involving injury must be reported to the police immediately.'
);

-- Insert sample questions for 'Road Signs'
INSERT INTO public.questions (text, options, correct_index, category, chapter, explanation)
VALUES
(
  'What does this sign mean? (Imagine a Stop Sign image)',
  '["Stop", "Yield", "Slow Down", "School Zone"]'::jsonb,
  0,
  'Road Signs',
  'Regulatory Signs',
  'A stop sign requires you to come to a complete stop.'
),
(
  'What does this sign mean? (Imagine a Yield Sign)',
  '["Stop", "Yield the right-of-way", "Merge", "Intersection ahead"]'::jsonb,
  1,
  'Road Signs',
  'Regulatory Signs',
  'A yield sign means you must let traffic in the intersection or close to it verify first.'
),
(
  'What does this sign mean? (Imagine a No Left Turn sign)',
  '["No U-turn", "No Left Turn", "No Right Turn", "No Parking"]'::jsonb,
  1,
  'Road Signs',
  'Regulatory Signs',
  'This sign indicates that left turns are prohibited.'
),
(
  'What does this sign mean? (Imagine a Maximum Speed 50 sign)',
  '["Minimum speed 50", "Recommended speed 50", "Maximum speed 50 km/h", "Route 50"]'::jsonb,
  2,
  'Road Signs',
  'Regulatory Signs',
  'This is a speed limit sign indicating the maximum legal speed.'
),
(
  'What does this sign mean? (Imagine a Deer Crossing sign)',
  '["Zoo ahead", "Deer crossing", "Hunting area", "Forest zone"]'::jsonb,
  1,
  'Road Signs',
  'Warning Signs',
  'This warning sign indicates that deer may cross the road in this area.'
);
