USE justtap;

ALTER TABLE report_master
  ADD COLUMN client_logo_url VARCHAR(500) NULL AFTER bride_groom_photo_url;
