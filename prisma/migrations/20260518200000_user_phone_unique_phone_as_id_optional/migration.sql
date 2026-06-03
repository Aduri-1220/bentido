-- Unique mobile for lookups; email/password users use this value as primary key (`User.id`) at signup.
CREATE UNIQUE INDEX "User_phone_key" ON "User" ("phone");
