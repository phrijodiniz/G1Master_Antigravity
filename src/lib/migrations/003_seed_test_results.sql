-- Seed Road Signs Results (5 records)
INSERT INTO public.simulation_results (user_id, score, rules_score, signs_score, passed, test_type, created_at) VALUES 
('cfd438f7-dccf-489f-a5c4-5c9f9b7ef057', 90, 0, 18, true, 'Road Signs', now() - interval '1 day'),
('cfd438f7-dccf-489f-a5c4-5c9f9b7ef057', 85, 0, 17, true, 'Road Signs', now() - interval '2 days'),
('cfd438f7-dccf-489f-a5c4-5c9f9b7ef057', 50, 0, 10, false, 'Road Signs', now() - interval '3 days'),
('cfd438f7-dccf-489f-a5c4-5c9f9b7ef057', 100, 0, 20, true, 'Road Signs', now() - interval '4 days'),
('cfd438f7-dccf-489f-a5c4-5c9f9b7ef057', 75, 0, 15, false, 'Road Signs', now() - interval '5 days');

-- Seed Rules of the Road Results (5 records)
INSERT INTO public.simulation_results (user_id, score, rules_score, signs_score, passed, test_type, created_at) VALUES 
('cfd438f7-dccf-489f-a5c4-5c9f9b7ef057', 80, 16, 0, true, 'Rules of the Road', now() - interval '6 days'),
('cfd438f7-dccf-489f-a5c4-5c9f9b7ef057', 95, 19, 0, true, 'Rules of the Road', now() - interval '7 days'),
('cfd438f7-dccf-489f-a5c4-5c9f9b7ef057', 60, 12, 0, false, 'Rules of the Road', now() - interval '8 days'),
('cfd438f7-dccf-489f-a5c4-5c9f9b7ef057', 85, 17, 0, true, 'Rules of the Road', now() - interval '9 days'),
('cfd438f7-dccf-489f-a5c4-5c9f9b7ef057', 70, 14, 0, false, 'Rules of the Road', now() - interval '10 days');
