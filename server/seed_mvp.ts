
import { db } from "./db"; // Replit often prefers explicit relative imports
import { users } from "../shared/schema";
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function seedMVP() {
  console.log("🌱 Seeding MVP Users...");

  const usersList = [
    {
      email: "constantin@lackdoktor-partner.de",
      password: "123456_Constantin",
      role: "partner",
      partnerType: "franchise",
      commissionRate: 80,
      name: "Constantin Smart Repair"
    },
    {
      email: "adil@lackdoktor-partner.de",
      password: "123456_Adil",
      role: "partner",
      partnerType: "standard",
      commissionRate: 40,
      name: "Adil Partner"
    },
    {
      email: "lackdoktorbot@gmail.com",
      password: "123456_Partener",
      role: "partner",
      partnerType: "standard",
      commissionRate: 40,
      name: "Lackdoktor Bot (Test)"
    },
    {
      email: "svadrianapostol@gmail.com",
      password: "123456_Client",
      role: "client",
      partnerType: "standard",
      commissionRate: 0,
      name: "Adrian Apostol (Client)"
    }
  ];

  try {
      for (const u of usersList) {
        // Check if user exists (using findFirst safely)
        const existing = await db.query.users.findFirst({
            where: (users, { eq }) => eq(users.email, u.email)
        });

        if (existing) {
            console.log(`User ${u.email} already exists. Skipping.`);
            continue;
        }

        const hashedPassword = await hashPassword(u.password);
        
        await db.insert(users).values({
          email: u.email,
          password: hashedPassword,
          role: u.role,
          partnerType: u.partnerType,
          commissionRate: u.commissionRate,
          emailVerified: true,
          xp: 0,
          level: 1
        });
        
        console.log(`✅ Created user: ${u.name} (${u.role})`);
      }
      console.log("🏁 Seeding complete! You can now login.");
      process.exit(0);
  } catch (error) {
      console.error("Seed error details:", error);
      process.exit(1);
  }
}

seedMVP();
