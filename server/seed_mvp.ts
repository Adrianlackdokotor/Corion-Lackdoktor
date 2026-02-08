
import { db } from "./db";
import { users } from "@shared/schema";
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
      partnerType: "franchise", // 80%
      commissionRate: 80,
      name: "Constantin Smart Repair"
    },
    {
      email: "adil@lackdoktor-partner.de",
      password: "123456_Adil",
      role: "partner",
      partnerType: "standard", // 40%
      commissionRate: 40,
      name: "Adil Partner"
    },
    {
      email: "lackdoktorbot@gmail.com",
      password: "123456_Partener",
      role: "partner",
      partnerType: "standard", // 40%
      commissionRate: 40,
      name: "Lackdoktor Bot (Test)"
    },
    {
      email: "svadrianapostol@gmail.com",
      password: "123456_Client",
      role: "client",
      partnerType: "standard", // Client standard
      commissionRate: 0,
      name: "Adrian Apostol (Client)"
    }
  ];

  for (const u of usersList) {
    // Verificăm dacă există deja
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
}

seedMVP().catch((err) => {
  console.error("Error seeding:", err);
  process.exit(1);
});
