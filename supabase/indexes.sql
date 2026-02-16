-- Indexes for optimal query performance

-- Stores indexes
CREATE INDEX idx_stores_store_code ON stores(store_code);
CREATE INDEX idx_stores_is_active ON stores(is_active);

-- Team members indexes
CREATE INDEX idx_team_members_store_id ON team_members(store_id);
CREATE INDEX idx_team_members_member_code ON team_members(member_code);
CREATE INDEX idx_team_members_pin_code ON team_members(pin_code);
CREATE INDEX idx_team_members_role ON team_members(role);
CREATE INDEX idx_team_members_is_active ON team_members(is_active);

-- Sessions indexes
CREATE INDEX idx_sessions_store_id ON sessions(store_id);
CREATE INDEX idx_sessions_team_member_id ON sessions(team_member_id);
CREATE INDEX idx_sessions_tag_barcode ON sessions(tag_barcode);
CREATE INDEX idx_sessions_status ON sessions(status);
CREATE INDEX idx_sessions_entry_time ON sessions(entry_time);
CREATE INDEX idx_sessions_store_status ON sessions(store_id, status);
CREATE INDEX idx_sessions_store_entry_time ON sessions(store_id, entry_time);

-- Session items indexes
CREATE INDEX idx_session_items_session_id ON session_items(session_id);
CREATE INDEX idx_session_items_item_barcode ON session_items(item_barcode);
CREATE INDEX idx_session_items_status ON session_items(status);

-- Back of house indexes
CREATE INDEX idx_back_of_house_store_id ON back_of_house(store_id);
CREATE INDEX idx_back_of_house_session_id ON back_of_house(session_id);
CREATE INDEX idx_back_of_house_status ON back_of_house(status);
CREATE INDEX idx_back_of_house_store_status ON back_of_house(store_id, status);
CREATE INDEX idx_back_of_house_received_at ON back_of_house(received_at);

-- Shrinkage log indexes
CREATE INDEX idx_shrinkage_log_store_id ON shrinkage_log(store_id);
CREATE INDEX idx_shrinkage_log_session_id ON shrinkage_log(session_id);
CREATE INDEX idx_shrinkage_log_status ON shrinkage_log(status);
CREATE INDEX idx_shrinkage_log_lost_at ON shrinkage_log(lost_at);
CREATE INDEX idx_shrinkage_log_store_lost_at ON shrinkage_log(store_id, lost_at);
