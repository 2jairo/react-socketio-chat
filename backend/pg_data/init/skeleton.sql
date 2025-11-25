CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS groups (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    owner_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    members_length INT NOT NULL DEFAULT 0,
    is_general BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE group_join_uuids (
    group_id INT NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    join_uuid VARCHAR(50),
    PRIMARY KEY (group_id)
);

CREATE TABLE IF NOT EXISTS group_members (
    group_id INT NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    PRIMARY KEY (group_id, user_id)
);

CREATE TABLE messages (
    id SERIAL PRIMARY KEY,
    group_id INT NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ
);

CREATE TABLE message_reads(
    group_id INT NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    last_read_message_id INT REFERENCES messages(id) ON DELETE CASCADE,
    PRIMARY KEY (group_id, user_id)
);

CREATE TABLE message_attachments(
    id SERIAL PRIMARY KEY,
    message_id INT NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
    file_name VARCHAR(100) NOT NULL,
    file_url VARCHAR(100) NOT NULL,
    file_type VARCHAR(50) NOT NULL
);


CREATE OR REPLACE FUNCTION adjust_group_members_length()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE groups
        SET members_length = members_length + 1
        WHERE id = NEW.group_id;

        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE groups
        SET members_length = members_length - 1
        WHERE id = OLD.group_id;

        RETURN OLD;
    END IF;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_adjust_members_length
AFTER INSERT OR DELETE ON group_members
FOR EACH ROW
EXECUTE FUNCTION adjust_group_members_length();



CREATE OR REPLACE FUNCTION root_user_and_general_group(
    p_username TEXT,
    p_password TEXT,
    p_group_name TEXT
)
RETURNS TABLE (user_id INT, group_id INT) AS $$
BEGIN
    -- 1. Create user
    INSERT INTO users (username, password)
    VALUES (p_username, p_password)
    RETURNING id INTO user_id;

    -- 2. Create group
    INSERT INTO groups (name, owner_id, is_general)
    VALUES (p_group_name, user_id, TRUE)
    RETURNING id INTO group_id;

    -- 3. Add join_uuid to general
    INSERT INTO group_join_uuids (group_id, join_uuid) 
    VALUES (group_id, p_group_name);

    -- 4. Add user to the group
    INSERT INTO group_members (group_id, user_id)
    VALUES (group_id, user_id);

    -- 5. Add user to msgessage_reads
    INSERT INTO message_reads (group_id, user_id, last_read_message_id)
    VALUES (group_id, user_id, NULL);

    RETURN;
END;
$$ LANGUAGE plpgsql;

SELECT * FROM root_user_and_general_group(
    'root', 
    '$2a$10$UTwsHfJnToVIc0138DyTfuGYzVxUv5/.8k439.OM8bKvqp5sCcYXi', 
    'General'
);