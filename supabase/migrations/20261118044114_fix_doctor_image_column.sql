/*
# Fix crop_doctor_queries image column

The app stores the compressed leaf image as a data URL in the local `image`
field, but the remote table only had `image_url`. Add a matching `image` text
column so sync upserts succeed (PGRST204 was thrown because `image` was not in
the schema cache). Then reload the PostgREST schema cache.
*/

ALTER TABLE crop_doctor_queries
  ADD COLUMN IF NOT EXISTS image text;

NOTIFY pgrst, 'reload schema';