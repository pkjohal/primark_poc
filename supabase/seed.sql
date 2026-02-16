-- Seed data for testing

-- Insert test stores
INSERT INTO stores (id, store_code, store_name, location, is_active) VALUES
  ('a1b2c3d4-e5f6-4a5b-8c7d-9e0f1a2b3c4d', 'MAN001', 'Primark Manchester Arndale', 'Manchester', true),
  ('b2c3d4e5-f6a7-5b6c-9d8e-0f1a2b3c4d5e', 'LON001', 'Primark London Oxford Street', 'London', true),
  ('c3d4e5f6-a7b8-6c7d-0e9f-1a2b3c4d5e6f', 'BIR001', 'Primark Birmingham High Street', 'Birmingham', true);

-- Insert test team members
-- Manchester team
INSERT INTO team_members (id, store_id, member_code, full_name, pin_code, role, is_active) VALUES
  ('d4e5f6a7-b8c9-7d8e-1f0a-2b3c4d5e6f7a', 'a1b2c3d4-e5f6-4a5b-8c7d-9e0f1a2b3c4d', 'MAN-SK', 'Sarah K', '1234', 'team_member', true),
  ('e5f6a7b8-c9d0-8e9f-2a1b-3c4d5e6f7a8b', 'a1b2c3d4-e5f6-4a5b-8c7d-9e0f1a2b3c4d', 'MAN-TB', 'Tom B', '5678', 'manager', true),
  ('f6a7b8c9-d0e1-9f0a-3b2c-4d5e6f7a8b9c', 'a1b2c3d4-e5f6-4a5b-8c7d-9e0f1a2b3c4d', 'MAN-JL', 'Jenna L', '9012', 'team_member', true);

-- London team
INSERT INTO team_members (id, store_id, member_code, full_name, pin_code, role, is_active) VALUES
  ('a7b8c9d0-e1f2-0a1b-4c3d-5e6f7a8b9c0d', 'b2c3d4e5-f6a7-5b6c-9d8e-0f1a2b3c4d5e', 'LON-DM', 'Dan M', '5678', 'admin', true),
  ('b8c9d0e1-f2a3-1b2c-5d4e-6f7a8b9c0d1e', 'b2c3d4e5-f6a7-5b6c-9d8e-0f1a2b3c4d5e', 'LON-ER', 'Emma R', '3456', 'team_member', true);

-- Birmingham team
INSERT INTO team_members (id, store_id, member_code, full_name, pin_code, role, is_active) VALUES
  ('c9d0e1f2-a3b4-2c3d-6e5f-7a8b9c0d1e2f', 'c3d4e5f6-a7b8-6c7d-0e9f-1a2b3c4d5e6f', 'BIR-MH', 'Mike H', '7890', 'manager', true);

-- Insert sample session data (Manchester store - completed session from yesterday)
INSERT INTO sessions (id, store_id, team_member_id, tag_barcode, status, total_items_in, total_items_out, items_purchased, items_restocked, items_lost, entry_time, exit_start_time, exit_complete_time) VALUES
  ('11111111-1111-1111-1111-111111111111', 'a1b2c3d4-e5f6-4a5b-8c7d-9e0f1a2b3c4d', 'd4e5f6a7-b8c9-7d8e-1f0a-2b3c4d5e6f7a', 'TAG001', 'complete', 5, 5, 3, 2, 0, NOW() - INTERVAL '1 day' - INTERVAL '2 hours', NOW() - INTERVAL '1 day' - INTERVAL '1.5 hours', NOW() - INTERVAL '1 day' - INTERVAL '1 hour');

