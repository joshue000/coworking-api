-- Backfill client_name from the email local part (before @) for rows that are null
UPDATE "reservations"
SET "client_name" = initcap(replace(split_part("client_email", '@', 1), '.', ' '))
WHERE "client_name" IS NULL;