-- Insert sample session items for the completed session
INSERT INTO session_items (id, session_id, item_barcode, status, scanned_in_at, resolved_at) VALUES
  ('22222222-2222-2222-2222-222222222221', '11111111-1111-1111-1111-111111111111', '5012345678901', 'purchased', NOW() - INTERVAL '1 day' - INTERVAL '2 hours', NOW() - INTERVAL '1 day' - INTERVAL '1 hour'),
  ('22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', '5012345678902', 'purchased', NOW() - INTERVAL '1 day' - INTERVAL '2 hours', NOW() - INTERVAL '1 day' - INTERVAL '1 hour'),
  ('22222222-2222-2222-2222-222222222223', '11111111-1111-1111-1111-111111111111', '5012345678903', 'purchased', NOW() - INTERVAL '1 day' - INTERVAL '2 hours', NOW() - INTERVAL '1 day' - INTERVAL '1 hour'),
  ('22222222-2222-2222-2222-222222222224', '11111111-1111-1111-1111-111111111111', '5012345678904', 'restocked', NOW() - INTERVAL '1 day' - INTERVAL '2 hours', NOW() - INTERVAL '1 day' - INTERVAL '1 hour'),
  ('22222222-2222-2222-2222-222222222225', '11111111-1111-1111-1111-111111111111', '5012345678905', 'restocked', NOW() - INTERVAL '1 day' - INTERVAL '2 hours', NOW() - INTERVAL '1 day' - INTERVAL '1 hour');

-- Insert a flagged session with lost item
INSERT INTO sessions (id, store_id, team_member_id, tag_barcode, status, total_items_in, total_items_out, items_purchased, items_restocked, items_lost, entry_time, exit_start_time, exit_complete_time) VALUES
  ('33333333-3333-3333-3333-333333333333', 'a1b2c3d4-e5f6-4a5b-8c7d-9e0f1a2b3c4d', 'f6a7b8c9-d0e1-9f0a-3b2c-4d5e6f7a8b9c', 'TAG002', 'flagged', 3, 2, 1, 1, 1, NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days' + INTERVAL '30 minutes', NOW() - INTERVAL '2 days' + INTERVAL '45 minutes');

-- Insert session items for flagged session
INSERT INTO session_items (id, session_id, item_barcode, status, scanned_in_at, resolved_at) VALUES
  ('44444444-4444-4444-4444-444444444441', '33333333-3333-3333-3333-333333333333', '5012345678906', 'purchased', NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days' + INTERVAL '45 minutes'),
  ('44444444-4444-4444-4444-444444444442', '33333333-3333-3333-3333-333333333333', '5012345678907', 'restocked', NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days' + INTERVAL '45 minutes'),
  ('44444444-4444-4444-4444-444444444443', '33333333-3333-3333-3333-333333333333', '5012345678908', 'lost', NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days' + INTERVAL '45 minutes');

-- Insert shrinkage log entry
INSERT INTO shrinkage_log (id, store_id, session_id, item_barcode, team_member_id, status, lost_at, notes) VALUES
  ('55555555-5555-5555-5555-555555555551', 'a1b2c3d4-e5f6-4a5b-8c7d-9e0f1a2b3c4d', '33333333-3333-3333-3333-333333333333', '5012345678908', 'f6a7b8c9-d0e1-9f0a-3b2c-4d5e6f7a8b9c', 'lost', NOW() - INTERVAL '2 days' + INTERVAL '45 minutes', 'Customer left without returning item');

-- Insert sample back-of-house items with different wait times
INSERT INTO back_of_house (id, store_id, session_id, item_barcode, team_member_id, status, received_at) VALUES
  -- Recent item (< 30 min)
  ('66666666-6666-6666-6666-666666666661', 'a1b2c3d4-e5f6-4a5b-8c7d-9e0f1a2b3c4d', '11111111-1111-1111-1111-111111111111', '5012345678909', 'd4e5f6a7-b8c9-7d8e-1f0a-2b3c4d5e6f7a', 'awaiting_return', NOW() - INTERVAL '15 minutes'),
  -- Medium wait (30-60 min)
  ('66666666-6666-6666-6666-666666666662', 'a1b2c3d4-e5f6-4a5b-8c7d-9e0f1a2b3c4d', '11111111-1111-1111-1111-111111111111', '5012345678910', 'd4e5f6a7-b8c9-7d8e-1f0a-2b3c4d5e6f7a', 'awaiting_return', NOW() - INTERVAL '45 minutes'),
  -- Long wait (> 60 min)
  ('66666666-6666-6666-6666-666666666663', 'a1b2c3d4-e5f6-4a5b-8c7d-9e0f1a2b3c4d', '11111111-1111-1111-1111-111111111111', '5012345678911', 'd4e5f6a7-b8c9-7d8e-1f0a-2b3c4d5e6f7a', 'awaiting_return', NOW() - INTERVAL '90 minutes');
